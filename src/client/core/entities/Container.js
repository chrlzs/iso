import { Entity } from './Entity.js';
import { Inventory } from '../inventory/Inventory.js';

export class Container extends Entity {
    constructor(config) {
        super(config);
        this.type = 'container';
        this.name = config.name || 'Container';
        this.isLocked = config.isLocked || false;
        this.requiredKey = config.requiredKey || null;
        
        // Create inventory with custom size
        this.inventory = new Inventory({
            maxSlots: config.maxSlots || 10,
            maxWeight: config.maxWeight || 50,
            owner: this
        });

        // If initial items were provided, add them
        if (config.items) {
            config.items.forEach(item => this.inventory.addItem(item));
        }
    }

    interact(player) {
        if (this.isLocked) {
            // Check if player has the required key
            const hasKey = player.inventory.items.some(item => 
                item.id === this.requiredKey
            );
            
            if (!hasKey) {
                return {
                    success: false,
                    message: "This container is locked."
                };
            }
        }

        return {
            success: true,
            action: 'openContainer',
            container: this
        };
    }
}