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
        this._currentStep = 1;
        this._totalSteps = 6;
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
                
                /* Multi-Step Form */
                .seo-form-container {
                    background: var(--bg-primary);
                    border-radius: 20px;
                    box-shadow: var(--shadow-xl);
                    overflow: hidden;
                    max-width: 1000px;
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
                
                .progress-bar {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.3);
                    position: relative;
                }
                
                .progress-fill {
                    height: 100%;
                    background: white;
                    transition: width 0.3s ease;
                }
                
                .step-indicator {
                    padding: 24px 32px;
                    background: var(--bg-secondary);
                    border-bottom: 2px solid var(--border);
                }
                
                .step-dots {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .step-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--border);
                    transition: all 0.3s;
                }
                
                .step-dot.active {
                    background: var(--primary);
                    transform: scale(1.3);
                }
                
                .step-dot.completed {
                    background: var(--success);
                }
                
                .step-title {
                    text-align: center;
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }
                
                .step-description {
                    text-align: center;
                    font-size: 14px;
                    color: var(--text-secondary);
                }
                
                .form-body {
                    padding: 32px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .form-step {
                    display: none;
                }
                
                .form-step.active {
                    display: block;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
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
                
                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 8px;
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
                    justify-content: space-between;
                }
                
                .footer-left,
                .footer-right {
                    display: flex;
                    gap: 12px;
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
                        
                        <!-- Multi-Step Form -->
                        <div id="formView" class="view-container">
                            <div class="seo-form-container">
                                <div class="form-header">
                                    <h2 class="form-title" id="formTitle">Product SEO Setup</h2>
                                    <button class="form-close" id="closeForm">×</button>
                                </div>
                                
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progressFill" style="width: 16.67%"></div>
                                </div>
                                
                                <div class="step-indicator">
                                    <div class="step-dots" id="stepDots">
                                        <div class="step-dot active"></div>
                                        <div class="step-dot"></div>
                                        <div class="step-dot"></div>
                                        <div class="step-dot"></div>
                                        <div class="step-dot"></div>
                                        <div class="step-dot"></div>
                                    </div>
                                    <h3 class="step-title" id="stepTitle">Basic SEO Information</h3>
                                    <p class="step-description" id="stepDescription">Page title, description, and core identifiers</p>
                                </div>
                                
                                <div class="form-body" id="formBody">
                                    <!-- Steps will be dynamically inserted here -->
                                </div>
                                
                                <div class="form-footer">
                                    <div class="footer-left">
                                        <button class="btn btn-secondary" id="prevStep" style="display: none;">← Previous</button>
                                    </div>
                                    <div class="footer-right">
                                        <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                                        <button class="btn btn-primary" id="nextStep">Next →</button>
                                        <button class="btn btn-success" id="saveBtn" style="display: none;">Save SEO Data</button>
                                    </div>
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
        
        // Form navigation
        this._shadow.getElementById('closeForm').addEventListener('click', () => {
            this._hideForm();
        });
        
        this._shadow.getElementById('cancelBtn').addEventListener('click', () => {
            this._hideForm();
        });
        
        this._shadow.getElementById('prevStep').addEventListener('click', () => {
            this._previousStep();
        });
        
        this._shadow.getElementById('nextStep').addEventListener('click', () => {
            this._nextStep();
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
            
            card._productData = product;
            card._seoData = seoItem;
            
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
    console.log('🔷 Dashboard: isEdit:', isEdit);
    
    this._selectedProduct = product;
    this._editMode = isEdit;
    this._showingForm = true;
    this._currentStep = 1;
    this._reviews = [];
    this._faqs = [];
    
    const formTitle = this._shadow.getElementById('formTitle');
    formTitle.textContent = isEdit ? 'Edit Product SEO' : 'Setup Product SEO';
    
    console.log('🔷 Dashboard: Initializing form data...');
    
    // Initialize form data
    this._formData = {
        // Step 1: Basic SEO
        productName: product.name,
        description: '',
        metaKeywords: '',
        canonicalUrl: '',
        
        // Step 2: Product Schema
        sku: '',
        mpn: '',
        gtin: '',
        isbn: '',
        brandName: '',
        imageUrls: [],
        
        // Step 3: Pricing & Offers
        price: '',
        priceCurrency: 'USD',
        priceValidUntil: '',
        availability: '',
        itemCondition: '',
        offerUrl: '',
        
        // Step 4: Merchant Listing
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
        
        // Step 5: Reviews & Ratings
        aggregateRatingValue: '',
        reviewCount: '',
        bestRating: '5',
        worstRating: '1',
        
        // Step 6: Advanced
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        twitterCard: 'summary_large_image',
        robotsContent: 'index, follow'
    };
    
    console.log('🔷 Dashboard: Checking for existing SEO data...');
    
    // Populate from existing data
    if (seoData && seoData.seoData) {
        try {
            console.log('🔷 Dashboard: Parsing existing SEO data...');
            const data = typeof seoData.seoData === 'string' 
                ? JSON.parse(seoData.seoData) 
                : seoData.seoData;
            
            console.log('🔷 Dashboard: Existing data:', data);
            Object.assign(this._formData, data);
            
            if (data.reviews) {
                this._reviews = data.reviews;
                console.log('🔷 Dashboard: Loaded', this._reviews.length, 'reviews');
            }
            if (data.faqs) {
                this._faqs = data.faqs;
                console.log('🔷 Dashboard: Loaded', this._faqs.length, 'FAQs');
            }
        } catch (e) {
            console.error('🔷 Dashboard: Error parsing SEO data:', e);
        }
    }
    
    console.log('🔷 Dashboard: Rendering form steps...');
    
    // Render all form steps
    try {
        this._renderFormSteps();
        console.log('🔷 Dashboard: Form steps rendered successfully');
    } catch (e) {
        console.error('🔷 Dashboard: Error rendering form steps:', e);
        console.error('🔷 Dashboard: Error stack:', e.stack);
        return;
    }
    
    console.log('🔷 Dashboard: Switching to form view...');
    
    // Show form view
    const productsView = this._shadow.getElementById('productsView');
    const formView = this._shadow.getElementById('formView');
    
    if (!productsView || !formView) {
        console.error('🔷 Dashboard: Cannot find view elements!');
        return;
    }
    
    productsView.classList.remove('active');
    formView.classList.add('active');
    
    console.log('🔷 Dashboard: Form view is now active');
    
    // Show first step
    try {
        this._updateStepDisplay();
        console.log('🔷 Dashboard: Step display updated');
    } catch (e) {
        console.error('🔷 Dashboard: Error updating step display:', e);
    }
    
    console.log('🔷 Dashboard: ✅ Form shown successfully');
}
    
   _renderFormSteps() {
    console.log('🔷 Dashboard: _renderFormSteps called');
    
    const formBody = this._shadow.getElementById('formBody');
    
    if (!formBody) {
        console.error('🔷 Dashboard: ❌ formBody element not found!');
        return;
    }
    
    console.log('🔷 Dashboard: Clearing form body...');
    formBody.innerHTML = '';
    
    try {
        console.log('🔷 Dashboard: Creating step 1...');
        const step1 = this._createStep1();
        formBody.appendChild(step1);
        console.log('🔷 Dashboard: ✅ Step 1 added');
        
        console.log('🔷 Dashboard: Creating step 2...');
        const step2 = this._createStep2();
        formBody.appendChild(step2);
        console.log('🔷 Dashboard: ✅ Step 2 added');
        
        console.log('🔷 Dashboard: Creating step 3...');
        const step3 = this._createStep3();
        formBody.appendChild(step3);
        console.log('🔷 Dashboard: ✅ Step 3 added');
        
        console.log('🔷 Dashboard: Creating step 4...');
        const step4 = this._createStep4();
        formBody.appendChild(step4);
        console.log('🔷 Dashboard: ✅ Step 4 added');
        
        console.log('🔷 Dashboard: Creating step 5...');
        const step5 = this._createStep5();
        formBody.appendChild(step5);
        console.log('🔷 Dashboard: ✅ Step 5 added');
        
        console.log('🔷 Dashboard: Creating step 6...');
        const step6 = this._createStep6();
        formBody.appendChild(step6);
        console.log('🔷 Dashboard: ✅ Step 6 added');
        
        console.log('🔷 Dashboard: All steps created successfully');
    } catch (e) {
        console.error('🔷 Dashboard: ❌ Error creating steps:', e);
        console.error('🔷 Dashboard: Error message:', e.message);
        console.error('🔷 Dashboard: Error stack:', e.stack);
        throw e;
    }
}
    
    _createStep1() {
        const step = document.createElement('div');
        step.className = 'form-step active';
        step.id = 'step1';
        
        step.innerHTML = `
            <div class="info-box">
                <div class="info-box-title">📋 About Basic SEO</div>
                <div class="info-box-text">
                    This section controls how your product appears in search results. The title and description are crucial 
                    for both search engines and users. Keep descriptions under 160 characters for best results.
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">📝 Meta Information</div>
                
                <div class="form-group">
                    <label class="form-label required">Product Name (Title Tag)</label>
                    <input type="text" class="form-input" id="productName" maxlength="60">
                    <div class="help-text">
                        <strong>What it is:</strong> The main title shown in search results and browser tabs.<br>
                        <strong>Best practice:</strong> Keep under 60 characters. Include main keyword at the beginning.<br>
                        <strong>Example:</strong> "Wireless Noise-Canceling Headphones - Premium Audio"
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Meta Description</label>
                    <textarea class="form-textarea" id="description" maxlength="160" rows="3"></textarea>
                    <div class="help-text">
                        <strong>What it is:</strong> The summary text shown below your title in search results.<br>
                        <strong>Best practice:</strong> 150-160 characters. Include a call-to-action and main benefits.<br>
                        <strong>Example:</strong> "Experience superior sound quality with 30-hour battery life. Active noise cancellation blocks out distractions. Free shipping on orders over $50."
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Meta Keywords <span class="form-label-badge">Optional</span></label>
                    <input type="text" class="form-input" id="metaKeywords" placeholder="wireless headphones, noise canceling, bluetooth">
                    <div class="help-text">
                        <strong>What it is:</strong> Comma-separated keywords related to your product.<br>
                        <strong>Note:</strong> Google doesn't use this for ranking, but some other search engines might.<br>
                        <strong>Can leave empty:</strong> Yes, this is completely optional.
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Canonical URL <span class="form-label-badge">Optional</span></label>
                    <input type="url" class="form-input" id="canonicalUrl" placeholder="https://yourstore.com/products/headphones">
                    <div class="help-text">
                        <strong>What it is:</strong> The preferred URL for this product (prevents duplicate content issues).<br>
                        <strong>When to use:</strong> If this product appears on multiple URLs, specify the main one here.<br>
                        <strong>Can leave empty:</strong> Yes, Wix will auto-generate this if left blank.
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">🤖 Robots Meta Tag</div>
                
                <div class="form-group">
                    <label class="form-label">Robots Directive</label>
                    <select class="form-select" id="robotsContent">
                        <option value="index, follow">Index & Follow (Recommended) - Allow search engines to index and follow links</option>
                        <option value="index, nofollow">Index but Don't Follow - Index page but don't follow links</option>
                        <option value="noindex, follow">Don't Index but Follow - Don't show in search but follow links</option>
                        <option value="noindex, nofollow">Don't Index or Follow - Completely hide from search engines</option>
                        <option value="index, follow, max-snippet:160">Index with Snippet Limit - Limit description length to 160 chars</option>
                        <option value="index, follow, noarchive">Index but No Cache - Don't show cached version in search</option>
                    </select>
                    <div class="help-text">
                        <strong>What it is:</strong> Instructions to search engine crawlers about how to treat this page.<br>
                        <strong>Best practice:</strong> Use "Index & Follow" for products you want to rank in search.<br>
                        <strong>Default:</strong> "Index & Follow" is recommended for all products.
                    </div>
                </div>
            </div>
        `;
        
        // Set values
        this._shadow.getElementById('productName').value = this._formData.productName || '';
        this._shadow.getElementById('description').value = this._formData.description || '';
        this._shadow.getElementById('metaKeywords').value = this._formData.metaKeywords || '';
        this._shadow.getElementById('canonicalUrl').value = this._formData.canonicalUrl || '';
        this._shadow.getElementById('robotsContent').value = this._formData.robotsContent || 'index, follow';
        
        return step;
    }
    
    _createStep2() {
        const step = document.createElement('div');
        step.className = 'form-step';
        step.id = 'step2';
        
        step.innerHTML = `
            <div class="info-box">
                <div class="info-box-title">🏷️ About Product Schema</div>
                <div class="info-box-text">
                    Product identifiers help Google understand exactly what product you're selling. While most fields are optional,
                    providing more data (especially GTIN, SKU, or MPN) significantly improves your chances of appearing in rich results
                    and Google Shopping.
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">🔢 Product Identifiers</div>
                
                <div class="form-row-3">
                    <div class="form-group">
                        <label class="form-label">SKU <span class="form-label-badge">Recommended</span></label>
                        <input type="text" class="form-input" id="sku" placeholder="PROD-12345">
                        <div class="help-text">
                            <strong>What it is:</strong> Your internal product code (Stock Keeping Unit).<br>
                            <strong>Example:</strong> "HDN-WL-BLK-001"
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">MPN <span class="form-label-badge">Recommended</span></label>
                        <input type="text" class="form-input" id="mpn" placeholder="MFR123456">
                        <div class="help-text">
                            <strong>What it is:</strong> Manufacturer Part Number - the manufacturer's unique code.<br>
                            <strong>Example:</strong> "WH-1000XM4"
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">GTIN <span class="form-label-badge">Highly Recommended</span></label>
                        <input type="text" class="form-input" id="gtin" placeholder="00012345678905">
                        <div class="help-text">
                            <strong>What it is:</strong> Global Trade Item Number (UPC, EAN, or ISBN).<br>
                            <strong>Example:</strong> "00012345678905" (14 digits)
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">ISBN <span class="form-label-badge">For Books Only</span></label>
                    <input type="text" class="form-input" id="isbn" placeholder="978-3-16-148410-0">
                    <div class="help-text">
                        <strong>What it is:</strong> International Standard Book Number - use only if selling books.<br>
                        <strong>Format:</strong> Can be 10 or 13 digits (with or without hyphens).<br>
                        <strong>Can leave empty:</strong> Yes, unless you're selling books.
                    </div>
                </div>
                
                <div class="warning-box">
                    <div class="warning-box-title">⚠️ Important: Product Identifiers</div>
                    <div class="warning-box-text">
                        At least ONE of these identifiers (GTIN, MPN, or Brand) is required for Google Shopping and Merchant Listings.
                        Having all three greatly increases your product's visibility. GTIN is the most important.
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">🏢 Brand Information</div>
                
                <div class="form-group">
                    <label class="form-label">Brand Name <span class="form-label-badge">Highly Recommended</span></label>
                    <input type="text" class="form-input" id="brandName" placeholder="Sony">
                    <div class="help-text">
                        <strong>What it is:</strong> The manufacturer or brand name of the product.<br>
                        <strong>Best practice:</strong> Use the official brand name exactly as written.<br>
                        <strong>Examples:</strong> "Sony", "Nike", "Apple", "Samsung"<br>
                        <strong>Required for:</strong> Google Shopping eligibility.
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">🖼️ Product Images</div>
                
                <div class="form-group">
                    <label class="form-label">Image URLs <span class="form-label-badge">Highly Recommended</span></label>
                    <textarea class="form-textarea" id="imageUrls" rows="5" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"></textarea>
                    <div class="help-text">
                        <strong>What it is:</strong> Full URLs to high-quality product images (one per line).<br>
                        <strong>Requirements:</strong>
                        • Minimum 800x800 pixels (1200x1200 recommended)<br>
                        • Format: JPG, PNG, or WebP<br>
                        • White or transparent background preferred<br>
                        • Show the actual product, not illustrations<br>
                        <strong>Best practice:</strong> Add 3-5 images from different angles.
                    </div>
                </div>
            </div>
        `;
        
        this._shadow.getElementById('sku').value = this._formData.sku || '';
        this._shadow.getElementById('mpn').value = this._formData.mpn || '';
        this._shadow.getElementById('gtin').value = this._formData.gtin || '';
        this._shadow.getElementById('isbn').value = this._formData.isbn || '';
        this._shadow.getElementById('brandName').value = this._formData.brandName || '';
        
        if (this._formData.imageUrls && Array.isArray(this._formData.imageUrls)) {
            this._shadow.getElementById('imageUrls').value = this._formData.imageUrls.join('\n');
        }
        
        return step;
    }
    
    _createStep3() {
        const step = document.createElement('div');
        step.className = 'form-step';
        step.id = 'step3';
        
        const currencies = this._getAllCurrencies();
        
        step.innerHTML = `
            <div class="info-box">
                <div class="info-box-title">💰 About Pricing & Offers</div>
                <div class="info-box-text">
                    Pricing information is REQUIRED for rich results. Google needs accurate, current prices to show your products
                    in search results. Make sure to update the "Price Valid Until" date periodically.
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">💵 Price Information</div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Price</label>
                        <input type="number" step="0.01" min="0" class="form-input" id="price" placeholder="99.99">
                        <div class="help-text">
                            <strong>What it is:</strong> The current selling price (numbers only, no currency symbols).<br>
                            <strong>Example:</strong> "99.99" or "1499.00"<br>
                            <strong>Required:</strong> Yes, this is mandatory for rich results.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required">Currency</label>
                        <select class="form-select" id="priceCurrency">
                            ${currencies}
                        </select>
                        <div class="help-text">
                            <strong>What it is:</strong> The currency code for the price (ISO 4217 format).<br>
                            <strong>Required:</strong> Yes, must match the currency you're selling in.
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Price Valid Until <span class="form-label-badge">Recommended</span></label>
                    <input type="date" class="form-input" id="priceValidUntil">
                    <div class="help-text">
                        <strong>What it is:</strong> The date when this price expires (format: YYYY-MM-DD).<br>
                        <strong>Best practice:</strong> Set this at least 30 days in the future and update regularly.<br>
                        <strong>Example:</strong> If today is Jan 1, 2025, set to Feb 1, 2025 or later.<br>
                        <strong>Can leave empty:</strong> Yes, but highly recommended to include.
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Product Page URL <span class="form-label-badge">Optional</span></label>
                    <input type="url" class="form-input" id="offerUrl" placeholder="https://yourstore.com/products/product-name">
                    <div class="help-text">
                        <strong>What it is:</strong> The specific URL where customers can buy this product.<br>
                        <strong>Can leave empty:</strong> Yes, the current page URL will be used automatically.
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">📦 Availability & Condition</div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Availability Status</label>
                        <select class="form-select" id="availability">
                            <option value="">-- Select Availability --</option>
                            <option value="https://schema.org/InStock">In Stock - Available for immediate purchase</option>
                            <option value="https://schema.org/OutOfStock">Out of Stock - Currently unavailable</option>
                            <option value="https://schema.org/PreOrder">Pre-Order - Available for pre-order only</option>
                            <option value="https://schema.org/Discontinued">Discontinued - No longer available</option>
                            <option value="https://schema.org/InStoreOnly">In Store Only - Not available online</option>
                            <option value="https://schema.org/LimitedAvailability">Limited Availability - Low stock</option>
                            <option value="https://schema.org/OnlineOnly">Online Only - Not in physical stores</option>
                            <option value="https://schema.org/SoldOut">Sold Out - Permanently unavailable</option>
                        </select>
                        <div class="help-text">
                            <strong>What it is:</strong> Current stock status of the product.<br>
                            <strong>Required:</strong> Yes, Google needs this to show accurate availability.<br>
                            <strong>Best practice:</strong> Update this whenever stock changes.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Item Condition <span class="form-label-badge">Recommended</span></label>
                        <select class="form-select" id="itemCondition">
                            <option value="">-- Select Condition --</option>
                            <option value="https://schema.org/NewCondition">New - Brand new, unused product</option>
                            <option value="https://schema.org/RefurbishedCondition">Refurbished - Professionally restored to working condition</option>
                            <option value="https://schema.org/UsedCondition">Used - Previously owned/used product</option>
                            <option value="https://schema.org/DamagedCondition">Damaged - Has visible damage or defects</option>
                        </select>
                        <div class="help-text">
                            <strong>What it is:</strong> The physical condition of the product being sold.<br>
                            <strong>Best practice:</strong> Most products should use "New".<br>
                            <strong>Can leave empty:</strong> Yes, but recommended to specify.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this._shadow.getElementById('price').value = this._formData.price || '';
        this._shadow.getElementById('priceCurrency').value = this._formData.priceCurrency || 'USD';
        this._shadow.getElementById('priceValidUntil').value = this._formData.priceValidUntil || '';
        this._shadow.getElementById('offerUrl').value = this._formData.offerUrl || '';
        this._shadow.getElementById('availability').value = this._formData.availability || '';
        this._shadow.getElementById('itemCondition').value = this._formData.itemCondition || '';
        
        return step;
    }
    
    _createStep4() {
        const step = document.createElement('div');
        step.className = 'form-step';
        step.id = 'step4';
        
        const currencies = this._getAllCurrencies();
        const countries = this._getAllCountries();
        
        step.innerHTML = `
            <div class="info-box">
                <div class="info-box-title">🚚 About Merchant Listings</div>
                <div class="info-box-text">
                    This section is REQUIRED if you want to appear in Google Shopping or Merchant Listings. Shipping and return
                    information helps customers make informed decisions and can improve your click-through rate.
                </div>
            </div>
            
            <div class="warning-box">
                <div class="warning-box-title">⚠️ Google Shopping Requirements</div>
                <div class="warning-box-text">
                    If you want your products to appear in Google Shopping (the shopping tab in search results), you MUST complete
                    all shipping and return policy fields. Without this information, your products will only show in regular search results.
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">📦 Shipping Details</div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Shipping Cost <span class="form-label-badge">For Shopping</span></label>
                        <input type="number" step="0.01" min="0" class="form-input" id="shippingCost" placeholder="0.00">
                        <div class="help-text">
                            <strong>What it is:</strong> The shipping fee customers pay (use "0" for free shipping).<br>
                            <strong>Example:</strong> "5.99" or "0" for free shipping<br>
                            <strong>Required for:</strong> Google Shopping eligibility.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Shipping Currency <span class="form-label-badge">For Shopping</span></label>
                        <select class="form-select" id="shippingCurrency">
                            ${currencies}
                        </select>
                        <div class="help-text">
                            <strong>What it is:</strong> Currency for the shipping cost.<br>
                            <strong>Best practice:</strong> Should match your product price currency.
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Shipping Destination <span class="form-label-badge">For Shopping</span></label>
                    <select class="form-select" id="shippingDestination">
                        ${countries}
                    </select>
                    <div class="help-text">
                        <strong>What it is:</strong> The country/region you ship to.<br>
                        <strong>Example:</strong> "US" for United States, "GB" for United Kingdom<br>
                        <strong>Required for:</strong> Google Shopping.
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Handling Time (Days) <span class="form-label-badge">Optional</span></label>
                        <div class="form-row">
                            <input type="number" min="0" class="form-input" id="handlingTimeMin" placeholder="Min: 0">
                            <input type="number" min="0" class="form-input" id="handlingTimeMax" placeholder="Max: 1">
                        </div>
                        <div class="help-text">
                            <strong>What it is:</strong> Time to process and prepare the order before shipping.<br>
                            <strong>Example:</strong> Min: 0, Max: 1 means "ships within 1 business day"
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Delivery Time (Days) <span class="form-label-badge">For Shopping</span></label>
                        <div class="form-row">
                            <input type="number" min="0" class="form-input" id="deliveryTimeMin" placeholder="Min: 2">
                            <input type="number" min="0" class="form-input" id="deliveryTimeMax" placeholder="Max: 5">
                        </div>
                        <div class="help-text">
                            <strong>What it is:</strong> Transit time for shipping carrier to deliver.<br>
                            <strong>Example:</strong> Min: 2, Max: 5 means "delivery in 2-5 business days"<br>
                            <strong>Required for:</strong> Google Shopping.
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">↩️ Return Policy</div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Return Window (Days) <span class="form-label-badge">For Shopping</span></label>
                        <input type="number" min="0" class="form-input" id="returnDays" placeholder="30">
                        <div class="help-text">
                            <strong>What it is:</strong> How many days customers have to return the product.<br>
                            <strong>Example:</strong> "30" for a 30-day return window<br>
                            <strong>Required for:</strong> Google Shopping.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Return Policy Country <span class="form-label-badge">For Shopping</span></label>
                        <select class="form-select" id="returnCountry">
                            ${countries}
                        </select>
                        <div class="help-text">
                            <strong>What it is:</strong> The country where your return policy applies.
                        </div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Return Method <span class="form-label-badge">Optional</span></label>
                        <select class="form-select" id="returnMethod">
                            <option value="">-- Select Return Method --</option>
                            <option value="https://schema.org/ReturnByMail">Return by Mail - Ship it back</option>
                            <option value="https://schema.org/ReturnInStore">Return in Store - Return to physical location</option>
                            <option value="https://schema.org/ReturnAtKiosk">Return at Kiosk - Drop off at kiosk</option>
                        </select>
                        <div class="help-text">
                            <strong>What it is:</strong> How customers can return products.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Return Fees <span class="form-label-badge">Optional</span></label>
                        <select class="form-select" id="returnFees">
                            <option value="">-- Select Return Fees --</option>
                            <option value="https://schema.org/FreeReturn">Free Return - No charge for returns</option>
                            <option value="https://schema.org/ReturnShippingFees">Customer Pays Shipping - Customer pays return shipping</option>
                            <option value="https://schema.org/RestockingFees">Restocking Fee - Deducted from refund</option>
                        </select>
                        <div class="help-text">
                            <strong>What it is:</strong> Who pays for return shipping.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this._shadow.getElementById('shippingCost').value = this._formData.shippingCost || '';
        this._shadow.getElementById('shippingCurrency').value = this._formData.shippingCurrency || 'USD';
        this._shadow.getElementById('shippingDestination').value = this._formData.shippingDestination || '';
        this._shadow.getElementById('handlingTimeMin').value = this._formData.handlingTimeMin || '';
        this._shadow.getElementById('handlingTimeMax').value = this._formData.handlingTimeMax || '';
        this._shadow.getElementById('deliveryTimeMin').value = this._formData.deliveryTimeMin || '';
        this._shadow.getElementById('deliveryTimeMax').value = this._formData.deliveryTimeMax || '';
        this._shadow.getElementById('returnDays').value = this._formData.returnDays || '';
        this._shadow.getElementById('returnCountry').value = this._formData.returnCountry || '';
        this._shadow.getElementById('returnMethod').value = this._formData.returnMethod || '';
        this._shadow.getElementById('returnFees').value = this._formData.returnFees || '';
        
        return step;
    }
    
    _createStep5() {
    console.log('🔷 Dashboard: Creating step 5...');
    
    const step = document.createElement('div');
    step.className = 'form-step';
    step.id = 'step5';
    
    step.innerHTML = `
        <div class="info-box">
            <div class="info-box-title">⭐ About Reviews & Ratings</div>
            <div class="info-box-text">
                Star ratings can dramatically increase click-through rates in search results. Products with reviews get 
                12-15% more clicks on average. However, reviews MUST be genuine and from real customers.
            </div>
        </div>
        
        <div class="warning-box">
            <div class="warning-box-title">⚠️ Critical: Fake Reviews Are Prohibited</div>
            <div class="warning-box-text">
                <strong>DO NOT create fake reviews!</strong> Google has sophisticated systems to detect fake reviews.
                Violations can result in:<br>
                • Manual penalties and ranking drops<br>
                • Removal from Google Shopping<br>
                • Permanent ban from rich results<br>
                <br>
                <strong>Only add reviews if:</strong><br>
                ✓ They are from real customers who purchased the product<br>
                ✓ You can verify them with order records<br>
                ✓ They accurately represent customer sentiment<br>
                <br>
                When in doubt, don't add reviews manually - use a verified review platform like Trustpilot, Yotpo, or Google Customer Reviews instead.
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-title">📊 Aggregate Rating</div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Average Rating <span class="form-label-badge">Optional</span></label>
                    <input type="number" step="0.1" min="0" max="5" class="form-input" id="aggregateRatingValue" placeholder="4.5">
                    <div class="help-text">
                        <strong>What it is:</strong> The average rating across all reviews (0 to 5 stars).<br>
                        <strong>Example:</strong> "4.5" for 4.5 out of 5 stars<br>
                        <strong>Best practice:</strong> Must match your actual review platform data.
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Total Review Count <span class="form-label-badge">Optional</span></label>
                    <input type="number" min="0" class="form-input" id="reviewCount" placeholder="89">
                    <div class="help-text">
                        <strong>What it is:</strong> Total number of reviews received.<br>
                        <strong>Example:</strong> "89" if you have 89 reviews<br>
                        <strong>Minimum:</strong> Need at least 1 review for stars to show.
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Best Rating <span class="form-label-badge">Optional</span></label>
                    <input type="number" min="1" class="form-input" id="bestRating" value="5" readonly>
                    <div class="help-text">
                        <strong>What it is:</strong> Highest possible rating (usually 5).<br>
                        <strong>Default:</strong> 5 stars (standard rating scale).
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Worst Rating <span class="form-label-badge">Optional</span></label>
                    <input type="number" min="1" class="form-input" id="worstRating" value="1" readonly>
                    <div class="help-text">
                        <strong>What it is:</strong> Lowest possible rating (usually 1).<br>
                        <strong>Default:</strong> 1 star (standard rating scale).
                    </div>
                </div>
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-title">💬 Individual Reviews</div>
            
            <div id="reviewsList" class="dynamic-list">
                <!-- Reviews will be added here -->
            </div>
            
            <button type="button" class="btn-add" id="addReview">
                + Add Review
            </button>
        </div>
    `;
    
    try {
        console.log('🔷 Dashboard: Setting step 5 form values...');
        
        // Use setTimeout to ensure elements are in DOM before setting values
        setTimeout(() => {
            const aggregateRatingValue = this._shadow.getElementById('aggregateRatingValue');
            const reviewCount = this._shadow.getElementById('reviewCount');
            const bestRating = this._shadow.getElementById('bestRating');
            const worstRating = this._shadow.getElementById('worstRating');
            
            if (aggregateRatingValue) aggregateRatingValue.value = this._formData.aggregateRatingValue || '';
            if (reviewCount) reviewCount.value = this._formData.reviewCount || '';
            if (bestRating) bestRating.value = this._formData.bestRating || '5';
            if (worstRating) worstRating.value = this._formData.worstRating || '1';
            
            console.log('🔷 Dashboard: Step 5 values set');
            
            // Render existing reviews
            this._renderReviews();
            
            // Add review button listener
            const addReviewBtn = this._shadow.getElementById('addReview');
            if (addReviewBtn) {
                addReviewBtn.addEventListener('click', () => {
                    console.log('🔷 Dashboard: Add review clicked');
                    this._addReview();
                });
            }
        }, 0);
        
    } catch (e) {
        console.error('🔷 Dashboard: Error setting up step 5:', e);
    }
    
    return step;
}
    
    _createStep6() {
    console.log('🔷 Dashboard: Creating step 6...');
    
    const step = document.createElement('div');
    step.className = 'form-step';
    step.id = 'step6';
    
    step.innerHTML = `
        <div class="info-box">
            <div class="info-box-title">❓ About FAQ Schema</div>
            <div class="info-box-text">
                FAQ schema can get your product featured with expandable question/answer sections directly in search results.
                This can significantly increase visibility and click-through rates.
            </div>
        </div>
        
        <div class="warning-box">
            <div class="warning-box-title">⚠️ Important: FAQ Best Practices</div>
            <div class="warning-box-text">
                <strong>Only add FAQs if they actually exist on your product page!</strong><br>
                <br>
                ✓ FAQs must be visible to users on the page<br>
                ✓ Questions should be genuine customer questions<br>
                ✓ Answers should be factual and helpful<br>
                ✓ Don't use FAQs for advertising or promotional content<br>
                ✓ Minimum 2 Q&A pairs recommended<br>
                <br>
                <strong>Violations can result in manual penalties.</strong>
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-title">❓ Frequently Asked Questions</div>
            
            <div id="faqsList" class="dynamic-list">
                <!-- FAQs will be added here -->
            </div>
            
            <button type="button" class="btn-add" id="addFaq">
                + Add FAQ
            </button>
        </div>
        
        <div class="form-section">
            <div class="section-title">🌐 Social Media / Open Graph</div>
            
            <div class="form-group">
                <label class="form-label">Open Graph Title <span class="form-label-badge">Optional</span></label>
                <input type="text" class="form-input" id="ogTitle" maxlength="60">
                <div class="help-text">
                    <strong>What it is:</strong> Title shown when shared on Facebook, LinkedIn, etc.<br>
                    <strong>Can leave empty:</strong> Yes, will use page title if empty.
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Open Graph Description <span class="form-label-badge">Optional</span></label>
                <textarea class="form-textarea" id="ogDescription" maxlength="200" rows="3"></textarea>
                <div class="help-text">
                    <strong>What it is:</strong> Description shown when shared on social media.<br>
                    <strong>Can leave empty:</strong> Yes, will use meta description if empty.
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Open Graph Image <span class="form-label-badge">Optional</span></label>
                <input type="url" class="form-input" id="ogImage" placeholder="https://example.com/product-image.jpg">
                <div class="help-text">
                    <strong>What it is:</strong> Image shown in social media previews.<br>
                    <strong>Recommended size:</strong> 1200x630 pixels<br>
                    <strong>Can leave empty:</strong> Yes, will use first product image.
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Twitter Card Type <span class="form-label-badge">Optional</span></label>
                <select class="form-select" id="twitterCard">
                    <option value="summary">Summary - Small image card</option>
                    <option value="summary_large_image">Summary Large Image - Large image card (Recommended)</option>
                    <option value="product">Product - Product-specific card</option>
                </select>
                <div class="help-text">
                    <strong>What it is:</strong> How your product appears when shared on Twitter/X.<br>
                    <strong>Best practice:</strong> Use "Summary Large Image" for products.
                </div>
            </div>
        </div>
    `;
    
    try {
        console.log('🔷 Dashboard: Setting step 6 form values...');
        
        setTimeout(() => {
            const ogTitle = this._shadow.getElementById('ogTitle');
            const ogDescription = this._shadow.getElementById('ogDescription');
            const ogImage = this._shadow.getElementById('ogImage');
            const twitterCard = this._shadow.getElementById('twitterCard');
            
            if (ogTitle) ogTitle.value = this._formData.ogTitle || '';
            if (ogDescription) ogDescription.value = this._formData.ogDescription || '';
            if (ogImage) ogImage.value = this._formData.ogImage || '';
            if (twitterCard) twitterCard.value = this._formData.twitterCard || 'summary_large_image';
            
            console.log('🔷 Dashboard: Step 6 values set');
            
            // Render existing FAQs
            this._renderFaqs();
            
            // Add FAQ button listener
            const addFaqBtn = this._shadow.getElementById('addFaq');
            if (addFaqBtn) {
                addFaqBtn.addEventListener('click', () => {
                    console.log('🔷 Dashboard: Add FAQ clicked');
                    this._addFaq();
                });
            }
        }, 0);
        
    } catch (e) {
        console.error('🔷 Dashboard: Error setting up step 6:', e);
    }
    
    return step;
}
    
    _renderReviews() {
        const reviewsList = this._shadow.getElementById('reviewsList');
        reviewsList.innerHTML = '';
        
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
        faqsList.innerHTML = '';
        
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
    
    _updateStepDisplay() {
        const steps = this._shadow.querySelectorAll('.form-step');
        const dots = this._shadow.querySelectorAll('.step-dot');
        const prevBtn = this._shadow.getElementById('prevStep');
        const nextBtn = this._shadow.getElementById('nextStep');
        const saveBtn = this._shadow.getElementById('saveBtn');
        const progressFill = this._shadow.getElementById('progressFill');
        const stepTitle = this._shadow.getElementById('stepTitle');
        const stepDescription = this._shadow.getElementById('stepDescription');
        
        // Hide all steps
        steps.forEach(step => step.classList.remove('active'));
        
        // Show current step
        const currentStepEl = this._shadow.getElementById(`step${this._currentStep}`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index + 1 < this._currentStep) {
                dot.classList.add('completed');
            } else if (index + 1 === this._currentStep) {
                dot.classList.add('active');
            }
        });
        
        // Update progress bar
        const progress = (this._currentStep / this._totalSteps) * 100;
        progressFill.style.width = progress + '%';
        
        // Update step title and description
        const stepInfo = {
            1: { title: 'Basic SEO Information', description: 'Page title, description, and core meta tags' },
            2: { title: 'Product Schema', description: 'Identifiers, brand, and product images' },
            3: { title: 'Pricing & Offers', description: 'Price, currency, availability, and condition' },
            4: { title: 'Merchant Listing', description: 'Shipping and return policy information' },
            5: { title: 'Reviews & Ratings', description: 'Customer reviews and aggregate ratings' },
            6: { title: 'FAQ & Advanced', description: 'FAQ schema and social media tags' }
        };
        
        stepTitle.textContent = stepInfo[this._currentStep].title;
        stepDescription.textContent = stepInfo[this._currentStep].description;
        
        // Show/hide buttons
        prevBtn.style.display = this._currentStep === 1 ? 'none' : 'inline-flex';
        nextBtn.style.display = this._currentStep === this._totalSteps ? 'none' : 'inline-flex';
        saveBtn.style.display = this._currentStep === this._totalSteps ? 'inline-flex' : 'none';
        
        // Scroll to top
        this._shadow.getElementById('formBody').scrollTop = 0;
    }
    
    _previousStep() {
        if (this._currentStep > 1) {
            this._collectCurrentStepData();
            this._currentStep--;
            this._updateStepDisplay();
        }
    }
    
    _nextStep() {
        if (this._currentStep < this._totalSteps) {
            if (this._validateCurrentStep()) {
                this._collectCurrentStepData();
                this._currentStep++;
                this._updateStepDisplay();
            }
        }
    }
    
    _validateCurrentStep() {
        // Step 1 validation
        if (this._currentStep === 1) {
            const productName = this._shadow.getElementById('productName').value.trim();
            const description = this._shadow.getElementById('description').value.trim();
            
            if (!productName) {
                alert('Please enter a product name');
                return false;
            }
            
            if (!description) {
                alert('Please enter a meta description');
                return false;
            }
        }
        
        // Step 3 validation
        if (this._currentStep === 3) {
            const price = this._shadow.getElementById('price').value.trim();
            const priceCurrency = this._shadow.getElementById('priceCurrency').value;
            const availability = this._shadow.getElementById('availability').value;
            
            if (!price) {
                alert('Please enter a price');
                return false;
            }
            
            if (!priceCurrency) {
                alert('Please select a currency');
                return false;
            }
            
            if (!availability) {
                alert('Please select availability status');
                return false;
            }
        }
        
        return true;
    }
    
    _collectCurrentStepData() {
        if (this._currentStep === 1) {
            this._formData.productName = this._shadow.getElementById('productName').value.trim();
            this._formData.description = this._shadow.getElementById('description').value.trim();
            this._formData.metaKeywords = this._shadow.getElementById('metaKeywords').value.trim();
            this._formData.canonicalUrl = this._shadow.getElementById('canonicalUrl').value.trim();
            this._formData.robotsContent = this._shadow.getElementById('robotsContent').value;
        }
        
        if (this._currentStep === 2) {
            this._formData.sku = this._shadow.getElementById('sku').value.trim();
            this._formData.mpn = this._shadow.getElementById('mpn').value.trim();
            this._formData.gtin = this._shadow.getElementById('gtin').value.trim();
            this._formData.isbn = this._shadow.getElementById('isbn').value.trim();
            this._formData.brandName = this._shadow.getElementById('brandName').value.trim();
            
            const imageUrlsText = this._shadow.getElementById('imageUrls').value.trim();
            this._formData.imageUrls = imageUrlsText ? imageUrlsText.split('\n').map(url => url.trim()).filter(url => url) : [];
        }
        
        if (this._currentStep === 3) {
            this._formData.price = this._shadow.getElementById('price').value.trim();
            this._formData.priceCurrency = this._shadow.getElementById('priceCurrency').value;
            this._formData.priceValidUntil = this._shadow.getElementById('priceValidUntil').value;
            this._formData.offerUrl = this._shadow.getElementById('offerUrl').value.trim();
            this._formData.availability = this._shadow.getElementById('availability').value;
            this._formData.itemCondition = this._shadow.getElementById('itemCondition').value;
        }
        
        if (this._currentStep === 4) {
            this._formData.shippingCost = this._shadow.getElementById('shippingCost').value.trim();
            this._formData.shippingCurrency = this._shadow.getElementById('shippingCurrency').value;
            this._formData.shippingDestination = this._shadow.getElementById('shippingDestination').value;
            this._formData.handlingTimeMin = this._shadow.getElementById('handlingTimeMin').value.trim();
            this._formData.handlingTimeMax = this._shadow.getElementById('handlingTimeMax').value.trim();
            this._formData.deliveryTimeMin = this._shadow.getElementById('deliveryTimeMin').value.trim();
            this._formData.deliveryTimeMax = this._shadow.getElementById('deliveryTimeMax').value.trim();
            this._formData.returnDays = this._shadow.getElementById('returnDays').value.trim();
            this._formData.returnCountry = this._shadow.getElementById('returnCountry').value;
            this._formData.returnMethod = this._shadow.getElementById('returnMethod').value;
            this._formData.returnFees = this._shadow.getElementById('returnFees').value;
        }
        
        if (this._currentStep === 5) {
            this._formData.aggregateRatingValue = this._shadow.getElementById('aggregateRatingValue').value.trim();
            this._formData.reviewCount = this._shadow.getElementById('reviewCount').value.trim();
            this._formData.bestRating = this._shadow.getElementById('bestRating').value.trim();
            this._formData.worstRating = this._shadow.getElementById('worstRating').value.trim();
        }
        
        if (this._currentStep === 6) {
            this._formData.ogTitle = this._shadow.getElementById('ogTitle').value.trim();
            this._formData.ogDescription = this._shadow.getElementById('ogDescription').value.trim();
            this._formData.ogImage = this._shadow.getElementById('ogImage').value.trim();
            this._formData.twitterCard = this._shadow.getElementById('twitterCard').value;
        }
    }
    
    _handleSave() {
        console.log('🔷 Dashboard: Handling save');
        
        // Collect final step data
        this._collectCurrentStepData();
        
        // Add reviews and FAQs to form data
        this._formData.reviews = this._reviews;
        this._formData.faqs = this._faqs;
        
        const existingSEO = this._seoItems.find(item => 
            item.productId === this._selectedProduct.id || item.title === this._selectedProduct.name
        );
        
        this._dispatchEvent('save-seo', {
            product: this._selectedProduct,
            seoData: this._formData,
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
        this._currentStep = 1;
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
