export class Inventory {
    constructor(config = {}) {
        this.maxSlots = config.maxSlots || 20;
        this.maxWeight = config.maxWeight || 100;
        this.owner = config.owner;
        
        // Initialize slots first
        this.slots = new Array(this.maxSlots).fill(null);
        
        // Always initialize ETH as a number with a default of 0
        this._eth = Number(config.eth || 0);
        
        console.log('Inventory initialized with ETH:', {
            initialValue: config.eth,
            convertedValue: this._eth,
            type: typeof this._eth
        });
    }

    get eth() {
        return Number(this._eth || 0);
    }

    set eth(value) {
        this._eth = Number(value || 0);
        console.log('Setting ETH:', {
            newValue: this._eth,
            type: typeof this._eth
        });
    }

    addItem(item) {
        if (!item) return false;
        
        // Find first empty slot
        const emptySlot = this.slots.findIndex(slot => slot === null);
        if (emptySlot === -1) return false;
        
        this.slots[emptySlot] = item;
        return true;
    }

    getSlot(index) {
        if (index < 0 || index >= this.slots.length) return null;
        return this.slots[index];
    }

    transferItem(fromSlot, toInventory, quantity = 1) {
        const item = this.getSlot(fromSlot);
        if (!item) return false;

        if (toInventory.addItem(item)) {
            this.slots[fromSlot] = null;
            return true;
        }
        return false;
    }
}


