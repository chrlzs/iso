
export class World {
    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;
        this.chunkSize = options.chunkSize || 16;
        this.chunks = new Map();
        this.activeChunks = new Set(); // Initialize activeChunks Set
        this.seed = options.seed || Math.random() * 10000;
        
        // Initialize tile cache
        this.tileCache = new Map();
        this.maxCacheSize = 1000; // Adjust this value based on your needs
        
        // Add decoration configuration
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
    }

    generateHeight(x, y) {
        // Simple noise function for height
        return Math.sin(x * 0.1 + this.seed) * Math.cos(y * 0.1 + this.seed) * 2;
    }

    generateMoisture(x, y) {
        // Simple noise function for moisture
        return (Math.sin(x * 0.2 + this.seed * 2) + Math.cos(y * 0.2 + this.seed * 3)) * 0.5 + 0.5;
    }

    generateTile(x, y, height, moisture) {
        const key = `${x},${y}`;
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }

        let type;
        if (height < -0.5) type = 'water';
        else if (height < -0.2) type = 'sand';
        else if (height < 0.2) type = moisture > 0.6 ? 'wetland' : 'grass';
        else if (height < 0.5) type = 'dirt';
        else type = 'stone';

        const tile = {
            type,
            height: Math.max(0, Math.floor(height * 2)),
            moisture,
            x,
            y
        };

        // Add decoration based on tile type
        this.addDecoration(tile);

        console.log('World: Generated tile:', {
            x, y,
            type: tile.type,
            height: tile.height,
            decoration: tile.decoration
        });

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
        if (!decorations) return;

        for (const decConfig of decorations) {
            if (Math.random() < decConfig.chance) {
                tile.decoration = {
                    type: decConfig.type,
                    offset: { ...decConfig.offset },
                    scale: { ...decConfig.scale }
                };
                console.log('World: Added decoration to tile:', {
                    tileType: tile.type,
                    decoration: tile.decoration
                });
                break; // Only add one decoration per tile
            }
        }
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
    }
}







