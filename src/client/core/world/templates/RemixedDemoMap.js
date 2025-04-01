import { MapDefinition } from '../MapDefinition.js';
import { noise } from '../../utils/noise.js';

export function createRemixedMap() {
    const mapSize = 32;  // Reduced from 128 to 32
    const mapDef = new MapDefinition(mapSize, mapSize);

    // Initialize noise functions
    const heightNoise = noise.createNoise2D();
    const moistureNoise = noise.createNoise2D();

    // Add tile palette in northwest corner - moved further from edge and made larger
    const tileTypes = [
        'water', 'wetland', 'sand', 'dirt', 'grass',
        'forest', 'mountain', 'concrete', 'asphalt', 'metal',
        'tiles', 'gravel', 'solar', 'garden', 'door',
        'helipad', 'parking', 'tree', 'bush', 'road',
        'walkway'
    ];

    // Create a larger display area for the palette
    const paletteStartX = 2;  // Adjusted from 5
    const paletteStartY = 2;  // Adjusted from 5
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
        { type: 'apartment', x: 8, y: 5, width: 4, height: 4, material: 'concrete' },   // Was 30,20
        { type: 'nightclub', x: 10, y: 8, width: 6, height: 6, material: 'metal' },     // Was 40,30
        { type: 'office', x: 13, y: 10, width: 5, height: 8, material: 'glass' },       // Was 50,40
        // Tech hub area - scaled down
        { type: 'apartment', x: 15, y: 15, width: 4, height: 4, material: 'concrete' }, // Was 60,60
        { type: 'office', x: 16, y: 15, width: 4, height: 4, material: 'glass' },       // Was 65,60
        { type: 'apartment', x: 15, y: 16, width: 4, height: 4, material: 'concrete' }, // Was 60,65
        { type: 'office', x: 16, y: 16, width: 4, height: 4, material: 'glass' },       // Was 65,65
    ];

    // Add structures to map
    structures.forEach(struct => {
        mapDef.addStructure(struct);
    });

    // Add decorative elements
    const decorations = [
        { type: 'terminal', x: 6, y: 6 },    // Was 22,22
        { type: 'drone', x: 8, y: 8 },       // Was 32,32
        { type: 'camera', x: 11, y: 11 },    // Was 42,42
        // Tech garden
        { type: 'flowers', x: 15, y: 15 },   // Was 62,62
        { type: 'flowers', x: 16, y: 15 },   // Was 63,62
        { type: 'flowers', x: 15, y: 16 },   // Was 62,63
    ];

    // Add decorations to map
    decorations.forEach(dec => {
        mapDef.addDecoration(dec);
    });

    // Add roads connecting structures
    const roads = [
        { start: { x: 8, y: 5 }, end: { x: 13, y: 10 }, width: 2 },
        { start: { x: 13, y: 10 }, end: { x: 15, y: 15 }, width: 2 },
        { start: { x: 10, y: 8 }, end: { x: 13, y: 10 }, width: 2 }
    ];

    // Add walkways in tech hub and other areas
    const walkways = [
        // Tech hub internal connections
        { start: { x: 60, y: 60 }, end: { x: 65, y: 60 } },
        { start: { x: 60, y: 65 }, end: { x: 65, y: 65 } },
        { start: { x: 60, y: 60 }, end: { x: 60, y: 65 } },
        { start: { x: 65, y: 60 }, end: { x: 65, y: 65 } },
        // Additional walkways connecting to nearby structures
        { start: { x: 40, y: 30 }, end: { x: 30, y: 20 } },
        { start: { x: 50, y: 40 }, end: { x: 60, y: 60 } }
    ];

    // Place roads
    roads.forEach(road => {
        const { start, end, width = 1 } = road;
        const dx = Math.sign(end.x - start.x);
        const dy = Math.sign(end.y - start.y);
        let x = start.x, y = start.y;

        while (x !== end.x || y !== end.y) {
            mapDef.setTile(x, y, { height: 0.5, moisture: 0.3, type: 'road' });
            if (x !== end.x) x += dx;
            if (y !== end.y) y += dy;
        }
    });

    // Place walkways
    walkways.forEach(walkway => {
        const { start, end } = walkway;
        const dx = Math.sign(end.x - start.x);
        const dy = Math.sign(end.y - start.y);
        let x = start.x, y = start.y;

        while (x !== end.x || y !== end.y) {
            mapDef.setTile(x, y, { height: 0.5, moisture: 0.3, type: 'walkway' });
            if (x !== end.x) x += dx;
            if (y !== end.y) y += dy;
        }
    });

    // Set spawn points
    mapDef.spawnPoints = [
        { x: 9, y: 6 },     // Was 35,25
        { x: 15, y: 15 }    // Was 62,62
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
