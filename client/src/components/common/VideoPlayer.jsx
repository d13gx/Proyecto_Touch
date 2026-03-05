import React, { useState, useRef, useEffect } from 'react';
import { useOfflineVideo } from '../hooks/useOfflineVideo.js';

const VideoPlayer = ({ 
  videoUrl, 
  onVideoEnd, 
  autoCache = true,
  showControls = false,
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  
  const {
    isCached,
    isCaching,
    cacheProgress,
    error: cacheError,
    cacheVideoForOffline,
    getVideoUrl
  } = useOfflineVideo(videoUrl);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        if (onVideoEnd) {
          onVideoEnd();
        }
      };
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [onVideoEnd]);

  useEffect(() => {
    if (autoCache && videoUrl && !isCached && !isCaching) {
      cacheVideoForOffline();
    }
  }, [videoUrl, isCached, isCaching, autoCache]);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      try {
        // Obtener URL del video (desde caché o red)
        const videoSrc = await getVideoUrl();
        
        if (typeof videoSrc === 'string') {
          videoRef.current.src = videoSrc;
        }
        
        await videoRef.current.play();
      } catch (err) {
        setError('Error reproduciendo video: ' + err.message);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error || cacheError) {
    return (
      <div className={`video-error ${className}`}>
        <p>❌ Error: {error || cacheError}</p>
      </div>
    );
  }

  return (
    <div className={`video-player ${className}`}>
      {/* Indicador de caché */}
      {isCaching && (
        <div className="cache-indicator">
          <div className="cache-progress">
            <div 
              className="cache-progress-bar" 
              style={{ width: `${cacheProgress}%` }}
            />
          </div>
          <p>📥 Descargando video para uso offline: {cacheProgress}%</p>
        </div>
      )}
      
      {/* Indicador de video en caché */}
      {isCached && (
        <div className="cache-status">
          <span className="cache-badge">✅ Video disponible offline</span>
        </div>
      )}

      {/* Reproductor de video */}
      <video
        ref={videoRef}
        className="video-element"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        muted={false}
        controls={showControls}
      >
        Tu navegador no soporta reproducción de video.
      </video>

      {/* Controles personalizados (si no se muestran los nativos) */}
      {!showControls && (
        <div className="video-controls">
          <button 
            onClick={handlePlayPause}
            className="play-pause-btn"
            disabled={isCaching}
          >
            {isPlaying ? '⏸️ Pausar' : '▶️ Reproducir'}
          </button>
          
          <div className="video-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          {!isCached && !isCaching && (
            <button 
              onClick={cacheVideoForOffline}
              className="cache-btn"
            >
              📥 Descargar para uso offline
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
