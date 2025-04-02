import { MapDefinition } from '../MapDefinition.js';
import { DecorationPlacer } from '../DecorationPlacer.js';
import { createNoise2D } from '/node_modules/simplex-noise/dist/esm/simplex-noise.js';

export function createRemixedMap() {
    const mapSize = 32;
    const mapDef = new MapDefinition(mapSize, mapSize);
    const decorationPlacer = new DecorationPlacer(mapDef);

    // Initialize noise functions
    const heightNoise = createNoise2D();
    const moistureNoise = createNoise2D();

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

    // Add key structures
    const structures = [
        // Downtown area
        {
            type: 'office',
            x: Math.floor(mapSize * 0.3),
            y: Math.floor(mapSize * 0.3),
            options: {
                floors: 6,
                material: 'glass'
            }
        },
        // Industrial zone
        {
            type: 'factory',
            x: Math.floor(mapSize * 0.7),
            y: Math.floor(mapSize * 0.2),
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
            x: Math.floor(mapSize * 0.4),
            y: Math.floor(mapSize * 0.6),
            options: {
                floors: 3,
                material: 'concrete'
            }
        }
    ];

    // Add structures to map
    structures.forEach(structureData => {
        const { type, x, y, options = {} } = structureData;
        mapDef.addStructure({
            type,
            x,
            y,
            ...options
        });
    });

    // Add some trees around the edges
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * mapSize);
        const y = Math.floor(Math.random() * mapSize);
        const tile = mapDef.getTile(x, y);
        
        if (tile && tile.type === 'grass' && !tile.structure) {
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
