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
        if (!texture) return;

        const { offset, scale } = decoration;
        const width = this.tileWidth * scale.x;
        const height = this.tileHeight * scale.y;

        // Apply offset and scale
        this.ctx.drawImage(
            texture,
            offset.x - width / 2,
            offset.y - height / 2 - (tileHeight * 16), // Adjust 16 based on your height scale
            width,
            height
        );
    }
}