export class GridModel {
    constructor() {
        this.config = {
            rows: 2,
            cols: 2,
            cellWidth: 300,
            cellHeight: 300,
            gap: 0,
            showGrid: false,
            fitMode: 'contain',
            sizeMode: 'fixed'
        };
        
        this.cells = [];
        this.listeners = [];
        
        this.resetCells();
    }
    
    resetCells() {
        const totalCells = this.config.rows * this.config.cols;
        this.cells = new Array(totalCells).fill(null);
        this.emit('change');
    }
    
    setConfig(newConfig) {
        const oldRows = this.config.rows;
        const oldCols = this.config.cols;
        
        Object.assign(this.config, newConfig);
        
        // 如果行列数变化，重置单元格
        if (this.config.rows !== oldRows || this.config.cols !== oldCols) {
            this.resetCells();
        } else {
            this.emit('change');
        }
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    setCell(index, imageData) {
        if (index >= 0 && index < this.cells.length) {
            this.cells[index] = imageData;
            
            // 如果是自动膨胀模式，更新单元格大小
            if (this.config.sizeMode === 'auto') {
                this.updateAutoSize();
            }
            
            this.emit('change');
        }
    }
    
    getCell(index) {
        return this.cells[index] || null;
    }
    
    getCells() {
        return [...this.cells];
    }
    
    clearCell(index) {
        if (index >= 0 && index < this.cells.length) {
            this.cells[index] = null;
            this.emit('change');
        }
    }
    
    clearAll() {
        this.cells.fill(null);
        this.emit('change');
    }
    
    updateAutoSize() {
        let maxWidth = 100;
        let maxHeight = 100;
        
        this.cells.forEach(imageData => {
            if (imageData) {
                maxWidth = Math.max(maxWidth, imageData.width);
                maxHeight = Math.max(maxHeight, imageData.height);
            }
        });
        
        this.config.cellWidth = maxWidth;
        this.config.cellHeight = maxHeight;
    }
    
    on(event, callback) {
        this.listeners.push({ event, callback });
    }
    
    emit(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    }
    
    // 获取总画布尺寸
    getTotalSize() {
        const { rows, cols, cellWidth, cellHeight, gap } = this.config;
        return {
            width: cols * cellWidth + (cols - 1) * gap,
            height: rows * cellHeight + (rows - 1) * gap
        };
    }
    
    // 获取单元格位置
    getCellPosition(index) {
        const { cols, cellWidth, cellHeight, gap } = this.config;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        return {
            x: col * (cellWidth + gap),
            y: row * (cellHeight + gap),
            width: cellWidth,
            height: cellHeight
        };
    }
}
