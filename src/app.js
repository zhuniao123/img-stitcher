import { GridModel } from './grid.js';
import { UIManager } from './ui.js';
import { Renderer } from './renderer.js';
import { ImageLoader } from './image-loader.js';
import { Exporter } from './exporter.js';
import { BatchProcessor } from './batch.js';

class App {
    constructor() {
        this.gridModel = new GridModel();
        this.imageLoader = new ImageLoader();
        this.renderer = new Renderer();
        this.exporter = new Exporter();
        this.batchProcessor = new BatchProcessor();
        this.uiManager = new UIManager(this);
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.bindEvents();
        this.render();
        
        console.log('图片拼接工具已初始化');
    }
    
    setupCanvas() {
        const canvas = document.getElementById('main-canvas');
        const container = canvas.parentElement;
        
        // 设置初始画布大小
        this.updateCanvasSize();
        
        // 监听容器大小变化
        new ResizeObserver(() => {
            this.updateCanvasSize();
        }).observe(container);
    }
    
    updateCanvasSize() {
        const canvas = document.getElementById('main-canvas');
        const { rows, cols, cellWidth, cellHeight, gap } = this.gridModel.getConfig();
        
        const totalWidth = cols * cellWidth + (cols - 1) * gap;
        const totalHeight = rows * cellHeight + (rows - 1) * gap;
        
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        canvas.style.width = totalWidth + 'px';
        canvas.style.height = totalHeight + 'px';
        
        this.render();
    }
    
    bindEvents() {
        // 模型变化监听
        this.gridModel.on('change', () => {
            this.updateCanvasSize();
        });
        
        // 画布拖拽事件
        const canvas = document.getElementById('main-canvas');
        
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.classList.add('drag-over');
        });
        
        canvas.addEventListener('dragleave', () => {
            canvas.classList.remove('drag-over');
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const cellIndex = this.getCellAtPosition(x, y);
                if (cellIndex !== -1) {
                    this.loadImageToCell(imageFiles[0], cellIndex);
                }
            }
        });
        
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cellIndex = this.getCellAtPosition(x, y);
            if (cellIndex !== -1) {
                this.selectImageForCell(cellIndex);
            }
        });
    }
    
    getCellAtPosition(x, y) {
        const { rows, cols, cellWidth, cellHeight, gap } = this.gridModel.getConfig();
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cellX = col * (cellWidth + gap);
                const cellY = row * (cellHeight + gap);
                
                if (x >= cellX && x < cellX + cellWidth && 
                    y >= cellY && y < cellY + cellHeight) {
                    return row * cols + col;
                }
            }
        }
        return -1;
    }
    
    async loadImageToCell(file, cellIndex) {
        try {
            const imageData = await this.imageLoader.loadImage(file);
            this.gridModel.setCell(cellIndex, imageData);
            this.render();
        } catch (error) {
            console.error('加载图片失败:', error);
            alert('加载图片失败: ' + error.message);
        }
    }
    
    selectImageForCell(cellIndex) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            if (e.target.files.length > 0) {
                await this.loadImageToCell(e.target.files[0], cellIndex);
            }
        };
        input.click();
    }
    
    render() {
        const canvas = document.getElementById('main-canvas');
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 渲染背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 渲染网格和图片
        this.renderer.render(ctx, this.gridModel);
    }
    
    async exportImage() {
        try {
            await this.exporter.export(this.gridModel);
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        }
    }
    
    clearAll() {
        this.gridModel.clearAll();
        this.render();
    }
    
    async processBatch(files, options) {
        try {
            await this.batchProcessor.process(files, options);
        } catch (error) {
            console.error('批量处理失败:', error);
            alert('批量处理失败: ' + error.message);
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
