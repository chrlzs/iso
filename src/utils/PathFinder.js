/**
 * A* Pathfinding implementation for isometric grid
 */
export class PathFinder {
    /**
     * Creates a new pathfinder
     * @param {IsometricWorld} world - The world to find paths in
     */
    constructor(world) {
        this.world = world;
    }

    /**
     * Finds a path between two points using A* algorithm
     * @param {number} startX - Starting X grid position
     * @param {number} startY - Starting Y grid position
     * @param {number} endX - Ending X grid position
     * @param {number} endY - Ending Y grid position
     * @param {Object} options - Pathfinding options
     * @returns {Array} Array of points {x, y} forming the path, or null if no path found
     */
    findPath(startX, startY, endX, endY, options = {}) {
        const debug = this.world.game && this.world.game.options.debug;

        if (debug) {
            console.log(`Finding path from (${startX}, ${startY}) to (${endX}, ${endY})`);
        }

        // Default options
        const defaultOptions = {
            maxIterations: 500,  // Reduced from 1000 to 500 for better performance
            diagonalMovement: true,
            heuristicWeight: 1.5, // Increased from 1.2 to 1.5 for faster path finding
            ignoreWater: true,
            maxPathLength: 50    // Maximum path length to prevent very long paths
        };

        const pathOptions = { ...defaultOptions, ...options };

        // Check if start and end are the same
        if (startX === endX && startY === endY) {
            if (debug) {
                console.log('Start and end are the same, returning empty path');
            }
            return [];
        }

        // Check if end tile is walkable
        const endTile = this.world.getTile(endX, endY);
        if (!endTile || !endTile.walkable || (pathOptions.ignoreWater && endTile.type === 'water')) {
            if (debug) {
                console.log(`End tile (${endX}, ${endY}) is not walkable or is water`);
            }
            return null;
        }

        // Initialize open and closed sets
        const openSet = new Map();
        const closedSet = new Map();

        // Add start node to open set
        const startNode = {
            x: startX,
            y: startY,
            g: 0,
            h: this.heuristic(startX, startY, endX, endY, pathOptions.heuristicWeight),
            parent: null
        };
        startNode.f = startNode.g + startNode.h;

        openSet.set(this.nodeKey(startX, startY), startNode);

        // Main A* loop
        let iterations = 0;

        // Calculate Manhattan distance from start to end for early termination check
        const directDistance = Math.abs(endX - startX) + Math.abs(endY - startY);

        // If direct distance is too large, return null immediately
        if (directDistance > pathOptions.maxPathLength * 2) {
            if (debug) {
                console.log(`Direct distance ${directDistance} exceeds maximum allowed, skipping pathfinding`);
            }
            return null;
        }

        while (openSet.size > 0 && iterations < pathOptions.maxIterations) {
            iterations++;

            // Find node with lowest f score in open set
            // This is a performance bottleneck in A*, so we optimize it
            let currentNode = null;
            let lowestF = Infinity;

            // Use a faster approach for small open sets
            if (openSet.size < 10) {
                for (const [_, node] of openSet) {
                    if (node.f < lowestF) {
                        lowestF = node.f;
                        currentNode = node;
                    }
                }
            } else {
                // For larger open sets, use Array.from for better performance
                const nodes = Array.from(openSet.values());
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    if (node.f < lowestF) {
                        lowestF = node.f;
                        currentNode = node;
                    }
                }
            }

            // If we reached the end, reconstruct and return the path
            if (currentNode.x === endX && currentNode.y === endY) {
                if (debug) {
                    console.log(`Path found in ${iterations} iterations`);
                }
                return this.reconstructPath(currentNode, pathOptions);
            }

            // Move current node from open to closed set
            openSet.delete(this.nodeKey(currentNode.x, currentNode.y));
            closedSet.set(this.nodeKey(currentNode.x, currentNode.y), currentNode);

            // Get neighbors
            const neighbors = this.getNeighbors(currentNode.x, currentNode.y, pathOptions);

            for (const neighbor of neighbors) {
                // Skip if neighbor is in closed set
                if (closedSet.has(this.nodeKey(neighbor.x, neighbor.y))) {
                    continue;
                }

                // Calculate tentative g score
                const tentativeG = currentNode.g + this.distance(currentNode.x, currentNode.y, neighbor.x, neighbor.y);

                // Check if neighbor is in open set
                const neighborKey = this.nodeKey(neighbor.x, neighbor.y);
                const existingNeighbor = openSet.get(neighborKey);

                if (!existingNeighbor) {
                    // Add neighbor to open set
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor.x, neighbor.y, endX, endY, pathOptions.heuristicWeight);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;

                    openSet.set(neighborKey, neighbor);
                } else if (tentativeG < existingNeighbor.g) {
                    // Update existing neighbor with better path
                    existingNeighbor.g = tentativeG;
                    existingNeighbor.f = existingNeighbor.g + existingNeighbor.h;
                    existingNeighbor.parent = currentNode;
                }
            }
        }

        // If we get here, no path was found
        if (debug) {
            console.log(`No path found after ${iterations} iterations`);
        }
        return null;
    }

    /**
     * Gets walkable neighbors for a node
     * @param {number} x - Node X position
     * @param {number} y - Node Y position
     * @param {Object} options - Pathfinding options
     * @returns {Array} Array of neighbor nodes
     * @private
     */
    getNeighbors(x, y, options) {
        const neighbors = [];

        // Define directions (4 or 8 depending on diagonal movement)
        // Orthogonal directions first (more likely to be valid)
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 }   // Right
        ];

        // Add diagonal directions if enabled (check these last)
        if (options.diagonalMovement) {
            directions.push(
                { dx: -1, dy: -1 }, // Top-left
                { dx: 1, dy: -1 },  // Top-right
                { dx: -1, dy: 1 },  // Bottom-left
                { dx: 1, dy: 1 }    // Bottom-right
            );
        }

        // Reuse neighbor object for better performance
        const neighbor = {
            g: 0,
            h: 0,
            f: 0,
            parent: null
        };

        // Check each direction
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            // Get tile at this position
            const tile = this.world.getTile(nx, ny);

            // Skip if tile doesn't exist or isn't walkable
            if (!tile || !tile.walkable || tile.structure) {
                continue;
            }

            // Skip water tiles if ignoreWater is true
            if (options.ignoreWater && tile.type === 'water') {
                continue;
            }

            // Add valid neighbor (create a new object to avoid reference issues)
            neighbors.push({
                x: nx,
                y: ny,
                g: 0,
                h: 0,
                f: 0,
                parent: null
            });
        }

        return neighbors;
    }

    /**
     * Calculates the heuristic (estimated distance) between two points
     * @param {number} x1 - Start X position
     * @param {number} y1 - Start Y position
     * @param {number} x2 - End X position
     * @param {number} y2 - End Y position
     * @param {number} weight - Heuristic weight (higher values prioritize path exploration toward the goal)
     * @returns {number} Heuristic value
     * @private
     */
    heuristic(x1, y1, x2, y2, weight = 1.0) {
        // Use octile distance for better diagonal movement estimation
        // This is more accurate than Manhattan distance when diagonal movement is allowed
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);

        // Octile distance: D * max(dx, dy) + (D2 - D) * min(dx, dy)
        // where D is the orthogonal cost (1.0) and D2 is the diagonal cost (1.414)
        return weight * (Math.max(dx, dy) + (0.414 * Math.min(dx, dy)));
    }

    /**
     * Calculates the distance between two points
     * @param {number} x1 - Start X position
     * @param {number} y1 - Start Y position
     * @param {number} x2 - End X position
     * @param {number} y2 - End Y position
     * @returns {number} Distance value
     * @private
     */
    distance(x1, y1, x2, y2) {
        // For diagonal movement, use Euclidean distance
        if (x1 !== x2 && y1 !== y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }

        // For orthogonal movement, use Manhattan distance
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    /**
     * Creates a unique key for a node
     * @param {number} x - Node X position
     * @param {number} y - Node Y position
     * @returns {string} Unique key
     * @private
     */
    nodeKey(x, y) {
        return `${x},${y}`;
    }

    /**
     * Reconstructs the path from the end node
     * @param {Object} endNode - End node
     * @param {Object} options - Pathfinding options
     * @returns {Array} Array of points {x, y} forming the path
     * @private
     */
    reconstructPath(endNode, options = {}) {
        const path = [];
        let currentNode = endNode;

        // Reconstruct the full path
        while (currentNode) {
            path.unshift({
                x: currentNode.x,
                y: currentNode.y
            });
            currentNode = currentNode.parent;
        }

        // If path is too long, simplify it by removing intermediate points
        const maxPathLength = options.maxPathLength || 50;
        if (path.length > maxPathLength) {
            // Keep start, end, and some key points in between
            const simplifiedPath = [];
            const step = Math.max(1, Math.floor(path.length / maxPathLength));

            // Always include the start point
            simplifiedPath.push(path[0]);

            // Add intermediate points at regular intervals
            for (let i = step; i < path.length - 1; i += step) {
                simplifiedPath.push(path[i]);
            }

            // Always include the end point
            if (path.length > 1) {
                simplifiedPath.push(path[path.length - 1]);
            }

            return simplifiedPath;
        }

        return path;
    }
}
