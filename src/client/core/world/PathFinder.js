export class PathFinder {
    constructor(world, options = {}) {
        this.world = world;
        this.openSet = new Set();
        this.closedSet = new Set();
        this.cameFrom = new Map();
        this.gScore = new Map();
        this.fScore = new Map();

        this.maxIterations = options.maxIterations || 1000;
        this.maxPathLength = options.maxPathLength || 100;
    }

    findPath(startX, startY, endX, endY) {
        console.log(`Finding path from (${startX},${startY}) to (${endX},${endY})`);
        
        // Round coordinates to ensure integer values
        startX = Math.round(startX);
        startY = Math.round(startY);
        endX = Math.round(endX);
        endY = Math.round(endY);

        // Check if target is inside a structure
        const structures = this.world.getAllStructures();
        let targetStructure = null;
        for (const structure of structures) {
            if (endX >= structure.x && endX < structure.x + structure.width &&
                endY >= structure.y && endY < structure.y + structure.height) {
                targetStructure = structure;
                break;
            }
        }

        // If targeting inside a structure, path to door + one step inside
        if (targetStructure) {
            const nearestDoor = this.findNearestDoor(endX, endY);
            if (!nearestDoor) {
                console.warn('No door found for structure');
                return null;
            }

            // Get the interior tile adjacent to the door
            const interiorTile = this.getInteriorTileFromDoor(nearestDoor.x, nearestDoor.y, targetStructure);
            if (!interiorTile) {
                console.warn('Could not find walkable interior tile next to door');
                return null;
            }

            // Create path to door
            const pathToDoor = this.findSinglePath(startX, startY, nearestDoor.x, nearestDoor.y);
            if (!pathToDoor) {
                console.warn('Could not find path to door');
                return null;
            }

            // Add the interior tile to the path
            pathToDoor.push(interiorTile);
            return pathToDoor;
        }

        // Regular pathfinding for non-structure targets
        return this.findSinglePath(startX, startY, endX, endY);
    }

    getInteriorTileFromDoor(doorX, doorY, structure) {
        // Check all adjacent tiles to find one that's inside the structure
        const adjacentTiles = [
            {x: doorX-1, y: doorY},
            {x: doorX+1, y: doorY},
            {x: doorX, y: doorY-1},
            {x: doorX, y: doorY+1}
        ];

        for (const tile of adjacentTiles) {
            if (tile.x >= structure.x && tile.x < structure.x + structure.width &&
                tile.y >= structure.y && tile.y < structure.y + structure.height) {
                // Verify the tile is actually walkable inside the structure
                if (this.isWalkable(tile.x, tile.y, true)) {
                    return tile;
                }
            }
        }

        return null;
    }

    findSinglePath(startX, startY, endX, endY, allowInterior = false) {
        // Validate coordinates
        if (!this.isValidCoordinate(startX, startY) || !this.isValidCoordinate(endX, endY)) {
            console.warn('Invalid coordinates for pathfinding');
            return null;
        }

        // Check walkability with interior flag
        if (!this.isWalkable(startX, startY, allowInterior) || !this.isWalkable(endX, endY, allowInterior)) {
            console.warn('Start or end position is not walkable');
            return null;
        }

        // Clear previous data
        this.openSet.clear();
        this.closedSet.clear();
        this.cameFrom.clear();
        this.gScore.clear();
        this.fScore.clear();
        
        const start = `${startX},${startY}`;
        const end = `${endX},${endY}`;
        
        this.openSet.add(start);
        this.gScore.set(start, 0);
        this.fScore.set(start, this.heuristic(startX, startY, endX, endY));
        
        let iterations = 0;
        
        while (this.openSet.size > 0) {
            iterations++;
            if (iterations > this.maxIterations) {
                console.warn(`Pathfinding exceeded maximum iterations (${this.maxIterations})`);
                return null;
            }
            
            const current = this.getLowestFScore();
            if (!current) break;
            
            if (current === end) {
                const path = this.reconstructPath(current);
                console.log('Path found:', path);
                return path;
            }
            
            this.openSet.delete(current);
            this.closedSet.add(current);
            
            const [x, y] = current.split(',').map(Number);
            const neighbors = this.getValidNeighbors(x, y, allowInterior);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (this.closedSet.has(neighborKey)) continue;
                
                const tentativeGScore = this.gScore.get(current) + this.getMovementCost(x, y, neighbor.x, neighbor.y);
                
                if (!this.openSet.has(neighborKey)) {
                    this.openSet.add(neighborKey);
                } else if (tentativeGScore >= this.gScore.get(neighborKey)) {
                    continue;
                }
                
                this.cameFrom.set(neighborKey, current);
                this.gScore.set(neighborKey, tentativeGScore);
                this.fScore.set(neighborKey, tentativeGScore + 
                    this.heuristic(neighbor.x, neighbor.y, endX, endY));
            }
        }
        
        console.warn('No path found');
        return null;
    }

    findNearestDoor(targetX, targetY) {
        console.log(`Finding nearest door for target (${targetX},${targetY})`);
        const structures = this.world.getAllStructures();
        let nearestDoor = null;
        let shortestDistance = Infinity;
        let targetStructure = null;

        // First find which structure we're targeting
        for (const structure of structures) {
            if (targetX >= structure.x && targetX < structure.x + structure.width &&
                targetY >= structure.y && targetY < structure.y + structure.height) {
                targetStructure = structure;
                break;
            }
        }

        if (!targetStructure) {
            console.warn('No structure found at target location');
            return null;
        }

        // Search entire structure perimeter
        for (let x = targetStructure.x - 1; x <= targetStructure.x + targetStructure.width; x++) {
            for (let y = targetStructure.y - 1; y <= targetStructure.y + targetStructure.height; y++) {
                // Only check perimeter
                if (x === targetStructure.x - 1 || x === targetStructure.x + targetStructure.width ||
                    y === targetStructure.y - 1 || y === targetStructure.y + targetStructure.height) {
                    
                    if (!this.isValidCoordinate(x, y)) continue;

                    const height = this.world.generateHeight(x, y);
                    const moisture = this.world.generateMoisture(x, y);
                    const tile = this.world.generateTile(x, y, height, moisture);

                    if (tile?.type === 'door') {
                        const distance = Math.abs(x - targetX) + Math.abs(y - targetY);
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            nearestDoor = { x, y };
                            console.log(`Found potential door at (${x},${y}) distance: ${distance}`);
                        }
                    }
                }
            }
        }

        if (!nearestDoor) {
            console.warn('No doors found for structure');
        } else {
            console.log(`Selected nearest door at (${nearestDoor.x},${nearestDoor.y})`);
        }
        
        return nearestDoor;
    }

    getMovementCost(fromX, fromY, toX, toY, customCosts = null, allowInterior = false) {
        if (!this.isWalkable(toX, toY, allowInterior) || !this.isWalkable(fromX, fromY, allowInterior)) {
            return Infinity;
        }

        const fromTile = this.world.generateTile(
            fromX, fromY, 
            this.world.generateHeight(fromX, fromY),
            this.world.generateMoisture(fromX, fromY)
        );
        const toTile = this.world.generateTile(
            toX, toY,
            this.world.generateHeight(toX, toY),
            this.world.generateMoisture(toX, toY)
        );

        // Use custom costs if provided (for road building)
        if (customCosts && customCosts[toTile.type]) {
            return customCosts[toTile.type];
        }

        // Default movement costs
        let cost = 1;

        // Add height difference penalty
        const heightDiff = Math.abs(fromTile.height - toTile.height);
        cost += heightDiff * 0.5;

        // Standard terrain costs
        const terrainCosts = {
            'asphalt': 0.8,  // Prefer roads for pathfinding
            'concrete': 0.9,
            'sidewalk': 0.9,
            'sand': 1.5,
            'dirt': 1,
            'grass': 1,
            'stone': 1.2,
            'water': Infinity,  // Make water impassable
            'wetland': Infinity, // Make wetland impassable
            'door': 0.1  // Strongly prefer doors when available
        };

        cost *= terrainCosts[toTile.type] || 1;

        // Add additional door preference when near structures
        if (toTile.type === 'door') {
            const structures = this.world.getAllStructures();
            for (const structure of structures) {
                // If either from or to position is adjacent to structure
                if ((Math.abs(fromX - structure.x) <= 1 || Math.abs(fromX - (structure.x + structure.width)) <= 1) ||
                    (Math.abs(fromY - structure.y) <= 1 || Math.abs(fromY - (structure.y + structure.height)) <= 1) ||
                    (Math.abs(toX - structure.x) <= 1 || Math.abs(toX - (structure.x + structure.width)) <= 1) ||
                    (Math.abs(toY - structure.y) <= 1 || Math.abs(toY - (structure.y + structure.height)) <= 1)) {
                    cost *= 0.1; // Further reduce cost when near structures
                    break;
                }
            }
        }

        return cost;
    }
    
    heuristic(x1, y1, x2, y2) {
        // Manhattan distance with diagonal movement allowed
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    }
    
    getLowestFScore() {
        let lowest = null;
        let lowestScore = Infinity;
        
        for (const node of this.openSet) {
            const score = this.fScore.get(node);
            if (score < lowestScore) {
                lowest = node;
                lowestScore = score;
            }
        }
        
        return lowest;
    }

    isValidCoordinate(x, y) {
        return x >= 0 && x < this.world.width && 
               y >= 0 && y < this.world.height;
    }

    getValidNeighbors(x, y, allowInterior = false) {
        let neighbors = [
            {x: x-1, y: y},   // Left
            {x: x+1, y: y},   // Right
            {x: x, y: y-1},   // Up
            {x: x, y: y+1}    // Down
        ];
        
        // Add diagonal moves if current tile or any adjacent tile is a door
        const height = this.world.generateHeight(x, y);
        const moisture = this.world.generateMoisture(x, y);
        const currentTile = this.world.generateTile(x, y, height, moisture);

        if (currentTile?.type === 'door' || this.hasAdjacentDoor(x, y)) {
            neighbors = neighbors.concat([
                {x: x-1, y: y-1}, // Top-left
                {x: x+1, y: y-1}, // Top-right
                {x: x-1, y: y+1}, // Bottom-left
                {x: x+1, y: y+1}  // Bottom-right
            ]);
        }
        
        return neighbors.filter(n => 
            this.isValidCoordinate(n.x, n.y) && 
            this.isWalkable(n.x, n.y, allowInterior)
        );
    }

    hasAdjacentDoor(x, y) {
        const adjacentPositions = [
            {x: x-1, y: y},
            {x: x+1, y: y},
            {x: x, y: y-1},
            {x: x, y: y+1}
        ];

        return adjacentPositions.some(pos => {
            if (this.isValidCoordinate(pos.x, pos.y)) {
                const tile = this.world.getTileAt(pos.x, pos.y);
                return tile?.type === 'door';
            }
            return false;
        });
    }

    reconstructPath(current) {
        const path = [];
        while (this.cameFrom.has(current)) {
            const [x, y] = current.split(',').map(Number);
            path.unshift({x, y});
            current = this.cameFrom.get(current);
        }
        const [startX, startY] = current.split(',').map(Number);
        path.unshift({x: startX, y: startY});
        return path;
    }

    isWalkable(x, y, allowInterior = false) {
        // First check if coordinates are valid
        if (!this.isValidCoordinate(x, y)) {
            return false;
        }

        // Get the actual tile from the world
        const height = this.world.generateHeight(x, y);
        const moisture = this.world.generateMoisture(x, y);
        const tile = this.world.generateTile(x, y, height, moisture);

        // List of non-walkable tile types
        const nonWalkableTiles = ['water', 'wetland'];
        
        // Check if tile exists and is walkable
        if (!tile || nonWalkableTiles.includes(tile.type)) {
            return false;
        }

        // Get all structures and check if point is inside any of them
        const structures = this.world.getAllStructures();
        for (const structure of structures) {
            // If point is inside structure bounds
            if (x >= structure.x && x < structure.x + structure.width &&
                y >= structure.y && y < structure.y + structure.height) {
                // Allow interior movement or only on doors based on flag
                return allowInterior || tile.type === 'door';
            }
        }

        return true;
    }
}











