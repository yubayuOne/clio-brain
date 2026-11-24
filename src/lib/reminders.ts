import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const CHANNEL = 'reminders';

// Show reminders as banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function allowed(): Promise<boolean> {
  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Reminders',
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Replaces the item's pending notification (keyed by item id). Resolves false when
 * the phone will not alert: permission denied or notifications unsupported (web).
 */
export async function scheduleReminder(itemId: string, title: string, at: number): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(itemId);
    if (at <= Date.now()) return true;
    if (!(await allowed())) return false;
    await Notifications.scheduleNotificationAsync({
      identifier: itemId,
      content: { title, body: 'Reminder from Clio Brain', data: { itemId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
    return true;
  } catch {
    return false;
  }
}

export function cancelReminder(itemId: string): void {
  Notifications.cancelScheduledNotificationAsync(itemId).catch(() => undefined);
}

export function cancelAllReminders(): void {
  Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}

/** Calls onOpen with the item id when the user taps a reminder (also on cold start). */
export function useReminderTaps(enabled: boolean, onOpen: (itemId: string) => void): void {
  useEffect(() => {
    // The response APIs throw on web, where reminders never fire anyway.
    if (!enabled || Platform.OS === 'web') return;
    const handle = (r: Notifications.NotificationResponse | null) => {
      const id = r?.notification.request.content.data?.itemId;
      if (typeof id !== 'string') return;
      // Cleared so a later reload (Start a new board) does not reopen the same card.
      Notifications.clearLastNotificationResponse();
      onOpen(id);
    };
    handle(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [enabled, onOpen]);
}
