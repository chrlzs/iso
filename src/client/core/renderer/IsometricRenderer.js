import { DecorationRenderer } from './DecorationRenderer.js';

export class IsometricRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Isometric constants
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.tileHeightOffset = 16; // Height between levels
        this.decorationRenderer = new DecorationRenderer(this.ctx, this.tileWidth, this.tileHeight);
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
        const isoX = (x - y) * (this.tileWidth / 2);
        const isoY = (x + y) * (this.tileHeight / 2) - (tile.height * this.tileHeight / 2);

        // Get the appropriate texture
        const texture = tileManager.getTextureForTile(tile);
        
        if (texture) {
            // Draw elevation sides first if elevated
            if (tile.height > 0) {
                // Left side
                this.ctx.save();
                this.ctx.globalAlpha = 0.7;  // More opaque sides
                
                // Darken the sides significantly
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.fillRect(
                    isoX - this.tileWidth / 2,
                    isoY + this.tileHeight / 2,
                    this.tileWidth / 2,
                    tile.height * this.tileHeight / 2
                );
                
                this.ctx.drawImage(
                    texture,
                    isoX - this.tileWidth / 2,
                    isoY + this.tileHeight / 2,
                    this.tileWidth / 2,
                    tile.height * this.tileHeight / 2
                );

                // Right side with different shading
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(
                    isoX,
                    isoY + this.tileHeight / 2,
                    this.tileWidth / 2,
                    tile.height * this.tileHeight / 2
                );
                
                this.ctx.drawImage(
                    texture,
                    isoX,
                    isoY + this.tileHeight / 2,
                    this.tileWidth / 2,
                    tile.height * this.tileHeight / 2
                );
                this.ctx.restore();
            }

            // Draw the main texture
            this.ctx.drawImage(
                texture,
                isoX - this.tileWidth / 2,
                isoY - this.tileHeight,
                this.tileWidth,
                this.tileHeight * 1.5
            );

            // Add elevation indicators
            if (tile.height > 0) {
                // Draw more visible contour lines
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.lineWidth = 2;
                for (let h = 0; h < tile.height; h++) {
                    const lineY = isoY - (h * this.tileHeight / 3);
                    this.ctx.beginPath();
                    this.ctx.moveTo(isoX - this.tileWidth / 3, lineY);
                    this.ctx.lineTo(isoX + this.tileWidth / 3, lineY);
                    this.ctx.stroke();
                }

                // Add stronger shadow at the base
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.beginPath();
                this.ctx.moveTo(isoX - this.tileWidth / 2, isoY + this.tileHeight / 2);
                this.ctx.lineTo(isoX + this.tileWidth / 2, isoY + this.tileHeight / 2);
                this.ctx.lineTo(isoX, isoY + this.tileHeight);
                this.ctx.closePath();
                this.ctx.fill();

                // Add highlight on top edge
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(isoX - this.tileWidth / 2, isoY);
                this.ctx.lineTo(isoX, isoY - this.tileHeight / 2);
                this.ctx.lineTo(isoX + this.tileWidth / 2, isoY);
                this.ctx.stroke();
            }
        } else {
            // Fallback to color-based rendering if texture is not available
            this.renderColorTile(x, y, tile);
        }

        // Render decoration if present
        if (tile.decoration) {
            console.log('IsometricRenderer: Found decoration on tile:', {
                x, y,
                decorationType: tile.decoration.type
            });
            
            const decorationTexture = tileManager.textures.get(`dec_${tile.decoration.type}`);
            if (!decorationTexture) {
                console.warn('IsometricRenderer: Missing decoration texture:', 
                    `dec_${tile.decoration.type}`);
                return;
            }

            // Pass the tile's isometric coordinates to the decoration renderer
            this.decorationRenderer.render(
                tile.decoration,
                decorationTexture,
                tile.height,
                isoX - this.tileWidth / 2,  // Center the decoration on the tile
                isoY - this.tileHeight      // Adjust for tile height
            );
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
        
        // Darken the color for sides
        const darkenAmount = side === 'left' ? 30 : 15;
        return this.shadeColor(rgb, -darkenAmount);
    }

    shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    renderDecoration(x, y, decoration) {
        // Simple colored dot for now
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
}




