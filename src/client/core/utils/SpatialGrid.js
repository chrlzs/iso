import { RectPool } from './RectPool.js';

/**
 * SpatialGrid - Spatial partitioning for efficient entity culling
 */
export class SpatialGrid {
    /**
     * Creates a new spatial grid
     * @param {number} cellSize - Size of each grid cell
     * @param {number} worldWidth - Width of the world
     * @param {number} worldHeight - Height of the world
     */
    constructor(cellSize = 64, worldWidth = 2000, worldHeight = 2000) {
        this.cellSize = cellSize;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        // Calculate grid dimensions
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        
        // Create grid cells
        this.cells = new Array(this.cols * this.rows);
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = new Set();
        }
        
        // Create rect pool for queries
        this.rectPool = new RectPool(10);
        
        // Stats
        this.stats = {
            insertions: 0,
            removals: 0,
            queries: 0,
            entitiesProcessed: 0
        };
    }
    
    /**
     * Gets the cell index for a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Cell index
     */
    getCellIndex(x, y) {
        // Clamp coordinates to world bounds
        const clampedX = Math.max(0, Math.min(this.worldWidth - 1, x));
        const clampedY = Math.max(0, Math.min(this.worldHeight - 1, y));
        
        // Calculate cell coordinates
        const cellX = Math.floor(clampedX / this.cellSize);
        const cellY = Math.floor(clampedY / this.cellSize);
        
        // Calculate cell index
        return cellY * this.cols + cellX;
    }
    
    /**
     * Gets the cell indices for a rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {number[]} Cell indices
     */
    getCellIndices(x, y, width, height) {
        // Calculate cell coordinates for rectangle corners
        const startCellX = Math.max(0, Math.floor(x / this.cellSize));
        const startCellY = Math.max(0, Math.floor(y / this.cellSize));
        const endCellX = Math.min(this.cols - 1, Math.floor((x + width) / this.cellSize));
        const endCellY = Math.min(this.rows - 1, Math.floor((y + height) / this.cellSize));
        
        // Collect cell indices
        const indices = [];
        for (let cellY = startCellY; cellY <= endCellY; cellY++) {
            for (let cellX = startCellX; cellX <= endCellX; cellX++) {
                indices.push(cellY * this.cols + cellX);
            }
        }
        
        return indices;
    }
    
    /**
     * Inserts an entity into the grid
     * @param {Object} entity - Entity to insert
     */
    insert(entity) {
        if (!entity || !entity.getBounds) return;
        
        try {
            // Get entity bounds
            const bounds = entity.getBounds();
            if (!bounds) return;
            
            // Get cell indices for entity bounds
            const indices = this.getCellIndices(bounds.x, bounds.y, bounds.width, bounds.height);
            
            // Insert entity into cells
            for (const index of indices) {
                if (index >= 0 && index < this.cells.length) {
                    this.cells[index].add(entity);
                }
            }
            
            // Store cell indices on entity for quick removal
            entity._spatialGridIndices = indices;
            
            this.stats.insertions++;
        } catch (e) {
            console.error('Error inserting entity into spatial grid:', e);
        }
    }
    
    /**
     * Removes an entity from the grid
     * @param {Object} entity - Entity to remove
     */
    remove(entity) {
        if (!entity || !entity._spatialGridIndices) return;
        
        try {
            // Remove entity from cells
            for (const index of entity._spatialGridIndices) {
                if (index >= 0 && index < this.cells.length) {
                    this.cells[index].delete(entity);
                }
            }
            
            // Clear cell indices on entity
            entity._spatialGridIndices = null;
            
            this.stats.removals++;
        } catch (e) {
            console.error('Error removing entity from spatial grid:', e);
        }
    }
    
    /**
     * Updates an entity's position in the grid
     * @param {Object} entity - Entity to update
     */
    update(entity) {
        this.remove(entity);
        this.insert(entity);
    }
    
    /**
     * Queries entities in a rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {Set<Object>} Entities in the rectangle
     */
    query(x, y, width, height) {
        const result = new Set();
        
        try {
            // Get cell indices for query rectangle
            const indices = this.getCellIndices(x, y, width, height);
            
            // Get entities from cells
            for (const index of indices) {
                if (index >= 0 && index < this.cells.length) {
                    const cell = this.cells[index];
                    for (const entity of cell) {
                        result.add(entity);
                        this.stats.entitiesProcessed++;
                    }
                }
            }
            
            this.stats.queries++;
        } catch (e) {
            console.error('Error querying spatial grid:', e);
        }
        
        return result;
    }
    
    /**
     * Queries entities in a rectangle using a pooled rect
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Function} callback - Callback for each entity
     */
    queryRect(x, y, width, height, callback) {
        try {
            // Get cell indices for query rectangle
            const indices = this.getCellIndices(x, y, width, height);
            
            // Get a rect from the pool for bounds checking
            const queryRect = this.rectPool.get(x, y, width, height);
            
            // Process entities from cells
            const processed = new Set(); // Track processed entities to avoid duplicates
            
            for (const index of indices) {
                if (index >= 0 && index < this.cells.length) {
                    const cell = this.cells[index];
                    for (const entity of cell) {
                        // Skip already processed entities
                        if (processed.has(entity)) continue;
                        processed.add(entity);
                        
                        // Check if entity bounds intersect query rect
                        if (entity.getBounds) {
                            const bounds = entity.getBounds();
                            if (bounds && queryRect.intersects(bounds)) {
                                callback(entity);
                            }
                        }
                        
                        this.stats.entitiesProcessed++;
                    }
                }
            }
            
            // Release the rect back to the pool
            this.rectPool.release(queryRect);
            
            this.stats.queries++;
        } catch (e) {
            console.error('Error querying spatial grid with rect:', e);
        }
    }
    
    /**
     * Clears all entities from the grid
     */
    clear() {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i].clear();
        }
    }
    
    /**
     * Gets grid statistics
     * @returns {Object} Grid statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
