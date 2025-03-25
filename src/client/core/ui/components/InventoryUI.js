import { Item } from '../../inventory/Item.js';

export class InventoryUI {
    constructor(config) {
        this.game = config.game;
        this.isVisible = false;
        this.selectedSlot = null;
        this.draggedItem = null;
        this.hoveredSlot = null;
        
        // Create DOM elements
        this.createElements();
        this.setupEventListeners();
    }

    createElements() {
        // Main container
        this.container = document.createElement('div');
        this.container.className = 'inventory-ui';
        this.container.style.display = 'none';

        // Create inventory grid
        this.inventoryGrid = document.createElement('div');
        this.inventoryGrid.className = 'inventory-grid';

        // Create equipment slots
        this.equipmentSlots = document.createElement('div');
        this.equipmentSlots.className = 'equipment-slots';

        // Create stats display
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.className = 'stats-display';

        // Create gold display
        this.goldDisplay = document.createElement('div');
        this.goldDisplay.className = 'gold-display';

        // Add all elements to container
        this.container.appendChild(this.equipmentSlots);
        this.container.appendChild(this.inventoryGrid);
        this.container.appendChild(this.statsDisplay);
        this.container.appendChild(this.goldDisplay);

        document.body.appendChild(this.container);
    }

    setupEventListeners() {
        // Handle slot clicks
        this.container.addEventListener('mousedown', (e) => {
            const slot = e.target.closest('.inventory-slot');
            if (!slot) return;

            const slotIndex = parseInt(slot.dataset.slot);
            this.handleSlotClick(slotIndex, e);
        });

        // Handle drag and drop
        this.container.addEventListener('dragstart', (e) => {
            const slot = e.target.closest('.inventory-slot');
            if (!slot) return;
            
            this.draggedItem = {
                slot: parseInt(slot.dataset.slot),
                source: slot.dataset.type
            };
            
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
        });

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const slot = e.target.closest('.inventory-slot');
            if (slot) {
                this.hoveredSlot = {
                    slot: parseInt(slot.dataset.slot),
                    type: slot.dataset.type
                };
            }
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedItem && this.hoveredSlot) {
                this.handleItemDrop();
            }
        });

        // Handle tooltip
        this.container.addEventListener('mouseover', (e) => {
            const slot = e.target.closest('.inventory-slot');
            if (slot) {
                const item = this.getItemInSlot(slot);
                if (item) {
                    this.showTooltip(item, e);
                }
            }
        });

        this.container.addEventListener('mouseout', () => {
            this.hideTooltip();
        });

        // Close inventory on 'I' key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.toggle();
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    getItemInSlot(slot) {
        if (!slot) return null;
        
        const slotType = slot.dataset.type;
        const slotIndex = parseInt(slot.dataset.slot);

        if (slotType === 'inventory') {
            return this.game.player.inventory.getSlot(slotIndex);
        } else if (slotType === 'equipment') {
            const item = this.game.player.equipment[slotIndex];
            return item ? (item instanceof Item ? item : new Item(item)) : null;
        }
        return null;
    }

    handleSlotClick(slotIndex, event) {
        const inventory = this.game.player.inventory;
        const item = inventory.getSlot(slotIndex);

        if (event.button === 0) { // Left click
            if (item) {
                if (event.shiftKey) {
                    // Auto-equip if possible
                    if (item.type === 'weapon' || item.type === 'armor') {
                        this.game.player.equipItem(item.slot, slotIndex);
                    }
                } else {
                    // Select/deselect slot
                    this.selectedSlot = this.selectedSlot === slotIndex ? null : slotIndex;
                }
            }
        } else if (event.button === 2) { // Right click
            if (item && item.type === 'consumable') {
                item.use(this.game.player);
                this.refresh();
            }
        }

        this.refresh();
    }

    handleItemDrop() {
        const { slot: fromSlot, source: fromType } = this.draggedItem;
        const { slot: toSlot, type: toType } = this.hoveredSlot;

        if (fromType === 'inventory' && toType === 'equipment') {
            this.game.player.equipItem(toSlot, fromSlot);
        } else if (fromType === 'equipment' && toType === 'inventory') {
            this.game.player.unequipItem(fromSlot);
        } else if (fromType === 'inventory' && toType === 'inventory') {
            // Stack items if possible
            const fromItem = this.game.player.inventory.getSlot(fromSlot);
            const toItem = this.game.player.inventory.getSlot(toSlot);

            if (toItem && fromItem.id === toItem.id && toItem.isStackable) {
                this.game.player.inventory.stackItems(fromSlot, toSlot);
            } else {
                // Swap items
                this.game.player.inventory.swapSlots(fromSlot, toSlot);
            }
        }

        this.draggedItem = null;
        this.hoveredSlot = null;
        this.refresh();
    }

    refresh() {
        const inventory = this.game.player.inventory;
        const equipment = this.game.player.equipment;

        // Update inventory grid
        this.inventoryGrid.innerHTML = '';
        for (let i = 0; i < inventory.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            slot.dataset.type = 'inventory';
            slot.draggable = true;

            const item = inventory.getSlot(i);
            if (item) {
                slot.innerHTML = `
                    <img src="${item.icon}" alt="${item.name}">
                    ${item.isStackable && item.quantity > 1 ? 
                        `<span class="item-quantity">${item.quantity}</span>` : ''}
                `;
            }

            this.inventoryGrid.appendChild(slot);
        }

        // Update equipment slots
        this.equipmentSlots.innerHTML = '';
        Object.entries(equipment).forEach(([slot, item]) => {
            const slotElement = document.createElement('div');
            slotElement.className = `equipment-slot ${slot}`;
            slotElement.dataset.slot = slot;
            slotElement.dataset.type = 'equipment';
            slotElement.draggable = true;

            if (item) {
                slotElement.innerHTML = `<img src="${item.icon}" alt="${item.name}">`;
            }

            this.equipmentSlots.appendChild(slotElement);
        });

        // Update stats
        this.statsDisplay.innerHTML = `
            <div>Defense: ${this.game.player.defense}</div>
            <div>Damage: ${this.game.player.damage}</div>
            <div>Weight: ${inventory.weight}/${inventory.maxWeight}</div>
        `;

        // Update gold display with inline gold icon
        this.updateGoldDisplay();
    }

    updateGoldDisplay() {
        this.goldDisplay.innerHTML = `
            <div class="eth">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAPklEQVR42mNkGAWjYBQMkmBk1AGjDhh1wKgDRh0w6oBRB4w6YNQBow4YdcCoA0YdMOqAUQeMOmAQOAAAQu8F/Q7yucQAAAAASUVORK5CYII=" alt="ETH">
                ${this.game.player.inventory.eth}
            </div>
        `;
    }

    showTooltip(item, event) {
        if (!item || !item.getTooltip) return; // Guard clause for invalid items

        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        tooltip.setAttribute('data-rarity', item.rarity || 'common');
        tooltip.innerHTML = item.getTooltip();
        
        // Position tooltip near mouse
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        
        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.item-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.refresh();
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}




