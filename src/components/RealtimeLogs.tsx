/**
 * Realtime Logs Component
 * Displays live logs from WebSocket connections
 */

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2, Download, Maximize2, Minimize2 } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warning" | "error" | "success" | "debug";
  message: string;
  source?: string;
}

export function RealtimeLogs({ logs, onClear }: { logs: LogEntry[]; onClear?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, expanded]);

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "success":
        return "✅";
      case "debug":
        return "🔍";
      default:
        return "•";
    }
  };

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "text-blue-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      case "success":
        return "text-green-600";
      case "debug":
        return "text-gray-500";
      default:
        return "text-gray-600";
    }
  };

  const handleExport = () => {
    const logText = logs
      .map(
        (log) => `[${log.timestamp}] [${log.level.toUpperCase()}]${log.source ? ` [${log.source}]` : ""} ${log.message}`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>实时日志</CardTitle>
            <Badge variant="outline">{logs.length} 条</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "收起" : "展开"}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} title="导出日志">
              <Download className="h-4 w-4" />
            </Button>
            {onClear && (
              <Button variant="ghost" size="sm" onClick={onClear} title="清空日志">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {expanded ? "实时显示系统日志" : "显示最近 50 条日志"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className={expanded ? "h-[600px]" : "h-[300px]"}>
          <div ref={scrollRef} className="space-y-1 pr-4">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <p>暂无日志</p>
              </div>
            ) : (
              logs
                .slice(expanded ? undefined : -50)
                .reverse()
                .map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 font-mono text-xs"
                  >
                    <span className="shrink-0">{getLevelIcon(log.level)}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.source && (
                      <Badge variant="outline" className="shrink-0 text-xs h-5">
                        {log.source}
                      </Badge>
                    )}
                    <span className={getLevelColor(log.level)}>{log.message}</span>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
