/**
 * Base class for all texture types
 * @class TextureBase
 */
export class TextureBase {
    /**
     * Creates a new texture
     * @param {string} id - Unique identifier for the texture
     * @param {Object} [options={}] - Texture options
     */
    constructor(id, options = {}) {
        this.id = id;
        this.type = options.type || 'generic';
        this.image = null;
        this.isLoaded = false;
        this.loadPromise = null;
        this.options = options;
    }

    /**
     * Loads the texture
     * @async
     * @param {AssetManager} assetManager - Asset manager instance
     * @returns {Promise<HTMLImageElement>} The loaded image
     */
    async load(assetManager) {
        if (this.isLoaded) {
            return this.image;
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        // If we have a source URL, load from there
        if (this.options.src) {
            this.loadPromise = assetManager.loadImage(`${this.type}_${this.id}`, this.options.src);
            this.image = await this.loadPromise;
            this.isLoaded = true;
            return this.image;
        }

        // If we have a color, generate a texture
        if (this.options.color) {
            this.image = await this.generateTexture(assetManager);
            this.isLoaded = true;
            return this.image;
        }

        throw new Error(`No source or color defined for texture: ${this.id}`);
    }

    /**
     * Generates a texture based on options
     * @async
     * @param {AssetManager} assetManager - Asset manager instance
     * @returns {Promise<HTMLImageElement>} The generated image
     */
    async generateTexture(assetManager) {
        // This should be overridden by subclasses
        throw new Error('generateTexture must be implemented by subclasses');
    }

    /**
     * Gets the texture as a pattern
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @returns {CanvasPattern|null} The pattern or null if not loaded
     */
    getPattern(ctx) {
        if (!this.isLoaded || !this.image) {
            return null;
        }

        return ctx.createPattern(this.image, 'repeat');
    }
}
