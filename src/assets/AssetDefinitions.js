/**
 * AssetDefinitions.js
 * Defines all placeable assets for the map editor
 */

/**
 * Asset categories for the building mode
 */
export const ASSET_CATEGORIES = {
    TERRAIN: 'terrain',
    ENVIRONMENT: 'environment',
    INFRASTRUCTURE: 'infrastructure',
    BUILDINGS: 'buildings',
    CHARACTERS: 'characters',
    PROPS: 'props'
};

/**
 * Asset definitions for all placeable objects
 * Each asset has:
 * - id: Unique identifier
 * - name: Display name
 * - category: Asset category
 * - description: Short description
 * - texture: Texture name or function to generate texture
 * - width: Width in grid cells
 * - height: Height in grid cells
 * - walkable: Whether entities can walk on/through this asset
 * - solid: Whether this asset blocks movement
 * - interactive: Whether this asset can be interacted with
 * - placementRules: Special rules for placement (function)
 */
export const ASSETS = [
    // Terrain
    {
        id: 'grass',
        name: 'Grass',
        category: ASSET_CATEGORIES.TERRAIN,
        description: 'Basic grass terrain',
        texture: 'grass',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        isTerrain: true,
        elevation: 0
    },
    {
        id: 'dirt',
        name: 'Dirt',
        category: ASSET_CATEGORIES.TERRAIN,
        description: 'Basic dirt terrain',
        texture: 'dirt',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        isTerrain: true,
        elevation: 0
    },
    {
        id: 'sand',
        name: 'Sand',
        category: ASSET_CATEGORIES.TERRAIN,
        description: 'Sandy terrain',
        texture: 'sand',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        isTerrain: true,
        elevation: 0
    },
    {
        id: 'stone',
        name: 'Stone',
        category: ASSET_CATEGORIES.TERRAIN,
        description: 'Stone terrain',
        texture: 'stone',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        isTerrain: true,
        elevation: 0
    },
    {
        id: 'water',
        name: 'Water',
        category: ASSET_CATEGORIES.TERRAIN,
        description: 'Water terrain (not walkable)',
        texture: 'water',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: false,
        isTerrain: true,
        elevation: -1
    },
    {
        id: 'elevated',
        name: 'Elevated Terrain',
        category: ASSET_CATEGORIES.TERRAIN,
        description: 'Elevated terrain (height +1)',
        texture: 'elevated',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        isTerrain: true,
        elevation: 1
    },
    // Environment
    {
        id: 'tree_pine',
        name: 'Pine Tree',
        category: ASSET_CATEGORIES.ENVIRONMENT,
        description: 'A tall pine tree',
        texture: 'tree_pine',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'tree_oak',
        name: 'Oak Tree',
        category: ASSET_CATEGORIES.ENVIRONMENT,
        description: 'A sturdy oak tree',
        texture: 'tree_oak',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'shrub_small',
        name: 'Small Shrub',
        category: ASSET_CATEGORIES.ENVIRONMENT,
        description: 'A small decorative shrub',
        texture: 'shrub_small',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'rock_large',
        name: 'Large Rock',
        category: ASSET_CATEGORIES.ENVIRONMENT,
        description: 'A large boulder',
        texture: 'rock_large',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },

    // Infrastructure
    {
        id: 'road_straight',
        name: 'Straight Road',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A straight road segment',
        texture: 'road_straight',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'road_corner',
        name: 'Corner Road',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A corner road segment',
        texture: 'road_corner',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'sidewalk',
        name: 'Sidewalk',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A pedestrian sidewalk',
        texture: 'sidewalk',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'streetlight',
        name: 'Street Light',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A neon street light',
        texture: 'streetlight',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'subway_entrance',
        name: 'Subway Entrance',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'An entrance to the underground transit system',
        texture: 'subway_entrance',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'monorail_support',
        name: 'Monorail Support',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A support column for the elevated monorail',
        texture: 'monorail_support',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'landing_pad',
        name: 'Landing Pad',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A landing pad for hover-vehicles',
        texture: 'landing_pad',
        width: 2,
        height: 2,
        walkable: true,
        solid: false,
        interactive: true,
        placementRules: (world, x, y) => {
            // Check all tiles in the footprint
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const tile = world.getTile(x + dx, y + dy);
                    if (!tile || !tile.walkable || tile.structure) {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    {
        id: 'power_generator',
        name: 'Power Generator',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A small energy generator with glowing elements',
        texture: 'power_generator',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'data_hub',
        name: 'Data Hub',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A server node with blinking lights',
        texture: 'data_hub',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'holo_billboard',
        name: 'Holographic Billboard',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'An animated advertising billboard',
        texture: 'holo_billboard',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'security_camera',
        name: 'Security Camera',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A surveillance camera that monitors the area',
        texture: 'security_camera',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'neon_strip',
        name: 'Neon Light Strip',
        category: ASSET_CATEGORIES.INFRASTRUCTURE,
        description: 'A strip of neon lights for decoration',
        texture: 'neon_strip',
        width: 1,
        height: 1,
        walkable: true,
        solid: false,
        interactive: false,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },

    // Buildings
    {
        id: 'house_small',
        name: 'Small House',
        category: ASSET_CATEGORIES.BUILDINGS,
        description: 'A small residential building',
        texture: 'house_small',
        width: 2,
        height: 2,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            // Check all tiles in the building footprint
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const tile = world.getTile(x + dx, y + dy);
                    if (!tile || !tile.walkable || tile.structure) {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    {
        id: 'shop',
        name: 'Shop',
        category: ASSET_CATEGORIES.BUILDINGS,
        description: 'A commercial shop',
        texture: 'shop',
        width: 2,
        height: 2,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            // Check all tiles in the building footprint
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const tile = world.getTile(x + dx, y + dy);
                    if (!tile || !tile.walkable || tile.structure) {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    {
        id: 'office_building',
        name: 'Office Building',
        category: ASSET_CATEGORIES.BUILDINGS,
        description: 'A corporate office building',
        texture: 'office_building',
        width: 3,
        height: 3,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            // Check all tiles in the building footprint
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    const tile = world.getTile(x + dx, y + dy);
                    if (!tile || !tile.walkable || tile.structure) {
                        return false;
                    }
                }
            }
            return true;
        }
    },

    // Characters
    {
        id: 'npc_civilian',
        name: 'Civilian',
        category: ASSET_CATEGORIES.CHARACTERS,
        description: 'A civilian NPC',
        texture: 'npc_civilian',
        width: 1,
        height: 1,
        walkable: false,
        solid: false,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.hasEntity;
        }
    },
    {
        id: 'npc_vendor',
        name: 'Vendor',
        category: ASSET_CATEGORIES.CHARACTERS,
        description: 'A vendor NPC',
        texture: 'npc_vendor',
        width: 1,
        height: 1,
        walkable: false,
        solid: false,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.hasEntity;
        }
    },
    {
        id: 'npc_guard',
        name: 'Guard',
        category: ASSET_CATEGORIES.CHARACTERS,
        description: 'A guard NPC',
        texture: 'npc_guard',
        width: 1,
        height: 1,
        walkable: false,
        solid: false,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.hasEntity;
        }
    },

    // Props
    {
        id: 'terminal',
        name: 'Terminal',
        category: ASSET_CATEGORIES.PROPS,
        description: 'An interactive computer terminal',
        texture: 'terminal',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'crate',
        name: 'Crate',
        category: ASSET_CATEGORIES.PROPS,
        description: 'A storage crate',
        texture: 'crate',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    },
    {
        id: 'bench',
        name: 'Bench',
        category: ASSET_CATEGORIES.PROPS,
        description: 'A sitting bench',
        texture: 'bench',
        width: 1,
        height: 1,
        walkable: false,
        solid: true,
        interactive: true,
        placementRules: (world, x, y) => {
            const tile = world.getTile(x, y);
            return tile && tile.walkable && !tile.structure;
        }
    }
];

/**
 * Get assets by category
 * @param {string} category - Asset category
 * @returns {Array} Array of assets in the category
 */
export function getAssetsByCategory(category) {
    return ASSETS.filter(asset => asset.category === category);
}

/**
 * Get asset by ID
 * @param {string} id - Asset ID
 * @returns {Object|null} Asset object or null if not found
 */
export function getAssetById(id) {
    return ASSETS.find(asset => asset.id === id) || null;
}
