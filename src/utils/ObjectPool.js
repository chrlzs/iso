/**
 * ObjectPool - Manages reusable objects to reduce garbage collection
 * Optimized for high-performance game applications
 */
export class ObjectPool {
    /**
     * Creates a new object pool
     * @param {Function} factory - Factory function to create new objects
     * @param {Function} reset - Function to reset objects for reuse
     * @param {Object} options - Pool configuration options
     * @param {number} options.initialSize - Initial pool size (default: 20)
     * @param {number} options.maxSize - Maximum pool size (default: 1000)
     * @param {boolean} options.autoExpand - Whether to automatically expand the pool when empty (default: true)
     * @param {boolean} options.debug - Whether to log debug information (default: false)
     */
    constructor(factory, reset, options = {}) {
        this.factory = factory;
        this.reset = reset;
        
        // Pool configuration
        this.initialSize = options.initialSize || 20;
        this.maxSize = options.maxSize || 1000;
        this.autoExpand = options.autoExpand !== false;
        this.debug = options.debug || false;
        
        // Object storage
        this.pool = [];
        this.active = new Set();
        
        // Stats
        this.stats = {
            created: 0,
            reused: 0,
            released: 0,
            active: 0,
            expanded: 0,
            pruned: 0,
            lastAccessTime: Date.now()
        };
        
        // Pre-allocate objects
        this.initialize();
    }
    
    /**
     * Initialize the pool with the initial size
     * @private
     */
    initialize() {
        for (let i = 0; i < this.initialSize; i++) {
            const obj = this.createObject();
            
            // Add metadata
            obj._pooled = true;
            obj._active = false;
            obj._poolTimestamp = Date.now();
            
            this.pool.push(obj);
        }
        
        if (this.debug) {
            console.log(`ObjectPool: Initialized with ${this.initialSize} objects`);
        }
    }
    
    /**
     * Create a new object using the factory function
     * @private
     * @returns {Object} - The newly created object
     */
    createObject() {
        const obj = this.factory();
        this.stats.created++;
        return obj;
    }
    
    /**
     * Gets an object from the pool or creates a new one
     * @param {...any} args - Arguments to pass to the reset function
     * @returns {Object} The object
     */
    get(...args) {
        let object;
        
        if (this.pool.length > 0) {
            // Get from pool
            object = this.pool.pop();
            this.stats.reused++;
            
            if (this.debug && this.stats.reused % 100 === 0) {
                console.log(`ObjectPool: Reused ${this.stats.reused} objects, pool size: ${this.pool.length}`);
            }
        } else if (this.autoExpand) {
            // Create new object if pool is empty
            object = this.createObject();
            this.stats.expanded++;
            
            if (this.debug) {
                console.log(`ObjectPool: Created new object, total created: ${this.stats.created}, expanded: ${this.stats.expanded}`);
            }
        } else {
            throw new Error('ObjectPool: Pool is empty and autoExpand is disabled');
        }
        
        // Reset the object with the provided arguments
        this.reset(object, ...args);
        
        // Mark as active
        object._active = true;
        object._poolTimestamp = Date.now();
        
        // Track active objects
        this.active.add(object);
        this.stats.active = this.active.size;
        this.stats.lastAccessTime = Date.now();
        
        return object;
    }
    
    /**
     * Releases an object back to the pool
     * @param {Object} object - The object to release
     */
    release(object) {
        if (!object || this.pool.includes(object) || !this.active.has(object)) {
            if (this.debug) {
                console.warn('ObjectPool: Attempted to release an invalid object');
            }
            return;
        }
        
        // Remove from active set
        this.active.delete(object);
        this.stats.active = this.active.size;
        
        // Mark as inactive
        object._active = false;
        object._poolTimestamp = Date.now();
        
        // Add to pool if not full
        if (this.pool.length < this.maxSize) {
            this.pool.push(object);
        } else if (this.debug) {
            console.warn('ObjectPool: Pool is full, discarding object');
        }
        
        this.stats.released++;
        this.stats.lastAccessTime = Date.now();
        
        if (this.debug && this.stats.released % 100 === 0) {
            console.log(`ObjectPool: Released ${this.stats.released} objects, pool size: ${this.pool.length}`);
        }
    }
    
    /**
     * Releases all active objects back to the pool
     */
    releaseAll() {
        // Create a copy to avoid modification during iteration
        const activeObjects = [...this.active];
        
        // Release each object
        activeObjects.forEach(object => {
            this.release(object);
        });
        
        if (this.debug) {
            console.log(`ObjectPool: Released all ${activeObjects.length} objects, pool size: ${this.pool.length}`);
        }
    }
    
    /**
     * Prunes the pool to a maximum size
     * @param {number} maxSize - Maximum pool size (defaults to initialSize)
     */
    trim(maxSize = this.initialSize) {
        if (this.pool.length <= maxSize) return;
        
        // Calculate how many to remove
        const removeCount = this.pool.length - maxSize;
        
        // Remove excess objects
        this.pool.splice(0, removeCount);
        this.stats.pruned += removeCount;
        
        if (this.debug) {
            console.log(`ObjectPool: Trimmed pool by ${removeCount} objects to ${this.pool.length}`);
        }
    }
    
    /**
     * Gets the number of objects in the pool
     * @returns {number} Pool size
     */
    get size() {
        return this.pool.length;
    }
    
    /**
     * Gets the number of active objects
     * @returns {number} Active count
     */
    get activeCount() {
        return this.active.size;
    }
    
    /**
     * Gets pool statistics
     * @returns {Object} Pool statistics
     */
    getStats() {
        return { 
            ...this.stats,
            poolSize: this.pool.length,
            utilization: this.stats.reused / (this.stats.created + this.stats.reused),
            efficiency: this.stats.reused / Math.max(1, this.stats.released),
            idleTime: Date.now() - this.stats.lastAccessTime
        };
    }
    
    /**
     * Clear the pool and reset statistics
     */
    clear() {
        this.pool = [];
        this.active.clear();
        
        // Reset stats
        this.stats = {
            created: 0,
            reused: 0,
            released: 0,
            active: 0,
            expanded: 0,
            pruned: 0,
            lastAccessTime: Date.now()
        };
        
        // Reinitialize
        this.initialize();
        
        if (this.debug) {
            console.log('ObjectPool: Pool cleared and reinitialized');
        }
    }
}
