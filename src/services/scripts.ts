/**
 * Scripts API Service
 */
import { apiClient, ApiResponse } from "./api";

export interface ScriptEntry {
  index: number;
  speaker: string;
  text: string;
  instruct?: string;
  emotion?: string;
  section?: string;
}

export interface ScriptGenerateOptions {
  system_prompt?: string;
  user_prompt?: string;
  options?: {
    max_chunk_size?: number;
    detect_emotions?: boolean;
    detect_sections?: boolean;
  };
}

export interface ScriptReviewOptions {
  auto_fix?: boolean;
  check_rules?: {
    speaker_consistency?: boolean;
    text_continuity?: boolean;
    emotion_accuracy?: boolean;
  };
}

export const scriptsApi = {
  // Generate script
  generate: async (
    projectId: string,
    options: ScriptGenerateOptions = {}
  ): Promise<ApiResponse<{ script_id: string; status: string }>> => {
    return apiClient.post(`/projects/${projectId}/scripts/generate`, options);
  },

  // Get script status
  getStatus: async (projectId: string): Promise<
    ApiResponse<{
      id: string;
      project_id: string;
      status: string;
      entries_count: number;
      speakers: string[];
      error_message: string | null;
      created_at: string;
    }>
  > => {
    return apiClient.get(`/projects/${projectId}/scripts/status`);
  },

  // Get script content
  get: async (projectId: string): Promise<ApiResponse<{ content: ScriptEntry[] }>> => {
    return apiClient.get(`/projects/${projectId}/scripts`);
  },

  // Update script
  update: async (projectId: string, content: ScriptEntry[]): Promise<ApiResponse<any>> => {
    return apiClient.patch(`/projects/${projectId}/scripts`, { content });
  },

  // Review script
  review: async (projectId: string, options: ScriptReviewOptions = {}): Promise<ApiResponse<any>> => {
    return apiClient.post(`/projects/${projectId}/scripts/review`, options);
  },

  // Approve script
  approve: async (projectId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/projects/${projectId}/scripts/approve`);
  },

  // Create chunks from script
  createChunks: async (projectId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/projects/${projectId}/scripts/chunks`);
  },
};
