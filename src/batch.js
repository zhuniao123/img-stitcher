export class BatchProcessor {
    constructor() {
        this.processing = false;
    }
    
    async process(files, options) {
        if (this.processing) {
            throw new Error('批处理正在进行中');
        }
        
        this.processing = true;
        
        try {
            const matches = this.findMatches(files, options.pattern);
            const results = await this.processMatches(matches, options);
            this.displayResults(results);
        } finally {
            this.processing = false;
        }
    }
    
    findMatches(files, pattern) {
        const matches = [];
        const usedFiles = new Set();
        
        // 简单的 {n} 模式匹配
        if (pattern.includes('{n}')) {
            const prefix = pattern.split('{n}')[0];
            const suffix = pattern.split('{n}')[1] || '';
            
            files.forEach(file => {
                if (usedFiles.has(file.name)) return;
                
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                const match = nameWithoutExt.match(new RegExp(`^${prefix}(\\d+)${suffix}$`));
                
                if (match) {
                    const index = parseInt(match[1]);
                    const nextName = `${prefix}${index + 1}${suffix}`;
                    
                    // 查找配对文件
                    const pairFile = files.find(f => {
                        const pairNameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
                        return pairNameWithoutExt === nextName && !usedFiles.has(f.name);
                    });
                    
                    if (pairFile) {
                        matches.push({
                            files: [file, pairFile],
                            name: `${prefix}${index}-${index + 1}`
                        });
                        
                        usedFiles.add(file.name);
                        usedFiles.add(pairFile.name);
                    }
                }
            });
        }
        
        return matches;
    }
    
    async processMatches(matches, options) {
        const results = [];
        const total = matches.length;
        
        this.showProgress(0, total);
        
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            
            try {
                const result = await this.processMatch(match, options);
                results.push(result);
                
                this.showProgress(i + 1, total);
            } catch (error) {
                console.error(`处理 ${match.name} 失败:`, error);
                results.push({
                    name: match.name,
                    error: error.message
                });
            }
        }
        
        this.hideProgress();
        return results;
    }
    
    async processMatch(match, options) {
        const imageLoader = new (await import('./image-loader.js')).ImageLoader();
        
        // 加载图片
        const imageDataList = await Promise.all(
            match.files.map(file => imageLoader.loadImage(file))
        );
        
        // 创建画布
        const { width, height } = options.targetSize;
        const isHorizontal = options.mode === 'horizontal';
        
        const canvasWidth = isHorizontal ? width * 2 : width;
        const canvasHeight = isHorizontal ? height : height * 2;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // 设置渲染质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 绘制图片
        for (let i = 0; i < imageDataList.length; i++) {
            const imageData = imageDataList[i];
            const image = imageData.bitmap || imageData.image;
            
            const x = isHorizontal ? i * width : 0;
            const y = isHorizontal ? 0 : i * height;
            
            ctx.drawImage(image, x, y, width, height);
        }
        
        // 导出
        const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await this.canvasToBlob(canvas, mimeType, options.quality);
        
        const extension = options.format === 'png' ? 'png' : 'jpg';
        const filename = `${match.name}-merged.${extension}`;
        
        // 保存或下载
        await this.saveBlob(blob, filename);
        
        return {
            name: match.name,
            filename,
            canvas: canvas,
            success: true
        };
    }
    
    canvasToBlob(canvas, mimeType, quality) {
        return new Promise(resolve => {
            if (mimeType === 'image/jpeg') {
                canvas.toBlob(resolve, mimeType, quality);
            } else {
                canvas.toBlob(resolve, mimeType);
            }
        });
    }
    
    async saveBlob(blob, filename) {
        // 简化版保存，直接下载
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showProgress(current, total) {
        const progressElement = document.getElementById('batch-progress');
        const progressFill = progressElement.querySelector('.progress-fill');
        const progressText = progressElement.querySelector('.progress-text');
        
        progressElement.style.display = 'block';
        
        const percentage = (current / total) * 100;
        progressFill.style.width = percentage + '%';
        progressText.textContent = `处理中... ${current}/${total}`;
    }
    
    hideProgress() {
        const progressElement = document.getElementById('batch-progress');
        progressElement.style.display = 'none';
    }
    
    displayResults(results) {
        const resultsContainer = document.getElementById('batch-results');
        resultsContainer.innerHTML = '';
        
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            if (result.success && result.canvas) {
                const img = document.createElement('img');
                img.src = result.canvas.toDataURL();
                item.appendChild(img);
                
                const filename = document.createElement('div');
                filename.className = 'filename';
                filename.textContent = result.filename;
                item.appendChild(filename);
            } else {
                const error = document.createElement('div');
                error.textContent = `${result.name}: ${result.error || '处理失败'}`;
                error.style.color = '#dc3545';
                item.appendChild(error);
            }
            
            resultsContainer.appendChild(item);
        });
    }
}
