import { TileManager } from './TileManager.js';
import { StructureManager } from './StructureManager.js';
import { SimplexNoise } from '../../lib/SimplexNoise.js';
import { StructureRenderer } from '../renderer/StructureRenderer.js';

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
        
        this.seed = options.seed || Math.random() * 10000;
        const noise = new SimplexNoise(this.seed);
        
        this.generateHeight = (x, y) => {
            const value1 = noise.noise2D(x * 0.02, y * 0.02);
            const value2 = noise.noise2D(x * 0.04, y * 0.04) * 0.5;
            const value = (value1 + value2) / 1.5;
            return Math.pow((value + 1) * 0.5, 1.2);
        };
        
        this.generateMoisture = (x, y) => {
            const value = noise.noise2D(x * 0.02 + 1000, y * 0.02 + 1000);
            return (value + 1) * 0.5;
        };

        // Initialize structure manager but don't generate structures yet
        this.structureManager = new StructureManager(this);
        
        // Generate initial chunks around the center
        this.generateInitialChunks();

        // Now generate structures if requested
        if (options.autoGenerateStructures) {
            this.structureManager.generateRandomStructures(options.structureCount || 5);
        }

        // Initialize structure renderer
        this.structureRenderer = new StructureRenderer(options.ctx);
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
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }

        const tileType = this.tileManager.determineTileType(height, moisture);
        
        const tile = {
            type: tileType,
            variant: this.tileManager.getRandomVariant(tileType),
            height: Math.floor(height * 4),  // Change to 4 levels (0-3) for more height variety
            moisture,
            x,
            y,
            id: `tile_${x}_${y}`,
            decoration: this.tileManager.getPersistentDecoration(`tile_${x}_${y}`, tileType),
            structure: null
        };

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
        // ... existing tile rendering code ...

        // If the tile has a structure, render it
        if (tile.structure) {
            this.structureRenderer.render(tile.structure, screenX, screenY);
        }
    }
}







































