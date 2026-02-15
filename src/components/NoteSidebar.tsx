import { useState } from "react";
import { List, StickyNote, X, Trash2 } from "lucide-react";
import { mockChapters } from "@/data/mockData";
import { useHighlightStore, type SavedHighlight } from "@/stores/highlightStore";

const HIGHLIGHT_DOT: Record<string, string> = {
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  green: "bg-green-400",
  pink: "bg-pink-400",
};

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
}

type Tab = "toc" | "notes";

const NoteSidebar = ({ isOpen, onClose, bookId }: NoteSidebarProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("toc");
  const bookHighlights = useHighlightStore((s) => s.highlights).filter((h) => h.bookId === bookId);
  const removeHighlight = useHighlightStore((s) => s.removeHighlight);

  if (!isOpen) return null;

  return (
    <div className="flex h-full w-80 flex-col border-l bg-card animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("toc")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              activeTab === "toc"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-4 w-4" />
            目录
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              activeTab === "notes"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <StickyNote className="h-4 w-4" />
            笔记
            {bookHighlights.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
                {bookHighlights.length}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeTab === "toc" ? (
          <div className="space-y-1">
            {mockChapters.map((chapter) => (
              <button
                key={chapter.id}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  chapter.level === 1
                    ? "font-medium text-foreground"
                    : "pl-6 text-muted-foreground"
                }`}
              >
                {chapter.title}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {bookHighlights.length === 0 ? (
              <div className="py-8 text-center">
                <StickyNote className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  还没有笔记，选中文字开始划线吧
                </p>
              </div>
            ) : (
              bookHighlights.map((h) => (
                <HighlightCard
                  key={h.id}
                  highlight={h}
                  onDelete={() => removeHighlight(h.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function HighlightCard({
  highlight,
  onDelete,
}: {
  highlight: SavedHighlight;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-lg border p-3 transition-colors hover:bg-accent/50">
      <div className="flex items-start gap-2">
        <div
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            HIGHLIGHT_DOT[highlight.color] ?? "bg-yellow-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-foreground font-reading line-clamp-3">
            {highlight.text}
          </p>
          {highlight.note && (
            <p className="mt-1.5 text-xs text-primary italic">
              💡 {highlight.note}
            </p>
          )}
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {highlight.createdAt}
            </span>
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteSidebar;
