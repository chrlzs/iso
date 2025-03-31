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
     * @param {Object} config - Map configuration
     * @param {number} [config.width=64] - Map width
     * @param {number} [config.height=64] - Map height
     * @param {number} [config.seed=Math.random() * 10000] - Random seed for generation
     * @param {Array<TerrainDefinition>} [config.terrain=[]] - Terrain definitions
     * @param {Array<MapStructure>} [config.structures=[]] - Structure placements
     * @param {Array<Object>} [config.zones=[]] - Zones for urban generation
     * @param {Array<Object>} [config.roads=[]] - Roads definitions
     * @param {Array<Object>} [config.spawnPoints=[]] - Spawn points
     * @param {Array<Object>} [config.landmarks=[]] - Landmarks
     */
    constructor(config) {
        this.width = config.width || 64;
        this.height = config.height || 64;
        this.seed = config.seed || Math.random() * 10000;

        // Static terrain features
        this.terrain = config.terrain || []; // Array of {x, y, type, height, moisture}

        // Static structures
        this.structures = config.structures || []; // Array of {x, y, type}

        // Zones for urban generation
        this.zones = config.zones || []; // Array of {type, x, y, size}

        // Roads
        this.roads = config.roads || []; // Array of {start: {x, y}, end: {x, y}, importance}

        // Special points
        this.spawnPoints = config.spawnPoints || []; // Array of {x, y}
        this.landmarks = config.landmarks || []; // Array of {x, y, type}
    }

    /**
     * Validates the map definition
     */
    validate() {
        // Validation logic here
    }

    /**
     * Creates an empty map definition
     * @param {number} [width=64] - Map width
     * @param {number} [height=64] - Map height
     * @returns {MapDefinition} - New empty map definition
     */
    static createEmpty(width = 64, height = 64) {
        return new MapDefinition({ width, height });
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