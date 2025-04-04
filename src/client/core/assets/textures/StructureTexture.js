import { TextureBase } from './TextureBase.js';

/**
 * Class representing a structure texture
 * @class StructureTexture
 * @extends TextureBase
 */
export class StructureTexture extends TextureBase {
    /**
     * Checks if this texture can be generated without a color or source
     * @returns {boolean} True if the texture can be generated
     */
    canGenerateTexture() {
        // Structure textures can always be generated based on structureType
        return true;
    }
    /**
     * Creates a new structure texture
     * @param {string} id - Unique identifier for the texture
     * @param {Object} [options={}] - Texture options
     */
    constructor(id, options = {}) {
        super(id, { ...options, type: 'structure' });

        this.width = options.width || 128;
        this.height = options.height || 128;
        this.baseColor = options.color || '#a67c52';
        this.detailColor = options.detailColor || '#8c6142';
        this.structureType = options.structureType || 'generic';
        this.floors = options.floors || 1;
        this.roofColor = options.roofColor || '#8b4513';
        this.wallColor = options.wallColor || '#d2b48c';
    }

    /**
     * Generates a structure texture
     * @async
     * @param {AssetManager} assetManager - Asset manager instance
     * @returns {Promise<HTMLImageElement>} The generated image
     */
    async generateTexture(assetManager) {
        // Create a canvas for the texture
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        // Generate based on structure type
        switch (this.structureType) {
            case 'house':
                this.generateHouse(ctx, canvas.width, canvas.height);
                break;
            case 'shop':
                this.generateShop(ctx, canvas.width, canvas.height);
                break;
            case 'tree':
                this.generateTree(ctx, canvas.width, canvas.height);
                break;
            default:
                this.generateGenericStructure(ctx, canvas.width, canvas.height);
        }

        // Convert canvas to image
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = canvas.toDataURL('image/png');
        });
    }

    /**
     * Generates a generic structure texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    generateGenericStructure(ctx, width, height) {
        // Fill with base color
        ctx.fillStyle = this.baseColor;
        ctx.fillRect(0, 0, width, height);

        // Add some details
        ctx.fillStyle = this.detailColor;
        ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
    }

    /**
     * Generates a house texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    generateHouse(ctx, width, height) {
        // Base building
        ctx.fillStyle = this.wallColor;
        ctx.fillRect(0, height * 0.3, width, height * 0.7);

        // Roof
        ctx.fillStyle = this.roofColor;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.3);
        ctx.lineTo(width / 2, 0);
        ctx.lineTo(width, height * 0.3);
        ctx.closePath();
        ctx.fill();

        // Door
        ctx.fillStyle = this.detailColor;
        ctx.fillRect(width * 0.4, height * 0.6, width * 0.2, height * 0.4);

        // Windows
        ctx.fillStyle = '#87ceeb'; // Sky blue
        ctx.fillRect(width * 0.2, height * 0.4, width * 0.15, height * 0.15);
        ctx.fillRect(width * 0.65, height * 0.4, width * 0.15, height * 0.15);

        // Add floors if needed
        for (let i = 1; i < this.floors; i++) {
            ctx.fillStyle = this.wallColor;
            ctx.fillRect(0, height * (0.3 - i * 0.2), width, height * 0.2);

            // Windows for each floor
            ctx.fillStyle = '#87ceeb'; // Sky blue
            ctx.fillRect(width * 0.2, height * (0.35 - i * 0.2), width * 0.15, height * 0.1);
            ctx.fillRect(width * 0.65, height * (0.35 - i * 0.2), width * 0.15, height * 0.1);
        }
    }

    /**
     * Generates a shop texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    generateShop(ctx, width, height) {
        // Base building
        ctx.fillStyle = this.wallColor;
        ctx.fillRect(0, height * 0.2, width, height * 0.8);

        // Roof
        ctx.fillStyle = this.roofColor;
        ctx.fillRect(0, height * 0.1, width, height * 0.1);

        // Awning
        ctx.fillStyle = '#ff7f50'; // Coral
        ctx.fillRect(0, height * 0.2, width, height * 0.05);

        // Door
        ctx.fillStyle = this.detailColor;
        ctx.fillRect(width * 0.4, height * 0.6, width * 0.2, height * 0.4);

        // Shop window
        ctx.fillStyle = '#b0e0e6'; // Powder blue
        ctx.fillRect(width * 0.1, height * 0.3, width * 0.8, height * 0.2);

        // Add floors if needed
        for (let i = 1; i < this.floors; i++) {
            ctx.fillStyle = this.wallColor;
            ctx.fillRect(0, height * (0.2 - i * 0.15), width, height * 0.15);

            // Windows for each floor
            ctx.fillStyle = '#b0e0e6'; // Powder blue
            ctx.fillRect(width * 0.2, height * (0.25 - i * 0.15), width * 0.6, height * 0.1);
        }
    }

    /**
     * Generates a tree texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    generateTree(ctx, width, height) {
        // Tree trunk
        ctx.fillStyle = '#8b4513'; // Saddle brown
        ctx.fillRect(width * 0.4, height * 0.6, width * 0.2, height * 0.4);

        // Tree foliage
        ctx.fillStyle = '#228b22'; // Forest green
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.4, width * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}
