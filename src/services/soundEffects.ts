/**
 * Sound Effects API Service
 */
import { apiClient, ApiResponse } from "./api";

export interface SoundEffectPack {
  id: string;
  name: string;
  description: string;
  category: string;
  effects: SoundEffect[];
}

export interface SoundEffect {
  id: string;
  name: string;
  file_path: string;
  duration: number;
  category: string;
  tags: string[];
}

export interface SoundEffectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  effects: Array<{
    file_path: string;
    start_time: number;
    volume: number;
    fade_in?: number;
    fade_out?: number;
  }>;
}

export interface SoundEffectCreate {
  name: string;
  file_path: string;
  category: string;
  tags?: string[];
  volume?: number;
}

export const soundEffectsApi = {
  // Get sound effect packs
  getPacks: async (): Promise<ApiResponse<{ packs: SoundEffectPack[] }>> => {
    return apiClient.get("/audio-processor/sound-effects/packs");
  },

  // Get specific pack
  getPack: async (packId: string): Promise<ApiResponse<SoundEffectPack>> => {
    return apiClient.get(`/audio-processor/sound-effects/packs/${packId}`);
  },

  // Search sound effects
  search: async (query: string): Promise<ApiResponse<SoundEffect[]>> => {
    return apiClient.get(`/audio-processor/sound-effects/search?q=${encodeURIComponent(query)}`);
  },

  // Get categories
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get("/audio-processor/sound-effects/categories");
  },

  // Create custom sound effect
  createCustom: async (effect: SoundEffectCreate): Promise<ApiResponse<{ effect_id: string }>> => {
    return apiClient.post("/audio-processor/sound-effects/custom", effect);
  },

  // Delete custom sound effect
  deleteCustom: async (effectId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/audio-processor/sound-effects/custom/${effectId}`);
  },

  // Create sound effect template
  createTemplate: async (template: {
    name: string;
    description: string;
    category: string;
    effects: SoundEffectTemplate["effects"];
  }): Promise<ApiResponse<{ template_id: string }>> => {
    return apiClient.post("/audio-processor/sound-effects/templates", template);
  },

  // Get templates
  getTemplates: async (): Promise<ApiResponse<SoundEffectTemplate[]>> => {
    return apiClient.get("/audio-processor/sound-effects/templates");
  },

  // Get specific template
  getTemplate: async (templateId: string): Promise<ApiResponse<SoundEffectTemplate>> => {
    return apiClient.get(`/audio-processor/sound-effects/templates/${templateId}`);
  },

  // Apply template
  applyTemplate: async (
    templateId: string,
    audioPath: string
  ): Promise<ApiResponse<{ output_path: string }>> => {
    return apiClient.post("/audio-processor/sound-effects/apply-template", {
      template_id: templateId,
      audio_path: audioPath,
    });
  },
};
