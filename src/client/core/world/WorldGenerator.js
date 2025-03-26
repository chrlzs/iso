export class WorldGenerator {
    constructor(tileManager) {
        this.tileManager = tileManager;
    }

    generateTile(x, y, height, moisture) {
        let tileType;
        
        // Adjusted water threshold to get moderate water coverage
        if (height < 0.38) {
            tileType = 'water';
        } else if (height < 0.42) {
            tileType = moisture > 0.6 ? 'wetland' : 'sand';
        } else if (height < 0.8) {
            if (moisture < 0.2) {
                tileType = 'dirt';
            } else if (moisture < 0.6) {
                tileType = 'grass';
            } else {
                tileType = 'forest';
            }
        } else {
            tileType = 'mountain';
        }

        return {
            type: tileType,
            height: height,
            moisture: moisture,
            variant: this.tileManager.getRandomVariant(tileType),
            id: `tile_${x}_${y}`,
            x: x,
            y: y
        };
    }
}






