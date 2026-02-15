import { useState } from "react";
import { ArrowLeft, StickyNote } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ReaderContent from "@/components/ReaderContent";
import NoteSidebar from "@/components/NoteSidebar";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useBookStore } from "@/stores/bookStore";
import { mockBooks } from "@/data/mockData";

const Reader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();

  const uploadedBook = useBookStore((s) => s.getBook(bookId ?? ""));
  const mockBook = mockBooks.find((b) => b.id === bookId);

  const resolvedId = bookId ?? "unknown";
  const title = uploadedBook?.title ?? mockBook?.title ?? "未知书籍";
  const author = uploadedBook?.author ?? mockBook?.author ?? "";
  const sections = uploadedBook?.sections ?? null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>

        <span className="font-reading text-sm font-medium text-foreground">
          {title}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`h-8 w-8 ${sidebarOpen ? "text-primary" : "text-muted-foreground"}`}
        >
          <StickyNote className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex-1 overflow-y-auto scrollbar-thin"
          style={{ backgroundColor: "hsl(var(--reading-surface))" }}
        >
          <ReaderContent
            title={title}
            author={author}
            bookId={resolvedId}
            sections={sections}
          />
        </div>
        <NoteSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          bookId={resolvedId}
        />
      </div>

      <AudioPlayer />
    </div>
  );
};

export default Reader;
