/**
 * Audio Preview Page
 * Real-time audio preview with waveform visualization and editing
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import AudioWaveform from "@/components/AudioWaveform";
import { apiClient } from "@/services";
import {
  Play,
  Pause,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  Scissors,
  Wand2,
  Music,
  Volume2,
  Sparkles,
  RefreshCw,
  Home,
  ArrowLeft,
} from "lucide-react";

interface WaveformRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  label?: string;
}

interface AudioSegment {
  id: string;
  text: string;
  audio_url: string;
  duration: number;
  speaker: string;
  emotion: string;
}

interface QualityMetrics {
  mos_score: number;
  speaker_similarity: number;
  emotion_accuracy: number;
  snr_db: number;
  dynamic_range_db: number;
  recommendations: string[];
}

export default function AudioPreview() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Audio segments
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  // Waveform regions
  const [regions, setRegions] = useState<WaveformRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<WaveformRegion | null>(null);

  // Text input
  const [text, setText] = useState("欢迎使用音频预览系统。这里可以实时预览和编辑生成的语音内容。Welcome to the audio preview system.");
  const [voice, setVoice] = useState("zh-CN-XiaoxiaoNeural");
  const [emotion, setEmotion] = useState("neutral");

  // Audio effects
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(100);
  const [pitch, setPitch] = useState(100);
  const [backgroundMusic, setBackgroundMusic] = useState("");
  const [musicVolume, setMusicVolume] = useState(20);

  // Quality metrics
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<AudioSegment[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // WebSocket for real-time updates
  const [wsConnected, setWsConnected] = useState(false);

  const currentSegment = segments[currentSegmentIndex];

  useEffect(() => {
    // Generate initial audio
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await apiClient.post("/api/voice-styling/generate-styled", {
        text,
        voice_name: voice,
        emotion: { [emotion]: 0.8, energy: volume / 100, tempo: speed / 100 },
      });

      if (response.success && response.data) {
        const newSegment: AudioSegment = {
          id: `segment-${Date.now()}`,
          text,
          audio_url: response.data.audio_url,
          duration: response.data.duration,
          speaker: voice,
          emotion,
        };

        setSegments([...segments, newSegment]);
        setCurrentSegmentIndex(segments.length);
        addToHistory([...segments, newSegment]);

        toast({
          title: "生成成功",
          description: `音频时长: ${response.data.duration.toFixed(1)}秒`,
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

  const handleEnhance = async () => {
    if (!currentSegment) return;

    setLoading(true);
    try {
      const response = await apiClient.post("/api/voice-advanced/enhance", {
        audio_path: currentSegment.audio_url.replace("/static/", ""),
        enhance_volume: true,
        enhance_denoise: true,
        add_compression: true,
        target_lufs: -16,
      });

      if (response.success && response.data) {
        const enhancedSegment: AudioSegment = {
          ...currentSegment,
          audio_url: response.data.enhanced_audio_url,
        };

        const updatedSegments = [...segments];
        updatedSegments[currentSegmentIndex] = enhancedSegment;
        setSegments(updatedSegments);
        addToHistory(updatedSegments);

        toast({
          title: "增强成功",
          description: "音频质量已提升",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "增强失败",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssessQuality = async () => {
    if (!currentSegment) return;

    setLoading(true);
    try {
      const response = await apiClient.post("/api/voice-advanced/assess-quality", {
        audio_path: currentSegment.audio_url.replace("/static/", ""),
        detailed: true,
      });

      if (response.success && response.data) {
        setQualityMetrics(response.data);

        toast({
          title: "质量评估完成",
          description: `MOS评分: ${response.data.mos_score.toFixed(1)}/5`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "评估失败",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegionSelect = (region: WaveformRegion) => {
    setSelectedRegion(region);
  };

  const handleRegionDelete = (regionId: string) => {
    setRegions(regions.filter((r) => r.id !== regionId));
    setSelectedRegion(null);
  };

  const handleAddRegion = () => {
    if (!currentSegment) return;

    const newRegion: WaveformRegion = {
      id: `region-${Date.now()}`,
      start: 0,
      end: currentSegment.duration,
      color: "rgba(59, 130, 246, 0.3)",
      label: "编辑区域",
    };

    setRegions([...regions, newRegion]);
  };

  const addToHistory = (newSegments: AudioSegment[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSegments);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSegments(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSegments(history[newIndex]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Combine all segments
      const response = await apiClient.post("/api/audio-processor/mix-audio", {
        speech_audio_path: currentSegment?.audio_url.replace("/static/", ""),
        background_music_path: backgroundMusic || undefined,
        music_volume: musicVolume / 100,
        ducking: true,
        fade_in: 0.5,
        fade_out: 1.0,
      });

      if (response.success && response.data) {
        toast({
          title: "保存成功",
          description: "音频已保存",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-2xl font-bold">音频实时预览</h1>
                <p className="text-sm text-muted-foreground">
                  波形可视化与实时音频编辑
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!currentSegment || loading}
              >
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="preview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="preview">
              <Play className="mr-2 h-4 w-4" />
              预览编辑
            </TabsTrigger>
            <TabsTrigger value="effects">
              <Wand2 className="mr-2 h-4 w-4" />
              音频特效
            </TabsTrigger>
            <TabsTrigger value="quality">
              <Sparkles className="mr-2 h-4 w-4" />
              质量评估
            </TabsTrigger>
            <TabsTrigger value="segments">
              <Music className="mr-2 h-4 w-4" />
              片段管理
            </TabsTrigger>
          </TabsList>

          {/* Preview & Edit Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Input Panel */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>生成设置</CardTitle>
                  <CardDescription>
                    输入文本并生成音频
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>输入文本</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      placeholder="输入要生成的文本..."
                    />
                  </div>

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

                  <div className="space-y-2">
                    <Label>情感</Label>
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
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !text}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        生成音频
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Waveform Display */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>波形预览</CardTitle>
                      <CardDescription>
                        点击波形可跳转播放位置，拖动可创建编辑区域
                      </CardDescription>
                    </div>
                    {currentSegment && (
                      <Badge variant="outline">
                        {currentSegment.duration.toFixed(1)}s
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {currentSegment ? (
                    <AudioWaveform
                      audioUrl={currentSegment.audio_url}
                      regions={regions}
                      onRegionSelect={handleRegionSelect}
                      onRegionDelete={handleRegionDelete}
                      editable={true}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>生成音频以查看波形</p>
                    </div>
                  )}

                  {/* Region Actions */}
                  {currentSegment && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddRegion}
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        添加编辑区域
                      </Button>
                      {selectedRegion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegionDelete(selectedRegion.id)}
                        >
                          删除选中区域
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audio Effects Tab */}
          <TabsContent value="effects" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>音频参数调整</CardTitle>
                  <CardDescription>
                    调整音量、速度、音调等参数
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>音量</Label>
                      <span className="text-sm text-muted-foreground">{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={150}
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
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
                      min={50}
                      max={150}
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
                      min={50}
                      max={150}
                      value={pitch}
                      onChange={(e) => setPitch(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={handleEnhance}
                    disabled={!currentSegment || loading}
                    className="w-full"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    应用并增强
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>背景音乐</CardTitle>
                  <CardDescription>
                    添加背景音乐并调整音量
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>音乐文件</Label>
                    <div className="flex gap-2">
                      <Input
                        value={backgroundMusic}
                        onChange={(e) => setBackgroundMusic(e.target.value)}
                        placeholder="/static/music/background.mp3"
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>音乐音量</Label>
                      <span className="text-sm text-muted-foreground">{musicVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">提示</span>
                    </div>
                    <p className="text-muted-foreground">
                      添加背景音乐时，会自动启用"闪避"功能，
                      在语音播放时降低音乐音量。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quality Assessment Tab */}
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>质量评估</CardTitle>
                    <CardDescription>
                      AI 评估音频质量并提供改进建议
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAssessQuality}
                    disabled={!currentSegment || loading}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    开始评估
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {qualityMetrics ? (
                  <div className="space-y-4">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">
                          {qualityMetrics.mos_score.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">MOS 评分</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          / 5.0
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(qualityMetrics.speaker_similarity * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-muted-foreground">说话人相似度</div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(qualityMetrics.emotion_accuracy * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-muted-foreground">情感准确性</div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {qualityMetrics.snr_db.toFixed(1)} dB
                        </div>
                        <div className="text-sm text-muted-foreground">信噪比</div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {qualityMetrics.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">改进建议</h4>
                        <div className="space-y-2">
                          {qualityMetrics.recommendations.map((rec, i) => (
                            <div
                              key={i}
                              className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm"
                            >
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>点击"开始评估"按钮进行质量分析</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segments Management Tab */}
          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>音频片段</CardTitle>
                <CardDescription>
                  管理生成的音频片段
                </CardDescription>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无音频片段</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {segments.map((segment, index) => (
                      <div
                        key={segment.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                          index === currentSegmentIndex
                            ? "bg-primary/10 border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                        onClick={() => setCurrentSegmentIndex(index)}
                      >
                        <audio
                          controls
                          src={segment.audio_url}
                          className="h-8 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Badge variant="outline">{segment.emotion}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {segment.duration.toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
