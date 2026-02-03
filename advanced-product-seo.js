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
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                :host {
                    --primary-color: #0070f3;
                    --success-color: #10b981;
                    --warning-color: #f59e0b;
                    --error-color: #ef4444;
                    --bg-primary: #ffffff;
                    --bg-secondary: #f9fafb;
                    --bg-tertiary: #f3f4f6;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --text-tertiary: #9ca3af;
                    --border-color: #e5e7eb;
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
                    background: linear-gradient(135deg, var(--primary-color), #0056b3);
                    color: white;
                    padding: 24px 32px;
                    box-shadow: var(--shadow-md);
                }
                
                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .dashboard-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                
                .dashboard-subtitle {
                    font-size: 14px;
                    opacity: 0.9;
                    line-height: 1.6;
                }
                
                .stats-bar {
                    display: flex;
                    gap: 24px;
                    margin-top: 16px;
                    flex-wrap: wrap;
                }
                
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.15);
                    padding: 8px 16px;
                    border-radius: 8px;
                }
                
                .stat-label {
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                }
                
                .main-content {
                    flex: 1;
                    padding: 24px;
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
                
                /* Products Grid View */
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 24px;
                }
                
                .product-card {
                    background: var(--bg-primary);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-card:hover {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-4px);
                }
                
                .product-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    background: var(--bg-tertiary);
                }
                
                .product-info {
                    padding: 16px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .product-price {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--primary-color);
                    margin-bottom: 12px;
                }
                
                .price-compare {
                    font-size: 14px;
                    color: var(--text-tertiary);
                    text-decoration: line-through;
                    margin-left: 8px;
                }
                
                .product-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: auto;
                }
                
                .btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-family: inherit;
                    text-align: center;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .btn:active {
                    transform: translateY(0);
                }
                
                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                }
                
                .btn-success {
                    background: var(--success-color);
                    color: white;
                }
                
                .btn-warning {
                    background: var(--warning-color);
                    color: white;
                }
                
                .btn-danger {
                    background: var(--error-color);
                    color: white;
                }
                
                .btn-secondary {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }
                
                .btn svg {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }
                
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }
                
                .seo-status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }
                
                .seo-status-active {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .seo-status-none {
                    background: #fee2e2;
                    color: #991b1b;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 8px;
                }
                
                /* SEO Form View */
                .seo-form-container {
                    background: var(--bg-primary);
                    border-radius: 12px;
                    box-shadow: var(--shadow-md);
                    overflow: hidden;
                }
                
                .form-header {
                    background: linear-gradient(135deg, var(--primary-color), #0056b3);
                    color: white;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .form-title {
                    font-size: 20px;
                    font-weight: 700;
                }
                
                .form-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: background 0.2s;
                }
                
                .form-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .form-body {
                    padding: 24px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--text-primary);
                }
                
                .form-label.required::after {
                    content: '*';
                    color: var(--error-color);
                    margin-left: 4px;
                }
                
                .form-input,
                .form-textarea,
                .form-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .form-input:focus,
                .form-textarea:focus,
                .form-select:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
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
                
                .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 24px 0 16px 0;
                    padding-bottom: 8px;
                    border-bottom: 2px solid var(--border-color);
                }
                
                .section-title:first-child {
                    margin-top: 0;
                }
                
                .help-text {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-top: 4px;
                }
                
                .form-footer {
                    padding: 16px 24px;
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .loading-container {
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    min-height: 400px;
                }
                
                .loading-container.active {
                    display: flex;
                }
                
                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid var(--border-color);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .loading-text {
                    margin-top: 16px;
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    display: none;
                    min-height: 400px;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                }
                
                .empty-state.active {
                    display: flex;
                }
                
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: var(--shadow-lg);
                    display: none;
                    align-items: center;
                    gap: 12px;
                    z-index: 2000;
                    animation: slideIn 0.3s ease;
                    min-width: 300px;
                }
                
                .toast-notification.show {
                    display: flex;
                }
                
                .toast-success {
                    background: #f0fdf4;
                    border-left: 4px solid var(--success-color);
                    color: #166534;
                }
                
                .toast-error {
                    background: #fef2f2;
                    border-left: 4px solid var(--error-color);
                    color: #991b1b;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .pagination {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 24px 0;
                }
                
                .pagination-info {
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .dashboard-header {
                        padding: 16px 20px;
                    }
                    
                    .dashboard-title {
                        font-size: 22px;
                    }
                    
                    .main-content {
                        padding: 16px;
                    }
                    
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        gap: 16px;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                    }
                }
                
                /* Scrollbar styling */
                .form-body::-webkit-scrollbar {
                    width: 8px;
                }
                
                .form-body::-webkit-scrollbar-track {
                    background: var(--bg-secondary);
                }
                
                .form-body::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 4px;
                }
            </style>
            
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div class="header-content">
                        <h1 class="dashboard-title">Product SEO Management</h1>
                        <p class="dashboard-subtitle">
                            Manage structured data and rich snippets for your products
                        </p>
                        <div class="stats-bar">
                            <div class="stat-item">
                                <span class="stat-label">Total Products:</span>
                                <span class="stat-value" id="totalProducts">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">SEO Configured:</span>
                                <span class="stat-value" id="seoConfigured">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Needs Setup:</span>
                                <span class="stat-value" id="needsSetup">0</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="main-content">
                    <div class="content-wrapper">
                        <!-- Loading View -->
                        <div id="loadingContainer" class="loading-container active">
                            <div class="spinner"></div>
                            <div class="loading-text">Loading products...</div>
                        </div>
                        
                        <!-- Products Grid View -->
                        <div id="productsView" class="view-container">
                            <div class="products-grid" id="productsGrid"></div>
                            <div class="pagination" id="pagination" style="display: none;">
                                <button class="btn btn-secondary" id="prevPage" disabled>Previous</button>
                                <span class="pagination-info" id="paginationInfo"></span>
                                <button class="btn btn-secondary" id="nextPage" disabled>Next</button>
                            </div>
                        </div>
                        
                        <!-- SEO Form View -->
                        <div id="formView" class="view-container">
                            <div class="seo-form-container">
                                <div class="form-header">
                                    <h2 class="form-title" id="formTitle">Set Product SEO</h2>
                                    <button class="form-close" id="closeForm">×</button>
                                </div>
                                
                                <div class="form-body">
                                    <h3 class="section-title">Basic Information</h3>
                                    
                                    <div class="form-group">
                                        <label class="form-label required">Product Name</label>
                                        <input type="text" class="form-input" id="productName" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label required">Description</label>
                                        <textarea class="form-textarea" id="description" required></textarea>
                                        <div class="help-text">Detailed product description for search engines</div>
                                    </div>
                                    
                                    <h3 class="section-title">Product Identifiers</h3>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">SKU</label>
                                            <input type="text" class="form-input" id="sku">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">MPN</label>
                                            <input type="text" class="form-input" id="mpn">
                                            <div class="help-text">Manufacturer Part Number</div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">GTIN</label>
                                        <input type="text" class="form-input" id="gtin">
                                        <div class="help-text">UPC, EAN, ISBN, or other GTIN</div>
                                    </div>
                                    
                                    <h3 class="section-title">Brand</h3>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Brand Name</label>
                                        <input type="text" class="form-input" id="brandName">
                                    </div>
                                    
                                    <h3 class="section-title">Images</h3>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Image URLs</label>
                                        <textarea class="form-textarea" id="imageUrls" rows="4"></textarea>
                                        <div class="help-text">Enter one URL per line</div>
                                    </div>
                                    
                                    <h3 class="section-title">Pricing & Availability</h3>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label required">Price</label>
                                            <input type="number" step="0.01" class="form-input" id="price" required>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label required">Currency</label>
                                            <select class="form-select" id="priceCurrency" required>
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                                <option value="GBP">GBP (£)</option>
                                                <option value="INR">INR (₹)</option>
                                                <option value="AUD">AUD (A$)</option>
                                                <option value="CAD">CAD (C$)</option>
                                                <option value="JPY">JPY (¥)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Availability</label>
                                            <select class="form-select" id="availability">
                                                <option value="">Select availability</option>
                                                <option value="https://schema.org/InStock">In Stock</option>
                                                <option value="https://schema.org/OutOfStock">Out of Stock</option>
                                                <option value="https://schema.org/PreOrder">Pre-Order</option>
                                                <option value="https://schema.org/Discontinued">Discontinued</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">Condition</label>
                                            <select class="form-select" id="itemCondition">
                                                <option value="">Select condition</option>
                                                <option value="https://schema.org/NewCondition">New</option>
                                                <option value="https://schema.org/UsedCondition">Used</option>
                                                <option value="https://schema.org/RefurbishedCondition">Refurbished</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <h3 class="section-title">Reviews & Ratings (Optional)</h3>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Average Rating</label>
                                            <input type="number" step="0.1" min="0" max="5" class="form-input" id="aggregateRatingValue">
                                            <div class="help-text">0 to 5 stars</div>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">Review Count</label>
                                            <input type="number" class="form-input" id="reviewCount">
                                        </div>
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Review Author</label>
                                            <input type="text" class="form-input" id="reviewAuthor">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">Review Rating</label>
                                            <input type="number" min="1" max="5" class="form-input" id="reviewRating">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-footer">
                                    <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                                    <button class="btn btn-primary" id="saveBtn">Save SEO Data</button>
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
        
        // Form buttons
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
                    <div class="product-price">
                        ${product.price}
                        ${product.compareAtPrice ? `<span class="price-compare">${product.compareAtPrice}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        ${hasSEO ? `
                            <div class="action-buttons">
                                <button class="btn btn-warning edit-btn">Edit SEO</button>
                                <button class="btn btn-danger delete-btn">Delete</button>
                            </div>
                        ` : `
                            <button class="btn btn-primary set-btn">Set Product SEO</button>
                        `}
                    </div>
                </div>
            `;
            
            // Store data on card
            card._productData = product;
            card._seoData = seoItem;
            
            // Add event listeners
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
        console.log('🔷 Dashboard: Showing form for:', product.name, 'Edit:', isEdit);
        
        this._selectedProduct = product;
        this._editMode = isEdit;
        this._showingForm = true;
        
        const formTitle = this._shadow.getElementById('formTitle');
        formTitle.textContent = isEdit ? 'Edit Product SEO' : 'Set Product SEO';
        
        // Reset form
        this._resetForm();
        
        // Set product name
        this._shadow.getElementById('productName').value = product.name;
        
        // Populate form if editing
        if (seoData && seoData.seoData) {
            try {
                const data = typeof seoData.seoData === 'string' 
                    ? JSON.parse(seoData.seoData) 
                    : seoData.seoData;
                this._populateForm(data);
            } catch (e) {
                console.error('🔷 Dashboard: Error parsing SEO data:', e);
            }
        }
        
        // Show form view
        const productsView = this._shadow.getElementById('productsView');
        const formView = this._shadow.getElementById('formView');
        
        productsView.classList.remove('active');
        formView.classList.add('active');
        
        // Scroll to top
        this._shadow.querySelector('.form-body').scrollTop = 0;
    }
    
    _hideForm() {
        console.log('🔷 Dashboard: Hiding form');
        
        this._showingForm = false;
        this._selectedProduct = null;
        this._editMode = false;
        
        const productsView = this._shadow.getElementById('productsView');
        const formView = this._shadow.getElementById('formView');
        
        formView.classList.remove('active');
        productsView.classList.add('active');
    }
    
    _resetForm() {
        const inputs = this._shadow.querySelectorAll('.form-input, .form-textarea, .form-select');
        inputs.forEach(input => {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });
    }
    
    _populateForm(data) {
        console.log('🔷 Dashboard: Populating form with data');
        
        const fields = {
            'productName': data.productName,
            'description': data.description,
            'sku': data.sku,
            'mpn': data.mpn,
            'gtin': data.gtin,
            'brandName': data.brandName,
            'price': data.price,
            'priceCurrency': data.priceCurrency,
            'availability': data.availability,
            'itemCondition': data.itemCondition,
            'aggregateRatingValue': data.aggregateRatingValue,
            'reviewCount': data.reviewCount,
            'reviewAuthor': data.reviewAuthor,
            'reviewRating': data.reviewRating
        };
        
        for (const [id, value] of Object.entries(fields)) {
            const element = this._shadow.getElementById(id);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        }
        
        if (data.imageUrls && Array.isArray(data.imageUrls)) {
            this._shadow.getElementById('imageUrls').value = data.imageUrls.join('\n');
        }
    }
    
    _collectFormData() {
        const imageUrlsText = this._shadow.getElementById('imageUrls').value.trim();
        const imageUrls = imageUrlsText ? imageUrlsText.split('\n').map(url => url.trim()).filter(url => url) : [];
        
        return {
            productName: this._shadow.getElementById('productName').value.trim(),
            description: this._shadow.getElementById('description').value.trim(),
            sku: this._shadow.getElementById('sku').value.trim(),
            mpn: this._shadow.getElementById('mpn').value.trim(),
            gtin: this._shadow.getElementById('gtin').value.trim(),
            brandName: this._shadow.getElementById('brandName').value.trim(),
            imageUrls: imageUrls,
            price: this._shadow.getElementById('price').value.trim(),
            priceCurrency: this._shadow.getElementById('priceCurrency').value,
            availability: this._shadow.getElementById('availability').value,
            itemCondition: this._shadow.getElementById('itemCondition').value,
            aggregateRatingValue: this._shadow.getElementById('aggregateRatingValue').value.trim(),
            reviewCount: this._shadow.getElementById('reviewCount').value.trim(),
            reviewAuthor: this._shadow.getElementById('reviewAuthor').value.trim(),
            reviewRating: this._shadow.getElementById('reviewRating').value.trim()
        };
    }
    
    _handleSave() {
        console.log('🔷 Dashboard: Handling save');
        
        // Validation
        const productName = this._shadow.getElementById('productName').value.trim();
        const description = this._shadow.getElementById('description').value.trim();
        const price = this._shadow.getElementById('price').value.trim();
        const currency = this._shadow.getElementById('priceCurrency').value;
        
        if (!productName) {
            alert('Please enter a product name');
            return;
        }
        
        if (!description) {
            alert('Please enter a description');
            return;
        }
        
        if (!price) {
            alert('Please enter a price');
            return;
        }
        
        if (!currency) {
            alert('Please select a currency');
            return;
        }
        
        const seoData = this._collectFormData();
        
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
}

customElements.define('product-seo-dashboard', ProductSEODashboard);
console.log('🔷 Dashboard: ✅ Custom element registered');
