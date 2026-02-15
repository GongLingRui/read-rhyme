import { useState } from "react";
import { BookOpen, Upload } from "lucide-react";
import BookCard from "@/components/BookCard";
import UploadModal from "@/components/UploadModal";
import { mockBooks } from "@/data/mockData";
import { useBookStore } from "@/stores/bookStore";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const uploadedBooks = useBookStore((s) => s.uploadedBooks);
  const allBooks = [...mockBooks, ...uploadedBooks];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-reading text-lg font-semibold text-foreground">
              AI Audiobook Notebook
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            上传书籍
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h2 className="font-reading text-lg font-medium text-foreground">
            我的书架
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {allBooks.length} 本书 · 继续阅读
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {allBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </main>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
};

export default Index;
