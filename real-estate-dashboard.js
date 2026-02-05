class RealEstateDashboard extends HTMLElement {
    constructor() {
        super();
        console.log('🏠 Dashboard: Initializing...');
        this._shadow = this.attachShadow({ mode: 'open' });
        this._listings = [];
        this._currentPage = 0;
        this._pageSize = 12;
        this._totalListings = 0;
        this._selectedListing = null;
        this._editMode = false;
        this._thumbnailFile = null;
        this._galleryFiles = [];
        this._formData = {};
        this._root = document.createElement('div');
        
        this._createStructure();
        this._setupEventListeners();
        console.log('🏠 Dashboard: Complete');
    }
    
    static get observedAttributes() {
        return ['listing-data', 'all-listings-data', 'notification', 'upload-progress'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'listing-data' && newValue && newValue !== oldValue) {
            try {
                const data = JSON.parse(newValue);
                this.setListings(data);
            } catch (e) {
                console.error('🏠 Dashboard: Parse error:', e);
            }
        }
        
        if (name === 'all-listings-data' && newValue && newValue !== oldValue) {
            try {
                const data = JSON.parse(newValue);
                this.setAllListingsForSelection(data.listings);
            } catch (e) {
                console.error('🏠 Dashboard: Parse error:', e);
            }
        }
        
        if (name === 'notification' && newValue && newValue !== oldValue) {
            try {
                const notification = JSON.parse(newValue);
                this._showToast(notification.type, notification.message);
                if (notification.type === 'success') {
                    this._hideForm();
                }
            } catch (e) {
                console.error('🏠 Dashboard: Notification error:', e);
            }
        }
        
        if (name === 'upload-progress' && newValue && newValue !== oldValue) {
            try {
                const progress = JSON.parse(newValue);
                this._updateUploadProgress(progress);
            } catch (e) {
                console.error('🏠 Dashboard: Progress error:', e);
            }
        }
    }
    
    connectedCallback() {
        console.log('🏠 Dashboard: Connected to DOM');
    }
    
    _createStructure() {
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
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
                
                .title { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
                .subtitle { font-size: 16px; opacity: 0.95; }
                
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
                
                .toolbar {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .main { padding: 0 32px 32px; }
                .content { max-width: 1400px; margin: 0 auto; }
                
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
                    display: flex;
                    flex-direction: column;
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
                }
                
                .card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
                
                .card-badges {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }
                
                .badge {
                    display: inline-flex;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .badge-sale { background: #dbeafe; color: #1e40af; }
                .badge-rent { background: #fef3c7; color: #92400e; }
                .badge-featured { background: #fce7f3; color: #9f1239; }
                
                .card-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .card-location {
                    font-size: 13px;
                    color: #6b7280;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .card-price {
                    font-size: 24px;
                    font-weight: 800;
                    color: #8b5cf6;
                    margin-bottom: 12px;
                }
                
                .card-features {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                    font-size: 13px;
                    color: #4b5563;
                }
                
                .feature {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .card-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: auto;
                }
                
                .btn {
                    flex: 1;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                
                .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                
                .btn-primary { background: #8b5cf6; color: white; }
                .btn-success { background: #10b981; color: white; }
                .btn-warning { background: #f59e0b; color: white; }
                .btn-danger { background: #ef4444; color: white; }
                .btn-secondary { background: #f3f4f6; color: #111827; }
                
                .btn-large {
                    padding: 14px 28px;
                    font-size: 15px;
                    border-radius: 12px;
                }
                
                .modal {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .modal.active { display: flex; }
                
                .modal-content {
                    background: white;
                    border-radius: 20px;
                    max-width: 900px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    margin: auto;
                }
                
                .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 10;
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
                
                .form-section {
                    margin-bottom: 32px;
                    padding-bottom: 32px;
                    border-bottom: 2px solid #f3f4f6;
                }
                
                .form-section:last-child { border-bottom: none; }
                
                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .form-group { margin-bottom: 20px; }
                
                .label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #374151;
                }
                
                .label.required::after {
                    content: '*';
                    color: #ef4444;
                    margin-left: 4px;
                }
                
                .input, .textarea, .select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .input:focus, .textarea:focus, .select:focus {
                    outline: none;
                    border-color: #8b5cf6;
                }
                
                .input:disabled {
                    background: #f9fafb;
                    color: #9ca3af;
                    cursor: not-allowed;
                }
                
                .textarea { min-height: 100px; resize: vertical; }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                
                .form-row-3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 16px;
                }
                
                .checkbox-group {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                    margin-top: 12px;
                }
                
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    cursor: pointer;
                }
                
                .checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                
                .file-input { display: none; }
                
                .file-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 32px;
                    border: 2px dashed #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    background: #f9fafb;
                    transition: all 0.2s;
                }
                
                .file-label:hover { border-color: #8b5cf6; background: #ede9fe; }
                
                .file-preview {
                    margin-top: 16px;
                    display: none;
                }
                
                .file-preview.active { display: block; }
                
                .preview-img {
                    width: 100%;
                    max-height: 200px;
                    object-fit: cover;
                    border-radius: 12px;
                    border: 2px solid #e5e7eb;
                }
                
                .gallery-preview {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 12px;
                    margin-top: 16px;
                }
                
                .gallery-item {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid #e5e7eb;
                }
                
                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .gallery-remove {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .help-text {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 6px;
                }
                
                .progress-section {
                    margin-top: 24px;
                    padding: 20px;
                    background: #f9fafb;
                    border-radius: 12px;
                    display: none;
                }
                
                .progress-section.active { display: block; }
                
                .progress-bar-bg {
                    width: 100%;
                    height: 12px;
                    background: #e5e7eb;
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
                
                .modal-footer {
                    padding: 20px 32px;
                    background: #f9fafb;
                    border-top: 2px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    position: sticky;
                    bottom: 0;
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
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                }
                
                .empty-state h2 {
                    font-size: 24px;
                    color: #374151;
                    margin-bottom: 12px;
                }
                
                .empty-state p {
                    color: #6b7280;
                    margin-bottom: 24px;
                }
                
                @media (max-width: 768px) {
                    .form-row, .form-row-3 {
                        grid-template-columns: 1fr;
                    }
                    
                    .grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .checkbox-group {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            
            <div class="container">
                <div class="header">
                    <div class="header-content">
                        <h1 class="title">Real Estate Listings Manager</h1>
                        <p class="subtitle">Manage your property listings with automatic image upload</p>
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-label">Total Listings</div>
                                <div class="stat-value" id="totalListings">0</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">For Sale</div>
                                <div class="stat-value" id="forSale">0</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">For Rent</div>
                                <div class="stat-value" id="forRent">0</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">Featured</div>
                                <div class="stat-value" id="featured">0</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="toolbar">
                    <div></div>
                    <button class="btn btn-success btn-large" id="addNewBtn">
                        ➕ Add New Listing
                    </button>
                </div>
                
                <div class="main">
                    <div class="content">
                        <div id="loading" class="loading">
                            <div class="spinner"></div>
                            <p style="margin-top: 16px; color: #6b7280;">Loading listings...</p>
                        </div>
                        
                        <div id="emptyState" class="empty-state" style="display: none;">
                            <h2>No Listings Yet</h2>
                            <p>Get started by adding your first property listing</p>
                            <button class="btn btn-success btn-large" id="addFirstBtn">
                                ➕ Add First Listing
                            </button>
                        </div>
                        
                        <div id="listingsGrid" class="grid"></div>
                        
                        <div style="display: flex; justify-content: center; gap: 16px; margin-top: 32px; align-items: center;" id="pagination">
                            <button class="btn btn-secondary" id="prevBtn" disabled>← Previous</button>
                            <span id="pageInfo" style="font-weight: 600; color: #374151;">Page 1</span>
                            <button class="btn btn-secondary" id="nextBtn">Next →</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title" id="modalTitle">Add New Listing</h2>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    
                    <div class="modal-body" id="formBody"></div>
                    
                    <div class="progress-section" id="progressSection">
                        <div style="font-weight: 600; margin-bottom: 8px;" id="progressLabel">Uploading...</div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar" id="progressBar"></div>
                        </div>
                        <div style="margin-top: 8px; color: #6b7280; font-size: 13px;" id="progressStatus">0%</div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                        <button class="btn btn-success" id="saveBtn">Save Listing</button>
                    </div>
                </div>
            </div>
            
            <div class="toast" id="toast"></div>
        `;
        
        this._shadow.appendChild(this._root);
    }

    _setupEventListeners() {
        // Modal controls
        this._shadow.getElementById('closeModal').addEventListener('click', () => this._hideForm());
        this._shadow.getElementById('cancelBtn').addEventListener('click', () => this._hideForm());
        this._shadow.getElementById('saveBtn').addEventListener('click', () => this._handleSave());
        
        // Add new buttons
        this._shadow.getElementById('addNewBtn').addEventListener('click', () => this._showForm(null, false));
        this._shadow.getElementById('addFirstBtn').addEventListener('click', () => this._showForm(null, false));
        
        // Pagination
        this._shadow.getElementById('prevBtn').addEventListener('click', () => {
            if (this._currentPage > 0) {
                this._currentPage--;
                this._loadListings();
            }
        });
        
        this._shadow.getElementById('nextBtn').addEventListener('click', () => {
            this._currentPage++;
            this._loadListings();
        });
    }
    
    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    
    _loadListings() {
        const loading = this._shadow.getElementById('loading');
        loading.classList.remove('hide');
        
        this._dispatchEvent('load-listings', {
            limit: this._pageSize,
            skip: this._currentPage * this._pageSize
        });
    }
    
    setListings(data) {
        this._listings = data.listings || [];
        this._totalListings = data.totalCount || 0;
        
        this._shadow.getElementById('loading').classList.add('hide');
        
        if (this._listings.length === 0 && this._currentPage === 0) {
            this._shadow.getElementById('emptyState').style.display = 'block';
            this._shadow.getElementById('listingsGrid').style.display = 'none';
            this._shadow.getElementById('pagination').style.display = 'none';
        } else {
            this._shadow.getElementById('emptyState').style.display = 'none';
            this._shadow.getElementById('listingsGrid').style.display = 'grid';
            this._shadow.getElementById('pagination').style.display = 'flex';
            this._renderListings();
        }
        
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
        const totalPages = Math.ceil(this._totalListings / this._pageSize);
        pageInfo.textContent = `Page ${currentPageNum} of ${totalPages}`;
    }
    
    _renderListings() {
        const grid = this._shadow.getElementById('listingsGrid');
        grid.innerHTML = '';
        
        this._listings.forEach(listing => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const badges = [];
            if (listing.listingType === 'sale') badges.push('<span class="badge badge-sale">For Sale</span>');
            if (listing.listingType === 'rent') badges.push('<span class="badge badge-rent">For Rent</span>');
            if (listing.isFeatured) badges.push('<span class="badge badge-featured">⭐ Featured</span>');
            
            card.innerHTML = `
                <img src="${listing.thumbnailImage || 'https://via.placeholder.com/400x300'}" alt="${listing.title}" class="card-img">
                <div class="card-body">
                    <div class="card-badges">${badges.join('')}</div>
                    <div class="card-title">${listing.title}</div>
                    <div class="card-location">📍 ${listing.location || 'Location not specified'}</div>
                    <div class="card-price">${listing.currency || '$'}${this._formatNumber(listing.price || listing.monthlyRent || 0)}</div>
                    <div class="card-features">
                        ${listing.bedrooms ? `<div class="feature">🛏️ ${listing.bedrooms}</div>` : ''}
                        ${listing.bathrooms ? `<div class="feature">🚿 ${listing.bathrooms}</div>` : ''}
                        ${listing.squareFootage ? `<div class="feature">📐 ${this._formatNumber(listing.squareFootage)} sq ft</div>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-warning edit-btn">✏️ Edit</button>
                        <button class="btn btn-danger delete-btn">🗑️ Delete</button>
                    </div>
                </div>
            `;
            
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => this._showForm(listing, true));
            deleteBtn.addEventListener('click', () => this._deleteListing(listing));
            
            grid.appendChild(card);
        });
    }
    
    _showForm(listing, isEdit) {
        console.log('🏠 Dashboard: Opening form', isEdit ? 'EDIT' : 'ADD');
        
        this._selectedListing = listing;
        this._editMode = isEdit;
        this._thumbnailFile = null;
        this._galleryFiles = [];
        
        // Initialize form data
        if (isEdit && listing) {
            this._formData = { ...listing };
            // Ensure relatedProperties is an array
            if (!this._formData.relatedProperties) {
                this._formData.relatedProperties = [];
            }
        } else {
            this._formData = {
                title: '',
                location: '',
                propertyType: '',
                listingType: 'sale',
                price: '',
                bedrooms: '',
                bathrooms: '',
                squareFootage: '',
                relatedProperties: []
            };
        }
        
        // Update modal title
        this._shadow.getElementById('modalTitle').textContent = 
            isEdit ? 'Edit Listing - ' + listing.title : 'Add New Listing';
        
        // Render form
        this._renderForm();
        
        // Load related listings options
        this._loadRelatedListingsOptions();
        
        // Show modal
        this._shadow.getElementById('modal').classList.add('active');
    }
    
    _renderForm() {
        const formBody = this._shadow.getElementById('formBody');
        
        formBody.innerHTML = `
            <!-- Basic Information -->
            <div class="form-section">
                <div class="section-title">📋 Basic Information</div>
                
                <div class="form-group">
                    <label class="label required">Property Title</label>
                    <input type="text" class="input" id="title" value="${this._formData.title || ''}" placeholder="Beautiful 3BR Home in Downtown">
                </div>
                
                <div class="form-group">
                    <label class="label">Auto-Generated Slug (Read-only)</label>
                    <input type="text" class="input" id="slug" value="${this._formData.slug || ''}" disabled>
                    <div class="help-text">Slug is automatically generated from the title</div>
                </div>
                
                <div class="form-group">
                    <label class="label required">Description</label>
                    <textarea class="textarea" id="description" rows="6" placeholder="Describe the property in detail...">${this._formData.description || ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="label required">Full Address</label>
                        <input type="text" class="input" id="location" value="${this._formData.location || ''}" placeholder="123 Main St, City, State ZIP, Country">
                        <div class="help-text">Enter complete address for Google Maps compatibility (Street, City, State/Province, ZIP/Postal Code, Country)</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="label required">Property Type</label>
                        <select class="select" id="propertyType">
                            <option value="">-- Select --</option>
                            <option value="house" ${this._formData.propertyType === 'house' ? 'selected' : ''}>House</option>
                            <option value="apartment" ${this._formData.propertyType === 'apartment' ? 'selected' : ''}>Apartment</option>
                            <option value="condo" ${this._formData.propertyType === 'condo' ? 'selected' : ''}>Condo</option>
                            <option value="townhouse" ${this._formData.propertyType === 'townhouse' ? 'selected' : ''}>Townhouse</option>
                            <option value="land" ${this._formData.propertyType === 'land' ? 'selected' : ''}>Land</option>
                            <option value="commercial" ${this._formData.propertyType === 'commercial' ? 'selected' : ''}>Commercial</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="label required">Listing Type</label>
                        <select class="select" id="listingType">
                            <option value="sale" ${this._formData.listingType === 'sale' ? 'selected' : ''}>For Sale</option>
                            <option value="rent" ${this._formData.listingType === 'rent' ? 'selected' : ''}>For Rent</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Condition</label>
                        <select class="select" id="condition">
                            <option value="">-- Select --</option>
                            <option value="new" ${this._formData.condition === 'new' ? 'selected' : ''}>New</option>
                            <option value="excellent" ${this._formData.condition === 'excellent' ? 'selected' : ''}>Excellent</option>
                            <option value="good" ${this._formData.condition === 'good' ? 'selected' : ''}>Good</option>
                            <option value="fair" ${this._formData.condition === 'fair' ? 'selected' : ''}>Fair</option>
                            <option value="needswork" ${this._formData.condition === 'needswork' ? 'selected' : ''}>Needs Work</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Images -->
            <div class="form-section">
                <div class="section-title">🖼️ Images</div>
                
                <div class="form-group">
                    <label class="label required">Thumbnail Image</label>
                    <input type="file" class="file-input" id="thumbnailInput" accept="image/*">
                    <label for="thumbnailInput" class="file-label">
                        <span style="font-size: 32px;">🏠</span>
                        <div>
                            <div style="font-weight: 600;">Click to upload thumbnail</div>
                            <div style="font-size: 12px; color: #6b7280;">Recommended: 1200x800px</div>
                        </div>
                    </label>
                    <div class="file-preview" id="thumbnailPreview">
                        ${this._formData.thumbnailImage ? `<img src="${this._formData.thumbnailImage}" class="preview-img">` : ''}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label">Gallery Images (Multiple)</label>
                    <input type="file" class="file-input" id="galleryInput" accept="image/*" multiple>
                    <label for="galleryInput" class="file-label">
                        <span style="font-size: 32px;">📸</span>
                        <div>
                            <div style="font-weight: 600;">Click to upload gallery images</div>
                            <div style="font-size: 12px; color: #6b7280;">You can select multiple images</div>
                        </div>
                    </label>
                    <div class="gallery-preview" id="galleryPreview"></div>
                </div>
            </div>
            
            <!-- Pricing -->
            <div class="form-section">
                <div class="section-title">💰 Pricing</div>
                
                <div class="form-row-3">
                    <div class="form-group">
                        <label class="label required">Price / Rent</label>
                        <input type="number" class="input" id="price" value="${this._formData.price || ''}" placeholder="0">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Currency</label>
                        <select class="select" id="currency">
                            ${this._getAllCurrencies()}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="label">HOA Fee</label>
                        <input type="number" class="input" id="hoaFee" value="${this._formData.hoaFee || ''}" placeholder="0">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="label">Property Tax</label>
                        <input type="number" class="input" id="propertyTax" value="${this._formData.propertyTax || ''}" placeholder="0">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Price Valid Until</label>
                        <input type="date" class="input" id="priceValidUntil" value="${this._formData.priceValidUntil || ''}">
                    </div>
                </div>
            </div>
            
            <!-- Property Details -->
            <div class="form-section">
                <div class="section-title">🏡 Property Details</div>
                
                <div class="form-row-3">
                    <div class="form-group">
                        <label class="label">Bedrooms</label>
                        <input type="number" class="input" id="bedrooms" value="${this._formData.bedrooms || ''}" min="0">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Bathrooms</label>
                        <input type="number" class="input" id="bathrooms" value="${this._formData.bathrooms || ''}" min="0" step="0.5">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Total Rooms</label>
                        <input type="number" class="input" id="totalRooms" value="${this._formData.totalRooms || ''}" min="0">
                    </div>
                </div>
                
                <div class="form-row-3">
                    <div class="form-group">
                        <label class="label">Square Footage</label>
                        <input type="number" class="input" id="squareFootage" value="${this._formData.squareFootage || ''}" placeholder="0">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Lot Size</label>
                        <input type="number" class="input" id="lotSize" value="${this._formData.lotSize || ''}" placeholder="0">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Garage Spaces</label>
                        <input type="number" class="input" id="garageSpaces" value="${this._formData.garageSpaces || ''}" min="0">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="label">Year Built</label>
                        <input type="number" class="input" id="yearBuilt" value="${this._formData.yearBuilt || ''}" min="1800" max="2100">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Days on Market</label>
                        <input type="number" class="input" id="daysOnMarket" value="${this._formData.daysOnMarket || ''}" min="0">
                    </div>
                </div>
            </div>
            
            <!-- Features & Amenities -->
            <div class="form-section">
                <div class="section-title">✨ Features & Amenities</div>
                
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="isFeatured" ${this._formData.isFeatured ? 'checked' : ''}>
                        ⭐ Featured Listing
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="isNewConstruction" ${this._formData.isNewConstruction ? 'checked' : ''}>
                        🏗️ New Construction
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasPool" ${this._formData.hasPool ? 'checked' : ''}>
                        🏊 Pool
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasGarage" ${this._formData.hasGarage ? 'checked' : ''}>
                        🚗 Garage
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasBasement" ${this._formData.hasBasement ? 'checked' : ''}>
                        🏠 Basement
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasFireplace" ${this._formData.hasFireplace ? 'checked' : ''}>
                        🔥 Fireplace
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasBalcony" ${this._formData.hasBalcony ? 'checked' : ''}>
                        🌅 Balcony
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasGarden" ${this._formData.hasGarden ? 'checked' : ''}>
                        🌳 Garden
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasAirConditioning" ${this._formData.hasAirConditioning ? 'checked' : ''}>
                        ❄️ Air Conditioning
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasHeating" ${this._formData.hasHeating ? 'checked' : ''}>
                        🔥 Heating
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasWasherDryer" ${this._formData.hasWasherDryer ? 'checked' : ''}>
                        🧺 Washer/Dryer
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasDishwasher" ${this._formData.hasDishwasher ? 'checked' : ''}>
                        🍽️ Dishwasher
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasUpdatedKitchen" ${this._formData.hasUpdatedKitchen ? 'checked' : ''}>
                        🍳 Updated Kitchen
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasUpdatedBathroom" ${this._formData.hasUpdatedBathroom ? 'checked' : ''}>
                        🚿 Updated Bathroom
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasHardwoodFloors" ${this._formData.hasHardwoodFloors ? 'checked' : ''}>
                        🪵 Hardwood Floors
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasWalkInCloset" ${this._formData.hasWalkInCloset ? 'checked' : ''}>
                        👔 Walk-in Closet
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasSecurity" ${this._formData.hasSecurity ? 'checked' : ''}>
                        🔒 Security System
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasSolarPanels" ${this._formData.hasSolarPanels ? 'checked' : ''}>
                        ☀️ Solar Panels
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasSmartHome" ${this._formData.hasSmartHome ? 'checked' : ''}>
                        🏠 Smart Home
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasGym" ${this._formData.hasGym ? 'checked' : ''}>
                        💪 Gym
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasPetFriendly" ${this._formData.hasPetFriendly ? 'checked' : ''}>
                        🐕 Pet Friendly
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasGatedCommunity" ${this._formData.hasGatedCommunity ? 'checked' : ''}>
                        🚧 Gated Community
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasWaterfront" ${this._formData.hasWaterfront ? 'checked' : ''}>
                        🌊 Waterfront
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox" id="hasOceanView" ${this._formData.hasOceanView ? 'checked' : ''}>
                        🌅 Ocean View
                    </label>
                </div>
            </div>
            
            <!-- Additional Details -->
            <div class="form-section">
                <div class="section-title">📝 Additional Details</div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="label">Architecture</label>
                        <input type="text" class="input" id="architecture" value="${this._formData.architecture || ''}" placeholder="Colonial, Modern, etc.">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Heating Type</label>
                        <input type="text" class="input" id="heating" value="${this._formData.heating || ''}" placeholder="Gas, Electric, etc.">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="label">Cooling Type</label>
                        <input type="text" class="input" id="cooling" value="${this._formData.cooling || ''}" placeholder="Central, Wall Unit, etc.">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Flooring</label>
                        <input type="text" class="input" id="flooring" value="${this._formData.flooring || ''}" placeholder="Hardwood, Carpet, Tile">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="label">School District</label>
                        <input type="text" class="input" id="schoolDistrict" value="${this._formData.schoolDistrict || ''}" placeholder="District Name">
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Zoning</label>
                        <input type="text" class="input" id="zoning" value="${this._formData.zoning || ''}" placeholder="Residential, Commercial">
                    </div>
                </div>
            </div>
            
            <!-- Related Listings -->
            <div class="form-section">
                <div class="section-title">🔗 Related Listings</div>
                
                <div class="form-group">
                    <label class="label">Related Properties</label>
                    <div id="relatedListingsContainer" style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f9fafb; min-height: 200px; max-height: 300px; overflow-y: auto;">
                        <div style="text-align: center; color: #6b7280; padding: 40px 20px;">
                            Loading available listings...
                        </div>
                    </div>
                    <div class="help-text">Select properties that are related or similar to this listing</div>
                </div>
            </div>
            
            <!-- SEO -->
            <div class="form-section">
                <div class="section-title">🔍 SEO Settings</div>
                
                <div class="form-group">
                    <label class="label">SEO Title</label>
                    <input type="text" class="input" id="seoTitle" value="${this._formData.seoTitle || ''}" placeholder="Leave empty to use property title" maxlength="60">
                    <div class="help-text">Recommended: 50-60 characters</div>
                </div>
                
                <div class="form-group">
                    <label class="label">SEO Description</label>
                    <textarea class="textarea" id="seoDescription" rows="3" maxlength="160" placeholder="Brief description for search engines">${this._formData.seoDescription || ''}</textarea>
                    <div class="help-text">Recommended: 150-160 characters</div>
                </div>
                
                <div class="form-group">
                    <label class="label">SEO Keywords</label>
                    <input type="text" class="input" id="seoKeywords" value="${this._formData.seoKeywords || ''}" placeholder="keyword1, keyword2, keyword3">
                </div>
            </div>
        `;
        
        // Set up file input listeners
        this._setupFormListeners();
    }
    
    _setupFormListeners() {
        // Title → Slug auto-generation
        const titleInput = this._shadow.getElementById('title');
        const slugInput = this._shadow.getElementById('slug');
        
        titleInput.addEventListener('input', (e) => {
            const slug = this._generateSlug(e.target.value);
            slugInput.value = slug;
            this._formData.slug = slug;
        });
        
        // Thumbnail upload
        this._shadow.getElementById('thumbnailInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this._thumbnailFile = file;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = this._shadow.getElementById('thumbnailPreview');
                    preview.innerHTML = `<img src="${event.target.result}" class="preview-img">`;
                    preview.classList.add('active');
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Gallery upload
        this._shadow.getElementById('galleryInput').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this._galleryFiles = files;
            
            const preview = this._shadow.getElementById('galleryPreview');
            preview.innerHTML = '';
            
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    item.innerHTML = `
                        <img src="${event.target.result}">
                        <button class="gallery-remove" data-index="${index}">×</button>
                    `;
                    
                    item.querySelector('.gallery-remove').addEventListener('click', () => {
                        this._galleryFiles.splice(index, 1);
                        this._shadow.getElementById('galleryInput').dispatchEvent(new Event('change'));
                    });
                    
                    preview.appendChild(item);
                };
                reader.readAsDataURL(file);
            });
        });
    }
    
    _generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 100);
    }
    
    _collectFormData() {
        const formBody = this._shadow.getElementById('formBody');
        
        const data = {
            title: formBody.querySelector('#title')?.value.trim() || '',
            slug: formBody.querySelector('#slug')?.value.trim() || '',
            description: formBody.querySelector('#description')?.value.trim() || '',
            location: formBody.querySelector('#location')?.value.trim() || '',
            propertyType: formBody.querySelector('#propertyType')?.value || '',
            listingType: formBody.querySelector('#listingType')?.value || 'sale',
            condition: formBody.querySelector('#condition')?.value || '',
            yearBuilt: formBody.querySelector('#yearBuilt')?.value || null,
            bedrooms: formBody.querySelector('#bedrooms')?.value || null,
            bathrooms: formBody.querySelector('#bathrooms')?.value || null,
            squareFootage: formBody.querySelector('#squareFootage')?.value || null,
            lotSize: formBody.querySelector('#lotSize')?.value || null,
            totalRooms: formBody.querySelector('#totalRooms')?.value || null,
            garageSpaces: formBody.querySelector('#garageSpaces')?.value || null,
            price: formBody.querySelector('#price')?.value || null,
            currency: formBody.querySelector('#currency')?.value || '$',
            hoaFee: formBody.querySelector('#hoaFee')?.value || null,
            propertyTax: formBody.querySelector('#propertyTax')?.value || null,
            priceValidUntil: formBody.querySelector('#priceValidUntil')?.value || null,
            daysOnMarket: formBody.querySelector('#daysOnMarket')?.value || null,
            
            // Checkboxes
            isFeatured: formBody.querySelector('#isFeatured')?.checked || false,
            isNewConstruction: formBody.querySelector('#isNewConstruction')?.checked || false,
            hasPool: formBody.querySelector('#hasPool')?.checked || false,
            hasGarage: formBody.querySelector('#hasGarage')?.checked || false,
            hasBasement: formBody.querySelector('#hasBasement')?.checked || false,
            hasFireplace: formBody.querySelector('#hasFireplace')?.checked || false,
            hasBalcony: formBody.querySelector('#hasBalcony')?.checked || false,
            hasGarden: formBody.querySelector('#hasGarden')?.checked || false,
            hasAirConditioning: formBody.querySelector('#hasAirConditioning')?.checked || false,
            hasHeating: formBody.querySelector('#hasHeating')?.checked || false,
            hasWasherDryer: formBody.querySelector('#hasWasherDryer')?.checked || false,
            hasDishwasher: formBody.querySelector('#hasDishwasher')?.checked || false,
            hasUpdatedKitchen: formBody.querySelector('#hasUpdatedKitchen')?.checked || false,
            hasUpdatedBathroom: formBody.querySelector('#hasUpdatedBathroom')?.checked || false,
            hasHardwoodFloors: formBody.querySelector('#hasHardwoodFloors')?.checked || false,
            hasWalkInCloset: formBody.querySelector('#hasWalkInCloset')?.checked || false,
            hasSecurity: formBody.querySelector('#hasSecurity')?.checked || false,
            hasSolarPanels: formBody.querySelector('#hasSolarPanels')?.checked || false,
            hasSmartHome: formBody.querySelector('#hasSmartHome')?.checked || false,
            hasGym: formBody.querySelector('#hasGym')?.checked || false,
            hasPetFriendly: formBody.querySelector('#hasPetFriendly')?.checked || false,
            hasGatedCommunity: formBody.querySelector('#hasGatedCommunity')?.checked || false,
            hasWaterfront: formBody.querySelector('#hasWaterfront')?.checked || false,
            hasOceanView: formBody.querySelector('#hasOceanView')?.checked || false,
            
            // Additional
            architecture: formBody.querySelector('#architecture')?.value.trim() || '',
            heating: formBody.querySelector('#heating')?.value.trim() || '',
            cooling: formBody.querySelector('#cooling')?.value.trim() || '',
            flooring: formBody.querySelector('#flooring')?.value.trim() || '',
            schoolDistrict: formBody.querySelector('#schoolDistrict')?.value.trim() || '',
            zoning: formBody.querySelector('#zoning')?.value.trim() || '',
            
            // SEO
            seoTitle: formBody.querySelector('#seoTitle')?.value.trim() || '',
            seoDescription: formBody.querySelector('#seoDescription')?.value.trim() || '',
            seoKeywords: formBody.querySelector('#seoKeywords')?.value.trim() || ''
        };
        
        return data;
    }
    
    async _handleSave() {
        console.log('🏠 Dashboard: Handling save');
        
        const data = this._collectFormData();
        
        // Validation
        if (!data.title) {
            alert('❌ Please enter a property title');
            return;
        }
        
        if (!data.location) {
            alert('❌ Please enter a location');
            return;
        }
        
        if (!data.propertyType) {
            alert('❌ Please select a property type');
            return;
        }
        
        if (!data.price) {
            alert('❌ Please enter a price');
            return;
        }
        
        if (!this._editMode && !this._thumbnailFile) {
            alert('❌ Please upload a thumbnail image');
            return;
        }
        
        // Disable save button
        const saveBtn = this._shadow.getElementById('saveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        // Show progress section
        const progressSection = this._shadow.getElementById('progressSection');
        progressSection.classList.add('active');
        
        try {
            // Prepare images for upload
            const imageData = {
                thumbnail: null,
                gallery: []
            };
            
            // Convert thumbnail to base64
            if (this._thumbnailFile) {
                imageData.thumbnail = await this._fileToBase64(this._thumbnailFile);
            }
            
            // Convert gallery to base64
            if (this._galleryFiles.length > 0) {
                imageData.gallery = await Promise.all(
                    this._galleryFiles.map(file => this._fileToBase64(file))
                );
            }
            
            console.log('🏠 Dashboard: Dispatching save event');
            
            this._dispatchEvent('save-listing', {
                listingData: data,
                imageData: imageData,
                existingListing: this._editMode ? this._selectedListing : null
            });
            
        } catch (error) {
            console.error('🏠 Dashboard: Save error:', error);
            this._showToast('error', 'Failed to prepare data: ' + error.message);
            
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Listing';
            progressSection.classList.remove('active');
        }
    }
    
    async _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve({
                    data: base64,
                    filename: file.name,
                    mimeType: file.type
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    _updateUploadProgress(progress) {
        const progressBar = this._shadow.getElementById('progressBar');
        const progressLabel = this._shadow.getElementById('progressLabel');
        const progressStatus = this._shadow.getElementById('progressStatus');
        
        if (progressBar) progressBar.style.width = progress.progress + '%';
        if (progressLabel) progressLabel.textContent = progress.message || 'Uploading...';
        if (progressStatus) progressStatus.textContent = Math.round(progress.progress) + '%';
    }
    
    _deleteListing(listing) {
        if (!confirm(`Delete "${listing.title}"?\n\nThis will permanently delete the listing and all associated images.`)) {
            return;
        }
        
        this._dispatchEvent('delete-listing', {
            listing: listing
        });
    }
    
    _hideForm() {
        this._shadow.getElementById('modal').classList.remove('active');
        
        // Reset form
        this._selectedListing = null;
        this._editMode = false;
        this._thumbnailFile = null;
        this._galleryFiles = [];
        this._formData = {};
        
        // Reset save button
        const saveBtn = this._shadow.getElementById('saveBtn');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Listing';
        
        // Hide progress
        const progressSection = this._shadow.getElementById('progressSection');
        progressSection.classList.remove('active');
    }
    
    _updateStats() {
        this._shadow.getElementById('totalListings').textContent = this._totalListings;
        
        const forSale = this._listings.filter(l => l.listingType === 'sale').length;
        const forRent = this._listings.filter(l => l.listingType === 'rent').length;
        const featured = this._listings.filter(l => l.isFeatured).length;
        
        this._shadow.getElementById('forSale').textContent = forSale;
        this._shadow.getElementById('forRent').textContent = forRent;
        this._shadow.getElementById('featured').textContent = featured;
    }
    
    _showToast(type, message) {
        const toast = this._shadow.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
    
    _formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }
    
    _getAllCurrencies() {
        const currencies = [
            { code: 'USD', symbol: '$', name: 'US Dollar' },
            { code: 'EUR', symbol: '€', name: 'Euro' },
            { code: 'GBP', symbol: '£', name: 'British Pound' },
            { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
            { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
            { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
            { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
            { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
            { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
            { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
            { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
            { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
            { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
            { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
            { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
            { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
            { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
            { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
            { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
            { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
            { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
            { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
            { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
            { code: 'THB', symbol: '฿', name: 'Thai Baht' },
            { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
            { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
            { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
            { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
            { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
            { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso' },
            { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
            { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
            { code: 'COP', symbol: 'COL$', name: 'Colombian Peso' },
            { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
            { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
            { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
            { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso' },
            { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
            { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
            { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
            { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
            { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar' },
            { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar' },
            { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
            { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
            { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
            { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
            { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
            { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
            { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
            { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
            { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
            { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
            { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
            { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
            { code: 'VEF', symbol: 'Bs', name: 'Venezuelan Bolívar' },
            { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano' },
            { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní' },
            { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
            { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón' },
            { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal' },
            { code: 'HNL', symbol: 'L', name: 'Honduran Lempira' },
            { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba' },
            { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa' },
            { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
            { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
            { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
            { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar' },
            { code: 'BSD', symbol: 'B$', name: 'Bahamian Dollar' },
            { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar' },
            { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar' },
            { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
            { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
            { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
            { code: 'RSD', symbol: 'din', name: 'Serbian Dinar' },
            { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar' },
            { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark' },
            { code: 'ALL', symbol: 'L', name: 'Albanian Lek' },
            { code: 'MDL', symbol: 'L', name: 'Moldovan Leu' },
            { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
            { code: 'AMD', symbol: '֏', name: 'Armenian Dram' },
            { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
            { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
            { code: 'UZS', symbol: 'soʻm', name: 'Uzbekistani Som' },
            { code: 'KGS', symbol: 'с', name: 'Kyrgyzstani Som' },
            { code: 'TJS', symbol: 'ЅМ', name: 'Tajikistani Somoni' },
            { code: 'TMT', symbol: 'm', name: 'Turkmenistan Manat' },
            { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
            { code: 'IQD', symbol: 'ID', name: 'Iraqi Dinar' },
            { code: 'LBP', symbol: 'LL', name: 'Lebanese Pound' },
            { code: 'SYP', symbol: 'LS', name: 'Syrian Pound' },
            { code: 'YER', symbol: 'YR', name: 'Yemeni Rial' },
            { code: 'MNT', symbol: '₮', name: 'Mongolian Tögrög' },
            { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
            { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
            { code: 'LAK', symbol: '₭', name: 'Lao Kip' },
            { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
            { code: 'BTN', symbol: 'Nu', name: 'Bhutanese Ngultrum' },
            { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
            { code: 'BND', symbol: 'B$', name: 'Brunei Dollar' },
            { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' },
            { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina' },
            { code: 'WST', symbol: 'WS$', name: 'Samoan Tālā' },
            { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga' },
            { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu' },
            { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar' },
            { code: 'SCR', symbol: 'SR', name: 'Seychellois Rupee' },
            { code: 'MUR', symbol: 'Rs', name: 'Mauritian Rupee' },
            { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
            { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
            { code: 'BWP', symbol: 'P', name: 'Botswana Pula' },
            { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar' },
            { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni' },
            { code: 'LSL', symbol: 'L', name: 'Lesotho Loti' },
            { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza' },
            { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
            { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' },
            { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar' },
            { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar' },
            { code: 'LYD', symbol: 'LD', name: 'Libyan Dinar' },
            { code: 'SDG', symbol: 'SDG', name: 'Sudanese Pound' },
            { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
            { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
            { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
            { code: 'SOS', symbol: 'Sh', name: 'Somali Shilling' },
            { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi' },
            { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone' },
            { code: 'LRD', symbol: 'L$', name: 'Liberian Dollar' },
            { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' },
            { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo' },
            { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
            { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
            { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' },
            { code: 'CDF', symbol: 'FC', name: 'Congolese Franc' },
            { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra' },
            { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa' },
            { code: 'SHP', symbol: '£', name: 'Saint Helena Pound' },
            { code: 'GIP', symbol: '£', name: 'Gibraltar Pound' },
            { code: 'FKP', symbol: '£', name: 'Falkland Islands Pound' },
            { code: 'KYD', symbol: 'CI$', name: 'Cayman Islands Dollar' },
            { code: 'BMD', symbol: 'BD$', name: 'Bermudian Dollar' },
            { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin' },
            { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder' },
            { code: 'SRD', symbol: '$', name: 'Surinamese Dollar' },
            { code: 'GYD', symbol: 'G$', name: 'Guyanese Dollar' },
            { code: 'HTG', symbol: 'G', name: 'Haitian Gourde' },
            { code: 'CUP', symbol: '$', name: 'Cuban Peso' },
            { code: 'CUC', symbol: 'CUC$', name: 'Cuban Convertible Peso' },
            { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' }
        ];
        
        const selectedCurrency = this._formData.currency || '$';
        
        return currencies.map(c => 
            `<option value="${c.symbol}" ${selectedCurrency === c.symbol ? 'selected' : ''}>${c.code} (${c.symbol}) - ${c.name}</option>`
        ).join('');
    }
    
    async _loadRelatedListingsOptions() {
        console.log('🏠 Dashboard: Loading related listings options');
        
        try {
            // Dispatch event to get all listings for selection
            this._dispatchEvent('load-all-listings-for-selection', {
                excludeId: this._selectedListing?._id || null
            });
        } catch (error) {
            console.error('🏠 Dashboard: Error loading related listings:', error);
        }
    }
    
    setAllListingsForSelection(listings) {
        console.log('🏠 Dashboard: Setting all listings for selection:', listings.length);
        
        const container = this._shadow.getElementById('relatedListingsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (listings.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 40px 20px;">No other listings available</div>';
            return;
        }
        
        // Get currently selected related IDs
        const selectedIds = this._formData.relatedProperties || [];
        
        listings.forEach(listing => {
            const isSelected = selectedIds.includes(listing._id);
            
            const item = document.createElement('label');
            item.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; background: white; transition: all 0.2s;';
            
            item.innerHTML = `
                <input type="checkbox" class="checkbox related-checkbox" data-id="${listing._id}" ${isSelected ? 'checked' : ''} style="flex-shrink: 0;">
                <img src="${listing.thumbnailImage || 'https://via.placeholder.com/60'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${listing.title}</div>
                    <div style="font-size: 12px; color: #6b7280;">${listing.location || 'No location'}</div>
                    <div style="font-size: 13px; font-weight: 700; color: #8b5cf6; margin-top: 4px;">${listing.currency || '$'}${this._formatNumber(listing.price || 0)}</div>
                </div>
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = '#8b5cf6';
                item.style.background = '#f5f3ff';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.borderColor = '#e5e7eb';
                item.style.background = 'white';
            });
            
            const checkbox = item.querySelector('.related-checkbox');
            checkbox.addEventListener('change', () => {
                this._updateRelatedProperties();
            });
            
            container.appendChild(item);
        });
    }
    
    _updateRelatedProperties() {
        const checkboxes = this._shadow.querySelectorAll('.related-checkbox');
        const selectedIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.id);
        
        this._formData.relatedProperties = selectedIds;
        console.log('🏠 Dashboard: Updated related properties:', selectedIds);
    }
}

customElements.define('real-estate-dashboard', RealEstateDashboard);
console.log('🏠 Dashboard: ✅ Custom element registered');
