import React from 'react';
import { X } from 'lucide-react';

interface GlobalMusicPlayerProps {
  youtubeId: string | null;
  onSetYoutubeId: (id: string | null) => void;
}

const GlobalMusicPlayer: React.FC<GlobalMusicPlayerProps> = ({ youtubeId, onSetYoutubeId }) => {
  if (!youtubeId) return null;

  const origin = window.location.origin;
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}`;

  return (
    <div className="fixed bottom-4 left-4 z-[100] group pointer-events-none">
      <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-white/20 overflow-hidden w-[140px] h-[80px] transition-all duration-500 hover:w-[320px] hover:h-[180px] cursor-move ring-1 ring-black/5 pointer-events-auto relative">

        {/* Close Button — always visible, above iframe */}
        <button
          onClick={() => onSetYoutubeId(null)}
          className="absolute top-1 right-1 z-[110] p-1 bg-black/40 hover:bg-rose-500 text-white rounded-lg transition-all"
          title="Stop Music"
        >
          <X size={14} />
        </button>

        <iframe
          key={youtubeId}
          width="100%"
          height="100%"
          src={embedUrl}
          title="PomoGrove Audio Sync"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="rounded-xl"
        />

        {/* Subtle Overlay Label */}
        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Live Audio
        </div>
      </div>
    </div>
  );
};

export default GlobalMusicPlayer;