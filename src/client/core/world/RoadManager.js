import { PathFinder } from './PathFinder.js';

export class RoadManager {
    constructor(world) {
        this.world = world;
        this.pathFinder = new PathFinder(world);
        this.roadNetwork = new Map(); // Stores road segments and their types
    }

    generateRoadNetwork() {
        const structures = this.world.structureManager.structures;
        const processedPairs = new Set();

        // Connect major structures first
        for (const [id1, struct1] of structures) {
            for (const [id2, struct2] of structures) {
                if (id1 === id2) continue;
                
                const pairKey = [id1, id2].sort().join('-');
                if (processedPairs.has(pairKey)) continue;
                
                // Calculate importance of connection based on structure types
                const importance = this.calculateConnectionImportance(struct1, struct2);
                if (importance > 0.5) {
                    this.buildRoad(struct1, struct2, importance);
                }
                
                processedPairs.add(pairKey);
            }
        }
    }

    buildRoad(start, end, importance) {
        // Get entry points for structures
        const startPoint = this.getStructureEntryPoint(start);
        const endPoint = this.getStructureEntryPoint(end);

        // Configure pathfinding costs for road building
        const roadCosts = {
            'asphalt': 0.1,  // Strongly prefer existing roads
            'concrete': 0.2,
            'sidewalk': 0.3,
            'dirt': 1.0,
            'grass': 1.2,
            'stone': 1.5,
            'sand': 2.0,
            'water': Infinity,
            'wetland': Infinity
        };

        // Check and avoid structures
        const structures = this.world.getAllStructures();
        for (const structure of structures) {
            // Mark structure tiles as impassable for roads
            for (let dx = 0; dx < structure.width; dx++) {
                for (let dy = 0; dy < structure.height; dy++) {
                    const x = structure.x + dx;
                    const y = structure.y + dy;
                    const key = `${x},${y}`;
                    roadCosts[key] = Infinity;
                }
            }
        }

        // Find path using modified A* algorithm
        const path = this.pathFinder.findPath(
            startPoint.x, startPoint.y,
            endPoint.x, endPoint.y,
            roadCosts
        );

        if (path) {
            this.constructRoadAlongPath(path, importance);
        }
    }

    constructRoadAlongPath(path, importance) {
        const roadWidth = importance > 0.8 ? 2 : 1;
        
        path.forEach((point, index) => {
            // Determine road direction for proper tile variants
            const direction = index < path.length - 1 
                ? this.calculateDirection(point, path[index + 1])
                : null;

            // Check for intersection with existing roads
            const isIntersection = this.checkForIntersection(point.x, point.y);

            // Place road tiles with wider radius at intersections
            const width = isIntersection ? roadWidth + 1 : roadWidth;
            
            for (let dx = -width; dx <= width; dx++) {
                for (let dy = -width; dy <= width; dy++) {
                    const x = point.x + dx;
                    const y = point.y + dy;
                    
                    if (Math.abs(dx) === width || Math.abs(dy) === width) {
                        // Place sidewalks on the edges
                        this.placeTile(x, y, 'sidewalk', direction);
                    } else if (isIntersection && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                        // Place intersection tiles
                        this.placeTile(x, y, 'asphalt', 'intersection');
                    } else {
                        // Place road in the middle
                        this.placeTile(x, y, 'asphalt', direction);
                    }
                }
            }
        });
    }

    checkForIntersection(x, y) {
        let roadCount = 0;
        // Check surrounding tiles for existing roads
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const tile = this.world.getTileAt(x + dx, y + dy);
                if (tile && tile.type === 'asphalt') {
                    roadCount++;
                }
            }
        }
        return roadCount > 2; // Consider it an intersection if more than 2 road tiles nearby
    }

    placeTile(x, y, type, direction) {
        const tile = this.world.getTileAt(x, y);
        if (!tile) return;

        // Don't override existing structures or water
        if (tile.structure || tile.type === 'water') return;

        // Update tile properties
        tile.type = type;
        tile.variant = this.getRoadVariant(type, direction);
        
        // Store in road network for future reference
        this.roadNetwork.set(`${x},${y}`, {
            type,
            direction,
            connections: []
        });
    }

    getRoadVariant(type, direction) {
        if (!direction) return `${type}_straight`;
        
        const variants = {
            asphalt: {
                'N-S': 'asphalt_vertical',
                'E-W': 'asphalt_horizontal',
                'NE': 'asphalt_curve_ne',
                'NW': 'asphalt_curve_nw',
                'SE': 'asphalt_curve_se',
                'SW': 'asphalt_curve_sw',
                'intersection': 'asphalt_intersection'
            },
            sidewalk: {
                'N-S': 'sidewalk_vertical',
                'E-W': 'sidewalk_horizontal',
                'NE': 'sidewalk_corner_ne',
                'NW': 'sidewalk_corner_nw',
                'SE': 'sidewalk_corner_se',
                'SW': 'sidewalk_corner_sw'
            }
        };

        return variants[type]?.[direction] || `${type}_default`;
    }

    calculateDirection(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return 'E-W';
        } else if (Math.abs(dy) > Math.abs(dx)) {
            return 'N-S';
        } else if (dx > 0 && dy > 0) {
            return 'SE';
        } else if (dx > 0 && dy < 0) {
            return 'NE';
        } else if (dx < 0 && dy > 0) {
            return 'SW';
        } else {
            return 'NW';
        }
    }

    calculateConnectionImportance(struct1, struct2) {
        // Importance weights for different structure types
        const weights = {
            'apartment': 0.8,
            'office': 0.9,
            'nightclub': 0.7,
            'factory': 0.6
        };

        // Calculate base importance from structure types
        const importance1 = weights[struct1.type] || 0.5;
        const importance2 = weights[struct2.type] || 0.5;
        
        // Calculate distance factor (closer = more important)
        const distance = Math.sqrt(
            Math.pow(struct1.x - struct2.x, 2) + 
            Math.pow(struct1.y - struct2.y, 2)
        );
        const distanceFactor = Math.max(0, 1 - (distance / 100));

        return (importance1 + importance2) * distanceFactor / 2;
    }

    getStructureEntryPoint(structure) {
        // Default to structure center if no specific entry point
        return {
            x: structure.x + Math.floor(structure.width / 2),
            y: structure.y + structure.height // Front of structure
        };
    }
}

