(function() {
    'use strict';
    
    // Check if already defined to prevent duplicate registration
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
            this.originalColors = new Map(); // Changed to Map with element reference as key
            this.defaultTheme = 'light';
            this.observer = null;
            this.isInitialized = false;
            this.themeChangeInProgress = false;
            this.pendingElements = new Set();
            this.processedElements = new Set(); // Changed to regular Set to track by element
            this.reapplyTimer = null;
            this.pageChangeDetected = false;
            this.lastUrl = '';
            this.navigationInProgress = false;
        }

        connectedCallback() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initialize();
                });
            } else {
                setTimeout(() => {
                    this.initialize();
                }, 500);
            }
        }

        initialize() {
            if (this.isInitialized) return;
            this.isInitialized = true;
            
            this.render();
            this.lastUrl = window.location.href;
            
            this.waitForWixReady().then(() => {
                this.initializeTheme();
                this.setupMutationObserver();
                this.setupWixNavigationListener();
            });
        }

        async waitForWixReady() {
            return new Promise((resolve) => {
                const checkWixReady = () => {
                    const wixElements = document.querySelector('[id^="SITE"]') || 
                                      document.querySelector('[data-hook]') ||
                                      document.querySelector('[class*="wix"]');
                    
                    if (wixElements && document.readyState === 'complete') {
                        setTimeout(resolve, 1000);
                    } else {
                        setTimeout(checkWixReady, 100);
                    }
                };
                checkWixReady();
            });
        }

        setupWixNavigationListener() {
            console.log('🔍 Setting up Wix navigation detection...');
            
            // Method 1: URL change detection
            const urlCheckInterval = setInterval(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== this.lastUrl && !this.navigationInProgress) {
                    console.log('🔄 URL changed from', this.lastUrl, 'to', currentUrl);
                    this.lastUrl = currentUrl;
                    this.handleWixNavigation();
                }
            }, 100);

            // Method 2: History API monitoring
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = (...args) => {
                originalPushState.apply(history, args);
                if (!this.navigationInProgress) {
                    console.log('🔄 pushState detected');
                    this.handleWixNavigation();
                }
            };
            
            history.replaceState = (...args) => {
                originalReplaceState.apply(history, args);
                if (!this.navigationInProgress) {
                    console.log('🔄 replaceState detected');
                    this.handleWixNavigation();
                }
            };

            // Method 3: Popstate event
            window.addEventListener('popstate', () => {
                if (!this.navigationInProgress) {
                    console.log('🔄 popstate event');
                    this.handleWixNavigation();
                }
            });

            // Store interval ID for cleanup
            this.urlCheckInterval = urlCheckInterval;
        }

        handleWixNavigation() {
            if (this.navigationInProgress) return;
            
            this.navigationInProgress = true;
            console.log('⏳ Wix navigation detected - waiting for page to fully render...');

            // Clear any existing timers
            clearTimeout(this.navigationTimer);

            // Wait for Wix to fully render the new page
            this.navigationTimer = setTimeout(() => {
                this.onPageFullyLoaded();
            }, 2000); // Increased wait time for full Wix page render
        }

        onPageFullyLoaded() {
            console.log('✅ Page fully loaded - reapplying theme...');
            
            const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;
            
            if (!isDefaultTheme) {
                // CRITICAL: Clear the original colors map and processed elements
                // This ensures we capture the NEW page's original colors
                this.originalColors.clear();
                this.processedElements.clear();
                
                console.log('💾 Capturing fresh original colors for new page...');
                this.storeOriginalColors();
                
                const isDark = this.settings.currentTheme === 'dark';
                
                // Apply theme immediately
                this.applyThemeToPage(isDark);
                
                // Additional passes to catch late-loading elements
                setTimeout(() => this.applyThemeToPage(isDark), 500);
                setTimeout(() => this.applyThemeToPage(isDark), 1000);
                setTimeout(() => this.applyThemeToPage(isDark), 1500);
                setTimeout(() => {
                    this.applyThemeToPage(isDark);
                    this.navigationInProgress = false;
                    console.log('🎉 Theme reapplication complete!');
                }, 2500);
            } else {
                this.navigationInProgress = false;
            }
        }

        applyThemeToPage(isDark) {
            console.log(`🎨 Applying ${isDark ? 'DARK' : 'LIGHT'} theme to page...`);
            
            this.changeAllColors(isDark);
            this.processAllShadowRoots(isDark);
            this.processWixWidgets(document.body, isDark);
            this.finalPassForMissedElements(isDark);
        }

        static get observedAttributes() {
            return ['settings'];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (newValue && newValue !== oldValue && name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    console.log('✅ Settings updated');
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
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
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
                        top: -8px;
                        right: -8px;
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
                    const isChecked = e.target.checked;
                    const newTheme = isChecked ? 'dark' : 'light';
                    
                    console.log('🎚️ Toggle clicked! Switching from', this.settings.currentTheme, 'to', newTheme);
                    
                    this.settings.currentTheme = newTheme;
                    
                    try {
                        localStorage.setItem('themePreference', newTheme);
                    } catch (e) {
                        console.warn('⚠️ Could not save to localStorage:', e);
                    }
                    
                    // CRITICAL: When switching themes, we need fresh original colors
                    // Clear everything and recapture
                    this.originalColors.clear();
                    this.processedElements.clear();
                    
                    console.log('💾 Recapturing original colors before theme change...');
                    this.storeOriginalColors();
                    
                    this.changeTheme();
                });
            }
        }

        setupMutationObserver() {
            this.observer = new MutationObserver((mutations) => {
                if (this.themeChangeInProgress || this.navigationInProgress) return;
                
                const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;
                if (isDefaultTheme) return;
                
                const isDark = this.settings.currentTheme === 'dark';
                
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE && !node.closest('theme-switcher')) {
                                this.pendingElements.add(node);
                            }
                        });
                    } else if (mutation.type === 'attributes') {
                        const target = mutation.target;
                        if (target.nodeType === Node.ELEMENT_NODE && !target.closest('theme-switcher')) {
                            // Element's style was changed - might need reprocessing
                            this.pendingElements.add(target);
                        }
                    }
                });
                
                clearTimeout(this.pendingTimeout);
                this.pendingTimeout = setTimeout(() => {
                    this.processPendingElements(isDark);
                }, 150);
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }

        processPendingElements(isDark) {
            this.pendingElements.forEach(node => {
                if (!this.processedElements.has(node)) {
                    this.storeOriginalColorsForElement(node);
                    this.processElement(node, isDark);
                    
                    if (node.shadowRoot) {
                        this.processShadowRoot(node.shadowRoot, isDark);
                    }
                    
                    const descendants = node.querySelectorAll('*');
                    descendants.forEach(el => {
                        if (!this.processedElements.has(el)) {
                            this.storeOriginalColorsForElement(el);
                            this.processElement(el, isDark);
                        }
                    });
                    
                    this.processedElements.add(node);
                }
            });
            
            this.pendingElements.clear();
        }

        initializeTheme() {
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
            
            console.log('💾 Storing original colors...');
            this.storeOriginalColors();
            
            const toggle = this.querySelector('#themeToggle');
            if (toggle) {
                toggle.checked = (this.settings.currentTheme === 'dark');
            }
            
            const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;
            if (!isDefaultTheme) {
                console.log('⚡ Applying non-default theme on load');
                setTimeout(() => {
                    this.changeTheme();
                }, 800);
            } else {
                console.log('✅ Default theme active - no changes needed');
            }
        }

        storeOriginalColors() {
            const allElements = document.querySelectorAll('*');
            let storedCount = 0;
            
            allElements.forEach(element => {
                if (this.storeOriginalColorsForElement(element)) {
                    storedCount++;
                }
                
                if (element.shadowRoot) {
                    const shadowElements = element.shadowRoot.querySelectorAll('*');
                    shadowElements.forEach(shadowEl => {
                        if (this.storeOriginalColorsForElement(shadowEl)) {
                            storedCount++;
                        }
                    });
                }
            });

            console.log('✅ Stored original colors for', storedCount, 'new elements');
        }

        storeOriginalColorsForElement(element) {
            if (element.closest('theme-switcher')) return false;
            
            // Only store if we haven't stored for this element yet
            if (this.originalColors.has(element)) return false;

            try {
                const computedStyle = window.getComputedStyle(element);
                
                this.originalColors.set(element, {
                    backgroundColor: computedStyle.backgroundColor,
                    color: computedStyle.color,
                    borderTopColor: computedStyle.borderTopColor,
                    borderRightColor: computedStyle.borderRightColor,
                    borderBottomColor: computedStyle.borderBottomColor,
                    borderLeftColor: computedStyle.borderLeftColor,
                    fill: computedStyle.fill,
                    stroke: computedStyle.stroke,
                    backgroundImage: computedStyle.backgroundImage,
                    webkitTextFillColor: computedStyle.webkitTextFillColor || computedStyle.getPropertyValue('-webkit-text-fill-color')
                });
                
                return true;
            } catch (e) {
                return false;
            }
        }

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
                const shortHex = hex.length === 3;
                const r = parseInt(shortHex ? hex[0] + hex[0] : hex.substring(0, 2), 16);
                const g = parseInt(shortHex ? hex[1] + hex[1] : hex.substring(2, 4), 16);
                const b = parseInt(shortHex ? hex[2] + hex[2] : hex.substring(4, 6), 16);
                return { r, g, b, a: 1 };
            }

            return null;
        }

        colorDistance(color1, color2) {
            return Math.sqrt(
                Math.pow(color1.r - color2.r, 2) +
                Math.pow(color1.g - color2.g, 2) +
                Math.pow(color1.b - color2.b, 2)
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
                    const distance = this.colorDistance(target, parsed);
                    if (distance < minDistance) {
                        minDistance = distance;
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
                const replacementColor = targetColors[closestIndex];
                
                if (parsed.a < 1) {
                    const replacementParsed = this.parseColor(replacementColor);
                    if (replacementParsed) {
                        return `rgba(${replacementParsed.r}, ${replacementParsed.g}, ${replacementParsed.b}, ${parsed.a})`;
                    }
                }
                
                return replacementColor;
            }

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

        changeTheme() {
            this.themeChangeInProgress = true;
            
            const isDark = this.settings.currentTheme === 'dark';
            const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;
            const colors = isDark ? this.settings.darkColors : this.settings.lightColors;

            console.log(`🎨 Changing to ${isDark ? 'DARK' : 'LIGHT'} mode`);

            const root = document.documentElement;
            
            colors.forEach((color, index) => {
                root.style.setProperty(`--theme-color-${index + 1}`, color);
            });

            root.style.setProperty('--theme-bg', colors[0]);
            root.style.setProperty('--theme-text', colors[4]);
            root.setAttribute('data-theme', this.settings.currentTheme);

            if (isDefaultTheme) {
                document.body.style.backgroundColor = '';
                document.body.style.color = '';
                
                this.restoreOriginalColors();
                this.restoreAllShadowRoots();
                this.themeChangeInProgress = false;
            } else {
                document.body.style.backgroundColor = colors[0];
                document.body.style.color = colors[4];
                
                requestAnimationFrame(() => {
                    this.changeAllColors(isDark);
                    
                    requestAnimationFrame(() => {
                        this.processAllShadowRoots(isDark);
                        this.processWixWidgets(document.body, isDark);
                        
                        setTimeout(() => {
                            this.finalPassForMissedElements(isDark);
                        }, 300);
                        
                        setTimeout(() => {
                            this.finalPassForMissedElements(isDark);
                        }, 800);
                        
                        setTimeout(() => {
                            this.finalPassForMissedElements(isDark);
                            this.themeChangeInProgress = false;
                        }, 1500);
                    });
                });
            }
        }

        finalPassForMissedElements(isDark) {
            console.log('🔍 Final pass for missed elements...');
            
            const missedSelectors = [
                '[data-hook]',
                '[class*="breadcrumb"]',
                '[class*="product"]',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                'p', 'span', 'a', 'div', 'section', 'li', 'td', 'th'
            ];
            
            missedSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (!el.closest('theme-switcher')) {
                            this.storeOriginalColorsForElement(el);
                            this.processElement(el, isDark);
                            this.processedElements.add(el);
                        }
                    });
                } catch (e) {
                    // Invalid selector, skip
                }
            });
        }

        restoreOriginalColors() {
            console.log('🔄 Restoring original colors...');
            
            const allElements = document.querySelectorAll('*');
            let restoredCount = 0;

            allElements.forEach(element => {
                if (element.closest('theme-switcher')) return;

                if (this.originalColors.has(element)) {
                    try {
                        element.style.backgroundColor = '';
                        element.style.color = '';
                        element.style.borderTopColor = '';
                        element.style.borderRightColor = '';
                        element.style.borderBottomColor = '';
                        element.style.borderLeftColor = '';
                        element.style.fill = '';
                        element.style.stroke = '';
                        element.style.backgroundImage = '';
                        element.style.webkitTextFillColor = '';
                        element.style.webkitBackgroundClip = '';
                        element.style.backgroundClip = '';
                        restoredCount++;
                    } catch (e) {
                        // Element not accessible, skip
                    }
                }
            });

            this.originalColors.clear();
            this.processedElements.clear();
            console.log(`✅ Restored ${restoredCount} elements`);
        }

        restoreAllShadowRoots() {
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(element => {
                if (element.shadowRoot) {
                    const shadowElements = element.shadowRoot.querySelectorAll('*');
                    shadowElements.forEach(shadowEl => {
                        if (this.originalColors.has(shadowEl)) {
                            try {
                                shadowEl.style.backgroundColor = '';
                                shadowEl.style.color = '';
                                shadowEl.style.borderTopColor = '';
                                shadowEl.style.borderRightColor = '';
                                shadowEl.style.borderBottomColor = '';
                                shadowEl.style.borderLeftColor = '';
                                shadowEl.style.fill = '';
                                shadowEl.style.stroke = '';
                                shadowEl.style.backgroundImage = '';
                                shadowEl.style.webkitTextFillColor = '';
                            } catch (e) {
                                // Element not accessible, skip
                            }
                        }
                    });
                }
            });
        }

        changeAllColors(toDark) {
            console.log('🔄 Converting colors...');
            
            const allElements = document.querySelectorAll('*');
            let changedCount = 0;

            allElements.forEach(element => {
                if (!element.closest('theme-switcher')) {
                    changedCount += this.processElement(element, toDark);
                    this.processedElements.add(element);
                }
            });

            console.log(`✅ Converted ${changedCount} elements`);
        }

        processElement(element, toDark) {
            const original = this.originalColors.get(element);
            if (!original) return 0;

            let changed = 0;

            try {
                const newBg = this.convertColor(original.backgroundColor, toDark);
                if (newBg) {
                    element.style.setProperty('background-color', newBg, 'important');
                    changed++;
                }

                const newColor = this.convertColor(original.color, toDark);
                if (newColor) {
                    element.style.setProperty('color', newColor, 'important');
                }

                const newBorderTop = this.convertColor(original.borderTopColor, toDark);
                if (newBorderTop) element.style.setProperty('border-top-color', newBorderTop, 'important');

                const newBorderRight = this.convertColor(original.borderRightColor, toDark);
                if (newBorderRight) element.style.setProperty('border-right-color', newBorderRight, 'important');

                const newBorderBottom = this.convertColor(original.borderBottomColor, toDark);
                if (newBorderBottom) element.style.setProperty('border-bottom-color', newBorderBottom, 'important');

                const newBorderLeft = this.convertColor(original.borderLeftColor, toDark);
                if (newBorderLeft) element.style.setProperty('border-left-color', newBorderLeft, 'important');

                if (original.fill && original.fill !== 'none') {
                    const newFill = this.convertColor(original.fill, toDark);
                    if (newFill) element.style.setProperty('fill', newFill, 'important');
                }

                if (original.stroke && original.stroke !== 'none') {
                    const newStroke = this.convertColor(original.stroke, toDark);
                    if (newStroke) element.style.setProperty('stroke', newStroke, 'important');
                }

                if (original.backgroundImage && original.backgroundImage !== 'none' && original.backgroundImage.includes('gradient')) {
                    const newGradient = this.convertGradient(original.backgroundImage, toDark);
                    if (newGradient) {
                        element.style.setProperty('background-image', newGradient, 'important');
                    }
                }

                if (original.webkitTextFillColor === 'transparent' && original.backgroundImage && original.backgroundImage.includes('gradient')) {
                    const newGradient = this.convertGradient(original.backgroundImage, toDark);
                    if (newGradient) {
                        element.style.setProperty('background-image', newGradient, 'important');
                        element.style.webkitBackgroundClip = 'text';
                        element.style.backgroundClip = 'text';
                    }
                }

            } catch (e) {
                // Element not accessible, skip
            }

            return changed;
        }

        processAllShadowRoots(toDark) {
            const allElements = document.querySelectorAll('*');
            let shadowCount = 0;
            
            allElements.forEach(element => {
                if (element.shadowRoot) {
                    this.processShadowRoot(element.shadowRoot, toDark);
                    shadowCount++;
                }
            });

            if (shadowCount > 0) {
                console.log(`✅ Processed ${shadowCount} shadow DOMs`);
            }
        }

        processShadowRoot(shadowRoot, toDark) {
            const shadowElements = shadowRoot.querySelectorAll('*');
            
            shadowElements.forEach(element => {
                this.storeOriginalColorsForElement(element);
                this.processElement(element, toDark);
                this.processedElements.add(element);
            });

            shadowElements.forEach(element => {
                if (element.shadowRoot) {
                    this.processShadowRoot(element.shadowRoot, toDark);
                }
            });
        }

        processWixWidgets(container, toDark) {
            const wixSelectors = [
                '[data-hook]',
                '[class*="chat"]', '[class*="cart"]',
                '[class*="dropdown"]', '[class*="select"]',
                '[class*="breadcrumb"]', '[class*="product"]',
                '[id*="STORES"]', '[id*="PRODUCT"]',
                '[data-testid]'
            ];
            
            wixSelectors.forEach(selector => {
                try {
                    const widgets = container.querySelectorAll(selector);
                    widgets.forEach(widget => {
                        this.deepProcessWidget(widget, toDark);
                    });
                } catch (e) {
                    // Invalid selector, skip
                }
            });
        }

        deepProcessWidget(widget, toDark) {
            this.storeOriginalColorsForElement(widget);
            this.processElement(widget, toDark);
            this.processedElements.add(widget);
            
            const descendants = widget.querySelectorAll('*');
            descendants.forEach(el => {
                this.storeOriginalColorsForElement(el);
                this.processElement(el, toDark);
                this.processedElements.add(el);
            });
            
            if (widget.shadowRoot) {
                this.processShadowRoot(widget.shadowRoot, toDark);
            }
        }

        disconnectedCallback() {
            if (this.observer) {
                this.observer.disconnect();
            }
            if (this.urlCheckInterval) {
                clearInterval(this.urlCheckInterval);
            }
            clearTimeout(this.pendingTimeout);
            clearTimeout(this.navigationTimer);
        }
    }

    try {
        customElements.define('theme-switcher', ThemeSwitcherElement);
        console.log('✅ theme-switcher registered successfully');
    } catch (error) {
        console.error('❌ Failed to register theme-switcher:', error);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ThemeSwitcherElement };
    }
    
    window.ThemeSwitcherElement = ThemeSwitcherElement;

})();
