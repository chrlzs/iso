import { MapDefinition } from '../MapDefinition.js';
import { noise } from '../../utils/noise.js';

export function createRemixedMap() {
    const mapSize = 128;
    const mapDef = new MapDefinition(mapSize, mapSize);

    // Initialize noise functions
    const heightNoise = noise.createNoise2D();
    const moistureNoise = noise.createNoise2D();

    // Add tile palette in northwest corner
    const tileTypes = [
        'water', 'wetland', 'sand', 'dirt', 'grass',
        'forest', 'mountain', 'concrete', 'asphalt', 'metal',
        'tiles', 'gravel', 'solar', 'garden', 'door',
        'helipad', 'parking', 'tree', 'bush'
    ];

    // Create 5x4 grid of example tiles
    tileTypes.forEach((type, index) => {
        const x = 2 + (index % 5);  // 5 tiles per row
        const y = 2 + Math.floor(index / 5);  // Start 2 tiles from edge
        
        mapDef.setTile(x, y, {
            height: 0.5,
            moisture: 0.5,
            type: type
        });
    });

    // Add labels for the palette
    mapDef.decorations.push({
        type: 'text',
        x: 2,
        y: 1,
        text: 'Tile Palette'
    });

    // Generate rest of the terrain
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            // Skip the palette area
            if (x < 8 && y < 8) continue;

            // Create more varied height using multiple noise layers
            const baseHeight = (heightNoise(x * 0.05, y * 0.05) + 1) * 0.5;
            const detailHeight = (heightNoise(x * 0.1, y * 0.1) + 1) * 0.25;
            const height = (baseHeight + detailHeight) / 1.25;

            // Create moisture with patterns
            const moisture = (moistureNoise(x * 0.03, y * 0.03) + 1) * 0.5;

            mapDef.setTile(x, y, {
                height,
                moisture,
                type: determineTileType(height, moisture)
            });
        }
    }

    // Add cyberpunk-themed structures
    const structures = [
        { type: 'apartment', x: 20, y: 20, width: 4, height: 4, material: 'concrete' },
        { type: 'nightclub', x: 30, y: 30, width: 6, height: 6, material: 'metal' },
        { type: 'office', x: 40, y: 40, width: 5, height: 8, material: 'glass' },
        // Tech hub area
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
        { x: 25, y: 25 }, // Near the first apartment
        { x: 62, y: 62 }  // In the tech hub area
    ];

    return mapDef;
}

// Helper function to determine tile type based on height and moisture
function determineTileType(height, moisture) {
    if (height < 0.3) return 'water';
    if (height < 0.4) return moisture > 0.6 ? 'wetland' : 'dirt';
    if (height < 0.7) return moisture > 0.4 ? 'grass' : 'dirt';
    return 'stone';
}
