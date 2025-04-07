import { PIXI, Container } from '../utils/PixiWrapper.js';

/**
 * IsometricTile - Represents a single tile in an isometric world
 * Optimized for PixiJS rendering
 */
export class IsometricTile extends Container {
    /**
     * Creates a new isometric tile
     * @param {Object} options - Tile options
     * @param {number} options.x - Grid X position
     * @param {number} options.y - Grid Y position
     * @param {string} options.type - Tile type
     * @param {number} options.width - Tile width in pixels
     * @param {number} options.height - Tile height in pixels
     * @param {PIXI.Texture} options.texture - Tile texture
     * @param {boolean} options.walkable - Whether the tile is walkable
     * @param {number} options.elevation - Tile elevation
     */
    constructor(options = {}) {
        super();

        // Grid position
        this.gridX = options.x || 0;
        this.gridY = options.y || 0;

        // Tile properties
        this.type = options.type || 'grass';
        this.walkable = options.walkable !== undefined ? options.walkable : true;
        // Set elevation to 0 for all tiles to make them render at the same level
        // We'll use this later for height variations
        this.elevation = 0; // Ignoring options.elevation for now

        // Dimensions
        this.tileWidth = options.width || 64;
        this.tileHeight = options.height || 32;

        // References
        this.world = options.world || null;
        this.game = options.game || null;

        // Calculate isometric position
        this.isoX = (this.gridX - this.gridY) * this.tileWidth / 2;
        this.isoY = (this.gridX + this.gridY) * this.tileHeight / 2;

        // Set container position
        // Position tiles directly at their isometric coordinates without any offset
        // This ensures they align with the grid
        this.x = this.isoX;
        this.y = this.isoY;

        // Create sprite
        this.sprite = null;

        // Make tile interactive
        this.interactive = true;
        this.buttonMode = true;

        // Set hit area to diamond shape
        this.hitArea = new PIXI.Polygon([
            0, -this.tileHeight / 2,           // Top
            this.tileWidth / 2, 0,             // Right
            0, this.tileHeight / 2,            // Bottom
            -this.tileWidth / 2, 0             // Left
        ]);

        // Add mouse events
        this.on('mouseover', this.onMouseOver.bind(this));
        this.on('mouseout', this.onMouseOut.bind(this));
        this.on('click', this.onClick.bind(this));
        this.on('rightclick', this.onRightClick.bind(this));

        // Add direct right-click handler
        this.on('pointerdown', (event) => {
            console.log('Pointer down on tile:', event.button);
            if (event.button === 2) {
                console.log('Direct right-click detected on tile at', this.gridX, this.gridY);

                // Highlight this tile with a bright color
                this.highlight(0xFF0000, 0.8); // Bright red

                // Get the center position of THIS tile
                const center = this.getCenter();
                console.log(`THIS tile center: (${center.x}, ${center.y})`);

                // Move player directly to this tile's center
                if (this.game && this.game.player) {
                    console.log('Moving player directly to THIS tile');
                    this.game.player.x = center.x;
                    this.game.player.y = center.y;

                    // Also set move target for smooth movement
                    this.game.player.setMoveTarget(center);

                    // Add a visible marker at the center
                    const marker = new PIXI.Graphics();
                    marker.beginFill(0x00FF00);
                    marker.drawCircle(0, 0, 10);
                    marker.endFill();
                    marker.position.set(center.x, center.y);
                    this.world.addChild(marker);

                    // Remove marker after 2 seconds
                    setTimeout(() => {
                        if (marker.parent) {
                            marker.parent.removeChild(marker);
                        }
                    }, 2000);
                }

                // Clear highlight after a short delay
                setTimeout(() => {
                    if (!this.selected) {
                        this.unhighlight();
                    }
                }, 1000);
            }
        });

        // Set texture if provided
        if (options.texture) {
            this.setTexture(options.texture);
        }

        // Additional properties
        this.structure = null;
        this.entities = new Set();
        this.highlighted = false;
        this.selected = false;
        this.game = null; // Will be set by the world

        // Highlight graphics
        this.highlightGraphics = null;
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
     * @param {number} color - Highlight color (default: 0xFFFF00)
     * @param {number} alpha - Highlight alpha (default: 0.5)
     */
    highlight(color = 0xFFFF00, alpha = 0.7) {
        // Get reference to the world's selection container
        const world = this.world;
        if (!world || !world.selectionContainer) {
            console.warn('Cannot highlight tile: world or selectionContainer not available');
            return;
        }

        if (this.highlighted && this.highlightGraphics) {
            // Update existing highlight
            this.highlightGraphics.clear();
            this.drawHighlight(color, alpha);
            return;
        }

        // Create highlight graphics in the world's selection container
        if (!this.highlightGraphics) {
            this.highlightGraphics = new PIXI.Graphics();
            world.selectionContainer.addChild(this.highlightGraphics);

            // Position the highlight at the tile's world position
            // Adjust position to center perfectly on the tile
            // Move it further left to fix the remaining offset
            this.highlightGraphics.x = this.x - this.tileWidth / 2;
            this.highlightGraphics.y = this.y;

            console.log(`Highlight position for tile (${this.gridX}, ${this.gridY}): x=${this.x} -> ${this.highlightGraphics.x}`);
        }

        this.drawHighlight(color, alpha);
        this.highlighted = true;

        // Log highlight for debugging
        console.log(`Highlighting tile at (${this.gridX}, ${this.gridY})`);
    }

    /**
     * Draws the highlight shape
     * @param {number} color - Highlight color
     * @param {number} alpha - Highlight alpha
     * @private
     */
    drawHighlight(color, alpha) {
        this.highlightGraphics.clear();

        // Draw filled diamond with transparency
        this.highlightGraphics.beginFill(color, alpha);
        this.highlightGraphics.moveTo(0, -this.tileHeight / 2);
        this.highlightGraphics.lineTo(this.tileWidth / 2, 0);
        this.highlightGraphics.lineTo(0, this.tileHeight / 2);
        this.highlightGraphics.lineTo(-this.tileWidth / 2, 0);
        this.highlightGraphics.closePath();
        this.highlightGraphics.endFill();

        // Draw outline for better visibility
        this.highlightGraphics.lineStyle(2, color, 1);
        this.highlightGraphics.moveTo(0, -this.tileHeight / 2);
        this.highlightGraphics.lineTo(this.tileWidth / 2, 0);
        this.highlightGraphics.lineTo(0, this.tileHeight / 2);
        this.highlightGraphics.lineTo(-this.tileWidth / 2, 0);
        this.highlightGraphics.closePath();

        // Add a pulsing effect to make it more visible
        const pulseTime = Date.now() / 500;
        const pulseScale = 1.0 + 0.1 * Math.sin(pulseTime);
        this.highlightGraphics.scale.set(pulseScale, pulseScale);
    }

    /**
     * Removes the highlight
     */
    unhighlight() {
        if (!this.highlighted || !this.highlightGraphics) return;

        // Clear and remove the highlight graphics
        this.highlightGraphics.clear();

        // Remove from parent container
        if (this.highlightGraphics.parent) {
            this.highlightGraphics.parent.removeChild(this.highlightGraphics);
        }

        // Clean up reference
        this.highlightGraphics = null;
        this.highlighted = false;
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
     * Checks if a point is inside the tile
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether the point is inside the tile
     */
    containsPoint(x, y) {
        // Convert to local coordinates
        const localX = x - this.x;
        const localY = y - this.y;

        // Check if point is inside diamond shape
        const halfWidth = this.tileWidth / 2;
        const halfHeight = this.tileHeight / 2;

        // Diamond equation: |x/halfWidth| + |y/halfHeight| <= 1
        return Math.abs(localX / halfWidth) + Math.abs(localY / halfHeight) <= 1;
    }

    /**
     * Gets the center position of the tile
     * @returns {Object} Center position {x, y}
     */
    getCenter() {
        // For isometric tiles, the center is at the tile's position
        // but we need to adjust for elevation
        const center = {
            x: this.x,
            y: this.y - (this.elevation || 0)
        };

        console.log(`Tile (${this.gridX}, ${this.gridY}) center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)})`);

        // If we have a world reference, convert from grid to world coordinates
        // This ensures we're using the correct coordinate system
        if (this.world) {
            const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
            console.log(`Tile (${this.gridX}, ${this.gridY}) world position: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);
            return worldPos;
        }

        return center;
    }

    /**
     * Handles mouse over event
     * @private
     */
    onMouseOver() {
        // Highlight the tile
        this.highlight();

        // Log for debugging
        console.log(`Mouse over tile at (${this.gridX}, ${this.gridY})`);

        // Update game's hovered tile reference if available
        if (this.game && this.game.input) {
            this.game.input.hoveredTile = this;
        }
    }

    /**
     * Handles mouse out event
     * @private
     */
    onMouseOut() {
        // Unhighlight the tile if not selected
        if (!this.selected) {
            this.unhighlight();
        }

        // Log for debugging
        console.log(`Mouse out tile at (${this.gridX}, ${this.gridY})`);

        // Update game's hovered tile reference if available
        if (this.game && this.game.input && this.game.input.hoveredTile === this) {
            this.game.input.hoveredTile = null;
        }
    }

    /**
     * Handles click event
     * @private
     */
    onClick() {
        // Select the tile
        this.select();

        // Log for debugging
        console.log(`Clicked tile at (${this.gridX}, ${this.gridY})`);
        console.log(`Tile properties: type=${this.type}, walkable=${this.walkable}, structure=${this.structure ? 'yes' : 'no'}`);

        // Update game's selected tile reference if available
        if (this.game && this.game.input) {
            console.log('Game and input available, updating selected tile');

            // Deselect previous tile
            if (this.game.input.selectedTile && this.game.input.selectedTile !== this) {
                console.log(`Deselecting previous tile at (${this.game.input.selectedTile.gridX}, ${this.game.input.selectedTile.gridY})`);
                this.game.input.selectedTile.deselect();
            }

            // Set new selected tile
            this.game.input.selectedTile = this;
            console.log(`Set new selected tile to (${this.gridX}, ${this.gridY})`);

            // Call tile click handler if provided
            if (this.game.options.onTileClick) {
                console.log('Calling onTileClick handler');
                this.game.options.onTileClick(this, this.game);
            } else {
                console.log('No onTileClick handler available');
            }
        } else {
            console.log('Game or input not available, cannot update selected tile');
        }
    }

    /**
     * Handles right-click event
     * @private
     */
    onRightClick() {
        // Log for debugging
        console.log(`Right-clicked tile at (${this.gridX}, ${this.gridY})`);
        console.log('this.game:', this.game ? 'exists' : 'null');
        console.log('this.world:', this.world ? 'exists' : 'null');

        // Move player to this tile if game and player are available
        if (this.game && this.game.player) {
            console.log('Game and player found, moving player to right-clicked tile');
            console.log('Player:', this.game.player);

            // Get the center position of the tile
            const center = this.getCenter();
            console.log(`Tile center: (${center.x}, ${center.y})`);

            // Move player to selected tile
            this.game.player.setMoveTarget(center);
            console.log('setMoveTarget called');

            // Highlight the tile to show it's the target
            this.highlight(0x0000FF, 0.5); // Blue highlight for movement target
            console.log('Tile highlighted');

            // Clear highlight after a short delay
            setTimeout(() => {
                if (!this.selected) {
                    this.unhighlight();
                }
            }, 1000);
        } else {
            console.log('Game or player not available, cannot move player');
            if (this.game) {
                console.log('Game exists but player is null or undefined');
            } else {
                console.log('Game is null or undefined');
                console.log('this:', this);
            }
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
