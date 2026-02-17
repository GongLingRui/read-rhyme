/**
 * Script Library Component
 * Save and load script configuration templates
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Download,
  Upload,
  Trash2,
  BookOpen,
  Plus,
  Search,
  FileText,
  Star,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ScriptTemplate {
  id: string;
  name: string;
  description?: string;
  speakers: string[];
  emotion_presets: string[];
  settings: {
    tts_mode?: string;
    language?: string;
    chunk_size?: number;
    detect_emotions?: boolean;
  };
  created_at: string;
  is_favorite?: boolean;
}

export function ScriptLibrary({
  currentScript,
  currentSpeakers,
  onApplyTemplate,
}: {
  currentScript?: any[];
  currentSpeakers?: string[];
  onApplyTemplate?: (template: ScriptTemplate) => void;
}) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem("scriptTemplates");
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load templates:", e);
      }
    }
  };

  const saveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入模板名称",
      });
      return;
    }

    const template: ScriptTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      description: newTemplateDesc,
      speakers: currentSpeakers || [],
      emotion_presets: [], // Would be populated from current script
      settings: {
        tts_mode: "edge",
        language: "zh-CN",
        chunk_size: 500,
        detect_emotions: true,
      },
      created_at: new Date().toISOString(),
      is_favorite: false,
    };

    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem("scriptTemplates", JSON.stringify(updatedTemplates));

    setSaveDialogOpen(false);
    setNewTemplateName("");
    setNewTemplateDesc("");

    toast({
      title: "已保存",
      description: `脚本模板 "${template.name}" 已保存`,
    });
  };

  const deleteTemplate = (id: string) => {
    if (!confirm("确定要删除这个模板吗？")) return;

    const updatedTemplates = templates.filter((t) => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem("scriptTemplates", JSON.stringify(updatedTemplates));

    toast({
      title: "已删除",
      description: "模板已删除",
    });
  };

  const toggleFavorite = (id: string) => {
    const updatedTemplates = templates.map((t) =>
      t.id === id ? { ...t, is_favorite: !t.is_favorite } : t
    );
    setTemplates(updatedTemplates);
    localStorage.setItem("scriptTemplates", JSON.stringify(updatedTemplates));
  };

  const applyTemplate = (template: ScriptTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
      toast({
        title: "已应用",
        description: `已应用模板 "${template.name}"`,
      });
    }
  };

  const exportTemplate = (template: ScriptTemplate) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script_template_${template.name}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "已导出",
      description: `模板 "${template.name}" 已导出`,
    });
  };

  const importTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const template: ScriptTemplate = {
          ...imported,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
        };

        const updatedTemplates = [...templates, template];
        setTemplates(updatedTemplates);
        localStorage.setItem("scriptTemplates", JSON.stringify(updatedTemplates));

        toast({
          title: "导入成功",
          description: `已导入模板 "${template.name}"`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "导入失败",
          description: "无效的模板文件",
        });
      }
    };
    reader.readAsText(file);
  };

  const duplicateTemplate = (template: ScriptTemplate) => {
    const duplicated: ScriptTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (副本)`,
      created_at: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, duplicated];
    setTemplates(updatedTemplates);
    localStorage.setItem("scriptTemplates", JSON.stringify(updatedTemplates));

    toast({
      title: "已复制",
      description: `已复制模板 "${template.name}"`,
    });
  };

  const filteredTemplates = searchQuery
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : templates;

  const favoriteTemplates = filteredTemplates.filter((t) => t.is_favorite);
  const regularTemplates = filteredTemplates.filter((t) => !t.is_favorite);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>脚本库</CardTitle>
            <Badge variant="outline">{templates.length} 个模板</Badge>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={importTemplate}
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  导入
                </span>
              </Button>
            </label>
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  保存当前
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>保存脚本模板</DialogTitle>
                  <DialogDescription>
                    保存当前脚本配置为模板，方便在其他项目中重复使用
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>模板名称 *</Label>
                    <Input
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="例如: 悬疑小说语音配置"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      rows={3}
                      placeholder="描述这个模板的用途和特点..."
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">将包含以下配置</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 说话人列表 ({currentSpeakers?.length || 0} 个)</li>
                      <li>• TTS模式: edge</li>
                      <li>• 语言: zh-CN</li>
                      <li>• 情感检测: 开启</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={saveTemplate}>保存</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          保存和管理脚本配置模板，在项目中快速复用
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[400px]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无模板</p>
              <p className="text-xs mt-2">保存当前脚本配置或导入已有模板</p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {/* Favorite Templates */}
              {favoriteTemplates.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    收藏
                  </p>
                  <div className="space-y-2">
                    {favoriteTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onApply={applyTemplate}
                        onDelete={deleteTemplate}
                        onExport={exportTemplate}
                        onFavorite={toggleFavorite}
                        onDuplicate={duplicateTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Templates */}
              {regularTemplates.length > 0 && (
                <div>
                  {favoriteTemplates.length > 0 && (
                    <p className="text-sm font-medium mb-2">全部模板</p>
                  )}
                  <div className="space-y-2">
                    {regularTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onApply={applyTemplate}
                        onDelete={deleteTemplate}
                        onExport={exportTemplate}
                        onFavorite={toggleFavorite}
                        onDuplicate={duplicateTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  template,
  onApply,
  onDelete,
  onExport,
  onFavorite,
  onDuplicate,
}: {
  template: ScriptTemplate;
  onApply: (template: ScriptTemplate) => void;
  onDelete: (id: string) => void;
  onExport: (template: ScriptTemplate) => void;
  onFavorite: (id: string) => void;
  onDuplicate: (template: ScriptTemplate) => void;
}) {
  return (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{template.name}</h4>
            {template.is_favorite && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {template.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {template.speakers.slice(0, 3).map((speaker) => (
              <Badge key={speaker} variant="secondary" className="text-xs">
                {speaker}
              </Badge>
            ))}
            {template.speakers.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.speakers.length - 3}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            创建于 {new Date(template.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onApply(template)}
            title="应用模板"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExport(template)}
            title="导出"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(template)}
            title="复制"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFavorite(template.id)}
            title={template.is_favorite ? "取消收藏" : "收藏"}
          >
            <Star className={`h-4 w-4 ${template.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template.id)}
            title="删除"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
}
