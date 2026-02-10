import { useState } from 'react';
import { ArrowRight, Leaf, ShieldCheck, Zap, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast({ title: 'Welcome back!' });
      } else {
        await signup(email, password);
        toast({ title: 'Account created successfully!' });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-green-200/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-amber-100/40 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold font-display text-foreground">StudyStudio</span>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-20 pb-32 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:w-1/2 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground border border-accent/20 text-sm font-medium text-amber-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Gamify your learning journey
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold font-display leading-[1.1] text-foreground">
              Focus better. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Grow faster.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Combine the Pomodoro technique with a virtual garden that grows as you study. Track your progress, manage notes, and master subjects with AI-powered flashcards.
            </p>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl border border-white/20 dark:border-white/10 max-w-md">
              <div className="flex gap-2 mb-6">
                <Button
                  variant={isLogin ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setIsLogin(true)}
                >
                  Log In
                </Button>
                <Button
                  variant={!isLogin ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setIsLogin(false)}
                >
                  Sign Up
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : isLogin ? 'Log In' : 'Sign Up'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Free forever
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> No credit card
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 relative"
          >
            <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-2xl border border-white/20 dark:border-white/10 rotate-3 hover:rotate-0 transition-transform duration-500 ease-out">
               <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl overflow-hidden relative group">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                       <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
                          <Leaf className="w-12 h-12 text-primary" />
                       </div>
                       <h3 className="text-2xl font-bold">Your Focus Garden</h3>
                       <p className="text-muted-foreground">Study sessions nourish your virtual tree.</p>
                    </div>
                  </div>

                  <div className="absolute top-8 right-8 glass-panel p-3 rounded-xl shadow-lg animate-bounce duration-[3000ms]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs font-bold">25:00</span>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 glass-panel p-3 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Streak</p>
                        <p className="text-xs text-muted-foreground">5 Days 🔥</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="absolute -z-10 top-10 -right-10 w-full h-full bg-primary/20 rounded-3xl blur-2xl" />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
