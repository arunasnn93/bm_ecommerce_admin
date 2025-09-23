// User Types
export interface AssignedStore {
  store_id: string;
  store_name: string;
  assigned_at: string;
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  mobile?: string;
  role: 'customer' | 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  fcm_token?: string;
  created_by?: string;
  store_id?: string; // Single store assignment for admin users
  store?: Store; // Store details for admin users
  assigned_store?: AssignedStore; // Store assignment from API
}

// Admin Types
export interface AdminUser extends User {
  username: string;
  role: 'admin' | 'super_admin';
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AdminUser;
    session: {
      access_token: string;
      token_type: string;
      expires_in: number;
    };
    accessToken: string;
  };
  user?: AdminUser;
  session?: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  accessToken?: string;
  timestamp?: string;
}

// Order Types
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  landmark?: string;
}

export interface Order {
  id: string;
  customer_mobile?: string; // Optional since backend might not provide
  customer_name?: string; // Optional since backend might not provide
  customer_id?: string; // Backend provides this
  customer?: { // Backend provides nested customer object
    id: string;
    name: string;
    email: string;
    mobile: string;
  };
  items?: OrderItem[]; // Optional since backend might not always return
  order_items?: OrderItem[]; // Backend provides this field name
  bulk_items_text?: string; // Raw bulk items text from customer
  total_amount: number;
  status: 'submitted' | 'accepted' | 'rejected' | 'packing' | 'ready' | 'delivered';
  delivery_address: DeliveryAddress | string; // Backend might provide string
  delivery_phone?: string; // Backend provides this
  special_instructions?: string;
  admin_notes?: string;
  notes?: string; // Backend provides this
  images?: OrderImage[]; // Order images (max 2)
  order_images?: OrderImage[]; // Backend might provide this field name
  created_at: string;
  updated_at: string;
  status_history?: OrderStatusHistory[]; // Optional since backend might not always return
  store_id?: string; // Backend provides this
}

export interface OrderStatusHistory {
  id: string;
  status: string;
  note?: string;
  created_at: string;
  created_by: string;
}

// Order Image Types
export interface OrderImage {
  id: string;
  order_id: string;
  filename: string;
  url: string;
  file_size: number;
  width: number;
  height: number;
  format: string;
  order_index: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  uploader?: {
    name: string;
    username: string;
  };
}

// Store Image Types
export interface StoreImage {
  id: string;
  title: string;
  description: string;
  filename: string;
  url: string;
  file_size: number;
  width: number;
  height: number;
  format: string;
  order_index: number;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  store_id: string;
  uploader: {
    name: string;
    username: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    pagination: {
      currentPage: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextPage: number | null;
      prevPage: number | null;
    };
  };
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
  };
}

// Form Types
export interface CreateAdminForm {
  username: string;
  password: string;
  name: string;
  role?: 'admin' | 'super_admin'; // Optional since it's set automatically in UI
  store_id?: string; // Single store assignment for the user
}

export interface UpdateOrderStatusForm {
  status: Order['status'];
  message?: string; // Backend expects `message`
}

export interface UpdateOrderPriceForm {
  total_amount: number;
  note?: string;
}

export interface SendMessageForm {
  message: string;
}

export interface CreateOrderForm {
  customer_mobile: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  delivery_address: DeliveryAddress;
  special_instructions?: string;
  images?: File[]; // Max 2 images
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  activeOrders: number;
  newOrdersToday: number;
  completedOrdersToday: number;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

// Filter Types
export interface UserFilters {
  role?: 'customer' | 'admin' | 'super_admin';
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  status?: Order['status'];
  search?: string;
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
}

// Store Types
export interface Store {
  id: string;
  name: string;
  description?: string;
  address?: string;
  is_active?: boolean;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoreFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateStoreForm {
  name: string;
  description?: string;
  address?: string;
  is_active?: boolean;
}

export interface UpdateStoreForm {
  name?: string;
  description?: string;
  address?: string;
  is_active?: boolean;
}

// Offer Types
export interface Offer {
  id: string;
  store_id: string;
  offer_heading: string;
  offer_description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  store?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface CreateOfferForm {
  offer_heading: string;
  offer_description: string;
  image: File;
}

export interface UpdateOfferForm {
  offer_heading?: string;
  offer_description?: string;
  image?: File;
  is_active?: boolean;
}

export interface OfferFilters {
  search?: string;
  is_active?: boolean;
  store_id?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface AuthStore {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: AdminUser) => void;
  setToken: (token: string) => void;
  validateAuthState: () => boolean;
}

export interface AppStore {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
