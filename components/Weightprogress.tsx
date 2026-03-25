import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import {
  loadXPBreakdown,
  xpToLevel,
  XPBreakdown,
  XP_WEIGHTS,
  XP_PER_LEVEL,
} from '../lib/xpSystem';

interface Props {
  user: UserProfile;
}

// ─── Micro animated bar ──────────────────────

const XPBar: React.FC<{
  label: string;
  icon: string;
  xp: number;
  color: string;
  bg: string;
  rule: string;
}> = ({ label, icon, xp, color, bg, rule }) => {
  const [width, setWidth] = useState(0);
  const segments = Math.floor(xp / XP_PER_LEVEL);
  const remainder = xp % XP_PER_LEVEL;
  const pct = (remainder / XP_PER_LEVEL) * 100;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="group relative">
      <div className={`rounded-2xl p-4 ${bg} border border-white/60 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-sm font-semibold text-stone-700 tracking-wide">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {segments > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color} text-white`}>
                ×{segments} lvl
              </span>
            )}
            <span className="text-xs text-stone-500 font-mono">{xp} XP</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-white/70 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
            style={{ width: `${width}%` }}
          />
        </div>

        {/* Sub-caption */}
        <p className="mt-1.5 text-xs text-stone-400">
          {remainder}/{XP_PER_LEVEL} XP this level · <span className="italic">{rule}</span>
        </p>
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────

const WeightProgress: React.FC<Props> = ({ user }) => {
  const [breakdown, setBreakdown] = useState<XPBreakdown>({ pomodoro: 0, note: 0, recall: 0, total: 0 });

  useEffect(() => {
    setBreakdown(loadXPBreakdown(user.uid));
  }, [user.uid]);

  const { level, currentXP, nextLevelXP, progress } = xpToLevel(breakdown.total);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(progress), 200);
    return () => clearTimeout(t);
  }, [progress]);

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur border border-stone-100 shadow-sm p-6 space-y-5">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🌱</span>
        <h2 className="text-base font-bold text-stone-800 tracking-tight">Grove Progress</h2>
        <span className="ml-auto text-xs text-stone-400 font-medium">XP by action</span>
      </div>

      {/* Overall level bar */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4 shadow-inner">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-widest">Overall Level</p>
            <p className="text-3xl font-black text-emerald-700 leading-none mt-0.5">{level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400 font-mono">{currentXP} / {nextLevelXP} XP</p>
            <p className="text-xs text-stone-400">{breakdown.total} total XP</p>
          </div>
        </div>
        <div className="h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p className="text-xs text-emerald-600 mt-1.5 font-medium">{Math.round(progress)}% to Level {level + 1}</p>
      </div>

      {/* Per-action XP breakdown */}
      <div className="space-y-3">
        <XPBar
          label="Pomodoro Sessions"
          icon="🍅"
          xp={breakdown.pomodoro}
          color="bg-rose-400"
          bg="bg-rose-50"
          rule={`${XP_WEIGHTS.POMODORO_SESSION} XP per session`}
        />
        <XPBar
          label="Note Taking"
          icon="📝"
          xp={breakdown.note}
          color="bg-amber-400"
          bg="bg-amber-50"
          rule={`${XP_WEIGHTS.NOTE_PER_500_WORDS} XP per 500 words`}
        />
        <XPBar
          label="Active Recall"
          icon="🧠"
          xp={breakdown.recall}
          color="bg-violet-400"
          bg="bg-violet-50"
          rule={`${XP_WEIGHTS.RECALL_PER_50_ITEMS} XP per 50 quiz items`}
        />
      </div>

      {/* Legend / how to earn */}
      <div className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
        <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">How XP works</p>
        <ul className="space-y-1 text-xs text-stone-500">
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Finish a pomodoro → <strong className="text-stone-700">+{XP_WEIGHTS.POMODORO_SESSION} XP</strong></li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Write 500 words in notes → <strong className="text-stone-700">+{XP_WEIGHTS.NOTE_PER_500_WORDS} XP</strong></li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Answer 50 recall items → <strong className="text-stone-700">+{XP_WEIGHTS.RECALL_PER_50_ITEMS} XP</strong></li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Every 100 XP → <strong className="text-stone-700">Level up 🎉</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default WeightProgress;