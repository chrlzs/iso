import { MapDefinition } from '../MapDefinition.js';
import { noise } from '../../utils/noise.js';

export function createRemixedMap() {
    const mapSize = 32;  // Reduced from 128 to 32
    const mapDef = new MapDefinition(mapSize, mapSize);

    // Add forest clusters
    addForestCluster(4, 4, 3);  // Northwest forest
    addForestCluster(25, 6, 4); // Northeast forest
    addForestCluster(6, 25, 4); // Southwest forest
    addForestCluster(23, 23, 3); // Southeast forest
    
    // Add decorative tree lines along paths
    addTreeLine(10, 10, 15, 10, 2); // Horizontal tree line
    addTreeLine(20, 15, 20, 20, 2); // Vertical tree line

    // Add scattered individual trees
    const scatteredTrees = [
        {x: 12, y: 12},
        {x: 18, y: 8},
        {x: 8, y: 18},
        {x: 15, y: 15},
        {x: 25, y: 12},
        {x: 12, y: 25},
        {x: 20, y: 20}
    ];

    scatteredTrees.forEach(pos => {
        if (!isOccupied(pos.x, pos.y)) {
            mapDef.addTree(pos.x, pos.y);
        }
    });

    // Helper function to create forest clusters
    function addForestCluster(centerX, centerY, radius) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                // Create a natural-looking distribution
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= radius && Math.random() < 0.7 && !isOccupied(x, y)) {
                    mapDef.addTree(x, y);
                }
            }
        }
    }

    // Helper function to create tree lines
    function addTreeLine(x1, y1, x2, y2, spacing) {
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const steps = Math.floor(length / spacing);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(x1 + (x2 - x1) * t);
            const y = Math.round(y1 + (y2 - y1) * t);
            
            if (!isOccupied(x, y)) {
                mapDef.addTree(x, y);
            }
        }
    }

    // Helper function to check if a position is occupied
    function isOccupied(x, y) {
        if (x < 0 || x >= mapSize || y < 0 || y >= mapSize) {
            return true;
        }
        const tile = mapDef.getTile(x, y);
        return tile && (tile.structure || tile.type === 'water');
    }

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

    // Define districts with unique characteristics
    const districts = {
        commercial: {
            area: { x: 8, y: 5, width: 12, height: 8 },
            style: {
                materials: ['glass', 'metal'],
                maxHeight: 8,
                decorative: true
            }
        },
        residential: {
            area: { x: 22, y: 5, width: 8, height: 12 },
            style: {
                materials: ['brick', 'concrete'],
                maxHeight: 4,
                decorative: false
            }
        },
        techHub: {
            area: { x: 8, y: 15, width: 16, height: 8 },
            style: {
                materials: ['glass', 'solar'],
                maxHeight: 6,
                decorative: true
            }
        },
        industrial: {
            area: { x: 22, y: 19, width: 8, height: 8 },
            style: {
                materials: ['metal', 'concrete'],
                maxHeight: 5,
                decorative: false
            }
        }
    };

    // Adjust structure positions and styles based on districts
    const structures = [
        // Commercial District - Modern high-rises
        { 
            type: 'office', 
            x: 8, y: 5, 
            width: 5, height: 8, 
            material: 'glass',
            options: {
                floors: 6,
                roofType: 'modern'
            }
        },
        { 
            type: 'nightclub', 
            x: 14, y: 8, 
            width: 6, height: 6, 
            material: 'metal',
            options: {
                neonSigns: true,
                roofType: 'flat'
            }
        },

        // Residential District - Traditional style
        { 
            type: 'apartment', 
            x: 22, y: 5, 
            width: 4, height: 4, 
            material: 'brick',
            options: {
                floors: 3,
                roofType: 'pitched'
            }
        },
        { 
            type: 'apartment', 
            x: 22, y: 10, 
            width: 4, height: 4, 
            material: 'brick',
            options: {
                floors: 4,
                roofType: 'pitched'
            }
        },

        // Tech Hub - Futuristic designs
        { 
            type: 'office', 
            x: 8, y: 15, 
            width: 6, height: 6, 
            material: 'glass',
            options: {
                floors: 4,
                roofType: 'solar',
                features: ['solarPanels']
            }
        },
        { 
            type: 'laboratory', 
            x: 16, y: 15, 
            width: 8, height: 6, 
            material: 'metal',
            options: {
                floors: 3,
                roofType: 'dome',
                features: ['antenna']
            }
        },

        // Industrial Zone - Utilitarian structures
        { 
            type: 'factory', 
            x: 22, y: 19, 
            width: 6, height: 6, 
            material: 'metal',
            options: {
                chimneys: [{
                    x: 0.7,
                    y: 0.3,
                    smokeActive: true,
                    smokeRate: 0.5
                }]
            }
        },
        { 
            type: 'warehouse', 
            x: 22, y: 26, 
            width: 4, height: 4, 
            material: 'concrete',
            options: {
                loadingDock: true
            }
        }
    ];

    // Set terrain types based on districts
    for (const [districtName, district] of Object.entries(districts)) {
        const { area, style } = district;
        for (let y = area.y; y < area.y + area.height; y++) {
            for (let x = area.x; x < area.x + area.width; x++) {
                const currentTile = mapDef.getTile(x, y);
                if (currentTile && !currentTile.isPalette) {
                    // Adjust terrain based on district type
                    switch(districtName) {
                        case 'commercial':
                            currentTile.type = 'concrete';
                            break;
                        case 'residential':
                            currentTile.type = Math.random() < 0.7 ? 'grass' : 'walkway';
                            break;
                        case 'techHub':
                            currentTile.type = Math.random() < 0.6 ? 'tiles' : 'solar';
                            break;
                        case 'industrial':
                            currentTile.type = Math.random() < 0.8 ? 'asphalt' : 'gravel';
                            break;
                    }
                }
            }
        }
    }

    // Add structures to map with validation
    structures.forEach((struct, index) => {
        // Check if position is already occupied
        let isOccupied = false;
        for (let y = struct.y; y < struct.y + struct.height; y++) {
            for (let x = struct.x; x < struct.x + struct.width; x++) {
                const tile = mapDef.getTile(x, y);
                if (tile && tile.structure) {
                    console.warn(`Structure overlap detected at ${x},${y} for structure ${index}`);
                    isOccupied = true;
                    break;
                }
            }
            if (isOccupied) break;
        }

        if (!isOccupied) {
            mapDef.addStructure(struct);
        } else {
            console.warn(`Skipping structure ${struct.type} at ${struct.x},${struct.y} due to overlap`);
        }
    });

    // Define main pathways connecting districts
    const mainPaths = [
        // Commercial to Tech Hub central connection
        {
            start: { x: 14, y: 14 },
            end: { x: 14, y: 15 },
            type: 'plaza',
            width: 4
        },
        // Commercial to Residential walkway
        {
            start: { x: 20, y: 8 },
            end: { x: 22, y: 8 },
            type: 'garden_path',
            width: 2
        },
        // Tech Hub to Industrial connection
        {
            start: { x: 16, y: 21 },
            end: { x: 22, y: 21 },
            type: 'covered_walkway',
            width: 2
        }
    ];

    // Add internal district pathways
    const internalPaths = {
        commercial: [
            { start: { x: 8, y: 7 }, end: { x: 14, y: 7 }, type: 'plaza' },
            { start: { x: 14, y: 7 }, end: { x: 14, y: 14 }, type: 'covered_walkway' }
        ],
        techHub: [
            // Tech hub internal connections with modern walkways
            { start: { x: 8, y: 18 }, end: { x: 16, y: 18 }, type: 'solar_path' },
            { start: { x: 12, y: 15 }, end: { x: 12, y: 21 }, type: 'solar_path' }
        ],
        residential: [
            // Garden paths connecting residential buildings
            { start: { x: 22, y: 9 }, end: { x: 26, y: 9 }, type: 'garden_path' },
            { start: { x: 24, y: 5 }, end: { x: 24, y: 13 }, type: 'garden_path' }
        ]
    };

    // Place paths with special features
    function placePath(path) {
        const { start, end, type, width = 1 } = path;
        const dx = Math.sign(end.x - start.x);
        const dy = Math.sign(end.y - start.y);
        let x = start.x, y = start.y;

        while (x !== end.x || y !== end.y) {
            // Create path width
            for (let w = -Math.floor(width/2); w <= Math.floor(width/2); w++) {
                const pathX = x + (dy !== 0 ? w : 0);
                const pathY = y + (dx !== 0 ? w : 0);
                
                // Set base path tile
                mapDef.setTile(pathX, pathY, {
                    height: 0.5,
                    moisture: 0.3,
                    type: getPathTileType(type)
                });

                // Add path decorations
                if (Math.random() < 0.2) {
                    addPathDecoration(pathX, pathY, type);
                }
            }

            if (x !== end.x) x += dx;
            if (y !== end.y) y += dy;
        }
    }

    function getPathTileType(pathType) {
        switch(pathType) {
            case 'plaza': return 'tiles';
            case 'garden_path': return 'concrete';
            case 'covered_walkway': return 'asphalt';
            case 'solar_path': return 'solar';
            default: return 'concrete';
        }
    }

    function addPathDecoration(x, y, pathType) {
        switch(pathType) {
            case 'plaza':
                mapDef.decorations.push({
                    type: Math.random() < 0.5 ? 'bench' : 'planter',
                    x, y
                });
                break;
            case 'garden_path':
                mapDef.decorations.push({
                    type: Math.random() < 0.7 ? 'bush' : 'flowers',
                    x, y
                });
                break;
            case 'covered_walkway':
                if (Math.random() < 0.3) {
                    mapDef.decorations.push({
                        type: 'light',
                        x, y
                    });
                }
                break;
            case 'solar_path':
                if (Math.random() < 0.2) {
                    mapDef.decorations.push({
                        type: 'terminal',
                        x, y
                    });
                }
                break;
        }
    }

    // Place all paths
    mainPaths.forEach(path => placePath(path));
    Object.values(internalPaths).forEach(paths => 
        paths.forEach(path => placePath(path))
    );

    // Add intersection features
    function addIntersectionFeature(x, y) {
        mapDef.setTile(x, y, {
            height: 0.5,
            moisture: 0.3,
            type: 'tiles'
        });
        
        // Add decorative elements at intersections
        mapDef.decorations.push({
            type: 'fountain',
            x, y
        });
    }

    // Helper function to find intersection between two paths
    function findPathIntersection(path1, path2) {
        // Convert paths to line segments
        const line1 = {
            x1: path1.start.x,
            y1: path1.start.y,
            x2: path1.end.x,
            y2: path1.end.y
        };
        
        const line2 = {
            x1: path2.start.x,
            y1: path2.start.y,
            x2: path2.end.x,
            y2: path2.end.y
        };

        // Calculate intersection
        const denominator = (line2.y2 - line2.y1) * (line1.x2 - line1.x1) - 
                          (line2.x2 - line2.x1) * (line1.y2 - line1.y1);

        if (denominator === 0) {
            return null; // Lines are parallel
        }

        const ua = ((line2.x2 - line2.x1) * (line1.y1 - line2.y1) - 
                    (line2.y2 - line2.y1) * (line1.x1 - line2.x1)) / denominator;
        const ub = ((line1.x2 - line1.x1) * (line1.y1 - line2.y1) - 
                    (line1.y2 - line1.y1) * (line1.x1 - line2.x1)) / denominator;

        // Check if intersection occurs within both line segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return null;
        }

        // Calculate intersection point
        const x = Math.round(line1.x1 + ua * (line1.x2 - line1.x1));
        const y = Math.round(line1.y1 + ua * (line1.y2 - line1.y1));

        return { x, y };
    }

    // Find and enhance path intersections
    mainPaths.forEach(path1 => {
        mainPaths.forEach(path2 => {
            if (path1 !== path2) {
                const intersection = findPathIntersection(path1, path2);
                if (intersection) {
                    addIntersectionFeature(intersection.x, intersection.y);
                }
            }
        });
    });

    // Add decorative areas between structures
    const decorativeAreas = [
        // Commercial district plaza
        {
            type: 'plaza',
            x: 10,
            y: 10,
            width: 4,
            height: 4,
            style: 'modern',
            features: ['fountain', 'benches', 'planters']
        },
        // Residential gardens
        {
            type: 'garden',
            x: 26,
            y: 7,
            width: 3,
            height: 5,
            style: 'traditional',
            features: ['flowers', 'trees', 'pond']
        },
        // Tech hub courtyard
        {
            type: 'courtyard',
            x: 14,
            y: 17,
            width: 4,
            height: 3,
            style: 'futuristic',
            features: ['hologram', 'solar_art', 'smart_benches']
        },
        // Green buffer zone
        {
            type: 'park',
            x: 18,
            y: 12,
            width: 4,
            height: 3,
            style: 'natural',
            features: ['trees', 'grass', 'rock_garden']
        }
    ];

    function createDecorativeArea(area) {
        const { type, x, y, width, height, style, features } = area;
        
        // Set base tiles for the area
        for (let dx = 0; dx < width; dx++) {
            for (let dy = 0; dy < height; dy++) {
                const tileX = x + dx;
                const tileY = y + dy;
                
                // Skip if tile is already occupied by a structure
                const currentTile = mapDef.getTile(tileX, tileY);
                if (currentTile && currentTile.structure) continue;

                // Set appropriate base tile type
                const baseTile = getDecorativeBaseTile(type, style);
                mapDef.setTile(tileX, tileY, {
                    height: 0.5,
                    moisture: 0.6,
                    type: baseTile
                });

                // Add decorative features
                addDecorativeFeatures(tileX, tileY, type, style, features, dx, dy, width, height);
            }
        }
    }

    function getDecorativeBaseTile(type, style) {
        switch (type) {
            case 'plaza': return 'tiles';
            case 'garden': return 'grass';
            case 'courtyard': return style === 'futuristic' ? 'solar' : 'tiles';
            case 'park': return 'grass';
            default: return 'concrete';
        }
    }

    function addDecorativeFeatures(x, y, type, style, features, dx, dy, width, height) {
        // Edge decorations
        if (dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1) {
            addEdgeDecorations(x, y, type, style);
            return;
        }

        // Center features
        if (dx === Math.floor(width/2) && dy === Math.floor(height/2)) {
            addCenterpiece(x, y, type, features);
            return;
        }

        // Random decorative elements
        if (Math.random() < 0.3) {
            addRandomDecoration(x, y, type, features);
        }
    }

    function addEdgeDecorations(x, y, type, style) {
        switch (style) {
            case 'modern':
                mapDef.decorations.push({
                    type: 'planter',
                    x, y,
                    variant: 'modern'
                });
                break;
            case 'traditional':
                mapDef.decorations.push({
                    type: 'hedge',
                    x, y
                });
                break;
            case 'futuristic':
                mapDef.decorations.push({
                    type: 'light',
                    x, y,
                    variant: 'neon'
                });
                break;
            case 'natural':
                if (Math.random() < 0.5) {
                    mapDef.decorations.push({
                        type: 'bush',
                        x, y
                    });
                }
                break;
        }
    }

    function addCenterpiece(x, y, type, features) {
        switch (type) {
            case 'plaza':
                mapDef.decorations.push({
                    type: 'fountain',
                    x, y,
                    variant: 'large'
                });
                break;
            case 'garden':
                mapDef.decorations.push({
                    type: 'pond',
                    x, y,
                    variant: 'decorative'
                });
                break;
            case 'courtyard':
                mapDef.decorations.push({
                    type: 'hologram',
                    x, y,
                    variant: 'interactive'
                });
                break;
            case 'park':
                mapDef.decorations.push({
                    type: 'statue',
                    x, y,
                    variant: 'nature'
                });
                break;
        }
    }

    function addRandomDecoration(x, y, type, features) {
        const feature = features[Math.floor(Math.random() * features.length)];
        mapDef.decorations.push({
            type: feature,
            x, y
        });
    }

    // Create all decorative areas
    decorativeAreas.forEach(area => createDecorativeArea(area));

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
