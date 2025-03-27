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
        ]
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
        material: 'glass',
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
        ]
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
        ]
    }
};
