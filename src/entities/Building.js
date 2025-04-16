import { Structure } from './Structure.js';
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Building class for isometric buildings
 * Extends Structure with additional building-specific properties
 */
export class Building extends Structure {
    /**
     * Creates a new building
     * @param {Object} options - Building options
     */
    constructor(options = {}) {
        // Call parent constructor with structure options
        super({
            ...options,
            structureType: options.buildingType || 'house',
            walkable: false,
            solid: true,
            destructible: true,
            interactive: true
        });

        // Building-specific properties
        this.buildingType = options.buildingType || 'house';
        this.width = options.width || 1;  // Width in tiles
        this.height = options.height || 1; // Height in tiles
        this.occupiedTiles = [];
        this.entranceOffset = options.entranceOffset || { x: 0, y: 1 }; // Default entrance at bottom
        this.level = options.level || 1;
        this.resources = options.resources || {};
        this.production = options.production || {};
        this.capacity = options.capacity || {};
        this.residents = options.residents || [];
        this.maxResidents = options.maxResidents || 0;
        this.buildTime = options.buildTime || 10; // Default to 10 seconds if not specified

        // Construction properties - FORCE UNDER CONSTRUCTION
        this.isBuilt = false; // Start as not built
        this.isUnderConstruction = true; // Start under construction
        this.buildProgress = 0; // Start with 0 progress

        this.constructionCost = options.constructionCost || {};
        this.maintenanceCost = options.maintenanceCost || {};
        this.productionRate = options.productionRate || {};
        this.consumptionRate = options.consumptionRate || {};
        this.upgradeOptions = options.upgradeOptions || [];
        this.description = options.description || '';

        // Set active to ensure update is called
        this.active = true;

        // We'll set the scale in createBuildingSprite after we know if it's a preview or not

        // Set up a visibility check interval
        this.visibilityCheckInterval = setInterval(() => {
            if (this.isBuilt && !this.isUnderConstruction) {
                // Check if the building is visible
                if (!this.visible || this.alpha < 1.0 || (this.sprite && (!this.sprite.visible || this.sprite.alpha < 1.0))) {
                    console.log(`Building ${this.buildingType} at (${this.gridX}, ${this.gridY}) is not fully visible, fixing...`);
                    this.visible = true;
                    this.alpha = 1.0;
                    if (this.sprite) {
                        this.sprite.visible = true;
                        this.sprite.alpha = 1.0;
                    }
                }

                // Check if the building is in the correct layer
                if (this.world && this.parent !== this.world && this.parent !== this.world.structureLayer) {
                    console.log(`Building ${this.buildingType} at (${this.gridX}, ${this.gridY}) is not in the correct layer, fixing...`);
                    this.forceRedraw();
                }
            }
        }, 5000); // Check every 5 seconds

        // Create the building sprite
        this.createBuildingSprite(options);
    }

    /**
     * Creates the building sprite
     * @param {Object} options - Building options
     * @private
     */
    createBuildingSprite(options) {
        try {
            console.log(`Creating building sprite for ${this.buildingType} at (${this.gridX}, ${this.gridY})`);
            console.log(`  isUnderConstruction: ${this.isUnderConstruction}`);
            console.log(`  isBuilt: ${this.isBuilt}`);

            // Remove existing sprite if any
            if (this.sprite && this.sprite.parent === this) {
                console.log('Removing existing building sprite');
                this.removeChild(this.sprite);
                this.sprite = null;
            }

            // If texture is provided, use it
            if (options.texture) {
                console.log('Using provided texture for building');
                this.sprite = new PIXI.Sprite(options.texture);
                this.sprite.anchor.set(0.5, 1); // Bottom center
                this.addChild(this.sprite);
                return;
            }

            console.log('Creating placeholder graphic for building');
            // Otherwise, create a placeholder graphic based on building type
            const graphics = new PIXI.Graphics();

            // Different colors and shapes based on building type
            switch (this.buildingType) {
                case 'house':
                    console.log('Creating HOUSE graphics');
                    // SUPER MASSIVE house with ULTRA bright colors for debugging
                    // Base - bright blue
                    graphics.beginFill(0x00FFFF);
                    graphics.drawRect(-150, -150, 300, 150); // ULTRA large base
                    graphics.endFill();

                    // Outline for base - ULTRA thick
                    graphics.lineStyle(10, 0x000000);
                    graphics.drawRect(-150, -150, 300, 150);
                    graphics.lineStyle(0);

                    // Roof - bright magenta
                    graphics.beginFill(0xFF00FF);
                    graphics.moveTo(-150, -150);
                    graphics.lineTo(0, -300); // ULTRA tall roof
                    graphics.lineTo(150, -150);
                    graphics.lineTo(-150, -150);
                    graphics.endFill();

                    // Outline for roof - ULTRA thick
                    graphics.lineStyle(10, 0x000000);
                    graphics.moveTo(-150, -150);
                    graphics.lineTo(0, -300);
                    graphics.lineTo(150, -150);
                    graphics.lineTo(-150, -150);
                    graphics.lineStyle(0);

                    // Chimney - bright orange
                    graphics.beginFill(0xFF8000);
                    graphics.drawRect(75, -270, 40, 120);
                    graphics.endFill();

                    // Outline for chimney - ULTRA thick
                    graphics.lineStyle(6, 0x000000);
                    graphics.drawRect(75, -270, 40, 120);
                    graphics.lineStyle(0);

                    // Add a MASSIVE flag on top for extra visibility
                    graphics.beginFill(0xFF0000);
                    graphics.drawRect(-100, -350, 10, 80);
                    graphics.drawRect(-100, -350, 60, 40);
                    graphics.endFill();

                    // Smoke from chimney - larger and more visible
                    graphics.beginFill(0xFFFFFF, 0.9);
                    graphics.drawCircle(62, -190, 15);
                    graphics.drawCircle(70, -210, 12);
                    graphics.drawCircle(78, -230, 10);
                    graphics.endFill();

                    // Add a flag on top
                    graphics.beginFill(0xFF0000);
                    graphics.drawRect(-10, -220, 5, 40);
                    graphics.drawRect(-10, -220, 30, 20);
                    graphics.endFill();
                    break;

                case 'shop':
                    // Shop - green rectangle with sign
                    graphics.beginFill(0x2ecc71);
                    graphics.drawRect(-32, -32, 64, 32); // Base
                    graphics.endFill();

                    graphics.beginFill(0xf1c40f);
                    graphics.drawRect(-24, -48, 48, 16); // Sign
                    graphics.endFill();
                    break;

                case 'factory':
                    // Factory - gray rectangle with chimney
                    graphics.beginFill(0x95a5a6);
                    graphics.drawRect(-40, -32, 80, 32); // Base
                    graphics.endFill();

                    graphics.beginFill(0x7f8c8d);
                    graphics.drawRect(20, -64, 16, 32); // Chimney
                    graphics.endFill();
                    break;

                case 'tower':
                    // Tower - tall purple rectangle
                    graphics.beginFill(0x9b59b6);
                    graphics.drawRect(-24, -96, 48, 96); // Tall base
                    graphics.endFill();

                    graphics.beginFill(0x8e44ad);
                    graphics.drawRect(-32, -32, 64, 32); // Base
                    graphics.endFill();
                    break;

                case 'farm':
                    // Farm - brown rectangle with green top
                    graphics.beginFill(0xd35400);
                    graphics.drawRect(-40, -24, 80, 24); // Base
                    graphics.endFill();

                    graphics.beginFill(0x27ae60);
                    graphics.drawRect(-40, -32, 80, 8); // Crops
                    graphics.endFill();
                    break;

                default:
                    // Default building - gray rectangle
                    graphics.beginFill(0x95a5a6);
                    graphics.drawRect(-32, -48, 64, 48);
                    graphics.endFill();
                    break;
            }

            // Add windows or details - ULTRA GIGANTIC
            graphics.beginFill(0xFFFF00); // Bright yellow windows
            graphics.drawRect(-100, -100, 60, 60); // Window 1 - ULTRA larger
            graphics.drawRect(40, -100, 60, 60);   // Window 2 - ULTRA larger
            graphics.endFill();

            // Add window frames - ULTRA thicker
            graphics.lineStyle(8, 0x000000);
            graphics.drawRect(-100, -100, 60, 60); // Window 1 frame
            graphics.drawRect(40, -100, 60, 60);   // Window 2 frame

            // Window crossbars - ULTRA thicker
            graphics.moveTo(-100, -70);
            graphics.lineTo(-40, -70);
            graphics.moveTo(-70, -100);
            graphics.lineTo(-70, -40);

            graphics.moveTo(40, -70);
            graphics.lineTo(100, -70);
            graphics.moveTo(70, -100);
            graphics.lineTo(70, -40);
            graphics.lineStyle(0);

            // Add door - ULTRA GIGANTIC
            graphics.beginFill(0x00FF00); // Bright green door
            graphics.drawRect(-40, -80, 80, 80); // Door - ULTRA larger
            graphics.endFill();

            // Door frame - ULTRA thicker
            graphics.lineStyle(8, 0x000000);
            graphics.drawRect(-40, -80, 80, 80);
            graphics.lineStyle(0);

            // Add door handle - ULTRA larger
            graphics.beginFill(0xFFFF00); // Bright yellow handle
            graphics.drawCircle(-20, -40, 15);
            graphics.endFill();

            // Add a ULTRA large sign
            graphics.beginFill(0xFF00FF); // Bright purple sign
            graphics.drawRect(-100, -200, 200, 40);
            graphics.endFill();

            // Outline for sign - ULTRA thicker
            graphics.lineStyle(6, 0x000000);
            graphics.drawRect(-100, -200, 200, 40);
            graphics.lineStyle(0);

            // Sign text - ULTRA larger
            const text = new PIXI.Text('HOUSE', {
                fontFamily: 'Arial',
                fontSize: 36,
                fontWeight: 'bold',
                fill: 0xFFFFFF,
                stroke: 0x000000,
                strokeThickness: 8,
                align: 'center'
            });
            text.anchor.set(0.5, 0.5);
            text.position.set(0, -180);
            graphics.addChild(text);

            // Add a second text label at the bottom for extra visibility
            const bottomText = new PIXI.Text('BUILDING PLACED HERE', {
                fontFamily: 'Arial',
                fontSize: 24,
                fontWeight: 'bold',
                fill: 0xFF0000,
                stroke: 0xFFFFFF,
                strokeThickness: 6,
                align: 'center'
            });
            bottomText.anchor.set(0.5, 0.5);
            bottomText.position.set(0, 30);
            graphics.addChild(bottomText);

            // Add a third text label at the very top for maximum visibility
            const topText = new PIXI.Text('COMPLETED BUILDING', {
                fontFamily: 'Arial',
                fontSize: 30,
                fontWeight: 'bold',
                fill: 0x00FF00,
                stroke: 0x000000,
                strokeThickness: 8,
                align: 'center'
            });
            topText.anchor.set(0.5, 0.5);
            topText.position.set(0, -350);
            graphics.addChild(topText);

            // We don't add construction overlay here anymore - it's handled by ConstructionOverlay class

            console.log('Adding graphics to building');
            this.addChild(graphics);
            this.sprite = graphics;

            // Log the building state after creating the sprite
            console.log('Building sprite created successfully');
            console.log(`  sprite parent: ${this.sprite.parent === this ? 'this building' : 'other'}`);
            console.log(`  sprite visible: ${this.sprite.visible}`);
            console.log(`  sprite alpha: ${this.sprite.alpha}`);
            console.log(`  building visible: ${this.visible}`);
            console.log(`  building alpha: ${this.alpha}`);
            console.log(`  building parent: ${this.parent ? 'exists' : 'null'}`);
            console.log(`  building position: (${this.position.x}, ${this.position.y})`);
            console.log(`  building zIndex: ${this.zIndex}`);

            // Force the sprite to be visible
            this.sprite.visible = true;
            this.sprite.alpha = 1.0;
            this.visible = true;
            this.alpha = 1.0;

            // Set a MASSIVE scale to make the building visible, but only for real buildings (not previews)
            const isPreview = this.isPreview();
            console.log(`createBuildingSprite for ${this.buildingType}: isPreview=${isPreview}`);

            if (!isPreview) {
                console.log(`Setting large scale for real building ${this.buildingType}`);
                this.setVisibleScale(5);
            } else {
                // For previews, use a normal scale
                console.log(`Setting normal scale for preview building ${this.buildingType}`);
                this.scale.set(1, 1);
            }

            // Set a high zIndex to ensure it's above other elements
            this.zIndex = 100;
        } catch (error) {
            console.error('Error creating building sprite:', error);
        }
    }

    /**
     * Places the building in the world
     * @param {IsometricWorld} world - The world to place the building in
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the building was placed successfully
     */
    placeInWorld(world, gridX, gridY) {
        try {
            console.log(`Building.placeInWorld called for ${this.buildingType} at (${gridX}, ${gridY})`);

            if (!world) {
                console.error('Cannot place building: world is null or undefined');
                return false;
            }

            console.log(`World exists: ${!!world}`);
            console.log(`World type: ${world.constructor.name}`);

            // Double-check the tile
            const tile = world.getTile(gridX, gridY);
            if (!tile) {
                console.error(`Cannot place building: no tile at (${gridX}, ${gridY})`);
                return false;
            }

            console.log(`Tile found at (${gridX}, ${gridY}): type=${tile.type}, walkable=${tile.walkable}`);

            if (!this.canPlaceAt(world, gridX, gridY)) {
                console.error(`Cannot place building: invalid position (${gridX}, ${gridY})`);
                return false;
            }

            console.log(`canPlaceAt returned true for ${this.buildingType} at (${gridX}, ${gridY})`);

            // Force the tile to be walkable for testing
            if (!tile.walkable) {
                console.log(`WARNING: Tile at (${gridX}, ${gridY}) is not walkable, forcing it to be walkable for testing`);
                if (tile._setWalkable) {
                    tile._setWalkable(true, 'Forced by placeInWorld for testing');
                } else {
                    tile.walkable = true;
                }
            }

            // Set grid position
            this.gridX = gridX;
            this.gridY = gridY;

            // Set world reference
            this.world = world;

            // Calculate isometric position
            const worldPos = world.gridToWorld(gridX, gridY);
            console.log(`Building world position: (${worldPos.x}, ${worldPos.y})`);

            // Set position with a MASSIVE offset to make it more visible
            // This positions the building well above the tile to account for the building height
            console.log(`Setting building position to (${worldPos.x}, ${worldPos.y - 200})`);
            this.position.set(worldPos.x, worldPos.y - 200); // ULTRA large Y offset to ensure visibility

            // Ensure the building is visible
            this.visible = true;
            this.alpha = 1.0;

            // Set a MASSIVE scale to make the building visible
            this.setVisibleScale(5);

            // Set a high zIndex to ensure it's above other elements
            this.zIndex = 100;

            // Check if structure layer exists
            if (!world.structureLayer) {
                console.error('Cannot place building: world.structureLayer is null or undefined');
                return false;
            }

            // Add to structure layer - using multiple approaches to ensure it works
            console.log('Adding building to structure layer');
            try {
                // Try adding to structure layer first
                if (world.structureLayer) {
                    console.log('Adding building to structure layer');
                    world.structureLayer.addChild(this);
                }

                // Also try adding directly to the world
                console.log('Also adding building directly to world');
                world.addChild(this);

                // Try entity container as a last resort
                if (!this.parent && world.entityContainer) {
                    console.log('Last resort: Adding to entity container');
                    world.entityContainer.addChild(this);
                }

                // Log the result
                console.log('Building parent after addChild:', this.parent ? 'exists' : 'null');
                console.log('Building visible:', this.visible);
                console.log('Building alpha:', this.alpha);
                console.log('Building position:', this.position.x, this.position.y);
                console.log('Building zIndex:', this.zIndex);

                // Force visibility
                this.visible = true;
                this.alpha = 1.0;
                if (this.sprite) {
                    this.sprite.visible = true;
                    this.sprite.alpha = 1.0;
                }

                // If still no parent, throw an error
                if (!this.parent) {
                    throw new Error('Building has no parent after multiple attempts to add it to the world');
                }
            } catch (error) {
                console.error('Error adding building to layer:', error);
                // Try one more time with a different approach
                try {
                    console.log('Trying alternative approach to add building to world');
                    if (world.container) {
                        world.container.addChild(this);
                    }
                } catch (innerError) {
                    console.error('Alternative approach also failed:', innerError);
                }
            }

            // Mark tiles as occupied
            console.log('Marking tiles as occupied');
            this.occupyTiles(world);

            // Add to world's entity list
            console.log('Adding building to world entities');
            world.entities.add(this);

            console.log(`Building ${this.buildingType} successfully placed at (${gridX}, ${gridY})`);
            return true;
        } catch (error) {
            console.error('Error placing building in world:', error);
            return false;
        }
    }

    /**
     * Checks if the building can be placed at the specified position
     * @param {IsometricWorld} world - The world to check
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the building can be placed
     */
    canPlaceAt(world, gridX, gridY) {
        console.log(`Building.canPlaceAt called for ${this.buildingType} at (${gridX}, ${gridY})`);

        if (!world) {
            console.log('Cannot place building: world is null or undefined');
            return false;
        }

        // Apply loose boundary check
        const maxDistance = 1000;
        if (gridX < -maxDistance || gridX >= world.config.gridWidth + maxDistance ||
            gridY < -maxDistance || gridY >= world.config.gridHeight + maxDistance) {
            console.log(`Cannot place building at (${gridX}, ${gridY}): far outside world bounds`);
            return false;
        }

        console.log(`Building size: ${this.width}x${this.height}`);

        // Check if all required tiles are valid
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileX = gridX + x;
                const tileY = gridY + y;

                const tile = world.getTile(tileX, tileY);

                if (!tile) {
                    console.log(`Cannot place building: no tile at (${tileX}, ${tileY})`);
                    return false;
                }

                if (!tile.walkable) {
                    console.log(`Cannot place building: tile at (${tileX}, ${tileY}) is not walkable (type: ${tile.type})`);
                    return false;
                }

                if (tile.structure) {
                    console.log(`Cannot place building: tile at (${tileX}, ${tileY}) already has a structure`);
                    return false;
                }

                console.log(`Tile at (${tileX}, ${tileY}) is valid for placement (type: ${tile.type})`);
            }
        }

        console.log(`${this.buildingType} can be placed at (${gridX}, ${gridY})`);
        return true;
    }

    /**
     * Marks tiles as occupied by this building
     * @param {IsometricWorld} world - The world
     * @private
     */
    occupyTiles(world) {
        console.log(`Marking tiles as occupied for ${this.buildingType} at (${this.gridX}, ${this.gridY})`);
        this.occupiedTiles = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileX = this.gridX + x;
                const tileY = this.gridY + y;

                const tile = world.getTile(tileX, tileY);
                if (tile) {
                    console.log(`  Marking tile at (${tileX}, ${tileY}) as occupied`);
                    console.log(`    Current walkable: ${tile.walkable}`);

                    // Use the tile's addStructure method to properly update the tile
                    tile.addStructure(this);

                    // Double-check that the tile is properly marked
                    console.log(`    New walkable: ${tile.walkable}`);
                    console.log(`    Has structure: ${tile.structure === this}`);

                    this.occupiedTiles.push(tile);
                } else {
                    console.log(`  No tile found at (${tileX}, ${tileY})`);
                }
            }
        }

        console.log(`Marked ${this.occupiedTiles.length} tiles as occupied`);
    }

    /**
     * Updates the building
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Handle resource production
        this.handleProduction(deltaTime);

        // Construction progress is now handled by ConstructionOverlay class

        // Periodically ensure visibility for completed buildings
        if (this.isBuilt && !this.isUnderConstruction) {
            // Only check every few seconds to avoid performance issues
            this.visibilityCheckCounter = (this.visibilityCheckCounter || 0) + deltaTime;
            if (this.visibilityCheckCounter > 5) { // Check every 5 seconds
                this.visibilityCheckCounter = 0;

                // Check if the building is visible and has a parent
                if (!this.visible || this.alpha < 1 || !this.parent ||
                    (this.sprite && (!this.sprite.visible || this.sprite.alpha < 1))) {
                    console.log(`Building ${this.buildingType} at (${this.gridX}, ${this.gridY}) needs visibility fix`);
                    this.ensureVisibility();
                }
            }
        }
    }

    /**
     * Ensures the building is visible and properly added to the world
     * This is a less aggressive approach than forceRedraw
     */
    ensureVisibility() {
        console.log(`ENSURING VISIBILITY for ${this.buildingType} at (${this.gridX}, ${this.gridY})`);

        // Force the building to be fully built
        this.isUnderConstruction = false;
        this.isBuilt = true;
        this.buildProgress = 1;

        // Make sure the building is visible
        this.visible = true;
        this.alpha = 1.0;

        // Make sure the sprite is visible
        if (this.sprite) {
            this.sprite.visible = true;
            this.sprite.alpha = 1.0;
        }

        // Set a MASSIVE scale to make the building visible
        this.setVisibleScale(5);

        // Make sure the building is in the correct position
        if (this.world) {
            const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
            console.log(`Setting building position to (${worldPos.x}, ${worldPos.y - 200})`);
            this.position.set(worldPos.x, worldPos.y - 200); // ULTRA large Y offset
        }

        // Make sure the building is in the world
        if (this.world && !this.parent) {
            console.log('Building has no parent, adding to world...');

            // Try adding to structure layer first
            if (this.world.structureLayer) {
                console.log('Adding to structure layer');
                this.world.structureLayer.addChild(this);
            }

            // Also add directly to world as a fallback
            console.log('Also adding directly to world');
            this.world.addChild(this);

            // Try entity container as a last resort
            if (!this.parent && this.world.entityContainer) {
                console.log('Last resort: Adding to entity container');
                this.world.entityContainer.addChild(this);
            }
        }

        console.log(`Visibility ensured. Parent: ${this.parent ? 'exists' : 'null'}, Visible: ${this.visible}`);
    }

    /**
     * Forces a complete redraw of the building
     * This is a more aggressive approach to fixing visibility issues
     */
    forceRedraw() {
        console.log(`FORCE REDRAW for ${this.buildingType} at (${this.gridX}, ${this.gridY})`);

        // Store the current state
        const currentState = {
            gridX: this.gridX,
            gridY: this.gridY,
            isBuilt: true,
            isUnderConstruction: false,
            buildProgress: 1,
            world: this.world
        };

        // Remove from parent
        if (this.parent) {
            console.log(`Removing from parent: ${this.parent}`);
            this.parent.removeChild(this);
        }

        // Clear all children
        this.removeChildren();
        this.sprite = null;

        // Create a new sprite
        console.log('Creating new sprite for building');
        this.createBuildingSprite({ buildingType: this.buildingType });

        // Restore state
        this.isBuilt = currentState.isBuilt;
        this.isUnderConstruction = currentState.isUnderConstruction;
        this.buildProgress = currentState.buildProgress;

        // Add back to world
        if (currentState.world) {
            console.log('Adding back to world');

            // Try adding to structure layer first
            if (currentState.world.structureLayer) {
                console.log('Adding to structure layer');
                currentState.world.structureLayer.addChild(this);
            }

            // Also add directly to world as a fallback
            console.log('Also adding directly to world');
            currentState.world.addChild(this);

            // Set position with ULTRA large offset
            const worldPos = currentState.world.gridToWorld(currentState.gridX, currentState.gridY);
            console.log(`Setting position to (${worldPos.x}, ${worldPos.y - 200})`);
            this.position.set(worldPos.x, worldPos.y - 200); // ULTRA large Y offset

            // Verify the building is properly added
            console.log(`Building parent after adding: ${this.parent ? 'exists' : 'null'}`);
            if (!this.parent) {
                console.error('Building still has no parent after adding to world!');
                // Try one more approach - add to entity container
                if (currentState.world.entityContainer) {
                    console.log('Last resort: Adding to entity container');
                    currentState.world.entityContainer.addChild(this);
                }
            }
        }

        // Force visibility
        this.visible = true;
        this.alpha = 1.0;
        if (this.sprite) {
            this.sprite.visible = true;
            this.sprite.alpha = 1.0;
        }

        // Set a MASSIVE scale to make the building visible
        this.setVisibleScale(5);

        // Set a high zIndex
        this.zIndex = 100;

        console.log('Force redraw complete');
    }

    /**
     * Updates the building appearance based on its current state
     * This is called when construction is complete
     */
    updateAppearance() {
        console.log(`UPDATING APPEARANCE for ${this.buildingType} at (${this.gridX}, ${this.gridY})`);
        console.log(`  isUnderConstruction: ${this.isUnderConstruction}`);
        console.log(`  isBuilt: ${this.isBuilt}`);
        console.log(`  visible: ${this.visible}`);
        console.log(`  alpha: ${this.alpha}`);
        console.log(`  parent: ${this.parent ? 'exists' : 'null'}`);
        console.log(`  sprite: ${this.sprite ? 'exists' : 'null'}`);
        console.log(`  position: (${this.position.x}, ${this.position.y})`);
        console.log(`  worldPosition: ${this.world ? JSON.stringify(this.world.gridToWorld(this.gridX, this.gridY)) : 'unknown'}`);

        // Force the building to be fully built
        this.isUnderConstruction = false;
        this.isBuilt = true;
        this.buildProgress = 1;

        // Recreate the building sprite
        console.log('About to recreate building sprite...');
        this.createBuildingSprite({ buildingType: this.buildingType });

        // Make sure the building is visible
        this.visible = true;
        this.alpha = 1.0;

        // Set a MASSIVE scale to make the building visible
        this.setVisibleScale(5);

        // Force the building to be at the correct position
        if (this.world) {
            const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
            console.log(`Setting position to (${worldPos.x}, ${worldPos.y - 60})`);
            this.position.set(worldPos.x, worldPos.y - 60);
        }

        // Force the building to be in the correct layer
        if (this.world && this.parent !== this.world && this.parent !== this.world.structureLayer) {
            console.log('Building is not in the correct layer, attempting to fix...');
            if (this.parent) {
                console.log(`Removing from current parent: ${this.parent}`);
                this.parent.removeChild(this);
            }
            console.log('Adding to world...');
            this.world.addChild(this);
        }

        console.log('Building appearance updated successfully');
        console.log(`  isUnderConstruction: ${this.isUnderConstruction}`);
        console.log(`  isBuilt: ${this.isBuilt}`);
        console.log(`  visible: ${this.visible}`);
        console.log(`  alpha: ${this.alpha}`);
        console.log(`  parent: ${this.parent ? 'exists' : 'null'}`);
        console.log(`  sprite: ${this.sprite ? 'exists' : 'null'}`);
        console.log(`  position: (${this.position.x}, ${this.position.y})`);
    }

    /**
     * Adds a visual effect when building construction is complete
     * @private
     */
    addCompletionEffect() {
        try {
            console.log('Adding building completion effect');

            // Create a massive flash effect
            const flash = new PIXI.Graphics();
            flash.beginFill(0xFFFFFF, 0.9);
            flash.drawRect(-150, -250, 300, 300);
            flash.endFill();
            this.addChild(flash);

            // Add completion text
            const completionText = new PIXI.Text('CONSTRUCTION COMPLETE!', {
                fontFamily: 'Arial',
                fontSize: 24,
                fontWeight: 'bold',
                fill: 0x00FF00,
                stroke: 0x000000,
                strokeThickness: 5,
                align: 'center'
            });
            completionText.anchor.set(0.5, 0.5);
            completionText.position.set(0, -100);
            flash.addChild(completionText);

            // Add fireworks effect using circles and rectangles instead of stars
            for (let i = 0; i < 10; i++) {
                const firework = new PIXI.Graphics();
                const x = Math.random() * 200 - 100;
                const y = Math.random() * 200 - 200;
                const color = Math.random() * 0xFFFFFF;

                // Draw a circle for the firework center
                firework.beginFill(color);
                firework.drawCircle(x, y, 10);
                firework.endFill();

                // Draw some lines radiating outward
                firework.lineStyle(3, color);
                for (let j = 0; j < 8; j++) {
                    const angle = j * Math.PI / 4;
                    const endX = x + Math.cos(angle) * 20;
                    const endY = y + Math.sin(angle) * 20;
                    firework.moveTo(x, y);
                    firework.lineTo(endX, endY);
                }

                flash.addChild(firework);
            }

            // Animate the flash effect with scaling and rotation
            let alpha = 0.9;
            let scale = 1.0;
            let rotation = 0;

            const animateInterval = setInterval(() => {
                // Update alpha
                alpha -= 0.02; // Slower fade
                flash.alpha = alpha;

                // Update scale - make it pulse
                scale = 1.0 + 0.2 * Math.sin(Date.now() / 100);
                flash.scale.set(scale, scale);

                // Update rotation - make fireworks spin
                rotation += 0.02;
                for (let i = 0; i < flash.children.length; i++) {
                    if (i > 0) { // Skip the text
                        flash.children[i].rotation = rotation;
                    }
                }

                if (alpha <= 0) {
                    clearInterval(animateInterval);
                    this.removeChild(flash);
                    console.log('Building completion effect finished');
                }
            }, 50); // Faster updates for smoother animation
        } catch (error) {
            console.error('Error adding completion effect:', error);
        }
    }

    /**
     * Handles resource production for the building
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    handleProduction(deltaTime) {
        // Handle production if the building is built
        if (this.isBuilt && Object.keys(this.productionRate).length > 0) {
            for (const [resource, rate] of Object.entries(this.productionRate)) {
                if (!this.resources[resource]) {
                    this.resources[resource] = 0;
                }

                this.resources[resource] += rate * deltaTime;
            }
        }
    }

    /**
     * Checks if this building is a placement preview
     * @returns {boolean} Whether this building is a preview
     */
    isPreview() {
        // Check if the building is in the BuildingManager's uiLayer
        return this.parent && this.parent.name === 'uiLayer';
    }

    /**
     * Sets the building scale to make it visible
     * @param {number} scale - Scale factor (default: 5)
     */
    setVisibleScale(scale = 5) {
        // Skip if this is a preview
        if (this.isPreview()) {
            console.log(`Not scaling preview building ${this.buildingType}`);
            this.scale.set(1, 1); // Force normal scale for previews
            return;
        }

        console.log(`Setting scale for ${this.buildingType} at (${this.gridX}, ${this.gridY}) to ${scale}`);

        // Set the scale
        this.scale.set(scale, scale);

        // Also set scale for any children
        if (this.sprite) {
            // Don't scale the sprite since the container is already scaled
            this.sprite.scale.set(1, 1);
        }

        console.log(`Building scale set to (${this.scale.x}, ${this.scale.y})`);
    }

    /**
     * Adds a massive debug marker at the building position
     * This is a last resort to make the building visible
     */
    addDebugMarker() {
        console.log(`Adding debug marker for ${this.buildingType} at (${this.gridX}, ${this.gridY})`);

        // Remove existing marker if any
        if (this.debugMarker && this.debugMarker.parent) {
            this.debugMarker.parent.removeChild(this.debugMarker);
        }

        // Create a new marker
        const marker = new PIXI.Graphics();

        // Draw a MASSIVE red X
        marker.lineStyle(20, 0xFF0000, 1);
        marker.moveTo(-200, -200);
        marker.lineTo(200, 200);
        marker.moveTo(200, -200);
        marker.lineTo(-200, 200);

        // Draw a MASSIVE circle
        marker.lineStyle(20, 0x00FF00, 1);
        marker.drawCircle(0, 0, 250);

        // Add text
        const text = new PIXI.Text(`BUILDING HERE\n${this.buildingType}\n(${this.gridX}, ${this.gridY})`, {
            fontFamily: 'Arial',
            fontSize: 36,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 8,
            align: 'center'
        });
        text.anchor.set(0.5, 0.5);
        marker.addChild(text);

        // Store reference
        this.debugMarker = marker;

        // Add to world
        if (this.world) {
            this.world.addChild(marker);

            // Position the marker
            const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
            marker.position.set(worldPos.x, worldPos.y - 200);
        } else if (this.parent) {
            this.parent.addChild(marker);
            marker.position.set(0, -200);
        } else {
            // Add to the building itself as a last resort
            this.addChild(marker);
            marker.position.set(0, -200);
        }

        console.log('Debug marker added');
    }

    /**
     * Cleans up resources when the building is destroyed
     */
    destroy() {
        // Clear the visibility check interval
        if (this.visibilityCheckInterval) {
            clearInterval(this.visibilityCheckInterval);
            this.visibilityCheckInterval = null;
        }

        // Remove debug marker if any
        if (this.debugMarker && this.debugMarker.parent) {
            this.debugMarker.parent.removeChild(this.debugMarker);
            this.debugMarker = null;
        }

        // Call the parent destroy method
        super.destroy();
    }

    /**
     * Gets the entrance position of the building
     * @returns {Object} The entrance position {gridX, gridY}
     */
    getEntrancePosition() {
        return {
            gridX: this.gridX + this.entranceOffset.x,
            gridY: this.gridY + this.entranceOffset.y
        };
    }

    /**
     * Upgrades the building to the next level
     * @param {Object} resources - Available resources for the upgrade
     * @returns {boolean} Whether the upgrade was successful
     */
    upgrade(resources) {
        if (this.level >= this.upgradeOptions.length) {
            console.log(`Building ${this.buildingType} at (${this.gridX}, ${this.gridY}) is already at max level`);
            return false;
        }

        const upgradeOption = this.upgradeOptions[this.level];

        // Check if we have enough resources
        for (const [resource, amount] of Object.entries(upgradeOption.cost)) {
            if (!resources[resource] || resources[resource] < amount) {
                console.log(`Not enough ${resource} to upgrade building`);
                return false;
            }
        }

        // Deduct resources
        for (const [resource, amount] of Object.entries(upgradeOption.cost)) {
            resources[resource] -= amount;
        }

        // Apply upgrade
        this.level++;

        // Apply upgrade effects
        if (upgradeOption.effects) {
            for (const [key, value] of Object.entries(upgradeOption.effects)) {
                if (typeof value === 'object' && this[key]) {
                    // Merge objects
                    this[key] = { ...this[key], ...value };
                } else {
                    // Set value
                    this[key] = value;
                }
            }
        }

        console.log(`Building ${this.buildingType} at (${this.gridX}, ${this.gridY}) upgraded to level ${this.level}`);
        return true;
    }

    /**
     * Gets information about the building
     * @returns {Object} Building information
     */
    getInfo() {
        return {
            type: this.buildingType,
            level: this.level,
            position: { x: this.gridX, y: this.gridY },
            size: { width: this.width, height: this.height },
            resources: this.resources,
            production: this.production,
            residents: this.residents.length,
            maxResidents: this.maxResidents,
            isBuilt: this.isBuilt,
            buildProgress: this.buildProgress,
            description: this.description
        };
    }
}
