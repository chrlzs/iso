import { ModelBase } from './ModelBase.js';

/**
 * Class representing a structure model
 * @class StructureModel
 * @extends ModelBase
 */
export class StructureModel extends ModelBase {
    /**
     * Creates a new structure model
     * @param {string} id - Unique identifier for the model
     * @param {Object} [options={}] - Model options
     */
    constructor(id, options = {}) {
        super(id, { ...options, type: 'structure' });
        
        this.structureType = options.structureType || 'generic';
        this.width = options.width || 1;
        this.height = options.height || 1;
        this.floors = options.floors || 1;
        this.isWalkable = options.isWalkable !== undefined ? options.isWalkable : false;
        this.isEnterable = options.isEnterable !== undefined ? options.isEnterable : false;
        this.interiorTilesetId = options.interiorTilesetId || null;
        this.interiorWidth = options.interiorWidth || this.width * 2;
        this.interiorHeight = options.interiorHeight || this.height * 2;
        this.doorPosition = options.doorPosition || { x: Math.floor(this.width / 2), y: this.height - 1 };
        this.parts = options.parts || [];
    }

    /**
     * Renders the structure
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} tileWidth - Tile width
     * @param {number} tileHeight - Tile height
     * @param {Object} [options={}] - Render options
     */
    render(ctx, x, y, tileWidth, tileHeight, options = {}) {
        // If we have parts, render each part
        if (this.parts.length > 0) {
            for (const part of this.parts) {
                this.renderPart(ctx, x, y, tileWidth, tileHeight, part, options);
            }
            return;
        }

        // Otherwise, render the main texture
        const texture = this.getTexture('default');
        if (!texture || !texture.isLoaded) {
            // Fallback rendering if texture is not available
            ctx.fillStyle = '#a67c52';
            ctx.fillRect(x, y, tileWidth * this.width, tileHeight * this.height);
            return;
        }

        // Draw the structure texture
        ctx.drawImage(
            texture.image,
            x,
            y - (this.floors - 1) * tileHeight, // Adjust y position for multi-floor buildings
            tileWidth * this.width,
            tileHeight * (this.height + this.floors - 1) // Adjust height for multi-floor buildings
        );

        // Draw debug info if needed
        if (options.debug) {
            ctx.strokeStyle = '#ff0000';
            ctx.strokeRect(x, y, tileWidth * this.width, tileHeight * this.height);
            
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.id} (${this.structureType})`, x + 5, y + 15);
            ctx.fillText(`Walkable: ${this.isWalkable}`, x + 5, y + 30);
            ctx.fillText(`Enterable: ${this.isEnterable}`, x + 5, y + 45);
        }
    }

    /**
     * Renders a part of the structure
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} tileWidth - Tile width
     * @param {number} tileHeight - Tile height
     * @param {Object} part - Part information
     * @param {Object} [options={}] - Render options
     */
    renderPart(ctx, x, y, tileWidth, tileHeight, part, options = {}) {
        const texture = this.getTexture(part.textureId);
        if (!texture || !texture.isLoaded) {
            // Fallback rendering if texture is not available
            ctx.fillStyle = '#a67c52';
            ctx.fillRect(
                x + part.x * tileWidth,
                y + part.y * tileHeight,
                tileWidth * part.width,
                tileHeight * part.height
            );
            return;
        }

        // Draw the part texture
        ctx.drawImage(
            texture.image,
            x + part.x * tileWidth,
            y + part.y * tileHeight - (part.floors - 1) * tileHeight, // Adjust y position for multi-floor parts
            tileWidth * part.width,
            tileHeight * (part.height + part.floors - 1) // Adjust height for multi-floor parts
        );
    }

    /**
     * Gets the door position in world coordinates
     * @param {number} structureX - Structure X position
     * @param {number} structureY - Structure Y position
     * @returns {Object} Door position
     */
    getDoorPosition(structureX, structureY) {
        return {
            x: structureX + this.doorPosition.x,
            y: structureY + this.doorPosition.y
        };
    }

    /**
     * Checks if a position is inside the structure
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} structureX - Structure X position
     * @param {number} structureY - Structure Y position
     * @returns {boolean} True if the position is inside the structure
     */
    isInside(x, y, structureX, structureY) {
        return (
            x >= structureX &&
            x < structureX + this.width &&
            y >= structureY &&
            y < structureY + this.height
        );
    }
}
