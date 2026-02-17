/**
 * Services - API exports
 */
export { apiClient, ApiClient, type ApiResponse, type PaginatedResponse } from "./api";
export { booksApi, type Book, type BookCreate, type BookUpdate, type BookListParams, type BookContentResponse } from "./books";
export { projectsApi, type Project, type ProjectCreate, type ProjectUpdate, type ProjectConfig, type ProjectProgress } from "./projects";
export { scriptsApi, type ScriptEntry, type ScriptGenerateOptions, type ScriptReviewOptions } from "./scripts";
export { audioApi, type Chunk, type ChunkUpdate } from "./audio";
export { voicesApi, type Voice, type VoiceConfig } from "./voices";
export { highlightsApi, type Highlight, type HighlightCreate, type Note } from "./highlights";
export { thoughtsApi, type Thought, type ThoughtCreate, type ThoughtUpdate, type ThoughtListParams } from "./thoughts";
export { authService, type User, type LoginRequest, type RegisterRequest, type AuthResponse } from "./auth";
export { voiceStylingApi, type EmotionParameters, type EmotionPreset, type VoiceStyle, type VoiceStylingRequest } from "./voiceStyling";
export { ragApi, type DocumentIngestRequest, type DocumentIngestResponse, type QueryRequest, type QueryResponse, type Citation, type WebResult, type RAGStats, type RAGDocument } from "./rag";
export { qwenTtsApi, type SpeechGenerationRequest, type SpeechGenerationResponse, type VoiceInfo, type LanguageInfo, type TTSInfo } from "./qwenTts";
export { websocketService, ProjectWebSocket, type ProgressMessage, type ProgressCallback } from "./websocket";
export { emotionPresetsService as emotionPresetsApi, emotionPresetsService, type ScenarioPreset } from "./emotionPresets";

// New advanced audio services
export { voiceAdvancedApi } from "./voiceAdvanced";
export { audioProcessorApi } from "./audioProcessor";
export { cosyVoiceApi } from "./cosyVoice";
export { rateLimitApi } from "./rateLimit";
export { soundEffectsApi } from "./soundEffects";

// Re-export commonly used types from rate limit service
export type {
  RateLimitStatus,
  RateLimitStats,
  QuotaTiers,
} from "./rateLimit";

// Re-export commonly used types from sound effects service
export type {
  SoundEffectPack,
  SoundEffect,
  SoundEffectTemplate,
  SoundEffectCreate,
} from "./soundEffects";

// Re-export commonly used types from advanced services
export type {
  // SSML
  SSMLGenerateRequest,
  SSMLResponse,
  SSMLParseRequest,
  SSMLParseResponse,
  SSMLElement,
  // Prosody
  ProsodyPreset,
  ProsodyApplyRequest,
  ProsodyApplyResponse,
  SentenceAdjustment,
  WordEmphasis,
  // VAD
  VADDetectRequest,
  VADDetectResponse,
  VADSegment,
  // Speaker Analysis
  SpeakerAnalyzeRequest,
  SpeakerAnalyzeResponse,
  SpeakerFeatures,
  // Emotion Recognition
  EmotionRecognizeRequest,
  EmotionRecognizeResponse,
  EmotionScores,
  EmotionSegment,
  // Comprehensive Analysis
  ComprehensiveAnalyzeRequest,
  ComprehensiveAnalysisResponse,
  // Voice Profiles
  VoiceProfile,
  VoiceProfileCreate,
  // Enhancement
  EnhanceRequest,
  EnhanceResponse,
  // Translation
  TranslateRequest,
  TranslateResponse,
  // Quality
  QualityScoreRequest,
  QualityScoreResponse,
  QualityMetrics,
} from "./voiceAdvanced";

export type {
  // Audio Mixing
  AudioMixRequest,
  AudioMixResponse,
  // Multi-Speaker Dialogue
  DialogueSegment,
  GenerateDialogueRequest,
  GenerateDialogueResponse,
  VoiceConfigForSpeaker,
  // Text Segmentation
  SegmentTextRequest,
  SegmentTextResponse,
  TextSegment,
  // Streaming TTS
  StreamingTTSRequest,
  StreamingTTSResponse,
  StreamingTTSChunk,
  // RVC
  RVCConvertRequest,
  RVCConvertResponse,
  // Audio Quality
  AudioQualityCheckRequest,
  AudioQualityCheckResponse,
  AudioQualityBatchRequest,
  AudioQualityBatchResponse,
} from "./audioProcessor";
