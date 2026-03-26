import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Search, FileText, Calendar, Loader2, X, Pencil, Check,
  Bold, Italic, Underline, List, ListOrdered, Quote, Minus, Heading2,
} from 'lucide-react';
import { Note } from '../types';
import { UserProfile } from '../types';
import { logActivity, ActivityEvent } from '../lib/activityLogger';
import { addXP } from '../lib/xpSystem';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

interface NotesProps {
  user: UserProfile;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Word-boundary search: every token must appear as a whole word */
function matchesSearch(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${note.title} ${note.content}`.toLowerCase();
  return tokens.every((token) => {
    const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    return regex.test(haystack);
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Toolbar ────────────────────────────────────────────────────────────────────
interface ToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onInput: () => void;
}

const TOOLBAR = [
  { icon: Bold,        cmd: 'bold',                title: 'Bold' },
  { icon: Italic,      cmd: 'italic',              title: 'Italic' },
  { icon: Underline,   cmd: 'underline',           title: 'Underline' },
  { sep: true },
  { icon: Heading2,    cmd: 'formatBlock', arg: 'h3', title: 'Heading' },
  { icon: Quote,       cmd: 'formatBlock', arg: 'blockquote', title: 'Quote' },
  { sep: true },
  { icon: List,        cmd: 'insertUnorderedList',  title: 'Bullet List' },
  { icon: ListOrdered, cmd: 'insertOrderedList',    title: 'Numbered List' },
  { sep: true },
  { icon: Minus,       cmd: 'insertHorizontalRule', title: 'Divider' },
] as const;

const RichToolbar: React.FC<ToolbarProps> = ({ editorRef, onInput }) => {
  const [active, setActive] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    const s = new Set<string>();
    TOOLBAR.forEach((t) => {
      if ('cmd' in t) { try { if (document.queryCommandState(t.cmd)) s.add(t.cmd); } catch {} }
    });
    setActive(s);
  }, []);

  const exec = (cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    onInput();
    refresh();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl mb-2"
      onMouseDown={(e) => e.preventDefault()}
    >
      {TOOLBAR.map((item, i) => {
        if ('sep' in item) return <div key={i} className="w-px h-5 bg-stone-200 mx-1" />;
        const { icon: Icon, cmd, title } = item;
        const arg = 'arg' in item ? item.arg : undefined;
        return (
          <button
            key={i}
            type="button"
            title={title}
            onClick={() => exec(cmd, arg)}
            className={`p-1.5 rounded-lg text-sm transition-colors ${
              active.has(cmd)
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
};

// ── Rich Editor ────────────────────────────────────────────────────────────────
interface RichEditorProps {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const RichEditor: React.FC<RichEditorProps> = ({ html, onChange, placeholder, autoFocus }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handleInput = useCallback(() => {
    if (!isComposing.current && ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  return (
    <div>
      <RichToolbar editorRef={ref} onInput={handleInput} />
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        data-placeholder={placeholder}
        className={`
          outline-none min-h-[260px] text-base text-stone-700 leading-relaxed
          empty:before:content-[attr(data-placeholder)] empty:before:text-stone-300
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-stone-900 [&_h3]:mt-2 [&_h3]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-stone-400 [&_blockquote]:my-1
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_u]:underline
          [&_hr]:border-stone-200 [&_hr]:my-3
        `}
      />
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Notes: React.FC<NotesProps> = ({ user }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/notes/${user.uid}`);
        if (res.ok) setNotes(await res.json());
      } catch { console.warn('Could not load notes.'); }
      finally { setIsLoading(false); }
    };
    fetchNotes();
  }, [user.uid]);

  const addNote = async () => {
    const plain = stripHtml(newContent);
    if (!newTitle.trim() && !plain.trim()) return;
    if (notes.length >= 50) { alert('Note limit (50) reached.'); return; }
    setIsSaving(true);
    const wordCount = countWords(`${newTitle} ${plain}`);
    try {
      const res = await fetch(`${API_BASE}/notes/${user.uid}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle || 'Untitled Note', content: newContent }),
      });
      if (res.ok) setNotes([await res.json(), ...notes]);
    } catch {
      setNotes([{ id: Date.now().toString(), title: newTitle || 'Untitled Note', content: newContent, createdAt: Date.now() }, ...notes]);
    } finally {
      logActivity(user.uid, 'note' as ActivityEvent);
      addXP(user.uid, { type: 'note', wordCount });
      setNewTitle(''); setNewContent(''); setIsAdding(false); setIsSaving(false);
    }
  };

  const openEdit = (note: Note) => { setEditingId(note.id); setEditTitle(note.title); setEditContent(note.content); };
  const closeEdit = () => { setEditingId(null); setEditTitle(''); setEditContent(''); };

  const saveEdit = async () => {
    if (!editingId) return;
    setIsUpdating(true);
    const updated: Note = { ...notes.find((n) => n.id === editingId)!, title: editTitle || 'Untitled Note', content: editContent };
    setNotes(notes.map((n) => (n.id === editingId ? updated : n)));
    try {
      await fetch(`${API_BASE}/notes/${user.uid}/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: updated.title, content: updated.content }),
      });
    } catch { console.warn('Update sync failed.'); }
    finally { setIsUpdating(false); closeEdit(); }
  };

  const deleteNote = async (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    try { await fetch(`${API_BASE}/notes/${user.uid}/${id}`, { method: 'DELETE' }); }
    catch { console.warn('Delete sync failed.'); }
  };

  // Word-boundary search against plain-text version of notes
  const filteredNotes = notes.filter((n) =>
    matchesSearch({ ...n, content: stripHtml(n.content) }, searchQuery)
  );

  const xpPreview = (t: string, c: string) =>
    Math.max(1, Math.round((countWords(`${t} ${stripHtml(c)}`) / 500) * 40));

  const overlay = "fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4";
  const modal = "bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto";

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
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
              placeholder="Search by exact word..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setIsAdding(true)} className="p-3 bg-stone-900 text-white rounded-xl shadow-lg hover:bg-stone-800 transition-all">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* New Note Modal */}
      {isAdding && (
        <div className={overlay} onClick={(e) => { if (e.target === e.currentTarget) setIsAdding(false); }}>
          <div className={modal}>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">New Note</span>
                <button onClick={() => setIsAdding(false)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
              <input
                className="w-full text-3xl font-bold border-none outline-none placeholder:text-stone-300"
                placeholder="Note Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <RichEditor html={newContent} onChange={setNewContent} placeholder="Start typing your thoughts..." />
              <p className="text-xs text-stone-400 text-right">
                {countWords(`${newTitle} ${stripHtml(newContent)}`)} words · +{xpPreview(newTitle, newContent)} XP on save
              </p>
            </div>
            <div className="p-6 bg-stone-50 flex justify-end gap-3 border-t border-stone-100">
              <button onClick={() => setIsAdding(false)} className="px-6 py-2.5 font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors">Discard</button>
              <button onClick={addNote} disabled={isSaving} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null} Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingId && (
        <div className={overlay} onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className={modal}>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Editing Note</span>
                <button onClick={closeEdit} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
              <input
                className="w-full text-3xl font-bold border-none outline-none placeholder:text-stone-300"
                placeholder="Note Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />
              <RichEditor key={editingId} html={editContent} onChange={setEditContent} placeholder="Start typing your thoughts..." />
              <p className="text-xs text-stone-400 text-right">
                {countWords(`${editTitle} ${stripHtml(editContent)}`)} words
              </p>
            </div>
            <div className="p-6 bg-stone-50 flex justify-end gap-3 border-t border-stone-100">
              <button onClick={closeEdit} className="px-6 py-2.5 font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={isUpdating} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32 text-stone-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="group bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all flex flex-col min-h-[250px]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-stone-100 text-stone-500 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <FileText size={20} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(note)} className="p-2 text-stone-300 hover:text-emerald-600 transition-colors" title="Edit note">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className="p-2 text-stone-300 hover:text-rose-600 transition-colors" title="Delete note">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h4 className="text-xl font-bold mb-2 group-hover:text-emerald-900">{note.title}</h4>
              <div
                className="text-stone-600 line-clamp-4 flex-1 text-sm leading-relaxed [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h3]:font-bold [&_blockquote]:italic [&_blockquote]:text-stone-400"
                dangerouslySetInnerHTML={{ __html: note.content || '<em>No content provided.</em>' }}
              />
              <div className="mt-6 pt-4 border-t border-stone-50 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-stone-400 font-bold uppercase tracking-widest">
                  <Calendar size={12} />
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-stone-300 font-medium">
                  {countWords(`${note.title} ${stripHtml(note.content)}`)}w
                </span>
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-stone-400 space-y-4">
              <div className="p-8 bg-stone-100 rounded-full opacity-30"><FileText size={64} /></div>
              <p className="text-xl font-bold">No notes found</p>
              <p className="text-sm">
                {searchQuery ? `No notes contain the word "${searchQuery}"` : 'Click the plus button to start writing.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;