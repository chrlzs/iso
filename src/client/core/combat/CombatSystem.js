/**
 * Manages combat interactions and damage calculations
 * @class CombatSystem
 */
export class CombatSystem {
    /**
     * Creates a new CombatSystem instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Combat configuration options
     * @param {number} [options.baseHitChance=0.8] - Base chance to hit
     * @param {number} [options.criticalChance=0.1] - Base critical hit chance
     */
    constructor(game, options = {}) {
        this.game = game;
        this.baseHitChance = options.baseHitChance || 0.8;
        this.criticalChance = options.criticalChance || 0.1;
        this.activeCombats = new Map();
    }

    /**
     * Initiates combat between two entities
     * @param {Entity} attacker - Attacking entity
     * @param {Entity} defender - Defending entity
     * @returns {boolean} True if combat was initiated
     */
    initiateCombat(attacker, defender) {
        if (!this.validateCombat(attacker, defender)) {
            return false;
        }

        const combatId = `${attacker.id}-${defender.id}`;
        this.activeCombats.set(combatId, {
            attacker,
            defender,
            startTime: Date.now(),
            lastAttackTime: 0
        });

        return true;
    }

    /**
     * Processes an attack action
     * @param {Entity} attacker - Attacking entity
     * @param {Entity} defender - Defending entity
     * @param {Object} [options={}] - Attack options
     * @returns {Object} Attack result data
     */
    processAttack(attacker, defender, options = {}) {
        const hitRoll = Math.random();
        const isCritical = Math.random() < this.criticalChance;
        const baseDamage = this.calculateBaseDamage(attacker, defender);

        if (hitRoll > this.baseHitChance) {
            return { hit: false, damage: 0, isCritical: false };
        }

        const finalDamage = isCritical ? baseDamage * 2 : baseDamage;
        defender.takeDamage(finalDamage);

        return {
            hit: true,
            damage: finalDamage,
            isCritical,
            attacker: attacker.id,
            defender: defender.id
        };
    }

    /**
     * Validates if combat can occur between entities
     * @param {Entity} attacker - Attacking entity
     * @param {Entity} defender - Defending entity
     * @returns {boolean} True if combat is valid
     * @private
     */
    validateCombat(attacker, defender) {
        // Check if entities exist and can engage in combat
        if (!attacker || !defender) return false;
        if (!attacker.canAttack || !defender.canBeAttacked) return false;

        // Check range
        const distance = Math.hypot(
            defender.x - attacker.x,
            defender.y - attacker.y
        );
        
        return distance <= attacker.attackRange;
    }

    /**
     * Calculates base damage for an attack
     * @param {Entity} attacker - Attacking entity
     * @param {Entity} defender - Defending entity
     * @returns {number} Calculated base damage
     * @private
     */
    calculateBaseDamage(attacker, defender) {
        const weaponDamage = attacker.getEquippedWeaponDamage() || 1;
        const attackerStrength = attacker.getAttackPower() || 1;
        const defenderArmor = defender.getArmorValue() || 0;

        return Math.max(1, (weaponDamage * attackerStrength) - defenderArmor);
    }

    /**
     * Updates all active combats
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        this.activeCombats.forEach((combat, id) => {
            if (this.shouldEndCombat(combat)) {
                this.endCombat(id);
                return;
            }

            // Process automatic attacks based on attack speed
            const now = Date.now();
            if (now - combat.lastAttackTime >= combat.attacker.attackSpeed) {
                const result = this.processAttack(combat.attacker, combat.defender);
                combat.lastAttackTime = now;
                this.broadcastCombatEvent(result);
            }
        });
    }

    /**
     * Broadcasts combat events to interested systems
     * @param {Object} event - Combat event data
     * @private
     */
    broadcastCombatEvent(event) {
        // Notify the message system
        if (this.game.messageSystem) {
            const message = this.formatCombatMessage(event);
            this.game.messageSystem.addMessage(message, 'combat');
        }

        // Update UI if needed
        if (this.game.uiManager) {
            this.game.uiManager.getComponent('combatLog')?.addEvent(event);
        }
    }

    /**
     * Formats a combat message for display
     * @param {Object} event - Combat event data
     * @returns {string} Formatted message
     * @private
     */
    formatCombatMessage(event) {
        if (!event.hit) {
            return `Attack missed!`;
        }

        const damageText = event.isCritical ? 'Critical hit' : 'Hit';
        return `${damageText} for ${event.damage} damage!`;
    }
}
