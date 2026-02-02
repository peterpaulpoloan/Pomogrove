import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Sprout, 
  StickyNote, 
  BrainCircuit, 
  Music, 
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tree", label: "Pomodoro Tree", icon: Sprout },
    { href: "/notes", label: "Notes Vault", icon: StickyNote },
    { href: "/flashcards", label: "Flashcards", icon: BrainCircuit },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-panel border-r border-border hidden md:flex flex-col z-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-br from-primary to-emerald-600 bg-clip-text text-transparent">
          StudyStudio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Level up your focus</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-accent/10 text-muted-foreground hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-accent")} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        {/* Music Player Placeholder Link - maybe modal later */}
        <div className="pt-4 mt-4 border-t border-border/50">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-500/10 text-muted-foreground hover:text-violet-600 transition-all cursor-pointer">
            <Music className="w-5 h-5" />
            <span className="font-medium">Focus Music</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img 
            src={user?.profileImageUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || 'user'}`}
            alt="Profile" 
            className="w-10 h-10 rounded-full bg-secondary"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.firstName || 'Student'}</p>
            <p className="text-xs text-muted-foreground truncate">Free Plan</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 flex justify-around z-50 safe-area-bottom">
      <Link href="/"><LayoutDashboard className="w-6 h-6 text-muted-foreground" /></Link>
      <Link href="/tree"><Sprout className="w-6 h-6 text-muted-foreground" /></Link>
      <Link href="/notes"><StickyNote className="w-6 h-6 text-muted-foreground" /></Link>
      <Link href="/profile"><User className="w-6 h-6 text-muted-foreground" /></Link>
    </div>
  );
}
