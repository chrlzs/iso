/**
 * Represents the game world and manages the tile grid
 * @class World
 */
export class World {
    /**
     * Creates a new World instance
     * @param {number} [width=20] - The width of the world in tiles
     * @param {number} [height=20] - The height of the world in tiles
     */
    constructor(width = 20, height = 20) {
        this.width = width;
        this.height = height;
        this.tiles = this.initializeTiles();
    }

    /**
     * Initializes the tile grid with default grass tiles
     * @private
     * @returns {Array<Array<Object>>} 2D array of tile objects
     */
    initializeTiles() {
        const tiles = new Array(this.width);
        for (let x = 0; x < this.width; x++) {
            tiles[x] = new Array(this.height);
            for (let y = 0; y < this.height; y++) {
                tiles[x][y] = {
                    type: 'grass',
                    walkable: true,
                    height: 0
                };
            }
        }
        return tiles;
    }

    /**
     * Gets the tile at the specified coordinates
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {Object|null} The tile object or null if coordinates are out of bounds
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[x][y];
        }
        return null;
    }
}
