import { PIXI } from '../../utils/PixiWrapper.js';
import { UIComponent } from '../components/UIComponent.js';
import { Button } from '../components/Button.js';
import { ProgressBar } from '../components/ProgressBar.js';

/**
 * CombatPanel - A panel for displaying combat UI
 */
export class CombatPanel extends UIComponent {
    /**
     * Creates a new combat panel
     * @param {Object} options - Panel options
     */
    constructor(options = {}) {
        super({
            id: 'combat',
            interactive: true,
            eventMode: 'static',
            ...options
        });

        // Make sure this panel captures all events
        this.interactiveChildren = true;

        // Combat manager reference
        this.combatManager = options.combatManager || null;
        this.game = options.game || null;

        // Set dimensions to full screen
        if (this.game && this.game.app) {
            this.width = this.game.app.screen.width;
            this.height = this.game.app.screen.height;

            // Log the screen dimensions
            console.log(`Screen dimensions: ${this.width}x${this.height}`);
        } else {
            this.width = options.width || 800;
            this.height = options.height || 600;
        }

        // Make sure the panel covers the entire screen
        this.x = 0;
        this.y = 0;

        // Create hit area to capture all events
        this.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);

        // Enable sorting of children by zIndex
        this.sortableChildren = true;

        // Create the combat UI
        this.createCombatUI();
    }

    /**
     * Creates the combat UI
     * @private
     */
    createCombatUI() {
        // Create semi-transparent overlay
        this.overlay = new PIXI.Graphics();
        this.overlay.beginFill(0x000000, 0.5); // Semi-transparent overlay
        this.overlay.drawRect(0, 0, this.width, this.height);
        this.overlay.endFill();
        this.overlay.zIndex = 1;
        this.addChild(this.overlay);

        // Create combat container
        this.combatContainer = new PIXI.Container();
        this.combatContainer.zIndex = 10;
        this.addChild(this.combatContainer);

        // Create a compact combat panel on the right side
        const panelWidth = 300;
        const panelHeight = this.height - 40;
        const panelX = this.width - panelWidth - 20;
        const panelY = 20;

        // Create panel background
        const panelBg = new PIXI.Graphics();
        panelBg.beginFill(0x000000, 0.7);
        panelBg.lineStyle(2, 0x00AAFF, 0.8);
        panelBg.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panelBg.endFill();

        // Add highlight line at the top
        panelBg.lineStyle(1, 0xFFFFFF, 0.3);
        panelBg.moveTo(panelX + 10, panelY + 2);
        panelBg.lineTo(panelX + panelWidth - 10, panelY + 2);

        this.combatContainer.addChild(panelBg);

        // Create enemy container at the top of the panel
        this.enemyContainer = new PIXI.Container();
        this.enemyContainer.position.set(panelX + 20, panelY + 60);

        // Add enemy container background
        const enemyBg = new PIXI.Graphics();
        enemyBg.beginFill(0x330000, 0.4);
        enemyBg.lineStyle(1, 0xFF00AA, 0.5);
        enemyBg.drawRoundedRect(-10, -10, panelWidth - 40, 120, 5);
        enemyBg.endFill();
        this.enemyContainer.addChild(enemyBg);

        this.combatContainer.addChild(this.enemyContainer);

        // Create player container in the middle of the panel
        this.playerContainer = new PIXI.Container();
        this.playerContainer.position.set(panelX + 20, panelY + 200);

        // Add player container background
        const playerBg = new PIXI.Graphics();
        playerBg.beginFill(0x000033, 0.4);
        playerBg.lineStyle(1, 0x00AAFF, 0.5);
        playerBg.drawRoundedRect(-10, -10, panelWidth - 40, 120, 5);
        playerBg.endFill();
        this.playerContainer.addChild(playerBg);

        this.combatContainer.addChild(this.playerContainer);

        // Create action container at the bottom of the panel
        this.actionContainer = new PIXI.Container();
        this.actionContainer.position.set(panelX + 20, panelY + panelHeight - 180);

        // Add action container background
        const actionBg = new PIXI.Graphics();
        actionBg.beginFill(0x001122, 0.4);
        actionBg.lineStyle(1, 0x00FFAA, 0.5);
        actionBg.drawRoundedRect(-10, -10, panelWidth - 40, 150, 5);
        actionBg.endFill();
        this.actionContainer.addChild(actionBg);

        this.combatContainer.addChild(this.actionContainer);

        // Create message container at the top of the screen
        this.messageContainer = new PIXI.Container();
        this.messageContainer.position.set(20, 20);
        this.combatContainer.addChild(this.messageContainer);

        // Get panel dimensions for positioning
        // Use the same panel dimensions as defined earlier
        const panelX = this.width - 300 - 20;
        const panelY = 20;

        // Create turn indicator
        this.turnIndicator = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3,
            align: 'center'
        });
        // Position at the top of the panel
        this.turnIndicator.position.set(panelX + 150, panelY + 20); // 300/2 = 150
        this.turnIndicator.anchor.set(0.5, 0);

        // Add a background to the turn indicator for better visibility
        this.turnIndicatorBg = new PIXI.Graphics();
        this.turnIndicatorBg.beginFill(0x000000, 0.5);
        this.turnIndicatorBg.drawRoundedRect(-10, -10, 20, 20, 5); // Will be resized in updateTurnIndicator
        this.turnIndicatorBg.endFill();
        this.combatContainer.addChild(this.turnIndicatorBg);
        this.combatContainer.addChild(this.turnIndicator);

        // Create action buttons
        this.createActionButtons();
    }

    /**
     * Creates action buttons
     * @private
     */
    createActionButtons() {
        this.actionButtons = [];

        // Get panel dimensions for button sizing
        const panelWidth = 300;
        const buttonWidth = (panelWidth - 60) / 2; // Two buttons per row with margins

        // Make sure action container is interactive
        this.actionContainer.interactive = true;
        this.actionContainer.eventMode = 'static';
        this.actionContainer.interactiveChildren = true;

        // Add a title for the actions section
        const actionsTitle = new PIXI.Text('ACTIONS', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00FFAA,
            stroke: 0x000000,
            strokeThickness: 2,
            align: 'center'
        });
        actionsTitle.position.set(buttonWidth, 0);
        actionsTitle.anchor.set(0.5, 0);
        this.actionContainer.addChild(actionsTitle);

        // Attack button
        const attackButton = new Button({
            text: 'ATTACK',
            width: buttonWidth,
            height: 40,
            x: 0,
            y: 30,
            onClick: () => {
                console.log('Attack button clicked');
                this.handleAttack();
            }
        });
        this.actionContainer.addChild(attackButton);
        this.actionButtons.push(attackButton);

        // Ability button
        const abilityButton = new Button({
            text: 'ABILITIES',
            width: buttonWidth,
            height: 40,
            x: buttonWidth + 20,
            y: 30,
            onClick: () => {
                console.log('Abilities button clicked');
                this.handleAbilities();
            }
        });
        this.actionContainer.addChild(abilityButton);
        this.actionButtons.push(abilityButton);

        // Item button
        const itemButton = new Button({
            text: 'ITEMS',
            width: buttonWidth,
            height: 40,
            x: 0,
            y: 80,
            onClick: () => {
                console.log('Items button clicked');
                this.handleItems();
            }
        });
        this.actionContainer.addChild(itemButton);
        this.actionButtons.push(itemButton);

        // Escape button
        const escapeButton = new Button({
            text: 'ESCAPE',
            width: buttonWidth,
            height: 40,
            x: buttonWidth + 20,
            y: 80,
            onClick: () => {
                console.log('Escape button clicked');
                this.handleEscape();
            }
        });
        this.actionContainer.addChild(escapeButton);
        this.actionButtons.push(escapeButton);

        // Make sure all buttons are properly interactive
        this.actionButtons.forEach(button => {
            button.interactive = true;
            button.eventMode = 'static';
            button.cursor = 'pointer';

            // Add direct event listeners for debugging
            button.on('click', () => console.log(`Direct click on ${button.text} button`));
            button.on('tap', () => console.log(`Direct tap on ${button.text} button`));
            button.on('pointertap', () => console.log(`Direct pointertap on ${button.text} button`));
        });
    }

    /**
     * Updates the combat UI
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.combatManager) return;

        // Update turn indicator
        this.updateTurnIndicator();

        // Update player and enemy displays
        this.updateCombatants();

        // Update action buttons based on current turn
        this.updateActionButtons();
    }

    /**
     * Updates the turn indicator
     */
    updateTurnIndicator() {
        if (!this.combatManager) return;

        const currentActor = this.combatManager.currentTurnActor;
        const turn = this.combatManager.combatTurn;

        if (currentActor) {
            const isPlayer = this.combatManager.playerParty.includes(currentActor);
            const color = isPlayer ? '#00FFFF' : '#FF00AA';

            this.turnIndicator.text = `TURN ${turn} - ${currentActor.name}'s Turn`;
            this.turnIndicator.style.fill = color;

            // Enable/disable action buttons based on whose turn it is
            this.actionButtons.forEach(button => {
                if (isPlayer) {
                    button.enable();
                } else {
                    button.disable();
                }
            });
        } else {
            this.turnIndicator.text = `TURN ${turn}`;
            this.turnIndicator.style.fill = 0xFFFFFF;
        }

        // Update the background to match the text size
        const padding = 10;
        const width = this.turnIndicator.width + padding * 2;
        const height = this.turnIndicator.height + padding * 2;

        this.turnIndicatorBg.clear();
        this.turnIndicatorBg.beginFill(0x000000, 0.7);
        this.turnIndicatorBg.drawRoundedRect(
            this.turnIndicator.x - width / 2,
            this.turnIndicator.y - padding,
            width,
            height,
            5
        );
        this.turnIndicatorBg.endFill();

        // Make sure the background is behind the text
        this.turnIndicatorBg.zIndex = 5;
        this.turnIndicator.zIndex = 6;
    }

    /**
     * Updates the combatants display
     */
    updateCombatants() {
        if (!this.combatManager) return;

        // Clear containers
        while (this.playerContainer.children.length > 0) {
            this.playerContainer.removeChildAt(0);
        }

        while (this.enemyContainer.children.length > 0) {
            this.enemyContainer.removeChildAt(0);
        }

        // Update player party
        this.combatManager.playerParty.forEach((player, index) => {
            const playerDisplay = this.createCombatantDisplay(player);
            playerDisplay.position.set(0, index * 80);
            this.playerContainer.addChild(playerDisplay);
        });

        // Update enemy party
        this.combatManager.enemyParty.forEach((enemy, index) => {
            const enemyDisplay = this.createCombatantDisplay(enemy);
            enemyDisplay.position.set(0, index * 80);
            this.enemyContainer.addChild(enemyDisplay);
        });
    }

    /**
     * Creates a display for a combatant
     * @param {Character} combatant - The combatant to display
     * @returns {PIXI.Container} The combatant display container
     * @private
     */
    createCombatantDisplay(combatant) {
        const container = new PIXI.Container();

        // Get panel dimensions for sizing
        const panelWidth = 300;
        const barWidth = panelWidth - 80;

        // Create name text
        const nameText = new PIXI.Text(combatant.name, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 2
        });
        container.addChild(nameText);

        // Create health bar
        const healthBar = new ProgressBar({
            width: barWidth,
            height: 12,
            x: 0,
            y: 25,
            value: combatant.health,
            maxValue: combatant.maxHealth,
            color: this.colors.healthBar,
            showText: true,
            textFormat: (value, max) => `${Math.floor(value)}/${max}`
        });
        container.addChild(healthBar);

        // Create health label
        const healthLabel = new PIXI.Text('HP:', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 1
        });
        healthLabel.position.set(-30, 25);
        container.addChild(healthLabel);

        // Create energy bar
        const energyBar = new ProgressBar({
            width: barWidth,
            height: 12,
            x: 0,
            y: 45,
            value: combatant.energy,
            maxValue: combatant.maxEnergy,
            color: this.colors.energyBar,
            showText: true,
            textFormat: (value, max) => `${Math.floor(value)}/${max}`
        });
        container.addChild(energyBar);

        // Create energy label
        const energyLabel = new PIXI.Text('EP:', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 1
        });
        energyLabel.position.set(-30, 45);
        container.addChild(energyLabel);

        // Highlight current turn actor
        if (this.combatManager.currentTurnActor === combatant) {
            const highlight = new PIXI.Graphics();
            highlight.lineStyle(2, 0xFFFF00, 0.8);
            highlight.drawRect(-35, -5, barWidth + 40, 70);
            container.addChildAt(highlight, 0);
        }

        return container;
    }

    /**
     * Updates the action buttons
     */
    updateActionButtons() {
        if (!this.combatManager) return;

        const isPlayerTurn = this.combatManager.playerParty.includes(this.combatManager.currentTurnActor);

        this.actionButtons.forEach(button => {
            if (isPlayerTurn) {
                button.enable();
            } else {
                button.disable();
            }
        });
    }

    /**
     * Handles attack action
     * @private
     */
    handleAttack() {
        if (!this.combatManager) {
            console.error('No combat manager available');
            return;
        }

        console.log('Attack button handler called');

        // Check if it's the player's turn
        const currentActor = this.combatManager.currentTurnActor;
        const isPlayerTurn = this.combatManager.playerParty.includes(currentActor);

        if (!isPlayerTurn) {
            console.log('Not player\'s turn, cannot attack');
            return;
        }

        console.log('Showing enemy selection UI for attack');

        // Show enemy selection UI
        this.showEnemySelection((target) => {
            console.log(`Executing attack on ${target.name}`);

            // Execute attack
            if (this.combatManager.executePlayerAction('attack', { target })) {
                console.log('Attack executed successfully');
            } else {
                console.error('Failed to execute attack');
            }
        });
    }

    /**
     * Handles abilities action
     * @private
     */
    handleAbilities() {
        if (!this.combatManager) {
            console.error('No combat manager available');
            return;
        }

        console.log('Abilities button handler called');

        // Check if it's the player's turn
        const currentActor = this.combatManager.currentTurnActor;
        const isPlayerTurn = this.combatManager.playerParty.includes(currentActor);

        if (!isPlayerTurn) {
            console.log('Not player\'s turn, cannot use abilities');
            return;
        }

        // Show abilities UI
        this.showMessage('Abilities not implemented yet', 3000);
    }

    /**
     * Handles items action
     * @private
     */
    handleItems() {
        if (!this.combatManager) {
            console.error('No combat manager available');
            return;
        }

        console.log('Items button handler called');

        // Check if it's the player's turn
        const currentActor = this.combatManager.currentTurnActor;
        const isPlayerTurn = this.combatManager.playerParty.includes(currentActor);

        if (!isPlayerTurn) {
            console.log('Not player\'s turn, cannot use items');
            return;
        }

        // Show items UI
        this.showMessage('Items not implemented yet', 3000);
    }

    /**
     * Handles escape action
     * @private
     */
    handleEscape() {
        if (!this.combatManager) {
            console.error('No combat manager available');
            return;
        }

        console.log('Escape button handler called');

        // Check if it's the player's turn
        const currentActor = this.combatManager.currentTurnActor;
        const isPlayerTurn = this.combatManager.playerParty.includes(currentActor);

        if (!isPlayerTurn) {
            console.log('Not player\'s turn, cannot escape');
            return;
        }

        console.log('Attempting to escape');

        // Attempt to escape using the player action system
        if (this.combatManager.executePlayerAction('escape')) {
            console.log('Escape action executed');
        } else {
            console.error('Failed to execute escape action');
        }
    }

    /**
     * Shows enemy selection UI
     * @param {Function} callback - Callback function when an enemy is selected
     * @private
     */
    showEnemySelection(callback) {
        if (!this.combatManager) return;

        console.log('Showing enemy selection UI');

        // Use the standard panel dimensions
        const panelWidth = 300;
        const panelX = this.width - panelWidth - 20;
        const panelY = 20;

        // Create selection container
        const selectionContainer = new PIXI.Container();
        selectionContainer.zIndex = 100;
        selectionContainer.interactive = true;
        selectionContainer.eventMode = 'static';
        selectionContainer.interactiveChildren = true;
        this.addChild(selectionContainer);

        // Create selection background
        const selectionBg = new PIXI.Graphics();
        selectionBg.beginFill(0x000000, 0.8);
        selectionBg.lineStyle(2, 0xFF00AA, 0.8);
        selectionBg.drawRoundedRect(panelX - 20, panelY + 150, panelWidth + 40, 300, 10);
        selectionBg.endFill();
        selectionContainer.addChild(selectionBg);

        // Create selection prompt
        const prompt = new PIXI.Text('SELECT TARGET:', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFF00AA,
            stroke: 0x000000,
            strokeThickness: 3
        });
        prompt.position.set(panelX + panelWidth / 2, panelY + 170);
        prompt.anchor.set(0.5, 0);
        selectionContainer.addChild(prompt);

        // Create enemy buttons
        const enemies = this.combatManager.enemyParty;
        console.log(`Creating buttons for ${enemies.length} enemies`);

        const buttonWidth = panelWidth - 40;

        enemies.forEach((enemy, index) => {
            const button = new Button({
                text: enemy.name,
                width: buttonWidth,
                height: 40,
                x: panelX,
                y: panelY + 210 + index * 50,
                onClick: () => {
                    console.log(`Selected enemy: ${enemy.name}`);
                    // Remove selection UI
                    this.removeChild(selectionContainer);

                    // Call callback with selected enemy
                    callback(enemy);
                }
            });
            selectionContainer.addChild(button);

            // Make sure button is interactive
            button.interactive = true;
            button.eventMode = 'static';
            button.cursor = 'pointer';

            // Add direct event listeners for debugging
            button.on('click', () => console.log(`Direct click on ${enemy.name} button`));
            button.on('tap', () => console.log(`Direct tap on ${enemy.name} button`));
            button.on('pointertap', () => console.log(`Direct pointertap on ${enemy.name} button`));
        });

        // Create cancel button
        const cancelButton = new Button({
            text: 'CANCEL',
            width: buttonWidth,
            height: 40,
            x: panelX,
            y: panelY + 210 + enemies.length * 50,
            onClick: () => {
                console.log('Cancel button clicked');
                // Remove selection UI
                this.removeChild(selectionContainer);
            }
        });
        selectionContainer.addChild(cancelButton);

        // Make sure button is interactive
        cancelButton.interactive = true;
        cancelButton.eventMode = 'static';
        cancelButton.cursor = 'pointer';

        // Add direct event listeners for debugging
        cancelButton.on('click', () => console.log('Direct click on CANCEL button'));
        cancelButton.on('tap', () => console.log('Direct tap on CANCEL button'));
        cancelButton.on('pointertap', () => console.log('Direct pointertap on CANCEL button'));
    }

    /**
     * Shows a message
     * @param {string} text - Message text
     * @param {number} duration - Duration in milliseconds
     * @private
     */
    showMessage(text, duration = 2000) {
        // Clear existing messages
        while (this.messageContainer.children.length > 0) {
            this.messageContainer.removeChildAt(0);
        }

        // Create message background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.7);
        background.drawRect(0, 0, 400, 50);
        background.endFill();
        this.messageContainer.addChild(background);

        // Create message text
        const message = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            align: 'center'
        });
        message.position.set(200, 25);
        message.anchor.set(0.5);
        this.messageContainer.addChild(message);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                // Fade out
                const fadeOut = setInterval(() => {
                    this.messageContainer.alpha -= 0.1;
                    if (this.messageContainer.alpha <= 0) {
                        clearInterval(fadeOut);

                        // Clear messages
                        while (this.messageContainer.children.length > 0) {
                            this.messageContainer.removeChildAt(0);
                        }

                        // Reset alpha
                        this.messageContainer.alpha = 1;
                    }
                }, 50);
            }, duration);
        }
    }

    /**
     * Shows rewards after combat
     * @param {number} exp - Experience points gained
     * @param {number} gold - Gold gained
     */
    showRewards(exp, gold) {
        // Create rewards message
        const message = `Combat Victory!\nEXP: ${exp}\nGold: ${gold}`;

        // Show message with longer duration
        this.showMessage(message, 5000);

        // Also show a notification through the game UI if available
        if (this.game && this.game.ui) {
            this.game.ui.showNotification(`Combat Victory! Gained ${exp} EXP and ${gold} gold.`, {
                type: 'success',
                duration: 8000
            });
        }
    }

    /**
     * Shows the combat panel
     */
    show() {
        console.log('Showing combat panel');
        this.visible = true;

        // Make sure the panel is at the front
        this.zIndex = 1000;

        // Make sure all child containers are visible
        if (this.combatContainer) this.combatContainer.visible = true;
        if (this.playerContainer) this.playerContainer.visible = true;
        if (this.enemyContainer) this.enemyContainer.visible = true;
        if (this.actionContainer) this.actionContainer.visible = true;
        if (this.messageContainer) this.messageContainer.visible = true;
        if (this.turnIndicator) this.turnIndicator.visible = true;
        if (this.turnIndicatorBg) this.turnIndicatorBg.visible = true;

        // Force an update
        this.update();

        // Add a debug outline to help see the panel boundaries
        if (this.debugOutline) {
            this.removeChild(this.debugOutline);
        }

        this.debugOutline = new PIXI.Graphics();
        this.debugOutline.lineStyle(2, 0xFF0000, 1);
        this.debugOutline.drawRect(0, 0, this.width, this.height);
        this.addChild(this.debugOutline);

        // Log the panel dimensions and visibility
        console.log(`Combat panel dimensions: ${this.width}x${this.height}`);
        console.log(`Combat panel position: ${this.x},${this.y}`);
        console.log(`Combat container visible: ${this.combatContainer?.visible}`);
        console.log(`Player container visible: ${this.playerContainer?.visible}`);
        console.log(`Enemy container visible: ${this.enemyContainer?.visible}`);
        console.log(`Action container visible: ${this.actionContainer?.visible}`);
        console.log(`Turn indicator visible: ${this.turnIndicator?.visible}`);
    }

    /**
     * Hides the combat panel
     */
    hide() {
        console.log('Hiding combat panel');
        this.visible = false;
    }

    /**
     * Resizes the combat panel
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        // Update hit area
        this.hitArea = new PIXI.Rectangle(0, 0, width, height);

        // Update overlay
        if (this.overlay) {
            this.overlay.clear();
            this.overlay.beginFill(0x000000, 0.5);
            this.overlay.drawRect(0, 0, width, height);
            this.overlay.endFill();
        }

        // Calculate panel dimensions
        const panelWidth = 300;
        const panelHeight = height - 40;
        const panelX = width - panelWidth - 20;
        const panelY = 20;

        // Update panel background if it exists
        const panelBg = this.combatContainer?.getChildAt(0);
        if (panelBg && panelBg instanceof PIXI.Graphics) {
            panelBg.clear();
            panelBg.beginFill(0x000000, 0.7);
            panelBg.lineStyle(2, 0x00AAFF, 0.8);
            panelBg.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
            panelBg.endFill();

            // Add highlight line at the top
            panelBg.lineStyle(1, 0xFFFFFF, 0.3);
            panelBg.moveTo(panelX + 10, panelY + 2);
            panelBg.lineTo(panelX + panelWidth - 10, panelY + 2);
        }

        // Update positions
        if (this.playerContainer) {
            this.playerContainer.position.set(panelX + 20, panelY + 200);
        }

        if (this.enemyContainer) {
            this.enemyContainer.position.set(panelX + 20, panelY + 60);
        }

        if (this.actionContainer) {
            this.actionContainer.position.set(panelX + 20, panelY + panelHeight - 180);
        }

        if (this.messageContainer) {
            this.messageContainer.position.set(20, 20);
        }

        if (this.turnIndicator) {
            this.turnIndicator.position.set(panelX + panelWidth / 2, panelY + 20);

            // Update turn indicator background
            this.updateTurnIndicator();
        }

        // Force an update to refresh all UI elements
        this.update();
    }
}
