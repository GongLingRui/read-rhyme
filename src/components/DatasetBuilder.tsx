/**
 * Dataset Builder Component
 * Tool for creating LoRA training datasets
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { voiceStylingApi } from "@/services";
import {
  Plus,
  Trash2,
  Play,
  Save,
  Upload,
  Download,
  Volume2,
  Sparkles,
  Music,
  Smile,
  Zap,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatasetEntry {
  id: string;
  text: string;
  emotion: string;
  intensity: number;
  speed: number;
  pitch: number;
  audioPreview?: string;
  generating?: boolean;
}

interface DatasetPreset {
  id: string;
  name: string;
  description: string;
  entries: DatasetEntry[];
}

const emotionPresets = [
  { value: "neutral", label: "中性", color: "bg-gray-100 text-gray-800" },
  { value: "happy", label: "开心", color: "bg-yellow-100 text-yellow-800" },
  { value: "sad", label: "悲伤", color: "bg-blue-100 text-blue-800" },
  { value: "angry", label: "愤怒", color: "bg-red-100 text-red-800" },
  { value: "excited", label: "兴奋", color: "bg-orange-100 text-orange-800" },
  { value: "calm", label: "平静", color: "bg-green-100 text-green-800" },
  { value: "whisper", label: "耳语", color: "bg-purple-100 text-purple-800" },
  { value: "shout", label: "喊叫", color: "bg-red-200 text-red-900" },
];

const sampleTexts = [
  "你好，这是一个测试样本。",
  "今天天气真好啊。",
  "我想问你一个问题。",
  "这是一个非常有趣的故事。",
  "请听我慢慢道来。",
];

export function DatasetBuilder() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<DatasetEntry[]>([]);
  const [presets, setPresets] = useState<DatasetPreset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<DatasetPreset | null>(null);

  // New entry form
  const [newEntryText, setNewEntryText] = useState("");
  const [newEntryEmotion, setNewEntryEmotion] = useState("neutral");
  const [newEntryIntensity, setNewEntryIntensity] = useState(50);
  const [newEntrySpeed, setNewEntrySpeed] = useState(50);
  const [newEntryPitch, setNewEntryPitch] = useState(50);

  // Voice selection
  const [selectedVoice, setSelectedVoice] = useState("zh-CN-XiaoxiaoNeural");

  useEffect(() => {
    // Load presets from localStorage
    const savedPresets = localStorage.getItem("datasetPresets");
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }

    // Load current preset if exists
    const currentPresetId = localStorage.getItem("currentPreset");
    if (currentPresetId && savedPresets) {
      const parsed = JSON.parse(savedPresets);
      const preset = parsed.find((p: DatasetPreset) => p.id === currentPresetId);
      if (preset) {
        setCurrentPreset(preset);
        setEntries(preset.entries);
      }
    }
  }, []);

  const savePreset = () => {
    const preset: DatasetPreset = {
      id: Date.now().toString(),
      name: `数据集 ${presets.length + 1}`,
      description: `${entries.length} 个训练样本`,
      entries,
    };

    const updatedPresets = [...presets, preset];
    setPresets(updatedPresets);
    localStorage.setItem("datasetPresets", JSON.stringify(updatedPresets));

    toast({
      title: "已保存",
      description: `数据集预设 "${preset.name}" 已保存`,
    });
  };

  const loadPreset = (preset: DatasetPreset) => {
    setCurrentPreset(preset);
    setEntries(preset.entries);
    localStorage.setItem("currentPreset", preset.id);
  };

  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem("datasetPresets", JSON.stringify(updatedPresets));

    if (currentPreset?.id === presetId) {
      setCurrentPreset(null);
      setEntries([]);
    }
  };

  const addEntry = () => {
    if (!newEntryText.trim()) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入文本内容",
      });
      return;
    }

    const entry: DatasetEntry = {
      id: Date.now().toString(),
      text: newEntryText,
      emotion: newEntryEmotion,
      intensity: newEntryIntensity,
      speed: newEntrySpeed,
      pitch: newEntryPitch,
    };

    setEntries([...entries, entry]);
    setNewEntryText("");
    setNewEntryEmotion("neutral");
    setNewEntryIntensity(50);
    setNewEntrySpeed(50);
    setNewEntryPitch(50);

    toast({
      title: "已添加",
      description: "训练样本已添加",
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const generatePreview = async (entry: DatasetEntry) => {
    // Set generating state for this entry
    setEntries(entries.map(e =>
      e.id === entry.id ? { ...e, generating: true } : e
    ));

    try {
      const response = await voiceStylingApi.generateStyled({
        text: entry.text,
        voice: selectedVoice,
        emotion: entry.emotion,
        intensity: entry.intensity / 100,
        speed: entry.speed / 100,
        pitch: entry.pitch / 100,
      });

      if (response.success && response.data) {
        // Update entry with audio preview URL
        setEntries(entries.map(e =>
          e.id === entry.id
            ? { ...e, audioPreview: response.data!.audio_url, generating: false }
            : e
        ));

        toast({
          title: "生成成功",
          description: `音频时长: ${response.data!.duration.toFixed(1)}秒`,
        });
      } else {
        throw new Error(response.error?.message || "生成失败");
      }
    } catch (error: any) {
      // Reset generating state
      setEntries(entries.map(e =>
        e.id === entry.id ? { ...e, generating: false } : e
      ));

      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message || "请检查网络连接或稍后重试",
      });
    }
  };

  const exportDataset = () => {
    const dataset = {
      name: currentPreset?.name || "未命名数据集",
      description: currentPreset?.description || "",
      voice: selectedVoice,
      entries,
      created_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataset_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "已导出",
      description: "数据集已导出为JSON文件",
    });
  };

  const importDataset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.entries && Array.isArray(data.entries)) {
          setEntries(data.entries);
          toast({
            title: "导入成功",
            description: `已导入 ${data.entries.length} 个训练样本`,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "导入失败",
          description: "无效的JSON文件",
        });
      }
    };
    reader.readAsText(file);
  };

  const addSampleText = () => {
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setNewEntryText(randomText);
  };

  const getEmotionColor = (emotion: string) => {
    const preset = emotionPresets.find((e) => e.value === emotion);
    return preset?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">LoRA数据集构建器</h3>
          <p className="text-sm text-muted-foreground">
            {entries.length} 个训练样本
          </p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={importDataset}
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                导入
              </span>
            </Button>
          </label>
          <Button variant="outline" size="sm" onClick={exportDataset} disabled={entries.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button variant="outline" size="sm" onClick={savePreset} disabled={entries.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            保存预设
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">
            <Plus className="mr-2 h-4 w-4" />
            构建数据集
          </TabsTrigger>
          <TabsTrigger value="presets">
            <Music className="mr-2 h-4 w-4" />
            预设管理
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Add Entry Form */}
            <Card>
              <CardHeader>
                <CardTitle>添加训练样本</CardTitle>
                <CardDescription>
                  创建用于LoRA训练的语音样本
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Voice Selection */}
                <div className="space-y-2">
                  <Label>训练声音</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN-XiaoxiaoNeural">晓晓 (女声)</SelectItem>
                      <SelectItem value="zh-CN-YunxiNeural">云希 (男声)</SelectItem>
                      <SelectItem value="zh-CN-YunyangNeural">云扬 (男声)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>训练文本</Label>
                    <Button variant="ghost" size="sm" onClick={addSampleText}>
                      <Sparkles className="mr-1 h-3 w-3" />
                      随机示例
                    </Button>
                  </div>
                  <Textarea
                    value={newEntryText}
                    onChange={(e) => setNewEntryText(e.target.value)}
                    rows={3}
                    placeholder="输入训练用的文本内容..."
                  />
                </div>

                {/* Emotion Selection */}
                <div className="space-y-2">
                  <Label>情感类型</Label>
                  <div className="flex flex-wrap gap-2">
                    {emotionPresets.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={newEntryEmotion === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewEntryEmotion(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Parameters */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>强度</Label>
                      <span className="text-sm text-muted-foreground">{newEntryIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={newEntryIntensity}
                      onChange={(e) => setNewEntryIntensity(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>速度</Label>
                      <span className="text-sm text-muted-foreground">{newEntrySpeed}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={newEntrySpeed}
                      onChange={(e) => setNewEntrySpeed(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>音调</Label>
                      <span className="text-sm text-muted-foreground">{newEntryPitch}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={newEntryPitch}
                      onChange={(e) => setNewEntryPitch(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Add Button */}
                <Button onClick={addEntry} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  添加样本
                </Button>
              </CardContent>
            </Card>

            {/* Entries List */}
            <Card>
              <CardHeader>
                <CardTitle>训练样本列表</CardTitle>
                <CardDescription>
                  {entries.length} 个样本
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 pr-4">
                    {entries.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>暂无训练样本</p>
                        <p className="text-xs mt-2">添加样本开始构建数据集</p>
                      </div>
                    ) : (
                      entries.map((entry) => (
                        <Card key={entry.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getEmotionColor(entry.emotion)}>
                                  {emotionPresets.find((e) => e.value === entry.emotion)?.label || entry.emotion}
                                </Badge>
                              </div>
                              <p className="text-sm mb-2 line-clamp-2">{entry.text}</p>
                              <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                                <span>强度: {entry.intensity}%</span>
                                <span>速度: {entry.speed}%</span>
                                <span>音调: {entry.pitch}%</span>
                              </div>
                              {entry.audioPreview && (
                                <audio controls src={entry.audioPreview} className="w-full h-8" />
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generatePreview(entry)}
                                disabled={entry.generating}
                              >
                                {entry.generating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEntry(entry.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets">
          <Card>
            <CardHeader>
              <CardTitle>数据集预设</CardTitle>
              <CardDescription>
                管理保存的训练数据集预设
              </CardDescription>
            </CardHeader>
            <CardContent>
              {presets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无预设</p>
                  <p className="text-xs mt-2">构建并保存数据集后，预设将显示在这里</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {presets.map((preset) => (
                    <Card
                      key={preset.id}
                      className={`cursor-pointer transition-all ${
                        currentPreset?.id === preset.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        <CardDescription>{preset.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">样本数量</span>
                            <Badge variant="outline">{preset.entries.length}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => loadPreset(preset)}
                            >
                              加载
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePreset(preset.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
