/**
 * Shared type definitions for the application
 */

// Book types
export interface Book {
  id: string;
  title: string;
  author?: string;
  cover?: string;
  coverUrl?: string;
  progress: number;
  totalChapters?: number;
  currentChapter?: number;
  // For uploaded books
  sections?: string[];
  audioUrl?: string;
}

// Project types
export interface Project {
  id: string;
  bookId: string;
  bookTitle?: string;
  name: string;
  description?: string;
  status: "draft" | "processing" | "completed" | "failed";
  audioPath?: string;
  duration?: number;
  progress?: {
    totalChunks: number;
    completedChunks: number;
    percentage: number;
  };
}

// Script types
export interface ScriptEntry {
  index: number;
  speaker: string;
  text: string;
  instruct?: string;
  emotion?: string;
  section?: string;
}

// Chunk types
export interface Chunk {
  id: string;
  speaker: string;
  text: string;
  instruct?: string;
  status: "pending" | "processing" | "completed" | "failed";
  audioPath?: string;
  duration?: number;
  orderIndex: number;
}

// Voice types
export interface Voice {
  id: string;
  name: string;
  gender?: "male" | "female";
  language?: string;
}

export interface VoiceConfig {
  speaker: string;
  voiceType: "custom" | "clone" | "lora" | "design";
  voiceName?: string;
  style?: string;
  refAudioPath?: string;
  loraModelPath?: string;
  language?: string;
}

// Highlight types
export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  chunkId?: string;
  text: string;
  color: HighlightColor;
  startOffset: number;
  endOffset: number;
  chapter?: string;
  note?: Note;
  createdAt: string;
}

export interface Note {
  id: string;
  highlightId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Audio player types
export interface ParagraphTimeMap {
  [paragraphId: string]: {
    startTime: number;
    endTime: number;
    audioPath?: string;
  };
}
