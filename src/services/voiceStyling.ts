/**
 * Voice Styling API Service
 */
import { apiClient, ApiResponse } from "./api";

export interface EmotionParameters {
  happiness?: number;
  sadness?: number;
  anger?: number;
  fear?: number;
  surprise?: number;
  neutral?: number;
  energy?: number;
  tempo?: number;
  pitch?: number;
  volume?: number;
}

export interface VoiceStyle {
  name: string;
  description?: string;
  gender?: "male" | "female" | "neutral";
  age_range?: string;
  timbre?: string;
  resonance?: string;
  delivery?: string;
  accent?: string;
}

export interface EmotionPreset {
  id: string;
  name: string;
  description?: string;
  emotion: EmotionParameters;
  example_instruct?: string;
}

export interface VoiceStylingRequest {
  text: string;
  emotion: EmotionParameters;
  style?: VoiceStyle;
  preset_id?: string;
}

export interface VoiceConversionRequest {
  source_audio_path: string;
  target_voice_id: string;
  preserve_timing?: boolean;
  preserve_prosody?: boolean;
}

export interface BatchVoiceCloneRequest {
  voice_samples: File[];
  voice_name: string;
  description?: string;
  language?: string;
}

export interface SpeechEnhancementRequest {
  audio_path: string;
  enhance_denoise?: boolean;
  enhance_volume?: boolean;
  add_compression?: boolean;
  target_lufs?: number;
}

export interface TTSLanguageConfig {
  language_code: string;
  language_name: string;
  supported_voices: string[];
  emotion_support: boolean;
  sample_rate: number;
  model_type: string;
}

export const voiceStylingApi = {
  // 获取所有情感预设
  getEmotionPresets: async (): Promise<ApiResponse<EmotionPreset[]>> => {
    return apiClient.get("/voice-styling/presets");
  },

  // 获取特定情感预设
  getEmotionPreset: async (presetId: string): Promise<ApiResponse<EmotionPreset>> => {
    return apiClient.get(`/voice-styling/presets/${presetId}`);
  },

  // 获取支持的语言列表
  getSupportedLanguages: async (): Promise<ApiResponse<TTSLanguageConfig[]>> => {
    return apiClient.get("/voice-styling/languages");
  },

  // 生成带情感的语音
  generateStyledAudio: async (request: VoiceStylingRequest): Promise<
    ApiResponse<{
      audio_url: string;
      duration: number;
      instruction: string;
      emotion_applied: EmotionParameters;
      message: string;
    }>
  > => {
    return apiClient.post("/voice-styling/generate-styled", request);
  },

  // 语音转换
  convertVoice: async (request: VoiceConversionRequest): Promise<
    ApiResponse<{
      converted_audio_url: string;
      target_voice_id: string;
      preserve_timing: boolean;
      preserve_prosody: boolean;
      message: string;
    }>
  > => {
    return apiClient.post("/voice-styling/convert-voice", request);
  },

  // 批量语音克隆
  batchVoiceClone: async (request: {
    voice_samples: File[];
    voice_name: string;
    description?: string;
    language?: string;
  }): Promise<
    ApiResponse<{
      voice_id: string;
      voice_name: string;
      sample_count: number;
      sample_paths: string[];
      language: string;
      status: string;
      message: string;
    }>
  > => {
    const formData = new FormData();
    request.voice_samples.forEach((file) => {
      formData.append("voice_samples", file);
    });
    formData.append("voice_name", request.voice_name);
    if (request.description) {
      formData.append("description", request.description);
    }
    if (request.language) {
      formData.append("language", request.language);
    }

    return apiClient.upload("/voice-styling/batch-clone", formData);
  },

  // 语音增强
  enhanceSpeech: async (request: SpeechEnhancementRequest): Promise<
    ApiResponse<{
      enhanced_audio_url: string;
      original_path: string;
      enhancements_applied: {
        denoise: boolean;
        volume_normalize: boolean;
        compression: boolean;
        target_lufs?: number;
      };
      message: string;
    }>
  > => {
    return apiClient.post("/voice-styling/enhance-speech", request);
  },
};
