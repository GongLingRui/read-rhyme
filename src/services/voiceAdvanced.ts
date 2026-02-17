/**
 * Voice Advanced API Service
 * Advanced voice analysis features: VAD, speaker analysis, emotion recognition, SSML, prosody control
 */
import { apiClient, ApiResponse } from "./api";

// =============================================================================
// SSML (Speech Synthesis Markup Language)
// =============================================================================

export interface SSMLBreak {
  strength?: "none" | "x-weak" | "weak" | "medium" | "strong" | "x-strong";
  time?: string;
}

export interface SSMLProsody {
  rate?: string;
  pitch?: string;
  volume?: string;
}

export interface SSMLMark {
  name: string;
}

export interface SSMLElement {
  type: "text" | "break" | "prosody" | "mark";
  content?: string;
  attributes?: SSMLBreak | SSMLProsody | SSMLMark;
  children?: SSMLElement[];
}

export interface SSMLGenerateRequest {
  text: string;
  elements: SSMLElement[];
  voice_id?: string;
}

export interface SSMLResponse {
  ssml: string;
  audio_url?: string;
  duration?: number;
}

export interface SSMLParseRequest {
  ssml: string;
}

export interface SSMLParseResponse {
  elements: SSMLElement[];
  metadata: {
    total_duration: number;
    element_count: number;
  };
}

// =============================================================================
// Prosody Control (韵律控制)
// =============================================================================

export interface ProsodyPreset {
  id: string;
  name: string;
  description: string;
  config: {
    rate: string;
    pitch: string;
    volume: string;
  };
  examples: string[];
}

export interface SentenceAdjustment {
  start_time: number;
  end_time: number;
  pitch_shift?: number;
  tempo_factor?: number;
  volume_gain?: number;
}

export interface WordEmphasis {
  word: string;
  emphasis_level: "strong" | "moderate" | "weak";
  pitch_boost?: number;
}

export interface PitchCurvePoint {
  time: number;
  pitch_value: number;
}

export interface ProsodyApplyRequest {
  audio_path: string;
  prosody_config: {
    sentence_adjustments?: SentenceAdjustment[];
    word_emphasis?: WordEmphasis[];
    pitch_curve?: PitchCurvePoint[];
    rhythm_pattern?: string;
    emotion_gradient?: {
      start_emotion: Record<string, number>;
      end_emotion: Record<string, number>;
    };
  };
  output_path?: string;
}

export interface ProsodyApplyResponse {
  output_path: string;
  output_url: string;
  duration: number;
  original_duration: number;
  applied_modifications: string[];
  success: boolean;
}

// =============================================================================
// Voice Quality Assessment
// =============================================================================

export interface QualityScoreRequest {
  audio_path: string;
  reference_path?: string;
  assessment_type: "clone" | "tts" | "general";
}

export interface QualityMetrics {
  overall_score: number;
  clarity: number;
  naturalness: number;
  consistency: number;
  signal_to_noise_ratio: number;
  dynamic_range: number;
  frequency_balance: number;
  artifacts_detected: string[];
}

export interface QualityScoreResponse {
  filename: string;
  quality_score: number;
  metrics: QualityMetrics;
  duration: number;
  format_compatible: boolean;
  issues: string[];
  recommendations: string[];
  pass_threshold: boolean;
}

// =============================================================================
// Voice Profile (语音档案)
// =============================================================================

export interface VoiceProfile {
  id: string;
  name: string;
  description?: string;
  gender?: "male" | "female" | "neutral";
  age_range?: string;
  accent?: string;
  emotional_range: string[];
  characteristics: {
    pitch: { min: number; max: number; avg: number };
    tempo: { min: number; max: number; avg: number };
    energy: { min: number; max: number; avg: number };
  };
  sample_count: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceProfileCreate {
  name: string;
  description?: string;
  gender?: "male" | "female" | "neutral";
  age_range?: string;
  accent?: string;
  reference_audio: string;
}

// =============================================================================
// Voice Activity Detection (VAD)
// =============================================================================

export interface VADDetectRequest {
  audio_path: string;
  threshold?: number;
  min_speech_duration?: number;
  min_silence_duration?: number;
  window_size?: number;
}

export interface VADSegment {
  start: number;
  end: number;
  type: "speech" | "silence";
  confidence: number;
}

export interface VADDetectResponse {
  segments: VADSegment[];
  speech_duration: number;
  silence_duration: number;
  total_duration: number;
  speech_ratio: number;
  segment_count: number;
}

// =============================================================================
// Speaker Analysis (说话人分析)
// =============================================================================

export interface SpeakerAnalyzeRequest {
  audio_path: string;
  include_embeddings?: boolean;
  include_features?: boolean;
}

export interface SpeakerFeatures {
  gender: {
    detected: "male" | "female" | "unknown";
    confidence: number;
  };
  age_range: {
    detected: string;
    confidence: number;
  };
  pitch: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  tempo: {
    words_per_minute: number;
    syllables_per_second: number;
  };
  voice_type: {
    detected: string;
    confidence: number;
  };
}

export interface SpeakerAnalyzeResponse {
  filename: string;
  duration: number;
  features: SpeakerFeatures;
  embedding?: number[];
  quality_score: number;
  recommendations: string[];
}

// =============================================================================
// Emotion Recognition (情感识别)
// =============================================================================

export interface EmotionRecognizeRequest {
  audio_path: string;
  include_arousal_valence?: boolean;
  segment_analysis?: boolean;
}

export interface EmotionScores {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface ArousalValence {
  arousal: number;
  valence: number;
}

export interface EmotionSegment {
  start: number;
  end: number;
  emotion: string;
  confidence: number;
  arousal_valence?: ArousalValence;
}

export interface EmotionRecognizeResponse {
  filename: number;
  duration: number;
  overall_emotion: {
    primary: string;
    confidence: number;
    all_scores: EmotionScores;
    arousal_valence?: ArousalValence;
  };
  segments?: EmotionSegment[];
  emotional_intensity: number;
}

// =============================================================================
// Comprehensive Analysis (综合分析)
// =============================================================================

export interface ComprehensiveAnalyzeRequest {
  audio_path: string;
  include_vad?: boolean;
  include_speaker?: boolean;
  include_emotion?: boolean;
  include_quality?: boolean;
}

export interface ComprehensiveAnalysisResponse {
  filename: string;
  duration: number;
  vad?: VADDetectResponse;
  speaker?: SpeakerAnalyzeResponse;
  emotion?: EmotionRecognizeResponse;
  quality?: QualityScoreResponse;
  summary: {
    overall_quality: number;
    speech_content_ratio: number;
    speaker_characteristics: string;
    dominant_emotion: string;
    recommendations: string[];
  };
}

// =============================================================================
// Speech Enhancement (语音增强)
// =============================================================================

export interface EnhanceRequest {
  audio_path: string;
  denoise?: boolean;
  dereverb?: boolean;
  normalize_volume?: boolean;
  reduce_breath?: boolean;
  target_lufs?: number;
  output_path?: string;
}

export interface EnhanceResponse {
  output_path: string;
  output_url: string;
  duration: number;
  enhancements_applied: {
    denoise: boolean;
    dereverb: boolean;
    volume_normalize: boolean;
    breath_reduction: boolean;
    target_lufs?: number;
  };
}

// =============================================================================
// Voice Translation (语音翻译)
// =============================================================================

export interface TranslateRequest {
  text?: string;
  audio_path?: string;
  target_language: string;
  voice_id?: string;
  preserve_speaker_characteristics?: boolean;
}

export interface TranslateResponse {
  translated_text: string;
  audio_url?: string;
  source_language: string;
  target_language: string;
  duration?: number;
}

// =============================================================================
// API Client
// =============================================================================

export const voiceAdvancedApi = {
  // SSML
  generateSSML: async (request: SSMLGenerateRequest): Promise<ApiResponse<SSMLResponse>> => {
    return apiClient.post("/voice-advanced/ssml/generate", request);
  },

  parseSSML: async (request: SSMLParseRequest): Promise<ApiResponse<SSMLParseResponse>> => {
    return apiClient.post("/voice-advanced/ssml/parse", request);
  },

  // Prosody
  getProsodyPresets: async (): Promise<ApiResponse<Record<string, ProsodyPreset>>> => {
    return apiClient.get("/voice-advanced/prosody/presets");
  },

  applyProsody: async (request: ProsodyApplyRequest): Promise<ApiResponse<ProsodyApplyResponse>> => {
    return apiClient.post("/voice-advanced/prosody/apply", request);
  },

  // Quality
  scoreQuality: async (request: QualityScoreRequest): Promise<ApiResponse<QualityScoreResponse>> => {
    return apiClient.post("/voice-advanced/quality/score", request);
  },

  scoreQualityBatch: async (requests: QualityScoreRequest[]): Promise<ApiResponse<QualityScoreResponse[]>> => {
    return apiClient.post("/voice-advanced/quality/batch-score", { requests });
  },

  // Voice Profiles
  getVoiceProfiles: async (): Promise<ApiResponse<VoiceProfile[]>> => {
    return apiClient.get("/voice-advanced/voice-profiles");
  },

  getVoiceProfile: async (profileId: string): Promise<ApiResponse<VoiceProfile>> => {
    return apiClient.get(`/voice-advanced/voice-profiles/${profileId}`);
  },

  createVoiceProfile: async (request: VoiceProfileCreate): Promise<ApiResponse<VoiceProfile>> => {
    return apiClient.post("/voice-advanced/voice-profiles", request);
  },

  deleteVoiceProfile: async (profileId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/voice-advanced/voice-profiles/${profileId}`);
  },

  // VAD
  detectVAD: async (request: VADDetectRequest): Promise<ApiResponse<VADDetectResponse>> => {
    return apiClient.post("/voice-advanced/vad/detect", request);
  },

  // Speaker Analysis
  analyzeSpeaker: async (request: SpeakerAnalyzeRequest): Promise<ApiResponse<SpeakerAnalyzeResponse>> => {
    return apiClient.post("/voice-advanced/speaker/analyze", request);
  },

  // Emotion Recognition
  recognizeEmotion: async (request: EmotionRecognizeRequest): Promise<ApiResponse<EmotionRecognizeResponse>> => {
    return apiClient.post("/voice-advanced/emotion/recognize", request);
  },

  // Comprehensive Analysis
  analyzeComprehensive: async (request: ComprehensiveAnalyzeRequest): Promise<ApiResponse<ComprehensiveAnalysisResponse>> => {
    return apiClient.post("/voice-advanced/analyze/comprehensive", request);
  },

  // Enhancement
  enhanceAudio: async (request: EnhanceRequest): Promise<ApiResponse<EnhanceResponse>> => {
    return apiClient.post("/voice-advanced/enhance", request);
  },

  // Translation
  translate: async (request: TranslateRequest): Promise<ApiResponse<TranslateResponse>> => {
    return apiClient.post("/voice-advanced/translate", request);
  },
};
