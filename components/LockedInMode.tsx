import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Unlock, X } from 'lucide-react';

// ── Guilt-trip quote pools ────────────────────────────────────────────────
const SWITCH_QUOTES = [
  "The person you'll be in 5 years is built by what you do right now.",
  "Distraction is the assassin of potential. You're letting it win.",
  "Every tab you open is a dream you're choosing not to chase.",
  "Your future self is watching. They look disappointed.",
  "Champions don't switch tabs. They switch levels.",
  "You were so close. The breakthrough was literally next.",
  "That 'quick check' has stolen more futures than failure ever has.",
  "The difference between you and the person you admire? They stayed.",
  "Greatness doesn't take breaks. Neither does regret.",
  "You're one distraction away from giving up on yourself again.",
];

const CLOSE_QUOTES = [
  "Quitters never remember the moment they almost made it.",
  "Closing this tab won't close the gap between who you are and who you want to be.",
  "You're not tired. You're just afraid of what happens if you keep going.",
  "The version of you that succeeds didn't close the tab.",
  "One day you'll wish you had the discipline you're throwing away right now.",
  "Every time you quit, it gets easier to quit. Is that who you're becoming?",
  "Your dreams don't close. But you just did.",
  "The only thing standing between you and your goal is the story you keep telling yourself.",
  "Stopping now means starting over later. You hate starting over.",
  "Walk away today, and tomorrow you'll have to fight twice as hard to come back.",
];

function randomFrom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Types ─────────────────────────────────────────────────────────────────
type ModalKind = 'switch' | 'close' | null;

interface LockedInModeProps {
  /** Called when lock is toggled so parent can update its own state if needed */
  onLockChange?: (locked: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────
const LockedInMode: React.FC<LockedInModeProps> = ({ onLockChange }) => {
  const [locked, setLocked] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [inputValue, setInputValue] = useState('');
  const [shakeInput, setShakeInput] = useState(false);
  const [quote, setQuote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Required phrases (lowercase for comparison)
  const REQUIRED = {
    switch: 'yes i want to switch tab because iam distracted and lazy',
    close:  'yes i want to quit because iam a quitter and a loser',
  };

  // ── Block tab/window events when locked ──────────────────────────────────
  useEffect(() => {
    if (!locked) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setQuote(randomFrom(SWITCH_QUOTES));
        setModal('switch');
        setInputValue('');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      setQuote(randomFrom(CLOSE_QUOTES));
      setModal('close');
      setInputValue('');
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [locked]);

  // Focus input when modal opens
  useEffect(() => {
    if (modal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [modal]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    onLockChange?.(next);
  };

  const handleConfirm = useCallback(() => {
    if (!modal) return;
    const typed = inputValue.trim().toLowerCase();
    const required = REQUIRED[modal];
    if (typed === required) {
      // They typed it — allow the action, unlock mode
      setLocked(false);
      onLockChange?.(false);
      setModal(null);
      setInputValue('');
    } else {
      // Wrong — shake and clear
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 600);
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [modal, inputValue, onLockChange]);

  const handleStay = useCallback(() => {
    setModal(null);
    setInputValue('');
  }, []);

  const currentRequired = modal ? REQUIRED[modal] : '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toggle button (fixed corner) ───────────────────────────────── */}
      <button
        onClick={toggleLock}
        title={locked ? 'Locked In Mode — click to unlock' : 'Enable Locked In Mode'}
        className={`
          fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl
          font-bold text-sm shadow-xl border transition-all duration-300 select-none
          ${locked
            ? 'bg-emerald-900 text-emerald-300 border-emerald-700 hover:bg-emerald-800 shadow-emerald-900/40'
            : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-800 hover:border-stone-300'}
        `}
      >
        {locked
          ? <><Lock size={15} className="text-emerald-400" /> Locked In</>
          : <><Unlock size={15} /> Lock In</>}
        {locked && (
          <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </button>

      {/* ── Confirmation modal ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
             style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}>
          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
          >
            {/* Red top bar */}
            <div className={`h-1 w-full ${modal === 'close' ? 'bg-rose-600' : 'bg-amber-500'}`} />

            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="space-y-1">
                <p className={`text-xs font-black uppercase tracking-widest ${modal === 'close' ? 'text-rose-500' : 'text-amber-400'}`}>
                  {modal === 'close' ? '⚠ You\'re about to quit' : '⚠ Trying to leave?'}
                </p>
                <h2 className="text-xl font-black text-white leading-tight">
                  {modal === 'close'
                    ? 'Are you sure you want to exit?'
                    : 'Are you sure you want to switch tabs?'}
                </h2>
              </div>

              {/* Guilt quote */}
              <div className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2e2e2e' }}>
                <p className="text-stone-300 text-sm leading-relaxed italic">"{quote}"</p>
              </div>

              {/* Instruction */}
              <div className="space-y-3">
                <p className="text-stone-400 text-xs leading-relaxed">
                  To proceed, type exactly:
                </p>
                <p className={`text-xs font-mono px-3 py-2 rounded-xl leading-relaxed ${
                  modal === 'close'
                    ? 'bg-rose-950/50 text-rose-300 border border-rose-900'
                    : 'bg-amber-950/50 text-amber-300 border border-amber-900'
                }`}>
                  {currentRequired}
                </p>

                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                  placeholder="Type here…"
                  spellCheck={false}
                  autoComplete="off"
                  className={`
                    w-full px-4 py-3 rounded-xl text-sm text-white outline-none
                    transition-all duration-150 placeholder:text-stone-600
                    ${shakeInput ? 'animate-[shake_0.5s_ease-in-out]' : ''}
                  `}
                  style={{
                    background: '#1e1e1e',
                    border: `1px solid ${shakeInput ? '#f43f5e' : '#333'}`,
                    boxShadow: shakeInput ? '0 0 0 2px #f43f5e33' : 'none',
                  }}
                />

                {/* Match progress indicator */}
                {inputValue.length > 0 && (
                  <p className="text-[10px] text-stone-600">
                    {inputValue.trim().toLowerCase() === currentRequired
                      ? <span className="text-emerald-500 font-bold">✓ Phrase matched — press Enter or click confirm</span>
                      : `${inputValue.trim().length} / ${currentRequired.length} characters`}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleStay}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-emerald-400 transition-all hover:bg-emerald-950/60"
                  style={{ border: '1px solid #1a3d2e', background: '#0d2218' }}
                >
                  ← Stay & Focus
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={inputValue.trim().toLowerCase() !== currentRequired}
                  className={`
                    flex-1 py-3 rounded-xl font-black text-sm transition-all
                    ${inputValue.trim().toLowerCase() === currentRequired
                      ? modal === 'close'
                        ? 'bg-rose-700 text-white hover:bg-rose-600'
                        : 'bg-amber-600 text-white hover:bg-amber-500'
                      : 'bg-stone-800 text-stone-600 cursor-not-allowed'}
                  `}
                >
                  {modal === 'close' ? 'Quit anyway' : 'Switch anyway'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Shake keyframe ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-6px); }
          30%       { transform: translateX(6px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
      `}</style>
    </>
  );
};

export default LockedInMode;