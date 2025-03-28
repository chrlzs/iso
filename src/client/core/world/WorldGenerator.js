export class WorldGenerator {
    constructor(tileManager) {
        this.tileManager = tileManager;
    }

    generateTile(x, y, height, moisture, urbanDensity = 0) {
        let tileType;
        
        // Water bodies are unchanged
        if (height < 0.38) {
            tileType = 'water';
        } else if (height < 0.42) {
            // Coastal areas can have ports/industrial zones
            if (urbanDensity > 0.7) {
                tileType = 'concrete';
            } else {
                tileType = moisture > 0.6 ? 'wetland' : 'sand';
            }
        } else if (height < 0.8) {
            // Main urban and suburban areas
            if (urbanDensity > 0.8) {
                // Dense urban core
                const urbanRoll = Math.random();
                if (urbanRoll < 0.4) {
                    tileType = 'concrete';
                } else if (urbanRoll < 0.7) {
                    tileType = 'asphalt';
                } else if (urbanRoll < 0.8) {
                    tileType = 'metal';
                } else if (urbanRoll < 0.9) {
                    tileType = 'tiles';
                } else {
                    tileType = 'solar';
                }
            } else if (urbanDensity > 0.5) {
                // Suburban areas
                const suburbanRoll = Math.random();
                if (suburbanRoll < 0.4) {
                    tileType = 'garden';
                } else if (suburbanRoll < 0.7) {
                    tileType = 'grass';
                } else {
                    tileType = 'concrete';
                }
            } else {
                // Rural/natural areas
                if (moisture < 0.2) {
                    tileType = 'dirt';
                } else if (moisture < 0.6) {
                    tileType = 'grass';
                } else {
                    tileType = 'forest';
                }
            }
        } else {
            // Mountain areas can have special installations
            if (urbanDensity > 0.7) {
                tileType = Math.random() < 0.7 ? 'metal' : 'concrete';
            } else {
                tileType = 'mountain';
            }
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







