import { Entity } from './Entity.js';
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Item - Represents an item in the game world
 * Can be picked up, used, equipped, etc.
 */
export class Item extends Entity {
    /**
     * Creates a new item
     * @param {Object} options - Item options
     */
    constructor(options = {}) {
        super(options);

        // Item properties
        this.name = options.name || 'Item';
        this.description = options.description || '';
        this.type = options.type || 'item';
        this.subtype = options.subtype || '';
        this.rarity = options.rarity || 'common'; // common, uncommon, rare, epic, legendary
        this.value = options.value || 0;
        this.weight = options.weight || 1;
        this.stackable = options.stackable !== undefined ? options.stackable : false;
        this.quantity = options.quantity || 1;
        this.consumable = options.consumable !== undefined ? options.consumable : false;
        this.equippable = options.equippable !== undefined ? options.equippable : false;
        this.equipSlot = options.equipSlot || '';
        this.owner = null;

        // Item stats
        this.stats = options.stats || {};

        // Create sprite
        this.createSprite(options);
    }

    /**
     * Creates the item sprite
     * @param {Object} options - Sprite options
     * @private
     */
    createSprite(options) {
        // Create a placeholder sprite if no texture is provided
        if (!options.texture) {
            const graphics = new PIXI.Graphics();

            // Base color based on rarity
            let color;
            switch (this.rarity) {
                case 'common':
                    color = 0xCCCCCC; // Light gray
                    break;
                case 'uncommon':
                    color = 0x00CC00; // Green
                    break;
                case 'rare':
                    color = 0x0000CC; // Blue
                    break;
                case 'epic':
                    color = 0xCC00CC; // Purple
                    break;
                case 'legendary':
                    color = 0xFFAA00; // Orange
                    break;
                default:
                    color = 0xCCCCCC; // Light gray
            }

            // Draw item based on type
            if (this.type === 'weapon') {
                // Sword
                graphics.beginFill(0x888888); // Gray
                graphics.drawRect(-2, -15, 4, 20);
                graphics.endFill();

                // Hilt
                graphics.beginFill(0x8B4513); // Brown
                graphics.drawRect(-4, 5, 8, 5);
                graphics.endFill();
            } else if (this.type === 'potion') {
                // Bottle
                graphics.beginFill(0x888888, 0.5); // Transparent gray
                graphics.drawRect(-5, -10, 10, 15);
                graphics.endFill();

                // Liquid
                graphics.beginFill(color);
                graphics.drawRect(-4, -5, 8, 9);
                graphics.endFill();

                // Bottle neck
                graphics.beginFill(0x888888, 0.5); // Transparent gray
                graphics.drawRect(-3, -15, 6, 5);
                graphics.endFill();
            } else {
                // Generic item
                graphics.beginFill(color);
                graphics.drawRect(-8, -8, 16, 16);
                graphics.endFill();

                // Border
                graphics.lineStyle(1, 0x000000, 0.5);
                graphics.drawRect(-8, -8, 16, 16);
            }

            // Add to container
            this.addChild(graphics);
            this.sprite = graphics;
        } else {
            // Create sprite from texture
            this.sprite = new PIXI.Sprite(options.texture);
            this.sprite.anchor.set(0.5, 0.5);
            this.addChild(this.sprite);
        }

        // Add quantity text if stackable
        if (this.stackable && this.quantity > 1) {
            this.createQuantityText();
        }
    }

    /**
     * Creates quantity text for stackable items
     * @private
     */
    createQuantityText() {
        // Create text style
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 2,
            align: 'right'
        });

        // Create text
        this.quantityText = new PIXI.Text(this.quantity.toString(), style);
        this.quantityText.anchor.set(1, 1);
        this.quantityText.position.set(8, 8);
        this.addChild(this.quantityText);
    }

    /**
     * Updates the quantity text
     * @private
     */
    updateQuantityText() {
        if (!this.stackable) return;

        if (this.quantity > 1) {
            if (!this.quantityText) {
                this.createQuantityText();
            } else {
                this.quantityText.text = this.quantity.toString();
            }
        } else if (this.quantityText) {
            this.removeChild(this.quantityText);
            this.quantityText = null;
        }
    }

    /**
     * Sets the item quantity
     * @param {number} quantity - New quantity
     */
    setQuantity(quantity) {
        if (!this.stackable) return;

        this.quantity = Math.max(0, quantity);
        this.updateQuantityText();
    }

    /**
     * Uses the item
     * @param {Entity} user - Entity using the item
     * @returns {boolean} Whether the item was used successfully
     */
    use(user) {
        // Base implementation does nothing
        // Override in subclasses
        console.log(`${user?.name || 'Someone'} used ${this.name}`);
        return true;
    }

    /**
     * Equips the item
     * @param {Entity} wearer - Entity equipping the item
     * @returns {boolean} Whether the item was equipped successfully
     */
    equip(wearer) {
        if (!this.equippable || !wearer) return false;

        // Check if entity has equipment component
        const equipment = wearer.getComponent('equipment');
        if (!equipment) return false;

        // Equip the item
        return equipment.equip(this, this.equipSlot);
    }

    /**
     * Unequips the item
     * @param {Entity} wearer - Entity unequipping the item
     * @returns {boolean} Whether the item was unequipped successfully
     */
    unequip(wearer) {
        if (!this.equippable || !wearer) return false;

        // Check if entity has equipment component
        const equipment = wearer.getComponent('equipment');
        if (!equipment) return false;

        // Unequip the item
        return equipment.unequip(this.equipSlot);
    }

    /**
     * Picks up the item
     * @param {Entity} collector - Entity picking up the item
     * @returns {boolean} Whether the item was picked up successfully
     */
    pickup(collector) {
        if (!collector) return false;

        // Check if entity has inventory component
        const inventory = collector.getComponent('inventory');
        if (!inventory) return false;

        // Add to inventory
        const success = inventory.addItem(this);

        // Remove from world if added to inventory
        if (success) {
            this.removeFromWorld();
        }

        return success;
    }

    /**
     * Drops the item in the world
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {boolean} Whether the item was dropped successfully
     */
    drop(x, y) {
        if (!this.world) return false;

        // Set position
        this.x = x;
        this.y = y;

        // Add to world
        this.world.entityContainer.addChild(this);

        // Clear owner reference
        this.owner = null;

        return true;
    }

    /**
     * Removes the item from the world
     */
    removeFromWorld() {
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Clear world reference
        this.world = null;
    }

    /**
     * Gets the item's rarity color
     * @returns {number} Color in hex format
     */
    getRarityColor() {
        switch (this.rarity) {
            case 'common':
                return 0xCCCCCC; // Light gray
            case 'uncommon':
                return 0x00CC00; // Green
            case 'rare':
                return 0x0000CC; // Blue
            case 'epic':
                return 0xCC00CC; // Purple
            case 'legendary':
                return 0xFFAA00; // Orange
            default:
                return 0xCCCCCC; // Light gray
        }
    }

    /**
     * Updates the item
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Add a subtle floating animation for items in the world
        if (!this.owner && this.world) {
            this.y = this.originalY || this.y;
            this.originalY = this.originalY || this.y;
            this.y += Math.sin(performance.now() / 500) * 0.5;
        }
    }

    /**
     * Resets the item
     * @param {Object} options - Reset options
     */
    reset(options = {}) {
        super.reset(options);

        // Reset item properties
        this.quantity = options.quantity || 1;
        this.owner = null;
        this.originalY = null;

        // Update quantity text
        this.updateQuantityText();
    }

    /**
     * Creates a copy of the item
     * @param {number} quantity - Quantity for the new item
     * @returns {Item} A new item with the same properties
     */
    clone(quantity = 1) {
        const options = {
            name: this.name,
            description: this.description,
            type: this.type,
            subtype: this.subtype,
            rarity: this.rarity,
            value: this.value,
            weight: this.weight,
            stackable: this.stackable,
            quantity: quantity,
            consumable: this.consumable,
            equippable: this.equippable,
            equipSlot: this.equipSlot,
            stats: { ...this.stats },
            texture: this.sprite instanceof PIXI.Sprite ? this.sprite.texture : null
        };

        return new Item(options);
    }
}
