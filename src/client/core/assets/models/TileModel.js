import { ModelBase } from './ModelBase.js';

/**
 * Class representing a tile model
 * @class TileModel
 * @extends ModelBase
 */
export class TileModel extends ModelBase {
    /**
     * Creates a new tile model
     * @param {string} id - Unique identifier for the model
     * @param {Object} [options={}] - Model options
     */
    constructor(id, options = {}) {
        super(id, { ...options, type: 'tile' });
        
        this.tileType = options.tileType || 'generic';
        this.isWalkable = options.isWalkable !== undefined ? options.isWalkable : true;
        this.movementCost = options.movementCost || 1;
        this.elevation = options.elevation || 0;
        this.variants = options.variants || [];
    }

    /**
     * Renders the tile
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} [options={}] - Render options
     */
    render(ctx, x, y, width, height, options = {}) {
        const texture = this.getTexture('default');
        if (!texture || !texture.isLoaded) {
            // Fallback rendering if texture is not available
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(x, y, width, height);
            return;
        }

        // Draw the tile texture
        ctx.drawImage(texture.image, x, y, width, height);

        // Draw elevation if needed
        if (this.elevation > 0 && options.showElevation) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x, y, width, height);
        }

        // Draw debug info if needed
        if (options.debug) {
            ctx.strokeStyle = '#ff0000';
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.id} (${this.tileType})`, x + 5, y + 15);
            ctx.fillText(`Walkable: ${this.isWalkable}`, x + 5, y + 30);
        }
    }

    /**
     * Gets a random variant of this tile
     * @returns {TileModel} A variant of this tile
     */
    getRandomVariant() {
        if (this.variants.length === 0) {
            return this;
        }

        const randomIndex = Math.floor(Math.random() * this.variants.length);
        return this.variants[randomIndex];
    }
}
