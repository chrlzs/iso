import { TileManager } from './TileManager.js';
import { StructureManager } from './StructureManager.js';
import { SimplexNoise } from '../../lib/SimplexNoise.js';

export class World {
    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;
        
        // Get debug config from options or create default
        this.debug = options.debug || {
            enabled: false,
            flags: {}
        };
        
        // Pass debug config to TileManager
        this.tileManager = new TileManager(this.debug);
        
        // Initialize maps
        this.chunks = new Map();
        this.tileCache = new Map();
        this.activeChunks = new Set();
        this.maxCacheSize = 1000;
        
        // Initialize noise generators with seed
        this.seed = options.seed || Math.random() * 10000;
        const noise = new SimplexNoise(this.seed);
        
        // Generate height and moisture using the same noise function but different offsets
        // Decrease scale from 0.05 to 0.02 for larger terrain features
        this.generateHeight = (x, y) => noise.noise2D(x * 0.02, y * 0.02);
        this.generateMoisture = (x, y) => noise.noise2D(x * 0.02 + 1000, y * 0.02 + 1000);

        // Add structure manager after maps are initialized
        this.structureManager = new StructureManager(this);
        
        // Generate structures last
        if (options.autoGenerateStructures) {
            this.structureManager.generateRandomStructures(options.structureCount || 5);
        }
    }

    generateTile(x, y, height, moisture) {
        const key = `${x},${y}`;
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }

        const tileType = this.tileManager.determineTileType(height, moisture);
        const variant = this.tileManager.getRandomVariant(tileType);
        
        const tile = {
            type: tileType,
            variant: variant,
            height: Math.max(0, Math.floor(height * 2)),
            moisture,
            x,
            y,
            id: `tile_${x}_${y}`
        };

        // Get decoration through TileManager
        tile.decoration = this.tileManager.getPersistentDecoration(tile.id, tile.type);

        // Manage cache size
        if (this.tileCache.size >= this.maxCacheSize) {
            const firstKey = this.tileCache.keys().next().value;
            this.tileCache.delete(firstKey);
        }

        this.tileCache.set(key, tile);
        return tile;
    }

    updateActiveChunks(centerX, centerY, radius) {
        this.activeChunks.clear();
        
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const key = `${x},${y}`;
                if (!this.chunks.has(key)) {
                    this.generateChunk(x, y);
                }
                this.activeChunks.add(key);
            }
        }
    }

    generateChunk(chunkX, chunkY) {
        const chunk = new Array(this.chunkSize * this.chunkSize);
        
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                
                const height = this.generateHeight(worldX, worldY);
                const moisture = this.generateMoisture(worldX, worldY);
                
                chunk[y * this.chunkSize + x] = this.generateTile(worldX, worldY, height, moisture);
            }
        }
        
        this.chunks.set(`${chunkX},${chunkY}`, chunk);
    }

    clearCache() {
        this.tileCache.clear();
        // Don't clear decorationStates to maintain decoration persistence
    }

    /**
     * Gets or generates a tile at the specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} The tile object or null if invalid coordinates
     */
    getTileAt(x, y) {
        // Check chunk first
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunk = this.chunks.get(`${chunkX},${chunkY}`);
        
        if (chunk) {
            const localX = x % this.chunkSize;
            const localY = y % this.chunkSize;
            return chunk[localY * this.chunkSize + localX];
        }

        // If no chunk exists, generate tile on the fly
        const height = this.generateHeight(x, y);
        const moisture = this.generateMoisture(x, y);
        return this.generateTile(x, y, height, moisture);
    }
}




























