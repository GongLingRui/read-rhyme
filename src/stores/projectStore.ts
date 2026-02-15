/**
 * Project Store with API integration
 */
import { create } from "zustand";
import { projectsApi, scriptsApi, audioApi, voicesApi, type Project as ApiProject, type ScriptEntry, type Chunk } from "@/services";

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
  error: null,

  setCurrentProject: (project) => {
    set({ currentProject: project });
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
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      await audioApi.mergeAudio(currentProject.id);
    } catch (error: any) {
      set({ error: error.message || "音频合并失败" });
    }
  },

  reset: () => {
    set({
      currentProject: null,
      script: null,
      chunks: null,
      voiceConfigs: null,
      isGenerating: false,
      progress: null,
      error: null,
    });
  },
}));
