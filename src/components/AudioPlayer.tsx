import { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Gauge,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([35]);
  const [speed, setSpeed] = useState(1.0);

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setSpeed(speeds[nextIndex]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 py-3">
        {/* Progress bar */}
        <div className="mb-2 flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted-foreground">03:24</span>
          <Slider
            value={progress}
            onValueChange={setProgress}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs tabular-nums text-muted-foreground">09:50</span>
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
              className="h-9 w-9 text-foreground"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
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
