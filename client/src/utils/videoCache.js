// Gestor de caché de video para modo offline
export class VideoCacheManager {
  constructor() {
    this.cacheName = 'totem-video-cache';
    this.videoUrls = [];
  }

  // Inicializar caché de video
  async initCache() {
    try {
      const cache = await caches.open(this.cacheName);
      console.log('📹 Caché de video inicializado');
      return cache;
    } catch (error) {
      console.error('❌ Error inicializando caché de video:', error);
      return null;
    }
  }

  // Descargar video para uso offline
  async cacheVideo(videoUrl) {
    try {
      console.log('📥 Descargando video para uso offline:', videoUrl);
      
      const cache = await this.initCache();
      if (!cache) {
        throw new Error('No se pudo inicializar caché');
      }

      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Error descargando video: ${response.status}`);
      }

      await cache.put(videoUrl, response);
      this.videoUrls.push(videoUrl);
      
      console.log('✅ Video descargado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error descargando video:', error);
      return false;
    }
  }

  // Obtener video (desde caché o red)
  async getVideo(videoUrl) {
    try {
      const cache = await this.initCache();
      if (!cache) {
        return videoUrl; // Fallback a URL original
      }

      const cachedResponse = await cache.match(videoUrl);
      if (cachedResponse) {
        console.log('📹 Video encontrado en caché offline');
        return cachedResponse;
      }

      console.log('🌐 Video no encontrado en caché, descargando...');
      return videoUrl;
    } catch (error) {
      console.error('❌ Error obteniendo video:', error);
      return videoUrl;
    }
  }

  // Verificar si el video está en caché
  async isVideoCached(videoUrl) {
    try {
      const cache = await this.initCache();
      if (!cache) return false;

      const cachedResponse = await cache.match(videoUrl);
      return cachedResponse ? true : false;
    } catch (error) {
      console.error('❌ Error verificando caché:', error);
      return false;
    }
  }

  // Limpiar caché de videos
  async clearCache() {
    try {
      await caches.delete(this.cacheName);
      this.videoUrls = [];
      console.log('🗑️ Caché de video limpiado');
      return true;
    } catch (error) {
      console.error('❌ Error limpiando caché:', error);
      return false;
    }
  }

  // Obtener tamaño de la caché
  async getCacheSize() {
    try {
      const cache = await this.initCache();
      if (!cache) return 0;

      const keys = await cache.keys();
      let totalSize = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('❌ Error obteniendo tamaño de caché:', error);
      return 0;
    }
  }
}

// Instancia global del gestor de caché
export const videoCache = new VideoCacheManager();

// Función para formatear bytes
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
