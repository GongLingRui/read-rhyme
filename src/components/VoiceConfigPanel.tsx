/**
 * Voice Configuration Panel
 * Configure voices for different speakers in the project
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { voicesApi } from "@/services";
import { Play, Plus, Save, Volume2, Mic, Upload, Wand2, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { VoiceConfig } from "@/types";
import { useProjectStore } from "@/stores/projectStore";

export function VoiceConfigPanel() {
  const { toast } = useToast();
  const { currentProject } = useProjectStore();
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [voiceConfigs, setVoiceConfigs] = useState<Record<string, VoiceConfig>>({});
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    voiceName: string;
    audioUrl: string;
  }>({ open: false, voiceName: "", audioUrl: "" });
  const [previewText, setPreviewText] = useState("你好，这是一个语音预览示例。");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Voice Consistency Check state
  const [consistencyResult, setConsistencyResult] = useState<{
    is_consistent: boolean;
    issues: Array<{
      speaker: string;
      issue_type: string;
      description: string;
      affected_entries: number;
    }>;
    speakers_summary: Record<string, number>;
  } | null>(null);
  const [checkingConsistency, setCheckingConsistency] = useState(false);
  const [fixingConsistency, setFixingConsistency] = useState(false);

  useEffect(() => {
    fetchVoices();
    // In real app, fetch speakers from script
    setSpeakers(["NARRATOR", "CHARACTER_1", "CHARACTER_2"]);
  }, []);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const response = await voicesApi.list();
      if (response.success && response.data) {
        setAvailableVoices([
          ...(response.data.custom || []),
          ...(response.data.lora || []),
        ]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error.message || "无法加载语音列表",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (speaker: string, field: keyof VoiceConfig, value: any) => {
    setVoiceConfigs((prev) => ({
      ...prev,
      [speaker]: {
        ...prev[speaker],
        speaker,
        [field]: value,
      },
    }));
  };

  const handlePreview = async (voiceName: string) => {
    setGeneratingPreview(true);
    try {
      const response = await voicesApi.preview({
        voice_name: voiceName,
        text: previewText,
        voice_type: "custom",
      });

      if (response.success && response.data) {
        setPreviewDialog({
          open: true,
          voiceName,
          audioUrl: response.data.audio_url,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "预览失败",
        description: error.message || "无法生成语音预览",
      });
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In real app, save to backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "保存成功",
        description: "语音配置已保存",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message || "无法保存配置",
      });
    } finally {
      setSaving(false);
    }
  };

  const getVoiceById = (voiceId: string) => {
    return availableVoices.find((v) => v.id === voiceId);
  };

  const handleCheckConsistency = async () => {
    if (!currentProject) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请先选择一个项目",
      });
      return;
    }

    setCheckingConsistency(true);
    try {
      const response = await voicesApi.checkConsistency(currentProject.id);
      if (response.success && response.data) {
        setConsistencyResult(response.data);
        toast({
          title: response.data.is_consistent ? "检查完成" : "发现问题",
          description: response.data.is_consistent
            ? "语音配置一致，没有发现问题"
            : `发现 ${response.data.issues.length} 个问题`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "检查失败",
        description: error.message || "无法检查语音一致性",
      });
    } finally {
      setCheckingConsistency(false);
    }
  };

  const handleAutoFix = async () => {
    if (!currentProject) return;

    setFixingConsistency(true);
    try {
      const response = await voicesApi.autoFixConsistency(currentProject.id);
      if (response.success && response.data) {
        toast({
          title: "自动修复完成",
          description: `修复了 ${response.data.fixed_count} 个问题`,
        });
        // Re-run consistency check
        handleCheckConsistency();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "修复失败",
        description: error.message || "无法自动修复问题",
      });
    } finally {
      setFixingConsistency(false);
    }
  };

  const handleGetSpeakerSuggestion = async (speaker: string) => {
    if (!currentProject) return;

    try {
      const response = await voicesApi.getSpeakerSuggestion(currentProject.id, speaker);
      if (response.success && response.data) {
        const { suggested_voice, suggested_config, reason } = response.data;

        // Apply the suggested configuration
        handleConfigChange(speaker, "voiceName", suggested_voice);
        if (suggested_config.style) {
          handleConfigChange(speaker, "style", suggested_config.style);
        }
        if (suggested_config.language) {
          handleConfigChange(speaker, "language", suggested_config.language);
        }

        toast({
          title: "已应用建议配置",
          description: reason,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "获取建议失败",
        description: error.message || "无法获取语音建议",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">语音配置</h3>
          <p className="text-sm text-muted-foreground">
            为每个角色配置对应的语音
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckConsistency}
            disabled={checkingConsistency || !currentProject}
          >
            <Shield className="mr-2 h-4 w-4" />
            {checkingConsistency ? "检查中..." : "一致性检查"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </div>

      {/* Voice Consistency Status */}
      {consistencyResult && (
        <Card className={consistencyResult.is_consistent ? "border-green-500" : "border-orange-500"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {consistencyResult.is_consistent ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                )}
                <CardTitle className="text-base">
                  {consistencyResult.is_consistent ? "语音配置一致" : "发现一致性问题"}
                </CardTitle>
              </div>
              {!consistencyResult.is_consistent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAutoFix}
                  disabled={fixingConsistency}
                >
                  {fixingConsistency ? "修复中..." : "自动修复"}
                </Button>
              )}
            </div>
            <CardDescription>
              {consistencyResult.is_consistent
                ? "所有角色都配置了语音，没有发现问题"
                : `发现 ${consistencyResult.issues.length} 个需要处理的问题`}
            </CardDescription>
          </CardHeader>
          {!consistencyResult.is_consistent && consistencyResult.issues.length > 0 && (
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">问题列表：</h4>
                {consistencyResult.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{issue.speaker}</Badge>
                        <Badge variant="secondary">{issue.issue_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {issue.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        影响 {issue.affected_entries} 个条目
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGetSpeakerSuggestion(issue.speaker)}
                    >
                      获取建议
                    </Button>
                  </div>
                ))}
              </div>

              {/* Speakers Summary */}
              {consistencyResult.speakers_summary && Object.keys(consistencyResult.speakers_summary).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">角色统计：</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(consistencyResult.speakers_summary).map(([speaker, count]) => (
                      <Badge key={speaker} variant="outline">
                        {speaker}: {count} 条
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Preview Text Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">预览文本</CardTitle>
          <CardDescription>
            输入预览文本以测试不同语音的效果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="输入预览文本..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Configurations */}
      <div className="space-y-4">
        {speakers.map((speaker) => {
          const config = voiceConfigs[speaker] || {
            speaker,
            voiceType: "custom" as const,
            voiceName: "",
            style: "",
            language: "zh-CN",
          };

          return (
            <Card key={speaker}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{speaker}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {config.voiceType === "custom" && "预设语音"}
                    {config.voiceType === "clone" && "克隆语音"}
                    {config.voiceType === "lora" && "LoRA模型"}
                    {config.voiceType === "design" && "自定义语音"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Voice Type */}
                  <div className="space-y-2">
                    <Label>语音类型</Label>
                    <Select
                      value={config.voiceType}
                      onValueChange={(value: any) =>
                        handleConfigChange(speaker, "voiceType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">预设语音</SelectItem>
                        <SelectItem value="clone">声音克隆</SelectItem>
                        <SelectItem value="lora">LoRA模型</SelectItem>
                        <SelectItem value="design">自定义设计</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Name (for custom/lora) */}
                  {(config.voiceType === "custom" || config.voiceType === "lora") && (
                    <div className="space-y-2">
                      <Label>选择语音</Label>
                      <div className="flex gap-2">
                        <Select
                          value={config.voiceName}
                          onValueChange={(value) =>
                            handleConfigChange(speaker, "voiceName", value)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="选择语音" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVoices
                              .filter(
                                (v) =>
                                  config.voiceType === "custom"
                                    ? !v.id.startsWith("builtin_")
                                    : v.id.startsWith("builtin_")
                              )
                              .map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                  {voice.name} ({voice.gender}, {voice.language})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {config.voiceName && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handlePreview(config.voiceName!)}
                            disabled={generatingPreview}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reference Audio (for clone) */}
                  {config.voiceType === "clone" && (
                    <div className="space-y-2">
                      <Label>参考音频</Label>
                      <div className="flex gap-2">
                        <Input
                          value={config.refAudioPath || ""}
                          onChange={(e) =>
                            handleConfigChange(speaker, "refAudioPath", e.target.value)
                          }
                          placeholder="上传或输入音频路径"
                          className="flex-1"
                        />
                        <Button size="icon" variant="outline">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Style Instructions */}
                  <div className="space-y-2">
                    <Label>语音风格</Label>
                    <Input
                      value={config.style || ""}
                      onChange={(e) =>
                        handleConfigChange(speaker, "style", e.target.value)
                      }
                      placeholder="例如：温柔、激昂、缓慢..."
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label>语言</Label>
                    <Select
                      value={config.language || "zh-CN"}
                      onValueChange={(value) =>
                        handleConfigChange(speaker, "language", value)
                      }
                    >
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
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Voice Design Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Wand2 className="mr-2 h-4 w-4" />
            设计自定义语音
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设计自定义语音</DialogTitle>
            <DialogDescription>
              通过描述来创建独特的语音风格
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>语音描述</Label>
              <Input placeholder="例如：一个温柔的中年女性声音，语速适中，带有南方口音..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">取消</Button>
            <Button>生成语音</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Audio Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ ...previewDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>语音预览</DialogTitle>
            <DialogDescription>
              {previewDialog.voiceName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {previewDialog.audioUrl && (
              <audio controls className="w-full" src={previewDialog.audioUrl} autoPlay>
                您的浏览器不支持音频播放
              </audio>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDialog({ ...previewDialog, open: false })}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
