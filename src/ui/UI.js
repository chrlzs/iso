import { PIXI } from '../utils/PixiWrapper.js';
import { BuildingModeUI } from './BuildingModeUI.js';

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
        this.panelsContainer = new PIXI.Container();
        this.container.addChild(this.panelsContainer);

        // Message system
        this.messages = [];
        this.messageContainer = new PIXI.Container();
        this.container.addChild(this.messageContainer);
    }

    /**
     * Creates UI elements
     * @private
     */
    createUI() {
        // Create message display area
        this.messageDisplay = new PIXI.Container();
        this.messageDisplay.position.set(10, 10);
        this.messageContainer.addChild(this.messageDisplay);

        // Create panels container
        this.panels = {};
        this.panelsContainer = new PIXI.Container();
        this.container.addChild(this.panelsContainer);

        // Create quality settings button
        this.createQualityButton();

        // Create building mode button
        this.createBuildingModeButton();
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
        const panel = this.panels[panelName];
        if (panel) {
            panel.visible = !panel.visible;

            // Update panel if it's the inventory
            if (panelName === 'inventory' && panel.visible && this.game.player) {
                this.updateInventoryPanel(this.game.player.inventory);
            }
        }
    }

    /**
     * Shows a message on the UI
     * @param {string} text - Message text
     * @param {number} duration - Duration in milliseconds
     * @param {Object} options - Additional options
     */
    showMessage(text, duration = 3000, options = {}) {
        console.log(`UI Message: ${text}`);

        // Create message container
        const messageBox = new PIXI.Container();

        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(options.backgroundColor || 0x000000, options.backgroundAlpha || 0.7);
        background.drawRoundedRect(0, 0, 300, 50, 10);
        background.endFill();
        messageBox.addChild(background);

        // Create text
        const message = new PIXI.Text(text, {
            fontFamily: options.fontFamily || 'Arial',
            fontSize: options.fontSize || 16,
            fill: options.textColor || 0xFFFFFF,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 280
        });

        // Center text in background
        message.position.set(
            (background.width - message.width) / 2,
            (background.height - message.height) / 2
        );

        messageBox.addChild(message);

        // Position message at the top of the screen
        messageBox.position.set(
            (this.game.app.screen.width - background.width) / 2,
            10 + (this.messages.length * 60)
        );

        // Add to container
        this.messageContainer.addChild(messageBox);

        // Add to messages array
        const messageObj = {
            container: messageBox,
            createdAt: Date.now(),
            duration: duration
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

            // Reposition remaining messages
            this.messages.forEach((msg, i) => {
                msg.container.position.y = 10 + (i * 60);
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
        button.position.set(10, this.game.app.screen.height - 40);

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
            fill: 0x00FFFF
        });
        text.position.set(15, 5);
        button.addChild(text);

        // Make button interactive
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => this.togglePanel('quality'));

        this.container.addChild(button);
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

        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(2, 0x00FFFF, 1);
        background.drawRoundedRect(0, 0, 200, 280, 10); // Increased height for additional controls
        background.endFill();
        panel.addChild(background);

        // Create title
        const title = new PIXI.Text('Quality Settings', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFFF,
            align: 'center'
        });
        title.position.set(100, 10);
        title.anchor.set(0.5, 0);
        panel.addChild(title);

        // Create close button
        const closeButton = new PIXI.Text('X', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        closeButton.position.set(180, 10);
        closeButton.interactive = true;
        closeButton.buttonMode = true;
        closeButton.on('pointerdown', () => this.togglePanel('quality'));
        panel.addChild(closeButton);

        // Create quality options
        const options = ['low', 'medium', 'high'];
        const currentQuality = this.game.options.quality || 'medium';

        options.forEach((quality, index) => {
            // Create option container
            const option = new PIXI.Container();
            option.position.set(20, 40 + index * 40);

            // Create radio button
            const radio = new PIXI.Graphics();
            radio.beginFill(0x333333, 1);
            radio.lineStyle(2, 0x00FFFF, 1);
            radio.drawCircle(10, 10, 8);
            radio.endFill();

            // Add selected indicator
            if (quality === currentQuality) {
                const selected = new PIXI.Graphics();
                selected.beginFill(0x00FFFF, 1);
                selected.drawCircle(10, 10, 4);
                selected.endFill();
                radio.addChild(selected);
            }

            option.addChild(radio);

            // Create label
            const label = new PIXI.Text(quality.charAt(0).toUpperCase() + quality.slice(1), {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xFFFFFF
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

        // Add auto-adjust checkbox
        const autoContainer = new PIXI.Container();
        autoContainer.position.set(20, 160 - 30);

        const autoBox = new PIXI.Graphics();
        autoBox.beginFill(0x333333, 1);
        autoBox.lineStyle(2, 0x00FFFF, 1);
        autoBox.drawRect(0, 0, 16, 16);
        autoBox.endFill();

        // Add checkmark if auto-adjust is enabled
        if (this.game.autoAdjustQuality) {
            const check = new PIXI.Graphics();
            check.lineStyle(2, 0x00FFFF, 1);
            check.moveTo(3, 8);
            check.lineTo(7, 12);
            check.lineTo(13, 4);
            autoBox.addChild(check);
        }

        autoContainer.addChild(autoBox);

        const autoLabel = new PIXI.Text('Auto-adjust', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        autoLabel.position.set(25, 0);
        autoContainer.addChild(autoLabel);

        autoContainer.interactive = true;
        autoContainer.buttonMode = true;
        autoContainer.on('pointerdown', () => {
            this.game.autoAdjustQuality = !this.game.autoAdjustQuality;
            this.updateQualityPanel();
        });

        panel.addChild(autoContainer);

        // Add visual effects section title
        const effectsTitle = new PIXI.Text('Visual Effects', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x00FFFF,
            align: 'left'
        });
        effectsTitle.position.set(20, 160);
        panel.addChild(effectsTitle);

        // Check if synthwaveEffect exists before adding effect checkboxes
        if (this.game && this.game.synthwaveEffect) {
            // Add grid checkbox
            const gridContainer = this.createCheckbox(
                'Grid',
                this.game.synthwaveEffect.showGrid,
                20, 180,
                () => {
                    this.game.synthwaveEffect.setGridVisible(!this.game.synthwaveEffect.showGrid);
                    this.updateQualityPanel();
                }
            );
            panel.addChild(gridContainer);

            // Add scan lines checkbox
            const scanLinesContainer = this.createCheckbox(
                'Scan Lines',
                this.game.synthwaveEffect.showScanLines,
                20, 210,
                () => {
                    this.game.synthwaveEffect.setScanLinesVisible(!this.game.synthwaveEffect.showScanLines);
                    this.updateQualityPanel();
                }
            );
            panel.addChild(scanLinesContainer);

            // Add vignette checkbox
            const vignetteContainer = this.createCheckbox(
                'Vignette',
                this.game.synthwaveEffect.showVignette,
                20, 240,
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
                align: 'left'
            });
            placeholderText.position.set(20, 180);
            panel.addChild(placeholderText);
        }

        // Position panel above the quality button
        panel.position.set(10, this.game.app.screen.height - 290);

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

        // Create checkbox
        const box = new PIXI.Graphics();
        box.beginFill(0x333333, 1);
        box.lineStyle(2, 0x00FFFF, 1);
        box.drawRect(0, 0, 16, 16);
        box.endFill();

        // Add checkmark if checked
        if (checked) {
            const check = new PIXI.Graphics();
            check.lineStyle(2, 0x00FFFF, 1);
            check.moveTo(3, 8);
            check.lineTo(7, 12);
            check.lineTo(13, 4);
            box.addChild(check);
        }

        container.addChild(box);

        // Create label
        const text = new PIXI.Text(label, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        text.position.set(25, 0);
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
        button.position.set(60, this.game.app.screen.height - 40);

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
            fill: 0x00FFFF
        });
        text.position.set(15, 5);
        button.addChild(text);

        // Make button interactive
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => this.toggleBuildingMode());

        this.container.addChild(button);
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

        // Create tooltip background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.lineStyle(1, 0x00FFFF, 0.8);
        background.drawRoundedRect(0, 0, 200, 30, 5);
        background.endFill();
        tooltip.addChild(background);

        // Create tooltip text
        const tooltipText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 190
        });
        tooltipText.anchor.set(0.5, 0.5);
        tooltipText.position.set(100, 15);
        tooltip.addChild(tooltipText);

        // Adjust background height based on text height
        if (tooltipText.height > 20) {
            background.clear();
            background.beginFill(0x000000, 0.8);
            background.lineStyle(1, 0x00FFFF, 0.8);
            background.drawRoundedRect(0, 0, 200, tooltipText.height + 10, 5);
            background.endFill();
            tooltipText.position.set(100, (tooltipText.height + 10) / 2);
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
                // Reposition quality panel
                panel.position.set(10, height - 290);
            }
            // Add other panel-specific resize logic here
        });

        // Reposition quality button
        if (this.qualityButton) {
            this.qualityButton.position.set(10, height - 40);
        }

        // Reposition building mode button
        if (this.buildingModeButton) {
            this.buildingModeButton.position.set(60, height - 40);
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
}

