import { Entity } from './Entity.js';
import { InventorySystem } from '../inventory/InventorySystem.js';

/**
 * Represents the player character in the game world
 * @class Player
 * @extends Entity
 */
export class Player extends Entity {
    /**
     * Creates a new Player instance
     * @param {Object} config - Player configuration
     * @param {number} config.x - Initial X position
     * @param {number} config.y - Initial Y position
     * @param {World} config.world - Reference to game world
     * @param {PathFinder} config.pathFinder - Reference to path finder
     * @param {Object} [config.stats] - Initial player stats
     * @param {number} [config.stats.maxHealth=100] - Maximum health points
     * @param {number} [config.stats.maxEnergy=100] - Maximum energy points
     * @param {number} [config.stats.speed=1] - Movement speed
     */
    constructor(config) {
        super(config);

        // Initialize core systems
        this.inventory = new InventorySystem({
            maxSlots: 25,
            maxWeight: 100,
            startingEth: 0
        });

        // Initialize stats
        this.maxHealth = config.stats?.maxHealth || 100;
        this.maxEnergy = config.stats?.maxEnergy || 100;
        this.health = this.maxHealth;
        this.energy = this.maxEnergy;
        this.experience = 0;
        this.level = 1;

        // Increase base movement speed
        this.moveSpeed = 8; // Default was likely 4 or 5
        this.sprintMultiplier = 1.5; // Optional: Allow sprinting

        // Initialize equipment slots
        this.equipment = {
            head: null,
            chest: null,
            legs: null,
            feet: null,
            mainHand: null,
            offHand: null
        };

        // Initialize path finding
        this.pathFinder = config.pathFinder;
        this.isMoving = false;
        this.currentPath = null;
        this.pathIndex = 0;

        // Initialize interaction state
        this.interactionRange = 2;
        this.canInteract = true;
        this.currentInteraction = null;
    }

    /**
     * Updates player state
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        super.update(deltaTime);
        this.updateMovement(deltaTime);
        this.updateEnergy(deltaTime);
        this.checkInteractions();
    }

    /**
     * Sets a new path for the player to follow
     * @param {Array<{x: number, y: number}>} path - Array of path coordinates
     */
    setPath(path) {
        this.currentPath = path;
        this.pathIndex = 0;
        this.isMoving = true;
    }

    /**
     * Equips an item in the specified slot
     * @param {Item} item - Item to equip
     * @param {string} slot - Equipment slot
     * @returns {boolean} True if item was equipped successfully
     */
    equipItem(item, slot) {
        if (!this.equipment[slot]) {
            this.equipment[slot] = item;
            this.updateStats();
            return true;
        }
        return false;
    }

    /**
     * Unequips an item from the specified slot
     * @param {string} slot - Equipment slot
     * @returns {Item|null} Unequipped item or null if slot was empty
     */
    unequipItem(slot) {
        const item = this.equipment[slot];
        if (item) {
            this.equipment[slot] = null;
            this.updateStats();
            return item;
        }
        return null;
    }

    /**
     * Gets the player's total attack power
     * @returns {number} Calculated attack power
     */
    getAttackPower() {
        let power = 1; // Base attack power
        // Add weapon damage
        if (this.equipment.mainHand) {
            power += this.equipment.mainHand.damage || 0;
        }
        return power;
    }

    /**
     * Gets the player's total armor value
     * @returns {number} Calculated armor value
     */
    getArmorValue() {
        return Object.values(this.equipment)
            .filter(item => item && item.armor)
            .reduce((total, item) => total + item.armor, 0);
    }

    /**
     * Updates the player's stats based on equipment
     * @private
     */
    updateStats() {
        // ...existing code...
    }

    /**
     * Gains experience points and handles leveling
     * @param {number} amount - Amount of experience to gain
     */
    gainExperience(amount) {
        // ...existing code...
    }

    /**
     * Handles interaction with nearby entities
     * @param {Entity} target - Entity to interact with
     * @returns {boolean} True if interaction was successful
     */
    interact(target) {
        if (!target || !this.canInteract) {
            console.log('Cannot interact:', { target, canInteract: this.canInteract });
            return false;
        }

        const distance = Math.hypot(target.x - this.x, target.y - this.y);
        if (distance > this.interactionRange) {
            console.log('Target too far:', distance);
            return false;
        }

        console.log('Attempting interaction with:', target.type);
        if (target.type === 'merchant') {
            return target.interact(this);
        }

        return false;
    }

    /**
     * Updates player movement
     * @param {number} deltaTime - Time elapsed since last update
     * @private
     */
    updateMovement(deltaTime) {
        if (!this.currentPath || !this.isMoving) return;

        const target = this.currentPath[this.pathIndex];
        if (!target) {
            this.isMoving = false;
            this.currentPath = null;
            
            // Trigger path complete callback if it exists
            if (this.onPathComplete) {
                console.log('Triggering path complete callback');
                this.onPathComplete();
                this.onPathComplete = null; // Clear the callback
            }
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;

            if (this.pathIndex >= this.currentPath.length) {
                this.isMoving = false;
                this.currentPath = null;
            }
        } else {
            const speed = this.speed * deltaTime;
            const ratio = Math.min(speed / distance, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
    }

    /**
     * Updates player energy
     * @param {number} deltaTime - Time elapsed since last update
     * @private
     */
    updateEnergy(deltaTime) {
        // ...existing code...
    }

    /**
     * Checks for possible interactions
     * @private
     */
    checkInteractions() {
        // ...existing code...
    }

    /**
     * Renders the player character
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {IsometricRenderer} renderer - The game's isometric renderer
     */
    render(ctx, renderer) {
        if (!this.isVisible) return;

        const screenPos = renderer.convertToIsometric(this.x, this.y);
        
        // Draw debug path if enabled
        if (this.game?.debug?.flags?.showPath && this.currentPath) {
            this.renderPath(ctx, renderer);
        }

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw character
        this.drawCharacter(ctx);
        
        // Draw direction indicator when moving
        if (this.isMoving && this.currentPath?.length > 0) {
            this.drawDirectionIndicator(ctx);
        }
        
        ctx.restore();
    }

    /**
     * Draws the character
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @private
     */
    drawCharacter(ctx) {
        // Draw character base
        ctx.fillStyle = '#1A1A2E';  // Dark tech-suit base
        ctx.strokeStyle = '#00f2ff'; // Cyan neon trim
        ctx.lineWidth = 2;
        
        // Draw tech-suit body
        ctx.beginPath();
        this.roundRect(ctx, -12, -20, 24, 32, 8);
        ctx.fill();
        ctx.stroke();

        // Draw neon power lines
        ctx.strokeStyle = '#00f2ff';
        ctx.beginPath();
        ctx.moveTo(-8, -15);
        ctx.lineTo(-8, 5);
        ctx.moveTo(8, -15);
        ctx.lineTo(8, 5);
        ctx.stroke();

        // Head with cyber-visor
        ctx.fillStyle = '#1A1A2E';  // Dark base
        ctx.strokeStyle = '#00f2ff'; // Cyan trim
        ctx.beginPath();
        ctx.arc(0, -28, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cyber-visor
        ctx.fillStyle = '#00f2ff';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-8, -32, 16, 4);
        ctx.globalAlpha = 1;

        // Energy core
        ctx.fillStyle = '#FF0066';  // Neon pink
        ctx.beginPath();
        ctx.arc(0, -4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Tech-boots
        ctx.fillStyle = '#1A1A2E';
        ctx.strokeStyle = '#00f2ff';
        ctx.fillRect(-10, 8, 8, 4);
        ctx.strokeRect(-10, 8, 8, 4);
        ctx.fillRect(2, 8, 8, 4);
        ctx.strokeRect(2, 8, 8, 4);

        // Holographic display
        ctx.fillStyle = '#00f2ff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.roundRect(6, -18, 8, 16, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /**
     * Draws movement direction indicator
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @private
     */
    drawDirectionIndicator(ctx) {
        const nextPoint = this.currentPath[this.pathIndex];
        if (!nextPoint) return;

        const angle = Math.atan2(nextPoint.y - this.y, nextPoint.x - this.x);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
        ctx.stroke();
    }

    /**
     * Helper method to draw rounded rectangles
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius
     * @private
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * Renders the player's current path
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {IsometricRenderer} renderer - The game's isometric renderer
     * @private
     */
    renderPath(ctx, renderer) {
        if (!this.currentPath) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Start from current position
        const startPos = renderer.convertToIsometric(this.x, this.y);
        ctx.moveTo(startPos.x, startPos.y);

        // Draw path segments
        for (let i = this.pathIndex; i < this.currentPath.length; i++) {
            const point = this.currentPath[i];
            const screenPos = renderer.convertToIsometric(point.x, point.y);
            ctx.lineTo(screenPos.x, screenPos.y);
        }

        ctx.stroke();
        ctx.restore();
    }
}



































