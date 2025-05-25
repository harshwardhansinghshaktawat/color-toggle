// colorToggle.js

class ColorToggleElement extends HTMLElement {
    constructor() {
        super();
        this.settings = {
            originalColors: '', // String like "background,#ffffff;text,#000000"
            replacementColors: '', // String like "background,#ff0000;text,#ffffff"
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
        const entries = colorString.split(';');
        return entries
            .map(entry => {
                const [key, value] = entry.split(',');
                if (key && value) {
                    return { key: key.trim(), value: value.trim() };
                }
                return null;
            })
            .filter(item => item !== null);
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

        // Apply colors to the document or specific elements
        originalColors.forEach((orig, index) => {
            const repl = replacementColors[index] || orig; // Fallback to original if no replacement
            const elements = document.querySelectorAll(`[data-color-key="${orig.key}"]`) || [document.body];
            elements.forEach(element => {
                if (orig.key === 'background') {
                    element.style.backgroundColor = this.settings.isToggled ? repl.value : orig.value;
                } else if (orig.key === 'text') {
                    element.style.color = this.settings.isToggled ? repl.value : orig.value;
                }
                // Add more style properties as needed (e.g., border, etc.)
            });
        });
    }

    disconnectedCallback() {
        // Clean up event listeners if necessary
    }
}

customElements.define('color-toggle', ColorToggleElement);
