import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Download,
  Edit3,
  Eye,
  FileImage,
  Image as ImageIcon,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import type { StoreImage } from '@/types';
import { formatFileSize, getImageUrl } from '@/utils';
import { FILE_UPLOAD } from '@constants';
import { apiService } from '@services/api';
import { log } from '@utils/logger';

import {
  Badge,
  Button,
  Input,
  Modal
} from '@components/ui';

const updateImageSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string(),
  order_index: yup.number().min(0, 'Order index must be 0 or greater'),
  is_active: yup.boolean().required(),
});

interface UpdateImageForm {
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
}

const ImagesPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<StoreImage | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadMetadata, setUploadMetadata] = useState({
    title: '',
    description: ''
  });
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<UpdateImageForm>({
    resolver: yupResolver(updateImageSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      order_index: 0,
      is_active: true,
    },
  });

  // Fetch images query
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['store-images'],
    queryFn: () => apiService.getStoreImages().then(res => res.data),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => apiService.uploadStoreImage(formData),
    onSuccess: () => {
      log.ui.userAction('image-uploaded');
      queryClient.invalidateQueries({ queryKey: ['store-images'] });
      resetUploadForm();
      setIsUploadModalOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreImage> }) => 
      apiService.updateStoreImage(id, data),
    onSuccess: () => {
      log.ui.userAction('image-updated');
      queryClient.invalidateQueries({ queryKey: ['store-images'] });
      setIsEditModalOpen(false);
      reset();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteStoreImage(id),
    onSuccess: () => {
      log.ui.userAction('image-deleted');
      queryClient.invalidateQueries({ queryKey: ['store-images'] });
    },
  });

  // Drag and drop functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as typeof FILE_UPLOAD.ALLOWED_TYPES[number]);
      const isValidSize = file.size <= FILE_UPLOAD.MAX_SIZE;
      
      if (!isValidType) {
        log.ui.userAction('file-upload-error', { 
          error: 'Invalid file type', 
          fileName: file.name, 
          fileType: file.type 
        });
      }
      
      if (!isValidSize) {
        log.ui.userAction('file-upload-error', { 
          error: 'File too large', 
          fileName: file.name, 
          fileSize: file.size 
        });
      }
      
      return isValidType && isValidSize;
    });

    setUploadFiles(prev => [...prev, ...validFiles]);
    log.ui.userAction('files-selected', { count: validFiles.length });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': FILE_UPLOAD.ALLOWED_EXTENSIONS,
    },
    maxSize: FILE_UPLOAD.MAX_SIZE,
    multiple: true,
  });

  const handleViewImage = (image: StoreImage) => {
    log.ui.userAction('view-image', { imageId: image.id });
    setSelectedImage(image);
    setIsViewModalOpen(true);
  };

  const handleEditImage = (image: StoreImage) => {
    log.ui.userAction('edit-image-open', { imageId: image.id });
    setSelectedImage(image);
    reset({
      title: image.title,
      description: image.description || '',
      order_index: image.order_index,
      is_active: image.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteImage = async (image: StoreImage) => {
    if (!confirm(`Are you sure you want to delete "${image.title}"?`)) return;
    
    log.ui.userAction('delete-image', { imageId: image.id });
    deleteMutation.mutate(image.id);
  };

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) return;

    log.ui.userAction('upload-images-start', { count: uploadFiles.length });

    for (const file of uploadFiles) {
      let uploadSuccess = false;
      let lastError: any = null;

      // Try different field names if the primary one fails
      for (const fieldName of FILE_UPLOAD.FIELD_NAMES) {
        const formData = new FormData();
        formData.append(fieldName, file);
        formData.append('title', uploadMetadata.title || file.name.replace(/\.[^/.]+$/, '')); // Use filename without extension as fallback
        formData.append('description', uploadMetadata.description || `Image: ${file.name}`);

        try {
          await uploadMutation.mutateAsync(formData);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          uploadSuccess = true;
          log.ui.userAction('upload-success', { fileName: file.name, fieldName });
          break; // Success, no need to try other field names
        } catch (error: any) {
          lastError = error;
          log.ui.userAction('upload-field-try', { fileName: file.name, fieldName, error: error.message });
          
          // If it's not a field name error, don't try other field names
          if (!error.message?.includes('Unexpected file field')) {
            break;
          }
        }
      }

      if (!uploadSuccess) {
        log.ui.userAction('upload-error', { fileName: file.name, error: lastError });
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    log.ui.userAction('remove-upload-file', { index });
  };

  const resetUploadForm = () => {
    setUploadFiles([]);
    setUploadProgress({});
    setUploadMetadata({
      title: '',
      description: ''
    });
  };

  const onUpdateImage = async (data: UpdateImageForm) => {
    if (!selectedImage) return;
    
    log.form.submit('UpdateImageForm', { 
      imageId: selectedImage.id, 
      title: data.title,
      orderIndex: data.order_index,
      isActive: data.is_active
    });
    
    updateMutation.mutate({ 
      id: selectedImage.id, 
      data: {
        title: data.title,
        description: data.description,
        order_index: data.order_index,
        is_active: data.is_active,
      }
    });
  };



  useEffect(() => {
    log.ui.componentMount('ImagesPage');
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Store Images</h1>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <p className="text-red-800">Error loading images. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Images</h1>
            <p className="text-gray-600 mt-2">
              Manage your store gallery and images.
            </p>
          </div>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            icon={<Upload className="h-4 w-4" />}
          >
            Upload Images
          </Button>
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Loading images...</span>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
            <p className="text-gray-500 mb-6">Upload your first store image to get started</p>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              Upload Images
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={getImageUrl(image.url)}
                    alt={image.title || image.description}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleViewImage(image)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="flex items-center justify-center w-full h-full text-gray-400">
                          <div class="text-center">
                            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p class="text-sm">Image not available</p>
                          </div>
                        </div>
                      `;
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="info" size="sm">
                      Order: {image.order_index}
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant={image.is_active ? 'success' : 'secondary'} size="sm">
                      {image.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">
                    {image.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {image.width} × {image.height}
                  </p>
                  {image.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {image.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 mt-2 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Uploaded by: {image.uploader.name}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewImage(image)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditImage(image)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getImageUrl(image.url), '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteImage(image)}
                      loading={deleteMutation.isPending}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          resetUploadForm();
        }}
        title="Upload Store Images"
        description="Upload multiple images to your store gallery"
        size="lg"
      >
        <div className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`mx-auto h-12 w-12 mb-4 ${
              isDragActive ? 'text-primary-500' : 'text-gray-400'
            }`} />
            {isDragActive ? (
              <p className="text-primary-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop images here, or <span className="text-primary-600 font-medium">browse</span>
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: {FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')} 
                  (max {formatFileSize(FILE_UPLOAD.MAX_SIZE)})
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Selected Files ({uploadFiles.length})</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileImage className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadProgress[file.name] === 100 && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadProgress[file.name] === -1 && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Metadata Form */}
          {uploadFiles.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900">Upload Details</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="upload-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <Input
                    id="upload-title"
                    type="text"
                    placeholder="Enter image title"
                    value={uploadMetadata.title}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use filename as title
                  </p>
                </div>
                <div>
                  <label htmlFor="upload-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="upload-description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter image description"
                    value={uploadMetadata.description}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default description
                  </p>
                </div>

              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadFiles}
              loading={uploadMutation.isPending}
              disabled={uploadFiles.length === 0}
            >
              Upload {uploadFiles.length} File{uploadFiles.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Image Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedImage?.title || 'Image'}
        size="full"
      >
        {selectedImage && (
          <div className="space-y-4">
            <div className="flex justify-center bg-gray-100 rounded-lg p-4">
              <img
                src={getImageUrl(selectedImage.url)}
                alt={selectedImage.title || selectedImage.description}
                className="max-h-96 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="flex items-center justify-center w-full h-full text-gray-400">
                      <div class="text-center">
                        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p class="text-lg font-medium">Image not available</p>
                        <p class="text-sm text-gray-500 mt-1">The image file could not be loaded</p>
                      </div>
                    </div>
                  `;
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Title:</span>
                <p className="text-gray-600">{selectedImage.title}</p>
              </div>
              <div>
                <span className="font-medium">Filename:</span>
                <p className="text-gray-600">{selectedImage.filename}</p>
              </div>
              <div>
                <span className="font-medium">Dimensions:</span>
                <p className="text-gray-600">{selectedImage.width} × {selectedImage.height}</p>
              </div>
              <div>
                <span className="font-medium">File Size:</span>
                <p className="text-gray-600">{formatFileSize(selectedImage.file_size)}</p>
              </div>
              <div>
                <span className="font-medium">Format:</span>
                <p className="text-gray-600">{selectedImage.format.toUpperCase()}</p>
              </div>
              <div>
                <span className="font-medium">Order Index:</span>
                <p className="text-gray-600">{selectedImage.order_index}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p className="text-gray-600">{selectedImage.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <span className="font-medium">Uploader:</span>
                <p className="text-gray-600">{selectedImage.uploader.name} ({selectedImage.uploader.username})</p>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-gray-600">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium">Updated:</span>
                <p className="text-gray-600">{new Date(selectedImage.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {selectedImage.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-gray-600 mt-1">{selectedImage.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Image Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Image"
        description="Update image details and settings"
        size="md"
      >
        <form onSubmit={handleSubmit(onUpdateImage as any)} className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter image title..."
            {...control.register?.('title')}
          />

          <Input
            label="Description"
            placeholder="Enter image description..."
            {...control.register?.('description')}
          />

          <Input
            label="Order Index"
            type="number"
            placeholder="Enter order index..."
            {...control.register?.('order_index')}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              {...control.register?.('is_active')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updateMutation.isPending}
            >
              Update Image
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ImagesPage;
