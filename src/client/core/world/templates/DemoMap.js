import { MapDefinition } from '../MapDefinition.js';

/**
 * Creates a demo map showcasing game features
 * @returns {MapDefinition} Demo map definition
 */
export function createDemoMap() {
    const map = new MapDefinition({
        width: 128,
        height: 128,
        seed: 12345,
        terrain: [
            // Central lake with pathway
            ...generateLake(64, 64, 12),
            // Add connecting path
            ...generateCentralPath(),
            // Mountain range in north
            ...generateMountainRange(20, 20, 40, 8),
            // Forest patches
            ...generateForest(90, 40, 15),
            ...generateForest(30, 90, 12)
        ],
        
        // Urban zones
        zones: [
            // Downtown
            {
                type: 'commercial',
                x: 60,
                y: 60,
                radius: 8,
                density: 0.9
            },
            // Industrial zone
            {
                type: 'industrial',
                x: 80,
                y: 40,
                radius: 6,
                density: 0.8
            },
            // Residential areas
            {
                type: 'residential',
                x: 40,
                y: 80,
                radius: 10,
                density: 0.6
            }
        ],

        // Key structures
        structures: [
            // Downtown landmarks
            {
                type: 'office',
                x: 60,
                y: 58,
                options: {
                    floors: 6,
                    material: 'glass'
                }
            },
            // Industrial facilities
            {
                type: 'factory',
                x: 82,
                y: 42,
                options: {
                    chimneys: [
                        {
                            x: 0.7,
                            y: 0.3,
                            smokeActive: true,
                            smokeRate: 0.8
                        }
                    ]
                }
            },
            // Warehouses
            {
                type: 'warehouse',
                x: 78,
                y: 38
            },
            {
                type: 'warehouse',
                x: 84,
                y: 38
            },
            // Residential buildings
            ...generateResidentialCluster(40, 80, 6),
            
            // Natural decorations
            ...generateTreeLine(30, 90, 40, 90, 3),
            ...generateTreeLine(90, 30, 90, 40, 3)
        ],

        // Road network
        roads: [
            // Main streets
            {
                start: { x: 40, y: 40 },
                end: { x: 80, y: 40 },
                type: 'highway',
                width: 2,
                importance: 1
            },
            {
                start: { x: 60, y: 40 },
                end: { x: 60, y: 80 },
                type: 'highway',
                width: 2,
                importance: 1
            },
            // Secondary roads
            ...generateGridRoads(55, 55, 10, 10)
        ],

        // Points of interest
        landmarks: [
            {
                type: 'spawn',
                x: 64,
                y: 64,
                name: 'City Center'
            },
            {
                type: 'viewpoint',
                x: 25,
                y: 25,
                name: 'Mountain Vista'
            }
        ]
    });

    return map;
}

// Helper functions for terrain generation
function generateLake(centerX, centerY, radius) {
    const lake = [];
    // Create pathway angle from south (between 5 and 6 o'clock position)
    const pathAngle = Math.PI * 1.3; // About 234 degrees
    const pathWidth = 3; // Width of the pathway

    for (let y = centerY - radius; y <= centerY + radius; y++) {
        for (let x = centerX - radius; x <= centerX + radius; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Check if point is within lake radius but not in pathway
            if (distance <= radius) {
                // Create pathway by not placing water tiles
                const angleDiff = Math.abs((angle - pathAngle + Math.PI * 2) % (Math.PI * 2) - Math.PI);
                if (angleDiff > 0.3 || distance < radius - pathWidth) { // 0.3 radians for path width
                    lake.push({
                        x, y,
                        type: 'water',
                        height: 0.3,
                        moisture: 1
                    });
                } else {
                    // Add stone path
                    lake.push({
                        x, y,
                        type: 'concrete',
                        height: 0.4,
                        moisture: 0.5
                    });
                }
            }
        }
    }
    return lake;
}

// Add stone pathway connecting to the main road
function generateCentralPath() {
    const path = [];
    // Starting from the bottom of the lake (adjust coordinates as needed)
    const startY = 76; // Just below the lake
    const endY = 64; // Lake center
    const pathX = 64; // Center X coordinate

    for (let y = startY; y >= endY; y--) {
        path.push({
            x: pathX,
            y,
            type: 'concrete',
            height: 0.4,
            moisture: 0.5
        });
        // Add path borders
        path.push({
            x: pathX - 1,
            y,
            type: 'concrete',
            height: 0.4,
            moisture: 0.5
        });
        path.push({
            x: pathX + 1,
            y,
            type: 'concrete',
            height: 0.4,
            moisture: 0.5
        });
    }
    return path;
}

function generateMountainRange(startX, startY, length, width) {
    const mountains = [];
    for (let i = 0; i < length; i++) {
        for (let w = 0; w < width; w++) {
            mountains.push({
                x: startX + i,
                y: startY + w,
                type: 'mountain',
                height: 0.8 + Math.random() * 0.2,
                moisture: 0.3
            });
        }
    }
    return mountains;
}

function generateForest(centerX, centerY, radius) {
    const forest = [];
    
    for (let y = centerY - radius; y <= centerY + radius; y++) {
        for (let x = centerX - radius; x <= centerX + radius; x++) {
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (distance <= radius) {
                // Set base height and moisture for forest area
                const baseHeight = 0.5 + (Math.random() * 0.1);
                const baseMoisture = 0.7 + (Math.random() * 0.3);
                
                // First add grass as base terrain
                forest.push({
                    x, y,
                    type: 'grass',
                    height: baseHeight,
                    moisture: baseMoisture
                });
                
                // Then randomly add trees on top of grass
                if (Math.random() < 0.7) {
                    const treeHeight = baseHeight + 0.1; // Trees slightly higher than ground
                    forest.push({
                        type: 'tree',
                        x, y,
                        height: treeHeight,
                        moisture: baseMoisture
                    });
                }
            }
        }
    }
    
    return forest;
}

function generateResidentialCluster(centerX, centerY, count) {
    const buildings = [];
    const spacing = 3;
    for (let i = 0; i < count; i++) {
        buildings.push({
            type: 'apartment',
            x: centerX + (i % 3) * spacing,
            y: centerY + Math.floor(i / 3) * spacing,
            options: {
                floors: 2 + Math.floor(Math.random() * 2)
            }
        });
    }
    return buildings;
}

function generateTreeLine(x1, y1, x2, y2, spacing) {
    const tiles = [];
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const count = Math.floor(length / spacing);
    
    for (let i = 0; i <= count; i++) {
        const t = i / count;
        const x = Math.round(x1 + (x2 - x1) * t);
        const y = Math.round(y1 + (y2 - y1) * t);
        
        // Add grass base terrain first
        tiles.push({
            x: x,
            y: y,
            type: 'grass',
            height: 0.5 + (Math.random() * 0.1),
            moisture: 0.7 + (Math.random() * 0.3)
        });
        
        // Add tree on top
        tiles.push({
            type: 'tree',
            x: x,
            y: y,
            height: 0.6 + (Math.random() * 0.1), // Slightly higher than grass
            moisture: 0.7 + (Math.random() * 0.3)
        });
    }
    
    return tiles;
}

function generateGridRoads(startX, startY, width, height) {
    const roads = [];
    // Horizontal roads
    for (let y = 0; y < height; y += 2) {
        roads.push({
            start: { x: startX, y: startY + y },
            end: { x: startX + width, y: startY + y },
            type: 'street',
            width: 1,
            importance: 0.5
        });
    }
    // Vertical roads
    for (let x = 0; x < width; x += 2) {
        roads.push({
            start: { x: startX + x, y: startY },
            end: { x: startX + x, y: startY + height },
            type: 'street',
            width: 1,
            importance: 0.5
        });
    }
    return roads;
}
