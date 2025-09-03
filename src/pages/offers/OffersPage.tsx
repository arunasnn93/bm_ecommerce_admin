import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Edit,
  Eye,
  Plus,
  Tag,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import type { CreateOfferForm, Offer, OfferFilters } from '@/types';
import { formatDate } from '@/utils';
import { DEFAULTS } from '@constants';
import { apiService } from '@services/api';
import { log } from '@utils/logger';

import { FormField, SearchInput } from '@components/forms';
import {
  Badge,
  Button,
  Modal,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@components/ui';

const createOfferSchema = yup.object({
  offer_heading: yup
    .string()
    .required('Offer heading is required')
    .min(3, 'Offer heading must be at least 3 characters')
    .max(100, 'Offer heading must be less than 100 characters'),
  offer_description: yup
    .string()
    .required('Offer description is required')
    .min(10, 'Offer description must be at least 10 characters')
    .max(500, 'Offer description must be less than 500 characters'),
  image: yup
    .mixed()
    .required('Image is required')
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      console.log('🔍 [Validation] File size check - value:', value, 'type:', typeof value, 'isFile:', value instanceof File);
      if (!value) return true; // Let required validation handle empty case
      if (!(value instanceof File)) return false;
      const isValid = value.size <= 5 * 1024 * 1024;
      console.log('🔍 [Validation] File size:', value.size, 'bytes, isValid:', isValid);
      return isValid;
    })
    .test('fileType', 'Only image files are allowed', (value) => {
      console.log('🔍 [Validation] File type check - value:', value, 'type:', typeof value, 'isFile:', value instanceof File);
      if (!value) return true; // Let required validation handle empty case
      if (!(value instanceof File)) return false;
      const isValid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(value.type);
      console.log('🔍 [Validation] File type:', value.type, 'isValid:', isValid);
      return isValid;
    }),
});

const OffersPage: React.FC = () => {
  const [filters, setFilters] = useState<OfferFilters>(DEFAULTS.OFFER_FILTERS || { page: 1, limit: 10 });
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; filename: string } | null>(null);
  const queryClient = useQueryClient();

  const { control: createControl, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors }, setValue: setCreateValue } = useForm<CreateOfferForm>({
    resolver: yupResolver(createOfferSchema) as any,
    mode: 'onChange',
  });

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors }, setValue: setEditValue } = useForm<CreateOfferForm>({
    resolver: yupResolver(createOfferSchema) as any,
    mode: 'onChange',
  });

  // Fetch offers query
  const { data: offersData, isLoading, error } = useQuery({
    queryKey: ['offers', filters],
    queryFn: async () => {
      console.log('🔍 [OffersPage] Fetching offers with filters:', filters);
      try {
        const response = await apiService.getOffers(filters);
        console.log('✅ [OffersPage] Offers API response:', response);
        return response;
      } catch (error) {
        console.error('❌ [OffersPage] Error fetching offers:', error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
  });

  // Create offer mutation
  const createOfferMutation = useMutation({
    mutationFn: (data: FormData) => apiService.createOffer(data),
    onSuccess: () => {
      log.ui.userAction('offer-created');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setIsCreateModalOpen(false);
      resetCreate();
    },
    onError: (error) => {
      console.error('❌ [OffersPage] Error creating offer:', error);
      log.ui.userAction('offer-creation-failed', { error: error.message });
    },
  });

  // Update offer mutation
  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => 
      apiService.updateOffer(id, data),
    onSuccess: () => {
      log.ui.userAction('offer-updated');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setIsEditModalOpen(false);
      resetEdit();
    },
  });

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteOffer(id),
    onSuccess: () => {
      log.ui.userAction('offer-deleted');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  // Toggle offer status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => apiService.toggleOfferStatus(id),
    onSuccess: () => {
      log.ui.userAction('offer-status-toggled');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const handleSearch = (search: string) => {
    log.ui.userAction('offers-search', { query: search });
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof OfferFilters, value: unknown) => {
    log.ui.userAction('offers-filter-change', { key, value });
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCreateOffer = () => {
    log.ui.userAction('create-offer-open');
    setIsCreateModalOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    log.ui.userAction('edit-offer-open', { offerId: offer.id });
    setSelectedOffer(offer);
    resetEdit({
      offer_heading: offer.offer_heading,
      offer_description: offer.offer_description,
      image: undefined,
    });
    setIsEditModalOpen(true);
  };

  const handleViewOffer = (offer: Offer) => {
    log.ui.userAction('view-offer', { offerId: offer.id });
    setSelectedOffer(offer);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteOffer = (offer: Offer) => {
    if (window.confirm(`Are you sure you want to delete the offer "${offer.offer_heading}"?`)) {
      log.ui.userAction('delete-offer', { offerId: offer.id });
      deleteOfferMutation.mutate(offer.id);
    }
  };

  const handleToggleStatus = (offer: Offer) => {
    log.ui.userAction('toggle-offer-status', { offerId: offer.id, currentStatus: offer.is_active });
    toggleStatusMutation.mutate(offer.id);
  };

  const handleViewImage = (imageUrl: string, filename: string) => {
    log.ui.userAction('view-offer-image', { filename });
    setSelectedImage({ url: imageUrl, filename });
  };

  const onCreateOffer = async (data: CreateOfferForm) => {
    log.form.submit('CreateOfferForm', { offerHeading: data.offer_heading });
    
    console.log('📝 [OffersPage] Creating offer with data:', data);
    
    const formData = new FormData();
    formData.append('offer_heading', data.offer_heading);
    formData.append('offer_description', data.offer_description);
    formData.append('image', data.image);
    
    // Log FormData contents for debugging
    console.log('📝 [OffersPage] FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    createOfferMutation.mutate(formData);
  };

  const onEditOffer = async (data: CreateOfferForm) => {
    if (!selectedOffer) return;
    
    log.form.submit('EditOfferForm', { offerId: selectedOffer.id, offerHeading: data.offer_heading });
    
    const formData = new FormData();
    formData.append('offer_heading', data.offer_heading);
    formData.append('offer_description', data.offer_description);
    if (data.image) {
      formData.append('image', data.image);
    }
    
    updateOfferMutation.mutate({ id: selectedOffer.id, data: formData });
  };

  useEffect(() => {
    log.ui.componentMount('OffersPage');
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Store Offers</h1>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <p className="text-red-800">Error loading offers. Please try again.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Store Offers</h1>
            <p className="text-gray-600 mt-2">
              Manage store offers and promotions.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Total Offers: {offersData?.meta?.pagination?.totalItems || 0}
            </div>
            <Button
              onClick={handleCreateOffer}
              icon={<Plus className="h-4 w-4" />}
            >
              Create Offer
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            placeholder="Search offers..."
            onSearch={handleSearch}
            initialValue={filters.search || ''}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
              onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort || ''}
              onChange={(e) => handleFilterChange('sort', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Heading</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-2">Loading offers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : offersData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-gray-500">
                    <Tag className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No offers found</p>
                    <p className="text-sm mt-2">Create your first offer to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              offersData?.data.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:opacity-75"
                         onClick={() => handleViewImage(offer.image_url, offer.offer_heading)}>
                      <img
                        src={offer.image_url}
                        alt={offer.offer_heading}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{offer.offer_heading}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {offer.offer_description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {offer.store?.name || 'Unknown Store'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={offer.is_active ? 'success' : 'secondary'}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(offer.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOffer(offer)}
                        icon={<Eye className="h-3 w-3" />}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditOffer(offer)}
                        icon={<Edit className="h-3 w-3" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(offer)}
                        loading={toggleStatusMutation.isPending}
                      >
                        {offer.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer)}
                        icon={<Trash2 className="h-3 w-3" />}
                        loading={deleteOfferMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {offersData && offersData.meta?.pagination && offersData.meta.pagination.totalPages > 1 && (
          <Pagination
            currentPage={offersData.meta.pagination.currentPage || 1}
            totalPages={offersData.meta.pagination.totalPages || 1}
            totalItems={offersData.meta.pagination.totalItems || 0}
            itemsPerPage={offersData.meta.pagination.itemsPerPage || 10}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Create Offer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Offer"
        description="Create a new store offer with image"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit(onCreateOffer)} className="space-y-4">
          <FormField
            name="offer_heading"
            control={createControl}
            label="Offer Heading"
            placeholder="Enter offer heading..."
            helperText="This will be the main title of your offer"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Description
            </label>
            <textarea
              {...createControl.register?.('offer_description')}
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                createErrors.offer_description 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
              placeholder="Enter offer description..."
              rows={3}
            />
            {createErrors.offer_description ? (
              <p className="text-xs text-red-500 mt-1">{createErrors.offer_description.message}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Describe the details of your offer</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                console.log('📁 [File Input] Selected file:', file);
                if (file) {
                  setCreateValue('image', file);
                }
              }}
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                createErrors.image 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
            />
            {createErrors.image ? (
              <p className="text-xs text-red-500 mt-1">{createErrors.image.message}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, WebP. Max size: 5MB
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createOfferMutation.isPending}
            >
              Create Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Offer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Offer"
        description="Update offer details"
        size="lg"
      >
        <form onSubmit={handleEditSubmit(onEditOffer)} className="space-y-4">
          <FormField
            name="offer_heading"
            control={editControl}
            label="Offer Heading"
            placeholder="Enter offer heading..."
            helperText="This will be the main title of your offer"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Description
            </label>
            <textarea
              {...editControl.register?.('offer_description')}
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                editErrors.offer_description 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
              placeholder="Enter offer description..."
              rows={3}
            />
            {editErrors.offer_description ? (
              <p className="text-xs text-red-500 mt-1">{editErrors.offer_description.message}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Describe the details of your offer</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                console.log('📁 [Edit File Input] Selected file:', file);
                if (file) {
                  setEditValue('image', file);
                }
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to keep current image. Supported formats: JPG, PNG, WebP. Max size: 5MB
            </p>
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
              loading={updateOfferMutation.isPending}
            >
              Update Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Offer Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Offer: ${selectedOffer?.offer_heading}`}
        size="lg"
      >
        {selectedOffer && (
          <div className="space-y-6">
            {/* Offer Image */}
            <div className="text-center">
              <img
                src={selectedOffer.image_url}
                alt={selectedOffer.offer_heading}
                className="max-w-full max-h-64 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleViewImage(selectedOffer.image_url, selectedOffer.offer_heading)}
              />
            </div>

            {/* Offer Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Offer Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Heading:</span>
                    <span className="ml-2">{selectedOffer.offer_heading}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="mt-1 text-gray-600">{selectedOffer.offer_description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2">
                      <Badge variant={selectedOffer.is_active ? 'success' : 'secondary'}>
                        {selectedOffer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Store:</span>
                    <span className="ml-2">{selectedOffer.store?.name || 'Unknown Store'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2">{formatDate(selectedOffer.created_at)}</span>
                  </div>
                  {selectedOffer.creator && (
                    <div>
                      <span className="font-medium text-gray-700">Created by:</span>
                      <span className="ml-2">{selectedOffer.creator.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Image View Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={`Offer Image - ${selectedImage?.filename}`}
        size="xl"
      >
        {selectedImage && (
          <div className="text-center">
            <img
              src={selectedImage.url}
              alt={selectedImage.filename}
              className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200"
            />
            <div className="mt-4 flex justify-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(selectedImage.url, '_blank')}
              >
                Open in New Tab
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedImage(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OffersPage;
