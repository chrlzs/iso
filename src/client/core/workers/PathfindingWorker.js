/**
 * Web Worker for pathfinding calculations
 * This runs in a separate thread to avoid blocking the main thread
 */

// Import AStar algorithm
try {
    // Try with absolute path first
    importScripts('/src/client/core/workers/AStar.js');
} catch (e) {
    try {
        // Try with relative path as fallback
        importScripts('./AStar.js');
    } catch (e2) {
        // Log error for debugging
        self.postMessage({ type: 'error', message: 'Failed to import AStar.js: ' + e2.message });
    }
}

// Initialize pathfinder
let pathfinder = null;
let walkableMap = null;
let width = 0;
let height = 0;

// Handle messages from main thread
self.onmessage = function(e) {
    const data = e.data;

    switch (data.type) {
        case 'init':
            // Initialize pathfinder with walkable map
            width = data.width;
            height = data.height;
            walkableMap = data.walkableMap;
            pathfinder = new AStar(walkableMap, width, height);
            self.postMessage({ type: 'initialized' });
            break;

        case 'findPath':
            // Find path between two points
            const { startX, startY, endX, endY, id } = data;
            const path = findPath(startX, startY, endX, endY);
            self.postMessage({
                type: 'pathResult',
                path,
                id,
                start: { x: startX, y: startY },
                end: { x: endX, y: endY }
            });
            break;

        case 'updateMap':
            // Update walkable map
            walkableMap = data.walkableMap;
            if (pathfinder) {
                pathfinder.setWalkableMap(walkableMap);
            }
            self.postMessage({ type: 'mapUpdated' });
            break;

        case 'updateTile':
            // Update a single tile
            const { x, y, walkable } = data;
            if (x >= 0 && x < width && y >= 0 && y < height) {
                walkableMap[y * width + x] = walkable ? 1 : 0;
                if (pathfinder) {
                    pathfinder.updateTile(x, y, walkable);
                }
                self.postMessage({ type: 'tileUpdated', x, y, walkable });
            }
            break;
    }
};

/**
 * Finds a path between two points
 * @param {number} startX - Start X coordinate
 * @param {number} startY - Start Y coordinate
 * @param {number} endX - End X coordinate
 * @param {number} endY - End Y coordinate
 * @returns {Array|null} Array of path points or null if no path found
 */
function findPath(startX, startY, endX, endY) {
    if (!pathfinder) {
        return null;
    }

    // Check if coordinates are valid
    if (startX < 0 || startX >= width || startY < 0 || startY >= height ||
        endX < 0 || endX >= width || endY < 0 || endY >= height) {
        return null;
    }

    // Check if start and end are walkable
    if (!walkableMap[startY * width + startX] || !walkableMap[endY * width + endX]) {
        return null;
    }

    // Find path
    const path = pathfinder.findPath(startX, startY, endX, endY);
    return path;
}
