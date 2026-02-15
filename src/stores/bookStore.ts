import { create } from "zustand";
import { type Book } from "@/data/mockData";

export interface UploadedBook extends Book {
  sections: string[];
  audioUrl?: string;
}

interface BookStore {
  uploadedBooks: UploadedBook[];
  addBook: (book: UploadedBook) => void;
  getBook: (id: string) => UploadedBook | undefined;
}

export const useBookStore = create<BookStore>((set, get) => ({
  uploadedBooks: [],
  addBook: (book) =>
    set((state) => ({ uploadedBooks: [...state.uploadedBooks, book] })),
  getBook: (id) => get().uploadedBooks.find((b) => b.id === id),
}));
