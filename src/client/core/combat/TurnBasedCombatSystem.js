/**
 * @module TurnBasedCombatSystem
 * @description Provides turn-based RPG combat mechanics
 */

/**
 * @typedef {Object} CombatAction
 * @property {string} type - Type of action (attack, defend, item, flee)
 * @property {Entity} source - Entity performing the action
 * @property {Entity} [target] - Target of the action (if applicable)
 * @property {Object} [params] - Additional parameters for the action
 */

/**
 * @typedef {Object} CombatResult
 * @property {boolean} hit - Whether the attack landed
 * @property {number} damage - Amount of damage dealt
 * @property {boolean} isCritical - Whether it was a critical hit
 * @property {string} message - Description of the result
 */

/**
 * Manages turn-based combat interactions
 * @class TurnBasedCombatSystem
 */
export class TurnBasedCombatSystem {
    /**
     * Creates a new TurnBasedCombatSystem instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Combat configuration options
     */
    constructor(game, options = {}) {
        this.game = game;
        this.options = {
            baseHitChance: 0.85,
            criticalChance: 0.1,
            criticalMultiplier: 1.5,
            fleeBaseChance: 0.5,
            ...options
        };

        // Combat state
        this.inCombat = false;
        this.currentCombat = null;
        this.turnIndex = 0;
        this.combatLog = [];
        this.combatQueue = [];

        // Bind methods
        this.processPlayerAction = this.processPlayerAction.bind(this);
        this.processEnemyAction = this.processEnemyAction.bind(this);
        this.endCombat = this.endCombat.bind(this);
    }

    /**
     * Initiates combat between player and enemy
     * @param {Entity} player - Player entity
     * @param {Entity} enemy - Enemy entity
     * @returns {boolean} True if combat was initiated
     */
    initiateCombat(player, enemy) {
        if (this.inCombat) {
            console.warn('Already in combat');
            return false;
        }

        if (!player || !enemy) {
            console.error('Invalid entities for combat');
            return false;
        }

        if (this.game?.debug?.flags?.logCombat) {
            console.log('Initiating combat between:', {
                player: player.name,
                enemy: enemy.name,
                playerStats: {
                    health: player.health,
                    maxHealth: player.maxHealth,
                    damage: player.damage,
                    defense: player.defense
                },
                enemyStats: {
                    health: enemy.health,
                    maxHealth: enemy.maxHealth,
                    damage: enemy.damage,
                    defense: enemy.defense
                }
            });
        }

        // Set up combat state
        this.inCombat = true;
        this.currentCombat = {
            player,
            enemy,
            startTime: Date.now(),
            turn: 'player', // Player goes first
            round: 1
        };

        // Reset combat log
        this.combatLog = [];
        this.addLogMessage(`Combat initiated between ${player.name} and ${enemy.name}!`);
        this.addLogMessage(`Round ${this.currentCombat.round} - ${player.name}'s turn`);

        // Show combat UI
        const combatUI = this.game.uiManager.getComponent('combatUI');
        if (combatUI) {
            combatUI.show(player, enemy);
        } else {
            console.error('CombatUI component not found');
            return false;
        }

        return true;
    }

    /**
     * Processes a player combat action
     * @param {CombatAction} action - The action to process
     * @returns {CombatResult} Result of the action
     */
    processPlayerAction(action) {
        if (!this.inCombat || this.currentCombat.turn !== 'player') {
            return null;
        }

        let result = null;

        switch (action.type) {
            case 'attack':
                result = this.processAttack(this.currentCombat.player, this.currentCombat.enemy);
                break;

            case 'defend':
                result = this.processDefend(this.currentCombat.player);
                break;

            case 'item':
                result = this.processItemUse(this.currentCombat.player, action.params?.item);
                break;

            case 'flee':
                result = this.processFlee(this.currentCombat.player, this.currentCombat.enemy);
                if (result.success) {
                    this.endCombat('flee');
                    return result;
                }
                break;

            default:
                console.error('Unknown action type:', action.type);
                return null;
        }

        // Add result to combat log
        if (result) {
            this.addLogMessage(result.message);
        }

        // Check if enemy is defeated
        if (this.currentCombat.enemy.health <= 0) {
            this.endCombat('victory');
            return result;
        }

        // Switch to enemy turn
        this.currentCombat.turn = 'enemy';

        // Process enemy turn after a short delay
        setTimeout(() => {
            this.processEnemyAction();
        }, 1000);

        return result;
    }

    /**
     * Processes the enemy's turn
     * @private
     */
    processEnemyAction() {
        if (!this.inCombat || this.currentCombat.turn !== 'enemy') {
            return;
        }

        // Simple AI: Enemy always attacks
        const result = this.processAttack(this.currentCombat.enemy, this.currentCombat.player);

        // Add result to combat log
        this.addLogMessage(result.message);

        // Check if player is defeated
        if (this.currentCombat.player.health <= 0) {
            this.endCombat('defeat');
            return;
        }

        // Switch back to player turn and increment round
        this.currentCombat.turn = 'player';
        this.currentCombat.round++;

        // Update UI
        this.game.uiManager.getComponent('combatUI')?.updateTurn(this.currentCombat);
    }

    /**
     * Processes an attack action
     * @param {Entity} attacker - Attacking entity
     * @param {Entity} defender - Defending entity
     * @returns {CombatResult} Result of the attack
     * @private
     */
    processAttack(attacker, defender) {
        // Calculate hit chance
        const hitRoll = Math.random();
        const hitChance = this.options.baseHitChance;

        // Get attacker and defender names with fallbacks
        const attackerName = attacker.name || (attacker === this.currentCombat.player ? 'Player' : 'Enemy');
        const defenderName = defender.name || (defender === this.currentCombat.player ? 'Player' : 'Enemy');

        // Check if attack hits
        if (hitRoll > hitChance) {
            return {
                hit: false,
                damage: 0,
                isCritical: false,
                message: `${attackerName} attacks ${defenderName} but misses!`
            };
        }

        // Calculate critical hit
        const isCritical = Math.random() < this.options.criticalChance;

        // Calculate base damage
        let damage = attacker.damage || 10;

        // Apply critical multiplier if applicable
        if (isCritical) {
            damage = Math.floor(damage * this.options.criticalMultiplier);
        }

        // Apply damage to defender
        defender.takeDamage(damage, attacker);

        // Create result message
        let message = `${attackerName} attacks ${defenderName} for ${damage} damage`;
        if (isCritical) {
            message += " (Critical Hit!)";
        }
        message += ".";

        return {
            hit: true,
            damage,
            isCritical,
            message
        };
    }

    /**
     * Processes a defend action
     * @param {Entity} entity - Entity defending
     * @returns {CombatResult} Result of the defend action
     * @private
     */
    processDefend(entity) {
        // Apply defense buff for the next turn
        entity.isDefending = true;
        entity.defenseBuff = 0.5; // Reduce damage by 50%

        return {
            success: true,
            message: `${entity.name} takes a defensive stance.`
        };
    }

    /**
     * Processes an item use action
     * @param {Entity} entity - Entity using the item
     * @param {Item} item - Item being used
     * @returns {CombatResult} Result of the item use
     * @private
     */
    processItemUse(entity, item) {
        if (!item) {
            return {
                success: false,
                message: `${entity.name} fumbles around but finds no item to use.`
            };
        }

        // Process item effects
        let message = `${entity.name} uses ${item.name}.`;
        let success = true;

        // Handle different item types
        switch (item.type) {
            case 'healing':
                const healAmount = item.value || 20;
                entity.heal(healAmount);
                message = `${entity.name} uses ${item.name} and recovers ${healAmount} health.`;
                break;

            case 'damage':
                // This would be handled differently as it would target the enemy
                break;

            default:
                success = false;
                message = `${entity.name} uses ${item.name} but nothing happens.`;
        }

        // Remove item from inventory if consumable
        if (item.consumable && entity.inventory) {
            entity.inventory.removeItem(item.id, 1);
        }

        return {
            success,
            message
        };
    }

    /**
     * Processes a flee action
     * @param {Entity} entity - Entity attempting to flee
     * @param {Entity} enemy - Enemy entity
     * @returns {CombatResult} Result of the flee attempt
     * @private
     */
    processFlee(entity, enemy) {
        // Calculate flee chance based on speed difference
        const entitySpeed = entity.speed || 1;
        const enemySpeed = enemy.speed || 1;
        const fleeChance = this.options.fleeBaseChance * (entitySpeed / enemySpeed);

        // Roll for flee success
        const fleeRoll = Math.random();
        const success = fleeRoll < fleeChance;

        return {
            success,
            message: success
                ? `${entity.name} successfully flees from combat!`
                : `${entity.name} tries to flee but fails!`
        };
    }

    /**
     * Ends the current combat
     * @param {string} result - Result of combat (victory, defeat, flee)
     * @private
     */
    endCombat(result) {
        if (!this.inCombat) {
            return;
        }

        // Process combat rewards/penalties
        switch (result) {
            case 'victory':
                this.processCombatVictory();
                break;

            case 'defeat':
                this.processCombatDefeat();
                break;

            case 'flee':
                // No special processing for flee
                break;
        }

        // Reset combat state
        this.inCombat = false;

        // Add final message to log
        let finalMessage = '';
        switch (result) {
            case 'victory':
                finalMessage = `${this.currentCombat.player.name} defeated ${this.currentCombat.enemy.name}!`;
                break;

            case 'defeat':
                finalMessage = `${this.currentCombat.player.name} was defeated by ${this.currentCombat.enemy.name}!`;
                break;

            case 'flee':
                finalMessage = `${this.currentCombat.player.name} fled from combat.`;
                break;
        }

        this.addLogMessage(finalMessage);

        // Hide combat UI after a delay
        setTimeout(() => {
            this.game.uiManager.getComponent('combatUI')?.hide();

            // If player was defeated, handle game over
            if (result === 'defeat') {
                this.game.handlePlayerDefeat();
            }
        }, 2000);

        // Clear current combat
        this.currentCombat = null;
    }

    /**
     * Processes rewards for combat victory
     * @private
     */
    processCombatVictory() {
        const player = this.currentCombat.player;
        const enemy = this.currentCombat.enemy;

        // Award experience
        const expGain = enemy.expValue || 20;
        player.gainExperience?.(expGain);
        this.addLogMessage(`${player.name} gained ${expGain} experience!`);

        // Handle enemy defeat (remove from game, drop loot, etc.)
        enemy.isActive = false;
        enemy.isVisible = false;

        // Remove enemy from entities
        this.game.entities.delete(enemy);

        // TODO: Handle loot drops
    }

    /**
     * Processes penalties for combat defeat
     * @private
     */
    processCombatDefeat() {
        const player = this.currentCombat.player;

        // Reset player health to 1 for now (can be changed to handle proper death)
        player.health = 1;

        // TODO: Handle player defeat (respawn, lose items, etc.)
    }

    /**
     * Adds a message to the combat log
     * @param {string} message - Message to add
     * @private
     */
    addLogMessage(message) {
        this.combatLog.push({
            message,
            timestamp: Date.now()
        });

        // Update UI
        this.game.uiManager.getComponent('combatUI')?.addLogMessage(message);
    }

    /**
     * Checks if an entity is in range to initiate combat
     * @param {Entity} entity1 - First entity
     * @param {Entity} entity2 - Second entity
     * @returns {boolean} True if entities are in combat range
     */
    isInCombatRange(entity1, entity2) {
        if (!entity1 || !entity2) {
            return false;
        }

        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Use the attacker's attack range or a default value
        const combatRange = entity1.attackRange || 2;

        return distance <= combatRange;
    }
}
