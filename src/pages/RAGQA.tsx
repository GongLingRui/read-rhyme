/**
 * RAG Q&A Page
 * Document-based question answering with AI
 */

import { useState, useEffect } from "react";
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
import { ragApi } from "@/services";
import { authFetchUpload } from "@/utils/auth";
import {
  Send,
  Upload,
  FileText,
  Search,
  BookOpen,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Globe,
  Eye,
  Download,
  Link,
  X,
  FileJson,
} from "lucide-react";

interface DocumentChunk {
  chunk_id: string;
  content: string;
  doc_id: string;
  metadata?: any;
}

interface Citation {
  chunk_id: string;
  content: string;
  doc_id: string;
  score: number;
  metadata?: any;
  display_name?: string;  // Human-readable source name
}

interface WebResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

interface QueryResponse {
  question: string;
  context: string[];
  citations: Citation[];
  web_results: WebResult[];
  answer?: string;
  num_chunks: number;
  num_web_results: number;
}

interface RAGDocument {
  doc_id: string;
  chunk_count: number;
  metadata?: any;
}

interface RAGStats {
  total_chunks: number;
  total_documents: number;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  web_search_enabled: boolean;
}

export default function RAGQA() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("query");
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Query state
  const [question, setQuestion] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [generateAnswer, setGenerateAnswer] = useState(true);
  const [queryHistory, setQueryHistory] = useState<QueryResponse[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);

  // Ingest state
  const [ingestDialog, setIngestDialog] = useState(false);
  const [ingestText, setIngestText] = useState("");
  const [ingestDocId, setIngestDocId] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestUrl, setIngestUrl] = useState("");

  // Document preview state
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<RAGDocument | null>(null);
  const [previewChunks, setPreviewChunks] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await ragApi.listDocuments();
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch documents:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ragApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) {
      toast({
        variant: "destructive",
        title: "请输入问题",
        description: "问题不能为空",
      });
      return;
    }

    setQueryLoading(true);
    try {
      const response = await ragApi.query({
        question,
        use_web_search: useWebSearch,
        generate_answer: generateAnswer,
      });

      if (response.success && response.data) {
        setQueryHistory((prev) => [response.data!, ...prev]);
        setQuestion("");
        toast({
          title: "查询成功",
          description: `找到 ${response.data!.num_chunks} 个相关片段`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "查询失败",
        description: error.message || "无法处理查询",
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestText.trim() || !ingestDocId.trim()) {
      toast({
        variant: "destructive",
        title: "请填写完整",
        description: "文档ID和内容不能为空",
      });
      return;
    }

    setIngesting(true);
    try {
      const response = await ragApi.ingestDocument({
        text: ingestText,
        doc_id: ingestDocId,
      });

      if (response.success && response.data) {
        toast({
          title: "摄入成功",
          description: `已创建 ${response.data!.chunk_count} 个片段`,
        });
        setIngestDialog(false);
        setIngestText("");
        setIngestDocId("");
        fetchDocuments();
        fetchStats();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "摄入失败",
        description: error.message || "无法摄入文档",
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetchUpload("/api/rag/ingest-file", formData);

      const data = await response.json();

      if (data.success) {
        toast({
          title: "上传成功",
          description: `已创建 ${data.data.chunk_count} 个片段`,
        });
        fetchDocuments();
        fetchStats();
      } else {
        throw new Error(data.error?.message || "上传失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "上传失败",
        description: error.message,
      });
    } finally {
      setUploading(false);
      if (fileInputRef[0]) {
        fileInputRef[0].value = "";
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm(`确定要删除文档 ${docId} 吗？`)) return;

    try {
      await ragApi.deleteDocument({ doc_id: docId });
      toast({
        title: "删除成功",
        description: `文档 ${docId} 已删除`,
      });
      fetchDocuments();
      fetchStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error.message,
      });
    }
  };

  const handlePreviewDocument = async (doc: RAGDocument) => {
    setPreviewDoc(doc);
    setPreviewDialog(true);
    setLoadingChunks(true);

    try {
      // Query the document to get its chunks
      const response = await ragApi.query({
        question: "总结这个文档的内容",
        use_web_search: false,
        generate_answer: false,
        top_k: 100, // Get more chunks for preview
      });

      if (response.success && response.data) {
        // Filter citations for this document
        const docChunks = response.data.citations
          .filter((c) => c.doc_id === doc.doc_id)
          .map((c) => ({
            chunk_id: c.chunk_id,
            content: c.content,
            doc_id: c.doc_id,
            metadata: c.metadata,
          }));
        setPreviewChunks(docChunks);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error.message,
      });
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleUrlImport = async () => {
    if (!ingestUrl.trim() || !ingestDocId.trim()) {
      toast({
        variant: "destructive",
        title: "请填写完整",
        description: "URL和文档ID不能为空",
      });
      return;
    }

    setIngesting(true);
    try {
      // Fetch content from URL
      const response = await fetch(ingestUrl);
      if (!response.ok) throw new Error("无法获取URL内容");

      const text = await response.text();

      // Ingest the fetched content
      const ingestResponse = await ragApi.ingestDocument({
        text,
        doc_id: ingestDocId,
        metadata: { source: ingestUrl, type: "url" },
      });

      if (ingestResponse.success && ingestResponse.data) {
        toast({
          title: "导入成功",
          description: `已从URL创建 ${ingestResponse.data.chunk_count} 个片段`,
        });
        setIngestDialog(false);
        setIngestUrl("");
        setIngestDocId("");
        fetchDocuments();
        fetchStats();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "导入失败",
        description: error.message || "无法从URL导入内容",
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleExportDocuments = () => {
    const exportData = {
      documents,
      stats,
      export_date: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rag_documents_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "导出成功",
      description: "文档列表已导出",
    });
  };

  const handleImportDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (data.documents && Array.isArray(data.documents)) {
          toast({
            title: "导入成功",
            description: `找到 ${data.documents.length} 个文档记录`,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "导入失败",
          description: "文件格式错误",
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.doc_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI 知识问答</h1>
              <p className="text-sm text-muted-foreground">
                基于文档的智能问答系统，支持RAG检索和Web搜索
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="query">
              <Search className="mr-2 h-4 w-4" />
              问答
            </TabsTrigger>
            <TabsTrigger value="documents">
              <BookOpen className="mr-2 h-4 w-4" />
              文档
            </TabsTrigger>
            <TabsTrigger value="settings">
              <FileText className="mr-2 h-4 w-4" />
              设置
            </TabsTrigger>
          </TabsList>

          {/* Query Tab */}
          <TabsContent value="query" className="space-y-4">
            {/* Query Input */}
            <Card>
              <CardHeader>
                <CardTitle>提问</CardTitle>
                <CardDescription>
                  基于已上传的文档提问，AI会检索相关内容并给出答案
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="输入你的问题..."
                      onKeyDown={(e) => e.key === "Enter" && !queryLoading && handleQuery()}
                      disabled={queryLoading}
                    />
                    <Button onClick={handleQuery} disabled={queryLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="web-search"
                        checked={useWebSearch}
                        onChange={(e) => setUseWebSearch(e.target.checked)}
                      />
                      <Label htmlFor="web-search" className="flex items-center gap-1 cursor-pointer">
                        <Globe className="h-4 w-4" />
                        启用Web搜索
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="generate-answer"
                        checked={generateAnswer}
                        onChange={(e) => setGenerateAnswer(e.target.checked)}
                      />
                      <Label htmlFor="generate-answer" className="cursor-pointer">
                        生成AI答案
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Query Results */}
            {queryHistory.length > 0 && (
              <div className="space-y-4">
                {queryHistory.map((result, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-lg">{result.question}</CardTitle>
                      <CardDescription>
                        {result.num_chunks} 个相关片段
                        {result.num_web_results > 0 && ` · ${result.num_web_results} 个Web结果`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* AI Answer */}
                      {result.answer && (
                        <div className="p-4 bg-primary/5 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">AI 答案</h4>
                          <p
                            className="text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: result.answer.replace(
                                /\[Source (\d+)\]/g,
                                '<sup class="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs font-medium">[Source $1]</sup>'
                              ),
                            }}
                          />
                        </div>
                      )}

                      {/* Citations */}
                      {result.citations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">参考来源</h4>
                          <div className="space-y-2">
                            {result.citations.map((citation, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-3 bg-muted rounded-lg text-sm"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline">
                                    [Source {cIdx + 1}] {citation.display_name || citation.doc_id}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      相关度: {(citation.score * 100).toFixed(0)}%
                                    </span>
                                    {citation.metadata?.chunk_index !== undefined && (
                                      <span className="text-xs text-muted-foreground">
                                        片段 {citation.metadata.chunk_index + 1}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="line-clamp-2">{citation.content}</p>
                                {citation.metadata?.filename && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    文件: {citation.metadata.filename}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Web Results */}
                      {result.web_results.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">网络搜索结果</h4>
                          <div className="space-y-2">
                            {result.web_results.map((web, wIdx) => (
                              <div
                                key={wIdx}
                                className="p-3 bg-muted rounded-lg"
                              >
                                <a
                                  href={web.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-primary hover:underline"
                                >
                                  {web.title}
                                </a>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {web.snippet}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {queryHistory.length === 0 && !queryLoading && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>开始提问，AI会基于你的文档给出答案</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <Dialog open={ingestDialog} onOpenChange={setIngestDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      添加文档
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>添加文档</DialogTitle>
                      <DialogDescription>
                        将内容添加到知识库，支持问答检索
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="text" className="py-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text">文本</TabsTrigger>
                        <TabsTrigger value="url">URL导入</TabsTrigger>
                      </TabsList>
                      <TabsContent value="text" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="doc-id">文档ID *</Label>
                          <Input
                            id="doc-id"
                            value={ingestDocId}
                            onChange={(e) => setIngestDocId(e.target.value)}
                            placeholder="例如: my-book-001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doc-content">文档内容 *</Label>
                          <Textarea
                            id="doc-content"
                            value={ingestText}
                            onChange={(e) => setIngestText(e.target.value)}
                            placeholder="粘贴文档内容..."
                            rows={10}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIngestDialog(false)}>
                            取消
                          </Button>
                          <Button onClick={handleIngest} disabled={ingesting}>
                            {ingesting ? "添加中..." : "添加"}
                          </Button>
                        </DialogFooter>
                      </TabsContent>
                      <TabsContent value="url" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="import-url">URL地址 *</Label>
                          <Input
                            id="import-url"
                            value={ingestUrl}
                            onChange={(e) => setIngestUrl(e.target.value)}
                            placeholder="https://example.com/document.txt"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="import-doc-id">文档ID *</Label>
                          <Input
                            id="import-doc-id"
                            value={ingestDocId}
                            onChange={(e) => setIngestDocId(e.target.value)}
                            placeholder="例如: web-doc-001"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          从URL获取文本内容并添加到知识库。支持纯文本URL。
                        </p>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIngestDialog(false)}>
                            取消
                          </Button>
                          <Button onClick={handleUrlImport} disabled={ingesting}>
                            {ingesting ? "导入中..." : "导入"}
                          </Button>
                        </DialogFooter>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    上传文件
                    <input
                      type="file"
                      accept=".txt,.md,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      ref={(el) => (fileInputRef[0] = el)}
                    />
                  </label>
                </Button>

                <Button variant="outline" onClick={handleExportDocuments}>
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>

                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <FileJson className="mr-2 h-4 w-4" />
                    导入
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportDocuments}
                    />
                  </label>
                </Button>
              </div>

              <Input
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-[200px]"
              />
            </div>

            {/* Documents List */}
            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>还没有文档，添加文档开始使用</p>
                </CardContent>
              </Card>
            ) : filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>没有找到匹配的文档</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.doc_id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{doc.doc_id}</CardTitle>
                          <CardDescription className="mt-1">
                            {doc.chunk_count} 个片段
                            {doc.metadata?.filename && ` · ${doc.metadata.filename}`}
                          </CardDescription>
                        </div>
                        {doc.metadata?.source === "url" && (
                          <Badge variant="secondary" className="ml-2">
                            <Link className="h-3 w-3 mr-1" />
                            URL
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setQuestion(`请基于文档 ${doc.doc_id} 回答问题`);
                            setActiveTab("query");
                          }}
                        >
                          <Search className="mr-2 h-4 w-4" />
                          问答
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePreviewDocument(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.doc_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>系统状态</CardTitle>
                    <CardDescription>RAG系统当前配置</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">总文档数</p>
                        <p className="text-2xl font-bold">{stats.total_documents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">总片段数</p>
                        <p className="text-2xl font-bold">{stats.total_chunks}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">检索数量</p>
                        <p className="text-2xl font-bold">{stats.top_k}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">嵌入模型</p>
                        <p className="text-sm font-medium">{stats.embedding_model}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">块大小</p>
                        <p className="text-sm font-medium">{stats.chunk_size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Web搜索</p>
                        <p className="text-sm font-medium">
                          {stats.web_search_enabled ? "启用" : "禁用"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>功能说明</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• <strong>RAG检索</strong>: 从你的文档中检索相关内容</p>
                    <p>• <strong>Web搜索</strong>: 结合网络搜索获取最新信息</p>
                    <p>• <strong>AI答案</strong>: 使用LLM生成自然语言答案</p>
                    <p>• <strong>来源引用</strong>: 显示答案来源和相关性评分</p>
                    <p>• <strong>文档管理</strong>: 导入、预览、搜索、导出文档</p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>文档预览</DialogTitle>
                <DialogDescription>
                  {previewDoc?.doc_id} · {previewDoc?.chunk_count} 个片段
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            {loadingChunks ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p>加载中...</p>
              </div>
            ) : previewChunks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>没有找到文档片段</p>
              </div>
            ) : (
              <div className="space-y-3">
                {previewChunks.map((chunk, idx) => (
                  <div key={chunk.chunk_id} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">片段 {idx + 1}</Badge>
                      <span className="text-xs text-muted-foreground">{chunk.chunk_id}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
                    {chunk.metadata && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {JSON.stringify(chunk.metadata, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
