class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;

        // Initialize color mappings with defaults
        this.colorMappings = {
            '#222820': '#FFFFFF',
            '#424D3F': '#F0F0F0',
            '#787E76': '#C2C2C2',
            '#A3A9A1': '#6E6E6E',
            '#ECECEC': '#000000',
            '#B8C995': '#1A6AFF',
            '#618741': '#E0E0E0',
            '#DAE4C7': '#2A2A2A',
            '#E9F0DC': '#1A1A1A',
            '#5C654B': '#F8F8F8',
            '#798562': '#B0B0B0',
            '#333333': '#CCCCCC',
            '#555555': '#AAAAAA',
            '#777777': '#888888',
            '#999999': '#666666',
            '#BBBBBB': '#444444',
            '#DDDDDD': '#222222',
            '#111111': '#EEEEEE',
            '#444444': '#BBBBBB',
            '#666666': '#999999'
        };

        this.originalStyles = new Map();
        this.modifiedElements = new Set();

        this.render();
        this.attachEventListeners();

        // Initialize colorMappings from attributes
        this.updateColorMappings();
    }

    static get observedAttributes() {
        const attributes = [];
        for (let i = 1; i <= 20; i++) {
            attributes.push(`original-color-${i}`);
            attributes.push(`replacement-color-${i}`);
        }
        return attributes;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            console.log(`Attribute ${name} changed to ${newValue}`); // Log attribute change
            this.updateColorMappings();
            if (this.isToggled) {
                this.refresh();
            }
        }
    }

    updateColorMappings() {
        // Clear existing mappings
        this.colorMappings = {};

        // Rebuild mappings from attributes
        for (let i = 1; i <= 20; i++) {
            const originalColor = this.getAttribute(`original-color-${i}`);
            const replacementColor = this.getAttribute(`replacement-color-${i}`);
            if (originalColor && replacementColor) {
                this.colorMappings[originalColor] = replacementColor;
            }
        }

        console.log('Updated colorMappings:', this.colorMappings); // Log updated mappings
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
            console.log('Toggle state:', this.isToggled ? 'Dark' : 'Light'); // Log toggle state
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
        toggleSwitch.classList.toggle('active', this.isToggled);
        statusIndicator.textContent = this.isToggled ? 'Dark Mode' : 'Light Mode';
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

        console.log(`Applying mapping to ${value} -> ${newValue}`); // Log color mapping
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
        console.log('Toggling colors with mappings:', this.colorMappings); // Log mappings on toggle
        if (this.isToggled) {
            this.applyColorChanges();
        } else {
            this.revertColorChanges();
        }
    }

    applyColorChanges() {
        this.revertColorChanges();
        const allElements = document.querySelectorAll('*');

        const processElement = (element) => {
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
        };

        allElements.forEach(processElement);

        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'dark', isToggled: true }
        }));
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

        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'light', isToggled: false }
        }));
    }

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

    refresh() {
        console.log('Refreshing theme with mappings:', this.colorMappings); // Log refresh
        if (this.isToggled) {
            this.applyColorChanges();
        }
    }

    getColorMappings() {
        return { ...this.colorMappings };
    }

    disconnectedCallback() {
        this.revertColorChanges();
    }
}

customElements.define('color-toggle', ColorToggle);
