export class Structure {
    constructor(template, x, y, world) {
        // Merge template with any overrides
        this.template = {
            ...template,
            material: template.material || 'concrete', // Default material
            states: {
                ...template.states
            }
        };
        
        this.type = template.type;
        this.x = x;
        this.y = y;
        this.width = template.width;
        this.height = template.height;
        this.world = world;

        // Special handling for dumpster
        if (this.type === 'dumpster') {
            this.height = 1;
            this.elevation = 0.3; // Makes it appear slightly raised
            this.states = {
                ...template.states,
                isOpen: false
            };
        }

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

        // Add new properties from template
        this.floors = template.floors || 1;
        this.roofType = template.roofType || 'flat';
        this.material = template.material || 'brick';
        this.zone = template.zone || 'residential';
        this.name = template.name || 'Building';
        
        // Calculate height offset based on floors
        this.heightOffset = (this.floors - 1) * 32; // 32 pixels per floor

        // Add visibility states
        this.visibility = {
            frontLeftWall: true,
            frontRightWall: true,
            backLeftWall: true,
            backRightWall: true,
            roof: true,
            floor: true
        };

        this.world = world; // Ensure world reference is set
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
        // Include floor height in vertical offset
        return (this.terrainOffset * 8) + this.heightOffset;
    }

    // Add debug method to help track rendering
    debugRenderCount() {
        if (!this._renderCount) this._renderCount = 0;
        this._renderCount++;
        if (this._renderCount > 1) {
            console.warn(`Structure ${this.id} rendered multiple times!`);
        }
    }

    // Add method to update visibility based on entity position
    updateVisibility(entityX, entityY) {
        // Check if entity is inside the structure's bounds
        const isInside = (
            entityX >= this.x && 
            entityX < this.x + this.width &&
            entityY >= this.y && 
            entityY < this.y + this.height
        );

        this.visibility = {
            frontLeftWall: !isInside,
            frontRightWall: !isInside,
            backLeftWall: true,
            backRightWall: true,
            roof: !isInside,
            floor: true
        };
    }
}







