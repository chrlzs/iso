import { Item } from './Item.js';

/**
 * Base inventory system that can be used by any entity
 */
export class Inventory {
    constructor(maxSlots = 25) {
        this.slots = new Array(maxSlots).fill(null);
        this.maxSlots = maxSlots;
        this.eth = 0;
        this.maxWeight = 50;
    }

    addItem(item, slot = null) {
        // Try to add to specific slot if provided
        if (slot !== null && slot < this.maxSlots) {
            if (!this.slots[slot]) {
                this.slots[slot] = item;
                return true;
            }
            return false;
        }

        // Find first empty slot
        const emptySlot = this.slots.findIndex(s => !s);
        if (emptySlot !== -1) {
            this.slots[emptySlot] = item;
            return true;
        }
        return false;
    }

    getSlot(index) {
        if (index >= 0 && index < this.slots.length) {
            return this.slots[index];
        }
        return null;
    }

    getCurrentWeight() {
        return this.slots.reduce((total, item) => {
            return total + (item ? item.weight || 0 : 0);
        }, 0);
    }
}


