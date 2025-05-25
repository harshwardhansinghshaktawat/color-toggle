class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;
        this.colorMappings = {}; // Start empty to preserve original theme
        this.originalStyles = new Map();
        this.modifiedElements = new Set();
        this.render();
        this.attachEventListeners();
    }

    static get observedAttributes() {
        return ['options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'options' && newValue && newValue !== oldValue) {
            console.log('Received options:', newValue); // Debug
            try {
                const options = JSON.parse(newValue);
                this.updateColorMappings(options.originalColors, options.replacementColors);
                console.log('Updated colorMappings:', this.colorMappings); // Debug
                // Reapply colors if toggled
                if (this.isToggled) {
                    requestAnimationFrame(() => {
                        this.applyColorChanges();
                    });
                }
            } catch (e) {
                console.error('Error parsing options:', e);
            }
        }
    }

    updateColorMappings(originalColors, replacementColors) {
        this.colorMappings = {};
        if (originalColors && replacementColors) {
            const originalArray = originalColors.split(',').map(c => this.normalizeHex(c));
            const replacementArray = replacementColors.split(',').map(c => this.normalizeHex(c));
            originalArray.forEach((orig, index) => {
                if (orig && replacementArray[index]) {
                    this.colorMappings[orig] = replacementArray[index];
                }
            });
            console.log('Processed color mappings:', this.colorMappings); // Debug
        }
    }

    normalizeHex(color) {
        if (!color) return null;
        color = color.trim().toUpperCase();
        if (/^#[0-9A-F]{6}$/.test(color)) return color;
        if (/^#[0-9A-F]{3}$/.test(color)) {
            return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        }
        if (color.startsWith('rgb')) {
            const values = color.match(/\d+/g);
            if (values && values.length >= 3) {
                const r = parseInt(values[0]).toString(16).padStart(2, '0');
                const g = parseInt(values[1]).toString(16).padStart(2, '0');
                const b = parseInt(values[2]).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`.toUpperCase();
            }
        }
        return null;
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

        const handleToggle = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.isToggled = !this.isToggled;
            console.log('Toggled to:', this.isToggled ? 'Dark Mode' : 'Light Mode'); // Debug
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
        return this.normalizeHex(color);
    }

    isTransparent(color) {
        if (!color) return true;
        const normalized = color.toLowerCase().replace(/\s/g, '');
        const transparentValues = ['transparent', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.0)', 'hsla(0,0%,0%,0)', 'hsla(0,0%,0%,0.0)'];
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
            'fill',
            'stroke'
        ];
    }

    applyColorMapping(value, isReverse = false) {
        if (!value) return value;
        let newValue = value;
        const mappings = isReverse ? this.getReverseMappings() : this.colorMappings;

        Object.entries(mappings).forEach(([original, replacement]) => {
            newValue = newValue.replace(new RegExp(original, 'gi'), replacement);
            const originalRgb = this.hexToRgb(original);
            if (originalRgb) {
                const rgbPattern = new RegExp(
                    `rgb\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*\\)`,
                    'gi'
                );
                newValue = newValue.replace(rgbPattern, replacement);
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
        if (element === this || element.getRootNode() !== document) return false;
        return true;
    }

    shouldChangeColor(color) {
        if (!color || this.isTransparent(color)) return false;
        const hex = this.colorToHex(color);
        if (!hex) return false;
        return Object.keys(this.colorMappings).includes(hex);
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
                    console.log(`Changed ${property} on`, element, `from ${computedValue} to ${newValue}`); // Debug
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.originalStyles.set(element, originalStyles);
                this.modifiedElements.add(element);
            }
        };

        allElements.forEach(processElement);
        console.log('Applied color changes to', this.modifiedElements.size, 'elements'); // Debug
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
        console.log('Reverted color changes for', this.modifiedElements.size, 'elements'); // Debug
        this.modifiedElements.clear();
        this.originalStyles.clear();
    }

    disconnectedCallback() {
        this.revertColorChanges();
    }
}

customElements.define('color-toggle', ColorToggle);
