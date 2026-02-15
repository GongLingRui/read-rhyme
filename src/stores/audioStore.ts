import { create } from "zustand";

/** Simulated paragraph → timestamp mapping (from backend) */
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

  setPlaying: (v: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  cycleSpeed: () => void;
  seekToBlock: (blockIndex: number) => void;
  setActiveBlock: (index: number | null) => void;
  setParagraphTimeMap: (map: ParagraphTimeMap) => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 590, // ~9:50 mock duration
  speed: 1.0,
  activeBlockIndex: null,
  paragraphTimeMap: {},

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
    }
  },
  setActiveBlock: (index) => set({ activeBlockIndex: index }),
  setParagraphTimeMap: (map) => set({ paragraphTimeMap: map }),
}));

/**
 * Generate a mock paragraph-to-time mapping.
 * In production, this comes from the backend alongside audio generation.
 */
export function generateMockTimeMap(blockCount: number): ParagraphTimeMap {
  const map: ParagraphTimeMap = {};
  const avgDuration = 590 / Math.max(blockCount, 1);
  let cursor = 0;
  for (let i = 0; i < blockCount; i++) {
    const dur = avgDuration * (0.6 + Math.random() * 0.8);
    map[i] = { start: cursor, end: cursor + dur };
    cursor += dur;
  }
  return map;
}
