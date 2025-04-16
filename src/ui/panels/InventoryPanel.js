import { PIXI } from '../../utils/PixiWrapper.js';
import { Panel } from '../components/Panel.js';

/**
 * InventoryPanel - A panel for displaying and managing inventory
 */
export class InventoryPanel extends Panel {
    /**
     * Creates a new inventory panel
     * @param {Object} options - Panel options
     */
    constructor(options = {}) {
        super({
            id: 'inventory',
            title: 'Inventory',
            width: options.width || 300,
            height: options.height || 400,
            x: options.x || 100,
            y: options.y || 100,
            closable: true,
            draggable: true,
            visible: false,
            ...options
        });
        
        // Inventory reference
        this.inventory = options.inventory || null;
        
        // Slot configuration
        this.slotSize = options.slotSize || 40;
        this.slotsPerRow = options.slotsPerRow || 5;
        this.slotPadding = options.slotPadding || 5;
        
        // Create slots
        if (this.inventory) {
            this.createSlots();
        }
    }
    
    /**
     * Creates inventory slots
     * @private
     */
    createSlots() {
        // Clear existing slots
        this.clearContent();
        
        // Create slots container
        this.slotsContainer = new PIXI.Container();
        this.addContent(this.slotsContainer);
        
        // Create slots
        this.slots = [];
        
        for (let i = 0; i < this.inventory.capacity; i++) {
            const slot = this.createSlot(i);
            const row = Math.floor(i / this.slotsPerRow);
            const col = i % this.slotsPerRow;
            
            slot.position.set(
                col * (this.slotSize + this.slotPadding),
                row * (this.slotSize + this.slotPadding)
            );
            
            this.slotsContainer.addChild(slot);
            this.slots.push(slot);
        }
        
        // Set up inventory event handlers
        if (this.inventory) {
            this.inventory.onItemAdded = () => this.updateSlots();
            this.inventory.onItemRemoved = () => this.updateSlots();
            this.inventory.onItemSelected = () => this.updateSlots();
        }
        
        // Initial update
        this.updateSlots();
    }
    
    /**
     * Creates a single inventory slot
     * @param {number} index - Slot index
     * @returns {PIXI.Container} Slot container
     * @private
     */
    createSlot(index) {
        const slot = new PIXI.Container();
        slot.interactive = true;
        slot.eventMode = 'static';
        slot.cursor = 'pointer';
        
        // Create background
        const background = new PIXI.Graphics();
        background.lineStyle(1, 0x666666);
        background.beginFill(0x333333);
        background.drawRect(0, 0, this.slotSize, this.slotSize);
        background.endFill();
        
        slot.addChild(background);
        slot.background = background;
        
        // Add event listeners
        slot.on('pointerover', () => {
            background.clear();
            background.lineStyle(1, 0xAAAAAA);
            background.beginFill(0x444444);
            background.drawRect(0, 0, this.slotSize, this.slotSize);
            background.endFill();
        });
        
        slot.on('pointerout', () => {
            background.clear();
            background.lineStyle(1, 0x666666);
            background.beginFill(0x333333);
            background.drawRect(0, 0, this.slotSize, this.slotSize);
            background.endFill();
        });
        
        slot.on('pointerdown', () => {
            if (this.inventory) {
                this.inventory.selectSlot(index);
                this.updateSlots();
                
                // Emit item selected event
                if (this.onItemSelected) {
                    const item = this.inventory.getItem(index);
                    if (item) {
                        this.onItemSelected(item, index);
                    }
                }
            }
        });
        
        return slot;
    }
    
    /**
     * Updates all inventory slots
     */
    updateSlots() {
        if (!this.inventory || !this.slots) return;
        
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            const item = this.inventory.getItem(i);
            
            // Clear slot
            if (slot.itemSprite) {
                slot.removeChild(slot.itemSprite);
                slot.itemSprite = null;
            }
            
            if (slot.quantityText) {
                slot.removeChild(slot.quantityText);
                slot.quantityText = null;
            }
            
            // Add item if exists
            if (item) {
                // Create item sprite
                const itemSprite = new PIXI.Graphics();
                itemSprite.beginFill(item.getRarityColor ? item.getRarityColor() : 0xFFFFFF);
                itemSprite.drawRect(5, 5, this.slotSize - 10, this.slotSize - 10);
                itemSprite.endFill();
                
                slot.addChild(itemSprite);
                slot.itemSprite = itemSprite;
                
                // Add quantity text if stackable
                if (item.stackable && item.quantity > 1) {
                    const quantityText = new PIXI.Text(item.quantity.toString(), {
                        fontFamily: 'Arial',
                        fontSize: 10,
                        fill: 0xFFFFFF,
                        stroke: 0x000000,
                        strokeThickness: 2
                    });
                    
                    quantityText.anchor.set(1, 1);
                    quantityText.position.set(this.slotSize - 5, this.slotSize - 5);
                    slot.addChild(quantityText);
                    slot.quantityText = quantityText;
                }
                
                // Highlight selected slot
                if (i === this.inventory.selectedSlot) {
                    slot.background.clear();
                    slot.background.lineStyle(2, 0xFFFF00);
                    slot.background.beginFill(0x333333);
                    slot.background.drawRect(0, 0, this.slotSize, this.slotSize);
                    slot.background.endFill();
                }
            }
        }
    }
    
    /**
     * Sets the inventory to display
     * @param {Inventory} inventory - Inventory to display
     */
    setInventory(inventory) {
        this.inventory = inventory;
        this.createSlots();
    }
    
    /**
     * Shows the panel and updates slots
     */
    show() {
        super.show();
        this.updateSlots();
        this.bringToFront();
    }
}
