import { useState } from "react";
import { useQuizzes, useCreateQuiz, useDeleteQuiz, useCheckAnswer } from "@/hooks/use-quizzes";
import { Plus, Play, Trash2, BrainCircuit, Check, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Quiz } from "@shared/schema";

export default function Flashcards() {
  const { data: quizzes, isLoading } = useQuizzes();
  const { mutate: deleteQuiz } = useDeleteQuiz();
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  return (
    <div className="space-y-8">
      {activeQuiz ? (
        <QuizRunner quiz={activeQuiz} onExit={() => setActiveQuiz(null)} />
      ) : (
        <>
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-display font-bold">Flashcards</h1>
                <p className="text-muted-foreground">Master concepts with active recall</p>
             </div>
             <CreateQuizButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes?.map((quiz) => (
              <div key={quiz.id} className="group bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <BrainCircuit className="w-6 h-6" />
                   </div>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                       if (confirm("Delete this quiz set?")) deleteQuiz(quiz.id);
                    }}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                </div>
                
                <h3 className="font-bold text-xl mb-2">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                  {quiz.description || "No description provided."}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                   <span className="text-sm font-medium bg-secondary px-3 py-1 rounded-full text-secondary-foreground">
                      {quiz.questions.length} cards
                   </span>
                   <Button onClick={() => setActiveQuiz(quiz)} className="gap-2">
                      <Play className="w-4 h-4" /> Study
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuizRunner({ quiz, onExit }: { quiz: Quiz, onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{correct: boolean, feedback: string} | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  
  const { mutate: checkAnswer, isPending: isChecking } = useCheckAnswer();

  const currentCard = quiz.questions[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setAiFeedback(null);
    setUserAnswer("");
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of quiz logic here
      alert("Quiz completed!");
      onExit();
    }
  };

  const handleCheck = () => {
    checkAnswer({ 
      question: currentCard.question, 
      userAnswer: userAnswer, 
      correctAnswer: currentCard.answer 
    }, {
      onSuccess: (data) => setAiFeedback(data)
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" onClick={onExit}>← Back to Sets</Button>
        <span className="font-mono text-sm text-muted-foreground">
          {currentIndex + 1} / {quiz.questions.length}
        </span>
      </div>

      <div className="perspective-1000 min-h-[400px] relative mb-8">
        <motion.div 
          className="w-full h-full relative preserve-3d transition-transform duration-500 cursor-pointer"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          onClick={() => !isChecking && setIsFlipped(!isFlipped)}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
           {/* Front */}
           <div className="absolute inset-0 backface-hidden bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
             <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Question</span>
             <h2 className="text-2xl font-bold">{currentCard.question}</h2>
             <p className="mt-8 text-sm text-muted-foreground animate-pulse">Click to reveal answer</p>
           </div>

           {/* Back */}
           <div 
             className="absolute inset-0 backface-hidden bg-primary text-primary-foreground rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl"
             style={{ transform: "rotateY(180deg)" }}
           >
             <span className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-4 font-bold">Answer</span>
             <h2 className="text-2xl font-bold">{currentCard.answer}</h2>
           </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        {aiFeedback ? (
          <div className={`p-4 rounded-xl border ${aiFeedback.correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
             <div className="flex items-center gap-2 font-bold mb-1">
               {aiFeedback.correct ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
               {aiFeedback.correct ? "Correct!" : "Incorrect"}
             </div>
             <p className="text-sm opacity-90">{aiFeedback.feedback}</p>
          </div>
        ) : (
          <div className="flex gap-2">
             <Input 
               value={userAnswer} 
               onChange={(e) => setUserAnswer(e.target.value)} 
               placeholder="Type your answer to check with AI..."
               className="h-12 text-lg"
             />
             <Button size="lg" onClick={handleCheck} disabled={!userAnswer || isChecking} className="px-6">
                {isChecking ? <RotateCw className="w-5 h-5 animate-spin" /> : "Check"}
             </Button>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-4">
           <Button variant="outline" size="lg" onClick={() => setIsFlipped(!isFlipped)}>
             Flip Card
           </Button>
           <Button size="lg" onClick={handleNext}>
             Next Card
           </Button>
        </div>
      </div>
    </div>
  );
}

function CreateQuizButton() {
  const [open, setOpen] = useState(false);
  const { mutate: createQuiz, isPending } = useCreateQuiz();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<{question: string, answer: string}[]>([{ question: "", answer: "" }]);

  const addPair = () => setQuestions([...questions, { question: "", answer: "" }]);
  
  const updatePair = (index: number, field: "question" | "answer", value: string) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const handleCreate = () => {
     createQuiz({ title, description, questions: questions.filter(q => q.question && q.answer) }, {
        onSuccess: () => setOpen(false)
     });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/20">
           <Plus className="w-5 h-5 mr-2" /> Create Set
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-card">
         <h2 className="text-2xl font-bold mb-4">Create Flashcard Set</h2>
         <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <Input placeholder="Set Title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-bold" />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            
            <div className="space-y-4 pt-4">
              {questions.map((q, i) => (
                <div key={i} className="bg-secondary/30 p-4 rounded-xl space-y-3 border border-border">
                   <div className="flex justify-between text-xs text-muted-foreground uppercase font-bold">
                      <span>Card {i + 1}</span>
                      {questions.length > 1 && <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="hover:text-destructive">Remove</button>}
                   </div>
                   <Input placeholder="Question" value={q.question} onChange={(e) => updatePair(i, "question", e.target.value)} />
                   <Input placeholder="Answer" value={q.answer} onChange={(e) => updatePair(i, "answer", e.target.value)} />
                </div>
              ))}
            </div>
            
            <Button variant="outline" onClick={addPair} className="w-full border-dashed">
               <Plus className="w-4 h-4 mr-2" /> Add Card
            </Button>
         </div>
         <div className="pt-4 mt-4 border-t border-border flex justify-end">
            <Button onClick={handleCreate} disabled={!title || isPending}>
              {isPending ? "Creating..." : "Create Set"}
            </Button>
         </div>
      </DialogContent>
    </Dialog>
  );
}
