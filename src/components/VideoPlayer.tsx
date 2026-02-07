import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward
} from "lucide-react";
import Hls from "hls.js";

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
}

const VideoPlayer = ({ url, title, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // 🔧 PROBLEMA 4: Estados para controle de tempo
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Inicializar player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const isHls = url.includes(".m3u8") || url.includes(".m3u");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => hls.destroy();
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
    } else {
      video.src = url;
      video.play().catch(() => {});
    }
  }, [url]);

  // 🔧 PROBLEMA 4: Listeners para atualizar tempo e duração
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("progress", handleProgress);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("progress", handleProgress);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { 
      video.play(); 
      setPlaying(true); 
    } else { 
      video.pause(); 
      setPlaying(false); 
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  // 🔧 PROBLEMA 4: Função para buscar no vídeo
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  // 🔧 PROBLEMA 4: Pular 10 segundos
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "ArrowLeft") skip(-10);
      if (e.key === "ArrowRight") skip(10);
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, duration]);

  // 🔧 PROBLEMA 4: Formatar tempo em MM:SS
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          ref={containerRef}
          className="relative w-full max-w-5xl aspect-video"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full h-full bg-black rounded-lg"
            muted={muted}
            playsInline
            onClick={togglePlay}
          />

          {/* Controls overlay */}
          <motion.div
            initial={false}
            animate={{ opacity: showControls ? 1 : 0 }}
            className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none transition-opacity duration-300"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between pointer-events-auto">
              <h3 className="text-foreground font-bold text-lg drop-shadow-lg">{title}</h3>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="space-y-2 pointer-events-auto">
              {/* 🔧 PROBLEMA 4: Barra de progresso com preview de buffer */}
              <div 
                ref={progressRef}
                className="relative h-1 bg-white/30 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                {/* Buffered */}
                <div 
                  className="absolute h-full bg-white/50 rounded-full transition-all"
                  style={{ width: `${bufferedPercentage}%` }}
                />
                {/* Progress */}
                <div 
                  className="absolute h-full bg-primary rounded-full transition-all group-hover:h-1.5"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button 
                  onClick={togglePlay} 
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {playing ? (
                    <Pause className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Play className="w-5 h-5 text-primary-foreground fill-current" />
                  )}
                </button>

                {/* 🔧 PROBLEMA 4: Botões de skip */}
                <button 
                  onClick={() => skip(-10)}
                  className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                  title="Voltar 10s"
                >
                  <SkipBack className="w-5 h-5 text-foreground" />
                </button>

                <button 
                  onClick={() => skip(10)}
                  className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                  title="Avançar 10s"
                >
                  <SkipForward className="w-5 h-5 text-foreground" />
                </button>

                {/* 🔧 PROBLEMA 4: Temporizador do vídeo */}
                <div className="text-foreground text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute}>
                    {muted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-foreground" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                </div>

                <div className="flex-1" />

                {/* Fullscreen */}
                <button onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-foreground" />
                  ) : (
                    <Maximize className="w-5 h-5 text-foreground" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* No URL fallback */}
          {!url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg">
              <p className="text-muted-foreground text-lg">Nenhum link de vídeo disponível</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoPlayer;