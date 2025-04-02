import { MapDefinition } from '../MapDefinition.js';
import { DecorationPlacer } from '../DecorationPlacer.js';
import { createNoise2D } from '/node_modules/simplex-noise/dist/esm/simplex-noise.js';

export function createRemixedMap() {
    const mapSize = 32;
    const mapDef = new MapDefinition(mapSize, mapSize);
    const decorationPlacer = new DecorationPlacer(mapDef);

    // Use fixed seeds for consistent generation
    const FIXED_SEED = 12345;
    const heightNoise = createNoise2D(() => FIXED_SEED);
    const moistureNoise = createNoise2D(() => FIXED_SEED + 1);

    // Generate base terrain first
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            const baseHeight = Math.max(0, Math.min(1, (heightNoise(x * 0.05, y * 0.05) + 1) * 0.5)) || 0.5;
            const detailHeight = Math.max(0, Math.min(1, (heightNoise(x * 0.1, y * 0.1) + 1) * 0.25)) || 0.25;
            const height = Math.max(0, Math.min(1, (baseHeight + detailHeight) / 1.25));
            const moisture = Math.max(0, Math.min(1, (moistureNoise(x * 0.03, y * 0.03) + 1) * 0.5)) || 0.5;

            mapDef.setTile(x, y, {
                height: height || 0.5,
                moisture: moisture || 0.5,
                type: determineTileType(height, moisture)
            });
        }
    }

    // Add key structures with adjusted positions more likely to be valid
    const structures = [
        // Downtown area - office building with merchant
        {
            type: 'office',
            x: Math.floor(mapSize * 0.5), // Center
            y: Math.floor(mapSize * 0.5),
            options: {
                floors: 6,
                material: 'glass',
                hasMerchant: true
            }
        },
        // Industrial zone
        {
            type: 'factory',
            x: Math.floor(mapSize * 0.5) - 8, // Increased offset
            y: Math.floor(mapSize * 0.5) - 8,
            options: {
                chimneys: [{
                    x: 0.7,
                    y: 0.3,
                    smokeActive: true,
                    smokeRate: 0.8
                }]
            }
        },
        // Residential area
        {
            type: 'apartment',
            x: Math.floor(mapSize * 0.5) + 8, // Increased offset
            y: Math.floor(mapSize * 0.5) + 8,
            options: {
                floors: 3,
                material: 'concrete'
            }
        }
    ];

    // Add structures to map, ensuring door accessibility
    structures.forEach(structureData => {
        const { type, x, y, options = {} } = structureData;
        
        console.log(`Attempting to place ${type} at ${x},${y}`);
        
        // Check for any existing structures in a larger area
        let hasOverlap = false;
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const tile = mapDef.getTile(x + dx, y + dy);
                if (tile && tile.structure) {
                    console.log(`Found existing structure near ${x + dx},${y + dy}`);
                    hasOverlap = true;
                    break;
                }
            }
            if (hasOverlap) break;
        }

        if (hasOverlap) {
            console.warn(`Cannot place ${type} at ${x},${y} - too close to existing structure`);
            return;
        }

        // Ensure the area in front of where the door will be is navigable
        if (isValidStructurePlacement(mapDef, x, y)) {
            const structure = mapDef.addStructure({
                type,
                x,
                y,
                ...options
            });

            if (structure) {
                console.log(`Successfully placed ${type} at ${x},${y}`);
                if (options.hasMerchant) {
                    mapDef.merchantStructure = structure;
                    console.log('Assigned merchant to structure:', structure);
                }
            } else {
                console.warn(`Structure creation failed for ${type} at ${x},${y}`);
            }
        } else {
            console.warn(`Cannot place ${type} at ${x},${y} - door would be blocked`);
        }
    });

    // Add some trees around the edges, avoiding structures
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * mapSize);
        const y = Math.floor(Math.random() * mapSize);
        const tile = mapDef.getTile(x, y);
        
        if (tile && 
            tile.type === 'grass' && 
            !tile.structure && 
            !isNearStructure(mapDef, x, y)) {
            mapDef.addStructure({
                type: 'tree',
                x,
                y,
                options: {
                    height: 1 + Math.random() * 0.5
                }
            });
        }
    }

    return mapDef;
}

// Helper function to check if a position is near any structure
function isNearStructure(mapDef, x, y) {
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tile = mapDef.getTile(x + dx, y + dy);
            if (tile && tile.structure) {
                return true;
            }
        }
    }
    return false;
}

// Helper function to check if a structure can be placed with accessible door
function isValidStructurePlacement(mapDef, x, y) {
    // First check if any part of the new structure would overlap with existing structures
    for (let dy = 0; dy < 2; dy++) {  // Assuming minimum height of 2
        for (let dx = 0; dx < 2; dx++) {  // Assuming minimum width of 2
            const tile = mapDef.getTile(x + dx, y + dy);
            if (tile && tile.structure) {
                console.log(`Structure overlap detected at ${x + dx},${y + dy}`);
                return false;
            }
        }
    }

    // Check the tile in front of where the door will be (one tile south)
    const doorTile = mapDef.getTile(x, y + 1);
    if (!doorTile) {
        console.log('Door tile not found at', x, y + 1);
        return false;
    }

    // Door tile and adjacent tiles should be navigable
    const nonNavigableTypes = ['water', 'wetland', 'mountain'];
    
    // Check door tile and tiles to its left and right
    let isValid = true;
    for (let dx = -1; dx <= 1; dx++) {
        const tile = mapDef.getTile(x + dx, y + 1);
        if (!tile || 
            nonNavigableTypes.includes(tile.type) || 
            tile.structure) {
            console.log(`Invalid tile at ${x + dx},${y + 1}:`, 
                tile ? `type=${tile.type}, hasStructure=${!!tile.structure}` : 'no tile');
            isValid = false;
            break;
        }
    }

    return isValid;
}

function determineTileType(height, moisture) {
    if (height < 0.2) return 'water';
    if (height < 0.3) return 'sand';
    if (height < 0.6) {
        if (moisture > 0.6) return 'wetland';
        if (moisture > 0.3) return 'grass';
        return 'dirt';
    }
    if (height < 0.8) {
        if (moisture > 0.6) return 'forest';
        return 'grass';
    }
    return 'mountain';
}
