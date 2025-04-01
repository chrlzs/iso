import { MapDefinition } from '../MapDefinition.js';
import { noise } from '../../utils/noise.js';

export function createRemixedMap() {
    const mapSize = 128;
    const mapDef = new MapDefinition(mapSize, mapSize);

    // Initialize noise functions
    const heightNoise = noise.createNoise2D();
    const moistureNoise = noise.createNoise2D();

    // Add tile palette in northwest corner - moved further from edge and made larger
    const tileTypes = [
        'water', 'wetland', 'sand', 'dirt', 'grass',
        'forest', 'mountain', 'concrete', 'asphalt', 'metal',
        'tiles', 'gravel', 'solar', 'garden', 'door',
        'helipad', 'parking', 'tree', 'bush'
    ];

    // Create a larger display area for the palette
    const paletteStartX = 5;  // Far corner
    const paletteStartY = 5;  // Far corner
    const paletteSize = 10;   // Tile size
    
    // Create a concrete platform for the palette
    for (let x = paletteStartX - 1; x < paletteStartX + 7; x++) {
        for (let y = paletteStartY - 1; y < paletteStartY + 6; y++) {
            mapDef.setTile(x, y, {
                height: 0.9,
                moisture: 0.5,
                type: 'concrete',
                isPalette: true
            });
        }
    }
    
    // Add tile examples with better spacing
    tileTypes.forEach((type, index) => {
        const x = paletteStartX + (index % 5);
        const y = paletteStartY + Math.floor(index / 5);
        mapDef.setTile(x, y, {
            height: 1.0,
            moisture: 0.5,
            type: type,
            isPalette: true
        });
    });

    // Add labels for the palette
    mapDef.decorations.push({
        type: 'text',
        x: paletteStartX,
        y: paletteStartY - 1,
        text: 'Tile Palette'
    });

    // Generate rest of the terrain
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            // Skip the palette area with larger buffer
            if (x >= paletteStartX - 2 && x < paletteStartX + 8 &&
                y >= paletteStartY - 2 && y < paletteStartY + 7) {
                continue;
            }

            // Create more varied height using multiple noise layers
            const baseHeight = Math.max(0, Math.min(1, (heightNoise(x * 0.05, y * 0.05) + 1) * 0.5)) || 0.5;
            const detailHeight = Math.max(0, Math.min(1, (heightNoise(x * 0.1, y * 0.1) + 1) * 0.25)) || 0.25;
            const height = Math.max(0, Math.min(1, (baseHeight + detailHeight) / 1.25));

            // Create moisture with patterns and validate
            const moisture = Math.max(0, Math.min(1, (moistureNoise(x * 0.03, y * 0.03) + 1) * 0.5)) || 0.5;

            // Set tile with validated values
            mapDef.setTile(x, y, {
                height: height || 0.5,  // Fallback to 0.5 if NaN
                moisture: moisture || 0.5,  // Fallback to 0.5 if NaN
                type: determineTileType(height, moisture)
            });
        }
    }

    // Add cyberpunk-themed structures
    const structures = [
        { type: 'apartment', x: 30, y: 20, width: 4, height: 4, material: 'concrete' },  // Moved from x:20
        { type: 'nightclub', x: 40, y: 30, width: 6, height: 6, material: 'metal' },     // Moved from x:30
        { type: 'office', x: 50, y: 40, width: 5, height: 8, material: 'glass' },        // Moved from x:40
        // Tech hub area - unchanged
        { type: 'apartment', x: 60, y: 60, width: 4, height: 4, material: 'concrete' },
        { type: 'office', x: 65, y: 60, width: 4, height: 4, material: 'glass' },
        { type: 'apartment', x: 60, y: 65, width: 4, height: 4, material: 'concrete' },
        { type: 'office', x: 65, y: 65, width: 4, height: 4, material: 'glass' },
    ];

    // Add structures to map
    structures.forEach(struct => {
        mapDef.addStructure(struct);
    });

    // Add decorative elements
    const decorations = [
        { type: 'terminal', x: 22, y: 22 },
        { type: 'drone', x: 32, y: 32 },
        { type: 'camera', x: 42, y: 42 },
        // Tech garden
        { type: 'flowers', x: 62, y: 62 },
        { type: 'flowers', x: 63, y: 62 },
        { type: 'flowers', x: 62, y: 63 },
    ];

    // Add decorations to map
    decorations.forEach(dec => {
        mapDef.addDecoration(dec);
    });

    // Set spawn points
    mapDef.spawnPoints = [
        { x: 35, y: 25 }, // Near the first apartment (adjusted)
        { x: 62, y: 62 }  // In the tech hub area (unchanged)
    ];

    return mapDef;
}

// Helper function to determine tile type based on height and moisture
function determineTileType(height, moisture) {
    if (height < 0.3) return 'water';
    if (height < 0.4) return moisture > 0.6 ? 'wetland' : 'dirt';
    if (height < 0.7) return moisture > 0.4 ? 'grass' : 'dirt';
    if (height < 0.85) return 'stone';  // Use stone for high elevation
    return 'mountain';  // Use mountain for very high elevation
}
