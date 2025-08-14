export class UIManager {
    constructor(app) {
        this.app = app;
        this.init();
    }
    
    init() {
        this.bindTabEvents();
        this.bindGridControls();
        this.bindExportControls();
        this.bindBatchControls();
    }
    
    bindTabEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // 更新按钮状态
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新内容面板
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetTab + '-panel') {
                        content.classList.add('active');
                    }
                });
            });
        });
    }
    
    bindGridControls() {
        // 布局预设
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;
                const [rows, cols] = layout.split('x').map(Number);
                
                this.updateLayout(rows, cols);
                this.updatePresetButtons(btn);
            });
        });
        
        // 自定义布局
        const rowsInput = document.getElementById('rows');
        const colsInput = document.getElementById('cols');
        
        [rowsInput, colsInput].forEach(input => {
            input.addEventListener('change', () => {
                const rows = parseInt(rowsInput.value) || 2;
                const cols = parseInt(colsInput.value) || 2;
                this.updateLayout(rows, cols);
                this.clearPresetButtons();
            });
        });
        
        // 单元格大小模式
        const sizeMode = document.getElementById('cell-size-mode');
        const sizeInputs = document.getElementById('size-inputs');
        
        sizeMode.addEventListener('change', () => {
            const mode = sizeMode.value;
            sizeInputs.style.display = mode === 'fixed' ? 'flex' : 'none';
            
            this.app.gridModel.setConfig({ sizeMode: mode });
        });
        
        // 单元格尺寸
        const widthInput = document.getElementById('cell-width');
        const heightInput = document.getElementById('cell-height');
        
        [widthInput, heightInput].forEach(input => {
            input.addEventListener('change', () => {
                const width = parseInt(widthInput.value) || 300;
                const height = parseInt(heightInput.value) || 300;
                
                this.app.gridModel.setConfig({
                    cellWidth: Math.max(50, Math.min(2000, width)),
                    cellHeight: Math.max(50, Math.min(2000, height))
                });
            });
        });
        
        // 填充模式
        const fitMode = document.getElementById('fit-mode');
        fitMode.addEventListener('change', () => {
            this.app.gridModel.setConfig({ fitMode: fitMode.value });
        });
        
        // 间距
        const gapSlider = document.getElementById('gap');
        const gapValue = document.getElementById('gap-value');
        
        gapSlider.addEventListener('input', () => {
            const gap = parseInt(gapSlider.value);
            gapValue.textContent = gap + 'px';
            this.app.gridModel.setConfig({ gap });
        });
        
        // 网格线
        const showGrid = document.getElementById('show-grid');
        showGrid.addEventListener('change', () => {
            this.app.gridModel.setConfig({ showGrid: showGrid.checked });
        });
    }
    
    bindExportControls() {
        // 导出格式
        const exportFormat = document.getElementById('export-format');
        const qualityControl = document.getElementById('quality-control');
        
        exportFormat.addEventListener('change', () => {
            const isJpeg = exportFormat.value === 'jpeg';
            qualityControl.style.display = isJpeg ? 'block' : 'none';
        });
        
        // 质量滑块
        const qualitySlider = document.getElementById('quality');
        const qualityValue = document.getElementById('quality-value');
        
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = qualitySlider.value + '%';
        });
        
        // 导出按钮
        const exportBtn = document.getElementById('export-btn');
        exportBtn.addEventListener('click', () => {
            this.app.exportImage();
        });
        
        // 清空按钮
        const clearAllBtn = document.getElementById('clear-all');
        clearAllBtn.addEventListener('click', () => {
            if (confirm('确定要清空所有图片吗？')) {
                this.app.clearAll();
            }
        });
    }
    
    bindBatchControls() {
        // 文件选择
        const selectFilesBtn = document.getElementById('select-files');
        const selectFolderBtn = document.getElementById('select-folder');
        
        selectFilesBtn.addEventListener('click', () => {
            this.selectFiles();
        });
        
        // 检查是否支持目录选择
        if ('showDirectoryPicker' in window) {
            selectFolderBtn.style.display = 'inline-block';
            selectFolderBtn.addEventListener('click', () => {
                this.selectFolder();
            });
        }
        
        // 批量质量滑块
        const batchQuality = document.getElementById('batch-quality');
        const batchQualityValue = document.getElementById('batch-quality-value');
        
        batchQuality.addEventListener('input', () => {
            batchQualityValue.textContent = batchQuality.value + '%';
        });
        
        // 开始批量处理
        const startBatchBtn = document.getElementById('start-batch');
        startBatchBtn.addEventListener('click', () => {
            this.startBatchProcess();
        });
    }
    
    updateLayout(rows, cols) {
        document.getElementById('rows').value = rows;
        document.getElementById('cols').value = cols;
        this.app.gridModel.setConfig({ rows, cols });
    }
    
    updatePresetButtons(activeBtn) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    clearPresetButtons() {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    async selectFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.updateFileList(files);
        };
        
        input.click();
    }
    
    async selectFolder() {
        try {
            const dirHandle = await window.showDirectoryPicker();
            const files = [];
            
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    if (file.type.startsWith('image/')) {
                        files.push(file);
                    }
                }
            }
            
            this.updateFileList(files);
        } catch (error) {
            console.error('选择文件夹失败:', error);
        }
    }
    
    updateFileList(files) {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = `${index + 1}. ${file.name}`;
            fileList.appendChild(item);
        });
        
        // 存储文件列表
        this.batchFiles = files;
    }
    
    async startBatchProcess() {
        if (!this.batchFiles || this.batchFiles.length === 0) {
            alert('请先选择图片文件');
            return;
        }
        
        const pattern = document.getElementById('pattern').value;
        const mode = document.getElementById('batch-mode').value;
        const width = parseInt(document.getElementById('target-width').value);
        const height = parseInt(document.getElementById('target-height').value);
        const format = document.getElementById('batch-format').value;
        const quality = parseInt(document.getElementById('batch-quality').value) / 100;
        
        const options = {
            pattern,
            mode,
            targetSize: { width, height },
            format,
            quality
        };
        
        await this.app.processBatch(this.batchFiles, options);
    }
}
