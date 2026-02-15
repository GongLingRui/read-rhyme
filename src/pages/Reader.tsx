import { useState, useEffect } from "react";
import { ArrowLeft, StickyNote } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ReaderContent from "@/components/ReaderContent";
import NoteSidebar from "@/components/NoteSidebar";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useBookStore } from "@/stores/bookStore";

const Reader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookContent, setBookContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();

  const currentBook = useBookStore((s) => s.currentBook);
  const fetchBook = useBookStore((s) => s.fetchBook);

  useEffect(() => {
    if (bookId) {
      loadBook(bookId);
    }
  }, [bookId]);

  const loadBook = async (id: string) => {
    setIsLoading(true);
    try {
      await fetchBook(id);

      // Fetch book content
      const { booksApi } = await import("@/services");
      const response = await booksApi.getContent(id, "plain");

      if (response.success && response.data) {
        setBookContent(response.data.content);
      }
    } catch (error) {
      console.error("Failed to load book:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const title = currentBook?.title || "未知书籍";
  const author = currentBook?.author || "";
  const resolvedId = bookId || "unknown";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!currentBook) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">书籍不存在</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/")}
          >
            返回书架
          </Button>
        </div>
      </div>
    );
  }

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
            content={bookContent || "暂无内容"}
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
