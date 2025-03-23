import { DecorationRenderer } from './DecorationRenderer.js';
import { WaterRenderer } from './WaterRenderer.js';
import { StructureRenderer } from './StructureRenderer.js';

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
        this.structureRenderer = new StructureRenderer(this.ctx, this.tileWidth, this.tileHeight);
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
        const isoY = (x + y) * (this.tileHeight / 2);
        const heightOffset = tile.height * this.heightOffset;

        // Draw base tile texture
        const texture = tileManager.getTextureForTile(tile);
        if (texture) {
            this.ctx.drawImage(
                texture,
                isoX - this.tileWidth / 2,
                isoY - this.tileHeight / 2 - heightOffset,
                this.tileWidth,
                this.tileHeight
            );
        }

        // Render decoration if present
        if (tile.decoration) {
            const decorationTexture = tileManager.getDecorationTexture(tile.decoration.type);
            if (decorationTexture) {
                const decorationX = isoX + (tile.decoration.offset?.x || 0);
                const decorationY = isoY + (tile.decoration.offset?.y || 0) - heightOffset;
                const decorationWidth = (tile.decoration.scale?.x || 1) * this.tileWidth;
                const decorationHeight = (tile.decoration.scale?.y || 1) * this.tileHeight;

                this.ctx.drawImage(
                    decorationTexture,
                    decorationX - decorationWidth / 2,
                    decorationY - decorationHeight / 2,
                    decorationWidth,
                    decorationHeight
                );
            } else {
                console.warn(`Missing decoration texture for type: ${tile.decoration.type}`);
            }
        }

        // If tile has a structure, render it instead of just the border
        if (tile.structure) {
            this.structureRenderer.render(
                tile.structure,
                isoX,
                isoY - (this.tileHeight / 2) // Offset Y to align with tile
            );
            
            // Optionally, you can comment out or remove this section to disable the gold border
            /*
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(isoPos.x, isoPos.y - this.tileHeight / 2);
            this.ctx.lineTo(isoPos.x + this.tileWidth / 2, isoPos.y);
            this.ctx.lineTo(isoPos.x, isoPos.y + this.tileHeight / 2);
            this.ctx.lineTo(isoPos.x - this.tileWidth / 2, isoPos.y);
            this.ctx.closePath();
            this.ctx.stroke();
            */
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

    renderStructure(x, y, structure, tileManager) {
        const isoX = (x - y) * (this.tileWidth / 2);
        const isoY = (x + y) * (this.tileHeight / 2);
        const baseHeight = structure.template.height || 2; // Building height in tiles
        
        // Render each part of the structure
        structure.template.blueprint.forEach((row, dy) => {
            row.forEach((part, dx) => {
                const partX = isoX + dx * (this.tileWidth / 2);
                const partY = isoY + dy * (this.tileHeight / 2);
                
                // Get the appropriate texture based on the part type
                const texture = tileManager.getStructureTexture(structure.type, part);
                
                if (texture) {
                    // Draw walls with height
                    if (part === 'wall') {
                        // Draw vertical wall section
                        this.ctx.drawImage(
                            texture,
                            partX,
                            partY - (baseHeight * this.heightOffset),
                            this.tileWidth,
                            this.tileHeight * baseHeight
                        );
                    } else if (part === 'door') {
                        // Draw door with special handling
                        this.drawDoor(partX, partY, structure.type, tileManager);
                    } else if (part === 'floor') {
                        // Draw floor tile
                        this.ctx.drawImage(
                            texture,
                            partX,
                            partY,
                            this.tileWidth,
                            this.tileHeight
                        );
                    }
                }
            });
        });

        // Render decorations after the main structure
        structure.template.decorations?.forEach(decoration => {
            const decorX = isoX + decoration.x * (this.tileWidth / 2);
            const decorY = isoY + decoration.y * (this.tileHeight / 2);
            const decorTexture = tileManager.getDecorationTexture(decoration.type);
            
            if (decorTexture) {
                this.ctx.drawImage(
                    decorTexture,
                    decorX,
                    decorY - (baseHeight * this.heightOffset),
                    this.tileWidth,
                    this.tileHeight
                );
            }
        });
    }

    animate() {
        // Update water animation
        this.waterRenderer.update();
        
        // Don't trigger full re-render here - the main game loop will handle that
        // Instead, just request next frame
        requestAnimationFrame(() => this.animate());
    }
}










