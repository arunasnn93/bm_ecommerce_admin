import { soundNotificationService } from '@services/soundNotification';
import { websocketService, type NewOrderNotification, type NotificationData } from '@services/websocket';
import { useAuthStore } from '@store/authStore';
import { log } from '@utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export interface NotificationState {
  isConnected: boolean;
  notifications: NotificationData[];
  unreadCount: number;
  settings: {
    soundEnabled: boolean;
    volume: number;
    soundType: 'default' | 'chime' | 'bell' | 'notification';
  };
}

// Global state to prevent multiple instances
let globalNotificationState: NotificationState = {
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  settings: {
    soundEnabled: soundNotificationService.isEnabled(),
    volume: soundNotificationService.getVolume(),
    soundType: soundNotificationService.getSoundType(),
  }
};

let globalShownToasts = new Set<string>();
let globalStateSetters: Set<React.Dispatch<React.SetStateAction<NotificationState>>> = new Set();
let globalToastSetters: Set<React.Dispatch<React.SetStateAction<Set<string>>>> = new Set();

export const useNotifications = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [state, setState] = useState<NotificationState>(globalNotificationState);
  const [shownToasts, setShownToasts] = useState<Set<string>>(globalShownToasts);
  
  // Generate unique instance ID for debugging
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  
  // Register this instance's setters globally
  useEffect(() => {
    globalStateSetters.add(setState);
    globalToastSetters.add(setShownToasts);
    
    return () => {
      globalStateSetters.delete(setState);
      globalToastSetters.delete(setShownToasts);
    };
  }, []);

  // Handle new notifications
  const handleNotification = useCallback((notification: NotificationData) => {
    console.log(`🔔 [NOTIFICATION-${instanceId.current}] Received notification:`, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      timestamp: notification.timestamp,
      shownToastsCount: globalShownToasts.size,
      alreadyShown: globalShownToasts.has(notification.id)
    });
    
    // Check if we've already shown a toast for this notification FIRST (synchronous check)
    if (globalShownToasts.has(notification.id)) {
      console.log('🚫 [NOTIFICATION] Toast already shown for notification, skipping:', notification.id);
      return;
    }

    console.log(`✅ [NOTIFICATION-${instanceId.current}] Showing toast for notification:`, notification.id);
    
    // Mark this toast as shown IMMEDIATELY to prevent race conditions (synchronous update)
    globalShownToasts.add(notification.id);
    
    // Update all registered toast setters
    globalToastSetters.forEach(setter => {
      setter(prev => new Set([...prev, notification.id]));
    });
    
    // Check if we already have this notification to prevent duplicates
    const existingNotification = globalNotificationState.notifications.find(n => n.id === notification.id);
    if (existingNotification) {
      log.warn('Duplicate notification received, ignoring:', notification.id);
      return;
    }
    
    // Update global state
    globalNotificationState = {
      ...globalNotificationState,
      notifications: [notification, ...globalNotificationState.notifications.slice(0, 49)], // Keep last 50 notifications
      unreadCount: globalNotificationState.unreadCount + 1
    };
    
    // Update all registered state setters
    globalStateSetters.forEach(setter => {
      setter(globalNotificationState);
    });

    // Play sound notification
    if (notification.type === 'new_order') {
      soundNotificationService.playNotificationSound('new_order');
      
      // Show toast notification
      const newOrderNotification = notification as NewOrderNotification;
      toast.success(
        `🛒 New Order #${newOrderNotification.data.orderId.slice(-8)} from ${newOrderNotification.data.customerName}`,
        {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: 'bold',
          },
        }
      );
    } else if (notification.type === 'order_update') {
      soundNotificationService.playNotificationSound('order_update');
      
      toast(
        `📦 Order Update: ${notification.message}`,
        {
          duration: 4000,
          position: 'top-right',
          icon: '📦',
        }
      );
    } else {
      // Generic notification
      soundNotificationService.playNotificationSound('info');
      
      toast(notification.message, {
        duration: 3000,
        position: 'top-right',
        icon: notification.type === 'error' ? '❌' : 
              notification.type === 'warning' ? '⚠️' : 
              notification.type === 'success' ? '✅' : 'ℹ️',
      });
    }
  }, [shownToasts]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    log.info('WebSocket connection status changed:', connected);
    globalNotificationState = { ...globalNotificationState, isConnected: connected };
    
    // Update all registered setters
    globalStateSetters.forEach(setter => setter(globalNotificationState));
    
    // No toast notifications for connection status changes
    // Users can see connection status in the notification bell
  }, []);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token && user) {
      log.info('User authenticated, connecting to WebSocket');
      websocketService.connect();
    } else {
      log.info('User not authenticated, disconnecting WebSocket');
      websocketService.disconnect();
      setState(prev => ({
        ...prev,
        isConnected: false,
        notifications: [],
        unreadCount: 0
      }));
    }
  }, [isAuthenticated, token, user]);

  // Set up notification listeners
  useEffect(() => {
    const unsubscribeNotification = websocketService.onNotification(handleNotification);
    const unsubscribeConnection = websocketService.onConnectionChange(handleConnectionChange);

    return () => {
      unsubscribeNotification();
      unsubscribeConnection();
    };
  }, [handleNotification, handleConnectionChange]);

  // Clean up old toast IDs periodically to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Keep only the last 100 toast IDs in global state
      const toastArray = Array.from(globalShownToasts);
      if (toastArray.length > 100) {
        const newSet = new Set(toastArray.slice(-100));
        globalShownToasts = newSet;
        
        // Update all registered toast setters
        globalToastSetters.forEach(setter => setter(newSet));
      }
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Update settings when they change
  useEffect(() => {
    globalNotificationState = {
      ...globalNotificationState,
      settings: {
        soundEnabled: soundNotificationService.isEnabled(),
        volume: soundNotificationService.getVolume(),
        soundType: soundNotificationService.getSoundType(),
      }
    };
    
    // Update all registered setters
    globalStateSetters.forEach(setter => setter(globalNotificationState));
  }, []);

  // Actions
  const markAsRead = useCallback((notificationId: string) => {
    globalNotificationState = {
      ...globalNotificationState,
      notifications: globalNotificationState.notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ),
      unreadCount: Math.max(0, globalNotificationState.unreadCount - 1)
    };
    
    // Update all registered setters
    globalStateSetters.forEach(setter => setter(globalNotificationState));
  }, []);

  const markAllAsRead = useCallback(() => {
    globalNotificationState = {
      ...globalNotificationState,
      notifications: globalNotificationState.notifications.map(notif => ({ ...notif, isRead: true })),
      unreadCount: 0
    };
    
    // Update all registered setters
    globalStateSetters.forEach(setter => setter(globalNotificationState));
  }, []);

  const clearNotifications = useCallback(() => {
    globalNotificationState = {
      ...globalNotificationState,
      notifications: [],
      unreadCount: 0
    };
    globalShownToasts.clear();
    
    // Update all registered setters
    globalStateSetters.forEach(setter => setter(globalNotificationState));
    globalToastSetters.forEach(setter => setter(new Set()));
  }, []);

  const updateSoundSettings = useCallback((settings: Partial<NotificationState['settings']>) => {
    if (settings.soundEnabled !== undefined) {
      soundNotificationService.setEnabled(settings.soundEnabled);
    }
    if (settings.volume !== undefined) {
      soundNotificationService.setVolume(settings.volume);
    }
    if (settings.soundType !== undefined) {
      soundNotificationService.setSoundType(settings.soundType);
    }
    
    globalNotificationState = {
      ...globalNotificationState,
      settings: {
        ...globalNotificationState.settings,
        ...settings
      }
    };
    
    // Update all registered setters
    globalStateSetters.forEach(setter => setter(globalNotificationState));
  }, []);

  const testSound = useCallback(() => {
    soundNotificationService.playNotificationSound('new_order');
  }, []);

  const ping = useCallback(() => {
    websocketService.ping();
  }, []);

  return {
    // State
    isConnected: state.isConnected,
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    settings: state.settings,
    
    // Actions
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSoundSettings,
    testSound,
    ping,
    
    // WebSocket actions
    joinRoom: websocketService.joinRoom.bind(websocketService),
    leaveRoom: websocketService.leaveRoom.bind(websocketService),
  };
};

export default useNotifications;
