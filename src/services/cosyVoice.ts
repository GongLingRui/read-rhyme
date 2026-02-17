/**
 * CosyVoice API Service
 * CosyVoice 0.5B TTS and voice cloning service
 */
import { apiClient, ApiResponse } from "./api";

// =============================================================================
// Types
// =============================================================================

export interface CosyVoiceModel {
  id: string;
  model_id: string;
  features: string[];
  languages: string[];
  latency_ms?: number;
}

export interface CosyVoiceSpeaker {
  id: string;
  name: string;
  gender: "male" | "female";
  language: string;
  description: string;
}

export interface CosyVoiceLanguage {
  code: string;
  name: string;
  native: string;
}

export interface CosyVoiceInfo {
  service: string;
  version: string;
  supported_models: string[];
  default_model: string;
  features: string[];
  supported_languages: Array<{ code: string; name: string }>;
  download_links: {
    huggingface: string;
    modelscope: string;
  };
}

export interface CosyVoiceStyleInstructions {
  emotion: string[];
  speaking_style: string[];
  tone: string[];
}

export interface GenerateSpeechRequest {
  text: string;
  speaker?: string;
  model?: string;
  language?: string;
  speed?: number;
  temperature?: number;
  instruction?: string;
  reference_audio?: File;
}

export interface GenerateSpeechResponse {
  audio_path: string;
  audio_url: string;
  duration: number;
  text: string;
  speaker: string;
  model: string;
  language: string;
  speed: number;
  instruction?: string;
  voice_cloned: boolean;
}

export interface CloneVoiceRequest {
  text: string;
  reference_audio: File;
  model?: string;
  language?: string;
  instruction?: string;
  speed?: number;
}

export interface CloneVoiceResponse {
  audio_path: string;
  audio_url: string;
  duration: number;
  text: string;
  reference_audio: string;
  model: string;
  language: string;
  instruction?: string;
}

export interface BatchGenerateRequest {
  texts: string[];
  speaker?: string;
  model?: string;
  speed?: number;
}

export interface BatchGenerateResponse {
  batch_id: string;
  total_items: number;
  succeeded: number;
  failed: number;
  total_duration: number;
  results: Array<{
    index: number;
    text: string;
    audio_path?: string;
    audio_url?: string;
    duration?: number;
    error?: string;
  }>;
}

// =============================================================================
// API Client
// =============================================================================

export const cosyVoiceApi = {
  // Model Information
  getModels: async (): Promise<ApiResponse<CosyVoiceModel[]>> => {
    return apiClient.get("/cosy-voice/models");
  },

  getInfo: async (): Promise<ApiResponse<CosyVoiceInfo>> => {
    return apiClient.get("/cosy-voice/info");
  },

  // Speakers and Languages
  getSpeakers: async (model?: string): Promise<ApiResponse<CosyVoiceSpeaker[]>> => {
    return apiClient.get(`/cosy-voice/speakers?model=${model || "CosyVoice3-0.5B-2512"}`);
  },

  getLanguages: async (model?: string): Promise<ApiResponse<CosyVoiceLanguage[]>> => {
    return apiClient.get(`/cosy-voice/languages?model=${model || "CosyVoice3-0.5B-2512"}`);
  },

  getStyleInstructions: async (model?: string): Promise<ApiResponse<CosyVoiceStyleInstructions>> => {
    return apiClient.get(`/cosy-voice/instructions?model=${model || "CosyVoice3-0.5B-2512"}`);
  },

  // Text-to-Speech
  generateSpeech: async (request: GenerateSpeechRequest): Promise<ApiResponse<GenerateSpeechResponse>> => {
    const formData = new FormData();
    formData.append("text", request.text);
    formData.append("speaker", request.speaker || "zh-cn-female-1");
    formData.append("model", request.model || "CosyVoice3-0.5B-2512");
    formData.append("language", request.language || "auto");
    formData.append("speed", String(request.speed ?? 1.0));
    formData.append("temperature", String(request.temperature ?? 0.7));

    if (request.instruction) {
      formData.append("instruction", request.instruction);
    }

    if (request.reference_audio) {
      formData.append("reference_audio", request.reference_audio);
    }

    return apiClient.upload("/cosy-voice/generate", formData);
  },

  // Voice Cloning
  cloneVoice: async (request: CloneVoiceRequest): Promise<ApiResponse<CloneVoiceResponse>> => {
    const formData = new FormData();
    formData.append("text", request.text);
    formData.append("reference_audio", request.reference_audio);
    formData.append("model", request.model || "CosyVoice3-0.5B-2512");
    formData.append("language", request.language || "auto");
    formData.append("speed", String(request.speed ?? 1.0));

    if (request.instruction) {
      formData.append("instruction", request.instruction);
    }

    return apiClient.upload("/cosy-voice/clone", formData);
  },

  // Batch Processing
  generateBatch: async (request: BatchGenerateRequest): Promise<ApiResponse<BatchGenerateResponse>> => {
    const formData = new FormData();
    request.texts.forEach((text, index) => {
      formData.append(`texts`, text);
    });
    formData.append("speaker", request.speaker || "zh-cn-female-1");
    formData.append("model", request.model || "CosyVoice3-0.5B-2512");
    formData.append("speed", String(request.speed ?? 1.0));

    return apiClient.upload("/cosy-voice/batch", formData);
  },

  // Get audio URL (helper)
  getAudioUrl: (filename: string): string => {
    return `/api/cosy-voice/audio/${filename}`;
  },

  getBatchAudioUrl: (batchId: string, filename: string): string => {
    return `/api/cosy-voice/audio/${batchId}/${filename}`;
  },
};
