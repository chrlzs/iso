export const StructureTemplates = {
    skyscraper: {
        type: 'skyscraper',
        name: 'Modern Skyscraper',
        width: 5,
        height: 6,
        floors: 15,
        roofType: 'flat',
        material: 'glass',
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'door', 'wall']
        ],
        zone: 'commercial'
    },
    apartment: {
        type: 'apartment',
        name: 'Urban Apartment',
        width: 4,
        height: 4,
        floors: 4,
        roofType: 'flat',
        material: 'brick',
        blueprint: [
            ['wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall']
        ],
        zone: 'residential'
    },
    store: {
        type: 'store',
        name: 'Retail Store',
        width: 4,
        height: 3,
        floors: 1,
        roofType: 'flat',
        material: 'concrete',
        blueprint: [
            ['wall', 'wall', 'wall', 'wall'],
            ['window', 'door', 'door', 'window'],
            ['wall', 'wall', 'wall', 'wall']
        ],
        zone: 'commercial'
    },
    factory: {
        type: 'factory',
        name: 'Industrial Factory',
        width: 6,
        height: 5,
        floors: 2,
        roofType: 'industrial',
        material: 'metal',
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'door', 'door', 'wall']
        ],
        zone: 'industrial'
    },
    house: {
        type: 'house',
        name: 'Urban House',
        width: 3,
        height: 3,
        floors: 2,
        roofType: 'pitched',
        material: 'wood',
        blueprint: [
            ['wall', 'wall', 'wall'],
            ['window', 'door', 'window'],
            ['wall', 'wall', 'wall']
        ],
        zone: 'residential'
    },
    park: {
        type: 'park',
        name: 'City Park',
        width: 4,
        height: 4,
        floors: 1,
        roofType: 'none',
        material: 'nature',
        blueprint: [
            ['grass', 'grass', 'grass', 'grass'],
            ['grass', 'path', 'path', 'grass'],
            ['grass', 'path', 'path', 'grass'],
            ['grass', 'grass', 'grass', 'grass']
        ],
        zone: 'park'
    },
    nightclub: {
        type: 'nightclub',
        name: 'Neon Nightclub',
        width: 5,
        height: 6,
        floors: 2,
        roofType: 'flat',
        material: 'metal',
        blueprint: [
            ['wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'door', 'wall']
        ],
        decorations: [
            { type: 'sign', x: 1, y: 0 },
            { type: 'sign', x: 2, y: 0 },
            { type: 'sign', x: 3, y: 0 },
            { type: 'window', x: 0, y: 1 },
            { type: 'window', x: 4, y: 1 },
            { type: 'window', x: 0, y: 3 },
            { type: 'window', x: 4, y: 3 },
            { type: 'ac_unit', x: 0, y: 0 },
            { type: 'ac_unit', x: 4, y: 0 }
        ],
        textures: {
            wall: 'metal',
            floor: 'neon',
            door: 'security'
        },
        zone: 'commercial'
    },
    office: {
        type: 'office',
        name: 'Office Building',
        width: 4,
        height: 5,
        floors: 3,
        roofType: 'flat',
        material: 'concrete',
        blueprint: [
            ['wall', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'wall'],
            ['wall', 'door', 'door', 'wall']
        ],
        decorations: [
            { type: 'sign', x: 1, y: 0 },
            { type: 'window', x: 2, y: 1 }
        ],
        textures: {
            wall: 'concrete',
            floor: 'tiles',
            door: 'metal'
        },
        zone: 'commercial'
    }
};
