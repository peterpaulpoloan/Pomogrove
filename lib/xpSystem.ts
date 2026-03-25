// ─────────────────────────────────────────────
//  XP System — PomoGrove
//  Fixed weights (user cannot change these)
// ─────────────────────────────────────────────

export const XP_WEIGHTS = {
  /** 10 XP per finished pomodoro session */
  POMODORO_SESSION: 10,
  /** 40 XP per 500 words in a note (proportional — partial credit given) */
  NOTE_PER_500_WORDS: 40,
  /** 40 XP per 50 items answered in active recall (proportional — partial credit given) */
  RECALL_PER_50_ITEMS: 40,
} as const;

export const XP_PER_LEVEL = 100;

// ─── Action Types ────────────────────────────

export type XPAction =
  | { type: 'pomodoro' }
  | { type: 'note'; wordCount: number }
  | { type: 'recall'; itemCount: number };

// ─── XP per action breakdown ─────────────────

export interface XPBreakdown {
  pomodoro: number;
  note: number;
  recall: number;
  total: number;
}

/** Calculate XP earned from a single action.
 *
 *  Recall & note use proportional (non-integer) scaling so that any
 *  amount of work earns XP — a 10-card quiz earns 8 XP, a 200-word
 *  note earns 16 XP, etc.  We round to the nearest integer at the end
 *  so the stored values stay clean.
 */
export function calcXPForAction(action: XPAction): number {
  switch (action.type) {
    case 'pomodoro':
      return XP_WEIGHTS.POMODORO_SESSION;

    case 'note':
      // Proportional: (wordCount / 500) * 40, minimum 1 XP for any non-empty note
      return Math.max(1, Math.round((action.wordCount / 500) * XP_WEIGHTS.NOTE_PER_500_WORDS));

    case 'recall':
      // Proportional: (itemCount / 50) * 40, minimum 1 XP for answering anything
      return Math.max(1, Math.round((action.itemCount / 50) * XP_WEIGHTS.RECALL_PER_50_ITEMS));

    default:
      return 0;
  }
}

/** Derive level and progress from total XP */
export function xpToLevel(totalXP: number): {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
} {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const currentXP = totalXP % XP_PER_LEVEL;
  const nextLevelXP = XP_PER_LEVEL;
  const progress = (currentXP / nextLevelXP) * 100;
  return { level, currentXP, nextLevelXP, progress };
}

/** Convert legacy level (pomodoro-only) to equivalent XP */
export function legacyLevelToXP(_pomodoroLevel: number, totalSessions: number): number {
  return totalSessions * XP_WEIGHTS.POMODORO_SESSION;
}

// ─── LocalStorage helpers ────────────────────

const STORAGE_KEY = (uid: string) => `xp_breakdown_${uid}`;

export function loadXPBreakdown(uid: string): XPBreakdown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(uid));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { pomodoro: 0, note: 0, recall: 0, total: 0 };
}

export function saveXPBreakdown(uid: string, breakdown: XPBreakdown): void {
  localStorage.setItem(STORAGE_KEY(uid), JSON.stringify(breakdown));
  // Notify same-tab listeners (ActivityCalendar) that XP has changed.
  // The native 'storage' event only fires in *other* tabs, so we need this.
  window.dispatchEvent(new Event('xp-updated'));
}

export function addXP(uid: string, action: XPAction): XPBreakdown {
  const current = loadXPBreakdown(uid);
  const earned = calcXPForAction(action);

  const updated: XPBreakdown = {
    pomodoro: current.pomodoro + (action.type === 'pomodoro' ? earned : 0),
    note:     current.note     + (action.type === 'note'     ? earned : 0),
    recall:   current.recall   + (action.type === 'recall'   ? earned : 0),
    total:    current.total    + earned,
  };

  saveXPBreakdown(uid, updated);
  return updated;
}