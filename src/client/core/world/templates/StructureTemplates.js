export const StructureTemplates = {
    apartment: {
        type: 'apartment',
        name: 'Apartment Building',
        width: 3,
        height: 4,
        floors: 4,
        roofType: 'flat',
        material: 'concrete',
        states: {
            lightOn: true,
            doorOpen: false
        },
        blueprint: [
            ['wall', 'wall', 'wall'],
            ['wall', 'floor', 'wall'],
            ['wall', 'floor', 'wall'],
            ['wall', 'door', 'wall']
        ],
        decorations: [
            { type: 'ac_unit', x: 0, y: 1 },
            { type: 'window', x: 1, y: 1 }
        ],
        zone: 'residential'
    },
    office: {
        type: 'office',
        name: 'Office Building',
        width: 4,
        height: 3,
        floors: 3,
        roofType: 'flat',
        material: 'glass',
        states: {
            lightOn: true,
            doorOpen: false
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall']
        ],
        decorations: [
            { type: 'sign', x: 1, y: 0 },
            { type: 'window', x: 2, y: 1 }
        ],
        zone: 'commercial'
    },
    nightclub: {
        type: 'nightclub',
        name: 'Night Club',
        width: 4,
        height: 4,
        floors: 2,
        roofType: 'flat',
        material: 'concrete',
        states: {
            lightOn: true,
            doorOpen: false,
            neonOn: true
        },
        blueprint: [
            ['wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall']
        ],
        decorations: [
            { type: 'neon_sign', x: 1, y: 0 },
            { type: 'window', x: 2, y: 1 },
            { type: 'speaker', x: 0, y: 2 },
            { type: 'speaker', x: 3, y: 2 }
        ],
        zone: 'commercial'
    }
};
