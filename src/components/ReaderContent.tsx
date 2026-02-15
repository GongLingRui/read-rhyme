import { useState, useCallback, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import HighlightMenu from "./HighlightMenu";
import NoteInput from "./NoteInput";
import { mockContent } from "@/data/mockData";
import {
  useHighlightStore,
  type HighlightColor,
  type SavedHighlight,
} from "@/stores/highlightStore";
import { useAudioStore, generateMockTimeMap } from "@/stores/audioStore";

interface ReaderContentProps {
  title: string;
  author: string;
  bookId: string;
  sections?: string[] | null;
}

const HIGHLIGHT_BG: Record<HighlightColor, string> = {
  yellow: "bg-yellow-200/60",
  blue: "bg-blue-200/60",
  green: "bg-green-200/60",
  pink: "bg-pink-200/60",
};

const ReaderContent = ({ title, author, bookId, sections }: ReaderContentProps) => {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    blockIndex: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [noteInput, setNoteInput] = useState<{
    position: { x: number; y: number };
    text: string;
    blockIndex: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<number, HTMLElement>>(new Map());

  const addHighlight = useHighlightStore((s) => s.addHighlight);
  const allHighlights = useHighlightStore((s) => s.highlights);
  const bookHighlights = allHighlights.filter((h) => h.bookId === bookId);
  const { activeBlockIndex, seekToBlock, isPlaying, setParagraphTimeMap } = useAudioStore();

  const blocks = sections ?? mockContent.split("\n\n").filter(Boolean);

  // Initialize paragraph time map
  useEffect(() => {
    const map = generateMockTimeMap(blocks.length);
    setParagraphTimeMap(map);
  }, [blocks.length, setParagraphTimeMap]);

  // Auto-scroll to active block during playback
  useEffect(() => {
    if (activeBlockIndex !== null && isPlaying) {
      const el = blockRefs.current.get(activeBlockIndex);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeBlockIndex, isPlaying]);

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Find the block index
      let blockIndex = -1;
      let node: Node | null = range.startContainer;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.blockIndex) {
          blockIndex = parseInt(node.dataset.blockIndex, 10);
          break;
        }
        node = node.parentElement;
      }

      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setPendingSelection({
        text: selection.toString().trim(),
        blockIndex,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
      });
    } else {
      setMenuPosition(null);
      setPendingSelection(null);
    }
  }, []);

  const handleClickOutside = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setMenuPosition(null);
        setPendingSelection(null);
      }
    }, 200);
  }, []);

  const handleHighlight = (color: HighlightColor) => {
    if (!pendingSelection) return;
    addHighlight({
      bookId,
      text: pendingSelection.text,
      blockIndex: pendingSelection.blockIndex,
      startOffset: pendingSelection.startOffset,
      endOffset: pendingSelection.endOffset,
      color,
    });
    window.getSelection()?.removeAllRanges();
    setMenuPosition(null);
    setPendingSelection(null);
  };

  const handleNote = () => {
    if (!pendingSelection || !menuPosition) return;
    setNoteInput({
      position: menuPosition,
      text: pendingSelection.text,
      blockIndex: pendingSelection.blockIndex,
      startOffset: pendingSelection.startOffset,
      endOffset: pendingSelection.endOffset,
    });
    setMenuPosition(null);
  };

  const handleNoteSubmit = (note: string, color: HighlightColor) => {
    if (!noteInput) return;
    addHighlight({
      bookId,
      text: noteInput.text,
      blockIndex: noteInput.blockIndex,
      startOffset: noteInput.startOffset,
      endOffset: noteInput.endOffset,
      color,
      note,
    });
    window.getSelection()?.removeAllRanges();
    setNoteInput(null);
    setPendingSelection(null);
  };

  const handleSpeak = () => {
    if (!pendingSelection) return;
    seekToBlock(pendingSelection.blockIndex);
    window.getSelection()?.removeAllRanges();
    setMenuPosition(null);
    setPendingSelection(null);
  };

  // Get highlights for a specific block
  const getBlockHighlights = (blockIndex: number): SavedHighlight[] => {
    return bookHighlights.filter((h) => h.blockIndex === blockIndex);
  };

  // Render text with inline highlights
  const renderHighlightedText = (text: string, blockIndex: number) => {
    const highlights = getBlockHighlights(blockIndex);
    if (highlights.length === 0) return text;

    // Simple approach: wrap entire matched substrings
    let result: React.ReactNode[] = [];
    let lastEnd = 0;

    // Sort highlights by their position in the text
    const sorted = highlights
      .map((h) => {
        const idx = text.indexOf(h.text, 0);
        return { ...h, pos: idx };
      })
      .filter((h) => h.pos >= 0)
      .sort((a, b) => a.pos - b.pos);

    for (const h of sorted) {
      if (h.pos >= lastEnd) {
        if (h.pos > lastEnd) {
          result.push(text.slice(lastEnd, h.pos));
        }
        result.push(
          <mark
            key={h.id}
            className={`${HIGHLIGHT_BG[h.color]} rounded-sm px-0.5 transition-colors`}
            title={h.note || undefined}
          >
            {h.text}
            {h.note && (
              <span className="ml-0.5 inline-block text-[10px] text-primary align-super">
                💡
              </span>
            )}
          </mark>
        );
        lastEnd = h.pos + h.text.length;
      }
    }
    if (lastEnd < text.length) {
      result.push(text.slice(lastEnd));
    }

    return result.length > 0 ? result : text;
  };

  const renderBlock = (block: string, index: number) => {
    const isAudioActive = activeBlockIndex === index;

    const setRef = (el: HTMLElement | null) => {
      if (el) blockRefs.current.set(index, el);
      else blockRefs.current.delete(index);
    };

    if (block.startsWith("## ")) {
      return (
        <h2
          key={index}
          ref={setRef}
          data-block-index={index}
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
          ref={setRef}
          data-block-index={index}
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
          ref={setRef}
          data-block-index={index}
          className="mt-10 mb-6 text-2xl font-bold font-reading text-foreground"
        >
          {block.replace("# ", "")}
        </h1>
      );
    }

    return (
      <div
        key={index}
        ref={setRef}
        data-block-index={index}
        className={`group relative my-4 rounded-md transition-all duration-500 ${
          isAudioActive
            ? "bg-primary/8 border-l-3 border-primary pl-3 py-1"
            : ""
        }`}
      >
        <button
          onClick={() => seekToBlock(index)}
          className={`absolute -left-8 top-1 transition-opacity ${
            isAudioActive
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Play
            className={`h-4 w-4 ${
              isAudioActive ? "text-primary fill-primary" : "text-primary"
            }`}
          />
        </button>
        <p className="font-reading text-base leading-[1.9] text-foreground/90">
          {renderHighlightedText(block, index)}
        </p>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
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
          onHighlight={handleHighlight}
          onNote={handleNote}
          onSpeak={handleSpeak}
        />
      )}

      {noteInput && (
        <NoteInput
          position={noteInput.position}
          selectedText={noteInput.text}
          onSubmit={handleNoteSubmit}
          onClose={() => {
            setNoteInput(null);
            setPendingSelection(null);
          }}
        />
      )}
    </div>
  );
};

export default ReaderContent;
