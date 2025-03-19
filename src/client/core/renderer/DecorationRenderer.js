/**
 * Handles rendering of tile decorations
 */
export class DecorationRenderer {
    /**
     * Creates a new DecorationRenderer
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {number} tileWidth - Base tile width
     * @param {number} tileHeight - Base tile height
     */
    constructor(ctx, tileWidth, tileHeight) {
        console.log('DecorationRenderer: Initialized');
        this.ctx = ctx;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }

    /**
     * Renders a decoration on a tile
     * @param {Object} decoration - The decoration data
     * @param {HTMLImageElement} texture - The decoration texture
     * @param {number} tileHeight - The tile's height value
     * @param {number} isoX - The isometric X position of the tile
     * @param {number} isoY - The isometric Y position of the tile
     */
    render(decoration, texture, tileHeight, isoX, isoY) {
        console.log('DecorationRenderer: Attempting to render decoration:', {
            decoration,
            hasTexture: !!texture,
            tileHeight,
            isoX,
            isoY
        });

        if (!decoration || !texture) {
            console.log('DecorationRenderer: Missing decoration or texture');
            return;
        }

        // Calculate position with offset relative to tile's isometric position
        const x = isoX + (decoration.offset?.x || 0);
        const y = isoY + (decoration.offset?.y || 0) - (tileHeight * this.tileHeight / 2);

        // Apply scale
        const width = (decoration.scale?.x || 1) * this.tileWidth;
        const height = (decoration.scale?.y || 1) * this.tileHeight;

        console.log('DecorationRenderer: Drawing at:', {
            x, y, width, height,
            decorationType: decoration.type
        });

        this.ctx.drawImage(texture, x, y, width, height);
    }
}



