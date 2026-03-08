
import React, { useState } from 'react';
import { Youtube, Music2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MusicProps {
  onSetYoutubeId: (id: string | null) => void;
  currentYoutubeId: string | null;
}

const Music: React.FC<MusicProps> = ({ onSetYoutubeId, currentYoutubeId }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYoutubeId(url);
    if (id) {
      onSetYoutubeId(id);
      setUrl('');
      setError(null);
    } else {
      setError('Please enter a valid YouTube link.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-full flex flex-col justify-center">
      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100 text-center space-y-8">
        <div className="inline-block p-6 bg-rose-50 text-rose-500 rounded-full animate-pulse">
          <Music2 size={64} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight">Plant a Sound</h2>
          <p className="text-stone-500 font-medium max-w-md mx-auto">
            Sync your favorite study beats. The audio will stay with you as you navigate through PomoGrove.
          </p>
        </div>

        <form onSubmit={handleSync} className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              className={`
                w-full pl-12 pr-4 py-4 bg-stone-50 border rounded-2xl outline-none transition-all
                ${error ? 'border-rose-300 focus:ring-rose-500' : 'border-stone-200 focus:ring-emerald-500 focus:ring-2'}
              `}
              placeholder="Paste YouTube Link (e.g. Lofi Girl)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-rose-600 text-sm font-bold justify-center">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold shadow-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3"
          >
            <Music2 size={20} />
            Sync Grove Audio
          </button>
        </form>

        {currentYoutubeId && (
          <div className="pt-8 border-t border-stone-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center gap-3 text-emerald-600 font-bold">
              <CheckCircle2 size={20} />
              Synced and Playing
            </div>
            <p className="text-xs text-stone-400 mt-1">Video ID: {currentYoutubeId}</p>
            <button 
              onClick={() => onSetYoutubeId(null)}
              className="mt-4 text-xs font-bold text-stone-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
            >
              Disconnect Audio
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 text-center text-stone-400 text-sm font-medium">
        Supports YouTube Shorts, Standard Videos, and Live Streams.
      </div>
    </div>
  );
};

export default Music;
