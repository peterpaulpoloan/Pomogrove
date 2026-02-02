import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <Sprout className="w-24 h-24 text-primary mb-6 animate-bounce" />
      <h1 className="text-4xl font-bold mb-4 font-display">404 - Lost in the woods?</h1>
      <p className="text-muted-foreground mb-8">The page you're looking for hasn't sprouted yet.</p>
      
      <Link href="/">
        <Button size="lg" className="rounded-full px-8">Return Home</Button>
      </Link>
    </div>
  );
}
