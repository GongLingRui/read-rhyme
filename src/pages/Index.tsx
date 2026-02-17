import { useState, useEffect, useRef } from "react";
import { BookOpen, Upload, LogOut, User, RefreshCw, Lightbulb, Highlighter, Mic, Settings, Brain, Copy, Wrench, Headphones, Layers, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BookCard from "@/components/BookCard";
import UploadModal from "@/components/UploadModal";
import { useBookStore } from "@/stores/bookStore";
import { useThoughtStore } from "@/stores/thoughtStore";
import { useHighlightStore } from "@/stores/highlightStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sub-components for each tab
const MyBooks = () => {
  const books = useBookStore((s) => s.books);
  const fetchBooks = useBookStore((s) => s.fetchBooks);
  const isLoading = useBookStore((s) => s.isLoading);
  const navigate = useNavigate();
  const hasMounted = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchBooks().finally(() => setIsInitialLoad(false));
    }
  }, [fetchBooks]);

  if (isLoading || isInitialLoad) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">还没有书籍，上传第一本开始吧</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};

const MyThoughts = () => {
  const thoughts = useThoughtStore((s) => s.thoughts);
  const fetchThoughts = useThoughtStore((s) => s.fetchThoughts);
  const isLoading = useThoughtStore((s) => s.isLoading);
  const deleteThought = useThoughtStore((s) => s.deleteThought);
  const navigate = useNavigate();
  const hasMounted = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchThoughts().finally(() => setIsInitialLoad(false));
    }
  }, [fetchThoughts]);

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这条想法吗？")) {
      try {
        await deleteThought(id);
      } catch (error) {
        console.error("Failed to delete thought:", error);
      }
    }
  };

  if (isLoading || isInitialLoad) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Lightbulb className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">还没有想法，去读书记录一些想法吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {thoughts.map((thought) => (
        <div
          key={thought.id}
          className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{thought.bookTitle || "未知书籍"}</span>
            <span>·</span>
            <span>{new Date(thought.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-foreground whitespace-pre-wrap">{thought.content}</p>
          <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/reader/${thought.bookId}`)}
            >
              查看书籍
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(thought.id)}
            >
              删除
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const MyHighlights = () => {
  const highlights = useHighlightStore((s) => s.highlights);
  const fetchAllHighlights = useHighlightStore((s) => s.fetchAllHighlights);
  const isLoading = useHighlightStore((s) => s.isLoading);
  const deleteHighlight = useHighlightStore((s) => s.deleteHighlight);
  const navigate = useNavigate();
  const hasMounted = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchAllHighlights().finally(() => setIsInitialLoad(false));
    }
  }, [fetchAllHighlights]);

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这条划线吗？")) {
      try {
        await deleteHighlight(id);
      } catch (error) {
        console.error("Failed to delete highlight:", error);
      }
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case "yellow": return "bg-yellow-200 dark:bg-yellow-900/30";
      case "green": return "bg-green-200 dark:bg-green-900/30";
      case "blue": return "bg-blue-200 dark:bg-blue-900/30";
      case "pink": return "bg-pink-200 dark:bg-pink-900/30";
      default: return "bg-yellow-200 dark:bg-yellow-900/30";
    }
  };

  if (isLoading || isInitialLoad) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Highlighter className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">还没有划线，去阅读并划线吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {highlights.map((highlight) => (
        <div
          key={highlight.id}
          className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{highlight.bookTitle || "未知书籍"}</span>
            <span>·</span>
            <span>{new Date(highlight.createdAt).toLocaleDateString()}</span>
            <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${getColorClass(highlight.color)}`}>
              {highlight.color}
            </span>
          </div>
          <p className={`rounded-md p-3 ${getColorClass(highlight.color)} text-foreground`}>
            {highlight.text}
          </p>
          {highlight.note && (
            <div className="mt-2 rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground mb-1">笔记：</p>
              <p className="text-sm text-foreground">{highlight.note.content}</p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/reader/${highlight.bookId}`)}
            >
              查看书籍
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(highlight.id)}
            >
              删除
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Index = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("books");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefresh = async () => {
    if (activeTab === "books") {
      await useBookStore.getState().fetchBooks();
    } else if (activeTab === "thoughts") {
      await useThoughtStore.getState().fetchThoughts();
    } else if (activeTab === "highlights") {
      await useHighlightStore.getState().fetchAllHighlights();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-reading text-lg font-semibold text-foreground">
              Read-Rhyme
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-sm"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
              上传书籍
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/projects")}>
                  <Mic className="mr-2 h-4 w-4" />
                  <span>有声书制作</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/rag")}>
                  <Brain className="mr-2 h-4 w-4" />
                  <span>AI知识问答</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/voice-styling")}>
                  <Mic className="mr-2 h-4 w-4" />
                  <span>语音风格控制</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/voice-clone")}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>音色克隆</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/audio-tools")}>
                  <Wrench className="mr-2 h-4 w-4" />
                  <span>音频工具</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/audio-preview")}>
                  <Headphones className="mr-2 h-4 w-4" />
                  <span>实时预览</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/batch-operations")}>
                  <Layers className="mr-2 h-4 w-4" />
                  <span>批量操作</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/cosy-voice")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>CosyVoice AI语音</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>系统设置</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="books" className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  我的书架
                </TabsTrigger>
                <TabsTrigger value="thoughts" className="gap-1.5">
                  <Lightbulb className="h-4 w-4" />
                  我的想法
                </TabsTrigger>
                <TabsTrigger value="highlights" className="gap-1.5">
                  <Highlighter className="h-4 w-4" />
                  我的划线
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="gap-1.5"
                  onClick={() => navigate("/projects")}
                >
                  <Mic className="h-4 w-4" />
                  有声书制作
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">刷新</span>
              </Button>
            </div>
            <TabsContent value="books" className="mt-0">
              <MyBooks />
            </TabsContent>
            <TabsContent value="thoughts" className="mt-0">
              <MyThoughts />
            </TabsContent>
            <TabsContent value="highlights" className="mt-0">
              <MyHighlights />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
};

export default Index;
