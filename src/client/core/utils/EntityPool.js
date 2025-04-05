import { ObjectPool } from './ObjectPool.js';

/**
 * EntityPool - Specialized object pool for game entities
 * Extends the generic ObjectPool with entity-specific functionality
 */
export class EntityPool {
    /**
     * Creates a new entity pool
     * @param {Function} entityClass - The entity class constructor
     * @param {Object} options - Pool configuration options
     * @param {number} options.initialSize - Initial pool size (default: 20)
     * @param {boolean} options.debug - Whether to log debug information (default: false)
     */
    constructor(entityClass, options = {}) {
        this.entityClass = entityClass;
        this.entityType = entityClass.name || 'Entity';
        this.debug = options.debug || false;
        
        // Create factory function
        const factory = () => new entityClass();
        
        // Create reset function
        const reset = (entity) => {
            // Reset common entity properties
            entity.x = 0;
            entity.y = 0;
            entity.width = 0;
            entity.height = 0;
            entity.rotation = 0;
            entity.scale = 1;
            entity.alpha = 1;
            entity.visible = true;
            entity.active = false;
            
            // Reset velocity if it exists
            if (entity.velocity) {
                entity.velocity.x = 0;
                entity.velocity.y = 0;
            }
            
            // Reset acceleration if it exists
            if (entity.acceleration) {
                entity.acceleration.x = 0;
                entity.acceleration.y = 0;
            }
            
            // Reset any references
            entity.parent = null;
            entity.target = null;
            entity.currentStructure = null;
            
            // Call entity's own reset method if it exists
            if (typeof entity.reset === 'function') {
                entity.reset();
            }
            
            // Clear event listeners if possible
            if (typeof entity.removeAllEventListeners === 'function') {
                entity.removeAllEventListeners();
            }
        };
        
        // Create the object pool
        this.pool = new ObjectPool(factory, reset, options.initialSize || 20);
        
        if (this.debug) {
            console.log(`EntityPool: Created pool for ${this.entityType} with initial size ${options.initialSize || 20}`);
        }
        
        // Track all entities created by this pool
        this.entities = new Set();
        
        // Track entities by type for quick lookup
        this.entitiesByType = new Map();
        this.entitiesByType.set(this.entityType, new Set());
    }
    
    /**
     * Gets an entity from the pool
     * @param {Object} props - Properties to set on the entity
     * @returns {Object} The entity
     */
    create(props = {}) {
        // Get entity from pool
        const entity = this.pool.get();
        
        // Set properties
        Object.assign(entity, props);
        
        // Mark as active
        entity.active = true;
        
        // Add to tracking sets
        this.entities.add(entity);
        
        // Add to type map
        const typeSet = this.entitiesByType.get(this.entityType);
        if (typeSet) {
            typeSet.add(entity);
        }
        
        if (this.debug && this.entities.size % 100 === 0) {
            console.log(`EntityPool: ${this.entityType} count: ${this.entities.size}, active: ${this.getActiveCount()}`);
        }
        
        return entity;
    }
    
    /**
     * Releases an entity back to the pool
     * @param {Object} entity - The entity to release
     */
    release(entity) {
        if (!entity || !this.entities.has(entity)) return;
        
        // Mark as inactive
        entity.active = false;
        
        // Remove from tracking sets
        this.entities.delete(entity);
        
        // Remove from type map
        const typeSet = this.entitiesByType.get(this.entityType);
        if (typeSet) {
            typeSet.delete(entity);
        }
        
        // Release to pool
        this.pool.release(entity);
        
        if (this.debug && this.entities.size % 100 === 0) {
            console.log(`EntityPool: ${this.entityType} count: ${this.entities.size}, pool size: ${this.pool.size}`);
        }
    }
    
    /**
     * Releases all entities back to the pool
     */
    releaseAll() {
        // Create a copy of the entities set to avoid modification during iteration
        const entitiesToRelease = [...this.entities];
        
        // Release each entity
        entitiesToRelease.forEach(entity => {
            this.release(entity);
        });
        
        if (this.debug) {
            console.log(`EntityPool: Released all ${this.entityType} entities, pool size: ${this.pool.size}`);
        }
    }
    
    /**
     * Gets the total number of entities created by this pool
     * @returns {number} Entity count
     */
    getCount() {
        return this.entities.size;
    }
    
    /**
     * Gets the number of active entities
     * @returns {number} Active entity count
     */
    getActiveCount() {
        return this.entities.size;
    }
    
    /**
     * Gets the number of entities in the pool
     * @returns {number} Pool size
     */
    getPoolSize() {
        return this.pool.size;
    }
    
    /**
     * Gets pool statistics
     * @returns {Object} Pool statistics
     */
    getStats() {
        const poolStats = this.pool.getStats();
        
        return {
            ...poolStats,
            entityType: this.entityType,
            activeEntities: this.getActiveCount(),
            totalEntities: poolStats.created
        };
    }
    
    /**
     * Updates all active entities
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        this.entities.forEach(entity => {
            if (entity.active && typeof entity.update === 'function') {
                entity.update(deltaTime);
            }
        });
    }
}
