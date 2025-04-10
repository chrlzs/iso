/**
 * CombatManager - Handles turn-based combat encounters
 */
export class CombatManager {
    /**
     * Creates a new combat manager
     * @param {Object} options - Combat manager options
     * @param {Game} options.game - Game instance
     */
    constructor(options = {}) {
        if (!options.game) {
            throw new Error('CombatManager requires a game instance');
        }
        
        this.game = options.game;
        
        // Combat state
        this.inCombat = false;
        this.combatTurn = 0;
        this.currentTurnActor = null;
        this.turnOrder = [];
        this.playerParty = [];
        this.enemyParty = [];
        
        // Combat settings
        this.turnDelay = options.turnDelay || 500; // ms between turns
        this.escapeChance = options.escapeChance || 0.3; // 30% chance to escape
        
        // Combat stats
        this.damageDealt = 0;
        this.damageReceived = 0;
        this.turnsElapsed = 0;
        this.criticalHits = 0;
        this.itemsUsed = 0;
        
        // Event callbacks
        this.onCombatStart = null;
        this.onCombatEnd = null;
        this.onTurnStart = null;
        this.onTurnEnd = null;
        this.onDamageDealt = null;
        this.onActorDefeated = null;
        
        // Combat UI
        this.ui = null;
        
        // Turn timer
        this.turnTimer = null;
    }
    
    /**
     * Starts a combat encounter
     * @param {Array} enemies - Array of enemy characters
     * @param {Array} players - Array of player characters (defaults to game.player)
     * @returns {boolean} Whether combat was started successfully
     */
    startCombat(enemies, players = null) {
        if (this.inCombat) return false;
        
        // Set player party
        this.playerParty = players || (this.game.player ? [this.game.player] : []);
        
        // Validate player party
        if (this.playerParty.length === 0) {
            console.error('Cannot start combat: No player characters');
            return false;
        }
        
        // Set enemy party
        this.enemyParty = enemies || [];
        
        // Validate enemy party
        if (this.enemyParty.length === 0) {
            console.error('Cannot start combat: No enemy characters');
            return false;
        }
        
        // Set combat state
        this.inCombat = true;
        this.combatTurn = 0;
        this.currentTurnActor = null;
        
        // Reset combat stats
        this.damageDealt = 0;
        this.damageReceived = 0;
        this.turnsElapsed = 0;
        this.criticalHits = 0;
        this.itemsUsed = 0;
        
        // Determine turn order
        this.determineTurnOrder();
        
        // Show combat UI
        if (this.game.ui) {
            this.ui = this.game.ui.createCombatUI(this);
            this.game.ui.showPanel('combat', true);
        }
        
        // Call combat start callback
        if (this.onCombatStart) {
            this.onCombatStart(this.playerParty, this.enemyParty);
        }
        
        // Start first turn
        this.startNextTurn();
        
        return true;
    }
    
    /**
     * Ends the current combat encounter
     * @param {boolean} playerVictory - Whether the player won
     */
    endCombat(playerVictory) {
        if (!this.inCombat) return;
        
        // Clear turn timer
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
        
        // Set combat state
        this.inCombat = false;
        this.currentTurnActor = null;
        
        // Hide combat UI
        if (this.game.ui) {
            this.game.ui.hidePanel('combat');
            this.ui = null;
        }
        
        // Call combat end callback
        if (this.onCombatEnd) {
            this.onCombatEnd(playerVictory, {
                turnsElapsed: this.turnsElapsed,
                damageDealt: this.damageDealt,
                damageReceived: this.damageReceived,
                criticalHits: this.criticalHits,
                itemsUsed: this.itemsUsed
            });
        }
        
        // Handle rewards if player won
        if (playerVictory) {
            this.giveRewards();
        }
        
        // Resume game time if it was paused
        if (this.game.dayNightCycle && this.game.dayNightCycle.paused) {
            this.game.dayNightCycle.resume();
        }
    }
    
    /**
     * Determines the turn order based on character speed
     * @private
     */
    determineTurnOrder() {
        // Combine all combatants
        const allCombatants = [...this.playerParty, ...this.enemyParty];
        
        // Sort by speed (higher speed goes first)
        this.turnOrder = allCombatants.sort((a, b) => {
            const speedA = a.stats?.speed || a.speed || 0;
            const speedB = b.stats?.speed || b.speed || 0;
            return speedB - speedA;
        });
    }
    
    /**
     * Starts the next turn in the combat sequence
     * @private
     */
    startNextTurn() {
        // Check if combat is still active
        if (!this.inCombat) return;
        
        // Check for victory/defeat conditions
        if (this.checkCombatEnd()) return;
        
        // Increment turn counter if we've gone through all actors
        if (!this.currentTurnActor || this.turnOrder.indexOf(this.currentTurnActor) === this.turnOrder.length - 1) {
            this.combatTurn++;
            this.turnsElapsed++;
        }
        
        // Get next actor in turn order
        const currentIndex = this.currentTurnActor ? this.turnOrder.indexOf(this.currentTurnActor) : -1;
        const nextIndex = (currentIndex + 1) % this.turnOrder.length;
        this.currentTurnActor = this.turnOrder[nextIndex];
        
        // Skip defeated actors
        if (this.currentTurnActor.health <= 0) {
            this.startNextTurn();
            return;
        }
        
        // Call turn start callback
        if (this.onTurnStart) {
            this.onTurnStart(this.currentTurnActor, this.combatTurn);
        }
        
        // Update UI
        if (this.ui) {
            this.ui.updateTurnIndicator(this.currentTurnActor, this.combatTurn);
        }
        
        // Handle AI turn if it's an enemy
        if (this.enemyParty.includes(this.currentTurnActor)) {
            // Add a small delay for enemy turns to make it feel more natural
            this.turnTimer = setTimeout(() => {
                this.executeEnemyTurn(this.currentTurnActor);
            }, this.turnDelay);
        }
    }
    
    /**
     * Executes an enemy's turn using AI
     * @param {Character} enemy - The enemy character
     * @private
     */
    executeEnemyTurn(enemy) {
        // Simple AI: attack a random player character
        const targetIndex = Math.floor(Math.random() * this.playerParty.length);
        const target = this.playerParty[targetIndex];
        
        // Execute attack
        this.executeAttack(enemy, target);
        
        // End turn
        this.endTurn();
    }
    
    /**
     * Executes a player action
     * @param {string} actionType - Type of action ('attack', 'ability', 'item', 'escape')
     * @param {Object} options - Action options
     * @returns {boolean} Whether the action was executed successfully
     */
    executePlayerAction(actionType, options = {}) {
        // Check if it's the player's turn
        if (!this.inCombat || !this.currentTurnActor || !this.playerParty.includes(this.currentTurnActor)) {
            return false;
        }
        
        let actionExecuted = false;
        
        // Execute action based on type
        switch (actionType) {
            case 'attack':
                const target = options.target || this.enemyParty[0];
                actionExecuted = this.executeAttack(this.currentTurnActor, target);
                break;
                
            case 'ability':
                const ability = options.ability;
                const abilityTarget = options.target;
                actionExecuted = this.executeAbility(this.currentTurnActor, ability, abilityTarget);
                break;
                
            case 'item':
                const item = options.item;
                const itemTarget = options.target || this.currentTurnActor;
                actionExecuted = this.executeItemUse(this.currentTurnActor, item, itemTarget);
                break;
                
            case 'escape':
                actionExecuted = this.attemptEscape();
                break;
                
            default:
                console.error(`Unknown action type: ${actionType}`);
                return false;
        }
        
        // End turn if action was executed successfully
        if (actionExecuted) {
            this.endTurn();
        }
        
        return actionExecuted;
    }
    
    /**
     * Executes an attack action
     * @param {Character} attacker - The attacking character
     * @param {Character} target - The target character
     * @returns {boolean} Whether the attack was executed successfully
     * @private
     */
    executeAttack(attacker, target) {
        if (!attacker || !target || target.health <= 0) return false;
        
        // Calculate base damage
        const attackStat = attacker.stats?.attack || 10;
        const defenseStat = target.stats?.defense || 5;
        
        // Base damage formula: attack - (defense / 2)
        let damage = Math.max(1, attackStat - (defenseStat / 2));
        
        // Random variance (±20%)
        const variance = 0.2;
        damage *= (1 + (Math.random() * variance * 2 - variance));
        
        // Critical hit (10% chance)
        const criticalChance = attacker.stats?.criticalChance || 0.1;
        const isCritical = Math.random() < criticalChance;
        
        if (isCritical) {
            damage *= 2;
            this.criticalHits++;
        }
        
        // Round damage to integer
        damage = Math.round(damage);
        
        // Apply damage
        target.damage(damage);
        
        // Update damage stats
        if (this.playerParty.includes(attacker)) {
            this.damageDealt += damage;
        } else {
            this.damageReceived += damage;
        }
        
        // Call damage callback
        if (this.onDamageDealt) {
            this.onDamageDealt(attacker, target, damage, isCritical);
        }
        
        // Check if target was defeated
        if (target.health <= 0) {
            this.handleActorDefeated(target);
        }
        
        // Update UI
        if (this.ui) {
            this.ui.showAttackAnimation(attacker, target, damage, isCritical);
            this.ui.updateHealthBars();
        }
        
        return true;
    }
    
    /**
     * Executes an ability action
     * @param {Character} user - The character using the ability
     * @param {Object} ability - The ability to use
     * @param {Character} target - The target character
     * @returns {boolean} Whether the ability was executed successfully
     * @private
     */
    executeAbility(user, ability, target) {
        if (!user || !ability) return false;
        
        // Check if user has enough energy
        if (user.energy < ability.energyCost) {
            console.log(`Not enough energy to use ${ability.name}`);
            return false;
        }
        
        // Use energy
        user.energy -= ability.energyCost;
        
        // Execute ability effect
        const result = ability.execute(user, target, this);
        
        // Update UI
        if (this.ui) {
            this.ui.showAbilityAnimation(user, target, ability);
            this.ui.updateHealthBars();
            this.ui.updateEnergyBars();
        }
        
        return result;
    }
    
    /**
     * Executes an item use action
     * @param {Character} user - The character using the item
     * @param {Item} item - The item to use
     * @param {Character} target - The target character
     * @returns {boolean} Whether the item was used successfully
     * @private
     */
    executeItemUse(user, item, target) {
        if (!user || !item || !target) return false;
        
        // Check if user has the item
        const inventory = user.inventory;
        if (!inventory || !inventory.findItem(item.type)) {
            console.log(`${user.name} doesn't have ${item.name}`);
            return false;
        }
        
        // Use the item
        const result = item.use(target);
        
        if (result) {
            // Remove item if consumable
            if (item.consumable) {
                inventory.removeItem(inventory.items.indexOf(item));
            }
            
            this.itemsUsed++;
            
            // Update UI
            if (this.ui) {
                this.ui.showItemAnimation(user, target, item);
                this.ui.updateHealthBars();
                this.ui.updateEnergyBars();
            }
        }
        
        return result;
    }
    
    /**
     * Attempts to escape from combat
     * @returns {boolean} Whether the escape was successful
     * @private
     */
    attemptEscape() {
        // Calculate escape chance
        // Base chance + bonus based on player speed vs enemy speed
        let escapeChance = this.escapeChance;
        
        // Get average speeds
        const playerSpeed = this.playerParty.reduce((sum, player) => {
            return sum + (player.stats?.speed || player.speed || 0);
        }, 0) / this.playerParty.length;
        
        const enemySpeed = this.enemyParty.reduce((sum, enemy) => {
            return sum + (enemy.stats?.speed || enemy.speed || 0);
        }, 0) / this.enemyParty.length;
        
        // Adjust escape chance based on speed difference
        const speedDiff = playerSpeed - enemySpeed;
        escapeChance += speedDiff * 0.02; // 2% per point of speed difference
        
        // Clamp escape chance
        escapeChance = Math.max(0.1, Math.min(0.9, escapeChance));
        
        // Roll for escape
        const escaped = Math.random() < escapeChance;
        
        if (escaped) {
            // End combat with no victory
            this.endCombat(false);
            
            // Show escape message
            if (this.ui) {
                this.ui.showMessage('Escaped successfully!');
            }
            
            console.log('Escaped from combat');
        } else {
            // Failed to escape
            if (this.ui) {
                this.ui.showMessage('Failed to escape!');
            }
            
            console.log('Failed to escape from combat');
        }
        
        return true; // Action was executed, even if escape failed
    }
    
    /**
     * Handles a defeated actor
     * @param {Character} actor - The defeated actor
     * @private
     */
    handleActorDefeated(actor) {
        // Call defeated callback
        if (this.onActorDefeated) {
            this.onActorDefeated(actor);
        }
        
        // Remove from turn order
        const index = this.turnOrder.indexOf(actor);
        if (index !== -1) {
            this.turnOrder.splice(index, 1);
        }
        
        // Check if combat should end
        this.checkCombatEnd();
    }
    
    /**
     * Checks if combat should end
     * @returns {boolean} Whether combat has ended
     * @private
     */
    checkCombatEnd() {
        // Check if all players are defeated
        const allPlayersDefeated = this.playerParty.every(player => player.health <= 0);
        
        if (allPlayersDefeated) {
            this.endCombat(false); // Player lost
            return true;
        }
        
        // Check if all enemies are defeated
        const allEnemiesDefeated = this.enemyParty.every(enemy => enemy.health <= 0);
        
        if (allEnemiesDefeated) {
            this.endCombat(true); // Player won
            return true;
        }
        
        return false;
    }
    
    /**
     * Ends the current turn
     * @private
     */
    endTurn() {
        // Call turn end callback
        if (this.onTurnEnd) {
            this.onTurnEnd(this.currentTurnActor, this.combatTurn);
        }
        
        // Start next turn
        this.startNextTurn();
    }
    
    /**
     * Gives rewards to the player after winning combat
     * @private
     */
    giveRewards() {
        // Calculate experience and gold rewards
        let totalExp = 0;
        let totalGold = 0;
        
        this.enemyParty.forEach(enemy => {
            totalExp += enemy.expReward || 10;
            totalGold += enemy.goldReward || 5;
        });
        
        // Give experience to all player characters
        this.playerParty.forEach(player => {
            if (player.addExperience) {
                player.addExperience(totalExp);
            }
        });
        
        // Give gold to the player
        if (this.game.player && this.game.player.gold !== undefined) {
            this.game.player.gold += totalGold;
        }
        
        // Show rewards message
        if (this.ui) {
            this.ui.showRewards(totalExp, totalGold);
        }
        
        console.log(`Combat rewards: ${totalExp} EXP, ${totalGold} gold`);
    }
    
    /**
     * Updates the combat manager
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Nothing to update if not in combat
        if (!this.inCombat) return;
        
        // Update UI
        if (this.ui) {
            this.ui.update(deltaTime);
        }
    }
}
