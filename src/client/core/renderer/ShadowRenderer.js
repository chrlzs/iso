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

        // Debug log
        if (world?.game?.debug?.flags?.logShadows) {
            console.log(`Rendering shadow for structure at ${structure.x},${structure.y}:`, {
                type: structure.type,
                width,
                height,
                structureHeight,
                screenPos: { x: screenX, y: screenY }
            });
        }

        // Save context state
        this.ctx.save();

        // Use a simpler shadow approach - just draw a semi-transparent ellipse
        // This is more likely to be visible and easier to debug

        // Calculate shadow size based on structure dimensions
        const shadowWidth = (width + height) * tileWidth * 0.75;
        const shadowHeight = (width + height) * tileHeight * 0.3;

        // Position the shadow at the bottom of the structure
        const shadowX = screenX + (width * tileWidth / 4);
        const shadowY = screenY + (height * tileHeight / 2) + (width * tileHeight / 4);

        // Draw a simple elliptical shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            shadowX,
            shadowY,
            shadowWidth,
            shadowHeight,
            0,
            0,
            Math.PI * 2
        );
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

        // DIRECT DEBUG: Draw a test shadow to verify the shadow renderer is working
        this.drawTestShadow(tileWidth, tileHeight);

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

    /**
     * Draws a test shadow to verify the shadow renderer is working
     * @param {number} tileWidth - Width of a tile in pixels
     * @param {number} tileHeight - Height of a tile in pixels
     */
    drawTestShadow(tileWidth, tileHeight) {
        // Save context state
        this.ctx.save();

        // Draw a large, obvious test shadow in the center of the screen
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;

        // Position in the center of the screen
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        // Draw a very obvious shadow
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Red semi-transparent
        this.ctx.beginPath();
        this.ctx.ellipse(
            centerX,
            centerY,
            tileWidth * 3, // Large shadow
            tileHeight * 1.5,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Add a border to make it more visible
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Add text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TEST SHADOW', centerX, centerY);

        console.log('Drew test shadow at', { x: centerX, y: centerY });

        // Restore context state
        this.ctx.restore();
    }
}
