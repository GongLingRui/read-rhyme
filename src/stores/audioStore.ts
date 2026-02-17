import { create } from "zustand";

/** Paragraph → timestamp mapping (from backend or estimated) */
export interface ParagraphTimeMap {
  [blockIndex: number]: { start: number; end: number };
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  activeBlockIndex: number | null;
  paragraphTimeMap: ParagraphTimeMap;
  /** 段落原文，用于阅读页 TTS 朗读，不依赖 DOM */
  blockTexts: string[];
  audioUrl: string | null;
  /** 当前生成的音频URL列表（按段落索引） */
  blockAudioUrls: Map<number, string>;
  /** 是否正在生成音频 */
  isGenerating: boolean;
  /** TTS 模式 */
  ttsMode: 'web-speech' | 'local-tts';

  setPlaying: (v: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  cycleSpeed: () => void;
  seekToBlock: (blockIndex: number) => void;
  setActiveBlock: (index: number | null) => void;
  setParagraphTimeMap: (map: ParagraphTimeMap) => void;
  setBlockTexts: (texts: string[]) => void;
  setAudioUrl: (url: string | null) => void;
  setBlockAudioUrl: (blockIndex: number, url: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setTtsMode: (mode: 'web-speech' | 'local-tts') => void;
  reset: () => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

const initialState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  speed: 1.0,
  activeBlockIndex: null,
  paragraphTimeMap: {},
  blockTexts: [],
  audioUrl: null,
  blockAudioUrls: new Map<number, string>(),
  isGenerating: false,
  ttsMode: 'local-tts' as const,
};

export const useAudioStore = create<AudioState>((set, get) => ({
  ...initialState,

  setPlaying: (v) => set({ isPlaying: v }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setCurrentTime: (t) => {
    set({ currentTime: t });
    // Determine which block is active based on time
    const map = get().paragraphTimeMap;
    let found: number | null = null;
    for (const [idx, range] of Object.entries(map)) {
      if (t >= range.start && t < range.end) {
        found = Number(idx);
        break;
      }
    }
    set({ activeBlockIndex: found });
  },
  setDuration: (d) => set({ duration: d }),
  cycleSpeed: () => {
    const current = get().speed;
    const idx = SPEEDS.indexOf(current);
    set({ speed: SPEEDS[(idx + 1) % SPEEDS.length] });
  },
  seekToBlock: (blockIndex) => {
    const map = get().paragraphTimeMap;
    const range = map[blockIndex];
    if (range) {
      set({ currentTime: range.start, activeBlockIndex: blockIndex, isPlaying: true });
      return true;
    }
    return false;
  },
  setActiveBlock: (index) => set({ activeBlockIndex: index }),
  setParagraphTimeMap: (map) => set({ paragraphTimeMap: map }),
  setBlockTexts: (texts) => set({ blockTexts: texts }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setBlockAudioUrl: (blockIndex, url) => {
    set((state) => {
      const newMap = new Map(state.blockAudioUrls);
      newMap.set(blockIndex, url);
      return { blockAudioUrls: newMap };
    });
  },
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setTtsMode: (mode) => set({ ttsMode: mode }),
  reset: () => set(initialState),
}));

/**
 * Estimate reading time based on text length.
 * Average reading speed: ~250-300 characters per minute for Chinese,
 * ~200-250 words per minute for English.
 * We use a conservative estimate of 200 chars/min.
 */
export function estimateReadingTime(text: string): number {
  // Remove extra whitespace
  const cleanText = text.replace(/\s+/g, " ").trim();
  const charCount = cleanText.length;

  // Estimate: 200 characters per minute
  const charsPerMinute = 200;
  const estimatedMinutes = charCount / charsPerMinute;

  // Convert to seconds
  return Math.max(1, Math.round(estimatedMinutes * 60));
}

/**
 * Generate a paragraph-to-time mapping based on text content.
 * This estimates timing for each paragraph when no TTS audio is available.
 * In production, this would come from the backend alongside audio generation.
 */
export function generateTimeMap(blocks: string[]): ParagraphTimeMap {
  const map: ParagraphTimeMap = {};
  let cursor = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    // Estimate time for this block
    const blockTime = estimateReadingTime(block);

    map[i] = {
      start: cursor,
      end: cursor + blockTime,
    };

    cursor += blockTime;
  }

  // Update total duration
  const { setDuration } = useAudioStore.getState();
  setDuration(cursor);

  return map;
}

/**
 * Legacy function for backward compatibility.
 * Use generateTimeMap(blocks) instead.
 */
export function generateMockTimeMap(blockCount: number): ParagraphTimeMap {
  const map: ParagraphTimeMap = {};
  const avgTimePerBlock = 30; // 30 seconds average per block
  let cursor = 0;

  for (let i = 0; i < blockCount; i++) {
    map[i] = {
      start: cursor,
      end: cursor + avgTimePerBlock,
    };
    cursor += avgTimePerBlock;
  }

  useAudioStore.getState().setDuration(cursor);
  return map;
}
