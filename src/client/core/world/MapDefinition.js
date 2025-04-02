/**
 * @typedef {Object} TerrainDefinition
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {string} type - Terrain type
 * @property {number} height - Terrain height
 * @property {number} moisture - Moisture level
 */

/**
 * @typedef {Object} MapStructure
 * @property {string} type - Structure type
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {Object} [options] - Structure options
 */

/**
 * @typedef {Object} ZoneDefinition
 * @property {string} type - Zone type (residential, commercial, industrial)
 * @property {number} x - Zone center X coordinate
 * @property {number} y - Zone center Y coordinate
 * @property {number} radius - Zone radius in tiles
 * @property {number} density - Development density (0-1)
 * @property {Object} [restrictions] - Building restrictions
 */

/**
 * @typedef {Object} LandmarkDefinition
 * @property {string} type - Landmark type
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {string} name - Landmark name
 * @property {Object} [properties] - Additional properties
 */

/**
 * @typedef {Object} RoadDefinition
 * @property {Point} start - Starting point
 * @property {Point} end - Ending point
 * @property {number} importance - Road importance (0-1)
 * @property {string} type - Road type (highway, street, path)
 * @property {number} [width=1] - Road width in tiles
 */

/**
 * @typedef {Object} Point
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} PathSystem
 * @property {Array<RoadDefinition>} roads - Road definitions
 * @property {Array<PathNode>} nodes - Path nodes
 * @property {Function} findPath - Pathfinding function
 */

/**
 * @typedef {Object} PathNode
 * @property {Point} position - Node position
 * @property {Array<string>} connections - Connected node IDs
 * @property {string} type - Node type (intersection, endpoint)
 */

/**
 * @typedef {Object} Region
 * @property {string} id - Region identifier
 * @property {Array<Point>} bounds - Region boundary points
 * @property {string} type - Region type
 * @property {Object} properties - Region properties
 */

/**
 * Map definition for static world generation
 * @class MapDefinition
 */
export class MapDefinition {
    /**
     * Creates a new map definition
     * @param {number} width - Map width
     * @param {number} height - Map height
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = new Array(width * height).fill(null).map(() => ({}));
        this.structures = new Map();
        this.decorations = [];
        this.spawnPoints = [{x: Math.floor(width/2), y: Math.floor(height/2)}];
        this.npcs = []; // Array to store NPC definitions
    }

    addStructure(structureData) {
        const { x, y, width = 1, height = 1, type, options = {} } = structureData;
        const key = `${x},${y}`;

        // Create structure object with all necessary properties
        const structure = {
            ...structureData,
            id: `${type}_${x}_${y}`,
            width: width,
            height: height,
            template: {
                type,
                ...options
            }
        };

        // Add to structures Map
        this.structures.set(key, structure);

        // Update tiles covered by the structure
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tile = this.getTile(x + dx, y + dy);
                if (tile) {
                    tile.structure = structure;
                    tile.type = 'building';
                }
            }
        }

        return structure;
    }

    addTree(x, y) {
        // CRITICAL: Check if the tile is already a building before adding a tree
        const existingTile = this.getTile(x, y);
        if (existingTile && (existingTile.type === 'building' || existingTile.structure)) {
            console.warn(`Cannot add tree at ${x},${y} - tile is already a building or has a structure`);
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

        // Set tile type - preserve existing tile properties if they exist
        const newTileData = {
            ...existingTile,
            type: 'tree',
            height: existingTile?.height || 1,
            moisture: existingTile?.moisture || 0.5,
            structure: treeStructure
        };

        this.setTile(x, y, newTileData);
        console.log(`Added tree at ${x},${y}`);

        return treeStructure;
    }

    /**
     * Sets tile data at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} data - Tile data
     */
    setTile(x, y, data) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        this.tiles[y * this.width + x] = data;
    }

    /**
     * Gets tile data at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} - Tile data or null if out of bounds
     */
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.tiles[y * this.width + x];
    }

    getAllStructures() {
        return Array.from(this.structures.values());
    }

    getStructureAt(x, y) {
        const key = `${x},${y}`;
        return this.structures.get(key) || null;
    }

    /**
     * Adds an NPC definition to the map
     * @param {Object} npcData - NPC configuration data
     * @returns {Object} The added NPC definition
     */
    addNPC(npcData) {
        // Add a unique ID if not provided
        if (!npcData.id) {
            npcData.id = `npc_${this.npcs.length}`;
        }

        // Add the NPC to the array
        this.npcs.push(npcData);

        return npcData;
    }
}



