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
        this.tiles = new Array(width * height);
        this.structures = new Map();
        this.decorations = [];
        this.spawnPoints = [];
    }

    addStructure(structureData) {
        const { x, y, width = 1, height = 1, type } = structureData;
        const key = `${x},${y}`;
        
        // Create structure object
        const structure = {
            ...structureData,
            id: `${type}_${x}_${y}`,
            width: width,
            height: height
        };

        // Add to structures Map
        this.structures.set(key, structure);

        // Update tiles covered by the structure
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.setTile(x + dx, y + dy, {
                    type: 'building',
                    height: 1,
                    moisture: 0.5,
                    structure: structure
                });
            }
        }

        return structure;
    }

    addTree(x, y) {
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

        // Set tile type
        this.setTile(x, y, {
            type: 'tree',
            height: 1,
            moisture: 0.5,
            structure: treeStructure
        });

        return treeStructure;
    }

    /**
     * Sets tile data at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} data - Tile data
     */
    setTile(x, y, tileData) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y * this.width + x] = tileData;
        }
    }

    /**
     * Gets tile data at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} - Tile data or null if out of bounds
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y * this.width + x];
        }
        return null;
    }

    getAllStructures() {
        return Array.from(this.structures.values());
    }

    getStructureAt(x, y) {
        const key = `${x},${y}`;
        return this.structures.get(key) || null;
    }
}


