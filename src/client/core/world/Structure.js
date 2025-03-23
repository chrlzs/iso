export class Structure {
    constructor(template, x, y) {
        this.template = template;
        this.x = x;
        this.y = y;
        this.type = template.type;
        this.width = template.width;
        this.height = template.height;
        this.id = null;

        // Components mapping
        this.components = [];
        for (let dy = 0; dy < this.height; dy++) {
            for (let dx = 0; dx < this.width; dx++) {
                const componentType = template.blueprint[dy][dx];
                this.components.push({
                    x: x + dx,
                    y: y + dy,
                    type: componentType,
                    isDecorative: this.isDecorativeComponent(componentType)
                });
            }
        }

        // Base position (center-bottom of structure)
        this.basePosition = {
            x: x + Math.floor(this.width / 2),
            y: y + this.height - 1
        };

        this.states = {
            doorOpen: false,
            lightOn: Math.random() < 0.3,
            smokeActive: Math.random() < 0.2
        };

        this.animations = {
            doorSwing: 0,
            chimneySmoke: Math.random() * Math.PI * 2,
            windowLight: 0,
            lightFlicker: Math.random() * Math.PI * 2
        };
    }

    isDecorativeComponent(type) {
        return ['chimney', 'window', 'sign'].includes(type);
    }

    isPrimaryTile(worldX, worldY) {
        return worldX === this.x && worldY === this.y;
    }

    getComponentAt(worldX, worldY) {
        return this.components.find(comp => 
            comp.x === worldX && comp.y === worldY
        );
    }

    update(deltaTime) {
        // Update animations
        if (this.states.smokeActive) {
            this.animations.chimneySmoke += deltaTime;
        }
        
        // Random light flickering when on
        if (this.states.lightOn) {
            this.animations.lightFlicker += deltaTime;
            // Occasionally toggle lights with small probability
            if (Math.random() < 0.0001) {
                this.states.lightOn = false;
                setTimeout(() => this.states.lightOn = true, Math.random() * 2000 + 1000);
            }
        }
        
        // Update door animation
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

