/**
 * Settings Page
 * System configuration and management
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RefreshCw, CheckCircle2, XCircle, Activity } from "lucide-react";
import { authFetch } from "@/utils/auth";

interface SystemStatus {
  status: string;
  version: string;
  timestamp: string;
  services: {
    tts: string;
    llm: string;
    database: string;
  };
  resources: {
    cpu_usage: number;
    memory_usage: number;
    memory_total_gb: number;
    memory_used_gb: number;
    disk_usage: number;
    disk_total_gb: number;
    disk_used_gb: number;
  };
}

interface SystemConfig {
  tts: {
    mode: string;
    url: string;
    timeout: number;
    parallel_workers: number;
    language: string;
  };
  llm: {
    base_url: string;
    api_key: string;
    model_name: string;
  };
  prompts: {
    script_generation: string;
    script_review: string;
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [defaultPrompts, setDefaultPrompts] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
    fetchStatus();
    fetchDefaultPrompts();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await authFetch("/api/config");
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await authFetch("/api/config/system/status");
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  };

  const fetchDefaultPrompts = async () => {
    try {
      const response = await authFetch("/api/config/prompts/default");
      const data = await response.json();
      if (data.success) {
        setDefaultPrompts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch default prompts:", error);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await authFetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "保存成功",
          description: "配置已更新",
        });
      } else {
        throw new Error(data.error?.message || "保存失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    setConfig((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value,
      },
    }));
  };

  const getServiceStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case "connected":
        return "text-green-600";
      case "disconnected":
        return "text-red-600";
      case "not_configured":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getServiceStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4" />;
      case "disconnected":
        return <XCircle className="h-4 w-4" />;
      case "not_configured":
        return <Activity className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading && !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold">系统设置</h1>
              <p className="text-sm text-muted-foreground">配置系统参数和服务</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="general">通用</TabsTrigger>
            <TabsTrigger value="tts">TTS</TabsTrigger>
            <TabsTrigger value="llm">LLM</TabsTrigger>
            <TabsTrigger value="status">状态</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>提示词配置</CardTitle>
                <CardDescription>
                  配置脚本生成和审查的AI提示词
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="script-prompt">脚本生成提示词</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (defaultPrompts?.script_generation) {
                          updateConfig("prompts", "script_generation", defaultPrompts.script_generation);
                        }
                      }}
                    >
                      重置为默认
                    </Button>
                  </div>
                  <Textarea
                    id="script-prompt"
                    value={config?.prompts?.script_generation || ""}
                    onChange={(e) => updateConfig("prompts", "script_generation", e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="review-prompt">脚本审查提示词</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (defaultPrompts?.script_review) {
                          updateConfig("prompts", "script_review", defaultPrompts.script_review);
                        }
                      }}
                    >
                      重置为默认
                    </Button>
                  </div>
                  <Textarea
                    id="review-prompt"
                    value={config?.prompts?.script_review || ""}
                    onChange={(e) => updateConfig("prompts", "script_review", e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveConfig} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "保存中..." : "保存配置"}
              </Button>
            </div>
          </TabsContent>

          {/* TTS Settings */}
          <TabsContent value="tts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>语音合成配置</CardTitle>
                <CardDescription>配置TTS引擎参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>TTS模式</Label>
                    <Select
                      value={config?.tts?.mode || "local"}
                      onValueChange={(value) => updateConfig("tts", "mode", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">本地TTS</SelectItem>
                        <SelectItem value="api">API服务</SelectItem>
                        <SelectItem value="qwen">Qwen3-TTS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>TTS URL</Label>
                    <Input
                      value={config?.tts?.url || ""}
                      onChange={(e) => updateConfig("tts", "url", e.target.value)}
                      placeholder="http://localhost:5000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>超时时间 (秒)</Label>
                    <Input
                      type="number"
                      value={config?.tts?.timeout || 30}
                      onChange={(e) => updateConfig("tts", "timeout", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>并行工作数</Label>
                    <Input
                      type="number"
                      value={config?.tts?.parallel_workers || 2}
                      onChange={(e) => updateConfig("tts", "parallel_workers", parseInt(e.target.value))}
                      min={1}
                      max={10}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>默认语言</Label>
                    <Select
                      value={config?.tts?.language || "zh-CN"}
                      onValueChange={(value) => updateConfig("tts", "language", value)}
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

            <div className="flex justify-end">
              <Button onClick={handleSaveConfig} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "保存中..." : "保存配置"}
              </Button>
            </div>
          </TabsContent>

          {/* LLM Settings */}
          <TabsContent value="llm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>大语言模型配置</CardTitle>
                <CardDescription>配置LLM服务用于脚本生成和RAG问答</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>API地址</Label>
                    <Input
                      value={config?.llm?.base_url || ""}
                      onChange={(e) => updateConfig("llm", "base_url", e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>API密钥</Label>
                    <Input
                      type="password"
                      value={config?.llm?.api_key || ""}
                      onChange={(e) => updateConfig("llm", "api_key", e.target.value)}
                      placeholder="sk-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>模型名称</Label>
                    <Input
                      value={config?.llm?.model_name || ""}
                      onChange={(e) => updateConfig("llm", "model_name", e.target.value)}
                      placeholder="gpt-4"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    配置LLM后，将启用以下功能：
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• 智能脚本生成</li>
                    <li>• 脚本审查和修复</li>
                    <li>• RAG问答答案生成</li>
                    <li>• 语音风格推荐</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveConfig} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "保存中..." : "保存配置"}
              </Button>
            </div>
          </TabsContent>

          {/* System Status */}
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>系统状态</CardTitle>
                    <CardDescription>服务运行状况和资源使用</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchStatus}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Status */}
                {status && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium mb-3">服务状态</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={getServiceStatusColor(status.services.tts)}>
                              {getServiceStatusIcon(status.services.tts)}
                            </span>
                            <span>TTS服务</span>
                          </div>
                          <Badge variant={status.services.tts === "connected" ? "default" : "secondary"}>
                            {status.services.tts}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={getServiceStatusColor(status.services.llm)}>
                              {getServiceStatusIcon(status.services.llm)}
                            </span>
                            <span>LLM服务</span>
                          </div>
                          <Badge variant={status.services.llm === "connected" ? "default" : "secondary"}>
                            {status.services.llm}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={getServiceStatusColor(status.services.database)}>
                              {getServiceStatusIcon(status.services.database)}
                            </span>
                            <span>数据库</span>
                          </div>
                          <Badge variant={status.services.database === "connected" ? "default" : "secondary"}>
                            {status.services.database}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Resource Usage */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">资源使用</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">CPU使用率</p>
                          <p className="text-xl font-bold">{status.resources.cpu_usage}%</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">内存使用率</p>
                          <p className="text-xl font-bold">{status.resources.memory_usage}%</p>
                          <p className="text-xs text-muted-foreground">
                            {status.resources.memory_used_gb.toFixed(1)} / {status.resources.memory_total_gb.toFixed(1)} GB
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">磁盘使用率</p>
                          <p className="text-xl font-bold">{status.resources.disk_usage}%</p>
                          <p className="text-xs text-muted-foreground">
                            {status.resources.disk_used_gb.toFixed(1)} / {status.resources.disk_total_gb.toFixed(1)} GB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* System Info */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">系统信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">状态</span>
                          <Badge variant={status.status === "healthy" ? "default" : "destructive"}>
                            {status.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">版本</span>
                          <span>{status.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">更新时间</span>
                          <span>{new Date(status.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
