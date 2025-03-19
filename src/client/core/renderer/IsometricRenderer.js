import { DecorationRenderer } from './DecorationRenderer.js';

export class IsometricRenderer {
    constructor(canvas, tileWidth = 64, tileHeight = 32) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.tileHeightOffset = 16; // Add this for height calculations
        
        this.decorationRenderer = new DecorationRenderer(
            this.ctx,
            this.tileWidth,
            this.tileHeight
        );
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Converts isometric coordinates to screen coordinates
     * @param {number} x - Tile x coordinate
     * @param {number} y - Tile y coordinate
     * @param {number} height - Tile height level
     * @returns {{x: number, y: number}} Screen coordinates
     */
    isoToScreen(x, y, height = 0) {
        const screenX = (x - y) * this.tileWidth / 2;
        const screenY = (x + y) * this.tileHeight / 2 - (height * this.tileHeightOffset);
        return { x: screenX, y: screenY };
    }

    /**
     * Converts screen coordinates to isometric coordinates
     * @param {number} screenX - Screen x coordinate
     * @param {number} screenY - Screen y coordinate
     * @returns {{x: number, y: number}} Isometric coordinates
     */
    screenToIso(screenX, screenY) {
        const x = (screenX / this.tileWidth + screenY / this.tileHeight);
        const y = (screenY / this.tileHeight - screenX / this.tileWidth);
        return { x, y };
    }

    /**
     * Renders the world
     * @param {World} world - The game world
     * @param {Camera} camera - The game camera
     */
    render(world, camera, tileManager, timestamp) {
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(
            this.ctx.canvas.width / 2 - camera.x,
            this.ctx.canvas.height / 4 - camera.y
        );

        // Clear animated tiles set
        this.animatedTiles.clear();

        // Sort tiles by their render order (back to front)
        const renderOrder = [];
        for (let x = 0; x < world.width; x++) {
            for (let y = 0; y < world.height; y++) {
                const tile = world.getTile(x, y);
                renderOrder.push({ x, y, tile });
            }
        }
        renderOrder.sort((a, b) => (a.x + a.y) - (b.x + b.y));

        // Render tiles
        for (const { x, y, tile } of renderOrder) {
            this.renderTile(x, y, tile, tileManager);
        }

        // Update animated tiles
        if (timestamp - this.lastFrameTime > 100) { // Animation update interval
            this.updateAnimations(tileManager);
            this.lastFrameTime = timestamp;
        }

        this.ctx.restore();
    }

    /**
     * Renders a single tile
     * @param {number} x - Tile x coordinate
     * @param {number} y - Tile y coordinate
     * @param {Object} tile - Tile object
     */
    renderTile(x, y, tile, tileManager) {
        const screenPos = this.isoToScreen(x, y, tile.height || 0);
        
        this.ctx.save();
        this.ctx.translate(screenPos.x, screenPos.y);

        // Render base tile
        const texture = tileManager.getTexture(tile.type);
        if (texture) {
            this.ctx.drawImage(
                texture,
                -this.tileWidth / 2,
                -this.tileHeight / 2,
                this.tileWidth,
                this.tileHeight
            );
        }

        // Render decoration if present
        if (tile.decoration) {
            const decorationTexture = tileManager.getTexture('dec_' + tile.decoration.type);
            if (decorationTexture) {
                this.decorationRenderer.render(
                    tile.decoration,
                    decorationTexture,
                    tile.height || 0
                );
            }
        }

        this.ctx.restore();
    }

    renderTileWalls(height, props) {
        const wallHeight = height * this.tileHeightOffset;
        
        // Left wall
        this.ctx.beginPath();
        this.ctx.moveTo(-this.tileWidth / 2, 0);
        this.ctx.lineTo(-this.tileWidth / 2, wallHeight);
        this.ctx.lineTo(0, this.tileHeight / 2 + wallHeight);
        this.ctx.lineTo(0, this.tileHeight / 2);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fill();

        // Right wall
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.tileHeight / 2);
        this.ctx.lineTo(0, this.tileHeight / 2 + wallHeight);
        this.ctx.lineTo(this.tileWidth / 2, wallHeight);
        this.ctx.lineTo(this.tileWidth / 2, 0);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fill();
    }

    renderDecoration(tile, tileManager) {
        const decoration = tile.decoration;
        const texture = tileManager.getDecorationTexture(decoration.type, decoration.variant);
        
        if (!texture) return;

        const { offset, scale } = decoration;
        const width = this.tileWidth * scale.x;
        const height = this.tileHeight * scale.y;

        this.ctx.drawImage(
            texture,
            -width / 2 + offset.x,
            -height / 2 + offset.y - (tile.height * this.tileHeightOffset),
            width,
            height
        );

        // Handle animated decorations
        if (decoration.animated) {
            this.animatedTiles.add({ x, y, tile });
        }
    }

    updateAnimations(tileManager) {
        for (const { tile } of this.animatedTiles) {
            const props = tileManager.getTileProperties(tile.type);
            
            // Update tile animation
            if (props.animated) {
                tile.variant = (tile.variant + 1) % props.variants.length;
            }
            
            // Update decoration animation
            if (tile.decoration?.animated) {
                tile.decoration.variant = (tile.decoration.variant + 1) % 
                    tileManager.decorations[tile.decoration.type].variants.length;
            }
        }
    }
}




