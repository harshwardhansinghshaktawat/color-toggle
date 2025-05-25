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
            try {
                const options = JSON.parse(newValue);
                this.updateColorMappings(options.originalColors, options.replacementColors);
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
            const originalArray = originalColors.split(',').map(c => c.trim().toUpperCase());
            const replacementArray = replacementColors.split(',').map(c => c.trim().toUpperCase());
            originalArray.forEach((orig, index) => {
                if (this.isValidHex(orig) && this.isValidHex(replacementArray[index])) {
                    this.colorMappings[orig] = replacementArray[index];
                }
            });
        }
    }

    isValidHex(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                .toggle-container {
                    background: transparent;
                    padding: 0;
                    cursor: pointer;
                }
                .toggle-switch {
                    position: relative;
                    width: 40px;
                    height: 20px;
                    background: transparent;
                    border: 1px solid #ccc;
                    border-radius: 20px;
                    transition: border-color 0.3s ease;
                    cursor: pointer;
                }
                .toggle-switch.active {
                    border-color: #4CAF50;
                }
                .toggle-slider {
                    position: absolute;
                    top: 1px;
                    left: 1px;
                    width: 16px;
                    height: 16px;
                    background: #4CAF50;
                    border-radius: 50%;
                    transition: transform 0.3s ease, background 0.3s ease;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                .toggle-switch.active .toggle-slider {
                    transform: translateX(20px);
                    background: #2196F3;
                }
            </style>
            <div class="toggle-container">
                <div class="toggle-switch" id="toggleSwitch">
                    <div class="toggle-slider"></div>
                </div>
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
        toggleSwitch.classList.toggle('active', this.isToggled);
    }

    colorToHex(color) {
        if (!color) return null;
        color = color.trim();
        if (color.startsWith('#')) {
            const hex = color.toUpperCase();
            if (hex.length === 4) {
                return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            }
            return hex.length === 7 ? hex : null;
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

    getAllWebsiteColors() {
        const colors = new Set();
        const elements = document.querySelectorAll('*');
        const colorProps = this.getColorProperties();

        // Check inline and computed styles for elements
        elements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            colorProps.forEach(prop => {
                const value = computedStyle[prop];
                if (value && !this.isTransparent(value)) {
                    const hex = this.colorToHex(value);
                    if (hex) colors.add(hex);
                }
            });
        });

        // Check CSS rules from stylesheets
        Array.from(document.styleSheets).forEach(sheet => {
            try {
                Array.from(sheet.cssRules).forEach(rule => {
                    if (rule.style) {
                        colorProps.forEach(prop => {
                            const value = rule.style[prop];
                            if (value && !this.isTransparent(value)) {
                                const hex = this.colorToHex(value);
                                if (hex) colors.add(hex);
                            }
                        });
                    }
                });
            } catch (e) {
                // Ignore cross-origin stylesheet errors
            }
        });

        return Array.from(colors);
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
        return !skipTags.includes(element.tagName) && element.getRootNode() === document;
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
            detail: { theme: 'dark' }
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
            detail: { theme: 'light' }
        }));
    }

    disconnectedCallback() {
        this.revertColorChanges();
    }
}

customElements.define('color-toggle', ColorToggle);
