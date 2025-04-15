import { PIXI, Container } from '../utils/PixiWrapper.js';

/**
 * IsometricTile - Represents a single tile in an isometric world
 * Optimized for PixiJS rendering
 */
export class IsometricTile extends Container {
    constructor(options = {}) {
        super();

        // Grid position
        this.gridX = options.x || 0;
        this.gridY = options.y || 0;

        // References
        this.world = options.world || null;
        this.game = options.game || null;

        // Make tile interactive
        this.eventMode = 'dynamic';  // Changed from static to dynamic for better event handling
        this.cursor = 'pointer';
        this.interactive = true;

        // Set up interaction events with both mouse and touch support
        this.on('pointerdown', this.onPointerDown.bind(this));
        this.on('mouseover', this.onMouseOver.bind(this));  // Changed from pointerover to mouseover
        this.on('mouseout', this.onMouseOut.bind(this));    // Changed from pointerout to mouseout

        // Tile properties
        this.type = options.type || 'grass';
        this.walkable = options.walkable !== undefined ? options.walkable : true;
        this.elevation = 0;

        // Dimensions
        this.tileWidth = options.width || 64;
        this.tileHeight = options.height || 32;

        // Calculate isometric position without any offsets
        this.isoX = (this.gridX - this.gridY) * this.tileWidth / 2;
        this.isoY = (this.gridX + this.gridY) * this.tileHeight / 2;

        // Position tile
        this.x = this.isoX;
        this.y = this.isoY;

        // Create sprite
        this.sprite = null;

        // Calculate the visual center offset (where the sprite is actually rendered)
        const visualCenterY = -this.tileHeight / 2; // Because sprite anchor is at bottom center

        // Create the diamond-shaped hit area aligned with visual representation
        const hitAreaPoints = [
            new PIXI.Point(0, visualCenterY),                    // Top
            new PIXI.Point(this.tileWidth / 2, visualCenterY + this.tileHeight / 2),    // Right
            new PIXI.Point(0, visualCenterY + this.tileHeight),           // Bottom
            new PIXI.Point(-this.tileWidth / 2, visualCenterY + this.tileHeight / 2)    // Left
        ];
        this.hitArea = new PIXI.Polygon(hitAreaPoints);

        // Set texture if provided
        if (options.texture) {
            this.setTexture(options.texture);
        }

        // Additional properties
        this.structure = null;
        this.entities = new Set();
        this.highlighted = false;
        this.selected = false;

        // Highlight graphics
        this.highlightGraphics = null;
    }

    /**
     * Handles pointer down events (both left and right click)
     * @param {PIXI.InteractionEvent} event - The interaction event
     * @private
     */
    onPointerDown(event) {
        // Event is now handled by InputManager, this is just for PIXI.js interaction system
        event.stopPropagation();
    }

    /**
     * Checks if a point is inside this tile
     * @param {PIXI.Point} point - The point to check
     * @returns {boolean} True if the point is inside the tile
     */
    containsPoint(point) {
        try {
            // First do a strict boundary check
            if (!this.world || this.gridX < 0 || this.gridX >= this.world.config.gridWidth ||
                this.gridY < 0 || this.gridY >= this.world.config.gridHeight) {
                return false;
            }

            // Check if the tile is in the display list
            if (!this.parent || !this.worldTransform) {
                // If not in display list, use a simpler hit test based on world coordinates
                if (this.world) {
                    // Get the world position of this tile
                    const worldPos = this.world.gridToWorld(this.gridX, this.gridY);

                    // Calculate distance from point to tile center
                    const dx = Math.abs(point.x - worldPos.x);
                    const dy = Math.abs(point.y - worldPos.y);

                    // Use a simple diamond hit test with the tile dimensions
                    const halfWidth = this.tileWidth / 2;
                    const halfHeight = this.tileHeight / 2;

                    // Add some padding for better hit detection
                    const padding = 8;

                    return (dx / (halfWidth + padding) + dy / (halfHeight + padding)) <= 1.0;
                }
                return false;
            }

            // Normal case - tile is in display list
            // Convert point to local tile coordinates
            const localPoint = new PIXI.Point();
            this.worldTransform.applyInverse(point, localPoint);

            // Adjust point for visual center - tiles are drawn from their bottom center
            const visualCenterY = -this.tileHeight / 2;
            localPoint.y -= visualCenterY;

            // Add some padding to the hit area for better click detection
            const padding = 4;
            const adjustedWidth = this.tileWidth + padding * 2;
            const adjustedHeight = this.tileHeight + padding * 2;

            // Get point relative to tile center with padding adjustment
            const dx = Math.abs(localPoint.x);
            const dy = Math.abs(localPoint.y);

            // Use diamond equation for hit testing with adjusted dimensions
            // A point (x,y) is inside a diamond if |x/w| + |y/h| <= 0.5
            return (dx / adjustedWidth + dy / adjustedHeight) <= 0.5;
        } catch (error) {
            console.error(`Error in containsPoint for tile (${this.gridX}, ${this.gridY}):`, error);
            return false;
        }
    }

    /**
     * Sets the tile texture
     * @param {PIXI.Texture} texture - The texture to set
     */
    setTexture(texture) {
        if (!texture) return;

        if (!this.sprite) {
            // Create sprite
            this.sprite = new PIXI.Sprite(texture);
            this.sprite.anchor.set(0.5, 1); // Bottom center
            this.addChild(this.sprite);
        } else {
            // Update texture
            this.sprite.texture = texture;
        }

        // Update dimensions if needed
        if (!this.sprite.width) {
            this.sprite.width = this.tileWidth;
        }

        if (!this.sprite.height) {
            this.sprite.height = this.tileHeight + this.elevation;
        }
    }

    /**
     * Sets the tile type and updates appearance
     * @param {string} type - The tile type
     * @param {PIXI.Texture} texture - Optional texture for the new type
     */
    setType(type, texture = null) {
        this.type = type;

        // Update walkable property based on type
        switch (type) {
            case 'water':
            case 'lava':
            case 'void':
                this.walkable = false;
                break;
            default:
                this.walkable = true;
                break;
        }

        // Update texture if provided
        if (texture) {
            this.setTexture(texture);
        }
    }

    /**
     * Sets the tile elevation
     * @param {number} elevation - The new elevation
     */
    setElevation(elevation) {
        this.elevation = elevation;

        // Update isometric position
        this.y = this.isoY - this.elevation;

        // Update sprite height if it exists
        if (this.sprite) {
            this.sprite.height = this.tileHeight + this.elevation;
        }
    }

    /**
     * Adds a structure to the tile
     * @param {Object} structure - The structure to add
     */
    addStructure(structure) {
        // Strict validation to prevent phantom structure placement
        if (this.gridX < 0 || this.gridX >= this.world.gridWidth ||
            this.gridY < 0 || this.gridY >= this.world.gridHeight ||
            // Special check for bottom row
            this.gridY === this.world.gridHeight - 1) {
            console.log(`Prevented structure placement on invalid tile at (${this.gridX}, ${this.gridY})`);
            return;
        }

        this.structure = structure;

        // Update walkable property
        if (structure && structure.solid) {
            this.walkable = false;
        }

        // Add structure to display list if it's a display object
        if (structure instanceof PIXI.DisplayObject) {
            this.addChild(structure);

            // Position at bottom center of tile
            structure.x = 0;
            structure.y = 0;
        }
    }

    /**
     * Removes the structure from the tile
     */
    removeStructure() {
        if (!this.structure) return;

        // Remove from display list if it's a display object
        if (this.structure instanceof PIXI.DisplayObject) {
            this.removeChild(this.structure);
        }

        this.structure = null;

        // Reset walkable property based on tile type
        switch (this.type) {
            case 'water':
            case 'lava':
            case 'void':
                this.walkable = false;
                break;
            default:
                this.walkable = true;
                break;
        }
    }

    /**
     * Adds an entity to the tile
     * @param {Object} entity - The entity to add
     */
    addEntity(entity) {
        this.entities.add(entity);
    }

    /**
     * Removes an entity from the tile
     * @param {Object} entity - The entity to remove
     */
    removeEntity(entity) {
        this.entities.delete(entity);
    }

    /**
     * Highlights the tile
     * @param {number} color - Highlight color (default: 0x00FFAA)
     * @param {number} alpha - Highlight alpha (default: 0.5)
     */
    highlight(color = 0x00FFAA, alpha = 0.5) {
        try {
            // Strict boundary check - don't highlight if outside world bounds
            if (!this.world) {
                console.warn(`Cannot highlight tile at (${this.gridX}, ${this.gridY}): world reference missing`);
                return;
            }

            if (this.gridX < 0 || this.gridX >= this.world.config.gridWidth ||
                this.gridY < 0 || this.gridY >= this.world.config.gridHeight) {
                console.log(`Prevented highlight of out-of-bounds tile at (${this.gridX}, ${this.gridY})`);
                return;
            }

            // Ensure we have a selection container
            if (!this.world.selectionContainer) {
                console.warn('Cannot highlight tile: selectionContainer not available');
                return;
            }

            // Create highlight graphics if needed
            if (!this.highlightGraphics) {
                this.highlightGraphics = new PIXI.Graphics();
            }

            // Remove from previous parent if any
            if (this.highlightGraphics.parent) {
                this.highlightGraphics.parent.removeChild(this.highlightGraphics);
            }

            // Add highlight graphics to the world's selection container
            this.world.selectionContainer.addChild(this.highlightGraphics);

            // Get position in world space
            let worldPos;

            // If the tile is not in the display list, use world coordinates directly
            if (!this.parent) {
                console.log(`Tile (${this.gridX}, ${this.gridY}) not in display list, using world coordinates`);

                // If we have world coordinates, use them
                if (typeof this.worldX === 'number' && typeof this.worldY === 'number') {
                    worldPos = { x: this.worldX, y: this.worldY };
                } else {
                    // Otherwise, convert grid coordinates to world coordinates
                    worldPos = this.world.gridToWorld(this.gridX, this.gridY);
                }
            } else {
                // Normal case - tile is in display list
                worldPos = this.getParentPosition();
            }

            // Position the highlight graphics
            this.highlightGraphics.position.set(worldPos.x, worldPos.y);

            // Draw the highlight with cyberpunk effects
            this.drawHighlight(color, alpha);
            this.highlighted = true;

            console.log(`Highlighted tile at (${this.gridX}, ${this.gridY}) with color ${color.toString(16)}`);
        } catch (error) {
            console.error(`Error highlighting tile (${this.gridX}, ${this.gridY}):`, error);
        }
    }

    /**
     * Gets the position of this tile in its parent's coordinate space
     * @private
     * @returns {Object} Position {x, y}
     */
    getParentPosition() {
        // Check if parent and world exist
        if (!this.parent || !this.world || !this.world.selectionContainer) {
            console.warn(`Cannot get parent position for tile (${this.gridX}, ${this.gridY}): parent or world missing`);

            // If we have world coordinates, use them as fallback
            if (this.world && typeof this.worldX === 'number' && typeof this.worldY === 'number') {
                return { x: this.worldX, y: this.worldY };
            }

            // If we have grid coordinates, convert them to world coordinates
            if (this.world && typeof this.gridX === 'number' && typeof this.gridY === 'number') {
                const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
                return worldPos;
            }

            // Return a default position as last resort fallback
            return { x: this.x, y: this.y };
        }

        try {
            const point = new PIXI.Point(this.x, this.y);
            const newPoint = this.parent.toGlobal(point);
            return this.world.selectionContainer.toLocal(newPoint);
        } catch (error) {
            console.error(`Error getting parent position for tile (${this.gridX}, ${this.gridY}):`, error);

            // If we have world coordinates, use them as fallback
            if (this.world && typeof this.worldX === 'number' && typeof this.worldY === 'number') {
                return { x: this.worldX, y: this.worldY };
            }

            // If we have grid coordinates, convert them to world coordinates
            if (this.world && typeof this.gridX === 'number' && typeof this.gridY === 'number') {
                const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
                return worldPos;
            }

            // Return a default position as last resort fallback
            return { x: this.x, y: this.y };
        }
    }

    /**
     * Draws the highlight shape
     * @param {number} color - Highlight color
     * @param {number} alpha - Highlight alpha
     * @private
     */
    drawHighlight(color, alpha) {
        if (!this.highlightGraphics) return;

        this.highlightGraphics.clear();

        const visualCenterY = -this.tileHeight / 2;

        // Outer glow
        const glowSize = 6;
        this.highlightGraphics.lineStyle(glowSize, color, 0.2);
        this.highlightGraphics.moveTo(0, visualCenterY);
        this.highlightGraphics.lineTo(this.tileWidth/2, visualCenterY + this.tileHeight/2);
        this.highlightGraphics.lineTo(0, visualCenterY + this.tileHeight);
        this.highlightGraphics.lineTo(-this.tileWidth/2, visualCenterY + this.tileHeight/2);
        this.highlightGraphics.closePath();

        // Main highlight
        this.highlightGraphics.beginFill(color, alpha * 0.3);
        this.highlightGraphics.lineStyle(2, color, alpha * 0.8);
        this.highlightGraphics.moveTo(0, visualCenterY);
        this.highlightGraphics.lineTo(this.tileWidth/2, visualCenterY + this.tileHeight/2);
        this.highlightGraphics.lineTo(0, visualCenterY + this.tileHeight);
        this.highlightGraphics.lineTo(-this.tileWidth/2, visualCenterY + this.tileHeight/2);
        this.highlightGraphics.closePath();
        this.highlightGraphics.endFill();

        // Add scanning line effect
        const scanLineSpacing = 4;
        this.highlightGraphics.lineStyle(1, color, alpha * 0.2);
        for (let y = visualCenterY; y <= visualCenterY + this.tileHeight; y += scanLineSpacing) {
            this.highlightGraphics.moveTo(-this.tileWidth/2, y);
            this.highlightGraphics.lineTo(this.tileWidth/2, y);
        }

        // Add corner accents
        const accentLength = 10;
        this.highlightGraphics.lineStyle(2, color, alpha);

        // Top corner
        this.highlightGraphics.moveTo(0, visualCenterY);
        this.highlightGraphics.lineTo(0, visualCenterY + accentLength);

        // Right corner
        this.highlightGraphics.moveTo(this.tileWidth/2, visualCenterY + this.tileHeight/2);
        this.highlightGraphics.lineTo(this.tileWidth/2 - accentLength, visualCenterY + this.tileHeight/2);

        // Bottom corner
        this.highlightGraphics.moveTo(0, visualCenterY + this.tileHeight);
        this.highlightGraphics.lineTo(0, visualCenterY + this.tileHeight - accentLength);

        // Left corner
        this.highlightGraphics.moveTo(-this.tileWidth/2, visualCenterY + this.tileHeight/2);
        this.highlightGraphics.lineTo(-this.tileWidth/2 + accentLength, visualCenterY + this.tileHeight/2);
    }

    /**
     * Removes the highlight
     */
    unhighlight() {
        if (!this.highlighted || !this.highlightGraphics) return;

        try {
            // Clear and remove the highlight graphics
            this.highlightGraphics.clear();

            // Remove from parent container
            if (this.highlightGraphics.parent) {
                this.highlightGraphics.parent.removeChild(this.highlightGraphics);
            }

            // Clean up reference
            this.highlightGraphics = null;
            this.highlighted = false;

            console.log(`Unhighlighted tile at (${this.gridX}, ${this.gridY})`);
        } catch (error) {
            console.error(`Error unhighlighting tile (${this.gridX}, ${this.gridY}):`, error);
            // Force cleanup even if there was an error
            this.highlightGraphics = null;
            this.highlighted = false;
        }
    }

    /**
     * Selects the tile
     * @param {number} color - Selection color (default: 0x00FF00)
     * @param {number} alpha - Selection alpha (default: 0.7)
     */
    select(color = 0x00FF00, alpha = 0.7) {
        this.highlight(color, alpha);
        this.selected = true;
    }

    /**
     * Deselects the tile
     */
    deselect() {
        this.unhighlight();
        this.selected = false;
    }

    /**
     * Gets the top position of the tile in screen coordinates
     * @returns {Object} The top position {x, y}
     */
    getTop() {
        return {
            x: this.x,
            y: this.y - this.tileHeight
        };
    }

    /**
     * Gets the center position of the tile
     * @returns {Object} Center position {x, y}
     */
    getCenter() {
        // If we have a world reference, return world coordinates
        if (this.world) {
            const worldPos = this.world.gridToWorld(this.gridX, this.gridY);

            // Ensure we have valid coordinates
            if (typeof worldPos.x === 'number' && typeof worldPos.y === 'number' &&
                !isNaN(worldPos.x) && !isNaN(worldPos.y)) {
                console.log(`Tile (${this.gridX}, ${this.gridY}) world position: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);
                return worldPos;
            } else {
                console.warn(`Invalid world position for tile (${this.gridX}, ${this.gridY}): (${worldPos.x}, ${worldPos.y})`);
            }
        }

        // Fallback to local coordinates
        const localPos = {
            x: this.x,
            y: this.y - (this.elevation || 0)
        };
        console.log(`Using local position for tile (${this.gridX}, ${this.gridY}): (${localPos.x.toFixed(2)}, ${localPos.y.toFixed(2)})`);
        return localPos;
    }

    /**
     * Handles mouse over event
     * @private
     */
    onMouseOver() {
        // Visual feedback only - state is managed by InputManager
        if (!this.selected) {
            this.highlight();
        }
    }

    /**
     * Handles mouse out event
     * @private
     */
    onMouseOut() {
        // Visual feedback only - state is managed by InputManager
        if (!this.selected) {
            this.unhighlight();
        }
    }

    /**
     * Updates the tile
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update entities
        this.entities.forEach(entity => {
            if (entity.active && typeof entity.update === 'function') {
                entity.update(deltaTime);
            }
        });
    }

    /**
     * Disposes of the tile
     */
    dispose() {
        // Remove structure
        this.removeStructure();

        // Clear entities
        this.entities.clear();

        // Destroy container
        this.destroy({ children: true });
    }
}
