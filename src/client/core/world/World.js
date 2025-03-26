import { MapDefinition } from './MapDefinition.js';
import { TileManager } from './TileManager.js';
import { Structure } from './Structure.js';
import { StructureTemplates } from './templates/StructureTemplates.js';
import { WorldGenerator } from './WorldGenerator.js';

export class World {
    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;
        this.debug = options.debug || { flags: {} };
        
        // Initialize chunk system
        this.chunkSize = options.chunkSize || 16;
        this.activeChunks = new Set();
        this.chunks = new Map();
        
        // Calculate chunk dimensions
        this.chunksWidth = Math.ceil(width / this.chunkSize);
        this.chunksHeight = Math.ceil(height / this.chunkSize);
        
        // Initialize structure templates
        this.structureTemplates = { ...StructureTemplates };
        
        // Initialize collections
        this.structures = new Map();
        this.tiles = new Array(width * height).fill(null).map(() => ({
            type: 'grass',
            height: 0.5,
            moisture: 0.5
        }));
        
        // Initialize managers
        this.tileManager = new TileManager(this.debug);
        
        // Initialize world generator
        this.worldGenerator = new WorldGenerator(this.tileManager);
        
        // Set world generation parameters
        this.moistureScale = options.moistureScale || 0.01;
        this.heightScale = options.heightScale || 0.01;
        this.seed = options.seed || Math.random() * 10000;
        
        // Process map definition if provided
        this.mapDefinition = options.mapDefinition;
        if (this.mapDefinition) {
            this.initializeFromMapDefinition();
        }
    }

    updateActiveChunks(centerX, centerY, viewDistance) {
        // Convert world coordinates to chunk coordinates
        const centerChunkX = Math.floor(centerX / this.chunkSize);
        const centerChunkY = Math.floor(centerY / this.chunkSize);

        // Clear previous active chunks
        this.activeChunks.clear();

        // Calculate chunk range to load
        const minChunkX = Math.max(0, centerChunkX - viewDistance);
        const maxChunkX = Math.min(this.chunksWidth - 1, centerChunkX + viewDistance);
        const minChunkY = Math.max(0, centerChunkY - viewDistance);
        const maxChunkY = Math.min(this.chunksHeight - 1, centerChunkY + viewDistance);

        // Add chunks within range to active set
        for (let x = minChunkX; x <= maxChunkX; x++) {
            for (let y = minChunkY; y <= maxChunkY; y++) {
                const chunkKey = `${x},${y}`;
                this.activeChunks.add(chunkKey);

                // Generate chunk if it doesn't exist
                if (!this.chunks.has(chunkKey)) {
                    this.generateChunk(x, y);
                }
            }
        }

        if (this.debug.flags.logChunks) {
            console.log(`Active chunks: ${this.activeChunks.size}`);
        }
    }

    generateChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.chunkSize;
        const worldY = chunkY * this.chunkSize;
        
        // Create chunk data structure
        const chunk = {
            x: chunkX,
            y: chunkY,
            tiles: [],
            entities: new Set()
        };

        // Generate tiles for this chunk
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldTileX = worldX + x;
                const worldTileY = worldY + y;
                
                // Skip if outside world bounds
                if (worldTileX >= this.width || worldTileY >= this.height) {
                    continue;
                }
                
                // Generate or get existing tile
                const tile = this.generateTile(worldTileX, worldTileY);
                chunk.tiles.push(tile);
            }
        }

        // Store chunk
        this.chunks.set(chunkKey, chunk);
        return chunk;
    }

    isChunkActive(chunkX, chunkY) {
        return this.activeChunks.has(`${chunkX},${chunkY}`);
    }

    getChunk(chunkX, chunkY) {
        return this.chunks.get(`${chunkX},${chunkY}`);
    }

    getChunkByWorldCoords(worldX, worldY) {
        const chunkX = Math.floor(worldX / this.chunkSize);
        const chunkY = Math.floor(worldY / this.chunkSize);
        return this.getChunk(chunkX, chunkY);
    }

    generateTile(x, y, height = null, moisture = null) {
        // Check if there's a predefined tile first
        const existingTile = this.getTileAt(x, y);
        if (existingTile && existingTile.type) {
            return existingTile;
        }

        // Generate height and moisture if not provided
        const tileHeight = height !== null ? height : this.generateHeight(x, y);
        const tileMoisture = moisture !== null ? moisture : this.generateMoisture(x, y);

        // Use WorldGenerator to create the tile
        return this.worldGenerator.generateTile(x, y, tileHeight, tileMoisture);
    }

    getTileAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y * this.width + x];
    }

    setTileAt(x, y, tile) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        this.tiles[y * this.width + x] = tile;
        return true;
    }

    generateMoisture(x, y) {
        // Check if there's a predefined tile first
        const tile = this.getTileAt(x, y);
        if (tile && tile.moisture !== undefined) {
            return tile.moisture;
        }

        // Generate moisture based on distance from water bodies and height
        const height = this.generateHeight(x, y);
        
        // Base moisture decreases with height
        let moisture = 1 - (height * 0.5);
        
        // Add some variation based on position
        moisture += Math.sin(x * this.moistureScale + this.seed) * 0.1;
        moisture += Math.cos(y * this.moistureScale + this.seed) * 0.1;
        
        // Ensure moisture stays within valid range
        return Math.max(0, Math.min(1, moisture));
    }

    generateHeight(x, y) {
        // Check if there's a predefined tile first
        const tile = this.getTileAt(x, y);
        if (tile && tile.height !== undefined) {
            return tile.height;
        }

        // Generate height using multiple noise functions for more natural terrain
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Base height decreases from center
        const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        let height = Math.max(0.1, 1 - (distanceFromCenter / (this.width / 2)));
        
        // Add some variation based on position
        height += Math.sin(x * this.heightScale + this.seed) * 0.1;
        height += Math.cos(y * this.heightScale + this.seed) * 0.1;
        
        // Ensure height stays within valid range
        return Math.max(0, Math.min(1, height));
    }

    initializeFromMapDefinition() {
        if (!this.mapDefinition) return;

        // Initialize terrain
        if (this.mapDefinition.terrain) {
            this.mapDefinition.terrain.forEach(terrain => {
                this.setTileAt(terrain.x, terrain.y, {
                    type: terrain.type,
                    height: terrain.height,
                    moisture: terrain.moisture
                });
            });
        }

        // Initialize structures
        if (this.mapDefinition.structures) {
            console.log('World: Processing structures:', this.mapDefinition.structures);
            
            this.mapDefinition.structures.forEach(structureDef => {
                const { type, x, y } = structureDef;
                console.log('World: Creating structure:', type, 'at', `(${x}, ${y})`);
                this.createStructure(type, x, y);
            });
        }
    }

    createStructure(type, x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            console.warn(`World: Structure position (${x}, ${y}) is outside map bounds`);
            return null;
        }

        const template = this.structureTemplates[type];
        if (!template) {
            console.warn(`World: No template found for structure type: ${type}`);
            return null;
        }

        if (this.debug?.flags?.logStructures) {
            console.log('World: Available structure templates:', 
                Object.keys(this.structureTemplates));
        }

        try {
            const structure = new Structure(template, x, y, this);
            const key = `${x},${y}`;
            this.structures.set(key, structure);
            return structure;
        } catch (error) {
            console.error(`World: Failed to create structure ${type} at (${x}, ${y}):`, error);
            return null;
        }
    }

    setTileType(x, y, type) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const tile = this.getTileAt(x, y);
        if (tile) {
            tile.type = type;
            // Trigger any necessary updates or redraws
            this.onTileChanged?.(x, y);
        }
    }

    setTileHeight(x, y, height) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const tile = this.getTileAt(x, y);
        if (tile) {
            tile.height = Math.max(0, Math.min(1, height));
            this.onTileChanged?.(x, y);
        }
    }

    setTileMoisture(x, y, moisture) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const tile = this.getTileAt(x, y);
        if (tile) {
            tile.moisture = Math.max(0, Math.min(1, moisture));
            this.onTileChanged?.(x, y);
        }
    }
}













