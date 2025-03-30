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

        // Create the container with explicit styles
        this.container = document.createElement('div');
        this.container.className = 'inventory-window';
        
        // Create category buttons
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'inventory-categories';
        ['All', 'Weapons', 'Armor', 'Consumables', 'Materials'].forEach(category => {
            const button = document.createElement('button');
            button.textContent = category;
            button.className = 'category-button';
            if (category === 'All') button.classList.add('active');
            button.addEventListener('click', () => this.setCategory(category));
            categoryContainer.appendChild(button);
        });
        this.container.appendChild(categoryContainer);

        // Create inventory grid with explicit dimensions
        this.inventoryGrid = document.createElement('div');
        this.inventoryGrid.className = 'inventory-grid';
        this.container.appendChild(this.inventoryGrid);

        // Create sort buttons
        const sortContainer = document.createElement('div');
        sortContainer.className = 'inventory-sort';
        ['Type', 'Name', 'Weight', 'Value'].forEach(sortType => {
            const button = document.createElement('button');
            button.textContent = `Sort by ${sortType}`;
            button.className = 'sort-button';
            button.addEventListener('click', () => {
                this.game.player.inventory.sortItems(sortType.toLowerCase());
                this.refresh();
            });
            sortContainer.appendChild(button);
        });
        this.container.insertBefore(sortContainer, this.weightBar);

        // Create weight bar
        this.weightBar = document.createElement('div');
        this.weightBar.className = 'weight-bar';
        this.container.appendChild(this.weightBar);

        // Add to document and hide initially
        document.body.appendChild(this.container);
        this.hide();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('InventoryUI constructor completed');
    }

    setupEventListeners() {
        // Only handle click-outside behavior
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

    toggle() {
        const isCurrentlyVisible = this.container.classList.contains('visible');
        console.log('Toggle called, currently visible:', isCurrentlyVisible);
        
        if (isCurrentlyVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (this.container.classList.contains('visible')) {
            console.log('Inventory already visible, ignoring show call');
            return;
        }
        
        console.log('Showing inventory');
        this.isVisible = true;
        
        // Use RAF to ensure smooth transition
        requestAnimationFrame(() => {
            this.container.classList.add('visible');
            this.refresh();
        });
    }

    hide() {
        if (!this.container.classList.contains('visible')) {
            console.log('Inventory already hidden, ignoring hide call');
            return;
        }
        
        console.log('Hiding inventory');
        this.isVisible = false;
        this.container.classList.remove('visible');
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

        // Add weight warning
        if (weightPercentage > 90) {
            this.weightBar.classList.add('weight-warning');
            this.showWeightWarning();
        } else {
            this.weightBar.classList.remove('weight-warning');
        }
    }

    showWeightWarning() {
        const warning = document.createElement('div');
        warning.className = 'weight-warning-popup';
        warning.textContent = 'You are carrying too much!';
        this.container.appendChild(warning);
        setTimeout(() => warning.remove(), 3000);
    }

    setCategory(category) {
        // Update active category
        this.activeCategory = category === 'All' ? null : category.toLowerCase();
        console.log('Setting category to:', this.activeCategory);

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

        console.log('Refreshing inventory UI');
        const inventory = this.game.player.inventory;
        
        // Log inventory state for debugging
        console.log('Current inventory state:', {
            slots: inventory.slots,
            maxSlots: inventory.maxSlots,
            eth: inventory.eth,
            activeCategory: this.activeCategory
        });

        // Clear existing grid
        this.inventoryGrid.innerHTML = '';

        // Create all slots (empty or filled)
        const maxSlots = inventory.maxSlots || 25;
        for (let i = 0; i < maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            
            const item = inventory.getSlot(i);
            if (item) {
                // Check if item matches active category
                const matchesCategory = !this.activeCategory || 
                    item.type.toLowerCase() === this.activeCategory;

                if (matchesCategory) {
                    console.log(`Slot ${i} contains matching item:`, item);
                    slot.innerHTML = `
                        <img src="${item.icon}" alt="${item.name}" title="${item.name}">
                        ${item.isStackable && item.quantity > 1 ? 
                            `<span class="item-quantity">${item.quantity}</span>` : ''}
                    `;
                    if (item.equipped) {
                        slot.classList.add('equipped');
                    }
                } else {
                    // If item doesn't match category, show empty slot
                    slot.classList.add('empty');
                }
            } else {
                slot.classList.add('empty');
            }
            
            this.inventoryGrid.appendChild(slot);
        }

        // Update weight bar
        this.updateWeightBar();
    }
}










