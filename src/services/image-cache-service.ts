// 图片缓存服务
class ImageCacheService {
  private cache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string>>();

  // 预加载图片，添加超时处理
  private preloadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // 设置超时，如果图片加载时间超过5秒，就返回原始URL
      const timeout = setTimeout(() => {
        console.warn(`图片加载超时: ${url}`);
        resolve(url); // 超时后仍然返回URL，不阻塞界面
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(url);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.warn(`图片加载失败: ${url}`);
        resolve(url); // 即使加载失败也返回URL，不阻塞界面
      };
      
      // 设置较低的图片加载优先级
      img.loading = 'lazy';
      img.src = url;
    });
  }

  // 获取缓存的图片或加载新图片
  async getCachedImage(key: string, imageUrl: string): Promise<string> {
    // 如果已经缓存，直接返回
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // 如果正在加载，返回加载Promise
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // 开始加载图片
    const loadingPromise = this.preloadImage(imageUrl)
      .then(url => {
        this.cache.set(key, url);
        this.loadingPromises.delete(key);
        return url;
      })
      .catch(error => {
        this.loadingPromises.delete(key);
        throw error;
      });

    this.loadingPromises.set(key, loadingPromise);
    return loadingPromise;
  }

  // 批量预加载图片，优化加载策略
  async preloadImages(images: Array<{ key: string; url: string }>): Promise<void> {
    // 限制并发请求数量，避免浏览器并发连接数限制
    const concurrentLimit = 4;
    const chunks = [];
    
    // 将图片分组，每组最多concurrentLimit个
    for (let i = 0; i < images.length; i += concurrentLimit) {
      chunks.push(images.slice(i, i + concurrentLimit));
    }
    
    // 逐组加载图片
    for (const chunk of chunks) {
      const promises = chunk.map(({ key, url }) => 
        this.getCachedImage(key, url).catch(error => {
          console.warn(`预加载图片失败 ${key}:`, error);
        })
      );
      
      // 等待当前组的图片加载完成后再加载下一组
      await Promise.allSettled(promises);
      
      // 添加小延迟，让浏览器有时间处理其他任务
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // 获取缓存大小
  getCacheSize(): number {
    return this.cache.size;
  }
}

// 导出单例实例
export const imageCacheService = new ImageCacheService();