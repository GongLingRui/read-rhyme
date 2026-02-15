import { useState } from "react";
import { List, StickyNote, X } from "lucide-react";
import { mockChapters, mockHighlights } from "@/data/mockData";

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "toc" | "notes";

const NoteSidebar = ({ isOpen, onClose }: NoteSidebarProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("toc");

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
          <div className="space-y-4">
            {mockHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className="rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <p className="text-sm leading-relaxed text-foreground font-reading reading-highlight inline">
                  {highlight.text}
                </p>
                {highlight.note && (
                  <p className="mt-2 text-xs text-primary italic">
                    💡 {highlight.note}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {highlight.chapter}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {highlight.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteSidebar;
