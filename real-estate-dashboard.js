// Filename: real-estate-dashboard.js (Custom Element)

class RealEstateDashboard extends HTMLElement {
    constructor() {
        super();
        this.currentListing = null;
    }
    
    connectedCallback() {
        console.log('🏠 Dashboard: Custom element connected');
        this.render();
        this.attachEventListeners();
    }
    
    static get observedAttributes() {
        return ['listing-data', 'all-listings-data', 'listing-counts', 'notification', 'upload-progress'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'listing-data' && newValue && newValue !== oldValue) {
            try {
                const data = JSON.parse(newValue);
                this.setListingData(data.listings);
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
        
        if (name === 'listing-counts' && newValue && newValue !== oldValue) {
            try {
                const counts = JSON.parse(newValue);
                this.setListingCounts(counts);
            } catch (e) {
                console.error('🏠 Dashboard: Parse error:', e);
            }
        }
        
        if (name === 'notification' && newValue && newValue !== oldValue) {
            try {
                const notification = JSON.parse(newValue);
                this.showNotification(notification.type, notification.message);
            } catch (e) {
                console.error('🏠 Dashboard: Parse error:', e);
            }
        }
        
        if (name === 'upload-progress' && newValue && newValue !== oldValue) {
            try {
                const progress = JSON.parse(newValue);
                this.updateProgress(progress.progress, progress.message);
            } catch (e) {
                console.error('🏠 Dashboard: Parse error:', e);
            }
        }
    }
    
    render() {
        this.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                .dashboard-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f8f9fa;
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                
                .header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                
                .header p {
                    opacity: 0.9;
                    font-size: 14px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    border-left: 4px solid #667eea;
                }
                
                .stat-card h3 {
                    color: #666;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }
                
                .stat-card .number {
                    font-size: 32px;
                    font-weight: 700;
                    color: #333;
                }
                
                .controls {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }
                
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-primary {
                    background: #667eea;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #5568d3;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
                }
                
                .btn-secondary {
                    background: white;
                    color: #667eea;
                    border: 2px solid #667eea;
                }
                
                .btn-secondary:hover {
                    background: #f8f9ff;
                }
                
                .listings-table {
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                
                .table-header {
                    background: #f8f9fa;
                    padding: 15px 20px;
                    border-bottom: 2px solid #e9ecef;
                    font-weight: 600;
                    display: grid;
                    grid-template-columns: 80px 1fr 200px 150px 150px 200px;
                    gap: 15px;
                    align-items: center;
                }
                
                .listing-row {
                    padding: 15px 20px;
                    border-bottom: 1px solid #f1f3f5;
                    display: grid;
                    grid-template-columns: 80px 1fr 200px 150px 150px 200px;
                    gap: 15px;
                    align-items: center;
                    transition: background 0.2s;
                }
                
                .listing-row:hover {
                    background: #f8f9ff;
                }
                
                .listing-image {
                    width: 60px;
                    height: 60px;
                    border-radius: 6px;
                    object-fit: cover;
                    border: 2px solid #e9ecef;
                }
                
                .listing-title {
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 4px;
                }
                
                .listing-location {
                    font-size: 13px;
                    color: #666;
                }
                
                .badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .badge-sale {
                    background: #e3f2fd;
                    color: #1976d2;
                }
                
                .badge-rent {
                    background: #f3e5f5;
                    color: #7b1fa2;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 8px;
                }
                
                .btn-small {
                    padding: 6px 12px;
                    font-size: 12px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-edit {
                    background: #4caf50;
                    color: white;
                }
                
                .btn-edit:hover {
                    background: #45a049;
                }
                
                .btn-delete {
                    background: #f44336;
                    color: white;
                }
                
                .btn-delete:hover {
                    background: #da190b;
                }
                
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 1000;
                    overflow-y: auto;
                }
                
                .modal.active {
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding: 40px 20px;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                
                .modal-header {
                    padding: 24px 30px;
                    border-bottom: 2px solid #f1f3f5;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 10;
                }
                
                .modal-header h2 {
                    font-size: 22px;
                    color: #333;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                
                .close-btn:hover {
                    background: #f1f3f5;
                    color: #333;
                }
                
                .modal-body {
                    padding: 30px;
                }
                
                .form-section {
                    margin-bottom: 30px;
                }
                
                .form-section h3 {
                    font-size: 16px;
                    color: #667eea;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #f1f3f5;
                }
                
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }
                
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                
                .form-group.full-width {
                    grid-column: 1 / -1;
                }
                
                .form-group label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #555;
                    margin-bottom: 6px;
                }
                
                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 10px 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                    font-family: inherit;
                }
                
                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .form-group input:read-only {
                    background: #f8f9fa;
                    color: #999;
                }
                
                .form-group textarea {
                    resize: vertical;
                    min-height: 100px;
                }
                
                .checkbox-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }
                
                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .checkbox-item input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                
                .checkbox-item label {
                    font-size: 13px;
                    color: #555;
                    cursor: pointer;
                    margin: 0;
                }
                
                .image-upload-section {
                    border: 2px dashed #e9ecef;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    background: #f8f9fa;
                }
                
                .image-preview {
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .image-preview-item {
                    position: relative;
                    width: 120px;
                    height: 120px;
                }
                
                .image-preview-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 6px;
                    border: 2px solid #e9ecef;
                }
                
                .image-delete-btn {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(244, 67, 54, 0.9);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .image-delete-btn:hover {
                    background: rgba(244, 67, 54, 1);
                    transform: scale(1.1);
                }
                
                .upload-btn-wrapper {
                    display: inline-block;
                    position: relative;
                }
                
                .upload-btn-wrapper input[type="file"] {
                    position: absolute;
                    left: 0;
                    top: 0;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }
                
                .progress-bar-container {
                    display: none;
                    margin: 20px 0;
                    background: #f1f3f5;
                    border-radius: 8px;
                    overflow: hidden;
                    height: 32px;
                    position: relative;
                }
                
                .progress-bar-container.active {
                    display: block;
                }
                
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    transition: width 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .progress-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 12px;
                    font-weight: 600;
                    color: #333;
                    white-space: nowrap;
                }
                
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 2000;
                    display: none;
                    align-items: center;
                    gap: 12px;
                    min-width: 300px;
                    animation: slideIn 0.3s;
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
                
                .notification.show {
                    display: flex;
                }
                
                .notification.success {
                    background: #4caf50;
                    color: white;
                }
                
                .notification.error {
                    background: #f44336;
                    color: white;
                }
                
                .pagination {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                    padding: 20px;
                }
                
                .pagination button {
                    padding: 8px 16px;
                    border: 2px solid #667eea;
                    background: white;
                    color: #667eea;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                
                .pagination button:hover:not(:disabled) {
                    background: #667eea;
                    color: white;
                }
                
                .pagination button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .pagination .page-info {
                    display: flex;
                    align-items: center;
                    padding: 0 15px;
                    font-weight: 600;
                    color: #555;
                }
                
                .related-listings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                
                .related-listing-card {
                    background: white;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                
                .related-listing-card:hover {
                    border-color: #667eea;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                .related-listing-card.selected {
                    border-color: #667eea;
                    background: #f8f9ff;
                }
                
                .related-listing-card input[type="checkbox"] {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }
                
                .related-listing-image {
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                
                .related-listing-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 4px;
                    padding-right: 25px;
                }
                
                .related-listing-location {
                    font-size: 11px;
                    color: #666;
                    margin-bottom: 4px;
                }
                
                .related-listing-price {
                    font-size: 12px;
                    font-weight: 700;
                    color: #667eea;
                }
                
                .address-inputs {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                
                .address-inputs .form-group {
                    margin-bottom: 0;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #999;
                }
                
                .empty-state-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
            </style>
            
            <div class="dashboard-container">
                <!-- Header -->
                <div class="header">
                    <h1>🏠 Real Estate Listings Dashboard</h1>
                    <p>Manage your property listings, images, and details</p>
                </div>
                
                <!-- Statistics -->
                <div class="stats-grid" id="statsGrid">
                    <div class="stat-card">
                        <h3>Total Listings</h3>
                        <div class="number" id="totalListings">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>For Sale</h3>
                        <div class="number" id="forSaleCount">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>For Rent</h3>
                        <div class="number" id="forRentCount">0</div>
                    </div>
                </div>
                
                <!-- Controls -->
                <div class="controls">
                    <button class="btn btn-primary" id="addListingBtn">
                        ➕ Add New Listing
                    </button>
                    <button class="btn btn-secondary" id="refreshBtn">
                        🔄 Refresh
                    </button>
                </div>
                
                <!-- Listings Table -->
                <div class="listings-table">
                    <div class="table-header">
                        <div>Image</div>
                        <div>Title & Location</div>
                        <div>Type</div>
                        <div>Price</div>
                        <div>Details</div>
                        <div>Actions</div>
                    </div>
                    <div id="listingsContainer">
                        <div class="loading">Loading listings...</div>
                    </div>
                </div>
                
                <!-- Pagination -->
                <div class="pagination" id="pagination"></div>
                
                <!-- Modal -->
                <div class="modal" id="listingModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 id="modalTitle">Add New Listing</h2>
                            <button class="close-btn" id="closeModalBtn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="listingForm">
                                <!-- Basic Information -->
                                <div class="form-section">
                                    <h3>📋 Basic Information</h3>
                                    <div class="form-grid">
                                        <div class="form-group full-width">
                                            <label>Title *</label>
                                            <input type="text" id="title" required>
                                        </div>
                                        <div class="form-group full-width">
                                            <label>Slug (Auto-generated)</label>
                                            <input type="text" id="slug" readonly>
                                        </div>
                                        <div class="form-group full-width">
                                            <label>Description</label>
                                            <textarea id="description"></textarea>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Address Information -->
                                <div class="form-section">
                                    <h3>📍 Address Information</h3>
                                    <div class="form-group full-width">
                                        <label>Formatted Address *</label>
                                        <input type="text" id="addressFormatted" placeholder="e.g., 123 Main St, New York, NY 10001" required>
                                    </div>
                                    <div class="address-inputs">
                                        <div class="form-group">
                                            <label>Latitude *</label>
                                            <input type="number" id="addressLatitude" step="0.000001" placeholder="e.g., 40.7128" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Longitude *</label>
                                            <input type="number" id="addressLongitude" step="0.000001" placeholder="e.g., -74.0060" required>
                                        </div>
                                        <div class="form-group">
                                            <label>City</label>
                                            <input type="text" id="addressCity" placeholder="e.g., New York">
                                        </div>
                                        <div class="form-group">
                                            <label>State/Province</label>
                                            <input type="text" id="addressState" placeholder="e.g., NY">
                                        </div>
                                        <div class="form-group">
                                            <label>Country Code</label>
                                            <input type="text" id="addressCountry" placeholder="e.g., US" maxlength="2">
                                        </div>
                                        <div class="form-group">
                                            <label>Postal Code</label>
                                            <input type="text" id="addressPostalCode" placeholder="e.g., 10001">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Property Details -->
                                <div class="form-section">
                                    <h3>🏡 Property Details</h3>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label>Property Type *</label>
                                            <select id="propertyType" required>
                                                <option value="">Select Type</option>
                                                <option value="House">House</option>
                                                <option value="Apartment">Apartment</option>
                                                <option value="Condo">Condo</option>
                                                <option value="Townhouse">Townhouse</option>
                                                <option value="Villa">Villa</option>
                                                <option value="Land">Land</option>
                                                <option value="Commercial">Commercial</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Listing Type *</label>
                                            <select id="listingType" required>
                                                <option value="sale">For Sale</option>
                                                <option value="rent">For Rent</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Condition</label>
                                            <select id="condition">
                                                <option value="">Select Condition</option>
                                                <option value="New">New</option>
                                                <option value="Like New">Like New</option>
                                                <option value="Excellent">Excellent</option>
                                                <option value="Good">Good</option>
                                                <option value="Fair">Fair</option>
                                                <option value="Needs Renovation">Needs Renovation</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Year Built</label>
                                            <input type="number" id="yearBuilt" min="1800" max="2100">
                                        </div>
                                        <div class="form-group">
                                            <label>Bedrooms</label>
                                            <input type="number" id="bedrooms" min="0">
                                        </div>
                                        <div class="form-group">
                                            <label>Bathrooms</label>
                                            <input type="number" id="bathrooms" min="0" step="0.5">
                                        </div>
                                        <div class="form-group">
                                            <label>Square Footage</label>
                                            <input type="number" id="squareFootage" min="0">
                                        </div>
                                        <div class="form-group">
                                            <label>Lot Size</label>
                                            <input type="number" id="lotSize" min="0">
                                        </div>
                                        <div class="form-group">
                                            <label>Total Rooms</label>
                                            <input type="number" id="totalRooms" min="0">
                                        </div>
                                        <div class="form-group">
                                            <label>Garage Spaces</label>
                                            <input type="number" id="garageSpaces" min="0">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Pricing -->
                                <div class="form-section">
                                    <h3>💰 Pricing</h3>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label>Price *</label>
                                            <input type="number" id="price" min="0" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Currency *</label>
                                            <select id="currency" required>
                                                <option value="USD">USD - US Dollar</option>
                                                <option value="EUR">EUR - Euro</option>
                                                <option value="GBP">GBP - British Pound</option>
                                                <option value="CAD">CAD - Canadian Dollar</option>
                                                <option value="AUD">AUD - Australian Dollar</option>
                                                <option value="JPY">JPY - Japanese Yen</option>
                                                <option value="CNY">CNY - Chinese Yuan</option>
                                                <option value="INR">INR - Indian Rupee</option>
                                                <option value="MXN">MXN - Mexican Peso</option>
                                                <option value="BRL">BRL - Brazilian Real</option>
                                                <option value="ZAR">ZAR - South African Rand</option>
                                                <option value="AED">AED - UAE Dirham</option>
                                                <option value="SAR">SAR - Saudi Riyal</option>
                                                <option value="SGD">SGD - Singapore Dollar</option>
                                                <option value="CHF">CHF - Swiss Franc</option>
                                                <option value="SEK">SEK - Swedish Krona</option>
                                                <option value="NOK">NOK - Norwegian Krone</option>
                                                <option value="DKK">DKK - Danish Krone</option>
                                                <option value="PLN">PLN - Polish Zloty</option>
                                                <option value="TRY">TRY - Turkish Lira</option>
                                                <option value="RUB">RUB - Russian Ruble</option>
                                                <option value="HKD">HKD - Hong Kong Dollar</option>
                                                <option value="NZD">NZD - New Zealand Dollar</option>
                                                <option value="KRW">KRW - South Korean Won</option>
                                                <option value="THB">THB - Thai Baht</option>
                                                <option value="MYR">MYR - Malaysian Ringgit</option>
                                                <option value="IDR">IDR - Indonesian Rupiah</option>
                                                <option value="PHP">PHP - Philippine Peso</option>
                                                <option value="VND">VND - Vietnamese Dong</option>
                                                <option value="EGP">EGP - Egyptian Pound</option>
                                                <option value="NGN">NGN - Nigerian Naira</option>
                                                <option value="KES">KES - Kenyan Shilling</option>
                                                <option value="CLP">CLP - Chilean Peso</option>
                                                <option value="COP">COP - Colombian Peso</option>
                                                <option value="ARS">ARS - Argentine Peso</option>
                                                <option value="PEN">PEN - Peruvian Sol</option>
                                                <option value="ILS">ILS - Israeli Shekel</option>
                                                <option value="CZK">CZK - Czech Koruna</option>
                                                <option value="HUF">HUF - Hungarian Forint</option>
                                                <option value="RON">RON - Romanian Leu</option>
                                                <option value="BGN">BGN - Bulgarian Lev</option>
                                                <option value="HRK">HRK - Croatian Kuna</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>HOA Fee</label>
                                            <input type="number" id="hoaFee" min="0">
                                        </div>
                                        <div class="form-group">
                                            <label>Property Tax</label>
                                            <input type="number" id="propertyTax" min="0">
                                        </div>
                                        <div class="form-group">
                                            <label>Price Valid Until</label>
                                            <input type="date" id="priceValidUntil">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Images -->
                                <div class="form-section">
                                    <h3>📸 Images</h3>
                                    
                                    <!-- Thumbnail Image -->
                                    <div class="form-group full-width">
                                        <label>Thumbnail Image *</label>
                                        <div class="image-upload-section">
                                            <div class="upload-btn-wrapper">
                                                <button type="button" class="btn btn-primary">Choose Thumbnail</button>
                                                <input type="file" id="thumbnailInput" accept="image/*">
                                            </div>
                                            <div class="image-preview" id="thumbnailPreview"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- Gallery Images -->
                                    <div class="form-group full-width">
                                        <label>Gallery Images</label>
                                        <div class="image-upload-section">
                                            <div class="upload-btn-wrapper">
                                                <button type="button" class="btn btn-primary">Choose Gallery Images</button>
                                                <input type="file" id="galleryInput" accept="image/*" multiple>
                                            </div>
                                            <div class="image-preview" id="galleryPreview"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- SEO OG Image -->
                                    <div class="form-group full-width">
                                        <label>SEO OG Image (Open Graph Image for Social Sharing)</label>
                                        <div class="image-upload-section">
                                            <div class="upload-btn-wrapper">
                                                <button type="button" class="btn btn-primary">Choose OG Image</button>
                                                <input type="file" id="seoOgImageInput" accept="image/*">
                                            </div>
                                            <div class="image-preview" id="seoOgImagePreview"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Status Badges -->
                                <div class="form-section">
                                    <h3>🏷️ Status Badges</h3>
                                    <div class="checkbox-grid">
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="isFeatured">
                                            <label for="isFeatured">Featured</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="isNewConstruction">
                                            <label for="isNewConstruction">New Construction</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="isForeclosure">
                                            <label for="isForeclosure">Foreclosure</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="isShortSale">
                                            <label for="isShortSale">Short Sale</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="isPriceReduced">
                                            <label for="isPriceReduced">Price Reduced</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="isOpenHouse">
                                            <label for="isOpenHouse">Open House</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="isVirtualTour">
                                            <label for="isVirtualTour">Virtual Tour</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Property Features -->
                                <div class="form-section">
                                    <h3>✨ Property Features</h3>
                                    <div class="checkbox-grid">
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasPool">
                                            <label for="hasPool">Pool</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasGarage">
                                            <label for="hasGarage">Garage</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasBasement">
                                            <label for="hasBasement">Basement</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasAttic">
                                            <label for="hasAttic">Attic</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasFireplace">
                                            <label for="hasFireplace">Fireplace</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasBalcony">
                                            <label for="hasBalcony">Balcony</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasGarden">
                                            <label for="hasGarden">Garden</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasSecurity">
                                            <label for="hasSecurity">Security System</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasAirConditioning">
                                            <label for="hasAirConditioning">Air Conditioning</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasHeating">
                                            <label for="hasHeating">Heating</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasWasherDryer">
                                            <label for="hasWasherDryer">Washer/Dryer</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasDishwasher">
                                            <label for="hasDishwasher">Dishwasher</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasUpdatedKitchen">
                                            <label for="hasUpdatedKitchen">Updated Kitchen</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasUpdatedBathroom">
                                            <label for="hasUpdatedBathroom">Updated Bathroom</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasHardwoodFloors">
                                            <label for="hasHardwoodFloors">Hardwood Floors</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasWalkInCloset">
                                            <label for="hasWalkInCloset">Walk-In Closet</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasMasterSuite">
                                            <label for="hasMasterSuite">Master Suite</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasLaundryRoom">
                                            <label for="hasLaundryRoom">Laundry Room</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasPantry">
                                            <label for="hasPantry">Pantry</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasOffice">
                                            <label for="hasOffice">Home Office</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasGym">
                                            <label for="hasGym">Gym</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasWinecellar">
                                            <label for="hasWinecellar">Wine Cellar</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasElevator">
                                            <label for="hasElevator">Elevator</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasSolarPanels">
                                            <label for="hasSolarPanels">Solar Panels</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasSmartHome">
                                            <label for="hasSmartHome">Smart Home</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Location Features -->
                                <div class="form-section">
                                    <h3>🌍 Location Features</h3>
                                    <div class="checkbox-grid">
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasWaterfront">
                                            <label for="hasWaterfront">Waterfront</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasGolfCourse">
                                            <label for="hasGolfCourse">Golf Course</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasMountainView">
                                            <label for="hasMountainView">Mountain View</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasCityView">
                                            <label for="hasCityView">City View</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasOceanView">
                                            <label for="hasOceanView">Ocean View</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasPrivateBeach">
                                            <label for="hasPrivateBeach">Private Beach</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasBoatDock">
                                            <label for="hasBoatDock">Boat Dock</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasGuestHouse">
                                            <label for="hasGuestHouse">Guest House</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasInLawSuite">
                                            <label for="hasInLawSuite">In-Law Suite</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Community Features -->
                                <div class="form-section">
                                    <h3>🏘️ Community Features</h3>
                                    <div class="checkbox-grid">
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasGatedCommunity">
                                            <label for="hasGatedCommunity">Gated Community</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasClubhouse">
                                            <label for="hasClubhouse">Clubhouse</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasPlayground">
                                            <label for="hasPlayground">Playground</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasTennisaccess">
                                            <label for="hasTennisaccess">Tennis Court</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasPetFriendly">
                                            <label for="hasPetFriendly">Pet Friendly</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasHandicapAccessible">
                                            <label for="hasHandicapAccessible">Handicap Accessible</label>
                                        </div>
                                        <div class="checkbox-item">
                                            <input type="checkbox" id="hasRentToOwn">
                                            <label for="hasRentToOwn">Rent to Own</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Additional Details -->
                                <div class="form-section">
                                    <h3>📝 Additional Details</h3>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label>Architecture</label>
                                            <input type="text" id="architecture" placeholder="e.g., Modern, Victorian">
                                        </div>
                                        <div class="form-group">
                                            <label>Heating</label>
                                            <input type="text" id="heating" placeholder="e.g., Central, Gas">
                                        </div>
                                        <div class="form-group">
                                            <label>Cooling</label>
                                            <input type="text" id="cooling" placeholder="e.g., Central AC">
                                        </div>
                                        <div class="form-group">
                                            <label>Flooring</label>
                                            <input type="text" id="flooring" placeholder="e.g., Hardwood, Tile">
                                        </div>
                                        <div class="form-group">
                                            <label>School District</label>
                                            <input type="text" id="schoolDistrict">
                                        </div>
                                        <div class="form-group">
                                            <label>Zoning</label>
                                            <input type="text" id="zoning">
                                        </div>
                                        <div class="form-group">
                                            <label>Days on Market</label>
                                            <input type="number" id="daysOnMarket" min="0">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- SEO -->
                                <div class="form-section">
                                    <h3>🔍 SEO Settings</h3>
                                    <div class="form-grid">
                                        <div class="form-group full-width">
                                            <label>SEO Title</label>
                                            <input type="text" id="seoTitle" maxlength="60">
                                        </div>
                                        <div class="form-group full-width">
                                            <label>SEO Description</label>
                                            <textarea id="seoDescription" maxlength="160"></textarea>
                                        </div>
                                        <div class="form-group full-width">
                                            <label>SEO Keywords</label>
                                            <input type="text" id="seoKeywords" placeholder="keyword1, keyword2, keyword3">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Related Listings -->
                                <div class="form-section">
                                    <h3>🔗 Related Listings</h3>
                                    <div id="relatedListingsContainer">
                                        <div class="loading">Loading available listings...</div>
                                    </div>
                                </div>
                                
                                <!-- Progress Bar -->
                                <div class="progress-bar-container" id="progressBarContainer">
                                    <div class="progress-bar" id="progressBar"></div>
                                    <div class="progress-message" id="progressMessage"></div>
                                </div>
                                
                                <!-- Submit Button -->
                                <div class="controls" style="margin-top: 30px; justify-content: flex-end;">
                                    <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                                    <button type="submit" class="btn btn-primary" id="saveListingBtn">Save Listing</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <!-- Notification -->
                <div class="notification" id="notification"></div>
            </div>
        `;
    }
    
    attachEventListeners() {
        // Modal controls
        this.querySelector('#addListingBtn').addEventListener('click', () => {
            this.openModal();
        });
        
        this.querySelector('#closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        this.querySelector('#cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Refresh button
        this.querySelector('#refreshBtn').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('refresh-listings'));
        });
        
        // Form submission
        this.querySelector('#listingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveListing();
        });
        
        // Title to slug generation
        this.querySelector('#title').addEventListener('input', (e) => {
            const slug = this.generateSlug(e.target.value);
            this.querySelector('#slug').value = slug;
        });
        
        // Image uploads
        this.querySelector('#thumbnailInput').addEventListener('change', (e) => {
            this.handleThumbnailUpload(e.target.files);
        });
        
        this.querySelector('#galleryInput').addEventListener('change', (e) => {
            this.handleGalleryUpload(e.target.files);
        });
        
        this.querySelector('#seoOgImageInput').addEventListener('change', (e) => {
            this.handleSeoOgImageUpload(e.target.files);
        });
    }
    
    generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    openModal(listing = null) {
        this.currentListing = listing;
        const modal = this.querySelector('#listingModal');
        const modalTitle = this.querySelector('#modalTitle');
        
        if (listing) {
            modalTitle.textContent = 'Edit Listing';
            this.populateForm(listing);
        } else {
            modalTitle.textContent = 'Add New Listing';
            this.querySelector('#listingForm').reset();
            this.querySelector('#thumbnailPreview').innerHTML = '';
            this.querySelector('#galleryPreview').innerHTML = '';
            this.querySelector('#seoOgImagePreview').innerHTML = '';
            this.currentThumbnail = null;
            this.currentGallery = [];
            this.currentSeoOgImage = null;
        }
        
        modal.classList.add('active');
        
        // Load all listings for related selection
        this.dispatchEvent(new CustomEvent('load-all-listings-for-selection'));
    }
    
    closeModal() {
        const modal = this.querySelector('#listingModal');
        modal.classList.remove('active');
        this.currentListing = null;
    }
    
    populateForm(listing) {
        // Basic info
        this.querySelector('#title').value = listing.title || '';
        this.querySelector('#slug').value = listing.slug || '';
        this.querySelector('#description').value = listing.description || '';
        
        // Address - parse the address object
        if (listing.location && typeof listing.location === 'object') {
            this.querySelector('#addressFormatted').value = listing.location.formatted || '';
            this.querySelector('#addressLatitude').value = listing.location.location?.latitude || '';
            this.querySelector('#addressLongitude').value = listing.location.location?.longitude || '';
            this.querySelector('#addressCity').value = listing.location.city || '';
            this.querySelector('#addressState').value = listing.location.state || '';
            this.querySelector('#addressCountry').value = listing.location.country || '';
            this.querySelector('#addressPostalCode').value = listing.location.postalCode || '';
        } else if (typeof listing.location === 'string') {
            // Fallback for string location
            this.querySelector('#addressFormatted').value = listing.location || '';
        }
        
        // Property details
        this.querySelector('#propertyType').value = listing.propertyType || '';
        this.querySelector('#listingType').value = listing.listingType || 'sale';
        this.querySelector('#condition').value = listing.condition || '';
        this.querySelector('#yearBuilt').value = listing.yearBuilt || '';
        this.querySelector('#bedrooms').value = listing.bedrooms || '';
        this.querySelector('#bathrooms').value = listing.bathrooms || '';
        this.querySelector('#squareFootage').value = listing.squareFootage || '';
        this.querySelector('#lotSize').value = listing.lotSize || '';
        this.querySelector('#totalRooms').value = listing.totalRooms || '';
        this.querySelector('#garageSpaces').value = listing.garageSpaces || '';
        
        // Pricing
        this.querySelector('#price').value = listing.price || '';
        this.querySelector('#currency').value = listing.currency || 'USD';
        this.querySelector('#hoaFee').value = listing.hoaFee || '';
        this.querySelector('#propertyTax').value = listing.propertyTax || '';
        this.querySelector('#priceValidUntil').value = listing.priceValidUntil || '';
        
        // Images
        this.currentThumbnail = listing.thumbnailImage;
        this.currentGallery = listing.galleryImages || [];
        this.currentSeoOgImage = listing.seoOgImage;
        
        // Show existing thumbnail
        if (listing.thumbnailImage) {
            this.showExistingImage(listing.thumbnailImage, 'thumbnailPreview', 'thumbnail');
        }
        
        // Show existing gallery
        if (listing.galleryImages && listing.galleryImages.length > 0) {
            listing.galleryImages.forEach((img, index) => {
                this.showExistingImage(img, 'galleryPreview', 'gallery', index);
            });
        }
        
        // Show existing SEO OG image
        if (listing.seoOgImage) {
            this.showExistingImage(listing.seoOgImage, 'seoOgImagePreview', 'seoOgImage');
        }
        
        // Checkboxes
        const checkboxes = [
            'isFeatured', 'isNewConstruction', 'isForeclosure', 'isShortSale',
            'isPriceReduced', 'isOpenHouse', 'isVirtualTour', 'hasPool', 'hasGarage',
            'hasBasement', 'hasAttic', 'hasFireplace', 'hasBalcony', 'hasGarden',
            'hasSecurity', 'hasAirConditioning', 'hasHeating', 'hasWasherDryer',
            'hasDishwasher', 'hasUpdatedKitchen', 'hasUpdatedBathroom', 'hasHardwoodFloors',
            'hasWalkInCloset', 'hasMasterSuite', 'hasLaundryRoom', 'hasPantry',
            'hasOffice', 'hasGym', 'hasWinecellar', 'hasElevator', 'hasSolarPanels',
            'hasSmartHome', 'hasWaterfront', 'hasGolfCourse', 'hasMountainView',
            'hasCityView', 'hasOceanView', 'hasPrivateBeach', 'hasBoatDock',
            'hasGuestHouse', 'hasInLawSuite', 'hasGatedCommunity', 'hasClubhouse',
            'hasPlayground', 'hasTennisaccess', 'hasPetFriendly', 'hasHandicapAccessible',
            'hasRentToOwn'
        ];
        
        checkboxes.forEach(id => {
            const checkbox = this.querySelector(`#${id}`);
            if (checkbox) {
                checkbox.checked = listing[id] || false;
            }
        });
        
        // Additional details
        this.querySelector('#architecture').value = listing.architecture || '';
        this.querySelector('#heating').value = listing.heating || '';
        this.querySelector('#cooling').value = listing.cooling || '';
        this.querySelector('#flooring').value = listing.flooring || '';
        this.querySelector('#schoolDistrict').value = listing.schoolDistrict || '';
        this.querySelector('#zoning').value = listing.zoning || '';
        this.querySelector('#daysOnMarket').value = listing.daysOnMarket || '';
        
        // SEO
        this.querySelector('#seoTitle').value = listing.seoTitle || '';
        this.querySelector('#seoDescription').value = listing.seoDescription || '';
        this.querySelector('#seoKeywords').value = listing.seoKeywords || '';
    }
    
    showExistingImage(imageUrl, containerId, type, index = null) {
        const container = this.querySelector(`#${containerId}`);
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-preview-item';
        imageItem.dataset.type = type;
        if (index !== null) {
            imageItem.dataset.index = index;
        }
        
        const img = document.createElement('img');
        img.src = imageUrl;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'image-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', () => {
            if (type === 'thumbnail') {
                this.currentThumbnail = null;
            } else if (type === 'gallery') {
                this.currentGallery = this.currentGallery.filter((_, i) => i !== index);
            } else if (type === 'seoOgImage') {
                this.currentSeoOgImage = null;
            }
            imageItem.remove();
        });
        
        imageItem.appendChild(img);
        imageItem.appendChild(deleteBtn);
        container.appendChild(imageItem);
    }
    
    handleThumbnailUpload(files) {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const preview = this.querySelector('#thumbnailPreview');
            preview.innerHTML = '';
            
            const imageItem = document.createElement('div');
            imageItem.className = 'image-preview-item';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'image-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.type = 'button';
            deleteBtn.addEventListener('click', () => {
                preview.innerHTML = '';
                this.querySelector('#thumbnailInput').value = '';
            });
            
            imageItem.appendChild(img);
            imageItem.appendChild(deleteBtn);
            preview.appendChild(imageItem);
        };
        
        reader.readAsDataURL(file);
    }
    
    handleGalleryUpload(files) {
        if (!files || files.length === 0) return;
        
        const preview = this.querySelector('#galleryPreview');
        
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-preview-item';
                imageItem.dataset.newImage = 'true';
                imageItem.dataset.index = preview.children.length;
                
                const img = document.createElement('img');
                img.src = e.target.result;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'image-delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.type = 'button';
                deleteBtn.addEventListener('click', () => {
                    imageItem.remove();
                });
                
                imageItem.appendChild(img);
                imageItem.appendChild(deleteBtn);
                preview.appendChild(imageItem);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    handleSeoOgImageUpload(files) {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const preview = this.querySelector('#seoOgImagePreview');
            preview.innerHTML = '';
            
            const imageItem = document.createElement('div');
            imageItem.className = 'image-preview-item';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'image-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.type = 'button';
            deleteBtn.addEventListener('click', () => {
                preview.innerHTML = '';
                this.querySelector('#seoOgImageInput').value = '';
            });
            
            imageItem.appendChild(img);
            imageItem.appendChild(deleteBtn);
            preview.appendChild(imageItem);
        };
        
        reader.readAsDataURL(file);
    }
    
    saveListing() {
        const formData = {
            title: this.querySelector('#title').value,
            slug: this.querySelector('#slug').value,
            description: this.querySelector('#description').value,
            
            // Address object structure
            location: {
                formatted: this.querySelector('#addressFormatted').value,
                location: {
                    latitude: parseFloat(this.querySelector('#addressLatitude').value),
                    longitude: parseFloat(this.querySelector('#addressLongitude').value)
                },
                city: this.querySelector('#addressCity').value || '',
                state: this.querySelector('#addressState').value || '',
                country: this.querySelector('#addressCountry').value || '',
                postalCode: this.querySelector('#addressPostalCode').value || ''
            },
            
            propertyType: this.querySelector('#propertyType').value,
            listingType: this.querySelector('#listingType').value,
            condition: this.querySelector('#condition').value,
            yearBuilt: this.querySelector('#yearBuilt').value,
            bedrooms: this.querySelector('#bedrooms').value,
            bathrooms: this.querySelector('#bathrooms').value,
            squareFootage: this.querySelector('#squareFootage').value,
            lotSize: this.querySelector('#lotSize').value,
            totalRooms: this.querySelector('#totalRooms').value,
            garageSpaces: this.querySelector('#garageSpaces').value,
            price: this.querySelector('#price').value,
            currency: this.querySelector('#currency').value,
            hoaFee: this.querySelector('#hoaFee').value,
            propertyTax: this.querySelector('#propertyTax').value,
            priceValidUntil: this.querySelector('#priceValidUntil').value,
            
            // Checkboxes
            isFeatured: this.querySelector('#isFeatured').checked,
            isNewConstruction: this.querySelector('#isNewConstruction').checked,
            isForeclosure: this.querySelector('#isForeclosure').checked,
            isShortSale: this.querySelector('#isShortSale').checked,
            isPriceReduced: this.querySelector('#isPriceReduced').checked,
            isOpenHouse: this.querySelector('#isOpenHouse').checked,
            isVirtualTour: this.querySelector('#isVirtualTour').checked,
            hasPool: this.querySelector('#hasPool').checked,
            hasGarage: this.querySelector('#hasGarage').checked,
            hasBasement: this.querySelector('#hasBasement').checked,
            hasAttic: this.querySelector('#hasAttic').checked,
            hasFireplace: this.querySelector('#hasFireplace').checked,
            hasBalcony: this.querySelector('#hasBalcony').checked,
            hasGarden: this.querySelector('#hasGarden').checked,
            hasSecurity: this.querySelector('#hasSecurity').checked,
            hasAirConditioning: this.querySelector('#hasAirConditioning').checked,
            hasHeating: this.querySelector('#hasHeating').checked,
            hasWasherDryer: this.querySelector('#hasWasherDryer').checked,
            hasDishwasher: this.querySelector('#hasDishwasher').checked,
            hasUpdatedKitchen: this.querySelector('#hasUpdatedKitchen').checked,
            hasUpdatedBathroom: this.querySelector('#hasUpdatedBathroom').checked,
            hasHardwoodFloors: this.querySelector('#hasHardwoodFloors').checked,
            hasWalkInCloset: this.querySelector('#hasWalkInCloset').checked,
            hasMasterSuite: this.querySelector('#hasMasterSuite').checked,
            hasLaundryRoom: this.querySelector('#hasLaundryRoom').checked,
            hasPantry: this.querySelector('#hasPantry').checked,
            hasOffice: this.querySelector('#hasOffice').checked,
            hasGym: this.querySelector('#hasGym').checked,
            hasWinecellar: this.querySelector('#hasWinecellar').checked,
            hasElevator: this.querySelector('#hasElevator').checked,
            hasSolarPanels: this.querySelector('#hasSolarPanels').checked,
            hasSmartHome: this.querySelector('#hasSmartHome').checked,
            hasWaterfront: this.querySelector('#hasWaterfront').checked,
            hasGolfCourse: this.querySelector('#hasGolfCourse').checked,
            hasMountainView: this.querySelector('#hasMountainView').checked,
            hasCityView: this.querySelector('#hasCityView').checked,
            hasOceanView: this.querySelector('#hasOceanView').checked,
            hasPrivateBeach: this.querySelector('#hasPrivateBeach').checked,
            hasBoatDock: this.querySelector('#hasBoatDock').checked,
            hasGuestHouse: this.querySelector('#hasGuestHouse').checked,
            hasInLawSuite: this.querySelector('#hasInLawSuite').checked,
            hasGatedCommunity: this.querySelector('#hasGatedCommunity').checked,
            hasClubhouse: this.querySelector('#hasClubhouse').checked,
            hasPlayground: this.querySelector('#hasPlayground').checked,
            hasTennisaccess: this.querySelector('#hasTennisaccess').checked,
            hasPetFriendly: this.querySelector('#hasPetFriendly').checked,
            hasHandicapAccessible: this.querySelector('#hasHandicapAccessible').checked,
            hasRentToOwn: this.querySelector('#hasRentToOwn').checked,
            
            // Additional details
            architecture: this.querySelector('#architecture').value,
            heating: this.querySelector('#heating').value,
            cooling: this.querySelector('#cooling').value,
            flooring: this.querySelector('#flooring').value,
            schoolDistrict: this.querySelector('#schoolDistrict').value,
            zoning: this.querySelector('#zoning').value,
            daysOnMarket: this.querySelector('#daysOnMarket').value,
            
            // SEO
            seoTitle: this.querySelector('#seoTitle').value,
            seoDescription: this.querySelector('#seoDescription').value,
            seoKeywords: this.querySelector('#seoKeywords').value
        };
        
        // Get image data
        const imageData = {
            thumbnail: null,
            gallery: [],
            seoOgImage: null,
            existingThumbnail: this.currentThumbnail,
            existingGallery: this.currentGallery,
            existingSeoOgImage: this.currentSeoOgImage
        };
        
        // Get new thumbnail
        const thumbnailInput = this.querySelector('#thumbnailInput');
        if (thumbnailInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageData.thumbnail = {
                    data: e.target.result.split(',')[1],
                    filename: thumbnailInput.files[0].name,
                    mimeType: thumbnailInput.files[0].type
                };
                this.checkAndDispatchSave(formData, imageData);
            };
            reader.readAsDataURL(thumbnailInput.files[0]);
        } else {
            imageData.thumbnail = null;
        }
        
        // Get new gallery images
        const galleryInput = this.querySelector('#galleryInput');
        const newGalleryImages = Array.from(galleryInput.files);
        
        if (newGalleryImages.length > 0) {
            let loadedImages = 0;
            
            newGalleryImages.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageData.gallery.push({
                        data: e.target.result.split(',')[1],
                        filename: file.name,
                        mimeType: file.type
                    });
                    
                    loadedImages++;
                    if (loadedImages === newGalleryImages.length) {
                        this.checkAndDispatchSave(formData, imageData);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        
        // Get new SEO OG image
        const seoOgImageInput = this.querySelector('#seoOgImageInput');
        if (seoOgImageInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageData.seoOgImage = {
                    data: e.target.result.split(',')[1],
                    filename: seoOgImageInput.files[0].name,
                    mimeType: seoOgImageInput.files[0].type
                };
                this.checkAndDispatchSave(formData, imageData);
            };
            reader.readAsDataURL(seoOgImageInput.files[0]);
        }
        
        // Get related listings
        const relatedListings = [];
        this.querySelectorAll('.related-listing-card input[type="checkbox"]:checked').forEach(checkbox => {
            relatedListings.push(checkbox.value);
        });
        
        formData.relatedListings = relatedListings;
        
        // If no new images, dispatch immediately
        if (thumbnailInput.files.length === 0 && newGalleryImages.length === 0 && seoOgImageInput.files.length === 0) {
            this.dispatchSaveEvent(formData, imageData);
        }
    }
    
    checkAndDispatchSave(formData, imageData) {
        // This ensures all async file reads complete before dispatching
        const thumbnailInput = this.querySelector('#thumbnailInput');
        const galleryInput = this.querySelector('#galleryInput');
        const seoOgImageInput = this.querySelector('#seoOgImageInput');
        
        const thumbnailReady = thumbnailInput.files.length === 0 || imageData.thumbnail !== null;
        const galleryReady = galleryInput.files.length === 0 || imageData.gallery.length === galleryInput.files.length;
        const seoOgImageReady = seoOgImageInput.files.length === 0 || imageData.seoOgImage !== null;
        
        if (thumbnailReady && galleryReady && seoOgImageReady) {
            this.dispatchSaveEvent(formData, imageData);
        }
    }
    
    dispatchSaveEvent(formData, imageData) {
        this.dispatchEvent(new CustomEvent('save-listing', {
            detail: {
                formData,
                imageData,
                existingId: this.currentListing ? this.currentListing._id : null
            }
        }));
    }
    
    setListingData(listings) {
        const container = this.querySelector('#listingsContainer');
        container.innerHTML = '';
        
        if (!listings || listings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No listings found. Click "Add New Listing" to create one.</p>
                </div>
            `;
            return;
        }
        
        listings.forEach(listing => {
            const row = document.createElement('div');
            row.className = 'listing-row';
            
            const imageUrl = listing.thumbnailImage || 'https://via.placeholder.com/60';
            const price = listing.price ? `${listing.currency || '$'}${listing.price.toLocaleString()}` : 'N/A';
            const details = `${listing.bedrooms || 0} bed, ${listing.bathrooms || 0} bath`;
            
            row.innerHTML = `
                <div>
                    <img src="${imageUrl}" class="listing-image" alt="${listing.title}">
                </div>
                <div>
                    <div class="listing-title">${listing.title}</div>
                    <div class="listing-location">${listing.location?.formatted || listing.location || 'N/A'}</div>
                </div>
                <div>
                    <span class="badge ${listing.listingType === 'sale' ? 'badge-sale' : 'badge-rent'}">
                        ${listing.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                </div>
                <div>${price}</div>
                <div>${details}</div>
                <div class="action-buttons">
                    <button class="btn-small btn-edit" data-id="${listing._id}">✏️ Edit</button>
                    <button class="btn-small btn-delete" data-id="${listing._id}">🗑️ Delete</button>
                </div>
            `;
            
            // Edit button
            row.querySelector('.btn-edit').addEventListener('click', () => {
                this.openModal(listing);
            });
            
            // Delete button
            row.querySelector('.btn-delete').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete "${listing.title}"?`)) {
                    this.dispatchEvent(new CustomEvent('delete-listing', {
                        detail: {
                            id: listing._id,
                            title: listing.title
                        }
                    }));
                }
            });
            
            container.appendChild(row);
        });
    }
    
    setAllListingsForSelection(listings) {
        const container = this.querySelector('#relatedListingsContainer');
        container.innerHTML = '';
        
        if (!listings || listings.length === 0) {
            container.innerHTML = '<div class="loading">No listings available</div>';
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'related-listings-grid';
        
        listings.forEach(listing => {
            // Skip current listing
            if (this.currentListing && listing._id === this.currentListing._id) {
                return;
            }
            
            const card = document.createElement('div');
            card.className = 'related-listing-card';
            
            const isSelected = this.currentListing && 
                               this.currentListing.relatedProperties && 
                               this.currentListing.relatedProperties.includes(listing._id);
            
            if (isSelected) {
                card.classList.add('selected');
            }
            
            const imageUrl = listing.thumbnailImage || 'https://via.placeholder.com/200';
            const price = listing.price ? `${listing.currency || '$'}${listing.price.toLocaleString()}` : 'N/A';
            
            card.innerHTML = `
                <input type="checkbox" value="${listing._id}" ${isSelected ? 'checked' : ''}>
                <img src="${imageUrl}" class="related-listing-image" alt="${listing.title}">
                <div class="related-listing-title">${listing.title}</div>
                <div class="related-listing-location">${listing.location?.formatted || listing.location || 'N/A'}</div>
                <div class="related-listing-price">${price}</div>
            `;
            
            // Toggle selection on card click
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    card.classList.toggle('selected', checkbox.checked);
                }
            });
            
            // Toggle selection on checkbox change
            card.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                card.classList.toggle('selected', e.target.checked);
            });
            
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
    }
    
    setListingCounts(counts) {
        this.querySelector('#totalListings').textContent = counts.totalListings || 0;
        this.querySelector('#forSaleCount').textContent = counts.byListingType?.sale || 0;
        this.querySelector('#forRentCount').textContent = counts.byListingType?.rent || 0;
    }
    
    updateProgress(progress, message) {
        const container = this.querySelector('#progressBarContainer');
        const bar = this.querySelector('#progressBar');
        const messageEl = this.querySelector('#progressMessage');
        
        if (progress > 0 && progress < 100) {
            container.classList.add('active');
            bar.style.width = progress + '%';
            messageEl.textContent = message || '';
        } else {
            setTimeout(() => {
                container.classList.remove('active');
            }, 500);
        }
    }
    
    showNotification(type, message) {
        const notification = this.querySelector('#notification');
        notification.className = `notification ${type} show`;
        notification.textContent = message;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

customElements.define('real-estate-dashboard', RealEstateDashboard);
