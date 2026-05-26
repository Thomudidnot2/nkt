import React, { useState, useEffect } from "react";
import { 
  Pin, 
  Trash2, 
  Search, 
  Plus, 
  StickyNote, 
  Loader2, 
  Check, 
  Clock, 
  ShieldAlert 
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db, auth } from "../utils/workspaceAuth";

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  timestamp: string;
  authorEmail: string;
}

const COLOR_PRESETS = [
  { name: "Slate", class: "bg-slate-950 border-slate-700 text-slate-100" },
  { name: "Amber", class: "bg-amber-950/40 border-amber-500/30 text-amber-200" },
  { name: "Teal", class: "bg-teal-950/40 border-teal-500/30 text-teal-200" },
  { name: "Indigo", class: "bg-indigo-950/40 border-indigo-500/30 text-indigo-200" },
  { name: "Rose", class: "bg-rose-950/40 border-rose-500/30 text-rose-200" }
];

export default function WorkspaceKeep() {
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Note Creation State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("Slate");
  const [isPinned, setIsPinned] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Load notes in real-time
  useEffect(() => {
    const keepCollectionRef = collection(db, "keep_notes");
    const q = query(keepCollectionRef, orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesList: KeepNote[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notesList.push({
          id: docSnap.id,
          title: data.title || "",
          content: data.content || "",
          color: data.color || "Slate",
          pinned: !!data.pinned,
          timestamp: data.timestamp || new Date().toISOString(),
          authorEmail: data.authorEmail || "Anonymous"
        });
      });
      setNotes(notesList);
      setIsLoading(false);
    }, (err) => {
      console.error("Keep Firestore loading error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) return;

    try {
      await addDoc(collection(db, "keep_notes"), {
        title: title.trim(),
        content: content.trim(),
        color: selectedColor,
        pinned: isPinned,
        timestamp: new Date().toISOString(),
        authorEmail: auth.currentUser?.email || "Manager Partner"
      });

      // Reset Form State
      setTitle("");
      setContent("");
      setSelectedColor("Slate");
      setIsPinned(false);
    } catch (err) {
      console.error("Error creating note:", err);
    }
  };

  const handleTogglePin = async (note: KeepNote) => {
    try {
      const noteDocRef = doc(db, "keep_notes", note.id);
      await updateDoc(noteDocRef, {
        pinned: !note.pinned
      });
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  };

  const handleDeleteNote = async (noteId: string, noteTitle: string) => {
    const message = noteTitle 
      ? `Confirm action: Delete note titled "${noteTitle}" from corporate log workspace?` 
      : "Confirm action: Are you sure you want to delete this corporate workspace note?";
    
    // Explicit User Confirmation mandated
    const confirmed = window.confirm(message);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "keep_notes", noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const filteredNotes = notes.filter(note => {
    const q = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
  });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const renderNoteCard = (note: KeepNote) => {
    const colorStyle = COLOR_PRESETS.find(c => c.name === note.color) || COLOR_PRESETS[0];

    return (
      <div 
        key={note.id} 
        id={`keep-note-card-${note.id}`}
        className={`p-4 rounded-xl border transition-all hover:shadow-lg flex flex-col justify-between h-fit min-h-[140px] ${colorStyle.class}`}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-bold tracking-tight line-clamp-2">{note.title || "Untitled Note"}</h4>
            <button 
              id={`keep-note-pin-btn-${note.id}`}
              onClick={() => handleTogglePin(note)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                note.pinned 
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" 
                  : "bg-white/5 border-transparent text-slate-500 hover:text-slate-300"
              }`}
              title={note.pinned ? "Unpin note" : "Pin note"}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{note.content}</p>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-[9px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 shrink-0" />
            <span>{new Date(note.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <span className="text-slate-600">•</span>
            <span className="truncate max-w-[80px]" title={note.authorEmail}>{note.authorEmail.split("@")[0]}</span>
          </div>

          <button
            id={`keep-delete-${note.id}`}
            onClick={() => handleDeleteNote(note.id, note.title)}
            className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/40 border border-transparent hover:border-red-500/20 text-red-400 transition-colors cursor-pointer"
            title="Delete notes"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Sandbox Info Badge */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/10 text-[11px] text-cyan-200">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Corporate Note Engine Enabled:</strong> Persisted inside secure NKT Firestore collections. The central Keep notes wall automatically links operational schedules, charge snap briefs, and landlord lease checklists across verified personnel.
        </span>
      </div>

      {/* Title & Compose block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Creator Column */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-white/5 h-fit space-y-4">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <StickyNote className="w-4 h-4" /> Create Note Component
          </h3>

          <form onSubmit={handleCreateNote} className="space-y-3.5">
            <div>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-sans font-semibold"
              />
            </div>

            <div>
              <textarea
                placeholder="Take a note..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-sans resize-none"
                required
              />
            </div>

            {/* Color Select */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Note Backdrop Tint</label>
              <div className="flex items-center gap-1.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = selectedColor === preset.name;
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => setSelectedColor(preset.name)}
                      className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center shrink-0 cursor-pointer ${preset.class} ${
                        isSelected ? "ring-2 ring-cyan-400 scale-110" : ""
                      }`}
                      title={preset.name}
                    >
                      {isSelected && <Check className="w-3 h-3 text-cyan-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pin Toggle */}
            <div className="flex items-center justify-between py-1 bg-slate-950/30 rounded-xl px-3 border border-white/5">
              <span className="text-[10px] text-slate-400 font-sans font-medium">Pin Note on Top</span>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  isPinned 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                    : "bg-slate-950 border-white/10 text-slate-500"
                }`}
                title="Pin Note"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              id="keep-note-submit-btn"
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save Note
            </button>
          </form>
        </div>

        {/* List Grid Columns */}
        <div className="md:col-span-2 space-y-5">
          {/* Live note searches */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Keep tags, diagnostic briefs or custom titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 placeholder-slate-600 font-sans font-medium"
            />
          </div>

          {isLoading ? (
            <div className="py-24 text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Fetching secure Keep Ledger state...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 italic border border-dashed border-white/5 rounded-2xl bg-slate-950/10 font-sans flex flex-col items-center gap-3">
              <StickyNote className="w-8 h-8 text-slate-700 animate-pulse" />
              <span>Keep Notes ledger is empty. Start typing on the generator side logic to populate logs!</span>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Pinned section */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Pinned Notes ({pinnedNotes.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pinnedNotes.map((note) => renderNoteCard(note))}
                  </div>
                </div>
              )}

              {/* Others section */}
              {otherNotes.length > 0 && (
                <div className="space-y-2.5">
                  {pinnedNotes.length > 0 && (
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">General Archive</span>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherNotes.map((note) => renderNoteCard(note))}
                  </div>
                </div>
              )}

              {filteredNotes.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-500 italic">
                  No notes match your active filter search queries.
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
