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
        height: 5,
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
        ],
        chimneys: [{
            x: 0.3,    // Left side
            y: 0.6,    // Moved further south
            height: 32,
            width: 14,
            smokeActive: true,
            smokeColor: '#606060',
            smokeRate: 0.4
        },
        {
            x: 0.7,    // Right side
            y: 0.6,    // Moved further south
            height: 32,
            width: 14,
            smokeActive: true,
            smokeColor: '#606060',
            smokeRate: 0.4
        }]
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
    }
};

export const getTemplate = (type) => StructureTemplates[type];
