import { TextureBase } from './TextureBase.js';

/**
 * Class representing a tile texture
 * @class TileTexture
 * @extends TextureBase
 */
export class TileTexture extends TextureBase {
    /**
     * Checks if this texture can be generated without a color or source
     * @returns {boolean} True if the texture can be generated
     */
    canGenerateTexture() {
        // Tile textures need a color to be generated
        return this.options.color !== undefined;
    }
    /**
     * Creates a new tile texture
     * @param {string} id - Unique identifier for the texture
     * @param {Object} [options={}] - Texture options
     */
    constructor(id, options = {}) {
        super(id, { ...options, type: 'tile' });

        this.tileSize = options.tileSize || 64;
        this.baseColor = options.color || '#7f7f7f';
        this.noiseIntensity = options.noiseIntensity || 0.2;
        this.roughness = options.roughness || 0.5;
        this.usePattern = options.usePattern !== undefined ? options.usePattern : true;
        this.variants = options.variants || [];
    }

    /**
     * Generates a tile texture
     * @async
     * @param {AssetManager} assetManager - Asset manager instance
     * @returns {Promise<HTMLImageElement>} The generated image
     */
    async generateTexture(assetManager) {
        // Create a canvas for the texture
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Fill with base color
        ctx.fillStyle = this.baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise pattern if enabled
        if (this.usePattern) {
            this.applyNoisePattern(ctx, canvas.width, canvas.height);
        }

        // Apply roughness
        this.applyRoughness(ctx, canvas.width, canvas.height);

        // Convert canvas to image
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = canvas.toDataURL('image/png');
        });
    }

    /**
     * Applies a noise pattern to the texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    applyNoisePattern(ctx, width, height) {
        // Apply noise pattern
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (Math.random() < this.noiseIntensity) {
                    const noise = Math.random() * 0.2 - 0.1;
                    ctx.fillStyle = this.adjustColor(this.baseColor, noise);
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    /**
     * Applies roughness to the texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    applyRoughness(ctx, width, height) {
        // Apply roughness
        const roughnessScale = this.roughness * 10;
        for (let i = 0; i < roughnessScale * 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3 + 1;
            const noise = (Math.random() - 0.5) * this.roughness * 0.3;

            ctx.fillStyle = this.adjustColor(this.baseColor, noise);
            ctx.fillRect(x, y, size, size);
        }
    }

    /**
     * Adjusts a color by a delta value
     * @param {string} color - Base color in hex format
     * @param {number} delta - Delta value (-1 to 1)
     * @returns {string} Adjusted color
     */
    adjustColor(color, delta) {
        // Convert hex to RGB
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);

        // Adjust RGB values
        const adjustedR = Math.max(0, Math.min(255, r + Math.round(delta * 255)));
        const adjustedG = Math.max(0, Math.min(255, g + Math.round(delta * 255)));
        const adjustedB = Math.max(0, Math.min(255, b + Math.round(delta * 255)));

        // Convert back to hex
        return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
    }
}
