/**
 * @typedef {Object} RoofConfig
 * @property {string} style - Roof style (flat, gabled, clerestory)
 * @property {string} color - Roof color in hex or CSS color
 * @property {number} height - Roof height in pixels
 * @property {number} [angle] - Roof angle in degrees for sloped roofs
 * @property {string} [baseColor] - Base color for complex roofs
 * @property {string} [overlapColor] - Secondary color for complex roofs
 * @property {number} [overlapHeight] - Height of secondary roof section
 * @property {number} [overlapWidth] - Width of secondary roof section
 * @property {number} [overlapExtend] - Overhang amount for roof sections
 */

/**
 * @typedef {Object} ChimneyConfig
 * @property {number} x - Relative X position (0-1)
 * @property {number} y - Relative Y position (0-1)
 * @property {number} height - Chimney height in pixels
 * @property {number} width - Chimney width in pixels
 * @property {boolean} smokeActive - Whether chimney produces smoke
 * @property {string} smokeColor - Smoke particle color
 * @property {number} smokeRate - Smoke emission rate
 */

/**
 * @typedef {Object} StructureTemplate
 * @property {string} type - Structure type identifier
 * @property {number} width - Structure width in tiles
 * @property {number} height - Structure height in tiles
 * @property {number} floors - Number of floors
 * @property {string} roofType - Type of roof
 * @property {RoofConfig} roofConfig - Roof configuration
 * @property {string} material - Building material
 * @property {Object.<string, boolean>} states - Structure states
 * @property {Array<Array<string>>} blueprint - Structure blueprint
 * @property {Array<ChimneyConfig>} [chimneys] - Chimney configurations
 * @property {string} [zone] - Zone type (residential, commercial, etc)
 * @property {string} [name] - Structure display name
 */

/**
 * @type {Object.<string, StructureTemplate>}
 */
export const StructureTemplates = {
    apartment: {
        type: 'apartment',
        width: 4,
        height: 4,
        floors: 3,
        roofType: 'flat',
        roofConfig: {
            style: 'flat',
            color: '#8B4513',
            height: 0
        },
        material: 'concrete',
        states: {
            lightOn: false,
            doorOpen: false
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall']
        ],
        chimneys: [{
            x: 0.5,    // Center of the building
            y: 0.6,    // Moved further south
            height: 24,
            width: 10,
            smokeActive: true,
            smokeColor: '#707070',
            smokeRate: 0.3
        }]
    },
    office: {
        type: 'office',
        width: 5,
        height: 5,  // Changed from 6 to match blueprint
        floors: 4,
        roofType: 'flat',
        roofConfig: {
            style: 'flat',
            color: '#696969',
            height: 0
        },
        material: 'brick',
        states: {
            lightOn: false
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'door', 'wall']
        ]
    },
    warehouse: {
        type: 'warehouse',
        width: 6,
        height: 4,
        floors: 1,
        roofType: 'sloped',
        roofConfig: {
            style: 'gabled',
            color: '#8B0000',
            height: 48,  // Increased for more prominent roof
            angle: 45
        },
        material: 'metal',
        states: {
            doorOpen: false
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'door', 'door', 'wall']
        ],
        chimneys: [{
            x: 0.4,    // Left of center
            y: 0.7,    // Moved further south
            height: 36,
            width: 16,
            smokeActive: true,
            smokeColor: '#505050',
            smokeRate: 0.6
        }]
    },
    factory: {
        type: 'factory',
        width: 8,
        height: 6,
        floors: 2,
        roofType: 'clerestory',
        roofConfig: {
            style: 'clerestory',
            baseColor: '#4A4A4A',     // Main structure color
            overlapColor: '#363636',   // Top angled roof color
            height: 48,               // Base roof height
            overlapHeight: 40,        // Height of clerestory section (increased)
            overlapWidth: 0.7,        // Width of raised section (70% of building)
            overlapExtend: 0.3        // Roof overhang amount
        },
        material: 'concrete',
        states: {
            active: false
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'door', 'door', 'door', 'door', 'wall']
        ],
        chimneys: [{
            x: 0.7,    // Moved more to the right
            y: 0.6,    // Moved further south
            height: 48, // Made taller
            width: 24,  // Made wider
            smokeActive: true,
            smokeColor: '#666666',
            smokeRate: 1.0
        }]
    },
    dumpster: {
        type: 'dumpster',
        width: 1,
        height: 1,
        floors: 1,
        material: 'metal',
        states: {
            isOpen: false
        },
        blueprint: [
            ['dumpster']
        ]
    },
    tree: {
        type: 'tree',
        width: 1,
        height: 1,
        floors: 1,
        material: 'organic',
        states: {
            swaying: false,  // Could be used for wind animation
            season: 'summer' // Could be used for seasonal variations
        },
        blueprint: [
            ['tree']
        ]
    },
    bush: {
        type: 'bush',
        width: 1,
        height: 1,
        floors: 1,
        material: 'organic',
        states: {
            swaying: false,  // Could be used for wind animation
            trimmed: true    // Could be used for maintenance state
        },
        blueprint: [
            ['bush']
        ]
    },
    nightclub: {
        type: 'nightclub',
        width: 6,
        height: 6,
        floors: 2,
        roofType: 'flat',
        roofConfig: {
            style: 'flat',
            color: '#404040',
            height: 0
        },
        material: 'concrete',
        states: {
            lightOn: false,
            musicPlaying: false
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'door', 'door', 'wall']
        ]
    },
    laboratory: {
        type: 'laboratory',
        width: 8,
        height: 6,
        floors: 1,
        roofType: 'flat',
        roofConfig: {
            style: 'flat',
            color: '#FFFFFF',
            height: 0
        },
        material: 'metal',
        states: {
            lightOn: false,
            securityActive: true
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall', 'wall', 'door', 'door', 'wall']
        ]
    }
};

/**
 * Gets a structure template by type
 * @param {string} type - Structure type identifier
 * @returns {StructureTemplate|undefined} Structure template or undefined if not found
 */
export const getTemplate = (type) => StructureTemplates[type];

/**
 * Checks if a template exists
 * @param {string} type - Structure type identifier
 * @returns {boolean} True if template exists
 */
export const hasTemplate = (type) => type in StructureTemplates;
