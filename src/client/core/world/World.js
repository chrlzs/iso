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
        this.tiles = this.generateTerrain();
        this.entities = new Set();
    }

    /**
     * Generates terrain using simplex noise
     * @private
     * @returns {Array<Array<Object>>} 2D array of tile objects
     */
    generateTerrain() {
        const noise = new SimplexNoise(this.seed);
        const tiles = new Array(this.width);
        
        // Generation parameters
        const SCALE = 0.05;
        const MOUNTAIN_SCALE = 0.08;
        const MOISTURE_SCALE = 0.04;
        const RIVER_SCALE = 0.02;
        
        for (let x = 0; x < this.width; x++) {
            tiles[x] = new Array(this.height);
            for (let y = 0; y < this.height; y++) {
                // Base terrain height
                let height = 0;
                height += noise.noise2D(x * SCALE, y * SCALE);
                height += noise.noise2D(x * SCALE * 2, y * SCALE * 2) * 0.5;
                height += noise.noise2D(x * SCALE * 4, y * SCALE * 4) * 0.25;
                height = (height + 1) / 2;

                // Mountain influence
                const mountain = noise.noise2D(x * MOUNTAIN_SCALE, y * MOUNTAIN_SCALE);
                height = height * (1 - 0.5) + (height * mountain) * 0.5;

                // Moisture for biome determination
                const moisture = noise.noise2D(x * MOISTURE_SCALE + 1000, y * MOISTURE_SCALE + 1000);
                
                // River system
                const river = Math.abs(noise.noise2D(x * RIVER_SCALE, y * RIVER_SCALE));
                if (river < 0.05 && height < 0.7) {
                    height = 0.2; // Create rivers
                }

                tiles[x][y] = this.determineTileType(height, moisture);
            }
        }

        // Smooth transitions
        this.smoothTerrain(tiles);
        
        return tiles;
    }

    smoothTerrain(tiles) {
        const smoothed = new Array(this.width);
        for (let x = 0; x < this.width; x++) {
            smoothed[x] = new Array(this.height);
            for (let y = 0; y < this.height; y++) {
                const neighbors = this.getNeighbors(x, y, tiles);
                smoothed[x][y] = this.smoothTile(tiles[x][y], neighbors);
            }
        }
        return smoothed;
    }

    getNeighbors(x, y, tiles) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    neighbors.push(tiles[nx][ny]);
                }
            }
        }
        return neighbors;
    }

    smoothTile(tile, neighbors) {
        // Simple smoothing: adjust height based on neighbors
        const avgHeight = neighbors.reduce((sum, n) => sum + n.height, 0) / neighbors.length;
        const smoothedHeight = (tile.height * 0.6) + (avgHeight * 0.4);
        return {
            ...tile,
            height: smoothedHeight
        };
    }

    /**
     * Determines tile type based on height and moisture
     * @private
     * @param {number} height - Normalized height value (0-1)
     * @param {number} moisture - Moisture value
     * @returns {Object} Tile object with type and properties
     */
    determineTileType(height, moisture) {
        let tileData;
        
        // Determine basic tile type
        if (height < 0.2) {
            tileData = {
                type: 'water',
                walkable: false,
                height: -1
            };
        } else if (height < 0.3) {
            tileData = {
                type: 'sand',
                walkable: true,
                height: 0
            };
        } else if (height < 0.7) {
            tileData = {
                type: moisture > 0.6 ? 'grass' : 'dirt',
                walkable: true,
                height: Math.floor(height * 2)
            };
        } else {
            tileData = {
                type: 'stone',
                walkable: true,
                height: Math.floor(height * 3)
            };
        }

        // Assign random variant if available
        const variant = this.tileManager.getRandomVariant(tileData.type);
        if (variant !== null) {
            tileData.variant = variant;
        }

        return tileData;
    }

    /**
     * Gets the tile at the specified coordinates
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {Object|null} The tile object or null if coordinates are out of bounds
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[x][y];
        }
        return null;
    }
}




