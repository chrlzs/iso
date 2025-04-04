import { ObjectPool } from './ObjectPool.js';

/**
 * Rect - Simple rectangle class
 */
export class Rect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    set(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }
    
    copy(rect) {
        this.x = rect.x;
        this.y = rect.y;
        this.width = rect.width;
        this.height = rect.height;
        return this;
    }
    
    contains(x, y) {
        return (
            x >= this.x &&
            x < this.x + this.width &&
            y >= this.y &&
            y < this.y + this.height
        );
    }
    
    intersects(rect) {
        return !(
            rect.x > this.x + this.width ||
            rect.x + rect.width < this.x ||
            rect.y > this.y + this.height ||
            rect.y + rect.height < this.y
        );
    }
    
    get left() {
        return this.x;
    }
    
    get right() {
        return this.x + this.width;
    }
    
    get top() {
        return this.y;
    }
    
    get bottom() {
        return this.y + this.height;
    }
    
    get centerX() {
        return this.x + this.width / 2;
    }
    
    get centerY() {
        return this.y + this.height / 2;
    }
    
    clone() {
        return new Rect(this.x, this.y, this.width, this.height);
    }
}

/**
 * RectPool - Pool of reusable Rect objects
 */
export class RectPool {
    constructor(initialSize = 50) {
        // Create the object pool
        this.pool = new ObjectPool(
            // Factory function
            () => new Rect(),
            // Reset function
            (rect, x = 0, y = 0, width = 0, height = 0) => rect.set(x, y, width, height),
            // Initial size
            initialSize
        );
    }
    
    /**
     * Gets a Rect from the pool
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {Rect} Rect object
     */
    get(x = 0, y = 0, width = 0, height = 0) {
        return this.pool.get(x, y, width, height);
    }
    
    /**
     * Releases a Rect back to the pool
     * @param {Rect} rect - Rect to release
     */
    release(rect) {
        this.pool.release(rect);
    }
    
    /**
     * Releases all active rects
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
