/**
 * LoRA Training Page
 * Train custom voice models using LoRA fine-tuning
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Play, Pause, RotateCcw, Download, Upload, CheckCircle2, XCircle, AlertCircle, X, Music } from "lucide-react";
import { DatasetBuilder } from "@/components/DatasetBuilder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authFetch, authFetchUpload } from "@/utils/auth";

interface AudioFile {
  id: string;
  name: string;
  file: File;
  duration?: number;
  size: number;
}

interface TrainingConfig {
  audio_files: string[];
  validation_files: string[];
  epochs: number;
  batch_size: number;
  learning_rate: number;
  voice_name: string;
  description?: string;
}

interface TrainingConfigWithFiles extends TrainingConfig {
  audioFileList: AudioFile[];
  validationFileList: AudioFile[];
}

interface TrainingProgress {
  status: "idle" | "preparing" | "training" | "completed" | "failed" | "cancelled";
  current_epoch: number;
  total_epochs: number;
  loss: number;
  learning_rate: number;
  elapsed_time: number;
  estimated_time_remaining: number | null;
  checkpoint_path?: string;
  error?: string;
}

// 注意：这里的字段与后端 /api/lora/requirements 返回的结构对齐
interface TrainingRequirements {
  min_samples: number;
  recommended_samples: number;
  min_duration_per_sample: number;
  recommended_duration_per_sample: number;
  total_min_duration: number;
  recommended_total_duration: number;
  supported_formats: string[];
  sample_rate: number;
  hardware?: {
    min_memory_gb: number;
    recommended_memory_gb: number;
    gpu_required: boolean;
    gpu_memory_gb: number;
  };
}

export default function LoRATraining() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [requirements, setRequirements] = useState<TrainingRequirements | null>(null);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [configDialog, setConfigDialog] = useState(false);
  const [training, setTraining] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<TrainingConfigWithFiles>({
    audio_files: [],
    validation_files: [],
    audioFileList: [],
    validationFileList: [],
    epochs: 10,
    batch_size: 4,
    learning_rate: 0.0001,
    voice_name: "",
  });

  useEffect(() => {
    fetchRequirements();
    fetchProgress();
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchRequirements = async () => {
    try {
      const response = await authFetch(`/api/lora/requirements`);
      const data = await response.json();
      if (data.success) {
        setRequirements(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch requirements:", error);
    }
  };

  const fetchProgress = async () => {
    if (!projectId) return;
    try {
      const response = await authFetch(`/api/lora/projects/${projectId}/progress`);
      const data = await response.json();
      if (data.success && data.data) {
        const raw = data.data;
        const mapped: TrainingProgress = {
          status: (raw.status || "idle") as TrainingProgress["status"],
          current_epoch: raw.current_epoch ?? 0,
          total_epochs: raw.total_epochs ?? 0,
          loss: raw.loss ?? 0,
          learning_rate: raw.learning_rate ?? 0,
          elapsed_time: raw.elapsed_time ?? 0,
          estimated_time_remaining: raw.estimated_time_remaining ?? null,
          checkpoint_path: raw.checkpoint_path,
          error: raw.error,
        };
        setProgress(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  };

  const handleStartTraining = async () => {
    if (!config.voice_name) {
      toast({
        variant: "destructive",
        title: "请填写语音名称",
        description: "语音名称不能为空",
      });
      return;
    }

    if (config.audioFileList.length === 0) {
      toast({
        variant: "destructive",
        title: "请上传音频文件",
        description: "至少需要一个训练音频文件",
      });
      return;
    }

    setTraining(true);
    setUploading(true);

    try {
      // 当前后端基于项目已生成的音频进行训练，这里仅传递训练超参数和语音名称
      const response = await authFetch(`/api/lora/projects/${projectId}/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voice_name: config.voice_name,
          num_epochs: config.epochs,
          batch_size: config.batch_size,
          learning_rate: config.learning_rate,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "训练任务已创建",
          description: "正在准备训练环境...",
        });
        setConfigDialog(false);

        // Reset file lists
        setConfig({
          ...config,
          audioFileList: [],
          validationFileList: [],
          audio_files: [],
          validation_files: [],
        });

        fetchProgress();
      } else {
        throw new Error(data.error?.message || "创建训练任务失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "创建失败",
        description: error.message,
      });
    } finally {
      setTraining(false);
      setUploading(false);
    }
  };

  const handleCancelTraining = async () => {
    if (!confirm("确定要取消训练吗？已训练的进度将保存。")) return;

    try {
      const response = await authFetch(`/api/lora/projects/${projectId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "训练已取消",
          description: "训练进度已保存",
        });
        fetchProgress();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "取消失败",
        description: error.message,
      });
    }
  };

  const handleDownloadCheckpoint = async () => {
    if (!progress?.checkpoint_path) return;

    try {
      const response = await authFetch(`/api/lora/projects/${projectId}/checkpoint/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lora_model_${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "下载成功",
        description: "模型检查点已下载",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "下载失败",
        description: error.message,
      });
    }
  };

  const handleAudioFileUpload = async (files: FileList | null, type: "training" | "validation") => {
    if (!files || files.length === 0) return;

    const audioFiles: AudioFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate audio file
      if (!file.type.startsWith("audio/")) {
        toast({
          variant: "destructive",
          title: "文件格式错误",
          description: `${file.name} 不是音频文件`,
        });
        continue;
      }

      // Get duration
      const duration = await getAudioDuration(file);

      audioFiles.push({
        id: `${Date.now()}_${i}`,
        name: file.name,
        file,
        duration,
        size: file.size,
      });
    }

    if (type === "training") {
      setConfig({
        ...config,
        audioFileList: [...config.audioFileList, ...audioFiles],
      });
    } else {
      setConfig({
        ...config,
        validationFileList: [...config.validationFileList, ...audioFiles],
      });
    }

    toast({
      title: "添加成功",
      description: `已添加 ${audioFiles.length} 个音频文件`,
    });
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        resolve(0);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const removeAudioFile = (id: string, type: "training" | "validation") => {
    if (type === "training") {
      setConfig({
        ...config,
        audioFileList: config.audioFileList.filter((f) => f.id !== id),
      });
    } else {
      setConfig({
        ...config,
        validationFileList: config.validationFileList.filter((f) => f.id !== id),
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getTotalDuration = (files: AudioFile[]): number => {
    return files.reduce((acc, f) => acc + (f.duration || 0), 0);
  };

  const getStatusInfo = (status: TrainingProgress["status"]) => {
    switch (status) {
      case "idle":
        return { label: "未开始", icon: null, variant: "secondary" as const };
      case "preparing":
        return { label: "准备中", icon: "Upload", variant: "default" as const };
      case "training":
        return { label: "训练中", icon: "Play", variant: "default" as const };
      case "completed":
        return { label: "已完成", icon: "CheckCircle2", variant: "outline" as const };
      case "failed":
        return { label: "失败", icon: "XCircle", variant: "destructive" as const };
      case "cancelled":
        return { label: "已取消", icon: "Pause", variant: "secondary" as const };
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分`;
    }
    return `${minutes}分${secs}秒`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">LoRA语音训练</h1>
              <p className="text-sm text-muted-foreground">
                训练自定义语音模型，用于更自然的语音合成
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="training" className="space-y-4">
          <TabsList>
            <TabsTrigger value="training">
              <Play className="mr-2 h-4 w-4" />
              训练
            </TabsTrigger>
            <TabsTrigger value="dataset">
              <Upload className="mr-2 h-4 w-4" />
              数据集构建器
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-6">
            {/* Training Requirements */}
            {requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>训练要求</CardTitle>
                  <CardDescription>上传符合要求的音频文件以开始训练</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">最小时长</p>
                      <p className="text-lg font-medium">
                        {requirements.total_min_duration
                          ? (requirements.total_min_duration / 60).toFixed(1)
                          : "—"}{" "}
                        分钟
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">最少文件数</p>
                      <p className="text-lg font-medium">
                        {requirements.min_samples ?? "—"} 个
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">采样率</p>
                      <p className="text-lg font-medium">
                        {requirements.sample_rate ?? "—"} Hz
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">支持格式</p>
                      <p className="text-lg font-medium">
                        {requirements.supported_formats?.join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Training Progress */}
            {progress && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>训练状态</CardTitle>
                      <CardDescription>当前训练进度和指标</CardDescription>
                    </div>
                    <Badge
                      variant={getStatusInfo(progress.status).variant}
                      className="gap-1"
                    >
                      {getStatusInfo(progress.status).icon && (
                        <span className="flex items-center">
                          {getStatusInfo(progress.status).icon === "Play" && <Play className="h-3 w-3" />}
                          {getStatusInfo(progress.status).icon === "Upload" && <Upload className="h-3 w-3" />}
                          {getStatusInfo(progress.status).icon === "CheckCircle2" && <CheckCircle2 className="h-3 w-3" />}
                          {getStatusInfo(progress.status).icon === "XCircle" && <XCircle className="h-3 w-3" />}
                          {getStatusInfo(progress.status).icon === "Pause" && <Pause className="h-3 w-3" />}
                        </span>
                      )}
                      {getStatusInfo(progress.status).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  {progress.status === "training" && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>训练进度</span>
                        <span>
                          Epoch {progress.current_epoch} / {progress.total_epochs}
                        </span>
                      </div>
                      <Progress
                        value={(progress.current_epoch / progress.total_epochs) * 100}
                      />
                    </div>
                  )}

                  {/* Training Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">损失值</p>
                      <p className="text-lg font-medium">{progress.loss?.toFixed(6) || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">学习率</p>
                      <p className="text-lg font-medium">{progress.learning_rate?.toExponential(2) || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">已用时间</p>
                      <p className="text-lg font-medium">{formatTime(progress.elapsed_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">预计剩余</p>
                      <p className="text-lg font-medium">
                        {progress.estimated_time_remaining
                          ? formatTime(progress.estimated_time_remaining)
                          : "计算中..."}
                      </p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {progress.error && (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">训练错误</p>
                          <p className="text-sm text-destructive/80 mt-1">{progress.error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {progress.status === "training" && (
                      <Button
                        variant="destructive"
                        onClick={handleCancelTraining}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        取消训练
                      </Button>
                    )}
                    {(progress.status === "completed" || progress.status === "cancelled") &&
                      progress.checkpoint_path && (
                        <>
                          <Button onClick={handleDownloadCheckpoint}>
                            <Download className="mr-2 h-4 w-4" />
                            下载模型
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setProgress(null);
                              setConfigDialog(true);
                            }}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            重新训练
                          </Button>
                        </>
                      )}
                    {progress.status === "failed" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProgress(null);
                          setConfigDialog(true);
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        重试
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start Training Button */}
            {!progress || progress.status === "idle" || progress.status === "completed" || progress.status === "cancelled" || progress.status === "failed" ? (
              <Card>
                <CardHeader>
                  <CardTitle>开始训练</CardTitle>
                  <CardDescription>
                    配置训练参数并上传音频文件
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setConfigDialog(true)} size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    配置并开始训练
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="dataset">
            <DatasetBuilder />
          </TabsContent>
        </Tabs>
      </div>

      {/* Training Config Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配置训练参数</DialogTitle>
            <DialogDescription>
              设置LoRA训练的各项参数并上传音频文件
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>语音名称 *</Label>
                <Input
                  value={config.voice_name}
                  onChange={(e) => setConfig({ ...config, voice_name: e.target.value })}
                  placeholder="例如: 我的自定义语音"
                />
              </div>

              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  value={config.description || ""}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="描述这个语音的特点..."
                  rows={3}
                />
              </div>
            </div>

            {/* Training Audio Files */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>训练音频文件 *</Label>
                <Badge variant="secondary">
                  {config.audioFileList.length} 个文件 / {getTotalDuration(config.audioFileList).toFixed(1)} 分钟
                </Badge>
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAudioFileUpload(e.target.files, "training")}
                />
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    上传训练音频文件
                  </span>
                </Button>
              </label>

              {config.audioFileList.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {config.audioFileList.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} · {file.duration?.toFixed(1)}s
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => removeAudioFile(file.id, "training")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {requirements && (
                <p className="text-xs text-muted-foreground">
                  需要至少 {requirements.min_samples ?? "—"} 个文件，总计{" "}
                  {requirements.total_min_duration
                    ? (requirements.total_min_duration / 60).toFixed(1)
                    : "—"}{" "}
                  分钟音频
                </p>
              )}
            </div>

            {/* Validation Audio Files */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>验证音频文件 (可选)</Label>
                <Badge variant="secondary">
                  {config.validationFileList.length} 个文件 / {getTotalDuration(config.validationFileList).toFixed(1)} 分钟
                </Badge>
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAudioFileUpload(e.target.files, "validation")}
                />
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    上传验证音频文件 (可选)
                  </span>
                </Button>
              </label>

              {config.validationFileList.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {config.validationFileList.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} · {file.duration?.toFixed(1)}s
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => removeAudioFile(file.id, "validation")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Training Parameters */}
            <div className="space-y-4">
              <Label>训练参数</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>训练轮数</Label>
                  <Input
                    type="number"
                    value={config.epochs}
                    onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
                    min={1}
                    max={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>批次大小</Label>
                  <Input
                    type="number"
                    value={config.batch_size}
                    onChange={(e) => setConfig({ ...config, batch_size: parseInt(e.target.value) })}
                    min={1}
                    max={16}
                  />
                </div>
                <div className="space-y-2">
                  <Label>学习率</Label>
                  <Input
                    type="number"
                    value={config.learning_rate}
                    onChange={(e) => setConfig({ ...config, learning_rate: parseFloat(e.target.value) })}
                    step={0.00001}
                    min={0.00001}
                    max={0.01}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(false)}>
              取消
            </Button>
            <Button onClick={handleStartTraining} disabled={training || config.audioFileList.length === 0}>
              {training || uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  {uploading ? "上传中..." : "创建中..."}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  开始训练
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
