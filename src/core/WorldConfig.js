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
        this.coordinateOffsetX = 0;   // Base coordinate system X offset (reset to 0)
        this.coordinateOffsetY = 0;   // Base coordinate system Y offset (reset to 0)
        this.gridOffsetX = 0;         // Grid visualization X offset (reset to 0)
        this.gridOffsetY = -32;       // Grid visualization Y offset (adjusted for isometric view)
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
        // Convert grid coordinates to isometric world coordinates
        // These formulas are the inverse of the worldToGrid formulas
        const tileWidthHalf = this.tileWidth / 2;
        const tileHeightHalf = this.tileHeight / 2;

        // Calculate isometric coordinates
        const isoX = (gridX - gridY);
        const isoY = (gridX + gridY);

        // Convert to world coordinates without any correction factor
        // The correction is now handled by the camera and world position
        return {
            x: isoX * tileWidthHalf,
            y: isoY * tileHeightHalf
        };
    }

    /**
     * Converts world coordinates to grid coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Grid coordinates {x, y}
     */
    worldToGrid(worldX, worldY) {
        // Convert from world coordinates to isometric grid space
        const tileWidthHalf = this.tileWidth / 2;
        const tileHeightHalf = this.tileHeight / 2;

        // Convert from world space to isometric space
        const isoX = worldX / tileWidthHalf;
        const isoY = worldY / tileHeightHalf;

        // Calculate grid coordinates from isometric coordinates
        return {
            x: (isoY + isoX) / 2,
            y: (isoY - isoX) / 2
        };
    }

    /**
     * Converts grid coordinates to chunk coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} Chunk coordinates {chunkX, chunkY}
     */
    gridToChunk(gridX, gridY) {
        // Special handling for negative coordinates to ensure correct chunking
        // For negative numbers, we need to round down (towards negative infinity)
        // Math.floor works for positive numbers but needs adjustment for negative numbers
        const chunkX = gridX < 0 ? Math.floor(gridX / this.chunkSize) : Math.floor(gridX / this.chunkSize);
        const chunkY = gridY < 0 ? Math.floor(gridY / this.chunkSize) : Math.floor(gridY / this.chunkSize);

        return { chunkX, chunkY };
    }

    /**
     * Converts chunk coordinates to grid coordinates (top-left corner of chunk)
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {Object} Grid coordinates {gridX, gridY}
     */
    chunkToGrid(chunkX, chunkY) {
        // This works for both positive and negative chunk coordinates
        // For negative chunks, this will correctly give the top-left corner
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