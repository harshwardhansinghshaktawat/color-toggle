class Product360Dashboard extends HTMLElement {
    constructor() {
        super();
        console.log('🎥 Dashboard: Initializing...');
        this._shadow = this.attachShadow({ mode: 'open' });
        this._products = [];
        this._data360Items = [];
        this._currentPage = 0;
        this._pageSize = 12;
        this._totalProducts = 0;
        this._selectedProduct = null;
        this._videoFile = null;
        this._extractedFrames = [];
        this._root = document.createElement('div');
        
        this._createStructure();
        this._setupEventListeners();
        console.log('🎥 Dashboard: Complete');
    }
    
    static get observedAttributes() {
        return ['product-data', 'notification', 'upload-progress'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'product-data' && newValue && newValue !== oldValue) {
            try {
                const data = JSON.parse(newValue);
                this.setProducts(data);
            } catch (e) {
                console.error('🎥 Dashboard: Parse error:', e);
            }
        }
        
        if (name === 'notification' && newValue && newValue !== oldValue) {
            try {
                const notification = JSON.parse(newValue);
                this._showToast(notification.type, notification.message);
                if (notification.type === 'success') {
                    this._hideModal();
                }
            } catch (e) {
                console.error('🎥 Dashboard: Notification error:', e);
            }
        }
        
        if (name === 'upload-progress' && newValue && newValue !== oldValue) {
            try {
                const progress = JSON.parse(newValue);
                this._updateUploadProgress(progress);
            } catch (e) {
                console.error('🎥 Dashboard: Progress error:', e);
            }
        }
    }
    
    connectedCallback() {
        console.log('🎥 Dashboard: Connected to DOM');
    }
    
    _createStructure() {
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                :host {
                    display: block;
                    width: 100%;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: #f9fafb;
                }
                
                .container { width: 100%; min-height: 600px; }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 32px;
                }
                
                .header-content { max-width: 1400px; margin: 0 auto; }
                
                .title {
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                
                .subtitle {
                    font-size: 16px;
                    opacity: 0.95;
                }
                
                .stats {
                    display: flex;
                    gap: 24px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }
                
                .stat {
                    background: rgba(255,255,255,0.15);
                    padding: 16px 20px;
                    border-radius: 12px;
                    min-width: 140px;
                }
                
                .stat-label { font-size: 13px; opacity: 0.9; }
                .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
                
                .main { padding: 32px; }
                
                .content { max-width: 1400px; margin: 0 auto; }
                
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }
                
                .card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    border: 1px solid #e5e7eb;
    transition: all 0.3s;
    display: flex; /* Add this */
    flex-direction: column; /* Add this */
}

.card-body { 
    padding: 20px; 
    flex: 1; /* Add this */
    display: flex; /* Add this */
    flex-direction: column; /* Add this */
}
                
                .card:hover {
                    box-shadow: 0 20px 25px rgba(0,0,0,0.1);
                    transform: translateY(-8px);
                }
                
                .card-img {
    width: 100%;
    height: 220px;
    object-fit: cover;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    display: block; /* Add this */
}
                
                
                .card-name {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .badge {
                    display: inline-flex;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                }
                
                .badge-success { background: #d1fae5; color: #065f46; }
                .badge-danger { background: #fee2e2; color: #991b1b; }
                
                .btn {
                    width: 100%;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                    margin-bottom: 8px;
                }
                
                .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .btn-primary { background: #8b5cf6; color: white; }
                .btn-warning { background: #f59e0b; color: white; }
                .btn-danger { background: #ef4444; color: white; }
                
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .modal.active { display: flex; }
                
                .modal-content {
                    background: white;
                    border-radius: 20px;
                    max-width: 700px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-title { font-size: 24px; font-weight: 700; }
                
                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                }
                
                .modal-body { padding: 32px; }
                
                .form-group { margin-bottom: 20px; }
                
                .label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                
                .input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                }
                
                .input:focus {
                    outline: none;
                    border-color: #8b5cf6;
                }
                
                .file-input { display: none; }
                
                .file-label {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 24px;
                    border: 2px dashed #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    background: #f9fafb;
                }
                
                .file-label:hover { border-color: #8b5cf6; background: #ede9fe; }
                
                .file-info {
                    margin-top: 12px;
                    padding: 12px;
                    background: #ede9fe;
                    border-radius: 8px;
                    display: none;
                }
                
                .file-info.active { display: block; }
                
                .progress-section { margin-top: 24px; display: none; }
                .progress-section.active { display: block; }
                
                .progress-bar-bg {
                    width: 100%;
                    height: 12px;
                    background: #f3f4f6;
                    border-radius: 6px;
                    overflow: hidden;
                    margin-top: 12px;
                }
                
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #8b5cf6, #7c3aed);
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .preview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                    gap: 12px;
                    margin-top: 16px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 12px;
                }
                
                .preview-frame {
                    aspect-ratio: 1;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid #e5e7eb;
                }
                
                .preview-frame img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .warning-box {
                    background: #fef3c7;
                    border: 2px solid #f59e0b;
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 16px;
                    display: none;
                }
                
                .warning-box.active { display: block; }
                
                .warning-box strong {
                    color: #92400e;
                    font-size: 15px;
                }
                
                .warning-box p {
                    color: #78350f;
                    margin-top: 8px;
                    font-size: 13px;
                }
                
                .modal-footer {
                    padding: 20px 32px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px rgba(0,0,0,0.1);
                    display: none;
                    z-index: 2000;
                    min-width: 320px;
                    animation: slideIn 0.3s;
                }
                
                .toast.show { display: block; }
                
                .toast-success {
                    background: #f0fdf4;
                    border-left: 4px solid #10b981;
                    color: #166534;
                }
                
                .toast-error {
                    background: #fef2f2;
                    border-left: 4px solid #ef4444;
                    color: #991b1b;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    min-height: 400px;
                }
                
                .loading.hide { display: none; }
                
                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #e5e7eb;
                    border-top-color: #8b5cf6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            
            <div class="container">
                <div class="header">
                    <div class="header-content">
                        <h1 class="title">360° Product Image Manager</h1>
                        <p class="subtitle">Convert videos to 360° views with automatic upload</p>
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-label">Total Products</div>
                                <div class="stat-value" id="totalProducts">0</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">With 360°</div>
                                <div class="stat-value" id="with360">0</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">Pending</div>
                                <div class="stat-value" id="pending">0</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="main">
                    <div class="content">
                        <div id="loading" class="loading">
                            <div class="spinner"></div>
                            <p style="margin-top: 16px; color: #6b7280;">Loading products...</p>
                        </div>
                        
                        <div id="productsGrid" class="grid"></div>
                        
                        <div style="display: flex; justify-content: center; gap: 16px; margin-top: 32px; align-items: center;" id="pagination">
                            <button class="btn btn-primary" id="prevBtn" disabled style="width: auto; padding: 12px 24px;">← Previous</button>
                            <span id="pageInfo" style="font-weight: 600; color: #374151;">Page 1</span>
                            <button class="btn btn-primary" id="nextBtn" style="width: auto; padding: 12px 24px;">Next →</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title" id="modalTitle">Upload 360° Video</h2>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div id="uploadSection">
                            <div class="form-group">
                                <label class="label">Select Video File</label>
                                <input type="file" class="file-input" id="videoInput" accept="video/*">
                                <label for="videoInput" class="file-label">
                                    <span style="font-size: 32px;">📹</span>
                                    <div>
                                        <div style="font-weight: 600;">Click to upload video</div>
                                        <div style="font-size: 12px; color: #6b7280;">MP4, MOV, AVI supported</div>
                                    </div>
                                </label>
                                <div class="file-info" id="fileInfo"></div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label class="label">Number of Frames</label>
                                    <input type="number" class="input" id="frameCount" value="36" min="12" max="120">
                                </div>
                                
                                <div class="form-group">
                                    <label class="label">Quality</label>
                                    <select class="input" id="quality">
                                        <option value="0.95">High</option>
                                        <option value="0.85" selected>Medium</option>
                                        <option value="0.75">Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="progress-section" id="progressSection">
    <div style="margin-bottom: 8px; font-weight: 600; font-size: 16px;" id="progressLabel">Processing...</div>
    <div class="progress-bar-bg">
        <div class="progress-bar" id="progressBar"></div>
    </div>
    <div style="margin-top: 12px; color: #6b7280; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
        <span id="progressStatus">Initializing...</span>
        <span id="frameCounter" style="font-weight: 600;"></span>
    </div>
    
    <div class="warning-box" id="warningBox">
        <strong>⚠️ Upload in Progress</strong>
        <p>Please do not close this tab or navigate away until the upload is complete.</p>
    </div>
    
    <div class="preview-grid" id="previewGrid" style="display: none;"></div>
</div>
                    
                    <div class="modal-footer">
                        <button class="btn" style="background: #f3f4f6; color: #111827;" id="cancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="processBtn" disabled>Extract Frames</button>
                        <button class="btn" style="background: #10b981; color: white; display: none;" id="uploadBtn">Upload to Media Manager</button>
                    </div>
                </div>
            </div>
            
            <div class="toast" id="toast"></div>
        `;
        
        this._shadow.appendChild(this._root);
    }

    _setupEventListeners() {
        // Modal controls
        this._shadow.getElementById('closeModal').addEventListener('click', () => this._hideModal());
        this._shadow.getElementById('cancelBtn').addEventListener('click', () => this._hideModal());
        
        // Video input
        this._shadow.getElementById('videoInput').addEventListener('change', (e) => this._handleVideoSelect(e));
        
        // Process & upload
        this._shadow.getElementById('processBtn').addEventListener('click', () => this._processVideo());
        this._shadow.getElementById('uploadBtn').addEventListener('click', () => this._uploadFrames());
        
        // Pagination
        this._shadow.getElementById('prevBtn').addEventListener('click', () => {
            if (this._currentPage > 0) {
                this._currentPage--;
                this._loadProducts();
            }
        });
        
        this._shadow.getElementById('nextBtn').addEventListener('click', () => {
            this._currentPage++;
            this._loadProducts();
        });
    }
    
    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    
    _loadProducts() {
        const loading = this._shadow.getElementById('loading');
        loading.classList.remove('hide');
        
        this._dispatchEvent('load-products', {
            limit: this._pageSize,
            skip: this._currentPage * this._pageSize
        });
    }
    
    setProducts(data) {
        this._products = data.products || [];
        this._totalProducts = data.totalCount || 0;
        this._data360Items = data.data360Items || [];
        
        this._shadow.getElementById('loading').classList.add('hide');
        this._renderProducts();
        this._updateStats();
        this._updatePagination(data.hasMore);
    }
    
    _updatePagination(hasMore) {
        const prevBtn = this._shadow.getElementById('prevBtn');
        const nextBtn = this._shadow.getElementById('nextBtn');
        const pageInfo = this._shadow.getElementById('pageInfo');
        
        prevBtn.disabled = this._currentPage === 0;
        nextBtn.disabled = !hasMore;
        
        const currentPageNum = this._currentPage + 1;
        const totalPages = Math.ceil(this._totalProducts / this._pageSize);
        pageInfo.textContent = `Page ${currentPageNum} of ${totalPages}`;
    }
    
    _renderProducts() {
        const grid = this._shadow.getElementById('productsGrid');
        grid.innerHTML = '';
        
        this._products.forEach(product => {
            const data360 = this._data360Items.find(item => item.title === product.name);
            const has360 = !!data360;
            
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" class="card-img">
                <div class="card-body">
                    <div class="badge ${has360 ? 'badge-success' : 'badge-danger'}">
                        ${has360 ? '✓ 360° Active' : '✗ No 360°'}
                    </div>
                    <div class="card-name">${product.name}</div>
                    ${has360 ? `
                        <button class="btn btn-warning edit-btn">🔄 Update</button>
                        <button class="btn btn-danger delete-btn">🗑️ Delete</button>
                    ` : `
                        <button class="btn btn-primary add-btn">📹 Add 360°</button>
                    `}
                </div>
            `;
            
            const addBtn = card.querySelector('.add-btn');
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            
            if (addBtn) addBtn.addEventListener('click', () => this._showModal(product));
            if (editBtn) editBtn.addEventListener('click', () => this._showModal(product));
            if (deleteBtn) deleteBtn.addEventListener('click', () => this._delete360(product, data360));
            
            grid.appendChild(card);
        });
    }
    
    _showModal(product) {
        console.log('🎥 Dashboard: Opening modal for product:', product.name);
        
        this._selectedProduct = product;
        this._videoFile = null;
        this._extractedFrames = [];
        
        // Reset modal state
        const uploadSection = this._shadow.getElementById('uploadSection');
        const progressSection = this._shadow.getElementById('progressSection');
        const processBtn = this._shadow.getElementById('processBtn');
        const uploadBtn = this._shadow.getElementById('uploadBtn');
        const previewGrid = this._shadow.getElementById('previewGrid');
        const warningBox = this._shadow.getElementById('warningBox');
        
        // Show upload section, hide progress
        uploadSection.style.display = 'block';
        progressSection.classList.remove('active');
        progressSection.style.display = 'none';
        warningBox.classList.remove('active');
        
        // Reset buttons
        processBtn.style.display = 'inline-block';
        processBtn.disabled = true;
        uploadBtn.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload to Media Manager';
        
        // Clear preview
        previewGrid.innerHTML = '';
        previewGrid.style.display = 'none';
        
        // Reset form
        this._shadow.getElementById('modalTitle').textContent = 'Add 360° View - ' + product.name;
        this._shadow.getElementById('videoInput').value = '';
        this._shadow.getElementById('fileInfo').classList.remove('active');
        this._shadow.getElementById('fileInfo').innerHTML = '';
        this._shadow.getElementById('frameCount').value = '36';
        this._shadow.getElementById('quality').value = '0.85';
        
        // Show modal
        this._shadow.getElementById('modal').classList.add('active');
        
        console.log('🎥 Dashboard: Modal opened and reset');
    }
    
    _hideModal() {
        this._shadow.getElementById('modal').classList.remove('active');
    }
    
    _handleVideoSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        this._videoFile = file;
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        
        this._shadow.getElementById('fileInfo').innerHTML = `
            <strong>📹 ${file.name}</strong><br>
            Size: ${sizeMB} MB | Type: ${file.type}
        `;
        this._shadow.getElementById('fileInfo').classList.add('active');
        this._shadow.getElementById('processBtn').disabled = false;
    }
    
    async _processVideo() {
        if (!this._videoFile) return;
        
        const uploadSection = this._shadow.getElementById('uploadSection');
        const progressSection = this._shadow.getElementById('progressSection');
        const processBtn = this._shadow.getElementById('processBtn');
        const uploadBtn = this._shadow.getElementById('uploadBtn');
        
        // Show progress section
        uploadSection.style.display = 'none';
        progressSection.style.display = 'block';
        progressSection.classList.add('active');
        processBtn.style.display = 'none';
        
        const frameCount = parseInt(this._shadow.getElementById('frameCount').value);
        const quality = parseFloat(this._shadow.getElementById('quality').value);
        
        try {
            console.log('🎥 Dashboard: Creating video element...');
            const video = document.createElement('video');
            video.src = URL.createObjectURL(this._videoFile);
            
            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
            });
            
            console.log('🎥 Dashboard: Video loaded. Duration:', video.duration, 'seconds');
            console.log('🎥 Dashboard: Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            this._extractedFrames = [];
            const previewGrid = this._shadow.getElementById('previewGrid');
            previewGrid.innerHTML = '';
            previewGrid.style.display = 'grid';
            
            const interval = video.duration / frameCount;
            
            console.log('🎥 Dashboard: Starting frame extraction...');
            
            for (let i = 0; i < frameCount; i++) {
                const time = i * interval;
                const progress = ((i + 1) / frameCount) * 100;
                
                console.log(`🎥 Dashboard: Extracting frame ${i + 1}/${frameCount} at ${time.toFixed(2)}s`);
                
                this._updateProgress(progress, `Extracting frame ${i + 1} of ${frameCount}...`);
                
                video.currentTime = time;
                await new Promise(resolve => { video.onseeked = resolve; });
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/webp', quality);
                });
                
                const frameData = {
                    blob: blob,
                    dataUrl: canvas.toDataURL('image/webp', quality),
                    index: i
                };
                this._extractedFrames.push(frameData);
                
                // Add to preview
                const preview = document.createElement('div');
                preview.className = 'preview-frame';
                preview.innerHTML = `<img src="${frameData.dataUrl}" alt="Frame ${i + 1}">`;
                previewGrid.appendChild(preview);
            }
            
            URL.revokeObjectURL(video.src);
            
            console.log('🎥 Dashboard: ✅ Extraction complete!', this._extractedFrames.length, 'frames');
            
            this._updateProgress(100, `✅ Successfully extracted ${frameCount} frames!`);
            uploadBtn.style.display = 'block';
            
        } catch (error) {
            console.error('🎥 Dashboard: Processing error:', error);
            this._showToast('error', 'Failed to process video: ' + error.message);
            this._hideModal();
        }
    }
    
    async _uploadFrames() {
        console.log('🎥 Dashboard: ═══════════════════════════════════════');
        console.log('🎥 Dashboard: _uploadFrames called');
        
        if (!this._selectedProduct || this._extractedFrames.length === 0) {
            console.error('🎥 Dashboard: Missing data');
            return;
        }
        
        const uploadBtn = this._shadow.getElementById('uploadBtn');
        const warningBox = this._shadow.getElementById('warningBox');
        const cancelBtn = this._shadow.getElementById('cancelBtn');
        const closeBtn = this._shadow.getElementById('closeModal');
        
        // Disable buttons and show warning
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        cancelBtn.disabled = true;
        closeBtn.disabled = true;
        warningBox.classList.add('active');
        
        this._updateProgress(5, 'Preparing frames for upload...');
        
        try {
            console.log('🎥 Dashboard: Converting frames to base64...');
            
            const framesData = await Promise.all(
                this._extractedFrames.map(async (frame, index) => {
                    const reader = new FileReader();
                    return new Promise((resolve) => {
                        reader.onloadend = () => {
                            const base64Data = reader.result.split(',')[1];
                            resolve({
                                data: base64Data,
                                index: index,
                                filename: `frame-${String(index + 1).padStart(3, '0')}.webp`
                            });
                        };
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(frame.blob);
                    });
                })
            );
            
            const validFrames = framesData.filter(f => f !== null);
            console.log('🎥 Dashboard: Valid frames ready:', validFrames.length);
            
            if (validFrames.length === 0) {
                throw new Error('No valid frames to upload');
            }
            
            this._updateProgress(10, 'Uploading to Media Manager...');
            
            console.log('🎥 Dashboard: Dispatching upload-frames event');
            
            this._dispatchEvent('upload-frames', {
                frames: validFrames,
                productId: this._selectedProduct.id,
                productName: this._selectedProduct.name
            });
            
            console.log('🎥 Dashboard: Event dispatched');
            console.log('🎥 Dashboard: ═══════════════════════════════════════');
            
        } catch (error) {
            console.error('🎥 Dashboard: Upload error:', error);
            this._showToast('error', 'Failed to prepare upload: ' + error.message);
            
            // Re-enable buttons
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload to Media Manager';
            cancelBtn.disabled = false;
            closeBtn.disabled = false;
            warningBox.classList.remove('active');
        }
    }
    
    _updateProgress(percent, label) {
        const progressBar = this._shadow.getElementById('progressBar');
        const progressLabel = this._shadow.getElementById('progressLabel');
        const progressStatus = this._shadow.getElementById('progressStatus');
        
        if (progressBar) progressBar.style.width = percent + '%';
        if (progressLabel) progressLabel.textContent = label;
        if (progressStatus) progressStatus.textContent = Math.round(percent) + '%';
    }
    
    _updateUploadProgress(progress) {
    const progressBar = this._shadow.getElementById('progressBar');
    const progressLabel = this._shadow.getElementById('progressLabel');
    const progressStatus = this._shadow.getElementById('progressStatus');
    
    if (progress.status === 'uploading') {
        // Update progress bar
        if (progressBar) {
            progressBar.style.width = progress.progress + '%';
        }
        
        // Update label with frame count
        if (progressLabel) {
            if (progress.current && progress.total) {
                progressLabel.textContent = `${progress.message} (${progress.current}/${progress.total})`;
            } else {
                progressLabel.textContent = progress.message || 'Uploading...';
            }
        }
        
        // Update percentage
        if (progressStatus) {
            progressStatus.textContent = Math.round(progress.progress) + '%';
        }
        
        const warningBox = this._shadow.getElementById('warningBox');
        if (warningBox) {
            warningBox.classList.add('active');
        }
        
    } else if (progress.status === 'complete') {
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        if (progressLabel) {
            progressLabel.textContent = '✅ Upload Complete!';
        }
        if (progressStatus) {
            progressStatus.textContent = '100%';
        }
        
        const warningBox = this._shadow.getElementById('warningBox');
        if (warningBox) {
            warningBox.classList.remove('active');
        }
        
        setTimeout(() => this._hideModal(), 2000);
        
    } else if (progress.status === 'error') {
        const warningBox = this._shadow.getElementById('warningBox');
        if (warningBox) {
            warningBox.classList.remove('active');
        }
        this._showToast('error', progress.message || 'Upload failed');
    }
}
    
    _delete360(product, data360) {
        if (!confirm(`Delete 360° view for "${product.name}"?\n\nThis will permanently delete the folder and all frames.`)) return;
        
        this._dispatchEvent('delete-360', {
            product: product,
            existingData: data360
        });
    }
    
    _updateStats() {
        this._shadow.getElementById('totalProducts').textContent = this._totalProducts;
        this._shadow.getElementById('with360').textContent = this._data360Items.length;
        this._shadow.getElementById('pending').textContent = this._totalProducts - this._data360Items.length;
    }
    
    _showToast(type, message) {
        const toast = this._shadow.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
}

customElements.define('product-360-dashboard', Product360Dashboard);
console.log('🎥 Dashboard: ✅ Custom element registered');
