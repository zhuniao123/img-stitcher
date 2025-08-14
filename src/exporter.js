export class Exporter {
    constructor() {
        this.supportsFileSystem = 'showSaveFilePicker' in window;
    }
    
    async export(gridModel) {
        const format = document.getElementById('export-format').value;
        const quality = parseInt(document.getElementById('quality').value) / 100;
        
        // 创建导出画布
        const renderer = new (await import('./renderer.js')).Renderer();
        const canvas = renderer.renderToCanvas(gridModel);
        
        // 转换为 Blob
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await this.canvasToBlob(canvas, mimeType, quality);
        
        // 生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = format === 'png' ? 'png' : 'jpg';
        const filename = `stitched-${timestamp}.${extension}`;
        
        // 保存文件
        await this.saveFile(blob, filename);
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
    
    async saveFile(blob, filename) {
        if (this.supportsFileSystem) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: '图片文件',
                        accept: {
                            'image/*': ['.png', '.jpg', '.jpeg']
                        }
                    }]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                console.log('文件保存成功:', filename);
                return;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('保存失败，降级为下载:', error);
                }
            }
        }
        
        // 降级为下载
        this.downloadBlob(blob, filename);
    }
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('文件下载成功:', filename);
    }
}
