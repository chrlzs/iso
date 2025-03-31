/**
 * @typedef {Object} ItemConfig
 * @property {string} id - Unique item identifier
 * @property {string} name - Item name
 * @property {string} [description] - Item description
 * @property {string} type - Item type (weapon, armor, etc)
 * @property {number} [value=0] - Item value in currency
 * @property {number} [weight=0] - Item weight
 * @property {boolean} [isStackable=false] - Whether item can be stacked
 * @property {string} icon - Item icon URL or data URI
 * @property {Function} [effect] - Item use effect function
 * @property {string} [slot] - Equipment slot
 * @property {number} [damage=0] - Weapon damage
 * @property {number} [defense=0] - Armor defense
 * @property {number} [quantity=1] - Item quantity
 * @property {string} [rarity='common'] - Item rarity
 */

/**
 * Represents an item in the game
 * @class Item
 * @property {string} id - Unique item identifier
 * @property {string} name - Item name
 * @property {string} description - Item description
 * @property {string} type - Item type (weapon, armor, etc)
 * @property {number} value - Item value in currency
 * @property {number} weight - Item weight
 * @property {boolean} isStackable - Whether item can be stacked
 * @property {string} icon - Item icon URL or data URI
 */
export class Item {
    /**
     * Creates a new Item instance
     * @param {ItemConfig} config - Item configuration
     */
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description || '';
        this.type = config.type;
        this.value = config.value || 0;
        this.weight = config.weight || 0;
        this.isStackable = config.isStackable || false;
        this.icon = config.icon;
        this.effect = config.effect;
        this.slot = config.slot;
        this.damage = config.damage || 0;
        this.defense = config.defense || 0;
        this.quantity = config.quantity || 1;
        this.rarity = config.rarity || 'common';
    }

    /**
     * Gets HTML tooltip content for the item
     * @returns {string} HTML tooltip content
     */
    getTooltip() {
        let tooltip = `<div class="tooltip-header">${this.name}</div>`;
        
        if (this.type === 'weapon') {
            tooltip += `<div class="tooltip-stat">Damage: ${this.damage}</div>`;
        }
        
        if (this.type === 'armor') {
            tooltip += `<div class="tooltip-stat">Defense: ${this.defense}</div>`;
        }
        
        tooltip += `<div class="tooltip-description">${this.description}</div>`;
        tooltip += `<div class="tooltip-footer">`;
        tooltip += `<span>Weight: ${this.weight}</span>`;
        tooltip += `<span>Value: ${this.value} gold</span>`;
        tooltip += `</div>`;
        
        return tooltip;
    }

    use(target) {
        if (this.effect) {
            return this.effect(target);
        }
        return false;
    }

    clone() {
        return new Item({
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            value: this.value,
            weight: this.weight,
            isStackable: this.isStackable,
            icon: this.icon,
            effect: this.effect,
            slot: this.slot,
            damage: this.damage,
            quantity: this.quantity
        });
    }
}

