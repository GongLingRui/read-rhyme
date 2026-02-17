/**
 * Audio API Service
 */
import { apiClient, ApiResponse, PaginatedResponse } from "./api";

export interface Chunk {
  id: string;
  project_id: string;
  script_id: string;
  speaker: string;
  text: string;
  instruct?: string;
  emotion?: string;
  section?: string;
  status: "pending" | "processing" | "completed" | "failed";
  audio_path?: string;
  duration?: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ChunkUpdate {
  text?: string;
  instruct?: string;
  speaker?: string;
}

export const audioApi = {
  // Get audio chunks
  getChunks: async (
    projectId: string,
    params: {
      speaker?: string;
      status?: string;
      page?: number;
      page_size?: number;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<Chunk>>> => {
    return apiClient.get(`/projects/${projectId}/chunks`, params);
  },

  // Generate single chunk
  generateChunk: async (projectId: string, chunkId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/projects/${projectId}/chunks/${chunkId}/generate`);
  },

  // Batch generate
  generateBatch: async (
    projectId: string,
    chunkIds: string[],
    mode: "parallel" | "sequential" = "parallel",
    workers: number = 2
  ): Promise<ApiResponse<{ task_id: string }>> => {
    return apiClient.post(`/projects/${projectId}/chunks/generate-batch`, {
      chunk_ids: chunkIds,
      mode,
      workers,
    });
  },

  // Fast batch generate
  generateFast: async (projectId: string): Promise<ApiResponse<{ task_id: string }>> => {
    return apiClient.post(`/projects/${projectId}/chunks/generate-fast`);
  },

  // Update chunk
  updateChunk: async (projectId: string, chunkId: string, data: ChunkUpdate): Promise<ApiResponse<Chunk>> => {
    return apiClient.patch(`/projects/${projectId}/chunks/${chunkId}`, data);
  },

  // Regenerate chunk
  regenerateChunk: async (projectId: string, chunkId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/projects/${projectId}/chunks/${chunkId}/retry`);
  },

  // Get chunks progress
  getProgress: async (projectId: string): Promise<
    ApiResponse<{
      total: number;
      completed: number;
      processing: number;
      pending: number;
      percentage: number;
      estimated_time_remaining: number | null;
    }>
  > => {
    return apiClient.get(`/projects/${projectId}/chunks/progress`);
  },

  // Merge audio
  mergeAudio: async (
    projectId: string,
    options: {
      pause_between_speakers?: number;
      pause_same_speaker?: number;
      output_format?: "mp3" | "wav";
      bitrate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/projects/${projectId}/audio/merge`, options);
  },

  // Get merged audio
  getAudio: async (projectId: string): Promise<
    ApiResponse<{
      audio_url: string;
      duration: number;
      file_size: number | null;
      format: string;
      bitrate: string | null;
    }>
  > => {
    return apiClient.get(`/projects/${projectId}/audio`);
  },

  // Export audio in various formats
  exportAudio: async (
    projectId: string,
    exportFormat: "combined" | "audacity" | "voicelines",
    options: {
      project_name?: string;
      add_fades?: boolean;
      normalize?: boolean;
    } = {}
  ): Promise<
    ApiResponse<{
      format: string;
      audio_url?: string;
      download_url?: string;
      filename?: string;
      chunks_count?: number;
      duration?: number;
      message: string;
    }>
  > => {
    const params = new URLSearchParams({
      export_format: exportFormat,
      ...(options.project_name && { project_name: options.project_name }),
      ...(options.add_fades !== undefined && { add_fades: String(options.add_fades) }),
      ...(options.normalize !== undefined && { normalize: String(options.normalize) }),
    });

    return apiClient.post(`/projects/${projectId}/audio/export?${params.toString()}`);
  },

  // Download exported file
  downloadExport: (projectId: string, filename: string): string => {
    return `${apiClient['baseUrl'] || '/api'}/projects/${projectId}/audio/download/${filename}`;
  },
};
