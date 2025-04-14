import { PIXI } from '../utils/PixiWrapper.js';

/**
 * CombatUI - Manages the UI for combat encounters
 */
export class CombatUI {
    /**
     * Creates a new combat UI
     * @param {Object} options - Combat UI options
     * @param {PIXI.Container} options.container - Container for UI elements
     * @param {CombatManager} options.combatManager - Combat manager
     * @param {UI} options.ui - UI manager
     */
    constructor(options = {}) {
        this.container = options.container || new PIXI.Container();
        this.combatManager = options.combatManager;
        this.ui = options.ui;
        this.elements = new Map();
        this.messages = [];
        this.animations = [];
        this.statusEffects = new Map();

        // Panel dimensions
        this.panelX = this.ui.game.app.screen.width - 300;
        this.panelWidth = 300;
        this.panelHeight = this.ui.game.app.screen.height;
        this.safeAreaBottom = this.panelHeight - 20;

        // Message display time
        this.messageDisplayTime = 3000; // Increased from 2000ms to 3000ms
        this.minReadingTime = 1500; // Minimum time in ms to read a message
        this.readingTimePerChar = 50; // Additional ms per character for reading

        // Set up container for full-screen event blocking
        this.container.eventMode = 'static';
        this.container.cursor = 'default';
        this.container.sortableChildren = true; // Enable z-index sorting
        this.container.interactiveChildren = true; // Ensure child elements can receive events

        // Debug log to verify container setup
        console.log('CombatUI container setup:', {
            eventMode: this.container.eventMode,
            interactiveChildren: this.container.interactiveChildren,
            sortableChildren: this.container.sortableChildren,
            width: this.panelWidth,
            height: this.panelHeight,
            panelX: this.panelX
        });

        // Create a full-screen hit area that covers the entire viewport
        this.updateHitArea();

        // Listen for game resize events to update the hit area
        if (this.ui.game.app) {
            this.ui.game.app.renderer.on('resize', this.updateHitArea.bind(this));
        }

        // Add ALL possible interaction events to the container for maximum compatibility
        const containerEvents = ['pointertap', 'pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'tap'];

        // Define button config here for reference in event handlers
        const buttonConfig = {
            width: this.panelWidth - 20,
            height: 40,
            spacing: 10
        };

        containerEvents.forEach(eventName => {
            this.container.on(eventName, (e) => {
                console.log(`Combat UI container ${eventName} at:`, { x: e.global.x, y: e.global.y });

                // Check if this is within the action area
                if (this.elements.has('actionArea')) {
                    const actionArea = this.elements.get('actionArea');
                    const actionAreaBounds = {
                        x: actionArea.x,
                        y: actionArea.y,
                        width: this.panelWidth - 20,
                        height: 4 * (buttonConfig.height + buttonConfig.spacing)
                    };

                    if (e.global.x >= actionAreaBounds.x &&
                        e.global.x <= actionAreaBounds.x + actionAreaBounds.width &&
                        e.global.y >= actionAreaBounds.y &&
                        e.global.y <= actionAreaBounds.y + actionAreaBounds.height) {
                        console.log(`${eventName} detected within action area bounds`);

                        // Check which button was clicked
                        const buttons = [
                            this.elements.get('attackButton'),
                            this.elements.get('abilityButton'),
                            this.elements.get('itemButton'),
                            this.elements.get('escapeButton')
                        ];
                        const buttonNames = ['ATTACK', 'ABILITY', 'ITEM', 'ESCAPE'];

                        buttons.forEach((button, index) => {
                            if (!button) return;

                            const buttonBounds = {
                                x: button.x + actionArea.x,
                                y: button.y + actionArea.y,
                                width: this.panelWidth - 20,
                                height: buttonConfig.height
                            };

                            if (e.global.x >= buttonBounds.x &&
                                e.global.x <= buttonBounds.x + buttonBounds.width &&
                                e.global.y >= buttonBounds.y &&
                                e.global.y <= buttonBounds.y + buttonBounds.height) {
                                console.log(`${eventName} detected on ${buttonNames[index]} button bounds`);

                                // Manually trigger the button action for click-like events
                                if (['pointertap', 'pointerup', 'click', 'mouseup', 'tap'].includes(eventName)) {
                                    if (buttonNames[index] === 'ATTACK') {
                                        this.executePlayerAction('attack');
                                    } else if (buttonNames[index] === 'ABILITY') {
                                        this.showAbilityMenu();
                                    } else if (buttonNames[index] === 'ITEM') {
                                        this.showItemMenu();
                                    } else if (buttonNames[index] === 'ESCAPE') {
                                        this.executePlayerAction('escape');
                                    }
                                }
                            }
                        });
                    }
                }
            });
        });

        // Add a direct document click handler that will manually check for button clicks
        document.addEventListener('click', (e) => {
            console.log('Document clicked at:', { x: e.clientX, y: e.clientY });

            // Convert document coordinates to canvas coordinates
            const rect = this.ui.game.app.view.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;

            console.log('Canvas coordinates:', { x: canvasX, y: canvasY });

            // Check if this is within the action area
            if (this.elements.has('actionArea')) {
                const actionArea = this.elements.get('actionArea');

                // Check which button was clicked
                const buttons = [
                    this.elements.get('attackButton'),
                    this.elements.get('abilityButton'),
                    this.elements.get('itemButton'),
                    this.elements.get('escapeButton')
                ];
                const buttonNames = ['ATTACK', 'ABILITY', 'ITEM', 'ESCAPE'];
                const buttonActions = [
                    () => this.executePlayerAction('attack'),
                    () => this.showAbilityMenu(),
                    () => this.showItemMenu(),
                    () => this.executePlayerAction('escape')
                ];

                buttons.forEach((button, index) => {
                    if (!button) return;

                    // Calculate global position of the button
                    const buttonGlobalX = button.x + actionArea.x;
                    const buttonGlobalY = button.y + actionArea.y;

                    // Define button bounds
                    const buttonBounds = {
                        x: buttonGlobalX,
                        y: buttonGlobalY,
                        width: this.panelWidth - 20, // Use the actual width from the button config
                        height: 45 // Use the actual height from the button config (updated)
                    };

                    // Log the button position in the action area
                    console.log(`${buttonNames[index]} button position in action area: x=${button.x}, y=${button.y}`);
                    console.log(`Action area position: x=${actionArea.x}, y=${actionArea.y}`);

                    console.log(`${buttonNames[index]} button bounds:`, buttonBounds);

                    // Check if click is within button bounds with a larger hit area for better usability
                    // Add 10px padding to the hit area
                    const hitPadding = 10;
                    if (canvasX >= buttonBounds.x - hitPadding &&
                        canvasX <= buttonBounds.x + buttonBounds.width + hitPadding &&
                        canvasY >= buttonBounds.y - hitPadding &&
                        canvasY <= buttonBounds.y + buttonBounds.height + hitPadding) {

                        console.log(`Click detected on ${buttonNames[index]} button!`);
                        console.log(`Click position: (${canvasX}, ${canvasY})`);
                        console.log(`Button bounds: (${buttonBounds.x}, ${buttonBounds.y}) to (${buttonBounds.x + buttonBounds.width}, ${buttonBounds.y + buttonBounds.height})`);

                        // Only execute if button is enabled
                        if (button.enabled !== false) {
                            console.log(`Executing ${buttonNames[index]} action...`);
                            buttonActions[index]();

                            // Provide visual feedback
                            button.clear();
                            button.lineStyle(1, 0x00AAFF, 1);
                            button.beginFill(0x003366);
                            button.drawRoundedRect(0, 0, buttonConfig.width, buttonConfig.height, 5);
                            button.endFill();

                            // Redraw accents
                            button.lineStyle(1, 0x00AAFF, 0.5);
                            button.moveTo(0, 0);
                            button.lineTo(15, 15);
                            button.moveTo(buttonConfig.width, 0);
                            button.lineTo(buttonConfig.width - 15, 15);
                            button.moveTo(buttonConfig.width, buttonConfig.height - 5);
                            button.lineTo(buttonConfig.width - 15, buttonConfig.height);
                            button.moveTo(0, buttonConfig.height - 5);
                            button.lineTo(15, buttonConfig.height);

                            // Reset button after a short delay
                            setTimeout(() => {
                                if (button.enabled !== false) {
                                    button.clear();
                                    button.lineStyle(1, 0x00AAFF, 0.8);
                                    button.beginFill(0x001122);
                                    button.drawRoundedRect(0, 0, buttonConfig.width, buttonConfig.height, 5);
                                    button.endFill();

                                    // Redraw accents
                                    button.lineStyle(1, 0x00AAFF, 0.5);
                                    button.moveTo(0, 0);
                                    button.lineTo(15, 15);
                                    button.moveTo(buttonConfig.width, 0);
                                    button.lineTo(buttonConfig.width - 15, 15);
                                    button.moveTo(buttonConfig.width, buttonConfig.height - 5);
                                    button.lineTo(buttonConfig.width - 15, buttonConfig.height);
                                    button.moveTo(0, buttonConfig.height - 5);
                                    button.lineTo(15, buttonConfig.height);
                                }
                            }, 200);
                        } else {
                            console.log(`${buttonNames[index]} button is disabled.`);
                        }
                    }
                });
            }
        });

        // Create UI elements
        this.createBackground();
        this.createTurnOrderDisplay();
        this.createPlayerArea();
        this.createEnemyArea();
        this.createStatusEffectsArea();
        this.createActionButtons();
        this.createMessageArea();
        this.createTurnIndicator();
    }

    /**
     * Updates the container's hit area to match the current viewport size
     * @private
     */
    updateHitArea() {
        if (this.ui && this.ui.game && this.ui.game.app) {
            const width = this.ui.game.app.screen.width;
            const height = this.ui.game.app.screen.height;
            this.container.hitArea = new PIXI.Rectangle(0, 0, width, height);
        }
    }

    /**
     * Initializes the combat UI
     * @private
     */
    initialize() {
        // Create panel background
        this.createBackground();

        // Create turn order display (new!)
        this.createTurnOrderDisplay();

        // Create player area
        this.createPlayerArea();

        // Create enemy area
        this.createEnemyArea();

        // Create status effects area (new!)
        this.createStatusEffectsArea();

        // Create action buttons
        this.createActionButtons();

        // Create message area
        this.createMessageArea();

        // Create turn indicator
        this.createTurnIndicator();
    }

    /**
     * Creates the background
     * @private
     */
    createBackground() {
        const background = new PIXI.Graphics();

        // Create semi-transparent panel background
        const gradient = new PIXI.Graphics();
        gradient.beginFill(0x000811, 0.95);
        gradient.drawRect(this.panelX, 0, this.panelWidth, this.panelHeight);
        gradient.endFill();

        // Make the panel block events in the panel area only
        gradient.eventMode = 'static';
        gradient.cursor = 'default';
        gradient.hitArea = new PIXI.Rectangle(0, 0, this.panelWidth, this.panelHeight);

        // Add the background to container with a lower z-index
        gradient.zIndex = 1;
        this.container.addChild(gradient);

        // Add cyberpunk grid pattern on top of the blocking gradient
        background.lineStyle(1, 0x00AAFF, 0.1);

        // Vertical lines
        for (let x = 0; x <= this.panelWidth; x += 20) {
            background.moveTo(this.panelX + x, 0);
            background.lineTo(this.panelX + x, this.panelHeight);
        }

        // Horizontal lines
        for (let y = 0; y <= this.panelHeight; y += 20) {
            background.moveTo(this.panelX, y);
            background.lineTo(this.panelX + this.panelWidth, y);
        }

        // Add neon border with reduced opacity
        background.lineStyle(2, 0x00AAFF, 0.3);
        background.moveTo(this.panelX, 0);
        background.lineTo(this.panelX + this.panelWidth, 0);
        background.lineTo(this.panelX + this.panelWidth, this.panelHeight);
        background.lineTo(this.panelX, this.panelHeight);
        background.lineTo(this.panelX, 0);

        // Add diagonal accent lines
        background.lineStyle(1, 0x00AAFF, 0.2);
        background.moveTo(this.panelX, 0);
        background.lineTo(this.panelX + 30, 30);
        background.moveTo(this.panelX + this.panelWidth, 0);
        background.lineTo(this.panelX + this.panelWidth - 30, 30);

        // Add background with a lower z-index than UI elements
        background.zIndex = 2;
        this.container.addChild(background);
        this.elements.set('background', background);
    }

    /**
     * Creates the turn order display
     * @private
     */
    createTurnOrderDisplay() {
        const turnOrderContainer = new PIXI.Container();
        turnOrderContainer.position.set(this.panelX + 10, 10);
        this.container.addChild(turnOrderContainer);

        // Create header container with neon effect
        const headerContainer = new PIXI.Container();

        // Create neon glow for header
        const headerGlow = new PIXI.Graphics();
        headerGlow.lineStyle(4, 0x00AAFF, 0.2);
        headerGlow.moveTo(0, 0);
        headerGlow.lineTo(this.panelWidth - 20, 0);
        headerContainer.addChild(headerGlow);

        // Create angular accent marks
        const headerAccents = new PIXI.Graphics();
        headerAccents.lineStyle(1, 0x00AAFF, 0.5);
        // Left accent
        headerAccents.moveTo(0, 0);
        headerAccents.lineTo(15, 15);
        // Right accent
        headerAccents.moveTo(this.panelWidth - 20, 0);
        headerAccents.lineTo(this.panelWidth - 35, 15);
        headerContainer.addChild(headerAccents);

        // Create title with neon effect
        const title = new PIXI.Text('COMBAT SEQUENCE', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            stroke: 0x00AAFF,
            strokeThickness: 1
        });
        title.position.set((this.panelWidth - 20) / 2, -2);
        title.anchor.set(0.5, 0);
        headerContainer.addChild(title);

        turnOrderContainer.addChild(headerContainer);

        // Create slots container with cyberpunk background
        const slotsBackground = new PIXI.Graphics();

        // Main background
        slotsBackground.beginFill(0x000811, 0.92);
        slotsBackground.drawRect(0, 0, this.panelWidth - 20, 70);
        slotsBackground.endFill();

        // Grid pattern
        slotsBackground.lineStyle(1, 0x00AAFF, 0.1);
        for (let x = 0; x < this.panelWidth - 20; x += 20) {
            slotsBackground.moveTo(x, 0);
            slotsBackground.lineTo(x, 70);
        }
        for (let y = 0; y < 70; y += 20) {
            slotsBackground.moveTo(0, y);
            slotsBackground.lineTo(this.panelWidth - 20, y);
        }

        // Neon border
        slotsBackground.lineStyle(1, 0x00AAFF, 0.5);
        slotsBackground.drawRect(0, 0, this.panelWidth - 20, 70);

        slotsBackground.position.set(0, 25);
        turnOrderContainer.addChild(slotsBackground);

        const slots = new PIXI.Container();
        slots.position.set(10, 30);
        turnOrderContainer.addChild(slots);

        this.elements.set('turnOrderContainer', turnOrderContainer);
        this.elements.set('turnOrderSlots', slots);
    }

    /**
     * Updates the turn order display
     * @param {Array<Character>} turnOrder - Array of characters in turn order
     */
    updateTurnOrder(turnOrder) {
        const slots = this.elements.get('turnOrderSlots');
        if (!slots) return;

        // Clear existing slots
        slots.removeChildren();

        // Show next 5 turns
        turnOrder.slice(0, 5).forEach((character, index) => {
            const slot = new PIXI.Container();
            slot.position.set(index * 52, 0);

            // Create portrait frame
            const frame = new PIXI.Graphics();
            const isPlayer = this.combatManager.playerParty.includes(character);
            const isCurrentTurn = character === this.combatManager.currentTurnActor;

            // Glowing effect for current turn
            if (isCurrentTurn) {
                frame.beginFill(isPlayer ? 0x00AAFF : 0xFF0000, 0.3);
                frame.drawRoundedRect(-2, -2, 44, 54, 5);
                frame.endFill();
            }

            // Portrait background
            frame.lineStyle(2, isPlayer ? 0x00AAFF : 0xFF0000);
            frame.beginFill(0x333333);
            frame.drawRoundedRect(0, 0, 40, 50, 5);
            frame.endFill();
            slot.addChild(frame);

            // Create character portrait
            const portrait = new PIXI.Graphics();
            portrait.beginFill(isPlayer ? 0x3498db : 0xe74c3c);
            portrait.drawRoundedRect(5, 5, 30, 30, 3);
            portrait.endFill();

            // Add character details (eyes, etc) to make it more personalized
            if (isPlayer) {
                // Player character details
                portrait.beginFill(0xFFFFFF);
                portrait.drawCircle(15, 15, 3);
                portrait.drawCircle(25, 15, 3);
                portrait.endFill();
                portrait.beginFill(0x000000);
                portrait.drawCircle(15, 15, 1);
                portrait.drawCircle(25, 15, 1);
                portrait.endFill();
                portrait.lineStyle(1, 0x000000);
                portrait.beginFill(0x000000, 0);
                portrait.arc(20, 22, 5, 0, Math.PI);
            } else {
                // Enemy character details
                portrait.beginFill(0xFFFFFF);
                portrait.drawCircle(15, 15, 3);
                portrait.drawCircle(25, 15, 3);
                portrait.endFill();
                portrait.beginFill(0xFF0000);
                portrait.drawCircle(15, 15, 1);
                portrait.drawCircle(25, 15, 1);
                portrait.endFill();
                portrait.lineStyle(1, 0xFF0000);
                portrait.beginFill(0x000000, 0);
                portrait.arc(20, 25, 5, Math.PI, 0);
            }
            slot.addChild(portrait);

            // Add initiative number
            const initiativeCircle = new PIXI.Graphics();
            initiativeCircle.beginFill(0x000000, 0.7);
            initiativeCircle.drawCircle(35, 40, 10);
            initiativeCircle.endFill();
            slot.addChild(initiativeCircle);

            const initiativeText = new PIXI.Text((index + 1).toString(), {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xFFFFFF,
                align: 'center'
            });
            initiativeText.anchor.set(0.5);
            initiativeText.position.set(35, 40);
            slot.addChild(initiativeText);

            // Add tooltip with character info
            slot.eventMode = 'static';
            slot.cursor = 'pointer';
            slot.on('mouseover', () => {
                const tooltip = new PIXI.Container();
                const tooltipBg = new PIXI.Graphics();
                tooltipBg.beginFill(0x000000, 0.9);
                tooltipBg.drawRoundedRect(0, 0, 120, 70, 5);
                tooltipBg.endFill();
                tooltip.addChild(tooltipBg);

                const nameText = new PIXI.Text(character.name, {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fill: 0xFFFFFF
                });
                nameText.position.set(5, 5);
                tooltip.addChild(nameText);

                const healthText = new PIXI.Text(`HP: ${character.health}/${character.maxHealth}`, {
                    fontFamily: 'Arial',
                    fontSize: 10,
                    fill: 0x2ecc71
                });
                healthText.position.set(5, 25);
                tooltip.addChild(healthText);

                const energyText = new PIXI.Text(`Energy: ${character.energy}/${character.maxEnergy}`, {
                    fontFamily: 'Arial',
                    fontSize: 10,
                    fill: 0x00AAFF
                });
                energyText.position.set(5, 40);
                tooltip.addChild(energyText);

                tooltip.position.set(slot.x - 40, slot.y + 60);
                slots.addChild(tooltip);
                this.elements.set('turnOrderTooltip', tooltip);
            });

            slot.on('mouseout', () => {
                const tooltip = this.elements.get('turnOrderTooltip');
                if (tooltip && tooltip.parent) {
                    tooltip.parent.removeChild(tooltip);
                    this.elements.delete('turnOrderTooltip');
                }
            });

            slots.addChild(slot);
        });
    }

    /**
     * Creates the player area
     * @private
     */
    createPlayerArea() {
        const playerArea = new PIXI.Container();
        playerArea.position.set(this.panelX + 10, 400);
        this.container.addChild(playerArea);

        // Create player container
        const playerContainer = new PIXI.Container();
        playerArea.addChild(playerContainer);

        // Create player health bar
        const healthBar = this.createBar(200, 20, 0xFF0000);
        healthBar.position.set(0, 50);
        playerArea.addChild(healthBar);

        // Create player energy bar
        const energyBar = this.createBar(200, 10, 0x00AAFF);
        energyBar.position.set(0, 80);
        playerArea.addChild(energyBar);

        // Store references
        this.elements.set('playerArea', playerArea);
        this.elements.set('playerContainer', playerContainer);
        this.elements.set('playerHealthBar', healthBar);
        this.elements.set('playerEnergyBar', energyBar);
    }

    /**
     * Creates the enemy area
     * @private
     */
    createEnemyArea() {
        const enemyArea = new PIXI.Container();
        enemyArea.position.set(this.panelX + 10, 200);
        this.container.addChild(enemyArea);

        // Create enemy container
        const enemyContainer = new PIXI.Container();
        enemyArea.addChild(enemyContainer);

        // Create enemy health bar
        const healthBar = this.createBar(200, 20, 0xFF0000);
        healthBar.position.set(0, 50);
        enemyArea.addChild(healthBar);

        // Store references
        this.elements.set('enemyArea', enemyArea);
        this.elements.set('enemyContainer', enemyContainer);
        this.elements.set('enemyHealthBar', healthBar);
    }

    /**
     * Creates the status effects area
     * @private
     */
    createStatusEffectsArea() {
        const statusContainer = new PIXI.Container();
        statusContainer.position.set(this.panelX + 10, 150);
        this.container.addChild(statusContainer);

        this.elements.set('statusContainer', statusContainer);
    }

    /**
     * Updates status effects for a character
     * @param {Character} character - The character to update status effects for
     * @param {Array<Object>} effects - Array of status effects
     */
    updateStatusEffects(character, effects) {
        if (!effects || !character) return;

        const statusContainer = this.elements.get('statusContainer');
        if (!statusContainer) return;

        // Clear existing effects for this character
        const existingEffects = this.statusEffects.get(character.id);
        if (existingEffects) {
            existingEffects.forEach(effect => statusContainer.removeChild(effect));
        }

        // Create new effect displays
        const newEffects = effects.map((effect, index) => {
            const container = new PIXI.Container();

            // Create icon
            const icon = new PIXI.Graphics();
            icon.beginFill(this.getStatusEffectColor(effect.type));
            icon.drawRect(0, 0, 20, 20);
            icon.endFill();
            container.addChild(icon);

            // Create duration text
            if (effect.duration > 0) {
                const duration = new PIXI.Text(effect.duration, {
                    fontFamily: 'Arial',
                    fontSize: 10,
                    fill: 0xFFFFFF
                });
                duration.position.set(15, 15);
                container.addChild(duration);
            }

            // Position based on character and effect index
            const isPlayer = this.combatManager.playerParty.includes(character);
            container.position.set(
                index * 25,
                isPlayer ? 0 : 30
            );

            // Add tooltip
            container.interactive = true;
            container.eventMode = 'static';
            container.on('mouseover', () => this.showStatusTooltip(effect, container));
            container.on('mouseout', () => this.hideStatusTooltip());

            return container;
        });

        // Add new effects to container
        newEffects.forEach(effect => statusContainer.addChild(effect));

        // Store reference
        this.statusEffects.set(character.id, newEffects);
    }

    /**
     * Gets the color for a status effect type
     * @param {string} type - The type of status effect
     * @returns {number} - The color in hex format
     * @private
     */
    getStatusEffectColor(type) {
        const colors = {
            poison: 0x00FF00,
            burn: 0xFF0000,
            freeze: 0x00FFFF,
            stun: 0xFFFF00,
            buff: 0x00AAFF,
            debuff: 0xFF00FF
        };
        return colors[type] || 0xFFFFFF;
    }

    /**
     * Shows a tooltip for a status effect
     * @param {Object} effect - The status effect
     * @param {PIXI.Container} container - The effect container
     * @private
     */
    showStatusTooltip(effect, container) {
        const tooltip = new PIXI.Container();

        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.drawRoundedRect(0, 0, 150, 60, 5);
        background.endFill();
        tooltip.addChild(background);

        // Create title
        const title = new PIXI.Text(effect.name, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        title.position.set(5, 5);
        tooltip.addChild(title);

        // Create description
        const description = new PIXI.Text(effect.description, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xCCCCCC,
            wordWrap: true,
            wordWrapWidth: 140
        });
        description.position.set(5, 25);
        tooltip.addChild(description);

        // Position tooltip
        const globalPosition = container.getGlobalPosition();
        tooltip.position.set(globalPosition.x + 25, globalPosition.y);

        // Add to UI
        this.container.addChild(tooltip);
        this.elements.set('statusTooltip', tooltip);
    }

    /**
     * Hides the status effect tooltip
     * @private
     */
    hideStatusTooltip() {
        const tooltip = this.elements.get('statusTooltip');
        if (tooltip) {
            this.container.removeChild(tooltip);
            this.elements.delete('statusTooltip');
        }
    }

    /**
     * Creates the action buttons
     * @private
     */
    createActionButtons() {
        const actionArea = new PIXI.Container();
        // Position the action area to ensure all buttons are visible
        // Calculate position to ensure buttons are centered in the available space at the bottom
        const totalButtonsHeight = 4 * 45 + 3 * 10; // Using the new button height and spacing
        const actionAreaY = this.safeAreaBottom - totalButtonsHeight - 20; // 20px padding at the bottom

        actionArea.position.set(this.panelX + 10, actionAreaY);
        actionArea.zIndex = 100; // Increased z-index to ensure buttons are above all other UI elements
        actionArea.sortableChildren = true; // Enable sorting of children by zIndex
        actionArea.eventMode = 'static'; // Make sure the area can receive events
        actionArea.interactiveChildren = true; // Ensure child elements can receive events

        console.log(`Action area positioned at y=${actionAreaY}, safeAreaBottom=${this.safeAreaBottom}`);

        // Add a background to the action area to make it more visible
        const actionAreaBackground = new PIXI.Graphics();
        actionAreaBackground.beginFill(0x000000, 0.5); // Semi-transparent black background
        actionAreaBackground.drawRect(-5, -5, this.panelWidth - 10, totalButtonsHeight + 30); // Add some padding and space for title
        actionAreaBackground.endFill();
        actionAreaBackground.zIndex = 0; // Ensure it's behind the buttons
        actionArea.addChild(actionAreaBackground);

        // Add a title to the action area
        const actionAreaTitle = new PIXI.Text('ACTIONS', {
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'bold',
            fill: 0x00AAFF,
            stroke: 0x000000,
            strokeThickness: 1
        });
        actionAreaTitle.position.set(this.panelWidth / 2 - 40, -25); // Position above the buttons
        actionAreaTitle.zIndex = 1; // Ensure it's above the background
        actionArea.addChild(actionAreaTitle);

        // Button configurations - adjusted to fit within available space
        const buttonConfig = {
            width: this.panelWidth - 20,
            height: 45, // Adjusted height to fit all buttons
            spacing: 10  // Reduced spacing to fit all buttons
        };

        console.log('Creating action buttons with config:', buttonConfig);

        // Create glowing container for all buttons
        const glowContainer = new PIXI.Container();
        glowContainer.eventMode = 'static'; // Make sure events pass through
        glowContainer.zIndex = 99; // Just below buttons
        actionArea.addChild(glowContainer);

        // Common button style for cyberpunk theme
        const buttonStyle = {
            fill: 0x001122, // Slightly brighter base color
            hoverFill: 0x003366, // Brighter hover color for better feedback
            disabledFill: 0x111111,
            borderColor: 0x00AAFF,
            glowColor: 0x00AAFF,
            cornerRadius: 5 // Increased corner radius for a more modern look
        };

        console.log('Button style:', buttonStyle);

        const createCyberpunkButton = (text, onClick, position) => {
            // Create a Graphics object for the button instead of a Container
            // This can improve interaction in PIXI v7
            const container = new PIXI.Graphics();
            container.position.set(0, position);
            container.eventMode = 'static';
            container.cursor = 'pointer';
            container.interactive = true;
            container.zIndex = 100; // Increased z-index to ensure visibility

            // Draw the button background directly on the graphics object
            container.lineStyle(1, buttonStyle.borderColor, 0.8);
            container.beginFill(buttonStyle.fill);
            container.drawRoundedRect(0, 0, buttonConfig.width, buttonConfig.height, buttonStyle.cornerRadius);
            container.endFill();

            // Create angular accents
            container.lineStyle(1, buttonStyle.borderColor, 0.5);
            container.moveTo(0, 0);
            container.lineTo(15, 15);
            container.moveTo(buttonConfig.width, 0);
            container.lineTo(buttonConfig.width - 15, 15);
            container.moveTo(buttonConfig.width, buttonConfig.height - 5);
            container.lineTo(buttonConfig.width - 15, buttonConfig.height);
            container.moveTo(0, buttonConfig.height - 5);
            container.lineTo(15, buttonConfig.height);

            // Create text with glow effect
            const textObj = new PIXI.Text(text, {
                fontFamily: 'Arial',
                fontSize: 20, // Adjusted font size to match new button height
                fontWeight: 'bold', // Make text bold
                fill: 0xFFFFFF,
                stroke: buttonStyle.glowColor,
                strokeThickness: 2 // Increased stroke thickness for better visibility
            });
            textObj.anchor.set(0.5);
            textObj.position.set(buttonConfig.width / 2, buttonConfig.height / 2);
            container.addChild(textObj);

            // Create a hitArea to improve click detection
            container.hitArea = new PIXI.Rectangle(0, 0, buttonConfig.width, buttonConfig.height);

            // Hover effects
            container.on('pointerover', () => {
                if (container.enabled !== false) {
                    background.clear();
                    background.lineStyle(1, buttonStyle.borderColor, 1);
                    background.beginFill(buttonStyle.hoverFill);
                    background.drawRect(0, 0, buttonConfig.width, buttonConfig.height);
                    background.endFill();

                    // Add glow effect
                    const glow = new PIXI.Graphics();
                    glow.beginFill(buttonStyle.glowColor, 0.1);
                    glow.drawRect(-2, -2, buttonConfig.width + 4, buttonConfig.height + 4);
                    glow.endFill();
                    container.addChildAt(glow, 0);

                    textObj.style.strokeThickness = 2;

                    // Debug log
                    console.log(`Button hover: ${text}`);
                }
            });

            container.on('pointerout', () => {
                if (container.enabled !== false) {
                    background.clear();
                    background.lineStyle(1, buttonStyle.borderColor, 0.8);
                    background.beginFill(buttonStyle.fill);
                    background.drawRect(0, 0, buttonConfig.width, buttonConfig.height);
                    background.endFill();

                    // Remove glow effect
                    if (container.children.length > 3) {
                        container.removeChildAt(0);
                    }

                    textObj.style.strokeThickness = 1;
                }
            });

            // Add ALL possible interaction events for maximum compatibility
            const allEvents = ['pointertap', 'pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'tap'];

            allEvents.forEach(eventName => {
                container.on(eventName, (e) => {
                    if (container.enabled !== false) {
                        // Debug log
                        console.log(`Button ${eventName}: ${text}`);

                        // Visual feedback
                        container.clear();
                        container.lineStyle(1, buttonStyle.borderColor, 1);
                        container.beginFill(buttonStyle.hoverFill);
                        container.drawRect(0, 0, buttonConfig.width, buttonConfig.height);
                        container.endFill();

                        // Redraw accents
                        container.lineStyle(1, buttonStyle.borderColor, 0.5);
                        container.moveTo(0, 0);
                        container.lineTo(15, 15);
                        container.moveTo(buttonConfig.width, 0);
                        container.lineTo(buttonConfig.width - 15, 15);
                        container.moveTo(buttonConfig.width, buttonConfig.height - 5);
                        container.lineTo(buttonConfig.width - 15, buttonConfig.height);
                        container.moveTo(0, buttonConfig.height - 5);
                        container.lineTo(15, buttonConfig.height);

                        // Execute callback for click-like events
                        if (['pointertap', 'pointerup', 'click', 'mouseup', 'tap'].includes(eventName)) {
                            if (onClick) {
                                onClick();
                            }
                        }

                        // Stop propagation
                        e.stopPropagation();
                    }
                });
            });

            // Add hover effects
            container.on('pointerover', () => {
                if (container.enabled !== false) {
                    // Visual feedback
                    container.clear();
                    container.lineStyle(1, buttonStyle.borderColor, 1);
                    container.beginFill(buttonStyle.hoverFill);
                    container.drawRoundedRect(0, 0, buttonConfig.width, buttonConfig.height, buttonStyle.cornerRadius);
                    container.endFill();

                    // Redraw accents
                    container.lineStyle(1, buttonStyle.borderColor, 0.5);
                    container.moveTo(0, 0);
                    container.lineTo(15, 15);
                    container.moveTo(buttonConfig.width, 0);
                    container.lineTo(buttonConfig.width - 15, 15);
                    container.moveTo(buttonConfig.width, buttonConfig.height - 5);
                    container.lineTo(buttonConfig.width - 15, buttonConfig.height);
                    container.moveTo(0, buttonConfig.height - 5);
                    container.lineTo(15, buttonConfig.height);

                    console.log(`Button hover: ${text}`);
                }
            });

            container.on('pointerout', () => {
                if (container.enabled !== false) {
                    // Visual feedback
                    container.clear();
                    container.lineStyle(1, buttonStyle.borderColor, 0.8);
                    container.beginFill(buttonStyle.fill);
                    container.drawRoundedRect(0, 0, buttonConfig.width, buttonConfig.height, buttonStyle.cornerRadius);
                    container.endFill();

                    // Redraw accents
                    container.lineStyle(1, buttonStyle.borderColor, 0.5);
                    container.moveTo(0, 0);
                    container.lineTo(15, 15);
                    container.moveTo(buttonConfig.width, 0);
                    container.lineTo(buttonConfig.width - 15, 15);
                    container.moveTo(buttonConfig.width, buttonConfig.height - 5);
                    container.lineTo(buttonConfig.width - 15, buttonConfig.height);
                    container.moveTo(0, buttonConfig.height - 5);
                    container.lineTo(15, buttonConfig.height);
                }
            });

            // Add enable/disable methods
            container.enable = () => {
                container.enabled = true;
                container.interactive = true;
                container.eventMode = 'static';
                container.cursor = 'pointer';
                container.clear();
                container.lineStyle(1, buttonStyle.borderColor, 0.8);
                container.beginFill(buttonStyle.fill);
                container.drawRoundedRect(0, 0, buttonConfig.width, buttonConfig.height, buttonStyle.cornerRadius);
                container.endFill();

                // Redraw accents
                container.lineStyle(1, buttonStyle.borderColor, 0.5);
                container.moveTo(0, 0);
                container.lineTo(15, 15);
                container.moveTo(buttonConfig.width, 0);
                container.lineTo(buttonConfig.width - 15, 15);
                container.moveTo(buttonConfig.width, buttonConfig.height - 5);
                container.lineTo(buttonConfig.width - 15, buttonConfig.height);
                container.moveTo(0, buttonConfig.height - 5);
                container.lineTo(15, buttonConfig.height);

                textObj.alpha = 1;
                console.log(`Button enabled: ${text}`);
            };

            container.disable = () => {
                container.enabled = false;
                container.interactive = false;
                container.eventMode = 'none';
                container.cursor = 'default';
                container.clear();
                container.lineStyle(1, buttonStyle.borderColor, 0.3);
                container.beginFill(buttonStyle.disabledFill);
                container.drawRoundedRect(0, 0, buttonConfig.width, buttonConfig.height, buttonStyle.cornerRadius);
                container.endFill();

                // Redraw accents
                container.lineStyle(1, buttonStyle.borderColor, 0.3);
                container.moveTo(0, 0);
                container.lineTo(15, 15);
                container.moveTo(buttonConfig.width, 0);
                container.lineTo(buttonConfig.width - 15, 15);
                container.moveTo(buttonConfig.width, buttonConfig.height - 5);
                container.lineTo(buttonConfig.width - 15, buttonConfig.height);
                container.moveTo(0, buttonConfig.height - 5);
                container.lineTo(15, buttonConfig.height);

                textObj.alpha = 0.5;
                console.log(`Button disabled: ${text}`);
            };

            return container;
        };

        // Create buttons with cyberpunk style
        const attackButton = createCyberpunkButton('ATTACK', () => {
            console.log('ATTACK button clicked, executing action...');
            this.executePlayerAction('attack');
        }, 0);

        const abilityButton = createCyberpunkButton('ABILITY', () => {
            console.log('ABILITY button clicked, showing menu...');
            this.showAbilityMenu();
        }, buttonConfig.height + buttonConfig.spacing);

        const itemButton = createCyberpunkButton('ITEM', () => {
            console.log('ITEM button clicked, showing menu...');
            this.showItemMenu();
        }, (buttonConfig.height + buttonConfig.spacing) * 2);

        const escapeButton = createCyberpunkButton('ESCAPE', () => {
            console.log('ESCAPE button clicked, executing action...');
            this.executePlayerAction('escape');
        }, (buttonConfig.height + buttonConfig.spacing) * 3);

        // Log the actual button positions for debugging
        console.log('Button positions in action area:');
        console.log(`ATTACK: y=${attackButton.y}`);
        console.log(`ABILITY: y=${abilityButton.y}`);
        console.log(`ITEM: y=${itemButton.y}`);
        console.log(`ESCAPE: y=${escapeButton.y}`);

        // Add direct click handlers for debugging
        attackButton.on('click', () => console.log('Native click on ATTACK button'));
        abilityButton.on('click', () => console.log('Native click on ABILITY button'));
        itemButton.on('click', () => console.log('Native click on ITEM button'));
        escapeButton.on('click', () => console.log('Native click on ESCAPE button'));

        // Add buttons to action area
        actionArea.addChild(attackButton);
        actionArea.addChild(abilityButton);
        actionArea.addChild(itemButton);
        actionArea.addChild(escapeButton);

        // Log button positions for debugging
        console.log('Button positions:', {
            attack: { x: attackButton.x + actionArea.x, y: attackButton.y + actionArea.y },
            ability: { x: abilityButton.x + actionArea.x, y: abilityButton.y + actionArea.y },
            item: { x: itemButton.x + actionArea.x, y: itemButton.y + actionArea.y },
            escape: { x: escapeButton.x + actionArea.x, y: escapeButton.y + actionArea.y }
        });

        // Add direct click handlers to the action area for debugging
        actionArea.on('click', (e) => {
            console.log('Action area clicked at:', { x: e.global.x, y: e.global.y });

            // Check if click is within any button bounds
            const buttons = [attackButton, abilityButton, itemButton, escapeButton];
            const buttonNames = ['ATTACK', 'ABILITY', 'ITEM', 'ESCAPE'];

            buttons.forEach((button, index) => {
                const buttonBounds = {
                    x: button.x + actionArea.x,
                    y: button.y + actionArea.y,
                    width: buttonConfig.width,
                    height: buttonConfig.height
                };

                if (e.global.x >= buttonBounds.x &&
                    e.global.x <= buttonBounds.x + buttonBounds.width &&
                    e.global.y >= buttonBounds.y &&
                    e.global.y <= buttonBounds.y + buttonBounds.height) {
                    console.log(`Click detected on ${buttonNames[index]} button bounds`);
                }
            });
        });

        this.container.addChild(actionArea);
        this.elements.set('actionArea', actionArea);
        this.elements.set('attackButton', attackButton);
        this.elements.set('abilityButton', abilityButton);
        this.elements.set('itemButton', itemButton);
        this.elements.set('escapeButton', escapeButton);
    }

    /**
     * Creates the message area with cyberpunk styling
     * @private
     */
    createMessageArea() {
        const messageArea = new PIXI.Container();
        // Position the message area at the top center of the screen
        messageArea.position.set(this.ui.game.app.screen.width / 2, 60);
        messageArea.zIndex = 1000; // Ensure it's on top of everything
        this.container.addChild(messageArea);

        // Create cyberpunk-styled message background
        const messageBg = new PIXI.Graphics();

        // Main background - dark with slight transparency
        messageBg.beginFill(0x000811, 0.85);
        messageBg.drawRect(-300, -25, 600, 80); // Increased width from 440 to 600 and height from 70 to 80
        messageBg.endFill();

        // Neon border with angular corners
        messageBg.lineStyle(2, 0x00AAFF, 0.9);

        // Top border with angular corners
        messageBg.moveTo(-300, -25);
        messageBg.lineTo(-280, -25);
        messageBg.moveTo(-260, -25);
        messageBg.lineTo(260, -25);
        messageBg.moveTo(280, -25);
        messageBg.lineTo(300, -25);

        // Right border with angular corners
        messageBg.moveTo(300, -25);
        messageBg.lineTo(300, -5);
        messageBg.moveTo(300, 15);
        messageBg.lineTo(300, 55); // Adjusted y-position from 45 to 55

        // Bottom border with angular corners
        messageBg.moveTo(300, 55); // Adjusted y-position from 45 to 55
        messageBg.lineTo(280, 55);
        messageBg.moveTo(260, 55);
        messageBg.lineTo(-260, 55);
        messageBg.moveTo(-280, 55);
        messageBg.lineTo(-300, 55);

        // Left border with angular corners
        messageBg.moveTo(-300, 55); // Adjusted y-position from 45 to 55
        messageBg.lineTo(-300, 15);
        messageBg.moveTo(-300, -5);
        messageBg.lineTo(-300, -25);

        // Add diagonal accent lines
        messageBg.lineStyle(1, 0x00AAFF, 0.5);
        messageBg.moveTo(-300, -25);
        messageBg.lineTo(-285, -10);
        messageBg.moveTo(300, -25);
        messageBg.lineTo(285, -10);
        messageBg.moveTo(-300, 55); // Adjusted y-position from 45 to 55
        messageBg.lineTo(-285, 40);
        messageBg.moveTo(300, 55); // Adjusted y-position from 45 to 55
        messageBg.lineTo(285, 40);

        messageArea.addChild(messageBg);

        // Add a scanline effect for cyberpunk feel
        const scanlines = new PIXI.Graphics();
        scanlines.beginFill(0x00AAFF, 0.03);
        for (let i = -25; i < 55; i += 4) { // Adjusted max height from 45 to 55
            scanlines.drawRect(-300, i, 600, 1); // Increased width from 440 to 600
        }
        scanlines.endFill();
        messageArea.addChild(scanlines);

        // Create glitch container for text
        const glitchContainer = new PIXI.Container();
        messageArea.addChild(glitchContainer);

        // Create message text with cyberpunk styling
        const messageText = new PIXI.Text('', {
            fontFamily: 'monospace', // More tech-looking font
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0x00FFFF, // Cyan color for cyberpunk feel
            stroke: 0x0088AA,
            strokeThickness: 2,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x00AAFF,
            dropShadowDistance: 2,
            dropShadowBlur: 4,
            wordWrap: true,
            wordWrapWidth: 580 // Set word wrap width to fit within the message box
        });
        messageText.anchor.set(0.5);
        glitchContainer.addChild(messageText);

        // Create shadow text for glitch effect
        const shadowText = new PIXI.Text('', {
            fontFamily: 'monospace',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xFF00FF, // Magenta for glitch effect
            align: 'center',
            alpha: 0.4,
            wordWrap: true,
            wordWrapWidth: 580 // Match the main text's word wrap width
        });
        shadowText.anchor.set(0.5);
        shadowText.position.set(2, 2); // Slight offset
        glitchContainer.addChild(shadowText);
        glitchContainer.addChildAt(shadowText, 0); // Put behind main text

        // Store references
        this.elements.set('messageArea', messageArea);
        this.elements.set('messageText', messageText);
        this.elements.set('shadowText', shadowText);
        this.elements.set('messageBg', messageBg);
        this.elements.set('scanlines', scanlines);
    }

    /**
     * Creates the turn indicator
     * @private
     */
    createTurnIndicator() {
        const turnIndicator = new PIXI.Container();
        turnIndicator.position.set(this.panelX + 150, 50);
        this.container.addChild(turnIndicator);

        // Create turn text
        const turnText = new PIXI.Text('Turn 1', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3,
            align: 'center'
        });
        turnText.anchor.set(0.5);
        turnIndicator.addChild(turnText);

        // Create actor text
        const actorText = new PIXI.Text('Player\'s Turn', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4,
            align: 'center'
        });
        actorText.anchor.set(0.5);
        actorText.position.set(0, 30);
        turnIndicator.addChild(actorText);

        // Store references
        this.elements.set('turnIndicator', turnIndicator);
        this.elements.set('turnText', turnText);
        this.elements.set('actorText', actorText);
    }

    /**
     * Creates a progress bar with cyberpunk styling
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
     * Shows the ability menu
     * @private
     */
    showAbilityMenu() {
        // Create ability menu directly in the panel
        const abilityMenu = new PIXI.Container();
        abilityMenu.position.set(this.panelX + 10, 150);

        // Get player abilities
        const player = this.combatManager.playerParty[0];
        const abilities = player.abilities || [];

        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(0x222222, 0.9);
        background.drawRect(0, 0, this.panelWidth - 20, 200);
        background.endFill();
        abilityMenu.addChild(background);

        // Create title
        const title = new PIXI.Text('Abilities', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3
        });
        title.position.set(10, 10);
        abilityMenu.addChild(title);

        // Create ability buttons
        abilities.forEach((ability, index) => {
            const container = new PIXI.Container();
            container.position.set(10, 40 + index * 45);
            abilityMenu.addChild(container);

            // Create button background
            const buttonBg = new PIXI.Graphics();
            const width = this.panelWidth - 40;
            const height = 40;
            const canUse = player.energy >= (ability.energyCost || 0);
            const baseFill = canUse ? 0x444444 : 0x666666;
            buttonBg.beginFill(baseFill);
            buttonBg.drawRoundedRect(0, 0, width, height, 5);
            buttonBg.endFill();
            container.addChild(buttonBg);

            // Add ability name
            const nameText = new PIXI.Text(ability.name, {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: canUse ? 0xFFFFFF : 0x999999
            });
            nameText.position.set(10, 5);
            container.addChild(nameText);

            // Add energy cost
            if (ability.energyCost > 0) {
                const energyText = new PIXI.Text(`${ability.energyCost} Energy`, {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fill: canUse ? 0x00AAFF : 0x666666
                });
                energyText.position.set(width - 10, 5);
                energyText.anchor.set(1, 0);
                container.addChild(energyText);
            }

            // Add cooldown if applicable
            if (ability.cooldown > 0) {
                const cooldownText = new PIXI.Text(`${ability.cooldown}t CD`, {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fill: 0xFFAA00
                });
                cooldownText.position.set(width - 10, height - 17);
                cooldownText.anchor.set(1, 0);
                container.addChild(cooldownText);
            }

            // Add tooltip container
            const tooltip = new PIXI.Container();
            tooltip.visible = false;
            abilityMenu.addChild(tooltip);

            // Tooltip background
            const tooltipBg = new PIXI.Graphics();
            tooltipBg.beginFill(0x000000, 0.9);
            tooltipBg.drawRoundedRect(0, 0, 200, 80, 5);
            tooltipBg.endFill();
            tooltip.addChild(tooltipBg);

            // Tooltip text
            const tooltipText = new PIXI.Text(ability.description, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xFFFFFF,
                wordWrap: true,
                wordWrapWidth: 190
            });
            tooltipText.position.set(5, 5);
            tooltip.addChild(tooltipText);

            // Make button interactive
            container.eventMode = 'static';
            container.cursor = canUse ? 'pointer' : 'not-allowed';
            container.interactive = true;

            // Hover effects
            container.on('mouseover', () => {
                if (canUse) {
                    buttonBg.clear();
                    buttonBg.beginFill(0x666666);
                    buttonBg.drawRoundedRect(0, 0, width, height, 5);
                    buttonBg.endFill();
                }
                tooltip.position.set(container.x + width + 20, container.y);
                tooltip.visible = true;
            });

            container.on('mouseout', () => {
                if (canUse) {
                    buttonBg.clear();
                    buttonBg.beginFill(baseFill);
                    buttonBg.drawRoundedRect(0, 0, width, height, 5);
                    buttonBg.endFill();
                }
                tooltip.visible = false;
            });

            container.on('click', () => {
                if (canUse) {
                    this.executePlayerAction('ability', { ability });
                    this.container.removeChild(abilityMenu);
                } else {
                    this.showMessage('Not enough energy!', 1500);
                }
            });
        });

        // Create back button
        const backButton = this.ui.createButton('Back', () => {
            this.container.removeChild(abilityMenu);
        }, {
            width: 80,
            height: 30,
            style: {
                fill: 0x444444,
                hoverFill: 0x666666
            }
        });
        backButton.position.set(this.panelWidth - 100, 160);
        abilityMenu.addChild(backButton);

        this.container.addChild(abilityMenu);
        this.elements.set('abilityMenu', abilityMenu);
    }

    /**
     * Shows the item menu
     * @private
     */
    showItemMenu() {
        // Create item menu directly in the panel
        const itemMenu = new PIXI.Container();
        itemMenu.position.set(this.panelX + 10, 150);

        // Get player inventory
        const player = this.combatManager.playerParty[0];
        const inventory = player.inventory;

        if (!inventory || inventory.items.length === 0) {
            this.showMessage('No items available!');
            return;
        }

        // Create background for item menu
        const background = new PIXI.Graphics();
        background.beginFill(0x222222, 0.9);
        background.drawRect(0, 0, this.panelWidth - 20, 200);
        background.endFill();
        itemMenu.addChild(background);

        // Create title
        const title = new PIXI.Text('Items', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3
        });
        title.position.set(10, 10);
        itemMenu.addChild(title);

        // Create item buttons
        const usableItems = inventory.items.filter(item => item.consumable);
        usableItems.forEach((item, index) => {
            const button = this.ui.createButton(`${item.name} (${item.quantity})`, () => {
                this.executePlayerAction('item', { item });
                this.container.removeChild(itemMenu);
            }, {
                width: this.panelWidth - 40,
                height: 30
            });

            button.position.set(10, 40 + index * 35);
            itemMenu.addChild(button);

            // Add description
            const description = new PIXI.Text(item.description || '', {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0xCCCCCC,
                wordWrap: true,
                wordWrapWidth: this.panelWidth - 60
            });
            description.position.set(15, 40 + index * 35 + 30);
            itemMenu.addChild(description);
        });

        // Create back button
        const backButton = this.ui.createButton('Back', () => {
            this.container.removeChild(itemMenu);
        }, {
            width: 80,
            height: 30
        });
        backButton.position.set(this.panelWidth - 100, 160);
        itemMenu.addChild(backButton);

        this.container.addChild(itemMenu);
        this.elements.set('itemMenu', itemMenu);
    }

    /**
     * Executes a player action
     * @param {string} actionType - Type of action
     * @param {Object} options - Action options
     * @private
     */
    executePlayerAction(actionType, options = {}) {
        console.log(`Executing player action: ${actionType}`, options);

        // Validate that it's the player's turn
        const currentActor = this.combatManager.currentTurnActor;
        if (!currentActor || !this.combatManager.playerParty.includes(currentActor)) {
            console.warn("Cannot execute action: It's not the player's turn");
            this.showMessage("It's not your turn!");
            return;
        }

        // Default target is first enemy for attacks/abilities, self for items
        const target = options.target || (
            actionType === 'item'
                ? this.combatManager.playerParty[0]
                : this.combatManager.enemyParty[0]
        );

        // Execute action
        console.log(`Attempting to execute ${actionType} on target:`, target);
        const success = this.combatManager.executePlayerAction(actionType, {
            ...options,
            target
        });
        console.log(`Action execution ${success ? 'succeeded' : 'failed'}`);

        // Show error message if action failed
        if (!success) {
            let errorMessage = '';
            switch (actionType) {
                case 'attack':
                    errorMessage = 'Cannot attack right now!';
                    break;
                case 'ability':
                    errorMessage = options.ability ? 'Not enough energy!' : 'No ability selected!';
                    break;
                case 'item':
                    errorMessage = options.item ? 'Cannot use that item!' : 'No item selected!';
                    break;
                case 'escape':
                    errorMessage = 'Cannot escape right now!';
                    break;
                default:
                    errorMessage = 'Action failed!';
            }
            console.warn(`Action failed: ${errorMessage}`);
            this.showMessage(errorMessage);
        }
    }

    /**
     * Shows an attack animation
     * @param {Character} attacker - The attacking character
     * @param {Character} target - The target character
     * @param {number} damage - Damage dealt
     * @param {boolean} isCritical - Whether the attack was a critical hit
     */
    showAttackAnimation(attacker, target, damage, isCritical) {
        // Create animation container
        const animation = new PIXI.Container();
        this.container.addChild(animation);

        // Determine positions
        const isPlayerAttack = this.combatManager.playerParty.includes(attacker);
        const startX = isPlayerAttack ? 150 : 650;
        const startY = isPlayerAttack ? 400 : 200;
        const endX = isPlayerAttack ? 650 : 150;
        const endY = isPlayerAttack ? 200 : 400;

        // Create projectile
        const projectile = new PIXI.Graphics();
        projectile.beginFill(isPlayerAttack ? 0x00AAFF : 0xFF0000);
        projectile.drawCircle(0, 0, 10);
        projectile.endFill();
        projectile.position.set(startX, startY);
        animation.addChild(projectile);

        // Create damage text
        const damageText = new PIXI.Text(damage.toString(), {
            fontFamily: 'Arial',
            fontSize: isCritical ? 36 : 24,
            fill: isCritical ? 0xFF0000 : 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        damageText.anchor.set(0.5);
        damageText.position.set(endX, endY);
        damageText.alpha = 0;
        animation.addChild(damageText);

        // Animation properties
        const duration = 500; // ms
        const startTime = Date.now();

        // Add to animations
        this.animations.push({
            container: animation,
            update: () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);

                // Update projectile position
                projectile.x = startX + (endX - startX) * progress;
                projectile.y = startY + (endY - startY) * progress;

                // Show damage text when projectile reaches target
                if (progress >= 1) {
                    projectile.visible = false;
                    damageText.alpha = 1;

                    // Animate damage text
                    damageText.y = endY - 20 * (elapsed - duration) / 500;
                    damageText.alpha = 1 - (elapsed - duration) / 500;

                    // Remove animation when complete
                    if (elapsed > duration + 500) {
                        this.container.removeChild(animation);
                        return true; // Animation complete
                    }
                }

                return false; // Animation not complete
            }
        });

        // Show message
        const message = isCritical
            ? `${attacker.name} lands a critical hit for ${damage} damage!`
            : `${attacker.name} attacks ${target.name} for ${damage} damage!`;

        this.showMessage(message);
    }

    /**
     * Shows an ability animation
     * @param {Character} user - The character using the ability
     * @param {Character} target - The target character
     * @param {Object} ability - The ability used
     */
    showAbilityAnimation(user, target, ability) {
        // Create animation container
        const animation = new PIXI.Container();
        this.container.addChild(animation);

        // Determine positions
        const isPlayerAbility = this.combatManager.playerParty.includes(user);
        const startX = isPlayerAbility ? 150 : 650;
        const startY = isPlayerAbility ? 400 : 200;
        const endX = isPlayerAbility ? 650 : 150;
        const endY = isPlayerAbility ? 200 : 400;

        // Create ability effect
        const effect = new PIXI.Graphics();
        effect.beginFill(0x00FFFF);
        // Draw a star-like shape using lineTo
        const points = 5;
        const innerRadius = 10;
        const outerRadius = 20;
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                effect.moveTo(x, y);
            } else {
                effect.lineTo(x, y);
            }
        }
        effect.closePath();
        effect.endFill();
        effect.position.set(startX, startY);
        animation.addChild(effect);

        // Animation properties
        const duration = 800; // ms
        const startTime = Date.now();

        // Add to animations
        this.animations.push({
            container: animation,
            update: () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);

                // Update effect position
                effect.x = startX + (endX - startX) * progress;
                effect.y = startY + (endY - startY) * progress;

                // Rotate effect
                effect.rotation += 0.1;

                // Scale effect
                effect.scale.set(1 + Math.sin(progress * Math.PI) * 0.5);

                // Remove animation when complete
                if (progress >= 1) {
                    // Flash target
                    if (target.sprite) {
                        target.sprite.alpha = 0.5;
                        setTimeout(() => {
                            if (target.sprite) {
                                target.sprite.alpha = 1;
                            }
                        }, 200);
                    }

                    // Remove animation
                    this.container.removeChild(animation);
                    return true; // Animation complete
                }

                return false; // Animation not complete
            }
        });

        // Show message
        this.showMessage(`${user.name} uses ${ability.name}!`);
    }

    /**
     * Shows an item animation
     * @param {Character} user - The character using the item
     * @param {Character} target - The target character
     * @param {Item} item - The item used
     */
    showItemAnimation(user, target, item) {
        // Create animation container
        const animation = new PIXI.Container();
        this.container.addChild(animation);

        // Determine positions
        const centerX = 400;
        const centerY = 300;
        const targetX = this.combatManager.playerParty.includes(target) ? 150 : 650;
        const targetY = this.combatManager.playerParty.includes(target) ? 400 : 200;

        // Create item effect
        const effect = new PIXI.Graphics();

        // Different effects based on item type
        if (item.type === 'potion') {
            effect.beginFill(0x00FF00);
            effect.drawCircle(0, 0, 15);
            effect.endFill();
        } else {
            effect.beginFill(0xFFFF00);
            effect.drawRect(-10, -10, 20, 20);
            effect.endFill();
        }

        effect.position.set(centerX, centerY);
        animation.addChild(effect);

        // Animation properties
        const duration = 1000; // ms
        const startTime = Date.now();

        // Add to animations
        this.animations.push({
            container: animation,
            update: () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);

                if (progress < 0.5) {
                    // First half: grow
                    const scale = 1 + progress * 2;
                    effect.scale.set(scale);
                    effect.alpha = 1;
                } else {
                    // Second half: move to target and shrink
                    const p = (progress - 0.5) * 2; // 0 to 1
                    effect.x = centerX + (targetX - centerX) * p;
                    effect.y = centerY + (targetY - centerY) * p;
                    effect.scale.set(2 - p);
                }

                // Remove animation when complete
                if (progress >= 1) {
                    // Flash target
                    if (target.sprite) {
                        target.sprite.alpha = 0.5;
                        setTimeout(() => {
                            if (target.sprite) {
                                target.sprite.alpha = 1;
                            }
                        }, 200);
                    }

                    // Remove animation
                    this.container.removeChild(animation);
                    return true; // Animation complete
                }

                return false; // Animation not complete
            }
        });

        // Show message
        this.showMessage(`${user.name} uses ${item.name}!`);
    }

    /**
     * Shows a message with cyberpunk glitch effects
     * @param {string} text - Message text
     * @param {number} duration - Message duration in ms (default: calculated based on text length)
     */
    showMessage(text, duration = null) {
        console.log(`Combat message: ${text}`);

        // Calculate appropriate duration based on message length if not specified
        if (duration === null) {
            // Base duration plus additional time per character
            const calculatedDuration = this.messageDisplayTime + (text.length * this.readingTimePerChar);
            // Ensure it's at least the minimum reading time
            duration = Math.max(calculatedDuration, this.minReadingTime);
            console.log(`Calculated message duration: ${duration}ms for ${text.length} characters`);
        }

        // Add message to queue with typing effect
        this.messages.push({
            text,
            displayText: '', // Start with empty text for typing effect
            fullText: text, // Store the full text
            duration,
            startTime: Date.now(),
            lastTypingUpdate: Date.now(),
            typingSpeed: 20, // Faster typing speed (was 30ms per character)
            typingIndex: 0,
            // Ensure typing completes in a reasonable time for longer messages
            maxTypingTime: Math.min(1000, duration * 0.3), // Max 1 second or 30% of duration for typing
            glitchTime: Date.now() + Math.random() * 300, // Random time for glitch effect
            glitchDuration: 150 + Math.random() * 100 // Random duration for glitch
        });

        // Update message display
        this.updateMessageDisplay();

        // Get message area and ensure it's visible
        const messageArea = this.elements.get('messageArea');
        const messageBg = this.elements.get('messageBg');

        if (messageArea && messageBg) {
            // Make sure the message area is on top
            messageArea.zIndex = 1000;
            this.container.sortChildren();

            // Add a cyberpunk-style animation
            messageArea.scale.set(1.1);

            // Flash the border with neon color
            const originalColor = 0x00AAFF;
            const flashColor = 0x00FFFF;

            // Flash border
            messageBg.tint = flashColor;

            // Create a sequence of animations
            setTimeout(() => {
                messageArea.scale.set(1.0);
                messageBg.tint = originalColor;

                // Add random glitch offsets
                const glitchContainer = messageArea.children[2]; // The glitch container
                if (glitchContainer) {
                    const glitchSequence = () => {
                        // Random glitch positions
                        const offsetX = (Math.random() * 6) - 3;
                        const offsetY = (Math.random() * 4) - 2;

                        glitchContainer.position.set(offsetX, offsetY);

                        // Reset after a short time
                        setTimeout(() => {
                            glitchContainer.position.set(0, 0);
                        }, 50 + Math.random() * 50);
                    };

                    // Run glitch effect a few times
                    glitchSequence();
                    setTimeout(glitchSequence, 100 + Math.random() * 100);
                    setTimeout(glitchSequence, 300 + Math.random() * 200);
                }
            }, 100);
        }
    }

    /**
     * Updates the message display with cyberpunk effects
     * @private
     */
    updateMessageDisplay() {
        // Get message elements
        const messageText = this.elements.get('messageText');
        const shadowText = this.elements.get('shadowText');
        const messageArea = this.elements.get('messageArea');
        const scanlines = this.elements.get('scanlines');
        if (!messageText || !messageArea || !shadowText) return;

        // Get current message
        const currentMessage = this.messages[0];

        if (currentMessage) {
            // Handle typing effect
            const now = Date.now();

            // Check if we need to update the typing effect
            if (currentMessage.typingIndex < currentMessage.fullText.length) {
                // Calculate elapsed time since message started
                const typingElapsed = now - currentMessage.startTime;

                // Check if we need to speed up typing to meet maxTypingTime
                if (typingElapsed > currentMessage.maxTypingTime) {
                    // We've exceeded max typing time, complete the text immediately
                    currentMessage.typingIndex = currentMessage.fullText.length;
                    currentMessage.displayText = currentMessage.fullText;
                    console.log('Typing accelerated to complete text');
                }
                // Normal typing speed
                else if (now - currentMessage.lastTypingUpdate > currentMessage.typingSpeed) {
                    // Add the next character
                    currentMessage.typingIndex++;
                    currentMessage.displayText = currentMessage.fullText.substring(0, currentMessage.typingIndex);
                    currentMessage.lastTypingUpdate = now;
                }
            }

            // Show message with current typing progress
            messageText.text = currentMessage.displayText || '';
            shadowText.text = currentMessage.displayText || '';

            // Calculate how long the message has been displayed
            const elapsed = now - currentMessage.startTime;

            // Fade in during the first 200ms
            if (elapsed < 200) {
                const fadeInProgress = elapsed / 200;
                messageArea.alpha = fadeInProgress;

                // Add digital transition effect during fade-in
                const digitizeProgress = 1 - fadeInProgress;
                if (digitizeProgress > 0) {
                    // Replace some characters with digital noise during fade-in
                    const originalText = currentMessage.displayText;
                    let digitizedText = '';
                    for (let i = 0; i < originalText.length; i++) {
                        if (Math.random() < digitizeProgress * 0.5) {
                            // Replace with a random character
                            const chars = '01_!@#$%^&*()-=+[]{}|;:,.<>/?';
                            digitizedText += chars.charAt(Math.floor(Math.random() * chars.length));
                        } else {
                            digitizedText += originalText.charAt(i);
                        }
                    }
                    messageText.text = digitizedText;
                }
            }
            // Fade out during the last 800ms (increased from 500ms)
            else if (elapsed > currentMessage.duration - 800) {
                const fadeOutProgress = (currentMessage.duration - elapsed) / 800;
                messageArea.alpha = Math.max(0, fadeOutProgress);

                // Add digital breakdown effect during fade-out
                const breakdownProgress = 1 - fadeOutProgress;
                if (breakdownProgress > 0.3) {
                    // Replace some characters with digital noise during fade-out
                    const originalText = currentMessage.displayText;
                    let digitizedText = '';
                    for (let i = 0; i < originalText.length; i++) {
                        if (Math.random() < breakdownProgress * 0.7) {
                            // Replace with a random character
                            const chars = '01_!@#$%^&*()-=+[]{}|;:,.<>/?';
                            digitizedText += chars.charAt(Math.floor(Math.random() * chars.length));
                        } else {
                            digitizedText += originalText.charAt(i);
                        }
                    }
                    messageText.text = digitizedText;
                }
            }
            // Full opacity in the middle with occasional glitch effects
            else {
                messageArea.alpha = 1;

                // Check if it's time for a glitch effect
                if (currentMessage.glitchTime && now >= currentMessage.glitchTime &&
                    now <= currentMessage.glitchTime + currentMessage.glitchDuration) {

                    // Apply glitch effect to shadow text
                    shadowText.position.set(
                        2 + (Math.random() * 6 - 3),
                        2 + (Math.random() * 4 - 2)
                    );

                    // Occasionally apply color shift
                    if (Math.random() < 0.3) {
                        messageText.style.fill = 0xFF00FF; // Magenta
                        shadowText.style.fill = 0x00FFFF; // Cyan
                    }

                    // Occasionally apply text distortion
                    if (Math.random() < 0.2) {
                        const originalText = currentMessage.displayText;
                        let glitchedText = '';
                        for (let i = 0; i < originalText.length; i++) {
                            if (Math.random() < 0.1) {
                                // Replace with a glitch character
                                const chars = '!@#$%^&*()-=+[]{}|;:,.<>/?';
                                glitchedText += chars.charAt(Math.floor(Math.random() * chars.length));
                            } else {
                                glitchedText += originalText.charAt(i);
                            }
                        }
                        messageText.text = glitchedText;
                    }
                } else {
                    // Reset to normal state
                    shadowText.position.set(2, 2);
                    messageText.style.fill = 0x00FFFF; // Cyan
                    shadowText.style.fill = 0xFF00FF; // Magenta

                    // Schedule next glitch if needed
                    if (!currentMessage.nextGlitchTime || now > currentMessage.nextGlitchTime) {
                        currentMessage.glitchTime = now + 500 + Math.random() * 1000;
                        currentMessage.glitchDuration = 100 + Math.random() * 150;
                        currentMessage.nextGlitchTime = currentMessage.glitchTime + currentMessage.glitchDuration + 500;
                    }
                }

                // Animate scanlines
                if (scanlines) {
                    scanlines.position.y = (now % 40) / 10;
                }
            }
        } else {
            // No messages, hide message area
            messageArea.alpha = 0;
        }
    }

    /**
     * Shows rewards after combat
     * @param {number} exp - Experience gained
     * @param {number} gold - Gold gained
     */
    showRewards(exp, gold) {
        // Create rewards container
        const rewardsContainer = new PIXI.Container();
        rewardsContainer.position.set(400, 300);
        this.container.addChild(rewardsContainer);

        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(0x333333, 0.9);
        background.lineStyle(2, 0xFFD700);
        background.drawRoundedRect(-150, -100, 300, 200, 10);
        background.endFill();
        rewardsContainer.addChild(background);

        // Create title
        const title = new PIXI.Text('Victory!', {
            fontFamily: 'Arial',
            fontSize: 32,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        title.anchor.set(0.5);
        title.position.set(0, -70);
        rewardsContainer.addChild(title);

        // Create rewards text
        const expText = new PIXI.Text(`Experience: ${exp}`, {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF
        });
        expText.anchor.set(0.5);
        expText.position.set(0, -20);
        rewardsContainer.addChild(expText);

        const goldText = new PIXI.Text(`Gold: ${gold}`, {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFD700
        });
        goldText.anchor.set(0.5);
        goldText.position.set(0, 10);
        rewardsContainer.addChild(goldText);

        // Create continue button
        const continueButton = this.ui.createButton('Continue', () => {
            this.container.removeChild(rewardsContainer);
        }, {
            width: 120,
            height: 40
        });
        continueButton.position.set(-60, 50);
        rewardsContainer.addChild(continueButton);

        // Store reference
        this.elements.set('rewardsContainer', rewardsContainer);
    }

    /**
     * Updates the turn indicator
     * @param {Character} actor - Current turn actor
     * @param {number} turn - Current turn number
     */
    updateTurnIndicator(actor, turn) {
        console.log(`Updating turn indicator: Turn ${turn}, Actor: ${actor?.name || 'unknown'}`);

        // Get turn text element
        const turnText = this.elements.get('turnText');
        if (turnText) {
            turnText.text = `Turn ${turn}`;
        }

        // Get actor text element
        const actorText = this.elements.get('actorText');
        if (actorText) {
            const isPlayerTurn = this.combatManager.playerParty.includes(actor);
            actorText.text = isPlayerTurn ? 'Your Turn' : `${actor?.name || 'Enemy'}'s Turn`;
            actorText.style.fill = isPlayerTurn ? 0x00AAFF : 0xFF0000;
        }

        // Enable/disable action buttons
        const actionButtons = [
            this.elements.get('attackButton'),
            this.elements.get('abilityButton'),
            this.elements.get('itemButton'),
            this.elements.get('escapeButton')
        ];

        const isPlayerTurn = this.combatManager.playerParty.includes(actor);
        console.log(`Is player turn: ${isPlayerTurn}`);

        actionButtons.forEach(button => {
            if (button) {
                if (isPlayerTurn) {
                    button.enable();
                } else {
                    button.disable();
                }
            } else {
                console.warn('Button not found in elements map');
            }
        });
    }

    /**
     * Updates the health bars
     */
    updateHealthBars() {
        // Update player health bar
        const playerHealthBar = this.elements.get('playerHealthBar');
        const player = this.combatManager.playerParty[0];

        if (playerHealthBar && player) {
            playerHealthBar.update(player.health, player.maxHealth);
        }

        // Update enemy health bar
        const enemyHealthBar = this.elements.get('enemyHealthBar');
        const enemy = this.combatManager.enemyParty[0];

        if (enemyHealthBar && enemy) {
            enemyHealthBar.update(enemy.health, enemy.maxHealth);
        }
    }

    /**
     * Updates the energy bars
     */
    updateEnergyBars() {
        // Update player energy bar
        const playerEnergyBar = this.elements.get('playerEnergyBar');
        const player = this.combatManager.playerParty[0];

        if (playerEnergyBar && player) {
            playerEnergyBar.update(player.energy, player.maxEnergy);
        }
    }

    /**
     * Updates the combat UI
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update animations
        this.animations = this.animations.filter(animation => {
            return !animation.update();
        });

        // Update messages
        const now = Date.now();

        // Check if we need to add a delay between messages
        if (this.messages.length > 1) {
            const currentMessage = this.messages[0];
            const nextMessage = this.messages[1];

            // If the current message is about to expire, add a small delay before showing the next one
            const timeRemaining = (currentMessage.startTime + currentMessage.duration) - now;
            if (timeRemaining < 500 && !nextMessage.delayApplied) {
                // Add a small delay to the next message to prevent overlap
                nextMessage.startTime = now + 500; // 500ms delay between messages
                nextMessage.delayApplied = true;
                console.log('Added delay between messages');
            }
        }

        // Remove expired messages
        while (this.messages.length > 0 && now - this.messages[0].startTime > this.messages[0].duration) {
            this.messages.shift();
        }

        // Always update message display to handle fade effects
        this.updateMessageDisplay();

        // Ensure buttons are properly enabled/disabled based on current turn
        if (this.combatManager && this.combatManager.currentTurnActor) {
            const actionButtons = [
                this.elements.get('attackButton'),
                this.elements.get('abilityButton'),
                this.elements.get('itemButton'),
                this.elements.get('escapeButton')
            ];

            const isPlayerTurn = this.combatManager.playerParty.includes(this.combatManager.currentTurnActor);

            actionButtons.forEach(button => {
                if (button) {
                    if (isPlayerTurn && button.enabled === false) {
                        button.enable();
                    } else if (!isPlayerTurn && button.enabled !== false) {
                        button.disable();
                    }
                }
            });
        }
    }

    /**
     * Resizes the combat UI
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Resize background
        const background = this.elements.get('background');
        if (background) {
            background.clear();
            // Only draw the panel background, not a full-screen overlay
            background.beginFill(0x000811, 0.92);
            background.drawRect(this.panelX, 0, this.panelWidth, height);
            background.endFill();

            // Reposition message area to center of screen
            const messageArea = this.elements.get('messageArea');
            if (messageArea) {
                messageArea.position.set(width / 2, 50);
            }

            // Redraw grid pattern
            const gridSpacing = 20;
            const gridAlpha = 0.1;
            background.lineStyle(1, 0x00AAFF, gridAlpha);

            // Vertical lines
            for (let x = 0; x <= this.panelWidth; x += gridSpacing) {
                background.moveTo(this.panelX + x, 0);
                background.lineTo(this.panelX + x, height);
            }

            // Horizontal lines
            for (let y = 0; y <= height; y += gridSpacing) {
                background.moveTo(this.panelX, y);
                background.lineTo(this.panelX + this.panelWidth, y);
            }
        }

        // Center message area
        const messageArea = this.elements.get('messageArea');
        if (messageArea) {
            messageArea.position.set(this.panelX + 150, 100);
        }

        // Center turn indicator
        const turnIndicator = this.elements.get('turnIndicator');
        if (turnIndicator) {
            turnIndicator.position.set(this.panelX + 150, 50);
        }
    }
}
