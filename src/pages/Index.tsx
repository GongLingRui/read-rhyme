import { BookOpen, Upload } from "lucide-react";
import BookCard from "@/components/BookCard";
import { mockBooks } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-reading text-lg font-semibold text-foreground">
              AI Audiobook Notebook
            </span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-sm">
            <Upload className="h-4 w-4" />
            上传书籍
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h2 className="font-reading text-lg font-medium text-foreground">
            我的书架
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mockBooks.length} 本书 · 继续阅读
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mockBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
