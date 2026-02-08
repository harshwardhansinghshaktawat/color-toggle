(function() {

    'use strict';

    console.log('🚀 Theme Switcher Script Starting...');
    console.log('📅 Script Load Time:', new Date().toISOString());
    console.log('📄 Document Ready State:', document.readyState);
    

    // Check if already defined to prevent duplicate registration

    if (customElements.get('theme-switcher')) {

        console.log('⚠️ theme-switcher already defined, skipping registration');

        return;

    }

    console.log('✅ No existing theme-switcher found, proceeding with registration');



    class ThemeSwitcherElement extends HTMLElement {

        constructor() {

            super();

            console.log('🏗️ Constructor called - Creating new ThemeSwitcherElement instance');

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

            console.log('📋 Default settings initialized:', this.settings);

            this.originalColors = new WeakMap();

            this.defaultTheme = 'light';

            this.observer = null;

            this.isInitialized = false;

            this.themeChangeInProgress = false;

            this.pendingElements = new Set();

            this.processedElements = new WeakSet();

            console.log('✅ Constructor completed');

        }



        connectedCallback() {

            console.log('🔌 connectedCallback fired!');

            console.log('📄 Current document.readyState:', document.readyState);

            console.log('🌐 Current window.location:', window.location.href);

            console.log('⏰ Timestamp:', Date.now());

            

            // Delay initialization to ensure DOM is ready

            if (document.readyState === 'loading') {

                console.log('⏳ Document still loading, waiting for DOMContentLoaded...');

                document.addEventListener('DOMContentLoaded', () => {

                    console.log('✅ DOMContentLoaded event fired!');

                    this.initialize();

                });

            } else {

                console.log('✅ Document already loaded (state: ' + document.readyState + ')');

                // Use longer timeout to ensure Wix environment is fully ready

                console.log('⏰ Setting 500ms timeout before initialization...');

                setTimeout(() => {

                    console.log('⏰ 500ms timeout completed, calling initialize()');

                    this.initialize();

                }, 500);

            }

        }



        initialize() {

            console.log('🎬 initialize() method called');

            console.log('🔍 isInitialized status:', this.isInitialized);

            

            if (this.isInitialized) {

                console.log('⚠️ Already initialized, skipping...');

                return;

            }

            

            console.log('🏁 Starting initialization process...');

            this.isInitialized = true;

            

            console.log('🎨 Calling render()...');

            this.render();

            console.log('✅ render() completed');

            

            // Wait for Wix to fully load before initializing theme

            console.log('⏳ Waiting for Wix to be ready...');

            this.waitForWixReady().then(() => {

                console.log('✅ Wix is ready! Proceeding with theme initialization...');

                this.initializeTheme();

                console.log('🔍 Setting up mutation observers...');

                this.setupMutationObserver();

                this.setupWixAppObserver();

                console.log('✅ All observers set up successfully');

            });

        }



        async waitForWixReady() {

            console.log('⏳ waitForWixReady() started');

            

            // Wait for common Wix elements to be present

            return new Promise((resolve) => {

                let checkCount = 0;

                const checkWixReady = () => {

                    checkCount++;

                    console.log(`🔍 Wix Ready Check #${checkCount}`);

                    

                    const wixElements = document.querySelector('[id^="SITE"]') || 

                                      document.querySelector('[data-hook]') ||

                                      document.querySelector('[class*="wix"]');

                    

                    console.log('🔍 Found Wix elements:', !!wixElements);

                    console.log('📄 Document readyState:', document.readyState);

                    

                    if (wixElements && document.readyState === 'complete') {

                        console.log('✅ Wix elements found and document complete!');

                        console.log('⏰ Adding additional 1000ms delay for scripts...');

                        // Additional delay to ensure all scripts have executed

                        setTimeout(() => {

                            console.log('✅ waitForWixReady() resolving!');

                            resolve();

                        }, 1000);

                    } else {

                        console.log('⏳ Not ready yet, checking again in 100ms...');

                        setTimeout(checkWixReady, 100);

                    }

                };

                checkWixReady();

            });

        }



        static get observedAttributes() {

            console.log('📋 observedAttributes getter called');

            return ['settings'];

        }



        attributeChangedCallback(name, oldValue, newValue) {

            console.log('🔄 attributeChangedCallback fired!');

            console.log('   Attribute name:', name);

            console.log('   Old value:', oldValue);

            console.log('   New value:', newValue);

            

            if (newValue && newValue !== oldValue && name === 'settings') {

                console.log('🔧 Processing settings update...');

                try {

                    const newSettings = JSON.parse(newValue);

                    console.log('📋 Parsed new settings:', newSettings);

                    Object.assign(this.settings, newSettings);

                    console.log('✅ Settings updated successfully');

                    console.log('📋 Current settings:', this.settings);

                } catch (e) {

                    console.error('❌ Failed to parse settings:', e);

                    console.error('   Raw value:', newValue);

                }

            }

        }



        render() {

            console.log('🎨 render() method started');

            console.log('🔧 Auto-detect status:', this.settings.autoDetect);

            

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

            

            console.log('✅ HTML rendered');

            console.log('🔧 Setting up toggle listener...');

            this.setupToggleListener();

        }



        setupToggleListener() {

            console.log('🎚️ setupToggleListener() called');

            const toggle = this.querySelector('#themeToggle');

            console.log('🔍 Found toggle element:', !!toggle);

            

            if (toggle) {

                console.log('✅ Toggle found, adding event listener');

                toggle.addEventListener('change', (e) => {

                    console.log('🎚️ ========== TOGGLE CLICKED ==========');

                    const isChecked = e.target.checked;

                    console.log('🔘 Toggle checked status:', isChecked);

                    

                    this.settings.currentTheme = isChecked ? 'dark' : 'light';

                    console.log('🎨 New theme set to:', this.settings.currentTheme);

                    

                    try {

                        localStorage.setItem('themePreference', this.settings.currentTheme);

                        console.log('💾 Theme preference saved to localStorage');

                    } catch (e) {

                        console.warn('⚠️ Could not save to localStorage:', e);

                    }

                    

                    console.log('🎨 Calling changeTheme()...');

                    this.changeTheme();

                    console.log('🎚️ ========== TOGGLE CLICK PROCESSED ==========');

                });

            } else {

                console.error('❌ Toggle element not found!');

            }

        }



        setupMutationObserver() {

            console.log('👁️ setupMutationObserver() called');

            

            this.observer = new MutationObserver((mutations) => {

                if (this.themeChangeInProgress) {

                    console.log('⏸️ Theme change in progress, skipping mutation processing');

                    return;

                }

                

                const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;

                if (isDefaultTheme) {

                    console.log('⏸️ Default theme active, skipping mutation processing');

                    return;

                }

                

                const isDark = this.settings.currentTheme === 'dark';

                console.log(`👁️ Mutation detected! Processing in ${isDark ? 'DARK' : 'LIGHT'} mode`);

                console.log(`📊 Mutations count: ${mutations.length}`);

                

                mutations.forEach((mutation, index) => {

                    console.log(`   Mutation #${index + 1}:`, mutation.type);

                    if (mutation.type === 'childList') {

                        console.log(`      Added nodes: ${mutation.addedNodes.length}`);

                        mutation.addedNodes.forEach((node, nodeIndex) => {

                            if (node.nodeType === Node.ELEMENT_NODE) {

                                console.log(`      Adding node #${nodeIndex + 1} to pending:`, node.tagName || node);

                                // Add to pending elements set

                                this.pendingElements.add(node);

                            }

                        });

                    }

                });

                

                console.log(`📦 Total pending elements: ${this.pendingElements.size}`);

                

                // Process pending elements after a short delay

                clearTimeout(this.pendingTimeout);

                console.log('⏰ Setting 100ms timeout for pending elements processing...');

                this.pendingTimeout = setTimeout(() => {

                    console.log('⏰ Timeout complete, processing pending elements...');

                    this.processPendingElements(isDark);

                }, 100);

            });



            console.log('🎯 Attaching mutation observer to document.body...');

            this.observer.observe(document.body, {

                childList: true,

                subtree: true,

                attributes: true,

                attributeFilter: ['style', 'class']

            });

            console.log('✅ Mutation observer set up successfully');

        }



        processPendingElements(isDark) {

            console.log(`📦 processPendingElements() called - ${this.pendingElements.size} elements to process`);

            console.log(`🌓 Processing in ${isDark ? 'DARK' : 'LIGHT'} mode`);

            

            let processedCount = 0;

            

            this.pendingElements.forEach(node => {

                if (!this.processedElements.has(node)) {

                    console.log(`   Processing element: ${node.tagName || node}`);

                    this.storeOriginalColorsForElement(node);

                    this.processElement(node, isDark);

                    

                    if (node.shadowRoot) {

                        console.log(`   Element has shadowRoot, processing...`);

                        this.processShadowRoot(node.shadowRoot, isDark);

                    }

                    

                    // Process descendants

                    const descendants = node.querySelectorAll('*');

                    console.log(`   Processing ${descendants.length} descendants...`);

                    descendants.forEach(el => {

                        if (!this.processedElements.has(el)) {

                            this.storeOriginalColorsForElement(el);

                            this.processElement(el, isDark);

                        }

                    });

                    

                    this.processedElements.add(node);

                    processedCount++;

                }

            });

            

            console.log(`✅ Processed ${processedCount} pending elements`);

            this.pendingElements.clear();

            console.log('🗑️ Pending elements cleared');

        }



        setupWixAppObserver() {

            console.log('🎯 setupWixAppObserver() called');

            

            // Special observer for Wix app elements that load late

            const wixAppObserver = new MutationObserver((mutations) => {

                if (this.themeChangeInProgress) {

                    console.log('⏸️ Theme change in progress, skipping Wix app processing');

                    return;

                }

                

                const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;

                if (isDefaultTheme) {

                    console.log('⏸️ Default theme active, skipping Wix app processing');

                    return;

                }

                

                const isDark = this.settings.currentTheme === 'dark';

                console.log(`🎯 Wix App mutation detected! Mode: ${isDark ? 'DARK' : 'LIGHT'}`);

                

                mutations.forEach((mutation, index) => {

                    console.log(`   Wix App Mutation #${index + 1}`);

                    mutation.addedNodes.forEach((node, nodeIndex) => {

                        if (node.nodeType === Node.ELEMENT_NODE) {

                            // Check if it's a Wix app element

                            if (this.isWixAppElement(node)) {

                                console.log(`   🎯 Detected Wix app element #${nodeIndex + 1}:`, node);

                                console.log('      Scheduling deep processing in 500ms...');

                                setTimeout(() => {

                                    console.log('      Processing Wix app element now...');

                                    this.deepProcessWidget(node, isDark);

                                }, 500);

                            }

                        }

                    });

                });

            });



            console.log('🎯 Attaching Wix app observer to document.body...');

            wixAppObserver.observe(document.body, {

                childList: true,

                subtree: true

            });

            console.log('✅ Wix app observer set up successfully');

        }



        isWixAppElement(element) {

            const wixAppSelectors = [

                '[data-hook*="product"]',

                '[data-hook*="breadcrumb"]',

                '[data-hook*="cart"]',

                '[class*="product"]',

                '[class*="breadcrumb"]',

                '[id*="STORES"]',

                '[id*="PRODUCT"]',

                '[data-testid]'

            ];

            

            const isWixApp = wixAppSelectors.some(selector => {

                try {

                    return element.matches(selector) || element.querySelector(selector);

                } catch (e) {

                    return false;

                }

            });

            

            if (isWixApp) {

                console.log('✅ Element is a Wix app element');

            }

            

            return isWixApp;

        }



        initializeTheme() {

            console.log('🎬 ========== initializeTheme() STARTED ==========');

            console.log('⏰ Time:', new Date().toISOString());

            console.log('🌐 URL:', window.location.href);

            

            let savedTheme = null;

            

            try {

                savedTheme = localStorage.getItem('themePreference');

                console.log('💾 Retrieved from localStorage:', savedTheme);

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

                console.log('   prefers-color-scheme: dark =', prefersDark);

            } else {

                console.log('🔧 No saved theme and auto-detect disabled, using default:', this.defaultTheme);

            }

            

            console.log('🎨 Current theme will be:', this.settings.currentTheme);

            console.log('🎨 Default theme is:', this.defaultTheme);

            

            console.log('💾 Storing original colors...');

            this.storeOriginalColors();

            

            const toggle = this.querySelector('#themeToggle');

            if (toggle) {

                const shouldCheck = (this.settings.currentTheme === 'dark');

                toggle.checked = shouldCheck;

                console.log('🔘 Toggle checked set to:', shouldCheck);

            } else {

                console.error('❌ Toggle element not found in initializeTheme!');

            }

            

            const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;

            console.log('🔍 Is default theme?', isDefaultTheme);

            

            if (!isDefaultTheme) {

                console.log('⚡ NON-DEFAULT THEME - Will apply theme on load');

                console.log('⏰ Setting 500ms delay before applying theme...');

                // Delay theme application to ensure all elements are loaded

                setTimeout(() => {

                    console.log('⏰ 500ms delay complete, applying theme now...');

                    this.changeTheme();

                }, 500);

            } else {

                console.log('✅ DEFAULT THEME - No changes needed');

            }

            

            console.log('🎬 ========== initializeTheme() COMPLETED ==========');

        }



        storeOriginalColors() {

            console.log('💾 storeOriginalColors() started');

            const allElements = document.querySelectorAll('*');

            console.log(`📊 Total elements in DOM: ${allElements.length}`);

            

            let storedCount = 0;

            let skippedCount = 0;

            

            allElements.forEach((element, index) => {

                const stored = this.storeOriginalColorsForElement(element);

                if (stored) storedCount++;

                else skippedCount++;

                

                if (element.shadowRoot) {

                    console.log(`   Element #${index} has shadowRoot`);

                    const shadowElements = element.shadowRoot.querySelectorAll('*');

                    console.log(`      Shadow has ${shadowElements.length} elements`);

                    shadowElements.forEach(shadowEl => {

                        const shadowStored = this.storeOriginalColorsForElement(shadowEl);

                        if (shadowStored) storedCount++;

                        else skippedCount++;

                    });

                }

            });



            console.log(`✅ Stored original colors for ${storedCount} elements`);

            console.log(`⏭️ Skipped ${skippedCount} elements (already stored or theme-switcher)`);

        }



        storeOriginalColorsForElement(element) {

            if (element.closest('theme-switcher')) {

                return false;

            }

            

            if (this.originalColors.has(element)) {

                return false;

            }



            try {

                const computedStyle = window.getComputedStyle(element);

                

                // Store ALL original color values to prevent overwriting

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

                    webkitTextFillColor: computedStyle.webkitTextFillColor || computedStyle.getPropertyValue('-webkit-text-fill-color'),

                    // Store element's inline styles to preserve them

                    inlineBackgroundColor: element.style.backgroundColor,

                    inlineColor: element.style.color

                });

                

                return true;

            } catch (e) {

                // Element not accessible, skip

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

            console.log('🎨 ========== changeTheme() STARTED ==========');

            console.log('⏰ Time:', new Date().toISOString());

            console.log('🌐 URL:', window.location.href);

            

            this.themeChangeInProgress = true;

            console.log('🔒 themeChangeInProgress set to TRUE');

            

            const isDark = this.settings.currentTheme === 'dark';

            const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;

            const colors = isDark ? this.settings.darkColors : this.settings.lightColors;



            console.log(`🎨 Target theme: ${this.settings.currentTheme}`);

            console.log(`🌓 Is dark mode? ${isDark}`);

            console.log(`🎯 Is default theme? ${isDefaultTheme}`);

            console.log(`🎨 Using colors:`, colors);



            const root = document.documentElement;

            console.log('📄 Setting CSS variables on root element...');

            

            colors.forEach((color, index) => {

                root.style.setProperty(`--theme-color-${index + 1}`, color);

                console.log(`   --theme-color-${index + 1}: ${color}`);

            });



            root.style.setProperty('--theme-bg', colors[0]);

            root.style.setProperty('--theme-text', colors[4]);

            root.setAttribute('data-theme', this.settings.currentTheme);

            console.log('✅ CSS variables and data-theme attribute set');



            if (isDefaultTheme) {

                console.log('🔄 DEFAULT THEME - Restoring original colors...');

                document.body.style.backgroundColor = '';

                document.body.style.color = '';

                

                this.restoreOriginalColors();

                this.restoreAllShadowRoots();

                console.log('✅ Original colors restored');

            } else {

                console.log('🎨 NON-DEFAULT THEME - Applying theme colors...');

                

                document.body.style.backgroundColor = colors[0];

                document.body.style.color = colors[4];

                document.body.style.transition = 'all 0.3s ease';

                console.log(`   Body background: ${colors[0]}`);

                console.log(`   Body text: ${colors[4]}`);

                

                // Process in stages to prevent flashing

                console.log('🔄 Stage 1: requestAnimationFrame for changeAllColors...');

                requestAnimationFrame(() => {

                    console.log('▶️ Stage 1 executing...');

                    this.changeAllColors(isDark);

                    

                    console.log('🔄 Stage 2: requestAnimationFrame for shadow/iframe/widgets...');

                    requestAnimationFrame(() => {

                        console.log('▶️ Stage 2 executing...');

                        this.processAllShadowRoots(isDark);

                        this.processAllIframes(isDark);

                        this.processWixWidgets(document.body, isDark);

                        

                        // Final pass for any missed elements

                        console.log('⏰ Setting 300ms timeout for final pass...');

                        setTimeout(() => {

                            console.log('▶️ Final pass executing...');

                            this.finalPassForMissedElements(isDark);

                            this.themeChangeInProgress = false;

                            console.log('🔓 themeChangeInProgress set to FALSE');

                            console.log('🎨 ========== changeTheme() COMPLETED ==========');

                        }, 300);

                    });

                });

            }

        }



        finalPassForMissedElements(isDark) {

            console.log('🔍 finalPassForMissedElements() started');

            console.log(`🌓 Mode: ${isDark ? 'DARK' : 'LIGHT'}`);

            

            // Target specific Wix app elements that often get missed

            const missedSelectors = [

                '[data-hook*="breadcrumb"]',

                '[data-hook*="product-title"]',

                '[data-hook*="product-description"]',

                '[data-hook*="price"]',

                '[class*="breadcrumb"]',

                '[class*="product-title"]',

                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a'

            ];

            

            let totalProcessed = 0;

            

            missedSelectors.forEach((selector, selectorIndex) => {

                try {

                    const elements = document.querySelectorAll(selector);

                    console.log(`   Selector #${selectorIndex + 1} "${selector}": ${elements.length} elements found`);

                    

                    let selectorProcessed = 0;

                    

                    elements.forEach(el => {

                        if (!this.processedElements.has(el)) {

                            this.storeOriginalColorsForElement(el);

                            this.processElement(el, isDark);

                            this.processedElements.add(el);

                            selectorProcessed++;

                            totalProcessed++;

                        }

                    });

                    

                    if (selectorProcessed > 0) {

                        console.log(`      Processed ${selectorProcessed} new elements`);

                    }

                } catch (e) {

                    console.warn(`   Invalid selector: ${selector}`, e);

                }

            });

            

            console.log(`✅ Final pass complete - processed ${totalProcessed} missed elements`);

        }



        restoreOriginalColors() {

            console.log('🔄 restoreOriginalColors() started');

            

            this.themeChangeInProgress = false;

            const allElements = document.querySelectorAll('*');

            let restoredCount = 0;

            

            console.log(`📊 Total elements to check: ${allElements.length}`);



            allElements.forEach((element, index) => {

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

                        console.warn(`   Failed to restore element #${index}:`, e);

                    }

                }

            });



            this.processedElements = new WeakSet();

            console.log(`✅ Restored ${restoredCount} elements by removing inline styles`);

            console.log('🗑️ processedElements WeakSet cleared');

        }



        restoreAllShadowRoots() {

            console.log('👻 restoreAllShadowRoots() started');

            

            const allElements = document.querySelectorAll('*');

            let shadowCount = 0;

            let restoredCount = 0;

            

            allElements.forEach(element => {

                if (element.shadowRoot) {

                    shadowCount++;

                    console.log(`   Processing shadow DOM #${shadowCount}`);

                    

                    const shadowElements = element.shadowRoot.querySelectorAll('*');

                    console.log(`      Shadow has ${shadowElements.length} elements`);

                    

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

                                shadowEl.style.webkitBackgroundClip = '';

                                shadowEl.style.backgroundClip = '';

                                restoredCount++;

                            } catch (e) {

                                // Element not accessible, skip

                            }

                        }

                    });

                }

            });

            

            console.log(`✅ Processed ${shadowCount} shadow DOMs, restored ${restoredCount} elements`);

        }



        changeAllColors(toDark) {

            console.log('🔄 changeAllColors() started');

            console.log(`🌓 Converting to ${toDark ? 'DARK' : 'LIGHT'} mode`);

            

            const allElements = document.querySelectorAll('*');

            let changedCount = 0;

            

            console.log(`📊 Total elements to process: ${allElements.length}`);



            allElements.forEach((element, index) => {

                const changes = this.processElement(element, toDark);

                changedCount += changes;

                this.processedElements.add(element);

                

                if (index % 1000 === 0) {

                    console.log(`   Progress: ${index}/${allElements.length} elements processed`);

                }

            });



            console.log(`✅ Converted ${changedCount} elements`);

        }



        processElement(element, toDark) {

            if (element.closest('theme-switcher')) return 0;



            const original = this.originalColors.get(element);

            if (!original) {

                this.storeOriginalColorsForElement(element);

                return 0;

            }



            let changed = 0;



            try {

                const newBg = this.convertColor(original.backgroundColor, toDark);

                if (newBg) {

                    element.style.setProperty('background-color', newBg, 'important');

                    element.style.transition = 'background-color 0.3s ease';

                    changed++;

                }



                const newColor = this.convertColor(original.color, toDark);

                if (newColor) {

                    element.style.setProperty('color', newColor, 'important');

                    element.style.transition = 'color 0.3s ease';

                }



                const newBorderTop = this.convertColor(original.borderTopColor, toDark);

                if (newBorderTop) element.style.borderTopColor = newBorderTop;



                const newBorderRight = this.convertColor(original.borderRightColor, toDark);

                if (newBorderRight) element.style.borderRightColor = newBorderRight;



                const newBorderBottom = this.convertColor(original.borderBottomColor, toDark);

                if (newBorderBottom) element.style.borderBottomColor = newBorderBottom;



                const newBorderLeft = this.convertColor(original.borderLeftColor, toDark);

                if (newBorderLeft) element.style.borderLeftColor = newBorderLeft;



                if (original.fill && original.fill !== 'none') {

                    const newFill = this.convertColor(original.fill, toDark);

                    if (newFill) element.style.fill = newFill;

                }



                if (original.stroke && original.stroke !== 'none') {

                    const newStroke = this.convertColor(original.stroke, toDark);

                    if (newStroke) element.style.stroke = newStroke;

                }



                if (original.backgroundImage && original.backgroundImage !== 'none' && original.backgroundImage.includes('gradient')) {

                    const newGradient = this.convertGradient(original.backgroundImage, toDark);

                    if (newGradient) {

                        element.style.backgroundImage = newGradient;

                    }

                }



                if (original.webkitTextFillColor === 'transparent' && original.backgroundImage && original.backgroundImage.includes('gradient')) {

                    const newGradient = this.convertGradient(original.backgroundImage, toDark);

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



        processAllShadowRoots(toDark) {

            console.log('👻 processAllShadowRoots() started');

            console.log(`🌓 Mode: ${toDark ? 'DARK' : 'LIGHT'}`);

            

            const allElements = document.querySelectorAll('*');

            let shadowCount = 0;

            

            allElements.forEach(element => {

                if (element.shadowRoot) {

                    shadowCount++;

                    console.log(`   Processing shadow DOM #${shadowCount}`);

                    this.processShadowRoot(element.shadowRoot, toDark);

                }

            });



            console.log(`✅ Processed ${shadowCount} shadow DOMs`);

        }



        processShadowRoot(shadowRoot, toDark) {

            const shadowElements = shadowRoot.querySelectorAll('*');

            console.log(`      Shadow has ${shadowElements.length} elements`);

            

            shadowElements.forEach(element => {

                this.storeOriginalColorsForElement(element);

                this.processElement(element, toDark);

                this.processedElements.add(element);

            });



            shadowElements.forEach(element => {

                if (element.shadowRoot) {

                    console.log(`      Nested shadow DOM found, processing recursively...`);

                    this.processShadowRoot(element.shadowRoot, toDark);

                }

            });

        }



        processAllIframes(toDark) {

            console.log('🖼️ processAllIframes() started');

            console.log(`🌓 Mode: ${toDark ? 'DARK' : 'LIGHT'}`);

            

            const iframes = document.querySelectorAll('iframe');

            let processedCount = 0;

            let blockedCount = 0;

            

            console.log(`📊 Total iframes found: ${iframes.length}`);



            iframes.forEach((iframe, index) => {

                console.log(`   Processing iframe #${index + 1}`);

                try {

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                    

                    if (iframeDoc) {

                        const iframeElements = iframeDoc.querySelectorAll('*');

                        console.log(`      Iframe has ${iframeElements.length} elements`);

                        

                        iframeElements.forEach(element => {

                            this.storeOriginalColorsForElement(element);

                            this.processElement(element, toDark);

                            this.processedElements.add(element);

                        });

                        processedCount++;

                    } else {

                        console.warn(`      Iframe #${index + 1} document not accessible`);

                        blockedCount++;

                    }

                } catch (e) {

                    console.warn(`      Iframe #${index + 1} blocked (cross-origin):`, e.message);

                    blockedCount++;

                }

            });



            console.log(`✅ Processed ${processedCount} accessible iframes`);

            console.log(`⛔ Blocked ${blockedCount} cross-origin iframes`);

        }



        processWixWidgets(container, toDark) {

            console.log('🎯 processWixWidgets() started');

            console.log(`🌓 Mode: ${toDark ? 'DARK' : 'LIGHT'}`);

            

            const wixSelectors = [

                // Chat widgets

                '[data-hook*="chat"]', '[class*="chat"]', '#SITE_CHAT',

                '[id*="chat"]', '[aria-label*="chat" i]',

                // Dropdowns and selects

                '[role="listbox"]', '[role="combobox"]', '[class*="dropdown"]',

                '[class*="select"]', '[class*="currency"]', 'select',

                // Cart widgets

                '[data-hook*="cart"]', '[class*="cart"]', '#SITE_CART',

                '[id*="cart"]', '[aria-label*="cart" i]',

                // Product pages

                '[data-hook*="product"]', '[class*="product"]',

                '[data-hook*="breadcrumb"]', '[class*="breadcrumb"]',

                // Wix Stores elements

                '[id*="STORES"]', '[id*="PRODUCT"]',

                '[data-testid]'

            ];

            

            let totalWidgets = 0;

            

            wixSelectors.forEach((selector, selectorIndex) => {

                try {

                    const widgets = container.querySelectorAll(selector);

                    if (widgets.length > 0) {

                        console.log(`   Selector #${selectorIndex + 1} "${selector}": ${widgets.length} widgets found`);

                        totalWidgets += widgets.length;

                        

                        widgets.forEach((widget, widgetIndex) => {

                            console.log(`      Processing widget #${widgetIndex + 1}...`);

                            this.deepProcessWidget(widget, toDark);

                        });

                    }

                } catch (e) {

                    console.warn(`   Invalid selector: ${selector}`, e);

                }

            });

            

            console.log(`✅ Processed ${totalWidgets} Wix widgets`);

        }



        deepProcessWidget(widget, toDark) {

            console.log(`      🔍 deepProcessWidget for:`, widget.tagName || widget);

            

            this.storeOriginalColorsForElement(widget);

            this.processElement(widget, toDark);

            this.processedElements.add(widget);

            

            const descendants = widget.querySelectorAll('*');

            console.log(`         Widget has ${descendants.length} descendants`);

            

            descendants.forEach(el => {

                this.storeOriginalColorsForElement(el);

                this.processElement(el, toDark);

                this.processedElements.add(el);

            });

            

            if (widget.shadowRoot) {

                console.log(`         Widget has shadowRoot, processing...`);

                this.processShadowRoot(widget.shadowRoot, toDark);

            }

            

            console.log(`      ✅ Widget processing complete`);

        }



        disconnectedCallback() {

            console.log('🔌 disconnectedCallback fired - element removed from DOM');

            

            if (this.observer) {

                console.log('🛑 Disconnecting mutation observer...');

                this.observer.disconnect();

            }

            

            clearTimeout(this.pendingTimeout);

            console.log('⏰ Cleared pending timeout');

        }

    }



    // Register the custom element

    try {

        console.log('📝 Registering custom element "theme-switcher"...');

        customElements.define('theme-switcher', ThemeSwitcherElement);

        console.log('✅ theme-switcher custom element registered successfully');

    } catch (error) {

        console.error('❌ Failed to register theme-switcher:', error);

    }



    // Export for module compatibility (optional, won't break non-module usage)

    if (typeof module !== 'undefined' && module.exports) {

        console.log('📦 Exporting as CommonJS module');

        module.exports = { ThemeSwitcherElement };

    }

    

    // Also make available globally

    window.ThemeSwitcherElement = ThemeSwitcherElement;

    console.log('🌐 ThemeSwitcherElement added to window object');

    

    console.log('🎉 ========== SCRIPT INITIALIZATION COMPLETE ==========');



})();
