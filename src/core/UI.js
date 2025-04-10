import { PIXI } from '../utils/PixiWrapper.js';
import { CombatUI } from './CombatUI.js';

/**
 * UI - Manages the game user interface
 */
export class UI {
    /**
     * Creates a new UI manager
     * @param {Object} options - UI options
     * @param {PIXI.Container} options.container - Container for UI elements
     * @param {Game} options.game - Game instance
     */
    constructor(options = {}) {
        this.container = options.container || new PIXI.Container();
        this.game = options.game || null;

        // UI elements
        this.elements = new Map();

        // UI panels
        this.panels = new Map();

        // Active panel
        this.activePanel = null;

        // Default styles
        this.styles = {
            text: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xFFFFFF,
                stroke: 0x000000,
                strokeThickness: 2
            }),
            heading: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 18,
                fontWeight: 'bold',
                fill: 0xFFFFFF,
                stroke: 0x000000,
                strokeThickness: 3
            }),
            button: {
                fill: 0x4444AA,
                hoverFill: 0x6666CC,
                disabledFill: 0x666666,
                textColor: 0xFFFFFF,
                cornerRadius: 5,
                padding: 10
            },
            panel: {
                fill: 0x333333,
                alpha: 0.8,
                borderColor: 0x666666,
                borderWidth: 2,
                cornerRadius: 5,
                padding: 10
            }
        };

        // Initialize UI
        this.initialize(options);
    }

    /**
     * Initializes the UI
     * @param {Object} options - Initialization options
     * @private
     */
    initialize(options) {
        // Create basic UI elements
        if (options.createBasicUI !== false) {
            this.createBasicUI();
        }
    }

    /**
     * Creates basic UI elements
     * @private
     */
    createBasicUI() {
        // Create FPS counter
        this.createFPSCounter();

        // Create time display
        this.createTimeDisplay();

        // Create player stats
        this.createPlayerStats();
    }

    /**
     * Creates an FPS counter
     * @private
     */
    createFPSCounter() {
        const fpsText = new PIXI.Text('FPS: 0', this.styles.text);
        fpsText.position.set(10, 10);
        this.container.addChild(fpsText);

        this.elements.set('fpsCounter', fpsText);
    }

    /**
     * Creates a time display
     * @private
     */
    createTimeDisplay() {
        const timeText = new PIXI.Text('00:00', this.styles.text);
        timeText.position.set(10, 30);
        this.container.addChild(timeText);

        this.elements.set('timeDisplay', timeText);
    }

    /**
     * Creates player stats display
     * @private
     */
    createPlayerStats() {
        const statsContainer = new PIXI.Container();
        statsContainer.position.set(10, 50);
        this.container.addChild(statsContainer);

        // Health bar
        const healthBar = this.createBar(100, 10, 0xFF0000);
        statsContainer.addChild(healthBar);

        // Health text
        const healthText = new PIXI.Text('Health: 100/100', this.styles.text);
        healthText.position.set(110, 0);
        statsContainer.addChild(healthText);

        // Energy bar
        const energyBar = this.createBar(100, 10, 0x00AAFF);
        energyBar.position.set(0, 20);
        statsContainer.addChild(energyBar);

        // Energy text
        const energyText = new PIXI.Text('Energy: 100/100', this.styles.text);
        energyText.position.set(110, 20);
        statsContainer.addChild(energyText);

        this.elements.set('healthBar', healthBar);
        this.elements.set('healthText', healthText);
        this.elements.set('energyBar', energyBar);
        this.elements.set('energyText', energyText);
        this.elements.set('statsContainer', statsContainer);

        // Hide by default
        statsContainer.visible = false;
    }

    /**
     * Creates a progress bar
     * @param {number} width - Bar width
     * @param {number} height - Bar height
     * @param {number} color - Bar color
     * @param {number} backgroundColor - Background color
     * @returns {PIXI.Container} Bar container
     * @private
     */
    createBar(width, height, color, backgroundColor = 0x000000) {
        const container = new PIXI.Container();

        // Background
        const background = new PIXI.Graphics();
        background.beginFill(backgroundColor);
        background.drawRect(0, 0, width, height);
        background.endFill();
        container.addChild(background);

        // Foreground
        const foreground = new PIXI.Graphics();
        foreground.beginFill(color);
        foreground.drawRect(0, 0, width, height);
        foreground.endFill();
        container.addChild(foreground);

        // Store references
        container.background = background;
        container.foreground = foreground;
        container.maxWidth = width;

        // Add update method
        container.update = (value, max) => {
            const percent = Math.max(0, Math.min(1, value / max));
            foreground.width = width * percent;
        };

        return container;
    }

    /**
     * Creates a button
     * @param {string} text - Button text
     * @param {Function} onClick - Click handler
     * @param {Object} options - Button options
     * @returns {PIXI.Container} Button container
     */
    createButton(text, onClick, options = {}) {
        const container = new PIXI.Container();
        container.interactive = true;
        container.buttonMode = true;

        // Get button style
        const style = { ...this.styles.button, ...options.style };

        // Create background
        const background = new PIXI.Graphics();
        container.addChild(background);

        // Create text
        const textObj = new PIXI.Text(text, options.textStyle || this.styles.text);
        textObj.anchor.set(0.5);
        container.addChild(textObj);

        // Calculate size
        const width = options.width || textObj.width + style.padding * 2;
        const height = options.height || textObj.height + style.padding * 2;

        // Position text
        textObj.position.set(width / 2, height / 2);

        // Draw background
        background.beginFill(style.fill);
        background.drawRoundedRect(0, 0, width, height, style.cornerRadius);
        background.endFill();

        // Set container size
        container.width = width;
        container.height = height;

        // Add event listeners
        container.on('pointerover', () => {
            if (container.enabled !== false) {
                background.clear();
                background.beginFill(style.hoverFill);
                background.drawRoundedRect(0, 0, width, height, style.cornerRadius);
                background.endFill();
            }
        });

        container.on('pointerout', () => {
            if (container.enabled !== false) {
                background.clear();
                background.beginFill(style.fill);
                background.drawRoundedRect(0, 0, width, height, style.cornerRadius);
                background.endFill();
            }
        });

        container.on('pointerdown', () => {
            if (container.enabled !== false) {
                background.clear();
                background.beginFill(style.fill);
                background.drawRoundedRect(2, 2, width - 4, height - 4, style.cornerRadius);
                background.endFill();
            }
        });

        container.on('pointerup', () => {
            if (container.enabled !== false) {
                background.clear();
                background.beginFill(style.hoverFill);
                background.drawRoundedRect(0, 0, width, height, style.cornerRadius);
                background.endFill();

                if (onClick) {
                    onClick();
                }
            }
        });

        // Add enable/disable methods
        container.enable = () => {
            container.enabled = true;
            container.interactive = true;
            container.buttonMode = true;
            background.clear();
            background.beginFill(style.fill);
            background.drawRoundedRect(0, 0, width, height, style.cornerRadius);
            background.endFill();
            textObj.alpha = 1;
        };

        container.disable = () => {
            container.enabled = false;
            container.interactive = false;
            container.buttonMode = false;
            background.clear();
            background.beginFill(style.disabledFill);
            background.drawRoundedRect(0, 0, width, height, style.cornerRadius);
            background.endFill();
            textObj.alpha = 0.5;
        };

        // Set initial state
        if (options.enabled === false) {
            container.disable();
        }

        return container;
    }

    /**
     * Creates a panel
     * @param {string} id - Panel ID
     * @param {Object} options - Panel options
     * @returns {PIXI.Container} Panel container
     */
    createPanel(id, options = {}) {
        // Check if panel already exists
        if (this.panels.has(id)) {
            return this.panels.get(id);
        }

        // Create container
        const container = new PIXI.Container();

        // Make container interactive and stop event propagation
        container.interactive = true;
        container.eventMode = 'static';

        // Block all events
        const blockEvent = e => {
            console.log('Panel intercepted event:', e.type);
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        };

        container.on('pointerdown', blockEvent);
        container.on('pointermove', blockEvent);
        container.on('pointerup', blockEvent);
        container.on('click', blockEvent);
        container.on('mousedown', blockEvent);
        container.on('mousemove', blockEvent);
        container.on('mouseup', blockEvent);
        container.on('tap', blockEvent);
        container.on('touchstart', blockEvent);
        container.on('touchmove', blockEvent);
        container.on('touchend', blockEvent);
        container.on('rightclick', blockEvent);
        container.on('rightdown', blockEvent);
        container.on('rightup', blockEvent);
        container.on('contextmenu', blockEvent);

        // Get panel style
        const style = { ...this.styles.panel, ...options.style };

        // Set position
        container.position.set(
            options.x || 0,
            options.y || 0
        );

        // Create background
        const background = new PIXI.Graphics();
        container.addChild(background);

        // Calculate size
        const width = options.width || 200;
        const height = options.height || 200;

        // Draw background
        background.beginFill(style.fill, style.alpha);
        background.lineStyle(style.borderWidth, style.borderColor);
        background.drawRoundedRect(0, 0, width, height, style.cornerRadius);
        background.endFill();

        // Create content container with event handling
        const contentY = options.title ? 40 : style.padding;
        const contentContainer = new PIXI.Container();
        contentContainer.interactive = true;
        contentContainer.eventMode = 'static';

        // Block all events on content container
        contentContainer.on('pointerdown', blockEvent);
        contentContainer.on('pointermove', blockEvent);
        contentContainer.on('pointerup', blockEvent);
        contentContainer.on('click', blockEvent);
        contentContainer.on('mousedown', blockEvent);
        contentContainer.on('mousemove', blockEvent);
        contentContainer.on('mouseup', blockEvent);
        contentContainer.on('tap', blockEvent);
        contentContainer.on('touchstart', blockEvent);
        contentContainer.on('touchmove', blockEvent);
        contentContainer.on('touchend', blockEvent);
        contentContainer.on('rightclick', blockEvent);
        contentContainer.on('rightdown', blockEvent);
        contentContainer.on('rightup', blockEvent);
        contentContainer.on('contextmenu', blockEvent);

        contentContainer.position.set(style.padding, contentY);
        container.addChild(contentContainer);
        container.contentContainer = contentContainer;

        // Set container size
        container.width = width;
        container.height = height;

        // Add to UI container first
        this.container.addChild(container);

        // Then add to panels map
        this.panels.set(id, container);

        // Make sure the container is properly set up for sorting
        if (this.container.sortableChildren === undefined) {
            this.container.sortableChildren = true;
        }

        // Hide by default
        container.visible = false;

        return container;
    }

    /**
     * Shows a panel
     * @param {string} id - Panel ID
     * @param {boolean} exclusive - Whether to hide other panels
     */
    showPanel(id, exclusive = false) {
        const panel = this.panels.get(id);

        if (!panel) {
            console.warn(`Panel with ID '${id}' not found`);
            return;
        }

        // Hide other panels if exclusive
        if (exclusive) {
            this.hideAllPanels();
        }

        // Show panel
        panel.visible = true;

        // Set as active panel
        this.activePanel = id;

        // Bring to front
        try {
            // Set high z-index regardless of parent
            panel.zIndex = 9999;

            // Make sure the panel is in the container
            if (!panel.parent) {
                console.log(`Adding panel '${id}' to container`);
                this.container.addChild(panel);
            } else if (panel.parent !== this.container) {
                // If it's in a different container, move it to this one
                console.log(`Moving panel '${id}' to correct container`);
                panel.parent.removeChild(panel);
                this.container.addChild(panel);
            }

            // Sort children if supported
            if (this.container.sortableChildren) {
                this.container.sortChildren();
            }
        } catch (e) {
            console.warn(`Error bringing panel '${id}' to front:`, e);
            // Last resort - create a new panel
            if (!panel.parent) {
                try {
                    this.container.addChild(panel);
                } catch (e2) {
                    console.error(`Failed to add panel '${id}' to container:`, e2);
                }
            }
        }
    }

    /**
     * Hides a panel
     * @param {string} id - Panel ID
     */
    hidePanel(id) {
        const panel = this.panels.get(id);

        if (!panel) return;

        // Hide panel
        panel.visible = false;

        // Clear active panel if this was it
        if (this.activePanel === id) {
            this.activePanel = null;
        }
    }

    /**
     * Toggles a panel
     * @param {string} id - Panel ID
     * @param {boolean} exclusive - Whether to hide other panels
     * @returns {boolean} New visibility state
     */
    togglePanel(id, exclusive = false) {
        const panel = this.panels.get(id);

        if (!panel) return false;

        if (panel.visible) {
            this.hidePanel(id);
            return false;
        } else {
            this.showPanel(id, exclusive);
            return true;
        }
    }

    /**
     * Hides all panels
     */
    hideAllPanels() {
        this.panels.forEach((panel, id) => {
            panel.visible = false;
        });

        this.activePanel = null;
    }

    /**
     * Creates a combat UI
     * @param {CombatManager} combatManager - Combat manager
     * @param {Object} options - Combat UI options
     * @returns {CombatUI} Combat UI instance
     */
    createCombatUI(combatManager, options = {}) {
        // Create combat panel
        const panel = this.createPanel('combat', {
            width: this.game.app.screen.width,
            height: this.game.app.screen.height,
            x: 0,
            y: 0,
            closable: false
        });

        // Ensure panel itself is interactive and blocks events
        panel.interactive = true;
        panel.eventMode = 'static';

        // Block all events
        const blockEvent = e => {
            console.log('Combat panel intercepted event:', e.type);
            e.stopPropagation();
            e.stopImmediatePropagation();
        };

        panel.on('pointerdown', blockEvent);
        panel.on('pointermove', blockEvent);
        panel.on('pointerup', blockEvent);
        panel.on('click', blockEvent);
        panel.on('mousedown', blockEvent);
        panel.on('mousemove', blockEvent);
        panel.on('mouseup', blockEvent);
        panel.on('tap', blockEvent);
        panel.on('touchstart', blockEvent);
        panel.on('touchmove', blockEvent);
        panel.on('touchend', blockEvent);
        panel.on('rightclick', blockEvent);
        panel.on('rightdown', blockEvent);
        panel.on('rightup', blockEvent);
        panel.on('contextmenu', blockEvent);

        // Set panel to be on top of everything
        panel.zIndex = 1000;

        // Create combat UI
        const combatUI = new CombatUI({
            container: panel.contentContainer,
            combatManager,
            ui: this
        });

        // Store reference
        panel.combatUI = combatUI;

        return combatUI;
    }

    /**
     * Creates an inventory panel
     * @param {Inventory} inventory - Inventory to display
     * @param {Object} options - Panel options
     * @returns {PIXI.Container} Panel container
     */
    createInventoryPanel(inventory, options = {}) {
        const id = options.id || 'inventory';
        const title = options.title || 'Inventory';

        // Create panel
        const panel = this.createPanel(id, {
            title,
            width: options.width || 300,
            height: options.height || 400,
            x: options.x || 100,
            y: options.y || 100,
            closable: true
        });

        // Create slots
        const slotSize = options.slotSize || 40;
        const slotsPerRow = options.slotsPerRow || 5;
        const slotPadding = options.slotPadding || 5;
        const slots = [];

        for (let i = 0; i < inventory.capacity; i++) {
            const slot = this.createInventorySlot(i, slotSize);
            const row = Math.floor(i / slotsPerRow);
            const col = i % slotsPerRow;

            slot.position.set(
                col * (slotSize + slotPadding),
                row * (slotSize + slotPadding)
            );

            panel.contentContainer.addChild(slot);
            slots.push(slot);
        }

        // Store slots
        panel.slots = slots;

        // Update slots with inventory items
        const updateSlots = () => {
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                const item = inventory.getItem(i);

                // Clear slot
                if (slot.itemSprite) {
                    slot.removeChild(slot.itemSprite);
                    slot.itemSprite = null;
                }

                if (slot.quantityText) {
                    slot.removeChild(slot.quantityText);
                    slot.quantityText = null;
                }

                // Add item if exists
                if (item) {
                    // Create item sprite
                    const itemSprite = new PIXI.Graphics();
                    itemSprite.beginFill(item.getRarityColor());
                    itemSprite.drawRect(5, 5, slotSize - 10, slotSize - 10);
                    itemSprite.endFill();

                    slot.addChild(itemSprite);
                    slot.itemSprite = itemSprite;

                    // Add quantity text if stackable
                    if (item.stackable && item.quantity > 1) {
                        const quantityText = new PIXI.Text(item.quantity.toString(), {
                            fontFamily: 'Arial',
                            fontSize: 10,
                            fill: 0xFFFFFF,
                            stroke: 0x000000,
                            strokeThickness: 2
                        });

                        quantityText.anchor.set(1, 1);
                        quantityText.position.set(slotSize - 5, slotSize - 5);
                        slot.addChild(quantityText);
                        slot.quantityText = quantityText;
                    }

                    // Highlight selected slot
                    if (i === inventory.selectedSlot) {
                        slot.background.clear();
                        slot.background.lineStyle(2, 0xFFFF00);
                        slot.background.beginFill(0x333333);
                        slot.background.drawRect(0, 0, slotSize, slotSize);
                        slot.background.endFill();
                    }
                }
            }
        };

        // Set up inventory event handlers
        inventory.onItemAdded = updateSlots;
        inventory.onItemRemoved = updateSlots;
        inventory.onItemSelected = updateSlots;

        // Initial update
        updateSlots();

        return panel;
    }

    /**
     * Creates an inventory slot
     * @param {number} index - Slot index
     * @param {number} size - Slot size
     * @returns {PIXI.Container} Slot container
     * @private
     */
    createInventorySlot(index, size) {
        const slot = new PIXI.Container();
        slot.interactive = true;
        slot.buttonMode = true;

        // Create background
        const background = new PIXI.Graphics();
        background.lineStyle(1, 0x666666);
        background.beginFill(0x333333);
        background.drawRect(0, 0, size, size);
        background.endFill();

        slot.addChild(background);
        slot.background = background;

        // Add event listeners
        slot.on('pointerover', () => {
            background.clear();
            background.lineStyle(1, 0xAAAAAA);
            background.beginFill(0x444444);
            background.drawRect(0, 0, size, size);
            background.endFill();
        });

        slot.on('pointerout', () => {
            background.clear();
            background.lineStyle(1, 0x666666);
            background.beginFill(0x333333);
            background.drawRect(0, 0, size, size);
            background.endFill();
        });

        slot.on('pointerdown', () => {
            // TODO: Handle item selection
            console.log(`Clicked inventory slot ${index}`);
        });

        return slot;
    }

    /**
     * Updates the UI
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update FPS counter
        if (this.game && this.elements.has('fpsCounter')) {
            const fps = Math.round(this.game.app.ticker.FPS);
            this.elements.get('fpsCounter').text = `FPS: ${fps}`;
        }

        // Update time display
        if (this.game && this.game.dayNightCycle && this.elements.has('timeDisplay')) {
            const timeString = this.game.dayNightCycle.getTimeString();
            const day = this.game.dayNightCycle.day;
            this.elements.get('timeDisplay').text = `Day ${day} - ${timeString}`;
        }

        // Update player stats
        if (this.game && this.game.player && this.elements.has('statsContainer')) {
            const statsContainer = this.elements.get('statsContainer');

            // Show stats container
            statsContainer.visible = true;

            // Update health
            if (this.elements.has('healthBar') && this.elements.has('healthText')) {
                const healthBar = this.elements.get('healthBar');
                const healthText = this.elements.get('healthText');

                healthBar.update(this.game.player.health, this.game.player.maxHealth);
                healthText.text = `Health: ${Math.floor(this.game.player.health)}/${this.game.player.maxHealth}`;
            }

            // Update energy
            if (this.elements.has('energyBar') && this.elements.has('energyText')) {
                const energyBar = this.elements.get('energyBar');
                const energyText = this.elements.get('energyText');

                energyBar.update(this.game.player.energy, this.game.player.maxEnergy);
                energyText.text = `Energy: ${Math.floor(this.game.player.energy)}/${this.game.player.maxEnergy}`;
            }
        }
    }

    /**
     * Resizes the UI
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Resize any elements that need it
    }
}
