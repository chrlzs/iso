import { Item } from '../../inventory/Item.js';

export class InventoryUI {
    constructor(game) {
        console.log('InventoryUI constructor started');
        
        this.game = game;
        this.selectedSlot = null;
        this.draggedItem = null;
        this.hoveredSlot = null;
        this.isVisible = false;
        this.activeCategory = null;

        // Create the container
        this.container = document.createElement('div');
        this.container.className = 'inventory-window';
        this.container.style.display = 'none';
        
        // Create inventory grid
        this.inventoryGrid = document.createElement('div');
        this.inventoryGrid.className = 'inventory-grid';
        this.container.appendChild(this.inventoryGrid);

        // Create category buttons
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'inventory-categories';
        
        ['All', 'Weapons', 'Armor', 'Consumables', 'Materials'].forEach(category => {
            const button = document.createElement('button');
            button.textContent = category;
            button.className = 'category-button';
            button.addEventListener('click', () => this.setCategory(category));
            categoryContainer.appendChild(button);
        });

        this.container.insertBefore(categoryContainer, this.inventoryGrid);

        // Create weight bar
        this.weightBar = document.createElement('div');
        this.weightBar.className = 'weight-bar';
        this.container.appendChild(this.weightBar);

        // Add to document
        document.body.appendChild(this.container);

        // Setup event listeners
        this.setupEventListeners();
        
        console.log('InventoryUI constructor completed');
    }

    setupEventListeners() {
        // Add key event listener for inventory toggle
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'i') {
                e.preventDefault(); // Prevent default 'i' behavior
                this.toggle();
            }
        });

        // Close inventory when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (this.isVisible && !this.container.contains(e.target)) {
                this.hide();
            }
        });

        // Handle slot clicks
        this.inventoryGrid.addEventListener('mousedown', (e) => {
            const slot = e.target.closest('.inventory-slot');
            if (!slot) return;

            const slotIndex = parseInt(slot.dataset.slot);
            this.handleSlotClick(slotIndex, e);
        });
    }

    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.refresh();
        if (this.game.uiManager) {
            this.game.uiManager.activeWindows.add('inventoryUI');
        }
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        if (this.game.uiManager) {
            this.game.uiManager.activeWindows.delete('inventoryUI');
        }
    }

    toggle() {
        console.log('Toggling inventory. Current state:', this.isVisible); // Debug log
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    refresh() {
        if (!this.isVisible) return;

        const inventory = this.game.player.inventory;
        
        // Clear existing grid
        this.inventoryGrid.innerHTML = '';

        // Populate inventory slots
        for (let i = 0; i < inventory.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            slot.dataset.type = 'inventory';
            
            const item = inventory.items.get(i);
            if (item) {
                slot.innerHTML = `
                    <img src="${item.icon}" alt="${item.name}">
                    ${item.isStackable && item.quantity > 1 ? 
                        `<span class="item-quantity">${item.quantity}</span>` : ''}
                `;
                slot.draggable = true;
            }
            
            this.inventoryGrid.appendChild(slot);
        }

        // Update weight bar if it exists
        if (this.weightBar) {
            this.updateWeightBar();
        }
    }
}



