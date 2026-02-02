import { useState } from "react";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes";
import { Plus, Search, Trash2, Edit3, X, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Notes() {
  const { data: notes, isLoading } = useNotes();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase()) || 
    note.content.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Notes Vault</h1>
          <p className="text-muted-foreground">Capture ideas and key learnings</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full md:w-64 rounded-full bg-background"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-full shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" /> New Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <p>Loading notes...</p> // Could replace with skeleton
        ) : (
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onEdit={() => setEditingNote(note)} 
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create Dialog */}
      <NoteDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        mode="create"
      />

      {/* Edit Dialog */}
      <NoteDialog 
        open={!!editingNote} 
        onOpenChange={(open) => !open && setEditingNote(null)} 
        mode="edit"
        initialData={editingNote || undefined}
      />
    </div>
  );
}

function NoteCard({ note, onEdit }: { note: Note, onEdit: () => void }) {
  const { mutate: deleteNote } = useDeleteNote();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-card hover:bg-card/80 border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-[280px]"
      onClick={onEdit}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{note.title}</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this note?")) deleteNote(note.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-muted-foreground text-sm whitespace-pre-wrap line-clamp-[8] flex-1">
        {note.content}
      </p>
      <div className="mt-4 text-xs text-muted-foreground/50 font-medium">
        {format(new Date(note.updatedAt || note.createdAt!), "MMM d, yyyy")}
      </div>
    </motion.div>
  );
}

function NoteDialog({ 
  open, 
  onOpenChange, 
  mode, 
  initialData 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  mode: "create" | "edit",
  initialData?: Note
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  
  // Reset form when opening
  if (open && mode === "edit" && initialData && title === "" && content === "") {
     setTitle(initialData.title);
     setContent(initialData.content);
  }

  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      createNote({ title, content }, { onSuccess: () => {
        onOpenChange(false);
        setTitle(""); setContent("");
      }});
    } else if (initialData) {
      updateNote({ id: initialData.id, title, content }, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="text-xl font-bold bg-transparent border-none focus:outline-none w-full placeholder:text-muted-foreground/50"
          />
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing..."
          className="flex-1 p-6 resize-none bg-transparent border-none focus:outline-none text-base leading-relaxed"
        />

        <div className="p-4 border-t border-border flex justify-end">
          <Button onClick={handleSubmit} disabled={!title || !content || isCreating || isUpdating} className="gap-2">
            <Save className="w-4 h-4" />
            {mode === "create" ? "Create Note" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
