// Import backend storage functions
import { getDarkModePreference, setDarkModePreference } from 'backend/darkModeStorage';

class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;
        this.isInitialized = false;
        
        // Color mappings: original -> new
        this.colorMappings = {
            '#222820': '#FFFFFF',
            '#424D3F': '#F0F0F0',
            '#787E76': '#C2C2C2',
            '#A3A9A1': '#6E6E6E',
            '#ECECEC': '#000000',
            '#B8C995': '#1A6AFF'
        };
        
        // Store original styles for reverting - using WeakMap for better performance
        this.originalStyles = new WeakMap();
        this.modifiedElements = new Set();
        
        this.render();
        this.attachEventListeners();
    }
    
    async connectedCallback() {
        // Load saved preference when element is added to DOM
        await this.loadSavedPreference();
    }
    
    async loadSavedPreference() {
        try {
            const savedDarkMode = await getDarkModePreference();
            this.isToggled = savedDarkMode;
            this.updateToggleState();
            
            // Apply the saved theme
            if (this.isToggled) {
                this.applyColorChanges();
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.warn('Could not load dark mode preference:', error);
            this.isInitialized = true;
        }
    }
    
    async savePreference() {
        try {
            await setDarkModePreference(this.isToggled);
        } catch (error) {
            console.warn('Could not save dark mode preference:', error);
        }
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: Arial, sans-serif;
                }
                
                .toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    user-select: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0.7;
                }
                
                .toggle-container.initialized {
                    opacity: 1;
                }
                
                .toggle-container:hover {
                    background: #e8e8e8;
                }
                
                .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 25px;
                    background: #ccc;
                    border-radius: 25px;
                    transition: background 0.3s ease;
                    cursor: pointer;
                }
                
                .toggle-switch.active {
                    background: #4CAF50;
                }
                
                .toggle-slider {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 21px;
                    height: 21px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .toggle-switch.active .toggle-slider {
                    transform: translateX(25px);
                }
                
                .toggle-label {
                    font-size: 14px;
                    color: #333;
                    font-weight: 500;
                }
                
                .status-indicator {
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                }
                
                .loading {
                    font-size: 12px;
                    color: #999;
                    font-style: italic;
                }
            </style>
            
            <div class="toggle-container" id="toggleContainer">
                <div class="toggle-switch" id="toggleSwitch">
                    <div class="toggle-slider"></div>
                </div>
                <div class="toggle-label">Theme Toggle</div>
                <div class="status-indicator" id="statusIndicator">
                    <span class="loading">Loading...</span>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        const toggleContainer = this.shadowRoot.getElementById('toggleContainer');
        
        const handleToggle = async (event) => {
            // Prevent multiple rapid clicks
            if (!this.isInitialized) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            // Toggle the state immediately
            this.isToggled = !this.isToggled;
            
            // Update UI immediately
            this.updateToggleState();
            
            // Apply/revert colors
            this.toggleColors();
            
            // Save preference asynchronously
            await this.savePreference();
        };
        
        // Use single event listener on container to avoid double-firing
        toggleContainer.addEventListener('click', handleToggle);
    }
    
    updateToggleState() {
        const toggleSwitch = this.shadowRoot.getElementById('toggleSwitch');
        const statusIndicator = this.shadowRoot.getElementById('statusIndicator');
        const toggleContainer = this.shadowRoot.getElementById('toggleContainer');
        
        // Mark as initialized
        if (this.isInitialized) {
            toggleContainer.classList.add('initialized');
        }
        
        if (this.isToggled) {
            toggleSwitch.classList.add('active');
            statusIndicator.innerHTML = 'Dark Mode';
        } else {
            toggleSwitch.classList.remove('active');
            statusIndicator.innerHTML = 'Light Mode';
        }
    }
    
    // Convert any color format to hex
    colorToHex(color) {
        if (!color) return null;
        
        // If already hex, normalize it
        if (color.startsWith('#')) {
            return color.toUpperCase();
        }
        
        // Handle rgb/rgba
        if (color.startsWith('rgb')) {
            const values = color.match(/\d+/g);
            if (values && values.length >= 3) {
                const r = parseInt(values[0]);
                const g = parseInt(values[1]);
                const b = parseInt(values[2]);
                return '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('').toUpperCase();
            }
        }
        
        return null;
    }
    
    // Check if a color is transparent
    isTransparent(color) {
        if (!color) return true;
        
        const transparentValues = [
            'transparent',
            'rgba(0, 0, 0, 0)',
            'rgba(0,0,0,0)',
            'hsla(0, 0%, 0%, 0)'
        ];
        
        if (transparentValues.includes(color.toLowerCase())) return true;
        
        // Check for rgba with 0 alpha
        const rgbaMatch = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*0\s*\)/);
        if (rgbaMatch) return true;
        
        // Check for hsla with 0 alpha
        const hslaMatch = color.match(/hsla\([^,]+,[^,]+,[^,]+,\s*0\s*\)/);
        if (hslaMatch) return true;
        
        return false;
    }
    
    // Get all style properties that might contain colors
    getColorProperties() {
        return [
            'color',
            'backgroundColor',
            'borderColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'outlineColor',
            'boxShadow',
            'textShadow',
            'fill',
            'stroke'
        ];
    }
    
    // Apply color mapping to a property value
    applyColorMapping(value, isReverse = false) {
        if (!value) return value;
        
        let newValue = value;
        const mappings = isReverse ? this.getReverseMappings() : this.colorMappings;
        
        Object.entries(mappings).forEach(([original, replacement]) => {
            // Replace hex colors (case insensitive)
            const hexRegex = new RegExp(original.replace('#', '#'), 'gi');
            newValue = newValue.replace(hexRegex, replacement);
            
            // Convert to RGB and replace those too
            const originalRgb = this.hexToRgb(original);
            const replacementRgb = this.hexToRgb(replacement);
            
            if (originalRgb && replacementRgb) {
                // Match exact RGB values
                const rgbPattern = `rgb\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*\\)`;
                const rgbaPattern = `rgba\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*,\\s*([^)]+)\\)`;
                
                newValue = newValue.replace(new RegExp(rgbPattern, 'gi'), 
                    `rgb(${replacementRgb.r}, ${replacementRgb.g}, ${replacementRgb.b})`);
                
                newValue = newValue.replace(new RegExp(rgbaPattern, 'gi'), (match, alpha) => {
                    return `rgba(${replacementRgb.r}, ${replacementRgb.g}, ${replacementRgb.b}, ${alpha})`;
                });
            }
        });
        
        return newValue;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    getReverseMappings() {
        const reverse = {};
        Object.entries(this.colorMappings).forEach(([key, value]) => {
            reverse[value] = key;
        });
        return reverse;
    }
    
    // Check if element should be processed
    shouldProcessElement(element) {
        // Skip script, style, and our own shadow DOM
        const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD'];
        if (skipTags.includes(element.tagName)) return false;
        
        // Skip if inside our shadow DOM
        if (element.getRootNode() !== document) return false;
        
        return true;
    }
    
    // Check if a color matches any of our target colors
    isTargetColor(color) {
        if (!color || this.isTransparent(color)) return false;
        
        const hex = this.colorToHex(color);
        if (!hex) return false;
        
        return Object.keys(this.colorMappings).includes(hex) || 
               Object.values(this.colorMappings).includes(hex);
    }
    
    toggleColors() {
        if (this.isToggled) {
            this.applyColorChanges();
        } else {
            this.revertColorChanges();
        }
    }
    
    applyColorChanges() {
        // Clear previous modifications
        this.revertColorChanges();
        
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            if (!this.shouldProcessElement(element)) return;
            
            const computedStyle = window.getComputedStyle(element);
            let hasChanges = false;
            const changedProperties = {};
            
            this.getColorProperties().forEach(property => {
                const computedValue = computedStyle[property];
                const inlineValue = element.style[property];
                
                // Skip if transparent or empty
                if (!computedValue || computedValue === 'none' || this.isTransparent(computedValue)) {
                    return;
                }
                
                // Check if this color should be changed
                if (this.isTargetColor(computedValue)) {
                    // Store the original inline style (might be empty)
                    changedProperties[property] = inlineValue || '';
                    
                    // Apply new color
                    const newValue = this.applyColorMapping(computedValue, false);
                    element.style[property] = newValue;
                    hasChanges = true;
                }
            });
            
            // Store original styles for this element
            if (hasChanges) {
                this.originalStyles.set(element, changedProperties);
                this.modifiedElements.add(element);
            }
        });
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'dark', isToggled: true }
        }));
    }
    
    revertColorChanges() {
        // Revert all modified elements
        this.modifiedElements.forEach(element => {
            const originalStyles = this.originalStyles.get(element);
            if (!originalStyles) return;
            
            Object.entries(originalStyles).forEach(([property, originalValue]) => {
                if (originalValue) {
                    // Restore original inline style
                    element.style[property] = originalValue;
                } else {
                    // Remove the property if it wasn't originally set inline
                    element.style.removeProperty(property);
                }
            });
        });
        
        // Clear tracking
        this.modifiedElements.clear();
        this.originalStyles = new WeakMap();
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'light', isToggled: false }
        }));
    }
    
    // Public methods for external control
    async setTheme(theme) {
        if (theme === 'dark' && !this.isToggled) {
            this.isToggled = true;
            this.updateToggleState();
            this.applyColorChanges();
            await this.savePreference();
        } else if (theme === 'light' && this.isToggled) {
            this.isToggled = false;
            this.updateToggleState();
            this.revertColorChanges();
            await this.savePreference();
        }
    }
    
    getTheme() {
        return this.isToggled ? 'dark' : 'light';
    }
    
    // Force refresh - useful if DOM changes after initialization
    refresh() {
        if (this.isToggled) {
            this.applyColorChanges();
        }
    }
    
    // Check if the component is ready
    isReady() {
        return this.isInitialized;
    }
    
    // Clean up when element is removed
    disconnectedCallback() {
        this.revertColorChanges();
    }
}

// Register the custom element
customElements.define('color-toggle', ColorToggle);
