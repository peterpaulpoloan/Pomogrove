import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, FileText, Calendar, Loader2 } from 'lucide-react';
import { Note } from '../types';
import { UserProfile } from '../types';
import { logActivity, ActivityEvent } from '../lib/activityLogger';
import { addXP } from '../lib/xpSystem';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

interface NotesProps {
  user: UserProfile;
}

/** Count words in a string (splits on whitespace, filters empty tokens) */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const Notes: React.FC<NotesProps> = ({ user }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load notes from DB on mount
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/notes/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
        }
      } catch (err) {
        console.warn('Could not load notes from server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [user.uid]);

  const addNote = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    if (notes.length >= 50) {
      alert('Note limit (50) reached.');
      return;
    }
    setIsSaving(true);

    // Calculate word count from both title and content so XP reflects
    // the full text the user wrote.
    const wordCount = countWords(`${newTitle} ${newContent}`);

    try {
      const res = await fetch(`${API_BASE}/notes/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle || 'Untitled Note',
          content: newContent,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setNotes([saved, ...notes]);
      }
    } catch (err) {
      // Optimistic offline fallback
      const note: Note = {
        id: Date.now().toString(),
        title: newTitle || 'Untitled Note',
        content: newContent,
        createdAt: Date.now(),
      };
      setNotes([note, ...notes]);
    } finally {
      // ── Log activity + award XP ──────────────────────────────────────
      // Always runs whether the server call succeeded or fell back offline.
      // logActivity dispatches 'activity-updated' so ActivityCalendar refreshes.
      // addXP dispatches 'xp-updated' so LevelProgressPanel refreshes.
      logActivity(user.uid, 'note' as ActivityEvent);
      addXP(user.uid, { type: 'note', wordCount });
      // ────────────────────────────────────────────────────────────────

      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
      setIsSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    // Optimistic UI — remove immediately
    setNotes(notes.filter((n) => n.id !== id));
    try {
      await fetch(`${API_BASE}/notes/${user.uid}/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete sync failed.');
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Study Notes</h2>
          <p className="text-stone-500 font-medium">Keep track of important concepts and ideas.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="p-3 bg-stone-900 text-white rounded-xl shadow-lg hover:bg-stone-800 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 space-y-6">
              <input
                className="w-full text-3xl font-bold border-none outline-none placeholder:text-stone-300"
                placeholder="Note Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              {/* Live word count so the user knows how much XP they're earning */}
              <div className="flex items-center justify-between">
                <textarea
                  className="w-full h-80 text-lg border-none outline-none resize-none placeholder:text-stone-300 text-stone-600"
                  placeholder="Start typing your thoughts..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <p className="text-xs text-stone-400 text-right -mt-4">
                {countWords(`${newTitle} ${newContent}`)} words
                {' · '}
                +{Math.max(1, Math.round((countWords(`${newTitle} ${newContent}`) / 500) * 40))} XP on save
              </p>
            </div>
            <div className="p-6 bg-stone-50 flex justify-end gap-3 border-t border-stone-100">
              <button
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Discard
              </button>
              <button
                onClick={addNote}
                disabled={isSaving}
                className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-32 text-stone-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all flex flex-col min-h-[250px]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-stone-100 text-stone-500 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <FileText size={20} />
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-2 text-stone-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h4 className="text-xl font-bold mb-2 group-hover:text-emerald-900">{note.title}</h4>
              <p className="text-stone-600 line-clamp-4 flex-1">{note.content || 'No content provided.'}</p>

              <div className="mt-6 pt-4 border-t border-stone-50 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-stone-400 font-bold uppercase tracking-widest">
                  <Calendar size={12} />
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                {/* Word count badge on each card */}
                <span className="text-xs text-stone-300 font-medium">
                  {countWords(`${note.title} ${note.content}`)}w
                </span>
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && !isLoading && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-stone-400 space-y-4">
              <div className="p-8 bg-stone-100 rounded-full opacity-30">
                <FileText size={64} />
              </div>
              <p className="text-xl font-bold">No notes found</p>
              <p className="text-sm">Click the plus button to start writing.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;