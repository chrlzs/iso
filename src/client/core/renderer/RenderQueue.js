/**
 * RenderQueue - Manages render order and depth sorting
 * Ensures objects are drawn in the correct order for proper layering
 */
export class RenderQueue {
    /**
     * Creates a new render queue
     * @param {Object} options - Configuration options
     * @param {boolean} options.autoSort - Whether to automatically sort when adding items (default: false)
     * @param {boolean} options.debug - Whether to log debug information (default: false)
     */
    constructor(options = {}) {
        this.autoSort = options.autoSort || false;
        this.debug = options.debug || false;
        
        // Queue of render commands
        this.queue = [];
        
        // Layers for organizing render commands
        this.layers = new Map();
        this.layerOrder = [];
        
        // Default layers
        this.addLayer('background', 0);
        this.addLayer('terrain', 100);
        this.addLayer('objects', 200);
        this.addLayer('entities', 300);
        this.addLayer('overlay', 400);
        this.addLayer('ui', 500);
        
        // Performance tracking
        this.stats = {
            itemsProcessed: 0,
            sortTime: 0,
            lastSortTime: 0,
            lastResetTime: performance.now()
        };
        
        // Bind methods that will be used as callbacks
        this._compareItems = this._compareItems.bind(this);
    }
    
    /**
     * Adds a new layer to the render queue
     * @param {string} name - Layer name
     * @param {number} zIndex - Base z-index for the layer
     * @returns {Object} The layer object
     */
    addLayer(name, zIndex) {
        if (this.layers.has(name)) {
            if (this.debug) {
                console.warn(`RenderQueue: Layer '${name}' already exists`);
            }
            return this.layers.get(name);
        }
        
        const layer = {
            name,
            zIndex,
            items: []
        };
        
        this.layers.set(name, layer);
        
        // Sort layer order by z-index
        this.layerOrder = Array.from(this.layers.values())
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(layer => layer.name);
        
        return layer;
    }
    
    /**
     * Gets a layer by name
     * @param {string} name - Layer name
     * @returns {Object|null} The layer object or null if not found
     */
    getLayer(name) {
        return this.layers.get(name) || null;
    }
    
    /**
     * Adds an item to the render queue
     * @param {Function} renderFn - The render function to execute
     * @param {Object} params - Parameters for the render function
     * @param {Object} options - Additional options
     * @param {string} options.layer - Layer name (default: 'objects')
     * @param {number} options.zIndex - Z-index within the layer (default: 0)
     * @param {string} options.id - Optional identifier for the item
     * @returns {Object} The added item
     */
    add(renderFn, params = {}, options = {}) {
        const layerName = options.layer || 'objects';
        const layer = this.getLayer(layerName);
        
        if (!layer) {
            if (this.debug) {
                console.warn(`RenderQueue: Layer '${layerName}' not found, using 'objects'`);
            }
            return this.add(renderFn, params, { ...options, layer: 'objects' });
        }
        
        // Create the item
        const item = {
            renderFn,
            params,
            layer: layerName,
            layerZIndex: layer.zIndex,
            zIndex: options.zIndex || 0,
            id: options.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            added: performance.now()
        };
        
        // Calculate effective z-index
        item.effectiveZIndex = item.layerZIndex + item.zIndex;
        
        // Add to layer and main queue
        layer.items.push(item);
        this.queue.push(item);
        
        // Auto-sort if enabled
        if (this.autoSort) {
            this.sort();
        }
        
        return item;
    }
    
    /**
     * Removes an item from the render queue
     * @param {string} id - Item ID
     * @returns {boolean} Whether the item was removed
     */
    remove(id) {
        const index = this.queue.findIndex(item => item.id === id);
        
        if (index === -1) {
            return false;
        }
        
        // Get the item
        const item = this.queue[index];
        
        // Remove from queue
        this.queue.splice(index, 1);
        
        // Remove from layer
        const layer = this.getLayer(item.layer);
        if (layer) {
            const layerIndex = layer.items.findIndex(layerItem => layerItem.id === id);
            if (layerIndex !== -1) {
                layer.items.splice(layerIndex, 1);
            }
        }
        
        return true;
    }
    
    /**
     * Updates an item in the render queue
     * @param {string} id - Item ID
     * @param {Object} params - New parameters
     * @param {Object} options - New options
     * @returns {Object|null} The updated item or null if not found
     */
    update(id, params = {}, options = {}) {
        const item = this.queue.find(item => item.id === id);
        
        if (!item) {
            return null;
        }
        
        // Update parameters
        if (params) {
            item.params = { ...item.params, ...params };
        }
        
        // Update layer if changed
        if (options.layer && options.layer !== item.layer) {
            // Remove from old layer
            const oldLayer = this.getLayer(item.layer);
            if (oldLayer) {
                const layerIndex = oldLayer.items.findIndex(layerItem => layerItem.id === id);
                if (layerIndex !== -1) {
                    oldLayer.items.splice(layerIndex, 1);
                }
            }
            
            // Add to new layer
            const newLayer = this.getLayer(options.layer);
            if (newLayer) {
                item.layer = options.layer;
                item.layerZIndex = newLayer.zIndex;
                newLayer.items.push(item);
            }
        }
        
        // Update z-index if changed
        if (options.zIndex !== undefined && options.zIndex !== item.zIndex) {
            item.zIndex = options.zIndex;
            item.effectiveZIndex = item.layerZIndex + item.zIndex;
        }
        
        // Auto-sort if enabled
        if (this.autoSort) {
            this.sort();
        }
        
        return item;
    }
    
    /**
     * Sorts the render queue by effective z-index
     */
    sort() {
        const startTime = performance.now();
        
        // Sort the main queue
        this.queue.sort(this._compareItems);
        
        // Sort each layer
        this.layers.forEach(layer => {
            layer.items.sort(this._compareItems);
        });
        
        const endTime = performance.now();
        this.stats.lastSortTime = endTime - startTime;
        this.stats.sortTime += this.stats.lastSortTime;
    }
    
    /**
     * Comparison function for sorting items
     * @param {Object} a - First item
     * @param {Object} b - Second item
     * @returns {number} Comparison result
     * @private
     */
    _compareItems(a, b) {
        // First sort by effective z-index
        if (a.effectiveZIndex !== b.effectiveZIndex) {
            return a.effectiveZIndex - b.effectiveZIndex;
        }
        
        // Then sort by layer z-index
        if (a.layerZIndex !== b.layerZIndex) {
            return a.layerZIndex - b.layerZIndex;
        }
        
        // Then sort by z-index within layer
        if (a.zIndex !== b.zIndex) {
            return a.zIndex - b.zIndex;
        }
        
        // Finally sort by add time
        return a.added - b.added;
    }
    
    /**
     * Processes the render queue
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    process(ctx) {
        // Sort if not auto-sorted
        if (!this.autoSort) {
            this.sort();
        }
        
        // Process all items
        for (const item of this.queue) {
            item.renderFn(ctx, item.params);
            this.stats.itemsProcessed++;
        }
    }
    
    /**
     * Processes a specific layer
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {string} layerName - Layer name
     */
    processLayer(ctx, layerName) {
        const layer = this.getLayer(layerName);
        
        if (!layer) {
            if (this.debug) {
                console.warn(`RenderQueue: Layer '${layerName}' not found`);
            }
            return;
        }
        
        // Sort if not auto-sorted
        if (!this.autoSort) {
            layer.items.sort(this._compareItems);
        }
        
        // Process all items in the layer
        for (const item of layer.items) {
            item.renderFn(ctx, item.params);
            this.stats.itemsProcessed++;
        }
    }
    
    /**
     * Processes all layers in order
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    processLayers(ctx) {
        // Process each layer in order
        for (const layerName of this.layerOrder) {
            this.processLayer(ctx, layerName);
        }
    }
    
    /**
     * Clears the render queue
     */
    clear() {
        this.queue = [];
        
        // Clear all layers
        this.layers.forEach(layer => {
            layer.items = [];
        });
    }
    
    /**
     * Clears a specific layer
     * @param {string} layerName - Layer name
     */
    clearLayer(layerName) {
        const layer = this.getLayer(layerName);
        
        if (!layer) {
            return;
        }
        
        // Remove all items in this layer from the main queue
        this.queue = this.queue.filter(item => item.layer !== layerName);
        
        // Clear the layer
        layer.items = [];
    }
    
    /**
     * Gets the number of items in the queue
     * @returns {number} Queue size
     */
    size() {
        return this.queue.length;
    }
    
    /**
     * Gets the number of items in a layer
     * @param {string} layerName - Layer name
     * @returns {number} Layer size
     */
    layerSize(layerName) {
        const layer = this.getLayer(layerName);
        return layer ? layer.items.length : 0;
    }
    
    /**
     * Resets performance counters
     */
    resetStats() {
        const now = performance.now();
        const elapsed = now - this.stats.lastResetTime;
        
        // Calculate rates
        const itemsPerSecond = (this.stats.itemsProcessed / elapsed) * 1000;
        
        // Store previous stats
        const previousStats = { ...this.stats };
        
        // Reset counters
        this.stats = {
            itemsProcessed: 0,
            sortTime: 0,
            lastSortTime: 0,
            lastResetTime: now,
            
            // Add calculated rates
            itemsPerSecond,
            
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
            queueSize: this.queue.length,
            layerCount: this.layers.size,
            layerSizes: Object.fromEntries(
                Array.from(this.layers.entries()).map(([name, layer]) => [name, layer.items.length])
            ),
            elapsed,
            itemsPerSecond: (this.stats.itemsProcessed / elapsed) * 1000
        };
    }
}
