/**
 * Handles rendering of the game world to a canvas
 * @class CanvasRenderer
 */
export class CanvasRenderer {
    /**
     * Creates a new CanvasRenderer instance
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileWidth = 64;
        this.tileHeight = 32;
    }

    /**
     * Sets the current transform for rendering
     * @param {Object} transform - The transform object from camera
     * @param {number} transform.scale - Scale factor
     * @param {number} transform.offsetX - X offset
     * @param {number} transform.offsetY - Y offset
     */
    setTransform(transform) {
        this.ctx.setTransform(
            transform.scale, 0,
            0, transform.scale,
            this.canvas.width / 2 + transform.offsetX,
            this.canvas.height / 2 + transform.offsetY
        );
    }

    /**
     * Clears the entire canvas
     */
    clear() {
        // Reset transform before clearing
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Converts isometric coordinates to screen coordinates
     * @param {number} x - Isometric x coordinate
     * @param {number} y - Isometric y coordinate
     * @returns {{x: number, y: number}} Screen coordinates
     */
    isoToScreen(x, y) {
        return {
            x: (x - y) * this.tileWidth / 2,
            y: (x + y) * this.tileHeight / 2
        };
    }

    /**
     * Converts screen coordinates to isometric coordinates
     * @param {number} screenX - Screen x coordinate
     * @param {number} screenY - Screen y coordinate
     * @returns {{x: number, y: number}} Isometric coordinates
     */
    screenToIso(screenX, screenY) {
        const x = (screenX / this.tileWidth + screenY / this.tileHeight) / 2;
        const y = (screenY / this.tileHeight - screenX / this.tileWidth) / 2;
        return { x, y };
    }

    /**
     * Draws a single tile
     * @param {number} x - Tile x coordinate
     * @param {number} y - Tile y coordinate
     * @param {Object} tile - The tile object to draw
     * @param {TileManager} tileManager - TileManager instance for tile properties
     */
    drawTile(x, y, tile, tileManager) {
        const texture = tileManager.getTexture(tile.type);
        const screenPos = this.isoToScreen(x, y);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 3;

        this.ctx.save();
        this.ctx.translate(
            centerX + screenPos.x,
            centerY + screenPos.y - (tile.height * this.tileHeight / 2)
        );

        // Create clipping path for isometric tile shape
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.tileHeight / 2);
        this.ctx.lineTo(this.tileWidth / 2, 0);
        this.ctx.lineTo(0, this.tileHeight / 2);
        this.ctx.lineTo(-this.tileWidth / 2, 0);
        this.ctx.closePath();
        this.ctx.clip();

        // Draw texture
        if (texture) {
            this.ctx.drawImage(
                texture,
                -this.tileWidth / 2,
                -this.tileHeight / 2,
                this.tileWidth,
                this.tileHeight
            );
        }

        // Draw tile outline
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Renders the entire world
     * @param {World} world - The world to render
     * @param {TileManager} tileManager - TileManager instance for tile properties
     * @param {Camera} camera - Camera instance for view transformation
     */
    renderWorld(world, tileManager, camera) {
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const tile = world.getTile(x, y);
                if (tile) {
                    this.drawTile(x, y, tile, tileManager);
                }
            }
        }
    }
}



