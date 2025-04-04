/**
 * ObjectPool - Manages reusable objects to reduce garbage collection
 */
export class ObjectPool {
    /**
     * Creates a new object pool
     * @param {Function} factory - Factory function to create new objects
     * @param {Function} reset - Function to reset objects for reuse
     * @param {number} initialSize - Initial pool size
     */
    constructor(factory, reset, initialSize = 0) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        this.active = new Set();
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
        
        // Stats
        this.stats = {
            created: initialSize,
            reused: 0,
            released: 0,
            active: 0
        };
    }
    
    /**
     * Gets an object from the pool or creates a new one
     * @param {...any} args - Arguments to pass to the reset function
     * @returns {Object} The object
     */
    get(...args) {
        let object;
        
        if (this.pool.length > 0) {
            object = this.pool.pop();
            this.stats.reused++;
        } else {
            object = this.factory();
            this.stats.created++;
        }
        
        // Reset the object with the provided arguments
        this.reset(object, ...args);
        
        // Track active objects
        this.active.add(object);
        this.stats.active = this.active.size;
        
        return object;
    }
    
    /**
     * Releases an object back to the pool
     * @param {Object} object - The object to release
     */
    release(object) {
        if (!object || this.pool.includes(object)) return;
        
        // Remove from active set
        this.active.delete(object);
        this.stats.active = this.active.size;
        
        // Add back to pool
        this.pool.push(object);
        this.stats.released++;
    }
    
    /**
     * Releases all active objects back to the pool
     */
    releaseAll() {
        this.active.forEach(object => {
            this.pool.push(object);
            this.stats.released++;
        });
        
        this.active.clear();
        this.stats.active = 0;
    }
    
    /**
     * Prunes the pool to a maximum size
     * @param {number} maxSize - Maximum pool size
     */
    prune(maxSize) {
        if (this.pool.length > maxSize) {
            this.pool.length = maxSize;
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
        return { ...this.stats };
    }
}
