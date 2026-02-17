/**
 * Audio Tools Page
 * Audio quality checking and speech enhancement
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authFetch, authFetchUpload } from "@/utils/auth";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Wrench,
  Volume2,
  Music,
  Info,
} from "lucide-react";

interface QualityResult {
  filename: string;
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

interface EnhancementOptions {
  denoise: boolean;
  volume_normalize: boolean;
  add_compression: boolean;
  target_lufs: number;
}

export default function AudioTools() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("check");
  const [files, setFiles] = useState<File[]>([]);
  const [checking, setChecking] = useState(false);
  const [qualityResults, setQualityResults] = useState<QualityResult[]>([]);

  const [enhanceFiles, setEnhanceFiles] = useState<File[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedUrls, setEnhancedUrls] = useState<Record<string, string>>({});
  const [enhanceOptions, setEnhanceOptions] = useState<EnhancementOptions>({
    denoise: true,
    volume_normalize: true,
    add_compression: false,
    target_lufs: -16,
  });

  // Guidelines state
  const [guidelines, setGuidelines] = useState<any>(null);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    setLoadingGuidelines(true);
    try {
      const response = await authFetch("/api/audio-quality/guidelines");
      const data = await response.json();
      if (data.success) {
        setGuidelines(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch guidelines:", error);
    } finally {
      setLoadingGuidelines(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setQualityResults([]);
  };

  const handleEnhanceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setEnhanceFiles(selectedFiles);
    setEnhancedUrls({});
  };

  const handleCheckQuality = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "没有文件",
        description: "请先选择要检查的音频文件",
      });
      return;
    }

    setChecking(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await authFetchUpload("/api/audio-quality/check-batch", formData);

      const data = await response.json();
      if (data.success && data.data) {
        // Convert backend response to QualityResult format
        const results = data.data.individual || [];
        setQualityResults(results.map((r: any) => ({
          filename: r.filename || r.name || "unknown",
          overall_score: r.quality_score || r.overall_score || 70,
          duration: r.duration || 0,
          loudness: r.loudness || -20,
          dynamic_range: r.dynamic_range || 20,
          noise_floor: r.noise_floor || -60,
          format_compatible: r.format_compatible ?? true,
          has_clipping: r.has_clipping ?? false,
          issues: r.issues || [],
          recommendations: r.recommendations || [],
        })));
        toast({
          title: "检查完成",
          description: `已检查 ${results.length} 个文件`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "检查失败",
        description: error.message,
      });
    } finally {
      setChecking(false);
    }
  };

  const handleEnhance = async (file: File) => {
    setEnhancing(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      Object.entries(enhanceOptions).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const response = await authFetchUpload("/api/voice-styling/enhance-speech", formData);

      const data = await response.json();
      if (data.success && data.data) {
        setEnhancedUrls((prev) => ({
          ...prev,
          [file.name]: data.data.enhanced_audio_url,
        }));
        toast({
          title: "增强成功",
          description: `${file.name} 处理完成`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "增强失败",
        description: error.message,
      });
    } finally {
      setEnhancing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">音频工具</h1>
              <p className="text-sm text-muted-foreground">
                音频质量检查和语音增强
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="check">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              质量检查
            </TabsTrigger>
            <TabsTrigger value="enhance">
              <Wrench className="mr-2 h-4 w-4" />
              语音增强
            </TabsTrigger>
            <TabsTrigger value="guidelines">
              <Info className="mr-2 h-4 w-4" />
              录音指南
            </TabsTrigger>
          </TabsList>

          {/* Quality Check Tab */}
          <TabsContent value="check" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>音频质量检查</CardTitle>
                <CardDescription>
                  检查音频是否适合语音克隆和TTS处理
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        选择音频文件
                      </span>
                    </Button>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    已选择 {files.length} 个文件
                  </span>
                </div>

                <Button
                  onClick={handleCheckQuality}
                  disabled={files.length === 0 || checking}
                  className="w-full"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                  {checking ? "检查中..." : "开始检查"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {qualityResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">检查结果</h3>
                {qualityResults.map((result, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{result.filename}</CardTitle>
                        <Badge variant={getScoreBadge(result.overall_score)}>
                          {result.overall_score.toFixed(0)}分
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">时长</p>
                          <p className="font-medium">{result.duration.toFixed(1)}秒</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">响度</p>
                          <p className="font-medium">{result.loudness.toFixed(1)} dB</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">动态范围</p>
                          <p className="font-medium">{result.dynamic_range.toFixed(1)} dB</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">噪声底</p>
                          <p className="font-medium">{result.noise_floor.toFixed(1)} dB</p>
                        </div>
                      </div>

                      {result.issues.length > 0 && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                              <p className="font-medium text-destructive">发现问题</p>
                              <ul className="mt-2 space-y-1 text-sm">
                                {result.issues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {result.recommendations.length > 0 && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="font-medium">建议</p>
                              <ul className="mt-2 space-y-1 text-sm">
                                {result.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Enhancement Tab */}
          <TabsContent value="enhance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>语音增强</CardTitle>
                <CardDescription>
                  自动改善音频质量，降噪、标准化音量等
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="denoise"
                      checked={enhanceOptions.denoise}
                      onChange={(e) =>
                        setEnhanceOptions({ ...enhanceOptions, denoise: e.target.checked })
                      }
                    />
                    <Label htmlFor="denoise">降噪处理</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="normalize"
                      checked={enhanceOptions.volume_normalize}
                      onChange={(e) =>
                        setEnhanceOptions({ ...enhanceOptions, volume_normalize: e.target.checked })
                      }
                    />
                    <Label htmlFor="normalize">音量标准化</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="compress"
                      checked={enhanceOptions.add_compression}
                      onChange={(e) =>
                        setEnhanceOptions({ ...enhanceOptions, add_compression: e.target.checked })
                      }
                    />
                    <Label htmlFor="compress">添加压缩</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="lufs">目标响度:</Label>
                    <select
                      id="lufs"
                      value={enhanceOptions.target_lufs}
                      onChange={(e) =>
                        setEnhanceOptions({ ...enhanceOptions, target_lufs: parseFloat(e.target.value) })
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="-18">-18 LUFS (安静)</option>
                      <option value="-16">-16 LUFS (标准)</option>
                      <option value="-14">-14 LUFS (响亮)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      className="hidden"
                      onChange={handleEnhanceFileSelect}
                    />
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        选择音频文件
                      </span>
                    </Button>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    已选择 {enhanceFiles.length} 个文件
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Enhancement Results */}
            {enhanceFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>处理结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enhanceFiles.map((file) => {
                      const enhancedUrl = enhancedUrls[file.name];
                      return (
                        <div
                          key={file.name}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Music className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {enhancedUrl ? (
                              <>
                                <audio controls src={enhancedUrl} className="h-8 w-48" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const a = document.createElement("a");
                                    a.href = enhancedUrl;
                                    a.download = `enhanced_${file.name}`;
                                    a.click();
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleEnhance(file)}
                                disabled={enhancing}
                              >
                                <Wrench className="mr-2 h-4 w-4" />
                                {enhancing ? "处理中..." : "增强"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Guidelines Tab */}
          <TabsContent value="guidelines" className="space-y-4">
            {loadingGuidelines ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p>加载中...</p>
              </div>
            ) : guidelines ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>语音克隆录音指南</CardTitle>
                    <CardDescription>
                      获得最佳语音克隆效果的录音建议
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {guidelines.duration && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          时长要求
                        </h4>
                        <p className="text-sm text-muted-foreground">{guidelines.duration}</p>
                      </div>
                    )}

                    {guidelines.environment && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          录音环境
                        </h4>
                        <p className="text-sm text-muted-foreground">{guidelines.environment}</p>
                      </div>
                    )}

                    {guidelines.content && (
                      <div>
                        <h4 className="font-medium mb-2">内容建议</h4>
                        <p className="text-sm text-muted-foreground">{guidelines.content}</p>
                      </div>
                    )}

                    {guidelines.equipment && (
                      <div>
                        <h4 className="font-medium mb-2">设备推荐</h4>
                        <p className="text-sm text-muted-foreground">{guidelines.equipment}</p>
                      </div>
                    )}

                    {guidelines.technique && (
                      <div>
                        <h4 className="font-medium mb-2">录音技巧</h4>
                        <p className="text-sm text-muted-foreground">{guidelines.technique}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>技术规格</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">推荐格式</p>
                        <p className="font-medium">WAV</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">采样率</p>
                        <p className="font-medium">44.1kHz+</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">位深度</p>
                        <p className="font-medium">16-bit+</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">声道</p>
                        <p className="font-medium">单声道</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>常见问题</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• <strong>背景噪音</strong>: 在安静房间录音，使用降噪软件处理</p>
                    <p>• <strong>回声</strong>: 使用软装饰材料减少房间反射</p>
                    <p>• <strong>音量不一致</strong>: 保持与麦克风固定距离说话</p>
                    <p>• <strong>呼吸噪音</strong>: 使用防喷罩或稍微偏转麦克风角度</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>无法加载录音指南</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
