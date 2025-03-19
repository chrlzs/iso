export class PathFinder {
    constructor(world) {
        this.world = world;
    }

    findPath(startX, startY, endX, endY) {
        // For now, return a simple direct path
        // This can be enhanced later with A* pathfinding
        return [
            { x: startX, y: startY },
            { x: endX, y: endY }
        ];
    }

    // Helper method to check if a position is walkable
    isWalkable(x, y) {
        const tile = this.world.getTileAt(Math.floor(x), Math.floor(y));
        return tile && tile.walkable !== false; // Assume walkable if not explicitly set
    }
}
