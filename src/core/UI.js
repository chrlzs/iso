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

        // Don't make the main UI container interactive
        this.container.interactive = false;
        this.container.eventMode = 'none';

        // UI elements
        this.elements = new Map();

        // UI panels
        this.panels = new Map();

        // Active panel
        this.activePanel = null;

        // Synthwave color scheme
        const colors = {
            primary: 0xFF00FF,    // Hot pink
            secondary: 0x00FFFF,   // Cyan
            dark: 0x120024,       // Deep purple-black
            accent: 0xFF6B6B,     // Coral pink
            warning: 0xFFA500,    // Orange
            success: 0x00FF9F,    // Neon turquoise
            error: 0xFF0055,      // Bright red
            text: 0xFFFFFF,       // White
            healthBar: 0xFF355E,  // Hot pink
            energyBar: 0x00FFAA,  // Neon cyan
            expBar: 0xB24BF3      // Purple
        };

        // Enhanced Synthwave text style
        this.styles = {
            text: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 14,
                fill: colors.text,
                stroke: colors.dark,
                strokeThickness: 4,
                dropShadow: true,
                dropShadowColor: colors.primary,
                dropShadowDistance: 0,
                dropShadowBlur: 6
            }),
            heading: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 18,
                fontWeight: 'bold',
                fill: colors.text,
                stroke: colors.primary,
                strokeThickness: 4,
                dropShadow: true,
                dropShadowColor: colors.secondary,
                dropShadowBlur: 8,
                dropShadowDistance: 0
            }),
            button: {
                fill: colors.dark,
                hoverFill: 0x001122,
                disabledFill: 0x111111,
                textColor: colors.text,
                borderColor: colors.primary,
                glowColor: colors.primary,
                cornerRadius: 2,
                padding: 10
            },
            panel: {
                fill: colors.dark,
                alpha: 0.92,
                borderColor: colors.primary,
                borderWidth: 1,
                cornerRadius: 2,
                padding: 10,
                gridColor: colors.primary,
                gridAlpha: 0.1,
                gridSpacing: 20
            },
            notification: {
                success: {
                    fill: colors.success,
                    background: colors.dark
                },
                warning: {
                    fill: colors.warning,
                    background: colors.dark
                },
                error: {
                    fill: colors.error,
                    background: colors.dark
                }
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
    createBar(width, height, color, backgroundColor = 0x000811) {
        const container = new PIXI.Container();

        // Create angular corners
        const corners = new PIXI.Graphics();
        corners.lineStyle(1, color, 0.5);
        // Top left
        corners.moveTo(0, 5);
        corners.lineTo(5, 0);
        // Top right
        corners.moveTo(width - 5, 0);
        corners.lineTo(width, 5);
        // Bottom right
        corners.moveTo(width, height - 5);
        corners.lineTo(width - 5, height);
        // Bottom left
        corners.moveTo(5, height);
        corners.lineTo(0, height - 5);
        container.addChild(corners);

        // Background with grid pattern
        const background = new PIXI.Graphics();
        background.beginFill(backgroundColor);
        background.drawRect(0, 0, width, height);
        background.endFill();

        // Add subtle grid pattern
        background.lineStyle(1, color, 0.1);
        for (let x = 5; x < width; x += 10) {
            background.moveTo(x, 0);
            background.lineTo(x, height);
        }
        container.addChild(background);

        // Foreground with gradient and glow
        const foreground = new PIXI.Graphics();
        foreground.beginFill(color, 0.8);
        foreground.drawRect(0, 0, width, height);
        foreground.endFill();

        // Add highlight line
        foreground.lineStyle(1, 0xFFFFFF, 0.3);
        foreground.moveTo(0, 2);
        foreground.lineTo(width, 2);
        container.addChild(foreground);

        // Border
        const border = new PIXI.Graphics();
        border.lineStyle(1, color, 0.8);
        border.drawRect(0, 0, width, height);
        container.addChild(border);

        // Store references
        container.background = background;
        container.foreground = foreground;
        container.maxWidth = width;

        // Add update method with smooth transition
        let currentWidth = width;
        container.update = (value, max) => {
            const targetWidth = width * Math.max(0, Math.min(1, value / max));
            // Smooth transition
            currentWidth = currentWidth + (targetWidth - currentWidth) * 0.2;
            foreground.width = currentWidth;
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
        container.eventMode = 'static';
        container.zIndex = options.zIndex || 10; // Set a default z-index

        // Get button style
        const style = { ...this.styles.button, ...options.style };

        // Create angular accents
        const accents = new PIXI.Graphics();
        accents.lineStyle(1, style.borderColor, 0.5);

        // Create background with border
        const background = new PIXI.Graphics();
        background.lineStyle(1, style.borderColor, 0.8);

        // Create text with glow effect
        const textObj = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: style.textColor,
            stroke: style.glowColor,
            strokeThickness: 1,
            align: 'center'
        });
        textObj.anchor.set(0.5);

        // Calculate size
        const width = options.width || Math.max(100, textObj.width + style.padding * 2);
        const height = options.height || Math.max(30, textObj.height + style.padding * 2);

        // Create a hitArea to improve click detection
        container.hitArea = new PIXI.Rectangle(0, 0, width, height);

        // Add angular accents
        accents.moveTo(0, 5);
        accents.lineTo(5, 0);
        accents.moveTo(width - 5, 0);
        accents.lineTo(width, 5);
        accents.moveTo(width, height - 5);
        accents.lineTo(width - 5, height);
        accents.moveTo(5, height);
        accents.lineTo(0, height - 5);
        container.addChild(accents);

        // Draw background
        background.beginFill(style.fill);
        background.drawRect(0, 0, width, height);
        background.endFill();
        container.addChild(background);

        // Position text
        textObj.position.set(width / 2, height / 2);
        container.addChild(textObj);

        // Add event listeners with cyberpunk effects
        container.on('pointerover', () => {
            if (container.enabled !== false) {
                background.clear();
                background.lineStyle(1, style.borderColor, 1);
                background.beginFill(style.hoverFill);
                background.drawRect(0, 0, width, height);
                background.endFill();

                // Add glow effect
                const glow = new PIXI.Graphics();
                glow.beginFill(style.glowColor, 0.1);
                glow.drawRect(-2, -2, width + 4, height + 4);
                glow.endFill();
                container.addChildAt(glow, 0);

                textObj.style.strokeThickness = 2;
            }
        });

        container.on('pointerout', () => {
            if (container.enabled !== false) {
                background.clear();
                background.lineStyle(1, style.borderColor, 0.8);
                background.beginFill(style.fill);
                background.drawRect(0, 0, width, height);
                background.endFill();

                // Remove glow effect
                if (container.children.length > 3) {
                    container.removeChildAt(0);
                }

                textObj.style.strokeThickness = 1;
            }
        });

        // Use pointertap for more reliable click handling in PIXI v7
        container.on('pointertap', (e) => {
            if (container.enabled !== false) {
                background.clear();
                background.lineStyle(1, style.borderColor, 1);
                background.beginFill(style.hoverFill);
                background.drawRect(0, 0, width, height);
                background.endFill();

                // Execute callback
                if (onClick) {
                    onClick();
                }

                // Stop propagation
                e.stopPropagation();
            }
        });

        // Also keep pointerdown for visual feedback
        container.on('pointerdown', (e) => {
            if (container.enabled !== false) {
                background.clear();
                background.lineStyle(1, style.borderColor, 0.8);
                background.beginFill(style.fill);
                background.drawRect(2, 2, width - 4, height - 4);
                background.endFill();

                // Stop propagation
                e.stopPropagation();
            }
        });

        // Add enable/disable methods
        container.enable = () => {
            container.enabled = true;
            container.interactive = true;
            container.eventMode = 'static';
            container.cursor = 'pointer';
            background.clear();
            background.lineStyle(1, style.borderColor, 0.8);
            background.beginFill(style.fill);
            background.drawRect(0, 0, width, height);
            background.endFill();
            textObj.alpha = 1;
            accents.alpha = 1;
        };

        container.disable = () => {
            container.enabled = false;
            container.interactive = false;
            container.eventMode = 'none';
            container.cursor = 'default';
            background.clear();
            background.lineStyle(1, style.borderColor, 0.3);
            background.beginFill(style.disabledFill);
            background.drawRect(0, 0, width, height);
            background.endFill();
            textObj.alpha = 0.5;
            accents.alpha = 0.3;
        };

        // Set initial state
        if (options.enabled === false) {
            container.disable();
        } else {
            container.cursor = 'pointer';
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
        container.interactive = true;
        container.eventMode = 'static';

        // Get panel style
        const style = { ...this.styles.panel, ...options.style };

        // Calculate size
        const width = options.width || 200;
        const height = options.height || 200;

        // Create background with grid pattern
        const background = new PIXI.Graphics();

        // Main dark background with gradient
        background.beginFill(style.fill, style.alpha);
        background.drawRect(0, 0, width, height);
        background.endFill();

        // Add cyberpunk grid pattern
        background.lineStyle(1, style.gridColor, style.gridAlpha);

        // Vertical lines
        for (let x = 0; x <= width; x += style.gridSpacing) {
            background.moveTo(x, 0);
            background.lineTo(x, height);
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += style.gridSpacing) {
            background.moveTo(0, y);
            background.lineTo(width, y);
        }

        // Add neon border
        background.lineStyle(style.borderWidth, style.borderColor, 1);
        background.drawRect(0, 0, width, height);

        // Add angular accents in corners
        const accentSize = 15;
        background.lineStyle(1, style.borderColor, 0.5);
        // Top left
        background.moveTo(0, accentSize);
        background.lineTo(accentSize, 0);
        // Top right
        background.moveTo(width - accentSize, 0);
        background.lineTo(width, accentSize);
        // Bottom right
        background.moveTo(width, height - accentSize);
        background.lineTo(width - accentSize, height);
        // Bottom left
        background.moveTo(accentSize, height);
        background.lineTo(0, height - accentSize);

        container.addChild(background);

        // Create content container
        const contentY = options.title ? 40 : style.padding;
        const contentContainer = new PIXI.Container();
        contentContainer.position.set(style.padding, contentY);
        container.addChild(contentContainer);
        container.contentContainer = contentContainer;

        // Add title if specified
        if (options.title) {
            const title = new PIXI.Text(options.title, {
                ...this.styles.heading,
                fontSize: 16,
                stroke: style.borderColor,
                strokeThickness: 2,
                dropShadow: true,
                dropShadowColor: style.borderColor,
                dropShadowBlur: 4,
                dropShadowDistance: 0
            });
            title.position.set(width / 2, style.padding);
            title.anchor.set(0.5, 0);
            container.addChild(title);
        }

        // Set position and size
        container.position.set(options.x || 0, options.y || 0);
        container.width = width;
        container.height = height;

        // Add to UI container and panels map
        this.container.addChild(container);
        this.panels.set(id, container);

        // Enable sorting
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
        // Create combat panel as a full-screen container
        const panel = new PIXI.Container();
        panel.name = 'combat';
        panel.position.set(0, 0);
        panel.width = this.game.app.screen.width;
        panel.height = this.game.app.screen.height;

        // Make panel interactive and ensure it blocks all events
        panel.interactive = true;
        panel.eventMode = 'static';
        panel.hitArea = new PIXI.Rectangle(0, 0, panel.width, panel.height);
        panel.interactiveChildren = true; // Ensure child elements can receive events

        // Set panel to be on top of everything
        panel.zIndex = 1000;
        panel.sortableChildren = true; // Enable sorting of children by zIndex

        // Make sure parent container can sort children
        if (this.container.sortableChildren === undefined) {
            this.container.sortableChildren = true;
        }

        // Add to UI container
        this.container.addChild(panel);
        this.panels.set('combat', panel);

        // Create combat UI
        const combatUI = new CombatUI({
            container: panel,
            combatManager,
            ui: this
        });

        // Store reference
        panel.combatUI = combatUI;

        // Force the panel to be on top
        this.container.sortChildren();

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
     * Creates a quality button
     * @private
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

        // ...existing code...
    }

    /**
     * Updates the UI
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update in-game FPS counter (not the HTML one)
        if (this.game && this.elements.has('fpsCounter')) {
            // Use the game's performance FPS value for consistency
            const fps = this.game.performance ? this.game.performance.fps : Math.round(this.game.app.ticker.FPS);
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

