export class Renderer {
    constructor() {
        this.gridLineColor = '#e0e0e0';
        this.gridLineWidth = 1;
    }
    
    render(ctx, gridModel) {
        const config = gridModel.getConfig();
        const cells = gridModel.getCells();
        
        // 设置渲染质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 渲染每个单元格
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const position = gridModel.getCellPosition(i);
            
            if (cell) {
                this.renderCell(ctx, cell, position, config.fitMode);
            }
            
            // 渲染网格线
            if (config.showGrid) {
                this.renderGridCell(ctx, position);
            }
        }
    }
    
    renderCell(ctx, imageData, position, fitMode) {
        const { x, y, width, height } = position;
        const image = imageData.bitmap || imageData.image;
        
        if (!image) return;
        
        const imgWidth = imageData.width;
        const imgHeight = imageData.height;
        
        let drawX = x;
        let drawY = y;
        let drawWidth = width;
        let drawHeight = height;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = imgWidth;
        let sourceHeight = imgHeight;
        
        switch (fitMode) {
            case 'contain':
                const containScale = Math.min(width / imgWidth, height / imgHeight);
                drawWidth = imgWidth * containScale;
                drawHeight = imgHeight * containScale;
                drawX = x + (width - drawWidth) / 2;
                drawY = y + (height - drawHeight) / 2;
                break;
                
            case 'cover':
                const coverScale = Math.max(width / imgWidth, height / imgHeight);
                const scaledWidth = imgWidth * coverScale;
                const scaledHeight = imgHeight * coverScale;
                
                if (scaledWidth > width) {
                    sourceX = (imgWidth - width / coverScale) / 2;
                    sourceWidth = width / coverScale;
                }
                
                if (scaledHeight > height) {
                    sourceY = (imgHeight - height / coverScale) / 2;
                    sourceHeight = height / coverScale;
                }
                break;
                
            case 'stretch':
                // 默认值已经是拉伸模式
                break;
                
            case 'tile':
                this.renderTiled(ctx, image, position, imgWidth, imgHeight);
                return;
        }
        
        ctx.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            drawX, drawY, drawWidth, drawHeight
        );
    }
    
    renderTiled(ctx, image, position, imgWidth, imgHeight) {
        const { x, y, width, height } = position;
        
        // 计算平铺次数
        const tilesX = Math.ceil(width / imgWidth);
        const tilesY = Math.ceil(height / imgHeight);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        
        for (let tileY = 0; tileY < tilesY; tileY++) {
            for (let tileX = 0; tileX < tilesX; tileX++) {
                const tileDrawX = x + tileX * imgWidth;
                const tileDrawY = y + tileY * imgHeight;
                
                ctx.drawImage(image, tileDrawX, tileDrawY);
            }
        }
        
        ctx.restore();
    }
    
    renderGridCell(ctx, position) {
        const { x, y, width, height } = position;
        
        ctx.strokeStyle = this.gridLineColor;
        ctx.lineWidth = this.gridLineWidth;
        ctx.strokeRect(x, y, width, height);
    }
    
    // 渲染到新的画布（用于导出）
    renderToCanvas(gridModel) {
        const totalSize = gridModel.getTotalSize();
        const canvas = document.createElement('canvas');
        canvas.width = totalSize.width;
        canvas.height = totalSize.height;
        
        const ctx = canvas.getContext('2d');
        
        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        this.render(ctx, gridModel);
        
        return canvas;
    }
}
