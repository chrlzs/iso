/**
 * @module NPC
 * @description Provides base functionality for non-player characters
 */

import { Entity } from './Entity.js';
import { InventorySystem } from '../inventory/InventorySystem.js';

/**
 * @typedef {Object} NPCConfig
 * @property {string} type - NPC type identifier
 * @property {string} name - NPC name
 * @property {Object} [behavior] - Behavior configuration
 * @property {Object} [schedule] - Daily schedule configuration
 * @property {Array<Object>} [dialog] - Dialog options
 * @extends EntityConfig
 */

/**
 * @typedef {Object} NPCScheduleEntry
 * @property {number} time - Time of day (0-24)
 * @property {string} activity - Activity identifier
 * @property {Object} [params] - Activity parameters
 */

/**
 * Base class for all non-player characters
 * @class NPC
 * @extends Entity
 * @property {string} type - NPC type identifier
 * @property {string} name - NPC name
 * @property {Object} behavior - Current behavior state
 * @property {Array<NPCScheduleEntry>} schedule - Daily schedule
 * @property {Array<Object>} dialog - Available dialog options
 */
export class NPC extends Entity {
    /**
     * Creates a new NPC instance
     * @param {NPCConfig} config - NPC configuration
     */
    constructor(config) {
        super(config);

        this.name = config.name;
        this.type = config.type;
        this.dialog = config.dialog || [];
        this.inventory = new InventorySystem(config.inventory);
        this.schedule = config.schedule || {};
        this.behavior = config.behavior || {};
        this.isEnemy = config.isEnemy || false;
        this.damage = config.damage || 0;
        this.health = config.health || 100;
        this.maxHealth = config.maxHealth || 100;
        this.attackRange = config.attackRange || 1;
        this.defense = config.defense || 3;
        this.speed = config.speed || 5;
        this.isDefending = false;
        this.defenseBuff = 0;
        this.expValue = config.expValue || 20; // Experience awarded when defeated

        // Ensure game reference is available
        this.game = config.game || config.world?.game;

        // Try to get game reference from world if not available
        if (!this.game && this.world && this.world.game) {
            this.game = this.world.game;

            // Only log if debug flag is enabled
            if (this.world.game?.debug?.flags?.logWarnings) {
                console.log('Retrieved game reference from world for NPC:', this.id);
            }
        }

        // Log warning if still no game reference
        if (!this.game && this.world?.game?.debug?.flags?.logWarnings) {
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

        // Set initial visibility - enemies are always visible
        this.isVisible = true; // Make all NPCs visible by default

        // Only log if debug flag is enabled
        if (this.game?.debug?.flags?.logNPCs) {
            console.log(`NPC ${this.name} created:`, {
                isEnemy: this.isEnemy,
                isVisible: this.isVisible,
                position: `${this.x},${this.y}`,
                color: this.color
            });
        }
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

            // Debug log for enemy NPCs - only if debug flag is enabled
            if (this.isEnemy && this.game?.debug?.flags?.logNPCs) {
                console.log(`Updated enemy NPC ${this.name}:`, {
                    position: `${this.x},${this.y}`,
                    isVisible: this.isVisible,
                    inStructure: !!this.currentStructure,
                    structureType: this.currentStructure?.type
                });
            }
        }
    }

    /**
     * Sets the dialog options for this NPC
     * @param {Array<Object>} dialogOptions - Array of dialog options
     */
    setDialog(dialogOptions) {
        if (Array.isArray(dialogOptions)) {
            this.dialog = dialogOptions;
        }
    }

    render(ctx, renderer) {
        // Skip rendering if not visible
        if (!this.isVisible) {
            // Only log warning if debug flag is enabled
            if (this.isEnemy && this.game?.debug?.flags?.logWarnings) {
                console.warn(`Enemy NPC ${this.name} is not visible!`);
            }
            return;
        }

        // Debug log for enemy NPCs - only if debug flag is enabled
        if (this.isEnemy && this.game?.debug?.flags?.logNPCRendering) {
            console.log(`Rendering enemy NPC ${this.name} at ${this.x},${this.y}`);
        }
        // Convert world coordinates to isometric coordinates
        const isoX = (this.x - this.y) * (renderer.tileWidth / 2);
        const isoY = (this.x + this.y) * (renderer.tileHeight / 2);

        // Draw NPC using canvas primitives
        ctx.save();

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(isoX, isoY + 5, this.size/2, this.size/4, 0, 0, Math.PI * 2);
        ctx.fill();

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
        ctx.fillStyle = this.isEnemy ? '#FFD0D0' : '#FFE0BD';  // Different skin tone for enemies
        ctx.arc(
            isoX,
            isoY - this.size,
            this.size/4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // For enemies, draw additional details
        if (this.isEnemy) {
            // Draw weapon
            ctx.beginPath();
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.moveTo(isoX + this.size/2, isoY - this.size/2);
            ctx.lineTo(isoX + this.size, isoY - this.size/4);
            ctx.stroke();

            // Draw angry eyes
            ctx.beginPath();
            ctx.fillStyle = '#000000';
            ctx.arc(isoX - this.size/8, isoY - this.size - this.size/8, this.size/12, 0, Math.PI * 2);
            ctx.arc(isoX + this.size/8, isoY - this.size - this.size/8, this.size/12, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw normal eyes
            ctx.beginPath();
            ctx.fillStyle = '#000000';
            ctx.arc(isoX - this.size/8, isoY - this.size, this.size/12, 0, Math.PI * 2);
            ctx.arc(isoX + this.size/8, isoY - this.size, this.size/12, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw name with background for better visibility
        const nameText = this.isEnemy ? `${this.name} (Enemy)` : this.name;
        const textWidth = ctx.measureText(nameText).width;

        // Draw text background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(isoX - textWidth/2 - 2, isoY - this.size - 22, textWidth + 4, 16);

        // Draw name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            nameText,
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
        // Enemy NPCs are always visible
        if (this.isEnemy) {
            this.isVisible = true;
            return;
        }

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
        return this.dialog.filter(option => !option.condition || option.condition(player));
    }

    /**
     * Damages the NPC
     * @param {number} amount - Amount of damage to deal
     * @param {Entity} [source] - Entity dealing the damage
     * @returns {number} Actual damage dealt
     * @override
     */
    takeDamage(amount, source) {
        // Apply defense and defensive stance
        let actualDamage = amount;

        // Apply defense reduction
        if (this.defense > 0) {
            actualDamage = Math.max(1, actualDamage - this.defense);
        }

        // Apply defensive stance reduction
        if (this.isDefending && this.defenseBuff > 0) {
            actualDamage = Math.floor(actualDamage * (1 - this.defenseBuff));

            // Defensive stance only lasts for one hit
            this.isDefending = false;
            this.defenseBuff = 0;
        }

        // Apply damage
        const previousHealth = this.health;
        this.health = Math.max(0, this.health - actualDamage);
        const damageDealt = previousHealth - this.health;

        // Handle death
        if (this.health <= 0) {
            this.die();
        }

        return damageDealt;
    }

    /**
     * Handles NPC death
     * @override
     */
    die() {
        this.isActive = false;
        this.isVisible = false;

        // If this is an enemy, notify the player
        if (this.isEnemy && this.game) {
            this.game.messageSystem?.addMessage(`${this.name} has been defeated!`);
        }
    }

    /**
     * Initiates dialog with another entity
     * @param {Entity} target - Entity to interact with
     * @returns {boolean} True if dialog was initiated successfully
     */
    startDialog(target) {
        // Interaction logic here
        if (this.isInteracting) return false;

        const distance = Math.sqrt(
            Math.pow(target.x - this.x, 2) + Math.pow(target.y - this.y, 2)
        );

        if (distance <= this.interactionRange) {
            this.isInteracting = true;
            this.currentDialog = this.getDialogOptions(target);
            this.lastInteractionTime = Date.now();
            return true;
        }

        return false;
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


