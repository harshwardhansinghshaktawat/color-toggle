class ColorToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isDarkMode = true; // Default to dark mode (original colors)

    // Color mappings
    this.colorMap = {
      dark: {
        '#222820': '#FFFFFF',
        '#424D3F': '#F0F0F0',
        '#787E76': '#C2C2C2',
        '#A3A9A1': '#6E6E6E',
        '#ECECEC': '#000000',
        '#B8C995': '#1A6AFF'
      },
      light: {
        '#FFFFFF': '#222820',
        '#F0F0F0': '#424D3F',
        '#C2C2C2': '#787E76',
        '#6E6E6E': '#A3A9A1',
        '#000000': '#ECECEC',
        '#1A6AFF': '#B8C995'
      }
    };

    // Create the toggle switch
    this.shadowRoot.innerHTML = `
      <style>
        .toggle-container {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: Arial, sans-serif;
        }
        .toggle-switch {
          position: relative;
          width: 60px;
          height: 34px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #1A6AFF;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        label {
          color: #222820;
          font-size: 16px;
        }
      </style>
      <div class="toggle-container">
        <label>Toggle Theme</label>
        <label class="toggle-switch">
          <input type="checkbox" checked>
          <span class="slider"></span>
        </label>
      </div>
    `;
  }

  connectedCallback() {
    // Add event listener to the toggle switch
    const toggle = this.shadowRoot.querySelector('input');
    toggle.addEventListener('change', () => {
      this.isDarkMode = toggle.checked;
      this.updateColors();
    });

    // Initial color update
    this.updateColors();
  }

  updateColors() {
    const mode = this.isDarkMode ? 'dark' : 'light';
    const currentColors = this.colorMap[mode];

    // Get all elements in the document
    const elements = document.querySelectorAll('*');

    elements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);

      // Check and update background color
      const bgColor = computedStyle.backgroundColor;
      if (bgColor && this.isValidColor(bgColor)) {
        const newBgColor = this.getMappedColor(bgColor, currentColors);
        if (newBgColor) {
          element.style.backgroundColor = newBgColor;
        }
      }

      // Check and update text color
      const textColor = computedStyle.color;
      if (textColor && this.isValidColor(textColor)) {
        const newTextColor = this.getMappedColor(textColor, currentColors);
        if (newTextColor) {
          element.style.color = newTextColor;
        }
      }

      // Check and update border color
      const borderColor = computedStyle.borderColor;
      if (borderColor && this.isValidColor(borderColor)) {
        const newBorderColor = this.getMappedColor(borderColor, currentColors);
        if (newBorderColor) {
          element.style.borderColor = newBorderColor;
        }
      }
    });
  }

  // Convert RGB/RGBA to Hex for comparison
  rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb.toUpperCase();
    const rgbMatch = rgb.match(/\d+/g);
    if (!rgbMatch) return null;
    const [r, g, b] = rgbMatch.map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  // Validate if the color is in a recognizable format
  isValidColor(color) {
    return color.startsWith('rgb') || color.startsWith('#');
  }

  // Get the mapped color from the colorMap
  getMappedColor(color, colorMap) {
    const hexColor = this.rgbToHex(color);
    if (!hexColor) return null;
    return colorMap[hexColor] || null;
  }
}

// Define the custom element
customElements.define('color-toggle', ColorToggle);
