import { Highlighter, MessageSquare, Volume2 } from "lucide-react";

interface HighlightMenuProps {
  position: { x: number; y: number };
  onHighlight: () => void;
  onNote: () => void;
  onSpeak: () => void;
}

const HighlightMenu = ({ position, onHighlight, onNote, onSpeak }: HighlightMenuProps) => {
  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border bg-card p-1 shadow-lg animate-fade-in"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -120%)",
      }}
    >
      <button
        onClick={onHighlight}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
      >
        <Highlighter className="h-3.5 w-3.5" />
        划线
      </button>
      <div className="h-4 w-px bg-border" />
      <button
        onClick={onNote}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        想法
      </button>
      <div className="h-4 w-px bg-border" />
      <button
        onClick={onSpeak}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
      >
        <Volume2 className="h-3.5 w-3.5" />
        听这段
      </button>
    </div>
  );
};

export default HighlightMenu;
