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

    updateWeightBar() {
        if (!this.weightBar) return;

        const inventory = this.game.player.inventory;
        const currentWeight = inventory.getCurrentWeight();
        const maxWeight = inventory.maxWeight;
        const weightPercentage = (currentWeight / maxWeight) * 100;

        // Create or get the fill element
        let fillElement = this.weightBar.querySelector('.weight-fill');
        if (!fillElement) {
            fillElement = document.createElement('div');
            fillElement.className = 'weight-fill';
            this.weightBar.appendChild(fillElement);
        }

        // Update the fill width and color
        fillElement.style.width = `${weightPercentage}%`;
        
        // Color coding based on weight percentage
        if (weightPercentage >= 90) {
            fillElement.style.backgroundColor = '#ff4444'; // Red when near max
        } else if (weightPercentage >= 75) {
            fillElement.style.backgroundColor = '#ffaa44'; // Orange when getting heavy
        } else {
            fillElement.style.backgroundColor = '#44aa44'; // Green for normal weight
        }

        // Add weight text
        this.weightBar.setAttribute('data-weight', 
            `${Math.round(currentWeight)}/${maxWeight} units`);
    }

    setCategory(category) {
        // Update active category
        this.activeCategory = category === 'All' ? null : category;

        // Update button styles
        const buttons = this.container.querySelectorAll('.category-button');
        buttons.forEach(button => {
            if (button.textContent === category) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Refresh the inventory display
        this.refresh();
    }

    refresh() {
        if (!this.isVisible) return;

        const inventory = this.game.player.inventory;
        
        // Clear existing grid
        this.inventoryGrid.innerHTML = '';

        // Get items based on category
        let items = [];
        if (this.activeCategory) {
            items = Array.from(inventory.items.entries())
                .filter(([_, item]) => item.type === this.activeCategory);
        } else {
            items = Array.from(inventory.items.entries());
        }

        // Populate inventory slots
        for (let i = 0; i < inventory.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            slot.dataset.type = 'inventory';
            
            const itemEntry = items.find(([slot, _]) => slot === i);
            if (itemEntry) {
                const item = itemEntry[1];
                slot.innerHTML = `
                    <img src="${item.icon}" alt="${item.name}">
                    ${item.isStackable && item.quantity > 1 ? 
                        `<span class="item-quantity">${item.quantity}</span>` : ''}
                `;
                slot.draggable = true;
            }
            
            this.inventoryGrid.appendChild(slot);
        }

        // Update weight bar
        this.updateWeightBar();
    }
}





