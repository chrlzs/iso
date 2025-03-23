export class Structure {
    constructor(template, x, y) {
        this.template = template;
        this.x = x;
        this.y = y;
        this.type = template.type;
        this.width = template.width;
        this.height = template.height;
        
        // Animation states
        this.states = {
            doorOpen: false,
            lightOn: false,
            smokeActive: false
        };
        
        // Animation timers
        this.animations = {
            doorSwing: 0,
            chimneySmoke: 0,
            windowLight: 0
        };
    }

    update(deltaTime) {
        // Update animations
        if (this.states.smokeActive) {
            this.animations.chimneySmoke += deltaTime;
        }
        
        if (this.states.doorOpen) {
            this.animations.doorSwing = Math.min(1, this.animations.doorSwing + deltaTime);
        } else {
            this.animations.doorSwing = Math.max(0, this.animations.doorSwing - deltaTime);
        }
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

