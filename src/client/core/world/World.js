import { StructureManager } from './StructureManager.js';

export class World {
    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;
        this.chunkSize = options.chunkSize || 16;
        this.chunks = new Map();
        this.activeChunks = new Set();
        this.seed = options.seed || Math.random() * 10000;
        
        // Initialize maps before any generation happens
        this.tileCache = new Map();
        this.decorationStates = new Map();
        this.maxCacheSize = 1000;
        
        // Initialize decoration config
        this.decorationConfig = {
            grass: [
                { type: 'flowers', chance: 0.1, offset: { x: 0, y: -8 }, scale: { x: 0.5, y: 0.5 } },
                { type: 'grassTufts', chance: 0.2, offset: { x: 0, y: -6 }, scale: { x: 0.7, y: 0.7 } }
            ],
            dirt: [
                { type: 'rocks', chance: 0.15, offset: { x: 0, y: -4 }, scale: { x: 0.6, y: 0.6 } }
            ],
            stone: [
                { type: 'rocks', chance: 0.3, offset: { x: 0, y: -4 }, scale: { x: 0.8, y: 0.8 } }
            ]
        };

        // Add structure manager after maps are initialized
        this.structureManager = new StructureManager(this);
        
        // Generate structures last
        if (options.autoGenerateStructures) {
            this.structureManager.generateRandomStructures(options.structureCount || 5);
        }
    }

    determineTileType(height, moisture) {
        if (height < 0.2) return 'water';
        if (height < 0.3) return 'sand';
        if (height < 0.7) {
            if (moisture > 0.6) return 'wetland';
            if (moisture > 0.3) return 'grass';
            return 'dirt';
        }
        return 'stone';
    }

    generateHeight(x, y) {
        // Simple height generation for testing
        return (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.5 + 0.5;
    }

    generateMoisture(x, y) {
        // Simple moisture generation for testing
        return (Math.cos(x * 0.08) + Math.sin(y * 0.08)) * 0.5 + 0.5;
    }

    generateTile(x, y, height, moisture) {
        const key = `${x},${y}`;
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }

        const tile = {
            type: this.determineTileType(height, moisture),
            height: Math.max(0, Math.floor(height * 2)),
            moisture,
            x,
            y,
            id: `tile_${x}_${y}` // Ensure unique tile ID is set
        };

        // Manage cache size
        if (this.tileCache.size >= this.maxCacheSize) {
            const firstKey = this.tileCache.keys().next().value;
            this.tileCache.delete(firstKey);
        }

        this.tileCache.set(key, tile);
        return tile;
    }

    addDecoration(tile) {
        const decorations = this.decorationConfig[tile.type];
        if (!decorations) return null;

        for (const decConfig of decorations) {
            if (Math.random() < decConfig.chance) {
                return {
                    type: decConfig.type,
                    offset: { ...decConfig.offset },
                    scale: { ...decConfig.scale },
                    id: `dec_${tile.id}`
                };
            }
        }
        return null;
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
}












