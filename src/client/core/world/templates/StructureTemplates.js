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
        width: 5,
        height: 5,
        floors: 4,
        roofType: 'flat',
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
        roofType: 'flat',
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
