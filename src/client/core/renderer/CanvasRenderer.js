export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileWidth = 64;
        this.tileHeight = 32;
        // Log only once during initialization
        console.log('CanvasRenderer initialized with canvas:', canvas.width, 'x', canvas.height);
    }

    clear() {
        this.ctx.fillStyle = '#000';  // Changed to match Game.js
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderWorld(world, tileManager, camera) {
        const visibleTiles = this.getVisibleTiles(camera, world.width, world.height);

        for (const { x, y } of visibleTiles) {
            const tile = world.getTile(x, y);
            if (tile) {
                this.drawTile(x, y, tile, tileManager);
            }
        }
    }

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




