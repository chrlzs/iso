import { DecorationRenderer } from './DecorationRenderer.js';
import { WaterRenderer } from './WaterRenderer.js';
import { StructureRenderer } from './StructureRenderer.js';

export class IsometricRenderer {
    constructor(canvas, tileManager) {
        console.log('IsometricRenderer: Initializing...', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            tileManagerLoaded: tileManager?.texturesLoaded
        });
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileManager = tileManager;
        
        // Define tile dimensions
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.heightScale = 32; // Height scale for elevation
        
        // Initialize sub-renderers with correct parameters
        this.waterRenderer = new WaterRenderer();
        this.decorationRenderer = new DecorationRenderer(this.ctx, this.tileWidth, this.tileHeight);
        this.structureRenderer = new StructureRenderer(this.ctx);
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
        const unzoomedX = screenX / zoom;
        const unzoomedY = screenY / zoom;
        
        const isoX = unzoomedX / (this.tileWidth / 2);
        const isoY = unzoomedY / (this.tileHeight / 2);
        
        return {
            x: Math.floor((isoX + isoY) / 2),
            y: Math.floor((isoY - isoX) / 2)
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderWorld(world, camera) {
        if (!this.tileManager) {
            console.error('TileManager not initialized');
            return;
        }

        // Render all tiles in the world
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const tile = world.getTileAt(x, y);
                if (tile) {
                    this.renderTile(tile, x, y);
                }
            }
        }

        // Render structures
        world.structures.forEach(structure => {
            const screenCoords = this.worldToScreen(structure.x, structure.y);
            this.structureRenderer.render(structure, structure.x, structure.y, screenCoords.x, screenCoords.y);
        });
    }

    renderTile(tile, x, y) {
        if (!tile || !tile.type) {
            console.warn('Invalid tile at', x, y, tile);
            return;
        }

        if (!this.getTileColor(tile.type)) {
            console.warn('Unknown tile type:', tile.type, 'at', x, y);
        }

        const isoX = (x - y) * this.tileWidth / 2;
        const isoY = (x + y) * this.tileHeight / 2;

        // Add debug logging for structure tiles
        if (tile.structure) {
            console.log(`Rendering tile with structure:`, {
                x, y,
                tileType: tile.type,
                structureType: tile.structure.type,
                isoX, isoY
            });
        }

        const heightOffset = tile.type === 'water' ? 0 : (tile.height * this.heightScale);
        const finalY = isoY - heightOffset;

        // Save the current context state
        this.ctx.save();

        // Create a diamond-shaped clipping path
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, finalY);  // Top point
        this.ctx.lineTo(isoX + this.tileWidth/2, finalY + this.tileHeight/2);  // Right point
        this.ctx.lineTo(isoX, finalY + this.tileHeight);  // Bottom point
        this.ctx.lineTo(isoX - this.tileWidth/2, finalY + this.tileHeight/2);  // Left point
        this.ctx.closePath();

        // Create the clipping mask
        this.ctx.clip();

        // Check if tile has a door structure
        const hasDoor = tile.structure && tile.structure.type === 'door';

        if (tile.type === 'water') {
            this.waterRenderer.renderWaterTile(
                this.ctx,
                isoX - this.tileWidth/2,  // Adjust position to account for clipping
                finalY,
                this.tileWidth,
                this.tileHeight
            );
        } else {
            const texture = this.tileManager.getTexture(tile.type, tile.variant);
            if (texture && texture.complete && !hasDoor) {  // Don't use texture for door tiles
                // Draw the image slightly larger to ensure it fills the diamond
                this.ctx.drawImage(
                    texture, 
                    isoX - this.tileWidth/2,  // Adjust position to account for clipping
                    finalY,
                    this.tileWidth,
                    this.tileHeight
                );
            } else {
                // Fallback color fill if texture isn't available or if it's a door tile
                this.ctx.fillStyle = this.getTileColor(tile.type, hasDoor);
                this.ctx.fill();
            }
        }

        // Optional: Add tile border
        this.ctx.strokeStyle = hasDoor ? '#FFD700' : 'rgba(0,0,0,0.1)';  // Gold border for door tiles
        this.ctx.lineWidth = hasDoor ? 2 : 1;  // Thicker border for door tiles
        this.ctx.stroke();

        // Restore the context state
        this.ctx.restore();
    }

    animate() {
        this.waterRenderer.update();
        requestAnimationFrame(() => this.animate());
    }

    getTileColor(tileType, hasDoor = false) {
        if (hasDoor) {
            return '#FFD700'; // Gold color for door tiles
        }

        const colors = {
            'water': '#1976D2',     // Blue
            'wetland': '#558B2F',    // Dark green
            'sand': '#FDD835',       // Sand yellow
            'dirt': '#795548',       // Brown
            'grass': '#4CAF50',      // Green
            'forest': '#2E7D32',     // Dark green
            'mountain': '#757575',   // Gray
            'concrete': '#9E9E9E',   // Medium gray
            'asphalt': '#424242',    // Dark gray
            'metal': '#B0BEC5',      // Bluish gray
            'tiles': '#78909C',      // Cool gray
            'gravel': '#707070',     // Warm gray
            'solar': '#1A237E',      // Deep blue
            'garden': '#66BB6A',     // Light green
            'helipad': '#F57F17',    // Orange
            'parking': '#37474F'     // Dark blue-gray
        };
        return colors[tileType] || '#FF0000';  // Return red for unknown types
    }
}





