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

export const useNotifications = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [state, setState] = useState<NotificationState>({
    isConnected: false,
    notifications: [],
    unreadCount: 0,
    settings: {
      soundEnabled: soundNotificationService.isEnabled(),
      volume: soundNotificationService.getVolume(),
      soundType: soundNotificationService.getSoundType(),
    }
  });
  
  // Track shown toasts to prevent duplicates (using ref for synchronous access)
  const shownToastsRef = useRef<Set<string>>(new Set());
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());

  // Handle new notifications
  const handleNotification = useCallback((notification: NotificationData) => {
    log.info('Processing notification:', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      timestamp: notification.timestamp
    });
    
    // Check if we've already shown a toast for this notification FIRST (synchronous check)
    if (shownToastsRef.current.has(notification.id)) {
      log.info('Toast already shown for notification, skipping:', notification.id);
      return;
    }

    // Mark this toast as shown IMMEDIATELY to prevent race conditions (synchronous update)
    shownToastsRef.current.add(notification.id);
    setShownToasts(prev => new Set([...prev, notification.id]));
    
    setState(prev => {
      // Check if we already have this notification to prevent duplicates
      const existingNotification = prev.notifications.find(n => n.id === notification.id);
      if (existingNotification) {
        log.warn('Duplicate notification received, ignoring:', notification.id);
        return prev;
      }
      
      return {
        ...prev,
        notifications: [notification, ...prev.notifications.slice(0, 49)], // Keep last 50 notifications
        unreadCount: prev.unreadCount + 1
      };
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
    setState(prev => ({ ...prev, isConnected: connected }));
    
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
      // Keep only the last 100 toast IDs in both ref and state
      const toastArray = Array.from(shownToastsRef.current);
      if (toastArray.length > 100) {
        const newSet = new Set(toastArray.slice(-100));
        shownToastsRef.current = newSet;
        setShownToasts(newSet);
      }
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Update settings when they change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      settings: {
        soundEnabled: soundNotificationService.isEnabled(),
        volume: soundNotificationService.getVolume(),
        soundType: soundNotificationService.getSoundType(),
      }
    }));
  }, []);

  // Actions
  const markAsRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }));
  }, []);

  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif => ({ ...notif, isRead: true })),
      unreadCount: 0
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0
    }));
    // Also clear shown toasts
    shownToastsRef.current.clear();
    setShownToasts(new Set());
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
    
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings
      }
    }));
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
