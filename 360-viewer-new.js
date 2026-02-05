class Product360Viewer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._frames = [];
        this._currentFrame = 0;
        this._isDragging = false;
        this._startX = 0;
        this._isLoading = true;
        this._loadedImages = 0;
        this._dragAccumulator = 0;
        this._hasDragged = false;
        
        // Default settings
        this._settings = {
            cycleDragDistance: 20,
            autoRotateSpeed: 100,
            primaryColor: '#0066cc',
            textColor: '#333333',
            backgroundColor: '#ffffff',
            showFrameNumber: true,
            viewerTitle: '360° Product View',
            titleFontFamily: 'Arial',
            titleFontSize: 24
        };
        
        this._createUI();
    }
    
    static get observedAttributes() {
        return [
            'frames-data', 'cycle-drag-distance', 'auto-rotate-speed', 
            'primary-color', 'text-color', 'bg-color', 'show-frame-number',
            'viewer-title', 'title-font-family', 'title-font-size'
        ];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        if (name === 'frames-data' && newValue) {
            try {
                const frames = JSON.parse(newValue);
                console.log('360 Viewer: Received frames:', frames.length);
                this._loadFrames(frames);
            } catch (e) {
                console.error("360 Viewer: Error parsing frames data:", e);
                this._showError("Failed to load 360° images");
            }
        } else if (name === 'cycle-drag-distance' && newValue) {
            this._settings.cycleDragDistance = parseFloat(newValue);
        } else if (name === 'auto-rotate-speed' && newValue) {
            this._settings.autoRotateSpeed = parseFloat(newValue);
            if (this._autoRotateInterval) {
                this._stopAutoRotate();
                this._startAutoRotate();
            }
        } else if (name === 'primary-color' && newValue) {
            this._settings.primaryColor = newValue;
            this.style.setProperty('--primary-color', newValue);
            this.style.setProperty('--loader-color', newValue);
        } else if (name === 'text-color' && newValue) {
            this._settings.textColor = newValue;
            this.style.setProperty('--text-color', newValue);
        } else if (name === 'bg-color' && newValue) {
            this._settings.backgroundColor = newValue;
            this.style.setProperty('--bg-color', newValue);
        } else if (name === 'show-frame-number' && newValue) {
            this._settings.showFrameNumber = newValue === 'true';
            this._updateFrameNumberVisibility();
        } else if (name === 'viewer-title' && newValue) {
            this._settings.viewerTitle = newValue;
            this._updateTitle();
        } else if (name === 'title-font-family' && newValue) {
            this._settings.titleFontFamily = newValue;
            this.style.setProperty('--title-font-family', newValue);
        } else if (name === 'title-font-size' && newValue) {
            this._settings.titleFontSize = parseFloat(newValue);
            this.style.setProperty('--title-font-size', `${newValue}px`);
        }
    }
    
    _createUI() {
        this._shadow.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    min-height: 400px;
                    --primary-color: ${this._settings.primaryColor};
                    --text-color: ${this._settings.textColor};
                    --bg-color: ${this._settings.backgroundColor};
                    --loader-color: ${this._settings.primaryColor};
                    --title-font-family: ${this._settings.titleFontFamily};
                    --title-font-size: ${this._settings.titleFontSize}px;
                }
                
                .viewer-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    background: var(--bg-color);
                    border-radius: 8px;
                    overflow: hidden;
                    user-select: none;
                    -webkit-user-select: none;
                }
                
                .viewer-container.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    border-radius: 0;
                }
                
                .viewer-canvas {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    cursor: grab;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-color);
                }
                
                .viewer-canvas.dragging {
                    cursor: grabbing;
                }
                
                .frame-image {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    object-fit: contain;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0;
                    transition: opacity 0.05s ease;
                    display: none;
                }
                
                .frame-image.active {
                    opacity: 1;
                    display: block;
                }
                
                .viewer-title {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    padding: 20px;
                    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
                    color: white;
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    font-weight: 600;
                    text-align: center;
                    z-index: 10;
                    pointer-events: none;
                    transition: opacity 0.3s ease, transform 0.3s ease;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                }
                
                .viewer-container:hover .viewer-title:not(.dragging-active) {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                
                .viewer-title.dragging-active {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .frame-info {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    z-index: 10;
                    color: white;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
                    background: rgba(0, 0, 0, 0.5);
                    padding: 8px 12px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    transition: opacity 0.3s ease;
                }
                
                .frame-info.hidden {
                    display: none !important;
                }
                
                .frame-info.dragging-active {
                    opacity: 1 !important;
                }
                
                .viewer-container:not(:hover) .frame-info:not(.dragging-active) {
                    opacity: 0;
                }
                
                .frame-counter {
                    font-weight: 600;
                }
                
                .drag-hint {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    z-index: 10;
                    color: white;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
                    background: rgba(0, 0, 0, 0.5);
                    padding: 8px 12px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    transition: opacity 0.3s ease;
                    opacity: 0.8;
                }
                
                .drag-hint.dragging-active {
                    opacity: 0 !important;
                }
                
                .viewer-container:not(:hover) .drag-hint:not(.dragging-active) {
                    opacity: 0;
                }
                
                .control-buttons {
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: opacity 0.3s ease;
                }
                
                .control-buttons.dragging-active {
                    opacity: 0 !important;
                    pointer-events: none;
                }
                
                .viewer-container:not(:hover) .control-buttons:not(.dragging-active) {
                    opacity: 0;
                }
                
                .control-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.95);
                    border: 2px solid var(--primary-color);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    position: relative;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                }
                
                .control-btn:hover {
                    background: var(--primary-color);
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                }
                
                .control-btn svg {
                    width: 22px;
                    height: 22px;
                    fill: var(--primary-color);
                    transition: fill 0.3s ease;
                }
                
                .control-btn:hover svg {
                    fill: white;
                }
                
                .control-btn.active {
                    background: #28a745;
                    border-color: #28a745;
                }
                
                .control-btn.active svg {
                    fill: white;
                }
                
                .control-btn.active:hover {
                    background: #218838;
                    border-color: #218838;
                }
                
                .tooltip {
                    position: absolute;
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%) translateX(-12px);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    z-index: 100;
                }
                
                .tooltip::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 100%;
                    transform: translateY(-50%);
                    border: 5px solid transparent;
                    border-left-color: rgba(0, 0, 0, 0.9);
                }
                
                .control-btn:hover .tooltip {
                    opacity: 1;
                }
                
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    gap: 15px;
                }
                
                .loading-overlay.hidden {
                    display: none;
                }
                
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(0, 102, 204, 0.1);
                    border-top-color: var(--loader-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .loading-text {
                    color: var(--text-color);
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .progress-bar {
                    width: 200px;
                    height: 4px;
                    background: rgba(0, 102, 204, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: var(--loader-color);
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .error-message, .no-data-message {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: var(--bg-color);
                }
                
                .error-message {
                    color: #dc3545;
                }
                
                .no-data-message {
                    color: var(--text-color);
                }
                
                @media (max-width: 768px) {
                    .viewer-title {
                        font-size: calc(var(--title-font-size) * 0.8);
                        padding: 15px;
                    }
                    
                    .control-btn {
                        width: 44px;
                        height: 44px;
                    }
                    
                    .control-btn svg {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .control-buttons {
                        gap: 10px;
                        bottom: 15px;
                        right: 15px;
                    }
                    
                    .frame-info {
                        top: 15px;
                        right: 15px;
                        font-size: 12px;
                        padding: 6px 10px;
                    }
                    
                    .drag-hint {
                        bottom: 15px;
                        left: 15px;
                        font-size: 12px;
                        padding: 6px 10px;
                    }
                    
                    .tooltip {
                        display: none;
                    }
                }
            </style>
            
            <div class="viewer-container">
                <div class="no-data-message">
                    Loading 360° viewer...
                </div>
            </div>
        `;
    }
    
    _loadFrames(frameUrls) {
        if (!frameUrls || frameUrls.length === 0) {
            this._showError("No 360° frames available");
            return;
        }
        
        this._frames = frameUrls;
        this._loadedImages = 0;
        this._isLoading = true;
        this._currentFrame = 0;
        
        const container = this._shadow.querySelector('.viewer-container');
        container.innerHTML = `
            <div class="loading-overlay">
                <div class="spinner"></div>
                <div class="loading-text">Loading 360° View...</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
            
            <div class="viewer-canvas"></div>
            
            <h2 class="viewer-title">${this._settings.viewerTitle}</h2>
            
            <div class="frame-info ${this._settings.showFrameNumber ? '' : 'hidden'}">
                <span class="frame-counter">
                    Frame: <span class="current-frame">1</span> / <span class="total-frames">${this._frames.length}</span>
                </span>
            </div>
            
            <div class="drag-hint">Drag to rotate</div>
            
            <div class="control-buttons">
                <button class="control-btn auto-rotate-btn" aria-label="Auto Rotate">
                    <span class="tooltip">Auto Rotate</span>
                    <svg viewBox="0 0 24 24">
                        <path d="M12,4V2C6.48,2 2,6.48 2,12H4C4,7.58 7.58,4 12,4M12,20C7.58,20 4,16.42 4,12H2C2,17.52 6.48,22 12,22V20M17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12M22,12C22,6.48 17.52,2 12,2V4C16.42,4 20,7.58 20,12C20,16.42 16.42,20 12,20V22C17.52,22 22,17.52 22,12Z"/>
                    </svg>
                </button>
                
                <button class="control-btn reset-btn" aria-label="Reset View">
                    <span class="tooltip">Reset View</span>
                    <svg viewBox="0 0 24 24">
                        <path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z"/>
                    </svg>
                </button>
                
                <button class="control-btn fullscreen-btn" aria-label="Fullscreen">
                    <span class="tooltip">Fullscreen</span>
                    <svg class="maximize-icon" viewBox="0 0 24 24">
                        <path d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z"/>
                    </svg>
                    <svg class="minimize-icon" viewBox="0 0 24 24" style="display: none;">
                        <path d="M14,14H19V16H16V19H14V14M5,14H10V19H8V16H5V14M8,5H10V10H5V8H8V5M19,8V10H14V5H16V8H19Z"/>
                    </svg>
                </button>
            </div>
        `;
        
        const canvas = this._shadow.querySelector('.viewer-canvas');
        
        this._frames.forEach((url, index) => {
            const img = document.createElement('img');
            img.className = 'frame-image';
            img.src = url;
            
            if (index === 0) {
                img.classList.add('active');
            }
            
            img.onload = () => {
                this._loadedImages++;
                this._updateProgress();
                
                if (this._loadedImages === this._frames.length) {
                    this._hideLoading();
                }
            };
            
            img.onerror = () => {
                console.error(`360 Viewer: Failed to load frame: ${url}`);
                this._loadedImages++;
                this._updateProgress();
                
                if (this._loadedImages === this._frames.length) {
                    this._hideLoading();
                }
            };
            
            canvas.appendChild(img);
        });
        
        this._setupEventListeners();
    }
    
    _updateTitle() {
        const title = this._shadow.querySelector('.viewer-title');
        if (title) {
            title.textContent = this._settings.viewerTitle;
        }
    }
    
    _updateFrameNumberVisibility() {
        const frameInfo = this._shadow.querySelector('.frame-info');
        if (frameInfo) {
            if (this._settings.showFrameNumber) {
                frameInfo.classList.remove('hidden');
            } else {
                frameInfo.classList.add('hidden');
            }
        }
    }
    
    _updateProgress() {
        const progress = (this._loadedImages / this._frames.length) * 100;
        const progressFill = this._shadow.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }
    
    _hideLoading() {
        const loadingOverlay = this._shadow.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        this._isLoading = false;
    }
    
    _showError(message) {
        const container = this._shadow.querySelector('.viewer-container');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
    
    _setDraggingUI(isDragging) {
        const title = this._shadow.querySelector('.viewer-title');
        const frameInfo = this._shadow.querySelector('.frame-info');
        const dragHint = this._shadow.querySelector('.drag-hint');
        const controlButtons = this._shadow.querySelector('.control-buttons');
        
        if (isDragging) {
            if (title) title.classList.add('dragging-active');
            if (frameInfo) frameInfo.classList.add('dragging-active');
            if (dragHint) dragHint.classList.add('dragging-active');
            if (controlButtons) controlButtons.classList.add('dragging-active');
        } else {
            if (title) title.classList.remove('dragging-active');
            if (frameInfo) frameInfo.classList.remove('dragging-active');
            if (dragHint) dragHint.classList.remove('dragging-active');
            if (controlButtons) controlButtons.classList.remove('dragging-active');
        }
    }
    
    _setupEventListeners() {
        const canvas = this._shadow.querySelector('.viewer-canvas');
        if (!canvas) return;
        
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
        
        newCanvas.addEventListener('mousedown', (e) => this._startDrag(e));
        document.addEventListener('mousemove', (e) => this._onDrag(e));
        document.addEventListener('mouseup', () => this._endDrag());
        
        newCanvas.addEventListener('touchstart', (e) => this._startDrag(e), { passive: false });
        newCanvas.addEventListener('touchmove', (e) => this._onDrag(e), { passive: false });
        newCanvas.addEventListener('touchend', () => this._endDrag());
        
        const autoRotateBtn = this._shadow.querySelector('.auto-rotate-btn');
        if (autoRotateBtn) {
            autoRotateBtn.addEventListener('click', () => this._toggleAutoRotate());
        }
        
        const resetBtn = this._shadow.querySelector('.reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this._resetView());
        }
        
        const fullscreenBtn = this._shadow.querySelector('.fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this._toggleFullscreen());
        }
    }
    
    _startDrag(e) {
        if (this._isLoading) return;
        
        this._isDragging = true;
        this._hasDragged = false;
        this._startX = this._getClientX(e);
        this._dragAccumulator = 0;
        
        const canvas = this._shadow.querySelector('.viewer-canvas');
        if (canvas) {
            canvas.classList.add('dragging');
        }
        
        if (this._autoRotateInterval) {
            this._stopAutoRotate();
        }
        
        e.preventDefault();
    }
    
    _onDrag(e) {
        if (!this._isDragging || this._isLoading) return;
        
        const currentX = this._getClientX(e);
        const deltaX = currentX - this._startX;
        
        if (!this._hasDragged && Math.abs(deltaX) > 5) {
            this._hasDragged = true;
            this._setDraggingUI(true);
        }
        
        const viewportWidth = window.innerWidth;
        const cycleDragPixels = (this._settings.cycleDragDistance / 100) * viewportWidth;
        const pixelsPerFrame = cycleDragPixels / this._frames.length;
        
        this._dragAccumulator += deltaX;
        
        const framesToMove = Math.floor(Math.abs(this._dragAccumulator) / pixelsPerFrame);
        
        if (framesToMove > 0) {
            const direction = this._dragAccumulator > 0 ? 1 : -1;
            
            for (let i = 0; i < framesToMove; i++) {
                this._changeFrame(direction);
            }
            
            this._dragAccumulator = this._dragAccumulator % pixelsPerFrame;
        }
        
        this._startX = currentX;
        e.preventDefault();
    }
    
    _endDrag() {
        if (!this._isDragging) return;
        
        this._isDragging = false;
        this._dragAccumulator = 0;
        
        const canvas = this._shadow.querySelector('.viewer-canvas');
        if (canvas) {
            canvas.classList.remove('dragging');
        }
        
        setTimeout(() => {
            if (!this._isDragging) {
                this._setDraggingUI(false);
                this._hasDragged = false;
            }
        }, 100);
    }
    
    _getClientX(e) {
        return e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    }
    
    _changeFrame(direction) {
        if (this._frames.length === 0) return;
        
        this._currentFrame += direction;
        
        if (this._currentFrame < 0) {
            this._currentFrame = this._frames.length - 1;
        } else if (this._currentFrame >= this._frames.length) {
            this._currentFrame = 0;
        }
        
        this._updateDisplay();
    }
    
    _updateDisplay() {
        const images = this._shadow.querySelectorAll('.frame-image');
        images.forEach((img, index) => {
            if (index === this._currentFrame) {
                img.classList.add('active');
            } else {
                img.classList.remove('active');
            }
        });
        
        const currentFrameEl = this._shadow.querySelector('.current-frame');
        if (currentFrameEl) {
            currentFrameEl.textContent = this._currentFrame + 1;
        }
    }
    
    _toggleAutoRotate() {
        const btn = this._shadow.querySelector('.auto-rotate-btn');
        
        if (this._autoRotateInterval) {
            this._stopAutoRotate();
            if (btn) btn.classList.remove('active');
        } else {
            this._startAutoRotate();
            if (btn) btn.classList.add('active');
        }
    }
    
    _startAutoRotate() {
        this._autoRotateInterval = setInterval(() => {
            this._changeFrame(1);
        }, this._settings.autoRotateSpeed);
    }
    
    _stopAutoRotate() {
        if (this._autoRotateInterval) {
            clearInterval(this._autoRotateInterval);
            this._autoRotateInterval = null;
        }
    }
    
    _resetView() {
        this._currentFrame = 0;
        this._updateDisplay();
        
        if (this._autoRotateInterval) {
            this._stopAutoRotate();
            const btn = this._shadow.querySelector('.auto-rotate-btn');
            if (btn) btn.classList.remove('active');
        }
    }
    
    _toggleFullscreen() {
        const container = this._shadow.querySelector('.viewer-container');
        const fullscreenBtn = this._shadow.querySelector('.fullscreen-btn');
        const maximizeIcon = fullscreenBtn.querySelector('.maximize-icon');
        const minimizeIcon = fullscreenBtn.querySelector('.minimize-icon');
        
        if (!container.classList.contains('fullscreen')) {
            container.classList.add('fullscreen');
            maximizeIcon.style.display = 'none';
            minimizeIcon.style.display = 'block';
            
            const tooltip = fullscreenBtn.querySelector('.tooltip');
            if (tooltip) tooltip.textContent = 'Exit Fullscreen';
            
            document.body.style.overflow = 'hidden';
        } else {
            container.classList.remove('fullscreen');
            maximizeIcon.style.display = 'block';
            minimizeIcon.style.display = 'none';
            
            const tooltip = fullscreenBtn.querySelector('.tooltip');
            if (tooltip) tooltip.textContent = 'Fullscreen';
            
            document.body.style.overflow = '';
        }
    }
    
    disconnectedCallback() {
        if (this._autoRotateInterval) {
            clearInterval(this._autoRotateInterval);
        }
        document.body.style.overflow = '';
    }
}

customElements.define('product-360-viewer', Product360Viewer);
console.log('360 Viewer: Custom element registered');
