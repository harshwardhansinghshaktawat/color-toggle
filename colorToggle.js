class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;
        
        // Color mappings: original -> new
        this.colorMappings = {
            '#222820': '#FFFFFF',
            '#424D3F': '#F0F0F0',
            '#787E76': '#C2C2C2',
            '#A3A9A1': '#6E6E6E',
            '#ECECEC': '#000000',
            '#B8C995': '#1A6AFF'
        };
        
        // Store original styles for reverting
        this.originalStyles = new Map();
        this.modifiedElements = new Set();
        
        this.render();
        this.attachEventListeners();
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
            </style>
            
            <div class="toggle-container">
                <div class="toggle-switch" id="toggleSwitch">
                    <div class="toggle-slider"></div>
                </div>
                <div class="toggle-label">Theme Toggle</div>
                <div class="status-indicator" id="statusIndicator">Light Mode</div>
            </div>
        `;
    }
    
    attachEventListeners() {
        const toggleSwitch = this.shadowRoot.getElementById('toggleSwitch');
        const container = this.shadowRoot.querySelector('.toggle-container');
        
        const handleToggle = () => {
            this.isToggled = !this.isToggled;
            this.updateToggleState();
            this.toggleColors();
        };
        
        toggleSwitch.addEventListener('click', handleToggle);
        container.addEventListener('click', handleToggle);
    }
    
    updateToggleState() {
        const toggleSwitch = this.shadowRoot.getElementById('toggleSwitch');
        const statusIndicator = this.shadowRoot.getElementById('statusIndicator');
        
        if (this.isToggled) {
            toggleSwitch.classList.add('active');
            statusIndicator.textContent = 'Dark Mode';
        } else {
            toggleSwitch.classList.remove('active');
            statusIndicator.textContent = 'Light Mode';
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
        
        // Handle named colors by creating a temporary element
        const tempDiv = document.createElement('div');
        tempDiv.style.color = color;
        document.body.appendChild(tempDiv);
        const computedColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);
        
        if (computedColor.startsWith('rgb')) {
            return this.colorToHex(computedColor);
        }
        
        return null;
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
    
    // Extract colors from complex properties like box-shadow
    extractColorsFromProperty(value) {
        if (!value) return [];
        
        const colors = [];
        // Match hex colors
        const hexMatches = value.match(/#[0-9A-Fa-f]{6}/g);
        if (hexMatches) {
            colors.push(...hexMatches.map(color => color.toUpperCase()));
        }
        
        // Match rgb/rgba colors
        const rgbMatches = value.match(/rgba?\([^)]+\)/g);
        if (rgbMatches) {
            rgbMatches.forEach(rgb => {
                const hex = this.colorToHex(rgb);
                if (hex) colors.push(hex);
            });
        }
        
        return colors;
    }
    
    // Apply color mapping to a property value
    applyColorMapping(value, isReverse = false) {
        if (!value) return value;
        
        let newValue = value;
        const mappings = isReverse ? this.getReverseMappings() : this.colorMappings;
        
        Object.entries(mappings).forEach(([original, replacement]) => {
            // Replace hex colors
            newValue = newValue.replace(new RegExp(original, 'gi'), replacement);
            
            // Convert to RGB and replace those too
            const originalRgb = this.hexToRgb(original);
            const replacementRgb = this.hexToRgb(replacement);
            
            if (originalRgb && replacementRgb) {
                const rgbPattern = `rgb\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*\\)`;
                const rgbaPattern = `rgba\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*,\\s*[^)]+\\)`;
                
                newValue = newValue.replace(new RegExp(rgbPattern, 'gi'), 
                    `rgb(${replacementRgb.r}, ${replacementRgb.g}, ${replacementRgb.b})`);
                newValue = newValue.replace(new RegExp(rgbaPattern, 'gi'), (match) => {
                    const alphaMatch = match.match(/,\s*([^)]+)\)$/);
                    const alpha = alphaMatch ? alphaMatch[1] : '1';
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
        const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE'];
        if (skipTags.includes(element.tagName)) return false;
        
        // Skip if inside our shadow DOM
        if (element.getRootNode() !== document) return false;
        
        return true;
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
            const elementId = this.getElementId(element);
            let hasChanges = false;
            
            // Store original styles
            if (!this.originalStyles.has(elementId)) {
                this.originalStyles.set(elementId, {});
            }
            
            const originalStylesForElement = this.originalStyles.get(elementId);
            
            this.getColorProperties().forEach(property => {
                const currentValue = computedStyle[property];
                if (!currentValue || currentValue === 'none' || currentValue === 'transparent') return;
                
                // Check if this property contains any of our target colors
                const containsTargetColor = Object.keys(this.colorMappings).some(color => {
                    const hex = this.colorToHex(currentValue);
                    return hex === color || currentValue.includes(color);
                });
                
                if (containsTargetColor) {
                    // Store original value
                    originalStylesForElement[property] = element.style[property] || '';
                    
                    // Apply new color
                    const newValue = this.applyColorMapping(currentValue, false);
                    element.style[property] = newValue;
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                this.modifiedElements.add(elementId);
            }
        });
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'dark', isToggled: true }
        }));
    }
    
    revertColorChanges() {
        this.modifiedElements.forEach(elementId => {
            const element = this.getElementById(elementId);
            if (!element) return;
            
            const originalStyles = this.originalStyles.get(elementId);
            if (!originalStyles) return;
            
            Object.entries(originalStyles).forEach(([property, value]) => {
                if (value) {
                    element.style[property] = value;
                } else {
                    element.style.removeProperty(property);
                }
            });
        });
        
        this.modifiedElements.clear();
        this.originalStyles.clear();
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'light', isToggled: false }
        }));
    }
    
    getElementId(element) {
        // Create a unique identifier for each element
        if (element.id) return `#${element.id}`;
        
        let path = [];
        while (element && element !== document.body) {
            let selector = element.tagName.toLowerCase();
            if (element.className) {
                selector += '.' + element.className.split(' ').join('.');
            }
            path.unshift(selector);
            element = element.parentElement;
        }
        return path.join(' > ');
    }
    
    getElementById(elementId) {
        if (elementId.startsWith('#')) {
            return document.getElementById(elementId.substring(1));
        }
        return document.querySelector(elementId);
    }
    
    // Public methods for external control
    setTheme(theme) {
        if (theme === 'dark' && !this.isToggled) {
            this.isToggled = true;
            this.updateToggleState();
            this.applyColorChanges();
        } else if (theme === 'light' && this.isToggled) {
            this.isToggled = false;
            this.updateToggleState();
            this.revertColorChanges();
        }
    }
    
    getTheme() {
        return this.isToggled ? 'dark' : 'light';
    }
    
    // Clean up when element is removed
    disconnectedCallback() {
        this.revertColorChanges();
    }
}

// Register the custom element
customElements.define('color-toggle', ColorToggle);
