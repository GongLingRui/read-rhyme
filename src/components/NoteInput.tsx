import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type HighlightColor } from "@/stores/highlightStore";

interface NoteInputProps {
  position: { x: number; y: number };
  selectedText: string;
  onSubmit: (note: string, color: HighlightColor) => void;
  onClose: () => void;
}

const COLORS: { color: HighlightColor; bg: string }[] = [
  { color: "yellow", bg: "bg-yellow-300" },
  { color: "blue", bg: "bg-blue-300" },
  { color: "green", bg: "bg-green-300" },
  { color: "pink", bg: "bg-pink-300" },
];

const NoteInput = ({ position, selectedText, onSubmit, onClose }: NoteInputProps) => {
  const [note, setNote] = useState("");
  const [color, setColor] = useState<HighlightColor>("yellow");

  return (
    <div
      className="fixed z-50 w-72 rounded-lg border bg-card p-3 shadow-xl animate-fade-in"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: position.y + 8,
        transform: "translateX(-50%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Selected text preview */}
      <p className="mb-2 text-xs text-muted-foreground line-clamp-2 font-reading">
        "{selectedText}"
      </p>

      {/* Color picker */}
      <div className="mb-2 flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c.color}
            onClick={() => setColor(c.color)}
            className={`h-5 w-5 rounded-full ${c.bg} transition-all ${
              color === c.color
                ? "ring-2 ring-primary ring-offset-1 scale-110"
                : "hover:scale-105"
            }`}
          />
        ))}
      </div>

      {/* Note textarea */}
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="写下你的想法…"
        className="w-full resize-none rounded-md border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(note, color);
          }
        }}
      />

      {/* Actions */}
      <div className="mt-2 flex items-center justify-between">
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <Button
          size="sm"
          className="h-7 gap-1 px-2.5 text-xs"
          onClick={() => onSubmit(note, color)}
        >
          <Send className="h-3 w-3" />
          保存
        </Button>
      </div>
    </div>
  );
};

export default NoteInput;
