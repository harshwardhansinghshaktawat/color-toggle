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
        this.modifiedElements = new Set();
        this.observer = null;

        // Default color mappings for common Wix colors
        this.colorMappings = {
            '#FFFFFF': '#000000',  // White to Black
            '#000000': '#FFFFFF',  // Black to White  
            '#CDCDCD': '#333333',  // Light gray to dark gray
            '#323232': '#CDCDCD',  // Dark gray to light gray
            '#F5F5F5': '#1A1A1A',  // Very light gray to very dark gray
            '#E5E5E5': '#2A2A2A',  // Light gray to dark gray
            '#999999': '#666666',  // Medium gray to darker gray
            '#CCCCCC': '#444444',  // Light gray to dark gray
            '#DDDDDD': '#222222',  // Very light gray to very dark gray
            '#EEEEEE': '#111111',  // Almost white to almost black
            '#F0F0F0': '#0F0F0F',  // Very light gray to very dark gray
        };

        // Initialize debounceApplyTheme
        this.debounceApplyTheme = (() => {
            let timeout;
            return () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    requestAnimationFrame(() => {
                        const scrollY = window.scrollY;
                        this.toggleColors();
                        window.scrollTo(0, scrollY);
                    });
                }, 150);
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
                let shouldUpdate = false;
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        shouldUpdate = true;
                    }
                });
                if (shouldUpdate) {
                    this.debounceApplyTheme();
                }
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
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
        } else {
            // Default mappings if none provided
            this.colorMappings = {
                '#FFFFFF': '#000000',
                '#000000': '#FFFFFF',
                '#CDCDCD': '#333333',
                '#323232': '#CDCDCD',
                '#F5F5F5': '#1A1A1A',
                '#E5E5E5': '#2A2A2A',
                '#999999': '#666666',
                '#CCCCCC': '#444444',
                '#DDDDDD': '#222222',
                '#EEEEEE': '#111111',
                '#F0F0F0': '#0F0F0F',
            };
        }
        
        this.updateToggleDesign();
    }

    isValidHex(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    getWixTargetClasses() {
        return [
            'anchor-menu', 'anchor-menu__item', 'anchor-menu__label',
            'dropdown-menu', 'dropdown-menu__item', 'dropdown-menu__submenu',
            'horizontal-menu', 'horizontal-menu__item-label', 'horizontal-menu__item',
            'vertical-menu', 'vertical-menu__item', 'vertical-menu__item-label',
            'vertical-menu__submenu', 'vertical-menu__arrow',
            'accordion', 'accordion__title', 'accordion__container', 'accordion__item', 'accordion__icon',
            'image-button', 'language-menu', 'language-menu__option',
            'lightbox', 'lightbox__close-button',
            'horizontal-line', 'vertical-line',
            'search-bar', 'search-bar__icon', 'search-bar__input',
            'audio-player', 'box', 'breadcrumbs', 'breadcrumbs__item',
            'button__label', 'button__icon', 'button',
            'captcha', 'checkbox', 'checkbox-group', 'checkbox-group__label',
            'collapsible-text', 'collapsible-text__button',
            'column-strip', 'date-picker', 'date-picker__label', 'date-picker__input',
            'date-picker__icon', 'date-picker__header',
            'dropdown', 'dropdown__label', 'dropdown__icon', 'dropdown__input', 'dropdown__list',
            'footer', 'form', 'googlemap', 'header', 'image',
            'lottie-embed', 'multi-state-box', 'page',
            'pagination', 'pagination__navigation-button',
            'progress-bar', 'radio-button-group', 'radio-button-group__label',
            'radio-button-group__option', 'radio-button-group__input',
            'ratings-display__label', 'ratings-display', 'ratings-input', 'ratings-input__label',
            'repeater', 'rich-text-box', 'rich-text-box__input', 'rich-text-box__toolbar', 'rich-text-box__icon',
            'section', 'selection-tags', 'selection-tags__options',
            'signature-input', 'signature-input__label', 'signature-input__button', 'signature-input__input',
            'slideshow', 'switch', 'switch__label', 'switch__track', 'switch__handle',
            'table', 'table__row', 'table__header', 'table__cell', 'table__body', 'table__pagination',
            'tabs', 'tabs__menu-container', 'tabs__container', 'tabs__scroll-button', 'tabs__item',
            'rich-text', 'rich-text__text',
            'text-box', 'text-box__label', 'text-box__input',
            'text-input', 'text-input__label', 'text-input__input',
            'time-picker', 'time-picker__label', 'time-picker__input', 'time-picker__icon',
            'upload-button', 'upload-button__icon', 'upload-button__label', 'upload-button__field-title',
            'vector-image', 'video-box', 'video-player'
        ];
    }

    matchesWixClass(element) {
        const className = element.className;
        const tagName = element.tagName.toLowerCase();
        const id = element.id || '';
        
        // Check for specific Wix CSS classes
        if (className && typeof className === 'string') {
            const targetClasses = this.getWixTargetClasses();
            if (targetClasses.some(targetClass => className.includes(targetClass))) {
                return true;
            }
        }
        
        // Check for background/container elements
        if (this.isBackgroundContainer(element)) {
            return true;
        }
        
        // Check for Wix-specific patterns in class or id
        if (className && typeof className === 'string') {
            // Wix component patterns
            if (className.includes('wixui-') || 
                className.includes('comp-') || 
                className.includes('section') || 
                className.includes('container') ||
                className.includes('background') ||
                className.includes('strip') ||
                className.includes('layout')) {
                return true;
            }
        }
        
        if (id && typeof id === 'string') {
            // Wix ID patterns
            if (id.includes('comp-') || 
                id.includes('section') || 
                id.includes('container') ||
                id.includes('background')) {
                return true;
            }
        }
        
        // Check for semantic HTML elements that might be containers
        if (['section', 'header', 'footer', 'main', 'article', 'aside', 'div'].includes(tagName)) {
            // Only include if they have some styling that suggests they're layout elements
            const computedStyle = window.getComputedStyle(element);
            const bgColor = computedStyle.backgroundColor;
            if (bgColor && 
                bgColor !== 'rgba(0, 0, 0, 0)' && 
                bgColor !== 'transparent' && 
                bgColor !== 'initial' && 
                bgColor !== 'inherit') {
                return true;
            }
        }
        
        return false;
    }

    isBackgroundContainer(element) {
        const className = element.className;
        const id = element.id || '';
        
        if (typeof className === 'string') {
            // Common background/container class patterns
            const backgroundPatterns = [
                'background', 'bg-', 'container', 'wrapper', 'layout', 'strip',
                'section', 'row', 'col-', 'grid', 'flex', 'box', 'panel',
                'content', 'main', 'body', 'area', 'zone', 'region'
            ];
            
            if (backgroundPatterns.some(pattern => className.toLowerCase().includes(pattern))) {
                return true;
            }
        }
        
        if (typeof id === 'string') {
            const backgroundPatterns = ['bg', 'background', 'container', 'section', 'wrapper', 'layout'];
            if (backgroundPatterns.some(pattern => id.toLowerCase().includes(pattern))) {
                return true;
            }
        }
        
        return false;
    }

    isTransparent(color) {
        if (!color) return true;
        const normalized = color.toLowerCase().replace(/\s/g, '');
        const transparentValues = [
            'transparent', 'initial', 'inherit', 'unset',
            'rgba(0,0,0,0)', 'rgba(0,0,0,0.0)', 
            'hsla(0,0%,0%,0)', 'hsla(0,0%,0%,0.0)'
        ];
        if (transparentValues.includes(normalized)) return true;
        
        // Check for any rgba/hsla with 0 alpha
        const alphaMatch = normalized.match(/(?:rgba|hsla)\([^,]+,[^,]+,[^,]+,\s*0(?:\.0+)?\s*\)/);
        return !!alphaMatch;
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
                    z-index: 999999;
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
        if (!value) return false;

        const allColors = [...Object.keys(this.colorMappings), ...Object.values(this.colorMappings)];

        for (const color of allColors) {
            // Direct color match
            if (value.includes(color)) return true;
            if (value.includes(color.substring(1))) return true;

            const rgb = this.hexToRgb(color);
            if (rgb) {
                // RGB format match
                const rgbPattern = new RegExp(`rgb\\s*\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*\\)`, 'i');
                const rgbaPattern = new RegExp(`rgba\\s*\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*,`, 'i');
                if (value.match(rgbPattern) || value.match(rgbaPattern)) return true;
            }
        }

        // Check for CSS variables that might contain colors
        if (value.includes('var(--')) {
            const varMatches = value.match(/var\(--[^)]+\)/g);
            if (varMatches) {
                for (const varMatch of varMatches) {
                    const varName = varMatch.match(/--[^)]+/)[0];
                    const varValue = getComputedStyle(document.documentElement).getPropertyValue(varName);
                    if (varValue && this.containsTargetColors(varValue)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    applyColorMapping(value, isReverse = false) {
        if (!value) return value;
        let newValue = value;
        const mappings = isReverse ? this.getReverseMappings() : this.colorMappings;

        Object.entries(mappings).forEach(([original, replacement]) => {
            const originalRgb = this.hexToRgb(original);

            if (originalRgb) {
                // Handle hex patterns
                const hexPatterns = [
                    new RegExp(original, 'gi'),
                    new RegExp(original.substring(1), 'gi')
                ];
                hexPatterns.forEach(pattern => {
                    newValue = newValue.replace(pattern, replacement);
                });

                // Handle rgb patterns
                const rgbPattern = new RegExp(
                    `rgb\\s*\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*\\)`,
                    'gi'
                );
                newValue = newValue.replace(rgbPattern, replacement);

                // Handle rgba patterns
                const rgbaPattern = new RegExp(
                    `rgba\\s*\\(\\s*${originalRgb.r}\\s*,\\s*${originalRgb.g}\\s*,\\s*${originalRgb.b}\\s*,\\s*([^)]+)\\)`,
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

        // Handle CSS variables - replace var() calls with direct colors if they contain target colors
        if (newValue.includes('var(--')) {
            const varMatches = newValue.match(/var\(--[^)]+\)/g);
            if (varMatches) {
                varMatches.forEach(varMatch => {
                    const varName = varMatch.match(/--[^)]+/)[0];
                    const varValue = getComputedStyle(document.documentElement).getPropertyValue(varName);
                    if (varValue && this.containsTargetColors(varValue)) {
                        const mappedVarValue = this.applyColorMapping(varValue, isReverse);
                        newValue = newValue.replace(varMatch, mappedVarValue);
                    }
                });
            }
        }

        return newValue;
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

    isInteractiveElement(element) {
        const tagName = element.tagName.toLowerCase();
        const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label'];
        
        // Check if it's an interactive HTML element
        if (interactiveTags.includes(tagName)) {
            return true;
        }
        
        // Check for interactive attributes
        if (element.hasAttribute('onclick') || 
            element.hasAttribute('onmousedown') || 
            element.hasAttribute('onmouseup') ||
            element.hasAttribute('href') ||
            element.getAttribute('role') === 'button' ||
            element.getAttribute('role') === 'link' ||
            element.getAttribute('tabindex') !== null) {
            return true;
        }
        
        // Check for cursor pointer in computed styles
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.cursor === 'pointer') {
            return true;
        }
        
        // Check for common interactive class patterns
        const className = element.className;
        if (typeof className === 'string') {
            const interactivePatterns = [
                'btn', 'button', 'link', 'clickable', 'interactive', 
                'action', 'trigger', 'toggle', 'tab', 'menu-item'
            ];
            if (interactivePatterns.some(pattern => className.toLowerCase().includes(pattern))) {
                return true;
            }
        }
        
        return false;
    }

    applyColorChanges() {
        // Clear previous state
        this.revertColorChanges();

        // Process CSS variables first (important for Wix backgrounds)
        this.processCSSVariables();

        // Find all elements that match Wix target classes or are containers
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            if (element === this) return; // Skip the toggle itself
            
            // Process ALL elements, not just ones that match Wix classes - for better widget support
            const computedStyle = window.getComputedStyle(element);
            const originalStyles = {};
            let hasChanges = false;
            const isInteractive = this.isInteractiveElement(element);

            // Store original inline style
            originalStyles.inlineStyle = element.getAttribute('style') || '';

            // Expanded color properties including more background properties
            const colorProperties = [
                'color', 'backgroundColor', 'background', 'backgroundImage',
                'fill', 'stroke', 'borderColor', 'borderTopColor', 'borderRightColor', 
                'borderBottomColor', 'borderLeftColor', 'outlineColor', 'boxShadow'
            ];
            
            colorProperties.forEach(property => {
                const computedValue = computedStyle[property];
                const currentInlineValue = element.style[property];

                if (computedValue && this.containsTargetColors(computedValue)) {
                    originalStyles[property] = {
                        inline: currentInlineValue || '',
                        computed: computedValue
                    };
                    const newValue = this.applyColorMapping(computedValue, false);
                    element.style[property] = newValue;
                    hasChanges = true;
                }
            });

            // Ensure interactive elements maintain their functionality
            if (isInteractive && hasChanges) {
                // Preserve cursor style for interactive elements
                if (computedStyle.cursor === 'pointer' || element.style.cursor === 'pointer') {
                    element.style.cursor = 'pointer';
                }
                // Ensure pointer events are not disabled
                element.style.pointerEvents = 'auto';
                // Preserve user-select for buttons (but allow text selection for text elements)
                if (['button', 'a'].includes(element.tagName.toLowerCase()) || 
                    element.getAttribute('role') === 'button') {
                    element.style.userSelect = 'none';
                }
            }

            // Handle SVG attributes
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

            // Handle data attributes that might contain colors
            Array.from(element.attributes).forEach(attr => {
                if ((attr.name.includes('color') || attr.name.includes('background')) && 
                    attr.value && this.containsTargetColors(attr.value)) {
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
    }

    processCSSVariables() {
        // Process CSS variables on the root element (important for Wix themes)
        const rootStyles = getComputedStyle(document.documentElement);
        const originalRootStyle = document.documentElement.getAttribute('style') || '';
        
        if (!this.originalStyles.has(document.documentElement)) {
            this.originalStyles.set(document.documentElement, {
                inlineStyle: originalRootStyle
            });
        }

        // Get all CSS custom properties and check if they contain target colors
        for (let i = 0; i < rootStyles.length; i++) {
            const property = rootStyles[i];
            if (property.startsWith('--')) {
                const value = rootStyles.getPropertyValue(property);
                if (value && this.containsTargetColors(value)) {
                    const newValue = this.applyColorMapping(value, false);
                    document.documentElement.style.setProperty(property, newValue);
                }
            }
        }
    }

    revertColorChanges() {
        // Restore all modified elements to their exact original state
        this.modifiedElements.forEach(element => {
            if (!element.isConnected) return; // Skip if element was removed from DOM
            
            const originalStyles = this.originalStyles.get(element);
            if (!originalStyles) return;

            // Restore exact original inline style
            if (originalStyles.inlineStyle !== undefined) {
                if (originalStyles.inlineStyle) {
                    element.setAttribute('style', originalStyles.inlineStyle);
                } else {
                    element.removeAttribute('style');
                }
            }

            // Restore attributes (SVG and data attributes)
            if (originalStyles.attributes) {
                Object.entries(originalStyles.attributes).forEach(([attr, value]) => {
                    element.setAttribute(attr, value);
                });
            }
        });

        // Restore CSS variables on root element
        const rootOriginalStyles = this.originalStyles.get(document.documentElement);
        if (rootOriginalStyles) {
            if (rootOriginalStyles.inlineStyle) {
                document.documentElement.setAttribute('style', rootOriginalStyles.inlineStyle);
            } else {
                document.documentElement.removeAttribute('style');
            }
        }

        // Clear tracking
        this.modifiedElements.clear();
        this.originalStyles.clear();
    }

    // Debug method to see what elements are being processed
    debugProcessedElements() {
        const processed = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            if (element === this) return;
            
            const computedStyle = window.getComputedStyle(element);
            const hasTargetColors = this.containsTargetColors(computedStyle.backgroundColor) || this.containsTargetColors(computedStyle.color);
            
            if (hasTargetColors) {
                processed.push({
                    element: element,
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id,
                    backgroundColor: computedStyle.backgroundColor,
                    color: computedStyle.color,
                    isContainer: this.isBackgroundContainer(element),
                    matchesWixClass: this.matchesWixClass(element)
                });
            }
        });
        
        console.log('Elements with target colors:', processed);
        console.log('Total elements processed:', processed.length);
        return processed;
    }
}

customElements.define('color-toggle', ColorToggle);
