/**
 * Base class for all game entities (players, NPCs, objects, etc.)
 * @class Entity
 */
export class Entity {
    /**
     * Creates a new Entity
     * @param {Object} config - Entity configuration object
     * @param {number} config.x - Initial X position in world coordinates
     * @param {number} config.y - Initial Y position in world coordinates
     * @param {number} [config.width=32] - Entity width in pixels
     * @param {number} [config.height=32] - Entity height in pixels
     * @param {string} [config.type='entity'] - Entity type identifier
     * @throws {Error} If x or y coordinates are not provided
     */
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width || 32;
        this.height = config.height || 32;
        this.type = config.type || 'entity';
        
        // Movement properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 200; // pixels per second
        
        // State flags
        this.isActive = true;
        this.isVisible = true;
    }

    /**
     * Updates entity state for the current frame
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     * @returns {void}
     */
    update(deltaTime) {
        // Convert deltaTime to seconds
        const dt = deltaTime / 1000;
        
        // Update position based on velocity
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
    }

    /**
     * Renders the entity on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context
     * @returns {void}
     */
    render(ctx) {
        // Default rendering - can be overridden by specific entity types
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }

    /**
     * Sets the entity's position in world coordinates
     * @param {number} x - New X coordinate
     * @param {number} y - New Y coordinate
     * @returns {void}
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Sets the entity's velocity components
     * @param {number} x - Velocity X component in pixels per second
     * @param {number} y - Velocity Y component in pixels per second
     * @returns {void}
     */
    setVelocity(x, y) {
        this.velocityX = x;
        this.velocityY = y;
    }

    /**
     * Gets entity's current position in world coordinates
     * @returns {{x: number, y: number}} Position object with x and y coordinates
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Gets entity's bounding box for collision detection
     * @returns {{x: number, y: number, width: number, height: number}} Bounding box dimensions and position
     */
    getBounds() {
        return {
            x: this.x - this.width/2,
            y: this.y - this.height/2,
            width: this.width,
            height: this.height
        };
    }
}