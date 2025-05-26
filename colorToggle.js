class ColorToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isToggled = false;
        this.colorMappings = {};
        this.themeColors = {
            original: { background: '#f5f5f5', accent: '#4CAF50' },
            replacement: { background: '#2a2a2a', accent: '#66bb6a' }
        };
        this.originalStyles = new Map();
        this.originalCSSVariables = new Map();
        this.modifiedElements = new Set();
        this.processedStyleSheets = new Set();
        this.observer = null;

        // Initialize debounceApplyTheme in constructor
        this.debounceApplyTheme = (() => {
            let timeout;
            return () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    requestAnimationFrame(() => {
                        // Save scroll position before applying theme
                        const scrollY = window.scrollY;
                        this.toggleColors();
                        // Restore scroll position
                        window.scrollTo(0, scrollY);
                    });
                }, 150); // Increased to 150ms to reduce scroll interference
            };
        })();

        this.render();
        this.attachEventListeners();
    }

    static get observedAttributes() {
        return ['options', 'default-dark'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'options' && newValue && newValue !== oldValue) {
            try {
                const options = JSON.parse(newValue);
                this.updateColorMappings(options.originalColors, options.replacementColors);
                if (this.isToggled) {
                    this.debounceApplyTheme();
                }
            } catch (e) {
                console.error('Error parsing options:', e);
            }
        } else if (name === 'default-dark') {
            const isToggled = newValue === 'true' || localStorage.getItem('colorTheme') === 'true';
            this.isToggled = isToggled;
            this.updateToggleState();
            this.debounceApplyTheme();
        }
    }

    connectedCallback() {
        const isToggled = localStorage.getItem('colorTheme') === 'true' || this.getAttribute('default-dark') === 'true';
        this.isToggled = isToggled;
        this.updateToggleState();
        this.debounceApplyTheme();
        this.setupMutationObserver();
        this.setupNavigationListeners();
    }

    disconnectedCallback() {
        this.revertColorChanges();
        if (this.observer) {
            this.observer.disconnect();
        }
        window.removeEventListener('popstate', this.handleNavigation);
        window.removeEventListener('hashchange', this.handleNavigation);
        window.removeEventListener('wixNavigation', this.handleNavigation);
    }

    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            if (this.isToggled) {
                this.debounceApplyTheme();
            }
        });
        // Limit observation to Blog container if available
        const blogContainer = document.querySelector('[data-hook*="blog"]') || document.body;
        this.observer.observe(blogContainer, {
            childList: true,
            subtree: true,
        });
    }

    setupNavigationListeners() {
        this.handleNavigation = () => {
            this.debounceApplyTheme();
        };
        window.addEventListener('popstate', this.handleNavigation);
        window.addEventListener('hashchange', this.handleNavigation);
        window.addEventListener('wixNavigation', this.handleNavigation);
    }

    updateColorMappings(originalColors, replacementColors) {
        this.colorMappings = {};
        this.themeColors = {
            original: { background: '#f5f5f5', accent: '#4CAF50' },
            replacement: { background: '#2a2a2a', accent: '#66bb6a' }
        };
        
        if (originalColors && replacementColors) {
            const originalArray = originalColors.split(',').map(c => c.trim().toUpperCase());
            const replacementArray = replacementColors.split(',').map(c => c.trim().toUpperCase());
            
            if (originalArray.length >= 1 && this.isValidHex(originalArray[0])) {
                this.themeColors.original.background = originalArray[0];
            }
            if (originalArray.length >= 6 && this.isValidHex(originalArray[5])) {
                this.themeColors.original.accent = originalArray[5];
            }
            if (replacementArray.length >= 1 && this.isValidHex(replacementArray[0])) {
                this.themeColors.replacement.background = replacementArray[0];
            }
            if (replacementArray.length >= 6 && this.isValidHex(replacementArray[5])) {
                this.themeColors.replacement.accent = replacementArray[5];
            }
            
            originalArray.forEach((orig, index) => {
                if (this.isValidHex(orig) && this.isValidHex(replacementArray[index])) {
                    this.colorMappings[orig] = replacementArray[index];
                }
            });
        }
        
        this.updateToggleDesign();
    }

    isValidHex(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-width: 60px;
                    min-height: 35px;
                    font-family: Arial, sans-serif;
                }
                .toggle-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    user-select: none;
                    cursor: pointer;
                }
                .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 25px;
                    background: var(--toggle-track, #ccc);
                    border-radius: 25px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .toggle-switch:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                .toggle-switch.active {
                    background: var(--toggle-track-active, #4CAF50);
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
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                .toggle-switch.active .toggle-slider {
                    transform: translateX(25px);
                }
            </style>
            <div class="toggle-container">
                <div class="toggle-switch" id="toggleSwitch" role="switch" aria-checked="false" tabindex="0">
                    <div class="toggle-slider"></div>
                </div>
            </div>
        `;
        
        this.updateToggleDesign();
    }

    attachEventListeners() {
        const toggleSwitch = this.shadowRoot.getElementById('toggleSwitch');
        const container = this.shadowRoot.querySelector('.toggle-container');

        const handleToggle = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.isToggled = !this.isToggled;
            try {
                localStorage.setItem('colorTheme', this.isToggled);
            } catch (e) {
                console.error('localStorage error:', e);
            }
            this.updateToggleState();
            this.debounceApplyTheme();
        };

        toggleSwitch.addEventListener('click', handleToggle);
        container.addEventListener('click', handleToggle);
        // Add keyboard support
        toggleSwitch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleToggle(event);
            }
        });
    }

    updateToggleState() {
        const toggleSwitch = this.shadowRoot.getElementById('toggleSwitch');
        toggleSwitch.classList.toggle('active', this.isToggled);
        toggleSwitch.setAttribute('aria-checked', this.isToggled);
        this.updateToggleDesign();
    }

    updateToggleDesign() {
        if (!this.shadowRoot) return;
        
        const toggleSwitch = this.shadowRoot.getElementById('toggleSwitch');
        if (!toggleSwitch) return;

        const currentTheme = this.isToggled ? this.themeColors.replacement : this.themeColors.original;
        const trackColor = this.adjustColorBrightness(currentTheme.background, -20);

        toggleSwitch.style.setProperty('--toggle-track', trackColor);
        toggleSwitch.style.setProperty('--toggle-track-active', currentTheme.accent);
    }

    adjustColorBrightness(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;

        const adjust = (color) => {
            const adjusted = Math.round(color + (color * percent / 100));
            return Math.max(0, Math.min(255, adjusted));
        };

        const newR = adjust(rgb.r);
        const newG = adjust(rgb.g);
        const newB = adjust(rgb.b);

        return '#' + [newR, newG, newB].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
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
            'columnRuleColor'
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

    containsTargetColors(value) {
        if (!value || this.isTransparent(value)) return false;

        const allColors = [...Object.keys(this.colorMappings), ...Object.values(this.colorMappings)];

        for (const color of allColors) {
            if (value.includes(color)) return true;

            const rgb = this.hexToRgb(color);
            if (rgb) {
                const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                const rgbPattern = new RegExp(`rgb\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*\\)`, 'i');
                if (value.match(rgbPattern)) return true;
            }
        }

        return false;
    }

    processCSSVariables() {
        const rootStyles = getComputedStyle(document.documentElement);
        const inlineRootStyle = document.documentElement.getAttribute('style') || '';

        if (!this.originalCSSVariables.has('root')) {
            const originalVars = {};
            
            for (let i = 0; i < rootStyles.length; i++) {
                const property = rootStyles[i];
                if (property.startsWith('--')) {
                    const value = rootStyles.getPropertyValue(property);
                    originalVars[property] = value;
                }
            }
            
            this.originalCSSVariables.set('root', {
                inlineStyle: inlineRootStyle,
                variables: originalVars
            });
        }

        for (let i = 0; i < rootStyles.length; i++) {
            const property = rootStyles[i];
            if (property.startsWith('--')) {
                const value = rootStyles.getPropertyValue(property);
                if (this.containsTargetColors(value)) {
                    const newValue = this.applyColorMapping(value, !this.isToggled);
                    document.documentElement.style.setProperty(property, newValue);
                }
            }
        }
    }

    processStyleSheets() {
        try {
            Array.from(document.styleSheets).forEach((styleSheet, index) => {
                try {
                    if (!styleSheet.href || styleSheet.href.includes(window.location.origin)) {
                        const sheetId = `stylesheet-${index}`;
                        if (!this.processedStyleSheets.has(sheetId)) {
                            Array.from(styleSheet.cssRules).forEach(rule => {
                                if (rule.style) {
                                    this.getColorProperties().forEach(property => {
                                        const value = rule.style.getPropertyValue(property);
                                        if (value && this.containsTargetColors(value)) {
                                            const newValue = this.applyColorMapping(value, !this.isToggled);
                                            rule.style.setProperty(property, newValue);
                                        }
                                    });
                                }
                            });
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
        this.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.isToggled ? 'dark' : 'light' }
        }));
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

            const originalInlineStyle = element.getAttribute('style') || '';
            originalStyles.inlineStyle = originalInlineStyle;

            this.getColorProperties().forEach(property => {
                const computedValue = computedStyle[property];
                const currentInlineValue = element.style[property];

                if (!computedValue || computedValue === 'none' || this.isTransparent(computedValue)) {
                    return;
                }

                if (this.containsTargetColors(computedValue)) {
                    originalStyles[property] = {
                        inline: currentInlineValue || '',
                        computed: computedValue
                    };
                    const newValue = this.applyColorMapping(computedValue, false);
                    element.style[property] = newValue;
                    hasChanges = true;
                }
            });

            if (element.tagName === 'svg' || element.closest('svg')) {
                ['fill', 'stroke'].forEach(attr => {
                    const attrValue = element.getAttribute(attr);
                    if (attrValue && this.containsTargetColors(attrValue)) {
                        if (!originalStyles.attributes) originalStyles.attributes = {};
                        originalStyles.attributes[attr] = attrValue;
                        const newValue = this.applyColorMapping(attrValue, false);
                        element.setAttribute(attr, newValue);
                        hasChanges = true;
                    }
                });
            }

            Array.from(element.attributes).forEach(attr => {
                if (attr.name.includes('color') && attr.value && this.containsTargetColors(attr.value)) {
                    if (!originalStyles.attributes) originalStyles.attributes = {};
                    originalStyles.attributes[attr.name] = attr.value;
                    const newValue = this.applyColorMapping(attr.value, false);
                    element.setAttribute(attr.name, newValue);
                    hasChanges = true;
                }
            });

            if (element.matches('[data-hook*="blog"], [class*="blog"], [id*="blog"]')) {
                this.getColorProperties().forEach(property => {
                    const computedValue = computedStyle[property];
                    if (computedValue && this.containsTargetColors(computedValue)) {
                        originalStyles[property] = originalStyles[property] || {
                            inline: element.style[property] || '',
                            computed: computedValue
                        };
                        const newValue = this.applyColorMapping(computedValue, false);
                        element.style[property] = newValue;
                        hasChanges = true;
                    }
                });
            }

            if (hasChanges) {
                this.originalStyles.set(element, originalStyles);
                this.modifiedElements.add(element);
            }
        });

        this.triggerDynamicElementUpdates();
    }

    revertColorChanges() {
        const rootOriginal = this.originalCSSVariables.get('root');
        if (rootOriginal) {
            if (rootOriginal.inlineStyle) {
                document.documentElement.setAttribute('style', rootOriginal.inlineStyle);
            } else {
                document.documentElement.removeAttribute('style');
            }
            
            Object.entries(rootOriginal.variables).forEach(([property, originalValue]) => {
                const currentValue = getComputedStyle(document.documentElement).getPropertyValue(property);
                if (this.containsTargetColors(currentValue) || this.containsTargetColors(originalValue)) {
                    if (originalValue) {
                        document.documentElement.style.setProperty(property, originalValue);
                    } else {
                        document.documentElement.style.removeProperty(property);
                    }
                }
            });
        }

        this.modifiedElements.forEach(element => {
            const originalStyles = this.originalStyles.get(element);
            if (!originalStyles) return;

            if (originalStyles.inlineStyle !== undefined) {
                if (originalStyles.inlineStyle) {
                    element.setAttribute('style', originalStyles.inlineStyle);
                } else {
                    element.removeAttribute('style');
                }
            }

            Object.entries(originalStyles).forEach(([property, originalValue]) => {
                if (property === 'attributes' || property === 'inlineStyle') return;

                if (typeof originalValue === 'object' && originalValue.inline !== undefined) {
                    if (originalValue.inline !== '') {
                        element.style[property] = originalValue.inline;
                    } else {
                        element.style.removeProperty(property);
                    }
                } else if (typeof originalValue === 'string') {
                    if (originalValue !== '') {
                        element.style[property] = originalValue;
                    } else {
                        element.style.removeProperty(property);
                    }
                }
            });

            if (originalStyles.attributes) {
                Object.entries(originalStyles.attributes).forEach(([attr, value]) => {
                    element.setAttribute(attr, value);
                });
            }
        });

        this.modifiedElements.clear();
        this.originalStyles.clear();
        this.originalCSSVariables.clear();
        this.processedStyleSheets.clear();

        this.triggerDynamicElementUpdates();
    }

    shouldProcessElement(element) {
        const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD'];
        if (skipTags.includes(element.tagName)) return false;
        if (element.getRootNode() !== document) return false;
        return true;
    }

    triggerDynamicElementUpdates() {
        // Removed display toggle to prevent scroll disruption
        // Instead, use requestAnimationFrame to ensure style updates
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new CustomEvent('colorThemeChanged', {
                detail: { isToggled: this.isToggled }
            }));

            const customElements = document.querySelectorAll('[data-color], [color], multi-axis-chart, [data-hook*="blog"], [class*="blog"], [id*="blog"]');
            customElements.forEach(el => {
                if (el.refresh && typeof el.refresh === 'function') {
                    el.refresh();
                }
                if (el.updateChart && typeof el.updateChart === 'function') {
                    el.updateChart();
                }
            });
        });
    }
}

customElements.define('color-toggle', ColorToggle);
