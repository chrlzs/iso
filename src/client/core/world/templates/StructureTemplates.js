export const StructureTemplates = {
    apartment: {
        type: 'apartment',
        width: 4,
        height: 4,
        floors: 3,
        roofType: 'flat',
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
        width: 6,
        height: 6,
        floors: 4,
        roofType: 'flat',
        material: 'glass',
        states: {
            lightOn: true,
            doorOpen: false
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
    warehouse: {
        type: 'warehouse',
        width: 8,
        height: 8,
        floors: 1,
        roofType: 'industrial',
        material: 'metal',
        states: {
            lightOn: false,
            doorOpen: false
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall', 'wall', 'door', 'door', 'wall']
        ]
    },
    factory: {
        type: 'factory',
        width: 8,
        height: 6,
        floors: 2,
        roofType: 'industrial',
        material: 'metal',
        states: {
            lightOn: true,
            doorOpen: false,
            smokeActive: true
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall', 'wall', 'door', 'door', 'wall']
        ],
        decorations: [
            { type: 'chimney', x: 2, y: 0 },
            { type: 'chimney', x: 6, y: 0 },
            { type: 'window', x: 1, y: 1 },
            { type: 'window', x: 4, y: 1 },
            { type: 'window', x: 7, y: 1 }
        ]
    }
};
