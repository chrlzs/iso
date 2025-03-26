import { DecorationRenderer } from './DecorationRenderer.js';
import { WaterRenderer } from './WaterRenderer.js';
import { StructureRenderer } from './StructureRenderer.js';

export class IsometricRenderer {
    constructor(canvas, tileManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileManager = tileManager;
        
        // Define tile dimensions
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.heightScale = 32; // Height scale for elevation
        
        // Initialize sub-renderers with correct parameters
        this.waterRenderer = new WaterRenderer();  // WaterRenderer doesn't need parameters
        this.decorationRenderer = new DecorationRenderer(this.ctx, this.tileWidth, this.tileHeight);
        this.structureRenderer = new StructureRenderer(this.ctx); // Initialize StructureRenderer
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        const endY = Math.min(world.height, startX + screenTileHeight);

        // Render tiles in isometric order
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
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

        // Calculate isometric position
        const isoX = (x - y) * this.tileWidth / 2;
        const isoY = (x + y) * this.tileHeight / 2;

        // Adjust Y position based on height, except for water
        const heightOffset = tile.type === 'water' ? 0 : (tile.height * this.heightScale);
        const finalY = isoY - heightOffset;

        if (tile.type === 'water') {
            // Use WaterRenderer for water tiles
            this.waterRenderer.renderWaterTile(
                this.ctx,
                isoX,
                finalY,
                this.tileWidth,
                this.tileHeight
            );
        } else {
            // Use static textures for all other tiles
            const texture = this.tileManager.getTexture(tile.type, tile.variant);
            if (texture && texture.complete) {
                this.ctx.drawImage(texture, isoX, finalY, this.tileWidth, this.tileHeight);
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
        this.waterRenderer.update();
        requestAnimationFrame(() => this.animate());
    }
}
























