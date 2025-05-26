class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;
        this.colorMappings = {}; // Start empty to preserve original theme
        this.originalStyles = new Map();
        this.modifiedElements = new Set();
        this.processedStyleSheets = new Set();
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
        const transparentValues = ['transparent', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.0)', 'hsla(0,0%,0%,0)', 'hsla(0,0%,0%,0.0)'];
        if (transparentValues.includes(normalized)) return true;
        const alphaMatch = normalized.match(/(?:rgba|hsla)\([^,]+,[^,]+,[^,]+,\s*0(?:\.0+)?\s*\)/);
        return !!alphaMatch;
    }

    getColorProperties() {
        return [
            'color',
            'backgroundColor',
            'backgroundImage',
            'borderColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'borderBlockStartColor',
            'borderBlockEndColor',
            'borderInlineStartColor',
            'borderInlineEndColor',
            'outlineColor',
            'boxShadow',
            'textShadow',
            'textDecorationColor',
            'caretColor',
            'accentColor',
            'fill',
            'stroke',
            'floodColor',
            'lightingColor',
            'stopColor',
            'columnRuleColor',
            'scrollbarColor',
            'borderImageSource',
            'maskImage',
            'clipPath',
            '--bg-gradient',
            '--bg-overlay-color',
            '--backgroundColor',
            '--borderColor',
            '--color',
            '--fill',
            '--stroke'
        ];
    }

    applyColorMapping(value, isReverse = false) {
        if (!value) return value;
        let newValue = value;
        const mappings = isReverse ? this.getReverseMappings() : this.colorMappings;

        Object.entries(mappings).forEach(([original, replacement]) => {
            const originalRgb = this.hexToRgb(original);
            const replacementRgb = this.hexToRgb(replacement);

            if (originalRgb && replacementRgb) {
                const hexPatterns = [
                    new RegExp(original, 'gi'),
                    new RegExp(original.substring(1), 'gi')
                ];
                hexPatterns.forEach(pattern => {
                    newValue = newValue.replace(pattern, replacement);
                });

                const rgbPattern = new RegExp(
                    `rgb\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*\\)`,
                    'gi'
                );
                newValue = newValue.replace(rgbPattern, replacement);

                const rgbaPattern = new RegExp(
                    `rgba\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*,\\s*([^)]+)\\)`,
                    'gi'
                );
                newValue = newValue.replace(rgbaPattern, (match, alpha) => {
                    return `rgba(${replacementRgb.r}, ${replacementRgb.g}, ${replacementRgb.b}, ${alpha})`;
                });

                const bareRgbPattern = new RegExp(
                    `\\b${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\b`,
                    'g'
                );
                newValue = newValue.replace(bareRgbPattern, `${replacementRgb.r},${replacementRgb.g},${replacementRgb.b}`);

                const rgbWithOpacityPattern = new RegExp(
                    `\\b${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*,\\s*([0-9]*\\.?[0-9]+)\\b`,
                    'g'
                );
                newValue = newValue.replace(rgbWithOpacityPattern, (match, opacity) => {
                    return `${replacementRgb.r},${replacementRgb.g},${replacementRgb.b},${opacity}`;
                });

                const originalHsl = this.hexToHsl(original);
                const replacementHsl = this.hexToHsl(replacement);
                if (originalHsl && replacementHsl) {
                    const hslPattern = new RegExp(
                        `hsl\\(\\s*${Math.round(originalHsl.h)}\\s*,\\s*${Math.round(originalHsl.s)}%\\s*,\\s*${Math.round(originalHsl.l)}%\\s*\\)`,
                        'gi'
                    );
                    newValue = newValue.replace(hslPattern,
                        `hsl(${Math.round(replacementHsl.h)}, ${Math.round(replacementHsl.s)}%, ${Math.round(replacementHsl.l)}%)`
                    );
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

    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return null;

        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }

    getReverseMappings() {
        const reverse = {};
        Object.entries(this.colorMappings).forEach(([key, value]) => {
            reverse[value] = key;
        });
        return reverse;
    }

    containsTargetColors(value) {
        if (!value || this.isTransparent(value)) return false;

        const allColors = [...Object.keys(this.colorMappings), ...Object.values(this.colorMappings)];

        for (const color of allColors) {
            if (value.includes(color)) return true;

            const rgb = this.hexToRgb(color);
            if (rgb) {
                const rgbPattern = new RegExp(`rgb\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*\\)`, 'i');
                if (value.match(rgbPattern)) return true;

                const rgbaPattern = new RegExp(`rgba\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*,`, 'i');
                if (value.match(rgbaPattern)) return true;

                const bareRgbPattern = new RegExp(`\\b${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\b`);
                if (value.match(bareRgbPattern)) return true;

                const rgbOpacityPattern = new RegExp(`\\b${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*,\\s*[0-9]*\\.?[0-9]+\\b`);
                if (value.match(rgbOpacityPattern)) return true;

                const hsl = this.hexToHsl(color);
                if (hsl) {
                    const hslPattern = new RegExp(
                        `hsl\\(\\s*${Math.round(hsl.h)}\\s*,\\s*${Math.round(hsl.s)}%\\s*,\\s*${Math.round(hsl.l)}%\\s*\\)`,
                        'i'
                    );
                    if (value.match(hslPattern)) return true;
                }
            }
        }

        return false;
    }

    processCSSVariables() {
        const rootStyles = getComputedStyle(document.documentElement);
        const inlineRootStyle = document.documentElement.getAttribute('style') || '';

        const cssVariables = [];
        for (let i = 0; i < rootStyles.length; i++) {
            const property = rootStyles[i];
            if (property.startsWith('--')) {
                const value = rootStyles.getPropertyValue(property).trim();
                if (this.containsTargetColors(value) || this.isColorLikeValue(value)) {
                    cssVariables.push({ property, value });
                }
            }
        }

        const wixColorPatterns = [
            /^--wix-color-\d+$/,
            /^--.*[Cc]olor.*$/,
            /^--.*[Bb]ackground.*$/,
            /^--.*[Bb]order.*$/,
            /^--.*[Ff]ill.*$/,
            /^--.*[Ss]troke.*$/,
            /^--bg-.*$/,
            /^--.*-rgb$/,
            /^--.*-opacity-and-color$/,
            /^--shc-mutated-brightness$/,
            /^--backgroundColor$/,
            /^--borderColor$/,
            /^--shadowColor$/
        ];

        const allComputedVars = Array.from(document.styleSheets)
            .flatMap(sheet => {
                try {
                    return Array.from(sheet.cssRules || []);
                } catch (e) {
                    return [];
                }
            })
            .filter(rule => rule.type === CSSRule.STYLE_RULE)
            .flatMap(rule => Array.from(rule.style))
            .filter(prop => prop.startsWith('--'))
            .filter(prop => wixColorPatterns.some(pattern => pattern.test(prop)));

        allComputedVars.forEach(property => {
            const value = rootStyles.getPropertyValue(property).trim();
            if (value && !cssVariables.some(v => v.property === property)) {
                if (this.isColorLikeValue(value)) {
                    cssVariables.push({ property, value });
                }
            }
        });

        if (cssVariables.length > 0 && !this.originalStyles.has(document.documentElement)) {
            this.originalStyles.set(document.documentElement, {
                style: inlineRootStyle,
                cssVariables: cssVariables.map(v => ({ ...v }))
            });
        }

        cssVariables.forEach(({ property, value }) => {
            const newValue = this.applyColorMapping(value, !this.isToggled);
            document.documentElement.style.setProperty(property, newValue);
        });
    }

    isColorLikeValue(value) {
        if (!value) return false;

        const colorPatterns = [
            /#([0-9a-f]{3}|[0-9a-f]{6})/i,
            /rgb\s*\(/i,
            /rgba\s*\(/i,
            /hsl\s*\(/i,
            /hsla\s*\(/i,
            /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/,
            /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*$/,
            /linear-gradient|radial-gradient/i,
            /transparent|currentcolor/i
        ];

        return colorPatterns.some(pattern => pattern.test(value)) ||
               this.containsTargetColors(value) ||
               this.isMutatedBrightnessValue(value);
    }

    isMutatedBrightnessValue(value) {
        const brightnessPattern = /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/;
        return brightnessPattern.test(value);
    }

    processStyleSheets() {
        try {
            Array.from(document.styleSheets).forEach((styleSheet, index) => {
                try {
                    if (!styleSheet.href || styleSheet.href.includes(window.location.origin)) {
                        const sheetId = `stylesheet-${index}`;
                        if (!this.processedStyleSheets.has(sheetId)) {
                            this.processedStyleSheets.add(sheetId);
                        }
                    }
                } catch (e) {
                    // Skip CORS-restricted stylesheets
                }
            });
        } catch (e) {
            // Skip stylesheet access errors
        }
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
        this.processCSSVariables();
        this.processStyleSheets();

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {
            if (!this.shouldProcessElement(element)) return;

            const computedStyle = window.getComputedStyle(element);
            const originalStyles = {};
            let hasChanges = false;

            // Store all computed styles for background properties to ensure full restoration
            this.getColorProperties().forEach(property => {
                const computedValue = computedStyle[property];
                const currentInlineValue = element.style[property] || '';

                if (!computedValue || computedValue === 'none' || this.isTransparent(computedValue)) {
                    return;
                }

                if (this.containsTargetColors(computedValue)) {
                    originalStyles[property] = computedValue; // Store computed value for accurate restoration
                    const newValue = this.applyColorMapping(computedValue, false);
                    element.style[property] = newValue;
                    hasChanges = true;
                }
            });

            // Store entire inline style string for complete restoration
            if (element.style && element.style.cssText) {
                const inlineStyle = element.style.cssText;
                if (this.containsTargetColors(inlineStyle)) {
                    originalStyles.inlineStyle = inlineStyle;
                    const newInlineStyle = this.applyColorMapping(inlineStyle, false);
                    element.style.cssText = newInlineStyle;
                    hasChanges = true;
                } else {
                    originalStyles.inlineStyle = inlineStyle; // Store even if no changes to ensure restoration
                }
            } else {
                originalStyles.inlineStyle = ''; // Store empty inline style if none exists
            }

            if (element.tagName === 'svg' || element.closest('svg')) {
                ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'].forEach(attr => {
                    const attrValue = element.getAttribute(attr);
                    if (attrValue && this.containsTargetColors(attrValue)) {
                        if (!originalStyles.attributes) originalStyles.attributes = {};
                        originalStyles.attributes[attr] = attrValue;
                        const newValue = this.applyColorMapping(attrValue, false);
                        element.setAttribute(attr, newValue);
                        hasChanges = true;
                    }
                });

                ['fill-opacity', 'stroke-opacity'].forEach(attr => {
                    const attrValue = element.getAttribute(attr);
                    if (attrValue && parseFloat(attrValue) === 0) {
                        return;
                    }
                });
            }

            Array.from(element.attributes).forEach(attr => {
                const colorAttrPatterns = [
                    /color/i,
                    /background/i,
                    /border/i,
                    /fill/i,
                    /stroke/i,
                    /shadow/i
                ];
                const isColorAttr = colorAttrPatterns.some(pattern => pattern.test(attr.name));
                if (isColorAttr && attr.value && this.containsTargetColors(attr.value)) {
                    if (!originalStyles.attributes) originalStyles.attributes = {};
                    originalStyles.attributes[attr.name] = attr.value;
                    const newValue = this.applyColorMapping(attr.value, false);
                    element.setAttribute(attr.name, newValue);
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.originalStyles.set(element, originalStyles);
                this.modifiedElements.add(element);
            }
        });

        this.triggerDynamicElementUpdates();

        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'dark' }
        }));
    }

    revertColorChanges() {
        this.modifiedElements.forEach(element => {
            const originalStyles = this.originalStyles.get(element);
            if (!originalStyles) return;

            // Restore individual CSS properties
            Object.entries(originalStyles).forEach(([property, originalValue]) => {
                if (property === 'attributes' || property === 'cssVariables' || property === 'style' || property === 'inlineStyle') return;

                if (originalValue && originalValue !== '') {
                    element.style[property] = originalValue;
                } else {
                    element.style.removeProperty(property);
                }
            });

            // Restore attributes
            if (originalStyles.attributes) {
                Object.entries(originalStyles.attributes).forEach(([attr, value]) => {
                    element.setAttribute(attr, value);
                });
            }

            // Restore entire inline style string
            if (originalStyles.inlineStyle !== undefined) {
                element.style.cssText = originalStyles.inlineStyle;
            } else {
                element.style.cssText = ''; // Clear inline styles if none originally
            }
        });

        // Restore CSS variables
        const rootOriginal = this.originalStyles.get(document.documentElement);
        if (rootOriginal) {
            if (rootOriginal.cssVariables) {
                rootOriginal.cssVariables.forEach(({ property, value }) => {
                    document.documentElement.style.setProperty(property, value);
                });
            }
            if (rootOriginal.style) {
                document.documentElement.setAttribute('style', rootOriginal.style);
            } else {
                document.documentElement.removeAttribute('style');
            }
        }

        this.modifiedElements.clear();
        this.originalStyles.clear();
        this.processedStyleSheets.clear();

        this.triggerDynamicElementUpdates();

        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'light' }
        }));
    }

    shouldProcessElement(element) {
        const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD'];
        if (skipTags.includes(element.tagName)) return false;
        if (element.getRootNode() !== document) return false;
        return true;
    }

    triggerDynamicElementUpdates() {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new CustomEvent('colorThemeChanged', {
            detail: { isToggled: this.isToggled }
        }));

        const customElements = document.querySelectorAll('[data-color], [color], multi-axis-chart');
        customElements.forEach(el => {
            if (el.refresh && typeof el.refresh === 'function') {
                el.refresh();
            }
            if (el.updateChart && typeof el.updateChart === 'function') {
                el.updateChart();
            }
        });
    }

    disconnectedCallback() {
        this.revertColorChanges();
    }
}

customElements.define('color-toggle', ColorToggle);
