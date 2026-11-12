import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface AppNotificationOptions {
  id?: string;
  title: string;
  body: string;
  senderAvatar?: string;
  data?: any;
}

let isChannelCreated = false;

// Create High-Priority Notification Channel on Android
export async function initNotificationChannel(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      if (!isChannelCreated) {
        await LocalNotifications.createChannel({
          id: 'romantic_couples_channel',
          name: 'رسائل الحب والمحادثة',
          description: 'إشعارات الرسائل الجديدة من شريكك ❤️',
          importance: 5,
          visibility: 1,
          vibration: true,
          lights: true,
          lightColor: '#C8102E'
        });
        isChannelCreated = true;
      }
    } catch (err) {
      console.warn('Could not create Android notification channel:', err);
    }
  }
}

// Request Notification Permission (Both Web & Mobile)
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await initNotificationChannel();
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    }
    return false;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

// Check if notification permission is currently granted
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}

// Send Notification (Handles Mobile App Notification or Web Browser Notification)
export async function sendIncomingMessageNotification(options: AppNotificationOptions): Promise<void> {
  const { title, body, senderAvatar } = options;

  // 1. If running as a Native Mobile App (Android APK via Capacitor)
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel();
      const numId = Math.floor(Math.random() * 2000000) + 1;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: numId,
            title,
            body,
            channelId: 'romantic_couples_channel',
            schedule: { at: new Date(Date.now() + 50) },
            extra: options.data || null,
            smallIcon: 'ic_launcher'
          }
        ]
      });
      return;
    } catch (err) {
      console.warn('Native local notification failed:', err);
    }
  }

  // 2. If running on Web / Laptop / Mobile Browser
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body,
          icon: senderAvatar || '/favicon.ico',
          badge: '/favicon.ico',
          tag: options.id || 'couple-chat-msg',
          renotify: true
        });

        n.onclick = () => {
          try {
            window.focus();
          } catch {}
          n.close();
        };
      } catch (err) {
        console.warn('Web notification failed:', err);
      }
    }
  }
}

