import { useState, useCallback } from "react";
import { Play } from "lucide-react";
import HighlightMenu from "./HighlightMenu";
import { mockContent } from "@/data/mockData";

interface ReaderContentProps {
  title: string;
  author: string;
  sections?: string[] | null;
}

const ReaderContent = ({ title, author, sections }: ReaderContentProps) => {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    } else {
      setMenuPosition(null);
    }
  }, []);

  const handleClickOutside = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setMenuPosition(null);
      }
    }, 100);
  }, []);

  // Use uploaded sections or fallback to mock content
  const blocks = sections ?? mockContent.split("\n\n").filter(Boolean);

  const renderBlock = (block: string, index: number) => {
    const isActive = activeBlock === index;

    if (block.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="mt-10 mb-4 text-xl font-semibold font-reading text-foreground"
        >
          {block.replace("## ", "")}
        </h2>
      );
    }

    if (block.startsWith("### ")) {
      return (
        <h3
          key={index}
          className="mt-8 mb-3 text-lg font-medium font-reading text-foreground"
        >
          {block.replace("### ", "")}
        </h3>
      );
    }

    if (block.startsWith("# ")) {
      return (
        <h1
          key={index}
          className="mt-10 mb-6 text-2xl font-bold font-reading text-foreground"
        >
          {block.replace("# ", "")}
        </h1>
      );
    }

    return (
      <div
        key={index}
        className={`group relative my-4 ${isActive ? "reading-active" : ""}`}
      >
        <button
          onClick={() => setActiveBlock(isActive ? null : index)}
          className="absolute -left-8 top-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Play className="h-4 w-4 text-primary" />
        </button>
        <p className="font-reading text-base leading-[1.9] text-foreground/90">
          {block}
        </p>
      </div>
    );
  };

  return (
    <div
      className="mx-auto max-w-2xl px-8 py-10 pb-28"
      onMouseUp={handleTextSelect}
      onClick={handleClickOutside}
    >
      <div className="mb-8 border-b pb-6">
        <h1 className="font-reading text-2xl font-bold text-foreground">
          {title}
        </h1>
        {author && (
          <p className="mt-1 text-sm text-muted-foreground">{author} · 著</p>
        )}
      </div>

      <div className="select-text">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>

      {menuPosition && (
        <HighlightMenu
          position={menuPosition}
          onHighlight={() => setMenuPosition(null)}
          onNote={() => setMenuPosition(null)}
          onSpeak={() => setMenuPosition(null)}
        />
      )}
    </div>
  );
};

export default ReaderContent;
