/**
 * Projects List Page
 * Displays all audiobook projects with filtering and creation capabilities
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useBookStore } from "@/stores/bookStore";
import { useProjectStore, Project } from "@/stores/projectStore";
import { projectsApi } from "@/services/projects";
import { Plus, Play, Pause, Settings, Trash2, FolderOpen, Home } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const statusLabels: Record<Project["status"], { label: string; variant: any }> = {
  draft: { label: "草稿", variant: "secondary" },
  processing: { label: "处理中", variant: "default" },
  completed: { label: "已完成", variant: "outline" },
  failed: { label: "失败", variant: "destructive" },
};

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { books } = useBookStore();
  const { createProject } = useProjectStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    bookId: "",
    name: "",
    description: "",
  });

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectsApi.list();
      if (response.success && response.data) {
        setProjects(response.data.items);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error.message || "无法加载项目列表",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesStatus && matchesSearch;
  });

  // Handle create project
  const handleCreateProject = async () => {
    if (!createForm.bookId || !createForm.name) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "请填写所有必填字段",
      });
      return;
    }

    setCreating(true);
    try {
      const newProject = await createProject(
        createForm.bookId,
        createForm.name,
        createForm.description || undefined
      );
      toast({
        title: "创建成功",
        description: `项目"${newProject.name}"已创建`,
      });
      setCreateDialogOpen(false);
      setCreateForm({ bookId: "", name: "", description: "" });
      fetchProjects();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "创建失败",
        description: error.message || "无法创建项目",
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle delete project
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`确定要删除项目"${projectName}"吗？此操作无法撤销。`)) {
      return;
    }

    try {
      const response = await projectsApi.delete(projectId);
      if (response.success) {
        toast({
          title: "删除成功",
          description: `项目"${projectName}"已删除`,
        });
        fetchProjects();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error.message || "无法删除项目",
      });
    }
  };

  // Navigate to project detail
  const openProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <Home className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">有声书项目</h1>
                <p className="text-sm text-muted-foreground">管理和制作你的有声书项目</p>
              </div>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新建项目
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新项目</DialogTitle>
                  <DialogDescription>
                    选择一本书并配置项目信息
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="book">选择书籍 *</Label>
                    <Select
                      value={createForm.bookId}
                      onValueChange={(value) =>
                        setCreateForm({ ...createForm, bookId: value })
                      }
                    >
                      <SelectTrigger id="book">
                        <SelectValue placeholder="选择一本书" />
                      </SelectTrigger>
                      <SelectContent>
                        {books.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.title}
                            {book.author && ` - ${book.author}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">项目名称 *</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, name: e.target.value })
                      }
                      placeholder="例如：《三体》有声书"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">项目描述</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, description: e.target.value })
                      }
                      placeholder="简要描述这个项目..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={creating}
                  >
                    取消
                  </Button>
                  <Button onClick={handleCreateProject} disabled={creating}>
                    {creating ? "创建中..." : "创建"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-4">
          <Input
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="processing">处理中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="container mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">没有找到项目</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {projects.length === 0
                ? "创建你的第一个有声书项目开始使用"
                : "尝试调整筛选条件"}
            </p>
            {projects.length === 0 && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建项目
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const book = books.find((b) => b.id === project.bookId);
              const statusInfo = statusLabels[project.status];

              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{project.name}</CardTitle>
                        <CardDescription className="truncate">
                          {book?.title || "未知书籍"}
                        </CardDescription>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {project.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.progress && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>进度</span>
                            <span>
                              {project.progress.completedChunks}/{project.progress.totalChunks} 块
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${project.progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        创建于 {(() => {
                          const date = new Date(project.createdAt);
                          return isNaN(date.getTime()) ? "未知" : format(date, "PPP", { locale: zhCN });
                        })()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openProject(project.id)}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      打开
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
