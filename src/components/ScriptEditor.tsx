/**
 * Script Editor Component
 * View and edit the generated script for audiobook production
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProjectStore, type ScriptEntry } from "@/stores/projectStore";
import { Save, RefreshCw, Edit2, Check, X, User, Mic, Sparkles, AlertTriangle, CheckCircle2, Plus, Smile } from "lucide-react";
import { scriptsApi } from "@/services/scripts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScriptLibrary } from "@/components/ScriptLibrary";

export function ScriptEditor() {
  const { toast } = useToast();
  const { script, fetchScript, updateScript, isGenerating } = useProjectStore();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ScriptEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResults, setReviewResults] = useState<{
    fixed_count: number;
    issues: string[];
  } | null>(null);
  const [insertDialogOpen, setInsertDialogOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!script) {
      fetchScript();
    }
  }, []);

  // Get unique speakers
  const speakers = script
    ? Array.from(new Set(script.map((entry) => entry.speaker)))
    : [];

  // Get speaker color
  const getSpeakerColor = (speaker: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-pink-100 text-pink-800 border-pink-200",
    ];
    const index = speakers.indexOf(speaker);
    return colors[index % colors.length];
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...script![index] });
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm || editingIndex === null || !script) return;

    setSaving(true);
    try {
      const updatedScript = [...script];
      updatedScript[editingIndex] = editForm;
      await updateScript(updatedScript);
      toast({
        title: "保存成功",
        description: "脚本已更新",
      });
      setEditingIndex(null);
      setEditForm(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message || "无法保存脚本",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchScript();
      toast({
        title: "刷新成功",
        description: "脚本已更新",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "刷新失败",
        description: error.message || "无法刷新脚本",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleReview = async () => {
    setReviewing(true);
    setReviewResults(null);
    try {
      const response = await scriptsApi.review(useProjectStore.getState().currentProject!.id, {
        auto_fix: true,
        check_rules: {
          speaker_consistency: true,
          text_continuity: true,
          emotion_accuracy: true,
        },
      });

      if (response.success && response.data) {
        // Refresh script to get the updated version
        await fetchScript();

        // Parse review results if available
        const data = response.data as any;
        if (data.fixed_count !== undefined || data.issues) {
          setReviewResults({
            fixed_count: data.fixed_count || 0,
            issues: data.issues || [],
          });
        }

        toast({
          title: "审核完成",
          description: data.fixed_count !== undefined
            ? `已修复 ${data.fixed_count} 个问题`
            : "脚本已审核并修复",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "审核失败",
        description: error.message || "无法审核脚本",
      });
    } finally {
      setReviewing(false);
    }
  };

  // Non-verbal sounds data
  const nonVerbalSounds = [
    { sound: "Ahh!", emotion: "惊讶", instruct: "轻微的惊讶吸气声" },
    { sound: "Mmm...", emotion: "思考", instruct: "思考时的低吟声" },
    { sound: "Haha!", emotion: "开心", instruct: "轻快的笑声" },
    { sound: "Ohh!", emotion: "恍然", instruct: "恍然大悟的声音" },
    { sound: "Sigh...", emotion: "无奈", instruct: "无奈的叹息" },
    { sound: "Hmm?", emotion: "疑问", instruct: "疑惑的声音" },
    { sound: "Ugh...", emotion: "厌恶", instruct: "厌恶或不满的声音" },
    { sound: "Aww...", emotion: "怜惜", instruct: "怜惜或可爱的声音" },
    { sound: "Whoa!", emotion: "惊叹", instruct: "惊叹声" },
    { sound: "Phew!", emotion: "放松", instruct: "如释重负的声音" },
    { sound: "Hey!", emotion: "呼唤", instruct: "呼唤或引起注意" },
    { sound: "Oops!", emotion: "尴尬", instruct: "小错误的尴尬声" },
  ];

  const handleInsertNonVerbal = (sound: string, emotion: string, instruct: string, afterIndex: number) => {
    if (!script) return;

    const newEntry: ScriptEntry = {
      index: afterIndex + 1,
      speaker: speakers[0] || "旁白", // Use first speaker or default to narrator
      text: sound,
      emotion,
      instruct: `非语言声音: ${instruct}`,
    };

    // Update indices for all entries after the insert point
    const updatedScript = script.map((entry) => {
      if (entry.index > afterIndex) {
        return { ...entry, index: entry.index + 1 };
      }
      return entry;
    });

    // Insert the new entry
    updatedScript.splice(afterIndex + 1, 0, newEntry);

    updateScript(updatedScript);
    setInsertDialogOpen(false);
    toast({
      title: "已插入",
      description: `已插入非语言声音: ${sound}`,
    });
  };

  const handleAddNonVerbalDialog = (afterIndex: number) => {
    setInsertAtIndex(afterIndex);
    setInsertDialogOpen(true);
  };

  if (!script) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">加载脚本中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (script.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Mic className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">没有脚本内容</h3>
            <p className="text-sm text-muted-foreground">
              脚本尚未生成，请先返回生成脚本
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">脚本编辑器</h3>
          <p className="text-sm text-muted-foreground">
            {script.length} 个片段 · {speakers.length} 个角色
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={insertDialogOpen} onOpenChange={setInsertDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Smile className="mr-2 h-4 w-4" />
                添加非语言声音
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>插入非语言声音</DialogTitle>
                <DialogDescription>
                  选择一个非语言声音插入到脚本中，使有声书更加自然生动
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {nonVerbalSounds.map((item) => (
                  <Button
                    key={item.sound}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => handleInsertNonVerbal(item.sound, item.emotion, item.instruct, (script?.length || 1) - 1)}
                  >
                    <span className="text-lg font-bold">{item.sound}</span>
                    <span className="text-xs text-muted-foreground">{item.emotion}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReview}
            disabled={reviewing || isGenerating}
          >
            <Sparkles className={`mr-2 h-4 w-4 ${reviewing ? "animate-pulse" : ""}`} />
            AI审核
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* Script Library */}
      <ScriptLibrary
        currentScript={script}
        currentSpeakers={speakers}
        onApplyTemplate={(template) => {
          // Apply template settings
          toast({
            title: "模板已应用",
            description: `已应用模板 "${template.name}"`,
          });
          // Template application logic would go here
        }}
      />

      {/* Review Results */}
      {reviewResults && (
        <Card className={`border-2 ${reviewResults.fixed_count > 0 ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"}`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {reviewResults.fixed_count > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {reviewResults.fixed_count > 0
                    ? `审核完成：已修复 ${reviewResults.fixed_count} 个问题`
                    : "审核完成：未发现问题"}
                </p>
                {reviewResults.issues.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {reviewResults.issues.map((issue, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewResults(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speakers Legend */}
      {speakers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {speakers.map((speaker) => (
            <Badge key={speaker} variant="outline" className={getSpeakerColor(speaker)}>
              <User className="mr-1 h-3 w-3" />
              {speaker}
            </Badge>
          ))}
        </div>
      )}

      {/* Script Entries */}
      <div className="space-y-3">
        {script.map((entry, index) => {
          const isEditing = editingIndex === index;

          return (
            <Card key={index} className={isEditing ? "ring-2 ring-primary" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{entry.index + 1}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Speaker */}
                    <div className="flex items-center gap-2">
                      <Badge className={getSpeakerColor(entry.speaker)}>
                        <User className="mr-1 h-3 w-3" />
                        {entry.speaker}
                      </Badge>
                      {entry.emotion && (
                        <Badge variant="secondary">{entry.emotion}</Badge>
                      )}
                      {entry.section && (
                        <Badge variant="outline">{entry.section}</Badge>
                      )}
                    </div>

                    {/* Text Content */}
                    {isEditing ? (
                      <Textarea
                        value={editForm?.text || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm!, text: e.target.value })
                        }
                        rows={3}
                        className="resize-none"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{entry.text}</p>
                    )}

                    {/* Instructions */}
                    {(entry.instruct || isEditing) && (
                      <div className="text-xs">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`instruct-${index}`}>语音指导</Label>
                              <Input
                                id={`instruct-${index}`}
                                value={editForm?.instruct || ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm!, instruct: e.target.value })
                                }
                                placeholder="例如：温柔的、激动的、缓慢的..."
                              />
                            </div>
                            <div>
                              <Label htmlFor={`emotion-${index}`}>情感</Label>
                              <Input
                                id={`emotion-${index}`}
                                value={editForm?.emotion || ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm!, emotion: e.target.value })
                                }
                                placeholder="例如：开心、悲伤、愤怒..."
                              />
                            </div>
                          </div>
                        ) : (
                          entry.instruct && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mic className="h-3 w-3" />
                              <span>{entry.instruct}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
