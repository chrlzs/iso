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

        try {
            // If we have a source URL, load from there
            if (this.options.src) {
                this.loadPromise = assetManager.loadImage(`${this.type}_${this.id}`, this.options.src);
                this.image = await this.loadPromise;
                this.isLoaded = true;
                return this.image;
            }

            // If we have a color or can generate a texture, do that
            if (this.options.color || this.canGenerateTexture()) {
                this.image = await this.generateTexture(assetManager);
                this.isLoaded = true;
                return this.image;
            }

            console.warn(`No source or color defined for texture: ${this.id}, using fallback`);
            // Create a fallback texture
            this.image = await this.createFallbackTexture();
            this.isLoaded = true;
            return this.image;
        } catch (error) {
            console.error(`Error loading texture ${this.id}:`, error);
            // Create a fallback texture on error
            this.image = await this.createFallbackTexture();
            this.isLoaded = true;
            return this.image;
        }
    }

    /**
     * Checks if this texture can be generated without a color or source
     * @returns {boolean} True if the texture can be generated
     */
    canGenerateTexture() {
        // Base implementation - subclasses should override this
        return false;
    }

    /**
     * Creates a fallback texture when no source or color is available
     * @returns {Promise<HTMLImageElement>} The fallback image
     */
    async createFallbackTexture() {
        // Create a simple colored canvas as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Draw a checkerboard pattern
        const squareSize = 16;
        for (let y = 0; y < canvas.height; y += squareSize) {
            for (let x = 0; x < canvas.width; x += squareSize) {
                ctx.fillStyle = (x + y) % (squareSize * 2) === 0 ? '#FF00FF' : '#FFFF00';
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }

        // Draw texture ID
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.fillText(`${this.type}_${this.id}`, 5, 15);

        // Convert canvas to image
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = canvas.toDataURL('image/png');
        });
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
