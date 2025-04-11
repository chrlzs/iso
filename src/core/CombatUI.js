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

        // Panel dimensions
        this.panelX = this.ui.game.app.screen.width - 300;
        this.panelWidth = 300;
        this.panelHeight = this.ui.game.app.screen.height;
        this.safeAreaBottom = this.panelHeight - 20;

        // Message display time
        this.messageDisplayTime = 2000;

        // Cyberpunk theme
        this.theme = {
            colors: {
                primary: 0x00AAFF,    // Neon blue
                secondary: 0x00FFAA,   // Neon cyan
                dark: 0x000811,       // Dark blue-black
                accent: 0xFF00AA,     // Neon pink
                warning: 0xFFAA00,    // Neon orange
                text: 0xFFFFFF,       // White
                healthBar: 0xFF3366,  // Health bar color
                energyBar: 0x33FFAA   // Energy bar color
            },
            styles: {
                text: {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    fill: 0xFFFFFF,
                    stroke: 0x000811,
                    strokeThickness: 2
                },
                heading: {
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: 0xFFFFFF,
                    stroke: 0x00AAFF,
                    strokeThickness: 3,
                    dropShadow: true,
                    dropShadowColor: 0x00AAFF,
                    dropShadowBlur: 4,
                    dropShadowDistance: 0
                },
                gridPattern: {
                    color: 0x00AAFF,
                    alpha: 0.1,
                    spacing: 20
                }
            }
        };

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

        // Create panel background only (no full-screen overlay)
        const gradient = new PIXI.Graphics();
        gradient.beginFill(0x000811, 0.92); // Panel background with high opacity
        gradient.drawRect(this.panelX, 0, this.panelWidth, this.panelHeight);
        gradient.endFill();
        this.container.addChild(gradient);

        // Add subtle cyberpunk grid pattern
        const gridSpacing = 20;
        const gridAlpha = 0.1;
        background.lineStyle(1, 0x00AAFF, gridAlpha);

        // Vertical lines
        for (let x = 0; x <= this.panelWidth; x += gridSpacing) {
            background.moveTo(this.panelX + x, 0);
            background.lineTo(this.panelX + x, this.panelHeight);
        }

        // Horizontal lines
        for (let y = 0; y <= this.panelHeight; y += gridSpacing) {
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

        // Make background interactive while still allowing see-through
        background.interactive = true;
        background.eventMode = 'static';
        background.hitArea = new PIXI.Rectangle(this.panelX, 0, this.panelWidth, this.panelHeight);

        // Block combat-related events but allow map visibility
        const blockEvent = e => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        };

        background.on('pointerdown', blockEvent);
        background.on('pointermove', blockEvent);
        background.on('pointerup', blockEvent);
        background.on('click', blockEvent);
        background.on('mousedown', blockEvent);
        background.on('mousemove', blockEvent);
        background.on('mouseup', blockEvent);
        background.on('tap', blockEvent);
        background.on('touchstart', blockEvent);
        background.on('touchmove', blockEvent);
        background.on('touchend', blockEvent);
        background.on('rightclick', blockEvent);
        background.on('rightdown', blockEvent);
        background.on('rightup', blockEvent);
        background.on('contextmenu', blockEvent);

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
        actionArea.position.set(this.panelX + 10, this.safeAreaBottom - 220);

        // Button configurations
        const buttonConfig = {
            width: this.panelWidth - 20,
            height: 40,
            spacing: 10
        };

        // Create glowing container for all buttons
        const glowContainer = new PIXI.Container();
        actionArea.addChild(glowContainer);

        // Common button style for cyberpunk theme
        const buttonStyle = {
            fill: 0x000811,
            hoverFill: 0x001122,
            disabledFill: 0x111111,
            borderColor: 0x00AAFF,
            glowColor: 0x00AAFF,
            cornerRadius: 2
        };

        const createCyberpunkButton = (text, onClick, position) => {
            const container = new PIXI.Container();
            container.position.set(0, position);

            // Create angular accents
            const accents = new PIXI.Graphics();
            accents.lineStyle(1, buttonStyle.borderColor, 0.5);
            accents.moveTo(0, 0);
            accents.lineTo(15, 15);
            accents.moveTo(buttonConfig.width, 0);
            accents.lineTo(buttonConfig.width - 15, 15);
            container.addChild(accents);

            // Create button background with border
            const background = new PIXI.Graphics();
            background.lineStyle(1, buttonStyle.borderColor, 0.8);
            background.beginFill(buttonStyle.fill);
            background.drawRect(0, 0, buttonConfig.width, buttonConfig.height);
            background.endFill();
            container.addChild(background);

            // Create text with glow effect
            const textObj = new PIXI.Text(text, {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFFFFFF,
                stroke: buttonStyle.glowColor,
                strokeThickness: 1
            });
            textObj.anchor.set(0.5);
            textObj.position.set(buttonConfig.width / 2, buttonConfig.height / 2);
            container.addChild(textObj);

            // Make interactive
            container.eventMode = 'static';
            container.cursor = 'pointer';
            container.interactive = true;

            // Hover effects
            container.on('mouseover', () => {
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
            });

            container.on('mouseout', () => {
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
            });

            container.on('click', onClick);

            // Add enable/disable methods
            container.enable = () => {
                container.interactive = true;
                container.cursor = 'pointer';
                background.clear();
                background.lineStyle(1, buttonStyle.borderColor, 0.8);
                background.beginFill(buttonStyle.fill);
                background.drawRect(0, 0, buttonConfig.width, buttonConfig.height);
                background.endFill();
                textObj.alpha = 1;
                accents.alpha = 1;
            };

            container.disable = () => {
                container.interactive = false;
                container.cursor = 'default';
                background.clear();
                background.lineStyle(1, buttonStyle.borderColor, 0.3);
                background.beginFill(buttonStyle.disabledFill);
                background.drawRect(0, 0, buttonConfig.width, buttonConfig.height);
                background.endFill();
                textObj.alpha = 0.5;
                accents.alpha = 0.3;
            };

            return container;
        };

        // Create buttons with cyberpunk style
        const attackButton = createCyberpunkButton('ATTACK', () => {
            this.executePlayerAction('attack');
        }, 0);

        const abilityButton = createCyberpunkButton('ABILITY', () => {
            this.showAbilityMenu();
        }, buttonConfig.height + buttonConfig.spacing);

        const itemButton = createCyberpunkButton('ITEM', () => {
            this.showItemMenu();
        }, (buttonConfig.height + buttonConfig.spacing) * 2);

        const escapeButton = createCyberpunkButton('ESCAPE', () => {
            this.executePlayerAction('escape');
        }, (buttonConfig.height + buttonConfig.spacing) * 3);

        // Add buttons to action area
        actionArea.addChild(attackButton);
        actionArea.addChild(abilityButton);
        actionArea.addChild(itemButton);
        actionArea.addChild(escapeButton);

        this.container.addChild(actionArea);
        this.elements.set('actionArea', actionArea);
        this.elements.set('attackButton', attackButton);
        this.elements.set('abilityButton', abilityButton);
        this.elements.set('itemButton', itemButton);
        this.elements.set('escapeButton', escapeButton);
    }

    /**
     * Creates the message area
     * @private
     */
    createMessageArea() {
        const messageArea = new PIXI.Container();
        messageArea.position.set(this.panelX + 150, 100);
        this.container.addChild(messageArea);

        // Create message text
        const messageText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4,
            align: 'center'
        });
        messageText.anchor.set(0.5);
        messageArea.addChild(messageText);

        // Store references
        this.elements.set('messageArea', messageArea);
        this.elements.set('messageText', messageText);
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
        // Validate that it's the player's turn
        const currentActor = this.combatManager.currentTurnActor;
        if (!currentActor || !this.combatManager.playerParty.includes(currentActor)) {
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
        const success = this.combatManager.executePlayerAction(actionType, {
            ...options,
            target
        });

        // Show error message if action failed
        if (!success) {
            switch (actionType) {
                case 'attack':
                    this.showMessage('Cannot attack right now!');
                    break;
                case 'ability':
                    this.showMessage(options.ability ? 'Not enough energy!' : 'No ability selected!');
                    break;
                case 'item':
                    this.showMessage(options.item ? 'Cannot use that item!' : 'No item selected!');
                    break;
                case 'escape':
                    this.showMessage('Cannot escape right now!');
                    break;
            }
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
     * Shows a message
     * @param {string} text - Message text
     * @param {number} duration - Message duration in ms (default: 2000)
     */
    showMessage(text, duration = this.messageDisplayTime) {
        // Add message to queue
        this.messages.push({
            text,
            duration,
            startTime: Date.now()
        });

        // Update message display
        this.updateMessageDisplay();
    }

    /**
     * Updates the message display
     * @private
     */
    updateMessageDisplay() {
        // Get message text element
        const messageText = this.elements.get('messageText');
        if (!messageText) return;

        // Get current message
        const currentMessage = this.messages[0];

        if (currentMessage) {
            // Show message
            messageText.text = currentMessage.text;
            messageText.alpha = 1;
        } else {
            // No messages, hide text
            messageText.alpha = 0;
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
        // Get turn text element
        const turnText = this.elements.get('turnText');
        if (turnText) {
            turnText.text = `Turn ${turn}`;
        }

        // Get actor text element
        const actorText = this.elements.get('actorText');
        if (actorText) {
            const isPlayerTurn = this.combatManager.playerParty.includes(actor);
            actorText.text = isPlayerTurn ? 'Your Turn' : `${actor.name}'s Turn`;
            actorText.style.fill = isPlayerTurn ? 0x00AAFF : 0xFF0000;
        }

        // Enable/disable action buttons
        const actionButtons = [
            this.elements.get('attackButton'),
            this.elements.get('abilityButton'),
            this.elements.get('itemButton'),
            this.elements.get('escapeButton')
        ];

        actionButtons.forEach(button => {
            if (button) {
                if (this.combatManager.playerParty.includes(actor)) {
                    button.enable();
                } else {
                    button.disable();
                }
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

        // Remove expired messages
        while (this.messages.length > 0 && now - this.messages[0].startTime > this.messages[0].duration) {
            this.messages.shift();
            this.updateMessageDisplay();
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
