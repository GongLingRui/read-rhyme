/**
 * CosyVoice Page
 * CosyVoice 0.5B TTS and Voice Cloning
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Sparkles,
  Mic,
  Music,
  Languages,
  Zap,
  Upload,
  Play,
  Download,
  Volume2,
  Settings,
} from "lucide-react";
import { cosyVoiceApi, type CosyVoiceSpeaker, type CosyVoiceModel, type CosyVoiceStyleInstructions } from "@/services/cosyVoice";

export default function CosyVoice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"tts" | "clone" | "info">("tts");

  // TTS state
  const [text, setText] = useState("你好，我是CosyVoice 0.5B语音合成模型。");
  const [selectedSpeaker, setSelectedSpeaker] = useState("zh-cn-female-1");
  const [selectedModel, setSelectedModel] = useState("CosyVoice3-0.5B-2512");
  const [language, setLanguage] = useState("auto");
  const [speed, setSpeed] = useState([1.0]);
  const [temperature, setTemperature] = useState([0.7]);
  const [instruction, setInstruction] = useState("");

  // Voice clone state
  const [cloneText, setCloneText] = useState("请用克隆的声音说这句话。");
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);

  // Loading states
  const [generating, setGenerating] = useState(false);
  const [cloning, setCloning] = useState(false);

  // Data
  const [speakers, setSpeakers] = useState<CosyVoiceSpeaker[]>([]);
  const [models, setModels] = useState<CosyVoiceModel[]>([]);
  const [languages, setLanguages] = useState<Array<{ code: string; name: string; native: string }>>([]);
  const [instructions, setInstructions] = useState<CosyVoiceStyleInstructions | null>(null);

  // Generated audio
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [speakersRes, modelsRes, languagesRes, instructionsRes] = await Promise.all([
        cosyVoiceApi.getSpeakers(),
        cosyVoiceApi.getModels(),
        cosyVoiceApi.getLanguages(),
        cosyVoiceApi.getStyleInstructions(),
      ]);

      if (speakersRes.data) setSpeakers(speakersRes.data);
      if (modelsRes.data) setModels(modelsRes.data);
      if (languagesRes.data) setLanguages(languagesRes.data);
      if (instructionsRes.data) setInstructions(instructionsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "请输入文本",
        description: "请输入要合成的文本内容",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await cosyVoiceApi.generateSpeech({
        text,
        speaker: selectedSpeaker,
        model: selectedModel,
        language,
        speed: speed[0],
        temperature: temperature[0],
        instruction: instruction || undefined,
      });

      if (response.data) {
        setGeneratedAudio(response.data.audio_url);
        setAudioDuration(response.data.duration);
        toast({
          title: "生成成功",
          description: `音频时长: ${response.data.duration.toFixed(2)}秒`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message || "请检查CosyVoice服务是否正常运行",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClone = async () => {
    if (!cloneText.trim()) {
      toast({
        variant: "destructive",
        title: "请输入文本",
        description: "请输入要合成的文本内容",
      });
      return;
    }

    if (!referenceAudio) {
      toast({
        variant: "destructive",
        title: "请上传参考音频",
        description: "请上传一段语音样本用于克隆",
      });
      return;
    }

    setCloning(true);
    try {
      const response = await cosyVoiceApi.cloneVoice({
        text: cloneText,
        reference_audio: referenceAudio,
        model: selectedModel,
        language,
        speed: speed[0],
        instruction: instruction || undefined,
      });

      if (response.data) {
        setGeneratedAudio(response.data.audio_url);
        setAudioDuration(response.data.duration);
        toast({
          title: "语音克隆成功",
          description: `音频时长: ${response.data.duration.toFixed(2)}秒`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "克隆失败",
        description: error.message || "请检查CosyVoice服务是否正常运行",
      });
    } finally {
      setCloning(false);
    }
  };

  const getSelectedModelInfo = () => {
    return models.find(m => m.id === selectedModel);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CosyVoice 0.5B</h1>
                <p className="text-sm text-muted-foreground">
                  高性能语音合成与语音克隆
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Zap className="h-3 w-3 mr-1" />
              150ms 低延迟
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="tts">
              <Music className="mr-2 h-4 w-4" />
              语音合成
            </TabsTrigger>
            <TabsTrigger value="clone">
              <Mic className="mr-2 h-4 w-4" />
              语音克隆
            </TabsTrigger>
            <TabsTrigger value="info">
              <Settings className="mr-2 h-4 w-4" />
              模型信息
            </TabsTrigger>
          </TabsList>

          {/* TTS Tab */}
          <TabsContent value="tts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left panel - Controls */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>文本输入</CardTitle>
                    <CardDescription>输入要合成的文本内容</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="请输入要合成的文本..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="speaker">说话人</Label>
                        <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                          <SelectTrigger id="speaker">
                            <SelectValue placeholder="选择说话人" />
                          </SelectTrigger>
                          <SelectContent>
                            {speakers.map((speaker) => (
                              <SelectItem key={speaker.id} value={speaker.id}>
                                {speaker.name} ({speaker.language})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="language">语言</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger id="language">
                            <SelectValue placeholder="选择语言" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">自动检测</SelectItem>
                            {languages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name} ({lang.native})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>语速: {speed[0].toFixed(1)}x</Label>
                      <Slider
                        value={speed}
                        onValueChange={setSpeed}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>采样温度: {temperature[0].toFixed(1)}</Label>
                      <Slider
                        value={temperature}
                        onValueChange={setTemperature}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instruction">风格指令 (可选)</Label>
                      <input
                        id="instruction"
                        type="text"
                        placeholder="例如: happy, sad, angry, whispering..."
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                      />
                      {instructions && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {instructions.emotion.slice(0, 5).map((inst) => (
                            <Badge
                              key={inst}
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => setInstruction(inst)}
                            >
                              {inst}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="w-full"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {generating ? "生成中..." : "生成语音"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right panel - Output */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>生成结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedAudio ? (
                      <div className="space-y-4">
                        <audio controls src={generatedAudio} className="w-full" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>时长: {audioDuration.toFixed(2)}秒</span>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = generatedAudio;
                            a.download = `cosyvoice_${Date.now()}.wav`;
                            a.click();
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          下载音频
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>生成的音频将在这里显示</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Clone Tab */}
          <TabsContent value="clone" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>语音克隆</CardTitle>
                    <CardDescription>
                      上传参考音频，克隆任意声音
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="reference">参考音频</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            id="reference"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => setReferenceAudio(e.target.files?.[0] || null)}
                          />
                          <Button variant="outline" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              上传音频
                            </span>
                          </Button>
                        </label>
                        {referenceAudio && (
                          <span className="text-sm text-muted-foreground">
                            {referenceAudio.name}
                          </span>
                        )}
                      </div>
                      {referenceAudio && (
                        <audio
                          controls
                          src={URL.createObjectURL(referenceAudio)}
                          className="w-full mt-2"
                        />
                      )}
                    </div>

                    <Textarea
                      placeholder="请输入要合成的文本..."
                      value={cloneText}
                      onChange={(e) => setCloneText(e.target.value)}
                      rows={4}
                    />

                    <Button
                      onClick={handleClone}
                      disabled={cloning || !referenceAudio}
                      className="w-full"
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      {cloning ? "克隆中..." : "开始克隆"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Clone Output */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>克隆结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedAudio ? (
                      <div className="space-y-4">
                        <audio controls src={generatedAudio} className="w-full" />
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Mic className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>克隆的语音将在这里显示</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {models.map((model) => (
                <Card
                  key={model.id}
                  className={selectedModel === model.id ? "border-primary" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{model.id}</CardTitle>
                      {selectedModel === model.id && (
                        <Badge>当前使用</Badge>
                      )}
                    </div>
                    <CardDescription>{model.model_id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">支持功能</p>
                      <div className="flex flex-wrap gap-2">
                        {model.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">支持语言</p>
                      <p className="text-sm text-muted-foreground">
                        {model.languages.join(", ")}
                      </p>
                    </div>

                    {model.latency_ms && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>流式延迟: ~{model.latency_ms}ms</span>
                      </div>
                    )}

                    <Button
                      variant={selectedModel === model.id ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedModel(model.id)}
                    >
                      {selectedModel === model.id ? "已选择" : "选择此模型"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>下载链接</CardTitle>
                <CardDescription>
                  从以下平台下载CosyVoice 0.5B模型
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="https://huggingface.co/FunAudioLLM/CosyVoice2-0.5B"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      Hugging Face
                    </Button>
                  </a>
                  <a
                    href="https://modelscope.cn/models/iic/CosyVoice2-0.5B"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      ModelScope (魔搭)
                    </Button>
                  </a>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">安装说明</h4>
                  <pre className="text-sm bg-black text-green-400 p-3 rounded overflow-x-auto">
                    {`# 安装 CosyVoice
pip install cosyvoice

# 或从源码安装
git clone https://github.com/FunAudioLLM/CosyVoice.git
cd CosyVoice
pip install -r requirements.txt`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
