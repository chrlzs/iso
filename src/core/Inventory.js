/**
 * Inventory - Manages items for entities
 */
export class Inventory {
    /**
     * Creates a new inventory
     * @param {Object} options - Inventory options
     * @param {number} options.capacity - Maximum number of items (default: 20)
     * @param {Entity} options.owner - Entity that owns this inventory
     */
    constructor(options = {}) {
        this.capacity = options.capacity || 20;
        this.owner = options.owner || null;
        this.items = [];
        this.selectedSlot = -1;
        
        // Event callbacks
        this.onItemAdded = null;
        this.onItemRemoved = null;
        this.onItemSelected = null;
    }
    
    /**
     * Adds an item to the inventory
     * @param {Item} item - The item to add
     * @returns {boolean} Whether the item was added successfully
     */
    addItem(item) {
        if (!item) return false;
        
        // Check if inventory is full
        if (this.items.length >= this.capacity) {
            return false;
        }
        
        // Check if item is stackable and we already have one
        if (item.stackable) {
            const existingItem = this.findItem(item.type);
            
            if (existingItem) {
                existingItem.quantity += item.quantity || 1;
                
                // Call event callback
                if (this.onItemAdded) {
                    this.onItemAdded(existingItem, this.items.indexOf(existingItem));
                }
                
                return true;
            }
        }
        
        // Add new item
        this.items.push(item);
        
        // Set owner reference
        item.owner = this.owner;
        
        // Call event callback
        if (this.onItemAdded) {
            this.onItemAdded(item, this.items.length - 1);
        }
        
        return true;
    }
    
    /**
     * Removes an item from the inventory
     * @param {number} index - Index of the item to remove
     * @returns {Item|null} The removed item or null if not found
     */
    removeItem(index) {
        if (index < 0 || index >= this.items.length) {
            return null;
        }
        
        const item = this.items[index];
        
        // Remove item
        this.items.splice(index, 1);
        
        // Clear owner reference
        item.owner = null;
        
        // Call event callback
        if (this.onItemRemoved) {
            this.onItemRemoved(item, index);
        }
        
        // Update selected slot if needed
        if (this.selectedSlot === index) {
            this.selectedSlot = -1;
        } else if (this.selectedSlot > index) {
            this.selectedSlot--;
        }
        
        return item;
    }
    
    /**
     * Gets an item from the inventory
     * @param {number} index - Index of the item to get
     * @returns {Item|null} The item or null if not found
     */
    getItem(index) {
        if (index < 0 || index >= this.items.length) {
            return null;
        }
        
        return this.items[index];
    }
    
    /**
     * Finds an item by type
     * @param {string} type - Item type to find
     * @returns {Item|null} The first matching item or null if not found
     */
    findItem(type) {
        return this.items.find(item => item.type === type) || null;
    }
    
    /**
     * Finds all items of a specific type
     * @param {string} type - Item type to find
     * @returns {Array} Array of matching items
     */
    findItems(type) {
        return this.items.filter(item => item.type === type);
    }
    
    /**
     * Selects an item slot
     * @param {number} index - Index of the slot to select
     * @returns {Item|null} The selected item or null if invalid
     */
    selectItem(index) {
        if (index < 0 || index >= this.items.length) {
            this.selectedSlot = -1;
            
            // Call event callback
            if (this.onItemSelected) {
                this.onItemSelected(null, -1);
            }
            
            return null;
        }
        
        this.selectedSlot = index;
        const item = this.items[index];
        
        // Call event callback
        if (this.onItemSelected) {
            this.onItemSelected(item, index);
        }
        
        return item;
    }
    
    /**
     * Gets the currently selected item
     * @returns {Item|null} The selected item or null if none selected
     */
    getSelectedItem() {
        if (this.selectedSlot < 0 || this.selectedSlot >= this.items.length) {
            return null;
        }
        
        return this.items[this.selectedSlot];
    }
    
    /**
     * Uses the selected item
     * @returns {boolean} Whether the item was used successfully
     */
    useSelectedItem() {
        const item = this.getSelectedItem();
        
        if (!item || !item.use) {
            return false;
        }
        
        // Use the item
        const result = item.use(this.owner);
        
        // Remove item if consumed
        if (result && item.consumable) {
            item.quantity = (item.quantity || 1) - 1;
            
            if (item.quantity <= 0) {
                this.removeItem(this.selectedSlot);
            }
        }
        
        return result;
    }
    
    /**
     * Swaps two items in the inventory
     * @param {number} index1 - Index of the first item
     * @param {number} index2 - Index of the second item
     * @returns {boolean} Whether the swap was successful
     */
    swapItems(index1, index2) {
        if (index1 < 0 || index1 >= this.items.length ||
            index2 < 0 || index2 >= this.items.length) {
            return false;
        }
        
        // Swap items
        const temp = this.items[index1];
        this.items[index1] = this.items[index2];
        this.items[index2] = temp;
        
        // Update selected slot if needed
        if (this.selectedSlot === index1) {
            this.selectedSlot = index2;
        } else if (this.selectedSlot === index2) {
            this.selectedSlot = index1;
        }
        
        return true;
    }
    
    /**
     * Sorts the inventory by item type
     */
    sort() {
        this.items.sort((a, b) => {
            // Sort by type first
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type);
            }
            
            // Then by name
            if (a.name !== b.name) {
                return a.name.localeCompare(b.name);
            }
            
            // Then by value (higher value first)
            return (b.value || 0) - (a.value || 0);
        });
        
        // Reset selected slot
        this.selectedSlot = -1;
    }
    
    /**
     * Clears the inventory
     */
    clear() {
        // Clear owner references
        this.items.forEach(item => {
            item.owner = null;
        });
        
        this.items = [];
        this.selectedSlot = -1;
    }
    
    /**
     * Gets the number of items in the inventory
     * @returns {number} Item count
     */
    getItemCount() {
        return this.items.length;
    }
    
    /**
     * Checks if the inventory is full
     * @returns {boolean} Whether the inventory is full
     */
    isFull() {
        return this.items.length >= this.capacity;
    }
    
    /**
     * Checks if the inventory is empty
     * @returns {boolean} Whether the inventory is empty
     */
    isEmpty() {
        return this.items.length === 0;
    }
    
    /**
     * Gets the inventory capacity
     * @returns {number} Inventory capacity
     */
    getCapacity() {
        return this.capacity;
    }
    
    /**
     * Sets the inventory capacity
     * @param {number} capacity - New capacity
     */
    setCapacity(capacity) {
        this.capacity = Math.max(1, capacity);
        
        // Remove excess items if capacity was reduced
        while (this.items.length > this.capacity) {
            this.removeItem(this.items.length - 1);
        }
    }
}
