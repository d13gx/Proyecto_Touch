import { useState, useEffect } from 'react';
import { videoCache } from '../utils/videoCache.js';

export const useOfflineVideo = (videoUrl) => {
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkVideoCache();
  }, [videoUrl]);

  const checkVideoCache = async () => {
    if (!videoUrl) return;
    
    try {
      const cached = await videoCache.isVideoCached(videoUrl);
      setIsCached(cached);
      console.log('📹 Estado del video en caché:', cached);
    } catch (err) {
      setError(err.message);
    }
  };

  const cacheVideoForOffline = async () => {
    if (!videoUrl || isCached) return;

    setIsCaching(true);
    setCacheProgress(0);
    setError(null);

    try {
      // Simular progreso de descarga
      const progressInterval = setInterval(() => {
        setCacheProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const success = await videoCache.cacheVideo(videoUrl);
      
      clearInterval(progressInterval);
      setCacheProgress(100);
      
      if (success) {
        setIsCached(true);
        setTimeout(() => {
          setIsCaching(false);
          setCacheProgress(0);
        }, 1000);
      } else {
        throw new Error('Error descargando video');
      }
    } catch (err) {
      setError(err.message);
      setIsCaching(false);
      setCacheProgress(0);
    }
  };

  const getVideoUrl = async () => {
    if (!videoUrl) return null;

    try {
      const video = await videoCache.getVideo(videoUrl);
      return video;
    } catch (err) {
      setError(err.message);
      return videoUrl; // Fallback
    }
  };

  return {
    isCached,
    isCaching,
    cacheProgress,
    error,
    cacheVideoForOffline,
    getVideoUrl,
    checkVideoCache
  };
};
