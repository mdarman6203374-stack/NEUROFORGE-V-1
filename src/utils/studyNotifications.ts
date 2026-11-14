import { Language, StudyReminderConfig } from '../types';

export type BrowserNotificationPermission = NotificationPermission | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): BrowserNotificationPermission {
  if (!isNotificationSupported()) return 'unsupported';
  return window.Notification.permission;
}

export async function requestNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Notification permission request failed:', err);
    return window.Notification.permission || 'denied';
  }
}

export interface ReminderPayload {
  dayNumber: number;
  taskTitle: string;
  hinglishTitle: string;
  durationMins: number;
  language: Language;
  isTest?: boolean;
}

export interface ReminderDispatchResult {
  dispatchedNative: boolean;
  reason?: string;
  title: string;
  body: string;
}

export function buildGentleReminderCopy(payload: ReminderPayload): { title: string; body: string } {
  const hoursStr = (payload.durationMins / 60).toFixed(1).replace(/\.0$/, '');
  const prefix = payload.isTest ? '[Test Reminder] ' : '';

  if (payload.language === 'hinglish') {
    return {
      title: `${prefix}NeuroForge AI · Padhai ka gentle reminder`,
      body: `Day ${payload.dayNumber} (${hoursStr}h session): "${payload.hinglishTitle}". Aaram se shuru karein aur apni streak aage badhayein!`
    };
  }

  return {
    title: `${prefix}NeuroForge AI · Gentle Daily Study Reminder`,
    body: `Time for Day ${payload.dayNumber} (${hoursStr}h focus): "${payload.taskTitle}". Stay consistent and keep your AI streak alive.`
  };
}

export function sendGentleStudyNotification(payload: ReminderPayload): ReminderDispatchResult {
  const { title, body } = buildGentleReminderCopy(payload);

  if (!isNotificationSupported()) {
    return {
      dispatchedNative: false,
      reason: 'Browser Notification API is not supported in this browser.',
      title,
      body
    };
  }

  if (window.Notification.permission !== 'granted') {
    return {
      dispatchedNative: false,
      reason: `Notification permission is currently "${window.Notification.permission}".`,
      title,
      body
    };
  }

  try {
    const notification = new window.Notification(title, {
      body,
      tag: payload.isTest ? 'neuroforge-study-test' : 'neuroforge-daily-study',
      silent: false,
      requireInteraction: false
    });

    notification.onclick = () => {
      try {
        window.focus();
        notification.close();
      } catch {}
    };

    return {
      dispatchedNative: true,
      title,
      body
    };
  } catch (err: any) {
    return {
      dispatchedNative: false,
      reason: err?.message || 'Unable to display native notification in embedded preview.',
      title,
      body
    };
  }
}

export function formatReminderTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr || '19', 10);
  const m = parseInt(mStr || '0', 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function getNextReminderLabel(config: StudyReminderConfig, language: Language): string {
  if (!config.enabled) {
    return language === 'hinglish' ? 'Reminders abhi off hain' : 'Reminders paused';
  }
  if (!config.daysOfWeek || config.daysOfWeek.length === 0) {
    return language === 'hinglish' ? 'Koi din select karein' : 'Select at least one day';
  }

  const now = new Date();
  const [targetH, targetM] = config.time.split(':').map((v) => parseInt(v, 10));
  const todayIdx = now.getDay();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const targetMins = (targetH || 0) * 60 + (targetM || 0);

  const formattedTime = formatReminderTime12h(config.time);

  if (config.daysOfWeek.includes(todayIdx) && currentMins < targetMins) {
    return language === 'hinglish' ? `Aaj ${formattedTime} par` : `Today at ${formattedTime}`;
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let offset = 1; offset <= 7; offset++) {
    const nextIdx = (todayIdx + offset) % 7;
    if (config.daysOfWeek.includes(nextIdx)) {
      if (offset === 1) {
        return language === 'hinglish' ? `Kal ${formattedTime} par` : `Tomorrow at ${formattedTime}`;
      }
      return `${dayNames[nextIdx]} at ${formattedTime}`;
    }
  }

  return formattedTime;
}
