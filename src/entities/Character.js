import { Entity } from './Entity.js';
import { PIXI } from '../utils/PixiWrapper.js';
import { PathFinder } from '../utils/PathFinder.js';

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

            // Add glow effect for better visibility
            if (options.isPlayer) {
                graphics.lineStyle(6, 0x00FFFF, 0.5);
                graphics.drawCircle(0, -24, 25);
            }

            // Add to container
            this.addChild(graphics);
            this.sprite = graphics;
        } else {
            // Create sprite from texture
            this.sprite = new PIXI.Sprite(options.texture);
            this.sprite.anchor.set(0.5, 1);
            this.addChild(this.sprite);
        }

        // Ensure sprite is visible
        this.sprite.visible = true;
        this.sprite.alpha = 1.0;

        // Set zIndex to ensure character is above tiles
        this.zIndex = 10;

        // Log sprite creation
        console.log(`Created character sprite: ${options.name}, isPlayer: ${options.isPlayer}`);
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

        // Debug log for player character
        if (this.isPlayer && Math.random() < 0.01) {
            console.log(`Player character update:`);
            console.log(`  Position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
            console.log(`  Grid: (${this.gridX}, ${this.gridY})`);
            console.log(`  Active: ${this.active}, Visible: ${this.visible}`);
            console.log(`  isMoving: ${this.isMoving}`);
            console.log(`  moveTarget: ${this.moveTarget ? `(${this.moveTarget.x.toFixed(2)}, ${this.moveTarget.y.toFixed(2)})` : 'null'}`);
        }

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
            // Debug log every 30 frames to avoid console spam
            if (Math.random() < 0.03) {
                console.log(`Character ${this.name} updating movement:`);
                console.log(`  Current position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
                console.log(`  Target position: (${this.moveTarget.x.toFixed(2)}, ${this.moveTarget.y.toFixed(2)})`);
                console.log(`  isMoving: ${this.isMoving}`);
                console.log(`  deltaTime: ${deltaTime}`);
                if (this.path) {
                    console.log(`  Following path, current index: ${this.pathIndex}/${this.path.length - 1}`);
                }
            }

            // Check if we're following a path
            if (this.path && this.path.length > 0 && this.pathIndex < this.path.length) {
                // Get current path point
                const currentPoint = this.path[this.pathIndex];

                // Convert grid coordinates to world coordinates
                const worldPos = this.world.gridToWorld(currentPoint.x, currentPoint.y);

                // Calculate distance to current path point
                const dx = worldPos.x - this.x;
                const dy = worldPos.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If we're close enough to the current path point, move to the next one
                if (distance < 2) {
                    // Update grid position to match the path point
                    this.gridX = currentPoint.x;
                    this.gridY = currentPoint.y;

                    // Move to next path point
                    this.pathIndex++;

                    // If we've reached the end of the path, stop moving
                    if (this.pathIndex >= this.path.length) {
                        console.log(`Character ${this.name} reached end of path, stopping movement`);
                        this.x = worldPos.x;
                        this.y = worldPos.y;
                        this.stopMoving();
                        return;
                    }

                    // Get next path point
                    const nextPoint = this.path[this.pathIndex];
                    const nextWorldPos = this.world.gridToWorld(nextPoint.x, nextPoint.y);

                    // Calculate direction to next path point
                    const nextDx = nextWorldPos.x - this.x;
                    const nextDy = nextWorldPos.y - this.y;
                    const nextDistance = Math.sqrt(nextDx * nextDx + nextDy * nextDy);

                    // Update velocity
                    const normalizedDx = nextDx / nextDistance;
                    const normalizedDy = nextDy / nextDistance;
                    this.velocity.x = normalizedDx * this.speed * deltaTime * 60;
                    this.velocity.y = normalizedDy * this.speed * deltaTime * 60;

                    // Update facing direction
                    this.updateFacingDirection(normalizedDx, normalizedDy);

                    if (Math.random() < 0.03) {
                        console.log(`  Moving to next path point: (${nextPoint.x}, ${nextPoint.y})`);
                        console.log(`  New velocity: (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
                    }
                } else {
                    // Continue moving towards current path point
                    const normalizedDx = dx / distance;
                    const normalizedDy = dy / distance;

                    // Update velocity
                    this.velocity.x = normalizedDx * this.speed * deltaTime * 60;
                    this.velocity.y = normalizedDy * this.speed * deltaTime * 60;

                    // Update facing direction
                    this.updateFacingDirection(normalizedDx, normalizedDy);

                    if (Math.random() < 0.03) {
                        console.log(`  Moving to path point ${this.pathIndex}: (${currentPoint.x}, ${currentPoint.y})`);
                        console.log(`  Distance: ${distance.toFixed(2)}`);
                        console.log(`  New velocity: (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
                    }
                }
            } else {
                // Direct movement (no path)
                const dx = this.moveTarget.x - this.x;
                const dy = this.moveTarget.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If we're close enough to the target, stop moving and update grid position
                if (distance < 2) {
                    console.log(`Character ${this.name} reached target, stopping movement`);
                    this.x = this.moveTarget.x;
                    this.y = this.moveTarget.y;
                    this.stopMoving();

                    // Update grid position using world's coordinate system
                    if (this.world) {
                        const gridPos = this.world.worldToGrid(this.x, this.y);
                        this.gridX = Math.max(0, Math.min(this.world.config.gridWidth - 1, Math.round(gridPos.x)));
                        this.gridY = Math.max(0, Math.min(this.world.config.gridHeight - 1, Math.round(gridPos.y)));
                        console.log(`  Updated grid position to (${this.gridX}, ${this.gridY})`);
                    }
                    return;
                }

                // Calculate normalized movement direction
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;

                // Update velocity with proper scaling for deltaTime
                this.velocity.x = normalizedDx * this.speed * deltaTime * 60; // Scale by 60 to normalize for 60 FPS
                this.velocity.y = normalizedDy * this.speed * deltaTime * 60;

                if (Math.random() < 0.03) {
                    console.log(`  New velocity: (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
                }

                // Update facing direction
                this.updateFacingDirection(normalizedDx, normalizedDy);
            }

            // Update grid position continuously during movement
            if (this.world) {
                const gridPos = this.world.worldToGrid(this.x, this.y);
                const newGridX = Math.max(0, Math.min(this.world.config.gridWidth - 1, Math.round(gridPos.x)));
                const newGridY = Math.max(0, Math.min(this.world.config.gridHeight - 1, Math.round(gridPos.y)));

                if (newGridX !== this.gridX || newGridY !== this.gridY) {
                    console.log(`  Grid position changed from (${this.gridX}, ${this.gridY}) to (${newGridX}, ${newGridY})`);
                    this.gridX = newGridX;
                    this.gridY = newGridY;
                }
            }
        } else {
            // No target, ensure velocity is zero
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.isMoving = false;
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
     * @param {Object} options - Movement options
     */
    setMoveTarget(target, options = {}) {
        if (!target) {
            console.warn('Attempted to set null move target');
            return;
        }

        // Ensure we have valid coordinates
        if (typeof target.x !== 'number' || typeof target.y !== 'number' ||
            isNaN(target.x) || isNaN(target.y)) {
            console.warn('Invalid move target coordinates:', target);
            return;
        }

        // Create a new target object to prevent reference issues
        this.moveTarget = { x: Number(target.x), y: Number(target.y) };

        // Ensure we're not already at the target
        const dx = this.moveTarget.x - this.x;
        const dy = this.moveTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 2) {
            console.log(`Character ${this.name} already at target position, not moving`);
            return;
        }

        // Set moving flag
        this.isMoving = true;

        // Calculate path if we have a world reference and target grid coordinates
        if (this.world && options.targetGridX !== undefined && options.targetGridY !== undefined) {
            this.calculatePath(options.targetGridX, options.targetGridY);
        } else {
            // No pathfinding, just direct movement
            this.path = null;
            this.pathIndex = 0;

            // Initialize velocity based on direction
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            this.velocity.x = normalizedDx * this.speed * 0.16; // Initial velocity (scaled for 60 FPS)
            this.velocity.y = normalizedDy * this.speed * 0.16;

            // Update facing direction immediately
            this.updateFacingDirection(normalizedDx, normalizedDy);
        }

        // Debug log
        console.log(`Character ${this.name} moveTarget set to (${this.moveTarget.x}, ${this.moveTarget.y})`);
        console.log(`Character isMoving set to ${this.isMoving}`);
        console.log(`Character current position: (${this.x}, ${this.y})`);
        console.log(`Character grid position: (${this.gridX}, ${this.gridY})`);
        console.log(`Character velocity: (${this.velocity.x}, ${this.velocity.y})`);
        console.log(`Character speed: ${this.speed}`);

        console.log(`Character ${this.name} moving to (${this.moveTarget.x.toFixed(2)}, ${this.moveTarget.y.toFixed(2)})`);

        // Ensure character is visible
        this.visible = true;
        this.alpha = 1.0;
        this.active = true;

        // Show health bar when moving
        if (this.healthBar) {
            this.healthBar.visible = true;
        }

        // Hide health bar after 3 seconds of inactivity
        if (this.healthBarTimeout) {
            clearTimeout(this.healthBarTimeout);
        }

        this.healthBarTimeout = setTimeout(() => {
            if (this.healthBar) {
                this.healthBar.visible = false;
            }
        }, 3000);
    }

    /**
     * Calculates a path to the target using A* pathfinding
     * @param {number} targetGridX - Target grid X position
     * @param {number} targetGridY - Target grid Y position
     * @private
     */
    calculatePath(targetGridX, targetGridY) {
        if (!this.world) {
            console.warn('Cannot calculate path: no world reference');
            return;
        }

        // Create pathfinder if needed
        const pathFinder = new PathFinder(this.world);

        // Find path
        const path = pathFinder.findPath(
            this.gridX,
            this.gridY,
            targetGridX,
            targetGridY,
            { ignoreWater: true }
        );

        if (!path) {
            console.warn(`No path found from (${this.gridX}, ${this.gridY}) to (${targetGridX}, ${targetGridY})`);
            // Fall back to direct movement
            this.path = null;
            this.pathIndex = 0;

            // Initialize velocity based on direction to target
            const dx = this.moveTarget.x - this.x;
            const dy = this.moveTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            this.velocity.x = normalizedDx * this.speed * 0.16;
            this.velocity.y = normalizedDy * this.speed * 0.16;

            // Update facing direction immediately
            this.updateFacingDirection(normalizedDx, normalizedDy);
            return;
        }

        // Store path and reset index
        this.path = path;
        this.pathIndex = 0;

        console.log(`Path calculated with ${path.length} points:`, path);

        // Set initial velocity towards first path point
        if (path.length > 1) {
            // Skip the first point (current position) and move to the second point
            this.pathIndex = 1;
            const nextPoint = path[this.pathIndex];

            // Convert grid coordinates to world coordinates
            const worldPos = this.world.gridToWorld(nextPoint.x, nextPoint.y);

            // Calculate direction to next point
            const dx = worldPos.x - this.x;
            const dy = worldPos.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            this.velocity.x = normalizedDx * this.speed * 0.16;
            this.velocity.y = normalizedDy * this.speed * 0.16;

            // Update facing direction immediately
            this.updateFacingDirection(normalizedDx, normalizedDy);
        }
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
     * Updates the character's position based on grid coordinates
     */
    updatePosition() {
        if (!this.world) return;

        // Convert grid coordinates to world coordinates
        const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
        this.x = worldPos.x;
        this.y = worldPos.y;

        // Ensure character is visible
        this.visible = true;
        this.alpha = 1.0;

        // Log position update
        console.log(`Character position updated: Grid(${this.gridX}, ${this.gridY}), World(${this.x}, ${this.y})`);
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
