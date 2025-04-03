/**
 * Handles rendering of shadows for structures in the game world
 * @class ShadowRenderer
 */
export class ShadowRenderer {
    /**
     * Creates a new ShadowRenderer instance
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Renders a shadow for a structure
     * @param {Object} structure - The structure to render a shadow for
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @param {number} tileWidth - Width of a tile in pixels
     * @param {number} tileHeight - Height of a tile in pixels
     * @param {Object} world - The game world
     */
    renderShadow(structure, screenX, screenY, tileWidth, tileHeight, world) {
        if (!structure) return;

        // Skip trees for shadows
        if (structure.type === 'tree') return;

        // Get structure dimensions
        const width = structure.width || 1;
        const height = structure.height || 1;
        const structureHeight = structure.template?.floors || 1;

        // Calculate shadow properties based on structure size and height
        // Increase shadow length and opacity for better visibility
        const shadowLength = Math.max(width, height) * 1.0 + structureHeight * 0.5;
        const shadowOpacity = Math.min(0.5, 0.3 + structureHeight * 0.1);

        // Debug log
        if (world?.game?.debug?.flags?.logShadows) {
            console.log(`Rendering shadow for structure at ${structure.x},${structure.y}:`, {
                type: structure.type,
                width,
                height,
                structureHeight,
                shadowLength,
                shadowOpacity,
                screenPos: { x: screenX, y: screenY }
            });
        }

        // Save context state
        this.ctx.save();

        // Set shadow style
        this.ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;

        // Draw shadow as a polygon
        this.ctx.beginPath();

        // Shadow is drawn as a polygon offset from the structure
        // The shadow extends to the bottom-right in isometric view
        const shadowOffsetX = shadowLength * (tileWidth / 2);
        const shadowOffsetY = shadowLength * (tileHeight / 4);

        // Calculate shadow points - make shadow larger and more visible
        const points = [
            // Structure bottom-left corner
            { x: screenX, y: screenY + (height * tileHeight / 2) },
            // Structure bottom-right corner
            { x: screenX + (width * tileWidth / 2), y: screenY + (height * tileHeight / 2) + (width * tileHeight / 2) },
            // Shadow bottom-right corner
            { x: screenX + (width * tileWidth / 2) + shadowOffsetX,
              y: screenY + (height * tileHeight / 2) + (width * tileHeight / 2) + shadowOffsetY },
            // Shadow bottom-left corner
            { x: screenX + shadowOffsetX, y: screenY + (height * tileHeight / 2) + shadowOffsetY }
        ];

        // Draw the shadow polygon
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Restore context state
        this.ctx.restore();
    }

    /**
     * Renders shadows for all structures in the visible area
     * @param {Array} structures - Array of structures to render shadows for
     * @param {number} tileWidth - Width of a tile in pixels
     * @param {number} tileHeight - Height of a tile in pixels
     * @param {Object} world - The game world
     */
    renderShadows(structures, tileWidth, tileHeight, world) {
        if (!structures || structures.length === 0) return;

        // Enable shadow logging for debugging
        if (world?.game) {
            if (!world.game.debug) world.game.debug = {};
            if (!world.game.debug.flags) world.game.debug.flags = {};
            world.game.debug.flags.logShadows = true; // Temporarily enable shadow logging
        }

        // Log shadow rendering if debug flag is enabled
        if (world?.game?.debug?.flags?.logShadows) {
            console.log(`Rendering shadows for ${structures.length} structures`);
        }

        // Sort structures by their position for proper shadow layering
        const sortedStructures = [...structures].sort((a, b) => {
            // Sort by depth (x + y) for proper layering
            return (a.x + a.y) - (b.x + b.y);
        });

        // Render shadows for each structure
        for (const structure of sortedStructures) {
            // Calculate screen coordinates
            const screenX = (structure.x - structure.y) * (tileWidth / 2);
            const screenY = (structure.x + structure.y) * (tileHeight / 2);

            // Render the shadow
            this.renderShadow(structure, screenX, screenY, tileWidth, tileHeight, world);
        }
    }
}
