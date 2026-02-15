import { useState } from "react";
import { ArrowLeft, StickyNote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReaderContent from "@/components/ReaderContent";
import NoteSidebar from "@/components/NoteSidebar";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";

const Reader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
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
          人工智能简史
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

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main reading area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ backgroundColor: "hsl(var(--reading-surface))" }}>
          <ReaderContent />
        </div>

        {/* Sidebar */}
        <NoteSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Audio player */}
      <AudioPlayer />
    </div>
  );
};

export default Reader;
