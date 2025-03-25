/**
 * Represents an item in the game
 */
export class Item {
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

