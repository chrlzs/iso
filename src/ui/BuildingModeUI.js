/**
 * BuildingModeUI.js
 * UI for the building mode
 */
import { PIXI } from '../utils/PixiWrapper.js';
import { ASSET_CATEGORIES, getAssetsByCategory } from '../assets/AssetDefinitions.js';
import { getSavedWorlds, getWorldChunkCount, getWorldStorageSize, saveMapName, mapNameExists, getMapNames } from '../utils/WorldUtils.js';

/**
 * BuildingModeUI class
 * Handles the UI for building mode
 */
export class BuildingModeUI {
    /**
     * Creates a new building mode UI
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.game = options.game;
        this.ui = options.ui;
        this.buildingModeManager = options.buildingModeManager;
        this.assetManager = options.assetManager;

        // UI container
        this.container = new PIXI.Container();
        this.container.visible = false;
        this.container.zIndex = 1000;

        // UI panels
        this.categoryPanel = null;
        this.assetPanel = null;
        this.controlPanel = null;
        this.helpPanel = null;

        // Selected category
        this.selectedCategory = null;

        // Create UI elements
        this.createUI();

        // Add window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Handles window resize events
     */
    handleResize() {
        // Update help panel position
        if (this.helpPanel) {
            this.helpPanel.position.set(window.innerWidth - 280, 10);
        }

        // Update help show button position
        if (this.helpShowButton) {
            this.helpShowButton.position.set(window.innerWidth - 40, 10);
        }
    }

    /**
     * Creates the UI elements
     */
    createUI() {
        // Create category panel
        this.createCategoryPanel();

        // Create asset panel
        this.createAssetPanel();

        // Create control panel
        this.createControlPanel();

        // Create help panel
        this.createHelpPanel();

        // Add to UI container
        if (this.ui && this.ui.container) {
            this.ui.container.addChild(this.container);
        }
    }

    /**
     * Creates the category panel
     */
    createCategoryPanel() {
        // Create panel container
        this.categoryPanel = new PIXI.Container();
        this.categoryPanel.position.set(10, 10);
        this.container.addChild(this.categoryPanel);

        // Create panel background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 260, 50, 5);
        background.endFill();
        this.categoryPanel.addChild(background);

        // Create category buttons
        const categories = Object.values(ASSET_CATEGORIES);
        const buttonWidth = 240 / categories.length; // Adjusted for wider panel

        categories.forEach((category, index) => {
            // Create button container
            const button = new PIXI.Container();
            button.position.set(10 + index * buttonWidth, 10);
            button.interactive = true;
            button.buttonMode = true;
            this.categoryPanel.addChild(button);

            // Create button background
            const buttonBg = new PIXI.Graphics();
            buttonBg.beginFill(0x333333, 0.8);
            buttonBg.lineStyle(1, 0x00FFFF, 0.8);
            buttonBg.drawRoundedRect(0, 0, buttonWidth - 5, 30, 3);
            buttonBg.endFill();
            button.addChild(buttonBg);

            // Create button text
            const text = new PIXI.Text(category.charAt(0).toUpperCase(), {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xFFFFFF,
                align: 'center'
            });
            text.anchor.set(0.5, 0.5);
            text.position.set((buttonWidth - 5) / 2, 15);
            button.addChild(text);

            // Add tooltip
            button.tooltip = category.charAt(0).toUpperCase() + category.slice(1);

            // Add click handler
            button.on('pointerdown', () => {
                this.selectCategory(category);
            });

            // Add hover effects
            button.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.beginFill(0x555555, 0.8);
                buttonBg.lineStyle(1, 0x00FFFF, 1);
                buttonBg.drawRoundedRect(0, 0, buttonWidth - 5, 30, 3);
                buttonBg.endFill();

                // Show tooltip
                if (this.ui && this.ui.showTooltip) {
                    this.ui.showTooltip(button.tooltip, button.x + button.width / 2, button.y + button.height + 5);
                }
            });

            button.on('pointerout', () => {
                buttonBg.clear();
                buttonBg.beginFill(0x333333, 0.8);
                buttonBg.lineStyle(1, 0x00FFFF, 0.8);
                buttonBg.drawRoundedRect(0, 0, buttonWidth - 5, 30, 3);
                buttonBg.endFill();

                // Hide tooltip
                if (this.ui && this.ui.hideTooltip) {
                    this.ui.hideTooltip();
                }
            });
        });
    }

    /**
     * Creates the asset panel
     */
    createAssetPanel() {
        // Create panel container
        this.assetPanel = new PIXI.Container();
        this.assetPanel.position.set(10, 70);
        this.container.addChild(this.assetPanel);

        // Create panel background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 260, 400, 5);
        background.endFill();
        this.assetPanel.addChild(background);

        // Create panel title
        const title = new PIXI.Text('Select Asset', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFFF,
            align: 'center'
        });
        title.anchor.set(0.5, 0);
        title.position.set(130, 10); // Centered in the wider panel
        this.assetPanel.addChild(title);

        // Create assets container
        this.assetsContainer = new PIXI.Container();
        this.assetsContainer.position.set(10, 40);
        this.assetPanel.addChild(this.assetsContainer);
    }

    /**
     * Creates the control panel
     */
    createControlPanel() {
        // Create panel container
        this.controlPanel = new PIXI.Container();
        this.controlPanel.position.set(10, 480);
        this.container.addChild(this.controlPanel);

        // Create panel background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 260, 50, 5);
        background.endFill();
        this.controlPanel.addChild(background);

        // Create exit button
        const exitButton = this.createButton('Exit', 10, 10, 55, 30, () => {
            this.buildingModeManager.deactivate();
        });
        this.controlPanel.addChild(exitButton);

        // Create new map button
        const newMapButton = this.createButton('New', 75, 10, 55, 30, () => {
            this.createNewMap();
        });
        this.controlPanel.addChild(newMapButton);

        // Create save button
        const saveButton = this.createButton('Save', 140, 10, 55, 30, () => {
            this.saveMap();
        });
        this.controlPanel.addChild(saveButton);

        // Create load button
        const loadButton = this.createButton('Load', 205, 10, 55, 30, () => {
            this.showLoadMapPanel();
        });
        this.controlPanel.addChild(loadButton);
    }

    /**
     * Creates a button
     * @param {string} text - Button text
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Button width
     * @param {number} height - Button height
     * @param {Function} onClick - Click handler
     * @returns {PIXI.Container} Button container
     */
    createButton(text, x, y, width, height, onClick) {
        // Create button container
        const button = new PIXI.Container();
        button.position.set(x, y);
        button.interactive = true;
        button.buttonMode = true;

        // Create button background
        const buttonBg = new PIXI.Graphics();
        buttonBg.beginFill(0x333333, 0.8);
        buttonBg.lineStyle(1, 0x00FFFF, 0.8);
        buttonBg.drawRoundedRect(0, 0, width, height, 3);
        buttonBg.endFill();
        button.addChild(buttonBg);

        // Create button text
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'center'
        });
        buttonText.anchor.set(0.5, 0.5);
        buttonText.position.set(width / 2, height / 2);
        button.addChild(buttonText);

        // Add click handler
        button.on('pointerdown', onClick);

        // Add hover effects
        button.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.beginFill(0x555555, 0.8);
            buttonBg.lineStyle(1, 0x00FFFF, 1);
            buttonBg.drawRoundedRect(0, 0, width, height, 3);
            buttonBg.endFill();
        });

        button.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.beginFill(0x333333, 0.8);
            buttonBg.lineStyle(1, 0x00FFFF, 0.8);
            buttonBg.drawRoundedRect(0, 0, width, height, 3);
            buttonBg.endFill();
        });

        return button;
    }

    /**
     * Selects an asset category
     * @param {string} category - Asset category
     */
    selectCategory(category) {
        this.selectedCategory = category;

        // Update building mode manager
        if (this.buildingModeManager) {
            this.buildingModeManager.selectCategory(category);
        }

        // Update asset panel
        this.updateAssetPanel();
    }

    /**
     * Updates the asset panel with assets from the selected category
     */
    updateAssetPanel() {
        // Clear assets container
        this.assetsContainer.removeChildren();

        if (!this.selectedCategory) return;

        // Get assets for the selected category
        const assets = getAssetsByCategory(this.selectedCategory);

        // Create asset buttons
        const buttonWidth = 115; // Wider buttons for the wider panel
        const buttonHeight = 85;
        const buttonsPerRow = 2;

        assets.forEach((asset, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;

            // Create button container
            const button = new PIXI.Container();
            button.position.set(col * (buttonWidth + 10), row * (buttonHeight + 10));
            button.interactive = true;
            button.buttonMode = true;
            this.assetsContainer.addChild(button);

            // Create button background
            const buttonBg = new PIXI.Graphics();
            buttonBg.beginFill(0x333333, 0.8);
            buttonBg.lineStyle(1, 0x00FFFF, 0.8);
            buttonBg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 3);
            buttonBg.endFill();
            button.addChild(buttonBg);

            // Create asset preview
            const texture = this.assetManager.getTexture(asset.id);
            const preview = new PIXI.Sprite(texture);
            preview.anchor.set(0.5, 0.5);
            preview.position.set(buttonWidth / 2, buttonHeight / 2 - 10);
            preview.scale.set(0.5, 0.5);
            button.addChild(preview);

            // Create asset name
            const name = new PIXI.Text(asset.name, {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0xFFFFFF,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: buttonWidth - 10
            });
            name.anchor.set(0.5, 0);
            name.position.set(buttonWidth / 2, buttonHeight - 20);
            button.addChild(name);

            // Add click handler
            button.on('pointerdown', () => {
                this.selectAsset(asset.id);
            });

            // Add hover effects
            button.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.beginFill(0x555555, 0.8);
                buttonBg.lineStyle(1, 0x00FFFF, 1);
                buttonBg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 3);
                buttonBg.endFill();

                // Show tooltip
                if (this.ui && this.ui.showTooltip) {
                    this.ui.showTooltip(asset.description, button.x + button.width / 2, button.y + button.height + 5);
                }
            });

            button.on('pointerout', () => {
                buttonBg.clear();
                buttonBg.beginFill(0x333333, 0.8);
                buttonBg.lineStyle(1, 0x00FFFF, 0.8);
                buttonBg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 3);
                buttonBg.endFill();

                // Hide tooltip
                if (this.ui && this.ui.hideTooltip) {
                    this.ui.hideTooltip();
                }
            });
        });
    }

    /**
     * Selects an asset
     * @param {string} assetId - Asset ID
     */
    selectAsset(assetId) {
        // Update building mode manager
        if (this.buildingModeManager) {
            this.buildingModeManager.selectAsset(assetId);
        }
    }

    /**
     * Shows the building mode UI
     */
    show() {
        this.container.visible = true;

        // Update help panel position based on current window size
        if (this.helpPanel) {
            this.helpPanel.position.set(window.innerWidth - 280, 10);
            // Ensure the help panel is initially hidden
            this.helpPanel.visible = false;
        }

        // Update help show button position
        if (this.helpShowButton) {
            this.helpShowButton.position.set(window.innerWidth - 40, 10);
            // Ensure the help button is initially visible
            this.helpShowButton.visible = true;
        }
    }

    /**
     * Hides the building mode UI
     */
    hide() {
        this.container.visible = false;
    }

    /**
     * Creates a new blank map
     */
    createNewMap() {
        // Confirm with the user
        if (confirm('Create a new blank map? This will create a new world for building.')) {
            // Create a new building world
            if (this.game && this.game.createNewBuildingWorld) {
                // Create a new building world with a blank map
                const success = this.game.createNewBuildingWorld({
                    defaultTerrain: 'grass'
                });

                if (success) {
                    // Show notification
                    if (this.ui) {
                        this.ui.showMessage(`Created new building world: ${this.game.options.worldId}`, 3000);
                    }
                } else {
                    // Show error
                    if (this.ui) {
                        this.ui.showMessage('Failed to create new building world', 3000);
                    }
                }
            } else {
                // Fallback to old method if createNewBuildingWorld is not available
                if (this.game && this.game.world) {
                    // First, clear any saved data for this world
                    if (this.game.clearSavedData) {
                        this.game.clearSavedData();
                    }

                    // Create a blank map
                    this.game.world.createBlankMap({
                        defaultTerrain: 'grass',
                        clearStorage: true
                    });

                    // Show notification
                    if (this.ui) {
                        this.ui.showMessage('Created new blank map', 2000);
                    }
                }
            }
        }
    }

    /**
     * Saves the current map
     */
    saveMap() {
        // Show the save dialog
        this.showSaveMapDialog();
    }

    /**
     * Shows the save map dialog
     */
    showSaveMapDialog() {
        // Create dialog if it doesn't exist
        if (!this.saveMapDialog) {
            this.createSaveMapDialog();
        }

        // Get the current world ID and any existing custom name
        const currentWorldId = this.game ? this.game.options.worldId : null;
        const mapNames = getMapNames();
        const existingName = mapNames[currentWorldId] || '';

        // Set the input field value to the existing name
        if (this.mapNameInput) {
            this.mapNameInput.text = existingName;

            // Reset error message
            this.saveErrorText.text = '';
            this.saveErrorText.visible = false;
        }

        // Show the dialog
        this.saveMapDialog.visible = true;
    }

    /**
     * Creates the save map dialog
     */
    createSaveMapDialog() {
        // Create dialog container
        this.saveMapDialog = new PIXI.Container();
        this.saveMapDialog.position.set(300, 150);
        this.saveMapDialog.visible = false;
        this.container.addChild(this.saveMapDialog);

        // Create dialog background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.9);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 300, 200, 5);
        background.endFill();
        this.saveMapDialog.addChild(background);

        // Create dialog title
        const title = new PIXI.Text('Save Map', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0x00FFFF,
            align: 'center'
        });
        title.anchor.set(0.5, 0);
        title.position.set(150, 10);
        this.saveMapDialog.addChild(title);

        // Create label
        const label = new PIXI.Text('Enter a name for your map:', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'left'
        });
        label.position.set(20, 40);
        this.saveMapDialog.addChild(label);

        // Create input field background
        const inputBg = new PIXI.Graphics();
        inputBg.beginFill(0x333333, 1);
        inputBg.lineStyle(1, 0x00FFFF, 0.8);
        inputBg.drawRoundedRect(0, 0, 260, 30, 3);
        inputBg.endFill();
        inputBg.position.set(20, 70);
        this.saveMapDialog.addChild(inputBg);

        // Create input field
        this.mapNameInput = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'left'
        });
        this.mapNameInput.position.set(25, 75);
        this.saveMapDialog.addChild(this.mapNameInput);

        // Create error text
        this.saveErrorText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFF5555,
            align: 'left'
        });
        this.saveErrorText.position.set(20, 105);
        this.saveErrorText.visible = false;
        this.saveMapDialog.addChild(this.saveErrorText);

        // Create save button
        const saveButton = this.createButton('Save', 160, 140, 60, 30, () => {
            this.performSave();
        });
        this.saveMapDialog.addChild(saveButton);

        // Create cancel button
        const cancelButton = this.createButton('Cancel', 80, 140, 60, 30, () => {
            this.saveMapDialog.visible = false;
        });
        this.saveMapDialog.addChild(cancelButton);

        // Make the input field interactive
        inputBg.interactive = true;
        inputBg.buttonMode = true;

        // Handle input field clicks
        inputBg.on('pointerdown', () => {
            // Prompt for text input
            const currentText = this.mapNameInput.text;
            const newText = prompt('Enter map name:', currentText);

            if (newText !== null) {
                this.mapNameInput.text = newText;

                // Reset error message
                this.saveErrorText.text = '';
                this.saveErrorText.visible = false;
            }
        });
    }

    /**
     * Performs the actual save operation
     */
    performSave() {
        // Get the map name from the input field
        const mapName = this.mapNameInput.text.trim();

        // Validate the map name
        if (!mapName) {
            this.saveErrorText.text = 'Please enter a name for your map.';
            this.saveErrorText.visible = true;
            return;
        }

        // Get the current world ID
        const currentWorldId = this.game ? this.game.options.worldId : null;

        // Check if the name already exists for another world
        if (mapNameExists(mapName, currentWorldId)) {
            // Ask for confirmation before overwriting
            if (!confirm(`A map with the name "${mapName}" already exists. Do you want to overwrite it?`)) {
                return;
            }
        }

        // Save the world state using the game's saveWorldState method
        if (this.game && this.game.saveWorldState) {
            console.log(`Manually saving world state from building mode UI with name: ${mapName}`);
            const worldState = this.game.saveWorldState();

            if (worldState) {
                // Save the custom name
                saveMapName(worldState.worldId, mapName);

                // Hide the dialog
                this.saveMapDialog.visible = false;

                // Show success message
                if (this.ui) {
                    this.ui.showMessage(`Map "${mapName}" saved successfully!`, 3000);
                }
                return true;
            } else {
                // Show error message
                this.saveErrorText.text = 'Failed to save map. Check console for details.';
                this.saveErrorText.visible = true;
                return false;
            }
        } else {
            // Show error message
            this.saveErrorText.text = 'Save functionality not available.';
            this.saveErrorText.visible = true;
            return false;
        }
    }

    /**
     * Shows the load map panel
     */
    showLoadMapPanel() {
        // Create panel if it doesn't exist
        if (!this.loadMapPanel) {
            this.createLoadMapPanel();
        }

        // Update the list of saved maps
        this.updateSavedMapsList();

        // Show the panel
        this.loadMapPanel.visible = true;
    }

    /**
     * Creates the load map panel
     */
    createLoadMapPanel() {
        // Create panel container
        this.loadMapPanel = new PIXI.Container();
        this.loadMapPanel.position.set(300, 100);
        this.loadMapPanel.visible = false;
        this.container.addChild(this.loadMapPanel);

        // Create panel background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.9);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 410, 300, 5);
        background.endFill();
        this.loadMapPanel.addChild(background);

        // Create panel title
        const title = new PIXI.Text('Load Saved Map', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0x00FFFF,
            align: 'center'
        });
        title.anchor.set(0.5, 0);
        title.position.set(205, 10); // Centered in the wider panel
        this.loadMapPanel.addChild(title);

        // Create maps container with scrolling
        this.mapsContainer = new PIXI.Container();
        this.mapsContainer.position.set(20, 40);

        // Create mask for scrolling
        const mask = new PIXI.Graphics();
        mask.beginFill(0xFFFFFF);
        mask.drawRect(0, 0, 370, 210);
        mask.endFill();
        mask.position.set(20, 40);
        this.loadMapPanel.addChild(mask);

        this.mapsContainer.mask = mask;
        this.loadMapPanel.addChild(this.mapsContainer);

        // Add scroll functionality
        this.scrollOffset = 0;
        this.scrollSpeed = 15;

        // Create scroll up button
        const scrollUpButton = this.createButton('▲', 390, 40, 20, 20, () => {
            this.scrollMapsUp();
        });
        this.loadMapPanel.addChild(scrollUpButton);

        // Create scroll down button
        const scrollDownButton = this.createButton('▼', 390, 230, 20, 20, () => {
            this.scrollMapsDown();
        });
        this.loadMapPanel.addChild(scrollDownButton);

        // Create close button
        const closeButton = this.createButton('Close', 330, 260, 60, 30, () => {
            this.loadMapPanel.visible = false;
        });
        this.loadMapPanel.addChild(closeButton);

        // Create no maps message
        this.noMapsMessage = new PIXI.Text('No saved maps found.', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.noMapsMessage.position.set(200, 120);
        this.noMapsMessage.anchor.set(0.5, 0);
        this.noMapsMessage.visible = false;
        this.loadMapPanel.addChild(this.noMapsMessage);
    }

    /**
     * Scrolls the maps list up
     */
    scrollMapsUp() {
        if (this.scrollOffset < 0) {
            this.scrollOffset += this.scrollSpeed;
            if (this.scrollOffset > 0) this.scrollOffset = 0;
            this.mapsContainer.y = 40 + this.scrollOffset;
        }
    }

    /**
     * Scrolls the maps list down
     */
    scrollMapsDown() {
        const containerHeight = this.mapsContainer.height;
        const visibleHeight = 210; // Height of the mask

        if (containerHeight > visibleHeight && this.scrollOffset > -(containerHeight - visibleHeight)) {
            this.scrollOffset -= this.scrollSpeed;
            this.mapsContainer.y = 40 + this.scrollOffset;
        }
    }

    /**
     * Updates the list of saved maps
     */
    updateSavedMapsList() {
        // Clear existing maps
        this.mapsContainer.removeChildren();

        // Reset scroll position
        this.scrollOffset = 0;
        this.mapsContainer.y = 40;

        // Get saved worlds
        const savedWorlds = getSavedWorlds();

        // Show message if no maps found
        if (savedWorlds.length === 0) {
            this.noMapsMessage.visible = true;
            return;
        }

        this.noMapsMessage.visible = false;

        // Create map entries
        savedWorlds.forEach((world, index) => {
            // Create map entry container
            const entry = new PIXI.Container();
            entry.position.set(0, index * 75); // Increased spacing between entries
            this.mapsContainer.addChild(entry);

            // Create entry background
            const bg = new PIXI.Graphics();
            bg.beginFill(0x222222, 0.8);
            bg.lineStyle(1, 0x00FFFF, 0.5);
            bg.drawRoundedRect(0, 0, 370, 70, 3);
            bg.endFill();
            entry.addChild(bg);

            // Create map name with truncation if needed
            let displayName = world.displayName;
            if (displayName.length > 20) {
                displayName = displayName.substring(0, 17) + '...';
            }

            const name = new PIXI.Text(displayName, {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0x00FFFF,
                align: 'left'
            });
            name.position.set(10, 10);
            entry.addChild(name);

            // Add a small indicator if this is a custom named map
            if (world.customName) {
                const customIndicator = new PIXI.Text('✓', {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fill: 0x00FF00,
                    align: 'left'
                });
                customIndicator.position.set(name.width + 15, 10);
                entry.addChild(customIndicator);
            }

            // Create map info
            const chunkCount = getWorldChunkCount(world.id);
            const storageSize = getWorldStorageSize(world.id);
            const date = new Date(world.timestamp).toLocaleString();

            // Format date to be shorter
            const shortDate = date.replace(/:\d{2}\s/, ' ');

            const info = new PIXI.Text(
                `Modified: ${shortDate}\n` +
                `Chunks: ${chunkCount} | Size: ${storageSize} KB`, {
                fontFamily: 'Arial',
                fontSize: 11,
                fill: 0xCCCCCC,
                align: 'left'
            });
            info.position.set(10, 35);
            entry.addChild(info);

            // Create button container
            const buttonContainer = new PIXI.Container();
            buttonContainer.position.set(200, 8);
            entry.addChild(buttonContainer);

            // Create load button
            const loadButton = this.createButton('Load', 0, 0, 50, 25, () => {
                this.loadMap(world.id);
            });
            buttonContainer.addChild(loadButton);

            // Create rename button with more padding
            const renameButton = this.createButton('Rename', 55, 0, 60, 25, () => {
                this.renameMap(world.id, world.customName || world.displayName);
            });
            buttonContainer.addChild(renameButton);

            // Create delete button
            const deleteButton = this.createButton('Del', 120, 0, 40, 25, () => {
                this.deleteMap(world.id, world.displayName);
            });
            deleteButton.children[0].tint = 0xFF5555; // Make the delete button red
            buttonContainer.addChild(deleteButton);

            // Make entry interactive
            entry.interactive = true;
            entry.on('pointerover', () => {
                bg.clear();
                bg.beginFill(0x333333, 0.8);
                bg.lineStyle(1, 0x00FFFF, 0.8);
                bg.drawRoundedRect(0, 0, 370, 70, 3);
                bg.endFill();
            });

            entry.on('pointerout', () => {
                bg.clear();
                bg.beginFill(0x222222, 0.8);
                bg.lineStyle(1, 0x00FFFF, 0.5);
                bg.drawRoundedRect(0, 0, 370, 70, 3);
                bg.endFill();
            });
        });
    }

    /**
     * Renames a map
     * @param {string} worldId - World ID to rename
     * @param {string} currentName - Current name of the map
     */
    renameMap(worldId, currentName) {
        // Prompt for new name
        const newName = prompt(`Enter new name for map "${currentName}":`, currentName);

        // Check if user cancelled
        if (newName === null) {
            return;
        }

        // Validate new name
        if (!newName.trim()) {
            if (this.ui) {
                this.ui.showMessage('Map name cannot be empty', 2000);
            }
            return;
        }

        // Check if name already exists for another world
        if (mapNameExists(newName, worldId)) {
            if (!confirm(`A map with the name "${newName}" already exists. Do you want to use this name anyway?`)) {
                return;
            }
        }

        // Save the new name
        const success = saveMapName(worldId, newName);

        if (success) {
            // Show success message
            if (this.ui) {
                this.ui.showMessage(`Map renamed to "${newName}"`, 2000);
            }

            // Update the list
            this.updateSavedMapsList();
        } else {
            // Show error message
            if (this.ui) {
                this.ui.showMessage('Failed to rename map', 2000);
            }
        }
    }

    /**
     * Deletes a map
     * @param {string} worldId - World ID to delete
     * @param {string} displayName - Display name of the map
     */
    deleteMap(worldId, displayName) {
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete the map "${displayName}"? This cannot be undone.`)) {
            return;
        }

        try {
            // Delete world state
            localStorage.removeItem(`isogame_world_${worldId}`);

            // Delete all chunks for this world
            if (this.game && this.game.chunkStorage) {
                this.game.chunkStorage.clearWorld(worldId);
            }

            // Delete custom name if any
            const mapNames = getMapNames();
            if (mapNames[worldId]) {
                delete mapNames[worldId];
                localStorage.setItem('isogame_map_names', JSON.stringify(mapNames));
            }

            // Show success message
            if (this.ui) {
                this.ui.showMessage(`Map "${displayName}" deleted`, 2000);
            }

            // Update the list
            this.updateSavedMapsList();
        } catch (error) {
            console.error('Error deleting map:', error);

            // Show error message
            if (this.ui) {
                this.ui.showMessage(`Error deleting map: ${error.message}`, 2000);
            }
        }
    }

    /**
     * Loads a map by world ID
     * @param {string} worldId - World ID to load
     */
    loadMap(worldId) {
        if (!this.game) {
            if (this.ui) {
                this.ui.showMessage('Cannot load map: Game reference not available', 3000);
            }
            return false;
        }

        // Confirm with the user
        if (confirm(`Load map ${worldId}? Any unsaved changes to the current map will be lost.`)) {
            try {
                console.log(`===== LOADING MAP: ${worldId} =====`);

                // Save current world state first
                this.game.saveWorldState();

                // IMPORTANT: Clear all containers before changing world ID
                if (this.game.world) {
                    console.log('Clearing all containers');
                    this.game.world.groundLayer.removeChildren();
                    this.game.world.entityContainer.removeChildren();
                    this.game.world.chunkContainer.removeChildren();

                    // Clear active chunks set
                    this.game.world.activeChunks.clear();

                    // Clear chunks map
                    this.game.world.chunks.clear();
                }

                // Update world ID
                const oldWorldId = this.game.options.worldId;
                console.log(`Changing world ID from ${oldWorldId} to ${worldId}`);
                this.game.options.worldId = worldId;
                this.game.world.worldId = worldId;

                // IMPORTANT: Clear the texture cache to ensure fresh textures
                if (this.game.world && this.game.world.textureCache) {
                    console.log('Clearing texture cache');
                    this.game.world.textureCache.clear();
                }

                // IMPORTANT: Check if the world state exists
                const worldStateKey = `isogame_world_${worldId}`;
                const serializedState = localStorage.getItem(worldStateKey);

                if (!serializedState) {
                    console.warn(`No saved state found for world ${worldId}`);
                    if (this.ui) {
                        this.ui.showMessage(`No saved map found with ID: ${worldId}`, 3000);
                    }

                    // Revert to the old world ID
                    console.log(`Reverting to world ID: ${oldWorldId}`);
                    this.game.options.worldId = oldWorldId;
                    this.game.world.worldId = oldWorldId;

                    // Reload the old world
                    this.game.loadWorldState();
                    return false;
                }

                // Load the world state
                console.log(`Loading world state for: ${worldId}`);
                const success = this.game.loadWorldState();

                if (success) {
                    // Hide the load panel
                    this.loadMapPanel.visible = false;

                    // IMPORTANT: Force a complete refresh of the world
                    if (this.game.world) {
                        console.log('Forcing complete world refresh');

                        // Get all saved chunks for this world
                        const savedChunks = this.game.chunkStorage.getWorldChunks(worldId);
                        console.log(`Found ${savedChunks.length} saved chunks for world ${worldId}`);

                        // Load each saved chunk
                        for (const chunkCoord of savedChunks) {
                            console.log(`Loading chunk (${chunkCoord.chunkX}, ${chunkCoord.chunkY})`);
                            this.game.world.loadChunk(chunkCoord.chunkX, chunkCoord.chunkY);
                        }

                        // If no chunks were loaded, load the center chunk
                        if (savedChunks.length === 0) {
                            console.log('No chunks found, loading center chunk');
                            this.game.world.loadChunk(0, 0);
                        }

                        // Re-add the player to the entity container
                        if (this.game.player) {
                            this.game.world.entityContainer.addChild(this.game.player);
                        }

                        // Force the world to update
                        this.game.world.dirty = true;
                    }

                    // IMPORTANT: Ensure the building mode manager is properly initialized
                    if (this.buildingModeManager) {
                        console.log('Reinitializing building mode manager');
                        this.buildingModeManager.initialize();
                    }

                    // Show success message
                    if (this.ui) {
                        this.ui.showMessage(`Map loaded successfully: ${worldId}`, 3000);
                    }

                    console.log(`===== MAP LOADED SUCCESSFULLY: ${worldId} =====`);
                    return true;
                } else {
                    // Show error message
                    console.error(`Failed to load map: ${worldId}`);
                    if (this.ui) {
                        this.ui.showMessage(`Failed to load map: ${worldId}`, 3000);
                    }
                    return false;
                }
            } catch (error) {
                console.error('Error loading map:', error);

                // Show error message
                if (this.ui) {
                    this.ui.showMessage(`Error loading map: ${error.message}`, 3000);
                }
                return false;
            }
        }

        return false;
    }

    /**
     * Creates the help panel
     */
    createHelpPanel() {
        // Create panel container - positioned on the right side of the screen
        this.helpPanel = new PIXI.Container();
        this.helpPanel.position.set(window.innerWidth - 280, 10); // Position on the right side
        this.helpPanel.visible = false; // Initially hidden
        this.container.addChild(this.helpPanel);

        // Create panel background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 260, 300, 5); // Taller panel to fit more content
        background.endFill();
        this.helpPanel.addChild(background);

        // Create panel title
        const title = new PIXI.Text('Building Mode Help', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFFF,
            align: 'center'
        });
        title.anchor.set(0.5, 0);
        title.position.set(130, 10);
        this.helpPanel.addChild(title);

        // Create text container with scrolling
        this.helpTextContainer = new PIXI.Container();
        this.helpTextContainer.position.set(10, 40);

        // Create mask for scrolling
        const mask = new PIXI.Graphics();
        mask.beginFill(0xFFFFFF);
        mask.drawRect(0, 0, 240, 220); // Area for scrollable content
        mask.endFill();
        mask.position.set(10, 40);
        this.helpPanel.addChild(mask);

        this.helpTextContainer.mask = mask;
        this.helpPanel.addChild(this.helpTextContainer);

        // Add scroll functionality
        this.helpScrollOffset = 0;
        this.helpScrollSpeed = 15;

        // Create help text
        const helpText = new PIXI.Text(
            'Controls:\n' +
            '- Select a category and asset from the left panel\n' +
            '- Click on the grid to place the selected asset\n' +
            '- Press G to toggle the grid overlay\n' +
            '- Press ESC to exit building mode\n\n' +
            'Grid:\n' +
            '- Blue grid lines show tile boundaries\n' +
            '- Coordinates are shown at (0,0) and every 5 tiles\n' +
            '- Pink circle marks the origin (0,0)\n\n' +
            'Saving & Loading Maps:\n' +
            '- Click Save to name and save your current map\n' +
            '- You can give each map a custom name\n' +
            '- Click Load to view, rename, or delete saved maps\n' +
            '- Use the scroll buttons to navigate through your maps\n' +
            '- Maps are also auto-saved periodically\n' +
            '- New Map creates a blank map with grass terrain\n' +
            '- Use terrain types to build your world\n\n' +
            'Building Tips:\n' +
            '- Start with terrain to create the base of your map\n' +
            '- Add structures on top of terrain tiles\n' +
            '- Use decorations to add detail to your world\n' +
            '- NPCs can be placed to create interactive elements',
            {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xFFFFFF,
                align: 'left',
                wordWrap: true,
                wordWrapWidth: 230
            }
        );
        helpText.position.set(0, 0);
        this.helpTextContainer.addChild(helpText);

        // Create scroll up button
        const scrollUpButton = this.createButton('▲', 240, 40, 20, 20, () => {
            this.scrollHelpUp();
        });
        this.helpPanel.addChild(scrollUpButton);

        // Create scroll down button
        const scrollDownButton = this.createButton('▼', 240, 240, 20, 20, () => {
            this.scrollHelpDown();
        });
        this.helpPanel.addChild(scrollDownButton);

        // Add scroll indicator text
        const scrollIndicator = new PIXI.Text('Scroll for more', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0x00FFFF,
            align: 'center'
        });
        scrollIndicator.anchor.set(0.5, 0);
        scrollIndicator.position.set(130, 265);
        this.helpPanel.addChild(scrollIndicator);

        // Create close button
        const closeButton = this.createButton('X', 235, 5, 20, 20, () => {
            this.toggleHelpPanel(false); // Hide panel, show button
        });
        this.helpPanel.addChild(closeButton);

        // Create show button (initially visible)
        this.helpShowButton = this.createButton('?', window.innerWidth - 40, 10, 30, 30, () => {
            this.toggleHelpPanel(true); // Show panel, hide button
        });
        this.container.addChild(this.helpShowButton);

        // Make sure the button is initially visible
        this.helpShowButton.visible = true;
    }

    /**
     * Scrolls the help text up
     */
    scrollHelpUp() {
        if (this.helpScrollOffset < 0) {
            this.helpScrollOffset += this.helpScrollSpeed;
            if (this.helpScrollOffset > 0) this.helpScrollOffset = 0;
            this.helpTextContainer.y = 40 + this.helpScrollOffset;
        }
    }

    /**
     * Scrolls the help text down
     */
    scrollHelpDown() {
        const containerHeight = this.helpTextContainer.height;
        const visibleHeight = 220; // Height of the mask

        if (containerHeight > visibleHeight && this.helpScrollOffset > -(containerHeight - visibleHeight)) {
            this.helpScrollOffset -= this.helpScrollSpeed;
        }
    }

    /**
     * Toggles the help panel visibility
     * @param {boolean} show - Whether to show the panel
     */
    toggleHelpPanel(show) {
        if (this.helpPanel) {
            this.helpPanel.visible = show;
        }

        if (this.helpShowButton) {
            this.helpShowButton.visible = !show;
        }
    }

    /**
     * Updates the UI
     */
    update() {
        // Update UI based on building mode manager state
        if (this.buildingModeManager) {
            if (this.buildingModeManager.selectedCategory !== this.selectedCategory) {
                this.selectedCategory = this.buildingModeManager.selectedCategory;
                this.updateAssetPanel();
            }
        }
    }
}
