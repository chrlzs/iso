import { DecorationRenderer } from './DecorationRenderer.js';
import { WaterRenderer } from './WaterRenderer.js';
import { StructureRenderer } from './StructureRenderer.js';

/**
 * Handles isometric rendering of the game world and entities
 * @class IsometricRenderer
 */
export class IsometricRenderer {
    /**
     * Creates a new IsometricRenderer instance
     * @param {HTMLCanvasElement} canvas - The game's canvas element
     * @param {TileManager} tileManager - Reference to game's tile manager
     * @param {Object} [options={}] - Renderer configuration options
     * @param {number} [options.tileWidth=64] - Width of tiles in pixels
     * @param {number} [options.tileHeight=32] - Height of tiles in pixels
     */
    constructor(canvas, tileManager, options = {}) {
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

    /**
     * Clears the canvas for the next frame
     * @returns {void}
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Renders the game world and all its contents
     * @param {World} world - The game world to render
     * @param {Object} camera - Camera position and zoom
     * @returns {void}
     */
    renderWorld(world, camera) {
        if (!this.tileManager) {
            console.error('TileManager not initialized');
            return;
        }

        // First render tiles
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const tile = world.getTileAt(x, y);
                if (tile) {
                    this.renderTile(tile, x, y);
                }
            }
        }

        // Debug log structures
        const structures = world.getAllStructures();
        console.log('Structures to render:', {
            count: structures.length,
            structures: structures.map(s => ({
                type: s.type,
                pos: `${s.x},${s.y}`,
                template: s.template
            }))
        });

        // Render structures
        structures.forEach(structure => {
            const screenCoords = this.worldToScreen(structure.x, structure.y);
            console.log('Rendering structure:', {
                type: structure.type,
                worldPos: `${structure.x},${structure.y}`,
                screenPos: screenCoords
            });
            
            this.structureRenderer.render(structure, structure.x, structure.y, screenCoords.x, screenCoords.y);
        });
    }

    /**
     * Renders a single tile at specified coordinates
     * @param {Object} tile - Tile data to render
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @private
     */
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

    /**
     * Converts world coordinates to isometric screen coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {{x: number, y: number}} Screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - worldY) * this.tileWidth / 2,
            y: (worldX + worldY) * this.tileHeight / 2
        };
    }

    /**
     * Converts screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @param {number} zoom - Zoom level
     * @param {number} cameraX - Camera X position
     * @param {number} cameraY - Camera Y position
     * @returns {{x: number, y: number}} World coordinates
     */
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

    /**
     * Converts world coordinates to isometric screen coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {{x: number, y: number}} Screen coordinates
     */
    convertToIsometric(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2),
            y: (x + y) * (this.tileHeight / 2)
        };
    }

    animate() {
        this.waterRenderer.update();
        requestAnimationFrame(() => this.animate());
    }

    getTileColor(tileType) {
        const colors = {
            // Natural terrain
            'grass': '#90CF50',
            'dirt': '#8B4513',
            'stone': '#808080',
            'sand': '#F4A460',
            'water': '#4169E1',
            'wetland': '#2F4F4F',
            'mountain': '#696969',
            'forest': '#228B22',
            
            // Urban terrain
            'concrete': '#A9A9A9',
            'asphalt': '#404040',
            'metal': '#B8B8B8',
            'tiles': '#D3D3D3',
            'gravel': '#9B9B9B',
            
            // Structures
            'building': '#A9A9A9',
            'door': '#FFD700',
            'road': '#333333',
            'walkway': '#CCCCCC',
            'parking': '#696969',
            'helipad': '#2F4F4F',
            'solar': '#1C1C1C',
            
            // Flora
            'tree': '#228B22',
            'bush': '#3B7A57',
            'garden': '#558B2F'
        };

        const color = colors[tileType];
        if (!color) {
            console.warn(`Unknown tile type: ${tileType} - using fallback color`);
            return '#FF00FF'; // Use magenta for unknown types
        }
        return color;
    }
}












