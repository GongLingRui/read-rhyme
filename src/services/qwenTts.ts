/**
 * Qwen3-TTS API Service
 * Production-ready TTS for Apple Silicon with MPS acceleration
 */

import { apiClient, ApiResponse } from "./api";

export interface SpeechGenerationRequest {
  text: string;
  emotion?: Record<string, number>;
  speed?: number;
  voice_id?: string;
}

export interface SpeechGenerationResponse {
  audio_url: string;
  sample_rate: number;
  duration: number;
  format: string;
  model: string;
  device: string;
  message: string;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
}

export interface LanguageInfo {
  language_code: string;
  language_name: string;
  sample_rate: number;
  model_type: string;
}

export interface VoiceCloneResult {
  voice_id: string;
  voice_name: string;
  sample_count: number;
  status: string;
  message: string;
}

export interface TTSInfo {
  model: string;
  device: string;
  sample_rate: number;
  available_models: string[];
  mps_info: {
    device: string;
    available: boolean;
    system_memory_gb?: number;
    available_memory_gb?: number;
  };
}

export const qwenTtsApi = {
  /**
   * Generate speech from text using Edge TTS
   */
  generateSpeech: async (
    request: SpeechGenerationRequest
  ): Promise<SpeechGenerationResponse> => {
    // apiClient的响应拦截器直接返回response.data
    return apiClient.post("/qwen-tts/generate", request) as Promise<SpeechGenerationResponse>;
  },

  /**
   * Generate speech with optional voice cloning
   * Returns audio blob directly
   */
  generateSpeechWithVoice: async (
    text: string,
    voiceSample?: File,
    emotion?: Record<string, number>,
    speed: number = 1.0
  ): Promise<Blob> => {
    const formData = new FormData();
    formData.append("text", text);
    if (voiceSample) {
      formData.append("voice_sample", voiceSample);
    }
    if (emotion) {
      formData.append("emotion", JSON.stringify(emotion));
    }
    formData.append("speed", speed.toString());

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/qwen-tts/generate-with-voice`, {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
    });

    if (!response.ok) {
      throw new Error(`TTS generation failed: ${response.statusText}`);
    }

    const sampleRate = response.headers.get("X-Sample-Rate");
    const duration = response.headers.get("X-Duration");

    // Return audio blob
    const blob = await response.blob();
    // Add metadata to blob
    (blob as any).sampleRate = sampleRate;
    (blob as any).duration = duration;

    return blob;
  },

  /**
   * Clone voice from audio samples
   */
  cloneVoice: async (
    voiceName: string,
    voiceSamples: File[],
    description?: string
  ): Promise<ApiResponse<VoiceCloneResult>> => {
    const formData = new FormData();
    formData.append("voice_name", voiceName);
    if (description) {
      formData.append("description", description);
    }
    voiceSamples.forEach((sample) => {
      formData.append("voice_samples", sample);
    });

    return apiClient.upload("/qwen-tts/clone-voice", formData);
  },

  /**
   * Get list of available built-in voices
   */
  getVoices: async (): Promise<ApiResponse<VoiceInfo[]>> => {
    return apiClient.get("/qwen-tts/voices");
  },

  /**
   * Get supported languages for TTS
   */
  getLanguages: async (): Promise<ApiResponse<LanguageInfo[]>> => {
    return apiClient.get("/qwen-tts/languages");
  },

  /**
   * Get TTS service information
   */
  getInfo: async (): Promise<ApiResponse<TTSInfo>> => {
    return apiClient.get("/qwen-tts/info");
  },
};
