class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;
        
        // Expanded color mappings: original -> new
        this.colorMappings = {
            '#222820': '#FFFFFF',
            '#424D3F': '#F0F0F0',
            '#787E76': '#C2C2C2',
            '#A3A9A1': '#6E6E6E',
            '#ECECEC': '#000000',
            '#B8C995': '#1A6AFF',
            // New color mappings
            '#618741': '#E0E0E0',  // medium-dark green -> light gray
            '#DAE4C7': '#2A2A2A',  // very light green -> dark gray
            '#E9F0DC': '#1A1A1A',  // very light green -> very dark gray
            '#5C654B': '#F8F8F8',  // dark green-brown -> very light gray
            '#798562': '#B0B0B0'   // medium green-gray -> medium-light gray
        };
        
        // Store original styles - using Map with element keys for better performance
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
        
        const handleToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.isToggled = !this.isToggled;
            this.updateToggleState();
            
            // Apply changes immediately for smooth experience
            requestAnimationFrame(() => {
                this.toggleColors();
            });
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
    
    // Convert any color format to hex - improved version
    colorToHex(color) {
        if (!color) return null;
        
        // Clean up the color string
        color = color.trim();
        
        // If already hex, normalize it
        if (color.startsWith('#')) {
            const hex = color.toUpperCase();
            // Handle 3-digit hex
            if (hex.length === 4) {
                return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            }
            return hex;
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
    
    // Check if a color is transparent or effectively invisible
    isTransparent(color) {
        if (!color) return true;
        
        const normalized = color.toLowerCase().replace(/\s/g, '');
        
        // Common transparent values
        const transparentValues = [
            'transparent',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.0)',
            'hsla(0,0%,0%,0)',
            'hsla(0,0%,0%,0.0)'
        ];
        
        if (transparentValues.includes(normalized)) return true;
        
        // Check for rgba/hsla with 0 alpha
        const alphaMatch = normalized.match(/(?:rgba|hsla)\([^,]+,[^,]+,[^,]+,\s*0(?:\.0+)?\s*\)/);
        return !!alphaMatch;
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
    
    // Apply color mapping with better pattern matching
    applyColorMapping(value, isReverse = false) {
        if (!value) return value;
        
        let newValue = value;
        const mappings = isReverse ? this.getReverseMappings() : this.colorMappings;
        
        Object.entries(mappings).forEach(([original, replacement]) => {
            // Convert original to all possible formats for comprehensive matching
            const originalRgb = this.hexToRgb(original);
            const replacementColor = replacement;
            
            if (originalRgb) {
                // Replace hex colors (case insensitive, with or without #)
                const hexPatterns = [
                    new RegExp(original, 'gi'),
                    new RegExp(original.substring(1), 'gi') // without #
                ];
                
                hexPatterns.forEach(pattern => {
                    newValue = newValue.replace(pattern, replacementColor);
                });
                
                // Replace RGB format
                const rgbPattern = new RegExp(
                    `rgb\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*\\)`, 
                    'gi'
                );
                newValue = newValue.replace(rgbPattern, replacementColor);
                
                // Replace RGBA format (preserve alpha)
                const rgbaPattern = new RegExp(
                    `rgba\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*,\\s*([^)]+)\\)`, 
                    'gi'
                );
                
                if (replacement.startsWith('#')) {
                    const replacementRgb = this.hexToRgb(replacement);
                    if (replacementRgb) {
                        newValue = newValue.replace(rgbaPattern, (match, alpha) => {
                            return `rgba(${replacementRgb.r}, ${replacementRgb.g}, ${replacementRgb.b}, ${alpha})`;
                        });
                    }
                }
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
        const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD'];
        if (skipTags.includes(element.tagName)) return false;
        if (element.getRootNode() !== document) return false;
        return true;
    }
    
    // More aggressive color matching for smoother experience
    shouldChangeColor(color) {
        if (!color || this.isTransparent(color)) return false;
        
        const hex = this.colorToHex(color);
        if (!hex) return false;
        
        // Check direct matches
        const allColors = [...Object.keys(this.colorMappings), ...Object.values(this.colorMappings)];
        return allColors.includes(hex);
    }
    
    toggleColors() {
        if (this.isToggled) {
            this.applyColorChanges();
        } else {
            this.revertColorChanges();
        }
    }
    
    applyColorChanges() {
        // Clear previous state
        this.revertColorChanges();
        
        const allElements = document.querySelectorAll('*');
        
        // Process elements in batches for smooth performance
        const processElement = (element) => {
            if (!this.shouldProcessElement(element)) return;
            
            const computedStyle = window.getComputedStyle(element);
            const originalStyles = {};
            let hasChanges = false;
            
            this.getColorProperties().forEach(property => {
                const computedValue = computedStyle[property];
                const currentInlineValue = element.style[property];
                
                // Skip transparent/empty values
                if (!computedValue || computedValue === 'none' || this.isTransparent(computedValue)) {
                    return;
                }
                
                // Check if we should change this color
                if (this.shouldChangeColor(computedValue)) {
                    // Store original inline style
                    originalStyles[property] = currentInlineValue || '';
                    
                    // Apply new color
                    const newValue = this.applyColorMapping(computedValue, false);
                    element.style[property] = newValue;
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                this.originalStyles.set(element, originalStyles);
                this.modifiedElements.add(element);
            }
        };
        
        // Process all elements
        allElements.forEach(processElement);
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'dark', isToggled: true }
        }));
    }
    
    revertColorChanges() {
        // Efficiently revert all changes
        this.modifiedElements.forEach(element => {
            const originalStyles = this.originalStyles.get(element);
            if (!originalStyles) return;
            
            Object.entries(originalStyles).forEach(([property, originalValue]) => {
                if (originalValue !== '') {
                    element.style[property] = originalValue;
                } else {
                    element.style.removeProperty(property);
                }
            });
        });
        
        // Clear tracking
        this.modifiedElements.clear();
        this.originalStyles.clear();
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'light', isToggled: false }
        }));
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
    
    // Force refresh - useful for dynamic content
    refresh() {
        if (this.isToggled) {
            this.applyColorChanges();
        }
    }
    
    // Get all configured colors for reference
    getColorMappings() {
        return { ...this.colorMappings };
    }
    
    // Clean up when element is removed
    disconnectedCallback() {
        this.revertColorChanges();
    }
}

// Register the custom element
customElements.define('color-toggle', ColorToggle);
