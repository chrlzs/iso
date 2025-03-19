import { SimplexNoise } from '../../lib/SimplexNoise.js';

/**
 * Represents the game world and manages the tile grid
 * @class World
 */
export class World {
    /**
     * Creates a new World instance
     * @param {number} [width=64] - The width of the world in tiles
     * @param {number} [height=64] - The height of the world in tiles
     * @param {Object} [options] - World generation options
     * @param {number} [options.seed] - Seed for terrain generation
     * @param {number} [options.chunkSize=16] - Size of each chunk
     */
    constructor(width = 64, height = 64, options = {}) {
        this.width = width;
        this.height = height;
        this.seed = options.seed || Math.random() * 10000;
        this.chunkSize = options.chunkSize || 16;
        
        // Initialize chunk storage
        this.chunks = new Map();
        this.activeChunks = new Set();
        
        // Create noise generator
        this.noise = new SimplexNoise(this.seed);
    }

    /**
     * Gets or generates a chunk at the specified coordinates
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {Object} The chunk data
     */
    getChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        
        if (!this.chunks.has(key)) {
            this.chunks.set(key, this.generateChunk(chunkX, chunkY));
        }
        
        return this.chunks.get(key);
    }

    /**
     * Generates a new chunk
     * @private
     */
    generateChunk(chunkX, chunkY) {
        const chunk = {
            x: chunkX,
            y: chunkY,
            tiles: new Array(this.chunkSize)
        };

        const worldX = chunkX * this.chunkSize;
        const worldY = chunkY * this.chunkSize;

        for (let x = 0; x < this.chunkSize; x++) {
            chunk.tiles[x] = new Array(this.chunkSize);
            for (let y = 0; y < this.chunkSize; y++) {
                const absX = worldX + x;
                const absY = worldY + y;
                
                // Generate height and moisture using existing parameters
                const height = this.generateHeight(absX, absY);
                const moisture = this.generateMoisture(absX, absY);
                
                chunk.tiles[x][y] = this.generateTile(absX, absY, height, moisture);
            }
        }

        return chunk;
    }

    /**
     * Gets a tile at world coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {Object|null} The tile or null if out of bounds
     */
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }

        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunk = this.getChunk(chunkX, chunkY);

        const localX = x % this.chunkSize;
        const localY = y % this.chunkSize;

        return chunk.tiles[localX][localY];
    }

    /**
     * Updates active chunks based on camera position
     * @param {number} centerX - Center X coordinate in world space
     * @param {number} centerY - Center Y coordinate in world space
     * @param {number} viewDistance - Number of chunks to load in each direction
     */
    updateActiveChunks(centerX, centerY, viewDistance) {
        const centerChunkX = Math.floor(centerX / this.chunkSize);
        const centerChunkY = Math.floor(centerY / this.chunkSize);
        
        // Clear current active chunks
        this.activeChunks.clear();

        // Add chunks within view distance
        for (let dx = -viewDistance; dx <= viewDistance; dx++) {
            for (let dy = -viewDistance; dy <= viewDistance; dy++) {
                const chunkX = centerChunkX + dx;
                const chunkY = centerChunkY + dy;
                
                // Only add if within world bounds
                if (this.isChunkInBounds(chunkX, chunkY)) {
                    this.activeChunks.add(`${chunkX},${chunkY}`);
                    this.getChunk(chunkX, chunkY); // Ensure chunk is generated
                }
            }
        }
    }

    /**
     * Checks if a chunk position is within world bounds
     * @private
     */
    isChunkInBounds(chunkX, chunkY) {
        const minX = 0;
        const minY = 0;
        const maxX = Math.floor(this.width / this.chunkSize);
        const maxY = Math.floor(this.height / this.chunkSize);
        
        return chunkX >= minX && chunkX < maxX && 
               chunkY >= minY && chunkY < maxY;
    }

    /**
     * Generates height value for a coordinate
     * @private
     */
    generateHeight(x, y) {
        const SCALE = 0.05;
        const MOUNTAIN_SCALE = 0.08;
        
        let height = 0;
        height += this.noise.noise2D(x * SCALE, y * SCALE);
        height += this.noise.noise2D(x * SCALE * 2, y * SCALE * 2) * 0.5;
        height += this.noise.noise2D(x * SCALE * 4, y * SCALE * 4) * 0.25;
        height = (height + 1) / 2;

        const mountain = this.noise.noise2D(x * MOUNTAIN_SCALE, y * MOUNTAIN_SCALE);
        height = height * (1 - 0.5) + (height * mountain) * 0.5;

        return height;
    }

    /**
     * Generates moisture value for a coordinate
     * @private
     */
    generateMoisture(x, y) {
        const MOISTURE_SCALE = 0.04;
        return this.noise.noise2D(x * MOISTURE_SCALE + 1000, y * MOISTURE_SCALE + 1000);
    }

    /**
     * Generates a tile based on height and moisture values
     * @private
     */
    generateTile(x, y, height, moisture) {
        let type;
        
        if (height < 0.2) {
            type = 'dirt';
        } else if (height < 0.6) {
            type = 'grass';
        } else {
            type = 'stone';
        }

        // Default decoration configurations
        const decorationConfigs = {
            flowers: {
                offset: { x: 0, y: -8 },
                scale: { x: 0.5, y: 0.5 }
            },
            rocks: {
                offset: { x: 0, y: -4 },
                scale: { x: 0.6, y: 0.6 }
            }
        };

        // Generate decoration
        let decoration = null;
        if (Math.random() < 0.2) {
            const decorationType = type === 'grass' ? 'flowers' : 'rocks';
            const config = decorationConfigs[decorationType];
            
            decoration = {
                type: decorationType,
                variant: Math.floor(Math.random() * 2),
                offset: { ...config.offset },
                scale: { ...config.scale }
            };
        }

        return {
            type: type,
            height: Math.floor(height * 3), // Convert height to integer levels
            variant: Math.random() < 0.3 ? Math.floor(Math.random() * 2) : null,
            decoration: decoration
        };
    }
}



