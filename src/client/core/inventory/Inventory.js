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
        // Try to stack first if item is stackable
        if (item.isStackable) {
            const existingStack = this.slots.find(s => 
                s && s.id === item.id && s.quantity < s.maxStack
            );
            if (existingStack) {
                const spaceInStack = existingStack.maxStack - existingStack.quantity;
                const amountToAdd = Math.min(item.quantity || 1, spaceInStack);
                existingStack.quantity += amountToAdd;
                return true;
            }
        }

        // Check weight limit
        if (this.getCurrentWeight() + (item.weight || 0) > this.maxWeight) {
            return false;
        }

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

    removeItem(slot, quantity = 1) {
        const item = this.slots[slot];
        if (!item) return null;

        if (item.isStackable && item.quantity > quantity) {
            item.quantity -= quantity;
            return { ...item, quantity };
        } else {
            this.slots[slot] = null;
            return item;
        }
    }

    sortItems(by = 'type') {
        const filledSlots = this.slots.filter(slot => slot !== null);
        const sortedItems = filledSlots.sort((a, b) => {
            if (by === 'type') return a.type.localeCompare(b.type);
            if (by === 'name') return a.name.localeCompare(b.name);
            if (by === 'weight') return b.weight - a.weight;
            if (by === 'value') return b.value - a.value;
            return 0;
        });

        // Clear and refill slots
        this.slots.fill(null);
        sortedItems.forEach((item, index) => {
            this.slots[index] = item;
        });
    }

    hasSpace(item) {
        if (this.getCurrentWeight() + (item.weight || 0) > this.maxWeight) {
            return false;
        }
        return this.slots.some(slot => slot === null);
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


