import { DecorationRenderer } from './DecorationRenderer.js';
import { WaterRenderer } from './WaterRenderer.js';
import { StructureRenderer } from './StructureRenderer.js';
import { ShadowRenderer } from './ShadowRenderer.js';

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
        this.shadowRenderer = new ShadowRenderer(this.ctx);
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
        // Render tiles first
        this.renderWorldTiles(world, camera);

        // Then render structures
        this.renderWorldStructures(world, camera);
    }

    /**
     * Renders only the tiles of the game world (no structures)
     * @param {World} world - The game world to render
     * @param {Object} camera - Camera position and zoom
     * @returns {void}
     */
    renderWorldTiles(world, camera) {
        if (!this.tileManager) {
            console.error('TileManager not initialized');
            return;
        }

        // Set the world reference in the structure renderer
        this.structureRenderer.world = world;

        // Calculate visible area based on camera position and zoom
        const viewportWidth = this.canvas.width / camera.zoom;
        const viewportHeight = this.canvas.height / camera.zoom;

        // Calculate the visible tile range in world coordinates
        // Add a buffer of tiles around the visible area to ensure smooth scrolling
        // Use a much larger buffer when zoomed in to prevent edge visibility issues
        const zoomFactor = Math.pow(2, 1 / camera.zoom); // Exponential scaling for zoom factor
        const minBuffer = 20; // Minimum buffer size
        const buffer = Math.max(minBuffer, Math.ceil(30 * zoomFactor)); // Much larger buffer when zoomed in

        // Convert screen center to world coordinates
        const centerWorldX = camera.x;
        const centerWorldY = camera.y;

        // Calculate visible range in world coordinates
        // Use a fixed base value plus the zoom-adjusted buffer
        const baseVisibleRange = Math.ceil(Math.max(viewportWidth, viewportHeight) / this.tileWidth);
        const visibleRange = baseVisibleRange + buffer;

        // Calculate bounds with extra padding when zoomed in
        // Use a much wider area when zoomed in to ensure tiles remain visible
        const minX = Math.max(0, Math.floor(centerWorldX - visibleRange));
        const minY = Math.max(0, Math.floor(centerWorldY - visibleRange));
        const maxX = Math.min(world.width - 1, Math.ceil(centerWorldX + visibleRange));
        const maxY = Math.min(world.height - 1, Math.ceil(centerWorldY + visibleRange));

        // Log the calculated visible area if debug is enabled
        if (world?.game?.debug?.flags?.logRenderer) {
            console.log('Visible area:', {
                zoom: camera.zoom,
                zoomFactor,
                buffer,
                visibleRange,
                bounds: `(${minX},${minY}) to (${maxX},${maxY})`,
                center: `(${centerWorldX},${centerWorldY})`
            });
        }

        // Get all structures for shadow rendering
        const structures = world.getAllStructures();

        // Filter structures to only those in the visible area
        const visibleStructures = structures.filter(structure => {
            return (
                structure.x + structure.width >= minX &&
                structure.x <= maxX &&
                structure.y + structure.height >= minY &&
                structure.y <= maxY
            );
        });

        // Log structures for debugging
        if (world?.game?.debug?.flags?.logRenderer) {
            console.log('Structures for shadow rendering:', {
                total: structures.length,
                visible: visibleStructures.length,
                bounds: `(${minX},${minY}) to (${maxX},${maxY})`
            });
        }

        // Render shadows first (before tiles)
        this.shadowRenderer.renderShadows(visibleStructures, this.tileWidth, this.tileHeight, world);

        // Render only visible tiles
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = world.getTileAt(x, y);
                if (tile) {
                    this.renderTile(tile, x, y);
                }
            }
        }
    }

    /**
     * Renders only the structures of the game world
     * @param {World} world - The game world to render
     * @param {Object} camera - Camera position and zoom
     * @returns {void}
     */
    renderWorldStructures(world, camera) {
        if (!this.structureRenderer) {
            console.error('StructureRenderer not initialized');
            return;
        }

        // Set the world reference in the structure renderer
        this.structureRenderer.world = world;

        // Calculate visible area based on camera position and zoom
        const viewportWidth = this.canvas.width / camera.zoom;
        const viewportHeight = this.canvas.height / camera.zoom;

        // Use the same buffer calculation as renderWorldTiles
        const zoomFactor = Math.pow(2, 1 / camera.zoom);
        const minBuffer = 20;
        const buffer = Math.max(minBuffer, Math.ceil(30 * zoomFactor));

        // Calculate visible range
        const baseVisibleRange = Math.ceil(Math.max(viewportWidth, viewportHeight) / this.tileWidth);
        const visibleRange = baseVisibleRange + buffer;

        // Calculate bounds
        const centerWorldX = camera.x;
        const centerWorldY = camera.y;
        const minX = Math.max(0, Math.floor(centerWorldX - visibleRange));
        const minY = Math.max(0, Math.floor(centerWorldY - visibleRange));
        const maxX = Math.min(world.width - 1, Math.ceil(centerWorldX + visibleRange));
        const maxY = Math.min(world.height - 1, Math.ceil(centerWorldY + visibleRange));

        // Get all structures
        const structures = world.getAllStructures();

        // Filter structures to only those in the visible area (with a buffer)
        const visibleStructures = structures.filter(structure => {
            // Check if any part of the structure is within the visible range
            const isVisible = (
                structure.x + structure.width >= minX &&
                structure.x <= maxX &&
                structure.y + structure.height >= minY &&
                structure.y <= maxY
            );

            // Log if debug is enabled and structure is a tree
            if (!isVisible && structure.type === 'tree' && world?.game?.debug?.flags?.logStructures) {
                console.log(`Tree at ${structure.x},${structure.y} is outside visible range: ${minX},${minY} to ${maxX},${maxY}`);
            }

            return isVisible;
        });

        if (world?.game?.debug?.flags?.logStructures) {
            console.log(`Filtered structures: ${structures.length} total, ${visibleStructures.length} visible`);
        }

        // Sort structures by their position in the isometric world
        const sortedStructures = this.sortStructuresByDepth(visibleStructures);

        // Render structures in sorted order
        sortedStructures.forEach(structure => {
            const screenCoords = this.worldToScreen(structure.x, structure.y);
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
            /*
            console.log(`Rendering tile with structure:`, {
                x, y,
                tileType: tile.type,
                structureType: tile.structure.type,
                isoX, isoY
            });
            */
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

    /**
     * Sorts structures by their depth in the isometric world
     * This ensures proper z-ordering (structures in the back are rendered first)
     * @param {Array} structures - Array of structures to sort
     * @returns {Array} - Sorted array of structures
     */
    sortStructuresByDepth(structures) {
        // In isometric view, objects with higher x+y values are "closer" to the viewer
        // and should be rendered later (on top)
        return [...structures].sort((a, b) => {
            // Calculate the "depth" of each structure
            // For buildings, use the far corner (x+width, y+height)
            // For trees, use their position plus a small offset to ensure they render behind buildings
            const aIsTree = a.type === 'tree';
            const bIsTree = b.type === 'tree';

            // Calculate the depth value for structure A
            const aDepth = aIsTree
                ? (a.x + a.y) // Trees use their position
                : (a.x + a.width + a.y + a.height); // Buildings use their far corner

            // Calculate the depth value for structure B
            const bDepth = bIsTree
                ? (b.x + b.y) // Trees use their position
                : (b.x + b.width + b.y + b.height); // Buildings use their far corner

            // If depths are equal, prioritize buildings over trees
            if (aDepth === bDepth) {
                return aIsTree && !bIsTree ? -1 : (!aIsTree && bIsTree ? 1 : 0);
            }

            // Sort by depth (lower values first - they're further away)
            return aDepth - bDepth;
        });
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












