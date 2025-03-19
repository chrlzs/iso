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
        this.ctx = ctx;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }

    /**
     * Renders a decoration on a tile
     * @param {Object} decoration - The decoration data
     * @param {HTMLImageElement} texture - The decoration texture
     * @param {number} tileHeight - The tile's height value
     */
    render(decoration, texture, tileHeight = 0) {
        if (!texture || !decoration || !decoration.offset || !decoration.scale) return;

        const { offset, scale } = decoration;
        const width = this.tileWidth * (scale.x || 1);
        const height = this.tileHeight * (scale.y || 1);

        // Apply offset and scale
        this.ctx.drawImage(
            texture,
            (offset.x || 0) - width / 2,
            (offset.y || 0) - height / 2 - (tileHeight * 16),
            width,
            height
        );
    }
}
