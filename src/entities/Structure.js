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

        // Add interaction area
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

        // Store the graphics object
        this.sprite = graphics;

        // Make sure it's visible
        this.sprite.visible = true;
        this.sprite.alpha = 1;
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
        this.interactive = true;
        this.buttonMode = true;
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
        // Emit interaction event
        if (this.world) {
            // TODO: Implement event system
            console.log(`Clicked on ${this.structureType} at (${this.gridX}, ${this.gridY})`);
        }

        // If enterable, enter the structure
        if (this.enterable) {
            this.enter();
        }
    }

    /**
     * Updates the highlight effect
     * @private
     */
    updateHighlight() {
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
     * Places the structure in the world
     * @param {IsometricWorld} world - The world to place the structure in
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the structure was placed successfully
     */
    placeInWorld(world, gridX, gridY) {
        if (!world) return false;

        // Check if the structure can be placed at the specified position
        if (!this.canPlaceAt(world, gridX, gridY)) {
            return false;
        }

        // Set grid position
        this.gridX = gridX;
        this.gridY = gridY;

        // Set world reference
        this.world = world;

        // Calculate screen position using isometric coordinates
        const isoX = (gridX - gridY) * world.tileWidth / 2;
        const isoY = (gridX + gridY) * world.tileHeight / 2;

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

        // Position the graphics at the tile
        graphics.position.set(isoX, isoY);

        // Add directly to the world
        world.addChild(graphics);

        // Store reference to the graphics
        this.worldGraphics = graphics;

        // Add the structure to the world's entity list
        world.entities.add(this);

        // Mark tiles as occupied
        this.occupyTiles(world);

        // Force update the world to ensure the structure is rendered
        world.sortTilesByDepth = true;

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
        // Strict boundary check for entire structure footprint
        if (gridX < 0 || gridX + this.gridWidth > world.gridWidth ||
            gridY < 0 || gridY + this.gridHeight > world.gridHeight) {
            console.log(`Structure placement out of bounds at (${gridX}, ${gridY})`);
            return false;
        }

        // Special check for bottom row to prevent phantom structure placement
        if (gridY + this.gridHeight > world.gridHeight) {
            console.log(`Structure would extend beyond world bounds at (${gridX}, ${gridY})`);
            return false;
        }

        // Check if all tiles are available and valid
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const tile = world.getTile(gridX + x, gridY + y);

                // Additional validation to prevent phantom tile placement
                if (!tile) {
                    console.log(`No valid tile at (${gridX + x}, ${gridY + y})`);
                    return false;
                }

                // Ensure tile is within bounds and valid
                if (!tile.walkable || tile.structure || 
                    tile.gridX < 0 || tile.gridX >= world.gridWidth ||
                    tile.gridY < 0 || tile.gridY >= world.gridHeight) {
                    console.log(`Invalid tile for structure at (${tile.gridX}, ${tile.gridY})`);
                    return false;
                }
            }
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

        // Mark new tiles as occupied
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const tile = world.getTile(this.gridX + x, this.gridY + y);

                if (tile) {
                    tile.structure = this;
                    tile.walkable = this.walkable;
                    this.occupiedTiles.push(tile);
                }
            }
        }
    }

    /**
     * Removes the structure from the world
     */
    removeFromWorld() {
        // Clear occupied tiles
        this.occupiedTiles.forEach(tile => {
            if (tile.structure === this) {
                tile.structure = null;
                tile.walkable = true;
            }
        });

        this.occupiedTiles = [];

        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Clear world reference
        this.world = null;
    }

    /**
     * Enters the structure
     * Only applicable if the structure is enterable
     */
    enter() {
        if (!this.enterable) return;

        // TODO: Implement structure entry logic
        console.log(`Entering ${this.structureType} at (${this.gridX}, ${this.gridY})`);
    }

    /**
     * Damages the structure
     * Only applicable if the structure is destructible
     * @param {number} amount - Damage amount
     */
    damage(amount) {
        if (!this.destructible) return;

        this.health = Math.max(0, this.health - amount);

        // Check if destroyed
        if (this.health <= 0) {
            this.destroy();
        }
    }

    /**
     * Destroys the structure
     * Only applicable if the structure is destructible
     */
    destroy() {
        if (!this.destructible) return;

        // TODO: Implement destruction animation

        // Remove from world
        this.removeFromWorld();
    }

    /**
     * Updates the structure
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update highlight if needed
        if (this.highlightGraphics && this.highlighted) {
            this.updateHighlight();
        }
    }

    /**
     * Resets the structure
     * @param {Object} options - Reset options
     */
    reset(options = {}) {
        super.reset(options);

        // Reset structure properties
        this.health = options.health || this.maxHealth || 100;
        this.highlighted = false;

        // Clear occupied tiles
        this.occupiedTiles.forEach(tile => {
            if (tile.structure === this) {
                tile.structure = null;
                tile.walkable = true;
            }
        });

        this.occupiedTiles = [];

        // Update highlight
        if (this.highlightGraphics) {
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
        if (this.interactive) {
            this.off('mouseover', this.onMouseOver);
            this.off('mouseout', this.onMouseOut);
            this.off('click', this.onClick);
        }

        super.dispose();
    }
}
