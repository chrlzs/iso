
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
        // Log only once during initialization
        console.log('CanvasRenderer initialized with canvas:', canvas.width, 'x', canvas.height);
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
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
     * Gets the visible tiles based on camera position
     * @param {Object} camera - Camera object
     * @param {number} worldWidth - World width in tiles
     * @param {number} worldHeight - World height in tiles
     * @returns {Array<{x: number, y: number}>} Array of visible tile coordinates
     */
    getVisibleTiles(camera, worldWidth, worldHeight) {
        const tiles = [];
        const startX = Math.max(0, Math.floor(camera.x - this.canvas.width / this.tileWidth));
        const startY = Math.max(0, Math.floor(camera.y - this.canvas.height / this.tileHeight));
        const endX = Math.min(worldWidth, startX + this.canvas.width / this.tileWidth + 2);
        const endY = Math.min(worldHeight, startY + this.canvas.height / this.tileHeight + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                tiles.push({ x, y });
            }
        }
        return tiles;
    }

    /**
     * Renders the entire world
     * @param {World} world - The world to render
     * @param {TileManager} tileManager - TileManager instance for tile properties
     * @param {Camera} camera - Camera instance for view transformation
     */
    renderWorld(world, tileManager, camera) {
        const visibleTiles = this.getVisibleTiles(camera, world.width, world.height);

        for (const { x, y } of visibleTiles) {
            const tile = world.getTile(x, y);
            if (tile) {
                this.drawTile(x, y, tile, tileManager);
            }
        }
    }

    /**
     * Draws a single tile
     * @param {number} x - Tile x coordinate
     * @param {number} y - Tile y coordinate
     * @param {Object} tile - The tile object to draw
     * @param {TileManager} tileManager - TileManager instance for tile properties
     */
    drawTile(x, y, tile, tileManager) {
        const isoX = (x - y) * (this.tileWidth / 2);
        const isoY = (x + y) * (this.tileHeight / 2);

        const texture = tileManager.getTextureForTile(tile);
        if (texture) {
            this.ctx.drawImage(
                texture,
                isoX - this.tileWidth / 2,
                isoY - this.tileHeight / 2,
                this.tileWidth,
                this.tileHeight
            );
        } else {
            console.warn(`Missing texture for tile at (${x}, ${y})`);
        }

        // Render decoration if present
        if (tile.decoration) {
            const decorationTexture = tileManager.getDecorationTexture(tile.decoration.type);
            if (decorationTexture) {
                const decorationX = isoX + (tile.decoration.offset?.x || 0);
                const decorationY = isoY + (tile.decoration.offset?.y || 0) - (tile.height * this.tileHeight / 2);
                const decorationWidth = (tile.decoration.scale?.x || 1) * this.tileWidth;
                const decorationHeight = (tile.decoration.scale?.y || 1) * this.tileHeight;

                this.ctx.drawImage(
                    decorationTexture,
                    decorationX - decorationWidth / 2,
                    decorationY - decorationHeight / 2,
                    decorationWidth,
                    decorationHeight
                );
            }
        }
    }
}

