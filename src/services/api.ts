import type {
  ApiResponse,
  AuthResponse,
  CreateAdminForm,
  CreateStoreForm,
  DashboardStats,
  LoginCredentials,
  Order,
  OrderFilters,
  PaginatedResponse,
  SendMessageForm,
  Store,
  StoreFilters,
  StoreImage,
  UpdateOrderPriceForm,
  UpdateOrderStatusForm,
  UpdateStoreForm,
  User,
  UserFilters
} from '@/types';
import { API_CONFIG, API_ENDPOINTS, AUTH_CONFIG } from '@constants';
import { log } from '@utils/logger';
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    log.info('Initializing API Service', { 
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      environment: import.meta.env.MODE
    });
    
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and logging
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        
        log.api.request(
          config.method?.toUpperCase() || 'UNKNOWN',
          config.url || '',
          config.data
        );
        
        return config;
      },
      (error) => {
        log.api.error('REQUEST_INTERCEPTOR', '', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.api.interceptors.response.use(
      (response) => {
        log.api.response(
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.config.url || '',
          response.status,
          response.data
        );
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        
        log.api.error(method, url, {
          status,
          message: error.message,
          response: error.response?.data,
          code: error.code,
          isNetworkError: !error.response,
          isTimeoutError: error.code === 'ECONNABORTED',
        });
        
        if (status === 401) {
          log.auth.tokenExpired();
          this.clearToken();
          window.location.href = '/login';
        } else if (status === 429) {
          log.api.error(method, url, {
            status,
            message: 'Rate limit exceeded',
            rateLimitInfo: error.response?.headers,
          });
          // Don't redirect for rate limit errors, let the UI handle it
        }
        
        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    this.loadToken();
  }

  private loadToken(): void {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      log.auth.tokenRefresh();
      this.setToken(token);
    }
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    log.debug('Token set in localStorage');
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    log.debug('Token cleared from localStorage');
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api(config);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data: unknown } };
      throw axiosError.response?.data || error;
    }
  }

  // Authentication APIs
  public async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/auth/admin-login',
      data: credentials,
    });
    
    // Handle nested data structure from backend
    const userData = response.data || response;
    const user = userData.user;
    const session = userData.session;
    const accessToken = userData.accessToken;
    
    if (response.success) {
      const token = accessToken || session?.access_token;
      if (token) {
        this.setToken(token);
      }
    }
    
    // Return normalized response structure
    return {
      success: response.success,
      message: response.message,
      user: user,
      session: session,
      accessToken: accessToken,
      timestamp: response.timestamp
    };
  }

  public logout(): void {
    this.clearToken();
  }

  // Health Check
  public async healthCheck(): Promise<unknown> {
    return this.request({
      method: 'GET',
      url: '/health',
    });
  }

  // User Management APIs
  public async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    
    if (filters.role) params.append('role', filters.role);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return this.request({
      method: 'GET',
      url: `/api/admin/users?${params.toString()}`,
    });
  }

  public async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.request({
      method: 'GET',
      url: `/api/admin/users/${id}`,
    });
  }

  public async toggleUserStatus(id: string): Promise<ApiResponse<User>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/toggle-user-status/${id}`,
    });
  }

  public async updateUserStatus(id: string, is_active: boolean): Promise<ApiResponse<User>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/users/${id}/status`,
      data: { is_active },
    });
  }

  public async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/users/${id}`,
      data: userData,
    });
  }

  public async createAdmin(data: CreateAdminForm): Promise<ApiResponse<User>> {
    return this.request({
      method: 'POST',
      url: '/api/admin/create-admin',
      data,
    });
  }

  // Order Management APIs
  public async getOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    return this.request({
      method: 'GET',
      url: `/api/orders?${params.toString()}`,
    });
  }

  public async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return this.request({
      method: 'GET',
      url: `/api/orders/${id}`,
    });
  }

  public async updateOrderStatus(id: string, data: UpdateOrderStatusForm): Promise<ApiResponse<Order>> {
    return this.request({
      method: 'PUT',
      url: `/api/orders/${id}/status`,
      data,
    });
  }

  public async updateOrderPrice(id: string, data: UpdateOrderPriceForm): Promise<ApiResponse<Order>> {
    return this.request({
      method: 'PUT',
      url: `/api/orders/${id}/price`,
      data,
    });
  }

  public async sendOrderMessage(id: string, data: SendMessageForm): Promise<ApiResponse<unknown>> {
    return this.request({
      method: 'PUT',
      url: `/api/orders/${id}/message`,
      data,
    });
  }

  // Store Image Management APIs
  public async getStoreImages(): Promise<ApiResponse<StoreImage[]>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/store-images',
    });
  }

  public async uploadStoreImage(formData: FormData): Promise<ApiResponse<StoreImage>> {
    return this.request({
      method: 'POST',
      url: '/api/admin/store-images',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  public async updateStoreImage(id: string, data: Partial<StoreImage>): Promise<ApiResponse<StoreImage>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/store-images/${id}`,
      data,
    });
  }

  public async deleteStoreImage(id: string): Promise<ApiResponse<unknown>> {
    return this.request({
      method: 'DELETE',
      url: `/api/admin/store-images/${id}`,
    });
  }

  // Admin Profile APIs
  public async getAdminProfile(): Promise<ApiResponse<User>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/profile',
    });
  }

  public async updateAdminProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request({
      method: 'PUT',
      url: '/api/admin/profile',
      data,
    });
  }

  // Dashboard Analytics (you might need to implement this in your API)
  public async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/dashboard/stats',
    });
  }

  // Public Store Images (for preview)
  public async getPublicStoreImages(): Promise<ApiResponse<StoreImage[]>> {
    return this.request({
      method: 'GET',
      url: '/api/store-images',
    });
  }

  // Stores (Super Admin only)
  public async getStores(filters: StoreFilters = {}): Promise<PaginatedResponse<Store>> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    return this.request({
      method: 'GET',
      url: `${API_ENDPOINTS.STORES.LIST}?${params.toString()}`,
    });
  }

  public async getMyStores(): Promise<ApiResponse<Store[]>> {
    return this.request({
      method: 'GET',
      url: API_ENDPOINTS.STORES.MY_STORES,
    });
  }

  public async getStoreById(id: string): Promise<ApiResponse<Store>> {
    return this.request({
      method: 'GET',
      url: API_ENDPOINTS.STORES.DETAILS(id),
    });
  }

  public async createStore(data: CreateStoreForm): Promise<ApiResponse<Store>> {
    return this.request({
      method: 'POST',
      url: API_ENDPOINTS.STORES.LIST,
      data,
    });
  }

  public async updateStore(id: string, data: UpdateStoreForm): Promise<ApiResponse<Store>> {
    return this.request({
      method: 'PUT',
      url: API_ENDPOINTS.STORES.DETAILS(id),
      data,
    });
  }

  public async deleteStore(id: string): Promise<ApiResponse<unknown>> {
    return this.request({
      method: 'DELETE',
      url: API_ENDPOINTS.STORES.DETAILS(id),
    });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
