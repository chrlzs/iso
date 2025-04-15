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

        // Draw based on structure type
        if (this.structureType === 'tree') {
            // Draw a tree
            // Trunk
            graphics.beginFill(0x8B4513);
            graphics.drawRect(-10, -10, 20, 40);
            graphics.endFill();

            // Foliage
            graphics.beginFill(0x00FF00);
            graphics.drawCircle(0, -40, 30);
            graphics.endFill();
        } else if (this.structureType === 'rock') {
            // Draw a rock
            graphics.beginFill(0xCCCCCC);
            graphics.drawEllipse(0, 0, 30, 20);
            graphics.endFill();
        } else {
            // Generic building
            graphics.beginFill(0xAAAAAA);
            graphics.drawRect(-30, -60, 60, 60);
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

            this.highlightGraphics.lineStyle(2, 0xFFFF00, 0.8);
            this.highlightGraphics.moveTo(-width/2, 0);
            this.highlightGraphics.lineTo(0, -height/2);
            this.highlightGraphics.lineTo(width/2, 0);
            this.highlightGraphics.lineTo(0, height/2);
            this.highlightGraphics.closePath();
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
