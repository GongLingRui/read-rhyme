/**
 * Project Detail Page
 * Main workspace for managing a single audiobook project
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useProjectStore } from "@/stores/projectStore";
import { ScriptEditor } from "@/components/ScriptEditor";
import { AudioGenerator } from "@/components/AudioGenerator";
import { VoiceConfigPanel } from "@/components/VoiceConfigPanel";
import { VoiceReference } from "@/components/VoiceReference";
import { RealtimeLogs } from "@/components/RealtimeLogs";
import { useLogsStore } from "@/stores/logsStore";
import { ArrowLeft, Play, Settings, Download, Activity, Brain } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { type Project } from "@/stores/projectStore";

const statusLabels: Record<Project["status"], { label: string; variant: any }> = {
  draft: { label: "草稿", variant: "secondary" },
  processing: { label: "处理中", variant: "default" },
  completed: { label: "已完成", variant: "outline" },
  failed: { label: "失败", variant: "destructive" },
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logs = useLogsStore((state) => state.logs);
  const clearLogs = useLogsStore((state) => state.clearLogs);
  const {
    currentProject,
    script,
    chunks,
    isGenerating,
    progress,
    wsConnected,
    error,
    fetchProject,
    generateScript,
    fetchScript,
    fetchChunks,
    reset,
    disconnectWebSocket,
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState("script");
  const [scriptGenerated, setScriptGenerated] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }

    return () => {
      // Disconnect WebSocket when leaving the page
      disconnectWebSocket();
    };
  }, [projectId, disconnectWebSocket]);

  useEffect(() => {
    // Check if script exists when project loads
    if (currentProject?.status !== "draft") {
      setScriptGenerated(true);
      fetchScript();
      fetchChunks();
    }
  }, [currentProject]);

  // Also check script status when it changes
  useEffect(() => {
    if (script && script.status === "approved") {
      setScriptGenerated(true);
      fetchChunks();
    }
  }, [script]);

  const handleGenerateScript = async () => {
    if (!currentProject) return;

    try {
      await generateScript();
      setScriptGenerated(true);
      toast({
        title: "脚本生成已启动",
        description: "正在后台生成脚本，请稍候...",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message || "无法生成脚本",
      });
    }
  };

  const handleBack = () => {
    navigate("/projects");
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载项目...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">加载失败</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
              <Button onClick={() => fetchProject(projectId!)}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusLabels[currentProject.status];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{currentProject.name}</h1>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  {wsConnected && (
                    <Badge variant="outline" className="gap-1">
                      <Activity className="h-3 w-3 animate-pulse" />
                      实时更新
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentProject.bookTitle || "未知书籍"}
                  {currentProject.description && ` · ${currentProject.description}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/voice-styling`)}>
                <Brain className="mr-2 h-4 w-4" />
                语音风格
              </Button>
              <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/lora`)}>
                <Settings className="mr-2 h-4 w-4" />
                LoRA训练
              </Button>
              {currentProject.audio_path && (
                <Button variant="outline" asChild>
                  <a href={currentProject.audio_path} download>
                    <Download className="mr-2 h-4 w-4" />
                    导出音频
                  </a>
                </Button>
              )}
              {currentProject.status === "completed" && currentProject.audio_path && (
                <Button asChild>
                  <a href={currentProject.audio_path}>
                    <Play className="mr-2 h-4 w-4" />
                    播放
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {currentProject.progress && currentProject.status === "processing" && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>音频生成中...</span>
                <span>
                  {currentProject.progress.completedChunks}/{currentProject.progress.totalChunks} 块
                  ({currentProject.progress.percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${currentProject.progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="script">脚本</TabsTrigger>
            <TabsTrigger value="audio" disabled={!scriptGenerated}>
              音频
            </TabsTrigger>
            <TabsTrigger value="voices" disabled={!scriptGenerated}>
              语音
            </TabsTrigger>
            <TabsTrigger value="settings">设置</TabsTrigger>
          </TabsList>

          {/* Script Tab */}
          <TabsContent value="script" className="space-y-4">
            {!scriptGenerated ? (
              <Card>
                <CardHeader>
                  <CardTitle>生成脚本</CardTitle>
                  <CardDescription>
                    AI将根据书籍内容自动生成有声书脚本，包括旁白和角色对话的标注
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-4 p-4 bg-primary/10 rounded-full">
                      <Play className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">准备生成脚本</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      点击下方按钮开始生成。AI会分析书籍内容，自动识别旁白和对话，
                      并为每个片段添加合适的语音指导。
                    </p>
                    <Button
                      size="lg"
                      onClick={handleGenerateScript}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          开始生成脚本
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ScriptEditor />
            )}
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="space-y-4">
            <AudioGenerator />

            {/* Realtime Logs */}
            <RealtimeLogs logs={logs} onClear={clearLogs} />
          </TabsContent>

          {/* Voices Tab */}
          <TabsContent value="voices">
            <VoiceConfigPanel />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>项目设置</CardTitle>
                <CardDescription>配置项目的TTS和其他设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">项目ID</label>
                    <p className="text-sm text-muted-foreground">{currentProject.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">书籍ID</label>
                    <p className="text-sm text-muted-foreground">{currentProject.bookId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">TTS模式</label>
                    <p className="text-sm text-muted-foreground">
                      {currentProject.config.tts_mode}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">语言</label>
                    <p className="text-sm text-muted-foreground">
                      {currentProject.config.language}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">创建时间</label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(currentProject.createdAt), "PPP", { locale: zhCN })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">更新时间</label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(currentProject.updatedAt), "PPP", { locale: zhCN })}
                    </p>
                  </div>
                </div>
                {currentProject.duration && (
                  <div>
                    <label className="text-sm font-medium">音频时长</label>
                    <p className="text-sm text-muted-foreground">
                      {Math.floor(currentProject.duration / 60)}分{currentProject.duration % 60}秒
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <VoiceReference />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
