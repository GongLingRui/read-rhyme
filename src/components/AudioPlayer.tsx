import { useEffect, useRef, useCallback, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Gauge,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/stores/audioStore";

const AudioPlayer = () => {
  const {
    isPlaying,
    currentTime,
    duration,
    speed,
    audioUrl,
    blockTexts,
    togglePlay,
    setCurrentTime,
    setPlaying,
    setDuration,
    cycleSpeed,
    activeBlockIndex,
    paragraphTimeMap,
  } = useAudioStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const internalSeekRef = useRef(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [useWebSpeech, setUseWebSpeech] = useState(false);
  const [speechBlocks, setSpeechBlocks] = useState<string[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);
  const lastPlayedBlockRef = useRef<number | null>(null);
  const speechBlocksRef = useRef<string[]>([]);
  /** 由 handlePlayPause 同步启动时置 true，避免 useEffect 重复调用 speak() */
  const startedByHandlePlayPauseRef = useRef(false);

  // Web Speech API playback function - 必须同步调用 speak() 以保持用户手势上下文（Chrome 要求）
  const playWebSpeechAtIndex = useCallback((index: number) => {
    // Prevent duplicate calls for the same block
    if (lastPlayedBlockRef.current === index && isPlayingRef.current) {
      console.log('[AudioPlayer] Already playing block', index, ', skipping duplicate call');
      return;
    }

    // 同步获取 blocks：优先 speechBlocksRef，其次 store 中的 blockTexts
    const blocks = speechBlocksRef.current.length > 0
      ? speechBlocksRef.current
      : useAudioStore.getState().blockTexts;

    if (index >= blocks.length) {
      console.log('[AudioPlayer] Index', index, 'out of range, total blocks:', blocks.length);
      setPlaying(false);
      lastPlayedBlockRef.current = null;
      return;
    }

    // Cancel any pending speech first
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      // Chrome 需要 resume() 才能播放声音，否则 speak() 可能静默
      window.speechSynthesis.resume();
    }

    lastPlayedBlockRef.current = index;
    setCurrentBlockIndex(index);

    const textToSpeak = blocks[index];
    if (!textToSpeak || textToSpeak.trim().length === 0) {
      console.warn('[AudioPlayer] Empty text at index', index, ', skipping');
      if (index + 1 < blocks.length) {
        setTimeout(() => playWebSpeechAtIndex(index + 1), 50);
      } else {
        setPlaying(false);
        lastPlayedBlockRef.current = null;
      }
      return;
    }

    console.log('[AudioPlayer] Speaking:', textToSpeak.substring(0, 50) + '...');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'zh-CN';
    utterance.rate = speed;
    utterance.volume = 1.0;
    utterance.pitch = 1.0;

    // 尝试选择中文语音，提高播放成功率
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find((v) => v.lang.startsWith('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onstart = () => {
      console.log('[AudioPlayer] Speech started for block', index);
      isPlayingRef.current = true;
    };

    utterance.onend = () => {
      console.log('[AudioPlayer] Finished block', index);
      isPlayingRef.current = false;
      lastPlayedBlockRef.current = null;
      setCurrentBlockIndex((prev) => {
        const next = prev + 1;
        const currentState = useAudioStore.getState();
        const nextBlocks = speechBlocksRef.current.length > 0
          ? speechBlocksRef.current
          : currentState.blockTexts;
        if (next < nextBlocks.length && currentState.isPlaying) {
          setTimeout(() => playWebSpeechAtIndex(next), 100);
        } else {
          setPlaying(false);
        }
        return next;
      });
    };

    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        isPlayingRef.current = false;
        lastPlayedBlockRef.current = null;
        return;
      }
      console.error('[AudioPlayer] Error playing at index', index, ':', e.error, e);
      isPlayingRef.current = false;
      lastPlayedBlockRef.current = null;
      setPlaying(false);
    };

    if (window.speechSynthesis?.speak) {
      try {
        window.speechSynthesis.speak(utterance);
        console.log('[AudioPlayer] Speech synthesis speak() called (volume=1)');
      } catch (err) {
        console.error('[AudioPlayer] Failed to call speak():', err);
        setPlaying(false);
        lastPlayedBlockRef.current = null;
      }
    } else {
      console.error('[AudioPlayer] speechSynthesis not available');
      setPlaying(false);
      lastPlayedBlockRef.current = null;
    }
  }, [speed, setPlaying]);

  const pauseWebSpeech = useCallback(() => {
    console.log('[AudioPlayer] Pausing speech');
    isPlayingRef.current = false;
    lastPlayedBlockRef.current = null;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Initialize Web Speech API when no audioUrl：优先用 store 中的 blockTexts，避免 DOM 时序导致取不到段落
  useEffect(() => {
    console.log('[AudioPlayer] Web Speech init check:', {
      audioUrl,
      duration,
      blockTextsLength: blockTexts.length,
      hasSpeechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
    });

    if (!audioUrl && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (blockTexts.length > 0) {
        console.log('[AudioPlayer] Using blockTexts from store:', blockTexts.length, 'blocks');
        setSpeechBlocks(blockTexts);
        speechBlocksRef.current = blockTexts; // 同步更新 ref，供 playWebSpeechAtIndex 同步读取
        setUseWebSpeech(true);
        setCurrentBlockIndex(0);
        console.log('[AudioPlayer] Web Speech API initialized successfully');
      } else {
        // 降级：从 DOM 取
        console.log('[AudioPlayer] blockTexts empty, trying DOM fallback');
        const blocks = document.querySelectorAll('[data-block-index]');
        const texts: string[] = [];
        blocks.forEach((block) => {
          const text = block.textContent?.trim();
          if (text) texts.push(text);
        });
        if (texts.length > 0) {
          console.log('[AudioPlayer] Found', texts.length, 'blocks from DOM');
          setSpeechBlocks(texts);
          speechBlocksRef.current = texts;
          setUseWebSpeech(true);
          setCurrentBlockIndex(0);
        } else {
          console.warn('[AudioPlayer] No blocks found in DOM either');
          setUseWebSpeech(false);
        }
      }
      // 预加载语音列表，部分浏览器需要此步骤才能正常播放
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          console.log('[AudioPlayer] Voices loaded:', window.speechSynthesis.getVoices().length);
        };
      }
    } else {
      if (audioUrl) {
        console.log('[AudioPlayer] Has audioUrl, disabling Web Speech');
      } else if (!('speechSynthesis' in window)) {
        console.warn('[AudioPlayer] speechSynthesis not available in browser');
      }
      setUseWebSpeech(false);
    }
  }, [audioUrl, blockTexts]);

  // 保持 speechBlocksRef 与 speechBlocks 同步
  useEffect(() => {
    speechBlocksRef.current = speechBlocks;
  }, [speechBlocks]);

  // Update audio playback state
  useEffect(() => {
    if (useWebSpeech) {
      if (!isPlaying) {
        pauseWebSpeech();
      } else {
        // 由 seekToBlock/点击段落等触发的播放，handlePlayPause 未调用，需在此启动
        if (startedByHandlePlayPauseRef.current) {
          startedByHandlePlayPauseRef.current = false;
          return;
        }
        const blocks = speechBlocksRef.current.length > 0 ? speechBlocksRef.current : blockTexts;
        if (blocks.length > 0) {
          let startIndex = typeof activeBlockIndex === "number" && activeBlockIndex >= 0
            ? Math.min(activeBlockIndex, blocks.length - 1)
            : Math.min(currentBlockIndex, blocks.length - 1);
          if (startIndex < 0) startIndex = 0;
          playWebSpeechAtIndex(startIndex);
        }
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('[AudioPlayer] Failed to play audio:', err);
        // Auto-play was prevented or audio not available
        setPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, setPlaying, useWebSpeech, speechBlocks.length, blockTexts, activeBlockIndex, currentBlockIndex, playWebSpeechAtIndex, pauseWebSpeech]);


  // Seek functionality for Web Speech - only auto-update when not playing to avoid overriding user selection
  useEffect(() => {
    if (useWebSpeech && speechBlocks.length > 0 && !isPlaying) {
      // Only update block index when not playing (user is seeking, not during playback)
      const timePerBlock = duration / speechBlocks.length;
      const targetBlock = Math.min(Math.floor(currentTime / timePerBlock), speechBlocks.length - 1);
      setCurrentBlockIndex(targetBlock);
    }
  }, [currentTime, duration, useWebSpeech, speechBlocks.length, isPlaying]);

  // Update current time from audio element
  useEffect(() => {
    if (useWebSpeech) return; // Skip for Web Speech API

    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!internalSeekRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      // Duration is set from store (estimated from text or from TTS)
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [setCurrentTime, setPlaying, useWebSpeech]);

  // Update audio element when currentTime changes from store
  useEffect(() => {
    if (useWebSpeech) return; // Skip for Web Speech API

    const audio = audioRef.current;
    if (!audio) return;

    const diff = Math.abs(audio.currentTime - currentTime);
    if (diff > 0.1) {
      internalSeekRef.current = true;
      audio.currentTime = currentTime;
      setTimeout(() => {
        internalSeekRef.current = false;
      }, 100);
    }
  }, [currentTime, useWebSpeech]);

  // Update audio element when audioUrl changes
  useEffect(() => {
    if (useWebSpeech) return; // Skip for Web Speech API

    const audio = audioRef.current;
    if (!audio) return;

    if (audioUrl) {
      console.log('[AudioPlayer] Loading audio URL:', audioUrl);
      audio.src = audioUrl;
      audio.load();
    } else {
      audio.src = "";
    }
  }, [audioUrl, useWebSpeech]);

  // Add canplay event listener to log when audio is ready
  useEffect(() => {
    if (useWebSpeech) return;

    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log('[AudioPlayer] Audio is ready to play');
    };

    const handleLoadStart = () => {
      console.log('[AudioPlayer] Starting to load audio');
    };

    const handleLoadedMetadata = () => {
      console.log('[AudioPlayer] Audio metadata loaded, duration:', audio.duration);
      if (duration === 0 && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [useWebSpeech, duration, setDuration]);

  // Initialize WaveSurfer for visualization
  useEffect(() => {
    if (useWebSpeech) return; // Skip for Web Speech API

    const initWaveSurfer = async () => {
      if (!waveContainerRef.current) return;
      if (!audioUrl) return; // Don't initialize if no audio

      const WaveSurfer = (await import("wavesurfer.js")).default;

      // Get CSS variable colors
      const rootStyles = getComputedStyle(document.documentElement);
      const primaryHsl = rootStyles.getPropertyValue("--primary").trim();
      const mutedHsl = rootStyles.getPropertyValue("--muted-foreground").trim();

      const ws = WaveSurfer.create({
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
        url: audioUrl,
      });

      ws.on("seeking", (progress: number) => {
        if (!internalSeekRef.current) {
          const newTime = progress * duration;
          setCurrentTime(newTime);
        }
      });

      wavesurferRef.current = ws;

      return () => {
        try {
          ws.destroy();
        } catch {
          // ignore
        }
      };
    };

    const cleanupPromise = initWaveSurfer();
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [audioUrl, duration, setCurrentTime, useWebSpeech]);

  // Sync WaveSurfer with current time
  useEffect(() => {
    if (useWebSpeech) return; // Skip for Web Speech API

    if (wavesurferRef.current && duration > 0) {
      try {
        const progress = currentTime / duration;
        internalSeekRef.current = true;
        wavesurferRef.current.seekTo(Math.min(progress, 1));
        setTimeout(() => {
          internalSeekRef.current = false;
        }, 100);
      } catch {
        // ignore
      }
    }
  }, [currentTime, duration, useWebSpeech]);

  // Update current time during Web Speech playback
  useEffect(() => {
    if (useWebSpeech && speechBlocks.length > 0) {
      const timePerBlock = duration / speechBlocks.length;
      const newCurrentTime = currentBlockIndex * timePerBlock;
      setCurrentTime(newCurrentTime);
    }
  }, [currentBlockIndex, speechBlocks.length, duration, useWebSpeech, setCurrentTime]);

  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const skipBack = () => {
    if (useWebSpeech) {
      const timePerBlock = duration / speechBlocks.length;
      const prevBlock = Math.max(0, currentBlockIndex - 1);
      setCurrentBlockIndex(prevBlock);
      setCurrentTime(prevBlock * timePerBlock);
      // If playing, restart from new position
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setTimeout(() => playWebSpeechAtIndex(prevBlock), 100);
      }
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    } else {
      setCurrentTime(Math.max(0, currentTime - 15));
    }
  };

  const skipForward = () => {
    if (useWebSpeech) {
      const timePerBlock = duration / speechBlocks.length;
      const nextBlock = Math.min(speechBlocks.length - 1, currentBlockIndex + 1);
      setCurrentBlockIndex(nextBlock);
      setCurrentTime(nextBlock * timePerBlock);
      // If playing, restart from new position
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setTimeout(() => playWebSpeechAtIndex(nextBlock), 100);
      }
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(duration, audio.currentTime + 15);
    } else {
      setCurrentTime(Math.min(duration, currentTime + 15));
    }
  };

  const handlePlayPause = async () => {
    console.log('[AudioPlayer] handlePlayPause called:', { audioUrl, useWebSpeech, speechBlocksLength: speechBlocks.length });

    if (!audioUrl && !useWebSpeech) {
      console.log('[AudioPlayer] Cannot play: no audioUrl and Web Speech not initialized');
      return;
    }

    // Web Speech：必须在用户手势的同一调用栈中启动 speak()，否则 Chrome 会静默
    if (useWebSpeech) {
      if (isPlaying) {
        togglePlay();
      } else {
        setPlaying(true);
        startedByHandlePlayPauseRef.current = true;
        const blocks = speechBlocksRef.current.length > 0 ? speechBlocksRef.current : blockTexts;
        if (blocks.length > 0) {
          let startIndex = typeof activeBlockIndex === "number" && activeBlockIndex >= 0
            ? Math.min(activeBlockIndex, blocks.length - 1)
            : Math.min(currentBlockIndex, blocks.length - 1);
          if (startIndex < 0) startIndex = 0;
          playWebSpeechAtIndex(startIndex);
        } else {
          setPlaying(false);
          startedByHandlePlayPauseRef.current = false;
        }
      }
      return;
    }

    // If using audio element, check if it's ready
    if (audioRef.current && audioUrl) {
      const audio = audioRef.current;

      // If trying to play and audio isn't ready, wait for it
      if (audio.paused && audio.readyState < 2) { // HAVE_CURRENT_DATA
        console.log('[AudioPlayer] Audio not ready, waiting...');
        const waitForReady = () => {
          return new Promise<void>((resolve, reject) => {
            const onCanPlay = () => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              console.log('[AudioPlayer] Audio ready, starting playback');
              resolve();
            };
            const onError = (e: Event) => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              console.error('[AudioPlayer] Error loading audio:', e);
              reject(new Error('Failed to load audio'));
            };

            audio.addEventListener('canplay', onCanPlay);
            audio.addEventListener('error', onError);

            // Timeout after 5 seconds
            setTimeout(() => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              reject(new Error('Timeout waiting for audio to load'));
            }, 5000);
          });
        };

        try {
          await waitForReady();
        } catch (err) {
          console.error('[AudioPlayer] Failed to wait for audio:', err);
          return;
        }
      }
    }

    togglePlay();
  };

  // Progress bar seek for Web Speech
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !useWebSpeech) return;

    const rect = progressContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    const newBlockIndex = Math.floor(percentage * speechBlocks.length);

    setCurrentTime(newTime);
    setCurrentBlockIndex(Math.min(newBlockIndex, speechBlocks.length - 1));

    // If playing, restart from new position
    if (isPlaying) {
      playWebSpeechAtIndex(Math.min(newBlockIndex, speechBlocks.length - 1));
    }
  }, [duration, speechBlocks.length, useWebSpeech, isPlaying, playWebSpeechAtIndex]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!useWebSpeech) return;
    setIsDragging(true);
    handleProgressClick(e);
  }, [useWebSpeech, handleProgressClick]);

  // Handle drag for progress bar
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressContainerRef.current || !useWebSpeech) return;
      const rect = progressContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      const newBlockIndex = Math.floor(percentage * speechBlocks.length);

      setCurrentTime(newTime);
      setCurrentBlockIndex(Math.min(newBlockIndex, speechBlocks.length - 1));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // If playing, restart from new position
      if (isPlaying && useWebSpeech) {
        const timePerBlock = duration / speechBlocks.length;
        const targetBlock = Math.min(Math.floor(currentTime / timePerBlock), speechBlocks.length - 1);
        playWebSpeechAtIndex(targetBlock);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, useWebSpeech, duration, speechBlocks.length, currentTime, isPlaying, playWebSpeechAtIndex]);

  // Don't render player if no duration (no content loaded)
  if (duration === 0 && !audioUrl && !useWebSpeech) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element for actual playback */}
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-2">
          {/* Progress Bar - Custom for Web Speech, WaveSurfer for audio files */}
          <div className="mb-1 flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 min-h-[32px] relative">
              {useWebSpeech ? (
                // Custom progress bar with draggable dot for Web Speech
                <div
                  ref={progressContainerRef}
                  className="w-full h-full cursor-pointer group"
                  onMouseDown={handleProgressMouseDown}
                  onClick={handleProgressClick}
                >
                  {/* Background track */}
                  <div className="absolute inset-0 bg-muted/30 rounded-full" />
                  {/* Progress fill */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-primary/50 rounded-full transition-all duration-75"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {/* Draggable dot indicator */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg ${
                      isDragging ? "scale-125" : "scale-100"
                    } transition-transform duration-75`}
                    style={{
                      left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  {/* Optional: Show dots for each block */}
                  <div className="absolute inset-0 flex items-center">
                    {speechBlocks.map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 border-r border-muted-foreground/20 last:border-r-0 ${
                          i === currentBlockIndex ? "bg-primary/20" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // WaveSurfer for audio files
                <div ref={waveContainerRef} className="w-full h-full" />
              )}
            </div>
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
                disabled={true}
                title={useWebSpeech ? "语音朗读不支持音量调节" : "无音频"}
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBack}
                className="h-9 w-9 text-foreground"
                disabled={!audioUrl && !useWebSpeech}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                disabled={!audioUrl && !useWebSpeech}
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
                disabled={!audioUrl && !useWebSpeech}
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
    </>
  );
};

export default AudioPlayer;
