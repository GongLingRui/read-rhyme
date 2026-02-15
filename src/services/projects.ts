/**
 * Projects API Service
 */
import { apiClient, ApiResponse, PaginatedResponse } from "./api";

export interface ProjectConfig {
  tts_mode: string;
  tts_url?: string;
  language: string;
  parallel_workers?: number;
}

export interface Project {
  id: string;
  book_id: string;
  book_title?: string;
  name: string;
  description?: string;
  status: "draft" | "processing" | "completed" | "failed";
  config: ProjectConfig;
  audio_path?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  progress?: {
    total_chunks: number;
    completed_chunks: number;
    percentage: number;
  };
}

export interface ProjectCreate {
  book_id: string;
  name: string;
  description?: string;
  config?: ProjectConfig;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  config?: Partial<ProjectConfig>;
}

export interface ProjectProgress {
  total_chunks: number;
  completed_chunks: number;
  percentage: number;
}

export const projectsApi = {
  // List projects
  list: async (
    params: { book_id?: string; status?: string; page?: number; page_size?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<Project>>> => {
    return apiClient.get("/projects", params);
  },

  // Get project details
  get: async (projectId: string): Promise<ApiResponse<Project>> => {
    return apiClient.get(`/projects/${projectId}`);
  },

  // Create project
  create: async (data: ProjectCreate): Promise<ApiResponse<Project>> => {
    return apiClient.post("/projects", data);
  },

  // Update project
  update: async (projectId: string, data: ProjectUpdate): Promise<ApiResponse<Project>> => {
    return apiClient.patch(`/projects/${projectId}`, data);
  },

  // Delete project
  delete: async (projectId: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return apiClient.delete(`/projects/${projectId}`);
  },

  // Get generation progress
  getProgress: async (projectId: string): Promise<ApiResponse<ProjectProgress>> => {
    return apiClient.get(`/projects/${projectId}/chunks/progress`);
  },

  // Download audio
  downloadAudio: async (projectId: string, format: "mp3" | "wav" | "zip" = "mp3"): Promise<void> => {
    return apiClient.download(`/projects/${projectId}/audio/download?format=${format}`);
  },
};
