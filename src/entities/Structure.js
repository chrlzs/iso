import { Entity } from './Entity.js';
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Structure - Represents a static structure in the game world
 * Such as buildings, trees, rocks, etc.
 */
export class Structure extends Entity {
    /**
     * Creates a new structure
     * @param {Object} options - Structure options
     */
    constructor(options = {}) {
        super(options);

        // Structure properties
        this.structureType = options.structureType || 'generic';
        this.solid = options.solid !== undefined ? options.solid : true;
        this.walkable = options.walkable !== undefined ? options.walkable : false;
        this.enterable = options.enterable !== undefined ? options.enterable : false;
        this.destructible = options.destructible !== undefined ? options.destructible : false;
        this.health = options.health || 100;
        this.maxHealth = options.maxHealth || this.health;

        // Grid properties
        this.gridX = options.gridX || 0;
        this.gridY = options.gridY || 0;
        this.gridWidth = options.gridWidth || 1;
        this.gridHeight = options.gridHeight || 1;

        // Occupied tiles
        this.occupiedTiles = [];

        // Create sprite
        this.createSprite(options);

        // Add interaction capabilities if requested
        if (options.interactive) {
            this.createInteractionArea();
        }
    }

    /**
     * Creates the structure sprite
     * @param {Object} options - Sprite options
     * @private
     */
    createSprite(options) {
        // Create a new graphics object
        const graphics = new PIXI.Graphics();

        // Synthwave color palette
        const colors = {
            tree: {
                main: 0x00FF00,    // Neon green
                accent: 0xFF00FF,   // Magenta
                dark: 0x004400,     // Dark green
                trunk: 0xFF6B6B     // Coral pink
            },
            rock: {
                main: 0xAAAAAA,    // Silver
                accent: 0x00FFFF,   // Cyan
                dark: 0x444444      // Dark gray
            },
            house: {
                main: 0x00FFFF,    // Cyan
                accent: 0xFF00FF,   // Magenta
                dark: 0x000080,     // Dark blue
                roof: 0xFF355E      // Hot pink
            },
            generic: {
                main: 0xFF00FF,    // Magenta
                accent: 0x00FFFF,   // Cyan
                dark: 0x800080      // Dark purple
            }
        };

        // Get colors for structure type
        const structureColors = colors[this.structureType] || colors.generic;

        // Common glow effect for all structures
        const glowSize = 8;
        [0.1, 0.2, 0.3].forEach(glowAlpha => {
            graphics.lineStyle(glowSize * (1 + glowAlpha), structureColors.accent, glowAlpha);
            if (this.structureType === 'tree') {
                graphics.drawCircle(0, -40, 30);
            } else if (this.structureType === 'rock') {
                graphics.drawEllipse(0, 0, 30, 20);
            } else {
                graphics.drawRect(-30, -60, 60, 60);
            }
        });

        // Draw based on structure type with synthwave aesthetic
        if (this.structureType === 'tree') {
            // Draw a tree with neon effect
            // Trunk
            graphics.beginFill(structureColors.trunk, 0.7);
            graphics.drawRect(-10, -10, 20, 40);
            graphics.endFill();

            // Trunk outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawRect(-10, -10, 20, 40);

            // Grid pattern on trunk
            graphics.lineStyle(1, structureColors.accent, 0.3);
            for (let y = -10; y <= 30; y += 5) {
                graphics.moveTo(-10, y);
                graphics.lineTo(10, y);
            }

            // Foliage with neon effect
            graphics.beginFill(structureColors.main, 0.7);
            graphics.drawCircle(0, -40, 30);
            graphics.endFill();

            // Foliage outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawCircle(0, -40, 30);

            // Add animated accents
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            graphics.lineStyle(2, structureColors.accent, 0.8);

            // Top accent
            graphics.moveTo(0, -70);
            graphics.lineTo(0, -70 + 10 * pulseScale);

            // Side accents
            graphics.moveTo(-30, -40);
            graphics.lineTo(-30 + 10 * pulseScale, -40);
            graphics.moveTo(30, -40);
            graphics.lineTo(30 - 10 * pulseScale, -40);

        } else if (this.structureType === 'rock') {
            // Draw a rock with neon effect
            graphics.beginFill(structureColors.dark, 0.7);
            graphics.drawEllipse(0, 0, 30, 20);
            graphics.endFill();

            // Rock outline
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.drawEllipse(0, 0, 30, 20);

            // Add highlights
            graphics.lineStyle(1, structureColors.accent, 0.8);
            graphics.moveTo(-15, -5);
            graphics.lineTo(-5, -10);
            graphics.lineTo(5, -8);
            graphics.lineTo(15, -3);

            // Add animated accent
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            graphics.lineStyle(2, structureColors.accent, 0.8);
            graphics.drawEllipse(0, 0, 32 * pulseScale, 22 * pulseScale);

        } else {
            // Generic building with neon effect
            // Base
            graphics.beginFill(structureColors.dark, 0.7);
            graphics.drawRect(-30, -30, 60, 30);
            graphics.endFill();

            // Base outline
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.drawRect(-30, -30, 60, 30);

            // Grid pattern on base
            graphics.lineStyle(1, structureColors.accent, 0.3);
            for (let y = -30; y <= 0; y += 5) {
                graphics.moveTo(-30, y);
                graphics.lineTo(30, y);
            }

            // Roof
            graphics.beginFill(structureColors.accent, 0.7);
            graphics.moveTo(-30, -30);
            graphics.lineTo(0, -60);
            graphics.lineTo(30, -30);
            graphics.closePath();
            graphics.endFill();

            // Roof outline
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.moveTo(-30, -30);
            graphics.lineTo(0, -60);
            graphics.lineTo(30, -30);

            // Door
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-10, -25, 20, 25);
            graphics.endFill();

            // Door outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawRect(-10, -25, 20, 25);

            // Window
            graphics.beginFill(structureColors.accent, 0.3);
            graphics.drawRect(-20, -20, 5, 5);
            graphics.drawRect(15, -20, 5, 5);
            graphics.endFill();

            // Window outlines
            graphics.lineStyle(1, structureColors.accent, 1);
            graphics.drawRect(-20, -20, 5, 5);
            graphics.drawRect(15, -20, 5, 5);

            // Add animated accents
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            graphics.lineStyle(2, structureColors.accent, 0.8);

            // Roof accent
            graphics.moveTo(0, -60);
            graphics.lineTo(0, -60 + 10 * pulseScale);

            // Door handle
            graphics.beginFill(structureColors.accent, 1);
            graphics.drawCircle(5, -15, 2 * pulseScale);
            graphics.endFill();
        }

        // Add graphics to container
        this.addChild(graphics);
        this.sprite = graphics;
    }

    /**
     * Creates an interaction area for the structure
     * @private
     */
    createInteractionArea() {
        // Create a hitArea for the structure
        const width = this.gridWidth * 32;
        const height = this.gridHeight * 16;

        // Create a polygon hitArea for isometric shape
        const hitArea = new PIXI.Polygon([
            -width/2, 0,
            0, -height/2,
            width/2, 0,
            0, height/2
        ]);

        // Set interactive properties
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.hitArea = hitArea;

        // Add hover effect
        this.on('mouseover', this.onMouseOver.bind(this));
        this.on('mouseout', this.onMouseOut.bind(this));
        this.on('click', this.onClick.bind(this));

        // Create highlight graphics
        this.highlightGraphics = new PIXI.Graphics();
        this.addChildAt(this.highlightGraphics, 0);

        // Hide highlight by default
        this.highlighted = false;
        this.updateHighlight();
    }

    /**
     * Places the structure in the world
     * @param {IsometricWorld} world - The world to place the structure in
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the structure was placed successfully
     */
    placeInWorld(world, gridX, gridY) {
        if (!world || !this.canPlaceAt(world, gridX, gridY)) {
            return false;
        }

        // Set grid position
        this.gridX = gridX;
        this.gridY = gridY;

        // Set world reference
        this.world = world;

        // Calculate isometric position
        const worldPos = world.gridToWorld(gridX, gridY);
        this.position.set(worldPos.x, worldPos.y);

        // Add to structure layer
        world.structureLayer.addChild(this);

        // Mark tiles as occupied
        this.occupyTiles(world);

        // Add to world's entity list
        world.entities.add(this);

        return true;
    }

    /**
     * Checks if the structure can be placed at the specified position
     * @param {IsometricWorld} world - The world to check
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the structure can be placed
     */
    canPlaceAt(world, gridX, gridY) {
        if (!world) return false;

        // For chunk-based worlds, we don't need to do a strict boundary check
        // This allows structures to be placed in new chunks

        // Only apply a very loose boundary check to prevent extreme values
        const maxDistance = 1000; // Allow coordinates up to 1000 tiles away from origin
        if (gridX < -maxDistance || gridX >= world.config.gridWidth + maxDistance ||
            gridY < -maxDistance || gridY >= world.config.gridHeight + maxDistance) {
            console.log(`Cannot place structure at (${gridX}, ${gridY}): far outside world bounds`);
            return false;
        }

        // Check if target tile is valid
        const tile = world.getTile(gridX, gridY);
        if (!tile || !tile.walkable || tile.structure) {
            return false;
        }

        return true;
    }

    /**
     * Marks tiles as occupied by this structure
     * @param {IsometricWorld} world - The world
     * @private
     */
    occupyTiles(world) {
        // Clear previous occupied tiles
        this.occupiedTiles.forEach(tile => {
            if (tile.structure === this) {
                tile.structure = null;
                tile.walkable = true;
            }
        });

        this.occupiedTiles = [];

        // Get the target tile
        const tile = world.getTile(this.gridX, this.gridY);
        if (tile) {
            tile.structure = this;
            tile.walkable = this.walkable;
            this.occupiedTiles.push(tile);
        }
    }

    /**
     * Updates the highlight effect
     * @private
     */
    updateHighlight() {
        if (!this.highlightGraphics) return;

        this.highlightGraphics.clear();

        if (this.highlighted) {
            const width = this.gridWidth * 32;
            const height = this.gridHeight * 16;

            // Synthwave color palette
            const colors = {
                tree: 0x00FF00,    // Neon green
                rock: 0x00FFFF,    // Cyan
                house: 0xFF00FF,   // Magenta
                generic: 0xFF00FF  // Magenta
            };

            // Get highlight color based on structure type
            const highlightColor = colors[this.structureType] || colors.generic;
            const accentColor = this.structureType === 'tree' ? 0xFF00FF : 0x00FFFF;

            // Add glow effect
            const glowSize = 8;
            [0.1, 0.2, 0.3].forEach(glowAlpha => {
                this.highlightGraphics.lineStyle(glowSize * (1 + glowAlpha), highlightColor, glowAlpha);
                this.highlightGraphics.moveTo(-width/2, 0);
                this.highlightGraphics.lineTo(0, -height/2);
                this.highlightGraphics.lineTo(width/2, 0);
                this.highlightGraphics.lineTo(0, height/2);
                this.highlightGraphics.closePath();
            });

            // Main highlight
            this.highlightGraphics.beginFill(highlightColor, 0.15);
            this.highlightGraphics.lineStyle(2, highlightColor, 0.8);
            this.highlightGraphics.moveTo(-width/2, 0);
            this.highlightGraphics.lineTo(0, -height/2);
            this.highlightGraphics.lineTo(width/2, 0);
            this.highlightGraphics.lineTo(0, height/2);
            this.highlightGraphics.closePath();
            this.highlightGraphics.endFill();

            // Add grid pattern
            this.highlightGraphics.lineStyle(1, accentColor, 0.3);
            for (let y = -height/2; y <= height/2; y += 4) {
                this.highlightGraphics.moveTo(-width/2, y);
                this.highlightGraphics.lineTo(width/2, y);
            }

            // Add animated corner accents
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            const accentLength = 10 * pulseScale;

            this.highlightGraphics.lineStyle(2, accentColor, 0.8);

            // Top corner
            this.highlightGraphics.moveTo(0, -height/2);
            this.highlightGraphics.lineTo(0, -height/2 + accentLength);

            // Right corner
            this.highlightGraphics.moveTo(width/2, 0);
            this.highlightGraphics.lineTo(width/2 - accentLength, 0);

            // Bottom corner
            this.highlightGraphics.moveTo(0, height/2);
            this.highlightGraphics.lineTo(0, height/2 - accentLength);

            // Left corner
            this.highlightGraphics.moveTo(-width/2, 0);
            this.highlightGraphics.lineTo(-width/2 + accentLength, 0);
        }
    }

    /**
     * Handles mouse over event
     * @private
     */
    onMouseOver() {
        this.highlighted = true;
        this.updateHighlight();
    }

    /**
     * Handles mouse out event
     * @private
     */
    onMouseOut() {
        this.highlighted = false;
        this.updateHighlight();
    }

    /**
     * Handles click event
     * @private
     */
    onClick() {
        if (this.world) {
            console.log(`Clicked on ${this.structureType} at (${this.gridX}, ${this.gridY})`);
        }
    }

    /**
     * Updates the structure
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.highlightGraphics && this.highlighted) {
            this.updateHighlight();
        }
    }

    /**
     * Disposes of the structure
     */
    dispose() {
        // Remove from world
        this.removeFromWorld();

        // Remove event listeners
        if (this.eventMode === 'static') {
            this.off('mouseover', this.onMouseOver);
            this.off('mouseout', this.onMouseOut);
            this.off('click', this.onClick);
        }

        super.dispose();
    }
}
