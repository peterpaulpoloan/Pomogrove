import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { UserProfile } from '../types';
import { loadActivity, ActivityEvent } from '../lib/activityLogger';
import { loadXPBreakdown, xpToLevel, XP_WEIGHTS, XP_PER_LEVEL } from '../lib/xpSystem';

interface ActivityCalendarProps {
  user: UserProfile;
}

const EVENT_META: Record<ActivityEvent, { label: string; color: string; bg: string; icon: string }> = {
  login:    { label: 'Login',       color: 'bg-sky-400',     bg: 'bg-sky-50',    icon: '🔑' },
  pomodoro: { label: 'Sessions',    color: 'bg-emerald-500', bg: 'bg-emerald-50', icon: '🍅' },
  quiz:     { label: 'Recall Sets', color: 'bg-violet-400',  bg: 'bg-violet-50',  icon: '🧠' },
  note:     { label: 'Notes',       color: 'bg-amber-400',   bg: 'bg-amber-50',   icon: '📝' },
};

// ── Animated XP bar ────────────────────────────────────────────────────────
const XPMiniBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
};

// ── Level Progress Panel ───────────────────────────────────────────────────
// Listens to localStorage 'storage' events so it re-renders whenever
// addXP() is called from Pomodoro, Notes, or ActiveRecall — even within
// the same tab (we dispatch a custom event for same-tab updates).
const LevelProgressPanel: React.FC<{ uid: string }> = ({ uid }) => {
  const readBreakdown = useCallback(() => loadXPBreakdown(uid), [uid]);
  const [breakdown, setBreakdown] = useState(readBreakdown);

  useEffect(() => {
    // Refresh whenever XP storage key changes (cross-tab via 'storage' event,
    // or same-tab via our custom 'xp-updated' event dispatched in addXP).
    const refresh = () => setBreakdown(readBreakdown());

    window.addEventListener('storage', refresh);
    window.addEventListener('xp-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('xp-updated', refresh);
    };
  }, [readBreakdown]);

  const { level, currentXP, nextLevelXP, progress } = xpToLevel(breakdown.total);
  const xpNeeded = nextLevelXP - currentXP;

  const [barW, setBarW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarW(progress), 200);
    return () => clearTimeout(t);
  }, [progress]);

  const sources = [
    { label: 'Pomodoro', xp: breakdown.pomodoro, color: 'bg-emerald-400', hint: `${XP_WEIGHTS.POMODORO_SESSION} XP/session` },
    { label: 'Notes',    xp: breakdown.note,     color: 'bg-amber-400',   hint: 'XP scales with word count' },
    { label: 'Recall',   xp: breakdown.recall,   color: 'bg-violet-400',  hint: 'XP scales with cards answered' },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-50 border border-emerald-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Grove Level</p>
            <p className="text-2xl font-black text-emerald-700 leading-none">{level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-stone-700">{xpNeeded} XP to go</p>
          <p className="text-[10px] text-stone-400">{breakdown.total} total XP</p>
        </div>
      </div>

      {/* Overall level bar */}
      <div className="h-3 bg-white/70 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${barW}%` }}
        />
      </div>

      {/* Per-source breakdown */}
      <div className="space-y-2 pt-1 border-t border-emerald-100">
        {sources.map(s => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-stone-600">{s.label}</span>
              <span className="text-[10px] font-mono text-stone-500">{s.xp} XP</span>
            </div>
            {/* Mini bar shows progress within the current level bucket */}
            <XPMiniBar pct={(s.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100} color={s.color} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Action Summary Cards ───────────────────────────────────────────────────
const ActionSummary: React.FC<{
  eventMap: Record<string, Record<ActivityEvent, number>>;
  view: string;
}> = ({ eventMap, view }) => {
  const totals = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (view === 'week')       cutoff.setDate(now.getDate() - 7);
    else if (view === 'month') cutoff.setDate(now.getDate() - 30);
    else                       cutoff.setFullYear(now.getFullYear() - 1);

    const acc: Record<ActivityEvent, number> = { login: 0, pomodoro: 0, quiz: 0, note: 0 };
    Object.entries(eventMap).forEach(([dateStr, counts]) => {
      if (new Date(dateStr) >= cutoff) {
        (Object.keys(counts) as ActivityEvent[]).forEach(event => {
          acc[event] += counts[event] || 0;
        });
      }
    });
    return acc;
  }, [eventMap, view]);

  const cards = [
    { key: 'pomodoro', icon: '🍅', label: 'Sessions',      value: totals.pomodoro },
    { key: 'note',     icon: '📝', label: 'Notes Created', value: totals.note },
    { key: 'quiz',     icon: '🧠', label: 'Recall Sets',   value: totals.quiz },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map(c => (
        <div
          key={c.key}
          className={`rounded-xl p-3 border border-white shadow-sm ${EVENT_META[c.key as ActivityEvent].bg}`}
        >
          <span className="text-lg">{c.icon}</span>
          <p className="text-xl font-black text-stone-800">{c.value}</p>
          <p className="text-[10px] font-semibold text-stone-500 uppercase">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ user }) => {
  const [eventMap, setEventMap] = useState<Record<string, Record<ActivityEvent, number>>>({});
  const [view, setView] = useState<'week' | 'month' | 'year'>('month');

  // Re-read activity log whenever a new entry is written (same-tab custom event
  // or cross-tab native 'storage' event).
  const refreshActivity = useCallback(() => {
    const entries = loadActivity(user.uid);
    const em: Record<string, Record<ActivityEvent, number>> = {};
    entries.forEach(({ ts, event }) => {
      const date = new Date(ts).toISOString().split('T')[0];
      if (!em[date]) em[date] = { login: 0, pomodoro: 0, quiz: 0, note: 0 };
      em[date][event] = (em[date][event] || 0) + 1;
    });
    setEventMap(em);
  }, [user.uid]);

  useEffect(() => {
    refreshActivity();
    window.addEventListener('storage', refreshActivity);
    window.addEventListener('activity-updated', refreshActivity);
    return () => {
      window.removeEventListener('storage', refreshActivity);
      window.removeEventListener('activity-updated', refreshActivity);
    };
  }, [refreshActivity]);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-stone-800">Your Progress</h3>
        <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
          {(['week', 'month', 'year'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-bold capitalize ${
                view === v ? 'bg-white shadow-sm' : 'text-stone-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <LevelProgressPanel uid={user.uid} />
      <ActionSummary eventMap={eventMap} view={view} />
    </div>
  );
};

export default ActivityCalendar;