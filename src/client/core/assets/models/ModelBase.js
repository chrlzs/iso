/**
 * Base class for all model types
 * @class ModelBase
 */
export class ModelBase {
    /**
     * Creates a new model
     * @param {string} id - Unique identifier for the model
     * @param {Object} [options={}] - Model options
     */
    constructor(id, options = {}) {
        this.id = id;
        this.type = options.type || 'generic';
        this.textures = new Map();
        this.options = options;
    }

    /**
     * Adds a texture to the model
     * @param {string} textureId - Texture identifier
     * @param {TextureBase} texture - Texture instance
     */
    addTexture(textureId, texture) {
        this.textures.set(textureId, texture);
    }

    /**
     * Gets a texture by ID
     * @param {string} textureId - Texture identifier
     * @returns {TextureBase|null} The texture or null if not found
     */
    getTexture(textureId) {
        return this.textures.get(textureId) || null;
    }

    /**
     * Loads all textures for this model
     * @async
     * @param {AssetManager} assetManager - Asset manager instance
     * @returns {Promise<void>}
     */
    async loadTextures(assetManager) {
        const promises = [];
        for (const texture of this.textures.values()) {
            promises.push(texture.load(assetManager));
        }
        await Promise.all(promises);
    }

    /**
     * Renders the model
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    render(ctx, x, y, width, height) {
        // This should be overridden by subclasses
        throw new Error('render must be implemented by subclasses');
    }
}
