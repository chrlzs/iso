import { Item } from '../../inventory/Item.js';

export class InventoryUI {
    constructor(config) {
        this.game = config.game;
        this.isVisible = false;
        this.createElements();
        this.setupEventListeners();
    }

    // Add empty render method for DOM-based UI
    render() {
        // DOM-based component, no canvas rendering needed
        return;
    }

    // Add update method for consistency
    update(deltaTime) {
        // Update any dynamic content if needed
        if (this.isVisible) {
            // Optional: Update any real-time elements
        }
    }

    createElements() {
        // Main container
        this.container = document.createElement('div');
        this.container.className = 'inventory-ui';
        
        // Create flex container for the three columns
        this.inventoryContainer = document.createElement('div');
        this.inventoryContainer.className = 'inventory-container';
        
        // Equipment slots (left column)
        this.equipmentSlots = document.createElement('div');
        this.equipmentSlots.className = 'equipment-slots';
        
        // Create equipment slot positions
        const slots = ['head', 'mainHand', 'body', 'offHand', 'legs', 'feet'];
        slots.forEach(slotName => {
            const slot = document.createElement('div');
            slot.className = `equipment-slot ${slotName}`;
            slot.dataset.slot = slotName;
            slot.dataset.type = 'equipment';
            slot.draggable = true;
            this.equipmentSlots.appendChild(slot);
        });
        
        // Inventory grid (middle column)
        this.inventoryGrid = document.createElement('div');
        this.inventoryGrid.className = 'inventory-grid';
        
        // Stats display (right column)
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.className = 'stats-display';
        
        // Gold display
        this.goldDisplay = document.createElement('div');
        this.goldDisplay.className = 'gold-display';
        
        // Assemble the UI
        this.inventoryContainer.appendChild(this.equipmentSlots);
        this.inventoryContainer.appendChild(this.inventoryGrid);
        this.inventoryContainer.appendChild(this.statsDisplay);
        
        this.container.appendChild(this.inventoryContainer);
        this.container.appendChild(this.goldDisplay);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 5px 10px;
        `;
        closeButton.onclick = () => this.hide();
        this.container.appendChild(closeButton);
        
        document.body.appendChild(this.container);
    }

    setupEventListeners() {
        // Add click event listener to close inventory when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (this.isVisible && !this.container.contains(e.target)) {
                this.hide();
            }
        });

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

        // Handle 'I' key to toggle inventory
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.toggle();
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
        if (!this.isVisible) return;

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
        Object.entries(equipment).forEach(([slotName, item]) => {
            const slotElement = this.equipmentSlots.querySelector(`.equipment-slot.${slotName}`);
            if (slotElement) {
                slotElement.innerHTML = item ? `<img src="${item.icon}" alt="${item.name}">` : '';
            }
        });

        // Update stats
        this.statsDisplay.innerHTML = `
            <h3>Stats</h3>
            <div>Defense: ${this.game.player.defense || 0}</div>
            <div>Damage: ${this.game.player.damage || 0}</div>
            <div>Weight: ${inventory.weight}/${inventory.maxWeight} kg</div>
        `;

        // Update gold display
        this.updateGoldDisplay();
    }

    updateGoldDisplay() {
        const ethAmount = this.game.player.inventory.eth || 0;
        this.goldDisplay.innerHTML = `
            <img src="assets/icons/eth.png" alt="ETH">
            <span>${ethAmount.toFixed(2)} ETH</span>
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
        this.container.style.display = 'block';
        this.refresh();
        this.game.uiManager.activeWindows.add('inventoryUI');
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.game.uiManager.activeWindows.delete('inventoryUI');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}












