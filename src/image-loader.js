export class ImageLoader {
    constructor() {
        this.loadingQueue = [];
        this.maxConcurrent = 3;
        this.currentLoading = 0;
    }
    
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            this.loadingQueue.push({ file, resolve, reject });
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.currentLoading >= this.maxConcurrent || this.loadingQueue.length === 0) {
            return;
        }
        
        const { file, resolve, reject } = this.loadingQueue.shift();
        this.currentLoading++;
        
        try {
            const imageData = await this.loadSingleImage(file);
            resolve(imageData);
        } catch (error) {
            reject(error);
        } finally {
            this.currentLoading--;
            this.processQueue();
        }
    }
    
    async loadSingleImage(file) {
        try {
            // 优先使用 createImageBitmap
            if ('createImageBitmap' in window) {
                const bitmap = await createImageBitmap(file);
                return {
                    bitmap,
                    width: bitmap.width,
                    height: bitmap.height,
                    file
                };
            } else {
                // 降级使用 Image
                return await this.loadWithImage(file);
            }
        } catch (error) {
            throw new Error(`加载图片失败: ${error.message}`);
        }
    }
    
    loadWithImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({
                    image: img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    file
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('图片格式不支持或文件损坏'));
            };
            
            img.src = url;
        });
    }
    
    // 批量加载图片
    async loadMultiple(files) {
        const promises = files.map(file => this.loadImage(file));
        return Promise.all(promises);
    }
}
