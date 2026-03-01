import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";

interface Note {
  id: number;
  text: string;
  date: string;
}

interface NotesFeedProps {
  notes: Note[];
  isLoading?: boolean;
  onAdd: (text: string) => Promise<void>;
  onDelete: (id: number) => void;
}

export function NotesFeed({ notes, isLoading, onAdd, onDelete }: NotesFeedProps) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await onAdd(text);
      setDraft("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          placeholder="Add a note… (⌘+Enter to save)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!draft.trim() || submitting}
          >
            {submitting ? "Saving…" : "Add note"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative rounded-md border bg-card p-3 text-sm"
            >
              <MarkdownContent>{note.text}</MarkdownContent>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <time>{new Date(note.date).toLocaleString()}</time>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
