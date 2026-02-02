import { useState } from "react";
import { 
  Music, 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  Maximize2, 
  Minimize2,
  ExternalLink
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MusicPlayer({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [url, setUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const handlePlay = () => {
    if (!url) return;

    let finalUrl = url;
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("v=") 
        ? url.split("v=")[1].split("&")[0]
        : url.split("/").pop();
      finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } 
    // Spotify
    else if (url.includes("spotify.com")) {
      const spotifyId = url.split("/").pop()?.split("?")[0];
      const type = url.includes("track") ? "track" : url.includes("playlist") ? "playlist" : "album";
      finalUrl = `https://open.spotify.com/embed/${type}/${spotifyId}`;
    }

    setEmbedUrl(finalUrl);
    setIsPlaying(true);
  };

  if (isMinimized && embedUrl) {
    return (
      <div className="fixed bottom-20 left-6 z-[60] glass-panel p-2 rounded-2xl flex items-center gap-3 shadow-2xl border border-primary/20 animate-in slide-in-from-left-4">
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <Music className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <div className="pr-2">
          <p className="text-xs font-medium text-primary">Now Playing</p>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsMinimized(false)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Focus Music
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {!embedUrl ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground mb-4">
                  Paste a YouTube or Spotify link to start your study session with some focus tunes.
                </p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://youtube.com/..." 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-background/50"
                  />
                  <Button onClick={handlePlay}>Play</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    setUrl("https://www.youtube.com/watch?v=jfKfPfyJRdk");
                    handlePlay();
                  }}
                >
                  Lofi Hip Hop
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    setUrl("https://www.youtube.com/watch?v=5qap5aO4i9A");
                    handlePlay();
                  }}
                >
                  Chill Beats
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-primary/20">
                {isPlaying ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-sm">
                    <Button 
                      size="icon" 
                      className="h-16 w-16 rounded-full"
                      onClick={() => setIsPlaying(true)}
                    >
                      <Play className="w-8 h-8 fill-current" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button size="icon" variant="ghost">
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setEmbedUrl(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
