import { DecorationRenderer } from './DecorationRenderer.js';
import { WaterRenderer } from './WaterRenderer.js';

export class IsometricRenderer {
    constructor(canvas, world) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = world;
        this.tileManager = world.tileManager;
        this.tileWidth = 64;  // Base tile width
        this.tileHeight = 32; // Base tile height
        this.heightOffset = 16; // Vertical offset for height
        
        this.waterRenderer = new WaterRenderer();
    }

    // Add the conversion methods
    convertToIsometric(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2),
            y: (x + y) * (this.tileHeight / 2)
        };
    }

    convertToCartesian(isoX, isoY) {
        const x = (isoX / (this.tileWidth / 2) + isoY / (this.tileHeight / 2)) / 2;
        const y = (isoY / (this.tileHeight / 2) - isoX / (this.tileWidth / 2)) / 2;
        return { x, y };
    }

    clear() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderWorld(world, camera, tileManager) {
        // Calculate visible range
        const screenTileWidth = Math.ceil(this.canvas.width / (this.tileWidth * camera.zoom)) + 2;
        const screenTileHeight = Math.ceil(this.canvas.height / (this.tileHeight * camera.zoom)) + 4;
        
        const startX = Math.max(0, Math.floor(camera.x / this.tileWidth - screenTileWidth / 2));
        const startY = Math.max(0, Math.floor(camera.y / this.tileHeight - screenTileHeight / 2));
        const endX = Math.min(world.width, startX + screenTileWidth);
        const endY = Math.min(world.height, startY + screenTileHeight);

        // Render tiles in isometric order
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.getTileAt(world, x, y);
                if (tile) {
                    this.renderTile(x, y, tile, tileManager);
                }
            }
        }
    }

    getTileAt(world, x, y) {
        const chunkX = Math.floor(x / world.chunkSize);
        const chunkY = Math.floor(y / world.chunkSize);
        const chunk = world.chunks.get(`${chunkX},${chunkY}`);
        
        if (!chunk) {
            const height = world.generateHeight(x, y);
            const moisture = world.generateMoisture(x, y);
            return world.generateTile(x, y, height, moisture);
        }

        const localX = x % world.chunkSize;
        const localY = y % world.chunkSize;
        return chunk[localY * world.chunkSize + localX];
    }

    renderTile(x, y, tile, tileManager) {
        // Calculate base isometric position
        const isoX = (x - y) * (this.tileWidth / 2);
        const isoY = (x + y) * (this.tileHeight / 2);
        
        // Calculate height offset
        const heightOffset = tile.height * this.heightOffset;

        // Get tile texture
        const texture = this.tileManager.getTextureForTile(tile);
        if (!texture) {
            console.warn(`Missing texture for tile at (${x}, ${y})`);
            return;
        }

        // Draw the base texture for all tiles
        this.ctx.drawImage(
            texture,
            isoX - this.tileWidth/2,
            isoY - this.tileHeight/2 - heightOffset,
            this.tileWidth,
            this.tileHeight
        );

        // Add water effect on top for water tiles
        if (tile.type === 'water') {
            this.ctx.globalAlpha = 0.7; // Make water effect semi-transparent
            this.waterRenderer.renderWaterTile(
                this.ctx,
                isoX - this.tileWidth/2,
                isoY - this.tileHeight/2 - heightOffset,
                this.tileWidth,
                this.tileHeight
            );
            this.ctx.globalAlpha = 1.0; // Reset transparency
        }
    }

    renderColorTile(x, y, tile) {
        // Convert tile coordinates to screen coordinates
        const screenX = (x - y) * this.tileWidth / 2;
        const screenY = (x + y) * this.tileHeight / 2 - (tile.height * this.tileHeightOffset);

        // Draw tile base
        this.ctx.fillStyle = this.getTileColor(tile);
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2);
        this.ctx.lineTo(screenX, screenY + this.tileHeight);
        this.ctx.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight);
        this.ctx.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw tile sides if elevated
        if (tile.height > 0) {
            // Left side
            this.ctx.fillStyle = this.getShadedColor(tile, 'left');
            this.ctx.beginPath();
            this.ctx.moveTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.lineTo(screenX, screenY + this.tileHeight);
            this.ctx.lineTo(screenX, screenY + this.tileHeight + tile.height * this.tileHeightOffset);
            this.ctx.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2 + tile.height * this.tileHeightOffset);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Right side
            this.ctx.fillStyle = this.getShadedColor(tile, 'right');
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY + this.tileHeight);
            this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2 + tile.height * this.tileHeightOffset);
            this.ctx.lineTo(screenX, screenY + this.tileHeight + tile.height * this.tileHeightOffset);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }

        // Draw decoration if present
        if (tile.decoration) {
            this.renderDecoration(screenX, screenY, tile.decoration);
        }
    }

    getTileColor(tile) {
        switch (tile.type) {
            case 'water': return '#4A90E2';
            case 'sand': return '#F5A623';
            case 'grass': return '#7ED321';
            case 'wetland': return '#417505';
            case 'dirt': return '#8B572A';
            case 'stone': return '#9B9B9B';
            default: return '#FF0000';
        }
    }

    getShadedColor(tile, side) {
        const baseColor = this.getTileColor(tile);
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = baseColor;
        const rgb = ctx.fillStyle;
        
        // Darken sides differently
        const darkenAmount = side === 'left' ? 30 : 15;
        return this.shadeColor(rgb, -darkenAmount);
    }

    shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amt));
        const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
        const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
        return `rgb(${R},${G},${B})`;
    }

    renderDecoration(x, y, decoration) {
        // Simple colored dot for now
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate() {
        // Update water animation
        this.waterRenderer.update();
        
        // Don't trigger full re-render here - the main game loop will handle that
        // Instead, just request next frame
        requestAnimationFrame(() => this.animate());
    }
}





