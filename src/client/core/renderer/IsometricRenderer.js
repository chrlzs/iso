import { DecorationRenderer } from './DecorationRenderer.js';
import { WaterRenderer } from './WaterRenderer.js';

export class IsometricRenderer {
    constructor(canvas, tileManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileManager = tileManager;
        this.tileWidth = 64;  // or whatever your tile size is
        this.tileHeight = 32;
        this.heightOffset = 16;
        
        // Initialize sub-renderers
        this.waterRenderer = new WaterRenderer(this.ctx, tileManager);
        this.decorationRenderer = new DecorationRenderer(this.ctx, tileManager);
    }

    // Convert world coordinates to screen coordinates
    worldToScreen(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2),
            y: (x + y) * (this.tileHeight / 2)
        };
    }

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

    screenToWorld(screenX, screenY, zoom, cameraX, cameraY) {
        // Adjust for zoom
        const unzoomedX = screenX / zoom;
        const unzoomedY = screenY / zoom;
        
        // Get tile dimensions
        const tileWidth = this.tileWidth;
        const tileHeight = this.tileHeight;
        
        // Convert screen to isometric coordinates
        // Note: We divide by tileHeight/2 because that's our isometric tile height
        const isoX = unzoomedX / (tileWidth / 2);
        const isoY = unzoomedY / (tileHeight / 2);
        
        // Convert isometric to cartesian coordinates
        return {
            x: Math.floor((isoX + isoY) / 2),
            y: Math.floor((isoY - isoX) / 2)
        };
    }

    clear() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderWorld(world, camera) {
        // Make sure tileManager is available
        if (!this.tileManager) {
            console.error('TileManager not initialized');
            return;
        }

        // Calculate visible range with a larger buffer for big structures
        const screenTileWidth = Math.ceil(this.canvas.width / (this.tileWidth * camera.zoom)) + 4;  // Increased from 2
        const screenTileHeight = Math.ceil(this.canvas.height / (this.tileHeight * camera.zoom)) + 6;  // Increased from 4
        
        const startX = Math.max(0, Math.floor(camera.x / this.tileWidth - screenTileWidth / 2));
        const startY = Math.max(0, Math.floor(camera.y / this.tileHeight - screenTileHeight / 2));
        const endX = Math.min(world.width, startX + screenTileWidth);
        const endY = Math.min(world.height, startY + screenTileHeight);

        // Render tiles in isometric order
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = world.getTileAt(x, y);
                if (tile) {
                    this.renderTile(tile, x, y);
                }
            }
        }
    }

    renderTile(tile, x, y) {
        const screenX = (x - y) * this.tileWidth / 2;
        const screenY = (x + y) * this.tileHeight / 2 - (tile.height * this.heightOffset);

        // Get texture from TileManager
        const texture = this.tileManager.getTextureForTile(tile);
        if (texture) {
            // Draw the base tile with texture
            this.ctx.drawImage(
                texture,
                screenX - this.tileWidth / 2,
                screenY - this.tileHeight / 2,
                this.tileWidth,
                this.tileHeight
            );
        } else {
            // Fallback to solid color if texture not found
            this.ctx.fillStyle = this.getTileColor(tile);
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY);
            this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.lineTo(screenX, screenY + this.tileHeight);
            this.ctx.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }

        // Draw tile sides if elevated
        if (tile.height > 0) {
            // Left side
            this.ctx.fillStyle = this.getShadedColor(tile, 'left');
            this.ctx.beginPath();
            this.ctx.moveTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.lineTo(screenX, screenY + this.tileHeight);
            this.ctx.lineTo(screenX, screenY + this.tileHeight + tile.height * this.heightOffset);
            this.ctx.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2 + tile.height * this.heightOffset);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Right side
            this.ctx.fillStyle = this.getShadedColor(tile, 'right');
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY + this.tileHeight);
            this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2 + tile.height * this.heightOffset);
            this.ctx.lineTo(screenX, screenY + this.tileHeight + tile.height * this.heightOffset);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }

        // Draw decoration if present
        if (tile.decoration) {
            const decorationTexture = this.tileManager.getDecorationTexture(tile.decoration.type);
            if (decorationTexture) {
                this.ctx.drawImage(
                    decorationTexture,
                    screenX - this.tileWidth / 2,
                    screenY - this.tileHeight / 2,
                    this.tileWidth,
                    this.tileHeight
                );
            }
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



















