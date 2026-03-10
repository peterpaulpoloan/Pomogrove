import React, { useState, useEffect, useRef } from 'react';
import { Plus, BookOpen, ChevronLeft, Eye, Trash2, Loader2, CheckCircle, XCircle, Trophy, RotateCcw, Sparkles, Send } from 'lucide-react';
import { Quiz, Flashcard, UserProfile } from '../types';

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
async function gradeAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{ correct: boolean; feedback: string }> {
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
          content: `Question: ${question}\nCorrect answer: ${correctAnswer}\nUser's answer: ${userAnswer}\n\nIs the user's answer correct?`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { correct: !!parsed.correct, feedback: parsed.feedback || '' };
  } catch {
    // Fallback: simple string match
    const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const correct = norm(userAnswer).includes(norm(correctAnswer)) || norm(correctAnswer).includes(norm(userAnswer));
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
      return quiz.cards.map(c => savedMap[c.id] ? savedMap[c.id] : toSRCard(c));
    }
    return quiz.cards.map(toSRCard);
  };

  const saveSR = (quizId: string, cards: SRCard[]) => {
    const map: Record<string, SRCard> = {};
    cards.forEach(c => map[c.id] = c);
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
        setQuizzes(quizzes.map(q => q.id === activeQuiz.id ? updated : q));
        setActiveQuiz(updated);
      }
    } catch {
      const newCard: Flashcard = { id: Date.now().toString(), question: newQuestion, answer: newAnswer };
      const updated = { ...activeQuiz, cards: [...activeQuiz.cards, newCard] };
      setQuizzes(quizzes.map(q => q.id === activeQuiz.id ? updated : q));
      setActiveQuiz(updated);
    } finally {
      setNewQuestion('');
      setNewAnswer('');
      setIsSaving(false);
    }
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

  // ── Confirm result and advance ────────────────────────────────────────────
  const confirmAndAdvance = () => {
    if (!gradingResult) return;
    const current = quizQueue[quizIndex];
    const quality: 0 | 5 = gradingResult.correct ? 5 : 0;
    const updated = smTwo(current, quality);

    const newSR = srCards.map(c => c.id === current.id ? updated : c);
    setSrCards(newSR);
    if (activeQuiz) saveSR(activeQuiz.id, newSR);

    setResults([...results, { card: current, correct: gradingResult.correct, userAnswer, feedback: gradingResult.feedback }]);

    if (quizIndex + 1 >= quizQueue.length) {
      setView('results');
    } else {
      setQuizIndex(quizIndex + 1);
      setUserAnswer('');
      setGradingResult(null);
    }
  };

  // Allow overriding AI grade
  const overrideAndAdvance = (correct: boolean) => {
    const current = quizQueue[quizIndex];
    const quality: 0 | 5 = correct ? 5 : 0;
    const updated = smTwo(current, quality);

    const newSR = srCards.map(c => c.id === current.id ? updated : c);
    setSrCards(newSR);
    if (activeQuiz) saveSR(activeQuiz.id, newSR);

    setResults([...results, { card: current, correct, userAnswer, feedback: gradingResult?.feedback || '' }]);

    if (quizIndex + 1 >= quizQueue.length) {
      setView('results');
    } else {
      setQuizIndex(quizIndex + 1);
      setUserAnswer('');
      setGradingResult(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const score = results.filter(r => r.correct).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  // ── Views ─────────────────────────────────────────────────────────────────

  // DECKS VIEW
  if (view === 'decks') return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Active Recall</h2>
          <p className="text-stone-500 font-medium">Spaced repetition flashcard decks.</p>
        </div>
        <button onClick={() => setIsCreatingDeck(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-all">
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
            <button onClick={createDeck} disabled={isSaving}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null} Create & Add Cards
            </button>
            <button onClick={() => setIsCreatingDeck(false)}
              className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold">Cancel</button>
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
              <div key={quiz.id} className="group bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BookOpen size={24} />
                  </div>
                  <button onClick={() => deleteDeck(quiz.id)} className="p-2 text-stone-300 hover:text-rose-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <h4 className="text-xl font-bold mb-1">{quiz.title}</h4>
                <p className="text-stone-500 text-sm mb-2">{quiz.cards.length} cards</p>
                {wrongCount > 0 && (
                  <p className="text-xs text-rose-500 font-bold mb-1">⚠ {wrongCount} card{wrongCount > 1 ? 's' : ''} need review</p>
                )}
                {dueCount > 0 && (
                  <p className="text-xs text-amber-500 font-bold mb-3">📅 {dueCount} due today</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setActiveQuiz(quiz); setView('build'); }}
                    className="flex-1 py-2.5 bg-stone-50 text-stone-700 font-bold rounded-xl border border-stone-200 hover:bg-stone-100 transition-all text-sm">
                    Edit
                  </button>
                  <button onClick={() => startQuiz(quiz)}
                    className="flex-1 py-2.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all text-sm">
                    Start Quiz
                  </button>
                </div>
              </div>
            );
          })}
          {quizzes.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="inline-block p-6 bg-stone-100 rounded-full text-stone-300"><BookOpen size={48} /></div>
              <p className="text-xl font-bold text-stone-600">No decks yet</p>
              <p className="text-stone-400">Create your first deck to start studying.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // BUILD VIEW
  if (view === 'build' && activeQuiz) return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => setView('decks')} className="flex items-center gap-2 text-stone-500 font-bold hover:text-stone-900 transition-colors">
          <ChevronLeft size={20} /> Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{activeQuiz.title}</h2>
          <p className="text-stone-500 text-sm">{activeQuiz.cards.length}/50 cards</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5">
        <h3 className="text-lg font-bold text-stone-700">Add a Card</h3>
        <div>
          <label className="block text-sm font-bold text-stone-500 mb-1">Question</label>
          <textarea
            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] resize-none"
            placeholder="What do you want to remember?"
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-stone-500 mb-1">Answer</label>
          <textarea
            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] resize-none"
            placeholder="The correct answer..."
            value={newAnswer}
            onChange={e => setNewAnswer(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={addCard} disabled={isSaving || !newQuestion.trim() || !newAnswer.trim()}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-40">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />} Add Card
          </button>
          <button onClick={() => setView('decks')}
            className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-colors">
            Done
          </button>
        </div>
      </div>

      {activeQuiz.cards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">{activeQuiz.cards.length} Cards in this deck</h3>
          {activeQuiz.cards.map((card, i) => (
            <div key={card.id} className="bg-white p-5 rounded-2xl border border-stone-200 flex gap-6">
              <span className="text-stone-300 font-bold text-sm w-6 shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase mb-1">Question</p>
                  <p className="text-stone-800 font-medium">{card.question}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Answer</p>
                  <p className="text-stone-600">{card.answer}</p>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => startQuiz(activeQuiz)}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mt-4">
            <Sparkles size={20} /> Start Quiz Now
          </button>
        </div>
      )}
    </div>
  );

  // QUIZ VIEW
  if (view === 'quiz' && quizQueue.length > 0) {
    const current = quizQueue[quizIndex];
    const progressPct = Math.round((quizIndex / quizQueue.length) * 100);

    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center max-w-2xl mx-auto">
        {/* Header */}
        <div className="w-full mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setView('decks')} className="text-stone-400 hover:text-stone-700 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-stone-500">{quizIndex + 1} / {quizQueue.length}</span>
            <div className="w-6" />
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-2 bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          {current.timesWrong > 0 && (
            <p className="text-xs text-rose-500 font-bold text-center">⚠ You've missed this card {current.timesWrong} time{current.timesWrong > 1 ? 's' : ''} before</p>
          )}
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-3xl border-2 border-stone-100 shadow-xl p-8 md:p-10 space-y-6">
          <div className="text-center">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Question</p>
            <h3 className="text-2xl font-bold text-stone-900 leading-snug">{current.question}</h3>
          </div>

          {/* Answer input area */}
          {!gradingResult ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Your Answer</label>
              <div className="relative">
                <textarea
                  ref={answerInputRef}
                  className="w-full p-4 pr-14 bg-stone-50 border-2 border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 min-h-[100px] resize-none text-stone-800 font-medium transition-all"
                  placeholder="Type your answer here..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer();
                  }}
                  disabled={isGrading}
                />
                <button
                  onClick={submitAnswer}
                  disabled={!userAnswer.trim() || isGrading}
                  className="absolute bottom-3 right-3 p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGrading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="text-xs text-stone-400 text-right">Press ⌘+Enter or click Send to submit</p>
            </div>
          ) : (
            /* Grading result */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* User's answer */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Your Answer</p>
                <p className="text-stone-700 font-medium">{userAnswer}</p>
              </div>

              {/* Correct answer */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Correct Answer</p>
                <p className="text-emerald-900 font-semibold">{current.answer}</p>
              </div>

              {/* AI verdict */}
              <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${gradingResult.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                {gradingResult.correct
                  ? <CheckCircle size={22} className="text-emerald-500 shrink-0 mt-0.5" />
                  : <XCircle size={22} className="text-rose-500 shrink-0 mt-0.5" />}
                <div>
                  <p className={`font-bold text-sm ${gradingResult.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {gradingResult.correct ? 'Correct!' : 'Not quite right'}
                  </p>
                  {gradingResult.feedback && (
                    <p className="text-xs text-stone-500 mt-1">{gradingResult.feedback}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={confirmAndAdvance}
                  className={`w-full py-3.5 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${gradingResult.correct ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                >
                  {quizIndex + 1 >= quizQueue.length ? 'See Results' : 'Next Card →'}
                </button>

                {/* Override option */}
                <div className="flex gap-2">
                  <p className="text-xs text-stone-400 flex items-center">AI got it wrong?</p>
                  <button
                    onClick={() => overrideAndAdvance(!gradingResult.correct)}
                    className="text-xs text-stone-500 underline hover:text-stone-700 transition-colors"
                  >
                    Mark as {gradingResult.correct ? 'incorrect' : 'correct'} instead
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULTS VIEW
  if (view === 'results') return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center max-w-2xl mx-auto space-y-8">
      <div className="w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-10 text-center space-y-4">
        <div className={`inline-flex p-5 rounded-full mb-2 ${pct >= 80 ? 'bg-emerald-50 text-emerald-500' : pct >= 50 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
          <Trophy size={40} />
        </div>
        <h2 className="text-4xl font-black text-stone-900">{pct}%</h2>
        <p className="text-stone-500 font-medium">
          {score} of {total} correct — {pct >= 80 ? '🌿 Excellent work!' : pct >= 50 ? '📚 Keep practicing!' : '💪 Review and try again!'}
        </p>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
          <div className={`h-3 rounded-full transition-all duration-1000 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
            style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-stone-400 font-medium">Spaced repetition updated — wrong cards will be prioritized next session.</p>
      </div>

      <div className="w-full space-y-3">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Card Breakdown</h3>
        {results.map((r, i) => (
          <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 ${r.correct ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            {r.correct ? <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" /> : <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />}
            <div className="flex-1 space-y-1">
              <p className="font-bold text-stone-800 text-sm">{r.card.question}</p>
              <p className="text-xs text-stone-500">Your answer: <span className="text-stone-700">{r.userAnswer}</span></p>
              {!r.correct && <p className="text-xs text-emerald-700">Correct: {r.card.answer}</p>}
              {r.feedback && <p className="text-xs text-stone-400 italic">{r.feedback}</p>}
              {r.card.timesWrong > 0 && !r.correct && (
                <p className="text-xs text-rose-400">Missed {r.card.timesWrong} time{r.card.timesWrong > 1 ? 's' : ''} total</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full flex gap-3">
        <button onClick={() => activeQuiz && startQuiz(activeQuiz)}
          className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
          <RotateCcw size={18} /> Quiz Again
        </button>
        <button onClick={() => setView('decks')}
          className="flex-1 py-4 bg-stone-100 text-stone-700 font-bold rounded-2xl hover:bg-stone-200 transition-colors">
          Back to Decks
        </button>
      </div>
    </div>
  );

  return null;
};

export default ActiveRecall;