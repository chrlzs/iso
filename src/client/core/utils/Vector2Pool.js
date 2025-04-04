import { ObjectPool } from './ObjectPool.js';

/**
 * Vector2 - Simple 2D vector class
 */
export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.divide(len);
        }
        return this;
    }
    
    distance(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    equals(v) {
        return this.x === v.x && this.y === v.y;
    }
    
    clone() {
        return new Vector2(this.x, this.y);
    }
}

/**
 * Vector2Pool - Pool of reusable Vector2 objects
 */
export class Vector2Pool {
    constructor(initialSize = 100) {
        // Create the object pool
        this.pool = new ObjectPool(
            // Factory function
            () => new Vector2(),
            // Reset function
            (vector, x = 0, y = 0) => vector.set(x, y),
            // Initial size
            initialSize
        );
    }
    
    /**
     * Gets a Vector2 from the pool
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Vector2} Vector2 object
     */
    get(x = 0, y = 0) {
        return this.pool.get(x, y);
    }
    
    /**
     * Releases a Vector2 back to the pool
     * @param {Vector2} vector - Vector to release
     */
    release(vector) {
        this.pool.release(vector);
    }
    
    /**
     * Releases all active vectors
     */
    releaseAll() {
        this.pool.releaseAll();
    }
    
    /**
     * Gets pool statistics
     * @returns {Object} Pool statistics
     */
    getStats() {
        return this.pool.getStats();
    }
}
