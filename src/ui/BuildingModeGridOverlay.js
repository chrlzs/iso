/**
 * BuildingModeGridOverlay.js
 * Provides a grid overlay for the building mode to help with tile placement
 */
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * BuildingModeGridOverlay class
 * Creates and manages a grid overlay for building mode
 */
export class BuildingModeGridOverlay {
    /**
     * Creates a new building mode grid overlay
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.game = options.game;
        this.world = options.world || (this.game ? this.game.world : null);

        // Grid properties
        this.gridWidth = options.gridWidth || (this.world ? this.world.config.gridWidth : 64);
        this.gridHeight = options.gridHeight || (this.world ? this.world.config.gridHeight : 64);
        this.tileWidth = options.tileWidth || (this.world ? this.world.config.tileWidth : 64);
        this.tileHeight = options.tileHeight || (this.world ? this.world.config.tileHeight : 32);

        // Create container
        this.container = new PIXI.Container();
        this.container.zIndex = 900; // Below UI but above world
        this.container.visible = false;

        // Create grid graphics
        this.gridGraphics = new PIXI.Graphics();
        this.container.addChild(this.gridGraphics);

        // Create coordinate labels container
        this.labelsContainer = new PIXI.Container();
        this.container.addChild(this.labelsContainer);

        // Add to world if available
        if (this.world) {
            this.world.addChild(this.container);
        }

        // Draw initial grid
        this.drawGrid();
    }

    /**
     * Shows the grid overlay
     */
    show() {
        this.container.visible = true;
        this.drawGrid(); // Redraw in case world has changed
    }

    /**
     * Hides the grid overlay
     */
    hide() {
        this.container.visible = false;
    }

    /**
     * Toggles the grid overlay visibility
     * @param {boolean} silent - Whether to toggle silently (without triggering messages)
     * @returns {boolean} The new visibility state
     */
    toggle(silent = false) {
        this.container.visible = !this.container.visible;
        if (this.container.visible) {
            this.drawGrid(); // Redraw in case world has changed
        }
        return this.container.visible;
    }

    /**
     * Draws the grid
     */
    drawGrid() {
        if (!this.world) return;

        // Clear existing grid
        this.gridGraphics.clear();

        // Clear existing labels
        this.labelsContainer.removeChildren();

        // Get current camera position and zoom
        const camera = this.world.camera;
        const zoom = camera ? camera.zoom : 1;

        // Calculate visible grid area based on camera position
        const screenWidth = this.game.app.screen.width;
        const screenHeight = this.game.app.screen.height;

        // Convert screen bounds to grid coordinates
        const topLeft = this.world.screenToGrid(0, 0);
        const bottomRight = this.world.screenToGrid(screenWidth, screenHeight);

        // Add some padding to ensure we draw enough grid
        const padding = 5;
        const minX = Math.max(0, Math.floor(topLeft.x) - padding);
        const minY = Math.max(0, Math.floor(topLeft.y) - padding);
        const maxX = Math.min(this.gridWidth, Math.ceil(bottomRight.x) + padding);
        const maxY = Math.min(this.gridHeight, Math.ceil(bottomRight.y) + padding);

        // Draw grid lines
        this.gridGraphics.lineStyle(1, 0x00FFFF, 0.5);

        // Draw horizontal grid lines
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const worldPos = this.world.gridToWorld(x, y);
                const tile = this.world.getTile(x, y);

                // Draw tile outline
                if (tile) {
                    // Draw diamond shape for each tile
                    this.gridGraphics.moveTo(worldPos.x, worldPos.y - this.tileHeight / 2);
                    this.gridGraphics.lineTo(worldPos.x + this.tileWidth / 2, worldPos.y);
                    this.gridGraphics.lineTo(worldPos.x, worldPos.y + this.tileHeight / 2);
                    this.gridGraphics.lineTo(worldPos.x - this.tileWidth / 2, worldPos.y);
                    this.gridGraphics.lineTo(worldPos.x, worldPos.y - this.tileHeight / 2);

                    // Add coordinate label for every 5th tile
                    if ((x % 5 === 0 && y % 5 === 0) || (x === 0 && y === 0)) {
                        const label = new PIXI.Text(`${x},${y}`, {
                            fontFamily: 'Arial',
                            fontSize: 10,
                            fill: 0x00FFFF,
                            stroke: 0x000000,
                            strokeThickness: 2,
                            align: 'center'
                        });
                        label.anchor.set(0.5, 0.5);
                        label.position.set(worldPos.x, worldPos.y);
                        this.labelsContainer.addChild(label);
                    }
                }
            }
        }

        // Draw origin marker (0,0)
        const originPos = this.world.gridToWorld(0, 0);
        this.gridGraphics.lineStyle(2, 0xFF00FF, 1);
        this.gridGraphics.drawCircle(originPos.x, originPos.y, 5);
    }

    /**
     * Updates the grid overlay
     */
    update() {
        if (this.container.visible) {
            this.drawGrid();
        }
    }

    /**
     * Destroys the grid overlay
     */
    destroy() {
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        this.container.destroy({ children: true });
    }
}
