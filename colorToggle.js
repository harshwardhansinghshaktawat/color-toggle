// colorToggle.js - Wix Studio Custom Element for Intelligent Theme Toggle

class ColorToggleElement extends HTMLElement {
  constructor() {
    super();
    this.isDarkMode = false;
    this.originalStyles = new Map();
    this.colorProperties = [
      'color', 'background-color', 'background', 'border-color',
      'box-shadow', 'text-shadow', 'outline-color', 'fill', 'stroke'
    ];
    this.init();
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.detectInitialTheme();
  }

  init() {
    // Create shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .toggle-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: #f0f0f0;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid #ddd;
          user-select: none;
        }
        
        .toggle-container:hover {
          background: #e8e8e8;
          border-color: #bbb;
        }
        
        .toggle-container.dark {
          background: #2a2a2a;
          border-color: #444;
          color: #fff;
        }
        
        .toggle-container.dark:hover {
          background: #333;
          border-color: #555;
        }
        
        .toggle-switch {
          position: relative;
          width: 50px;
          height: 24px;
          background: #ccc;
          border-radius: 12px;
          transition: background 0.3s ease;
        }
        
        .toggle-switch.active {
          background: #4CAF50;
        }
        
        .toggle-switch.dark {
          background: #555;
        }
        
        .toggle-switch.dark.active {
          background: #66BB6A;
        }
        
        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .toggle-knob.active {
          transform: translateX(26px);
        }
        
        .toggle-label {
          font-size: 14px;
          font-weight: 500;
          transition: color 0.3s ease;
        }
        
        .icon {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }
        
        .icon.sun {
          color: #FFA726;
        }
        
        .icon.moon {
          color: #42A5F5;
        }
      </style>
      
      <div class="toggle-container" id="toggleContainer">
        <span class="icon sun" id="sunIcon">☀️</span>
        <div class="toggle-switch" id="toggleSwitch">
          <div class="toggle-knob" id="toggleKnob"></div>
        </div>
        <span class="icon moon" id="moonIcon">🌙</span>
        <span class="toggle-label" id="toggleLabel">Light Mode</span>
      </div>
    `;
  }

  attachEventListeners() {
    const container = this.shadowRoot.getElementById('toggleContainer');
    container.addEventListener('click', () => this.toggleTheme());
  }

  detectInitialTheme() {
    // Analyze the current page colors to determine if it's already in dark mode
    const bodyBg = this.getComputedColor(document.body, 'background-color');
    const bodyColor = this.getComputedColor(document.body, 'color');
    
    const bgLuminance = this.getLuminance(bodyBg);
    const textLuminance = this.getLuminance(bodyColor);
    
    // If background is dark and text is light, assume dark mode
    this.isDarkMode = bgLuminance < 0.5 && textLuminance > 0.5;
    this.updateToggleUI();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.updateToggleUI();
    
    if (this.isDarkMode) {
      this.applyDarkMode();
    } else {
      this.applyLightMode();
    }
    
    // Dispatch custom event for external listeners
    this.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { isDarkMode: this.isDarkMode },
      bubbles: true
    }));
  }

  updateToggleUI() {
    const container = this.shadowRoot.getElementById('toggleContainer');
    const toggleSwitch = this.shadowRoot.getElementById('toggleSwitch');
    const toggleKnob = this.shadowRoot.getElementById('toggleKnob');
    const label = this.shadowRoot.getElementById('toggleLabel');
    
    if (this.isDarkMode) {
      container.classList.add('dark');
      toggleSwitch.classList.add('dark', 'active');
      toggleKnob.classList.add('active');
      label.textContent = 'Dark Mode';
    } else {
      container.classList.remove('dark');
      toggleSwitch.classList.remove('dark', 'active');
      toggleKnob.classList.remove('active');
      label.textContent = 'Light Mode';
    }
  }

  applyDarkMode() {
    this.scanAndTransformElements(true);
  }

  applyLightMode() {
    this.scanAndTransformElements(false);
  }

  scanAndTransformElements(toDark) {
    // Get all elements in the document
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      // Skip the custom element itself
      if (element.tagName === 'COLOR-TOGGLE') return;
      
      this.transformElementColors(element, toDark);
      this.handleHoverStates(element, toDark);
    });
    
    // Transform document body
    this.transformElementColors(document.body, toDark);
    this.transformElementColors(document.documentElement, toDark);
  }

  transformElementColors(element, toDark) {
    const computedStyle = window.getComputedStyle(element);
    const elementId = this.getElementId(element);
    
    // Store original styles if not already stored
    if (!this.originalStyles.has(elementId)) {
      this.originalStyles.set(elementId, {});
    }
    
    const originalStyles = this.originalStyles.get(elementId);
    
    this.colorProperties.forEach(property => {
      const currentValue = computedStyle.getPropertyValue(property);
      
      if (currentValue && currentValue !== 'none' && currentValue !== 'transparent') {
        // Store original value
        if (!originalStyles[property]) {
          originalStyles[property] = currentValue;
        }
        
        let transformedColor;
        if (toDark) {
          transformedColor = this.transformColorToDark(currentValue, property);
        } else {
          // Restore original or transform to light
          transformedColor = originalStyles[property] ? 
            this.transformColorToLight(originalStyles[property], property) :
            this.transformColorToLight(currentValue, property);
        }
        
        if (transformedColor) {
          element.style.setProperty(property, transformedColor, 'important');
        }
      }
    });
  }

  handleHoverStates(element, toDark) {
    // Create or update hover styles
    const hoverStyleId = `hover-styles-${this.getElementId(element)}`;
    let styleElement = document.getElementById(hoverStyleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = hoverStyleId;
      document.head.appendChild(styleElement);
    }
    
    // Generate intelligent hover styles
    const elementSelector = this.generateSelector(element);
    const baseColor = this.getComputedColor(element, 'background-color');
    const textColor = this.getComputedColor(element, 'color');
    
    let hoverBg, hoverText;
    if (toDark) {
      hoverBg = this.adjustColorBrightness(baseColor, 0.2);
      hoverText = this.adjustColorBrightness(textColor, 0.1);
    } else {
      hoverBg = this.adjustColorBrightness(baseColor, -0.1);
      hoverText = this.adjustColorBrightness(textColor, -0.1);
    }
    
    styleElement.textContent = `
      ${elementSelector}:hover {
        background-color: ${hoverBg} !important;
        color: ${hoverText} !important;
        transition: all 0.3s ease !important;
      }
    `;
  }

  transformColorToDark(color, property) {
    const rgb = this.parseColor(color);
    if (!rgb) return null;
    
    const luminance = this.getLuminance(rgb);
    
    // Intelligent transformation based on property and current luminance
    switch (property) {
      case 'background-color':
      case 'background':
        return luminance > 0.5 ? 
          this.generateDarkBackground(rgb) : 
          this.adjustColorBrightness(rgb, -0.3);
          
      case 'color':
        return luminance < 0.5 ? 
          this.generateLightText(rgb) : 
          this.adjustColorBrightness(rgb, 0.4);
          
      case 'border-color':
        return this.generateDarkBorder(rgb);
        
      case 'box-shadow':
      case 'text-shadow':
        return this.transformShadowToDark(color);
        
      default:
        return this.intelligentColorTransform(rgb, true);
    }
  }

  transformColorToLight(color, property) {
    const rgb = this.parseColor(color);
    if (!rgb) return null;
    
    const luminance = this.getLuminance(rgb);
    
    switch (property) {
      case 'background-color':
      case 'background':
        return luminance < 0.5 ? 
          this.generateLightBackground(rgb) : 
          this.adjustColorBrightness(rgb, 0.2);
          
      case 'color':
        return luminance > 0.5 ? 
          this.generateDarkText(rgb) : 
          this.adjustColorBrightness(rgb, -0.4);
          
      case 'border-color':
        return this.generateLightBorder(rgb);
        
      case 'box-shadow':
      case 'text-shadow':
        return this.transformShadowToLight(color);
        
      default:
        return this.intelligentColorTransform(rgb, false);
    }
  }

  generateDarkBackground(rgb) {
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return `hsl(${hsl.h}, ${Math.max(hsl.s * 0.8, 10)}%, ${Math.min(hsl.l * 0.15, 20)}%)`;
  }

  generateLightBackground(rgb) {
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return `hsl(${hsl.h}, ${Math.max(hsl.s * 0.6, 5)}%, ${Math.max(hsl.l * 5, 95)}%)`;
  }

  generateLightText(rgb) {
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return `hsl(${hsl.h}, ${Math.max(hsl.s * 0.9, 15)}%, ${Math.max(85, hsl.l * 4)})%`;
  }

  generateDarkText(rgb) {
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return `hsl(${hsl.h}, ${Math.max(hsl.s * 0.8, 10)}%, ${Math.min(25, hsl.l * 0.3)}%)`;
  }

  generateDarkBorder(rgb) {
    return this.adjustColorBrightness(rgb, -0.6);
  }

  generateLightBorder(rgb) {
    return this.adjustColorBrightness(rgb, 0.4);
  }

  transformShadowToDark(shadow) {
    // Transform shadow colors to work with dark theme
    return shadow.replace(/rgba?\([^)]+\)/g, (match) => {
      const rgb = this.parseColor(match);
      if (rgb) {
        return `rgba(0, 0, 0, ${rgb.a || 0.5})`;
      }
      return match;
    });
  }

  transformShadowToLight(shadow) {
    // Transform shadow colors to work with light theme
    return shadow.replace(/rgba?\([^)]+\)/g, (match) => {
      const rgb = this.parseColor(match);
      if (rgb) {
        return `rgba(0, 0, 0, ${(rgb.a || 0.5) * 0.3})`;
      }
      return match;
    });
  }

  intelligentColorTransform(rgb, toDark) {
    const luminance = this.getLuminance(rgb);
    const adjustment = toDark ? 
      (luminance > 0.5 ? -0.7 : -0.3) : 
      (luminance < 0.5 ? 0.7 : 0.3);
    
    return this.adjustColorBrightness(rgb, adjustment);
  }

  adjustColorBrightness(color, amount) {
    const rgb = typeof color === 'string' ? this.parseColor(color) : color;
    if (!rgb) return null;
    
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const newL = Math.max(0, Math.min(100, hsl.l + (amount * 100)));
    
    return `hsl(${hsl.h}, ${hsl.s}%, ${newL}%)`;
  }

  parseColor(color) {
    if (!color || color === 'transparent' || color === 'none') return null;
    
    // Handle different color formats
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    const hex = ctx.fillStyle;
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1
    } : null;
  }

  getComputedColor(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  getLuminance(color) {
    const rgb = typeof color === 'string' ? this.parseColor(color) : color;
    if (!rgb) return 0.5;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
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

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  getElementId(element) {
    return element.id || element.tagName + '-' + Array.from(element.parentNode.children).indexOf(element);
  }

  generateSelector(element) {
    let selector = element.tagName.toLowerCase();
    if (element.id) selector += `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) selector += `.${classes}`;
    }
    return selector;
  }

  // Public API methods
  setDarkMode() {
    if (!this.isDarkMode) {
      this.toggleTheme();
    }
  }

  setLightMode() {
    if (this.isDarkMode) {
      this.toggleTheme();
    }
  }

  getCurrentTheme() {
    return this.isDarkMode ? 'dark' : 'light';
  }

  resetAllStyles() {
    // Reset all elements to their original styles
    this.originalStyles.forEach((styles, elementId) => {
      const element = document.getElementById(elementId) || 
                     document.querySelector(`[data-element-id="${elementId}"]`);
      if (element) {
        Object.keys(styles).forEach(property => {
          element.style.removeProperty(property);
        });
      }
    });
    
    // Remove all hover style elements
    document.querySelectorAll('[id^="hover-styles-"]').forEach(el => el.remove());
    
    this.originalStyles.clear();
    this.isDarkMode = false;
    this.updateToggleUI();
  }
}

// Register the custom element
customElements.define('color-toggle', ColorToggleElement);

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColorToggleElement;
}
