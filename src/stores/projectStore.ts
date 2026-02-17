/**
 * Project Store with API integration
 */
import { create } from "zustand";
import { projectsApi, scriptsApi, audioApi, voicesApi, websocketService, type Project as ApiProject, type ScriptEntry, type Chunk } from "@/services";
import { useLogsStore } from "./logsStore";

export interface Project {
  id: string;
  bookId: string;
  bookTitle?: string;
  name: string;
  description?: string;
  status: "draft" | "processing" | "completed" | "failed";
  config: {
    tts_mode: string;
    tts_url?: string;
    language: string;
    parallel_workers?: number;
  };
  audioPath?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  progress?: {
    totalChunks: number;
    completedChunks: number;
    percentage: number;
  };
  // Include all fields from API
  audio_path?: string;
}

interface ProjectStore {
  currentProject: Project | null;
  script: ScriptEntry[] | null;
  chunks: Chunk[] | null;
  voiceConfigs: any[] | null;
  isGenerating: boolean;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  } | null;
  wsConnected: boolean;
  error: string | null;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (bookId: string, name: string, description?: string) => Promise<Project>;
  generateScript: (options?: any) => Promise<void>;
  fetchScript: () => Promise<void>;
  updateScript: (script: ScriptEntry[]) => Promise<void>;
  fetchChunks: () => Promise<void>;
  generateAudio: (chunkIds?: string[]) => Promise<void>;
  mergeAudio: () => Promise<void>;
  reset: () => void;

  // WebSocket actions
  connectWebSocket: (projectId: string) => void;
  disconnectWebSocket: () => void;
}

const mapApiProject = (apiProject: ApiProject): Project => ({
  id: apiProject.id,
  bookId: apiProject.book_id,
  bookTitle: apiProject.book_title,
  name: apiProject.name,
  description: apiProject.description,
  status: apiProject.status,
  config: apiProject.config,
  audioPath: apiProject.audio_path,
  audio_path: apiProject.audio_path,
  duration: apiProject.duration,
  createdAt: apiProject.created_at,
  updatedAt: apiProject.updated_at,
  progress: apiProject.progress
    ? {
        totalChunks: apiProject.progress.total_chunks,
        completedChunks: apiProject.progress.completed_chunks,
        percentage: apiProject.progress.percentage,
      }
    : undefined,
});

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProject: null,
  script: null,
  chunks: null,
  voiceConfigs: null,
  isGenerating: false,
  progress: null,
  wsConnected: false,
  error: null,

  setCurrentProject: (project) => {
    set({ currentProject: project });
    // Connect to WebSocket when project is set
    if (project) {
      get().connectWebSocket(project.id);
    }
  },

  connectWebSocket: (projectId: string) => {
    const ws = websocketService.connect(projectId);
    const addLog = useLogsStore.getState().addLog;

    // Register progress callback
    ws.onProgress((message) => {
      // Log all WebSocket messages
      switch (message.type) {
        case 'connected':
          set({ wsConnected: true });
          addLog('info', `WebSocket已连接: ${message.message || '项目 ' + projectId}`, 'WebSocket');
          break;
        case 'progress':
          if (message.data) {
            set({
              progress: {
                total: message.data.total || 0,
                completed: message.data.current || 0,
                percentage: message.data.percentage || 0,
              },
            });
            addLog('info', `进度: ${message.data.current}/${message.data.total} (${message.data.percentage?.toFixed(0)}%)`, 'TTS');
          }
          break;
        case 'chunk_completed':
          // Refresh chunks when a chunk is completed
          addLog('success', `音频块完成: ${message.data?.chunk_id}`, 'TTS');
          get().fetchChunks();
          break;
        case 'generation_complete':
          set({
            isGenerating: false,
            progress: {
              total: message.data?.total_chunks || 0,
              completed: message.data?.succeeded || 0,
              percentage: 100,
            },
          });
          addLog('success', `生成完成: ${message.data?.succeeded}/${message.data?.total_chunks} 成功 (${message.data?.success_rate?.toFixed(0)}%)`, 'TTS');
          if (message.data?.failed > 0) {
            addLog('warning', `${message.data.failed} 个音频块失败`, 'TTS');
          }
          get().fetchChunks();
          break;
        case 'error':
          set({
            error: message.data?.error_message || '生成错误',
            isGenerating: false,
          });
          addLog('error', message.data?.error_message || '生成错误', 'TTS');
          break;
        default:
          addLog('debug', `收到消息: ${message.type}`, 'WebSocket');
      }
    });
  },

  disconnectWebSocket: () => {
    const { currentProject } = get();
    if (currentProject) {
      websocketService.disconnect(currentProject.id);
      set({ wsConnected: false });
    }
  },

  fetchProject: async (projectId) => {
    set({ error: null });
    try {
      const response = await projectsApi.get(projectId);
      if (response.success && response.data) {
        set({ currentProject: mapApiProject(response.data) });
      }
    } catch (error: any) {
      set({ error: error.message || "获取项目失败" });
    }
  },

  createProject: async (bookId, name, description) => {
    set({ error: null });
    try {
      const response = await projectsApi.create({
        book_id: bookId,
        name,
        description,
      });
      if (response.success && response.data) {
        const project = mapApiProject(response.data);
        set({ currentProject: project });
        return project;
      }
      throw new Error("创建项目失败");
    } catch (error: any) {
      set({ error: error.message || "创建项目失败" });
      throw error;
    }
  },

  generateScript: async (options = {}) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isGenerating: true, error: null });
    try {
      await scriptsApi.generate(currentProject.id, options);
      // Poll for completion (simplified)
      const checkStatus = setInterval(async () => {
        try {
          const statusResponse = await scriptsApi.getStatus(currentProject.id);
          if (statusResponse.success && statusResponse.data) {
            if (statusResponse.data.status === "approved") {
              clearInterval(checkStatus);
              await get().fetchScript();
              set({ isGenerating: false });
            }
          }
        } catch (e) {
          clearInterval(checkStatus);
          set({ isGenerating: false });
        }
      }, 2000);
    } catch (error: any) {
      set({ error: error.message || "脚本生成失败", isGenerating: false });
    }
  },

  fetchScript: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      const response = await scriptsApi.get(currentProject.id);
      if (response.success && response.data) {
        set({ script: response.data.content });
      }
    } catch (error: any) {
      set({ error: error.message || "获取脚本失败" });
    }
  },

  updateScript: async (script) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      await scriptsApi.update(currentProject.id, script);
      set({ script });
    } catch (error: any) {
      set({ error: error.message || "更新脚本失败" });
    }
  },

  fetchChunks: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      const response = await audioApi.getChunks(currentProject.id);
      if (response.success && response.data) {
        set({ chunks: response.data.items });
      }
    } catch (error: any) {
      set({ error: error.message || "获取音频块失败" });
    }
  },

  generateAudio: async (chunkIds) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isGenerating: true, error: null });
    try {
      if (chunkIds) {
        await audioApi.generateBatch(currentProject.id, chunkIds);
      } else {
        await audioApi.generateFast(currentProject.id);
      }
    } catch (error: any) {
      set({ error: error.message || "音频生成失败", isGenerating: false });
    }
  },

  mergeAudio: async () => {
    const { currentProject, fetchProject } = get();
    if (!currentProject) return;

    try {
      await audioApi.mergeAudio(currentProject.id);
      // 合并后刷新项目信息，获取更新后的 audio_path 和 status
      await fetchProject(currentProject.id);
    } catch (error: any) {
      set({ error: error.message || "音频合并失败" });
    }
  },

  reset: () => {
    // Disconnect WebSocket before resetting
    get().disconnectWebSocket();

    set({
      currentProject: null,
      script: null,
      chunks: null,
      voiceConfigs: null,
      isGenerating: false,
      progress: null,
      wsConnected: false,
      error: null,
    });
  },
}));
