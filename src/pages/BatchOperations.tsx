/**
 * Batch Operations Page
 * Batch audio generation, editing, and export
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services";
import { audioApi } from "@/services/audio";
import {
  Play,
  Pause,
  Download,
  Upload,
  Trash2,
  Edit,
  Check,
  X,
  RefreshCw,
  Home,
  Zap,
  Layers,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BatchItem {
  id: string;
  text: string;
  voice: string;
  emotion: string;
  status: "pending" | "processing" | "completed" | "failed";
  audio_url?: string;
  duration?: number;
  error?: string;
}

interface BatchConfig {
  voice: string;
  emotion: string;
  speed: number;
  pitch: number;
  volume: number;
  batch_size: number;
  max_workers: number;
  use_cache: boolean;
}

interface ExportConfig {
  format: "mp3" | "wav" | "flac";
  quality: "low" | "medium" | "high";
  normalize: boolean;
  add_fades: boolean;
  output_name: string;
}

export default function BatchOperations() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("generate");

  // Batch items
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Batch configuration
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    voice: "zh-CN-XiaoxiaoNeural",
    emotion: "neutral",
    speed: 100,
    pitch: 100,
    volume: 100,
    batch_size: 10,
    max_workers: 2,
    use_cache: true,
  });

  // Export configuration
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: "mp3",
    quality: "high",
    normalize: true,
    add_fades: true,
    output_name: `batch_${Date.now()}`,
  });

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Editing state
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Text input for batch
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"lines" | "paragraphs">("lines");

  // Expansion states
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load sample batch items
    const sampleItems: BatchItem[] = [
      {
        id: "1",
        text: "欢迎来到批量操作页面。这里可以高效处理大量音频生成任务。",
        voice: "zh-CN-XiaoxiaoNeural",
        emotion: "neutral",
        status: "pending",
      },
      {
        id: "2",
        text: "支持批量生成、批量编辑和批量导出功能。",
        voice: "zh-CN-XiaoxiaoNeural",
        emotion: "happy",
        status: "pending",
      },
      {
        id: "3",
        text: "可以自定义语音参数，并实时查看处理进度。",
        voice: "zh-CN-XiaoxiaoNeural",
        emotion: "neutral",
        status: "pending",
      },
    ];
    setBatchItems(sampleItems);
  }, []);

  const handleAddItems = () => {
    const lines = inputMode === "lines"
      ? textInput.split("\n").filter(line => line.trim())
      : textInput.split("\n\n").filter(para => para.trim());

    const newItems: BatchItem[] = lines.map((text, i) => ({
      id: `item-${Date.now()}-${i}`,
      text: text.trim(),
      voice: batchConfig.voice,
      emotion: batchConfig.emotion,
      status: "pending",
    }));

    setBatchItems([...batchItems, ...newItems]);
    setTextInput("");

    toast({
      title: "添加成功",
      description: `已添加 ${newItems.length} 个项目`,
    });
  };

  const handleRemoveItem = (id: string) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
    setSelectedItems(new Set([...selectedItems].filter(i => i !== id)));
  };

  const handleRemoveSelected = () => {
    setBatchItems(batchItems.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const handleSelectAll = () => {
    if (selectedItems.size === batchItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(batchItems.map(item => item.id)));
    }
  };

  const handleApplyConfig = () => {
    const updatedItems = batchItems.map(item => ({
      ...item,
      voice: batchConfig.voice,
      emotion: batchConfig.emotion,
    }));

    setBatchItems(updatedItems);

    toast({
      title: "配置已应用",
      description: `已更新 ${updatedItems.length} 个项目的配置`,
    });
  };

  const handleBatchGenerate = async () => {
    if (batchItems.filter(i => i.status === "pending").length === 0) {
      toast({
        variant: "destructive",
        title: "无待处理项目",
        description: "请先添加待生成的文本内容",
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setProcessedCount(0);
    setFailedCount(0);

    try {
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];

        if (item.status !== "pending") continue;

        setCurrentTask(`处理: ${item.text.slice(0, 30)}...`);

        // Update item status to processing
        setBatchItems(prev => prev.map((it, idx) =>
          idx === i ? { ...it, status: "processing" } : it
        ));

        try {
          const response = await apiClient.post("/api/voice-styling/generate-styled", {
            text: item.text,
            voice_name: item.voice,
            emotion: { [item.emotion]: 0.8 },
          });

          if (response.success && response.data) {
            setBatchItems(prev => prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    status: "completed",
                    audio_url: response.data.audio_url,
                    duration: response.data.duration,
                  }
                : it
            ));
            setProcessedCount(c => c + 1);
          } else {
            throw new Error("生成失败");
          }
        } catch (error) {
          setBatchItems(prev => prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: "failed",
                  error: error instanceof Error ? error.message : "未知错误",
                }
              : it
          ));
          setFailedCount(c => c + 1);
        }

        setProgress(((i + 1) / batchItems.length) * 100);
      }

      toast({
        title: "批量处理完成",
        description: `成功: ${processedCount}, 失败: ${failedCount}`,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "处理失败",
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setProcessing(false);
      setCurrentTask("");
    }
  };

  const handleBatchExport = async () => {
    const completedItems = batchItems.filter(item => item.status === "completed");

    if (completedItems.length === 0) {
      toast({
        variant: "destructive",
        title: "无可导出项目",
        description: "请先完成音频生成",
      });
      return;
    }

    setLoading(true);
    try {
      // Export all completed items
      for (const item of completedItems) {
        if (item.audio_url) {
          const a = document.createElement("a");
          a.href = item.audio_url;
          a.download = `${exportConfig.output_name}_${item.id}.${exportConfig.format}`;
          a.click();
        }
      }

      toast({
        title: "导出成功",
        description: `已导出 ${completedItems.length} 个文件`,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "导出失败",
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);

  const handleStartEdit = (item: BatchItem) => {
    setEditingItem(item.id);
    setEditText(item.text);
  };

  const handleSaveEdit = (itemId: string) => {
    setBatchItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, text: editText, status: "pending" }
        : item
    ));
    setEditingItem(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditText("");
  };

  const handleRegenerateItem = async (itemId: string) => {
    const item = batchItems.find(i => i.id === itemId);
    if (!item) return;

    setBatchItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: "pending" } : i
    ));
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusBadge = (status: BatchItem["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">等待中</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">处理中</Badge>;
      case "completed":
        return <Badge className="bg-green-500">完成</Badge>;
      case "failed":
        return <Badge variant="destructive">失败</Badge>;
    }
  };

  const stats = {
    total: batchItems.length,
    pending: batchItems.filter(i => i.status === "pending").length,
    processing: batchItems.filter(i => i.status === "processing").length,
    completed: batchItems.filter(i => i.status === "completed").length,
    failed: batchItems.filter(i => i.status === "failed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <Home className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">批量操作</h1>
                <p className="text-sm text-muted-foreground">
                  批量音频生成、编辑和导出
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">总计: {stats.total}</Badge>
              <Badge className="bg-blue-500">处理中: {stats.processing}</Badge>
              <Badge className="bg-green-500">完成: {stats.completed}</Badge>
              <Badge variant="destructive">失败: {stats.failed}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="generate">
              <Zap className="mr-2 h-4 w-4" />
              批量生成
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit className="mr-2 h-4 w-4" />
              批量编辑
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              批量导出
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="mr-2 h-4 w-4" />
              配置
            </TabsTrigger>
          </TabsList>

          {/* Batch Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Add Items */}
              <Card>
                <CardHeader>
                  <CardTitle>添加批量项目</CardTitle>
                  <CardDescription>
                    输入文本，每行或每段落一个项目
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={inputMode === "lines" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInputMode("lines")}
                    >
                      按行分割
                    </Button>
                    <Button
                      variant={inputMode === "paragraphs" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInputMode("paragraphs")}
                    >
                      按段落分割
                    </Button>
                  </div>

                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={8}
                    placeholder={inputMode === "lines"
                      ? "每行一个项目..."
                      : "每段落一个项目（段落之间空一行）..."
                    }
                  />

                  <Button
                    onClick={handleAddItems}
                    disabled={!textInput.trim()}
                    className="w-full"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    添加到列表
                  </Button>
                </CardContent>
              </Card>

              {/* Batch List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>批量项目列表</CardTitle>
                      <CardDescription>
                        共 {stats.total} 个项目
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedItems.size === stats.total ? "取消全选" : "全选"}
                      </Button>
                      {selectedItems.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveSelected}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {batchItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>暂无项目</p>
                      </div>
                    ) : (
                      batchItems.map((item, index) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            selectedItems.has(item.id)
                              ? "bg-primary/10 border-primary"
                              : "bg-background"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedItems);
                                if (checked) {
                                  newSelected.add(item.id);
                                } else {
                                  newSelected.delete(item.id);
                                }
                                setSelectedItems(newSelected);
                              }}
                              className="mt-1"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">#{index + 1}</span>
                                {getStatusBadge(item.status)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1"
                                  onClick={() => toggleExpanded(item.id)}
                                >
                                  {expandedItems.has(item.id) ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>

                              <p className="text-sm line-clamp-1">
                                {editingItem === item.id ? (
                                  <Input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="h-7"
                                  />
                                ) : (
                                  item.text
                                )}
                              </p>

                              {expandedItems.has(item.id) && (
                                <div className="mt-2 space-y-2 text-sm">
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{item.voice}</Badge>
                                    <Badge variant="outline">{item.emotion}</Badge>
                                    {item.duration && (
                                      <Badge variant="outline">{item.duration.toFixed(1)}s</Badge>
                                    )}
                                  </div>

                                  {item.audio_url && (
                                    <audio
                                      controls
                                      src={item.audio_url}
                                      className="w-full h-8"
                                    />
                                  )}

                                  {item.error && (
                                    <p className="text-red-500 text-xs">{item.error}</p>
                                  )}

                                  <div className="flex gap-2">
                                    {editingItem === item.id ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleSaveEdit(item.id)}
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          保存
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={handleCancelEdit}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          取消
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleStartEdit(item)}
                                          disabled={processing}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          编辑
                                        </Button>
                                        {item.status === "failed" && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRegenerateItem(item.id)}
                                            disabled={processing}
                                          >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            重试
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRemoveItem(item.id)}
                                          disabled={processing}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          删除
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            {processing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{currentTask}</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>成功: {processedCount}</span>
                      <span>失败: {failedCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleBatchGenerate}
                disabled={processing || stats.pending === 0}
                size="lg"
                className="flex-1"
              >
                {processing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    处理中... ({progress.toFixed(0)}%)
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    批量生成 ({stats.pending})
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Batch Edit Tab */}
          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>批量编辑</CardTitle>
                <CardDescription>
                  统一修改选中项目的参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>语音</Label>
                    <Select
                      value={batchConfig.voice}
                      onValueChange={(v) => setBatchConfig({ ...batchConfig, voice: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN-XiaoxiaoNeural">晓晓 (女声)</SelectItem>
                        <SelectItem value="zh-CN-YunxiNeural">云希 (男声)</SelectItem>
                        <SelectItem value="zh-CN-YunyangNeural">云扬 (男声)</SelectItem>
                        <SelectItem value="zh-CN-XiaoyiNeural">晓伊 (女声)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>情感</Label>
                    <Select
                      value={batchConfig.emotion}
                      onValueChange={(v) => setBatchConfig({ ...batchConfig, emotion: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">中性</SelectItem>
                        <SelectItem value="happy">开心</SelectItem>
                        <SelectItem value="sad">悲伤</SelectItem>
                        <SelectItem value="angry">愤怒</SelectItem>
                        <SelectItem value="excited">兴奋</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>应用范围</Label>
                    <Select
                      value={selectedItems.size > 0 ? "selected" : "all"}
                      onValueChange={() => {}}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部项目 ({stats.total})</SelectItem>
                        <SelectItem value="selected">
                          选中项目 ({selectedItems.size})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>速度</Label>
                      <span className="text-sm text-muted-foreground">{batchConfig.speed}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={batchConfig.speed}
                      onChange={(e) => setBatchConfig({ ...batchConfig, speed: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>音调</Label>
                      <span className="text-sm text-muted-foreground">{batchConfig.pitch}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={batchConfig.pitch}
                      onChange={(e) => setBatchConfig({ ...batchConfig, pitch: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>音量</Label>
                      <span className="text-sm text-muted-foreground">{batchConfig.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={150}
                      value={batchConfig.volume}
                      onChange={(e) => setBatchConfig({ ...batchConfig, volume: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleApplyConfig}
                  className="w-full"
                  disabled={selectedItems.size === 0 && stats.total === 0}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  应用配置到所有项目
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>批量导出</CardTitle>
                <CardDescription>
                  配置导出格式并导出所有完成的音频
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>导出格式</Label>
                    <Select
                      value={exportConfig.format}
                      onValueChange={(v: any) => setExportConfig({ ...exportConfig, format: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp3">MP3 (推荐)</SelectItem>
                        <SelectItem value="wav">WAV (无损)</SelectItem>
                        <SelectItem value="flac">FLAC (压缩无损)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>质量</Label>
                    <Select
                      value={exportConfig.quality}
                      onValueChange={(v: any) => setExportConfig({ ...exportConfig, quality: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低 (快速)</SelectItem>
                        <SelectItem value="medium">中 (平衡)</SelectItem>
                        <SelectItem value="high">高 (最佳)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>输出文件名</Label>
                    <Input
                      value={exportConfig.output_name}
                      onChange={(e) => setExportConfig({ ...exportConfig, output_name: e.target.value })}
                      placeholder="batch_output"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="normalize">音量标准化</Label>
                    <input
                      id="normalize"
                      type="checkbox"
                      checked={exportConfig.normalize}
                      onChange={(e) => setExportConfig({ ...exportConfig, normalize: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fades">添加淡入淡出</Label>
                    <input
                      id="fades"
                      type="checkbox"
                      checked={exportConfig.add_fades}
                      onChange={(e) => setExportConfig({ ...exportConfig, add_fades: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">可导出项目</span>
                    <span className="font-medium">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">预计文件大小</span>
                    <span className="font-medium">
                      ~{(stats.completed * 2).toFixed(0)} MB
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleBatchExport}
                  disabled={stats.completed === 0 || loading}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出 {stats.completed} 个文件
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>批量处理配置</CardTitle>
                <CardDescription>
                  配置批量生成的高级参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>批处理大小</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={batchConfig.batch_size}
                      onChange={(e) => setBatchConfig({ ...batchConfig, batch_size: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      每批处理的数量
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>最大并发数</Label>
                    <Input
                      type="number"
                      min={1}
                      max={4}
                      value={batchConfig.max_workers}
                      onChange={(e) => setBatchConfig({ ...batchConfig, max_workers: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      同时处理的最大任务数
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label>启用智能缓存</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      相同文本使用缓存结果，提高速度
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={batchConfig.use_cache}
                    onChange={(e) => setBatchConfig({ ...batchConfig, use_cache: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2 text-sm">
                  <h4 className="font-medium">性能提示</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 批处理大小越大，内存占用越高</li>
                    <li>• 并发数建议设置为 2-4</li>
                    <li>• 启用缓存可显著提高重复内容的生成速度</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
