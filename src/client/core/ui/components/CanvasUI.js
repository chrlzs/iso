/**
 * Manages UI elements that need to be drawn directly on the canvas
 * @class CanvasUI
 */
export class CanvasUI {
    /**
     * Creates a new CanvasUI instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Configuration options
     */
    constructor(game, options = {}) {
        this.game = game;
        this.elements = new Map();
        this.font = options.font || '14px Arial';
        this.padding = options.padding || 10;
    }

    /**
     * Adds a new UI element
     * @param {string} id - Element identifier
     * @param {Object} element - UI element configuration
     * @param {Function} element.render - Render function for the element
     * @param {boolean} [element.visible=true] - Whether element is visible
     */
    addElement(id, element) {
        this.elements.set(id, {
            ...element,
            visible: element.visible ?? true
        });
    }

    /**
     * Updates all UI elements
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        this.elements.forEach(element => {
            if (element.visible && element.update) {
                element.update(deltaTime);
            }
        });
    }

    /**
     * Renders all visible UI elements
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    render(ctx) {
        ctx.save();
        ctx.font = this.font;
        
        this.elements.forEach(element => {
            if (element.visible && element.render) {
                element.render(ctx);
            }
        });
        
        ctx.restore();
    }

    /**
     * Sets visibility of a UI element
     * @param {string} id - Element identifier
     * @param {boolean} visible - Visibility state
     */
    setElementVisibility(id, visible) {
        const element = this.elements.get(id);
        if (element) {
            element.visible = visible;
        }
    }
}
