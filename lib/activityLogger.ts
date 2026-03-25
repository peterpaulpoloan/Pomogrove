// Centralized activity logger — writes ISO timestamps to localStorage
// Event types: 'login' | 'pomodoro' | 'quiz' | 'note'

const ACTIVITY_KEY = (uid: string) => `stats_${uid}`;

export type ActivityEvent = 'login' | 'pomodoro' | 'quiz' | 'note';

export function logActivity(uid: string, event: ActivityEvent) {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY(uid));
    const entries: { ts: string; event: ActivityEvent }[] = raw ? JSON.parse(raw) : [];
    entries.push({ ts: new Date().toISOString(), event });
    localStorage.setItem(ACTIVITY_KEY(uid), JSON.stringify(entries));
    // Notify same-tab listeners (ActivityCalendar) that the log has changed.
    // The native 'storage' event only fires in *other* tabs, so we need this.
    window.dispatchEvent(new Event('activity-updated'));
  } catch {}
}

export function loadActivity(uid: string): { ts: string; event: ActivityEvent }[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Handle legacy format (plain ISO string array from old pomodoro-only logging)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((ts: string) => ({ ts, event: 'pomodoro' as ActivityEvent }));
    }
    return parsed;
  } catch {
    return [];
  }
}