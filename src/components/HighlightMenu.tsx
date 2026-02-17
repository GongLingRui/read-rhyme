import { useState } from "react";
import { Highlighter, MessageSquare } from "lucide-react";
import { type HighlightColor } from "@/stores/highlightStore";

interface HighlightMenuProps {
  position: { x: number; y: number };
  onHighlight: (color: HighlightColor) => void;
  onNote: () => void;
}

const COLORS: { color: HighlightColor; bg: string; label: string }[] = [
  { color: "yellow", bg: "bg-yellow-300", label: "黄" },
  { color: "blue", bg: "bg-blue-300", label: "蓝" },
  { color: "green", bg: "bg-green-300", label: "绿" },
  { color: "pink", bg: "bg-pink-300", label: "粉" },
];

const HighlightMenu = ({ position, onHighlight, onNote }: HighlightMenuProps) => {
  const [showColors, setShowColors] = useState(false);

  return (
    <div
      className="fixed z-50 flex flex-col items-center gap-1 animate-fade-in"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -120%)",
      }}
    >
      {/* Color picker row */}
      {showColors && (
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-lg animate-fade-in">
          {COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => {
                onHighlight(c.color);
                setShowColors(false);
              }}
              className={`h-6 w-6 rounded-full ${c.bg} transition-transform hover:scale-110 border border-border/50`}
              title={c.label}
            />
          ))}
        </div>
      )}

      {/* Main menu */}
      <div className="flex items-center gap-0.5 rounded-lg border bg-card p-1 shadow-lg">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowColors(!showColors);
          }}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
        >
          <Highlighter className="h-3.5 w-3.5" />
          划线
        </button>
        <div className="h-4 w-px bg-border" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNote();
          }}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          想法
        </button>
      </div>
    </div>
  );
};

export default HighlightMenu;
