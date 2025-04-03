/**
 * Manages the turn-based combat interface
 * @class CombatUI
 */
export class CombatUI {
    /**
     * Creates a new CombatUI instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - UI configuration options
     */
    constructor(game, options = {}) {
        this.game = game;
        this.options = {
            width: 600,
            height: 400,
            ...options
        };

        this.isVisible = false;
        this.player = null;
        this.enemy = null;
        this.combatState = null;

        // Create UI elements
        this.createCombatInterface();

        // Bind event handlers
        this.handleActionClick = this.handleActionClick.bind(this);
    }

    /**
     * Creates the combat interface elements
     * @private
     */
    createCombatInterface() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'combat-ui';
        this.container.style.display = 'none';
        this.container.style.position = 'absolute';
        this.container.style.left = '50%';
        this.container.style.top = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.width = `${this.options.width}px`;
        this.container.style.height = `${this.options.height}px`;
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.border = '2px solid #444';
        this.container.style.borderRadius = '5px';
        this.container.style.padding = '10px';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.zIndex = '1000';

        // Create combat header
        this.header = document.createElement('div');
        this.header.className = 'combat-header';
        this.header.style.textAlign = 'center';
        this.header.style.fontSize = '24px';
        this.header.style.marginBottom = '10px';
        this.header.style.padding = '5px';
        this.header.style.borderBottom = '1px solid #444';
        this.header.textContent = 'Combat';

        // Create combat area (displays combatants)
        this.combatArea = document.createElement('div');
        this.combatArea.className = 'combat-area';
        this.combatArea.style.display = 'flex';
        this.combatArea.style.justifyContent = 'space-between';
        this.combatArea.style.alignItems = 'center';
        this.combatArea.style.height = '150px';
        this.combatArea.style.margin = '10px 0';

        // Create player info
        this.playerInfo = document.createElement('div');
        this.playerInfo.className = 'player-info';
        this.playerInfo.style.width = '45%';
        this.playerInfo.style.padding = '10px';
        this.playerInfo.style.backgroundColor = 'rgba(0, 100, 200, 0.3)';
        this.playerInfo.style.borderRadius = '5px';

        // Create enemy info
        this.enemyInfo = document.createElement('div');
        this.enemyInfo.className = 'enemy-info';
        this.enemyInfo.style.width = '45%';
        this.enemyInfo.style.padding = '10px';
        this.enemyInfo.style.backgroundColor = 'rgba(200, 0, 0, 0.3)';
        this.enemyInfo.style.borderRadius = '5px';

        // Create VS indicator
        this.vsIndicator = document.createElement('div');
        this.vsIndicator.className = 'vs-indicator';
        this.vsIndicator.style.fontSize = '24px';
        this.vsIndicator.style.fontWeight = 'bold';
        this.vsIndicator.textContent = 'VS';

        // Add elements to combat area
        this.combatArea.appendChild(this.playerInfo);
        this.combatArea.appendChild(this.vsIndicator);
        this.combatArea.appendChild(this.enemyInfo);

        // Create combat log
        this.combatLog = document.createElement('div');
        this.combatLog.className = 'combat-log';
        this.combatLog.style.height = '100px';
        this.combatLog.style.overflowY = 'auto';
        this.combatLog.style.marginBottom = '10px';
        this.combatLog.style.padding = '5px';
        this.combatLog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.combatLog.style.borderRadius = '5px';
        this.combatLog.style.fontSize = '14px';

        // Create action buttons
        this.actionButtons = document.createElement('div');
        this.actionButtons.className = 'action-buttons';
        this.actionButtons.style.display = 'flex';
        this.actionButtons.style.justifyContent = 'space-around';
        this.actionButtons.style.marginTop = '10px';

        // Create individual action buttons
        const actions = ['Attack', 'Defend', 'Item', 'Flee'];
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `action-button action-${action.toLowerCase()}`;
            button.textContent = action;
            button.dataset.action = action.toLowerCase();
            button.style.padding = '10px 20px';
            button.style.fontSize = '16px';
            button.style.backgroundColor = '#333';
            button.style.color = '#fff';
            button.style.border = '1px solid #555';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';

            // Add hover effect
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#555';
            });
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#333';
            });

            // Add click handler
            button.addEventListener('click', this.handleActionClick);

            this.actionButtons.appendChild(button);
        });

        // Add all elements to container
        this.container.appendChild(this.header);
        this.container.appendChild(this.combatArea);
        this.container.appendChild(this.combatLog);
        this.container.appendChild(this.actionButtons);

        // Add container to document
        document.body.appendChild(this.container);
    }

    /**
     * Shows the combat interface
     * @param {Entity} player - Player entity
     * @param {Entity} enemy - Enemy entity
     */
    show(player, enemy) {
        if (!player || !enemy) {
            console.error('Cannot show combat UI: missing player or enemy');
            return;
        }

        this.isVisible = true;
        this.player = player;
        this.enemy = enemy;

        // Get player name with fallback
        const playerName = player.name || 'Player';
        const enemyName = enemy.name || 'Enemy';

        if (this.game?.debug?.flags?.logCombat) {
            console.log('Showing combat UI:', {
                player: playerName,
                enemy: enemyName,
                playerHealth: player.health,
                enemyHealth: enemy.health
            });
        }

        // Update UI with combatant info
        this.updateCombatantInfo();

        // Clear combat log
        this.combatLog.innerHTML = '';

        // Show container
        this.container.style.display = 'block';

        // Add initial message
        this.addLogMessage(`Combat initiated between ${playerName} and ${enemyName}!`);

        // Make sure action buttons are properly bound
        Array.from(this.actionButtons.children).forEach(button => {
            // Remove existing listeners to prevent duplicates
            button.removeEventListener('click', this.handleActionClick);
            // Add fresh listener
            button.addEventListener('click', this.handleActionClick);
        });
    }

    /**
     * Hides the combat interface
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.player = null;
        this.enemy = null;
    }

    /**
     * Updates the combat interface with current state
     * @param {Object} combatState - Current combat state
     */
    updateTurn(combatState) {
        this.combatState = combatState;

        // Update UI elements based on whose turn it is
        const turnIndicator = combatState.turn === 'player' ? 'Your Turn' : 'Enemy Turn';
        this.header.textContent = `Combat - Round ${combatState.round} - ${turnIndicator}`;

        // Update combatant info (health, etc.)
        this.updateCombatantInfo();

        // Enable/disable action buttons based on turn
        const buttonsEnabled = combatState.turn === 'player';
        Array.from(this.actionButtons.children).forEach(button => {
            button.disabled = !buttonsEnabled;
            button.style.opacity = buttonsEnabled ? '1' : '0.5';
            button.style.cursor = buttonsEnabled ? 'pointer' : 'not-allowed';
        });
    }

    /**
     * Updates the combatant information display
     * @private
     */
    updateCombatantInfo() {
        if (!this.player || !this.enemy) {
            console.error('Missing player or enemy in updateCombatantInfo');
            return;
        }

        // Get player name with fallback
        const playerName = this.player.name || 'Player';
        const enemyName = this.enemy.name || 'Enemy';

        // Calculate health percentages safely
        const playerMaxHealth = this.player.maxHealth || 100;
        const enemyMaxHealth = this.enemy.maxHealth || 100;
        const playerHealthPercent = (this.player.health / playerMaxHealth) * 100;
        const enemyHealthPercent = (this.enemy.health / enemyMaxHealth) * 100;

        // Update player info
        this.playerInfo.innerHTML = `
            <div style="font-weight: bold; font-size: 18px;">${playerName}</div>
            <div>HP: ${this.player.health}/${playerMaxHealth}</div>
            <div class="health-bar" style="height: 10px; background-color: #333; margin-top: 5px; border-radius: 5px;">
                <div style="height: 100%; width: ${playerHealthPercent}%; background-color: #0f0; border-radius: 5px;"></div>
            </div>
            ${this.player.isDefending ? '<div style="color: #aaf; margin-top: 5px;">Defending</div>' : ''}
        `;

        // Update enemy info
        this.enemyInfo.innerHTML = `
            <div style="font-weight: bold; font-size: 18px;">${enemyName}</div>
            <div>HP: ${this.enemy.health}/${enemyMaxHealth}</div>
            <div class="health-bar" style="height: 10px; background-color: #333; margin-top: 5px; border-radius: 5px;">
                <div style="height: 100%; width: ${enemyHealthPercent}%; background-color: #f00; border-radius: 5px;"></div>
            </div>
            ${this.enemy.isDefending ? '<div style="color: #faa; margin-top: 5px;">Defending</div>' : ''}
        `;

        if (this.game?.debug?.flags?.logCombat) {
            console.log('Updated combatant info:', {
                player: {
                    name: playerName,
                    health: this.player.health,
                    maxHealth: playerMaxHealth
                },
                enemy: {
                    name: enemyName,
                    health: this.enemy.health,
                    maxHealth: enemyMaxHealth
                }
            });
        }
    }

    /**
     * Adds a message to the combat log
     * @param {string} message - Message to add
     */
    addLogMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'log-message';
        messageElement.style.marginBottom = '5px';
        messageElement.textContent = message;

        // Add message to log
        this.combatLog.appendChild(messageElement);

        // Scroll to bottom
        this.combatLog.scrollTop = this.combatLog.scrollHeight;
    }

    /**
     * Handles action button clicks
     * @param {Event} event - Click event
     * @private
     */
    handleActionClick(event) {
        const action = event.target.dataset.action;

        if (!action) {
            console.error('No action specified in button click');
            return;
        }

        if (!this.isVisible) {
            console.error('Combat UI is not visible');
            return;
        }

        if (!this.game?.combatSystem) {
            console.error('Combat system not available');
            return;
        }

        if (!this.player || !this.enemy) {
            console.error('Missing player or enemy in handleActionClick');
            return;
        }

        if (this.game?.debug?.flags?.logCombat) {
            console.log(`Processing combat action: ${action}`, {
                player: this.player.name || 'Player',
                enemy: this.enemy.name || 'Enemy'
            });
        }

        // Process action based on type
        switch (action) {
            case 'attack':
                this.game.combatSystem.processPlayerAction({
                    type: 'attack',
                    source: this.player,
                    target: this.enemy
                });
                break;

            case 'defend':
                this.game.combatSystem.processPlayerAction({
                    type: 'defend',
                    source: this.player
                });
                break;

            case 'item':
                // For simplicity, we'll just use a healing potion
                // In a real implementation, this would open an inventory UI
                const healingPotion = {
                    id: 'potion_1',
                    name: 'Healing Potion',
                    type: 'healing',
                    value: 30,
                    consumable: true
                };

                this.game.combatSystem.processPlayerAction({
                    type: 'item',
                    source: this.player,
                    params: { item: healingPotion }
                });
                break;

            case 'flee':
                this.game.combatSystem.processPlayerAction({
                    type: 'flee',
                    source: this.player,
                    target: this.enemy
                });
                break;

            default:
                console.error(`Unknown action type: ${action}`);
                break;
        }
    }
}
