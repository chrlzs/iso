import { PIXI } from '../utils/PixiWrapper.js';
import { BuildingModeUI } from './BuildingModeUI.js';
import { StyleToggle } from './components/StyleToggle.js';

/**
 * UI - Manages the game's user interface
 */
export class UI {
    /**
     * Creates a new UI manager
     * @param {Object} options - UI options
     */
    constructor(options = {}) {
        this.container = options.container || new PIXI.Container();
        this.game = options.game;
        this.panels = {};

        // Ensure container is visible and sortable
        this.container.visible = true;
        this.container.sortableChildren = true;

        // Create panels container
        this.panelsContainer = new PIXI.Container();
        this.panelsContainer.visible = true;
        this.container.addChild(this.panelsContainer);

        // Message system
        this.messages = [];
        this.messageContainer = new PIXI.Container();
        this.messageContainer.visible = true;
        this.container.addChild(this.messageContainer);

        // Create a container for buttons
        this.buttonContainer = new PIXI.Container();
        this.buttonContainer.visible = true;
        this.buttonContainer.position.set(0, this.game ? this.game.app.screen.height - 50 : 550);
        this.container.addChild(this.buttonContainer);

        console.log('UI initialized with container:', this.container);
    }

    /**
     * Creates UI elements
     * @private
     */
    createUI() {
        console.log('Creating UI elements');

        // Create message display area
        this.messageDisplay = new PIXI.Container();
        this.messageDisplay.position.set(10, 10);
        this.messageContainer.addChild(this.messageDisplay);

        // Create panels container
        this.panels = {};
        this.panelsContainer = new PIXI.Container();
        this.container.addChild(this.panelsContainer);

        console.log('Creating UI buttons');

        // Create quality settings button
        this.createQualityButton();
        console.log('Quality button created');

        // Create building mode button
        this.createBuildingModeButton();
        console.log('Building mode button created');

        // Create log level button
        this.createLogLevelButton();
        console.log('Log level button created');

        // Create style toggle button
        this.createStyleToggleButton();
        console.log('Style toggle button created');

        // Create debug button
        this.createDebugButton();
        console.log('Debug button created');

        console.log('All UI elements created');
    }

    /**
     * Creates an inventory panel
     * @param {Inventory} inventory - The player's inventory
     */
    createInventoryPanel(inventory) {
        // Create inventory panel container
        const panel = new PIXI.Container();
        panel.visible = false; // Hidden by default

        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.drawRoundedRect(0, 0, 300, 400, 10);
        background.endFill();
        panel.addChild(background);

        // Create title
        const title = new PIXI.Text('Inventory', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'center'
        });
        title.position.set(150, 15);
        title.anchor.set(0.5, 0);
        panel.addChild(title);

        // Create close button
        const closeButton = new PIXI.Text('X', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF
        });
        closeButton.position.set(280, 10);
        closeButton.interactive = true;
        closeButton.buttonMode = true;
        closeButton.on('pointerdown', () => this.togglePanel('inventory'));
        panel.addChild(closeButton);

        // Create items container
        const itemsContainer = new PIXI.Container();
        itemsContainer.position.set(10, 50);
        panel.addChild(itemsContainer);

        // Store reference to items container for updates
        panel.itemsContainer = itemsContainer;

        // Position panel in top-right corner
        panel.position.set(
            this.game.app.screen.width - 320,
            20
        );

        // Add to panels container
        this.panelsContainer.addChild(panel);

        // Store reference
        this.panels.inventory = panel;

        // Update inventory display
        this.updateInventoryPanel(inventory);
    }

    /**
     * Updates the inventory panel
     * @param {Inventory} inventory - The player's inventory
     */
    updateInventoryPanel(inventory) {
        const panel = this.panels.inventory;
        if (!panel) return;

        // Clear items container
        while (panel.itemsContainer.children.length > 0) {
            panel.itemsContainer.removeChildAt(0);
        }

        // Add items
        let y = 0;
        inventory.items.forEach((item, index) => {
            // Create item row
            const itemRow = new PIXI.Container();
            itemRow.position.set(0, y);

            // Create item background
            const itemBg = new PIXI.Graphics();
            itemBg.beginFill(0x333333, 0.5);
            itemBg.drawRect(0, 0, 280, 30);
            itemBg.endFill();
            itemRow.addChild(itemBg);

            // Create item name
            const itemName = new PIXI.Text(
                item.quantity > 1 ? `${item.name} (${item.quantity})` : item.name,
                {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    fill: item.rarity === 'rare' ? 0x00FFFF :
                          item.rarity === 'uncommon' ? 0x00FF00 :
                          0xFFFFFF
                }
            );
            itemName.position.set(10, 5);
            itemRow.addChild(itemName);

            // Make item row interactive
            itemRow.interactive = true;
            itemRow.buttonMode = true;
            itemRow.on('pointerdown', () => {
                console.log(`Clicked on item: ${item.name}`);
                // TODO: Show item details or actions
            });

            // Add to container
            panel.itemsContainer.addChild(itemRow);

            // Increment y position for next item
            y += 35;
        });
    }

    /**
     * Toggles a UI panel
     * @param {string} panelName - Name of the panel to toggle
     */
    togglePanel(panelName) {
        console.log(`Toggling panel: ${panelName}`);
        console.log(`Available panels:`, Object.keys(this.panels));

        const panel = this.panels[panelName];
        if (panel) {
            console.log(`Panel ${panelName} found, current visibility:`, panel.visible);
            panel.visible = !panel.visible;
            console.log(`Panel ${panelName} visibility set to:`, panel.visible);

            // Update panel if it's the inventory
            if (panelName === 'inventory' && panel.visible && this.game.player) {
                this.updateInventoryPanel(this.game.player.inventory);
            }
        } else {
            console.warn(`Panel ${panelName} not found in panels collection`);
        }
    }

    /**
     * Shows a message on the UI
     * @param {string} text - Message text
     * @param {number} duration - Duration in milliseconds
     * @param {Object} options - Additional options
     */
    showMessage(text, duration = 5000, options = {}) {
        console.log(`UI Message: ${text}`);

        // Create message container
        const messageBox = new PIXI.Container();

        // Create background with cyberpunk styling
        const background = new PIXI.Graphics();
        background.beginFill(options.backgroundColor || 0x000000, options.backgroundAlpha || 0.8);
        background.lineStyle(2, options.borderColor || 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 300, 50, 5);
        background.endFill();
        messageBox.addChild(background);

        // Create text with cyberpunk styling
        const message = new PIXI.Text(text, {
            fontFamily: options.fontFamily || 'Arial',
            fontSize: options.fontSize || 14,
            fill: options.textColor || 0x00FFFF,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 280
        });

        // Adjust background size based on text dimensions
        const padding = 15;
        const bgWidth = Math.max(300, message.width + (padding * 2));
        const bgHeight = Math.max(50, message.height + (padding * 2));

        background.clear();
        background.beginFill(options.backgroundColor || 0x000000, options.backgroundAlpha || 0.8);
        background.lineStyle(2, options.borderColor || 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, bgWidth, bgHeight, 5);
        background.endFill();

        // Center text in background
        message.position.set(
            (bgWidth - message.width) / 2,
            (bgHeight - message.height) / 2
        );

        messageBox.addChild(message);

        // Position message below the FPS counter (which is at the center top)
        messageBox.position.set(
            (this.game.app.screen.width - bgWidth) / 2,
            45 + (this.messages.length * (bgHeight + 10)) // 45px down from top to appear just below the FPS counter
        );

        // Add to container
        this.messageContainer.addChild(messageBox);

        // Add to messages array
        const messageObj = {
            container: messageBox,
            createdAt: Date.now(),
            duration: duration,
            height: bgHeight
        };

        this.messages.push(messageObj);

        // Remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeMessage(messageObj);
            }, duration);
        }

        return messageObj;
    }

    /**
     * Removes a message
     * @param {Object} messageObj - Message object to remove
     */
    removeMessage(messageObj) {
        const index = this.messages.indexOf(messageObj);

        if (index !== -1) {
            // Remove from array
            this.messages.splice(index, 1);

            // Remove from container
            this.messageContainer.removeChild(messageObj.container);

            // Reposition remaining messages - maintain consistent position below FPS counter
            this.messages.forEach((msg, i) => {
                msg.container.position.y = 45 + (i * (msg.height + 10)); // Match the initial 45px offset
            });
        }
    }

    /**
     * Updates the UI
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update messages
        const now = Date.now();

        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            const elapsed = now - msg.createdAt;

            // Fade out message near the end of its duration
            if (msg.duration > 0 && elapsed > msg.duration - 500) {
                const alpha = Math.max(0, (msg.duration - elapsed) / 500);
                msg.container.alpha = alpha;
            }
        }

        // Update building mode UI if it exists
        if (this.buildingModeUI) {
            this.buildingModeUI.update();
        }
    }

    /**
     * Creates a quality settings button and panel
     */
    createQualityButton() {
        // Create quality button
        const button = new PIXI.Container();
        button.position.set(10, 0); // Position relative to buttonContainer - leftmost button

        // Button background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.7);
        bg.lineStyle(2, 0x00FFFF, 1);
        bg.drawRoundedRect(0, 0, 40, 30, 5);
        bg.endFill();
        button.addChild(bg);

        // Button text
        const text = new PIXI.Text('Q', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFFF,
            align: 'center'
        });
        // Center the text in the button
        text.anchor.set(0.5, 0.5);
        text.position.set(20, 15);
        button.addChild(text);

        // Make button interactive
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => this.togglePanel('quality'));

        this.buttonContainer.addChild(button);
        this.qualityButton = button;

        // Create quality panel
        this.createQualityPanel();
    }

    /**
     * Creates the quality settings panel
     */
    createQualityPanel() {
        // Create panel container
        const panel = new PIXI.Container();
        panel.visible = false; // Hidden by default

        // Create background with cyberpunk styling
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 220, 430, 5); // Increased height to fit all options
        background.endFill();
        panel.addChild(background);

        // Create title with cyberpunk styling
        const title = new PIXI.Text('Quality Settings', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0x00FFFF,
            align: 'center',
            fontWeight: 'bold'
        });
        title.position.set(110, 15); // More padding at top
        title.anchor.set(0.5, 0);
        panel.addChild(title);

        // Create close button with cyberpunk styling
        const closeButton = new PIXI.Container();
        closeButton.position.set(185, 15);
        closeButton.interactive = true;
        closeButton.buttonMode = true;

        // Button background
        const closeBg = new PIXI.Graphics();
        closeBg.beginFill(0x000000, 0.6);
        closeBg.lineStyle(1, 0x00FFFF, 1);
        closeBg.drawRoundedRect(0, 0, 20, 20, 3);
        closeBg.endFill();
        closeButton.addChild(closeBg);

        // Button text
        const closeText = new PIXI.Text('X', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x00FFFF,
            align: 'center'
        });
        closeText.anchor.set(0.5, 0.5);
        closeText.position.set(10, 10);
        closeButton.addChild(closeText);

        closeButton.on('pointerdown', () => this.togglePanel('quality'));
        panel.addChild(closeButton);

        // Create quality options with cyberpunk styling
        const options = ['low', 'medium', 'high'];
        const currentQuality = this.game.options.quality || 'medium';

        options.forEach((quality, index) => {
            // Create option container
            const option = new PIXI.Container();
            option.position.set(25, 55 + index * 45); // More spacing between options

            // Create radio button with cyberpunk styling
            const radio = new PIXI.Graphics();
            radio.beginFill(0x000000, 0.6);
            radio.lineStyle(2, 0x00FFFF, 1);
            radio.drawCircle(10, 10, 8);
            radio.endFill();

            // Add selected indicator with enhanced styling
            if (quality === currentQuality) {
                const selected = new PIXI.Graphics();
                selected.beginFill(0x00FFFF, 1);
                selected.drawCircle(10, 10, 4);
                selected.endFill();

                // Add a highlight ring instead of glow filter
                const highlight = new PIXI.Graphics();
                highlight.lineStyle(1, 0x00FFFF, 0.8);
                highlight.drawCircle(10, 10, 12);
                radio.addChild(highlight);

                radio.addChild(selected);
            }

            option.addChild(radio);

            // Create label with cyberpunk styling
            const label = new PIXI.Text(quality.charAt(0).toUpperCase() + quality.slice(1), {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: quality === currentQuality ? 0x00FFFF : 0xFFFFFF,
                fontWeight: quality === currentQuality ? 'bold' : 'normal'
            });
            label.position.set(30, 3);
            option.addChild(label);

            // Make option interactive
            option.interactive = true;
            option.buttonMode = true;
            option.on('pointerdown', () => {
                this.setQuality(quality);
                this.updateQualityPanel();
            });

            panel.addChild(option);
        });

        // Add auto-adjust checkbox with cyberpunk styling
        const autoContainer = new PIXI.Container();
        autoContainer.position.set(25, 190); // Positioned below quality options

        const autoBox = new PIXI.Graphics();
        autoBox.beginFill(0x000000, 0.6);
        autoBox.lineStyle(2, 0x00FFFF, 1);
        autoBox.drawRect(0, 0, 18, 18);
        autoBox.endFill();

        // Add checkmark if auto-adjust is enabled
        if (this.game.autoAdjustQuality) {
            const check = new PIXI.Graphics();
            check.lineStyle(2, 0x00FFFF, 1);
            check.moveTo(3, 9);
            check.lineTo(7, 13);
            check.lineTo(15, 5);
            autoBox.addChild(check);

            // Add highlight border instead of glow filter
            const highlight = new PIXI.Graphics();
            highlight.lineStyle(1, 0x00FFFF, 0.8);
            highlight.drawRect(-2, -2, 22, 22);
            autoBox.addChild(highlight);
        }

        autoContainer.addChild(autoBox);

        const autoLabel = new PIXI.Text('Auto-adjust Quality', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: this.game.autoAdjustQuality ? 0x00FFFF : 0xFFFFFF,
            fontWeight: this.game.autoAdjustQuality ? 'bold' : 'normal'
        });
        autoLabel.position.set(28, 1);
        autoContainer.addChild(autoLabel);

        autoContainer.interactive = true;
        autoContainer.buttonMode = true;
        autoContainer.on('pointerdown', () => {
            this.game.autoAdjustQuality = !this.game.autoAdjustQuality;
            this.updateQualityPanel();
        });

        panel.addChild(autoContainer);

        // Add low performance mode checkbox with cyberpunk styling
        const perfModeContainer = new PIXI.Container();
        perfModeContainer.position.set(25, 220); // Positioned below auto-adjust checkbox

        const perfModeBox = new PIXI.Graphics();
        perfModeBox.beginFill(0x000000, 0.6);
        perfModeBox.lineStyle(2, 0x00FFFF, 1);
        perfModeBox.drawRect(0, 0, 18, 18);
        perfModeBox.endFill();

        // Add checkmark if low performance mode is enabled
        if (this.game.options.lowPerformanceMode) {
            const check = new PIXI.Graphics();
            check.lineStyle(2, 0x00FFFF, 1);
            check.moveTo(3, 9);
            check.lineTo(7, 13);
            check.lineTo(15, 5);
            perfModeBox.addChild(check);

            // Add highlight border instead of glow filter
            const highlight = new PIXI.Graphics();
            highlight.lineStyle(1, 0x00FFFF, 0.8);
            highlight.drawRect(-2, -2, 22, 22);
            perfModeBox.addChild(highlight);
        }

        perfModeContainer.addChild(perfModeBox);

        const perfModeLabel = new PIXI.Text('Low Performance Mode', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: this.game.options.lowPerformanceMode ? 0x00FFFF : 0xFFFFFF,
            fontWeight: this.game.options.lowPerformanceMode ? 'bold' : 'normal'
        });
        perfModeLabel.position.set(28, 1);
        perfModeContainer.addChild(perfModeLabel);

        perfModeContainer.interactive = true;
        perfModeContainer.buttonMode = true;
        perfModeContainer.on('pointerdown', () => {
            this.game.options.lowPerformanceMode = !this.game.options.lowPerformanceMode;
            this.showMessage(`Low Performance Mode: ${this.game.options.lowPerformanceMode ? 'ON' : 'OFF'}`, 2000, {
                backgroundColor: 0x000000,
                textColor: 0x00FFFF
            });
            this.updateQualityPanel();
        });

        panel.addChild(perfModeContainer);

        // Add visual effects section title with cyberpunk styling
        const effectsTitle = new PIXI.Text('Visual Effects', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFFF,
            align: 'left',
            fontWeight: 'bold'
        });
        effectsTitle.position.set(25, 255);
        panel.addChild(effectsTitle);

        // Add separator line
        const separator = new PIXI.Graphics();
        separator.lineStyle(1, 0x00FFFF, 0.5);
        separator.moveTo(25, 253);
        separator.lineTo(195, 253);
        panel.addChild(separator);

        // Add a spacer container for better separation
        const spacer = new PIXI.Container();
        spacer.position.set(0, 0);
        panel.addChild(spacer);

        // Check if synthwaveEffect exists before adding effect checkboxes
        if (this.game && this.game.synthwaveEffect) {
            // Add grid checkbox with cyberpunk styling
            const gridContainer = this.createCheckbox(
                'Grid Lines',
                this.game.synthwaveEffect.showGrid,
                25, 290, // Increased Y position to add more space after the header
                () => {
                    this.game.synthwaveEffect.setGridVisible(!this.game.synthwaveEffect.showGrid);
                    this.updateQualityPanel();
                }
            );
            panel.addChild(gridContainer);

            // Add scan lines checkbox with cyberpunk styling
            const scanLinesContainer = this.createCheckbox(
                'Scan Lines',
                this.game.synthwaveEffect.showScanLines,
                25, 320, // Increased Y position to maintain spacing
                () => {
                    this.game.synthwaveEffect.setScanLinesVisible(!this.game.synthwaveEffect.showScanLines);
                    this.updateQualityPanel();
                }
            );
            panel.addChild(scanLinesContainer);

            // Add vignette checkbox with cyberpunk styling
            const vignetteContainer = this.createCheckbox(
                'Vignette Effect',
                this.game.synthwaveEffect.showVignette,
                25, 350, // Increased Y position to maintain spacing
                () => {
                    this.game.synthwaveEffect.setVignetteVisible(!this.game.synthwaveEffect.showVignette);
                    this.updateQualityPanel();
                }
            );
            panel.addChild(vignetteContainer);
        } else {
            // Add placeholder text if synthwaveEffect is not available
            const placeholderText = new PIXI.Text('Visual effects not available', {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0x888888,
                align: 'center',
                fontStyle: 'italic'
            });
            placeholderText.position.set(110, 290); // Increased Y position to add more space after the header
            placeholderText.anchor.set(0.5, 0);
            panel.addChild(placeholderText);
        }

        // Position panel higher up to avoid overlapping with buttons and ensure it fits on screen
        panel.position.set(10, this.game.app.screen.height - 450);

        // Add to panels container
        this.panelsContainer.addChild(panel);

        // Store reference
        this.panels.quality = panel;
    }

    /**
     * Updates the quality panel to reflect current settings
     */
    updateQualityPanel() {
        const panel = this.panels.quality;
        if (!panel) return;

        // Remove existing panel
        this.panelsContainer.removeChild(panel);

        // Create updated panel
        this.createQualityPanel();
    }

    /**
     * Creates a checkbox with label
     * @param {string} label - Checkbox label
     * @param {boolean} checked - Whether the checkbox is checked
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Function} onClick - Click handler
     * @returns {PIXI.Container} The checkbox container
     */
    createCheckbox(label, checked, x, y, onClick) {
        const container = new PIXI.Container();
        container.position.set(x, y);

        // Create checkbox with cyberpunk styling
        const box = new PIXI.Graphics();
        box.beginFill(0x000000, 0.6);
        box.lineStyle(2, 0x00FFFF, 1);
        box.drawRect(0, 0, 18, 18);
        box.endFill();

        // Add checkmark if checked
        if (checked) {
            const check = new PIXI.Graphics();
            check.lineStyle(2, 0x00FFFF, 1);
            check.moveTo(3, 9);
            check.lineTo(7, 13);
            check.lineTo(15, 5);
            box.addChild(check);

            // Add highlight border instead of glow filter
            const highlight = new PIXI.Graphics();
            highlight.lineStyle(1, 0x00FFFF, 0.8);
            highlight.drawRect(-2, -2, 22, 22);
            box.addChild(highlight);
        }

        container.addChild(box);

        // Create label with cyberpunk styling
        const text = new PIXI.Text(label, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: checked ? 0x00FFFF : 0xFFFFFF,
            fontWeight: checked ? 'bold' : 'normal'
        });
        text.position.set(28, 1);
        container.addChild(text);

        // Make interactive
        container.interactive = true;
        container.buttonMode = true;
        container.on('pointerdown', onClick);

        return container;
    }

    /**
     * Sets the quality level
     * @param {string} quality - Quality level ('low', 'medium', 'high')
     */
    setQuality(quality) {
        if (!this.game) return;

        // Update game quality setting
        this.game.options.quality = quality;

        // Update synthwave effect quality
        if (this.game.synthwaveEffect) {
            this.game.synthwaveEffect.quality = quality;
        }

        // Show message
        this.showMessage(`Quality set to ${quality}`, 2000, {
            backgroundColor: 0x000000,
            textColor: 0x00FFFF
        });
    }

    /**
     * Creates a building mode button
     */
    createBuildingModeButton() {
        // Create building mode button
        const button = new PIXI.Container();
        button.position.set(60, 0); // Position 50px from the quality button

        // Button background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.7);
        bg.lineStyle(2, 0x00FFFF, 1);
        bg.drawRoundedRect(0, 0, 40, 30, 5);
        bg.endFill();
        button.addChild(bg);

        // Button text
        const text = new PIXI.Text('B', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFFF,
            align: 'center'
        });
        // Center the text in the button
        text.anchor.set(0.5, 0.5);
        text.position.set(20, 15);
        button.addChild(text);

        // Make button interactive
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => this.toggleBuildingMode());

        this.buttonContainer.addChild(button);
        this.buildingModeButton = button;
    }

    /**
     * Toggles building mode
     */
    toggleBuildingMode() {
        if (!this.game.buildingModeManager) return;

        // Check current state before toggling
        const wasActive = this.game.buildingModeManager.active;

        // Toggle building mode
        this.game.buildingModeManager.toggle();

        // Show message only when activating building mode (not when deactivating)
        if (!wasActive && this.game.buildingModeManager.active) {
            this.showMessage('Building mode activated. Select a terrain type to start building.', 3000);
        }
    }

    /**
     * Shows the building mode UI
     */
    showBuildingModeUI() {
        // Create building mode UI if it doesn't exist
        if (!this.buildingModeUI) {
            this.buildingModeUI = new BuildingModeUI({
                game: this.game,
                ui: this,
                buildingModeManager: this.game.buildingModeManager,
                assetManager: this.game.assetManager
            });
        }

        // Show the UI
        this.buildingModeUI.show();
    }

    /**
     * Hides the building mode UI
     */
    hideBuildingModeUI() {
        if (this.buildingModeUI) {
            this.buildingModeUI.hide();
        }
    }

    /**
     * Updates the building mode UI
     */
    updateBuildingModeUI() {
        if (this.buildingModeUI) {
            this.buildingModeUI.update();
        }
    }

    /**
     * Shows a tooltip
     * @param {string} text - Tooltip text
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    showTooltip(text, x, y) {
        // Remove existing tooltip
        this.hideTooltip();

        // Create tooltip container
        const tooltip = new PIXI.Container();
        tooltip.position.set(x, y);
        tooltip.zIndex = 1100; // Ensure tooltip is on top

        // Create tooltip background with cyberpunk styling
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 220, 40, 5);
        background.endFill();
        tooltip.addChild(background);

        // Add angular accents for cyberpunk style
        const accents = new PIXI.Graphics();
        accents.lineStyle(1, 0x00FFFF, 0.5);
        accents.moveTo(0, 5);
        accents.lineTo(5, 0);
        accents.moveTo(215, 0);
        accents.lineTo(220, 5);
        accents.moveTo(0, 35);
        accents.lineTo(5, 40);
        accents.moveTo(215, 40);
        accents.lineTo(220, 35);
        tooltip.addChild(accents);

        // Create tooltip text with cyberpunk styling
        const tooltipText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x00FFFF,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 200
        });
        tooltipText.anchor.set(0.5, 0.5);
        tooltipText.position.set(110, 20);
        tooltip.addChild(tooltipText);

        // Adjust background height based on text height
        if (tooltipText.height > 30) {
            const padding = 15;
            const height = tooltipText.height + padding;

            background.clear();
            background.beginFill(0x000000, 0.8);
            background.lineStyle(2, 0x00FFFF, 1);
            background.drawRoundedRect(0, 0, 220, height, 5);
            background.endFill();

            // Reposition accents
            accents.clear();
            accents.lineStyle(1, 0x00FFFF, 0.5);
            accents.moveTo(0, 5);
            accents.lineTo(5, 0);
            accents.moveTo(215, 0);
            accents.lineTo(220, 5);
            accents.moveTo(0, height - 5);
            accents.lineTo(5, height);
            accents.moveTo(215, height);
            accents.lineTo(220, height - 5);

            tooltipText.position.set(110, height / 2);
        }

        // Add to container
        this.container.addChild(tooltip);

        // Store reference
        this.tooltip = tooltip;
    }

    /**
     * Hides the tooltip
     */
    hideTooltip() {
        if (this.tooltip) {
            this.container.removeChild(this.tooltip);
            this.tooltip = null;
        }
    }

    /**
     * Creates a log level toggle button
     */
    createLogLevelButton() {
        // Create log level button
        const button = new PIXI.Container();
        button.position.set(110, 0); // Position 50px from building mode button

        // Button background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.7);
        bg.lineStyle(2, 0x00FFFF, 1);
        bg.drawRoundedRect(0, 0, 40, 30, 5);
        bg.endFill();
        button.addChild(bg);

        // Button text
        const text = new PIXI.Text('L', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFFF,
            align: 'center'
        });
        // Center the text in the button
        text.anchor.set(0.5, 0.5);
        text.position.set(20, 15);
        button.addChild(text);

        // Make button interactive
        button.interactive = true;
        button.buttonMode = true;

        // Current log level index
        this.currentLogLevelIndex = 0;

        // Log levels to cycle through
        this.logLevels = ['none', 'error', 'warn', 'info', 'debug'];

        button.on('pointerdown', () => {
            // Cycle to next log level
            this.currentLogLevelIndex = (this.currentLogLevelIndex + 1) % this.logLevels.length;
            const newLevel = this.logLevels[this.currentLogLevelIndex];

            // Set the log level
            if (this.game && typeof this.game.setLogLevel === 'function') {
                this.game.setLogLevel(newLevel);
            }
        });

        this.buttonContainer.addChild(button);
        this.logLevelButton = button;
    }

    /**
     * Resizes all UI elements
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Resize panels
        Object.values(this.panels).forEach(panel => {
            if (panel.name === 'inventory') {
                // Reposition inventory panel to top-right corner
                panel.position.set(
                    width - 320, // Assuming panel width is 320
                    20
                );
            } else if (panel === this.panels.quality) {
                // Reposition quality panel higher up
                panel.position.set(10, height - 450);
            }
            // Add other panel-specific resize logic here
        });

        // Reposition button container
        if (this.buttonContainer) {
            this.buttonContainer.position.set(0, height - 50);
        }

        // Resize message container
        if (this.messageContainer) {
            // Add any message container resize logic
        }

        // Resize building mode UI
        if (this.buildingModeUI) {
            // Update building mode UI positions if needed
        }

        // Resize any other UI elements as needed
    }

    /**
     * Creates a style toggle button and panel
     */
    createStyleToggleButton() {
        console.log('Creating style toggle button');

        // Create style toggle button
        const button = new PIXI.Container();
        button.position.set(160, 0); // Position 50px from log level button

        // Button background with more distinctive color and glow effect
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.8); // Match other buttons
        bg.lineStyle(2, 0xFF00FF, 1); // Keep magenta border but match thickness
        bg.drawRoundedRect(0, 0, 40, 40, 8); // Match height and border radius
        bg.endFill();

        // Add a subtle glow effect
        const glow = new PIXI.Graphics();
        glow.beginFill(0xFF00FF, 0.1);
        glow.drawRoundedRect(-2, -2, 44, 44, 10);
        glow.endFill();
        button.addChild(glow);
        button.addChild(bg);

        // Button text
        const text = new PIXI.Text('S', {
            fontFamily: 'Arial',
            fontSize: 16, // Match other buttons
            fontWeight: 'bold', // Keep bold text
            fill: 0xFF00FF, // Keep magenta text
            align: 'center'
        });
        // Center the text in the button
        text.anchor.set(0.5, 0.5);
        text.position.set(20, 20); // Center in the taller button
        button.addChild(text);

        // Make button interactive
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => {
            console.log('Style button clicked');
            console.log('Style panel before toggle:', this.panels.style);
            console.log('Style panel visibility before toggle:', this.panels.style ? this.panels.style.visible : 'N/A');
            this.togglePanel('style');
            console.log('Style panel after toggle:', this.panels.style);
            console.log('Style panel visibility after toggle:', this.panels.style ? this.panels.style.visible : 'N/A');
        });

        // Add to button container
        this.buttonContainer.addChild(button);
        this.styleButton = button;

        // Show a message about the style button
        this.showMessage('Style toggle button added (S)', 3000);

        // Create style toggle panel
        this.createStyleTogglePanel();
    }

    /**
     * Creates the style toggle panel
     */
    createStyleTogglePanel() {
        console.log('Creating style toggle panel');

        // Create panel container
        const panel = new PIXI.Container();
        panel.visible = false; // Hidden by default
        console.log('Style panel container created:', panel);

        // Create style toggle component
        console.log('Creating StyleToggle component with game:', this.game);
        const styleToggle = new StyleToggle({
            game: this.game,
            x: 0,
            y: 0
        });

        // Make sure the StyleToggle has access to the styleManager
        if (!styleToggle.styleManager && this.game && this.game.styleManager) {
            console.log('Setting styleManager on StyleToggle component');
            styleToggle.styleManager = this.game.styleManager;
        }

        // Override the toggle method to work with the panel
        styleToggle.originalToggle = styleToggle.toggle;
        styleToggle.toggle = () => {
            console.log('StyleToggle custom toggle called');
            this.togglePanel('style');
        };
        console.log('StyleToggle component created:', styleToggle);

        panel.addChild(styleToggle);
        console.log('StyleToggle component added to panel');

        // Position panel in the center of the screen
        panel.position.set(
            (this.game.app.screen.width - 200) / 2, // Assuming width of 200
            (this.game.app.screen.height - 200) / 2  // Assuming height of 200
        );

        // Add to panels container
        this.panelsContainer.addChild(panel);
        console.log('Style panel added to panels container');

        // Store reference
        this.panels.style = panel;
        this.styleToggle = styleToggle;

        // Make sure the panel is interactive
        panel.interactive = true;
        panel.eventMode = 'static';
        console.log('Style panel set to interactive');

        // Show a message about the current style
        if (this.game && this.game.styleManager) {
            const currentStyle = this.game.styleManager.getCurrentStyle();
            this.showMessage(`Current visual style: ${currentStyle.name}`, 5000);
        }
    }

    /**
     * Creates a debug button to help troubleshoot UI issues
     */
    createDebugButton() {
        // Create debug button
        const button = new PIXI.Container();
        button.position.set(210, 0); // Position 50px from style button

        // Button background with distinctive color
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.8);
        bg.lineStyle(2, 0xFF0000, 1); // Red border with matching thickness
        bg.drawRoundedRect(0, 0, 40, 40, 8); // Match height and border radius
        bg.endFill();
        button.addChild(bg);

        // Button text
        const text = new PIXI.Text('D', {
            fontFamily: 'Arial',
            fontSize: 16, // Match other buttons
            fontWeight: 'bold',
            fill: 0xFF0000, // Keep red text
            align: 'center'
        });
        // Center the text in the button
        text.anchor.set(0.5, 0.5);
        text.position.set(20, 20); // Center in the taller button
        button.addChild(text);

        // Make button interactive
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => {
            console.log('Debug button clicked');
            this.showUIDebugInfo();
        });

        // Add to button container
        this.buttonContainer.addChild(button);
        this.debugButton = button;
    }

    /**
     * Shows debug information about UI elements
     */
    showUIDebugInfo() {
        console.log('UI Debug Info:');
        console.log('- Container:', this.container);
        console.log('- Panels:', this.panels);
        console.log('- Buttons:');
        console.log('  - Quality:', this.qualityButton);
        console.log('  - Building:', this.buildingModeButton);
        console.log('  - Log Level:', this.logLevelButton);
        console.log('  - Style:', this.styleButton);
        console.log('  - Debug:', this.debugButton);

        // Show message with button positions
        const buttonPositions = [
            { name: 'Quality', x: this.qualityButton ? this.qualityButton.x : 'N/A', y: this.qualityButton ? this.qualityButton.y : 'N/A' },
            { name: 'Building', x: this.buildingModeButton ? this.buildingModeButton.x : 'N/A', y: this.buildingModeButton ? this.buildingModeButton.y : 'N/A' },
            { name: 'Log Level', x: this.logLevelButton ? this.logLevelButton.x : 'N/A', y: this.logLevelButton ? this.logLevelButton.y : 'N/A' },
            { name: 'Style', x: this.styleButton ? this.styleButton.x : 'N/A', y: this.styleButton ? this.styleButton.y : 'N/A' },
            { name: 'Debug', x: this.debugButton ? this.debugButton.x : 'N/A', y: this.debugButton ? this.debugButton.y : 'N/A' }
        ];

        const message = 'UI Buttons: ' + buttonPositions.map(b => `${b.name}(${b.x},${b.y})`).join(', ');
        this.showMessage(message, 10000);

        // Force all buttons to be visible
        [this.qualityButton, this.buildingModeButton, this.logLevelButton, this.styleButton, this.debugButton].forEach(button => {
            if (button) {
                button.visible = true;
                button.alpha = 1;
            }
        });
    }

    /**
     * Updates the UI colors
     * @param {Object} colors - New color definitions
     */
    updateColors(colors) {
        this.colors = colors;

        // Update UI elements with new colors
        // This will be called when the style changes

        // Update buttons
        if (this.qualityButton) {
            try {
                // Check if the button has at least one child (the background)
                if (this.qualityButton.children && this.qualityButton.children.length > 0) {
                    const bg = this.qualityButton.getChildAt(0);
                    if (bg && bg.clear) {
                        bg.clear();
                        bg.beginFill(0x000000, 0.7);
                        bg.lineStyle(2, colors.primary, 1);
                        bg.drawRoundedRect(0, 0, 40, 30, 5);
                        bg.endFill();
                    }

                    // Check if the button has at least two children (the text)
                    if (this.qualityButton.children.length > 1) {
                        const text = this.qualityButton.getChildAt(1);
                        if (text && text.style) {
                            text.style.fill = colors.primary;
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating quality button colors:', error);
            }
        }

        if (this.buildingModeButton) {
            try {
                // Check if the button has at least one child (the background)
                if (this.buildingModeButton.children && this.buildingModeButton.children.length > 0) {
                    const bg = this.buildingModeButton.getChildAt(0);
                    if (bg && bg.clear) {
                        bg.clear();
                        bg.beginFill(0x000000, 0.7);
                        bg.lineStyle(2, colors.primary, 1);
                        bg.drawRoundedRect(0, 0, 40, 30, 5);
                        bg.endFill();
                    }

                    // Check if the button has at least two children (the text)
                    if (this.buildingModeButton.children.length > 1) {
                        const text = this.buildingModeButton.getChildAt(1);
                        if (text && text.style) {
                            text.style.fill = colors.primary;
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating building mode button colors:', error);
            }
        }

        if (this.logLevelButton) {
            try {
                // Check if the button has at least one child (the background)
                if (this.logLevelButton.children && this.logLevelButton.children.length > 0) {
                    const bg = this.logLevelButton.getChildAt(0);
                    if (bg && bg.clear) {
                        bg.clear();
                        bg.beginFill(0x000000, 0.7);
                        bg.lineStyle(2, colors.primary, 1);
                        bg.drawRoundedRect(0, 0, 40, 30, 5);
                        bg.endFill();
                    }

                    // Check if the button has at least two children (the text)
                    if (this.logLevelButton.children.length > 1) {
                        const text = this.logLevelButton.getChildAt(1);
                        if (text && text.style) {
                            text.style.fill = colors.primary;
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating log level button colors:', error);
            }
        }

        if (this.styleButton) {
            console.log('Updating style button colors');
            try {
                // Check if the button has at least one child (the background)
                if (this.styleButton.children && this.styleButton.children.length > 0) {
                    // The style button has a glow effect as the first child and the background as the second child
                    // Find the background graphics object
                    let bg = null;
                    for (let i = 0; i < this.styleButton.children.length; i++) {
                        const child = this.styleButton.getChildAt(i);
                        if (child && child.clear) {
                            bg = child;
                            break;
                        }
                    }

                    if (bg && bg.clear) {
                        console.log('Found style button background');
                        bg.clear();
                        bg.beginFill(0x000000, 0.7);
                        bg.lineStyle(2, colors.primary, 1);
                        bg.drawRoundedRect(0, 0, 40, 30, 5);
                        bg.endFill();
                    } else {
                        console.warn('Style button background not found');
                    }

                    // Find the text object
                    let text = null;
                    for (let i = 0; i < this.styleButton.children.length; i++) {
                        const child = this.styleButton.getChildAt(i);
                        if (child && child.style) {
                            text = child;
                            break;
                        }
                    }

                    if (text && text.style) {
                        console.log('Found style button text');
                        text.style.fill = colors.primary;
                    } else {
                        console.warn('Style button text not found');
                    }
                } else {
                    console.warn('Style button has no children');
                }
            } catch (error) {
                console.error('Error updating style button colors:', error);
            }
        } else {
            console.warn('Style button not found when updating colors');
        }

        // Update building mode UI if it exists
        if (this.buildingModeUI && typeof this.buildingModeUI.updateColors === 'function') {
            this.buildingModeUI.updateColors(colors);
        }
    }
}

