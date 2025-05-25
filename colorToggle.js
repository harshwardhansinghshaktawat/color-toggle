class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;
        
        // Start with empty color mappings - will be populated from panel
        this.colorMappings = {};
        
        // Store original styles
        this.originalStyles = new Map();
        this.modifiedElements = new Set();
        
        this.render();
        this.attachEventListeners();
    }
    
    static get observedAttributes() {
        return ['original-colors', 'replacement-colors'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue !== oldValue) {
            this.updateColorMappings();
            
            // If toggle is currently active, reapply changes with new mappings
            if (this.isToggled && Object.keys(this.colorMappings).length > 0) {
                this.applyColorChanges();
            }
        }
    }
    
    updateColorMappings() {
        this.colorMappings = {};
        
        const originalColors = this.getAttribute('original-colors');
        const replacementColors = this.getAttribute('replacement-colors');
        
        if (!originalColors || !replacementColors) {
            return;
        }
        
        const originals = originalColors.split(',').map(c => c.trim()).filter(c => c);
        const replacements = replacementColors.split(',').map(c => c.trim()).filter(c => c);
        
        // Create mappings from the two arrays - handle as many as user provides
        originals.forEach((original, index) => {
            if (original && replacements[index]) {
                // Normalize hex colors
                const normalizedOriginal = original.startsWith('#') ? original.toUpperCase() : `#${original.toUpperCase()}`;
                const normalizedReplacement = replacements[index].startsWith('#') ? 
                    replacements[index].toUpperCase() : `#${replacements[index].toUpperCase()}`;
                
                this.colorMappings[normalizedOriginal] = normalizedReplacement;
            }
        });
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
    
    colorToHex(color) {
        if (!color) return null;
        
        color = color.trim();
        
        if (color.startsWith('#')) {
            const hex = color.toUpperCase();
            if (hex.length === 4) {
                return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            }
            return hex;
        }
        
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
    
    isTransparent(color) {
        if (!color) return true;
        
        const normalized = color.toLowerCase().replace(/\s/g, '');
        const transparentValues = [
            'transparent',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.0)',
            'hsla(0,0%,0%,0)',
            'hsla(0,0%,0%,0.0)'
        ];
        
        if (transparentValues.includes(normalized)) return true;
        
        const alphaMatch = normalized.match(/(?:rgba|hsla)\([^,]+,[^,]+,[^,]+,\s*0(?:\.0+)?\s*\)/);
        return !!alphaMatch;
    }
    
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
    
    applyColorMapping(value, isReverse = false) {
        if (!value) return value;
        
        let newValue = value;
        const mappings = isReverse ? this.getReverseMappings() : this.colorMappings;
        
        Object.entries(mappings).forEach(([original, replacement]) => {
            const originalRgb = this.hexToRgb(original);
            const replacementColor = replacement;
            
            if (originalRgb) {
                const hexPatterns = [
                    new RegExp(original, 'gi'),
                    new RegExp(original.substring(1), 'gi')
                ];
                
                hexPatterns.forEach(pattern => {
                    newValue = newValue.replace(pattern, replacementColor);
                });
                
                const rgbPattern = new RegExp(
                    `rgb\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*\\)`, 
                    'gi'
                );
                newValue = newValue.replace(rgbPattern, replacementColor);
                
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
    
    shouldProcessElement(element) {
        const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD'];
        if (skipTags.includes(element.tagName)) return false;
        if (element.getRootNode() !== document) return false;
        return true;
    }
    
    shouldChangeColor(color) {
        if (!color || this.isTransparent(color)) return false;
        
        const hex = this.colorToHex(color);
        if (!hex) return false;
        
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
        this.revertColorChanges();
        
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            if (!this.shouldProcessElement(element)) return;
            
            const computedStyle = window.getComputedStyle(element);
            const originalStyles = {};
            let hasChanges = false;
            
            this.getColorProperties().forEach(property => {
                const computedValue = computedStyle[property];
                const currentInlineValue = element.style[property];
                
                if (!computedValue || computedValue === 'none' || this.isTransparent(computedValue)) {
                    return;
                }
                
                if (this.shouldChangeColor(computedValue)) {
                    originalStyles[property] = currentInlineValue || '';
                    
                    const newValue = this.applyColorMapping(computedValue, false);
                    element.style[property] = newValue;
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                this.originalStyles.set(element, originalStyles);
                this.modifiedElements.add(element);
            }
        });
    }
    
    revertColorChanges() {
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
        
        this.modifiedElements.clear();
        this.originalStyles.clear();
    }
    
    disconnectedCallback() {
        this.revertColorChanges();
    }
}

customElements.define('color-toggle', ColorToggle);
