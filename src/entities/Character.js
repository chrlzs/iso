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
                execute: (_user, _target, _combatManager) => {
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
                execute: (user, target, _combatManager) => {
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

            // Synthwave color palette
            const mainColor = options.isPlayer ? 0x00FFFF : (options.color || 0xFF00FF); // Cyan for player, pink for others
            const outlineColor = 0xFF00FF; // Neon pink outline
            const glowColor = options.isPlayer ? 0x00FFFF : 0xFF00FF; // Cyan glow for player, pink for others
            const accentColor = options.isPlayer ? 0xFF00FF : 0x00FFFF; // Pink accents for player, cyan for others

            // Create glow effect
            const glowSize = 8;
            [0.1, 0.2, 0.3].forEach(glowAlpha => {
                graphics.lineStyle(glowSize * (1 + glowAlpha), glowColor, glowAlpha);
                graphics.drawCircle(0, -24, 20);
            });

            // Body - with grid pattern
            graphics.beginFill(mainColor, 0.7);
            graphics.drawCircle(0, -24, 20);
            graphics.endFill();

            // Add neon outline
            graphics.lineStyle(2, outlineColor, 1);
            graphics.drawCircle(0, -24, 20);

            // Add face details with neon effect
            // Eyes
            graphics.beginFill(0xFFFFFF);
            graphics.drawCircle(-6, -30, 4); // Left eye
            graphics.drawCircle(6, -30, 4);  // Right eye
            graphics.endFill();

            // Pupils with glow
            graphics.beginFill(accentColor);
            graphics.drawCircle(-6, -30, 2); // Left pupil
            graphics.drawCircle(6, -30, 2);  // Right pupil
            graphics.endFill();

            // Add smile with neon effect
            graphics.lineStyle(2, accentColor);
            graphics.arc(0, -20, 8, 0.1 * Math.PI, 0.9 * Math.PI);

            // Add body/legs with neon effect
            graphics.lineStyle(2, outlineColor);
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

            // Add grid pattern for synthwave effect
            graphics.lineStyle(1, accentColor, 0.3);
            for (let y = -40; y <= 25; y += 5) {
                graphics.moveTo(-20, y);
                graphics.lineTo(20, y);
            }

            // Add extra neon accents
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Animated neon accents
            graphics.lineStyle(2, accentColor, 0.8);
            const accentLength = 5 * pulseScale;

            // Head accents
            graphics.moveTo(-20, -24);
            graphics.lineTo(-20 + accentLength, -24);
            graphics.moveTo(20, -24);
            graphics.lineTo(20 - accentLength, -24);

            // Shoulder accents
            graphics.moveTo(-15, -10);
            graphics.lineTo(-15, -10 + accentLength);
            graphics.moveTo(15, -10);
            graphics.lineTo(15, -10 + accentLength);

            // Add to container
            this.addChild(graphics);
            this.sprite = graphics;
        } else {
            // Create sprite from texture
            this.sprite = new PIXI.Sprite(options.texture);
            this.sprite.anchor.set(0.5, 1);
            this.addChild(this.sprite);

            // Add neon outline to texture-based sprite
            const outline = new PIXI.Graphics();
            outline.lineStyle(2, options.isPlayer ? 0x00FFFF : 0xFF00FF, 0.8);
            outline.drawRect(-this.sprite.width/2, -this.sprite.height, this.sprite.width, this.sprite.height);
            this.addChild(outline);
        }

        // Ensure sprite is visible
        this.sprite.visible = true;
        this.sprite.alpha = 1.0;

        // Set zIndex to ensure character is above tiles
        this.zIndex = 10;

        // Only log sprite creation in debug mode
        if (options.debug) {
            console.log(`Created character sprite: ${options.name}, isPlayer: ${options.isPlayer}`);
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

        // Glow effect for health bar
        const glowGraphics = new PIXI.Graphics();
        const glowColor = this.isPlayer ? 0x00FFFF : 0xFF00FF; // Cyan for player, pink for others

        [0.05, 0.1, 0.15].forEach(alpha => {
            const size = 3 * (1 + alpha);
            glowGraphics.lineStyle(size, glowColor, alpha);
            glowGraphics.drawRect(-22, -1, 44, 7);
        });
        this.healthBar.addChild(glowGraphics);

        // Background with grid pattern
        this.healthBarBg = new PIXI.Graphics();
        this.healthBarBg.beginFill(0x000000, 0.7);
        this.healthBarBg.drawRect(-20, 0, 40, 5);
        this.healthBarBg.endFill();

        // Add grid lines
        this.healthBarBg.lineStyle(1, 0x333333, 0.5);
        for (let x = -20; x <= 20; x += 4) {
            this.healthBarBg.moveTo(x, 0);
            this.healthBarBg.lineTo(x, 5);
        }
        this.healthBar.addChild(this.healthBarBg);

        // Foreground with neon color
        this.healthBarFg = new PIXI.Graphics();
        this.healthBarFg.beginFill(0x00FFFF); // Cyan neon
        this.healthBarFg.drawRect(-19, 1, 38, 3);
        this.healthBarFg.endFill();
        this.healthBar.addChild(this.healthBarFg);

        // Add neon outline
        const outlineGraphics = new PIXI.Graphics();
        outlineGraphics.lineStyle(1, 0xFF00FF, 1); // Pink neon outline
        outlineGraphics.drawRect(-20, 0, 40, 5);
        this.healthBar.addChild(outlineGraphics);

        // Add corner accents
        const accentGraphics = new PIXI.Graphics();
        accentGraphics.lineStyle(1, 0xFF00FF, 1);

        // Top left corner
        accentGraphics.moveTo(-20, 0);
        accentGraphics.lineTo(-15, 0);
        accentGraphics.moveTo(-20, 0);
        accentGraphics.lineTo(-20, 2);

        // Top right corner
        accentGraphics.moveTo(20, 0);
        accentGraphics.lineTo(15, 0);
        accentGraphics.moveTo(20, 0);
        accentGraphics.lineTo(20, 2);

        // Bottom left corner
        accentGraphics.moveTo(-20, 5);
        accentGraphics.lineTo(-15, 5);
        accentGraphics.moveTo(-20, 5);
        accentGraphics.lineTo(-20, 3);

        // Bottom right corner
        accentGraphics.moveTo(20, 5);
        accentGraphics.lineTo(15, 5);
        accentGraphics.moveTo(20, 5);
        accentGraphics.lineTo(20, 3);

        this.healthBar.addChild(accentGraphics);

        // Hide health bar by default
        this.healthBar.visible = false;
    }

    /**
     * Creates a name label for the character
     * @private
     */
    createNameLabel() {
        // Create text style with synthwave aesthetic
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fontWeight: 'bold',
            fill: [0x00FFFF, 0xFF00FF], // Gradient from cyan to pink
            fillGradientType: 1,
            fillGradientStops: [0, 1],
            stroke: 0x000000,
            strokeThickness: 3,
            dropShadow: true,
            dropShadowColor: 0xFF00FF,
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 2,
            align: 'center'
        });

        // Create text
        this.nameLabel = new PIXI.Text(this.name, style);
        this.nameLabel.anchor.set(0.5, 0);
        this.nameLabel.position.set(0, -60); // Position higher above character

        // Add glow container
        const glowContainer = new PIXI.Container();
        glowContainer.position.set(0, -60);
        this.addChild(glowContainer);

        // Add glow effect
        const glowColor = this.isPlayer ? 0x00FFFF : 0xFF00FF;
        const glow = new PIXI.Graphics();
        [0.05, 0.1, 0.15].forEach(alpha => {
            const size = 3 * (1 + alpha);
            glow.lineStyle(size, glowColor, alpha);
            glow.drawRect(-this.nameLabel.width/2 - 5, -5, this.nameLabel.width + 10, this.nameLabel.height + 5);
        });
        glowContainer.addChild(glow);

        // Add text on top of glow
        this.addChild(this.nameLabel);

        // Add animation update
        this.game?.app?.ticker.add(() => {
            const time = performance.now() / 1000;
            const pulseFactor = 0.9 + Math.sin(time * 2) * 0.1;
            this.nameLabel.scale.set(pulseFactor, pulseFactor);
        });
    }

    /**
     * Updates the character
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Skip update if character is not active or not visible
        if (!this.active || !this.visible) {
            return;
        }

        super.update(deltaTime);

        // Debug log for player character only in debug mode and at a reduced frequency
        if (this.isPlayer && this.game && this.game.options.debug && Math.random() < 0.001) {
            console.log(`Player character update:`);
            console.log(`  Position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
            console.log(`  Grid: (${this.gridX}, ${this.gridY})`);
            console.log(`  Active: ${this.active}, Visible: ${this.visible}`);
            console.log(`  isMoving: ${this.isMoving}`);
            console.log(`  moveTarget: ${this.moveTarget ? `(${this.moveTarget.x.toFixed(2)}, ${this.moveTarget.y.toFixed(2)})` : 'null'}`);
        }

        // Update movement first if moving (most important)
        if (this.isMoving) {
            this.updateMovement(deltaTime);
        }

        // Update animation (only if moving)
        if (this.isMoving) {
            this.updateAnimation(deltaTime);
        }

        // Update health bar (only if visible)
        if (this.healthBar && this.healthBar.visible) {
            this.updateHealthBar();
        }
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
     * Updates character movement - simplified version
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    updateMovement(deltaTime) {
        // Skip if no move target
        if (!this.moveTarget) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.isMoving = false;
            return;
        }

        // Calculate distance to target
        const dx = this.moveTarget.x - this.x;
        const dy = this.moveTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Debug logging
        if (this.isPlayer && this.game && this.game.options.debug && Math.random() < 0.05) {
            console.log(`Player movement: Current pos (${this.x.toFixed(2)}, ${this.y.toFixed(2)}), ` +
                        `Target (${this.moveTarget.x.toFixed(2)}, ${this.moveTarget.y.toFixed(2)}), ` +
                        `Distance: ${distance.toFixed(2)}`);
        }

        // If we're close enough to the target, stop moving
        if (distance < 2) {
            // Snap to exact position
            this.x = this.moveTarget.x;
            this.y = this.moveTarget.y;

            // Update grid position to match target
            if (this._targetGridX !== undefined && this._targetGridY !== undefined) {
                this.gridX = this._targetGridX;
                this.gridY = this._targetGridY;

                // Clear target grid position
                this._targetGridX = undefined;
                this._targetGridY = undefined;
            } else if (this.world) {
                // Calculate grid position from world position
                const gridPos = this.world.worldToGrid(this.x, this.y);
                this.gridX = Math.round(gridPos.x);
                this.gridY = Math.round(gridPos.y);
            }

            // Stop movement
            this.stopMoving();
            return;
        }

        // Calculate normalized direction
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Check if movement is diagonal
        const isDiagonal = Math.abs(normalizedDx) > 0.1 && Math.abs(normalizedDy) > 0.1;
        const speedMultiplier = isDiagonal ? 0.7071 : 1.0; // sqrt(2)/2 for diagonal movement

        // Update velocity with proper speed adjustment
        this.velocity.x = normalizedDx * this.speed * speedMultiplier * deltaTime * 60;
        this.velocity.y = normalizedDy * this.speed * speedMultiplier * deltaTime * 60;

        // Update facing direction
        this.updateFacingDirection(normalizedDx, normalizedDy);

        // Update grid position during movement
        if (this.world) {
            const gridPos = this.world.worldToGrid(this.x, this.y);
            const newGridX = Math.round(gridPos.x);
            const newGridY = Math.round(gridPos.y);

            // Only update grid position if it has changed
            if (newGridX !== this.gridX || newGridY !== this.gridY) {
                // Store previous position for debugging
                const prevGridX = this.gridX;
                const prevGridY = this.gridY;

                // Update grid position
                this.gridX = newGridX;
                this.gridY = newGridY;

                // Debug logging for grid position changes
                if (this.isPlayer && this.game && this.game.options.debug) {
                    console.log(`Player grid position changed: (${prevGridX}, ${prevGridY}) -> (${this.gridX}, ${this.gridY})`);
                }
            }
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
        if (percent > 0.6) return 0x00FFFF; // Cyan (full health)
        if (percent > 0.3) return 0xFF00FF; // Magenta (medium health)
        return 0xFF355E; // Hot pink (low health)
    }

    /**
     * Sets the character's move target - simplified version
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

        // Store target grid coordinates for later use
        if (options.targetGridX !== undefined && options.targetGridY !== undefined) {
            // Store target grid position in private properties
            this._targetGridX = options.targetGridX;
            this._targetGridY = options.targetGridY;

            // Debug log
            if (this.game && this.game.options.debug) {
                console.log(`Target grid position set: (${this._targetGridX}, ${this._targetGridY})`);
            }
        }

        // SIMPLIFIED APPROACH: Always use direct movement
        // We're removing the pathfinding complexity for now
        this.path = null;
        this.pathIndex = 0;

        // Initialize velocity based on direction
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Calculate initial velocity
        const isDiagonal = Math.abs(normalizedDx) > 0.1 && Math.abs(normalizedDy) > 0.1;
        const speedMultiplier = isDiagonal ? 0.7071 : 1.0; // sqrt(2)/2 for diagonal movement

        this.velocity.x = normalizedDx * this.speed * speedMultiplier * 0.16; // Initial velocity (scaled for 60 FPS)
        this.velocity.y = normalizedDy * this.speed * speedMultiplier * 0.16;

        // Update facing direction immediately
        this.updateFacingDirection(normalizedDx, normalizedDy);

        // Debug log only in debug mode
        if (this.game && this.game.options.debug) {
            if (this.isPlayer) {
                console.log(`Player moveTarget set to (${this.moveTarget.x.toFixed(2)}, ${this.moveTarget.y.toFixed(2)})`);
                console.log(`Player isMoving set to ${this.isMoving}`);
                console.log(`Player current position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
                console.log(`Player grid position: (${this.gridX}, ${this.gridY})`);
                console.log(`Initial velocity: (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);

                if (options.targetGridX !== undefined && options.targetGridY !== undefined) {
                    console.log(`Target grid position: (${options.targetGridX}, ${options.targetGridY})`);
                }
            }
        }

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

    // The calculatePath method has been removed in favor of direct movement
    // This simplifies the movement system and makes it more reliable

    /**
     * Stops the character's movement
     */
    stopMoving() {
        this.moveTarget = null;
        this.isMoving = false;
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Debug logging
        if (this.game && this.game.options.debug && this.isPlayer) {
            console.log(`Player stopped moving at position (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
            console.log(`Player grid position: (${this.gridX}, ${this.gridY})`);

            // Log target grid position if it was set
            if (this._targetGridX !== undefined && this._targetGridY !== undefined) {
                console.log(`Target grid position was: (${this._targetGridX}, ${this._targetGridY})`);

                // Check if we reached the target grid position
                if (this.gridX === this._targetGridX && this.gridY === this._targetGridY) {
                    console.log(`Successfully reached target grid position`);
                } else {
                    console.log(`Did not reach target grid position!`);
                }

                // Clear target grid position
                this._targetGridX = undefined;
                this._targetGridY = undefined;
            }
        }
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

        // Log position update only in debug mode
        if (this.game && this.game.options.debug) {
            console.log(`Character position updated: Grid(${this.gridX}, ${this.gridY}), World(${this.x}, ${this.y})`);
        }
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
