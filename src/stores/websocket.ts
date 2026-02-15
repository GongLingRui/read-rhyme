/**
 * WebSocket Progress Store
 * Manages real-time progress updates from backend via WebSocket
 */

import { create } from 'zustand';
import { websocketService, ProgressMessage } from '@/services';

interface ProgressState {
  isConnected: boolean;
  current: number;
  total: number;
  percentage: number;
  status: string;
  currentChunkId: string | null;
  error: string | null;
  etaSeconds: number | null;
  completedChunks: string[];
  failedChunks: Set<string>;
  logs: string[];
}

interface WebSocketStore extends ProgressState {
  connect: (projectId: string) => Promise<void>;
  disconnect: () => void;
  reset: () => void;
  addLog: (message: string) => void;
  handleMessage: (message: ProgressMessage) => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  // State
  isConnected: false,
  current: 0,
  total: 0,
  percentage: 0,
  status: 'idle',
  currentChunkId: null,
  error: null,
  etaSeconds: null,
  completedChunks: [],
  failedChunks: new Set<string>(),
  logs: [],

  // Actions
  connect: async (projectId: string) => {
    try {
      const ws = websocketService.connect(projectId);

      // Register message handler
      ws.onProgress((message: ProgressMessage) => {
        get().handleMessage(message);
      });

      // Wait for connection
      await ws.connect();

      set({ isConnected: ws.isConnected() });
      get().addLog('已连接到实时进度更新');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      get().addLog(`连接失败: ${error}`);
    }
  },

  disconnect: () => {
    const state = get();
    const projectId = state.logs[0]?.match(/project (\w+)/)?.[1]; // Extract project ID from logs if needed

    if (projectId) {
      websocketService.disconnect(projectId);
    }

    set({
      isConnected: false,
      status: 'idle'
    });
  },

  reset: () => {
    set({
      current: 0,
      total: 0,
      percentage: 0,
      status: 'idle',
      currentChunkId: null,
      error: null,
      etaSeconds: null,
      completedChunks: [],
      failedChunks: new Set<string>(),
      logs: [],
    });
  },

  addLog: (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      logs: [...state.logs, `[${timestamp}] ${message}`]
    }));
  },

  handleMessage: (message: ProgressMessage) => {
    const state = get();

    switch (message.type) {
      case 'connected':
        set({ isConnected: true });
        get().addLog(message.message || '已连接');
        break;

      case 'progress':
        const data = message.data;
        set({
          current: data.current || 0,
          total: data.total || 0,
          percentage: data.percentage || 0,
          status: data.status || 'processing',
          currentChunkId: data.chunk_id || null,
          error: data.error || null,
          etaSeconds: data.eta_seconds || null,
        });

        if (data.status) {
          get().addLog(`进度: ${data.current}/${data.total} (${data.percentage}%) - ${data.status}`);
        }
        break;

      case 'chunk_completed':
        if (message.data?.chunk_id) {
          set((state) => ({
            completedChunks: [...state.completedChunks, message.data!.chunk_id!]
          }));
          get().addLog(`完成: ${message.data.chunk_id} (${message.data.duration?.toFixed(1)}s)`);
        }
        break;

      case 'generation_complete':
        const completeData = message.data;
        set({
          status: 'completed',
          percentage: 100,
        });
        get().addLog(`生成完成! 总计: ${completeData?.total_chunks}, 成功: ${completeData?.succeeded}, 失败: ${completeData?.failed}`);
        break;

      case 'error':
        set({
          error: message.data?.error_message || '未知错误',
          status: 'error',
        });
        get().addLog(`错误: ${message.data?.error_type} - ${message.data?.error_message}`);
        break;

      case 'heartbeat':
        // Ignore heartbeat, just for keep-alive
        break;
    }
  },
}));
