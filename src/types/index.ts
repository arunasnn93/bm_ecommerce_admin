// User Types
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
  store_ids?: string[]; // Store assignments for admin users
  stores?: Store[]; // Store details for admin users
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
  price: number;
  notes?: string;
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
  customer_mobile: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery_address: DeliveryAddress;
  special_instructions?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  status_history: OrderStatusHistory[];
}

export interface OrderStatusHistory {
  id: string;
  status: string;
  note?: string;
  created_at: string;
  created_by: string;
}

// Store Image Types
export interface StoreImage {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  description?: string;
  category: string;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
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
  role: 'admin' | 'super_admin';
  store_ids?: string[]; // Store assignments for the user
}

export interface UpdateOrderStatusForm {
  status: Order['status'];
  note?: string;
}

export interface UpdateOrderPriceForm {
  total_amount: number;
  note?: string;
}

export interface SendMessageForm {
  message: string;
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
