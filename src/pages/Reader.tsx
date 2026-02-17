import { useState, useEffect } from "react";
import { ArrowLeft, StickyNote, AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ReaderContent from "@/components/ReaderContent";
import NoteSidebar from "@/components/NoteSidebar";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useBookStore } from "@/stores/bookStore";
import { useAudioStore, generateTimeMap } from "@/stores/audioStore";
import { useHighlightStore } from "@/stores/highlightStore";

const Reader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookContent, setBookContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();

  const currentBook = useBookStore((s) => s.currentBook);
  const fetchBook = useBookStore((s) => s.fetchBook);
  const fetchBookHighlights = useHighlightStore((s) => s.fetchBookHighlights);
  const { setAudioUrl, setDuration, reset, setBlockTexts, setParagraphTimeMap } = useAudioStore();

  useEffect(() => {
    if (bookId) {
      // 切换书籍时重置音频状态，避免上一本书的播放进度/音频残留
      reset();
      loadBook(bookId);
    }
  }, [bookId, reset]);

  const loadBook = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchBook(id);

      // Fetch book highlights
      fetchBookHighlights(id).catch(err => {
        console.error("Failed to load highlights:", err);
      });

      // Fetch book content
      const { booksApi } = await import("@/services");
      const response = await booksApi.getContent(id, "plain");

      if (response.success && response.data) {
        const content = response.data.content;
        setBookContent(content);

        // Parse content into blocks for Web Speech API
        // Split by double newlines or newlines followed by non-whitespace
        const blocks = content
          .split(/\n\s*\n|\n(?=[^\s])/)
          .map(b => b.trim())
          .filter(b => b.length > 0);

        if (blocks.length > 0) {
          console.log('[Reader] Setting', blocks.length, 'blocks for Web Speech API');
          setBlockTexts(blocks);

          // Generate time map for accurate progress tracking
          const timeMap = generateTimeMap(blocks);
          setParagraphTimeMap(timeMap);
          console.log('[Reader] Generated time map with total duration:', Object.values(timeMap).pop()?.end || 0, 'seconds');
        }
      }

      // 尝试为当前书籍自动关联 / 生成有声书项目与音频
      try {
        const { projectsApi, audioApi, scriptsApi } = await import("@/services");

        // 1）优先查找该书籍下状态为 completed 的项目（按时间倒序，最多取若干个，再在前端兜底过滤）
        const projectsRes = await projectsApi.list({
          book_id: id,
          // 后端参数名为 status_filter，而不是 status
          status_filter: "completed",
          page: 1,
          page_size: 5,
        } as any);

        let project: any | null = null;

        if (projectsRes.success && projectsRes.data && projectsRes.data.items.length > 0) {
          const items = projectsRes.data.items as any[];
          // 优先选择真正 status === "completed" 的项目，若后端忽略了过滤，则在前端再筛一遍
          const completedProjects = items.filter((p) => p.status === "completed");
          project = (completedProjects[0] || items[0]) as any;
        }

        // 2）如果没有 completed 项目，尝试查找任意项目；仍然没有则自动创建一个默认项目
        if (!project) {
          try {
            const anyProjectsRes = await projectsApi.list({
              book_id: id,
              page: 1,
              page_size: 1,
            } as any);
            if (anyProjectsRes.success && anyProjectsRes.data && anyProjectsRes.data.items.length > 0) {
              project = anyProjectsRes.data.items[0] as any;
              console.log("[Reader] 使用已存在的有声书项目:", project.id);
            }
          } catch (e) {
            console.error("[Reader] 加载任意有声书项目失败:", e);
          }

          if (!project) {
            try {
              const createRes = await projectsApi.create({
                book_id: id,
                name: "自动生成有声书",
                description: "由阅读页自动创建的有声书项目",
              });
              if (createRes.success && createRes.data) {
                project = createRes.data as any;
                console.log("[Reader] 已为当前书籍自动创建有声书项目:", project.id);
              }
            } catch (e) {
              console.error("[Reader] 自动创建有声书项目失败:", e);
            }
          }
        }

        if (project) {
          // 3）优先从 /audio 接口获取最新的 audio_url 和 duration
          try {
            const audioRes = await audioApi.getAudio(project.id);
            if (audioRes.success && audioRes.data?.audio_url) {
              setAudioUrl(audioRes.data.audio_url);
              setDuration(audioRes.data.duration || project.duration || 0);
              return;
            }

            // API 返回失败（没有音频或未生成）
            const errorCode = audioRes.error?.code || "UNKNOWN";
            const errorMessage = audioRes.error?.message || "Unknown error";
            console.log(`[Reader] No audio file available (code: ${errorCode}): ${errorMessage}`);

            // 如果是 AUDIO_NOT_READY，则在后台尝试自动跑完“脚本→chunk→音频生成”流水线
            if (errorCode === "AUDIO_NOT_READY") {
              console.log("[Reader] AUDIO_NOT_READY, 尝试自动生成脚本和音频...");

              // 3.1 检查脚本状态，如果尚未开始则触发脚本生成
              try {
                const statusRes = await scriptsApi.getStatus(project.id);
                if (statusRes.success && statusRes.data) {
                  if (statusRes.data.status === "not_started") {
                    await scriptsApi.generate(project.id, {});
                  }
                }
              } catch (e) {
                console.error("[Reader] 检查/触发脚本生成失败:", e);
              }

              // 3.2 轮询脚本状态直到 approved 或超时
              try {
                const maxScriptPolls = 20;
                for (let i = 0; i < maxScriptPolls; i++) {
                  const statusRes = await scriptsApi.getStatus(project.id);
                  if (!statusRes.success || !statusRes.data) break;

                  if (statusRes.data.status === "approved") {
                    console.log("[Reader] 脚本生成完成，entries_count =", statusRes.data.entries_count);
                    break;
                  }

                  if (statusRes.data.status === "failed") {
                    console.error("[Reader] 脚本生成失败:", statusRes.data.error_message);
                    break;
                  }

                  await new Promise((resolve) => setTimeout(resolve, 2000));
                }
              } catch (e) {
                console.error("[Reader] 轮询脚本状态失败:", e);
              }

              // 3.3 基于脚本创建 chunks（如果已存在则后端会覆盖旧的 chunk）
              try {
                await scriptsApi.createChunks(project.id);
                console.log("[Reader] 已根据脚本创建/刷新音频块");
              } catch (e) {
                console.error("[Reader] 根据脚本创建音频块失败:", e);
              }

              // 3.4 触发快速音频生成（后台批量生成所有 pending chunk）
              try {
                await audioApi.generateFast(project.id);
                console.log("[Reader] 已触发批量音频生成");
              } catch (e) {
                console.error("[Reader] 触发音频生成失败:", e);
              }

              // 3.5 轮询 /audio，直到生成出可播放的音频或超时
              try {
                const maxAudioPolls = 30;
                for (let i = 0; i < maxAudioPolls; i++) {
                  await new Promise((resolve) => setTimeout(resolve, 3000));
                  const retryRes = await audioApi.getAudio(project.id);
                  if (retryRes.success && retryRes.data?.audio_url) {
                    console.log("[Reader] 自动生成有声书音频成功:", retryRes.data.audio_url);
                    setAudioUrl(retryRes.data.audio_url);
                    setDuration(retryRes.data.duration || project.duration || 0);
                    return;
                  }
                }
                console.warn("[Reader] 自动生成有声书音频超时，回退到 Web Speech。");
              } catch (e) {
                console.error("[Reader] 轮询生成后的音频失败:", e);
              }
            }

            // 走到这里说明没有可用音频或自动生成失败，使用 Web Speech 作为兜底
            setAudioUrl(null);
          } catch (audioErr: any) {
            // 处理不同类型的错误
            const errorCode = audioErr?.data?.error?.code || audioErr?.code || "UNKNOWN";
            const errorMessage = audioErr?.data?.error?.message || audioErr?.message || "Unknown error";
            console.error(`[Reader] 加载有声书音频失败 (code: ${errorCode}): ${errorMessage}`);
            // 音频加载失败时，仍然使用 Web Speech 作为兜底
            setAudioUrl(null);
          }
        } else {
          // 没有任何项目时，保留 Web Speech 朗读作为兜底
          setAudioUrl(null);
        }
      } catch (projErr) {
        console.error("加载/创建有声书项目音频信息失败:", projErr);
        // 项目加载失败时，仍然使用 Web Speech 作为兜底
        setAudioUrl(null);
      }
    } catch (error: any) {
      console.error("Failed to load book:", error);
      // Check if it's a 404 error (book not found or deleted)
      if (error?.status === 404 || error?.response?.status === 404 || error?.message?.includes("not found") || error?.message?.includes("不存在")) {
        setError("该书籍已被删除或不存在");
      } else {
        setError("加载书籍失败，请稍后重试");
      }
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

  if (error || !currentBook) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            {error || "书籍不存在"}
          </p>
          <p className="text-sm text-muted-foreground/70 mb-6">
            该书籍可能已被删除，或者您没有访问权限
          </p>
          <Button
            variant="outline"
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
          bookContent={bookContent || undefined}
        />
      </div>

      <AudioPlayer />
    </div>
  );
};

export default Reader;
