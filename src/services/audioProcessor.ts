/**
 * Audio Processor API Service
 * Audio mixing, multi-speaker dialogue, intelligent text segmentation,
 * streaming TTS, RVC voice conversion, and advanced audio processing
 */
import { apiClient, ApiResponse } from "./api";

// =============================================================================
// Audio Mixing (音频混合)
// =============================================================================

export interface AudioMixRequest {
  speech_audio_path: string;
  background_music_path?: string;
  sound_effects?: Array<{
    audio_path: string;
    start_time: number;
    volume: number;
  }>;
  music_volume?: number;
  speech_volume?: number;
  ducking?: boolean;
  ducking_amount?: number;
  fade_in?: number;
  fade_out?: number;
  output_path?: string;
}

export interface AudioMixResponse {
  output_path: string;
  output_url: string;
  duration: number;
  background_music: boolean;
  sound_effects_count: number;
  ducking_enabled: boolean;
  success: boolean;
}

// =============================================================================
// Multi-Speaker Dialogue (多说话人对话)
// =============================================================================

export interface DialogueSegment {
  speaker: string;
  text: string;
  emotion?: string;
  voice_id?: string;
  pause_before?: number;
  pause_after?: number;
}

export interface VoiceConfigForSpeaker {
  voice_id: string;
  emotion?: Record<string, number>;
  speed?: number;
  pitch?: number;
}

export interface GenerateDialogueRequest {
  dialogue_script: DialogueSegment[];
  voice_configs?: Record<string, VoiceConfigForSpeaker>;
  output_path?: string;
  add_pauses?: boolean;
  normalize_audio?: boolean;
  pause_between_speakers?: number;
  pause_same_speaker?: number;
}

export interface GenerateDialogueResponse {
  output_path: string;
  output_url: string;
  duration: number;
  segments_count: number;
  speakers: string[];
  success: boolean;
}

// =============================================================================
// Intelligent Text Segmentation (智能文本断句)
// =============================================================================

export interface SegmentTextRequest {
  text: string;
  max_chars?: number;
  preserve_sentences?: boolean;
  detect_dialogue?: boolean;
  add_pause_markers?: boolean;
}

export interface TextSegment {
  text: string;
  speaker?: string;
  type: "dialogue" | "narration";
  position: number;
  char_count: number;
  text_with_pauses?: string;
}

export interface SegmentTextResponse {
  segments: TextSegment[];
  total_segments: number;
  total_chars: number;
  dialogue_detected: boolean;
}

// =============================================================================
// Streaming TTS (流式TTS)
// =============================================================================

export interface StreamingTTSRequest {
  text: string;
  speaker?: string;
  voice_config?: Record<string, any>;
  chunk_size?: number;
}

export interface StreamingTTSChunk {
  chunk_index: number;
  total_chunks: number;
  audio_data: string;
  text: string;
  duration: number;
  is_final: boolean;
  metadata?: {
    speaker?: string;
    type?: string;
    position?: number;
  };
}

export interface StreamingTTSResponse {
  text: string;
  speaker: string;
  chunks: Array<{
    index: number;
    size: number;
  }>;
  total_chunks: number;
}

// =============================================================================
// RVC Voice Conversion (RVC语音转换)
// =============================================================================

export interface RVCConvertRequest {
  source_audio_path: string;
  target_voice_model: string;
  preserve_prosody?: boolean;
  preserve_timing?: boolean;
  pitch_shift?: number;
  output_path?: string;
}

export interface RVCConvertResponse {
  output_path: string;
  output_url: string;
  target_voice_model: string;
  duration: number;
  preserve_prosody: boolean;
  preserve_timing: boolean;
  pitch_shift: number;
  conversion_method: string;
  success: boolean;
}

// =============================================================================
// Prosody Control (韵律控制)
// =============================================================================

export interface ProsodyTemplate {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
}

export interface ApplyProsodyRequest {
  audio_path: string;
  prosody_config: Record<string, any>;
  output_path?: string;
}

export interface ApplyProsodyResponse {
  output_path: string;
  output_url: string;
  duration: number;
  original_duration: number;
  applied_modifications: string[];
  success: boolean;
}

// =============================================================================
// Audio Analysis Tools (音频分析工具)
// =============================================================================

export interface AudioQualityCheckRequest {
  file?: File;
  audio_path?: string;
  assessment_type?: "clone" | "tts" | "general";
}

export interface AudioQualityCheckResponse {
  filename: string;
  overall_score: number;
  duration: number;
  loudness: number;
  dynamic_range: number;
  noise_floor: number;
  format_compatible: boolean;
  has_clipping: boolean;
  issues: string[];
  recommendations: string[];
}

export interface AudioQualityBatchRequest {
  files: File[];
  assessment_type?: "clone" | "tts" | "general";
}

export interface AudioQualityBatchResponse {
  total_count: number;
  pass_count: number;
  fail_count: number;
  overall: {
    min_score: number;
    max_score: number;
    avg_score: number;
  };
  individual: AudioQualityCheckResponse[];
}

// =============================================================================
// API Client
// =============================================================================

export const audioProcessorApi = {
  // Audio Mixing
  mixAudio: async (request: AudioMixRequest): Promise<ApiResponse<AudioMixResponse>> => {
    return apiClient.post("/audio-processor/mix-audio", request);
  },

  // Multi-Speaker Dialogue
  generateDialogue: async (request: GenerateDialogueRequest): Promise<ApiResponse<GenerateDialogueResponse>> => {
    return apiClient.post("/audio-processor/generate-dialogue", request);
  },

  // Text Segmentation
  segmentText: async (request: SegmentTextRequest): Promise<ApiResponse<TextSegment[]>> => {
    return apiClient.post("/audio-processor/segment-text", request);
  },

  // Streaming TTS
  streamingTTS: async (request: StreamingTTSRequest): Promise<ApiResponse<StreamingTTSResponse>> => {
    return apiClient.post("/audio-processor/streaming-tts", request);
  },

  // RVC Conversion
  rvcConvert: async (request: RVCConvertRequest): Promise<ApiResponse<RVCConvertResponse>> => {
    return apiClient.post("/audio-processor/rvc-convert", request);
  },

  // Prosody Control
  applyProsody: async (request: ApplyProsodyRequest): Promise<ApiResponse<ApplyProsodyResponse>> => {
    return apiClient.post("/audio-processor/apply-prosody", request);
  },

  getProsodyTemplates: async (): Promise<ApiResponse<ProsodyTemplate[]>> => {
    return apiClient.get("/audio-processor/prosody/templates");
  },

  // Audio Quality Check (these are in the audio-tools module, not audio-processor)
  checkQuality: async (request: AudioQualityCheckRequest): Promise<ApiResponse<AudioQualityCheckResponse>> => {
    if (request.file) {
      const formData = new FormData();
      formData.append("file", request.file);
      if (request.assessment_type) {
        formData.append("assessment_type", request.assessment_type);
      }
      return apiClient.upload("/audio-quality/check", formData);
    }
    return apiClient.post("/audio-quality/check", {
      audio_path: request.audio_path,
      assessment_type: request.assessment_type,
    });
  },

  checkQualityBatch: async (request: AudioQualityBatchRequest): Promise<ApiResponse<AudioQualityBatchResponse>> => {
    const formData = new FormData();
    request.files.forEach((file) => {
      formData.append("files", file);
    });
    if (request.assessment_type) {
      formData.append("assessment_type", request.assessment_type);
    }
    return apiClient.upload("/audio-quality/check-batch", formData);
  },

  getAudioQualityGuidelines: async (): Promise<ApiResponse<Record<string, string>>> => {
    return apiClient.get("/audio-quality/guidelines");
  },

  getAudioQualityConsent: async (): Promise<ApiResponse<Record<string, any>>> => {
    return apiClient.get("/audio-quality/consent");
  },
};
