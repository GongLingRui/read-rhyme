import { useState, useCallback, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import HighlightMenu from "./HighlightMenu";
import NoteInput from "./NoteInput";
import {
  useHighlightStore,
  type HighlightColor,
  type SavedHighlight,
} from "@/stores/highlightStore";
import { useThoughtStore } from "@/stores/thoughtStore";
import { useAudioStore, generateTimeMap } from "@/stores/audioStore";

interface ReaderContentProps {
  title: string;
  author: string;
  bookId: string;
  content: string;
}

const HIGHLIGHT_BG: Record<HighlightColor, string> = {
  yellow: "bg-yellow-200/60",
  blue: "bg-blue-200/60",
  green: "bg-green-200/60",
  pink: "bg-pink-200/60",
};

const ReaderContent = ({ title, author, bookId, content }: ReaderContentProps) => {
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
  const {
    activeBlockIndex,
    seekToBlock,
    isPlaying,
    setParagraphTimeMap,
    setBlockTexts,
    setActiveBlock,
    setPlaying,
  } = useAudioStore();
  const createThought = useThoughtStore((s) => s.createThought);

  const blocks = content.split("\n\n").filter(Boolean);

  // Initialize paragraph time map 与段落原文（供底部播放器 Web Speech 朗读，不依赖 DOM）
  useEffect(() => {
    const blocksFromContent = content.split("\n\n").filter(Boolean);
    const map = generateTimeMap(blocksFromContent);
    setParagraphTimeMap(map);
    setBlockTexts(blocksFromContent);
  }, [content, setParagraphTimeMap, setBlockTexts]);

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

      // Find the block index and block root element
      let blockIndex = -1;
      let blockEl: HTMLElement | null = null;
      let node: Node | null = range.startContainer;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.blockIndex !== undefined) {
          blockEl = node;
          blockIndex = parseInt(node.dataset.blockIndex, 10);
          break;
        }
        node = node.parentElement;
      }

      // 计算相对于整段文字的字符偏移（这样渲染时可用 startOffset/endOffset 正确切片）
      let startOffset = range.startOffset;
      let endOffset = range.endOffset;
      if (blockEl) {
        try {
          const preRange = document.createRange();
          preRange.selectNodeContents(blockEl);
          preRange.setEnd(range.startContainer, range.startOffset);
          startOffset = preRange.toString().length;
          preRange.setEnd(range.endContainer, range.endOffset);
          endOffset = preRange.toString().length;
        } catch {
          // 降级使用 range 自带的 offset
        }
      }

      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setPendingSelection({
        text: selection.toString().trim(),
        blockIndex,
        startOffset,
        endOffset,
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

  const handleHighlight = async (color: HighlightColor) => {
    if (!pendingSelection) return;
    try {
      await addHighlight(bookId, {
        text: pendingSelection.text,
        start_offset: pendingSelection.startOffset,
        end_offset: pendingSelection.endOffset,
        color,
        chapter: pendingSelection.blockIndex.toString(),
      });
      window.getSelection()?.removeAllRanges();
      setMenuPosition(null);
      setPendingSelection(null);
    } catch (error) {
      console.error("Failed to add highlight:", error);
    }
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

  const handleNoteSubmit = async (note: string, color: HighlightColor) => {
    if (!noteInput) return;
    try {
      // 创建带笔记的高亮
      await addHighlight(bookId, {
        text: noteInput.text,
        start_offset: noteInput.startOffset,
        end_offset: noteInput.endOffset,
        color,
        note,
        chapter: noteInput.blockIndex.toString(),
      });

      // 同时创建想法（Thought）用于"我的想法"列表显示
      // 格式：原文 + 笔记内容
      const thoughtContent = `原文：${noteInput.text}\n\n想法：${note}`;
      await createThought(bookId, thoughtContent);

      window.getSelection()?.removeAllRanges();
      setNoteInput(null);
      setPendingSelection(null);
    } catch (error) {
      console.error("Failed to add highlight or thought:", error);
    }
  };

  const handleSpeak = () => {
    if (!pendingSelection) return;

    const text = pendingSelection.text?.trim();
    if (!text) return;

    console.log("[ReaderContent] handleSpeak selection text:", text.slice(0, 80));

    // 清除选择和菜单
    window.getSelection()?.removeAllRanges();
    setMenuPosition(null);
    setPendingSelection(null);

    // 使用浏览器 Web Speech API 只朗读选中的这段文本（不依赖底部全局播放器）
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("[ReaderContent] speechSynthesis not available in browser");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        console.log("[ReaderContent] Speak selection started");
      };
      utterance.onend = () => {
        console.log("[ReaderContent] Speak selection finished");
      };
      utterance.onerror = (e) => {
        console.error("[ReaderContent] Speak selection error:", e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("[ReaderContent] Failed to speak selection:", e);
    }
  };

  // Get highlights for a specific block (chapter 存的是 block 索引字符串 "0","1",...)
  const getBlockHighlights = (blockIndex: number): SavedHighlight[] => {
    const blockIndexStr = blockIndex.toString();
    return bookHighlights.filter(
      (h) => h.chapter === blockIndexStr || Number(h.chapter) === blockIndex
    );
  };

  // Render text with inline highlights（优先用 startOffset/endOffset 定位，避免文本空格差异导致不显示）
  const renderHighlightedText = (text: string, blockIndex: number) => {
    const highlights = getBlockHighlights(blockIndex);
    if (highlights.length === 0) return text;

    const result: React.ReactNode[] = [];
    let lastEnd = 0;

    // 按起始位置排序；位置优先用 startOffset，不合法时回退到 indexOf
    const sorted = highlights
      .map((h) => {
        const start = h.startOffset;
        const end = h.endOffset;
        const validRange =
          typeof start === "number" &&
          typeof end === "number" &&
          start >= 0 &&
          end <= text.length &&
          start < end;
        const pos = validRange ? start : text.indexOf(h.text, lastEnd);
        return { ...h, start: validRange ? start : pos, end: validRange ? end : pos >= 0 ? pos + h.text.length : -1 };
      })
      .filter((h) => h.start >= 0 && h.end > h.start)
      .sort((a, b) => a.start - b.start);

    for (const h of sorted) {
      if (h.start >= lastEnd) {
        if (h.start > lastEnd) {
          result.push(text.slice(lastEnd, h.start));
        }
        result.push(
          <mark
            key={h.id}
            className={`${HIGHLIGHT_BG[h.color]} rounded-sm px-0.5 transition-colors`}
            title={h.note?.content || undefined}
          >
            {h.text}
            {h.note && (
              <span className="ml-0.5 inline-block text-[10px] text-primary align-super">
                💡
              </span>
            )}
          </mark>
        );
        lastEnd = Math.max(lastEnd, h.end);
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
          className={`mt-10 mb-4 text-xl font-semibold font-reading text-foreground relative group cursor-pointer ${
            isAudioActive ? "text-primary" : ""
          }`}
          onClick={() => {
            // 使用全局播放器按时间轴跳到该段并开始播放（支持 WebSpeech 和真实音频）
            if (!seekToBlock(index)) {
              // 如果还没有 time map（极端情况），至少高亮并启动播放
              setActiveBlock(index);
              setPlaying(true);
            }
          }}
        >
          <span className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-4 w-4 text-primary" />
          </span>
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
          className={`mt-8 mb-3 text-lg font-medium font-reading text-foreground relative group cursor-pointer ${
            isAudioActive ? "text-primary" : ""
          }`}
          onClick={() => {
            if (!seekToBlock(index)) {
              setActiveBlock(index);
              setPlaying(true);
            }
          }}
        >
          <span className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-4 w-4 text-primary" />
          </span>
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
          className={`mt-10 mb-6 text-2xl font-bold font-reading text-foreground relative group cursor-pointer ${
            isAudioActive ? "text-primary" : ""
          }`}
          onClick={() => {
            if (!seekToBlock(index)) {
              setActiveBlock(index);
              setPlaying(true);
            }
          }}
        >
          <span className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-4 w-4 text-primary" />
          </span>
          {block.replace("# ", "")}
        </h1>
      );
    }

    return (
      <div
        key={index}
        ref={setRef}
        data-block-index={index}
        className={`group relative my-4 rounded-md transition-all duration-500 cursor-pointer ${
          isAudioActive
            ? "bg-primary/8 border-l-3 border-primary pl-3 py-1"
            : ""
        }`}
        onClick={() => {
          if (!seekToBlock(index)) {
            setActiveBlock(index);
            setPlaying(true);
          }
        }}
      >
        <span
          className={`absolute -left-8 top-1 transition-opacity pointer-events-none ${
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
        </span>
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
