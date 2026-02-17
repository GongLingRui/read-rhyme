/**
 * Audio Waveform Component
 * Visualizes audio waveform with interactive editing capabilities
 */

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WaveformRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  label?: string;
}

interface AudioWaveformProps {
  audioUrl: string;
  regions?: WaveformRegion[];
  onRegionSelect?: (region: WaveformRegion) => void;
  onRegionDelete?: (regionId: string) => void;
  showControls?: boolean;
  height?: number;
  editable?: boolean;
}

export default function AudioWaveform({
  audioUrl,
  regions = [],
  onRegionSelect,
  onRegionDelete,
  showControls = true,
  height = 128,
  editable = false,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<WaveformRegion | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    const audio = audioRef.current;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const drawWaveform = async () => {
      try {
        // Create audio context for waveform data
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / (rect.width * zoom));
        const amp = height / 2;

        ctx.clearRect(0, 0, rect.width, height);

        // Draw waveform
        ctx.fillStyle = "#3b82f6";
        for (let i = 0; i < rect.width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = data[(i * step + j) * zoom];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        // Draw regions
        regions.forEach((region) => {
          const startX = (region.start / duration) * rect.width;
          const endX = (region.end / duration) * rect.width;
          const regionWidth = endX - startX;

          ctx.fillStyle = region.color || "rgba(59, 130, 246, 0.3)";
          ctx.fillRect(startX, 0, regionWidth, height);

          if (region.label) {
            ctx.fillStyle = "#1e293b";
            ctx.font = "12px sans-serif";
            ctx.fillText(region.label, startX + 5, 15);
          }
        });

        // Draw playhead
        const playheadX = (currentTime / duration) * rect.width;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();

      } catch (error) {
        console.error("Failed to draw waveform:", error);
      }
    };

    drawWaveform();

    const animate = () => {
      drawWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl, currentTime, duration, zoom, regions, isPlaying, height]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    setIsDragging(true);
    setDragStart(time);

    // Check if clicking on existing region
    const clickedRegion = regions.find((r) => time >= r.start && time <= r.end);
    if (clickedRegion) {
      setSelectedRegion(clickedRegion);
      onRegionSelect?.(clickedRegion);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !editable) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    // Update selection visualization
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const startX = (dragStart / duration) * rect.width;
      const endX = (time / duration) * rect.width;

      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.fillRect(Math.min(startX, endX), 0, Math.abs(endX - startX), height);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !editable) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    // Create new region
    const newRegion: WaveformRegion = {
      id: `region-${Date.now()}`,
      start: Math.min(dragStart, time),
      end: Math.max(dragStart, time),
      color: "rgba(59, 130, 246, 0.3)",
    };

    onRegionSelect?.(newRegion);

    setIsDragging(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-4">
      {/* Waveform Canvas */}
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg cursor-crosshair"
          style={{ height: `${height}px` }}
          onClick={handleSeek}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => setIsDragging(false)}
        />

        {/* Time display */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.max(0, currentTime - 5);
                }
              }}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.min(duration, currentTime + 5);
                }
              }}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {editable && selectedRegion && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "剪切区域",
                      description: `剪切 ${formatTime(selectedRegion.start)} - ${formatTime(selectedRegion.end)}`,
                    });
                    onRegionDelete?.(selectedRegion.id);
                    setSelectedRegion(null);
                  }}
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  剪切选中
                </Button>
              </>
            )}
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-2">
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={10}
              step={0.5}
              className="flex-1"
            />
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>
        </div>
      )}

      {/* Regions List */}
      {regions.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">标记区域</h4>
          {regions.map((region) => (
            <div
              key={region.id}
              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                selectedRegion?.id === region.id
                  ? "bg-primary/10 border-primary"
                  : "bg-background hover:bg-muted"
              }`}
              onClick={() => {
                setSelectedRegion(region);
                onRegionSelect?.(region);
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {region.label || `区域 ${region.id.slice(-4)}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(region.start)} - {formatTime(region.end)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (audioRef.current) {
                    audioRef.current.currentTime = region.start;
                  }
                }}
              >
                <Play className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
