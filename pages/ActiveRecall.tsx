import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, BookOpen, ChevronLeft, Trash2, Loader2,
  CheckCircle, XCircle, Trophy, RotateCcw, Sparkles, Send,
} from 'lucide-react';
import { Quiz, Flashcard, UserProfile } from '../types';
import { logActivity, ActivityEvent } from '../lib/activityLogger';
import { addXP, XPAction } from '../lib/xpSystem';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// ── Spaced Repetition Helpers ──────────────────────────────────────────────
interface SRCard extends Flashcard {
  interval: number;
  easeFactor: number;
  dueDate: number;
  timesWrong: number;
}

function smTwo(card: SRCard, quality: 0 | 1 | 2 | 3 | 4 | 5): SRCard {
  let { interval, easeFactor, timesWrong } = card;
  if (quality < 3) {
    interval = 1;
    timesWrong = timesWrong + 1;
  } else {
    if (interval === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }
  return { ...card, interval, easeFactor, timesWrong, dueDate: Date.now() + interval * 86400000 };
}

function toSRCard(card: Flashcard): SRCard {
  return { ...card, interval: 1, easeFactor: 2.5, dueDate: Date.now(), timesWrong: 0 };
}

function sortByPriority(cards: SRCard[]): SRCard[] {
  return [...cards].sort((a, b) => {
    if (b.timesWrong !== a.timesWrong) return b.timesWrong - a.timesWrong;
    return a.dueDate - b.dueDate;
  });
}

// ── AI Grading ─────────────────────────────────────────────────────────────
async function gradeAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
): Promise<{ correct: boolean; feedback: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a flashcard grading assistant. Grade whether the user's answer is correct.
Be lenient with phrasing, synonyms, and partial answers that show understanding.
Respond ONLY with valid JSON: {"correct": true/false, "feedback": "brief one-sentence explanation"}
No markdown, no extra text.`,
        messages: [{
          role: 'user',
          content: `Question: ${question}\nCorrect answer: ${correctAnswer}\nUser's answer: ${userAnswer}\n\nIs the user's answer correct?`,
        }],
      }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { correct: !!parsed.correct, feedback: parsed.feedback || '' };
  } catch {
    const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const correct =
      norm(userAnswer).includes(norm(correctAnswer)) ||
      norm(correctAnswer).includes(norm(userAnswer));
    return { correct, feedback: correct ? 'Answer matches.' : 'Answer does not match.' };
  }
}

// ── Types ──────────────────────────────────────────────────────────────────
type AppView = 'decks' | 'build' | 'quiz' | 'results';

interface QuizResult {
  card: SRCard;
  correct: boolean;
  userAnswer: string;
  feedback: string;
}

interface ActiveRecallProps {
  user: UserProfile;
}

// ── Component ──────────────────────────────────────────────────────────────
const ActiveRecall: React.FC<ActiveRecallProps> = ({ user }) => {
  const [view, setView] = useState<AppView>('decks');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [srCards, setSrCards] = useState<SRCard[]>([]);

  // Build view state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Quiz view state
  const [quizQueue, setQuizQueue] = useState<SRCard[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load quizzes ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/quizzes/${user.uid}`);
        if (res.ok) setQuizzes(await res.json());
      } catch { console.warn('Could not load quizzes.'); }
      finally { setIsLoading(false); }
    };
    fetchQuizzes();
  }, [user.uid]);

  // Auto-focus answer input when card changes
  useEffect(() => {
    if (view === 'quiz' && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [quizIndex, view]);

  // ── SR state helpers ──────────────────────────────────────────────────────
  const getSRKey = (quizId: string) => `sr_${user.uid}_${quizId}`;

  const loadSR = (quiz: Quiz): SRCard[] => {
    const saved = localStorage.getItem(getSRKey(quiz.id));
    if (saved) {
      const savedMap: Record<string, SRCard> = JSON.parse(saved);
      return quiz.cards.map(c => (savedMap[c.id] ? savedMap[c.id] : toSRCard(c)));
    }
    return quiz.cards.map(toSRCard);
  };

  const saveSR = (quizId: string, cards: SRCard[]) => {
    const map: Record<string, SRCard> = {};
    cards.forEach(c => (map[c.id] = c));
    localStorage.setItem(getSRKey(quizId), JSON.stringify(map));
  };

  // ── Deck creation ─────────────────────────────────────────────────────────
  const createDeck = async () => {
    if (!newTitle.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/quizzes/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        const saved = await res.json();
        setQuizzes([...quizzes, saved]);
        setActiveQuiz(saved);
        setView('build');
      }
    } catch {
      const newQuiz: Quiz = { id: Date.now().toString(), title: newTitle, cards: [] };
      setQuizzes([...quizzes, newQuiz]);
      setActiveQuiz(newQuiz);
      setView('build');
    } finally {
      setNewTitle('');
      setIsCreatingDeck(false);
      setIsSaving(false);
    }
  };

  // ── Card creation ─────────────────────────────────────────────────────────
  const addCard = async () => {
    if (!activeQuiz || !newQuestion.trim() || !newAnswer.trim()) return;
    if (activeQuiz.cards.length >= 50) { alert('Max 50 cards per deck.'); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/quizzes/${user.uid}/${activeQuiz.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
      });
      if (res.ok) {
        const newCard: Flashcard = await res.json();
        const updated = { ...activeQuiz, cards: [...activeQuiz.cards, newCard] };
        setQuizzes(quizzes.map(q => (q.id === activeQuiz.id ? updated : q)));
        setActiveQuiz(updated);
      }
    } catch {
      const newCard: Flashcard = { id: Date.now().toString(), question: newQuestion, answer: newAnswer };
      const updated = { ...activeQuiz, cards: [...activeQuiz.cards, newCard] };
      setQuizzes(quizzes.map(q => (q.id === activeQuiz.id ? updated : q)));
      setActiveQuiz(updated);
    } finally {
      setNewQuestion('');
      setNewAnswer('');
      setIsSaving(false);
    }
  };

  // ── Delete card ───────────────────────────────────────────────────────────
  const deleteCard = async (cardId: string) => {
    if (!activeQuiz) return;
    const updated = { ...activeQuiz, cards: activeQuiz.cards.filter(c => c.id !== cardId) };
    setQuizzes(quizzes.map(q => (q.id === activeQuiz.id ? updated : q)));
    setActiveQuiz(updated);
    try {
      await fetch(`${API_BASE}/quizzes/${user.uid}/${activeQuiz.id}/cards/${cardId}`, { method: 'DELETE' });
    } catch { console.warn('Card delete sync failed.'); }
  };

  // ── Delete deck ───────────────────────────────────────────────────────────
  const deleteDeck = async (id: string) => {
    setQuizzes(quizzes.filter(q => q.id !== id));
    try { await fetch(`${API_BASE}/quizzes/${user.uid}/${id}`, { method: 'DELETE' }); }
    catch { console.warn('Delete sync failed.'); }
  };

  // ── Start quiz ────────────────────────────────────────────────────────────
  const startQuiz = (quiz: Quiz) => {
    if (quiz.cards.length === 0) { alert('Add at least one card first.'); return; }
    const sr = loadSR(quiz);
    setSrCards(sr);
    setActiveQuiz(quiz);
    const prioritized = sortByPriority(sr);
    setQuizQueue(prioritized);
    setQuizIndex(0);
    setUserAnswer('');
    setGradingResult(null);
    setResults([]);
    setView('quiz');
  };

  // ── Submit answer for grading ─────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!userAnswer.trim() || isGrading) return;
    const current = quizQueue[quizIndex];
    setIsGrading(true);
    const result = await gradeAnswer(current.question, current.answer, userAnswer);
    setGradingResult(result);
    setIsGrading(false);
  };

  // ── Shared advance logic ───────────────────────────────────────────────────
  // Activity is logged once per card answered (matches logActivity('quiz') semantics).
  // XP is only awarded once when the full session ends (view transitions to 'results'),
  // using the total card count so the ActivityCalendar stays in sync.
  const advance = (correct: boolean, feedback: string) => {
    const current = quizQueue[quizIndex];
    const quality: 0 | 5 = correct ? 5 : 0;
    const updated = smTwo(current, quality);

    const newSR = srCards.map(c => (c.id === current.id ? updated : c));
    setSrCards(newSR);
    if (activeQuiz) saveSR(activeQuiz.id, newSR);

    // Log one 'quiz' activity entry per card answered — this is what
    // ActivityCalendar counts as "Recall Sets" via loadActivity().
    logActivity(user.uid, 'quiz' as ActivityEvent);

    const newResults: QuizResult[] = [
      ...results,
      { card: current, correct, userAnswer, feedback },
    ];
    setResults(newResults);

    const isLast = quizIndex + 1 >= quizQueue.length;

    if (isLast) {
      // Award XP once per session, based on total cards completed.
      addXP(user.uid, { type: 'recall', itemCount: newResults.length } as XPAction);
      setView('results');
    } else {
      setQuizIndex(quizIndex + 1);
      setUserAnswer('');
      setGradingResult(null);
    }
  };

  const confirmAndAdvance = () => {
    if (!gradingResult) return;
    advance(gradingResult.correct, gradingResult.feedback);
  };

  const overrideAndAdvance = (correct: boolean) => {
    advance(correct, gradingResult?.feedback || '');
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const score = results.filter(r => r.correct).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  // ── DECKS VIEW ────────────────────────────────────────────────────────────
  if (view === 'decks') return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Active Recall</h2>
          <p className="text-stone-500 font-medium">Spaced repetition flashcard decks.</p>
        </div>
        <button
          onClick={() => setIsCreatingDeck(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-all"
        >
          <Plus size={20} /> New Deck
        </button>
      </div>

      {isCreatingDeck && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xl max-w-md">
          <h3 className="text-xl font-bold mb-4">Name your deck</h3>
          <input
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Biology Chapter 3, JavaScript Basics"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createDeck()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={createDeck}
              disabled={isSaving}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Create &amp; Add Cards
            </button>
            <button
              onClick={() => setIsCreatingDeck(false)}
              className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-32 text-stone-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => {
            const sr = loadSR(quiz);
            const dueCount = sr.filter(c => c.dueDate <= Date.now()).length;
            const wrongCount = sr.filter(c => c.timesWrong > 0).length;
            return (
              <div
                key={quiz.id}
                className="group bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BookOpen size={24} />
                  </div>
                  <button
                    onClick={() => deleteDeck(quiz.id)}
                    className="p-2 text-stone-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h4 className="text-xl font-bold mb-1">{quiz.title}</h4>
                <p className="text-stone-500 text-sm mb-2">{quiz.cards.length} cards</p>
                {wrongCount > 0 && (
                  <p className="text-xs text-rose-500 font-bold mb-1">
                    ⚠ {wrongCount} card{wrongCount > 1 ? 's' : ''} need review
                  </p>
                )}
                {dueCount > 0 && (
                  <p className="text-xs text-amber-500 font-bold mb-3">📅 {dueCount} due today</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setActiveQuiz(quiz); setView('build'); }}
                    className="flex-1 py-2.5 bg-stone-50 text-stone-700 font-bold rounded-xl border border-stone-200 hover:bg-stone-100 transition-all text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="flex-1 py-2.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all text-sm"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            );
          })}

          {quizzes.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="inline-block p-6 bg-stone-100 rounded-full text-stone-300">
                <BookOpen size={48} />
              </div>
              <p className="text-xl font-bold text-stone-600">No decks yet</p>
              <p className="text-stone-400">Create your first deck to start studying</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── BUILD VIEW ────────────────────────────────────────────────────────────
  if (view === 'build') return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('decks')}
          className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{activeQuiz?.title}</h2>
          <p className="text-stone-400 text-sm">{activeQuiz?.cards.length ?? 0} cards</p>
        </div>
      </div>

      {/* Add card form */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-bold text-stone-700 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" /> Add a card
        </h3>
        <input
          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          placeholder="Question"
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
        />
        <textarea
          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
          placeholder="Answer"
          rows={3}
          value={newAnswer}
          onChange={e => setNewAnswer(e.target.value)}
        />
        <button
          onClick={addCard}
          disabled={isSaving || !newQuestion.trim() || !newAnswer.trim()}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition-colors"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add Card
        </button>
      </div>

      {/* Card list */}
      <div className="space-y-3">
        {(activeQuiz?.cards ?? []).map((card, i) => (
          <div
            key={card.id}
            className="bg-white p-4 rounded-2xl border border-stone-200 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-400 uppercase mb-1">Q{i + 1}</p>
              <p className="text-sm font-semibold text-stone-800 mb-1">{card.question}</p>
              <p className="text-sm text-stone-500">{card.answer}</p>
            </div>
            <button
              onClick={() => deleteCard(card.id)}
              className="p-1.5 text-stone-300 hover:text-rose-500 transition-colors flex-shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {(activeQuiz?.cards.length ?? 0) > 0 && (
        <button
          onClick={() => activeQuiz && startQuiz(activeQuiz)}
          className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
        >
          Start Quiz →
        </button>
      )}
    </div>
  );

  // ── QUIZ VIEW ─────────────────────────────────────────────────────────────
  if (view === 'quiz') {
    const current = quizQueue[quizIndex];
    const progress = ((quizIndex) / quizQueue.length) * 100;

    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('decks')}
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <p className="text-sm text-stone-400 font-medium">{activeQuiz?.title}</p>
            <p className="text-xs text-stone-400">
              Card {quizIndex + 1} of {quizQueue.length}
            </p>
          </div>
          <span className="text-sm font-bold text-stone-500">{Math.round(progress)}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Question</p>
          <p className="text-xl font-semibold text-stone-900">{current.question}</p>
        </div>

        {/* Answer input */}
        {!gradingResult && (
          <div className="space-y-3">
            <textarea
              ref={answerInputRef}
              className="w-full p-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-stone-800"
              placeholder="Type your answer…"
              rows={4}
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer();
              }}
            />
            <button
              onClick={submitAnswer}
              disabled={isGrading || !userAnswer.trim()}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-600 transition-colors"
            >
              {isGrading
                ? <><Loader2 size={16} className="animate-spin" /> Grading…</>
                : <><Send size={16} /> Submit Answer</>}
            </button>
          </div>
        )}

        {/* Grading result */}
        {gradingResult && (
          <div className={`p-6 rounded-2xl border-2 space-y-4 ${
            gradingResult.correct
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {gradingResult.correct
                ? <CheckCircle size={20} className="text-emerald-600" />
                : <XCircle size={20} className="text-rose-500" />}
              <span className={`font-bold ${gradingResult.correct ? 'text-emerald-700' : 'text-rose-600'}`}>
                {gradingResult.correct ? 'Correct!' : 'Not quite'}
              </span>
            </div>

            {gradingResult.feedback && (
              <p className="text-sm text-stone-600">{gradingResult.feedback}</p>
            )}

            {!gradingResult.correct && (
              <div className="bg-white/70 rounded-xl p-3">
                <p className="text-xs font-bold text-stone-400 uppercase mb-1">Correct answer</p>
                <p className="text-sm text-stone-800">{current.answer}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmAndAdvance}
                className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
              >
                Continue →
              </button>
              {/* Manual override if AI graded incorrectly */}
              {!gradingResult.correct && (
                <button
                  onClick={() => overrideAndAdvance(true)}
                  className="px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors"
                  title="Mark as correct"
                >
                  <CheckCircle size={16} />
                </button>
              )}
              {gradingResult.correct && (
                <button
                  onClick={() => overrideAndAdvance(false)}
                  className="px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors"
                  title="Mark as wrong"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RESULTS VIEW ──────────────────────────────────────────────────────────
  if (view === 'results') {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {/* Score summary */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-3xl border border-emerald-100 text-center space-y-2">
          <Trophy size={40} className="mx-auto text-emerald-500" />
          <h2 className="text-3xl font-black text-stone-900">{pct}%</h2>
          <p className="text-stone-500 font-medium">
            {score} / {total} correct
          </p>
          {pct >= 80 && <p className="text-emerald-600 font-bold text-sm">🎉 Great work!</p>}
          {pct < 80 && pct >= 50 && <p className="text-amber-600 font-bold text-sm">Keep practising!</p>}
          {pct < 50 && <p className="text-rose-500 font-bold text-sm">Review the cards and try again.</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => activeQuiz && startQuiz(activeQuiz)}
            className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
          >
            <RotateCcw size={16} /> Retry
          </button>
          <button
            onClick={() => setView('decks')}
            className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-colors"
          >
            All Decks
          </button>
        </div>

        {/* Per-card breakdown */}
        <div className="space-y-3">
          <h3 className="font-bold text-stone-700">Review</h3>
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border ${
                r.correct ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
              }`}
            >
              <div className="flex items-start gap-2">
                {r.correct
                  ? <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  : <XCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 mb-1">{r.card.question}</p>
                  <p className="text-xs text-stone-500 mb-1">
                    <span className="font-bold">Your answer:</span> {r.userAnswer}
                  </p>
                  {!r.correct && (
                    <p className="text-xs text-stone-500">
                      <span className="font-bold">Correct:</span> {r.card.answer}
                    </p>
                  )}
                  {r.feedback && (
                    <p className="text-xs text-stone-400 mt-1 italic">{r.feedback}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default ActiveRecall;