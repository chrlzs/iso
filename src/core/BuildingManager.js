import { Building } from '../entities/Building.js';
import { ConstructionOverlay } from '../entities/ConstructionOverlay.js';
import { ConstructionUIOverlay } from '../ui/ConstructionUIOverlay.js';
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Manages building placement and management
 */
export class BuildingManager {
    /**
     * Creates a new building manager
     * @param {Game} game - Game instance
     */
    constructor(game) {
        this.game = game;
        this.world = game.world;
        this.buildings = new Set();
        this.buildingTypes = this.initializeBuildingTypes();
        this.selectedBuildingType = null;
        this.placementMode = false;
        this.placementPreview = null;
        this.placementValid = false;

        // Add a throttle for notifications to prevent spam
        this.lastNotificationTime = 0;
        this.notificationThrottle = 1000; // 1 second between notifications

        // Create a UI layer for building placement preview
        this.uiLayer = new PIXI.Container();
        this.uiLayer.name = 'uiLayer'; // Set a name to help identify previews
        this.uiLayer.sortableChildren = true;
        this.uiLayer.zIndex = 1000; // Ensure it's above other layers
        this.world.addChild(this.uiLayer);

        // Initialize UI elements
        this.initializeUI();
    }

    /**
     * Initializes building types
     * @returns {Object} Building types configuration
     * @private
     */
    initializeBuildingTypes() {
        return {
            house: {
                name: 'House',
                description: 'A small house for residents',
                width: 1,
                height: 1,
                constructionCost: { wood: 20, stone: 10 },
                maintenanceCost: { gold: 1 },
                buildTime: 10, // seconds
                maxResidents: 4,
                upgradeOptions: [
                    {
                        cost: { wood: 30, stone: 20 },
                        effects: { maxResidents: 6 }
                    },
                    {
                        cost: { wood: 50, stone: 40, gold: 20 },
                        effects: { maxResidents: 10 }
                    }
                ],
                keyBinding: 'h'
            },
            shop: {
                name: 'Shop',
                description: 'A shop that generates income',
                width: 1,
                height: 1,
                constructionCost: { wood: 30, stone: 20, gold: 50 },
                maintenanceCost: { gold: 2 },
                buildTime: 15,
                productionRate: { gold: 0.1 }, // gold per second
                upgradeOptions: [
                    {
                        cost: { wood: 40, stone: 30, gold: 100 },
                        effects: { productionRate: { gold: 0.2 } }
                    }
                ],
                keyBinding: 's'
            },
            factory: {
                name: 'Factory',
                description: 'Produces resources',
                width: 2,
                height: 1,
                constructionCost: { wood: 50, stone: 100, iron: 20 },
                maintenanceCost: { gold: 5, wood: 1 },
                buildTime: 30,
                productionRate: { iron: 0.05 },
                upgradeOptions: [
                    {
                        cost: { wood: 100, stone: 200, gold: 100 },
                        effects: { productionRate: { iron: 0.1 } }
                    }
                ],
                keyBinding: 'c'
            },
            tower: {
                name: 'Tower',
                description: 'Defensive structure',
                width: 1,
                height: 1,
                constructionCost: { stone: 150, iron: 30 },
                maintenanceCost: { gold: 3 },
                buildTime: 20,
                upgradeOptions: [
                    {
                        cost: { stone: 300, iron: 60, gold: 100 },
                        effects: { range: 8, damage: 15 }
                    }
                ],
                keyBinding: 'w'
            },
            farm: {
                name: 'Farm',
                description: 'Produces food',
                width: 2,
                height: 2,
                constructionCost: { wood: 40, stone: 20 },
                maintenanceCost: { gold: 2, water: 1 },
                buildTime: 15,
                productionRate: { food: 0.2 },
                upgradeOptions: [
                    {
                        cost: { wood: 60, stone: 30, gold: 50 },
                        effects: { productionRate: { food: 0.4 } }
                    }
                ],
                keyBinding: 'a'
            }
        };
    }

    /**
     * Initializes UI elements
     * @private
     */
    initializeUI() {
        // Create building menu container
        this.buildingMenu = document.createElement('div');
        this.buildingMenu.className = 'building-menu';
        this.buildingMenu.style.position = 'absolute';
        this.buildingMenu.style.bottom = '10px';
        this.buildingMenu.style.left = '50%';
        this.buildingMenu.style.transform = 'translateX(-50%)';
        this.buildingMenu.style.display = 'flex';
        this.buildingMenu.style.gap = '10px';
        this.buildingMenu.style.padding = '10px';
        this.buildingMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.buildingMenu.style.borderRadius = '5px';
        this.buildingMenu.style.zIndex = '1000';

        // Store buttons by type for later updates
        this.buildingButtons = {};

        // Create buttons for each building type
        for (const [type, config] of Object.entries(this.buildingTypes)) {
            const button = document.createElement('button');
            button.className = 'building-button';
            button.textContent = config.name;
            button.title = `${config.name} (${config.keyBinding.toUpperCase()})\n${config.description}\nSize: ${config.width}x${config.height}`;
            button.style.padding = '8px 12px';
            button.style.backgroundColor = '#2c3e50';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';

            // Store button reference
            this.buildingButtons[type] = button;

            // Add click handler
            button.addEventListener('click', () => {
                this.selectBuildingType(type);
            });

            this.buildingMenu.appendChild(button);
        }

        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'building-button cancel';
        cancelButton.textContent = 'Cancel';
        cancelButton.title = 'Cancel building placement (ESC)';
        cancelButton.style.padding = '8px 12px';
        cancelButton.style.backgroundColor = '#c0392b';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.cursor = 'pointer';

        // Add click handler
        cancelButton.addEventListener('click', () => {
            this.cancelPlacement();
        });

        this.buildingMenu.appendChild(cancelButton);

        // Add to game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.buildingMenu);
        }

        // Initially hide the menu
        this.buildingMenu.style.display = 'none';
    }

    /**
     * Toggles the building menu
     */
    toggleBuildingMenu() {
        if (this.buildingMenu.style.display === 'none') {
            this.buildingMenu.style.display = 'flex';
            // Update tooltips when showing the menu
            this.updateButtonTooltips();
        } else {
            this.buildingMenu.style.display = 'none';
            this.cancelPlacement();
        }
    }

    /**
     * Updates button tooltips to reflect current key bindings
     */
    updateButtonTooltips() {
        for (const [type, config] of Object.entries(this.buildingTypes)) {
            const button = this.buildingButtons[type];
            if (button) {
                button.title = `${config.name} (${config.keyBinding.toUpperCase()})
${config.description}
Size: ${config.width}x${config.height}`;
            }
        }
    }

    /**
     * Selects a building type for placement
     * @param {string} type - Building type
     */
    selectBuildingType(type) {
        if (!this.buildingTypes[type]) {
            console.warn(`Unknown building type: ${type}`);
            return;
        }

        this.selectedBuildingType = type;
        this.placementMode = true;

        // Create placement preview
        this.createPlacementPreview();
    }

    /**
     * Creates a placement preview for the selected building type
     * @private
     */
    createPlacementPreview() {
        // Remove existing preview if any
        this.removePlacementPreview();

        if (!this.selectedBuildingType) return;

        const buildingConfig = this.buildingTypes[this.selectedBuildingType];

        // Create a semi-transparent building preview
        this.placementPreview = new Building({
            buildingType: this.selectedBuildingType,
            width: buildingConfig.width,
            height: buildingConfig.height
        });

        // Make it semi-transparent
        this.placementPreview.alpha = 0.7;

        // Set a smaller scale for the preview (override the default large scale)
        this.placementPreview.scale.set(1, 1); // Normal scale for preview

        // Prevent the preview from using the large scale
        if (typeof this.placementPreview.setVisibleScale === 'function') {
            this.placementPreview.setVisibleScale(1); // Force scale to 1
        }

        // Add a highlight effect to make it more visible
        const highlight = new PIXI.Graphics();
        highlight.lineStyle(3, 0xFFFFFF, 0.8);
        highlight.drawRect(-60, -120, 120, 120);
        this.placementPreview.addChild(highlight);

        // Add text to indicate it's a preview
        const previewText = new PIXI.Text('PREVIEW', {
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4,
            align: 'center'
        });
        previewText.anchor.set(0.5, 0.5);
        previewText.position.set(0, -140);
        this.placementPreview.addChild(previewText);

        // Add to our UI layer
        this.uiLayer.addChild(this.placementPreview);
    }

    /**
     * Removes the placement preview
     * @private
     */
    removePlacementPreview() {
        if (this.placementPreview) {
            this.uiLayer.removeChild(this.placementPreview);
            this.placementPreview = null;
        }
    }

    /**
     * Updates the placement preview position
     * @param {IsometricTile} tile - Tile under cursor
     */
    updatePlacementPreview(tile) {
        try {
            if (!this.placementMode || !this.placementPreview || !tile) {
                // Don't log this too often as it can spam the console
                return;
            }

            // Only log when tile changes to reduce console spam
            if (!this._lastPreviewTile ||
                this._lastPreviewTile.gridX !== tile.gridX ||
                this._lastPreviewTile.gridY !== tile.gridY) {
                console.log(`Updating placement preview for tile (${tile.gridX}, ${tile.gridY})`);
                this._lastPreviewTile = tile;
            }

            // Update preview position
            const worldPos = this.world.gridToWorld(tile.gridX, tile.gridY);
            if (worldPos && typeof worldPos.x === 'number' && typeof worldPos.y === 'number') {
                // Position with a smaller Y offset for the preview
                this.placementPreview.position.set(worldPos.x, worldPos.y - 60); // Smaller Y offset for preview

                // Ensure the preview maintains its smaller scale
                this.placementPreview.scale.set(1, 1);
                if (typeof this.placementPreview.setVisibleScale === 'function') {
                    this.placementPreview.setVisibleScale(1);
                }

                // Check if placement is valid
                this.placementValid = this.canPlaceBuilding(
                    this.selectedBuildingType,
                    tile.gridX,
                    tile.gridY
                );

                // Only log when validity changes
                if (this._lastValidityState !== this.placementValid) {
                    console.log(`Placement validity changed to: ${this.placementValid}`);
                    this._lastValidityState = this.placementValid;
                }

                // Update preview appearance based on validity
                if (this.placementValid) {
                    // Valid placement - green highlight
                    this.placementPreview.tint = 0xFFFFFF; // Reset tint

                    // Find the highlight and update it
                    for (let i = 0; i < this.placementPreview.children.length; i++) {
                        const child = this.placementPreview.children[i];
                        if (child instanceof PIXI.Graphics) {
                            child.clear();
                            child.lineStyle(3, 0x00FF00, 0.8);
                            child.drawRect(-60, -120, 120, 120);

                            // Add a "valid" indicator
                            child.beginFill(0x00FF00, 0.3);
                            child.drawRect(-60, -120, 120, 120);
                            child.endFill();
                        }
                    }
                } else {
                    // Invalid placement - red highlight
                    this.placementPreview.tint = 0xFFFFFF; // Reset tint

                    // Find the highlight and update it
                    for (let i = 0; i < this.placementPreview.children.length; i++) {
                        const child = this.placementPreview.children[i];
                        if (child instanceof PIXI.Graphics) {
                            child.clear();
                            child.lineStyle(3, 0xFF0000, 0.8);
                            child.drawRect(-60, -120, 120, 120);

                            // Add an "invalid" indicator
                            child.beginFill(0xFF0000, 0.3);
                            child.drawRect(-60, -120, 120, 120);
                            child.endFill();

                            // Add an X
                            child.lineStyle(4, 0xFF0000, 1);
                            child.moveTo(-40, -100);
                            child.lineTo(40, -20);
                            child.moveTo(40, -100);
                            child.lineTo(-40, -20);

                            // Add text to explain why placement is invalid
                            const currentTile = this.world.getTile(tile.gridX, tile.gridY);
                            // Show a tooltip explaining why placement is invalid
                            if (currentTile && currentTile.type === 'water') {
                                this.showThrottledNotification('Cannot build on water!', {
                                    type: 'info',
                                    duration: 1500,
                                    position: 'top'
                                });
                            } else if (currentTile && !currentTile.walkable) {
                                this.showThrottledNotification('Cannot build on non-walkable terrain!', {
                                    type: 'info',
                                    duration: 1500,
                                    position: 'top'
                                });
                            } else if (currentTile && currentTile.structure) {
                                this.showThrottledNotification('Cannot build on occupied tile!', {
                                    type: 'info',
                                    duration: 1500,
                                    position: 'top'
                                });
                            } else {
                                this.showThrottledNotification('Cannot build here!', {
                                    type: 'info',
                                    duration: 1500,
                                    position: 'top'
                                });
                            }
                        }
                    }
                }
            } else {
                console.warn(`Invalid world position for tile (${tile.gridX}, ${tile.gridY}): ${JSON.stringify(worldPos)}`);
            }
        } catch (error) {
            console.error('Error updating placement preview:', error);
        }
    }

    /**
     * Checks if a building can be placed at the specified position
     * @param {string} buildingType - Building type
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the building can be placed
     */
    canPlaceBuilding(buildingType, gridX, gridY) {
        console.log(`Checking if ${buildingType} can be placed at (${gridX}, ${gridY})`);

        if (!this.buildingTypes[buildingType]) {
            console.log(`Cannot place building: unknown building type ${buildingType}`);
            return false;
        }

        const config = this.buildingTypes[buildingType];
        const width = config.width;
        const height = config.height;

        console.log(`Building size: ${width}x${height}`);

        // Check if all required tiles are valid
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileX = gridX + x;
                const tileY = gridY + y;

                const tile = this.world.getTile(tileX, tileY);

                if (!tile) {
                    console.log(`Cannot place building: no tile at (${tileX}, ${tileY})`);
                    return false;
                }

                if (!tile.walkable) {
                    console.log(`Cannot place building: tile at (${tileX}, ${tileY}) is not walkable`);
                    return false;
                }

                if (tile.structure) {
                    console.log(`Cannot place building: tile at (${tileX}, ${tileY}) already has a structure`);
                    return false;
                }

                console.log(`Tile at (${tileX}, ${tileY}) is valid for placement`);
            }
        }

        console.log(`${buildingType} can be placed at (${gridX}, ${gridY})`);
        return true;
    }

    /**
     * Places a building at the specified position
     * @param {string} buildingType - Building type
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {Building} The placed building, or null if placement failed
     */
    placeBuilding(buildingType, gridX, gridY) {
        console.log(`placeBuilding called for ${buildingType} at (${gridX}, ${gridY})`);

        if (!this.canPlaceBuilding(buildingType, gridX, gridY)) {
            console.warn(`Cannot place ${buildingType} at (${gridX}, ${gridY}): canPlaceBuilding returned false`);
            return null;
        }

        console.log(`Placement validation passed for ${buildingType} at (${gridX}, ${gridY})`);

        // Double-check the tile
        const tile = this.world.getTile(gridX, gridY);
        if (!tile) {
            console.warn(`Cannot place ${buildingType} at (${gridX}, ${gridY}): tile not found`);
            return null;
        }

        console.log(`Tile found at (${gridX}, ${gridY}): type=${tile.type}, walkable=${tile.walkable}`);

        if (!tile.walkable) {
            console.warn(`Cannot place ${buildingType} at (${gridX}, ${gridY}): tile is not walkable`);
            return null;
        }

        if (tile.structure) {
            console.warn(`Cannot place ${buildingType} at (${gridX}, ${gridY}): tile already has a structure`);
            return null;
        }

        const config = this.buildingTypes[buildingType];

        // Create the building
        const building = new Building({
            buildingType: buildingType,
            width: config.width,
            height: config.height,
            constructionCost: config.constructionCost,
            maintenanceCost: config.maintenanceCost,
            buildTime: config.buildTime,
            maxResidents: config.maxResidents,
            productionRate: config.productionRate,
            upgradeOptions: config.upgradeOptions,
            description: config.description,
            isBuilt: false,
            buildProgress: 0,
            isUnderConstruction: true
        });

        // Place in world
        console.log(`Calling placeInWorld for ${buildingType} at (${gridX}, ${gridY})`);
        const placementResult = building.placeInWorld(this.world, gridX, gridY);
        console.log(`placeInWorld result: ${placementResult}`);

        if (placementResult) {
            // Add to buildings set
            this.buildings.add(building);

            // Show a notification
            this.game.showNotification(`${buildingType} placed at (${gridX}, ${gridY})`);

            // Create a separate construction overlay
            const overlay = new ConstructionOverlay({
                gridX: gridX,
                gridY: gridY,
                buildingType: buildingType,
                buildProgress: 0,
                buildTime: 30, // 30 seconds to complete
                world: this.world,
                building: building
            });

            // Add the overlay directly to the world
            this.world.addChild(overlay);

            // Show a construction progress notification
            this.game.notifications.showConstructionProgress({
                gridX: gridX,
                gridY: gridY,
                buildingType: buildingType,
                buildProgress: 0,
                buildTime: 30, // 30 seconds to complete
                building: building
            });

            // Schedule regular updates for the overlay
            const updateInterval = setInterval(() => {
                if (overlay && overlay.parent) {
                    overlay.update(0.1);

                    // Stop interval when construction is complete
                    if (overlay.buildProgress >= 1) {
                        clearInterval(updateInterval);
                    }
                } else {
                    clearInterval(updateInterval);
                }
            }, 100); // Update every 100ms

            return building;
        }

        return null;
    }

    /**
     * Shows a notification with throttling to prevent spam
     * @param {string} message - The message to show
     * @param {Object} options - Notification options
     * @private
     */
    showThrottledNotification(message, options = {}) {
        const now = Date.now();
        if (now - this.lastNotificationTime > this.notificationThrottle) {
            this.game.showNotification(message, options);
            this.lastNotificationTime = now;
        }
    }

    /**
     * Checks and fixes tile walkability before building placement
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @private
     */
    checkAndFixTileWalkability(gridX, gridY) {
        console.log(`Checking and fixing tile walkability at (${gridX}, ${gridY})`);

        const tile = this.world.getTile(gridX, gridY);
        if (!tile) {
            console.log(`  No tile found at (${gridX}, ${gridY})`);
            return;
        }

        console.log(`  Tile type: ${tile.type}, walkable: ${tile.walkable}`);

        // Check if tile should be walkable based on type
        const shouldBeWalkable = !['water', 'lava', 'void'].includes(tile.type);

        // If tile has no structure but is not walkable when it should be, fix it
        if (!tile.structure && !tile.walkable && shouldBeWalkable) {
            console.log(`  Fixing tile at (${gridX}, ${gridY}): type=${tile.type}, walkable=${tile.walkable} -> true`);
            if (tile._setWalkable) {
                tile._setWalkable(true, 'Fixed before building placement');
            } else {
                tile.walkable = true;
            }
        }

        // If tile is water but is walkable, fix it
        if (tile.type === 'water' && tile.walkable) {
            console.log(`  Fixing tile at (${gridX}, ${gridY}): water tile but walkable=${tile.walkable} -> false`);
            if (tile._setWalkable) {
                tile._setWalkable(false, 'Fixed before building placement - water tile');
            } else {
                tile.walkable = false;
            }
        }
    }

    /**
     * Attempts to place the selected building at the specified tile
     * @param {IsometricTile} tile - Target tile
     * @returns {boolean} Whether the building was placed successfully
     */
    attemptPlacement(tile) {
        try {
            console.log(`Attempting to place ${this.selectedBuildingType} at (${tile?.gridX}, ${tile?.gridY})`);
            console.log(`  placementMode: ${this.placementMode}`);
            console.log(`  selectedBuildingType: ${this.selectedBuildingType}`);
            console.log(`  tile exists: ${!!tile}`);

            if (!this.placementMode || !this.selectedBuildingType || !tile) {
                console.log('  Cannot place building: missing required parameters');
                return false;
            }

            // Check and fix tile walkability before placement
            const config = this.buildingTypes[this.selectedBuildingType];
            const width = config.width;
            const height = config.height;

            // Check and fix all tiles that will be used by the building
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    this.checkAndFixTileWalkability(tile.gridX + x, tile.gridY + y);
                }
            }

            // Force a fresh check of placement validity
            const isValid = this.canPlaceBuilding(
                this.selectedBuildingType,
                tile.gridX,
                tile.gridY
            );

            if (!isValid) {
                // Show a failure notification
                this.showThrottledNotification(`CANNOT PLACE ${this.selectedBuildingType.toUpperCase()} HERE`, {
                    type: 'error',
                    duration: 3000
                });
                return false;
            }

            // Place the building
            const building = this.placeBuilding(
                this.selectedBuildingType,
                tile.gridX,
                tile.gridY
            );

            if (building) {
                // Show a success notification
                this.showThrottledNotification(`${this.selectedBuildingType.toUpperCase()} PLACED SUCCESSFULLY!`, {
                    type: 'success',
                    duration: 3000
                });

                // Exit placement mode
                this.cancelPlacement();
                return true;
            }

            // Show a failure notification
            this.showThrottledNotification(`CANNOT PLACE ${this.selectedBuildingType.toUpperCase()} HERE`, {
                type: 'error',
                duration: 3000
            });

            return false;
        } catch (error) {
            console.error('Error attempting to place building:', error);
            return false;
        }
    }

    /**
     * Cancels building placement mode
     */
    cancelPlacement() {
        this.placementMode = false;
        this.selectedBuildingType = null;
        this.removePlacementPreview();
    }

    /**
     * Handles keyboard input for building placement
     * @param {string} key - Pressed key
     * @returns {boolean} Whether the key was handled
     */
    handleKeyInput(key) {
        try {
            // Check if key matches any building type
            for (const [type, config] of Object.entries(this.buildingTypes)) {
                if (config.keyBinding === key) {
                    this.selectBuildingType(type);
                    return true;
                }
            }

            // Check for cancel key (Escape)
            if (key === 'escape') {
                this.cancelPlacement();
                return true;
            }

            // Check for building menu toggle (B)
            if (key === 'b') {
                this.toggleBuildingMenu();
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error handling key input in BuildingManager:', error);
            return false;
        }
    }

    /**
     * Updates the building manager
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update all buildings
        for (const building of this.buildings) {
            building.update(deltaTime);
        }

        // Update placement preview if in placement mode
        if (this.placementMode && this.game.input.hoveredTile) {
            this.updatePlacementPreview(this.game.input.hoveredTile);
        }
    }

    // Debug methods removed to clean up the code

    /**
     * Cleans up resources
     */
    dispose() {
        // Remove UI elements
        if (this.buildingMenu && this.buildingMenu.parentNode) {
            this.buildingMenu.parentNode.removeChild(this.buildingMenu);
        }

        // Remove placement preview
        this.removePlacementPreview();

        // Remove UI layer
        if (this.uiLayer && this.uiLayer.parent) {
            this.uiLayer.parent.removeChild(this.uiLayer);
        }

        // Clear buildings set
        this.buildings.clear();
    }
}
