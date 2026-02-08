(function () {
    'use strict';

    // Prevent duplicate registration
    if (customElements.get('theme-switcher')) {
        console.log('⚠️ theme-switcher already defined, skipping registration');
        return;
    }

    class ThemeSwitcherElement extends HTMLElement {
        constructor() {
            super();
            this.settings = {
                autoDetect: true,
                lightColors: [
                    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#212529',
                    '#343a40', '#495057', '#6c757d', '#adb5bd', '#ced4da'
                ],
                darkColors: [
                    '#1a1a1a', '#2d2d2d', '#1e1e1e', '#404040', '#e9ecef',
                    '#d0d0d0', '#b8b8b8', '#a0a0a0', '#606060', '#4a4a4a'
                ],
                currentTheme: 'light'
            };
            this.defaultTheme = 'light';
            this.observer = null;
            this.navigationObserver = null;
            this.isInitialized = false;
            this.themeChangeInProgress = false;
            this._pendingTimeout = null;
            this._reapplyTimeout = null;
            this._navigationTimeout = null;
            this._lastUrl = '';
        }

        connectedCallback() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize(), { once: true });
            } else {
                // Small delay for Wix environment readiness
                setTimeout(() => this.initialize(), 300);
            }
        }

        initialize() {
            if (this.isInitialized) return;
            this.isInitialized = true;

            this.render();

            this.waitForWixReady().then(() => {
                this.loadSavedTheme();
                this.applyCurrentTheme();
                this.setupMutationObserver();
                this.setupNavigationDetection();
            });
        }

        async waitForWixReady() {
            return new Promise((resolve) => {
                const check = () => {
                    const wixEl = document.querySelector('[id^="SITE"]') ||
                        document.querySelector('[data-hook]') ||
                        document.querySelector('[class*="wix"]');
                    if (wixEl && document.readyState === 'complete') {
                        setTimeout(resolve, 500);
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        }

        static get observedAttributes() {
            return ['settings'];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (newValue && newValue !== oldValue && name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    const themeChanged = (
                        JSON.stringify(newSettings.lightColors) !== JSON.stringify(this.settings.lightColors) ||
                        JSON.stringify(newSettings.darkColors) !== JSON.stringify(this.settings.darkColors)
                    );
                    Object.assign(this.settings, newSettings);
                    console.log('✅ Settings updated');

                    // If colors changed from panel, re-apply theme
                    if (themeChanged && this.isInitialized) {
                        this.applyCurrentTheme();
                    }
                } catch (e) {
                    console.error('❌ Failed to parse settings:', e);
                }
            }
        }

        render() {
            this.innerHTML = `
                <style>
                    theme-switcher {
                        display: flex !important;
                        height: 100% !important;
                        width: 100% !important;
                        justify-content: center !important;
                        align-items: center !important;
                        background: transparent !important;
                    }
                    .theme-switcher-container {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        padding: 8px 12px;
                        background: transparent;
                        border: 2px solid rgba(102, 126, 234, 0.3);
                        border-radius: 50px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        position: relative;
                    }
                    .theme-icon {
                        font-size: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 28px;
                        height: 28px;
                        user-select: none;
                    }
                    .toggle-switch {
                        position: relative;
                        width: 56px;
                        height: 28px;
                        display: inline-block;
                        cursor: pointer;
                    }
                    .toggle-input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                        position: absolute;
                    }
                    .toggle-slider {
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background-color: transparent;
                        border: 2px solid rgba(0, 0, 0, 0.2);
                        border-radius: 30px;
                        transition: all 0.3s ease;
                    }
                    .toggle-slider::before {
                        content: "";
                        position: absolute;
                        height: 20px;
                        width: 20px;
                        left: 3px;
                        bottom: 2px;
                        background-color: #FFD700;
                        border-radius: 50%;
                        transition: transform 0.3s ease, background-color 0.3s ease;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    .toggle-input:checked + .toggle-slider {
                        border-color: rgba(0, 0, 0, 0.3);
                    }
                    .toggle-input:checked + .toggle-slider::before {
                        transform: translateX(28px);
                        background-color: #4169E1;
                    }
                    .auto-badge {
                        position: absolute;
                        top: -8px; right: -8px;
                        background: #2ecc71;
                        color: white;
                        font-size: 8px;
                        font-weight: 700;
                        padding: 2px 6px;
                        border-radius: 8px;
                        box-shadow: 0 2px 6px rgba(46, 204, 113, 0.4);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                </style>
                <div class="theme-switcher-container">
                    ${this.settings.autoDetect ? '<span class="auto-badge">AUTO</span>' : ''}
                    <span class="theme-icon">☀️</span>
                    <label class="toggle-switch">
                        <input type="checkbox" class="toggle-input" id="themeToggle">
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="theme-icon">🌙</span>
                </div>
            `;
            this.setupToggleListener();
        }

        setupToggleListener() {
            const toggle = this.querySelector('#themeToggle');
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.settings.currentTheme = e.target.checked ? 'dark' : 'light';
                    try {
                        localStorage.setItem('themePreference', this.settings.currentTheme);
                    } catch (err) {
                        console.warn('⚠️ Could not save to localStorage:', err);
                    }
                    console.log('🎚️ Toggle clicked! New theme:', this.settings.currentTheme);
                    this.applyCurrentTheme();
                });
            }
        }

        // ─── NAVIGATION DETECTION ───────────────────────────────────────
        // This is the KEY fix: detect Wix SPA page transitions and re-apply theme

        setupNavigationDetection() {
            this._lastUrl = window.location.href;

            // Method 1: URL polling (most reliable for Wix SPA)
            this._urlPollInterval = setInterval(() => {
                if (window.location.href !== this._lastUrl) {
                    console.log('🔄 Navigation detected (URL change):', this._lastUrl, '→', window.location.href);
                    this._lastUrl = window.location.href;
                    this.onPageNavigation();
                }
            }, 200);

            // Method 2: Listen for popstate (back/forward navigation)
            window.addEventListener('popstate', () => {
                console.log('🔄 Navigation detected (popstate)');
                this.onPageNavigation();
            });

            // Method 3: Intercept pushState and replaceState
            const self = this;
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;

            history.pushState = function () {
                originalPushState.apply(this, arguments);
                console.log('🔄 Navigation detected (pushState)');
                self.onPageNavigation();
            };

            history.replaceState = function () {
                originalReplaceState.apply(this, arguments);
                // replaceState is often used for internal Wix state updates, not actual navigation
                // Only trigger if URL actually changed
                if (window.location.href !== self._lastUrl) {
                    console.log('🔄 Navigation detected (replaceState)');
                    self._lastUrl = window.location.href;
                    self.onPageNavigation();
                }
            };

            // Method 4: Watch for large-scale DOM changes indicating page swap
            this.navigationObserver = new MutationObserver((mutations) => {
                let addedCount = 0;
                for (const mutation of mutations) {
                    addedCount += mutation.addedNodes.length;
                }
                // If a large number of nodes were added at once, it's likely a page transition
                if (addedCount > 20) {
                    this.scheduleReapply('bulk-dom-change');
                }
            });

            // Observe only direct children of main content areas for navigation detection
            const mainContent = document.querySelector('#SITE_PAGES') ||
                document.querySelector('[id^="SITE"]') ||
                document.body;

            this.navigationObserver.observe(mainContent, {
                childList: true,
                subtree: true
            });
        }

        onPageNavigation() {
            if (this.settings.currentTheme === this.defaultTheme) return;

            console.log('📄 Page navigation detected — scheduling theme re-application');

            // Clear any existing navigation timeout
            clearTimeout(this._navigationTimeout);

            // Apply theme in multiple waves to catch elements as they render
            // Wave 1: Immediate (catch early elements)
            this._navigationTimeout = setTimeout(() => {
                this.applyCurrentTheme();
            }, 100);

            // Wave 2: After short delay (catch most Wix-rendered elements)
            setTimeout(() => {
                this.applyCurrentTheme();
            }, 500);

            // Wave 3: After longer delay (catch lazy-loaded elements like product pages, stores)
            setTimeout(() => {
                this.applyCurrentTheme();
            }, 1200);

            // Wave 4: Final safety net
            setTimeout(() => {
                this.applyCurrentTheme();
            }, 2500);
        }

        // ─── MUTATION OBSERVER FOR DYNAMIC ELEMENTS ─────────────────────

        setupMutationObserver() {
            this.observer = new MutationObserver((mutations) => {
                if (this.themeChangeInProgress) return;
                if (this.settings.currentTheme === this.defaultTheme) return;

                let hasNewElements = false;

                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        hasNewElements = true;
                        break;
                    }
                }

                if (hasNewElements) {
                    this.scheduleReapply('mutation');
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        scheduleReapply(source) {
            clearTimeout(this._reapplyTimeout);
            this._reapplyTimeout = setTimeout(() => {
                if (this.settings.currentTheme !== this.defaultTheme) {
                    console.log(`🔁 Re-applying theme (triggered by: ${source})`);
                    this.applyThemeToAllElements(this.settings.currentTheme === 'dark');
                }
            }, 150);
        }

        // ─── THEME LOADING ──────────────────────────────────────────────

        loadSavedTheme() {
            let savedTheme = null;
            try {
                savedTheme = localStorage.getItem('themePreference');
            } catch (e) {
                console.warn('⚠️ Could not access localStorage:', e);
            }

            if (savedTheme) {
                this.settings.currentTheme = savedTheme;
                console.log('📁 Loaded saved theme:', savedTheme);
            } else if (this.settings.autoDetect) {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.settings.currentTheme = prefersDark ? 'dark' : 'light';
                console.log('🌐 Using browser preference:', this.settings.currentTheme);
            }

            // Sync toggle state
            const toggle = this.querySelector('#themeToggle');
            if (toggle) {
                toggle.checked = (this.settings.currentTheme === 'dark');
            }
        }

        // ─── CORE THEME APPLICATION ─────────────────────────────────────
        // KEY CHANGE: Instead of storing "original" colors and mapping them,
        // we now do a LIVE read of each element's computed style at the time
        // of theme application. This eliminates the stale-color problem
        // during SPA navigation.

        applyCurrentTheme() {
            const isDefault = this.settings.currentTheme === this.defaultTheme;

            if (isDefault) {
                this.removeAllThemeOverrides();
                return;
            }

            const isDark = this.settings.currentTheme === 'dark';
            console.log(`🎨 Applying ${isDark ? 'DARK' : 'LIGHT'} mode`);

            // Set CSS custom properties
            const colors = isDark ? this.settings.darkColors : this.settings.lightColors;
            const root = document.documentElement;
            colors.forEach((color, index) => {
                root.style.setProperty(`--theme-color-${index + 1}`, color);
            });
            root.style.setProperty('--theme-bg', colors[0]);
            root.style.setProperty('--theme-text', colors[4]);
            root.setAttribute('data-theme', this.settings.currentTheme);

            // Apply to body
            document.body.style.setProperty('background-color', colors[0], 'important');
            document.body.style.setProperty('color', colors[4], 'important');

            // Apply to all elements
            this.applyThemeToAllElements(isDark);
        }

        applyThemeToAllElements(toDark) {
            this.themeChangeInProgress = true;

            requestAnimationFrame(() => {
                const allElements = document.querySelectorAll('*');
                let changedCount = 0;

                allElements.forEach(element => {
                    changedCount += this.processElementLive(element, toDark);
                });

                // Process shadow roots
                allElements.forEach(element => {
                    if (element.shadowRoot) {
                        this.processShadowRootLive(element.shadowRoot, toDark);
                    }
                });

                // Process iframes
                this.processAllIframes(toDark);

                console.log(`✅ Themed ${changedCount} elements`);

                this.themeChangeInProgress = false;
            });
        }

        // ─── LIVE ELEMENT PROCESSING ────────────────────────────────────
        // Reads the element's CURRENT computed style and converts colors.
        // No WeakMap storage needed — we read fresh every time.

        processElementLive(element, toDark) {
            // Skip our own toggle element
            if (element.closest('theme-switcher')) return 0;

            let changed = 0;

            try {
                const computed = window.getComputedStyle(element);

                // Background color
                const bgColor = computed.backgroundColor;
                if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                    // Check if this color is already a "target" color (already themed)
                    if (!this.isAlreadyThemedColor(bgColor, toDark)) {
                        const newBg = this.convertColor(bgColor, toDark);
                        if (newBg) {
                            element.style.setProperty('background-color', newBg, 'important');
                            changed++;
                        }
                    }
                }

                // Text color
                const textColor = computed.color;
                if (textColor) {
                    if (!this.isAlreadyThemedColor(textColor, toDark)) {
                        const newColor = this.convertColor(textColor, toDark);
                        if (newColor) {
                            element.style.setProperty('color', newColor, 'important');
                            changed++;
                        }
                    }
                }

                // Border colors
                ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'].forEach(prop => {
                    const borderColor = computed[prop];
                    if (borderColor && borderColor !== 'transparent' && borderColor !== 'rgba(0, 0, 0, 0)') {
                        if (!this.isAlreadyThemedColor(borderColor, toDark)) {
                            const newBorder = this.convertColor(borderColor, toDark);
                            if (newBorder) {
                                element.style.setProperty(
                                    prop.replace(/([A-Z])/g, '-$1').toLowerCase(),
                                    newBorder,
                                    'important'
                                );
                            }
                        }
                    }
                });

                // Fill and stroke (SVG)
                const fill = computed.fill;
                if (fill && fill !== 'none' && fill !== 'transparent') {
                    if (!this.isAlreadyThemedColor(fill, toDark)) {
                        const newFill = this.convertColor(fill, toDark);
                        if (newFill) element.style.fill = newFill;
                    }
                }

                const stroke = computed.stroke;
                if (stroke && stroke !== 'none' && stroke !== 'transparent') {
                    if (!this.isAlreadyThemedColor(stroke, toDark)) {
                        const newStroke = this.convertColor(stroke, toDark);
                        if (newStroke) element.style.stroke = newStroke;
                    }
                }

                // Gradients
                const bgImage = computed.backgroundImage;
                if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
                    const newGradient = this.convertGradient(bgImage, toDark);
                    if (newGradient && newGradient !== bgImage) {
                        element.style.backgroundImage = newGradient;
                    }
                }

                // Webkit text fill (gradient text)
                const textFill = computed.webkitTextFillColor || computed.getPropertyValue('-webkit-text-fill-color');
                if (textFill === 'transparent' && bgImage && bgImage.includes('gradient')) {
                    const newGradient = this.convertGradient(bgImage, toDark);
                    if (newGradient) {
                        element.style.backgroundImage = newGradient;
                        element.style.webkitBackgroundClip = 'text';
                        element.style.backgroundClip = 'text';
                    }
                }

            } catch (e) {
                // Element not accessible, skip
            }

            return changed;
        }

        /**
         * Check if a color is already one of the TARGET theme colors.
         * This prevents double-conversion (e.g., converting an already-dark color again).
         */
        isAlreadyThemedColor(colorString, toDark) {
            const parsed = this.parseColor(colorString);
            if (!parsed) return false;

            const targetColors = toDark ? this.settings.darkColors : this.settings.lightColors;

            for (const tc of targetColors) {
                const targetParsed = this.parseColor(tc);
                if (targetParsed && this.colorDistance(parsed, targetParsed) < 5) {
                    return true; // Already themed — skip
                }
            }

            return false;
        }

        processShadowRootLive(shadowRoot, toDark) {
            try {
                const elements = shadowRoot.querySelectorAll('*');
                elements.forEach(el => {
                    this.processElementLive(el, toDark);
                    if (el.shadowRoot) {
                        this.processShadowRootLive(el.shadowRoot, toDark);
                    }
                });
            } catch (e) {
                // Shadow root not accessible
            }
        }

        processAllIframes(toDark) {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc) {
                        const elements = iframeDoc.querySelectorAll('*');
                        elements.forEach(el => this.processElementLive(el, toDark));
                    }
                } catch (e) {
                    // Cross-origin iframe
                }
            });
        }

        // ─── RESTORE TO DEFAULT ─────────────────────────────────────────

        removeAllThemeOverrides() {
            console.log('🔄 Restoring default theme (removing all inline overrides)...');

            const root = document.documentElement;
            root.removeAttribute('data-theme');
            for (let i = 1; i <= 10; i++) {
                root.style.removeProperty(`--theme-color-${i}`);
            }
            root.style.removeProperty('--theme-bg');
            root.style.removeProperty('--theme-text');

            document.body.style.removeProperty('background-color');
            document.body.style.removeProperty('color');

            const allElements = document.querySelectorAll('*');
            allElements.forEach(element => {
                if (element.closest('theme-switcher')) return;
                try {
                    element.style.removeProperty('background-color');
                    element.style.removeProperty('color');
                    element.style.removeProperty('border-top-color');
                    element.style.removeProperty('border-right-color');
                    element.style.removeProperty('border-bottom-color');
                    element.style.removeProperty('border-left-color');
                    element.style.removeProperty('fill');
                    element.style.removeProperty('stroke');
                    element.style.removeProperty('background-image');
                    element.style.removeProperty('-webkit-text-fill-color');
                    element.style.removeProperty('-webkit-background-clip');
                    element.style.removeProperty('background-clip');
                } catch (e) { }
            });

            // Also restore shadow roots
            allElements.forEach(element => {
                if (element.shadowRoot) {
                    try {
                        element.shadowRoot.querySelectorAll('*').forEach(el => {
                            el.style.removeProperty('background-color');
                            el.style.removeProperty('color');
                            el.style.removeProperty('border-top-color');
                            el.style.removeProperty('border-right-color');
                            el.style.removeProperty('border-bottom-color');
                            el.style.removeProperty('border-left-color');
                            el.style.removeProperty('fill');
                            el.style.removeProperty('stroke');
                            el.style.removeProperty('background-image');
                            el.style.removeProperty('-webkit-text-fill-color');
                            el.style.removeProperty('-webkit-background-clip');
                            el.style.removeProperty('background-clip');
                        });
                    } catch (e) { }
                }
            });

            console.log('✅ Default theme restored');
        }

        // ─── COLOR UTILITIES ────────────────────────────────────────────

        parseColor(colorString) {
            if (!colorString || colorString === 'transparent' || colorString === 'none') {
                return null;
            }
            colorString = colorString.trim().toLowerCase();

            const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbMatch) {
                return {
                    r: parseInt(rgbMatch[1]),
                    g: parseInt(rgbMatch[2]),
                    b: parseInt(rgbMatch[3]),
                    a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
                };
            }

            if (colorString.startsWith('#')) {
                const hex = colorString.replace('#', '');
                const short = hex.length === 3;
                return {
                    r: parseInt(short ? hex[0] + hex[0] : hex.substring(0, 2), 16),
                    g: parseInt(short ? hex[1] + hex[1] : hex.substring(2, 4), 16),
                    b: parseInt(short ? hex[2] + hex[2] : hex.substring(4, 6), 16),
                    a: 1
                };
            }

            return null;
        }

        colorDistance(c1, c2) {
            return Math.sqrt(
                Math.pow(c1.r - c2.r, 2) +
                Math.pow(c1.g - c2.g, 2) +
                Math.pow(c1.b - c2.b, 2)
            );
        }

        findClosestColorIndex(targetColor, colorArray) {
            const target = this.parseColor(targetColor);
            if (!target) return -1;

            let minDistance = Infinity;
            let closestIndex = -1;

            colorArray.forEach((color, index) => {
                const parsed = this.parseColor(color);
                if (parsed) {
                    const dist = this.colorDistance(target, parsed);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestIndex = index;
                    }
                }
            });

            return closestIndex;
        }

        convertColor(colorString, toDark) {
            const parsed = this.parseColor(colorString);
            if (!parsed) return null;

            const sourceColors = toDark ? this.settings.lightColors : this.settings.darkColors;
            const targetColors = toDark ? this.settings.darkColors : this.settings.lightColors;

            const closestIndex = this.findClosestColorIndex(colorString, sourceColors);

            if (closestIndex !== -1) {
                const replacement = targetColors[closestIndex];

                if (parsed.a < 1) {
                    const rp = this.parseColor(replacement);
                    if (rp) {
                        return `rgba(${rp.r}, ${rp.g}, ${rp.b}, ${parsed.a})`;
                    }
                }
                return replacement;
            }

            // Fallback: brightness-based mapping
            const brightness = (parsed.r * 0.299 + parsed.g * 0.587 + parsed.b * 0.114);

            if (toDark) {
                if (brightness > 230) return targetColors[0];
                if (brightness > 200) return targetColors[1];
                if (brightness > 170) return targetColors[2];
                if (brightness > 140) return targetColors[3];
                if (brightness < 100) return targetColors[4];
                return targetColors[5];
            } else {
                if (brightness < 30) return targetColors[0];
                if (brightness < 60) return targetColors[1];
                if (brightness < 90) return targetColors[2];
                if (brightness < 120) return targetColors[3];
                if (brightness > 200) return targetColors[4];
                return targetColors[5];
            }
        }

        convertGradient(gradientString, toDark) {
            if (!gradientString || !gradientString.includes('gradient')) {
                return gradientString;
            }

            let converted = gradientString.replace(/#[0-9a-f]{3,6}/gi, (match) => {
                return this.convertColor(match, toDark) || match;
            });

            converted = converted.replace(/rgba?\([^)]+\)/gi, (match) => {
                return this.convertColor(match, toDark) || match;
            });

            return converted;
        }

        // ─── CLEANUP ────────────────────────────────────────────────────

        disconnectedCallback() {
            if (this.observer) this.observer.disconnect();
            if (this.navigationObserver) this.navigationObserver.disconnect();
            clearTimeout(this._pendingTimeout);
            clearTimeout(this._reapplyTimeout);
            clearTimeout(this._navigationTimeout);
            clearInterval(this._urlPollInterval);
        }
    }

    // Register
    try {
        customElements.define('theme-switcher', ThemeSwitcherElement);
        console.log('✅ theme-switcher custom element registered successfully');
    } catch (error) {
        console.error('❌ Failed to register theme-switcher:', error);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ThemeSwitcherElement };
    }
    window.ThemeSwitcherElement = ThemeSwitcherElement;

})();
