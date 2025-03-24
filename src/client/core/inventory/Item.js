/**
 * Represents an item in the game
 */
export class Item {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.type = config.type; // weapon, armor, consumable, etc.
        this.rarity = config.rarity || 'common';
        this.weight = config.weight || 1;
        this.value = config.value || 0;
        this.isStackable = config.isStackable || false;
        this.maxStack = config.maxStack || 99;
        this.icon = config.icon;
        this.properties = config.properties || {};
        
        // Optional properties based on type
        if (this.type === 'weapon') {
            this.damage = config.damage || 1;
            this.range = config.range || 1;
        } else if (this.type === 'armor') {
            this.defense = config.defense || 1;
            this.slot = config.slot || 'body';
        } else if (this.type === 'consumable') {
            this.effect = config.effect || (() => {});
            this.uses = config.uses || 1;
        }
    }

    use(target) {
        if (this.type === 'consumable' && this.effect) {
            return this.effect(target);
        }
        return false;
    }

    getTooltip() {
        let tooltip = `${this.name}\n${this.description}\n`;
        tooltip += `Type: ${this.type}\n`;
        tooltip += `Value: ${this.value} gold\n`;
        
        if (this.type === 'weapon') {
            tooltip += `Damage: ${this.damage}\n`;
            tooltip += `Range: ${this.range}\n`;
        } else if (this.type === 'armor') {
            tooltip += `Defense: ${this.defense}\n`;
            tooltip += `Slot: ${this.slot}\n`;
        }
        
        return tooltip;
    }
}