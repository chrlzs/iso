import { PIXI } from '../utils/PixiWrapper.js';

/**
 * TextureAtlas class for combining multiple textures into a single atlas
 * to reduce texture switching and improve rendering performance.
 * Optimized for PixiJS.
 */
export class TextureAtlas {
    /**
     * Create a new texture atlas
     * @param {Object} options - Configuration options
     * @param {number} options.maxWidth - Maximum width of the atlas (default: 2048)
     * @param {number} options.maxHeight - Maximum height of the atlas (default: 2048)
     * @param {number} options.padding - Padding between textures (default: 2)
     * @param {boolean} options.debug - Whether to show debug visualization (default: false)
     * @param {PIXI.Application} options.app - PixiJS application instance for debug visualization
     */
    constructor(options = {}) {
        this.maxWidth = options.maxWidth || 2048;
        this.maxHeight = options.maxHeight || 2048;
        this.padding = options.padding || 2;

        // Create the atlas canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.maxWidth;
        this.canvas.height = this.maxHeight;
        this.ctx = this.canvas.getContext('2d');

        // Initialize texture mapping
        this.textures = new Map();
        this.regions = [];
        this.pixiTextures = new Map();

        // Track current position for packing
        this.currentX = 0;
        this.currentY = 0;
        this.rowHeight = 0;

        // Debug flag and PixiJS app reference
        this.debug = options.debug || false;
        this.app = options.app || null;
        this.debugContainer = null;

        // Create PixiJS base texture from canvas
        this.baseTexture = null;

        if (this.debug && this.app) {
            this.setupDebugView();
        }
    }

    /**
     * Set up debug visualization
     * @private
     */
    setupDebugView() {
        // Create debug container
        this.debugContainer = new PIXI.Container();
        this.debugContainer.position.set(10, 10);
        this.app.stage.addChild(this.debugContainer);

        // Create sprite from atlas
        this.updateDebugView();
    }

    /**
     * Update the debug visualization
     * @private
     */
    updateDebugView() {
        if (!this.debug || !this.app) return;

        // Clear previous debug view
        if (this.debugContainer) {
            this.debugContainer.removeChildren();
        }

        // Create new base texture from canvas
        const baseTexture = PIXI.BaseTexture.from(this.canvas);
        const texture = new PIXI.Texture(baseTexture);

        // Create sprite
        const sprite = new PIXI.Sprite(texture);
        sprite.width = 256;
        sprite.height = 256;
        sprite.alpha = 0.8;

        // Add border
        const border = new PIXI.Graphics();
        border.lineStyle(1, 0xff0000);
        border.drawRect(0, 0, sprite.width, sprite.height);

        // Add to debug container
        this.debugContainer.addChild(sprite);
        this.debugContainer.addChild(border);
    }

    /**
     * Add a single texture to the atlas
     * @param {string} id - Unique identifier for the texture
     * @param {HTMLImageElement|HTMLCanvasElement} texture - The texture to add
     * @returns {Object|null} - The region in the atlas, or null if it couldn't be added
     */
    addTexture(id, texture) {
        // Skip if already in atlas
        if (this.textures.has(id)) {
            return this.textures.get(id);
        }

        // Get texture dimensions
        const width = texture.width;
        const height = texture.height;

        // Check if we need to start a new row
        if (this.currentX + width + this.padding > this.maxWidth) {
            this.currentX = 0;
            this.currentY += this.rowHeight + this.padding;
            this.rowHeight = 0;
        }

        // Check if we have room in the atlas
        if (this.currentY + height + this.padding > this.maxHeight) {
            console.warn(`TextureAtlas: No room for texture ${id} (${width}x${height})`);
            return null;
        }

        // Add the texture to the atlas
        this.ctx.drawImage(texture, this.currentX, this.currentY, width, height);

        // Create the region
        const region = {
            id,
            x: this.currentX,
            y: this.currentY,
            width,
            height,
            u1: this.currentX / this.maxWidth,
            v1: this.currentY / this.maxHeight,
            u2: (this.currentX + width) / this.maxWidth,
            v2: (this.currentY + height) / this.maxHeight
        };

        // Store the region
        this.textures.set(id, region);
        this.regions.push(region);

        // Draw debug border
        if (this.debug) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(this.currentX, this.currentY, width, height);

            // Draw texture ID
            this.ctx.fillStyle = 'white';
            this.ctx.font = '8px Arial';
            this.ctx.fillText(id, this.currentX + 2, this.currentY + 8);
        }

        // Update position for next texture
        this.currentX += width + this.padding;
        this.rowHeight = Math.max(this.rowHeight, height);

        // Update PixiJS textures
        this.updatePixiTextures();

        // Update debug view
        if (this.debug && this.app) {
            this.updateDebugView();
        }

        return region;
    }

    /**
     * Update PixiJS textures from the atlas
     * @private
     */
    updatePixiTextures() {
        // Create new base texture from canvas
        this.baseTexture = PIXI.BaseTexture.from(this.canvas);

        // Create textures for each region
        this.regions.forEach(region => {
            const frame = new PIXI.Rectangle(region.x, region.y, region.width, region.height);
            const texture = new PIXI.Texture(this.baseTexture, frame);
            this.pixiTextures.set(region.id, texture);
        });
    }

    /**
     * Add multiple textures to the atlas
     * @param {Map|Object} textures - Map or object of textures to add
     * @returns {Map} - Map of texture IDs to atlas regions
     */
    addTextures(textures) {
        // Handle Map
        if (textures instanceof Map) {
            textures.forEach((texture, id) => {
                this.addTexture(id, texture);
            });
        }
        // Handle object
        else if (typeof textures === 'object') {
            Object.entries(textures).forEach(([id, texture]) => {
                this.addTexture(id, texture);
            });
        }

        return this.textures;
    }

    /**
     * Get a texture region from the atlas
     * @param {string} id - The texture ID
     * @returns {Object|null} - The texture region or null if not found
     */
    getRegion(id) {
        return this.textures.get(id) || null;
    }

    /**
     * Get a PixiJS texture from the atlas
     * @param {string} id - The texture ID
     * @returns {PIXI.Texture|null} - The PixiJS texture or null if not found
     */
    getPixiTexture(id) {
        return this.pixiTextures.get(id) || null;
    }

    /**
     * Get the atlas texture
     * @returns {HTMLCanvasElement} - The atlas canvas
     */
    getTexture() {
        return this.canvas;
    }

    /**
     * Get the PixiJS base texture
     * @returns {PIXI.BaseTexture} - The PixiJS base texture
     */
    getBaseTexture() {
        return this.baseTexture;
    }

    /**
     * Clear the atlas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.maxWidth, this.maxHeight);
        this.textures.clear();
        this.regions = [];
        this.pixiTextures.clear();
        this.currentX = 0;
        this.currentY = 0;
        this.rowHeight = 0;

        // Update debug view
        if (this.debug && this.app) {
            this.updateDebugView();
        }
    }

    /**
     * Get the number of textures in the atlas
     * @returns {number} - The number of textures
     */
    getTextureCount() {
        return this.textures.size;
    }

    /**
     * Check if the atlas contains a texture
     * @param {string} id - The texture ID
     * @returns {boolean} - True if the atlas contains the texture
     */
    hasTexture(id) {
        return this.textures.has(id);
    }

    /**
     * Get all texture regions in the atlas
     * @returns {Array} - Array of texture regions
     */
    getAllRegions() {
        return this.regions;
    }

    /**
     * Get all PixiJS textures in the atlas
     * @returns {Map} - Map of texture IDs to PixiJS textures
     */
    getAllPixiTextures() {
        return this.pixiTextures;
    }
}
