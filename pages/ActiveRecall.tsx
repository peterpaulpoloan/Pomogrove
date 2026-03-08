
import React, { useState } from 'react';
import { Plus, X, BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { Quiz, Flashcard } from '../types';

const ActiveRecall: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const createQuiz = () => {
    if (!newTitle.trim()) return;
    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: newTitle,
      cards: []
    };
    setQuizzes([...quizzes, newQuiz]);
    setNewTitle('');
    setIsCreating(false);
  };

  const addCard = () => {
    if (!activeQuiz || !newQuestion.trim() || !newAnswer.trim()) return;
    if (activeQuiz.cards.length >= 50) {
      alert("Max 50 cards per quiz reached.");
      return;
    }
    const newCard: Flashcard = {
      id: Date.now().toString(),
      question: newQuestion,
      answer: newAnswer
    };
    const updatedQuiz = { ...activeQuiz, cards: [...activeQuiz.cards, newCard] };
    setQuizzes(quizzes.map(q => q.id === activeQuiz.id ? updatedQuiz : q));
    setActiveQuiz(updatedQuiz);
    setNewQuestion('');
    setNewAnswer('');
  };

  const deleteQuiz = (id: string) => {
    setQuizzes(quizzes.filter(q => q.id !== id));
    if (activeQuiz?.id === id) setActiveQuiz(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Active Recall</h2>
          <p className="text-stone-500 font-medium">Test your knowledge with flashcard decks.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-all"
        >
          <Plus size={20} />
          Create Deck
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xl max-w-md animate-in fade-in zoom-in duration-300">
          <h3 className="text-xl font-bold mb-4">New Study Deck</h3>
          <input 
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Psychology 101, JavaScript Basics"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={createQuiz} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">Create</button>
            <button onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold">Cancel</button>
          </div>
        </div>
      )}

      {activeQuiz ? (
        <div className="space-y-8">
          <button 
            onClick={() => setActiveQuiz(null)}
            className="flex items-center gap-2 text-stone-500 font-bold hover:text-stone-900 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Decks
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Creator Panel */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{activeQuiz.title}</h3>
                <span className="text-stone-400 font-medium">{activeQuiz.cards.length}/50 cards</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1">Question</label>
                  <textarea 
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                    placeholder="Enter study question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1">Answer</label>
                  <textarea 
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                    placeholder="Enter correct answer..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                  />
                </div>
                <button 
                  onClick={addCard}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 transition-colors"
                >
                  <Save size={20} />
                  Add to Deck
                </button>
              </div>
            </div>

            {/* Study Panel */}
            <div className="space-y-6">
              {activeQuiz.cards.length > 0 ? (
                <>
                  <div className="bg-white h-[400px] rounded-3xl border-2 border-emerald-100 shadow-xl p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">
                      Card {currentCardIndex + 1} of {activeQuiz.cards.length}
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <h4 className="text-2xl font-bold text-stone-800 mb-8">
                        {activeQuiz.cards[currentCardIndex].question}
                      </h4>
                      
                      {showAnswer ? (
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 font-medium animate-in slide-in-from-bottom-2">
                          {activeQuiz.cards[currentCardIndex].answer}
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowAnswer(true)}
                          className="flex items-center gap-2 text-emerald-600 font-bold hover:bg-emerald-50 px-6 py-3 rounded-xl transition-all"
                        >
                          <Eye size={20} />
                          Reveal Answer
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between w-full mt-8">
                      <button 
                        onClick={() => {
                          setCurrentCardIndex((i) => Math.max(0, i - 1));
                          setShowAnswer(false);
                        }}
                        disabled={currentCardIndex === 0}
                        className="p-3 bg-stone-100 text-stone-600 rounded-full disabled:opacity-30"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="p-3 bg-stone-900 text-white rounded-full"
                      >
                        {showAnswer ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                      <button 
                        onClick={() => {
                          setCurrentCardIndex((i) => Math.min(activeQuiz.cards.length - 1, i + 1));
                          setShowAnswer(false);
                        }}
                        disabled={currentCardIndex === activeQuiz.cards.length - 1}
                        className="p-3 bg-stone-100 text-stone-600 rounded-full disabled:opacity-30"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white h-[400px] rounded-3xl border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400">
                  <BookOpen size={64} className="mb-4 opacity-20" />
                  <p className="font-bold">This deck is empty.</p>
                  <p className="text-sm">Start by adding your first card.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="group bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <button 
                  onClick={() => deleteQuiz(quiz.id)}
                  className="p-2 text-stone-300 hover:text-rose-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h4 className="text-xl font-bold mb-1">{quiz.title}</h4>
              <p className="text-stone-500 text-sm mb-6">{quiz.cards.length} Flashcards</p>
              <button 
                onClick={() => setActiveQuiz(quiz)}
                className="w-full py-3 bg-stone-50 text-stone-900 font-bold rounded-xl border border-stone-200 hover:bg-stone-900 hover:text-white transition-all"
              >
                Study Now
              </button>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="inline-block p-6 bg-stone-100 rounded-full text-stone-300">
                <BookOpen size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-stone-600">No decks yet</p>
                <p className="text-stone-400">Create your first study deck to start practicing active recall.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveRecall;
