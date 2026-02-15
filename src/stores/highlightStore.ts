import { create } from "zustand";

export type HighlightColor = "yellow" | "blue" | "green" | "pink";

export interface SavedHighlight {
  id: string;
  bookId: string;
  text: string;
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

interface HighlightStore {
  highlights: SavedHighlight[];
  addHighlight: (h: Omit<SavedHighlight, "id" | "createdAt">) => SavedHighlight;
  updateNote: (id: string, note: string) => void;
  removeHighlight: (id: string) => void;
  getBookHighlights: (bookId: string) => SavedHighlight[];
}

export const useHighlightStore = create<HighlightStore>((set, get) => ({
  highlights: [],

  addHighlight: (data) => {
    const highlight: SavedHighlight = {
      ...data,
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({ highlights: [...s.highlights, highlight] }));

    // Placeholder: sync to backend
    syncHighlightToApi("create", highlight);

    return highlight;
  },

  updateNote: (id, note) => {
    set((s) => ({
      highlights: s.highlights.map((h) =>
        h.id === id ? { ...h, note } : h
      ),
    }));
    const h = get().highlights.find((h) => h.id === id);
    if (h) syncHighlightToApi("update", h);
  },

  removeHighlight: (id) => {
    const h = get().highlights.find((h) => h.id === id);
    set((s) => ({
      highlights: s.highlights.filter((h) => h.id !== id),
    }));
    if (h) syncHighlightToApi("delete", h);
  },

  getBookHighlights: (bookId) =>
    get().highlights.filter((h) => h.bookId === bookId),
}));

// ── API interface placeholder ──
// Replace with real fetch calls when backend is ready
async function syncHighlightToApi(
  action: "create" | "update" | "delete",
  highlight: SavedHighlight
) {
  console.log(`[Highlight API] ${action}:`, highlight.id, highlight.text.slice(0, 30));
  // Example future implementation:
  // await fetch('/api/highlights', {
  //   method: action === 'create' ? 'POST' : action === 'update' ? 'PUT' : 'DELETE',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(highlight),
  // });
}
