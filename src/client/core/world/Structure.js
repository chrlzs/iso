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

/**
 * @typedef {Object} InteractionResult
 * @property {boolean} success - Whether interaction succeeded
 * @property {string} [message] - Result message
 * @property {Function} [callback] - Post-interaction callback
 */

/**
 * @typedef {Object} StateTransition
 * @property {string} from - Current state
 * @property {string} to - Target state
 * @property {boolean} instant - Whether transition is instant
 * @property {number} [duration] - Transition duration in ms
 */

/**
 * @typedef {Object} RenderLayer
 * @property {number} order - Render order
 * @property {boolean} isVisible - Layer visibility
 * @property {Function} render - Layer render function
 * @property {Object} [effects] - Visual effects
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
        // Validate and normalize blueprint dimensions first
        if (!template.blueprint) {
            throw new Error('Structure template must include a blueprint array');
        }

        const actualHeight = template.blueprint.length;
        const actualWidth = template.blueprint[0]?.length || 0;

        // Always use actual dimensions from blueprint
        template.width = actualWidth;
        template.height = actualHeight;

        // Store template and basic properties
        this.template = {
            ...template,
            material: template.material || 'concrete',
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

        // Components mapping for multi-tile structures
        this.components = [];
        try {
            for (let dy = 0; dy < this.height; dy++) {
                const row = template.blueprint[dy];
                if (!row) {
                    throw new Error(`Missing blueprint row at index ${dy}`);
                }
                
                for (let dx = 0; dx < this.width; dx++) {
                    const cell = row[dx];
                    if (!cell) {
                        console.warn(`Missing blueprint cell at ${dx},${dy}, using default wall`);
                    }
                    
                    const worldX = x + dx;
                    const worldY = y + dy;
                    const componentType = cell || 'wall'; // Default to wall if undefined
                    
                    const tile = world?.getTileAt?.(worldX, worldY);
                    const terrainHeight = tile ? tile.height : 0;
                    
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
        } catch (error) {
            console.error('Error creating structure components:', error);
            throw error;
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













