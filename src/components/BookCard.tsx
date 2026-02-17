import type { Book } from "@/stores/bookStore";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2 } from "lucide-react";
import { useBookStore } from "@/stores/bookStore";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();
  const deleteBook = useBookStore((s) => s.deleteBook);
  const isLoading = useBookStore((s) => s.isLoading);

  const coverUrl = book.coverUrl;
  const author = book.author || "未知作者";
  const progress = Math.round(book.progress * 100);

  const handleDelete = async () => {
    try {
      await deleteBook(book.id);
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if the click was on the delete button
    if ((e.target as HTMLElement).closest("[data-delete-button]")) {
      return;
    }
    navigate(`/reader/${book.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer animate-fade-in"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-accent gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="font-reading text-xs font-medium text-accent-foreground px-2 text-center leading-tight">
              {book.title}
            </span>
          </div>
        )}
        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/80">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Delete button - shows on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 shadow-lg"
                data-delete-button
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>删除书籍</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除《{book.title}》吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="font-reading text-sm font-medium leading-tight text-foreground line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground">{author}</p>
        <p className="text-xs text-muted-foreground">{progress}%</p>
      </div>
    </div>
  );
};

export default BookCard;
