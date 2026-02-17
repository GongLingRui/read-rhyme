/**
 * Voice Styling Page
 * Voice style and emotion control for TTS
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { voiceStylingApi, emotionPresetsService, type ScenarioPreset } from "@/services";
import {
  Play,
  Smile,
  Heart,
  Zap,
  Music,
  Sparkles,
  Volume2,
  RefreshCw,
  Download,
  Shuffle,
  Upload,
} from "lucide-react";

interface EmotionPreset {
  preset_id: string;
  name: string;
  category: string;
  description: string;
  parameters: {
    emotion: string;
    intensity: number;
    speed: number;
    pitch: number;
    energy: number;
  };
}

// Convert ScenarioPreset to EmotionPreset format
const convertToEmotionPreset = (preset: ScenarioPreset): EmotionPreset => {
  // Get primary emotion from preset
  const getPrimaryEmotion = (emotion: any): string => {
    if (emotion.happiness && emotion.happiness > 0.5) return "happy";
    if (emotion.sadness && emotion.sadness > 0.5) return "sad";
    if (emotion.anger && emotion.anger > 0.5) return "angry";
    if (emotion.fear && emotion.fear > 0.5) return "fear";
    if (emotion.surprise && emotion.surprise > 0.5) return "excited";
    if (emotion.energy && emotion.energy > 1.2) return "energetic";
    if (emotion.energy && emotion.energy < 0.8) return "calm";
    return "neutral";
  };

  return {
    preset_id: preset.id,
    name: preset.name,
    category: preset.category,
    description: preset.description,
    parameters: {
      emotion: getPrimaryEmotion(preset.emotion),
      intensity: preset.emotion.happiness || preset.emotion.energy || 0.5,
      speed: preset.emotion.tempo || 1,
      pitch: preset.emotion.pitch || 1,
      energy: preset.emotion.energy || 1,
    },
  };
};

interface VoiceStyle {
  style_id: string;
  name: string;
  description: string;
  parameters: {
    timbre: string;
    warmth: number;
    brightness: number;
    breathiness: number;
  };
}

interface GeneratedAudio {
  audio_url: string;
  duration: number;
}

export default function VoiceStyling() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("presets");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Presets
  const [presets, setPresets] = useState<EmotionPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<EmotionPreset | null>(null);
  const [category, setCategory] = useState<string>("all");

  // Custom generation
  const [text, setText] = useState("你好，这是一个语音预览示例。This is a voice preview sample.");
  const [voice, setVoice] = useState("zh-CN-XiaoxiaoNeural");
  const [emotion, setEmotion] = useState("neutral");
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [pitch, setPitch] = useState(50);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);

  // Voice conversion
  const [sourceAudioFile, setSourceAudioFile] = useState<File | null>(null);
  const [targetVoiceId, setTargetVoiceId] = useState("zh-CN-XiaoxiaoNeural");
  const [preserveTiming, setPreserveTiming] = useState(true);
  const [preserveProsody, setPreserveProsody] = useState(true);
  const [converting, setConverting] = useState(false);
  const [convertedAudio, setConvertedAudio] = useState<{ audio_url: string; duration: number } | null>(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const response = await emotionPresetsService.getAllPresets();
      if (response.success && response.data) {
        // Convert ScenarioPreset[] to EmotionPreset[]
        const convertedPresets = response.data.map(convertToEmotionPreset);
        setPresets(convertedPresets);
      } else {
        setPresets([]);
      }
    } catch (error) {
      console.error("Failed to fetch presets:", error);
      setPresets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: EmotionPreset) => {
    setSelectedPreset(preset);
    setEmotion(preset.parameters.emotion);
    setIntensity(preset.parameters.intensity * 100);
    setSpeed(preset.parameters.speed * 100);
    setPitch(preset.parameters.pitch * 100);
    setActiveTab("custom");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await voiceStylingApi.generateStyled({
        text,
        voice,
        emotion,
        intensity: intensity / 100,
        speed: speed / 100,
        pitch: pitch / 100,
      });

      if (response.success && response.data) {
        setGeneratedAudio(response.data);
        toast({
          title: "生成成功",
          description: `音频时长: ${response.data!.duration.toFixed(1)}秒`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRecommend = async () => {
    try {
      const response = await emotionPresetsService.getRecommendedPreset(text);
      if (response.success && response.data) {
        const preset = response.data;
        // Convert ScenarioPreset to EmotionPreset format
        const emotionPreset: EmotionPreset = {
          preset_id: preset.id,
          name: preset.name,
          category: preset.category,
          description: preset.description,
          parameters: {
            emotion: preset.emotion.neutral ? "neutral" : "happy",
            intensity: 0.5,
            speed: 1,
            pitch: 1,
            energy: preset.emotion.energy || 1,
          },
        };
        handleSelectPreset(emotionPreset);
        toast({
          title: "推荐成功",
          description: `已应用情感预设: ${preset.name}`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "推荐失败",
        description: error.message,
      });
    }
  };

  const handleConvertVoice = async () => {
    if (!sourceAudioFile) {
      toast({
        variant: "destructive",
        title: "没有文件",
        description: "请先选择源音频文件",
      });
      return;
    }

    setConverting(true);
    try {
      // First upload the file to get a path
      const formData = new FormData();
      formData.append("audio", sourceAudioFile);

      // For voice conversion, we need to use the API
      // The endpoint expects source_audio_path as a string reference
      // For now, we'll create a temporary URL for the file
      const sourceAudioPath = URL.createObjectURL(sourceAudioFile);

      const response = await voiceStylingApi.convertVoice({
        source_audio_path: sourceAudioPath,
        target_voice_id: targetVoiceId,
        preserve_timing: preserveTiming,
        preserve_prosody: preserveProsody,
      });

      if (response.success && response.data) {
        setConvertedAudio({
          audio_url: response.data.converted_audio_url,
          duration: 0, // Will be updated from response
        });
        toast({
          title: "转换成功",
          description: "语音转换已完成",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "转换失败",
        description: error.message,
      });
    } finally {
      setConverting(false);
    }
  };

  const categories = Array.from(new Set(presets.map((p) => p.category)));
  const filteredPresets =
    category === "all" ? presets : presets.filter((p) => p.category === category);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "happy":
      case "joy":
        return <Smile className="h-4 w-4" />;
      case "sad":
        return <Heart className="h-4 w-4" />;
      case "energetic":
        return <Zap className="h-4 w-4" />;
      case "calm":
        return <Music className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "happy":
      case "joy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "sad":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "energetic":
        return "bg-red-100 text-red-800 border-red-200";
      case "calm":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">语音风格控制</h1>
            <p className="text-sm text-muted-foreground">
              调整语音的情感、语调和风格，创造独特的有声体验
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="presets">
              <Sparkles className="mr-2 h-4 w-4" />
              情感预设
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Volume2 className="mr-2 h-4 w-4" />
              自定义控制
            </TabsTrigger>
            <TabsTrigger value="convert">
              <Shuffle className="mr-2 h-4 w-4" />
              语音转换
            </TabsTrigger>
          </TabsList>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={category === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory("all")}
              >
                全部
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="gap-1"
                >
                  {getCategoryIcon(cat)}
                  {cat}
                </Button>
              ))}
            </div>

            {/* Presets Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : filteredPresets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>没有可用的情感预设</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.map((preset) => (
                  <Card
                    key={preset.preset_id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{preset.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {preset.description}
                          </CardDescription>
                        </div>
                        <Badge className={getCategoryColor(preset.category)}>
                          {getCategoryIcon(preset.category)}
                          {preset.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">强度</span>
                          <span>{(preset.parameters.intensity * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">速度</span>
                          <span>{(preset.parameters.speed * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">音调</span>
                          <span>{(preset.parameters.pitch * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPreset(preset);
                        }}
                      >
                        应用预设
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Custom Control Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>语音参数</CardTitle>
                  <CardDescription>
                    自定义调整语音的各项参数
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>测试文本</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRecommend}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        AI推荐
                      </Button>
                    </div>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      placeholder="输入要生成的文本..."
                    />
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <Label>选择语音</Label>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN-XiaoxiaoNeural">晓晓 (女声)</SelectItem>
                        <SelectItem value="zh-CN-YunxiNeural">云希 (男声)</SelectItem>
                        <SelectItem value="zh-CN-YunyangNeural">云扬 (男声)</SelectItem>
                        <SelectItem value="zh-CN-XiaoyiNeural">晓伊 (女声)</SelectItem>
                        <SelectItem value="zh-CN-YunjianNeural">云健 (男声)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emotion */}
                  <div className="space-y-2">
                    <Label>情感类型</Label>
                    <Select value={emotion} onValueChange={setEmotion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">中性</SelectItem>
                        <SelectItem value="happy">开心</SelectItem>
                        <SelectItem value="sad">悲伤</SelectItem>
                        <SelectItem value="angry">愤怒</SelectItem>
                        <SelectItem value="excited">兴奋</SelectItem>
                        <SelectItem value="calm">平静</SelectItem>
                        <SelectItem value="whisper">耳语</SelectItem>
                        <SelectItem value="shout">喊叫</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>强度</Label>
                        <span className="text-sm text-muted-foreground">{intensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={intensity}
                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>速度</Label>
                        <span className="text-sm text-muted-foreground">{speed}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>音调</Label>
                        <span className="text-sm text-muted-foreground">{pitch}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={pitch}
                        onChange={(e) => setPitch(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !text}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        生成语音
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Output */}
              <Card>
                <CardHeader>
                  <CardTitle>生成结果</CardTitle>
                  <CardDescription>
                    预览和下载生成的语音
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedAudio ? (
                    <div className="space-y-4">
                      <audio
                        controls
                        className="w-full"
                        src={generatedAudio.audio_url}
                        autoPlay
                      >
                        您的浏览器不支持音频播放
                      </audio>

                      <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">时长</span>
                          <span>{generatedAudio.duration.toFixed(1)} 秒</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">情感</span>
                          <span>{emotion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">语音</span>
                          <span>{voice}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = generatedAudio.audio_url;
                          a.download = `styled_voice_${Date.now()}.mp3`;
                          a.click();
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载音频
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>调整参数并点击生成按钮</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Voice Conversion Tab */}
          <TabsContent value="convert" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>语音转换</CardTitle>
                  <CardDescription>
                    将一段音频的声音转换为目标说话人的声音
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Source Audio Upload */}
                  <div className="space-y-2">
                    <Label>源音频文件</Label>
                    <div className="flex gap-2">
                      <label className="cursor-pointer flex-1">
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSourceAudioFile(file);
                          }}
                        />
                        <Button variant="outline" asChild className="w-full">
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            {sourceAudioFile ? sourceAudioFile.name : "选择音频文件"}
                          </span>
                        </Button>
                      </label>
                    </div>
                    {sourceAudioFile && (
                      <audio controls src={URL.createObjectURL(sourceAudioFile)} className="w-full h-10" />
                    )}
                  </div>

                  {/* Target Voice Selection */}
                  <div className="space-y-2">
                    <Label>目标声音</Label>
                    <Select value={targetVoiceId} onValueChange={setTargetVoiceId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN-XiaoxiaoNeural">晓晓 (女声)</SelectItem>
                        <SelectItem value="zh-CN-YunxiNeural">云希 (男声)</SelectItem>
                        <SelectItem value="zh-CN-YunyangNeural">云扬 (男声)</SelectItem>
                        <SelectItem value="zh-CN-XiaoyiNeural">晓伊 (女声)</SelectItem>
                        <SelectItem value="zh-CN-YunjianNeural">云健 (男声)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="timing">保持时序</Label>
                      <input
                        id="timing"
                        type="checkbox"
                        checked={preserveTiming}
                        onChange={(e) => setPreserveTiming(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prosody">保持韵律</Label>
                      <input
                        id="prosody"
                        type="checkbox"
                        checked={preserveProsody}
                        onChange={(e) => setPreserveProsody(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Convert Button */}
                  <Button
                    onClick={handleConvertVoice}
                    disabled={!sourceAudioFile || converting}
                    className="w-full"
                    size="lg"
                  >
                    {converting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        转换中...
                      </>
                    ) : (
                      <>
                        <Shuffle className="mr-2 h-4 w-4" />
                        开始转换
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Conversion Result */}
              <Card>
                <CardHeader>
                  <CardTitle>转换结果</CardTitle>
                  <CardDescription>
                    预览和下载转换后的语音
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {convertedAudio ? (
                    <div className="space-y-4">
                      <audio
                        controls
                        className="w-full"
                        src={convertedAudio.audio_url}
                        autoPlay
                      >
                        您的浏览器不支持音频播放
                      </audio>

                      <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">源文件</span>
                          <span>{sourceAudioFile?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">目标声音</span>
                          <span>{targetVoiceId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">保持时序</span>
                          <span>{preserveTiming ? "是" : "否"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">保持韵律</span>
                          <span>{preserveProsody ? "是" : "否"}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = convertedAudio.audio_url;
                          a.download = `converted_voice_${Date.now()}.mp3`;
                          a.click();
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载音频
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shuffle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>选择源音频文件并点击转换按钮</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
