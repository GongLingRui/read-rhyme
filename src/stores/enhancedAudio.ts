/**
 * Enhanced Audio Playback Store
 * Connects with real backend audio and supports paragraph-based navigation
 */

import { create } from 'zustand';
import { audioApi } from '@/services';

interface AudioChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker: string;
  emotion?: string;
}

interface PlaybackState {
  // Audio state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;

  // Current audio info
  audioUrl: string | null;
  projectId: string | null;

  // Chapter navigation
  chapters: AudioChapter[];
  currentChapterIndex: number;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Waveform data (for visualization)
  waveform: number[] | null;

  // Actions
  loadAudio: (projectId: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  goToChapter: (index: number) => void;
  nextChapter: () => void;
  previousChapter: () => void;
  updateTime: (time: number) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const useEnhancedAudioStore = create<PlaybackState>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1.0,
  playbackRate: 1.0,
  audioUrl: null,
  projectId: null,
  chapters: [],
  currentChapterIndex: 0,
  isLoading: false,
  error: null,
  waveform: null,

  // Actions
  loadAudio: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Fetch final audio from backend
      const response = await audioApi.getAudio(projectId);

      if (response.data && response.data.audio_url) {
        // Build chapter list from chunks
        const chunksResponse = await audioApi.getChunks(projectId);

        const chapters: AudioChapter[] = (chunksResponse.data || []).map((chunk, index) => ({
          id: chunk.id,
          title: `${chunk.speaker} - 第${index + 1}段`,
          startTime: chunk.start_time || 0,
          endTime: chunk.end_time || 0,
          text: chunk.text,
          speaker: chunk.speaker,
          emotion: chunk.emotion,
        }));

        // Calculate end times based on start times and durations
        let currentTime = 0;
        chapters.forEach((chapter, index) => {
          chapter.startTime = currentTime;
          if (chapter.endTime > 0) {
            currentTime = chapter.endTime;
          } else {
            // Estimate from text length (rough estimate: 150 chars per minute)
            const estimatedDuration = (chapter.text.length / 150) * 60;
            currentTime += estimatedDuration;
            chapter.endTime = currentTime;
          }
        });

        set({
          audioUrl: response.data.audio_url,
          projectId,
          chapters,
          duration: chapters[chapters.length - 1]?.endTime || 0,
          currentChapterIndex: 0,
          isLoading: false,
        });
      } else {
        throw new Error('没有找到音频文件');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载音频失败',
        isLoading: false,
      });
    }
  },

  play: () => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio && get().audioUrl) {
      audio.src = get().audioUrl!;
      audio.play();
      set({ isPlaying: true });
    }
  },

  pause: () => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio) {
      audio.pause();
      set({ isPlaying: false });
    }
  },

  stop: () => {
    get().pause();
    set({ currentTime: 0, currentChapterIndex: 0 });
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
    }
  },

  seek: (time: number) => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = time;
      set({ currentTime: time });
    }
  },

  setVolume: (volume: number) => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
      set({ volume });
    }
  },

  setPlaybackRate: (rate: number) => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio) {
      audio.playbackRate = Math.max(0.5, Math.min(2, rate));
      set({ playbackRate: rate });
    }
  },

  goToChapter: (index: number) => {
    const { chapters } = get();
    if (index >= 0 && index < chapters.length) {
      set({ currentChapterIndex: index });
      get().seek(chapters[index].startTime);
    }
  },

  nextChapter: () => {
    const { currentChapterIndex, chapters } = get();
    if (currentChapterIndex < chapters.length - 1) {
      get().goToChapter(currentChapterIndex + 1);
    }
  },

  previousChapter: () => {
    const { currentChapterIndex } = get();
    if (currentChapterIndex > 0) {
      get().goToChapter(currentChapterIndex - 1);
    }
  },

  updateTime: (time: number) => {
    set({ currentTime: time });

    // Auto-update current chapter
    const { chapters } = get();
    for (let i = 0; i < chapters.length; i++) {
      if (time >= chapters[i].startTime && time < chapters[i].endTime) {
        if (i !== get().currentChapterIndex) {
          set({ currentChapterIndex: i });
        }
        break;
      }
    }
  },

  setError: (error: string) => set({ error }),
  clearError: () => set({ error: null }),
}));

// Selector hooks
export const useCurrentChapter = () => {
  const { chapters, currentChapterIndex } = useEnhancedAudioStore();
  return chapters[currentChapterIndex] || null;
};

export const useChapterProgress = () => {
  const { chapters, currentChapterIndex, currentTime, duration } = useEnhancedAudioStore();

  if (chapters.length === 0) {
    return {
      current: 0,
      total: 0,
      percentage: 0,
      currentChapter: null,
      remainingChapters: 0,
    };
  }

  const currentChapter = chapters[currentChapterIndex];
  const chapterProgress = currentChapter
    ? ((currentTime - currentChapter.startTime) / (currentChapter.endTime - currentChapter.startTime)) * 100
    : 0;

  return {
    current: currentChapterIndex + 1,
    total: chapters.length,
    percentage: Math.min(100, Math.max(0, chapterProgress)),
    currentChapter,
    remainingChapters: chapters.length - currentChapterIndex - 1,
  };
};
