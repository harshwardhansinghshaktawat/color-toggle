// colorToggle.js

class ColorToggleElement extends HTMLElement {
    constructor() {
        super();
        this.settings = {
            originalColors: '#222820,#424D3F,#787E76,#A3A9A1,#ECECEC,#B8C995', // Default original colors
            replacementColors: '#FFFFFF,#F0F0F0,#C2C2C2,#6E6E6E,#000000,#1A6AFF', // Default replacement colors
            isToggled: false // Tracks toggle state
        };
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.renderToggle();
    }

    static get observedAttributes() {
        return ['options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue && name === 'options') {
            const newOptions = JSON.parse(newValue);
            Object.assign(this.settings, newOptions);
            this.applyColors(); // Apply colors when settings change
        }
    }

    parseColors(colorString) {
        if (!colorString) return [];
        return colorString.split(',').map(color => color.trim()).filter(color => color);
    }

    renderToggle() {
        // Clear existing content
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }

        // Create toggle switch
        const toggleContainer = document.createElement('div');
        toggleContainer.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                }
                .toggle-switch {
                    position: relative;
                    width: 60px;
                    height: 34px;
                }
                .toggle-checkbox {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .toggle-slider {
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
                .toggle-slider:before {
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
                .toggle-checkbox:checked + .toggle-slider {
                    background-color: #2196F3;
                }
                .toggle-checkbox:checked + .toggle-slider:before {
                    transform: translateX(26px);
                }
            </style>
            <label class="toggle-switch">
                <input type="checkbox" class="toggle-checkbox">
                <span class="toggle-slider"></span>
            </label>
        `;
        this.shadowRoot.appendChild(toggleContainer);

        // Add event listener for toggle
        const checkbox = this.shadowRoot.querySelector('.toggle-checkbox');
        checkbox.checked = this.settings.isToggled;
        checkbox.addEventListener('change', () => {
            this.settings.isToggled = checkbox.checked;
            this.applyColors();
            // Update widget props to persist toggle state
            window.wixWidget.setProps({ isToggled: this.settings.isToggled });
        });

        // Apply initial colors
        this.applyColors();
    }

    applyColors() {
        const originalColors = this.parseColors(this.settings.originalColors);
        const replacementColors = this.parseColors(this.settings.replacementColors);

        // Apply colors to elements with data-color-index attributes
        originalColors.forEach((origColor, index) => {
            const replColor = replacementColors[index] || origColor; // Fallback to original if no replacement
            const elements = document.querySelectorAll(`[data-color-index="${index}"]`) || [document.body];
            elements.forEach(element => {
                // Apply as background color; can be extended for other properties
                element.style.backgroundColor = this.settings.isToggled ? replColor : origColor;
            });
        });
    }

    disconnectedCallback() {
        // Clean up event listeners if necessary
    }
}

customElements.define('color-toggle', ColorToggleElement);
