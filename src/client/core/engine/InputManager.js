/**
 * Manages keyboard and mouse input
 * @class InputManager
 */
export class InputManager {
    constructor() {
        this.keys = new Set();
        this.mouseButtons = new Set();
        this.mouseX = 0;
        this.mouseY = 0;
        this.wheelDelta = 0;

        // Bind event handlers
        window.addEventListener('keydown', (e) => this.keys.add(e.key));
        window.addEventListener('keyup', (e) => this.keys.delete(e.key));
        
        window.addEventListener('mousedown', (e) => this.mouseButtons.add(this.getMouseButtonName(e.button)));
        window.addEventListener('mouseup', (e) => this.mouseButtons.delete(this.getMouseButtonName(e.button)));
        
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('wheel', (e) => {
            this.wheelDelta = e.deltaY;
            // Prevent page scrolling while gaming
            e.preventDefault();
        }, { passive: false });

        // Clear wheel delta on next frame
        window.requestAnimationFrame(() => {
            this.wheelDelta = 0;
        });
    }

    /**
     * Converts mouse button number to name
     * @private
     */
    getMouseButtonName(button) {
        switch (button) {
            case 0: return 'left';
            case 1: return 'middle';
            case 2: return 'right';
            default: return `button${button}`;
        }
    }

    /**
     * Checks if a key is currently pressed
     * @param {string} key - The key to check
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keys.has(key);
    }

    /**
     * Checks if a mouse button is currently pressed
     * @param {string} button - The button name to check
     * @returns {boolean}
     */
    isMouseButtonDown(button) {
        return this.mouseButtons.has(button);
    }

    /**
     * Gets and clears the current wheel delta
     * @returns {number}
     */
    getWheelDelta() {
        const delta = this.wheelDelta;
        this.wheelDelta = 0;
        return delta;
    }
}
