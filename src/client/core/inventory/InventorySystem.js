/**
 * Manages item storage, stacking, and inventory operations
 * @class InventorySystem
 */
export class InventorySystem {
    /**
     * Creates a new InventorySystem instance
     * @param {Object} [config={}] - Inventory configuration
     * @param {number} [config.maxSlots=25] - Maximum inventory slots
     * @param {number} [config.maxWeight=100] - Maximum carry weight
     * @param {number} [config.startingEth=0] - Starting ETH amount
     */
    constructor(config = {}) {
        this.maxSlots = config.maxSlots || 25;
        this.maxWeight = config.maxWeight || 100;
        this.slots = new Array(this.maxSlots).fill(null);
        this.eth = config.startingEth || 0;
    }

    /**
     * Adds an item to the inventory
     * @param {Item} item - Item to add
     * @param {number} [quantity=1] - Quantity to add
     * @returns {boolean} True if item was added successfully
     */
    addItem(item, quantity = 1) {
        if (!item || quantity <= 0) return false;

        // Check if item is stackable and already exists in inventory
        if (item.isStackable) {
            const existingSlot = this.slots.find(slot => slot && slot.id === item.id);
            if (existingSlot) {
                existingSlot.quantity += quantity;
                return true;
            }
        }

        // Find an empty slot
        const emptySlotIndex = this.slots.findIndex(slot => slot === null);
        if (emptySlotIndex === -1) {
            console.warn('Inventory is full');
            return false;
        }

        // Add item to empty slot
        const newItem = { ...item, quantity };
        this.slots[emptySlotIndex] = newItem;
        return true;
    }

    /**
     * Removes an item from the inventory
     * @param {number} slotIndex - Slot to remove from
     * @param {number} [quantity=1] - Quantity to remove
     * @returns {Item|null} Removed item or null if failed
     */
    removeItem(slotIndex, quantity = 1) {
        const slot = this.slots[slotIndex];
        if (!slot || quantity <= 0) return null;

        if (slot.quantity > quantity) {
            slot.quantity -= quantity;
            return { ...slot, quantity };
        } else {
            this.slots[slotIndex] = null;
            return slot;
        }
    }

    /**
     * Gets item from specified slot
     * @param {number} slotIndex - Slot to get item from
     * @returns {Item|null} Item in slot or null if empty
     */
    getSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) {
            console.warn('Invalid slot index:', slotIndex);
            return null;
        }
        return this.slots[slotIndex];
    }

    /**
     * Gets current total weight of inventory
     * @returns {number} Current weight
     */
    getCurrentWeight() {
        return this.slots.reduce((total, slot) => {
            if (slot) {
                return total + (slot.weight * slot.quantity);
            }
            return total;
        }, 0);
    }

    /**
     * Sorts inventory items by specified criteria
     * @param {string} sortType - Sort criteria (name, type, weight, value)
     * @returns {void}
     */
    sortItems(sortType) {
        const compareFunctions = {
            name: (a, b) => a.name.localeCompare(b.name),
            type: (a, b) => a.type.localeCompare(b.type),
            weight: (a, b) => a.weight - b.weight,
            value: (a, b) => a.value - b.value
        };

        const compareFunction = compareFunctions[sortType];
        if (!compareFunction) {
            console.warn('Invalid sort type:', sortType);
            return;
        }

        this.slots = this.slots.filter(slot => slot !== null).sort(compareFunction);
    }
}