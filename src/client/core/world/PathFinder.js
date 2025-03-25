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

        // Validate coordinates
        if (!this.isValidCoordinate(startX, startY) || !this.isValidCoordinate(endX, endY)) {
            console.warn('Invalid coordinates for pathfinding');
            return null;
        }

        // Check if start or end points are not walkable
        if (!this.isWalkable(startX, startY)) {
            console.warn('Start position is not walkable');
            return null;
        }
        if (!this.isWalkable(endX, endY)) {
            console.warn('End position is not walkable');
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
                console.warn('Pathfinding exceeded maximum iterations');
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
            const neighbors = this.getValidNeighbors(x, y);
            
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

    getMovementCost(fromX, fromY, toX, toY, customCosts = null) {
        const fromTile = this.world.getTileAt(fromX, fromY);
        const toTile = this.world.getTileAt(toX, toY);

        if (!this.isWalkable(toX, toY) || !this.isWalkable(fromX, fromY)) {
            return Infinity;
        }

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
            'stone': 1.2
        };

        cost *= terrainCosts[toTile.type] || 1;

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

    getValidNeighbors(x, y) {
        // Include diagonal movements
        const neighbors = [
            {x: x-1, y: y}, {x: x+1, y: y},
            {x: x, y: y-1}, {x: x, y: y+1},
            {x: x-1, y: y-1}, {x: x-1, y: y+1},
            {x: x+1, y: y-1}, {x: x+1, y: y+1}
        ];
        
        return neighbors.filter(n => 
            this.isValidCoordinate(n.x, n.y) && 
            this.isWalkable(n.x, n.y)
        );
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

    isWalkable(x, y) {
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

        // Check if tile has a structure blocking the path
        if (tile.structure) {
            // You might want to add logic here to allow walking through doors
            // or specific parts of structures
            return false;
        }

        return true;
    }
}









