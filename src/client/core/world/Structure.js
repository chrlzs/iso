export class Structure {
    constructor(config) {
        this.type = config.type;
        this.width = config.width;
        this.height = config.height;
        this.x = config.x;
        this.y = config.y;
        this.rotation = config.rotation || 0;
        this.blueprint = config.blueprint;
        this.decorations = config.decorations || [];
    }

    // Check if structure can be placed at given coordinates
    canPlace(world, x, y) {
        for (let dy = 0; dy < this.height; dy++) {
            for (let dx = 0; dx < this.width; dx++) {
                const worldX = x + dx;
                const worldY = y + dy;
                
                // Check if tile is suitable for building
                const tile = world.generateTile(
                    worldX, 
                    worldY,
                    world.generateHeight(worldX, worldY),
                    world.generateMoisture(worldX, worldY)
                );
                
                if (tile.type === 'water' || tile.type === 'wetland') {
                    return false;
                }
            }
        }
        return true;
    }

    // Get footprint of tiles this structure would occupy
    getFootprint(x = this.x, y = this.y) {
        const tiles = [];
        for (let dy = 0; dy < this.height; dy++) {
            for (let dx = 0; dx < this.width; dx++) {
                tiles.push({ x: x + dx, y: y + dy });
            }
        }
        return tiles;
    }
}