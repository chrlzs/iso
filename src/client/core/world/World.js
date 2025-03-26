import { TileManager } from './TileManager.js';
import { SimplexNoise } from '../../lib/SimplexNoise.js';

export class World {
    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;
        this.chunkSize = options.chunkSize || 16;
        this.debug = options.debug || { enabled: false, flags: {} };
        this.tileManager = new TileManager(this.debug);
        this.chunks = new Map();
        this.tileCache = new Map();
        this.activeChunks = new Set();
        this.maxCacheSize = 1000;
        
        // Handle static map definition if provided
        this.mapDefinition = options.mapDefinition;
        this.staticTiles = new Map();
        
        if (this.mapDefinition) {
            this.initializeFromMapDefinition();
        } else {
            // Original procedural generation
            this.seed = options.seed || Math.random() * 10000;
            const noise = new SimplexNoise(this.seed);
            
            this.generateHeight = (x, y) => {
                const value1 = noise.noise2D(x * 0.02, y * 0.02);
                const value2 = noise.noise2D(x * 0.04, y * 0.04) * 0.5;
                const value = (value1 + value2) / 1.5;
                return Math.pow((value + 1) * 0.5, 0.8);
            };
            
            this.generateMoisture = (x, y) => {
                const value = noise.noise2D(x * 0.02 + 1000, y * 0.02 + 1000);
                return (value + 1) * 0.5;
            };
        }

        // Generate initial chunks
        this.generateInitialChunks();
    }

    initializeFromMapDefinition() {
        // Initialize static tiles from map definition
        for (const terrain of this.mapDefinition.terrain) {
            const key = `${terrain.x},${terrain.y}`;
            this.staticTiles.set(key, {
                type: terrain.type,
                height: terrain.height,
                moisture: terrain.moisture,
                variant: this.tileManager.getRandomVariant(terrain.type),
                x: terrain.x,
                y: terrain.y,
                id: `tile_${terrain.x}_${terrain.y}`,
                decoration: this.tileManager.getPersistentDecoration(`tile_${terrain.x}_${terrain.y}`, terrain.type)
            });
        }

        // Set up height and moisture generators that respect static tiles
        this.generateHeight = (x, y) => {
            const key = `${x},${y}`;
            const staticTile = this.staticTiles.get(key);
            if (staticTile) return staticTile.height;
            
            // Default to procedural generation for non-static tiles
            const noise = new SimplexNoise(this.mapDefinition.seed);
            const value1 = noise.noise2D(x * 0.02, y * 0.02);
            const value2 = noise.noise2D(x * 0.04, y * 0.04) * 0.5;
            const value = (value1 + value2) / 1.5;
            return Math.pow((value + 1) * 0.5, 0.8);
        };

        this.generateMoisture = (x, y) => {
            const key = `${x},${y}`;
            const staticTile = this.staticTiles.get(key);
            if (staticTile) return staticTile.moisture;
            
            // Default to procedural generation for non-static tiles
            const noise = new SimplexNoise(this.mapDefinition.seed);
            const value = noise.noise2D(x * 0.02 + 1000, y * 0.02 + 1000);
            return (value + 1) * 0.5;
        };
    }

    generateInitialChunks() {
        // Generate chunks around the center of the world
        const centerX = Math.floor(this.width / (2 * this.chunkSize));
        const centerY = Math.floor(this.height / (2 * this.chunkSize));
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                this.generateChunk(centerX + dx, centerY + dy);
            }
        }
    }

    generateTile(x, y, height, moisture) {
        const key = `${x},${y}`;
        
        // Check static tiles first
        if (this.staticTiles.has(key)) {
            return this.staticTiles.get(key);
        }
        
        // Check cache
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }

        const tileType = this.tileManager.determineTileType(height, moisture);
        
        const tile = {
            type: tileType,
            variant: this.tileManager.getRandomVariant(tileType),
            height: Math.floor(height * 4),
            moisture,
            x,
            y,
            id: `tile_${x}_${y}`,
            decoration: this.tileManager.getPersistentDecoration(`tile_${x}_${y}`, tileType)
        };

        // Cache management
        if (this.tileCache.size >= this.maxCacheSize) {
            const firstKey = this.tileCache.keys().next().value;
            this.tileCache.delete(firstKey);
        }

        this.tileCache.set(key, tile);
        return tile;
    }

    getTileAt(x, y) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunk = this.chunks.get(`${chunkX},${chunkY}`);
        
        let tile;
        if (chunk) {
            const localX = x % this.chunkSize;
            const localY = y % this.chunkSize;
            tile = chunk[localY * this.chunkSize + localX];
        } else {
            tile = this.generateTile(x, y, this.generateHeight(x, y), this.generateMoisture(x, y));
        }
        
        return tile;
    }

    updateActiveChunks(centerX, centerY, radius) {
        this.activeChunks.clear();
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const key = `${x},${y}`;
                if (!this.chunks.has(key)) this.generateChunk(x, y);
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
    }

    renderTile(ctx, tile, screenX, screenY) {
        // Base tile rendering
        const heightOffset = tile.height * 4;
        screenY -= heightOffset;
        this.tileManager.renderTile(ctx, tile, screenX, screenY);
    }
}




