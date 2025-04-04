/**
 * A* Pathfinding Algorithm
 * Optimized for web worker usage
 */
class AStar {
    /**
     * Creates a new A* pathfinder
     * @param {Array} walkableMap - 1D array of walkable tiles (1 = walkable, 0 = blocked)
     * @param {number} width - Map width
     * @param {number} height - Map height
     */
    constructor(walkableMap, width, height) {
        this.walkableMap = walkableMap;
        this.width = width;
        this.height = height;
        
        // Direction vectors (8-way movement)
        this.directions = [
            { x: 0, y: -1, cost: 1 },   // North
            { x: 1, y: -1, cost: 1.4 }, // Northeast
            { x: 1, y: 0, cost: 1 },    // East
            { x: 1, y: 1, cost: 1.4 },  // Southeast
            { x: 0, y: 1, cost: 1 },    // South
            { x: -1, y: 1, cost: 1.4 }, // Southwest
            { x: -1, y: 0, cost: 1 },   // West
            { x: -1, y: -1, cost: 1.4 } // Northwest
        ];
    }
    
    /**
     * Updates the walkable map
     * @param {Array} walkableMap - New walkable map
     */
    setWalkableMap(walkableMap) {
        this.walkableMap = walkableMap;
    }
    
    /**
     * Updates a single tile
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} walkable - Whether the tile is walkable
     */
    updateTile(x, y, walkable) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.walkableMap[y * this.width + x] = walkable ? 1 : 0;
        }
    }
    
    /**
     * Finds a path between two points
     * @param {number} startX - Start X coordinate
     * @param {number} startY - Start Y coordinate
     * @param {number} endX - End X coordinate
     * @param {number} endY - End Y coordinate
     * @returns {Array|null} Array of path points or null if no path found
     */
    findPath(startX, startY, endX, endY) {
        // Quick check for same start and end
        if (startX === endX && startY === endY) {
            return [{ x: startX, y: startY }];
        }
        
        // Initialize open and closed sets
        const openSet = new BinaryHeap((node) => node.f);
        const closedSet = new Set();
        
        // Create start node
        const startNode = {
            x: startX,
            y: startY,
            g: 0,
            h: this.heuristic(startX, startY, endX, endY),
            f: 0,
            parent: null
        };
        
        // Add start node to open set
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);
        
        // Main loop
        while (openSet.size() > 0) {
            // Get node with lowest f score
            const current = openSet.pop();
            
            // Check if we've reached the end
            if (current.x === endX && current.y === endY) {
                return this.reconstructPath(current);
            }
            
            // Add current node to closed set
            closedSet.add(`${current.x},${current.y}`);
            
            // Check all neighbors
            for (const dir of this.directions) {
                const neighborX = current.x + dir.x;
                const neighborY = current.y + dir.y;
                
                // Skip if out of bounds
                if (neighborX < 0 || neighborX >= this.width || 
                    neighborY < 0 || neighborY >= this.height) {
                    continue;
                }
                
                // Skip if not walkable
                if (!this.walkableMap[neighborY * this.width + neighborX]) {
                    continue;
                }
                
                // Skip if in closed set
                const neighborKey = `${neighborX},${neighborY}`;
                if (closedSet.has(neighborKey)) {
                    continue;
                }
                
                // Calculate g score
                const gScore = current.g + dir.cost;
                
                // Check if neighbor is in open set
                let neighbor = null;
                let isNewNode = true;
                
                // This is a bit inefficient, but BinaryHeap doesn't support direct lookup
                for (let i = 0; i < openSet.content.length; i++) {
                    const node = openSet.content[i];
                    if (node.x === neighborX && node.y === neighborY) {
                        neighbor = node;
                        isNewNode = false;
                        break;
                    }
                }
                
                // If not in open set, create new node
                if (isNewNode) {
                    neighbor = {
                        x: neighborX,
                        y: neighborY,
                        g: gScore,
                        h: this.heuristic(neighborX, neighborY, endX, endY),
                        parent: current
                    };
                    neighbor.f = neighbor.g + neighbor.h;
                    openSet.push(neighbor);
                }
                // If in open set but new path is better, update it
                else if (gScore < neighbor.g) {
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;
                    openSet.rescoreElement(neighbor);
                }
            }
        }
        
        // No path found
        return null;
    }
    
    /**
     * Calculates heuristic (estimated distance) between two points
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @returns {number} Heuristic value
     */
    heuristic(x1, y1, x2, y2) {
        // Octile distance (allows diagonal movement)
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
    }
    
    /**
     * Reconstructs path from end node to start node
     * @param {Object} endNode - End node
     * @returns {Array} Array of path points
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

/**
 * Binary Heap implementation for efficient priority queue
 * Based on https://eloquentjavascript.net/1st_edition/appendix2.html
 */
class BinaryHeap {
    constructor(scoreFunction) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }
    
    push(element) {
        // Add element to the end of the heap
        this.content.push(element);
        // Allow it to bubble up
        this.bubbleUp(this.content.length - 1);
    }
    
    pop() {
        // Store the first element so we can return it later
        const result = this.content[0];
        // Get the element at the end of the heap
        const end = this.content.pop();
        // If there are any elements left, put the end element at the start and let it sink down
        if (this.content.length > 0) {
            this.content[0] = end;
            this.sinkDown(0);
        }
        return result;
    }
    
    size() {
        return this.content.length;
    }
    
    rescoreElement(element) {
        this.sinkDown(this.content.indexOf(element));
    }
    
    bubbleUp(n) {
        // Fetch the element that has to be moved
        const element = this.content[n];
        // When at 0, an element can not go up any further
        while (n > 0) {
            // Compute the parent element's index, and fetch it
            const parentN = Math.floor((n + 1) / 2) - 1;
            const parent = this.content[parentN];
            // If the parent has a lesser score, things are in order and we are done
            if (this.scoreFunction(element) >= this.scoreFunction(parent)) {
                break;
            }
            
            // Otherwise, swap the parent with the current element and continue
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }
    
    sinkDown(n) {
        // Look up the target element and its score
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFunction(element);
        
        while (true) {
            // Compute the indices of the child elements
            const child2N = (n + 1) * 2;
            const child1N = child2N - 1;
            // This is used to store the new position of the element, if any
            let swap = null;
            let child1Score;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score
                const child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);
                // If the score is less than our element's, we need to swap
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }
            // Do the same checks for the other child
            if (child2N < length) {
                const child2 = this.content[child2N];
                const child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }
            
            // No need to swap further, we are done
            if (swap === null) break;
            
            // Otherwise, swap and continue
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
}
