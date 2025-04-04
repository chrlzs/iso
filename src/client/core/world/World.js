import { MapDefinition } from './MapDefinition.js';
import { TileManager } from './TileManager.js';
import { Structure } from './Structure.js';
import { StructureTemplates } from './templates/StructureTemplates.js';
import { WorldGenerator } from './WorldGenerator.js';
import { createDemoMap } from './templates/DemoMap.js';

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
 * @typedef {Object} WorldSimulationState
 * @property {number} timeOfDay - Current time of day (0-24)
 * @property {number} dayOfYear - Current day of year
 * @property {Object} weather - Current weather state
 * @property {Set<string>} activeEffects - Active world effects
 */

/**
 * @typedef {Object} WorldUpdateEvent
 * @property {string} type - Event type
 * @property {Object} data - Event data
 * @property {Function} handle - Event handler
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
     * @param {GameInstance} [options.game] - Reference to the game instance
     */
    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;
        this.debug = options.debug || { flags: {} };
        this.game = options.game; // Store reference to game instance

        // Initialize chunk system
        this.chunkSize = options.chunkSize || 16;
        this.activeChunks = new Set();
        this.chunks = new Map();

        // Calculate chunk dimensions
        this.chunksWidth = Math.ceil(width / this.chunkSize);
        this.chunksHeight = Math.ceil(height / this.chunkSize);

        // Initialize structure templates with validation
        if (!StructureTemplates) {
            console.error('StructureTemplates is undefined!');
            throw new Error('Failed to load structure templates');
        }

        this.structureTemplates = StructureTemplates;

        // Validate structure templates
        Object.entries(this.structureTemplates).forEach(([type, template]) => {
            if (!template.blueprint) {
                console.error(`Template ${type} missing blueprint:`, template);
            }
            if (!Array.isArray(template.blueprint)) {
                console.error(`Template ${type} blueprint is not an array:`, template);
            }
        });

        // Initialize collections
        this.structures = new Map();
        this.tiles = new Array(width * height).fill(null).map(() => ({
            type: 'grass',
            height: 0.5,
            moisture: 0.5
        }));
        this.npcs = []; // Array to store NPC definitions

        // Initialize managers
        this.tileManager = new TileManager(this.debug);

        // Initialize world generator
        this.worldGenerator = new WorldGenerator(this.tileManager);

        // Set world generation parameters
        this.moistureScale = options.moistureScale || 0.01;
        this.heightScale = options.heightScale || 0.01;
        this.seed = options.seed || Math.random() * 10000;

        // Load demo map by default if no map definition is provided
        this.mapDefinition = options.mapDefinition || createDemoMap();
        this.initializeFromMapDefinition(this.mapDefinition);

        // Debug logging for map initialization
        if (this.debug?.flags?.logMapInit) {
            console.log('World initialized with map:', {
                width: this.width,
                height: this.height,
                structures: this.structures.size,
                zones: this.mapDefinition.zones.length,
                landmarks: this.mapDefinition.landmarks.length
            });
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
     * @param {MapDefinition} mapDefinition - Map definition to initialize from
     */
    initializeFromMapDefinition(mapDefinition) {
        console.log('Initializing world from map definition:', mapDefinition);
        this.mapDefinition = mapDefinition;

        // Load all tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileData = mapDefinition.getTile(x, y);
                if (tileData) {
                    this.setTileAt(x, y, tileData);
                    console.log(`Set tile at ${x},${y}:`, tileData);
                }
            }
        }

        // Load structures after tiles
        if (mapDefinition.structures) {
            console.log('Loading structures:', mapDefinition.structures);
            mapDefinition.structures.forEach(struct => {
                this.createStructure(struct.type, struct.x, struct.y, struct);
            });
        }

        // Store NPCs from map definition for later instantiation by the game instance
        if (mapDefinition.npcs && mapDefinition.npcs.length > 0) {
            console.log(`Map contains ${mapDefinition.npcs.length} NPCs:`, mapDefinition.npcs);
            this.npcs = mapDefinition.npcs;
        } else {
            this.npcs = [];
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
        console.log('Creating structure:', { type, x, y, options });
        try {
            const template = this.structureTemplates[type];
            console.log('Template found:', template);

            // Deep merge template with options, prioritizing options over template
            const mergedTemplate = {
                ...template,
                ...options,  // This ensures options override template values
                roofConfig: {
                    ...template?.roofConfig,
                    ...(options.roofConfig || {})
                },
                states: {
                    ...template?.states,
                    ...(options.states || {})
                }
            };

            console.log('Merged template:', mergedTemplate);

            const structure = new Structure(mergedTemplate, x, y, this);
            const key = `${x},${y}`;
            this.structures.set(key, structure);

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

    /**
     * Checks if a chunk is active (loaded and visible)
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {boolean} True if the chunk is active
     */
    isChunkActive(chunkX, chunkY) {
        // If we don't have chunk management yet, consider all chunks active
        if (!this.chunks) {
            return true;
        }

        // Check if the chunk exists in our chunks map
        const chunkKey = `${chunkX},${chunkY}`;
        return this.chunks.has(chunkKey);
    }

    /**
     * Debug method to inspect tile at position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {Object} Tile debug information
     */
    debugTileAt(x, y) {
        const tile = this.getTileAt(x, y);
        if (!tile) return null;

        return {
            tile,
            typeInfo: this.tileManager.getTileTypeInfo(tile.type),
            texture: this.tileManager.getTexture(tile.type, tile.variant),
            structure: this.getStructureAt(x, y)
        };
    }

    addTree(x, y) {
        // Check if the chunk containing this tree is active
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);

        // Only log if debug flag is enabled
        if (this.game?.debug?.flags?.logStructures) {
            console.log('Adding tree at:', x, y, 'in chunk:', chunkX, chunkY);
        }

        // Check if the tree is in an active chunk
        if (!this.isChunkActive(chunkX, chunkY)) {
            if (this.game?.debug?.flags?.logStructures) {
                console.log(`Skipping tree at ${x},${y} - chunk ${chunkX},${chunkY} is not active`);
            }
            return null;
        }

        // Check for existing structures at this location
        const existingStructure = this.getStructureAt(x, y);
        if (existingStructure) {
            if (this.game?.debug?.flags?.logWarnings) {
                console.warn(`Cannot add tree at ${x},${y} - location already has a structure`);
            }
            return null;
        }

        const treeStructure = {
            type: 'tree',
            template: {
                type: 'tree',
                width: 1,
                height: 1,
                floors: 1,
                material: 'organic'
            },
            x: x,
            y: y,
            width: 1,
            height: 1,
            rotation: 0,
            id: `tree_${x}_${y}`
        };

        // Add to structures Map using coordinates as key
        const key = `${x},${y}`;
        this.structures.set(key, treeStructure);

        // Only log if debug flag is enabled
        if (this.game?.debug?.flags?.logStructures) {
            console.log('Added tree structure at:', x, y);
        }

        // Set tile type
        this.setTileAt(x, y, {
            type: 'tree',
            height: 1,
            moisture: 0.5,
            structure: treeStructure // Reference the structure in the tile
        });

        return treeStructure;
    }

    setTileAt(x, y, tileData) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            console.warn('Attempted to set tile outside world bounds:', x, y);
            return;
        }

        const index = y * this.width + x;
        this.tiles[index] = {
            ...this.tiles[index],
            ...tileData
        };

        console.log(`Set tile at ${x},${y}:`, this.tiles[index]);
    }
}


























