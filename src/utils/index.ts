import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Utility function for combining class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date formatting utilities
export const formatDate = (date: string | Date, formatString: string = 'PPP') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
};

export const formatRelativeTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Currency formatting
export const formatCurrency = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Phone number formatting
export const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Indian mobile numbers
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const number = cleaned.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  
  return phone;
};

// Order status badge colors
export const getOrderStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// User role badge colors
export const getUserRoleColor = (role: string) => {
  const colors = {
    customer: 'bg-blue-100 text-blue-800',
    admin: 'bg-purple-100 text-purple-800',
    super_admin: 'bg-red-100 text-red-800',
  };
  
  return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// File size formatting
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Truncate text
export const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Generate random color for avatars
export const generateAvatarColor = (name: string) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Construct full image URL
export const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get the API base URL with fallbacks
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.groshly.com');
  
  // If it starts with /, it's a relative path, prepend the API base URL
  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  // Otherwise, assume it's a relative path and prepend the API base URL
  return `${baseUrl}/${imagePath}`;
};

// Handle Supabase storage URLs with proper encoding
export const getSupabaseImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  
  // If it's already a full URL, handle Supabase storage URLs
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // For Supabase storage URLs, proxy through backend to avoid CORS issues
    if (imagePath.includes('supabase.co/storage')) {
      try {
        // Extract the storage path from the Supabase URL
        const url = new URL(imagePath);
        const pathParts = url.pathname.split('/');
        
        // Find the storage path (everything after /storage/v1/object/public/)
        const storageIndex = pathParts.findIndex(part => part === 'public');
        if (storageIndex !== -1 && storageIndex < pathParts.length - 1) {
          const storagePath = pathParts.slice(storageIndex + 1).join('/');
          
          // The bucket name is the first part of the storage path
          const storagePathParts = storagePath.split('/');
          const bucketName = storagePathParts[0]; // First part is the bucket name
          const filePath = storagePathParts.slice(1).join('/'); // Rest is the file path
          
          // Debug: Log the path structure
          console.log('🔧 [getSupabaseImageUrl] Path analysis:', {
            pathParts,
            storageIndex,
            bucketName,
            storagePath,
            filePath
          });
          
          // Use backend proxy endpoint - always use Railway URL for production
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.groshly.com';
          
          console.log('🔧 [getSupabaseImageUrl] Processing URL:', {
            original: imagePath,
            bucketName,
            storagePath,
            baseUrl,
            finalUrl: `${baseUrl}/api/proxy/supabase-storage/${bucketName}/${encodeURIComponent(storagePath)}`
          });
          
          return `${baseUrl}/api/proxy/supabase-storage/${bucketName}/${encodeURIComponent(filePath)}`;
        }
        
        // Fallback to original URL if we can't parse it
        console.warn('Could not parse Supabase URL structure:', imagePath);
        return imagePath;
      } catch (error) {
        console.warn('Error processing Supabase URL:', error);
        return imagePath;
      }
    }
    return imagePath;
  }
  
  // For relative paths, use the regular getImageUrl function
  return getImageUrl(imagePath);
};

// Get initials from name
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Validate email
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
export const isValidPhoneNumber = (phone: string) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned);
};

// Copy to clipboard
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Download file
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Bulk items parsing utilities
// Removed bulkItemsParser - no longer needed


