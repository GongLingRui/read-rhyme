/**
 * Voice Clone Page
 * Clone voices using audio samples with quality checking
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { voicesApi, qwenTtsApi } from "@/services";
import { authFetch, authFetchUpload } from "@/utils/auth";
import {
  ArrowLeft,
  Upload,
  Mic,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Info,
  Sparkles,
} from "lucide-react";

interface AudioFile {
  file: File;
  id: string;
  text: string;
  status: "pending" | "uploading" | "uploaded" | "checking" | "checked" | "error";
  quality?: QualityCheck;
  error?: string;
}

interface QualityCheck {
  overall_score: number;
  duration: number;
  loudness: number;
  dynamic_range: number;
  noise_floor: number;
  format_compatible: boolean;
  has_clipping: boolean;
  issues: string[];
  recommendations: string[];
}

interface RecordingGuidelines {
  min_duration: number;
  max_duration: number;
  min_samples: number;
  max_samples: number;
  recommended_samples: number;
  sample_rate: number;
  bit_depth: number;
  formats: string[];
}

interface CloneProgress {
  status: "idle" | "processing" | "completed" | "failed";
  progress: number;
  voice_id?: string;
  message: string;
}

export default function VoiceClone() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("upload");
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [language, setLanguage] = useState("zh-CN");
  const [guidelines, setGuidelines] = useState<RecordingGuidelines | null>(null);
  const [checkingQuality, setCheckingQuality] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState<CloneProgress | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      const response = await authFetch("/api/audio-tools/audio-quality/guidelines");
      const data = await response.json();
      if (data.success) {
        setGuidelines(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch guidelines:", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAudioFiles: AudioFile[] = files.map((file) => ({
      file,
      id: `${file.name}_${Date.now()}`,
      text: "",
      status: "pending",
    }));

    setAudioFiles((prev) => [...prev, ...newAudioFiles]);
    setFileInputKey((prev) => prev + 1);
  };

  const handleRemoveFile = (id: string) => {
    setAudioFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateText = (id: string, text: string) => {
    setAudioFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, text } : f))
    );
  };

  const handleCheckQuality = async () => {
    if (audioFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "没有音频文件",
        description: "请先上传音频样本",
      });
      return;
    }

    setCheckingQuality(true);
    try {
      // Check each file
      const results = await Promise.all(
        audioFiles.map(async (audioFile) => {
          if (audioFile.status === "error" || audioFile.status === "checked") {
            return audioFile;
          }

          const formData = new FormData();
          formData.append("audio", audioFile.file);

          try {
            const response = await authFetchUpload("/api/audio-tools/audio-quality/check", formData);
            const data = await response.json();

            if (data.success && data.data) {
              return {
                ...audioFile,
                status: "checked",
                quality: data.data,
              };
            } else {
              return {
                ...audioFile,
                status: "error",
                error: data.error?.message || "检查失败",
              };
            }
          } catch (error: any) {
            return {
              ...audioFile,
              status: "error",
              error: error.message || "检查失败",
            };
          }
        })
      );

      setAudioFiles(results);
      toast({
        title: "质量检查完成",
        description: `已检查 ${results.length} 个文件`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "检查失败",
        description: error.message,
      });
    } finally {
      setCheckingQuality(false);
    }
  };

  const handleClone = async () => {
    if (!voiceName.trim()) {
      toast({
        variant: "destructive",
        title: "请输入语音名称",
        description: "语音名称不能为空",
      });
      return;
    }

    if (audioFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "没有音频文件",
        description: "请先上传音频样本",
      });
      return;
    }

    const filesWithText = audioFiles.filter((f) => f.text.trim());
    if (filesWithText.length === 0) {
      toast({
        variant: "destructive",
        title: "请输入音频文本",
        description: "每个音频文件需要对应的文本内容",
      });
      return;
    }

    setCloning(true);
    setCloneProgress({ status: "processing", progress: 0, message: "准备中..." });

    try {
      // Upload all files with texts
      const formData = new FormData();
      filesWithText.forEach((audioFile) => {
        formData.append("voice_samples", audioFile.file);
        formData.append("texts", audioFile.text);
      });
      formData.append("voice_name", voiceName);
      if (voiceDescription) {
        formData.append("description", voiceDescription);
      }
      formData.append("language", language);

      const response = await authFetchUpload("/api/voice-styling/batch-clone", formData);

      const data = await response.json();

      if (data.success) {
        setCloneProgress({
          status: "completed",
          progress: 100,
          message: "语音克隆成功！",
          voice_id: data.data.voice_id,
        });

        toast({
          title: "克隆成功",
          description: `语音 "${voiceName}" 已创建`,
        });

        // Clear form
        setTimeout(() => {
          setAudioFiles([]);
          setVoiceName("");
          setVoiceDescription("");
          setCloneProgress(null);
        }, 2000);
      } else {
        throw new Error(data.error?.message || "克隆失败");
      }
    } catch (error: any) {
      setCloneProgress({
        status: "failed",
        progress: 0,
        message: error.message,
      });
      toast({
        variant: "destructive",
        title: "克隆失败",
        description: error.message,
      });
    } finally {
      setCloning(false);
    }
  };

  const handleQwenClone = async () => {
    if (audioFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "没有音频文件",
        description: "请先上传音频样本",
      });
      return;
    }

    if (!voiceName.trim()) {
      toast({
        variant: "destructive",
        title: "请输入语音名称",
        description: "语音名称不能为空",
      });
      return;
    }

    setCloning(true);
    setCloneProgress({ status: "processing", progress: 0, message: "使用Qwen3-TTS克隆..." });

    try {
      const response = await qwenTtsApi.cloneVoice({
        audio_files: audioFiles.map((f) => f.file),
        voice_name: voiceName,
        description: voiceDescription,
      });

      if (response.success) {
        setCloneProgress({
          status: "completed",
          progress: 100,
          message: "Qwen3-TTS语音克隆成功！",
          voice_id: response.data.voice_id,
        });

        toast({
          title: "克隆成功",
          description: `Qwen3-TTS语音 "${voiceName}" 已创建`,
        });
      } else {
        throw new Error(response.error?.message || "克隆失败");
      }
    } catch (error: any) {
      setCloneProgress({
        status: "failed",
        progress: 0,
        message: error.message,
      });
      toast({
        variant: "destructive",
        title: "克隆失败",
        description: error.message,
      });
    } finally {
      setCloning(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-4 w-4" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const overallQuality =
    audioFiles.length > 0
      ? audioFiles
          .filter((f) => f.quality)
          .reduce((sum, f) => sum + (f.quality?.overall_score || 0), 0) /
          audioFiles.filter((f) => f.quality).length
      : 0;

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
              <h1 className="text-2xl font-bold">AI语音克隆</h1>
              <p className="text-sm text-muted-foreground">
                上传音频样本，创建你的专属AI语音
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              上传样本
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Play className="mr-2 h-4 w-4" />
              预览测试
            </TabsTrigger>
            <TabsTrigger value="guide">
              <Info className="mr-2 h-4 w-4" />
              录制指南
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            {/* Voice Info */}
            <Card>
              <CardHeader>
                <CardTitle>语音信息</CardTitle>
                <CardDescription>设置克隆语音的基本信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>语音名称 *</Label>
                  <Input
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="例如: 我的专属语音"
                  />
                </div>
                <div className="space-y-2">
                  <Label>描述</Label>
                  <Textarea
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    placeholder="描述这个语音的特点..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>语言</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">中文</SelectItem>
                      <SelectItem value="en-US">英语 (US)</SelectItem>
                      <SelectItem value="ja-JP">日语</SelectItem>
                      <SelectItem value="ko-KR">韩语</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Audio Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>音频样本</CardTitle>
                    <CardDescription>
                      上传5-10个音频样本，每个5-15秒，建议包含不同情感
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {audioFiles.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheckQuality}
                        disabled={checkingQuality}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${checkingQuality ? "animate-spin" : ""}`} />
                        检查质量
                      </Button>
                    )}
                    {overallQuality > 0 && (
                      <Badge variant={overallQuality >= 80 ? "default" : overallQuality >= 60 ? "secondary" : "destructive"}>
                        质量评分: {overallQuality.toFixed(0)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Button */}
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="audio/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={cloning}
                    />
                    <Button variant="outline" disabled={cloning} asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        选择音频文件
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-muted-foreground">
                    已选择 {audioFiles.length} 个文件
                  </p>
                </div>

                {/* Audio Files List */}
                {audioFiles.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      点击上方按钮选择音频文件
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {audioFiles.map((audioFile) => (
                      <div
                        key={audioFile.id}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{audioFile.file.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {(audioFile.file.size / 1024).toFixed(1)} KB
                              </Badge>
                              {audioFile.quality && (
                                <Badge
                                  variant={
                                    audioFile.quality.overall_score >= 80
                                      ? "default"
                                      : audioFile.quality.overall_score >= 60
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="gap-1"
                                >
                                  {getQualityIcon(audioFile.quality.overall_score)}
                                  {audioFile.quality.overall_score.toFixed(0)}分
                                </Badge>
                              )}
                              {audioFile.status === "error" && (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3" />
                                  错误
                                </Badge>
                              )}
                            </div>

                            {/* Quality Details */}
                            {audioFile.quality && (
                              <div className="p-3 bg-muted rounded-lg text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-muted-foreground">时长:</span>
                                    <span className="ml-2">{audioFile.quality.duration.toFixed(1)}秒</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">格式:</span>
                                    <span className="ml-2">
                                      {audioFile.quality.format_compatible ? "✓" : "✗"}
                                    </span>
                                  </div>
                                </div>
                                {audioFile.quality.issues.length > 0 && (
                                  <div className="mt-2 text-destructive">
                                    <p className="font-medium">问题:</p>
                                    <ul className="list-disc list-inside text-xs">
                                      {audioFile.quality.issues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Text Input */}
                            <div className="space-y-1">
                              <Label>对应的文本 *</Label>
                              <Textarea
                                value={audioFile.text}
                                onChange={(e) =>
                                  handleUpdateText(audioFile.id, e.target.value)
                                }
                                placeholder="输入这段音频的文本内容..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(audioFile.id)}
                            disabled={cloning}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clone Actions */}
            <Card>
              <CardHeader>
                <CardTitle>开始克隆</CardTitle>
                <CardDescription>
                  选择克隆方式创建自定义语音
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cloneProgress && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {cloneProgress.status === "processing" && (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                      {cloneProgress.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {cloneProgress.status === "failed" && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium">{cloneProgress.message}</span>
                    </div>
                    {cloneProgress.status === "processing" && (
                      <Progress value={cloneProgress.progress} />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleClone}
                    disabled={cloning || audioFiles.length === 0 || !voiceName}
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {cloning ? "处理中..." : "使用LoRA克隆"}
                  </Button>
                  <Button
                    onClick={handleQwenClone}
                    disabled={cloning || audioFiles.length === 0 || !voiceName}
                    variant="outline"
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {cloning ? "处理中..." : "使用Qwen3-TTS克隆"}
                  </Button>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm">
                    <strong>LoRA克隆:</strong> 训练专属模型，效果最好但需要更多时间
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Qwen3-TTS克隆:</strong> 快速克隆，支持Apple Silicon加速
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>预览测试</CardTitle>
                <CardDescription>
                  测试生成的语音效果
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>测试文本</Label>
                  <Textarea
                    placeholder="输入要测试的文本..."
                    rows={3}
                  />
                </div>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  生成预览
                </Button>
                <p className="text-sm text-muted-foreground">
                  克隆完成后可在此测试效果
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guide Tab */}
          <TabsContent value="guide" className="space-y-4">
            {guidelines && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>录制要求</CardTitle>
                    <CardDescription>
                      请遵循以下要求以获得最佳克隆效果
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">最小时长</p>
                        <p className="text-lg font-medium">{guidelines.min_duration}秒</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">最大时长</p>
                        <p className="text-lg font-medium">{guidelines.max_duration}秒</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">推荐样本数</p>
                        <p className="text-lg font-medium">{guidelines.recommended_samples}个</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">采样率</p>
                        <p className="text-lg font-medium">{guidelines.sample_rate} Hz</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>录制建议</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• 在安静的环境中录制，避免背景噪音</p>
                    <p>• 保持一致的语速和音量</p>
                    <p>• 包含不同的情感：平静、开心、悲伤、愤怒等</p>
                    <p>• 使用自然的说话方式，不要过于戏剧化</p>
                    <p>• 确保音频清晰，没有回声或混响</p>
                    <p>• 推荐使用专业麦克风或高质量录音设备</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>样本多样性</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>为了获得更好的克隆效果，建议包含：</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>不同情感的表达（高兴、悲伤、惊讶等）</li>
                      <li>不同的语速（正常、快速、慢速）</li>
                      <li>不同的语调（疑问、陈述、感叹）</li>
                      <li>数字、专有名词、标点符号的处理</li>
                      <li>长句和短句的组合</li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
