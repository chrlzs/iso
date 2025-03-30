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
        this.container.style.cssText = `
            display: none;
            visibility: hidden;
            opacity: 0;
            position: fixed;
            z-index: 1000;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;
        
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
        console.log('Setting up InventoryUI event listeners');
        
        // Add key event listener for inventory toggle
        document.addEventListener('keydown', (e) => {
            console.log('Keydown in InventoryUI:', e.key);
            if (e.key.toLowerCase() === 'i') {
                console.log('I key pressed in InventoryUI');
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

    toggle() {
        console.log('Toggle called. Current visibility:', this.isVisible);
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        console.log('Showing inventory');
        this.isVisible = true;
        this.container.style.display = 'block';
        this.container.style.visibility = 'visible';
        this.container.style.opacity = '1';
        this.refresh();
        if (this.game?.uiManager) {
            this.game.uiManager.activeWindows.add('inventoryUI');
        }
    }

    hide() {
        console.log('Hiding inventory');
        this.isVisible = false;
        this.container.style.display = 'none';
        this.container.style.visibility = 'hidden';
        this.container.style.opacity = '0';
        if (this.game?.uiManager) {
            this.game.uiManager.activeWindows.delete('inventoryUI');
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
        let items = Array.from(inventory.items.entries());
        if (this.activeCategory) {
            items = items.filter(([_, item]) => item.type === this.activeCategory);
        }

        // Create all slots (empty or filled)
        for (let i = 0; i < inventory.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            slot.dataset.type = 'inventory';
            
            // Find item for this slot
            const itemEntry = items.find(([slotNum, _]) => slotNum === i);
            
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










