import { MapDefinition } from '../MapDefinition.js';
import { createNoise2D } from '/node_modules/simplex-noise/dist/esm/simplex-noise.js';

export function createRemixedMap() {
    const mapSize = 32;
    const mapDef = new MapDefinition(mapSize, mapSize);

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
        },
        // Entertainment district - nightclub
        {
            type: 'nightclub',
            x: Math.floor(mapSize * 0.5) - 8, // West side
            y: Math.floor(mapSize * 0.5) + 8, // South side
            options: {
                floors: 2,
                material: 'concrete',
                states: {
                    lightOn: true,
                    musicPlaying: true
                }
            }
        },
        // Research district - laboratory
        {
            type: 'laboratory',
            x: Math.floor(mapSize * 0.5) + 8, // East side
            y: Math.floor(mapSize * 0.5) - 8, // North side
            options: {
                floors: 1,
                material: 'metal',
                states: {
                    lightOn: true,
                    securityActive: true
                }
            }
        },
        // Storage district - warehouse
        {
            type: 'warehouse',
            x: Math.floor(mapSize * 0.25), // Far west
            y: Math.floor(mapSize * 0.25), // Far north
            options: {
                floors: 1,
                material: 'metal',
                roofConfig: {
                    style: 'gabled',
                    color: '#8B0000',
                    height: 48
                },
                states: {
                    doorOpen: true
                }
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

    // IMPORTANT: Make sure all structures are fully registered before placing trees
    console.log('Structures placed:', mapDef.getAllStructures().filter(s => s.type !== 'tree').length);

    // Add trees throughout the map, avoiding structures
    console.log('Starting tree placement...');
    const treeCount = 50; // Increased from 20 to better test our solution
    let treesPlaced = 0;
    let attempts = 0;
    const maxAttempts = treeCount * 5; // Increased attempts to find valid spots

    // Create a safety map of all structure positions for a final verification
    const structurePositions = new Set();
    mapDef.getAllStructures().forEach(structure => {
        if (structure.type === 'tree') return;

        const width = structure.width || 1;
        const height = structure.height || 1;
        const bufferSize = 1; // Buffer zone around structures

        // Mark all tiles covered by this structure AND a buffer zone around it
        for (let dy = -bufferSize; dy < height + bufferSize; dy++) {
            for (let dx = -bufferSize; dx < width + bufferSize; dx++) {
                structurePositions.add(`${structure.x + dx},${structure.y + dy}`);
            }
        }
    });

    console.log(`Created safety map with ${structurePositions.size} structure positions`);

    while (treesPlaced < treeCount && attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(Math.random() * mapSize);
        const y = Math.floor(Math.random() * mapSize);
        const tile = mapDef.getTile(x, y);

        // Skip if this position is in our structure safety map
        if (structurePositions.has(`${x},${y}`)) {
            continue;
        }

        // CRITICAL: Never place trees on building tiles
        if (tile && tile.type === 'building') {
            console.log(`Skipping tree placement at ${x},${y} - tile is a building`);
            continue;
        }

        // Only place trees on natural terrain types
        if (tile &&
            (tile.type === 'grass' || tile.type === 'dirt') &&
            !tile.structure) {

            // Triple-check if the position is near or inside any structure
            if (!isNearStructure(mapDef, x, y)) {
                console.log(`Placing tree at ${x},${y}`);

                // Final verification before placement
                const finalCheck = mapDef.getTile(x, y);
                if (finalCheck && !finalCheck.structure && finalCheck.type !== 'building') {
                    // Use addTree method which has additional safety checks
                    const tree = mapDef.addTree(x, y);
                    if (tree) {
                        treesPlaced++;
                        console.log(`Successfully placed tree at ${x},${y}`);
                    } else {
                        console.warn(`Tree placement failed at ${x},${y}`);
                    }
                } else {
                    console.warn(`Final check failed: Position ${x},${y} already has a structure or is a building`);
                }
            }
        }
    }

    console.log(`Placed ${treesPlaced} trees after ${attempts} attempts`);

    return mapDef;
}

// Helper function to check if a position is near or inside any structure
function isNearStructure(mapDef, x, y) {
    // CRITICAL CHECK: First check if the exact position has a structure (direct overlap)
    const currentTile = mapDef.getTile(x, y);

    // Check if the tile is a building type - NEVER place trees on building tiles
    if (currentTile && currentTile.type === 'building') {
        console.log(`Tree placement rejected: Position ${x},${y} is a building tile`);
        return true;
    }

    // Check if the tile already has a structure
    if (currentTile && currentTile.structure) {
        console.log(`Tree placement rejected: Position ${x},${y} already has a structure`);
        return true;
    }

    // DOUBLE CHECK: Scan all tiles in the map to find structures and building tiles
    // This is a more thorough approach that doesn't rely on the structures collection
    for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const checkX = x + dx;
            const checkY = y + dy;
            const tile = mapDef.getTile(checkX, checkY);

            // Check for building tiles in the scan area
            if (tile && tile.type === 'building') {
                // If we're directly on a building tile or within 1 tile of it, reject
                if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                    console.log(`Tree placement rejected: Position ${x},${y} is too close to building tile at ${checkX},${checkY}`);
                    return true;
                }
            }

            // Check for structures in the scan area
            if (tile && tile.structure && tile.structure.type !== 'tree') {
                // If we found a non-tree structure, check if our position is within its bounds
                const structure = tile.structure;
                const structX = structure.x;
                const structY = structure.y;
                const structWidth = structure.width || 1;
                const structHeight = structure.height || 1;

                // If our position is inside this structure's footprint, reject it
                if (x >= structX && x < structX + structWidth &&
                    y >= structY && y < structY + structHeight) {
                    console.log(`Tree placement rejected: Position ${x},${y} is inside building at ${structX},${structY} with size ${structWidth}x${structHeight}`);
                    return true;
                }

                // Also maintain a buffer zone around structures
                const bufferSize = 1;
                if (x >= structX - bufferSize && x < structX + structWidth + bufferSize &&
                    y >= structY - bufferSize && y < structY + structHeight + bufferSize) {
                    console.log(`Tree placement rejected: Position ${x},${y} is too close to building at ${structX},${structY}`);
                    return true;
                }
            }
        }
    }

    // TRIPLE CHECK: Also use the structures collection as a backup
    const structures = mapDef.getAllStructures();
    for (const structure of structures) {
        if (structure.type === 'tree') continue;

        const structX = structure.x;
        const structY = structure.y;
        const structWidth = structure.width || 1;
        const structHeight = structure.height || 1;

        if (x >= structX && x < structX + structWidth &&
            y >= structY && y < structY + structHeight) {
            console.log(`Tree placement rejected (from structures collection): Position ${x},${y} is inside building at ${structX},${structY}`);
            return true;
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
