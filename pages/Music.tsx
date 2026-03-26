import React, { useState, useEffect, useRef } from 'react';
import {
  Youtube, Music2, CheckCircle2, AlertCircle, Plus, Trash2,
  ListMusic, ChevronDown, ChevronRight, Play, X, FolderPlus, Loader2
} from 'lucide-react';

interface PlaylistItem {
  id: number;
  playlist_id: number;
  title: string;
  youtube_id: string;
}

interface Playlist {
  id: number;
  name: string;
  items: PlaylistItem[];
}

interface MusicProps {
  onSetYoutubeId: (id: string | null) => void;
  currentYoutubeId: string | null;
  uid?: string | null;
}

const API = 'http://localhost:5000';
const LS_KEY = 'pomogrove_playlists';

const loadLocalPlaylists = (): Playlist[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const saveLocalPlaylists = (p: Playlist[]) => localStorage.setItem(LS_KEY, JSON.stringify(p));

const extractYoutubeId = (url: string): string | null => {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
  return m ? m[1] : null;
};

/** Fetch the video title using Invidious (no API key), falls back to oEmbed */
async function fetchVideoTitle(ytId: string): Promise<string> {
  try {
    const res = await fetch(`https://inv.nadeko.net/api/v1/videos/${ytId}?fields=title`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.title) return data.title;
    throw new Error();
  } catch {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.title || ytId;
    } catch {
      return ytId; // last resort: show the raw ID
    }
  }
}

const Music: React.FC<MusicProps> = ({ onSetYoutubeId, currentYoutubeId, uid }) => {
  const [tab, setTab] = useState<'sync' | 'playlists'>('sync');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingToId, setAddingToId] = useState<number | null>(null);
  const [newItemUrl, setNewItemUrl] = useState('');
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);
  const [itemFetching, setItemFetching] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = !!uid;

  // Load playlists on mount
  useEffect(() => {
    if (isOnline) {
      fetch(`${API}/api/playlists/${uid}`)
        .then(r => r.json())
        .then(setPlaylists)
        .catch(() => setPlaylists(loadLocalPlaylists()));
    } else {
      setPlaylists(loadLocalPlaylists());
    }
  }, [uid]);

  const persist = (updated: Playlist[]) => {
    setPlaylists(updated);
    saveLocalPlaylists(updated);
  };

  // ── Auto-fetch title as user types/pastes URL ────────────────────────────
  const handleItemUrlChange = (value: string) => {
    setNewItemUrl(value);
    setItemError(null);
    setFetchedTitle(null);
    if (fetchDebounce.current) clearTimeout(fetchDebounce.current);

    const ytId = extractYoutubeId(value);
    if (!ytId) return;

    setItemFetching(true);
    fetchDebounce.current = setTimeout(async () => {
      const title = await fetchVideoTitle(ytId);
      setFetchedTitle(title);
      setItemFetching(false);
    }, 400);
  };

  // ── Single sync ───────────────────────────────────────────────────────────
  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYoutubeId(url);
    if (id) { onSetYoutubeId(id); setUrl(''); setError(null); }
    else setError('Please enter a valid YouTube link.');
  };

  // ── Create playlist ───────────────────────────────────────────────────────
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    if (playlists.length >= 10) { setPlaylistError('Max 10 playlists reached.'); return; }
    setPlaylistError(null);
    setLoading(true);

    if (isOnline) {
      try {
        const res = await fetch(`${API}/api/playlists/${uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newPlaylistName.trim() }),
        });
        const data = await res.json();
        if (res.ok) { persist([data, ...playlists]); setNewPlaylistName(''); setLoading(false); return; }
        setPlaylistError(data.error);
      } catch {}
    }
    const newPl: Playlist = { id: Date.now(), name: newPlaylistName.trim(), items: [] };
    persist([newPl, ...playlists]);
    setNewPlaylistName('');
    setLoading(false);
  };

  // ── Delete playlist ───────────────────────────────────────────────────────
  const handleDeletePlaylist = async (playlistId: number) => {
    if (isOnline) {
      await fetch(`${API}/api/playlists/${uid}/${playlistId}`, { method: 'DELETE' }).catch(() => {});
    }
    persist(playlists.filter(p => p.id !== playlistId));
    if (expandedId === playlistId) setExpandedId(null);
  };

  // ── Add item (uses auto-fetched title, no manual title input) ────────────
  const handleAddItem = async (playlistId: number) => {
    const ytId = extractYoutubeId(newItemUrl);
    if (!ytId) { setItemError('Invalid YouTube link.'); return; }
    const pl = playlists.find(p => p.id === playlistId)!;
    if (pl.items.length >= 20) { setItemError('Max 20 items per playlist.'); return; }
    setItemError(null);

    // Use cached title or fetch now if debounce hasn't resolved yet
    let title = fetchedTitle;
    if (!title) {
      setItemFetching(true);
      title = await fetchVideoTitle(ytId);
      setItemFetching(false);
    }

    if (isOnline) {
      try {
        const res = await fetch(`${API}/api/playlists/${uid}/${playlistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, youtubeId: ytId }),
        });
        const data = await res.json();
        if (res.ok) {
          persist(playlists.map(p =>
            p.id === playlistId ? { ...p, items: [...p.items, data] } : p
          ));
          setNewItemUrl(''); setFetchedTitle(null); setAddingToId(null);
          return;
        }
        setItemError(data.error);
        return;
      } catch {}
    }

    const newItem: PlaylistItem = { id: Date.now(), playlist_id: playlistId, title, youtube_id: ytId };
    persist(playlists.map(p =>
      p.id === playlistId ? { ...p, items: [...p.items, newItem] } : p
    ));
    setNewItemUrl(''); setFetchedTitle(null); setAddingToId(null);
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const handleDeleteItem = async (playlistId: number, itemId: number) => {
    if (isOnline) {
      await fetch(`${API}/api/playlists/${uid}/${playlistId}/items/${itemId}`, { method: 'DELETE' }).catch(() => {});
    }
    persist(playlists.map(p =>
      p.id === playlistId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p
    ));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-full flex flex-col justify-start">

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 bg-stone-100 p-1.5 rounded-2xl w-fit mx-auto">
        {(['sync', 'playlists'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all capitalize flex items-center gap-2 ${
              tab === t ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {t === 'sync' ? <Music2 size={15} /> : <ListMusic size={15} />}
            {t === 'sync' ? 'Sync Audio' : 'Playlists'}
          </button>
        ))}
      </div>

      {/* ── Sync Tab ──────────────────────────────────────────────────────── */}
      {tab === 'sync' && (
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
                className={`w-full pl-12 pr-4 py-4 bg-stone-50 border rounded-2xl outline-none transition-all ${
                  error ? 'border-rose-300 focus:ring-rose-500' : 'border-stone-200 focus:ring-emerald-500 focus:ring-2'
                }`}
                placeholder="Paste YouTube link (e.g. Lofi Girl)"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-sm font-bold justify-center">
                <AlertCircle size={16} />{error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold shadow-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3"
            >
              <Music2 size={20} /> Sync Grove Audio
            </button>
          </form>
          {currentYoutubeId && (
            <div className="pt-8 border-t border-stone-50">
              <div className="flex items-center justify-center gap-3 text-emerald-600 font-bold">
                <CheckCircle2 size={20} /> Synced and Playing
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
      )}

      {/* ── Playlists Tab ──────────────────────────────────────────────────── */}
      {tab === 'playlists' && (
        <div className="space-y-4">

          {/* Create playlist */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900">My Playlists</h2>
                <p className="text-xs text-stone-400 mt-0.5">{playlists.length}/10 playlists used</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < playlists.length ? 'bg-emerald-500' : 'bg-stone-200'}`} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                  maxLength={40}
                />
              </div>
              <button
                onClick={handleCreatePlaylist}
                disabled={loading || playlists.length >= 10}
                className="px-4 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
                Create
              </button>
            </div>
            {playlistError && (
              <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1">
                <AlertCircle size={12} />{playlistError}
              </p>
            )}
          </div>

          {/* Playlist list */}
          {playlists.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <ListMusic size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No playlists yet. Create one above!</p>
            </div>
          ) : (
            playlists.map(pl => (
              <div key={pl.id} className="bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden">

                {/* Playlist row */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => setExpandedId(expandedId === pl.id ? null : pl.id)}
                    className="flex-1 flex items-center gap-3 text-left group"
                  >
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      {expandedId === pl.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{pl.name}</p>
                      <p className="text-xs text-stone-400">{pl.items.length}/20 tracks</p>
                    </div>
                  </button>
                  {pl.items.length > 0 && (
                    <button
                      onClick={() => onSetYoutubeId(pl.items.map(i => i.youtube_id).join(','))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                    >
                      <Play size={12} fill="currentColor" /> PLAY ALL
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlaylist(pl.id)}
                    className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Expanded */}
                {expandedId === pl.id && (
                  <div className="border-t border-stone-50 px-4 pb-4 space-y-2 pt-3">

                    {pl.items.length === 0 && addingToId !== pl.id && (
                      <p className="text-xs text-stone-400 text-center py-4">No tracks yet. Add one below!</p>
                    )}

                    {pl.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl group hover:bg-emerald-50 transition-colors">
                        <button
                          onClick={() => onSetYoutubeId(item.youtube_id)}
                          className="flex-1 flex items-center gap-3 text-left"
                        >
                          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all text-stone-400 flex-shrink-0">
                            <Play size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-stone-800 truncate">{item.title}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{item.youtube_id}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(pl.id, item.id)}
                          className="p-1.5 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {/* Add track form — URL only, title auto-fetched */}
                    {addingToId === pl.id ? (
                      <div className="space-y-2 pt-1">
                        <div className="relative">
                          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                          <input
                            className={`w-full pl-8 pr-9 py-2.5 bg-stone-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 text-sm ${
                              itemError ? 'border-rose-300' : 'border-stone-200'
                            }`}
                            placeholder="Paste YouTube link — title fetched automatically"
                            value={newItemUrl}
                            onChange={e => handleItemUrlChange(e.target.value)}
                            autoFocus
                          />
                          {/* Status indicator */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {itemFetching && <Loader2 size={14} className="animate-spin text-stone-400" />}
                            {!itemFetching && fetchedTitle && <CheckCircle2 size={14} className="text-emerald-500" />}
                          </div>
                        </div>

                        {/* Title preview */}
                        {fetchedTitle && !itemFetching && (
                          <p className="text-xs text-stone-500 px-1 truncate">
                            <span className="font-bold text-stone-700">Title: </span>{fetchedTitle}
                          </p>
                        )}

                        {itemError && (
                          <p className="text-rose-500 text-xs font-bold flex items-center gap-1">
                            <AlertCircle size={11} />{itemError}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddItem(pl.id)}
                            disabled={itemFetching || !newItemUrl.trim()}
                            className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                          >
                            {itemFetching
                              ? <><Loader2 size={13} className="animate-spin" /> Fetching title…</>
                              : 'Add Track'}
                          </button>
                          <button
                            onClick={() => {
                              setAddingToId(null);
                              setItemError(null);
                              setNewItemUrl('');
                              setFetchedTitle(null);
                            }}
                            className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      pl.items.length < 20 && (
                        <button
                          onClick={() => {
                            setAddingToId(pl.id);
                            setItemError(null);
                            setNewItemUrl('');
                            setFetchedTitle(null);
                          }}
                          className="w-full py-2.5 border-2 border-dashed border-stone-200 text-stone-400 rounded-2xl text-sm font-bold hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={15} /> Add Track
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-8 text-center text-stone-400 text-sm font-medium">
        Supports YouTube Shorts, Standard Videos, and Live Streams.
      </div>
    </div>
  );
};

export default Music;