/**
 * Voices API Service
 */
import { apiClient, ApiResponse } from "./api";

export interface Voice {
  id: string;
  name: string;
  gender?: "male" | "female";
  language?: string;
}

export interface VoiceConfig {
  speaker: string;
  voice_type: "custom" | "clone" | "lora" | "design";
  voice_name?: string;
  style?: string;
  ref_audio_path?: string;
  lora_model_path?: string;
  language?: string;
}

export const voicesApi = {
  // Get voice reference vocabulary
  getReference: async (): Promise<
    ApiResponse<{
      reference?: string;
      texture_timbre?: Record<string, string[]>;
      emotion?: Record<string, string[]>;
      delivery?: Record<string, string>;
      examples?: Array<Record<string, string>>;
    }>
  > => {
    return apiClient.get("/voices/reference");
  },

  // Get available voices
  list: async (): Promise<
    ApiResponse<{
      custom: Voice[];
      lora: Voice[];
    }>
  > => {
    return apiClient.get("/voices");
  },

  // Get project voice configs
  getProjectVoices: async (projectId: string): Promise<ApiResponse<{ voices: VoiceConfig[] }>> => {
    return apiClient.get(`/projects/${projectId}/voices`);
  },

  // Parse speakers from script
  parseSpeakers: async (projectId: string): Promise<
    ApiResponse<{
      speakers: string[];
      total_entries: number;
    }>
  > => {
    return apiClient.post(`/projects/${projectId}/voices/parse`);
  },

  // Set voice config
  setVoiceConfig: async (
    projectId: string,
    voices: VoiceConfig[]
  ): Promise<ApiResponse<{ updated: boolean; count: number }>> => {
    return apiClient.post(`/projects/${projectId}/voices/config`, { voices });
  },

  // Preview voice
  preview: async (data: {
    text: string;
    voice_type: string;
    voice_name?: string;
    instruct?: string;
  }): Promise<ApiResponse<{ audio_url: string; duration: number }>> => {
    return apiClient.post("/voices/preview", data);
  },

  // Upload reference audio for cloning
  uploadCloneAudio: async (
    audio: File,
    text: string
  ): Promise<ApiResponse<{ audio_path: string; duration: number }>> => {
    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("text", text);
    return apiClient.upload("/voices/clone/upload", formData);
  },

  // Design voice from description
  designVoice: async (data: {
    description: string;
    gender?: "male" | "female";
    age_range?: string;
    style?: string;
  }): Promise<ApiResponse<{ preview_url: string; voice_id: string }>> => {
    return apiClient.post("/voices/design", data);
  },
};
