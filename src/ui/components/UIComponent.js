import { PIXI } from '../../utils/PixiWrapper.js';

/**
 * Base class for all UI components
 * Provides common functionality for UI elements
 */
export class UIComponent extends PIXI.Container {
    /**
     * Creates a new UI component
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        super();

        // Component properties
        this.id = options.id || `component-${Math.floor(Math.random() * 10000)}`;
        this.game = options.game || null;
        this.active = options.active !== false;
        this.visible = options.visible !== false;

        // Make component interactive if needed
        if (options.interactive !== false) {
            this.eventMode = 'static';
            this.interactive = true;
        }

        // Set position
        if (options.x !== undefined) this.x = options.x;
        if (options.y !== undefined) this.y = options.y;

        // Set dimensions
        this.width = options.width || 0;
        this.height = options.height || 0;

        // Set z-index for proper layering
        this.zIndex = options.zIndex || 0;

        // Cyberpunk color scheme
        this.colors = {
            primary: 0x00AAFF,    // Neon blue
            secondary: 0x00FFAA,   // Neon cyan
            dark: 0x000811,       // Dark blue-black
            accent: 0xFF00AA,     // Neon pink
            warning: 0xFFAA00,    // Neon orange
            success: 0x33FF66,    // Neon green
            error: 0xFF3366,      // Neon red
            text: 0xFFFFFF,       // White
            healthBar: 0xFF3366,  // Health bar color
            energyBar: 0x33FFAA,  // Energy bar color
            expBar: 0xFF00AA      // Experience bar color
        };

        // Default styles
        this.styles = {
            text: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 14,
                fill: this.colors.text,
                stroke: this.colors.dark,
                strokeThickness: 2
            }),
            heading: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 18,
                fontWeight: 'bold',
                fill: this.colors.text,
                stroke: this.colors.primary,
                strokeThickness: 3,
                dropShadow: true,
                dropShadowColor: this.colors.primary,
                dropShadowBlur: 4,
                dropShadowDistance: 0
            })
        };
    }

    /**
     * Shows the component
     */
    show() {
        this.visible = true;
    }

    /**
     * Hides the component
     */
    hide() {
        this.visible = false;
    }

    /**
     * Toggles the component visibility
     * @returns {boolean} New visibility state
     */
    toggle() {
        this.visible = !this.visible;
        return this.visible;
    }

    /**
     * Updates the component
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Override in subclasses
    }

    /**
     * Resizes the component
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Override in subclasses
    }

    /**
     * Destroys the component and removes it from its parent
     */
    destroy() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        super.destroy({ children: true });
    }
}
