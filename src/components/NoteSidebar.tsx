import { useState, useMemo } from "react";
import { List, StickyNote, X, Trash2, Clock, BookOpen } from "lucide-react";
import { useHighlightStore, type SavedHighlight } from "@/stores/highlightStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookContent?: string;
}

const HIGHLIGHT_DOT: Record<string, string> = {
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  green: "bg-green-400",
  pink: "bg-pink-400",
};

const HIGHLIGHT_COLOR_NAME: Record<string, string> = {
  yellow: "黄色",
  blue: "蓝色",
  green: "绿色",
  pink: "粉色",
};

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
}

type Tab = "toc" | "notes";

interface Chapter {
  id: string;
  title: string;
  level: number;
  blockIndex: number;
}

const NoteSidebar = ({ isOpen, onClose, bookId, bookContent }: NoteSidebarProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("toc");
  const [selectedHighlight, setSelectedHighlight] = useState<SavedHighlight | null>(null);
  const bookHighlights = useHighlightStore((s) => s.highlights).filter((h) => h.bookId === bookId);
  const deleteHighlight = useHighlightStore((s) => s.deleteHighlight);

  // Extract chapters from book content
  const chapters = useMemo(() => {
    if (!bookContent) return [];

    const blocks = bookContent.split("\n\n").filter(Boolean);
    const extractedChapters: Chapter[] = [];
    let blockIndex = 0;

    for (const block of blocks) {
      const trimmedBlock = block.trim();
      if (trimmedBlock.startsWith("# ")) {
        extractedChapters.push({
          id: `chapter-${blockIndex}`,
          title: trimmedBlock.replace("# ", "").trim(),
          level: 1,
          blockIndex,
        });
      } else if (trimmedBlock.startsWith("## ")) {
        extractedChapters.push({
          id: `chapter-${blockIndex}`,
          title: trimmedBlock.replace("## ", "").trim(),
          level: 2,
          blockIndex,
        });
      } else if (trimmedBlock.startsWith("### ")) {
        extractedChapters.push({
          id: `chapter-${blockIndex}`,
          title: trimmedBlock.replace("### ", "").trim(),
          level: 3,
          blockIndex,
        });
      }
      blockIndex++;
    }

    return extractedChapters;
  }, [bookContent]);

  // Handle chapter click - scroll to block
  const handleChapterClick = (blockIndex: number) => {
    const element = document.querySelector(`[data-block-index="${blockIndex}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle highlight view
  const handleViewHighlight = (highlight: SavedHighlight) => {
    setSelectedHighlight(highlight);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            {chapters.length === 0 ? (
              <div className="py-8 text-center">
                <List className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  暂无目录
                </p>
              </div>
            ) : (
              chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter.blockIndex)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    chapter.level === 1
                      ? "font-medium text-foreground"
                      : `text-muted-foreground ${chapter.level === 2 ? "pl-6" : "pl-10"}`
                  }`}
                >
                  {chapter.title}
                </button>
              ))
            )}
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
                  onDelete={() => deleteHighlight(h.id)}
                  onView={() => handleViewHighlight(h)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedHighlight} onOpenChange={() => setSelectedHighlight(null)}>
        <DialogContent className="max-w-2xl">
          {selectedHighlight && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      HIGHLIGHT_DOT[selectedHighlight.color] ?? "bg-yellow-400"
                    }`}
                  />
                  <DialogTitle>笔记详情</DialogTitle>
                </div>
                <DialogDescription>
                  查看和管理您的划线笔记
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Highlighted Text */}
                <div className="rounded-lg border bg-accent/10 p-4">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>划线内容</span>
                  </div>
                  <p className="text-base leading-relaxed font-reading text-foreground">
                    {selectedHighlight.text}
                  </p>
                </div>

                {/* Note */}
                {selectedHighlight.note && (
                  <div className="rounded-lg border bg-primary/5 p-4">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <StickyNote className="h-4 w-4" />
                      <span>我的笔记</span>
                    </div>
                    <p className="text-base leading-relaxed text-foreground">
                      {selectedHighlight.note.content}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>创建于 {formatDate(selectedHighlight.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        HIGHLIGHT_DOT[selectedHighlight.color] ?? "bg-yellow-400"
                      }`}
                    />
                    <span>{HIGHLIGHT_COLOR_NAME[selectedHighlight.color] || selectedHighlight.color}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    onClick={() => {
                      // Scroll to highlight
                      if (selectedHighlight.chapter !== undefined && selectedHighlight.chapter !== null) {
                        const blockIndex = parseInt(selectedHighlight.chapter, 10);
                        const element = document.querySelector(`[data-block-index="${blockIndex}"]`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }
                      setSelectedHighlight(null);
                    }}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                  >
                    跳转到原文位置
                  </button>
                  <button
                    onClick={() => {
                      deleteHighlight(selectedHighlight.id);
                      setSelectedHighlight(null);
                    }}
                    className="px-4 py-2 rounded-md border border-destructive text-destructive text-sm hover:bg-destructive/10 transition-colors"
                  >
                    删除笔记
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function HighlightCard({
  highlight,
  onDelete,
  onView,
}: {
  highlight: SavedHighlight;
  onDelete: () => void;
  onView: () => void;
}) {
  return (
    <div
      className="group rounded-lg border p-3 transition-all hover:shadow-md hover:bg-accent/50 cursor-pointer"
      onClick={onView}
    >
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
              💡 {highlight.note.content}
            </p>
          )}
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {highlight.createdAt}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
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
