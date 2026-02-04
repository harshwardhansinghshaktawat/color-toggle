class ProductSEODashboard extends HTMLElement {
    constructor() {
        super();
        console.log('🔷 Dashboard Constructor: Initializing...');
        this._shadow = this.attachShadow({ mode: 'open' });
        this._products = [];
        this._seoItems = [];
        this._currentPage = 0;
        this._pageSize = 12;
        this._totalProducts = 0;
        this._selectedProduct = null;
        this._editMode = false;
        this._showingForm = false;
        this._formData = {};
        this._reviews = [];
        this._faqs = [];
        this._root = document.createElement('div');
        
        this._createStructure();
        this._setupEventListeners();
        console.log('🔷 Dashboard Constructor: Complete');
    }
    
    static get observedAttributes() {
        return ['product-data', 'notification'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`🔷 Dashboard attributeChangedCallback: ${name}`);
        
        if (name === 'product-data' && newValue && newValue !== oldValue) {
            try {
                const data = JSON.parse(newValue);
                console.log('🔷 Dashboard: Parsed data successfully');
                this.setProducts(data);
            } catch (e) {
                console.error('🔷 Dashboard: Error parsing product data:', e);
            }
        }
        
        if (name === 'notification' && newValue && newValue !== oldValue) {
            try {
                const notification = JSON.parse(newValue);
                if (notification.type === 'success') {
                    this._showToast('success', notification.message);
                    this._hideForm();
                } else if (notification.type === 'error') {
                    this._showToast('error', notification.message);
                }
            } catch (e) {
                console.error('🔷 Dashboard: Error parsing notification:', e);
            }
        }
    }
    
    connectedCallback() {
        console.log('🔷 Dashboard connectedCallback: Element connected to DOM');
    }
    
    _createStructure() {
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                
                :host {
                    --primary: #2563eb;
                    --primary-dark: #1d4ed8;
                    --primary-light: #dbeafe;
                    --success: #10b981;
                    --warning: #f59e0b;
                    --error: #ef4444;
                    --bg-primary: #ffffff;
                    --bg-secondary: #f9fafb;
                    --bg-tertiary: #f3f4f6;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --text-tertiary: #9ca3af;
                    --border: #e5e7eb;
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    display: block;
                    width: 100%;
                    min-height: 600px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 14px;
                    color: var(--text-primary);
                    background: var(--bg-secondary);
                }
                
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                .dashboard-container {
                    width: 100%;
                    min-height: 600px;
                    display: flex;
                    flex-direction: column;
                }
                
                .dashboard-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 32px;
                    box-shadow: var(--shadow-lg);
                }
                
                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .dashboard-title {
                    font-size: 32px;
                    font-weight: 800;
                    margin-bottom: 8px;
                    letter-spacing: -0.5px;
                }
                
                .dashboard-subtitle {
                    font-size: 16px;
                    opacity: 0.95;
                    line-height: 1.6;
                    font-weight: 400;
                }
                
                .stats-bar {
                    display: flex;
                    gap: 24px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }
                
                .stat-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    padding: 16px 20px;
                    border-radius: 12px;
                    min-width: 140px;
                }
                
                .stat-label {
                    font-size: 13px;
                    opacity: 0.9;
                    font-weight: 500;
                }
                
                .stat-value {
                    font-size: 28px;
                    font-weight: 700;
                }
                
                .main-content {
                    flex: 1;
                    padding: 32px;
                    min-height: 400px;
                }
                
                .content-wrapper {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .view-container {
                    display: none;
                }
                
                .view-container.active {
                    display: block;
                }
                
                /* Products Grid */
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }
                
                .product-card {
                    background: var(--bg-primary);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }
                
                .product-card:hover {
                    box-shadow: var(--shadow-xl);
                    transform: translateY(-8px);
                    border-color: var(--primary-light);
                }
                
                .product-image {
                    width: 100%;
                    height: 220px;
                    object-fit: cover;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                }
                
                .product-info {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .product-price {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 16px;
                }
                
                .seo-status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 16px;
                    width: fit-content;
                }
                
                .seo-status-active {
                    background: #d1fae5;
                    color: #065f46;
                }
                
                .seo-status-none {
                    background: #fee2e2;
                    color: #991b1b;
                }
                
                .product-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: auto;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 10px;
                }
                
                .btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: inherit;
                    text-align: center;
                    white-space: nowrap;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .btn-primary {
                    background: var(--primary);
                    color: white;
                }
                
                .btn-primary:hover {
                    background: var(--primary-dark);
                }
                
                .btn-success {
                    background: var(--success);
                    color: white;
                }
                
                .btn-warning {
                    background: var(--warning);
                    color: white;
                }
                
                .btn-danger {
                    background: var(--error);
                    color: white;
                }
                
                .btn-secondary {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                }
                
                /* Single Form */
                .seo-form-container {
                    background: var(--bg-primary);
                    border-radius: 20px;
                    box-shadow: var(--shadow-xl);
                    overflow: hidden;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .form-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 24px 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .form-title {
                    font-size: 24px;
                    font-weight: 700;
                }
                
                .form-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    transition: background 0.2s;
                }
                
                .form-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .form-body {
                    padding: 32px;
                    max-height: 70vh;
                    overflow-y: auto;
                }
                
                .info-box {
                    background: linear-gradient(135deg, #e0e7ff 0%, #cffafe 100%);
                    border-left: 4px solid var(--primary);
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }
                
                .info-box-title {
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .info-box-text {
                    font-size: 13px;
                    color: var(--text-secondary);
                    line-height: 1.6;
                }
                
                .warning-box {
                    background: #fef3c7;
                    border-left: 4px solid var(--warning);
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }
                
                .warning-box-title {
                    font-weight: 700;
                    color: #92400e;
                    margin-bottom: 8px;
                }
                
                .warning-box-text {
                    font-size: 13px;
                    color: #78350f;
                    line-height: 1.6;
                }
                
                .form-section {
                    margin-bottom: 32px;
                }
                
                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    padding: 16px;
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    margin-bottom: 16px;
                    transition: all 0.2s;
                }
                
                .section-header:hover {
                    background: var(--bg-tertiary);
                }
                
                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .section-toggle {
                    font-size: 24px;
                    color: var(--text-secondary);
                    transition: transform 0.3s;
                }
                
                .section-header.collapsed .section-toggle {
                    transform: rotate(-90deg);
                }
                
                .section-content {
                    max-height: 2000px;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }
                
                .section-content.collapsed {
                    max-height: 0;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--text-primary);
                    font-size: 14px;
                }
                
                .form-label.required::after {
                    content: '*';
                    color: var(--error);
                    margin-left: 4px;
                }
                
                .form-label-badge {
                    display: inline-block;
                    background: var(--primary-light);
                    color: var(--primary);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-left: 8px;
                }
                
                .form-input,
                .form-textarea,
                .form-select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid var(--border);
                    border-radius: 10px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: all 0.2s;
                    background: var(--bg-primary);
                }
                
                .form-input:focus,
                .form-textarea:focus,
                .form-select:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                
                .form-textarea {
                    resize: vertical;
                    min-height: 100px;
                }
                
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
                
                .help-text {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin-top: 6px;
                    line-height: 1.5;
                }
                
                .help-text strong {
                    color: var(--text-primary);
                }
                
                /* Dynamic Lists */
                .dynamic-list {
                    margin-top: 16px;
                }
                
                .dynamic-item {
                    background: var(--bg-secondary);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    border: 2px solid var(--border);
                    position: relative;
                }
                
                .dynamic-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .dynamic-item-title {
                    font-weight: 700;
                    color: var(--text-primary);
                }
                
                .btn-remove {
                    background: var(--error);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    font-weight: 600;
                }
                
                .btn-add {
                    background: var(--success);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 10px;
                    font-size: 14px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .btn-add:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .form-footer {
                    padding: 24px 32px;
                    background: var(--bg-secondary);
                    border-top: 2px solid var(--border);
                    display: flex;
                    gap: 16px;
                    justify-content: flex-end;
                }
                
                .loading-container,
                .empty-state {
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    min-height: 400px;
                }
                
                .loading-container.active,
                .empty-state.active {
                    display: flex;
                }
                
                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid var(--border);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    box-shadow: var(--shadow-xl);
                    display: none;
                    align-items: center;
                    gap: 12px;
                    z-index: 2000;
                    animation: slideIn 0.3s ease;
                    min-width: 320px;
                }
                
                .toast-notification.show {
                    display: flex;
                }
                
                .toast-success {
                    background: #f0fdf4;
                    border-left: 4px solid var(--success);
                    color: #166534;
                }
                
                .toast-error {
                    background: #fef2f2;
                    border-left: 4px solid var(--error);
                    color: #991b1b;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .pagination {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    padding: 32px 0;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .form-row,
                    .form-row-3 {
                        grid-template-columns: 1fr;
                    }
                    
                    .products-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                    }
                }
            </style>
            
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div class="header-content">
                        <h1 class="dashboard-title">Product SEO Manager</h1>
                        <p class="dashboard-subtitle">
                            Professional SEO optimization with Google-compliant structured data
                        </p>
                        <div class="stats-bar">
                            <div class="stat-item">
                                <span class="stat-label">Total Products</span>
                                <span class="stat-value" id="totalProducts">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">SEO Optimized</span>
                                <span class="stat-value" id="seoConfigured">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Pending</span>
                                <span class="stat-value" id="needsSetup">0</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="main-content">
                    <div class="content-wrapper">
                        <!-- Loading -->
                        <div id="loadingContainer" class="loading-container active">
                            <div class="spinner"></div>
                            <div class="loading-text">Loading products...</div>
                        </div>
                        
                        <!-- Products Grid -->
                        <div id="productsView" class="view-container">
                            <div class="products-grid" id="productsGrid"></div>
                            <div class="pagination" id="pagination" style="display: none;">
                                <button class="btn btn-secondary" id="prevPage">← Previous</button>
                                <span class="pagination-info" id="paginationInfo"></span>
                                <button class="btn btn-secondary" id="nextPage">Next →</button>
                            </div>
                        </div>
                        
                        <!-- Single Form -->
                        <div id="formView" class="view-container">
                            <div class="seo-form-container">
                                <div class="form-header">
                                    <h2 class="form-title" id="formTitle">Product SEO Setup</h2>
                                    <button class="form-close" id="closeForm">×</button>
                                </div>
                                
                                <div class="form-body" id="formBody">
                                    <!-- Form content will be inserted here -->
                                </div>
                                
                                <div class="form-footer">
                                    <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                                    <button class="btn btn-success" id="saveBtn">Save SEO Data</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Empty State -->
                        <div id="emptyState" class="empty-state">
                            <h2>No Products Found</h2>
                            <p>There are no products available in your store.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="toast-notification" id="toastNotification">
                <div id="toastMessage"></div>
            </div>
        `;
        
        this._shadow.appendChild(this._root);
    }
    
    _setupEventListeners() {
        console.log('🔷 Dashboard: Setting up event listeners...');
        
        // Pagination
        this._shadow.getElementById('prevPage').addEventListener('click', () => {
            if (this._currentPage > 0) {
                this._currentPage--;
                this._loadProducts();
            }
        });
        
        this._shadow.getElementById('nextPage').addEventListener('click', () => {
            this._currentPage++;
            this._loadProducts();
        });
        
        // Form controls
        this._shadow.getElementById('closeForm').addEventListener('click', () => {
            this._hideForm();
        });
        
        this._shadow.getElementById('cancelBtn').addEventListener('click', () => {
            this._hideForm();
        });
        
        this._shadow.getElementById('saveBtn').addEventListener('click', () => {
            this._handleSave();
        });
    }
    
    _dispatchEvent(eventName, detail) {
        console.log('🔷 Dashboard: Dispatching event:', eventName);
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
    
    _loadProducts() {
        console.log('🔷 Dashboard: Loading products...');
        
        const loadingContainer = this._shadow.getElementById('loadingContainer');
        const productsView = this._shadow.getElementById('productsView');
        const formView = this._shadow.getElementById('formView');
        const emptyState = this._shadow.getElementById('emptyState');
        
        loadingContainer.classList.add('active');
        productsView.classList.remove('active');
        formView.classList.remove('active');
        emptyState.classList.remove('active');
        
        this._dispatchEvent('load-products', {
            limit: this._pageSize,
            skip: this._currentPage * this._pageSize
        });
    }
    
    setProducts(data) {
        console.log('🔷 Dashboard: Setting products:', data.products.length);
        
        this._products = data.products || [];
        this._totalProducts = data.totalCount || 0;
        this._seoItems = data.seoItems || [];
        
        const loadingContainer = this._shadow.getElementById('loadingContainer');
        const productsView = this._shadow.getElementById('productsView');
        const emptyState = this._shadow.getElementById('emptyState');
        
        loadingContainer.classList.remove('active');
        
        if (this._products.length === 0) {
            emptyState.classList.add('active');
            productsView.classList.remove('active');
        } else {
            emptyState.classList.remove('active');
            productsView.classList.add('active');
            this._renderProducts();
            this._updateStats();
            this._updatePagination();
        }
    }
    
    _renderProducts() {
        const grid = this._shadow.getElementById('productsGrid');
        grid.innerHTML = '';
        
        this._products.forEach((product) => {
            const seoItem = this._seoItems.find(item => 
                item.productId === product.id || item.title === product.name
            );
            
            const card = document.createElement('div');
            card.className = 'product-card';
            
            const hasSEO = !!seoItem;
            
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <div class="seo-status-badge ${hasSEO ? 'seo-status-active' : 'seo-status-none'}">
                        ${hasSEO ? '✓ SEO Active' : '✗ No SEO'}
                    </div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">${product.price}</div>
                    <div class="product-actions">
                        ${hasSEO ? `
                            <div class="action-buttons">
                                <button class="btn btn-warning edit-btn">✏️ Edit SEO</button>
                                <button class="btn btn-danger delete-btn">🗑️ Delete</button>
                            </div>
                        ` : `
                            <button class="btn btn-primary set-btn">🚀 Setup SEO</button>
                        `}
                    </div>
                </div>
            `;
            
            const setBtn = card.querySelector('.set-btn');
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            
            if (setBtn) {
                setBtn.addEventListener('click', () => this._showForm(product, null, false));
            }
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this._showForm(product, seoItem, true));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this._deleteSEO(product, seoItem));
            }
            
            grid.appendChild(card);
        });
    }
    
    _showForm(product, seoData, isEdit) {
        console.log('🔷 Dashboard: Showing form for:', product.name);
        
        this._selectedProduct = product;
        this._editMode = isEdit;
        this._showingForm = true;
        this._reviews = [];
        this._faqs = [];
        
        const formTitle = this._shadow.getElementById('formTitle');
        formTitle.textContent = isEdit ? 'Edit Product SEO' : 'Setup Product SEO';
        
        // Initialize form data
        this._formData = {
            productName: product.name,
            description: '',
            metaKeywords: '',
            canonicalUrl: '',
            robotsContent: 'index, follow',
            sku: '',
            mpn: '',
            gtin: '',
            isbn: '',
            brandName: '',
            imageUrls: [],
            price: '',
            priceCurrency: 'USD',
            priceValidUntil: '',
            availability: '',
            itemCondition: '',
            offerUrl: '',
            shippingCost: '',
            shippingCurrency: 'USD',
            shippingDestination: '',
            handlingTimeMin: '',
            handlingTimeMax: '',
            deliveryTimeMin: '',
            deliveryTimeMax: '',
            returnDays: '',
            returnCountry: '',
            returnMethod: '',
            returnFees: '',
            aggregateRatingValue: '',
            reviewCount: '',
            bestRating: '5',
            worstRating: '1',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            twitterCard: 'summary_large_image'
        };
        
        // Populate from existing data
        if (seoData && seoData.seoData) {
            try {
                const data = typeof seoData.seoData === 'string' 
                    ? JSON.parse(seoData.seoData) 
                    : seoData.seoData;
                
                Object.assign(this._formData, data);
                
                if (data.reviews) this._reviews = data.reviews;
                if (data.faqs) this._faqs = data.faqs;
            } catch (e) {
                console.error('Error parsing SEO data:', e);
            }
        }
        
        // Render form
        this._renderForm();
        
        // Show form view
        const productsView = this._shadow.getElementById('productsView');
        const formView = this._shadow.getElementById('formView');
        
        productsView.classList.remove('active');
        formView.classList.add('active');
    }

    _renderForm() {
        const formBody = this._shadow.getElementById('formBody');
        
        const currencies = this._getAllCurrencies();
        const countries = this._getAllCountries();
        const imageUrlsValue = (this._formData.imageUrls && Array.isArray(this._formData.imageUrls)) 
            ? this._formData.imageUrls.join('\n') 
            : '';
        
        formBody.innerHTML = `
            <div class="info-box">
                <div class="info-box-title">📋 Product SEO Optimization</div>
                <div class="info-box-text">
                    Complete the fields below to optimize your product for search engines. Fields marked with * are required for basic SEO. 
                    Additional fields improve your chances of appearing in Google Shopping and rich results. You can expand/collapse sections by clicking on them.
                </div>
            </div>
            
            <!-- Section 1: Basic SEO -->
            <div class="form-section">
                <div class="section-header" data-section="basic">
                    <div class="section-title">📝 Basic SEO Information</div>
                    <div class="section-toggle">▼</div>
                </div>
                <div class="section-content" data-content="basic">
                    <div class="form-group">
                        <label class="form-label required">Product Name (Title Tag)</label>
                        <input type="text" class="form-input" id="productName" maxlength="60" value="${this._formData.productName || ''}">
                        <div class="help-text">
                            <strong>What it is:</strong> The main title shown in search results and browser tabs.<br>
                            <strong>Best practice:</strong> Keep under 60 characters. Include main keyword at the beginning.<br>
                            <strong>Example:</strong> "Wireless Noise-Canceling Headphones - Premium Audio"
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required">Meta Description</label>
                        <textarea class="form-textarea" id="description" maxlength="160" rows="3">${this._formData.description || ''}</textarea>
                        <div class="help-text">
                            <strong>What it is:</strong> The summary text shown below your title in search results.<br>
                            <strong>Best practice:</strong> 150-160 characters. Include a call-to-action and main benefits.<br>
                            <strong>Example:</strong> "Experience superior sound quality with 30-hour battery life. Active noise cancellation blocks out distractions. Free shipping on orders over $50."
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Meta Keywords <span class="form-label-badge">Optional</span></label>
                        <input type="text" class="form-input" id="metaKeywords" placeholder="wireless headphones, noise canceling, bluetooth" value="${this._formData.metaKeywords || ''}">
                        <div class="help-text">
                            <strong>What it is:</strong> Comma-separated keywords related to your product.<br>
                            <strong>Note:</strong> Google doesn't use this for ranking, but some other search engines might.<br>
                            <strong>Can leave empty:</strong> Yes, this is completely optional.
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Canonical URL <span class="form-label-badge">Optional</span></label>
                            <input type="url" class="form-input" id="canonicalUrl" placeholder="https://yourstore.com/products/headphones" value="${this._formData.canonicalUrl || ''}">
                            <div class="help-text">
                                <strong>What it is:</strong> The preferred URL for this product.<br>
                                <strong>Can leave empty:</strong> Yes, auto-generated if blank.
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Robots Directive</label>
                            <select class="form-select" id="robotsContent">
                                <option value="index, follow" ${this._formData.robotsContent === 'index, follow' ? 'selected' : ''}>Index & Follow (Recommended)</option>
                                <option value="index, nofollow" ${this._formData.robotsContent === 'index, nofollow' ? 'selected' : ''}>Index but Don't Follow</option>
                                <option value="noindex, follow" ${this._formData.robotsContent === 'noindex, follow' ? 'selected' : ''}>Don't Index but Follow</option>
                                <option value="noindex, nofollow" ${this._formData.robotsContent === 'noindex, nofollow' ? 'selected' : ''}>Don't Index or Follow</option>
                            </select>
                            <div class="help-text">
                                <strong>Best practice:</strong> Use "Index & Follow" for products you want in search.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 2: Product Schema -->
            <div class="form-section">
                <div class="section-header collapsed" data-section="schema">
                    <div class="section-title">🏷️ Product Schema & Identifiers</div>
                    <div class="section-toggle">▼</div>
                </div>
                <div class="section-content collapsed" data-content="schema">
                    <div class="warning-box">
                        <div class="warning-box-title">⚠️ Important: Product Identifiers</div>
                        <div class="warning-box-text">
                            At least ONE of these identifiers (GTIN, MPN, or Brand) is required for Google Shopping. Having all three greatly increases visibility.
                        </div>
                    </div>
                    
                    <div class="form-row-3">
                        <div class="form-group">
                            <label class="form-label">SKU <span class="form-label-badge">Recommended</span></label>
                            <input type="text" class="form-input" id="sku" placeholder="PROD-12345" value="${this._formData.sku || ''}">
                            <div class="help-text">
                                <strong>What it is:</strong> Your internal product code.<br>
                                <strong>Example:</strong> "HDN-WL-BLK-001"
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">MPN <span class="form-label-badge">Recommended</span></label>
                            <input type="text" class="form-input" id="mpn" placeholder="MFR123456" value="${this._formData.mpn || ''}">
                            <div class="help-text">
                                <strong>What it is:</strong> Manufacturer Part Number.<br>
                                <strong>Example:</strong> "WH-1000XM4"
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">GTIN <span class="form-label-badge">Highly Recommended</span></label>
                            <input type="text" class="form-input" id="gtin" placeholder="00012345678905" value="${this._formData.gtin || ''}">
                            <div class="help-text">
                                <strong>What it is:</strong> Global Trade Item Number (UPC/EAN).<br>
                                <strong>Example:</strong> "00012345678905"
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ISBN <span class="form-label-badge">For Books Only</span></label>
                            <input type="text" class="form-input" id="isbn" placeholder="978-3-16-148410-0" value="${this._formData.isbn || ''}">
                            <div class="help-text">
                                <strong>What it is:</strong> For books only.<br>
                                <strong>Can leave empty:</strong> Yes, unless selling books.
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Brand Name <span class="form-label-badge">Highly Recommended</span></label>
                            <input type="text" class="form-input" id="brandName" placeholder="Sony" value="${this._formData.brandName || ''}">
                            <div class="help-text">
                                <strong>Examples:</strong> "Sony", "Nike", "Apple"<br>
                                <strong>Required for:</strong> Google Shopping.
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Image URLs <span class="form-label-badge">Highly Recommended</span></label>
                        <textarea class="form-textarea" id="imageUrls" rows="5" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg">${imageUrlsValue}</textarea>
                        <div class="help-text">
                            <strong>Format:</strong> One URL per line. Minimum 800x800px. Use JPG, PNG, or WebP.<br>
                            <strong>Best practice:</strong> Add 3-5 images from different angles.
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 3: Pricing & Offers -->
            <div class="form-section">
                <div class="section-header collapsed" data-section="pricing">
                    <div class="section-title">💰 Pricing & Offers</div>
                    <div class="section-toggle">▼</div>
                </div>
                <div class="section-content collapsed" data-content="pricing">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Price</label>
                            <input type="number" step="0.01" min="0" class="form-input" id="price" placeholder="99.99" value="${this._formData.price || ''}">
                            <div class="help-text">
                                <strong>Required:</strong> Numbers only, no currency symbols.<br>
                                <strong>Example:</strong> "99.99"
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Currency</label>
                            <select class="form-select" id="priceCurrency">
                                ${currencies}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Price Valid Until <span class="form-label-badge">Recommended</span></label>
                            <input type="date" class="form-input" id="priceValidUntil" value="${this._formData.priceValidUntil || ''}">
                            <div class="help-text">
                                <strong>Best practice:</strong> Set at least 30 days in future.
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Product Page URL <span class="form-label-badge">Optional</span></label>
                            <input type="url" class="form-input" id="offerUrl" placeholder="https://yourstore.com/products/product-name" value="${this._formData.offerUrl || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Availability Status</label>
                            <select class="form-select" id="availability">
                                <option value="">-- Select Availability --</option>
                                <option value="https://schema.org/InStock" ${this._formData.availability === 'https://schema.org/InStock' ? 'selected' : ''}>In Stock</option>
                                <option value="https://schema.org/OutOfStock" ${this._formData.availability === 'https://schema.org/OutOfStock' ? 'selected' : ''}>Out of Stock</option>
                                <option value="https://schema.org/PreOrder" ${this._formData.availability === 'https://schema.org/PreOrder' ? 'selected' : ''}>Pre-Order</option>
                                <option value="https://schema.org/Discontinued" ${this._formData.availability === 'https://schema.org/Discontinued' ? 'selected' : ''}>Discontinued</option>
                                <option value="https://schema.org/LimitedAvailability" ${this._formData.availability === 'https://schema.org/LimitedAvailability' ? 'selected' : ''}>Limited Availability</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Item Condition <span class="form-label-badge">Recommended</span></label>
                            <select class="form-select" id="itemCondition">
                                <option value="">-- Select Condition --</option>
                                <option value="https://schema.org/NewCondition" ${this._formData.itemCondition === 'https://schema.org/NewCondition' ? 'selected' : ''}>New</option>
                                <option value="https://schema.org/RefurbishedCondition" ${this._formData.itemCondition === 'https://schema.org/RefurbishedCondition' ? 'selected' : ''}>Refurbished</option>
                                <option value="https://schema.org/UsedCondition" ${this._formData.itemCondition === 'https://schema.org/UsedCondition' ? 'selected' : ''}>Used</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 4: Merchant Listing -->
            <div class="form-section">
                <div class="section-header collapsed" data-section="merchant">
                    <div class="section-title">🚚 Merchant Listing (Shipping & Returns)</div>
                    <div class="section-toggle">▼</div>
                </div>
                <div class="section-content collapsed" data-content="merchant">
                    <div class="warning-box">
                        <div class="warning-box-title">⚠️ Google Shopping Requirements</div>
                        <div class="warning-box-text">
                            Complete these fields to appear in Google Shopping. Without shipping and return information, your products will only show in regular search results.
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Shipping Cost <span class="form-label-badge">For Shopping</span></label>
                            <input type="number" step="0.01" min="0" class="form-input" id="shippingCost" placeholder="0.00" value="${this._formData.shippingCost || ''}">
                            <div class="help-text">
                                <strong>Example:</strong> Use "0" for free shipping.
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Shipping Currency</label>
                            <select class="form-select" id="shippingCurrency">
                                ${currencies}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Shipping Destination <span class="form-label-badge">For Shopping</span></label>
                        <select class="form-select" id="shippingDestination">
                            ${countries}
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Handling Time (Days)</label>
                            <div class="form-row">
                                <input type="number" min="0" class="form-input" id="handlingTimeMin" placeholder="Min: 0" value="${this._formData.handlingTimeMin || ''}">
                                <input type="number" min="0" class="form-input" id="handlingTimeMax" placeholder="Max: 1" value="${this._formData.handlingTimeMax || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Delivery Time (Days) <span class="form-label-badge">For Shopping</span></label>
                            <div class="form-row">
                                <input type="number" min="0" class="form-input" id="deliveryTimeMin" placeholder="Min: 2" value="${this._formData.deliveryTimeMin || ''}">
                                <input type="number" min="0" class="form-input" id="deliveryTimeMax" placeholder="Max: 5" value="${this._formData.deliveryTimeMax || ''}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Return Window (Days) <span class="form-label-badge">For Shopping</span></label>
                            <input type="number" min="0" class="form-input" id="returnDays" placeholder="30" value="${this._formData.returnDays || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Return Policy Country</label>
                            <select class="form-select" id="returnCountry">
                                ${countries}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Return Method</label>
                            <select class="form-select" id="returnMethod">
                                <option value="">-- Select --</option>
                                <option value="https://schema.org/ReturnByMail" ${this._formData.returnMethod === 'https://schema.org/ReturnByMail' ? 'selected' : ''}>Return by Mail</option>
                                <option value="https://schema.org/ReturnInStore" ${this._formData.returnMethod === 'https://schema.org/ReturnInStore' ? 'selected' : ''}>Return in Store</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Return Fees</label>
                            <select class="form-select" id="returnFees">
                                <option value="">-- Select --</option>
                                <option value="https://schema.org/FreeReturn" ${this._formData.returnFees === 'https://schema.org/FreeReturn' ? 'selected' : ''}>Free Return</option>
                                <option value="https://schema.org/ReturnShippingFees" ${this._formData.returnFees === 'https://schema.org/ReturnShippingFees' ? 'selected' : ''}>Customer Pays Shipping</option>
                                <option value="https://schema.org/RestockingFees" ${this._formData.returnFees === 'https://schema.org/RestockingFees' ? 'selected' : ''}>Restocking Fee</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 5: Reviews & Ratings -->
            <div class="form-section">
                <div class="section-header collapsed" data-section="reviews">
                    <div class="section-title">⭐ Reviews & Ratings</div>
                    <div class="section-toggle">▼</div>
                </div>
                <div class="section-content collapsed" data-content="reviews">
                    <div class="warning-box">
                        <div class="warning-box-title">⚠️ Critical: Fake Reviews Are Prohibited</div>
                        <div class="warning-box-text">
                            <strong>DO NOT create fake reviews!</strong> Only add genuine reviews from real customers. Violations can result in penalties and bans from Google Shopping.
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Average Rating <span class="form-label-badge">Optional</span></label>
                            <input type="number" step="0.1" min="0" max="5" class="form-input" id="aggregateRatingValue" placeholder="4.5" value="${this._formData.aggregateRatingValue || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Total Review Count</label>
                            <input type="number" min="0" class="form-input" id="reviewCount" placeholder="89" value="${this._formData.reviewCount || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Individual Reviews <span class="form-label-badge">Optional</span></label>
                        <div id="reviewsList" class="dynamic-list"></div>
                        <button type="button" class="btn-add" id="addReview">+ Add Review</button>
                    </div>
                </div>
            </div>
            
            <!-- Section 6: FAQ & Advanced -->
            <div class="form-section">
                <div class="section-header collapsed" data-section="faq">
                    <div class="section-title">❓ FAQ & Social Media</div>
                    <div class="section-toggle">▼</div>
                </div>
                <div class="section-content collapsed" data-content="faq">
                    <div class="warning-box">
                        <div class="warning-box-title">⚠️ FAQ Best Practices</div>
                        <div class="warning-box-text">
                            <strong>Only add FAQs if they actually exist on your product page!</strong> FAQs must be visible to users. Don't use for promotional content.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Frequently Asked Questions</label>
                        <div id="faqsList" class="dynamic-list"></div>
                        <button type="button" class="btn-add" id="addFaq">+ Add FAQ</button>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Open Graph Title <span class="form-label-badge">Optional</span></label>
                            <input type="text" class="form-input" id="ogTitle" value="${this._formData.ogTitle || ''}">
                            <div class="help-text">For social media sharing (Facebook, LinkedIn)</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Open Graph Image</label>
                            <input type="url" class="form-input" id="ogImage" value="${this._formData.ogImage || ''}">
                            <div class="help-text">Recommended: 1200x630 pixels</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Open Graph Description</label>
                        <textarea class="form-textarea" id="ogDescription" rows="3">${this._formData.ogDescription || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Twitter Card Type</label>
                        <select class="form-select" id="twitterCard">
                            <option value="summary" ${this._formData.twitterCard === 'summary' ? 'selected' : ''}>Summary</option>
                            <option value="summary_large_image" ${this._formData.twitterCard === 'summary_large_image' ? 'selected' : ''}>Summary Large Image (Recommended)</option>
                            <option value="product" ${this._formData.twitterCard === 'product' ? 'selected' : ''}>Product</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        // Set up collapsible sections
        const sectionHeaders = formBody.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sectionName = header.dataset.section;
                const content = formBody.querySelector(`[data-content="${sectionName}"]`);
                header.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            });
        });
        
        // Set selected values for dropdowns
        setTimeout(() => {
            const priceCurrency = formBody.querySelector('#priceCurrency');
            if (priceCurrency) priceCurrency.value = this._formData.priceCurrency || 'USD';
            
            const shippingCurrency = formBody.querySelector('#shippingCurrency');
            if (shippingCurrency) shippingCurrency.value = this._formData.shippingCurrency || 'USD';
            
            const shippingDestination = formBody.querySelector('#shippingDestination');
            if (shippingDestination) shippingDestination.value = this._formData.shippingDestination || '';
            
            const returnCountry = formBody.querySelector('#returnCountry');
            if (returnCountry) returnCountry.value = this._formData.returnCountry || '';
            
            // Render reviews and FAQs
            this._renderReviews();
            this._renderFaqs();
            
            // Set up add buttons
            const addReviewBtn = formBody.querySelector('#addReview');
            if (addReviewBtn) {
                addReviewBtn.addEventListener('click', () => this._addReview());
            }
            
            const addFaqBtn = formBody.querySelector('#addFaq');
            if (addFaqBtn) {
                addFaqBtn.addEventListener('click', () => this._addFaq());
            }
        }, 0);
    }

_renderReviews() {
        const reviewsList = this._shadow.getElementById('reviewsList');
        
        if (!reviewsList) {
            console.warn('🔷 Dashboard: reviewsList element not found');
            return;
        }
        
        reviewsList.innerHTML = '';
        
        if (this._reviews.length === 0) {
            reviewsList.innerHTML = '<p style="color: #6b7280; font-style: italic; padding: 20px; text-align: center;">No reviews added yet. Click "Add Review" to add one.</p>';
            return;
        }
        
        this._reviews.forEach((review, index) => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'dynamic-item';
            reviewItem.innerHTML = `
                <div class="dynamic-item-header">
                    <div class="dynamic-item-title">Review #${index + 1}</div>
                    <button type="button" class="btn-remove" data-index="${index}">Remove</button>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Reviewer Name</label>
                        <input type="text" class="form-input review-author" data-index="${index}" value="${review.author || ''}" placeholder="John Smith">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Rating (1-5)</label>
                        <input type="number" min="1" max="5" class="form-input review-rating" data-index="${index}" value="${review.rating || ''}" placeholder="5">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Review Title <span class="form-label-badge">Optional</span></label>
                    <input type="text" class="form-input review-title" data-index="${index}" value="${review.title || ''}" placeholder="Great product!">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Review Text <span class="form-label-badge">Optional</span></label>
                    <textarea class="form-textarea review-text" data-index="${index}" rows="3" placeholder="This product exceeded my expectations...">${review.text || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Review Date <span class="form-label-badge">Optional</span></label>
                    <input type="date" class="form-input review-date" data-index="${index}" value="${review.date || ''}">
                </div>
            `;
            
            reviewsList.appendChild(reviewItem);
            
            // Add remove listener
            reviewItem.querySelector('.btn-remove').addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this._reviews.splice(idx, 1);
                this._renderReviews();
            });
            
            // Add change listeners
            reviewItem.querySelector('.review-author').addEventListener('input', (e) => {
                this._reviews[index].author = e.target.value;
            });
            
            reviewItem.querySelector('.review-rating').addEventListener('input', (e) => {
                this._reviews[index].rating = e.target.value;
            });
            
            reviewItem.querySelector('.review-title').addEventListener('input', (e) => {
                this._reviews[index].title = e.target.value;
            });
            
            reviewItem.querySelector('.review-text').addEventListener('input', (e) => {
                this._reviews[index].text = e.target.value;
            });
            
            reviewItem.querySelector('.review-date').addEventListener('input', (e) => {
                this._reviews[index].date = e.target.value;
            });
        });
    }
    
    _addReview() {
        this._reviews.push({
            author: '',
            rating: '',
            title: '',
            text: '',
            date: ''
        });
        this._renderReviews();
    }
    
    _renderFaqs() {
        const faqsList = this._shadow.getElementById('faqsList');
        
        if (!faqsList) {
            console.warn('🔷 Dashboard: faqsList element not found');
            return;
        }
        
        faqsList.innerHTML = '';
        
        if (this._faqs.length === 0) {
            faqsList.innerHTML = '<p style="color: #6b7280; font-style: italic; padding: 20px; text-align: center;">No FAQs added yet. Click "Add FAQ" to add one.</p>';
            return;
        }
        
        this._faqs.forEach((faq, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = 'dynamic-item';
            faqItem.innerHTML = `
                <div class="dynamic-item-header">
                    <div class="dynamic-item-title">FAQ #${index + 1}</div>
                    <button type="button" class="btn-remove" data-index="${index}">Remove</button>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Question</label>
                    <input type="text" class="form-input faq-question" data-index="${index}" value="${faq.question || ''}" placeholder="What is the warranty period?">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Answer</label>
                    <textarea class="form-textarea faq-answer" data-index="${index}" rows="3" placeholder="This product comes with a 2-year manufacturer warranty...">${faq.answer || ''}</textarea>
                </div>
            `;
            
            faqsList.appendChild(faqItem);
            
            // Add remove listener
            faqItem.querySelector('.btn-remove').addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this._faqs.splice(idx, 1);
                this._renderFaqs();
            });
            
            // Add change listeners
            faqItem.querySelector('.faq-question').addEventListener('input', (e) => {
                this._faqs[index].question = e.target.value;
            });
            
            faqItem.querySelector('.faq-answer').addEventListener('input', (e) => {
                this._faqs[index].answer = e.target.value;
            });
        });
    }
    
    _addFaq() {
        this._faqs.push({
            question: '',
            answer: ''
        });
        this._renderFaqs();
    }
    
    _collectFormData() {
        const formBody = this._shadow.getElementById('formBody');
        
        // Collect all form values
        const data = {
            // Basic SEO
            productName: formBody.querySelector('#productName')?.value.trim() || '',
            description: formBody.querySelector('#description')?.value.trim() || '',
            metaKeywords: formBody.querySelector('#metaKeywords')?.value.trim() || '',
            canonicalUrl: formBody.querySelector('#canonicalUrl')?.value.trim() || '',
            robotsContent: formBody.querySelector('#robotsContent')?.value || 'index, follow',
            
            // Product Schema
            sku: formBody.querySelector('#sku')?.value.trim() || '',
            mpn: formBody.querySelector('#mpn')?.value.trim() || '',
            gtin: formBody.querySelector('#gtin')?.value.trim() || '',
            isbn: formBody.querySelector('#isbn')?.value.trim() || '',
            brandName: formBody.querySelector('#brandName')?.value.trim() || '',
            
            // Images
            imageUrls: [],
            
            // Pricing
            price: formBody.querySelector('#price')?.value.trim() || '',
            priceCurrency: formBody.querySelector('#priceCurrency')?.value || 'USD',
            priceValidUntil: formBody.querySelector('#priceValidUntil')?.value || '',
            offerUrl: formBody.querySelector('#offerUrl')?.value.trim() || '',
            availability: formBody.querySelector('#availability')?.value || '',
            itemCondition: formBody.querySelector('#itemCondition')?.value || '',
            
            // Shipping
            shippingCost: formBody.querySelector('#shippingCost')?.value.trim() || '',
            shippingCurrency: formBody.querySelector('#shippingCurrency')?.value || 'USD',
            shippingDestination: formBody.querySelector('#shippingDestination')?.value || '',
            handlingTimeMin: formBody.querySelector('#handlingTimeMin')?.value.trim() || '',
            handlingTimeMax: formBody.querySelector('#handlingTimeMax')?.value.trim() || '',
            deliveryTimeMin: formBody.querySelector('#deliveryTimeMin')?.value.trim() || '',
            deliveryTimeMax: formBody.querySelector('#deliveryTimeMax')?.value.trim() || '',
            
            // Returns
            returnDays: formBody.querySelector('#returnDays')?.value.trim() || '',
            returnCountry: formBody.querySelector('#returnCountry')?.value || '',
            returnMethod: formBody.querySelector('#returnMethod')?.value || '',
            returnFees: formBody.querySelector('#returnFees')?.value || '',
            
            // Reviews
            aggregateRatingValue: formBody.querySelector('#aggregateRatingValue')?.value.trim() || '',
            reviewCount: formBody.querySelector('#reviewCount')?.value.trim() || '',
            bestRating: '5',
            worstRating: '1',
            
            // Social
            ogTitle: formBody.querySelector('#ogTitle')?.value.trim() || '',
            ogDescription: formBody.querySelector('#ogDescription')?.value.trim() || '',
            ogImage: formBody.querySelector('#ogImage')?.value.trim() || '',
            twitterCard: formBody.querySelector('#twitterCard')?.value || 'summary_large_image',
            
            // Dynamic data
            reviews: this._reviews,
            faqs: this._faqs
        };
        
        // Parse image URLs
        const imageUrlsText = formBody.querySelector('#imageUrls')?.value.trim() || '';
        if (imageUrlsText) {
            data.imageUrls = imageUrlsText.split('\n').map(url => url.trim()).filter(url => url);
        }
        
        return data;
    }
    
    _validateForm() {
        const formBody = this._shadow.getElementById('formBody');
        
        // Required fields
        const productName = formBody.querySelector('#productName')?.value.trim();
        if (!productName) {
            alert('Please enter a product name');
            return false;
        }
        
        const description = formBody.querySelector('#description')?.value.trim();
        if (!description) {
            alert('Please enter a meta description');
            return false;
        }
        
        const price = formBody.querySelector('#price')?.value.trim();
        if (!price) {
            alert('Please enter a price');
            return false;
        }
        
        const priceCurrency = formBody.querySelector('#priceCurrency')?.value;
        if (!priceCurrency) {
            alert('Please select a currency');
            return false;
        }
        
        const availability = formBody.querySelector('#availability')?.value;
        if (!availability) {
            alert('Please select availability status');
            return false;
        }
        
        return true;
    }
    
    _handleSave() {
        console.log('🔷 Dashboard: Handling save');
        
        // Validate
        if (!this._validateForm()) {
            return;
        }
        
        // Collect form data
        const seoData = this._collectFormData();
        
        console.log('🔷 Dashboard: Collected SEO data:', seoData);
        
        const existingSEO = this._seoItems.find(item => 
            item.productId === this._selectedProduct.id || item.title === this._selectedProduct.name
        );
        
        this._dispatchEvent('save-seo', {
            product: this._selectedProduct,
            seoData: seoData,
            existingSEO: existingSEO
        });
    }
    
    _deleteSEO(product, seoData) {
        if (!confirm(`Delete SEO data for "${product.name}"?`)) {
            return;
        }
        
        this._dispatchEvent('delete-seo', {
            product: product,
            seoData: seoData
        });
    }
    
    _hideForm() {
        console.log('🔷 Dashboard: Hiding form');
        
        this._showingForm = false;
        this._selectedProduct = null;
        this._editMode = false;
        this._formData = {};
        this._reviews = [];
        this._faqs = [];
        
        const productsView = this._shadow.getElementById('productsView');
        const formView = this._shadow.getElementById('formView');
        
        formView.classList.remove('active');
        productsView.classList.add('active');
    }
    
    _updateStats() {
        this._shadow.getElementById('totalProducts').textContent = this._totalProducts;
        
        const seoConfigured = this._seoItems.length;
        const needsSetup = this._totalProducts - seoConfigured;
        
        this._shadow.getElementById('seoConfigured').textContent = seoConfigured;
        this._shadow.getElementById('needsSetup').textContent = needsSetup;
    }
    
    _updatePagination() {
        const pagination = this._shadow.getElementById('pagination');
        const prevBtn = this._shadow.getElementById('prevPage');
        const nextBtn = this._shadow.getElementById('nextPage');
        const info = this._shadow.getElementById('paginationInfo');
        
        const totalPages = Math.ceil(this._totalProducts / this._pageSize);
        
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            prevBtn.disabled = this._currentPage === 0;
            nextBtn.disabled = this._currentPage >= totalPages - 1;
            
            const start = this._currentPage * this._pageSize + 1;
            const end = Math.min((this._currentPage + 1) * this._pageSize, this._totalProducts);
            info.textContent = `${start}-${end} of ${this._totalProducts}`;
        } else {
            pagination.style.display = 'none';
        }
    }
    
    _showToast(type, message) {
        const toast = this._shadow.getElementById('toastNotification');
        const toastMessage = this._shadow.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast-notification toast-${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }
    
    _getAllCurrencies() {
        const currencies = [
            { code: 'USD', name: 'US Dollar' },
            { code: 'EUR', name: 'Euro' },
            { code: 'GBP', name: 'British Pound' },
            { code: 'INR', name: 'Indian Rupee' },
            { code: 'AUD', name: 'Australian Dollar' },
            { code: 'CAD', name: 'Canadian Dollar' },
            { code: 'JPY', name: 'Japanese Yen' },
            { code: 'CNY', name: 'Chinese Yuan' },
            { code: 'CHF', name: 'Swiss Franc' },
            { code: 'SEK', name: 'Swedish Krona' },
            { code: 'NZD', name: 'New Zealand Dollar' },
            { code: 'MXN', name: 'Mexican Peso' },
            { code: 'SGD', name: 'Singapore Dollar' },
            { code: 'HKD', name: 'Hong Kong Dollar' },
            { code: 'NOK', name: 'Norwegian Krone' },
            { code: 'TRY', name: 'Turkish Lira' },
            { code: 'RUB', name: 'Russian Ruble' },
            { code: 'BRL', name: 'Brazilian Real' },
            { code: 'ZAR', name: 'South African Rand' },
            { code: 'DKK', name: 'Danish Krone' },
            { code: 'PLN', name: 'Polish Zloty' },
            { code: 'THB', name: 'Thai Baht' },
            { code: 'MYR', name: 'Malaysian Ringgit' },
            { code: 'IDR', name: 'Indonesian Rupiah' },
            { code: 'HUF', name: 'Hungarian Forint' },
            { code: 'CZK', name: 'Czech Koruna' },
            { code: 'ILS', name: 'Israeli Shekel' },
            { code: 'CLP', name: 'Chilean Peso' },
            { code: 'PHP', name: 'Philippine Peso' },
            { code: 'AED', name: 'UAE Dirham' },
            { code: 'SAR', name: 'Saudi Riyal' },
            { code: 'ARS', name: 'Argentine Peso' },
            { code: 'EGP', name: 'Egyptian Pound' },
            { code: 'PKR', name: 'Pakistani Rupee' },
            { code: 'BDT', name: 'Bangladeshi Taka' },
            { code: 'VND', name: 'Vietnamese Dong' },
            { code: 'NGN', name: 'Nigerian Naira' },
            { code: 'UAH', name: 'Ukrainian Hryvnia' },
            { code: 'PEN', name: 'Peruvian Sol' },
            { code: 'COP', name: 'Colombian Peso' },
            { code: 'MAD', name: 'Moroccan Dirham' },
            { code: 'RON', name: 'Romanian Leu' },
            { code: 'KES', name: 'Kenyan Shilling' },
            { code: 'LKR', name: 'Sri Lankan Rupee' },
            { code: 'QAR', name: 'Qatari Riyal' },
            { code: 'KWD', name: 'Kuwaiti Dinar' },
            { code: 'OMR', name: 'Omani Rial' },
            { code: 'BHD', name: 'Bahraini Dinar' },
            { code: 'JOD', name: 'Jordanian Dinar' },
            { code: 'KRW', name: 'South Korean Won' },
            { code: 'TWD', name: 'Taiwan Dollar' }
        ];
        
        return currencies.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('');
    }
    
    _getAllCountries() {
        const countries = [
            { code: '', name: '-- Select Country --' },
            { code: 'US', name: 'United States' },
            { code: 'GB', name: 'United Kingdom' },
            { code: 'CA', name: 'Canada' },
            { code: 'AU', name: 'Australia' },
            { code: 'DE', name: 'Germany' },
            { code: 'FR', name: 'France' },
            { code: 'IT', name: 'Italy' },
            { code: 'ES', name: 'Spain' },
            { code: 'NL', name: 'Netherlands' },
            { code: 'BE', name: 'Belgium' },
            { code: 'CH', name: 'Switzerland' },
            { code: 'AT', name: 'Austria' },
            { code: 'SE', name: 'Sweden' },
            { code: 'NO', name: 'Norway' },
            { code: 'DK', name: 'Denmark' },
            { code: 'FI', name: 'Finland' },
            { code: 'IE', name: 'Ireland' },
            { code: 'NZ', name: 'New Zealand' },
            { code: 'SG', name: 'Singapore' },
            { code: 'HK', name: 'Hong Kong' },
            { code: 'JP', name: 'Japan' },
            { code: 'CN', name: 'China' },
            { code: 'IN', name: 'India' },
            { code: 'BR', name: 'Brazil' },
            { code: 'MX', name: 'Mexico' },
            { code: 'AR', name: 'Argentina' },
            { code: 'CL', name: 'Chile' },
            { code: 'CO', name: 'Colombia' },
            { code: 'PE', name: 'Peru' },
            { code: 'ZA', name: 'South Africa' },
            { code: 'AE', name: 'United Arab Emirates' },
            { code: 'SA', name: 'Saudi Arabia' },
            { code: 'TR', name: 'Turkey' },
            { code: 'RU', name: 'Russia' },
            { code: 'PL', name: 'Poland' },
            { code: 'CZ', name: 'Czech Republic' },
            { code: 'HU', name: 'Hungary' },
            { code: 'RO', name: 'Romania' },
            { code: 'TH', name: 'Thailand' },
            { code: 'MY', name: 'Malaysia' },
            { code: 'ID', name: 'Indonesia' },
            { code: 'PH', name: 'Philippines' },
            { code: 'VN', name: 'Vietnam' },
            { code: 'KR', name: 'South Korea' },
            { code: 'TW', name: 'Taiwan' },
            { code: 'IL', name: 'Israel' },
            { code: 'EG', name: 'Egypt' },
            { code: 'NG', name: 'Nigeria' },
            { code: 'KE', name: 'Kenya' },
            { code: 'PK', name: 'Pakistan' },
            { code: 'BD', name: 'Bangladesh' },
            { code: 'LK', name: 'Sri Lanka' },
            { code: 'UA', name: 'Ukraine' },
            { code: 'MA', name: 'Morocco' },
            { code: 'PT', name: 'Portugal' },
            { code: 'GR', name: 'Greece' }
        ];
        
        return countries.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
    }
}

customElements.define('product-seo-dashboard', ProductSEODashboard);
console.log('🔷 Dashboard: ✅ Custom element registered');
