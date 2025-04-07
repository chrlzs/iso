import { ObjectPool } from './ObjectPool.js';

/**
 * EntityPool - Specialized object pool for game entities
 * Optimized for PixiJS-based entities
 */
export class EntityPool {
    /**
     * Creates a new entity pool
     * @param {Function} entityClass - The entity class constructor
     * @param {Object} options - Pool configuration options
     * @param {number} options.initialSize - Initial pool size (default: 20)
     * @param {number} options.maxSize - Maximum pool size (default: 1000)
     * @param {boolean} options.autoExpand - Whether to automatically expand the pool when empty (default: true)
     * @param {boolean} options.debug - Whether to log debug information (default: false)
     * @param {PIXI.Container} options.container - Optional container to add entities to
     */
    constructor(entityClass, options = {}) {
        this.entityClass = entityClass;
        this.entityType = entityClass.name || 'Entity';
        this.debug = options.debug || false;
        this.container = options.container || null;
        
        // Create factory function
        const factory = () => {
            const entity = new entityClass();
            
            // Add to container if provided
            if (this.container && entity instanceof PIXI.DisplayObject) {
                this.container.addChild(entity);
                entity.visible = false; // Hide until activated
            }
            
            return entity;
        };
        
        // Create reset function
        const reset = (entity, props = {}) => {
            // Reset common entity properties
            entity.x = props.x || 0;
            entity.y = props.y || 0;
            entity.width = props.width || 0;
            entity.height = props.height || 0;
            entity.rotation = props.rotation || 0;
            entity.scale.x = props.scaleX || props.scale || 1;
            entity.scale.y = props.scaleY || props.scale || 1;
            entity.alpha = props.alpha !== undefined ? props.alpha : 1;
            entity.visible = props.visible !== undefined ? props.visible : true;
            entity.active = props.active !== undefined ? props.active : true;
            
            // Reset velocity if it exists
            if (entity.velocity) {
                entity.velocity.x = props.velocityX || 0;
                entity.velocity.y = props.velocityY || 0;
            }
            
            // Reset any references
            entity.parent = props.parent || null;
            entity.target = props.target || null;
            
            // Call entity's own reset method if it exists
            if (typeof entity.reset === 'function') {
                entity.reset(props);
            }
            
            // Apply any other properties
            if (props) {
                // Filter out properties we've already handled
                const handledProps = ['x', 'y', 'width', 'height', 'rotation', 'scale', 'scaleX', 'scaleY', 
                                     'alpha', 'visible', 'active', 'velocityX', 'velocityY', 'parent', 'target'];
                
                Object.entries(props).forEach(([key, value]) => {
                    if (!handledProps.includes(key)) {
                        entity[key] = value;
                    }
                });
            }
        };
        
        // Create the object pool
        this.pool = new ObjectPool(factory, reset, {
            initialSize: options.initialSize || 20,
            maxSize: options.maxSize || 1000,
            autoExpand: options.autoExpand !== false,
            debug: this.debug
        });
        
        if (this.debug) {
            console.log(`EntityPool: Created pool for ${this.entityType} with initial size ${options.initialSize || 20}`);
        }
        
        // Track all entities created by this pool
        this.entities = new Set();
        
        // Track entities by type for quick lookup
        this.entitiesByType = new Map();
        this.entitiesByType.set(this.entityType, new Set());
        
        // Track entities by tag
        this.entitiesByTag = new Map();
    }
    
    /**
     * Gets an entity from the pool
     * @param {Object} props - Properties to set on the entity
     * @returns {Object} The entity
     */
    create(props = {}) {
        // Get entity from pool
        const entity = this.pool.get(props);
        
        // Mark as active
        entity.active = true;
        
        // Make visible if it's a display object
        if (entity instanceof PIXI.DisplayObject) {
            entity.visible = props.visible !== undefined ? props.visible : true;
        }
        
        // Add to tracking sets
        this.entities.add(entity);
        
        // Add to type map
        const typeSet = this.entitiesByType.get(this.entityType);
        if (typeSet) {
            typeSet.add(entity);
        }
        
        // Add to tag maps if tags are provided
        if (props.tags && Array.isArray(props.tags)) {
            props.tags.forEach(tag => {
                if (!this.entitiesByTag.has(tag)) {
                    this.entitiesByTag.set(tag, new Set());
                }
                this.entitiesByTag.get(tag).add(entity);
            });
            
            // Store tags on entity for easy access
            entity.tags = [...props.tags];
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
        
        // Hide if it's a display object
        if (entity instanceof PIXI.DisplayObject) {
            entity.visible = false;
        }
        
        // Remove from tracking sets
        this.entities.delete(entity);
        
        // Remove from type map
        const typeSet = this.entitiesByType.get(this.entityType);
        if (typeSet) {
            typeSet.delete(entity);
        }
        
        // Remove from tag maps
        if (entity.tags && Array.isArray(entity.tags)) {
            entity.tags.forEach(tag => {
                const tagSet = this.entitiesByTag.get(tag);
                if (tagSet) {
                    tagSet.delete(entity);
                }
            });
            
            // Clear tags
            entity.tags = [];
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
     * Gets entities by tag
     * @param {string} tag - The tag to filter by
     * @returns {Set} - Set of entities with the tag
     */
    getByTag(tag) {
        return this.entitiesByTag.get(tag) || new Set();
    }
    
    /**
     * Gets entities by multiple tags (AND logic)
     * @param {Array} tags - Array of tags to filter by
     * @returns {Array} - Array of entities with all the tags
     */
    getByTags(tags) {
        if (!tags || tags.length === 0) return [];
        
        // Start with all entities that have the first tag
        const firstTagEntities = this.getByTag(tags[0]);
        
        // Filter by remaining tags
        return [...firstTagEntities].filter(entity => {
            return tags.every(tag => entity.tags && entity.tags.includes(tag));
        });
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
     * Trims the pool to a specific size
     * @param {number} maxSize - The target size for the pool
     */
    trim(maxSize) {
        this.pool.trim(maxSize);
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
            totalEntities: poolStats.created,
            tagCount: this.entitiesByTag.size,
            tagStats: Object.fromEntries(
                Array.from(this.entitiesByTag.entries())
                    .map(([tag, entities]) => [tag, entities.size])
            )
        };
    }
    
    /**
     * Updates all active entities
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        this.entities.forEach(entity => {
            if (entity.active && typeof entity.update === 'function') {
                entity.update(deltaTime);
            }
        });
    }
    
    /**
     * Clears the pool and releases all entities
     */
    clear() {
        this.releaseAll();
        this.pool.clear();
        this.entities.clear();
        this.entitiesByType.forEach(set => set.clear());
        this.entitiesByTag.forEach(set => set.clear());
    }
    
    /**
     * Disposes of the pool and all entities
     * Removes entities from container if applicable
     */
    dispose() {
        // Remove all entities from container if applicable
        if (this.container) {
            this.entities.forEach(entity => {
                if (entity instanceof PIXI.DisplayObject && entity.parent) {
                    entity.parent.removeChild(entity);
                }
                
                // Call dispose method if it exists
                if (typeof entity.dispose === 'function') {
                    entity.dispose();
                }
            });
        }
        
        this.clear();
        this.container = null;
    }
}
