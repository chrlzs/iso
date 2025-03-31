/**
 * Represents a building or structure in the world
 * @class Structure
 * @property {string} type - Structure type
 * @property {number} x - World X position
 * @property {number} y - World Y position
 * @property {number} width - Structure width in tiles
 * @property {number} height - Structure height in tiles
 * @property {World} world - Reference to world instance
 * @property {Array<Component>} components - Structure components
 * @property {Object} visibility - Structure visibility states
 * @property {Object} transparency - Structure transparency values
 */

/**
 * @typedef {Object} Component
 * @property {number} x - Component X position
 * @property {number} y - Component Y position
 * @property {string} type - Component type
 * @property {boolean} isDecorative - Whether component is decorative
 * @property {number} tileIndex - Index in structure blueprint
 * @property {number} terrainHeight - Base terrain height
 */

/**
 * @typedef {Object} VisibilityState
 * @property {boolean} frontLeftWall
 * @property {boolean} frontRightWall
 * @property {boolean} backLeftWall
 * @property {boolean} backRightWall
 * @property {boolean} roof
 * @property {boolean} floor
 */

/**
 * @typedef {Object} StructureState
 * @property {boolean} doorOpen - Whether doors are open
 * @property {boolean} lightOn - Whether lights are on
 * @property {boolean} smokeActive - Whether chimneys are active
 */

/**
 * @typedef {Object} StructureAnimation
 * @property {number} doorSwing - Door swing animation progress (0-1)
 * @property {number} chimneySmoke - Chimney smoke animation phase
 * @property {number} windowLight - Window light animation progress
 * @property {number} lightFlicker - Light flickering animation phase
 */

/**
 * @typedef {Object} BasePosition
 * @property {number} x - Base X coordinate
 * @property {number} y - Base Y coordinate
 */

export class Structure {
    /**
     * Creates a new Structure instance
     * @param {StructureTemplate} template - Structure template definition
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {World} world - Reference to world instance
     */
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

        // Add transparency state
        this.transparency = {
            frontLeftWall: 1,
            frontRightWall: 1,
            backLeftWall: 1,
            backRightWall: 1,
            roof: 1,
            floor: 1
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

    /**
     * Updates structure animation states
     * @param {number} deltaTime - Time elapsed since last update in seconds
     * @returns {void}
     */
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

    /**
     * Updates structure visibility based on entity position
     * @param {number} entityX - Entity X coordinate
     * @param {number} entityY - Entity Y coordinate
     * @returns {void}
     */
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

    /**
     * Updates structure transparency based on player position
     * @param {number} playerX - Player X coordinate
     * @param {number} playerY - Player Y coordinate
     * @param {number} cameraAngle - Camera angle in radians
     * @returns {void}
     */
    updateTransparency(playerX, playerY, cameraAngle) {
        // Reset all transparency values to fully opaque
        this.transparency = {
            frontLeftWall: 1,
            frontRightWall: 1,
            backLeftWall: 1,
            backRightWall: 1,
            roof: 1,
            floor: 1
        };

        // Early return if player is inside
        if (playerX >= this.x && 
            playerX < this.x + this.width &&
            playerY >= this.y && 
            playerY < this.y + this.height) {
            return;
        }

        // Calculate distance from player to structure
        const dx = this.x + (this.width / 2) - playerX;
        const dy = this.y + (this.height / 2) - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only apply transparency if player is within reasonable distance (e.g., 10 tiles)
        const maxTransparencyDistance = 10;
        if (distance > maxTransparencyDistance) {
            return;
        }

        // Player is behind the structure if they have a LOWER Y coordinate
        const isPlayerBehind = playerY < this.y;

        if (isPlayerBehind) {
            const occludedAlpha = 0.3;

            // Make relevant walls transparent when player is behind
            this.transparency.frontLeftWall = occludedAlpha;
            this.transparency.frontRightWall = occludedAlpha;
            this.transparency.roof = occludedAlpha;
            
            // Apply additional transparency for side closest to player
            if (playerX < this.x) {
                this.transparency.frontRightWall = occludedAlpha;
                this.transparency.backRightWall = occludedAlpha;
            } else if (playerX > this.x + this.width) {
                this.transparency.frontLeftWall = occludedAlpha;
                this.transparency.backLeftWall = occludedAlpha;
            }
        }
    }
}







