import { Entity } from './Entity.js';
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Character - Represents a character in the game world
 * Can be controlled by the player or AI
 */
export class Character extends Entity {
    /**
     * Creates a new character
     * @param {Object} options - Character options
     */
    constructor(options = {}) {
        super(options);

        // Character properties
        this.name = options.name || 'Character';
        this.health = options.health || 100;
        this.maxHealth = options.maxHealth || this.health;
        this.energy = options.energy || 100;
        this.maxEnergy = options.maxEnergy || this.energy;
        this.speed = options.speed || 2;
        this.isPlayer = options.isPlayer || false;

        // Combat stats
        this.stats = options.stats || {
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            attack: 10,
            defense: 5,
            speed: this.speed * 5, // Combat speed (initiative)
            criticalChance: 0.1,
            evasion: 0.05
        };

        // Combat rewards
        this.expReward = options.expReward || 10;
        this.goldReward = options.goldReward || 5;

        // Currency
        this.gold = options.gold || 0;

        // Abilities
        this.abilities = options.abilities || [];

        // Add default abilities if none provided
        if (this.abilities.length === 0) {
            this.abilities.push({
                name: 'Slash',
                description: 'A basic attack with a weapon',
                energyCost: 0,
                cooldown: 0,
                targetType: 'enemy',
                execute: (user, target, combatManager) => {
                    // Basic attack logic is handled by combat manager
                    return true;
                }
            });

            // Add a healing ability
            this.abilities.push({
                name: 'Heal',
                description: 'Restore some health',
                energyCost: 20,
                cooldown: 3,
                targetType: 'self',
                execute: (user, target, combatManager) => {
                    const healAmount = Math.round(user.stats.level * 10 + Math.random() * 10);
                    target.heal(healAmount);
                    console.log(`${user.name} healed ${target.name} for ${healAmount} health`);
                    return true;
                }
            });
        }

        // Movement properties
        this.moveTarget = null;
        this.path = null;
        this.pathIndex = 0;
        this.isMoving = false;
        this.facingDirection = 'down'; // 'up', 'down', 'left', 'right'
        this.movementState = 'idle'; // 'idle', 'walking', 'running'

        // Grid position (in addition to pixel position)
        this.gridX = options.gridX || 0;
        this.gridY = options.gridY || 0;

        // Animation properties
        this.animationTime = 0;
        this.animationFrame = 0;
        this.animationSpeed = 0.1;

        // Create sprite
        this.createSprite(options);

        // Add health bar
        this.createHealthBar();

        // Add name label if provided
        if (options.showName) {
            this.createNameLabel();
        }
    }

    /**
     * Creates the character sprite
     * @param {Object} options - Sprite options
     * @private
     */
    createSprite(options) {
        // Create a placeholder sprite if no texture is provided
        if (!options.texture) {
            const graphics = new PIXI.Graphics();

            // Body
            graphics.beginFill(options.color || 0x3498db);
            graphics.drawCircle(0, -24, 20);
            graphics.endFill();

            // Add outline for better visibility
            graphics.lineStyle(3, 0x000000);
            graphics.drawCircle(0, -24, 20);

            // Add face details
            graphics.beginFill(0xFFFFFF);
            graphics.drawCircle(-6, -30, 4); // Left eye
            graphics.drawCircle(6, -30, 4);  // Right eye
            graphics.endFill();

            graphics.beginFill(0x000000);
            graphics.drawCircle(-6, -30, 2); // Left pupil
            graphics.drawCircle(6, -30, 2);  // Right pupil
            graphics.endFill();

            // Add smile
            graphics.lineStyle(2, 0x000000);
            graphics.arc(0, -20, 8, 0.1 * Math.PI, 0.9 * Math.PI);

            // Add body/legs
            graphics.lineStyle(3, 0x000000);
            graphics.moveTo(0, -4); // Bottom of head
            graphics.lineTo(0, 10);  // Body

            // Arms
            graphics.moveTo(-15, -10); // Left arm
            graphics.lineTo(0, 0);
            graphics.lineTo(15, -10);  // Right arm

            // Legs
            graphics.moveTo(0, 10);   // Bottom of body
            graphics.lineTo(-10, 25); // Left leg
            graphics.moveTo(0, 10);   // Bottom of body
            graphics.lineTo(10, 25);  // Right leg

            // Add to container
            this.addChild(graphics);
            this.sprite = graphics;
        } else {
            // Create sprite from texture
            this.sprite = new PIXI.Sprite(options.texture);
            this.sprite.anchor.set(0.5, 1);
            this.addChild(this.sprite);
        }
    }

    /**
     * Creates a health bar for the character
     * @private
     */
    createHealthBar() {
        // Create container for health bar
        this.healthBar = new PIXI.Container();
        this.healthBar.position.set(0, -50); // Position higher above character
        this.addChild(this.healthBar);

        // Background
        this.healthBarBg = new PIXI.Graphics();
        this.healthBarBg.beginFill(0x000000, 0.5);
        this.healthBarBg.drawRect(-20, 0, 40, 5);
        this.healthBarBg.endFill();
        this.healthBar.addChild(this.healthBarBg);

        // Foreground
        this.healthBarFg = new PIXI.Graphics();
        this.healthBarFg.beginFill(0x2ecc71);
        this.healthBarFg.drawRect(-19, 1, 38, 3);
        this.healthBarFg.endFill();
        this.healthBar.addChild(this.healthBarFg);

        // Hide health bar by default
        this.healthBar.visible = false;
    }

    /**
     * Creates a name label for the character
     * @private
     */
    createNameLabel() {
        // Create text style
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xffffff,
            stroke: 0x000000,
            strokeThickness: 2,
            align: 'center'
        });

        // Create text
        this.nameLabel = new PIXI.Text(this.name, style);
        this.nameLabel.anchor.set(0.5, 0);
        this.nameLabel.position.set(0, -60); // Position higher above character
        this.addChild(this.nameLabel);
    }

    /**
     * Updates the character
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update animation
        this.updateAnimation(deltaTime);

        // Update movement
        this.updateMovement(deltaTime);

        // Update health bar
        this.updateHealthBar();
    }

    /**
     * Updates character animation
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    updateAnimation(deltaTime) {
        // Only animate if moving
        if (this.isMoving) {
            this.animationTime += deltaTime * this.animationSpeed * this.speed;

            // Update animation frame
            this.animationFrame = Math.floor(this.animationTime) % 4;

            // Update sprite frame if using a spritesheet
            if (this.sprite.texture && this.sprite.texture.baseTexture && this.sprite.texture.frame) {
                // This would be implemented with proper spritesheet animation
                // For now, we just rotate the sprite slightly to show movement
                this.sprite.rotation = Math.sin(this.animationTime * 5) * 0.1;
            }
        } else {
            // Reset animation when not moving
            this.animationTime = 0;
            this.animationFrame = 0;
            this.sprite.rotation = 0;
        }
    }

    /**
     * Updates character movement
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    updateMovement(deltaTime) {
        // If we have a target, move towards it
        if (this.moveTarget) {
            const dx = this.moveTarget.x - this.x;
            const dy = this.moveTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If we're close enough to the target, stop moving
            if (distance < 2) {
                this.stopMoving();

                // Update grid position
                if (this.world) {
                    const gridPos = this.world.screenToGrid(this.x, this.y);
                    this.gridX = gridPos.x;
                    this.gridY = gridPos.y;
                }

                return;
            }

            // Otherwise, move towards the target
            this.isMoving = true;

            // Calculate movement direction
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;

            // Update velocity
            this.velocity.x = normalizedDx * this.speed;
            this.velocity.y = normalizedDy * this.speed;

            // Update facing direction
            this.updateFacingDirection(normalizedDx, normalizedDy);
        } else {
            // No target, stop moving
            this.isMoving = false;
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    /**
     * Updates the character's facing direction based on movement
     * @param {number} dx - X direction
     * @param {number} dy - Y direction
     * @private
     */
    updateFacingDirection(dx, dy) {
        // Determine facing direction based on movement
        if (Math.abs(dx) > Math.abs(dy)) {
            // Moving horizontally
            this.facingDirection = dx > 0 ? 'right' : 'left';
        } else {
            // Moving vertically
            this.facingDirection = dy > 0 ? 'down' : 'up';
        }

        // Update sprite based on facing direction
        // This would be implemented with proper spritesheet animation
        // For now, we just flip the sprite horizontally
        if (this.sprite instanceof PIXI.Sprite) {
            this.sprite.scale.x = this.facingDirection === 'left' ? -1 : 1;
        }
    }

    /**
     * Updates the health bar
     * @private
     */
    updateHealthBar() {
        // Only update if health bar is visible
        if (!this.healthBar.visible) return;

        // Calculate health percentage
        const healthPercent = Math.max(0, Math.min(1, this.health / this.maxHealth));

        // Update health bar width
        this.healthBarFg.clear();
        this.healthBarFg.beginFill(this.getHealthColor(healthPercent));
        this.healthBarFg.drawRect(-19, 1, 38 * healthPercent, 3);
        this.healthBarFg.endFill();
    }

    /**
     * Gets the color for the health bar based on health percentage
     * @param {number} percent - Health percentage (0-1)
     * @returns {number} Color in hex format
     * @private
     */
    getHealthColor(percent) {
        if (percent > 0.6) return 0x2ecc71; // Green
        if (percent > 0.3) return 0xf39c12; // Orange
        return 0xe74c3c; // Red
    }

    /**
     * Sets the character's move target
     * @param {Object} target - Target position {x, y}
     */
    setMoveTarget(target) {
        if (!target) return;

        this.moveTarget = target;
        this.isMoving = true;

        // Show health bar when moving
        this.healthBar.visible = true;

        // Hide health bar after 3 seconds of inactivity
        if (this.healthBarTimeout) {
            clearTimeout(this.healthBarTimeout);
        }

        this.healthBarTimeout = setTimeout(() => {
            this.healthBar.visible = false;
        }, 3000);
    }

    /**
     * Stops the character's movement
     */
    stopMoving() {
        this.moveTarget = null;
        this.isMoving = false;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    /**
     * Sets the character's health
     * @param {number} health - New health value
     */
    setHealth(health) {
        this.health = Math.max(0, Math.min(this.maxHealth, health));

        // Show health bar when health changes
        this.healthBar.visible = true;

        // Hide health bar after 3 seconds
        if (this.healthBarTimeout) {
            clearTimeout(this.healthBarTimeout);
        }

        this.healthBarTimeout = setTimeout(() => {
            this.healthBar.visible = false;
        }, 3000);

        // Update health bar
        this.updateHealthBar();

        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }

    /**
     * Damages the character
     * @param {number} amount - Damage amount
     */
    damage(amount) {
        // Apply evasion chance
        if (Math.random() < (this.stats.evasion || 0)) {
            console.log(`${this.name} evaded the attack!`);
            return 0;
        }

        this.setHealth(this.health - amount);
        return amount;
    }

    /**
     * Heals the character
     * @param {number} amount - Heal amount
     */
    heal(amount) {
        this.setHealth(this.health + amount);
        return amount;
    }

    /**
     * Adds experience to the character
     * @param {number} amount - Experience amount
     * @returns {boolean} Whether the character leveled up
     */
    addExperience(amount) {
        if (!this.stats) return false;

        this.stats.experience += amount;
        console.log(`${this.name} gained ${amount} experience!`);

        // Check for level up
        if (this.stats.experience >= this.stats.experienceToNextLevel) {
            return this.levelUp();
        }

        return false;
    }

    /**
     * Levels up the character
     * @returns {boolean} Whether the level up was successful
     */
    levelUp() {
        if (!this.stats) return false;

        // Increase level
        this.stats.level++;

        // Calculate excess experience
        const excessExp = this.stats.experience - this.stats.experienceToNextLevel;

        // Set new experience to next level (increases with level)
        this.stats.experienceToNextLevel = Math.floor(this.stats.experienceToNextLevel * 1.5);

        // Set current experience to excess
        this.stats.experience = excessExp;

        // Increase stats
        this.stats.attack += 2 + Math.floor(Math.random() * 3); // +2-4 attack
        this.stats.defense += 1 + Math.floor(Math.random() * 2); // +1-2 defense
        this.stats.speed += 1; // +1 speed

        // Increase max health and energy
        const healthIncrease = 10 + Math.floor(Math.random() * 10); // +10-19 health
        const energyIncrease = 5 + Math.floor(Math.random() * 5); // +5-9 energy

        this.maxHealth += healthIncrease;
        this.maxEnergy += energyIncrease;

        // Fully heal on level up
        this.health = this.maxHealth;
        this.energy = this.maxEnergy;

        console.log(`${this.name} leveled up to level ${this.stats.level}!`);
        console.log(`Health +${healthIncrease}, Energy +${energyIncrease}, Attack +${this.stats.attack}, Defense +${this.stats.defense}`);

        return true;
    }

    /**
     * Kills the character
     */
    die() {
        // Implement death animation or logic here
        this.active = false;
        this.isMoving = false;
        this.moveTarget = null;

        // Fade out
        this.alpha = 0.5;

        // Emit death event
        if (this.world) {
            // TODO: Implement event system
        }
    }

    /**
     * Resets the character
     * @param {Object} options - Reset options
     */
    reset(options = {}) {
        super.reset(options);

        // Reset character properties
        this.health = options.health || this.maxHealth || 100;
        this.energy = options.energy || this.maxEnergy || 100;
        this.isMoving = false;
        this.moveTarget = null;
        this.path = null;
        this.pathIndex = 0;
        this.facingDirection = 'down';
        this.movementState = 'idle';
        this.animationTime = 0;
        this.animationFrame = 0;

        // Reset sprite
        if (this.sprite) {
            this.sprite.rotation = 0;
            if (this.sprite instanceof PIXI.Sprite) {
                this.sprite.scale.x = 1;
            }
        }

        // Reset health bar
        if (this.healthBar) {
            this.healthBar.visible = false;
        }

        // Clear timeout
        if (this.healthBarTimeout) {
            clearTimeout(this.healthBarTimeout);
            this.healthBarTimeout = null;
        }
    }

    /**
     * Disposes of the character
     */
    dispose() {
        // Clear timeout
        if (this.healthBarTimeout) {
            clearTimeout(this.healthBarTimeout);
            this.healthBarTimeout = null;
        }

        super.dispose();
    }
}
