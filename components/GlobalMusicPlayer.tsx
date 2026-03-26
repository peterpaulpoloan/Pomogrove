import React, { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface GlobalMusicPlayerProps {
  youtubeId: string | null;
  onSetYoutubeId: (id: string | null) => void;
  trackTitle?: string | null;
}

type PlayerSize = 'sm' | 'md' | 'lg';

const SIZES: Record<PlayerSize, { width: string; height: string; label: string }> = {
  sm: { width: 'w-[140px]', height: 'h-[80px]',  label: 'MD' },  // next size label shown on button
  md: { width: 'w-[320px]', height: 'h-[180px]', label: 'LG' },
  lg: { width: 'w-[560px]', height: 'h-[315px]', label: 'SM' },
};

const NEXT_SIZE: Record<PlayerSize, PlayerSize> = { sm: 'md', md: 'lg', lg: 'sm' };

const GlobalMusicPlayer: React.FC<GlobalMusicPlayerProps> = ({ youtubeId, onSetYoutubeId, trackTitle }) => {
  const [size, setSize] = useState<PlayerSize>('sm');

  if (!youtubeId) return null;

  const origin = window.location.origin;

  const ids = youtubeId.split(',');
  const firstId = ids[0];
  const playlistIds = ids.length > 1 ? ids.join(',') : null;

  let embedUrl = `https://www.youtube.com/embed/${firstId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}`;
  if (playlistIds) {
    embedUrl += `&playlist=${playlistIds}`;
  }

  const { width, height, label } = SIZES[size];

  return (
    <div className="fixed bottom-4 left-4 z-[100] group pointer-events-none">
      <div
        className={`bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-white/20 overflow-hidden ${width} ${height} transition-all duration-500 cursor-move ring-1 ring-black/5 pointer-events-auto relative`}
      >
        {/* Close Button */}
        <button
          onClick={() => onSetYoutubeId(null)}
          className="absolute top-1 right-1 z-[110] p-1 bg-black/40 hover:bg-rose-500 text-white rounded-lg transition-all"
          title="Stop Music"
        >
          <X size={14} />
        </button>

        {/* Size Toggle Button */}
        <button
          onClick={() => setSize(NEXT_SIZE[size])}
          className="absolute top-1 right-8 z-[110] p-1 bg-black/40 hover:bg-emerald-500 text-white rounded-lg transition-all flex items-center gap-0.5"
          title={`Switch to ${label} size`}
        >
          <Maximize2 size={10} />
          <span className="text-[8px] font-bold leading-none">{label}</span>
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

        {/* Label */}
        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-[120px] truncate">
          {ids.length > 1 ? 'Playing Playlist' : (trackTitle || 'Live Audio')}
        </div>
      </div>
    </div>
  );
};

export default GlobalMusicPlayer;
