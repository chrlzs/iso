import { MapDefinition } from './MapDefinition.js';
import { TileManager } from './TileManager.js';
import { Structure } from './Structure.js';
import { StructureTemplates } from './templates/StructureTemplates.js';
import { WorldGenerator } from './WorldGenerator.js';

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
        this.structures = new Map();
        
        // Initialize noise generators with seed if provided
        this.seed = options.mapDefinition?.seed || Math.random() * 10000;
        
        // Initialize WorldGenerator with TileManager
        this.worldGenerator = new WorldGenerator(this.tileManager);
        
        this.initializeGenerators();
        
        // Handle static map definition if provided
        this.mapDefinition = options.mapDefinition;
        this.staticTiles = new Map();
        
        // Initialize structure templates from import
        this.structureTemplates = StructureTemplates;
        
        if (this.mapDefinition) {
            this.initializeFromMapDefinition();
        }
    }

    initializeGenerators() {
        // Initialize height generation function with better scaling
        this.generateHeight = (x, y) => {
            // Adjust the range to produce more land
            const value = this.noise2D(x / 20, y / 20);
            // Scale to ensure more values are above water threshold
            return value * 0.5 + 0.5; // This will give range of 0.5 to 1.0
        };

        // Initialize moisture generation function
        this.generateMoisture = (x, y) => {
            return (this.noise2D((x + 1000) / 30, (y + 1000) / 30) + 1) * 0.5;
        };
    }

    // Improved 2D noise function
    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        // Better noise calculation
        const n = ((X + Y * 16) * 1013) ^ this.seed;
        const value = (((n * n * n * 60493) / 0x7fffffff) % 2147483648) / 2147483648;
        
        return value;
    }

    initializeFromMapDefinition() {
        if (!this.mapDefinition?.structures) return;

        console.log('World: Processing structures:', this.mapDefinition.structures);
        
        this.mapDefinition.structures.forEach(structureDef => {
            const { type, x, y } = structureDef;
            console.log('World: Creating structure:', type, 'at', `(${x}, ${y})`);
            this.createStructure(type, x, y);
        });
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
        // Delegate tile generation to WorldGenerator
        return this.worldGenerator.generateTile(x, y, height, moisture);
    }

    getTileAt(x, y) {
        // First check if there's a static tile defined
        const staticKey = `${x},${y}`;
        if (this.staticTiles.has(staticKey)) {
            return this.staticTiles.get(staticKey);
        }

        // If no static tile, generate one
        const height = this.generateHeight(x, y);
        const moisture = this.generateMoisture(x, y);
        return this.generateTile(x, y, height, moisture);
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
        // Add basic height generation if missing
        if (!this.generateHeight) {
            this.generateHeight = (x, y) => {
                return 0.5; // Default height if no generation function exists
            };
        }
        
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

    createStructure(type, x, y) {
        // Check if coordinates are within map bounds
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            console.warn(`World: Structure position (${x}, ${y}) is outside map bounds (${this.width}x${this.height})`);
            return null;
        }

        if (!type || typeof type !== 'string') {
            console.warn('World: Invalid structure type:', type);
            return null;
        }

        const template = this.structureTemplates[type];
        if (!template) {
            console.warn('World: No template found for structure type:', type);
            return null;
        }

        // Check if structure would extend beyond map bounds
        if (x + template.width > this.width || y + template.height > this.height) {
            console.warn(`World: Structure ${type} at (${x}, ${y}) would extend beyond map bounds`);
            return null;
        }

        // Create structure instance
        const structure = new Structure(template, x, y, this);

        // Add to structures map using coordinates as key
        const key = `${x},${y}`;
        this.structures.set(key, structure);
        
        if (this.debug?.flags?.logStructures) {
            console.log(`World: Created structure: ${type} at (${x}, ${y})`);
        }

        return structure;
    }
}






