// ...existing code...
class World {
    // ...existing code...

    /**
     * Gets the tile at the specified position
     * @param {number} x - X-coordinate
     * @param {number} y - Y-coordinate
     * @returns {Tile|null} The tile at the position or null if out of bounds
     */
    getTileAt(x, y) {
        const tileX = Math.floor(x / this.tileWidth);
        const tileY = Math.floor(y / this.tileHeight);
        if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height) {
            return this.tiles[tileY][tileX];
        }
        return null;
    }

    // ...existing code...
}
// ...existing code...