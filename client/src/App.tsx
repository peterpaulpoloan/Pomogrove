import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Navigation, MobileNav } from "@/components/Navigation";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Notes from "@/pages/Notes";
import Flashcards from "@/pages/Flashcards";
import Tree from "@/pages/Tree";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !location.startsWith("/api")) {
    return <Landing />;
  }

  return (
    <Switch>
      <Route path="/">
        <PrivateLayout><Dashboard /></PrivateLayout>
      </Route>
      <Route path="/notes">
        <PrivateLayout><Notes /></PrivateLayout>
      </Route>
      <Route path="/flashcards">
        <PrivateLayout><Flashcards /></PrivateLayout>
      </Route>
      <Route path="/tree">
        <PrivateLayout><Tree /></PrivateLayout>
      </Route>
      <Route path="/profile">
        <PrivateLayout><Profile /></PrivateLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
