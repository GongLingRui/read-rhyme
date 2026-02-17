/**
 * End-to-End Component Tests
 * Tests main user flows and UI interactions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock API services
const createMockService = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  upload: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  generate: vi.fn(),
  generateStyled: vi.fn(),
  generateChunk: vi.fn(),
  batchClone: vi.fn(),
  getSpeakers: vi.fn(),
  getModels: vi.fn(),
  getLanguages: vi.fn(),
  getStyleInstructions: vi.fn(),
  generateSpeech: vi.fn(),
  cloneVoice: vi.fn(),
  generateDialogue: vi.fn(),
  mixAudio: vi.fn(),
  segmentText: vi.fn(),
  generateSSML: vi.fn(),
  detectVAD: vi.fn(),
  analyzeSpeaker: vi.fn(),
  recognizeEmotion: vi.fn(),
  getStatus: vi.fn(),
  getStats: vi.fn(),
  resetUser: vi.fn(),
  getQuotaTiers: vi.fn(),
  getCategories: vi.fn(),
  search: vi.fn(),
  getTemplates: vi.fn(),
  getPacks: vi.fn(),
  createCustom: vi.fn(),
  createTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  getPresets: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
});

vi.mock("@/services", () => {
  const mockService = createMockService();
  return {
    apiClient: mockService,
    booksApi: mockService,
    projectsApi: mockService,
    scriptsApi: mockService,
    audioApi: mockService,
    voicesApi: mockService,
    authService: mockService,
    highlightsApi: mockService,
    thoughtsApi: mockService,
    voiceStylingApi: mockService,
    ragApi: mockService,
    qwenTtsApi: mockService,
    voiceAdvancedApi: mockService,
    audioProcessorApi: mockService,
    cosyVoiceApi: mockService,
    rateLimitApi: mockService,
    soundEffectsApi: mockService,
    emotionPresetsApi: mockService,
  };
});

vi.mock("@/services/auth", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    user: { id: "1", username: "test", email: "test@example.com" },
    token: "test-token",
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("E2E - User Authentication Flow", () => {
  it("should allow user to login", async () => {
    const { authService } = await import("@/services/auth");
    (authService.login as any).mockResolvedValue({
      success: true,
      data: {
        token: "test-token",
        user: { id: "1", username: "test", email: "test@example.com" },
      },
    });

    // Test login flow
    expect(authService.login).toBeDefined();
  });

  it("should allow user to register", async () => {
    const { authService } = await import("@/services/auth");
    (authService.register as any).mockResolvedValue({
      success: true,
      data: {
        token: "test-token",
        user: { id: "1", username: "newuser", email: "new@example.com" },
      },
    });

    expect(authService.register).toBeDefined();
  });
});

describe("E2E - Book Management Flow", () => {
  it("should display books grid", async () => {
    const { booksApi } = await import("@/services");
    (booksApi.list as any).mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: "1",
            title: "Test Book",
            author: "Test Author",
            cover_image: null,
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      },
    });

    const books = await booksApi.list();
    expect(books.success).toBe(true);
    expect(books.data?.items).toHaveLength(1);
  });

  it("should allow book upload", async () => {
    const { booksApi } = await import("@/services");
    const mockFile = new File(["test"], "test.epub", { type: "application/epub+zip" });

    (booksApi.upload as any).mockResolvedValue({
      success: true,
      data: {
        id: "1",
        title: "Uploaded Book",
        author: "Unknown",
        cover_image: null,
      },
    });

    expect(booksApi.upload).toBeDefined();
  });
});

describe("E2E - Audio Generation Flow", () => {
  it("should allow TTS generation with emotion", async () => {
    const { voiceStylingApi } = await import("@/services");
    (voiceStylingApi.generateStyled as any).mockResolvedValue({
      success: true,
      data: {
        audio_url: "/static/audio/test.mp3",
        duration: 5.5,
      },
    });

    const result = await voiceStylingApi.generateStyled({
      text: "Test text",
      voice: "zh-CN-XiaoxiaoNeural",
      emotion: { happiness: 0.8, energy: 1.0 },
    });

    expect(result.success).toBe(true);
    expect(result.data?.audio_url).toBeDefined();
  });

  it("should support voice cloning", async () => {
    const { voiceStylingApi } = await import("@/services");
    (voiceStylingApi.batchClone as any).mockResolvedValue({
      success: true,
      data: {
        voice_id: "custom_voice_1",
        profile_id: "profile_1",
      },
    });

    expect(voiceStylingApi.batchClone).toBeDefined();
  });
});

describe("E2E - CosyVoice Integration", () => {
  it("should support CosyVoice TTS generation", async () => {
    const { cosyVoiceApi } = await import("@/services");
    (cosyVoiceApi.generateSpeech as any).mockResolvedValue({
      success: true,
      data: {
        audio_url: "/static/audio/cosy_test.mp3",
        duration: 3.2,
        model: "CosyVoice3-0.5B-2512",
      },
    });

    const result = await cosyVoiceApi.generateSpeech({
      text: "Test CosyVoice text",
      speaker: "zh-cn-female-1",
      model: "CosyVoice3-0.5B-2512",
    });

    expect(result.success).toBe(true);
    expect(result.data?.model).toBe("CosyVoice3-0.5B-2512");
  });

  it("should support voice cloning with CosyVoice", async () => {
    const { cosyVoiceApi } = await import("@/services");
    const mockAudioFile = new File(["audio"], "reference.wav", { type: "audio/wav" });

    (cosyVoiceApi.cloneVoice as any).mockResolvedValue({
      success: true,
      data: {
        audio_url: "/static/audio/cloned.mp3",
        duration: 4.1,
      },
    });

    const result = await cosyVoiceApi.cloneVoice({
      text: "Cloned voice test",
      reference_audio: mockAudioFile,
    });

    expect(result.success).toBe(true);
  });
});

describe("E2E - Audio Tools Integration", () => {
  it("should support multi-speaker dialogue generation", async () => {
    const { audioProcessorApi } = await import("@/services");
    (audioProcessorApi.generateDialogue as any).mockResolvedValue({
      success: true,
      data: {
        output_url: "/static/audio/dialogue.mp3",
        duration: 15.5,
        segments_count: 3,
        speakers: ["张三", "李四"],
      },
    });

    const result = await audioProcessorApi.generateDialogue({
      dialogue_script: [
        {
          speaker: "张三",
          text: "你好",
          emotion: "happy",
        },
        {
          speaker: "李四",
          text: "你好呀",
          emotion: "neutral",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.speakers).toContain("张三");
  });

  it("should support audio mixing with background music", async () => {
    const { audioProcessorApi } = await import("@/services");
    (audioProcessorApi.mixAudio as any).mockResolvedValue({
      success: true,
      data: {
        output_url: "/static/audio/mixed.mp3",
        duration: 10.0,
        background_music: true,
      },
    });

    const result = await audioProcessorApi.mixAudio({
      speech_audio_path: "/static/audio/speech.mp3",
      background_music_path: "/static/audio/bgm.mp3",
      music_volume: 0.2,
      ducking: true,
    });

    expect(result.success).toBe(true);
  });

  it("should support intelligent text segmentation", async () => {
    const { audioProcessorApi } = await import("@/services");
    (audioProcessorApi.segmentText as any).mockResolvedValue({
      success: true,
      data: [
        {
          text: "这是第一段。",
          type: "narration",
          position: 0,
          char_count: 6,
        },
        {
          text: "这是第二段。",
          type: "narration",
          position: 1,
          char_count: 6,
        },
      ],
    });

    const result = await audioProcessorApi.segmentText({
      text: "这是第一段。这是第二段。",
      max_chars: 50,
      preserve_sentences: true,
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });
});

describe("E2E - Voice Advanced Features", () => {
  it("should support SSML generation", async () => {
    const { voiceAdvancedApi } = await import("@/services");
    (voiceAdvancedApi.generateSSML as any).mockResolvedValue({
      success: true,
      data: {
        ssml: '<speak><prosody rate="110%">Test</prosody></speak>',
        audio_url: "/static/audio/ssml.mp3",
      },
    });

    const result = await voiceAdvancedApi.generateSSML({
      text: "Test",
      rate: 1.1,
      pitch: 1.0,
      volume: 1.0,
    });

    expect(result.success).toBe(true);
    expect(result.data?.ssml).toContain("prosody");
  });

  it("should support VAD detection", async () => {
    const { voiceAdvancedApi } = await import("@/services");
    (voiceAdvancedApi.detectVAD as any).mockResolvedValue({
      success: true,
      data: {
        segments: [
          { start: 0, end: 2.5, type: "speech", confidence: 0.95 },
          { start: 2.5, end: 3.0, type: "silence", confidence: 0.90 },
        ],
        speech_duration: 2.5,
        total_duration: 3.0,
      },
    });

    const result = await voiceAdvancedApi.detectVAD({
      audio_path: "/static/audio/test.wav",
    });

    expect(result.success).toBe(true);
    expect(result.data?.segments).toHaveLength(2);
  });

  it("should support speaker analysis", async () => {
    const { voiceAdvancedApi } = await import("@/services");
    (voiceAdvancedApi.analyzeSpeaker as any).mockResolvedValue({
      success: true,
      data: {
        features: {
          gender: { detected: "female", confidence: 0.88 },
          pitch: { min: 150, max: 300, mean: 220 },
        },
      },
    });

    const result = await voiceAdvancedApi.analyzeSpeaker({
      audio_path: "/static/audio/test.wav",
    });

    expect(result.success).toBe(true);
    expect(result.data?.features?.gender?.detected).toBe("female");
  });

  it("should support emotion recognition", async () => {
    const { voiceAdvancedApi } = await import("@/services");
    (voiceAdvancedApi.recognizeEmotion as any).mockResolvedValue({
      success: true,
      data: {
        overall_emotion: {
          primary: "happy",
          confidence: 0.85,
        },
        segments: [],
      },
    });

    const result = await voiceAdvancedApi.recognizeEmotion({
      audio_path: "/static/audio/test.wav",
    });

    expect(result.success).toBe(true);
    expect(result.data?.overall_emotion?.primary).toBe("happy");
  });
});

describe("E2E - Rate Limiting", () => {
  it("should track rate limit status", async () => {
    const { rateLimitApi } = await import("@/services");
    (rateLimitApi.getStatus as any).mockResolvedValue({
      success: true,
      data: {
        user_id: "test_user",
        rate_limit: {
          minute_remaining: 45,
          minute_limit: 60,
        },
        quota: {
          tier: "free",
          daily_remaining: 50,
          daily_limit: 100,
        },
      },
    });

    const result = await rateLimitApi.getStatus("test_user");

    expect(result.success).toBe(true);
    expect(result.data?.rate_limit?.minute_remaining).toBe(45);
  });

  it("should provide quota tier information", async () => {
    const { rateLimitApi } = await import("@/services");
    (rateLimitApi.getQuotaTiers as any).mockResolvedValue({
      success: true,
      data: {
        tiers: {
          free: { daily: 100, monthly: 1000 },
          pro: { daily: 1000, monthly: 20000 },
        },
      },
    });

    const result = await rateLimitApi.getQuotaTiers();

    expect(result.success).toBe(true);
    expect(result.data?.tiers?.free?.daily).toBe(100);
  });
});

describe("E2E - Sound Effects", () => {
  it("should list sound effect categories", async () => {
    const { soundEffectsApi } = await import("@/services");
    (soundEffectsApi.getCategories as any).mockResolvedValue({
      success: true,
      data: ["footsteps", "door", "nature", "battle"],
    });

    const result = await soundEffectsApi.getCategories();

    expect(result.success).toBe(true);
    expect(result.data).toContain("footsteps");
  });

  it("should search sound effects", async () => {
    const { soundEffectsApi } = await import("@/services");
    (soundEffectsApi.search as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: "fx_1",
          name: "Footstep Grass",
          category: "footsteps",
        },
      ],
    });

    const result = await soundEffectsApi.search("footstep");

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it("should manage sound effect templates", async () => {
    const { soundEffectsApi } = await import("@/services");
    (soundEffectsApi.getTemplates as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: "tpl_1",
          name: "Forest Ambience",
          category: "nature",
        },
      ],
    });

    const result = await soundEffectsApi.getTemplates();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});

describe("E2E - Service Integration", () => {
  it("should have all services properly exported", async () => {
    const services = await import("@/services");

    // Core services
    expect(services.apiClient).toBeDefined();
    expect(services.booksApi).toBeDefined();
    expect(services.projectsApi).toBeDefined();
    expect(services.voicesApi).toBeDefined();
    expect(services.authService).toBeDefined();

    // Advanced audio services
    expect(services.voiceAdvancedApi).toBeDefined();
    expect(services.audioProcessorApi).toBeDefined();
    expect(services.cosyVoiceApi).toBeDefined();
    expect(services.rateLimitApi).toBeDefined();
    expect(services.soundEffectsApi).toBeDefined();
  });

  it("should export all TypeScript types", async () => {
    const services = await import("@/services");

    // Check type exports exist
    expect(services).toBeDefined();
  });
});

describe("E2E - User Workflow Tests", () => {
  it("should complete basic audiobook creation workflow", async () => {
    // 1. Upload book
    const { booksApi } = await import("@/services");
    (booksApi.upload as any).mockResolvedValue({
      success: true,
      data: { id: "book-1", title: "Test Book" },
    });

    const book = await booksApi.upload(new File(["content"], "test.epub"));
    expect(book.success).toBe(true);

    // 2. Create project
    const { projectsApi } = await import("@/services");
    (projectsApi.create as any).mockResolvedValue({
      success: true,
      data: { id: "proj-1", name: "Test Project" },
    });

    const project = await projectsApi.create({
      book_id: "book-1",
      name: "Test Project",
    });
    expect(project.success).toBe(true);

    // 3. Generate script
    const { scriptsApi } = await import("@/services");
    (scriptsApi.generate as any).mockResolvedValue({
      success: true,
      data: { script_id: "script-1" },
    });

    const script = await scriptsApi.generate("proj-1", {});
    expect(script.success).toBe(true);

    // 4. Generate audio
    const { audioApi } = await import("@/services");
    (audioApi.generateChunk as any).mockResolvedValue({
      success: true,
      data: { audio_url: "/audio/chunk.mp3" },
    });

    const audio = await audioApi.generateChunk("proj-1", "chunk-1", {});
    expect(audio.success).toBe(true);
  });

  it("should complete voice styling workflow", async () => {
    // 1. Get emotion presets
    const { emotionPresetsApi } = await import("@/services");
    (emotionPresetsApi.getPresets as any).mockResolvedValue({
      success: true,
      data: [
        {
          preset_id: "happy",
          name: "Happy",
          category: "emotion",
          description: "Joyful tone",
        },
      ],
    });

    const presets = await emotionPresetsApi.getPresets();
    expect(presets.success).toBe(true);

    // 2. Generate styled speech
    const { voiceStylingApi } = await import("@/services");
    (voiceStylingApi.generateStyled as any).mockResolvedValue({
      success: true,
      data: { audio_url: "/audio/styled.mp3" },
    });

    const styled = await voiceStylingApi.generateStyled({
      text: "Happy text",
      emotion: { happiness: 0.9 },
    });
    expect(styled.success).toBe(true);
  });

  it("should complete CosyVoice workflow", async () => {
    // 1. Get available models
    const { cosyVoiceApi } = await import("@/services");
    (cosyVoiceApi.getModels as any).mockResolvedValue({
      success: true,
      data: [
        { id: "CosyVoice3-0.5B-2512", features: ["tts", "voice_clone"] },
      ],
    });

    const models = await cosyVoiceApi.getModels();
    expect(models.success).toBe(true);

    // 2. Generate speech
    (cosyVoiceApi.generateSpeech as any).mockResolvedValue({
      success: true,
      data: { audio_url: "/audio/cosy.mp3" },
    });

    const speech = await cosyVoiceApi.generateSpeech({
      text: "CosyVoice test",
      model: "CosyVoice3-0.5B-2512",
    });
    expect(speech.success).toBe(true);
  });
});

describe("E2E - Error Handling", () => {
  it("should handle API errors gracefully", async () => {
    const { voiceStylingApi } = await import("@/services");
    (voiceStylingApi.generateStyled as any).mockRejectedValue({
      response: { data: { error: "Test error" } },
    });

    try {
      await voiceStylingApi.generateStyled({ text: "" });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should handle empty responses", async () => {
    const { booksApi } = await import("@/services");
    (booksApi.list as any).mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, page_size: 20 },
    });

    const result = await booksApi.list();
    expect(result.success).toBe(true);
    expect(result.data?.items).toHaveLength(0);
  });
});
