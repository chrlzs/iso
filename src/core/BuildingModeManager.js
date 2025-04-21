/**
 * BuildingModeManager.js
 * Manages the building mode for placing assets on the map
 */
import { PIXI } from '../utils/PixiWrapper.js';
import { ASSET_CATEGORIES, getAssetById, getAssetsByCategory } from '../assets/AssetDefinitions.js';
import { Structure } from '../entities/Structure.js';
import { Character } from '../entities/Character.js';
import { BuildingModeGridOverlay } from '../ui/BuildingModeGridOverlay.js';
import { IsometricTile } from '../rendering/IsometricTile.js';

/**
 * BuildingModeManager class
 * Handles the building mode functionality
 */
export class BuildingModeManager {
    /**
     * Creates a new building mode manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.game = options.game;
        this.world = options.world;
        this.assetManager = options.assetManager;

        // Building mode state
        this.active = false;
        this.selectedCategory = null;
        this.selectedAssetId = null;
        this.selectedAsset = null;
        this.placementValid = false;

        // Preview container
        this.previewContainer = new PIXI.Container();
        this.previewContainer.visible = false;
        this.previewContainer.zIndex = 1000;

        // Preview sprite
        this.previewSprite = null;

        // Grid highlight
        this.gridHighlight = new PIXI.Graphics();
        this.gridHighlight.zIndex = 999;
        this.previewContainer.addChild(this.gridHighlight);

        // Add preview container to world
        if (this.world) {
            this.world.addChild(this.previewContainer);
        }

        // Create debug cursor for mouse position (smaller and more transparent)
        this.debugCursor = new PIXI.Graphics();
        this.debugCursor.beginFill(0xFF0000, 0.5);
        this.debugCursor.drawCircle(0, 0, 3);
        this.debugCursor.endFill();
        if (this.world && this.world.selectionContainer) {
            this.world.selectionContainer.addChild(this.debugCursor);
        } else if (this.world) {
            this.world.addChild(this.debugCursor);
        }

        // Create coordinate debug text (smaller and more transparent)
        this.debugText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 1,
            align: 'left'
        });
        this.debugText.position.set(10, 10);
        this.debugText.zIndex = 9999;
        this.debugText.alpha = 0.7;
        if (this.game && this.game.ui && this.game.ui.container) {
            this.game.ui.container.addChild(this.debugText);
        } else if (this.game && this.game.app) {
            this.game.app.stage.addChild(this.debugText);
        }

        // Create grid overlay
        this.gridOverlay = new BuildingModeGridOverlay({
            game: this.game,
            world: this.world
        });

        // Bind methods
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    /**
     * Initializes the building mode manager
     */
    initialize() {
        // Add event listeners
        if (this.game && this.game.app) {
            this.game.app.view.addEventListener('mousemove', this.onMouseMove);
            this.game.app.view.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('keydown', this.onKeyDown);
        }

        // Ensure the center chunk is loaded
        setTimeout(() => {
            this.ensureCenterChunkLoaded();
        }, 1000); // Wait 1 second for everything to stabilize
    }



    /**
     * Activates building mode
     */
    activate() {
        this.active = true;
        this.previewContainer.visible = true;

        // Show grid overlay silently
        if (this.gridOverlay) {
            // Just set visibility directly to avoid triggering messages
            this.gridOverlay.container.visible = true;
            this.gridOverlay.drawGrid();
        }

        // Clear texture cache to ensure new styles are applied
        if (this.world && this.world.textureCache) {
            this.world.textureCache.clear();
        }

        // Ensure the center chunk is loaded
        this.ensureCenterChunkLoaded();

        // Notify game that building mode is active
        if (this.game) {
            this.game.buildingModeActive = true;

            // Clear any selected tiles
            if (this.game.input && this.game.input.selectedTile) {
                this.game.input.selectedTile.deselect();
                this.game.input.selectedTile = null;
            }

            // Clear any hovered tiles
            if (this.game.input && this.game.input.hoveredTile) {
                this.game.input.hoveredTile.unhighlight();
                this.game.input.hoveredTile = null;
            }
        }
    }

    /**
     * Ensures necessary chunks are loaded for building mode
     * This is important for building mode to work correctly
     */
    ensureCenterChunkLoaded() {
        if (!this.world) return;

        // Get the player's current position
        const player = this.game && this.game.player;
        let chunkX = 0;
        let chunkY = 0;

        if (player) {
            // Convert player position to chunk coordinates
            const playerChunkCoords = this.world.config.gridToChunk(player.gridX, player.gridY);
            chunkX = playerChunkCoords.chunkX;
            chunkY = playerChunkCoords.chunkY;

            // Debug logging
            if (this.game && this.game.options && this.game.options.debug) {
                console.log(`Player is in chunk (${chunkX}, ${chunkY})`);
            }
        }

        // Check if the current chunk is loaded
        const currentChunk = this.world.getChunk(chunkX, chunkY);

        if (!currentChunk || !currentChunk.isLoaded) {
            console.log(`Loading chunk (${chunkX}, ${chunkY}) for building mode`);
            this.world.loadChunk(chunkX, chunkY);

            // If the chunk still doesn't exist, create a blank map
            if (!this.world.getChunk(chunkX, chunkY)) {
                console.log('Creating blank map for building mode');
                this.world.createBlankMap({
                    defaultTerrain: 'grass',
                    clearStorage: false
                });
            }
        }

        // Also ensure chunks around the current chunk are loaded
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip the current chunk

                const neighborX = chunkX + dx;
                const neighborY = chunkY + dy;

                // Check if the neighbor chunk is loaded
                const neighborChunk = this.world.getChunk(neighborX, neighborY);

                if (!neighborChunk || !neighborChunk.isLoaded) {
                    if (this.game && this.game.options && this.game.options.debug) {
                        console.log(`Loading neighboring chunk (${neighborX}, ${neighborY}) for building mode`);
                    }
                    this.world.loadChunk(neighborX, neighborY);
                }
            }
        }

        // Show building mode UI
        if (this.game && this.game.ui) {
            this.game.ui.showBuildingModeUI();
        }

        // Show a message about the grid (only once)
        if (this.game && this.game.ui && !this._shownInitialMessage) {
            this.game.ui.showMessage('Select a terrain type to start building.', 8000);
            this._shownInitialMessage = true;
        }
    }

    /**
     * Deactivates building mode
     */
    deactivate() {
        this.active = false;
        this.previewContainer.visible = false;
        this.selectedCategory = null;
        this.selectedAssetId = null;
        this.selectedAsset = null;

        // Hide grid overlay
        if (this.gridOverlay) {
            this.gridOverlay.hide();
        }

        // Remove tile outline
        if (this.tileOutline) {
            if (this.tileOutline.parent) {
                this.tileOutline.parent.removeChild(this.tileOutline);
            }
            this.tileOutline = null;
        }

        // Remove mouse cursor
        if (this.mouseCursor) {
            if (this.mouseCursor.parent) {
                this.mouseCursor.parent.removeChild(this.mouseCursor);
            }
            this.mouseCursor = null;
        }



        // Notify game that building mode is inactive
        if (this.game) {
            this.game.buildingModeActive = false;
        }

        // Hide building mode UI
        if (this.game && this.game.ui) {
            this.game.ui.hideBuildingModeUI();
        }
    }

    /**
     * Toggles building mode
     */
    toggle() {
        if (this.active) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    /**
     * Selects an asset category
     * @param {string} category - Asset category
     */
    selectCategory(category) {
        this.selectedCategory = category;
        this.selectedAssetId = null;
        this.selectedAsset = null;

        // Update preview
        this.updatePreview();

        // Update UI
        if (this.game && this.game.ui) {
            this.game.ui.updateBuildingModeUI();
        }
    }

    /**
     * Selects an asset
     * @param {string} assetId - Asset ID
     */
    selectAsset(assetId) {
        this.selectedAssetId = assetId;
        this.selectedAsset = getAssetById(assetId);

        // Update preview
        this.updatePreview();

        // Update UI
        if (this.game && this.game.ui) {
            this.game.ui.updateBuildingModeUI();
        }
    }

    /**
     * Updates the placement preview
     */
    updatePreview() {
        // Clear existing preview
        if (this.previewSprite && this.previewSprite.parent) {
            this.previewSprite.parent.removeChild(this.previewSprite);
            this.previewSprite = null;
        }

        // If no asset is selected, hide preview
        if (!this.selectedAsset) {
            this.previewContainer.visible = false;
            return;
        }

        // Show preview container
        this.previewContainer.visible = true;

        // Create preview sprite with enhanced visibility
        let texture = this.assetManager.getTexture(this.selectedAssetId);

        // If asset manager doesn't have the texture, create a placeholder
        if (!texture && this.world) {
            texture = this.world.createPlaceholderTexture(this.selectedAsset.id);
        }

        this.previewSprite = new PIXI.Sprite(texture);
        this.previewSprite.anchor.set(0.5, 1);
        this.previewSprite.alpha = 0.9;

        // Add a glow filter for better visibility
        const glowFilter = new PIXI.filters.GlowFilter({
            distance: 15,
            outerStrength: 2,
            innerStrength: 1,
            color: 0x00FFFF,
            quality: 0.5
        });

        // Check if filters are supported
        if (PIXI.filters) {
            try {
                this.previewSprite.filters = [glowFilter];
            } catch (error) {
                console.warn('Glow filter not supported:', error);
            }
        }

        this.previewContainer.addChild(this.previewSprite);
    }

    /**
     * Updates the grid highlight
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {boolean} valid - Whether placement is valid
     */
    updateGridHighlight(gridX, gridY, valid) {
        this.gridHighlight.clear();

        if (!this.selectedAsset) return;

        // Get tile dimensions
        const tileWidth = this.world.config.tileWidth;
        const tileHeight = this.world.config.tileHeight;

        // Set highlight color based on validity
        const color = valid ? 0x00FF00 : 0xFF0000;
        const alpha = 0.3;

        // Draw highlight for each tile in the asset footprint
        this.gridHighlight.lineStyle(2, color, 0.8);
        this.gridHighlight.beginFill(color, alpha);

        for (let y = 0; y < this.selectedAsset.height; y++) {
            for (let x = 0; x < this.selectedAsset.width; x++) {
                const worldPos = this.world.gridToWorld(gridX + x, gridY + y);

                // Draw diamond shape
                this.gridHighlight.moveTo(worldPos.x, worldPos.y - tileHeight / 2);
                this.gridHighlight.lineTo(worldPos.x + tileWidth / 2, worldPos.y);
                this.gridHighlight.lineTo(worldPos.x, worldPos.y + tileHeight / 2);
                this.gridHighlight.lineTo(worldPos.x - tileWidth / 2, worldPos.y);
                this.gridHighlight.lineTo(worldPos.x, worldPos.y - tileHeight / 2);
            }
        }

        this.gridHighlight.endFill();
    }

    /**
     * Checks if an asset can be placed at the specified position
     * @param {Object} asset - Asset to place
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {boolean} Whether the asset can be placed
     */
    canPlaceAsset(asset, gridX, gridY) {
        if (!asset || !this.world) return false;

        // Terrain can always be placed on any existing tile
        if (asset.isTerrain) {
            const tile = this.world.getTile(gridX, gridY);
            return !!tile; // Just make sure the tile exists
        }

        // Use asset's placement rules if available
        if (asset.placementRules && typeof asset.placementRules === 'function') {
            return asset.placementRules(this.world, gridX, gridY);
        }

        // Default placement rules
        for (let y = 0; y < asset.height; y++) {
            for (let x = 0; x < asset.width; x++) {
                const tile = this.world.getTile(gridX + x, gridY + y);
                if (!tile || !tile.walkable || tile.structure) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Places the selected asset at the specified position
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {boolean} Whether the asset was placed successfully
     */
    placeAsset(gridX, gridY) {
        if (!this.selectedAsset || !this.world) return false;

        console.log(`Placing asset ${this.selectedAsset.name} (${this.selectedAsset.id}) at (${gridX}, ${gridY})`);

        // Check if placement is valid
        if (!this.canPlaceAsset(this.selectedAsset, gridX, gridY)) {
            console.log(`  - Placement is not valid`);
            return false;
        }

        // Handle terrain placement differently
        if (this.selectedAsset.isTerrain) {
            console.log(`  - Placing terrain asset`);
            const success = this.placeTerrain(this.selectedAsset, gridX, gridY);

            // Force a world save after placing terrain
            if (success && this.game) {
                console.log(`  - Forcing world save after terrain placement`);
                this.game.saveWorldState();
            }

            return success;
        }

        // Create the appropriate entity based on asset category
        let entity;

        switch (this.selectedAsset.category) {
            case ASSET_CATEGORIES.CHARACTERS:
                console.log(`  - Creating character entity`);
                entity = this.createCharacter(this.selectedAsset, gridX, gridY);
                break;
            default:
                console.log(`  - Creating structure entity`);
                entity = this.createStructure(this.selectedAsset, gridX, gridY);
                break;
        }

        // Place the entity in the world
        if (entity) {
            console.log(`  - Placing entity in world`);
            const success = entity.placeInWorld(this.world, gridX, gridY);

            if (success) {
                // Show notification
                if (this.game && this.game.ui) {
                    this.game.ui.showMessage(`Placed ${this.selectedAsset.name} at (${gridX}, ${gridY})`, 2000);
                }

                // Force a world save after placing entity
                if (this.game) {
                    console.log(`  - Forcing world save after entity placement`);
                    this.game.saveWorldState();
                }
            }

            return success;
        }

        return false;
    }

    /**
     * Places terrain at the specified position
     * @param {Object} terrainAsset - Terrain asset to place
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {boolean} Whether the terrain was placed successfully
     */
    placeTerrain(terrainAsset, gridX, gridY) {
        if (!terrainAsset || !this.world) return false;

        console.log(`SIMPLE APPROACH: Placing terrain ${terrainAsset.id} at (${gridX}, ${gridY})`);

        try {
            // Create a texture for the terrain
            const texture = this.world.createPlaceholderTexture(terrainAsset.id);
            if (!texture) {
                console.error(`Failed to create texture for ${terrainAsset.id}`);
                return false;
            }

            // Get the chunk coordinates
            const chunkCoords = this.world.config.gridToChunk(gridX, gridY);
            const chunk = this.world.getOrCreateChunk(chunkCoords.chunkX, chunkCoords.chunkY);

            if (!chunk) {
                console.error(`Failed to get or create chunk at (${chunkCoords.chunkX}, ${chunkCoords.chunkY})`);
                return false;
            }

            // Calculate local coordinates within the chunk
            const localX = gridX - (chunkCoords.chunkX * this.world.config.chunkSize);
            const localY = gridY - (chunkCoords.chunkY * this.world.config.chunkSize);

            // Remove any existing tile
            if (chunk.tiles[localX][localY]) {
                chunk.removeTile(localX, localY);
            }

            // Create a new tile using the world's createTileInternal method
            const newTile = this.world.createTileInternal(gridX, gridY, terrainAsset.id, texture, {
                elevation: terrainAsset.elevation || 0,
                walkable: terrainAsset.walkable !== false,
                type: terrainAsset.id
            });

            if (!newTile) {
                console.error(`Failed to create new tile`);
                return false;
            }

            // CRITICAL: Make sure the tile is added to the display list
            if (!newTile.parent) {
                console.log(`Adding tile to ground layer`);
                this.world.groundLayer.addChild(newTile);
            }

            // CRITICAL: Update the chunk's internal tile reference
            chunk.tiles[localX][localY] = newTile;

            // Mark the chunk as dirty
            chunk.isDirty = true;

            // Save the chunk immediately
            if (this.world.persistChunks && this.world.chunkStorage) {
                const serializedData = chunk.serialize();
                this.world.chunkStorage.saveChunk(
                    this.world.worldId,
                    chunkCoords.chunkX,
                    chunkCoords.chunkY,
                    serializedData
                );
            }

            // Force save the world state
            this.game.saveWorldState();

            // Force the world to update
            this.world.dirty = true;

            // Show notification
            if (this.game && this.game.ui) {
                this.game.ui.showMessage(`Changed terrain to ${terrainAsset.name} at (${gridX}, ${gridY})`, 2000);
            }

            return true;
        } catch (error) {
            console.error(`Error placing terrain:`, error);
            return false;
        }
    }

    /**
     * Creates a structure entity from an asset
     * @param {Object} asset - Asset definition
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Structure} The created structure
     */
    createStructure(asset, gridX, gridY) {
        // Get texture
        const texture = this.assetManager.getTexture(asset.id);

        // Create structure
        const structure = new Structure({
            structureType: asset.id,
            gridX,
            gridY,
            walkable: asset.walkable,
            solid: asset.solid,
            destructible: true,
            interactive: asset.interactive,
            texture,
            width: asset.width,
            height: asset.height
        });

        return structure;
    }

    /**
     * Creates a character entity from an asset
     * @param {Object} asset - Asset definition
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Character} The created character
     */
    createCharacter(asset, gridX, gridY) {
        // Get texture
        const texture = this.assetManager.getTexture(asset.id);

        // Create character
        const character = new Character({
            type: 'npc',
            subtype: asset.id,
            gridX,
            gridY,
            texture,
            interactive: asset.interactive,
            name: asset.name
        });

        return character;
    }

    /**
     * Handles mouse move event
     * @param {MouseEvent} event - Mouse event
     */
    onMouseMove(event) {
        if (!this.active || !this.selectedAsset || !this.world) return;

        // Get mouse position
        const rect = this.game.app.view.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Ensure the center chunk is loaded
        this.ensureCenterChunkLoaded();

        // Use a simplified approach to get the grid coordinates
        const gridPos = this.getGridPositionFromMouse(x, y);
        const gridX = gridPos.x;
        const gridY = gridPos.y;

        // Update debug cursor position
        if (this.debugCursor) {
            // Position the debug cursor at the grid position
            const worldPos = this.world.gridToWorld(gridX, gridY);
            this.debugCursor.position.set(worldPos.x, worldPos.y);

            // Create a second debug cursor at the mouse position if it doesn't exist
            if (!this.mouseCursor) {
                this.mouseCursor = new PIXI.Graphics();
                this.mouseCursor.beginFill(0x00FFFF, 0.5);
                this.mouseCursor.drawCircle(0, 0, 3);
                this.mouseCursor.endFill();
                if (this.world && this.world.selectionContainer) {
                    this.world.selectionContainer.addChild(this.mouseCursor);
                } else if (this.world) {
                    this.world.addChild(this.mouseCursor);
                }
            }

            // Position the mouse cursor at the exact mouse position
            const point = new PIXI.Point(x, y);
            const localPoint = this.world.toLocal(point);
            this.mouseCursor.position.set(localPoint.x, localPoint.y);

            // Update debug text with coordinate information
            if (this.debugText) {
                const gridInfo = `Grid Position: ${gridX}, ${gridY}`;
                const modeInfo = `Mode: ${this.selectedAsset ? this.selectedAsset.name : 'None'}`;
                const validInfo = `Valid: ${this.placementValid ? 'Yes' : 'No'}`;

                this.debugText.text = [
                    gridInfo,
                    modeInfo,
                    validInfo
                ].join('\n');
            }
        }

        // Update preview position
        if (this.previewSprite) {
            const worldPos = this.world.gridToWorld(gridX, gridY);
            this.previewSprite.position.set(worldPos.x, worldPos.y);
        }

        // Check if placement is valid
        this.placementValid = this.canPlaceAsset(this.selectedAsset, gridX, gridY);

        // Update grid highlight
        this.updateGridHighlight(gridX, gridY, this.placementValid);

        // Update preview sprite alpha and tint based on validity
        if (this.previewSprite) {
            this.previewSprite.alpha = this.placementValid ? 0.9 : 0.5;
            this.previewSprite.tint = this.placementValid ? 0x00FFFF : 0xFF0000; // Cyan for valid, red for invalid
        }

        // Show tile outline to replace hover effect
        this.showTileOutline(gridX, gridY, this.placementValid);

        // Store current grid position
        this.currentGridX = gridX;
        this.currentGridY = gridY;
    }

    /**
     * Gets grid position from mouse coordinates using a simplified approach
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} Grid coordinates {x, y}
     */
    getGridPositionFromMouse(screenX, screenY) {
        // Ensure the center chunk is loaded
        this.ensureCenterChunkLoaded();

        // Create a point at the mouse position
        const point = new PIXI.Point(screenX, screenY);

        // Convert to local coordinates in the world
        const localPoint = this.world.toLocal(point);

        // Use the world's coordinate system to convert to grid coordinates
        const gridPos = this.world.worldToGrid(localPoint.x, localPoint.y);

        // Use Math.round instead of Math.floor for more accurate grid positioning
        let gridX = Math.round(gridPos.x);
        let gridY = Math.round(gridPos.y);

        // Debug logging
        if (this.game && this.game.options && this.game.options.debug) {
            console.log(`Mouse at screen (${screenX}, ${screenY}) -> world (${localPoint.x.toFixed(2)}, ${localPoint.y.toFixed(2)}) -> grid (${gridX}, ${gridY})`);
        }

        // REMOVED: We no longer force coordinates to be within the center chunk
        // This allows the player to place tiles anywhere on the map

        return { x: gridX, y: gridY };
    }

    /**
     * Handles mouse down event
     * @param {MouseEvent} event - Mouse event
     */
    onMouseDown(event) {
        if (!this.active || !this.selectedAsset || !this.world) return;

        // Only handle left mouse button
        if (event.button !== 0) return;

        // Get mouse position
        const rect = this.game.app.view.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Debug logging
        console.log(`Mouse down at screen position (${x}, ${y})`);

        // Ensure necessary chunks are loaded
        this.ensureCenterChunkLoaded();

        // Use our simplified approach to get the grid coordinates
        const gridPos = this.getGridPositionFromMouse(x, y);
        const gridX = gridPos.x;
        const gridY = gridPos.y;

        // Debug logging
        console.log(`Attempting to place asset at grid position (${gridX}, ${gridY})`);
        console.log(`Selected asset: ${this.selectedAsset.name} (${this.selectedAsset.id})`);
        console.log(`Placement valid: ${this.placementValid}`);

        // Try to place the asset
        if (this.placementValid) {
            const success = this.placeAsset(gridX, gridY);

            // Debug logging
            console.log(`Asset placement ${success ? 'successful' : 'failed'}`);

            // Show a visual indicator at the placement location
            if (success) {
                this.showPlacementIndicator(gridX, gridY);

                // Force the world to update
                if (this.world) {
                    this.world.dirty = true;
                }
            }
        }
    }

    /**
     * Handles key down event
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyDown(event) {
        if (!this.active) return;

        // ESC key - exit building mode
        if (event.key === 'Escape') {
            this.deactivate();
        }

        // R key - reserved for future asset rotation
        if (event.key === 'r' || event.key === 'R') {
            // TODO: Implement asset rotation
        }

        // G key - toggle grid overlay
        if (event.key === 'g' || event.key === 'G') {
            if (this.gridOverlay) {
                // Toggle grid overlay (not silent when user presses G)
                const isVisible = this.gridOverlay.toggle(false);

                // Show message
                if (this.game && this.game.ui) {
                    const message = isVisible ?
                        'Grid overlay enabled' :
                        'Grid overlay disabled';
                    this.game.ui.showMessage(message, 2000);
                }
            }
        }
    }

    /**
     * Shows a tile outline at the specified position
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {boolean} valid - Whether placement is valid
     */
    showTileOutline(gridX, gridY, valid) {
        if (!this.world) return;

        // Create outline container if it doesn't exist
        if (!this.tileOutline) {
            this.tileOutline = new PIXI.Graphics();
            if (this.world.selectionContainer) {
                this.world.selectionContainer.addChild(this.tileOutline);
            } else {
                this.world.addChild(this.tileOutline);
            }
        }

        // Clear previous outline
        this.tileOutline.clear();

        // Get world position
        const worldPos = this.world.gridToWorld(gridX, gridY);

        // Position the outline
        this.tileOutline.position.set(worldPos.x, worldPos.y);

        // Get tile dimensions
        const tileWidth = this.world.config.tileWidth;
        const tileHeight = this.world.config.tileHeight;

        // Set color based on validity
        const color = valid ? 0x00FFFF : 0xFF0000;

        // Draw diamond outline with fill
        this.tileOutline.lineStyle(2, color, 0.8);
        this.tileOutline.beginFill(color, 0.2);

        // Draw the diamond shape
        const visualCenterY = -tileHeight / 2;
        this.tileOutline.moveTo(0, visualCenterY);
        this.tileOutline.lineTo(tileWidth/2, visualCenterY + tileHeight/2);
        this.tileOutline.lineTo(0, visualCenterY + tileHeight);
        this.tileOutline.lineTo(-tileWidth/2, visualCenterY + tileHeight/2);
        this.tileOutline.closePath();
        this.tileOutline.endFill();

        // Add corner accents
        this.tileOutline.lineStyle(3, color, 1);
        const accentLength = 10;

        // Top corner
        this.tileOutline.moveTo(0, visualCenterY);
        this.tileOutline.lineTo(0, visualCenterY + accentLength);

        // Right corner
        this.tileOutline.moveTo(tileWidth/2, visualCenterY + tileHeight/2);
        this.tileOutline.lineTo(tileWidth/2 - accentLength, visualCenterY + tileHeight/2);

        // Bottom corner
        this.tileOutline.moveTo(0, visualCenterY + tileHeight);
        this.tileOutline.lineTo(0, visualCenterY + tileHeight - accentLength);

        // Left corner
        this.tileOutline.moveTo(-tileWidth/2, visualCenterY + tileHeight/2);
        this.tileOutline.lineTo(-tileWidth/2 + accentLength, visualCenterY + tileHeight/2);

        // Add a cross in the center for better visibility
        this.tileOutline.lineStyle(1, 0xFFFFFF, 0.8);
        this.tileOutline.moveTo(-10, visualCenterY + tileHeight/2);
        this.tileOutline.lineTo(10, visualCenterY + tileHeight/2);
        this.tileOutline.moveTo(0, visualCenterY + tileHeight/2 - 10);
        this.tileOutline.lineTo(0, visualCenterY + tileHeight/2 + 10);
    }

    /**
     * Shows a visual indicator at the placement location
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     */
    showPlacementIndicator(gridX, gridY) {
        if (!this.world) return;

        // Get world position
        const worldPos = this.world.gridToWorld(gridX, gridY);

        // Create indicator container if it doesn't exist
        if (!this.placementIndicators) {
            this.placementIndicators = [];
        }

        // Create indicator graphics
        const indicator = new PIXI.Graphics();

        // Draw indicator
        indicator.lineStyle(2, 0x00FFFF, 1);
        indicator.drawCircle(0, 0, 20);

        // Add plus sign
        indicator.lineStyle(3, 0xFFFFFF, 1);
        indicator.moveTo(-10, 0);
        indicator.lineTo(10, 0);
        indicator.moveTo(0, -10);
        indicator.lineTo(0, 10);

        // Position indicator
        indicator.position.set(worldPos.x, worldPos.y);

        // Add to world
        if (this.world.selectionContainer) {
            this.world.selectionContainer.addChild(indicator);
        } else {
            this.world.addChild(indicator);
        }

        // Store indicator for cleanup
        this.placementIndicators.push({
            graphic: indicator,
            createdAt: Date.now(),
            duration: 1000 // 1 second
        });
    }

    /**
     * Updates the building mode manager
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.active) return;

        // Update grid overlay
        if (this.gridOverlay) {
            this.gridOverlay.update();
        }

        // Update placement indicators
        if (this.placementIndicators && this.placementIndicators.length > 0) {
            const now = Date.now();
            const indicatorsToRemove = [];

            // Update each indicator
            this.placementIndicators.forEach((indicator, index) => {
                const elapsed = now - indicator.createdAt;

                if (elapsed >= indicator.duration) {
                    // Remove indicator
                    if (indicator.graphic.parent) {
                        indicator.graphic.parent.removeChild(indicator.graphic);
                    }
                    indicatorsToRemove.push(index);
                } else {
                    // Update alpha based on time remaining
                    const alpha = 1 - (elapsed / indicator.duration);
                    indicator.graphic.alpha = alpha;

                    // Scale up as it fades out
                    const scale = 1 + (elapsed / indicator.duration) * 0.5;
                    indicator.graphic.scale.set(scale, scale);
                }
            });

            // Remove expired indicators
            for (let i = indicatorsToRemove.length - 1; i >= 0; i--) {
                this.placementIndicators.splice(indicatorsToRemove[i], 1);
            }
        }
    }

    /**
     * Cleans up resources
     */
    dispose() {
        // Remove event listeners
        if (this.game && this.game.app) {
            this.game.app.view.removeEventListener('mousemove', this.onMouseMove);
            this.game.app.view.removeEventListener('mousedown', this.onMouseDown);
            window.removeEventListener('keydown', this.onKeyDown);
        }

        // Remove preview container
        if (this.previewContainer && this.previewContainer.parent) {
            this.previewContainer.parent.removeChild(this.previewContainer);
        }

        // Remove tile outline
        if (this.tileOutline && this.tileOutline.parent) {
            this.tileOutline.parent.removeChild(this.tileOutline);
            this.tileOutline = null;
        }

        // Remove debug cursor
        if (this.debugCursor && this.debugCursor.parent) {
            this.debugCursor.parent.removeChild(this.debugCursor);
            this.debugCursor = null;
        }

        // Remove mouse cursor
        if (this.mouseCursor && this.mouseCursor.parent) {
            this.mouseCursor.parent.removeChild(this.mouseCursor);
            this.mouseCursor = null;
        }



        // Remove debug text
        if (this.debugText && this.debugText.parent) {
            this.debugText.parent.removeChild(this.debugText);
            this.debugText = null;
        }

        // Remove any remaining placement indicators
        if (this.placementIndicators) {
            this.placementIndicators.forEach(indicator => {
                if (indicator.graphic && indicator.graphic.parent) {
                    indicator.graphic.parent.removeChild(indicator.graphic);
                }
            });
            this.placementIndicators = [];
        }
    }
}
