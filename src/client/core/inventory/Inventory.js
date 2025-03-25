import { Item } from './Item.js';

/**
 * Base inventory system that can be used by any entity
 */
export class Inventory {
    constructor(config = {}) {
        this.maxSlots = config.maxSlots || 20;
        this.items = new Map(); // slot -> item mapping
        this.owner = config.owner; // reference to the entity that owns this inventory
        this.gold = config.gold || 0;
        this.weight = 0;
        this.maxWeight = config.maxWeight || 100;
    }

    /**
     * Attempts to add an item to the inventory
     * @param {Item} item - The item to add
     * @param {number} [quantity=1] - Amount to add
     * @returns {boolean} - Whether the addition was successful
     */
    addItem(item, quantity = 1) {
        if (this.weight + (item.weight * quantity) > this.maxWeight) {
            return false;
        }

        // Ensure item is an Item instance
        const itemToAdd = item instanceof Item ? item : new Item(item);

        // Check for stackable items
        if (itemToAdd.isStackable) {
            for (const [slot, existingItem] of this.items) {
                if (existingItem.id === itemToAdd.id) {
                    existingItem.quantity += quantity;
                    this.weight += itemToAdd.weight * quantity;
                    return true;
                }
            }
        }

        // Find first empty slot
        for (let i = 0; i < this.maxSlots; i++) {
            if (!this.items.has(i)) {
                this.items.set(i, itemToAdd);
                itemToAdd.quantity = quantity;
                this.weight += itemToAdd.weight * quantity;
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
        if (this.weight + (item.weight * quantity) > this.maxWeight) {
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
}
