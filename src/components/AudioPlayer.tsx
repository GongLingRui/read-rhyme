import { useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/stores/audioStore";

const AudioPlayer = () => {
  const {
    isPlaying,
    currentTime,
    duration,
    speed,
    togglePlay,
    setCurrentTime,
    cycleSpeed,
  } = useAudioStore();

  const waveContainerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const internalSeekRef = useRef(false);

  // Simulated playback timer (no real audio file)
  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        const s = useAudioStore.getState();
        if (s.currentTime < s.duration) {
          // Don't update if wavesurfer is seeking
          if (!internalSeekRef.current) {
            const newTime = s.currentTime + 0.1 * s.speed;
            setCurrentTime(Math.min(newTime, s.duration));

            // Sync wavesurfer progress
            if (wavesurferRef.current && s.duration > 0) {
              try {
                const progress = newTime / s.duration;
                internalSeekRef.current = true;
                wavesurferRef.current.seekTo(Math.min(progress, 1));
                internalSeekRef.current = false;
              } catch { /* ignore */ }
            }
          }
          animationRef.current = requestAnimationFrame(tick);
        } else {
          useAudioStore.getState().setPlaying(false);
        }
      };
      // Use interval for more consistent timing
      const interval = setInterval(() => {
        tick();
      }, 100);
      return () => {
        clearInterval(interval);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }
  }, [isPlaying, speed]);

  // Initialize WaveSurfer with a generated waveform
  useEffect(() => {
    let ws: any = null;

    const initWaveSurfer = async () => {
      // Wait a tick to ensure DOM is ready
      await new Promise((r) => setTimeout(r, 50));
      if (!waveContainerRef.current) return;
      const WaveSurfer = (await import("wavesurfer.js")).default;

      // Get CSS variable colors
      const rootStyles = getComputedStyle(document.documentElement);
      const primaryHsl = rootStyles.getPropertyValue("--primary").trim();
      const mutedHsl = rootStyles.getPropertyValue("--muted-foreground").trim();

      ws = WaveSurfer.create({
        container: waveContainerRef.current,
        height: 32,
        barWidth: 2,
        barGap: 1.5,
        barRadius: 2,
        cursorWidth: 0,
        waveColor: mutedHsl ? `hsl(${mutedHsl} / 0.3)` : "rgba(150,150,150,0.3)",
        progressColor: primaryHsl ? `hsl(${primaryHsl})` : "#d97706",
        normalize: true,
        interact: true,
        backend: "WebAudio",
      });

      // Generate a fake waveform by loading a tiny silent audio
      // WaveSurfer needs audio data, so we create a synthetic buffer
      const audioContext = new AudioContext();
      const sampleRate = audioContext.sampleRate;
      const bufferLength = sampleRate * 10; // 10 seconds
      const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
      const channelData = buffer.getChannelData(0);
      // Create a realistic-looking waveform
      for (let i = 0; i < bufferLength; i++) {
        const t = i / sampleRate;
        channelData[i] =
          Math.sin(t * 2.5) * 0.3 +
          Math.sin(t * 7.3) * 0.2 +
          Math.sin(t * 13.7) * 0.15 +
          (Math.random() - 0.5) * 0.5;
      }

      const blob = await audioBufferToWav(buffer);
      ws.loadBlob(blob);

      ws.on("seeking", (progress: number) => {
        if (!internalSeekRef.current) {
          const newTime = progress * useAudioStore.getState().duration;
          setCurrentTime(newTime);
        }
      });

      wavesurferRef.current = ws;
    };

    initWaveSurfer();

    return () => {
      if (ws) {
        try { ws.destroy(); } catch { /* ignore */ }
      }
    };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const skipBack = () => {
    setCurrentTime(Math.max(0, currentTime - 15));
  };

  const skipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 15));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 py-2">
        {/* Waveform */}
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div ref={waveContainerRef} className="flex-1 min-h-[32px]" />
          <span className="text-xs tabular-nums text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBack}
              className="h-9 w-9 text-foreground"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              className="h-9 w-9 text-foreground"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleSpeed}
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Gauge className="h-3.5 w-3.5" />
              {speed}x
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

// ── Helper: AudioBuffer → WAV Blob ──
function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return Promise.resolve(new Blob([arrayBuffer], { type: "audio/wav" }));
}
