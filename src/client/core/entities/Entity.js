/**
 * @module Entity
 * @description Base class for all game entities including players, NPCs, and interactive objects
 */
import { ObjectPool } from '../utils/ObjectPool.js';

/**
 * @typedef {Object} EntityConfig
 * @property {string} [id] - Unique entity identifier
 * @property {number} x - Initial X coordinate
 * @property {number} y - Initial Y coordinate
 * @property {World} world - Reference to game world
 * @property {number} [health=100] - Initial health points
 * @property {number} [speed=1] - Movement speed
 * @property {boolean} [isActive=true] - Whether entity is active
 */

/**
 * Base entity class providing core functionality for game objects
 * @class Entity
 * @property {string} id - Unique entity identifier
 * @property {number} x - Current X coordinate
 * @property {number} y - Current Y coordinate
 * @property {World} world - Reference to game world
 * @property {number} health - Current health points
 * @property {number} speed - Movement speed
 * @property {boolean} isActive - Whether entity is active
 * @property {boolean} isVisible - Whether entity is visible
 */
export class Entity {
    /**
     * Object pool for entity instances
     * @type {ObjectPool}
     * @static
     */
    static pool = null;

    /**
     * Gets an entity from the pool or creates a new one
     * @param {Object} config - Entity configuration
     * @returns {Entity} - A new or recycled entity instance
     * @static
     */
    static create(config = {}) {
        // Initialize pool if it doesn't exist
        if (!Entity.pool) {
            Entity.pool = new ObjectPool(
                () => new Entity(),
                (entity) => entity.reset()
            );
        }

        // Get entity from pool
        const entity = Entity.pool.get();

        // Initialize with config
        entity.init(config);

        return entity;
    }

    /**
     * Returns an entity to the pool
     * @param {Entity} entity - The entity to return to the pool
     * @static
     */
    static release(entity) {
        if (!entity || !Entity.pool) return;

        // Return to pool
        Entity.pool.release(entity);
    }
    /**
     * Creates a new Entity instance
     * @param {EntityConfig} config - Entity configuration
     * @throws {Error} When required config properties are missing
     */
    constructor(config) {
        if (!config.world) {
            throw new Error('Entity requires world reference');
        }

        this.id = config.id || crypto.randomUUID();
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.world = config.world;

        // Health properties
        this.health = config.health || 100;
        this.maxHealth = config.maxHealth || 100;

        // Movement properties
        this.speed = config.speed || 1;
        this.path = null;
        this.nextPathIndex = 0;
        this.isMoving = false;

        // Visual properties
        this.size = config.size || 24; // Default entity size
        this.color = config.color || '#3498db'; // Default blue color

        // State flags
        this.isVisible = true;
        this.isActive = true;
    }

    /**
     * Updates entity state
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        if (!this.isActive) return;

        // Update path movement
        if (this.path && this.nextPathIndex < this.path.length) {
            this.updatePathMovement(deltaTime);
        }

        // Update terrain info
        this.updateTerrainInfo();
    }

    /**
     * Updates entity's movement along current path
     * @param {number} deltaTime - Time elapsed since last update
     * @private
     */
    updatePathMovement(deltaTime) {
        const target = this.path[this.nextPathIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) {
            // Reached current target
            this.x = target.x;
            this.y = target.y;
            this.nextPathIndex++;

            if (this.nextPathIndex >= this.path.length) {
                this.clearPath();
            }
        } else {
            // Move towards target
            const speed = this.getModifiedSpeed();
            const movement = speed * deltaTime;
            const ratio = Math.min(movement / distance, 1);

            this.x += dx * ratio;
            this.y += dy * ratio;
            this.isMoving = true;
        }
    }

    /**
     * Updates entity's terrain information
     * @private
     */
    updateTerrainInfo() {
        const tile = this.world.getTileAt(Math.floor(this.x), Math.floor(this.y));
        if (tile) {
            this.currentTileType = tile.type;
            this.currentHeight = tile.height;
        }
    }

    /**
     * Gets entity's movement speed modified by current conditions
     * @returns {number} Modified speed value
     * @private
     */
    getModifiedSpeed() {
        let modifiedSpeed = this.speed;

        // Apply terrain effects
        if (this.currentTileType) {
            const surfaceType = this.world.tileManager.getSurfaceType(this.currentTileType);
            switch (surfaceType) {
                case TileManager.SURFACE_TYPES.ROUGH:
                    modifiedSpeed *= 0.7;
                    break;
                case TileManager.SURFACE_TYPES.SLIPPERY:
                    modifiedSpeed *= 1.3;
                    break;
            }
        }

        return modifiedSpeed;
    }

    /**
     * Sets new path for entity to follow
     * @param {Array<{x: number, y: number}>} path - Array of path coordinates
     */
    setPath(path) {
        this.path = path;
        this.nextPathIndex = 0;
    }

    /**
     * Clears entity's current path
     */
    clearPath() {
        this.path = null;
        this.nextPathIndex = 0;
        this.isMoving = false;
    }

    /**
     * Damages the entity
     * @param {number} amount - Amount of damage to deal
     * @param {Entity} [source] - Entity dealing the damage
     * @returns {number} Actual damage dealt
     */
    takeDamage(amount, source) {
        const previousHealth = this.health;
        this.health = Math.max(0, this.health - amount);
        const actualDamage = previousHealth - this.health;

        if (this.health <= 0) {
            this.die();
        }

        return actualDamage;
    }

    /**
     * Heals the entity
     * @param {number} amount - Amount to heal
     * @returns {number} Actual amount healed
     */
    heal(amount) {
        const previousHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health - previousHealth;
    }

    /**
     * Handles entity death
     * @private
     */
    die() {
        this.isActive = false;
        this.isDead = true; // Mark for removal from entity arrays
        this.clearPath();

        // Log death if debug is enabled
        if (this.game?.debug?.flags?.logEntities) {
            console.log(`Entity ${this.id} (${this.type}) died`);
        }

        // Additional death handling can be implemented by subclasses
    }

    /**
     * Disposes of entity resources
     * Called when entity is removed from the game
     */
    dispose() {
        // Release any resources held by this entity
        this.path = null;
        this.target = null;

        // Remove from spatial grid if needed
        if (this._spatialGridIndices && this.game?.spatialGrid) {
            this.game.spatialGrid.remove(this);
        }

        // Return to pool
        Entity.release(this);
    }

    /**
     * Resets the entity to its default state
     * Called when entity is returned to the pool
     */
    reset() {
        // Reset basic properties
        this.id = null;
        this.type = 'entity';
        this.x = 0;
        this.y = 0;
        this.width = 1;
        this.height = 1;
        this.speed = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.isActive = false;
        this.isVisible = false;
        this.isMoving = false;
        this.isDead = false;

        // Reset references
        this.game = null;
        this.world = null;
        this.path = null;
        this.target = null;
        this.currentTileType = null;
        this.currentHeight = 0;
        this.nextPathIndex = 0;

        // Reset spatial grid indices
        this._spatialGridIndices = null;
    }

    /**
     * Initializes the entity with the given configuration
     * @param {EntityConfig} config - Entity configuration
     */
    init(config) {
        // Set basic properties
        this.id = config.id || `entity_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.type = config.type || 'entity';
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 1;
        this.height = config.height || 1;
        this.speed = config.speed || 1;
        this.health = config.health || 100;
        this.maxHealth = config.maxHealth || this.health;
        this.isActive = config.isActive !== undefined ? config.isActive : true;
        this.isVisible = config.isVisible !== undefined ? config.isVisible : true;

        // Set references
        this.game = config.game || null;
        this.world = config.world || null;

        // Initialize state
        this.isMoving = false;
        this.isDead = false;
        this.path = null;
        this.target = null;
        this.currentTileType = null;
        this.currentHeight = 0;
        this.nextPathIndex = 0;

        // Initialize spatial grid indices
        this._spatialGridIndices = null;

        // Add to spatial grid if game is provided
        if (this.game?.spatialGrid) {
            this.game.spatialGrid.add(this);
        }

        // Track in memory manager if debug is enabled
        if (this.game?.debug?.enabled && this.game.memoryManager) {
            this.game.memoryManager.trackObject(this.type, this);
        }
    }
}