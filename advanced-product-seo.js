class ProductSEODashboard extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._products = [];
        this._seoItems = [];
        this._currentPage = 0;
        this._pageSize = 12;
        this._totalProducts = 0;
        this._selectedProduct = null;
        this._editMode = false;
        this._root = document.createElement('div');
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
                    height: 100%;
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
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
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
                    overflow-y: auto;
                    padding: 24px;
                }
                
                .content-wrapper {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
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
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                }
                
                .empty-icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 16px;
                    opacity: 0.3;
                }
                
                .empty-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }
                
                .empty-message {
                    font-size: 14px;
                    color: var(--text-secondary);
                }
                
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                    padding: 20px;
                }
                
                .modal-overlay.active {
                    display: flex;
                }
                
                .modal-content {
                    background: var(--bg-primary);
                    border-radius: 16px;
                    max-width: 900px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                }
                
                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--bg-secondary);
                }
                
                .modal-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                
                .modal-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                
                .modal-close:hover {
                    background: var(--bg-tertiary);
                }
                
                .modal-close svg {
                    width: 20px;
                    height: 20px;
                    fill: var(--text-secondary);
                }
                
                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0;
                }
                
                .error-message {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 16px;
                    color: #991b1b;
                    font-size: 14px;
                }
                
                .success-message {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 16px;
                    color: #166534;
                    font-size: 14px;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 8px;
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
                    
                    .modal-content {
                        max-width: 100%;
                        max-height: 95vh;
                        border-radius: 12px;
                    }
                    
                    .stats-bar {
                        gap: 12px;
                    }
                    
                    .stat-item {
                        flex: 1;
                        min-width: 120px;
                    }
                }
                
                @media (max-width: 480px) {
                    .products-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                    }
                }
                
                /* Scrollbar styling */
                .main-content::-webkit-scrollbar,
                .modal-body::-webkit-scrollbar {
                    width: 8px;
                }
                
                .main-content::-webkit-scrollbar-track,
                .modal-body::-webkit-scrollbar-track {
                    background: var(--bg-secondary);
                }
                
                .main-content::-webkit-scrollbar-thumb,
                .modal-body::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 4px;
                }
                
                .main-content::-webkit-scrollbar-thumb:hover,
                .modal-body::-webkit-scrollbar-thumb:hover {
                    background: var(--text-tertiary);
                }
            </style>
            
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div class="header-content">
                        <h1 class="dashboard-title">Product SEO Management</h1>
                        <p class="dashboard-subtitle">
                            Manage structured data and rich snippets for your products to improve search visibility
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
                        <div id="loadingContainer" class="loading-container">
                            <div class="spinner"></div>
                            <div class="loading-text">Loading products...</div>
                        </div>
                        
                        <div id="productsContainer" style="display: none;">
                            <div class="products-grid" id="productsGrid"></div>
                            
                            <div class="pagination" id="pagination" style="display: none;">
                                <button class="btn btn-secondary" id="prevPage" disabled>
                                    <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                                    Previous
                                </button>
                                <span class="pagination-info" id="paginationInfo"></span>
                                <button class="btn btn-secondary" id="nextPage" disabled>
                                    Next
                                    <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                                </button>
                            </div>
                        </div>
                        
                        <div id="emptyState" class="empty-state" style="display: none;">
                            <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                            <h2 class="empty-title">No Products Found</h2>
                            <p class="empty-message">There are no products available in your store.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="seoModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title" id="modalTitle">Configure Product SEO</h2>
                        <button class="modal-close" id="closeModal">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body" id="modalBody">
                        <!-- SEO Builder will be inserted here -->
                    </div>
                </div>
            </div>
        `;
        
        this._shadow.appendChild(this._root);
        this._setupEventListeners();
    }
    
    connectedCallback() {
        this._loadProducts();
    }
    
    _setupEventListeners() {
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
        
        // Modal close
        this._shadow.getElementById('closeModal').addEventListener('click', () => {
            this._closeModal();
        });
        
        this._shadow.getElementById('seoModal').addEventListener('click', (e) => {
            if (e.target.id === 'seoModal') {
                this._closeModal();
            }
        });
    }
    
    async _loadProducts() {
        const loadingContainer = this._shadow.getElementById('loadingContainer');
        const productsContainer = this._shadow.getElementById('productsContainer');
        const emptyState = this._shadow.getElementById('emptyState');
        
        loadingContainer.style.display = 'flex';
        productsContainer.style.display = 'none';
        emptyState.style.display = 'none';
        
        try {
            // Dispatch event to get products from backend
            const event = new CustomEvent('load-products', {
                detail: {
                    limit: this._pageSize,
                    skip: this._currentPage * this._pageSize
                },
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(event);
            
        } catch (error) {
            console.error('Error loading products:', error);
            loadingContainer.style.display = 'none';
            emptyState.style.display = 'block';
        }
    }
    
    setProducts(data) {
        this._products = data.products || [];
        this._totalProducts = data.totalCount || 0;
        this._seoItems = data.seoItems || [];
        
        const loadingContainer = this._shadow.getElementById('loadingContainer');
        const productsContainer = this._shadow.getElementById('productsContainer');
        const emptyState = this._shadow.getElementById('emptyState');
        
        loadingContainer.style.display = 'none';
        
        if (this._products.length === 0) {
            emptyState.style.display = 'block';
            productsContainer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            productsContainer.style.display = 'block';
            this._renderProducts();
            this._updateStats();
            this._updatePagination();
        }
    }
    
    _renderProducts() {
        const grid = this._shadow.getElementById('productsGrid');
        grid.innerHTML = '';
        
        this._products.forEach(product => {
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            ${hasSEO 
                                ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'
                                : '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>'
                            }
                        </svg>
                        ${hasSEO ? 'SEO Active' : 'No SEO'}
                    </div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        ${product.price}
                        ${product.compareAtPrice ? `<span class="price-compare">${product.compareAtPrice}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        ${hasSEO ? `
                            <div class="action-buttons">
                                <button class="btn btn-warning" data-action="edit" data-product='${JSON.stringify(product)}' data-seo='${JSON.stringify(seoItem)}'>
                                    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                    Edit SEO
                                </button>
                                <button class="btn btn-danger" data-action="delete" data-product='${JSON.stringify(product)}' data-seo='${JSON.stringify(seoItem)}'>
                                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                    Delete
                                </button>
                            </div>
                        ` : `
                            <button class="btn btn-primary" data-action="set" data-product='${JSON.stringify(product)}'>
                                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                Set Product SEO
                            </button>
                        `}
                    </div>
                </div>
            `;
            
            // Add event listeners to buttons
            const buttons = card.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.dataset.action;
                    const product = JSON.parse(button.dataset.product);
                    const seoData = button.dataset.seo ? JSON.parse(button.dataset.seo) : null;
                    
                    this._handleAction(action, product, seoData);
                });
            });
            
            grid.appendChild(card);
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
            info.textContent = `Showing ${start}-${end} of ${this._totalProducts} products`;
        } else {
            pagination.style.display = 'none';
        }
    }
    
    _handleAction(action, product, seoData) {
        switch (action) {
            case 'set':
                this._openSEOBuilder(product, null, false);
                break;
            case 'edit':
                this._openSEOBuilder(product, seoData, true);
                break;
            case 'delete':
                this._deleteSEO(product, seoData);
                break;
        }
    }
    
    _openSEOBuilder(product, seoData, isEdit) {
        this._selectedProduct = product;
        this._editMode = isEdit;
        
        const modal = this._shadow.getElementById('seoModal');
        const modalTitle = this._shadow.getElementById('modalTitle');
        const modalBody = this._shadow.getElementById('modalBody');
        
        modalTitle.textContent = isEdit ? 'Edit Product SEO' : 'Set Product SEO';
        
        // Create SEO builder element
        const seoBuilder = document.createElement('product-seo-builder');
        seoBuilder.setAttribute('product-name', product.name);
        
        if (seoData && seoData.seoData) {
            try {
                const parsedData = typeof seoData.seoData === 'string' 
                    ? JSON.parse(seoData.seoData) 
                    : seoData.seoData;
                seoBuilder.setAttribute('seo-data', JSON.stringify(parsedData));
            } catch (e) {
                console.error('Error parsing SEO data:', e);
            }
        }
        
        // Listen for save and cancel events
        seoBuilder.addEventListener('save', (e) => {
            this._saveSEO(product, e.detail, seoData);
        });
        
        seoBuilder.addEventListener('cancel', () => {
            this._closeModal();
        });
        
        modalBody.innerHTML = '';
        modalBody.appendChild(seoBuilder);
        
        modal.classList.add('active');
    }
    
    async _saveSEO(product, seoData, existingSEO) {
        // Dispatch event to save SEO data
        const event = new CustomEvent('save-seo', {
            detail: {
                product: product,
                seoData: seoData,
                existingSEO: existingSEO
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
    
    async _deleteSEO(product, seoData) {
        if (!confirm(`Are you sure you want to delete SEO data for "${product.name}"?`)) {
            return;
        }
        
        // Dispatch event to delete SEO data
        const event = new CustomEvent('delete-seo', {
            detail: {
                product: product,
                seoData: seoData
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
    
    _closeModal() {
        const modal = this._shadow.getElementById('seoModal');
        modal.classList.remove('active');
        this._selectedProduct = null;
        this._editMode = false;
    }
    
    showSuccess(message) {
        this._closeModal();
        this._loadProducts(); // Reload products to update UI
        
        // You could add a toast notification here
        alert(message);
    }
    
    showError(message) {
        alert('Error: ' + message);
    }
}

// Register the custom element
customElements.define('product-seo-dashboard', ProductSEODashboard);
