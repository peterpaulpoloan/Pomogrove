import React from 'react';
import { X } from 'lucide-react';

interface GlobalMusicPlayerProps {
  youtubeId: string | null;
  onSetYoutubeId: (id: string | null) => void;
  trackTitle?: string | null; // optional: shown when playing from a playlist
}

const GlobalMusicPlayer: React.FC<GlobalMusicPlayerProps> = ({ youtubeId, onSetYoutubeId, trackTitle }) => {
  if (!youtubeId) return null;

  const origin = window.location.origin;

  // ─── Logic for Sequential Playback ──────────────────────────────────────
  // If youtubeId contains commas, we treat it as a playlist.
  // The first ID goes into the path, the rest go into the 'playlist' param.
  const ids = youtubeId.split(',');
  const firstId = ids[0];
  const playlistIds = ids.length > 1 ? ids.join(',') : null;

  let embedUrl = `https://www.youtube.com/embed/${firstId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}`;

  // If we have multiple IDs, append the playlist parameter
  if (playlistIds) {
    embedUrl += `&playlist=${playlistIds}`;
  }
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-4 left-4 z-[100] group pointer-events-none">
      <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-white/20 overflow-hidden w-[140px] h-[80px] transition-all duration-500 hover:w-[320px] hover:h-[180px] cursor-move ring-1 ring-black/5 pointer-events-auto relative">

        {/* Close Button */}
        <button
          onClick={() => onSetYoutubeId(null)}
          className="absolute top-1 right-1 z-[110] p-1 bg-black/40 hover:bg-rose-500 text-white rounded-lg transition-all"
          title="Stop Music"
        >
          <X size={14} />
        </button>

        <iframe
          key={youtubeId} // Key ensures iframe reloads when the ID (or list of IDs) changes
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

        {/* Label — shows track title if available, else "Live Audio" */}
        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-[120px] truncate">
          {ids.length > 1 ? 'Playing Playlist' : (trackTitle || 'Live Audio')}
        </div>
      </div>
    </div>
  );
};

export default GlobalMusicPlayer;