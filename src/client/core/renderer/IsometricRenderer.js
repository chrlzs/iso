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
        if (!tile || !tile.type) return;

        const isoX = (x - y) * this.tileWidth / 2;
        const isoY = (x + y) * this.tileHeight / 2;

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
            if (texture && texture.complete) {
                // Draw the image slightly larger to ensure it fills the diamond
                this.ctx.drawImage(
                    texture, 
                    isoX - this.tileWidth/2,  // Adjust position to account for clipping
                    finalY,
                    this.tileWidth,
                    this.tileHeight
                );
            } else {
                // Fallback color fill if texture isn't available
                this.ctx.fillStyle = this.getTileColor(tile.type);
                this.ctx.fill();
            }
        }

        // Optional: Add tile border
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Restore the context state
        this.ctx.restore();
    }

    animate() {
        this.waterRenderer.update();
        requestAnimationFrame(() => this.animate());
    }

    // Helper method to get tile colors
    getTileColor(tileType) {
        const colors = {
            'water': '#4A90E2',
            'sand': '#F5A623',
            'grass': '#7ED321',
            'wetland': '#417505',
            'dirt': '#8B572A',
            'stone': '#9B9B9B',
            'mountain': '#757575'
        };
        return colors[tileType] || '#FF0000';
    }
}


