import { Entity } from './Entity.js';
import { InventorySystem } from '../inventory/InventorySystem.js';

/**
 * Represents a non-player character in the game world
 * @class NPC
 * @extends Entity
 */
export class NPC extends Entity {
    /**
     * Creates a new NPC instance
     * @param {Object} config - NPC configuration
     * @param {string} config.name - NPC's name
     * @param {string} config.type - NPC type (merchant, quest_giver, enemy, etc.)
     * @param {Array<Object>} [config.dialog] - NPC's dialog options
     * @param {Array<Object>} [config.inventory] - NPC's inventory items
     * @param {Object} [config.schedule] - NPC's daily schedule
     * @param {Object} [config.behavior] - NPC behavior configuration
     */
    constructor(config) {
        super(config);
        
        this.name = config.name;
        this.type = config.type;
        this.dialog = config.dialog || [];
        this.inventory = new InventorySystem(config.inventory);
        this.schedule = config.schedule || {};
        this.behavior = config.behavior || {};
        
        // Ensure game reference is available
        this.game = config.game || config.world?.game;
        
        if (!this.game) {
            console.warn('NPC created without game reference:', {
                id: this.id,
                type: this.type,
                hasWorld: !!this.world
            });
        }
        
        // State tracking
        this.interactionRange = 2;
        this.isInteracting = false;
        this.currentDialog = null;
        this.lastInteractionTime = 0;
    }

    /**
     * Updates NPC state and behavior
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        // Get current structure if any
        if (this.world) {
            const structures = this.world.getAllStructures();
            this.currentStructure = structures.find(structure => 
                this.x >= structure.x && 
                this.x < structure.x + structure.width &&
                this.y >= structure.y && 
                this.y < structure.y + structure.height
            );
        }
    }

    render(ctx, renderer) {
        if (!this.isVisible) return;
        // Convert world coordinates to isometric coordinates
        const isoX = (this.x - this.y) * (renderer.tileWidth / 2);
        const isoY = (this.x + this.y) * (renderer.tileHeight / 2);
        
        // Draw NPC using canvas primitives
        ctx.save();
        
        // Draw body
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.ellipse(
            isoX, 
            isoY - this.size/2, 
            this.size/3, 
            this.size/2, 
            0, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw head
        ctx.beginPath();
        ctx.fillStyle = '#FFE0BD';  // Skin tone
        ctx.arc(
            isoX, 
            isoY - this.size, 
            this.size/4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.name, 
            isoX, 
            isoY - this.size - 10
        );
        
        ctx.restore();
    }

    /**
     * Updates NPC visibility based on player's current structure
     * @param {Structure|null} playerStructure - The structure the player is currently in
     * @returns {void}
     */
    updateVisibility(playerStructure) {
        // If NPC is not in a structure, always visible
        if (!this.currentStructure) {
            this.isVisible = true;
            return;
        }

        // If player is in the same structure as NPC, visible
        // Otherwise, NPC should be hidden
        this.isVisible = (this.currentStructure === playerStructure);
    }

    /**
     * Finds the nearest door in a given structure
     * @param {Structure} structure - The structure to search for doors
     * @returns {?{x: number, y: number}} Door coordinates or null if none found
     */
    findNearestDoor(structure) {
        if (!structure) return null;
        
        // Search the structure's perimeter for door tiles
        for (let y = structure.y; y < structure.y + structure.height; y++) {
            for (let x = structure.x; x < structure.x + structure.width; x++) {
                // Only check perimeter tiles
                if (x > structure.x && x < structure.x + structure.width - 1 &&
                    y > structure.y && y < structure.y + structure.height - 1) {
                    continue;
                }
                
                const tile = this.world.getTileAt(x, y);
                if (tile && tile.type === 'door') {
                    return { x, y };
                }
            }
        }
        return null;
    }

    /**
     * Moves the NPC to target coordinates, handling structure transitions
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @returns {Promise<void>}
     */
    async moveTo(targetX, targetY) {
        const currentStructure = this.currentStructure;
        const targetTile = this.world.getTileAt(targetX, targetY);
        const targetStructure = targetTile?.structure;

        // If entering or exiting a structure, find the nearest door
        if (currentStructure !== targetStructure) {
            const door = this.findNearestDoor(currentStructure || targetStructure);
            if (door) {
                // First move to the door
                await this.pathfindTo(door.x, door.y);
                // Then move to final destination
                await this.pathfindTo(targetX, targetY);
                return;
            }
        }

        // Regular movement if not crossing structure boundaries
        await this.pathfindTo(targetX, targetY);
    }

    /**
     * Pathfinds to specific coordinates
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     * @returns {Promise<void>}
     */
    async pathfindTo(x, y) {
        if (!this.world || !this.world.pathFinder) return;
        
        const path = this.world.pathFinder.findPath(
            Math.round(this.x),
            Math.round(this.y),
            Math.round(x),
            Math.round(y)
        );

        if (path) {
            // Implement movement along path
            for (const point of path) {
                this.x = point.x;
                this.y = point.y;
                // Add delay or animation between moves
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    /**
     * Handles player interaction with NPC
     * @param {Player} player - The interacting player
     * @returns {boolean} True if interaction was handled
     */
    interact(player) {
        // Interaction logic here
        if (this.isInteracting) return false;

        const distance = Math.sqrt(
            Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
        );

        if (distance <= this.interactionRange) {
            this.isInteracting = true;
            this.currentDialog = this.getDialogOptions(player);
            this.lastInteractionTime = Date.now();
            return true;
        }

        return false;
    }

    /**
     * Gets NPC's current dialog options
     * @param {Player} player - The interacting player
     * @returns {Array<Object>} Available dialog options
     */
    getDialogOptions(player) {
        // Return dialog options based on player state or NPC behavior
        return this.dialog.filter(option => option.condition(player));
    }

    /**
     * Updates NPC's schedule based on game time
     * @param {number} gameHour - Current game hour (0-24)
     * @private
     */
    updateSchedule(gameHour) {
        // Update NPC's behavior or position based on schedule
        const currentTask = this.schedule[gameHour];
        if (currentTask) {
            this.behavior = currentTask.behavior;
            this.moveTo(currentTask.x, currentTask.y);
        }
    }
}


