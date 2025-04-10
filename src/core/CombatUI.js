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

        // Make container interactive to capture all events
        this.container.interactive = true;
        this.container.eventMode = 'static';  // Use static mode to ensure it captures all events
        this.container.sortableChildren = true; // Enable z-index sorting
        this.container.zIndex = 1000; // Ensure combat UI is above game world
        
        // Create full-screen hit area to catch all events
        const hitArea = new PIXI.Graphics();
        hitArea.beginFill(0x000000, 0.01); // Nearly transparent
        hitArea.drawRect(0, 0, 800, 600);  // Full screen size
        hitArea.endFill();
        hitArea.eventMode = 'static';
        hitArea.cursor = 'default';
        this.container.addChild(hitArea);

        // Block all types of events from reaching game world
        const blockEvent = e => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        };
        this.container.on('pointerdown', blockEvent);
        this.container.on('pointermove', blockEvent);
        this.container.on('pointerup', blockEvent);
        this.container.on('click', blockEvent);
        this.container.on('mousedown', blockEvent);
        this.container.on('mousemove', blockEvent);
        this.container.on('mouseup', blockEvent);
        this.container.on('tap', blockEvent);
        this.container.on('touchstart', blockEvent);
        this.container.on('touchmove', blockEvent);
        this.container.on('touchend', blockEvent);

        // UI elements
        this.elements = new Map();

        // Animation properties
        this.animations = [];

        // Message queue
        this.messages = [];
        this.messageDisplayTime = 2000; // 2 seconds

        // Initialize UI
        this.initialize();
    }

    /**
     * Initializes the combat UI
     * @private
     */
    initialize() {
        // Create background
        this.createBackground();

        // Create player area
        this.createPlayerArea();

        // Create enemy area
        this.createEnemyArea();

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
        background.beginFill(0x000000, 0.7);
        background.drawRect(0, 0, 800, 600);
        background.endFill();
        
        // Make background interactive and stop event propagation
        background.interactive = true;
        background.eventMode = 'static';
        background.on('pointerdown', e => e.stopPropagation());
        background.on('pointermove', e => e.stopPropagation());
        background.on('click', e => e.stopPropagation());
        background.on('mousedown', e => e.stopPropagation());
        background.on('mousemove', e => e.stopPropagation());
        
        this.container.addChild(background);
        this.elements.set('background', background);
    }

    /**
     * Creates the player area
     * @private
     */
    createPlayerArea() {
        const playerArea = new PIXI.Container();
        playerArea.position.set(50, 400);
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
        enemyArea.position.set(550, 200);
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
     * Creates the action buttons
     * @private
     */
    createActionButtons() {
        const actionArea = new PIXI.Container();
        actionArea.position.set(50, 500);
        
        // Make action area interactive to block events
        actionArea.interactive = true;
        actionArea.eventMode = 'static';
        actionArea.on('pointerdown', e => e.stopPropagation());
        actionArea.on('pointermove', e => e.stopPropagation());
        actionArea.on('click', e => e.stopPropagation());
        
        this.container.addChild(actionArea);

        // Create attack button
        const attackButton = this.ui.createButton('Attack', () => {
            this.executePlayerAction('attack');
        }, {
            width: 120,
            height: 40
        });
        actionArea.addChild(attackButton);

        // Create ability button
        const abilityButton = this.ui.createButton('Ability', () => {
            this.showAbilityMenu();
        }, {
            width: 120,
            height: 40
        });
        abilityButton.position.set(130, 0);
        actionArea.addChild(abilityButton);

        // Create item button
        const itemButton = this.ui.createButton('Item', () => {
            this.showItemMenu();
        }, {
            width: 120,
            height: 40
        });
        itemButton.position.set(260, 0);
        actionArea.addChild(itemButton);

        // Create escape button
        const escapeButton = this.ui.createButton('Escape', () => {
            this.executePlayerAction('escape');
        }, {
            width: 120,
            height: 40
        });
        escapeButton.position.set(390, 0);
        actionArea.addChild(escapeButton);

        // Store references
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
        messageArea.position.set(400, 100);
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
        turnIndicator.position.set(400, 50);
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
     * Shows the ability menu
     * @private
     */
    showAbilityMenu() {
        // Create fullscreen overlay to catch all events
        const overlay = new PIXI.Container();
        overlay.zIndex = 1001;
        
        // Create overlay hit area
        const overlayHitArea = new PIXI.Graphics();
        overlayHitArea.beginFill(0x000000, 0.01);
        overlayHitArea.drawRect(0, 0, 800, 600);
        overlayHitArea.endFill();
        overlay.addChild(overlayHitArea);
        
        // Block all events on overlay
        overlay.eventMode = 'static';
        overlay.interactive = true;
        const blockEvent = e => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        };
        overlay.on('pointerdown', blockEvent);
        overlay.on('pointermove', blockEvent);
        overlay.on('pointerup', blockEvent);
        overlay.on('click', blockEvent);
        overlay.on('mousedown', blockEvent);
        overlay.on('mousemove', blockEvent);
        overlay.on('mouseup', blockEvent);
        overlay.on('tap', blockEvent);
        overlay.on('touchstart', blockEvent);
        overlay.on('touchmove', blockEvent);
        overlay.on('touchend', blockEvent);
        
        this.container.addChild(overlay);

        // Get player abilities
        const player = this.combatManager.playerParty[0];
        const abilities = player.abilities || [];

        // Create ability menu
        const abilityMenu = new PIXI.Container();
        abilityMenu.position.set(50, 450);
        abilityMenu.zIndex = 1002; // Above overlay
        overlay.addChild(abilityMenu);
        
        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(0x333333, 0.8);
        background.drawRect(0, 0, 400, 150);
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
            const button = this.ui.createButton(ability.name, () => {
                this.executePlayerAction('ability', { ability });
                this.container.removeChild(overlay);
            }, {
                width: 180,
                height: 30
            });

            button.position.set(10, 40 + index * 40);
            abilityMenu.addChild(button);

            // Add description
            const description = new PIXI.Text(ability.description, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xCCCCCC
            });
            description.position.set(200, 45 + index * 40);
            abilityMenu.addChild(description);

            // Add energy cost
            const energyCost = new PIXI.Text(`Energy: ${ability.energyCost}`, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0x00AAFF
            });
            energyCost.position.set(200, 60 + index * 40);
            abilityMenu.addChild(energyCost);

            // Disable if not enough energy
            if (player.energy < ability.energyCost) {
                button.disable();
            }
        });

        // Create back button
        const backButton = this.ui.createButton('Back', () => {
            this.container.removeChild(overlay);
        }, {
            width: 80,
            height: 30
        });
        backButton.position.set(310, 110);
        abilityMenu.addChild(backButton);

        // Store references with overlay
        this.elements.set('abilityMenuOverlay', overlay);
        this.elements.set('abilityMenu', abilityMenu);
    }

    /**
     * Shows the item menu
     * @private
     */
    showItemMenu() {
        // Create fullscreen overlay to catch all events
        const overlay = new PIXI.Container();
        overlay.zIndex = 1001;
        
        // Create overlay hit area
        const overlayHitArea = new PIXI.Graphics();
        overlayHitArea.beginFill(0x000000, 0.01);
        overlayHitArea.drawRect(0, 0, 800, 600);
        overlayHitArea.endFill();
        overlay.addChild(overlayHitArea);
        
        // Block all events on overlay
        overlay.eventMode = 'static';
        overlay.interactive = true;
        const blockEvent = e => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        };
        overlay.on('pointerdown', blockEvent);
        overlay.on('pointermove', blockEvent);
        overlay.on('pointerup', blockEvent);
        overlay.on('click', blockEvent);
        overlay.on('mousedown', blockEvent);
        overlay.on('mousemove', blockEvent);
        overlay.on('mouseup', blockEvent);
        overlay.on('tap', blockEvent);
        overlay.on('touchstart', blockEvent);
        overlay.on('touchmove', blockEvent);
        overlay.on('touchend', blockEvent);
        
        this.container.addChild(overlay);

        // Get player inventory
        const player = this.combatManager.playerParty[0];
        const inventory = player.inventory;

        if (!inventory || inventory.items.length === 0) {
            this.showMessage('No items available!');
            this.container.removeChild(overlay);
            return;
        }

        // Create item menu
        const itemMenu = new PIXI.Container();
        itemMenu.position.set(50, 450);
        itemMenu.zIndex = 1002; // Above overlay
        overlay.addChild(itemMenu);

        // Create background
        const background = new PIXI.Graphics();
        background.beginFill(0x333333, 0.8);
        background.drawRect(0, 0, 400, 150);
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
                this.container.removeChild(overlay);
            }, {
                width: 180,
                height: 30
            });

            button.position.set(10, 40 + index * 40);
            itemMenu.addChild(button);

            // Add description
            const description = new PIXI.Text(item.description || '', {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xCCCCCC
            });
            description.position.set(200, 45 + index * 40);
            itemMenu.addChild(description);
        });

        // Create back button
        const backButton = this.ui.createButton('Back', () => {
            this.container.removeChild(overlay);
        }, {
            width: 80,
            height: 30
        });
        backButton.position.set(310, 110);
        itemMenu.addChild(backButton);

        // Store references with overlay
        this.elements.set('itemMenuOverlay', overlay);
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
            background.beginFill(0x000000, 0.7);
            background.drawRect(0, 0, width, height);
            background.endFill();
        }

        // Center message area
        const messageArea = this.elements.get('messageArea');
        if (messageArea) {
            messageArea.position.set(width / 2, 100);
        }

        // Center turn indicator
        const turnIndicator = this.elements.get('turnIndicator');
        if (turnIndicator) {
            turnIndicator.position.set(width / 2, 50);
        }
    }
}
