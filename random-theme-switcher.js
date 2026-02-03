class RandomThemeSwitcher extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Initialize settings with defaults
        this.settings = {
            nightStartHour: 18, // 6 PM default
            defaultColors: {
                backgroundColor: '#ffffff',
                textColor: '#000000',
                primaryColor: '#3498db',
                secondaryColor: '#2ecc71',
                accentColor: '#e74c3c',
                borderColor: '#ecf0f1',
                surfaceColor: '#f8f9fa',
                mutedColor: '#6c757d',
                linkColor: '#0066cc',
                highlightColor: '#fff3cd',
                shadowColor: 'rgba(0,0,0,0.1)',
                overlayColor: 'rgba(0,0,0,0.5)'
            },
            lightPresets: [],
            darkPresets: []
        };
        
        this.appliedTheme = null;
        this.originalColors = new WeakMap();
    }

    static get observedAttributes() {
        return [
            'night-start-hour',
            // Default colors
            'default-bg-color', 'default-text-color', 'default-primary-color',
            'default-secondary-color', 'default-accent-color', 'default-border-color',
            'default-surface-color', 'default-muted-color', 'default-link-color',
            'default-highlight-color', 'default-shadow-color', 'default-overlay-color',
            // Light presets (20)
            'light-preset-1', 'light-preset-2', 'light-preset-3', 'light-preset-4', 'light-preset-5',
            'light-preset-6', 'light-preset-7', 'light-preset-8', 'light-preset-9', 'light-preset-10',
            'light-preset-11', 'light-preset-12', 'light-preset-13', 'light-preset-14', 'light-preset-15',
            'light-preset-16', 'light-preset-17', 'light-preset-18', 'light-preset-19', 'light-preset-20',
            // Dark presets (20)
            'dark-preset-1', 'dark-preset-2', 'dark-preset-3', 'dark-preset-4', 'dark-preset-5',
            'dark-preset-6', 'dark-preset-7', 'dark-preset-8', 'dark-preset-9', 'dark-preset-10',
            'dark-preset-11', 'dark-preset-12', 'dark-preset-13', 'dark-preset-14', 'dark-preset-15',
            'dark-preset-16', 'dark-preset-17', 'dark-preset-18', 'dark-preset-19', 'dark-preset-20'
        ];
    }

    connectedCallback() {
        this.render();
        this.loadSettings();
        this.applyRandomTheme();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.loadSettings();
            // Only reapply if already rendered
            if (this.appliedTheme) {
                this.applyRandomTheme();
            }
        }
    }

    loadSettings() {
        // Load night start hour
        const nightHour = this.getAttribute('night-start-hour');
        if (nightHour) {
            this.settings.nightStartHour = parseInt(nightHour, 10);
        }

        // Load default colors
        const colorMap = {
            'default-bg-color': 'backgroundColor',
            'default-text-color': 'textColor',
            'default-primary-color': 'primaryColor',
            'default-secondary-color': 'secondaryColor',
            'default-accent-color': 'accentColor',
            'default-border-color': 'borderColor',
            'default-surface-color': 'surfaceColor',
            'default-muted-color': 'mutedColor',
            'default-link-color': 'linkColor',
            'default-highlight-color': 'highlightColor',
            'default-shadow-color': 'shadowColor',
            'default-overlay-color': 'overlayColor'
        };

        Object.keys(colorMap).forEach(attr => {
            const value = this.getAttribute(attr);
            if (value) {
                this.settings.defaultColors[colorMap[attr]] = value;
            }
        });

        // Load light presets
        this.settings.lightPresets = [];
        for (let i = 1; i <= 20; i++) {
            const preset = this.getAttribute(`light-preset-${i}`);
            if (preset) {
                try {
                    this.settings.lightPresets.push(JSON.parse(preset));
                } catch (e) {
                    console.warn(`Invalid light preset ${i}:`, e);
                }
            }
        }

        // Load dark presets
        this.settings.darkPresets = [];
        for (let i = 1; i <= 20; i++) {
            const preset = this.getAttribute(`dark-preset-${i}`);
            if (preset) {
                try {
                    this.settings.darkPresets.push(JSON.parse(preset));
                } catch (e) {
                    console.warn(`Invalid dark preset ${i}:`, e);
                }
            }
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                }
            </style>
        `;
    }

    isNightTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const nightStart = this.settings.nightStartHour;
        
        // Night time is from nightStart to 6 AM
        return currentHour >= nightStart || currentHour < 6;
    }

    getRandomPreset() {
        const isNight = this.isNightTime();
        const presets = isNight ? this.settings.darkPresets : this.settings.lightPresets;
        
        // If no presets available, return default colors
        if (!presets || presets.length === 0) {
            console.log('No presets available, using default colors');
            return this.settings.defaultColors;
        }

        // Select random preset with equal probability
        const randomIndex = Math.floor(Math.random() * presets.length);
        const selectedPreset = presets[randomIndex];
        
        console.log(`Selected ${isNight ? 'dark' : 'light'} preset ${randomIndex + 1} of ${presets.length}`);
        
        return selectedPreset;
    }

    applyRandomTheme() {
        console.log('🎨 Applying random theme...');
        
        const theme = this.getRandomPreset();
        this.appliedTheme = theme;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyThemeToPage(theme);
            });
        } else {
            this.applyThemeToPage(theme);
        }
    }

    applyThemeToPage(theme) {
        console.log('Applying theme to page:', theme);
        
        // Store original colors first
        this.storeOriginalColors();
        
        // Apply theme colors to all elements
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            if (element.closest('random-theme-switcher')) return;
            
            this.applyThemeToElement(element, theme);
            
            // Also process shadow DOM if exists
            if (element.shadowRoot) {
                const shadowElements = element.shadowRoot.querySelectorAll('*');
                shadowElements.forEach(shadowEl => {
                    this.applyThemeToElement(shadowEl, theme);
                });
            }
        });
        
        console.log('✅ Theme applied successfully');
    }

    storeOriginalColors() {
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            if (element.closest('random-theme-switcher')) return;
            if (this.originalColors.has(element)) return;
            
            try {
                const computedStyle = window.getComputedStyle(element);
                this.originalColors.set(element, {
                    backgroundColor: computedStyle.backgroundColor,
                    color: computedStyle.color,
                    borderColor: computedStyle.borderColor,
                    fill: computedStyle.fill,
                    stroke: computedStyle.stroke
                });
            } catch (e) {
                // Element not accessible
            }
        });
    }

    applyThemeToElement(element, theme) {
        try {
            const computedStyle = window.getComputedStyle(element);
            
            // Apply background color mapping
            const bgColor = computedStyle.backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                const brightness = this.getColorBrightness(bgColor);
                
                if (brightness > 200) {
                    // Very light backgrounds
                    element.style.backgroundColor = theme.backgroundColor || this.settings.defaultColors.backgroundColor;
                } else if (brightness > 150) {
                    // Light backgrounds
                    element.style.backgroundColor = theme.surfaceColor || this.settings.defaultColors.surfaceColor;
                } else if (brightness < 50) {
                    // Very dark backgrounds
                    element.style.backgroundColor = theme.textColor || this.settings.defaultColors.textColor;
                }
            }
            
            // Apply text color mapping
            const textColor = computedStyle.color;
            if (textColor) {
                const brightness = this.getColorBrightness(textColor);
                
                if (brightness > 150) {
                    // Light text
                    element.style.color = theme.backgroundColor || this.settings.defaultColors.backgroundColor;
                } else if (brightness < 100) {
                    // Dark text
                    element.style.color = theme.textColor || this.settings.defaultColors.textColor;
                }
            }
            
            // Apply border colors
            if (computedStyle.borderTopColor && computedStyle.borderTopColor !== 'rgba(0, 0, 0, 0)') {
                element.style.borderColor = theme.borderColor || this.settings.defaultColors.borderColor;
            }
            
            // Apply SVG fills
            if (element.tagName === 'svg' || element.closest('svg')) {
                if (computedStyle.fill && computedStyle.fill !== 'none') {
                    element.style.fill = theme.primaryColor || this.settings.defaultColors.primaryColor;
                }
                if (computedStyle.stroke && computedStyle.stroke !== 'none') {
                    element.style.stroke = theme.accentColor || this.settings.defaultColors.accentColor;
                }
            }
            
        } catch (e) {
            // Element not accessible, skip
        }
    }

    getColorBrightness(color) {
        // Convert any color format to RGB
        const rgb = this.colorToRGB(color);
        if (!rgb) return 128; // Default mid-brightness
        
        // Calculate perceived brightness
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }

    colorToRGB(color) {
        if (!color) return null;
        
        // Handle rgb/rgba format
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }
        
        // Handle hex format
        const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (hexMatch) {
            return {
                r: parseInt(hexMatch[1], 16),
                g: parseInt(hexMatch[2], 16),
                b: parseInt(hexMatch[3], 16)
            };
        }
        
        return null;
    }
}

customElements.define('random-theme-switcher', RandomThemeSwitcher);
