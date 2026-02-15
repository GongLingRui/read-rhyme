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
export { authService, type User, type LoginRequest, type RegisterRequest, type AuthResponse } from "./auth";
export { voiceStylingApi, type EmotionParameters, type EmotionPreset, type VoiceStyle, type VoiceStylingRequest } from "./voiceStyling";
export { ragApi, type DocumentIngestRequest, type DocumentIngestResponse, type QueryRequest, type QueryResponse, type Citation, type WebResult, type RAGStats, type RAGDocument } from "./rag";
export { qwenTtsApi, type SpeechGenerationRequest, type SpeechGenerationResponse, type VoiceInfo, type LanguageInfo, type TTSInfo } from "./qwenTts";
export { websocketService, ProjectWebSocket, type ProgressMessage, type ProgressCallback } from "./websocket";
export { emotionPresetsService, type ScenarioPreset } from "./emotionPresets";
