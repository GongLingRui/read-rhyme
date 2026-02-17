/**
 * Logs Store
 * Manages system logs from WebSocket and other sources
 */

import { create } from "zustand";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success" | "debug";
  message: string;
  source?: string;
}

interface LogsStore {
  logs: LogEntry[];
  maxLogs: number;

  // Actions
  addLog: (level: LogEntry["level"], message: string, source?: string) => void;
  addLogs: (logs: Omit<LogEntry, "id" | "timestamp">[]) => void;
  clearLogs: () => void;
  getLogs: () => LogEntry[];

  // Helper methods
  info: (message: string, source?: string) => void;
  warning: (message: string, source?: string) => void;
  error: (message: string, source?: string) => void;
  success: (message: string, source?: string) => void;
  debug: (message: string, source?: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useLogsStore = create<LogsStore>((set, get) => ({
  logs: [],
  maxLogs: 1000,

  addLog: (level, message, source) => {
    const log: LogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
    };

    set((state) => {
      const newLogs = [log, ...state.logs];
      // Keep only the most recent logs
      if (newLogs.length > state.maxLogs) {
        return { logs: newLogs.slice(0, state.maxLogs) };
      }
      return { logs: newLogs };
    });

    // Also log to console for debugging
    const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
    console[consoleMethod](`[${source || "System"}] ${message}`);
  },

  addLogs: (logs) => {
    const newLogsWithId: LogEntry[] = logs.map((log) => ({
      ...log,
      id: generateId(),
      timestamp: log.timestamp || new Date().toISOString(),
    }));

    set((state) => {
      const combinedLogs = [...newLogsWithId, ...state.logs];
      if (combinedLogs.length > state.maxLogs) {
        return { logs: combinedLogs.slice(0, state.maxLogs) };
      }
      return { logs: combinedLogs };
    });
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  getLogs: () => {
    return get().logs;
  },

  // Helper methods
  info: (message, source) => get().addLog("info", message, source),
  warning: (message, source) => get().addLog("warning", message, source),
  error: (message, source) => get().addLog("error", message, source),
  success: (message, source) => get().addLog("success", message, source),
  debug: (message, source) => get().addLog("debug", message, source),
}));
