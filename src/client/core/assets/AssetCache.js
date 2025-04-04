/**
 * AssetCache - Manages caching of assets for improved performance
 */
export class AssetCache {
    /**
     * Creates a new asset cache
     * @param {Object} options - Cache options
     */
    constructor(options = {}) {
        this.options = {
            maxSize: 100, // Maximum number of items in cache
            ttl: 300000,  // Time to live in milliseconds (5 minutes)
            ...options
        };
        
        this.cache = new Map();
        this.accessTimes = new Map();
        this.size = 0;
        
        // Set up cache cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Clean up every minute
    }
    
    /**
     * Gets an item from the cache
     * @param {string} key - Cache key
     * @returns {*} Cached item or undefined if not found
     */
    get(key) {
        if (!this.cache.has(key)) {
            return undefined;
        }
        
        // Update access time
        this.accessTimes.set(key, Date.now());
        
        return this.cache.get(key);
    }
    
    /**
     * Sets an item in the cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} [ttl] - Time to live in milliseconds (overrides default)
     * @returns {boolean} True if item was cached successfully
     */
    set(key, value, ttl = null) {
        // Check if cache is full
        if (this.size >= this.options.maxSize && !this.cache.has(key)) {
            this.evict();
        }
        
        // Set item in cache
        this.cache.set(key, value);
        
        // Set access time
        const now = Date.now();
        this.accessTimes.set(key, now);
        
        // Set expiration time
        if (ttl !== null) {
            this.accessTimes.set(`${key}_expires`, now + ttl);
        } else if (this.options.ttl > 0) {
            this.accessTimes.set(`${key}_expires`, now + this.options.ttl);
        }
        
        // Update size
        if (!this.cache.has(key)) {
            this.size++;
        }
        
        return true;
    }
    
    /**
     * Removes an item from the cache
     * @param {string} key - Cache key
     * @returns {boolean} True if item was removed
     */
    remove(key) {
        if (!this.cache.has(key)) {
            return false;
        }
        
        this.cache.delete(key);
        this.accessTimes.delete(key);
        this.accessTimes.delete(`${key}_expires`);
        this.size--;
        
        return true;
    }
    
    /**
     * Checks if an item is in the cache
     * @param {string} key - Cache key
     * @returns {boolean} True if item is in cache
     */
    has(key) {
        if (!this.cache.has(key)) {
            return false;
        }
        
        // Check if item has expired
        const expires = this.accessTimes.get(`${key}_expires`);
        if (expires && Date.now() > expires) {
            this.remove(key);
            return false;
        }
        
        return true;
    }
    
    /**
     * Clears the cache
     */
    clear() {
        this.cache.clear();
        this.accessTimes.clear();
        this.size = 0;
    }
    
    /**
     * Evicts the least recently used item from the cache
     * @returns {boolean} True if an item was evicted
     */
    evict() {
        if (this.size === 0) {
            return false;
        }
        
        // Find least recently used item
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, time] of this.accessTimes) {
            // Skip expiration entries
            if (key.endsWith('_expires')) {
                continue;
            }
            
            if (time < oldestTime) {
                oldestKey = key;
                oldestTime = time;
            }
        }
        
        if (oldestKey) {
            return this.remove(oldestKey);
        }
        
        return false;
    }
    
    /**
     * Cleans up expired items
     * @returns {number} Number of items removed
     */
    cleanup() {
        const now = Date.now();
        let removed = 0;
        
        // Find all expired items
        const expiredKeys = [];
        
        for (const [key, time] of this.accessTimes) {
            // Only check expiration entries
            if (!key.endsWith('_expires')) {
                continue;
            }
            
            if (now > time) {
                // Extract the original key
                const originalKey = key.substring(0, key.length - 8);
                expiredKeys.push(originalKey);
            }
        }
        
        // Remove expired items
        for (const key of expiredKeys) {
            if (this.remove(key)) {
                removed++;
            }
        }
        
        return removed;
    }
    
    /**
     * Gets cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        return {
            size: this.size,
            maxSize: this.options.maxSize,
            ttl: this.options.ttl,
            usage: this.size / this.options.maxSize
        };
    }
    
    /**
     * Disposes of the cache
     */
    dispose() {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}
