import { MapDefinition } from './MapDefinition.js';
import { TileManager } from './TileManager.js';
import { Structure } from './Structure.js';
import { StructureTemplates } from './templates/StructureTemplates.js';
import { WorldGenerator } from './WorldGenerator.js';

/**
 * Represents the game world and manages world state
 * @class World
 * @property {number} width - World width in tiles
 * @property {number} height - World height in tiles
 * @property {number} chunkSize - Size of each chunk
 * @property {Map<string, Chunk>} chunks - Map of loaded chunks
 * @property {Set<string>} activeChunks - Set of active chunk IDs
 * @property {Object} debug - Debug configuration
 * @property {Map<string, Structure>} structures - Map of world structures
 * @property {TileManager} tileManager - Tile management system
 * @property {WorldGenerator} worldGenerator - World generation system
 * @property {MapDefinition} [mapDefinition] - Static map definition
 */

/**
 * @typedef {Object} Chunk
 * @property {number} x - Chunk X coordinate
 * @property {number} y - Chunk Y coordinate
 * @property {Array<Tile>} tiles - Tiles in this chunk
 * @property {Set<Entity>} entities - Entities in this chunk
 */

/**
 * @typedef {Object} Tile
 * @property {string} type - Tile type identifier
 * @property {number} height - Terrain height (0-1)
 * @property {number} moisture - Moisture level (0-1)
 * @property {Structure} [structure] - Structure on this tile
 * @property {string} [originalType] - Original tile type before modification
 */

/**
 * @typedef {Object} WorldError
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} [details] - Additional error details
 * @property {Object} [context] - Error context data
 */

/**
 * @typedef {Object} WorldEvent
 * @property {string} type - Event type (tile.changed, chunk.loaded, etc)
 * @property {Object} data - Event data
 * @property {number} timestamp - Event timestamp
 */

/**
 * Represents the game world and manages world state
 * @class World
 * @property {number} width - World width in tiles
 * @property {number} height - World height in tiles
 * @property {number} chunkSize - Size of each chunk
 * @property {Map<string, Chunk>} chunks - Map of loaded chunks
 * @property {Set<string>} activeChunks - Set of active chunk IDs
 */
export class World {
    /**
     * Creates a new World instance
     * @param {number} width - World width in tiles
     * @param {number} height - World height in tiles  
     * @param {Object} [options={}] - World configuration options
     * @param {number} [options.chunkSize=16] - Size of each chunk
     * @param {Object} [options.debug] - Debug configuration
     * @param {MapDefinition} [options.mapDefinition] - Static map definition
     */
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
        this.structureTemplates = StructureTemplates;
        
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

    /**
     * Updates active chunks based on player position
     * @param {number} centerX - Center X coordinate in chunks
     * @param {number} centerY - Center Y coordinate in chunks
     * @param {number} viewDistance - View distance in chunks
     */
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

    /**
     * Generates a new chunk at specified coordinates
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {Object} Generated chunk data
     */
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

    /**
     * Checks if a chunk is currently active
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {boolean} True if chunk is active
     */
    isChunkActive(chunkX, chunkY) {
        return this.activeChunks.has(`${chunkX},${chunkY}`);
    }

    /**
     * Gets chunk at specified coordinates
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {Object|null} Chunk data or null if not found
     */
    getChunk(chunkX, chunkY) {
        return this.chunks.get(`${chunkX},${chunkY}`);
    }

    /**
     * Gets chunk by world coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object|null} Chunk data or null if not found
     */
    getChunkByWorldCoords(worldX, worldY) {
        const chunkX = Math.floor(worldX / this.chunkSize);
        const chunkY = Math.floor(worldY / this.chunkSize);
        return this.getChunk(chunkX, chunkY);
    }

    /**
     * Generates a tile at specified coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} [height] - Optional height value
     * @param {number} [moisture] - Optional moisture value
     * @returns {Object} Generated tile data
     */
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

    /**
     * Gets tile at specified coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {Object|null} Tile data or null if out of bounds
     */
    getTileAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y * this.width + x];
    }

    /**
     * Sets tile at specified coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {Object} tile - Tile data to set
     * @returns {boolean} True if successful
     */
    setTileAt(x, y, tile) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        this.tiles[y * this.width + x] = tile;
        return true;
    }

    /**
     * Generates moisture value for coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {number} Moisture value between 0 and 1
     */
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

    /**
     * Generates height value for coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {number} Height value between 0 and 1
     */
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

    /**
     * Initializes world from map definition
     * @private
     */
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
                const { type, x, y, ...options } = structureDef;
                console.log('World: Creating structure:', type, 'at', `(${x}, ${y})`, 'with options:', options);
                this.createStructure(type, x, y, options);
            });
        }
    }

    /**
     * Creates a structure in the world
     * @param {string} type - Structure type
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {Object} [options={}] - Structure options
     * @returns {Structure|null} Created structure or null if failed
     */
    createStructure(type, x, y, options = {}) {
        const template = this.structureTemplates[type];
        if (!template) return null;

        try {
            // Deep merge template with options, prioritizing options over template
            const mergedTemplate = {
                ...template,
                ...options,  // This ensures options override template values
                roofConfig: {
                    ...template.roofConfig,
                    ...(options.roofConfig || {})
                },
                states: {
                    ...template.states,
                    ...(options.states || {})
                }
            };

            const structure = new Structure(mergedTemplate, x, y, this);
            const key = `${x},${y}`;
            this.structures.set(key, structure);
            
            console.log(`Structure created:`, {
                type,
                material: mergedTemplate.material,
                originalMaterial: template.material
            });
            
            return structure;
        } catch (error) {
            console.error(`World: Failed to create structure ${type} at (${x}, ${y}):`, error);
            return null;
        }
    }

    /**
     * Sets the type of a tile at specified coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {string} type - New tile type
     * @returns {void}
     */
    setTileType(x, y, type) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const tile = this.getTileAt(x, y);
        if (tile) {
            // Store previous type if setting a door tile
            if (type === 'door' && !tile.originalType) {
                tile.originalType = tile.type;
            }
            tile.type = type;
            // Trigger any necessary updates or redraws
            this.onTileChanged?.(x, y);
        }
    }

    /**
     * Sets the height value of a tile at specified coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} height - New height value (0-1)
     * @returns {void}
     */
    setTileHeight(x, y, height) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const tile = this.getTileAt(x, y);
        if (tile) {
            tile.height = Math.max(0, Math.min(1, height));
            this.onTileChanged?.(x, y);
        }
    }

    /**
     * Sets the moisture value of a tile at specified coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} moisture - New moisture value (0-1)
     * @returns {void}
     */
    setTileMoisture(x, y, moisture) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const tile = this.getTileAt(x, y);
        if (tile) {
            tile.moisture = Math.max(0, Math.min(1, moisture));
            this.onTileChanged?.(x, y);
        }
    }

    /**
     * Gets a structure at specified coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {Structure|null} Structure at coordinates or null if none exists
     */
    getStructureAt(x, y) {
        const key = `${x},${y}`;
        return this.structures.get(key) || null;
    }

    /**
     * Gets all structures in the world
     * @returns {Structure[]} Array of all structures
     */
    getAllStructures() {
        return Array.from(this.structures.values());
    }
}



















