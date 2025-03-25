export class Structure {
    constructor(template, x, y, world) {
        this.template = template;
        this.x = x;
        this.y = y;
        this.type = template.type;
        this.width = template.width;
        this.height = template.height;
        this.id = null;

        // Calculate base height from terrain
        this.calculateTerrainHeight(world);

        // Components mapping for multi-tile structures
        this.components = [];
        for (let dy = 0; dy < this.height; dy++) {
            for (let dx = 0; dx < this.width; dx++) {
                const worldX = x + dx;
                const worldY = y + dy;
                const componentType = template.blueprint[dy][dx];
                const terrainHeight = world.getTileAt(worldX, worldY).height;
                
                this.components.push({
                    x: worldX,
                    y: worldY,
                    type: componentType,
                    isDecorative: this.isDecorativeComponent(componentType),
                    tileIndex: dy * this.width + dx,
                    terrainHeight: terrainHeight
                });
            }
        }

        // Base position (center-bottom of structure)
        this.basePosition = {
            x: x + Math.floor(this.width / 2),
            y: y + this.height - 1
        };

        // Initialize state
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
        // Check if this is the primary tile (index 0) of the structure
        return worldX === this.x && worldY === this.y;
    }

    getComponentAt(worldX, worldY) {
        // Validate coordinates are within structure bounds
        if (worldX < this.x || worldX >= this.x + this.width ||
            worldY < this.y || worldY >= this.y + this.height) {
            return null;
        }

        const localX = worldX - this.x;
        const localY = worldY - this.y;
        const index = localY * this.width + localX;

        return this.components[index] || null;
    }

    getTileIndex(x, y) {
        const component = this.getComponentAt(x, y);
        return component ? component.tileIndex : -1;
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

    calculateTerrainHeight(world) {
        let totalHeight = 0;
        let count = 0;

        // Calculate average height of terrain under structure
        for (let dy = 0; dy < this.height; dy++) {
            for (let dx = 0; dx < this.width; dx++) {
                const tile = world.getTileAt(this.x + dx, this.y + dy);
                if (tile) {
                    totalHeight += tile.height;
                    count++;
                }
            }
        }

        this.terrainBaseHeight = count > 0 ? totalHeight / count : 0;
        this.terrainOffset = Math.floor(this.terrainBaseHeight);
    }

    getVerticalOffset() {
        return this.terrainOffset * 8; // Adjust multiplier based on your tile height
    }

    // Add debug method to help track rendering
    debugRenderCount() {
        if (!this._renderCount) this._renderCount = 0;
        this._renderCount++;
        if (this._renderCount > 1) {
            console.warn(`Structure ${this.id} rendered multiple times!`);
        }
    }
}




