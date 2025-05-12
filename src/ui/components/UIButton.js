/**
 * UIButton - A unified button class for both HTML and PIXI buttons
 * This class provides a consistent API for creating and managing buttons
 * regardless of whether they are HTML DOM elements or PIXI.js sprites
 */
export class UIButton {
    /**
     * Creates a new UI button
     * @param {Object} options - Button options
     */
    constructor(options = {}) {
        this.options = options;
        this.element = this.createElement();
    }

    /**
     * Creates the button element
     * @private
     */
    createElement() {
        const button = document.createElement('button');
        button.id = this.options.id;
        button.textContent = this.options.text;
        button.title = this.options.title || '';

        // Add base button class and any additional classes
        button.className = 'ui-button';
        button.classList.add(`btn-${this.options.id}`);

        // Add click handler
        if (this.options.onClick) {
            button.addEventListener('click', () => this.options.onClick(this));
        }

        // Set initial state
        if (this.options.active) {
            this.setActive(true);
        }

        // Set visibility
        if (this.options.visible === false) {
            this.hide();
        }

        return button;
    }

    /**
     * Sets the active state of the button
     * @param {boolean} active - Whether the button should be active
     */
    setActive(active) {
        if (active) {
            this.element.classList.add('active');
        } else {
            this.element.classList.remove('active');
        }
    }

    /**
     * Shows the button
     */
    show() {
        this.element.style.display = '';
    }

    /**
     * Hides the button
     */
    hide() {
        this.element.style.display = 'none';
    }

    /**
     * Destroys the button
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
