// Image loading utilities for journal components

export class ImagePreloader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
  }

  // Preload a single image
  preloadImage(src) {
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src));
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Preload multiple images in parallel
  preloadImages(sources) {
    const validSources = (sources || []).filter((src) =>
      typeof src === 'string' && src.length > 0 && !src.startsWith('blob:')
    );

    const promises = validSources.map(src => 
      this.preloadImage(src).catch(err => {
        
        return null;
      })
    );
    
    return Promise.all(promises);
  }

  // Check if image is cached
  isCached(src) {
    return this.cache.has(src);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Global instance
export const imagePreloader = new ImagePreloader();

// Hook for preloading journal images
export const useJournalImagePreloader = (trades) => {
  const preloadImages = () => {
    const allScreenshots = trades
      .filter(trade => trade.screenshots && trade.screenshots.length > 0)
      .flatMap(trade => trade.screenshots.slice(0, 4)); // Preload first 4 images per trade
    
    if (allScreenshots.length > 0) {
      imagePreloader.preloadImages(allScreenshots);
    }
  };

  return { preloadImages };
};


