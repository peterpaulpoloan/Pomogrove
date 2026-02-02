import { useStats, usePomodoroHistory } from "@/hooks/use-pomodoro";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, CalendarCheck, Clock, Star } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: stats } = useStats();
  const { data: history } = usePomodoroHistory();

  // Prepare chart data (simple aggregation by day)
  const chartData = history?.reduce((acc, session) => {
    if (!session.completedAt) return acc;
    const date = format(new Date(session.completedAt), "MMM d");
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.minutes += session.duration;
    } else {
      acc.push({ date, minutes: session.duration });
    }
    return acc;
  }, [] as { date: string, minutes: number }[]).slice(-7) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-primary to-emerald-600 rounded-3xl p-8 text-white shadow-xl">
         <div className="flex flex-col md:flex-row items-center gap-6">
            <img 
              src={user?.profileImageUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username}`} 
              className="w-24 h-24 rounded-full border-4 border-white/20 bg-white/10"
              alt="Profile"
            />
            <div className="text-center md:text-left">
               <h1 className="text-3xl font-bold">{user?.firstName || "Student"}</h1>
               <p className="text-primary-foreground/80">Joined {format(new Date(), "MMMM yyyy")}</p>
               <div className="flex gap-3 mt-4 justify-center md:justify-start">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                     <Trophy className="w-4 h-4" /> Level {stats?.level || 1}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                     <Star className="w-4 h-4" /> {stats?.experience || 0} XP
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><CalendarCheck className="w-5 h-5" /></div>
               <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
            </div>
            <p className="text-3xl font-bold font-display">{stats?.currentStreak || 0} Days</p>
         </div>

         <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
               <span className="text-sm font-medium text-muted-foreground">Total Study Time</span>
            </div>
            <p className="text-3xl font-bold font-display">
               {Math.floor((stats?.totalStudyMinutes || 0) / 60)}h {(stats?.totalStudyMinutes || 0) % 60}m
            </p>
         </div>
         
         <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Trophy className="w-5 h-5" /></div>
               <span className="text-sm font-medium text-muted-foreground">Sessions Completed</span>
            </div>
            <p className="text-3xl font-bold font-display">{history?.length || 0}</p>
         </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
         <h3 className="text-lg font-bold mb-6">Study Activity (Last 7 Days)</h3>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                  <Tooltip 
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="minutes" fill="hsl(150, 60%, 40%)" radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
