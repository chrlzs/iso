export class Structure {
    constructor(template, x, y) {
        this.type = template.type;
        this.width = template.width;
        this.height = template.height;
        this.x = x;
        this.y = y;
        this.rotation = template.rotation || 0;
        this.blueprint = template.blueprint;
        this.decorations = template.decorations || [];
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
}
