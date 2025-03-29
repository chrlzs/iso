import { Item } from './Item.js';

/**
 * Base inventory system that can be used by any entity
 */
export class Inventory {
    constructor(maxSlots = 30, maxWeight = 100) {
        this.maxSlots = maxSlots;
        this.maxWeight = maxWeight;
        this.items = new Map();
        this.weight = 0;
        this.eth = 0;
    }

    getCurrentWeight() {
        let totalWeight = 0;
        for (const [slot, item] of this.items) {
            totalWeight += item.weight * (item.quantity || 1);
        }
        return totalWeight;
    }

    /**
     * Attempts to add an item to the inventory
     * @param {Item} item - The item to add
     * @param {number} [quantity=1] - Amount to add
     * @returns {boolean} - Whether the addition was successful
     */
    addItem(item, quantity = 1) {
        if (this.getCurrentWeight() + (item.weight * quantity) > this.maxWeight) {
            return false;
        }

        // Ensure item is an Item instance
        const itemToAdd = item instanceof Item ? item : new Item(item);

        // Check for stackable items
        if (itemToAdd.isStackable) {
            for (const [slot, existingItem] of this.items) {
                if (existingItem.id === itemToAdd.id) {
                    existingItem.quantity += quantity;
                    return true;
                }
            }
        }

        // Find first empty slot
        for (let i = 0; i < this.maxSlots; i++) {
            if (!this.items.has(i)) {
                itemToAdd.quantity = quantity;
                this.items.set(i, itemToAdd);
                return true;
            }
        }

        return false;
    }

    /**
     * Removes an item from a specific slot
     * @param {number} slot - Inventory slot number
     * @param {number} [quantity=1] - Amount to remove
     * @returns {Item|null} - The removed item or null if failed
     */
    removeItem(slot, quantity = 1) {
        const item = this.items.get(slot);
        if (!item) return null;

        if (item.quantity > quantity) {
            item.quantity -= quantity;
            this.weight -= item.weight * quantity;
            return { ...item, quantity };
        } else {
            this.items.delete(slot);
            this.weight -= item.weight * item.quantity;
            return item;
        }
    }

    /**
     * Transfers an item to another inventory
     * @param {number} fromSlot - Source inventory slot
     * @param {Inventory} toInventory - Target inventory
     * @param {number} [quantity=1] - Amount to transfer
     * @returns {boolean} - Whether the transfer was successful
     */
    transferItem(fromSlot, toInventory, quantity = 1) {
        const item = this.items.get(fromSlot);
        if (!item) return false;

        if (toInventory.addItem(item, quantity)) {
            this.removeItem(fromSlot, quantity);
            return true;
        }
        return false;
    }

    /**
     * Gets the contents of a specific slot
     * @param {number} slot - Inventory slot to check
     * @returns {Item|null} - The item in the slot or null if empty
     */
    getSlot(slot) {
        const item = this.items.get(slot);
        // Return null if no item, otherwise ensure it's an Item instance
        return item ? (item instanceof Item ? item : new Item(item)) : null;
    }

    /**
     * Checks if the inventory has space for an item
     * @param {Item} item - Item to check
     * @param {number} [quantity=1] - Amount to check for
     * @returns {boolean} - Whether the item can be added
     */
    hasSpace(item, quantity = 1) {
        if (this.getCurrentWeight() + (item.weight * quantity) > this.maxWeight) {
            return false;
        }

        if (item.isStackable) {
            for (const [slot, existingItem] of this.items) {
                if (existingItem.id === item.id) {
                    return true;
                }
            }
        }

        return this.items.size < this.maxSlots;
    }

    /**
     * Sorts and optimizes inventory space
     * @param {string} [sortBy='category'] - Sort by: 'category', 'value', 'weight', 'name'
     */
    sort(sortBy = 'category') {
        const items = Array.from(this.items.values());
        this.items.clear();
        
        // Stack similar items first
        this.consolidateStacks(items);
        
        // Sort items based on criteria
        items.sort((a, b) => {
            switch(sortBy) {
                case 'category':
                    return a.type.localeCompare(b.type) || b.value - a.value;
                case 'value':
                    return b.value - a.value;
                case 'weight':
                    return a.weight - b.weight;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        // Reassign to slots
        items.forEach((item, index) => {
            this.items.set(index, item);
        });
    }

    /**
     * Consolidates stackable items
     * @private
     */
    consolidateStacks(items) {
        const stackMap = new Map();
        
        // Group stackable items
        items.forEach(item => {
            if (item.isStackable) {
                const existing = stackMap.get(item.id);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    stackMap.set(item.id, item);
                }
            }
        });

        return items.filter(item => {
            if (!item.isStackable) return true;
            const stack = stackMap.get(item.id);
            return stack === item;
        });
    }

    /**
     * Finds the first slot containing an item matching the criteria
     * @param {Function} predicate - Function to test each item
     * @returns {number|null} - Slot number or null if not found
     */
    findItem(predicate) {
        for (const [slot, item] of this.items) {
            if (predicate(item)) {
                return slot;
            }
        }
        return null;
    }

    /**
     * Gets all items of a specific category
     * @param {string} category - Category to filter by
     * @returns {Array} - Array of items
     */
    getItemsByCategory(category) {
        return Array.from(this.items.values())
            .filter(item => item.type === category);
    }

    /**
     * Splits a stack of items
     * @param {number} fromSlot - Source slot
     * @param {number} quantity - Amount to split
     * @returns {boolean} - Whether the split was successful
     */
    splitStack(fromSlot, quantity) {
        const sourceItem = this.items.get(fromSlot);
        if (!sourceItem || !sourceItem.isStackable || sourceItem.quantity <= quantity) {
            return false;
        }

        const newStack = { ...sourceItem, quantity: quantity };
        sourceItem.quantity -= quantity;

        return this.addItem(newStack);
    }
}


