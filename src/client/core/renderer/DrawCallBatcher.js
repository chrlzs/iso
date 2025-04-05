/**
 * DrawCallBatcher - Optimizes rendering by batching similar draw calls
 * Reduces state changes and improves performance by minimizing GPU communication
 */
export class DrawCallBatcher {
    /**
     * Creates a new draw call batcher
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {Object} options - Configuration options
     * @param {number} options.maxBatchSize - Maximum batch size (default: 1000)
     * @param {boolean} options.autoDraw - Whether to automatically draw when batch is full (default: true)
     * @param {boolean} options.debug - Whether to log debug information (default: false)
     */
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.maxBatchSize = options.maxBatchSize || 1000;
        this.autoDraw = options.autoDraw !== false;
        this.debug = options.debug || false;
        
        // Batches organized by texture/state
        this.batches = new Map();
        
        // Current active batch
        this.currentBatch = null;
        this.currentBatchId = null;
        
        // Performance tracking
        this.stats = {
            drawCalls: 0,
            batchedDraws: 0,
            savedDrawCalls: 0,
            stateChanges: 0,
            lastResetTime: performance.now()
        };
        
        // Render queue for z-sorting
        this.renderQueue = [];
        this.queueEnabled = false;
        
        // Bind methods that will be used as callbacks
        this._compareDrawCommands = this._compareDrawCommands.bind(this);
    }
    
    /**
     * Starts a new batch with the given state
     * @param {string} batchId - Unique identifier for this batch (usually texture ID)
     * @param {Object} state - Rendering state for this batch
     * @returns {Object} The batch object
     */
    begin(batchId, state = {}) {
        // If we already have a batch for this ID, use it
        if (this.batches.has(batchId)) {
            this.currentBatch = this.batches.get(batchId);
            this.currentBatchId = batchId;
            return this.currentBatch;
        }
        
        // Create a new batch
        const batch = {
            id: batchId,
            state: { ...state },
            commands: [],
            dirty: true
        };
        
        this.batches.set(batchId, batch);
        this.currentBatch = batch;
        this.currentBatchId = batchId;
        
        return batch;
    }
    
    /**
     * Adds a draw command to the current batch
     * @param {Function} drawFn - The draw function to execute
     * @param {Object} params - Parameters for the draw function
     * @param {number} zIndex - Z-index for depth sorting (higher = on top)
     */
    add(drawFn, params = {}, zIndex = 0) {
        if (!this.currentBatch) {
            if (this.debug) {
                console.warn('DrawCallBatcher: No active batch, call begin() first');
            }
            return;
        }
        
        // Create the draw command
        const command = {
            drawFn,
            params,
            zIndex,
            batchId: this.currentBatchId
        };
        
        // Add to queue if enabled, otherwise add to current batch
        if (this.queueEnabled) {
            this.renderQueue.push(command);
        } else {
            this.currentBatch.commands.push(command);
            this.currentBatch.dirty = true;
        }
        
        this.stats.batchedDraws++;
        
        // Auto-draw if the batch is full
        if (this.autoDraw && this.currentBatch.commands.length >= this.maxBatchSize) {
            this.draw(this.currentBatchId);
        }
    }
    
    /**
     * Adds a sprite draw command to the current batch
     * @param {HTMLImageElement|HTMLCanvasElement} texture - The texture to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Additional options
     * @param {number} options.zIndex - Z-index for depth sorting
     * @param {number} options.alpha - Alpha transparency
     * @param {number} options.rotation - Rotation in radians
     * @param {number} options.scaleX - X scale
     * @param {number} options.scaleY - Y scale
     * @param {number} options.sourceX - Source X position in texture
     * @param {number} options.sourceY - Source Y position in texture
     * @param {number} options.sourceWidth - Source width in texture
     * @param {number} options.sourceHeight - Source height in texture
     */
    addSprite(texture, x, y, width, height, options = {}) {
        const zIndex = options.zIndex || 0;
        
        // Create draw function
        const drawFn = (ctx, params) => {
            // Save context if we need to apply transformations
            const needsTransform = params.rotation || params.scaleX !== 1 || params.scaleY !== 1;
            if (needsTransform) ctx.save();
            
            // Apply alpha
            if (params.alpha !== 1) {
                ctx.globalAlpha = params.alpha;
            }
            
            // Apply transformations
            if (needsTransform) {
                ctx.translate(params.x + params.width / 2, params.y + params.height / 2);
                
                if (params.rotation) {
                    ctx.rotate(params.rotation);
                }
                
                if (params.scaleX !== 1 || params.scaleY !== 1) {
                    ctx.scale(params.scaleX, params.scaleY);
                }
                
                // Draw with source rect if specified
                if (params.sourceX !== undefined) {
                    ctx.drawImage(
                        params.texture,
                        params.sourceX, params.sourceY,
                        params.sourceWidth, params.sourceHeight,
                        -params.width / 2, -params.height / 2,
                        params.width, params.height
                    );
                } else {
                    // Draw entire texture
                    ctx.drawImage(
                        params.texture,
                        -params.width / 2, -params.height / 2,
                        params.width, params.height
                    );
                }
                
                // Restore context
                ctx.restore();
            } else {
                // No transformations needed, draw directly
                if (params.sourceX !== undefined) {
                    ctx.drawImage(
                        params.texture,
                        params.sourceX, params.sourceY,
                        params.sourceWidth, params.sourceHeight,
                        params.x, params.y,
                        params.width, params.height
                    );
                } else {
                    // Draw entire texture
                    ctx.drawImage(
                        params.texture,
                        params.x, params.y,
                        params.width, params.height
                    );
                }
            }
            
            // Reset alpha
            if (params.alpha !== 1) {
                ctx.globalAlpha = 1;
            }
        };
        
        // Prepare parameters
        const params = {
            texture,
            x, y, width, height,
            alpha: options.alpha !== undefined ? options.alpha : 1,
            rotation: options.rotation || 0,
            scaleX: options.scaleX || 1,
            scaleY: options.scaleY || 1,
            sourceX: options.sourceX,
            sourceY: options.sourceY,
            sourceWidth: options.sourceWidth || width,
            sourceHeight: options.sourceHeight || height
        };
        
        // Add to batch
        this.add(drawFn, params, zIndex);
    }
    
    /**
     * Adds a tile draw command to the current batch
     * @param {HTMLImageElement|HTMLCanvasElement} texture - The texture to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Additional options
     */
    addTile(texture, x, y, width, height, options = {}) {
        // Calculate z-index based on isometric position
        // This ensures proper depth sorting in isometric view
        const zIndex = options.zIndex !== undefined ? options.zIndex : y;
        
        // Add as sprite with calculated z-index
        this.addSprite(texture, x, y, width, height, {
            ...options,
            zIndex
        });
    }
    
    /**
     * Adds a sprite from a texture atlas
     * @param {HTMLImageElement|HTMLCanvasElement} atlasTexture - The atlas texture
     * @param {Object} region - The region in the atlas
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Additional options
     */
    addSpriteFromAtlas(atlasTexture, region, x, y, width, height, options = {}) {
        this.addSprite(atlasTexture, x, y, width, height, {
            ...options,
            sourceX: region.x,
            sourceY: region.y,
            sourceWidth: region.width,
            sourceHeight: region.height
        });
    }
    
    /**
     * Enables the render queue for z-sorting
     */
    enableQueue() {
        this.queueEnabled = true;
    }
    
    /**
     * Disables the render queue
     */
    disableQueue() {
        this.queueEnabled = false;
    }
    
    /**
     * Sorts the render queue by z-index and batch ID
     * @private
     */
    _sortRenderQueue() {
        this.renderQueue.sort(this._compareDrawCommands);
    }
    
    /**
     * Comparison function for sorting draw commands
     * @param {Object} a - First draw command
     * @param {Object} b - Second draw command
     * @returns {number} Comparison result
     * @private
     */
    _compareDrawCommands(a, b) {
        // First sort by z-index
        if (a.zIndex !== b.zIndex) {
            return a.zIndex - b.zIndex;
        }
        
        // Then sort by batch ID to minimize state changes
        return a.batchId.localeCompare(b.batchId);
    }
    
    /**
     * Processes the render queue
     * Sorts by z-index and batch ID, then executes commands
     */
    processQueue() {
        if (!this.queueEnabled || this.renderQueue.length === 0) {
            return;
        }
        
        // Sort the queue
        this._sortRenderQueue();
        
        // Group commands by batch ID
        const batchedCommands = new Map();
        
        for (const command of this.renderQueue) {
            if (!batchedCommands.has(command.batchId)) {
                batchedCommands.set(command.batchId, []);
            }
            
            batchedCommands.get(command.batchId).push(command);
        }
        
        // Execute commands by batch
        let lastBatchId = null;
        let stateChanges = 0;
        
        for (const [batchId, commands] of batchedCommands.entries()) {
            // State change if batch changed
            if (lastBatchId !== batchId) {
                stateChanges++;
                lastBatchId = batchId;
                
                // Apply batch state
                const batch = this.batches.get(batchId);
                if (batch && batch.state) {
                    this._applyState(batch.state);
                }
            }
            
            // Execute all commands in this batch
            for (const command of commands) {
                command.drawFn(this.ctx, command.params);
            }
        }
        
        // Update stats
        this.stats.drawCalls += this.renderQueue.length;
        this.stats.savedDrawCalls += this.renderQueue.length - stateChanges;
        this.stats.stateChanges += stateChanges;
        
        // Clear the queue
        this.renderQueue = [];
    }
    
    /**
     * Applies a rendering state to the context
     * @param {Object} state - The state to apply
     * @private
     */
    _applyState(state) {
        // Apply common state properties
        if (state.globalAlpha !== undefined) this.ctx.globalAlpha = state.globalAlpha;
        if (state.globalCompositeOperation !== undefined) this.ctx.globalCompositeOperation = state.globalCompositeOperation;
        if (state.fillStyle !== undefined) this.ctx.fillStyle = state.fillStyle;
        if (state.strokeStyle !== undefined) this.ctx.strokeStyle = state.strokeStyle;
        if (state.lineWidth !== undefined) this.ctx.lineWidth = state.lineWidth;
        
        // Apply any other state properties
        Object.entries(state).forEach(([key, value]) => {
            if (key in this.ctx && !['globalAlpha', 'globalCompositeOperation', 'fillStyle', 'strokeStyle', 'lineWidth'].includes(key)) {
                this.ctx[key] = value;
            }
        });
    }
    
    /**
     * Draws a specific batch
     * @param {string} batchId - The batch ID to draw
     */
    draw(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch || batch.commands.length === 0) {
            return;
        }
        
        // Apply batch state
        if (batch.state) {
            this._applyState(batch.state);
        }
        
        // Execute all commands in the batch
        for (const command of batch.commands) {
            command.drawFn(this.ctx, command.params);
        }
        
        // Update stats
        this.stats.drawCalls++;
        this.stats.savedDrawCalls += batch.commands.length - 1;
        this.stats.stateChanges++;
        
        // Clear the batch
        batch.commands = [];
        batch.dirty = false;
    }
    
    /**
     * Draws all batches
     */
    drawAll() {
        // Process the render queue first if enabled
        if (this.queueEnabled && this.renderQueue.length > 0) {
            this.processQueue();
            return;
        }
        
        // Draw all dirty batches
        this.batches.forEach((batch, batchId) => {
            if (batch.dirty && batch.commands.length > 0) {
                this.draw(batchId);
            }
        });
    }
    
    /**
     * Clears all batches
     */
    clear() {
        this.batches.forEach(batch => {
            batch.commands = [];
            batch.dirty = false;
        });
        
        this.renderQueue = [];
        this.currentBatch = null;
        this.currentBatchId = null;
    }
    
    /**
     * Resets performance counters
     */
    resetStats() {
        const now = performance.now();
        const elapsed = now - this.stats.lastResetTime;
        
        // Calculate rates
        const drawsPerSecond = (this.stats.batchedDraws / elapsed) * 1000;
        const drawCallsPerSecond = (this.stats.drawCalls / elapsed) * 1000;
        const batchEfficiency = this.stats.drawCalls > 0 ? this.stats.batchedDraws / this.stats.drawCalls : 0;
        
        // Store previous stats
        const previousStats = { ...this.stats };
        
        // Reset counters
        this.stats = {
            drawCalls: 0,
            batchedDraws: 0,
            savedDrawCalls: 0,
            stateChanges: 0,
            lastResetTime: now,
            
            // Add calculated rates
            drawsPerSecond,
            drawCallsPerSecond,
            batchEfficiency,
            
            // Add elapsed time
            elapsed
        };
        
        return previousStats;
    }
    
    /**
     * Gets current statistics
     * @returns {Object} Statistics
     */
    getStats() {
        const now = performance.now();
        const elapsed = now - this.stats.lastResetTime;
        
        return {
            ...this.stats,
            batchCount: this.batches.size,
            queueSize: this.renderQueue.length,
            elapsed,
            drawsPerSecond: (this.stats.batchedDraws / elapsed) * 1000,
            drawCallsPerSecond: (this.stats.drawCalls / elapsed) * 1000,
            batchEfficiency: this.stats.drawCalls > 0 ? this.stats.batchedDraws / this.stats.drawCalls : 0
        };
    }
}
