/**
 * Represents a node in the pathfinding grid
 */
class Node {
    constructor(x, y, height) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.f = 0; // Total cost (g + h)
        this.g = 0; // Cost from start to this node
        this.h = 0; // Heuristic (estimated cost to end)
        this.parent = null;
        this.closed = false;
        this.opened = false;
    }
}

/**
 * A* pathfinding implementation with terrain height consideration
 */
export class PathFinder {
    constructor(world) {
        this.world = world;
        this.maxHeightDifference = 1; // Maximum climbable height difference
    }

    /**
     * Finds a path between two points
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {number} endX - Ending X coordinate
     * @param {number} endY - Ending Y coordinate
     * @returns {Array<{x: number, y: number}>|null} Array of path coordinates or null if no path found
     */
    findPath(startX, startY, endX, endY) {
        const openList = [];
        const nodeGrid = new Map();

        // Create start and end nodes
        const startNode = new Node(startX, startY, this.getTileHeight(startX, startY));
        const endNode = new Node(endX, endY, this.getTileHeight(endX, endY));

        // Initialize start node
        startNode.opened = true;
        openList.push(startNode);
        this.setNode(nodeGrid, startX, startY, startNode);

        while (openList.length > 0) {
            // Get node with lowest f value
            const currentNode = this.getLowestFNode(openList);
            
            // Check if we reached the end
            if (currentNode.x === endX && currentNode.y === endY) {
                return this.reconstructPath(currentNode);
            }

            // Move current node from open to closed list
            currentNode.opened = false;
            currentNode.closed = true;
            this.removeFromArray(openList, currentNode);

            // Check all adjacent tiles
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.closed) continue;

                // Calculate new g cost
                const heightDifference = Math.abs(neighbor.height - currentNode.height);
                const movementCost = this.calculateMovementCost(currentNode, neighbor);
                const newG = currentNode.g + movementCost;

                if (!neighbor.opened || newG < neighbor.g) {
                    neighbor.g = newG;
                    neighbor.h = this.heuristic(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;

                    if (!neighbor.opened) {
                        neighbor.opened = true;
                        openList.push(neighbor);
                        this.setNode(nodeGrid, neighbor.x, neighbor.y, neighbor);
                    }
                }
            }
        }

        // No path found
        return null;
    }

    /**
     * Calculates movement cost between two nodes considering height difference
     * @private
     */
    calculateMovementCost(fromNode, toNode) {
        const heightDifference = Math.abs(toNode.height - fromNode.height);
        const baseCost = 1;
        const heightCost = heightDifference * 1.5; // Penalty for climbing/descending
        
        // Diagonal movement costs more
        const isDiagonal = fromNode.x !== toNode.x && fromNode.y !== toNode.y;
        const diagonalMultiplier = isDiagonal ? Math.SQRT2 : 1;

        return (baseCost + heightCost) * diagonalMultiplier;
    }

    /**
     * Manhattan distance heuristic
     * @private
     */
    heuristic(nodeA, nodeB) {
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
    }

    /**
     * Gets neighboring nodes
     * @private
     */
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];

        for (const [dx, dy] of directions) {
            const x = node.x + dx;
            const y = node.y + dy;

            // Check bounds
            if (!this.isInBounds(x, y)) continue;

            const height = this.getTileHeight(x, y);
            
            // Check if height difference is traversable
            const heightDiff = Math.abs(height - node.height);
            if (heightDiff > this.maxHeightDifference) continue;

            neighbors.push(new Node(x, y, height));
        }

        return neighbors;
    }

    /**
     * Gets tile height at coordinates
     * @private
     */
    getTileHeight(x, y) {
        const tile = this.world.getTile(x, y);
        return tile ? tile.height : 0;
    }

    /**
     * Checks if coordinates are within world bounds
     * @private
     */
    isInBounds(x, y) {
        return x >= 0 && x < this.world.width && y >= 0 && y < this.world.height;
    }

    /**
     * Gets node with lowest f value from array
     * @private
     */
    getLowestFNode(nodes) {
        return nodes.reduce((min, node) => 
            (node.f < min.f) ? node : min, nodes[0]);
    }

    /**
     * Removes node from array
     * @private
     */
    removeFromArray(arr, node) {
        const index = arr.indexOf(node);
        if (index !== -1) arr.splice(index, 1);
    }

    /**
     * Sets node in grid map
     * @private
     */
    setNode(grid, x, y, node) {
        grid.set(`${x},${y}`, node);
    }

    /**
     * Reconstructs path from end node
     * @private
     */
    reconstructPath(endNode) {
        const path = [];
        let current = endNode;

        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }

        return path;
    }
}