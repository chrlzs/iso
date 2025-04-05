/**
 * BatchRenderer for efficient rendering of multiple similar objects
 * using instanced rendering techniques.
 */
export class BatchRenderer {
    /**
     * Create a new batch renderer
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {Object} options - Configuration options
     */
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.batchSize = options.batchSize || 1000;
        this.autoDraw = options.autoDraw !== false;
        
        // Initialize batches
        this.batches = new Map();
        this.currentBatch = null;
        
        // Performance tracking
        this.drawCalls = 0;
        this.instancesDrawn = 0;
        this.lastResetTime = performance.now();
    }
    
    /**
     * Begin a new batch
     * @param {string} textureId - The texture ID for this batch
     * @param {HTMLImageElement|HTMLCanvasElement} texture - The texture to use
     * @returns {Object} - The batch object
     */
    begin(textureId, texture) {
        // Create a new batch if it doesn't exist
        if (!this.batches.has(textureId)) {
            this.batches.set(textureId, {
                textureId,
                texture,
                instances: [],
                dirty: true
            });
        }
        
        // Set the current batch
        this.currentBatch = this.batches.get(textureId);
        return this.currentBatch;
    }
    
    /**
     * Add an instance to the current batch
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Additional options (rotation, alpha, etc.)
     */
    add(x, y, width, height, options = {}) {
        if (!this.currentBatch) {
            console.warn('BatchRenderer: No active batch');
            return;
        }
        
        // Add the instance
        this.currentBatch.instances.push({
            x, y, width, height,
            rotation: options.rotation || 0,
            alpha: options.alpha !== undefined ? options.alpha : 1,
            scaleX: options.scaleX || 1,
            scaleY: options.scaleY || 1,
            sourceX: options.sourceX || 0,
            sourceY: options.sourceY || 0,
            sourceWidth: options.sourceWidth || width,
            sourceHeight: options.sourceHeight || height,
            tint: options.tint || null,
            region: options.region || null
        });
        
        this.currentBatch.dirty = true;
        
        // Auto-draw if the batch is full
        if (this.autoDraw && this.currentBatch.instances.length >= this.batchSize) {
            this.draw(this.currentBatch.textureId);
        }
    }
    
    /**
     * Add an instance using a texture atlas region
     * @param {Object} region - The texture atlas region
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Additional options
     */
    addFromAtlas(region, x, y, width, height, options = {}) {
        if (!region) {
            console.warn('BatchRenderer: Invalid region');
            return;
        }
        
        // Add the instance with texture region information
        this.add(x, y, width, height, {
            ...options,
            sourceX: region.x,
            sourceY: region.y,
            sourceWidth: region.width,
            sourceHeight: region.height,
            region
        });
    }
    
    /**
     * Draw a specific batch
     * @param {string} textureId - The texture ID to draw
     */
    draw(textureId) {
        const batch = this.batches.get(textureId);
        if (!batch || batch.instances.length === 0) {
            return;
        }
        
        // Save context state
        this.ctx.save();
        
        // Draw all instances in the batch
        const texture = batch.texture;
        const instances = batch.instances;
        
        for (let i = 0; i < instances.length; i++) {
            const instance = instances[i];
            
            // Set instance properties
            if (instance.alpha !== 1) {
                this.ctx.globalAlpha = instance.alpha;
            }
            
            // Apply transformations
            if (instance.rotation !== 0 || instance.scaleX !== 1 || instance.scaleY !== 1) {
                this.ctx.translate(instance.x + instance.width / 2, instance.y + instance.height / 2);
                
                if (instance.rotation !== 0) {
                    this.ctx.rotate(instance.rotation);
                }
                
                if (instance.scaleX !== 1 || instance.scaleY !== 1) {
                    this.ctx.scale(instance.scaleX, instance.scaleY);
                }
                
                // Draw the instance
                if (instance.region) {
                    // Draw from texture atlas
                    this.ctx.drawImage(
                        texture,
                        instance.sourceX, instance.sourceY,
                        instance.sourceWidth, instance.sourceHeight,
                        -instance.width / 2, -instance.height / 2,
                        instance.width, instance.height
                    );
                } else {
                    // Draw entire texture
                    this.ctx.drawImage(
                        texture,
                        -instance.width / 2, -instance.height / 2,
                        instance.width, instance.height
                    );
                }
                
                // Reset transformations
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
                // No transformations needed
                if (instance.region) {
                    // Draw from texture atlas
                    this.ctx.drawImage(
                        texture,
                        instance.sourceX, instance.sourceY,
                        instance.sourceWidth, instance.sourceHeight,
                        instance.x, instance.y,
                        instance.width, instance.height
                    );
                } else {
                    // Draw entire texture
                    this.ctx.drawImage(
                        texture,
                        instance.x, instance.y,
                        instance.width, instance.height
                    );
                }
            }
            
            // Reset alpha
            if (instance.alpha !== 1) {
                this.ctx.globalAlpha = 1;
            }
        }
        
        // Restore context state
        this.ctx.restore();
        
        // Update stats
        this.drawCalls++;
        this.instancesDrawn += instances.length;
        
        // Clear the batch
        batch.instances = [];
        batch.dirty = false;
    }
    
    /**
     * Draw all batches
     */
    drawAll() {
        this.batches.forEach((batch, textureId) => {
            if (batch.dirty && batch.instances.length > 0) {
                this.draw(textureId);
            }
        });
    }
    
    /**
     * Clear all batches
     */
    clear() {
        this.batches.forEach(batch => {
            batch.instances = [];
            batch.dirty = false;
        });
        this.currentBatch = null;
    }
    
    /**
     * Reset performance counters
     */
    resetCounters() {
        this.drawCalls = 0;
        this.instancesDrawn = 0;
        this.lastResetTime = performance.now();
    }
    
    /**
     * Get performance statistics
     * @returns {Object} - Performance statistics
     */
    getStats() {
        const now = performance.now();
        const elapsed = now - this.lastResetTime;
        
        return {
            drawCalls: this.drawCalls,
            instancesDrawn: this.instancesDrawn,
            batchCount: this.batches.size,
            drawCallsPerSecond: (this.drawCalls / elapsed) * 1000,
            instancesPerSecond: (this.instancesDrawn / elapsed) * 1000,
            averageInstancesPerBatch: this.drawCalls > 0 ? this.instancesDrawn / this.drawCalls : 0,
            elapsedTime: elapsed
        };
    }
}
