import { type Book } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/reader/${book.id}`)}
      className="group cursor-pointer animate-fade-in"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
        {book.cover ? (
          <img
            src={book.cover}
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
            style={{ width: `${book.progress}%` }}
          />
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="font-reading text-sm font-medium leading-tight text-foreground line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-xs text-muted-foreground">{book.progress}%</p>
      </div>
    </div>
  );
};

export default BookCard;
