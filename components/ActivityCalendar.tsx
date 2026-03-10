import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { loadActivity, ActivityEvent } from '../lib/activityLogger';

interface ActivityCalendarProps {
  user: UserProfile;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_META: Record<ActivityEvent, { label: string; color: string; dot: string }> = {
  login:    { label: 'Login',    color: 'bg-sky-400',     dot: '#38bdf8' },
  pomodoro: { label: 'Pomodoro', color: 'bg-emerald-500', dot: '#10b981' },
  quiz:     { label: 'Quiz',     color: 'bg-violet-400',  dot: '#a78bfa' },
  note:     { label: 'Note',     color: 'bg-amber-400',   dot: '#fbbf24' },
};

function buildWeeks(sessionMap: Record<string, number>, weeksBack = 26) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeksBack - 1) * 7);

  const todayKey = getDateKey(today);
  const weeks: { key: string; count: number }[][] = [];
  let week: { key: string; count: number }[] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const key = getDateKey(cursor);
    week.push({ key, count: sessionMap[key] || 0 });
    if (week.length === 7) { weeks.push(week); week = []; }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);
  return { weeks, todayKey };
}

function getColor(count: number) {
  if (count === 0) return '#e7e5e4';
  if (count === 1) return '#6ee7b7';
  if (count === 2) return '#34d399';
  if (count === 3) return '#10b981';
  if (count <= 5)  return '#059669';
  return '#064e3b';
}

function formatLabel(dateKey: string) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Component ──────────────────────────────────────────────────────────────
const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ user }) => {
  const [dayMap,   setDayMap]   = useState<Record<string, number>>({});
  const [eventMap, setEventMap] = useState<Record<string, Record<ActivityEvent, number>>>({});
  const [view,     setView]     = useState<'week' | 'month' | 'year'>('year');
  const [tooltip,  setTooltip]  = useState<{ key: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const entries = loadActivity(user.uid);
    const dm: Record<string, number> = {};
    const em: Record<string, Record<ActivityEvent, number>> = {};

    entries.forEach(({ ts, event }) => {
      const key = getDateKey(new Date(ts));
      dm[key] = (dm[key] || 0) + 1;
      if (!em[key]) em[key] = { login: 0, pomodoro: 0, quiz: 0, note: 0 };
      em[key][event] = (em[key][event] || 0) + 1;
    });

    setDayMap(dm);
    setEventMap(em);
  }, [user.uid]);

  const stats = useMemo(() => {
    const values = Object.values(dayMap) as number[];
    const total  = values.reduce((a, b) => a + b, 0);
    const active = values.filter(v => v > 0).length;
    const best   = values.length > 0 ? Math.max(0, ...values) : 0;

    let streak = 0;
    const cursor = new Date();
    while (true) {
      const k = getDateKey(cursor);
      if ((dayMap[k] || 0) > 0) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }

    const monthMap: Record<string, number> = {};
    Object.entries(dayMap).forEach(([k, v]: [string, number]) => {
      const m = k.slice(0, 7);
      monthMap[m] = (monthMap[m] || 0) + v;
    });
    const bestM = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0];
    const bestMonth = bestM
      ? MONTH_NAMES[parseInt(bestM[0].slice(5, 7)) - 1] + ' ' + bestM[0].slice(0, 4)
      : '—';

    return { total, active, best, streak, bestMonth };
  }, [dayMap]);

  const weeksBack = view === 'week' ? 2 : view === 'month' ? 5 : 26;
  const { weeks, todayKey } = useMemo(() => buildWeeks(dayMap, weeksBack), [dayMap, weeksBack]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let last = '';
    weeks.forEach((week, col) => {
      const m = week[0].key.slice(5, 7);
      if (m !== last) {
        last = m;
        const d = new Date(week[0].key + 'T12:00:00');
        labels.push({ label: MONTH_NAMES[d.getMonth()], col });
      }
    });
    return labels;
  }, [weeks]);

  const cell = 13, gap = 3;
  const tooltipDay = tooltip ? eventMap[tooltip.key] : null;

  return (
    <div className="w-full space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-800">Activity</h3>
          <p className="text-xs text-stone-400">{stats.total} total actions logged</p>
        </div>
        <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
          {(['week','month','year'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize
                ${view === v ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Current Streak', value: `${stats.streak}d`,     color: 'text-emerald-600' },
          { label: 'Best Day',       value: `${stats.best} events`,  color: 'text-amber-500'  },
          { label: 'Active Days',    value: stats.active,            color: 'text-stone-700'  },
          { label: 'Best Month',     value: stats.bestMonth,         color: 'text-violet-500' },
        ].map(s => (
          <div key={s.label} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ minWidth: weeks.length * (cell + gap) + 32 }}>
          {/* Month labels */}
          <div className="relative h-5 ml-8">
            {monthLabels.map(({ label, col }) => (
              <span key={col}
                className="absolute text-[9px] text-stone-400 font-bold uppercase tracking-wider"
                style={{ left: col * (cell + gap) }}>
                {label}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-1.5" style={{ gap }}>
              {DAY_LABELS.map((d, i) => (
                <div key={d} style={{ height: cell, fontSize: 9 }}
                  className="text-stone-300 font-bold flex items-center justify-end pr-1 w-6 select-none">
                  {i % 2 === 1 ? d[0] : ''}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex" style={{ gap }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap }}>
                  {week.map(({ key, count }) => (
                    <div key={key}
                      style={{
                        width: cell, height: cell, borderRadius: 3,
                        backgroundColor: getColor(count),
                        outline: key === todayKey ? '2px solid #10b981' : 'none',
                        outlineOffset: 1,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => {
                        const r = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({ key, x: r.left + r.width / 2, y: r.top - 8 });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {(Object.entries(EVENT_META) as [ActivityEvent, typeof EVENT_META[ActivityEvent]][]).map(([k, m]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${m.color}`} />
              <span className="text-[10px] text-stone-400 font-medium">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-stone-300">Less</span>
          {[0,1,2,3,5,6].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: getColor(c) }} />
          ))}
          <span className="text-[10px] text-stone-300">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none px-3 py-2.5 bg-stone-900 text-white text-xs rounded-xl shadow-2xl -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}>
          <p className="font-bold mb-1.5">{formatLabel(tooltip.key)}</p>
          {tooltipDay && Object.values(tooltipDay).some((v) => (v as number) > 0) ? (
            <div className="space-y-1">
              {(Object.entries(tooltipDay) as [ActivityEvent, number][])
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_META[k].dot }} />
                    <span className="text-stone-300">{EVENT_META[k].label}:</span>
                    <span className="font-bold">{v}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-stone-400">No activity</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityCalendar;