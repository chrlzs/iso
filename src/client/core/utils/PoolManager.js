import { EntityPool } from './EntityPool.js';

/**
 * PoolManager - Central manager for all object pools in the game
 * Helps track and manage memory usage across different entity types
 */
export class PoolManager {
    /**
     * Creates a new pool manager
     * @param {Object} options - Pool manager configuration
     * @param {boolean} options.debug - Whether to log debug information
     */
    constructor(options = {}) {
        this.pools = new Map();
        this.debug = options.debug || false;
        
        // Performance monitoring
        this.lastGCTime = performance.now();
        this.gcCount = 0;
        this.memoryUsage = [];
        
        // Track memory usage over time
        if (this.debug) {
            this.memoryInterval = setInterval(() => {
                this.trackMemoryUsage();
            }, 5000);
        }
    }
    
    /**
     * Creates a new entity pool or returns an existing one
     * @param {Function} entityClass - The entity class constructor
     * @param {Object} options - Pool configuration options
     * @returns {EntityPool} The entity pool
     */
    createPool(entityClass, options = {}) {
        const entityType = entityClass.name || 'Entity';
        
        // Return existing pool if it exists
        if (this.pools.has(entityType)) {
            return this.pools.get(entityType);
        }
        
        // Create new pool
        const pool = new EntityPool(entityClass, {
            ...options,
            debug: this.debug
        });
        
        // Store pool
        this.pools.set(entityType, pool);
        
        if (this.debug) {
            console.log(`PoolManager: Created pool for ${entityType}`);
        }
        
        return pool;
    }
    
    /**
     * Gets an entity pool by entity type
     * @param {string} entityType - The entity type
     * @returns {EntityPool|null} The entity pool or null if not found
     */
    getPool(entityType) {
        return this.pools.get(entityType) || null;
    }
    
    /**
     * Creates an entity from a pool
     * @param {Function} entityClass - The entity class constructor
     * @param {Object} props - Properties to set on the entity
     * @returns {Object} The entity
     */
    createEntity(entityClass, props = {}) {
        const pool = this.createPool(entityClass);
        return pool.create(props);
    }
    
    /**
     * Releases an entity back to its pool
     * @param {Object} entity - The entity to release
     */
    releaseEntity(entity) {
        if (!entity || !entity.constructor) return;
        
        const entityType = entity.constructor.name;
        const pool = this.pools.get(entityType);
        
        if (pool) {
            pool.release(entity);
        } else if (this.debug) {
            console.warn(`PoolManager: No pool found for entity type ${entityType}`);
        }
    }
    
    /**
     * Updates all active entities in all pools
     * @param {number} deltaTime - Time since last update
     */
    updateAll(deltaTime) {
        this.pools.forEach(pool => {
            pool.update(deltaTime);
        });
    }
    
    /**
     * Releases all entities in all pools
     */
    releaseAll() {
        this.pools.forEach(pool => {
            pool.releaseAll();
        });
        
        if (this.debug) {
            console.log('PoolManager: Released all entities from all pools');
        }
    }
    
    /**
     * Gets statistics for all pools
     * @returns {Object} Pool statistics
     */
    getStats() {
        const stats = {
            poolCount: this.pools.size,
            totalEntities: 0,
            activeEntities: 0,
            pooledEntities: 0,
            pools: {}
        };
        
        this.pools.forEach((pool, entityType) => {
            const poolStats = pool.getStats();
            
            stats.totalEntities += poolStats.created;
            stats.activeEntities += poolStats.active;
            stats.pooledEntities += pool.getPoolSize();
            
            stats.pools[entityType] = poolStats;
        });
        
        return stats;
    }
    
    /**
     * Tracks memory usage over time
     * @private
     */
    trackMemoryUsage() {
        if (!window.performance || !window.performance.memory) {
            return;
        }
        
        const memory = window.performance.memory;
        const now = performance.now();
        
        // Check if garbage collection likely occurred
        const currentUsed = memory.usedJSHeapSize;
        const lastUsed = this.memoryUsage.length > 0 
            ? this.memoryUsage[this.memoryUsage.length - 1].used 
            : currentUsed;
            
        // If memory decreased significantly, likely GC occurred
        if (lastUsed - currentUsed > 5 * 1024 * 1024) { // 5MB threshold
            this.gcCount++;
            this.lastGCTime = now;
            
            if (this.debug) {
                console.log(`PoolManager: Garbage collection detected, memory decreased by ${((lastUsed - currentUsed) / (1024 * 1024)).toFixed(2)}MB`);
            }
        }
        
        // Record memory usage
        this.memoryUsage.push({
            timestamp: now,
            used: currentUsed,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
        });
        
        // Keep only last 60 samples (5 minutes at 5s interval)
        if (this.memoryUsage.length > 60) {
            this.memoryUsage.shift();
        }
        
        // Log memory stats periodically
        if (this.debug && this.memoryUsage.length % 12 === 0) { // Every minute
            const stats = this.getStats();
            console.log('PoolManager: Memory usage', {
                used: `${(currentUsed / (1024 * 1024)).toFixed(2)}MB`,
                total: `${(memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)}MB`,
                limit: `${(memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)}MB`,
                gcCount: this.gcCount,
                timeSinceLastGC: `${((now - this.lastGCTime) / 1000).toFixed(1)}s`,
                activeEntities: stats.activeEntities,
                pooledEntities: stats.pooledEntities
            });
        }
    }
    
    /**
     * Gets memory usage data
     * @returns {Array} Memory usage data
     */
    getMemoryUsage() {
        return [...this.memoryUsage];
    }
    
    /**
     * Cleans up the pool manager
     */
    dispose() {
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
            this.memoryInterval = null;
        }
        
        this.releaseAll();
        this.pools.clear();
        this.memoryUsage = [];
    }
}
