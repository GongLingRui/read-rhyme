/**
 * Audio Generator Component
 * Manage audio generation progress and controls
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProjectStore, type Chunk } from "@/stores/projectStore";
import { audioApi } from "@/services/audio";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Download,
  Volume2,
  CheckCircle2,
  XCircle,
  Loader2,
  FileAudio,
  FolderOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AudioGenerator() {
  const { toast } = useToast();
  const {
    currentProject,
    chunks,
    progress,
    isGenerating,
    fetchChunks,
    generateAudio,
    mergeAudio,
  } = useProjectStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});
  const [exportFormat, setExportFormat] = useState<"combined" | "audacity" | "voicelines">("combined");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchChunks();

    return () => {
      // Cleanup audio elements
      Object.values(audioElements).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  // Auto-refresh when generating
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        fetchChunks();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // Auto-merge when all chunks are completed
  useEffect(() => {
    if (!chunks || chunks.length === 0) return;

    const allCompleted = chunks.every((c) => c.status === "completed");
    const hasAudioPath = currentProject?.audio_path;
    const allPending = chunks.every((c) => c.status === "pending");
    const anyProcessing = chunks.some((c) => c.status === "processing");

    console.log('[AudioGenerator] Auto-merge check:', {
      chunksLength: chunks.length,
      allCompleted,
      allPending,
      anyProcessing,
      hasAudioPath,
      isGenerating,
      currentProjectStatus: currentProject?.status,
    });

    // 如果所有音频都生成完成，但还没有合并（没有audio_path），则自动合并
    if (allCompleted && !hasAudioPath && !isGenerating && !anyProcessing) {
      console.log('[AudioGenerator] All chunks completed, auto-merging...');
      toast({
        title: "音频生成完成",
        description: "正在自动合并音频...",
      });
      mergeAudio();
    }
  }, [chunks, currentProject, isGenerating]);

  const handleSelectAll = () => {
    const pendingChunks = chunks?.filter((c) => c.status === "pending") || [];
    const allIds = new Set(pendingChunks.map((c) => c.id));
    setSelectedIds(allIds);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleGenerateSelected = async () => {
    if (selectedIds.size === 0) {
      toast({
        variant: "destructive",
        title: "未选择音频块",
        description: "请选择要生成的音频块",
      });
      return;
    }

    try {
      await generateAudio(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast({
        title: "生成已启动",
        description: `正在生成 ${selectedIds.size} 个音频块`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message || "无法生成音频",
      });
    }
  };

  const handleGenerateAll = async () => {
    try {
      await generateAudio();
      toast({
        title: "生成已启动",
        description: "正在生成所有待处理的音频块",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message || "无法生成音频",
      });
    }
  };

  const handleMerge = async () => {
    try {
      await mergeAudio();
      toast({
        title: "合并已启动",
        description: "正在合并所有音频块",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "合并失败",
        description: error.message || "无法合并音频",
      });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await audioApi.exportAudio(
        currentProject!.id,
        exportFormat,
        {
          project_name: currentProject!.name,
          add_fades: true,
          normalize: true,
        }
      );

      if (response.success && response.data) {
        toast({
          title: "导出成功",
          description: `已导出${exportFormat === "combined" ? "合并音频" : exportFormat === "audacity" ? "Audacity项目" : "独立音频文件"}`,
        });

        // Auto-download if there's a download URL
        if (response.data.download_url || response.data.audio_url) {
          const downloadUrl = response.data.download_url || response.data.audio_url!;
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = response.data.filename || `${currentProject!.name}_${exportFormat}.${exportFormat === "audacity" ? "aup3" : "zip"}`;
          a.click();
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "导出失败",
        description: error.message || "无法导出音频",
      });
    } finally {
      setExporting(false);
    }
  };

  const handlePlay = (chunk: Chunk) => {
    if (!chunk.audio_path) return;

    // Stop current playing
    if (playingId && audioElements[playingId]) {
      audioElements[playingId].pause();
      setPlayingId(null);
    }

    // Play new audio
    if (playingId !== chunk.id) {
      let audio = audioElements[chunk.id];
      if (!audio) {
        audio = new Audio(chunk.audio_path);
        setAudioElements((prev) => ({ ...prev, [chunk.id]: audio }));
      }

      audio.play();
      setPlayingId(chunk.id);

      audio.onended = () => {
        setPlayingId(null);
      };

      audio.onerror = () => {
        toast({
          variant: "destructive",
          title: "播放失败",
          description: "无法播放音频",
        });
        setPlayingId(null);
      };
    }
  };

  const handleToggleSelect = (chunkId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(chunkId)) {
      newSelection.delete(chunkId);
    } else {
      newSelection.add(chunkId);
    }
    setSelectedIds(newSelection);
  };

  const handleRegenerate = async (chunk: Chunk) => {
    // Reset chunk to pending
    setSelectedIds(new Set([chunk.id]));
    await generateAudio([chunk.id]);
  };

  const getStatusInfo = (status: Chunk["status"]) => {
    switch (status) {
      case "pending":
        return { label: "待处理", icon: null, variant: "secondary" as const };
      case "processing":
        return { label: "生成中", icon: Loader2, variant: "default" as const };
      case "completed":
        return { label: "已完成", icon: CheckCircle2, variant: "outline" as const };
      case "failed":
        return { label: "失败", icon: XCircle, variant: "destructive" as const };
    }
  };

  const stats = {
    total: chunks?.length || 0,
    pending: chunks?.filter((c) => c.status === "pending").length || 0,
    processing: chunks?.filter((c) => c.status === "processing").length || 0,
    completed: chunks?.filter((c) => c.status === "completed").length || 0,
    failed: chunks?.filter((c) => c.status === "failed").length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总计</CardDescription>
            <CardTitle>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>待处理</CardDescription>
            <CardTitle className="text-muted-foreground">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>生成中</CardDescription>
            <CardTitle className="text-blue-600">{stats.processing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已完成</CardDescription>
            <CardTitle className="text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>失败</CardDescription>
            <CardTitle className="text-destructive">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Bar */}
      {progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>生成进度</span>
                <span>{progress.percentage.toFixed(0)}%</span>
              </div>
              <Progress value={progress.percentage} />
              <div className="text-xs text-muted-foreground text-center">
                {progress.completed} / {progress.total} 个音频块
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>音频生成控制</CardTitle>
          <CardDescription>
            已选择 {selectedIds.size} 个音频块
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Warning message when all audio is ready but not merged */}
          {stats.completed > 0 && stats.pending === 0 && stats.processing === 0 && !currentProject?.audio_path && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    所有音频已生成完成！
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    请点击下方绿色按钮"合并音频（必需）"合并音频文件，然后就可以在阅读页面播放了。
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSelectAll} variant="outline" size="sm">
              全选待处理
            </Button>
            <Button onClick={handleClearSelection} variant="outline" size="sm">
              清空选择
            </Button>
            <Button
              onClick={handleGenerateSelected}
              disabled={selectedIds.size === 0 || isGenerating}
              size="sm"
            >
              生成选中
            </Button>
            <Button
              onClick={handleGenerateAll}
              disabled={stats.pending === 0 || isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  生成全部
                </>
              )}
            </Button>
            {/* Show prominent merge button when all audio is ready */}
            {stats.completed > 0 && stats.pending === 0 && stats.processing === 0 && !currentProject?.audio_path && (
              <Button onClick={handleMerge} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                <SkipForward className="mr-2 h-4 w-4" />
                合并音频（必需）
              </Button>
            )}
            {stats.completed > 0 && !(stats.pending === 0 && stats.processing === 0 && !currentProject?.audio_path) && (
              <Button onClick={handleMerge} variant="secondary" size="sm" disabled={isGenerating}>
                <SkipForward className="mr-2 h-4 w-4" />
                合并音频
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      {stats.completed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>导出选项</CardTitle>
            <CardDescription>
              将音频导出为不同格式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="export-format">导出格式:</Label>
                <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                  <SelectTrigger id="export-format" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combined">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4" />
                        <div>
                          <div className="font-medium">合并音频</div>
                          <div className="text-xs text-muted-foreground">单个MP3文件</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="audacity">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Audacity项目</div>
                          <div className="text-xs text-muted-foreground">可编辑的AUP3项目</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="voicelines">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4" />
                        <div>
                          <div className="font-medium">独立音频</div>
                          <div className="text-xs text-muted-foreground">按角色分离的音频文件</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting || stats.completed === 0}
                size="sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    导出音频
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chunks List */}
      <Card>
        <CardHeader>
          <CardTitle>音频块</CardTitle>
          <CardDescription>
            管理和预览各个音频片段
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!chunks || chunks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无音频块
            </div>
          ) : (
            <div className="space-y-2">
              {chunks.map((chunk) => {
                const statusInfo = getStatusInfo(chunk.status);
                const isSelected = selectedIds.has(chunk.id);
                const isPlaying = playingId === chunk.id;
                const canSelect = chunk.status === "pending" || chunk.status === "failed";

                return (
                  <div
                    key={chunk.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected ? "bg-primary/5 border-primary" : "bg-background"
                    } ${isPlaying ? "ring-2 ring-primary" : ""}`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => canSelect && handleToggleSelect(chunk.id)}
                      disabled={!canSelect || isGenerating}
                      className="h-4 w-4"
                    />

                    {/* Index */}
                    <span className="text-sm font-mono text-muted-foreground w-12">
                      #{chunk.order_index + 1}
                    </span>

                    {/* Status */}
                    <Badge variant={statusInfo.variant} className="shrink-0">
                      {statusInfo.icon && (
                        <statusInfo.icon className="mr-1 h-3 w-3" />
                      )}
                      {statusInfo.label}
                    </Badge>

                    {/* Speaker */}
                    <span className="text-sm font-medium min-w-[80px]">
                      {chunk.speaker}
                    </span>

                    {/* Text */}
                    <p className="text-sm flex-1 truncate">
                      {chunk.text}
                    </p>

                    {/* Instructions */}
                    {chunk.instruct && (
                      <span className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {chunk.instruct}
                      </span>
                    )}

                    {/* Duration */}
                    {chunk.duration && (
                      <span className="text-xs text-muted-foreground">
                        {chunk.duration.toFixed(1)}s
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1">
                      {chunk.status === "completed" && chunk.audio_path && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handlePlay(chunk)}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {chunk.status === "failed" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleRegenerate(chunk)}
                          title="重新生成"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
