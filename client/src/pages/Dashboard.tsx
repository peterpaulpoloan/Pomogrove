import { useStats } from "@/hooks/use-pomodoro";
import { useAuth } from "@/hooks/use-auth";
import { Sprout, TrendingUp, Clock, Calendar } from "lucide-react";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {getGreeting()}, {user?.firstName || 'Student'}!
          </h1>
          <p className="text-muted-foreground mt-1">Ready to grow your knowledge today?</p>
        </div>
        <div className="bg-card px-4 py-2 rounded-full border border-border shadow-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{format(new Date(), "EEEE, MMMM do")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Timer Area */}
        <div className="lg:col-span-2 space-y-8">
           <PomodoroTimer />
           
           {/* Quick Tips or Quote */}
           <div className="glass-panel p-6 rounded-2xl border border-border/50">
             <h3 className="font-bold text-lg mb-2">Daily Wisdom</h3>
             <p className="text-muted-foreground italic">"The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one."</p>
           </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="font-bold text-lg mb-4">Your Progress</h3>
            
            <div className="space-y-6">
              {isLoading ? (
                <StatsSkeleton />
              ) : (
                <>
                  <StatItem 
                    icon={<Sprout className="w-5 h-5 text-primary" />}
                    label="Current Level"
                    value={`Level ${stats?.level || 1}`}
                    subtext={`${stats?.experience || 0} XP / 100 XP to next`}
                  />
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${(stats?.experience || 0)}%` }}
                    />
                  </div>

                  <StatItem 
                    icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
                    label="Day Streak"
                    value={`${stats?.currentStreak || 0} Days`}
                    subtext="Keep the fire burning!"
                  />

                  <StatItem 
                    icon={<Clock className="w-5 h-5 text-blue-500" />}
                    label="Total Focus"
                    value={`${Math.floor((stats?.totalStudyMinutes || 0) / 60)}h ${(stats?.totalStudyMinutes || 0) % 60}m`}
                    subtext="Lifetime study hours"
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Mini Tree Preview */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20 rounded-2xl p-6 border border-primary/10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white/50 dark:bg-black/20 rounded-full flex items-center justify-center mb-4 shadow-inner">
               <Sprout className="w-12 h-12 text-primary" />
            </div>
            <h3 className="font-bold">My Garden</h3>
            <p className="text-sm text-muted-foreground mb-4">Your tree is in the {stats?.treeStage || 'sapling'} stage.</p>
            <a href="/tree" className="text-primary text-sm font-bold hover:underline">Visit Garden →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-secondary rounded-xl">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold font-display">{value}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
