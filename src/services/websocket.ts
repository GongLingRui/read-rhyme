/**
 * WebSocket Service for Real-time Progress Updates
 */

type ProgressMessage = {
  type: 'connected' | 'progress' | 'chunk_completed' | 'generation_complete' | 'error' | 'heartbeat' | 'pong';
  project_id: string;
  timestamp: string;
  message?: string;
  data?: {
    // progress data
    current?: number;
    total?: number;
    percentage?: number;
    status?: string;
    chunk_id?: string;
    error?: string;
    eta_seconds?: number;
    // chunk completed data
    duration?: number;
    // generation complete data
    total_chunks?: number;
    succeeded?: number;
    failed?: number;
    total_duration?: number;
    success_rate?: number;
    // error data
    error_type?: string;
    error_message?: string;
  };
};

type ProgressCallback = (message: ProgressMessage) => void;

export class ProjectWebSocket {
  private ws: WebSocket | null = null;
  private projectId: string;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualClose = false;
  private callbacks: Set<ProgressCallback> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(projectId: string, token?: string) {
    this.projectId = projectId;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname;
    const wsPort = import.meta.env.VITE_API_BASE_URL?.replace(/https?:\/\/([^/:]+).*$/, '$1') || 'localhost:8000';
    const tokenParam = token ? `?token=${token}` : '';
    this.url = `${wsProtocol}//${wsPort}/api/ws/projects/${projectId}/progress${tokenParam}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.isManualClose = false;

        this.ws.onopen = () => {
          console.log(`WebSocket connected for project ${this.projectId}`);
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: ProgressMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.stopHeartbeat();

          // Attempt reconnection if not manual close
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
          }
        };

      } catch (e) {
        reject(e);
      }
    });
  }

  disconnect() {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
  }

  onProgress(callback: ProgressCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private handleMessage(message: ProgressMessage) {
    // Notify all registered callbacks
    this.callbacks.forEach(callback => callback(message));

    // Handle specific message types
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connected:', message.message);
        break;
      case 'error':
        console.error('WebSocket error:', message.data?.error_message);
        break;
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

class WebSocketServiceManager {
  connections: Map<string, ProjectWebSocket>;

  constructor() {
    this.connections = new Map();
  }

  connect(projectId: string, token?: string): ProjectWebSocket {
    // Return existing connection if available
    const existing = this.connections.get(projectId);
    if (existing && existing.isConnected()) {
      return existing;
    }

    // Create new connection
    const ws = new ProjectWebSocket(projectId, token);
    this.connections.set(projectId, ws);
    ws.connect().catch(console.error);

    return ws;
  }

  disconnect(projectId: string) {
    const ws = this.connections.get(projectId);
    if (ws) {
      ws.disconnect();
      this.connections.delete(projectId);
    }
  }

  disconnectAll() {
    this.connections.forEach((ws, projectId) => {
      ws.disconnect();
    });
    this.connections.clear();
  }
}

export const websocketService = new WebSocketServiceManager();
