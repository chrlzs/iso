/**
 * Configuration for the game world
 */
export class WorldConfig {
    /**
     * Creates a new world configuration
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Grid dimensions (now represents the total world size in chunks)
        this.gridWidth = options.width || 32;
        this.gridHeight = options.height || 32;

        // Tile dimensions
        this.tileWidth = options.tileWidth || 64;
        this.tileHeight = options.tileHeight || 32;

        // Chunk configuration
        this.chunkSize = options.chunkSize || 16; // Size of each chunk in tiles
        this.loadDistance = options.loadDistance || 2; // Chunks to load in each direction
        this.unloadDistance = options.unloadDistance || 3; // Chunks to keep loaded
        this.generateDistance = options.generateDistance || 1; // Chunks to pre-generate

        // World limits (null = infinite in that direction)
        this.worldLimitMinX = options.worldLimitMinX || null;
        this.worldLimitMaxX = options.worldLimitMaxX || null;
        this.worldLimitMinY = options.worldLimitMinY || null;
        this.worldLimitMaxY = options.worldLimitMaxY || null;

        // Coordinate system calibration
        this.coordinateOffsetX = 9;   // Base coordinate system X offset
        this.coordinateOffsetY = 8;   // Base coordinate system Y offset
        this.gridOffsetX = -65;       // Grid visualization X offset
        this.gridOffsetY = -65;       // Grid visualization Y offset
        this.gridScale = 1.0;         // Grid visualization scale

        // Camera bounds
        this.cameraBoundsMinX = options.cameraBoundsMinX || -5000;
        this.cameraBoundsMinY = options.cameraBoundsMinY || -5000;
        this.cameraBoundsMaxX = options.cameraBoundsMaxX || 5000;
        this.cameraBoundsMaxY = options.cameraBoundsMaxY || 5000;
    }

    /**
     * Updates coordinate system configuration
     * @param {Object} config - New configuration values
     */
    updateCoordinates(config) {
        if (config.coordinateOffsetX !== undefined) this.coordinateOffsetX = config.coordinateOffsetX;
        if (config.coordinateOffsetY !== undefined) this.coordinateOffsetY = config.coordinateOffsetY;
        if (config.gridOffsetX !== undefined) this.gridOffsetX = config.gridOffsetX;
        if (config.gridOffsetY !== undefined) this.gridOffsetY = config.gridOffsetY;
        if (config.gridScale !== undefined) this.gridScale = config.gridScale;
    }

    /**
     * Converts grid coordinates to world coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    gridToWorld(gridX, gridY) {
        // Convert grid coordinates to isometric world coordinates with proper scaling
        const baseX = (gridX - gridY) * (this.tileWidth / 2);
        const baseY = (gridX + gridY) * (this.tileHeight / 2);
        return {
            x: baseX * this.gridScale + (this.coordinateOffsetX * this.gridScale),
            y: baseY * this.gridScale + (this.coordinateOffsetY * this.gridScale)
        };
    }

    /**
     * Converts world coordinates to grid coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Grid coordinates {x, y}
     */
    worldToGrid(worldX, worldY) {
        // Remove scaling and adjust for coordinate system offset
        const adjustedX = (worldX - (this.coordinateOffsetX * this.gridScale)) / this.gridScale;
        const adjustedY = (worldY - (this.coordinateOffsetY * this.gridScale)) / this.gridScale;

        // Convert isometric world coordinates back to grid coordinates
        // Use Math.round instead of Math.floor for more accurate grid snapping
        return {
            x: Math.round((adjustedY / (this.tileHeight / 2) + adjustedX / (this.tileWidth / 2)) / 2),
            y: Math.round((adjustedY / (this.tileHeight / 2) - adjustedX / (this.tileWidth / 2)) / 2)
        };
    }

    /**
     * Converts grid coordinates to chunk coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} Chunk coordinates {chunkX, chunkY}
     */
    gridToChunk(gridX, gridY) {
        return {
            chunkX: Math.floor(gridX / this.chunkSize),
            chunkY: Math.floor(gridY / this.chunkSize)
        };
    }

    /**
     * Converts chunk coordinates to grid coordinates (top-left corner of chunk)
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {Object} Grid coordinates {gridX, gridY}
     */
    chunkToGrid(chunkX, chunkY) {
        return {
            gridX: chunkX * this.chunkSize,
            gridY: chunkY * this.chunkSize
        };
    }

    /**
     * Converts world coordinates directly to chunk coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Chunk coordinates {chunkX, chunkY}
     */
    worldToChunk(worldX, worldY) {
        const grid = this.worldToGrid(worldX, worldY);
        return this.gridToChunk(grid.x, grid.y);
    }

    /**
     * Checks if a chunk is outside the world limits
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {boolean} True if the chunk is outside world limits
     */
    isChunkOutsideWorldLimits(chunkX, chunkY) {
        // If any limit is null, that direction is infinite
        if (this.worldLimitMinX !== null && chunkX < this.worldLimitMinX) return true;
        if (this.worldLimitMaxX !== null && chunkX > this.worldLimitMaxX) return true;
        if (this.worldLimitMinY !== null && chunkY < this.worldLimitMinY) return true;
        if (this.worldLimitMaxY !== null && chunkY > this.worldLimitMaxY) return true;

        return false;
    }
}