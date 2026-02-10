import { useState } from 'react';
import {
  Music,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function MusicPlayer({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [url, setUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const handlePlay = (inputUrl?: string) => {
    const finalInput = inputUrl || url;
    if (!finalInput) return;

    let finalUrl = finalInput;

    // YouTube
    if (finalInput.includes('youtube.com') || finalInput.includes('youtu.be')) {
      const videoId = finalInput.includes('v=')
        ? finalInput.split('v=')[1].split('&')[0]
        : finalInput.split('/').pop();
      finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    // Spotify
    else if (finalInput.includes('spotify.com')) {
      const spotifyId = finalInput.split('/').pop()?.split('?')[0];
      const type = finalInput.includes('track') ? 'track' : finalInput.includes('playlist') ? 'playlist' : 'album';
      finalUrl = `https://open.spotify.com/embed/${type}/${spotifyId}`;
    }

    setEmbedUrl(finalUrl);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    onOpenChange(false);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    onOpenChange(true);
  };

  return (
    <>
      {/* Hidden iframe that keeps playing */}
      {embedUrl && (
        <div style={{ width: 1, height: 1, opacity: 0 }}>
          <iframe
            src={embedUrl}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Minimized player */}
      {isMinimized && embedUrl && (
        <div className="fixed bottom-6 left-6 z-50 glass-panel p-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-primary/20">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <Music className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="pr-2 flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={handleMaximize}>
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setEmbedUrl(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Full player dialog */}
      <Dialog open={open && !isMinimized} onOpenChange={onOpenChange}>
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
                      onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
                    />
                    <Button onClick={() => handlePlay()}>Play</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlay('https://www.youtube.com/watch?v=jfKfPfyJRdk')}
                  >
                    Lofi Hip Hop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlay('https://www.youtube.com/watch?v=5qap5aO4i9A')}
                  >
                    Chill Beats
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-primary/20">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Music className="w-16 h-16 text-primary/40 animate-pulse" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white/80">
                      Audio playing in background
                      {embedUrl.includes('spotify.com') && ' — click play in Spotify player'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Playing
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={handleMinimize}>
                      <Minimize2 className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEmbedUrl(null)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
