import { PIXI } from '../utils/PixiWrapper.js';

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
            }
            // Add other panel-specific resize logic here
        });

        // Resize message container
        if (this.messageContainer) {
            // Add any message container resize logic
        }

        // Resize any other UI elements as needed
    }
}

