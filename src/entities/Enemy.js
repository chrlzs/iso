import { Character } from './Character.js';
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Enemy - Represents an enemy character in the game
 * Extends the Character class with enemy-specific functionality
 */
export class Enemy extends Character {
    /**
     * Creates a new enemy
     * @param {Object} options - Enemy options
     */
    constructor(options = {}) {
        // Set default enemy options
        const enemyOptions = {
            isPlayer: false,
            ...options
        };

        super(enemyOptions);

        // Enemy-specific properties
        this.enemyType = options.enemyType || 'generic';
        this.aggroRange = options.aggroRange || 5;
        this.detectionRange = options.detectionRange || 8;
        this.patrolRadius = options.patrolRadius || 3;
        this.patrolDelay = options.patrolDelay || 2;
        this.aggressive = options.aggressive !== undefined ? options.aggressive : true;

        // AI state
        this.aiState = options.aiState || 'idle'; // idle, patrol, chase, combat
        this.aiTarget = null;
        this.patrolPoint = null;
        this.lastPatrolTime = 0;
        this.spawnPoint = {
            x: this.x,
            y: this.y,
            gridX: this.gridX,
            gridY: this.gridY
        };

        // Combat behavior
        this.combatBehavior = options.combatBehavior || 'balanced'; // aggressive, defensive, balanced, ranged, support
        this.fleeThreshold = options.fleeThreshold || 0.2; // Flee when health below 20%

        // Create enemy appearance based on type
        this.createEnemyAppearance();

        // Make enemy interactive
        this.interactive = true;
        this.buttonMode = true;
        this.on('pointerdown', this.onClick.bind(this));
    }

    /**
     * Creates the enemy's appearance based on type
     * @private
     */
    createEnemyAppearance() {
        // Clear existing sprite
        if (this.sprite) {
            this.removeChild(this.sprite);
        }

        // Create graphics based on enemy type
        const graphics = new PIXI.Graphics();

        // Synthwave color palette
        const colors = {
            slime: {
                main: 0x00FFFF,    // Cyan
                accent: 0xFF00FF,   // Magenta
                dark: 0x000080      // Dark blue
            },
            goblin: {
                main: 0x00FF00,    // Neon green
                accent: 0xFFFF00,   // Yellow
                dark: 0x004400      // Dark green
            },
            skeleton: {
                main: 0xFFFFFF,    // White
                accent: 0x00FFFF,   // Cyan
                dark: 0x444444      // Dark gray
            },
            boss: {
                main: 0xFF355E,    // Hot pink
                accent: 0xFFFF00,   // Yellow
                dark: 0x800020      // Dark red
            },
            generic: {
                main: 0xFF00FF,    // Magenta
                accent: 0x00FFFF,   // Cyan
                dark: 0x800080      // Dark purple
            }
        };

        // Get colors for enemy type
        const enemyColors = colors[this.enemyType] || colors.generic;

        // Common glow effect for all enemies
        const glowSize = 8;
        [0.1, 0.2, 0.3].forEach(glowAlpha => {
            graphics.lineStyle(glowSize * (1 + glowAlpha), enemyColors.accent, glowAlpha);
            switch (this.enemyType) {
                case 'slime':
                    graphics.drawEllipse(0, -10, 20, 15);
                    break;
                case 'goblin':
                case 'skeleton':
                    graphics.drawRoundedRect(-10, -30, 20, 30, 5);
                    break;
                case 'boss':
                    graphics.drawRoundedRect(-15, -40, 30, 40, 5);
                    break;
                default:
                    graphics.drawCircle(0, -15, 15);
                    break;
            }
        });

        switch (this.enemyType) {
            case 'slime':
                // Slime body with neon effect
                graphics.beginFill(enemyColors.main, 0.7);
                graphics.drawEllipse(0, -10, 20, 15);
                graphics.endFill();

                // Neon outline
                graphics.lineStyle(2, enemyColors.accent, 1);
                graphics.drawEllipse(0, -10, 20, 15);

                // Grid pattern
                graphics.lineStyle(1, enemyColors.accent, 0.3);
                for (let y = -20; y <= 0; y += 4) {
                    graphics.moveTo(-20, y);
                    graphics.lineTo(20, y);
                }

                // Slime eyes with glow
                graphics.beginFill(0xFFFFFF);
                graphics.drawCircle(-8, -15, 5);
                graphics.drawCircle(8, -15, 5);
                graphics.endFill();

                graphics.beginFill(enemyColors.accent);
                graphics.drawCircle(-8, -15, 2);
                graphics.drawCircle(8, -15, 2);
                graphics.endFill();

                // Add animated accents
                const time = performance.now() / 1000;
                const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
                graphics.lineStyle(2, enemyColors.accent, 0.8);
                graphics.moveTo(-15, -10);
                graphics.lineTo(-15 + 5 * pulseScale, -10);
                graphics.moveTo(15, -10);
                graphics.lineTo(15 - 5 * pulseScale, -10);
                break;

            case 'goblin':
                // Goblin body with neon effect
                graphics.beginFill(enemyColors.main, 0.7);
                graphics.drawRoundedRect(-10, -30, 20, 30, 5);
                graphics.endFill();

                // Neon outline
                graphics.lineStyle(2, enemyColors.accent, 1);
                graphics.drawRoundedRect(-10, -30, 20, 30, 5);

                // Grid pattern
                graphics.lineStyle(1, enemyColors.accent, 0.3);
                for (let y = -30; y <= 0; y += 5) {
                    graphics.moveTo(-10, y);
                    graphics.lineTo(10, y);
                }

                // Goblin head with neon effect
                graphics.beginFill(enemyColors.main, 0.7);
                graphics.drawCircle(0, -35, 10);
                graphics.endFill();

                graphics.lineStyle(2, enemyColors.accent, 1);
                graphics.drawCircle(0, -35, 10);

                // Goblin eyes with glow
                graphics.beginFill(enemyColors.accent);
                graphics.drawCircle(-5, -35, 2);
                graphics.drawCircle(5, -35, 2);
                graphics.endFill();

                // Goblin weapon with neon effect
                graphics.beginFill(enemyColors.dark);
                graphics.drawRect(15, -25, 3, 20);
                graphics.endFill();

                graphics.lineStyle(1, enemyColors.accent, 1);
                graphics.drawRect(15, -25, 3, 20);
                break;

            case 'skeleton':
                // Skeleton body with neon effect
                graphics.beginFill(enemyColors.dark, 0.7);
                graphics.drawRoundedRect(-10, -30, 20, 30, 2);
                graphics.endFill();

                // Neon outline
                graphics.lineStyle(2, enemyColors.main, 1);
                graphics.drawRoundedRect(-10, -30, 20, 30, 2);

                // Skeleton head with neon effect
                graphics.beginFill(enemyColors.dark, 0.7);
                graphics.drawCircle(0, -40, 10);
                graphics.endFill();

                graphics.lineStyle(2, enemyColors.main, 1);
                graphics.drawCircle(0, -40, 10);

                // Skeleton eyes with glow
                graphics.beginFill(enemyColors.accent);
                graphics.drawCircle(-4, -40, 2);
                graphics.drawCircle(4, -40, 2);
                graphics.endFill();

                // Skeleton ribs with neon effect
                graphics.lineStyle(1, enemyColors.main, 1);
                for (let i = 0; i < 5; i++) {
                    graphics.moveTo(-10, -25 + i * 5);
                    graphics.lineTo(10, -25 + i * 5);
                }

                // Skeleton weapon with neon effect
                graphics.beginFill(enemyColors.dark);
                graphics.drawRect(15, -30, 2, 30);
                graphics.endFill();

                graphics.lineStyle(1, enemyColors.accent, 1);
                graphics.drawRect(15, -30, 2, 30);
                break;

            case 'boss':
                // Boss body with neon effect
                graphics.beginFill(enemyColors.dark, 0.7);
                graphics.drawRoundedRect(-15, -40, 30, 40, 5);
                graphics.endFill();

                // Neon outline
                graphics.lineStyle(2, enemyColors.main, 1);
                graphics.drawRoundedRect(-15, -40, 30, 40, 5);

                // Grid pattern
                graphics.lineStyle(1, enemyColors.accent, 0.3);
                for (let y = -40; y <= 0; y += 5) {
                    graphics.moveTo(-15, y);
                    graphics.lineTo(15, y);
                }

                // Boss head with neon effect
                graphics.beginFill(enemyColors.dark, 0.7);
                graphics.drawCircle(0, -50, 15);
                graphics.endFill();

                graphics.lineStyle(2, enemyColors.main, 1);
                graphics.drawCircle(0, -50, 15);

                // Boss eyes with glow
                graphics.beginFill(enemyColors.accent);
                graphics.drawCircle(-6, -50, 3);
                graphics.drawCircle(6, -50, 3);
                graphics.endFill();

                // Boss horns with neon effect
                graphics.lineStyle(2, enemyColors.accent, 1);
                graphics.beginFill(enemyColors.dark);
                graphics.moveTo(-10, -60);
                graphics.lineTo(-15, -70);
                graphics.lineTo(-5, -65);
                graphics.closePath();
                graphics.endFill();

                graphics.beginFill(enemyColors.dark);
                graphics.moveTo(10, -60);
                graphics.lineTo(15, -70);
                graphics.lineTo(5, -65);
                graphics.closePath();
                graphics.endFill();

                // Boss weapon with neon effect
                graphics.beginFill(enemyColors.dark);
                graphics.drawRect(20, -40, 5, 50);
                graphics.endFill();

                graphics.lineStyle(2, enemyColors.accent, 1);
                graphics.drawRect(20, -40, 5, 50);

                // Add animated energy effect
                const bossTime = performance.now() / 1000;
                const bossPulse = 0.7 + Math.sin(bossTime * 3) * 0.3;
                graphics.lineStyle(3 * bossPulse, enemyColors.accent, 0.8);
                graphics.drawCircle(0, -30, 25 * bossPulse);
                break;

            default:
                // Generic enemy with neon effect
                graphics.beginFill(enemyColors.main, 0.7);
                graphics.drawCircle(0, -15, 15);
                graphics.endFill();

                // Neon outline
                graphics.lineStyle(2, enemyColors.accent, 1);
                graphics.drawCircle(0, -15, 15);

                // Grid pattern
                graphics.lineStyle(1, enemyColors.accent, 0.3);
                for (let y = -25; y <= -5; y += 4) {
                    graphics.moveTo(-15, y);
                    graphics.lineTo(15, y);
                }

                // Generic eyes with glow
                graphics.beginFill(0xFFFFFF);
                graphics.drawCircle(-5, -15, 5);
                graphics.drawCircle(5, -15, 5);
                graphics.endFill();

                graphics.beginFill(enemyColors.accent);
                graphics.drawCircle(-5, -15, 2);
                graphics.drawCircle(5, -15, 2);
                graphics.endFill();

                // Add animated accents
                const genericTime = performance.now() / 1000;
                const genericPulse = 0.7 + Math.sin(genericTime * 2) * 0.3;
                graphics.lineStyle(2, enemyColors.accent, 0.8);
                graphics.moveTo(-15, -15);
                graphics.lineTo(-15 + 5 * genericPulse, -15);
                graphics.moveTo(15, -15);
                graphics.lineTo(15 - 5 * genericPulse, -15);
                break;
        }

        // Add to container
        this.addChild(graphics);
        this.sprite = graphics;
    }

    /**
     * Updates the enemy
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Skip AI if in combat
        if (this.aiState === 'combat') return;

        // Update AI based on state
        switch (this.aiState) {
            case 'idle':
                this.updateIdleState(deltaTime);
                break;

            case 'patrol':
                this.updatePatrolState(deltaTime);
                break;

            case 'chase':
                this.updateChaseState(deltaTime);
                break;
        }
    }

    /**
     * Handles click events on the enemy
     * @param {PIXI.InteractionEvent} event - The interaction event
     */
    onClick(event) {
        console.log(`Clicked on ${this.enemyType} enemy!`);

        // Get the game instance and player
        const world = this.parent?.parent;
        const game = world?.game;
        const player = game?.player;

        if (game && player) {
            // Start combat with player
            this.initiateCombat(player);
        }
    }

    /**
     * Handles enemy defeat
     */
    defeat() {
        console.log(`${this.enemyType} enemy defeated!`);

        // Play defeat animation
        this.playAnimation('defeat');

        // Remove from world after a delay
        setTimeout(() => {
            if (this.parent) {
                this.parent.removeChild(this);
            }
        }, 1000);
    }

    /**
     * Updates the idle state
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    updateIdleState(deltaTime) {
        // Check for player in detection range
        const player = this.world?.game?.player;

        if (player && this.isPlayerInRange(player, this.detectionRange)) {
            // Player detected, start chasing
            this.aiTarget = player;
            this.aiState = 'chase';
            return;
        }

        // Randomly start patrolling
        if (Math.random() < 0.01 * deltaTime) {
            this.aiState = 'patrol';
            this.generatePatrolPoint();
        }
    }

    /**
     * Updates the patrol state
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    updatePatrolState(deltaTime) {
        // Check for player in detection range
        const player = this.world?.game?.player;

        if (player && this.isPlayerInRange(player, this.detectionRange)) {
            // Player detected, start chasing
            this.aiTarget = player;
            this.aiState = 'chase';
            return;
        }

        // Move towards patrol point
        if (this.patrolPoint) {
            // Check if we've reached the patrol point
            const dx = this.patrolPoint.x - this.x;
            const dy = this.patrolPoint.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                // Reached patrol point, wait before generating a new one
                this.lastPatrolTime = Date.now();
                this.patrolPoint = null;
                return;
            }

            // Move towards patrol point
            this.setMoveTarget(this.patrolPoint);
        } else {
            // Check if we should generate a new patrol point
            const now = Date.now();
            if (now - this.lastPatrolTime > this.patrolDelay * 1000) {
                this.generatePatrolPoint();
            }
        }
    }

    /**
     * Updates the chase state
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    updateChaseState(deltaTime) {
        // Check if target is still valid
        if (!this.aiTarget || !this.aiTarget.active || this.aiTarget.health <= 0) {
            // Target lost, go back to idle
            this.aiTarget = null;
            this.aiState = 'idle';
            return;
        }

        // Check if target is still in range
        if (!this.isPlayerInRange(this.aiTarget, this.aggroRange)) {
            // Target out of range, go back to idle
            this.aiTarget = null;
            this.aiState = 'idle';
            return;
        }

        // Check if we're close enough to initiate combat
        const dx = this.aiTarget.x - this.x;
        const dy = this.aiTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 50) {
            // Close enough, initiate combat
            this.initiateCombat(this.aiTarget);
            return;
        }

        // Move towards target
        this.setMoveTarget({ x: this.aiTarget.x, y: this.aiTarget.y });
    }

    /**
     * Generates a random patrol point within the patrol radius
     * @private
     */
    generatePatrolPoint() {
        if (!this.world) return;

        // Get spawn point grid coordinates
        const spawnGridPos = this.world.worldToGrid(this.spawnPoint.x, this.spawnPoint.y);

        // Generate random offsets within patrol radius
        const gridOffsetX = (Math.random() * 2 - 1) * this.patrolRadius;
        const gridOffsetY = (Math.random() * 2 - 1) * this.patrolRadius;

        // Calculate new grid coordinates
        const newGridX = Math.round(spawnGridPos.x + gridOffsetX);
        const newGridY = Math.round(spawnGridPos.y + gridOffsetY);

        // Clamp to world bounds
        const clampedGridX = Math.max(0, Math.min(this.world.config.gridWidth - 1, newGridX));
        const clampedGridY = Math.max(0, Math.min(this.world.config.gridHeight - 1, newGridY));

        // Convert back to world coordinates
        const worldPos = this.world.gridToWorld(clampedGridX, clampedGridY);
        this.patrolPoint = worldPos;

        console.log(`Generated patrol point at grid (${clampedGridX}, ${clampedGridY}), world (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);
    }

    /**
     * Checks if a player is within a certain range
     * @param {Character} player - The player to check
     * @param {number} range - The range to check in grid units
     * @returns {boolean} Whether the player is in range
     * @private
     */
    isPlayerInRange(player, range) {
        if (!this.world) return false;

        // Get our position in grid coordinates
        const ourGridPos = this.world.worldToGrid(this.x, this.y);
        const playerGridPos = this.world.worldToGrid(player.x, player.y);

        // Calculate grid distance
        const gridDx = playerGridPos.x - ourGridPos.x;
        const gridDy = playerGridPos.y - ourGridPos.y;
        const gridDistance = Math.sqrt(gridDx * gridDx + gridDy * gridDy);

        return gridDistance <= range;
    }

    /**
     * Initiates combat with a target
     * @param {Character} target - The target to initiate combat with
     * @private
     */
    initiateCombat(target) {
        // Set AI state to combat
        this.aiState = 'combat';

        // Stop movement
        this.stopMoving();

        // Get combat manager
        const combatManager = this.world?.game?.combatManager;

        if (combatManager) {
            // Start combat
            combatManager.startCombat([this], [target]);
        }
    }

    /**
     * Resets the enemy
     * @param {Object} options - Reset options
     */
    reset(options = {}) {
        super.reset(options);

        // Reset AI state
        this.aiState = 'idle';
        this.aiTarget = null;
        this.patrolPoint = null;
        this.lastPatrolTime = 0;

        // Reset spawn point
        if (options.x !== undefined && options.y !== undefined) {
            this.spawnPoint = {
                x: options.x,
                y: options.y,
                gridX: options.gridX || 0,
                gridY: options.gridY || 0
            };
        }
    }
}
