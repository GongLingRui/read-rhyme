/**
 * Real-time Audio Generation Progress Component
 * Displays live progress updates via WebSocket
 */

import React, { useEffect, useState } from 'react';
import { useWebSocketStore } from '@/stores/websocket';
import { Loader2, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioProgressProps {
  projectId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const AudioProgress: React.FC<AudioProgressProps> = ({
  projectId,
  onComplete,
  onError,
  className = '',
}) => {
  const {
    isConnected,
    current,
    total,
    percentage,
    status,
    currentChunkId,
    error,
    etaSeconds,
    completedChunks,
    failedChunks,
    logs,
    connect,
    disconnect,
  } = useWebSocketStore();

  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    connect(projectId);

    return () => {
      disconnect();
    };
  }, [projectId, connect, disconnect]);

  useEffect(() => {
    if (status === 'completed' && onComplete) {
      onComplete();
    }
  }, [status, onComplete]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`audio-progress ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-xs text-gray-600">
          {isConnected ? '实时连接中' : '连接断开'}
        </span>
      </div>

      {/* Main Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {status === 'processing' ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : status === 'error' ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {status === 'processing' ? '生成中...' : status === 'completed' ? '已完成' : status === 'error' ? '出错了' : '等待中'}
            </span>
          </div>

          <span className="text-sm font-bold text-blue-600">{percentage.toFixed(1)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {current} / {total} 个音频块
          </span>
          {etaSeconds && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>预计剩余: {formatTime(etaSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-900">已完成</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{completedChunks.length}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-900">处理中</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{status === 'processing' ? 1 : 0}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-900">失败</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{failedChunks.size}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">生成错误</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Chunk Info */}
      {currentChunkId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-xs font-medium text-blue-900 mb-1">当前处理</p>
          <p className="text-sm text-blue-700 font-mono">{currentChunkId}</p>
        </div>
      )}

      {/* Logs Toggle */}
      {logs.length > 0 && (
        <div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">详细日志</span>
            <motion.div
              animate={{ rotate: showLogs ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon />
            </motion.div>
          </button>

          <AnimatePresence>
            {showLogs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-300 mb-1 last:mb-0">
                      {log}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
