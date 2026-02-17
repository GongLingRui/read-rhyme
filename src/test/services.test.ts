/**
 * Frontend Services Tests
 * Tests API client and services
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, ApiResponse } from "../services/api";
import axios from "axios";

// Mock axios
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe("ApiClient", () => {
  let apiClient: ApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create mock axios instance
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    (axios.create as any).mockReturnValue(mockAxiosInstance);
    apiClient = new ApiClient({ baseURL: "http://localhost:8000/api" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Token Management", () => {
    it("should set token correctly", () => {
      apiClient.setToken("test-token");
      expect((apiClient as any).token).toBe("test-token");
    });

    it("should clear token correctly", () => {
      apiClient.setToken("test-token");
      apiClient.clearToken();
      expect((apiClient as any).token).toBeNull();
    });
  });

  describe("HTTP Methods", () => {
    it("should make GET request", async () => {
      const mockResponse = { success: true, data: { result: "test" } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get("/test");
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/test", {});
    });

    it("should make GET request with params", async () => {
      const mockResponse = { success: true, data: { result: "test" } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 10 };
      const result = await apiClient.get("/test", params);
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/test", { params });
    });

    it("should make POST request", async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const data = { name: "test" };
      const result = await apiClient.post("/test", data);
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/test", data);
    });

    it("should make PUT request", async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const data = { name: "updated" };
      const result = await apiClient.put("/test/1", data);
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith("/test/1", data);
    });

    it("should make PATCH request", async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const data = { name: "patched" };
      const result = await apiClient.patch("/test/1", data);
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith("/test/1", data);
    });

    it("should make DELETE request", async () => {
      const mockResponse = { success: true, data: null };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiClient.delete("/test/1");
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/test/1");
    });
  });

  describe("Upload", () => {
    it("should upload file with progress callback", async () => {
      const mockResponse = { success: true, data: { url: "http://example.com/file" } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "test.txt");
      const onProgress = vi.fn();

      const result = await apiClient.upload("/upload", formData, onProgress);
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/upload",
        formData,
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 300000,
          onUploadProgress: expect.any(Function),
        })
      );
    });
  });
});

/**
 * API Response Interface Tests
 */
describe("ApiResponse Interface", () => {
  it("should accept successful response", () => {
    const response: ApiResponse<{ test: string }> = {
      success: true,
      data: { test: "value" },
    };
    expect(response.success).toBe(true);
    expect(response.data?.test).toBe("value");
  });

  it("should accept error response", () => {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "TEST_ERROR",
        message: "Test error message",
      },
    };
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("TEST_ERROR");
  });

  it("should accept response with both data and error", () => {
    const response: ApiResponse = {
      success: false,
      data: { partial: "result" },
      error: {
        code: "PARTIAL_ERROR",
        message: "Partial error",
      },
    };
    expect(response.data?.partial).toBe("result");
    expect(response.error?.message).toBe("Partial error");
  });
});

/**
 * Integration-style tests for service methods
 * These test the expected behavior without actually calling the backend
 */
describe("Service Integration Tests", () => {
  it("should import voices service", async () => {
    const voices = await import("../services/voices");
    expect(voices).toBeDefined();
    expect(voices.voicesApi).toBeDefined();
  });

  it("should import voice styling service", async () => {
    const voiceStyling = await import("../services/voiceStyling");
    expect(voiceStyling).toBeDefined();
    expect(voiceStyling.voiceStylingApi).toBeDefined();
  });

  it("should import RAG service", async () => {
    const rag = await import("../services/rag");
    expect(rag).toBeDefined();
    expect(rag.ragApi).toBeDefined();
  });

  it("should import auth service", async () => {
    const auth = await import("../services/auth");
    expect(auth).toBeDefined();
    expect(auth.authService).toBeDefined();
  });

  it("should import books service", async () => {
    const books = await import("../services/books");
    expect(books).toBeDefined();
    expect(books.booksApi).toBeDefined();
  });

  it("should import projects service", async () => {
    const projects = await import("../services/projects");
    expect(projects).toBeDefined();
    expect(projects.projectsApi).toBeDefined();
  });

  it("should import scripts service", async () => {
    const scripts = await import("../services/scripts");
    expect(scripts).toBeDefined();
    expect(scripts.scriptsApi).toBeDefined();
  });

  it("should import audio service", async () => {
    const audio = await import("../services/audio");
    expect(audio).toBeDefined();
    expect(audio.audioApi).toBeDefined();
  });

  it("should import websocket service", async () => {
    const websocket = await import("../services/websocket");
    expect(websocket).toBeDefined();
    expect(websocket.websocketService).toBeDefined();
  });

  // New advanced services
  it("should import voice advanced service", async () => {
    const voiceAdvanced = await import("../services/voiceAdvanced");
    expect(voiceAdvanced).toBeDefined();
    expect(voiceAdvanced.voiceAdvancedApi).toBeDefined();
  });

  it("should import audio processor service", async () => {
    const audioProcessor = await import("../services/audioProcessor");
    expect(audioProcessor).toBeDefined();
    expect(audioProcessor.audioProcessorApi).toBeDefined();
  });

  it("should import cosy voice service", async () => {
    const cosyVoice = await import("../services/cosyVoice");
    expect(cosyVoice).toBeDefined();
    expect(cosyVoice.cosyVoiceApi).toBeDefined();
  });

  it("should import rate limit service", async () => {
    const rateLimit = await import("../services/rateLimit");
    expect(rateLimit).toBeDefined();
    expect(rateLimit.rateLimitApi).toBeDefined();
  });

  it("should import sound effects service", async () => {
    const soundEffects = await import("../services/soundEffects");
    expect(soundEffects).toBeDefined();
    expect(soundEffects.soundEffectsApi).toBeDefined();
  });
});
