import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@store/authStore';
import { log } from '@utils/logger';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'new_order' | 'order_update' | 'info' | 'success' | 'warning' | 'error';
  data?: any;
  timestamp: string;
  isRead: boolean;
}

export interface NewOrderNotification extends NotificationData {
  type: 'new_order';
  data: {
    orderId: string;
    order: any;
    customerName: string;
    totalAmount: number;
    status: string;
  };
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private notificationCallbacks: ((notification: NotificationData) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    const token = useAuthStore.getState().token;
    
    if (!token) {
      log.warn('No auth token available for WebSocket connection');
      return;
    }

    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    this.socket = io(backendUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      log.info('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Join admin orders room
      this.socket?.emit('join_room', 'admin_orders');
      
      this.connectionCallbacks.forEach(callback => callback(true));
    });

    this.socket.on('disconnect', (reason) => {
      log.warn('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.connectionCallbacks.forEach(callback => callback(false));
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      log.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.connectionCallbacks.forEach(callback => callback(false));
      this.handleReconnect();
    });

    this.socket.on('notification', (notification: NotificationData) => {
      console.log('🌐 [WEBSOCKET] Received notification:', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        timestamp: notification.timestamp,
        callbackCount: this.notificationCallbacks.length
      });
      this.notificationCallbacks.forEach((callback, index) => {
        console.log(`🌐 [WEBSOCKET] Calling callback ${index + 1}/${this.notificationCallbacks.length}`);
        callback(notification);
      });
    });

    this.socket.on('connected', (data) => {
      log.info('WebSocket server confirmed connection:', data);
    });

    this.socket.on('room_joined', (data) => {
      log.info('Joined room:', data);
    });

    this.socket.on('pong', (data) => {
      log.debug('Received pong:', data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    log.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.initializeConnection();
    }, delay);
  }

  public connect() {
    if (this.socket?.connected) {
      log.info('WebSocket already connected');
      return;
    }
    
    this.initializeConnection();
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      log.info('WebSocket disconnected');
    }
  }

  public onNotification(callback: (notification: NotificationData) => void) {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  public onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  public joinRoom(roomName: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', roomName);
    }
  }

  public leaveRoom(roomName: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', roomName);
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
