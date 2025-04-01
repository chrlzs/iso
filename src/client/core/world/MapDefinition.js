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
        this.structures = [];
        this.decorations = [];
        this.spawnPoints = [];
    }

    /**
     * Sets tile data at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} data - Tile data
     */
    setTile(x, y, data) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y * this.width + x] = data;
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

    /**
     * Adds a new structure to the map
     * @param {MapStructure} structure - Structure configuration
     * @returns {void}
     */
    addStructure(structure) {
        this.structures.push(structure);
    }

    /**
     * Adds a new decoration to the map
     * @param {Object} decoration - Decoration configuration
     * @returns {void}
     */
    addDecoration(decoration) {
        this.decorations.push(decoration);
    }

    /**
     * Adds a new zone to the map
     * @param {ZoneDefinition} zone - Zone configuration
     * @returns {void}
     */
    addZone(zone) {
        this.zones.push(zone);
    }

    /**
     * Adds a new landmark to the map
     * @param {LandmarkDefinition} landmark - Landmark configuration
     * @returns {void}
     */
    addLandmark(landmark) {
        this.landmarks.push(landmark);
    }

    /**
     * Adds a road to the map
     * @param {RoadDefinition} road - Road configuration
     * @returns {void}
     */
    addRoad(road) {
        this.roads.push(road);
    }
}