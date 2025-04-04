/**
 * RenderBatch - Batches similar draw calls for efficient rendering
 */
export class RenderBatch {
    /**
     * Creates a new render batch
     * @param {Object} options - Batch options
     */
    constructor(options = {}) {
        this.options = {
            maxBatchSize: 100,
            ...options
        };
        
        // Batch data
        this.batches = new Map();
        
        // Stats
        this.stats = {
            batchCount: 0,
            drawCalls: 0,
            itemsDrawn: 0,
            batchedDraws: 0
        };
    }
    
    /**
     * Clears all batches
     */
    clear() {
        this.batches.clear();
        this.stats.batchCount = 0;
    }
    
    /**
     * Adds an item to a batch
     * @param {string} key - Batch key (e.g. texture ID)
     * @param {Object} item - Item to draw
     */
    add(key, item) {
        if (!key) return;
        
        // Get or create batch
        if (!this.batches.has(key)) {
            this.batches.set(key, []);
            this.stats.batchCount++;
        }
        
        // Add item to batch
        const batch = this.batches.get(key);
        batch.push(item);
    }
    
    /**
     * Draws all batches
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Function} drawFunc - Function to draw an item
     */
    draw(ctx, drawFunc) {
        if (!ctx || !drawFunc) return;
        
        try {
            this.stats.drawCalls = 0;
            this.stats.itemsDrawn = 0;
            this.stats.batchedDraws = 0;
            
            // Draw each batch
            for (const [key, items] of this.batches.entries()) {
                if (items.length === 0) continue;
                
                // Draw batch
                ctx.save();
                
                // Draw items
                for (const item of items) {
                    drawFunc(ctx, key, item);
                    this.stats.itemsDrawn++;
                }
                
                ctx.restore();
                
                // Count draw calls
                this.stats.drawCalls++;
                this.stats.batchedDraws += items.length - 1;
            }
        } catch (e) {
            console.error('Error drawing batches:', e);
        }
    }
    
    /**
     * Gets batch statistics
     * @returns {Object} Batch statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
