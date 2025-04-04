/**
 * FPSStabilizer - Maintains stable FPS by taking drastic measures when performance degrades
 */
export class FPSStabilizer {
    /**
     * Creates a new FPS stabilizer
     * @param {Object} options - Stabilizer options
     */
    constructor(options = {}) {
        this.options = {
            enabled: true,
            minAcceptableFPS: 5,
            criticalFPS: 2,
            checkInterval: 10000, // Check every 10 seconds
            recoveryMeasures: ['gc', 'textures', 'entities', 'reset'],
            maxResets: 3, // Maximum number of resets before more drastic measures
            ...options
        };

        this.lastCheckTime = 0;
        this.resetCount = 0;
        this.lastResetTime = 0;
        this.fpsHistory = [];
        this.isRecovering = false;

        // Bind methods
        this.update = this.update.bind(this);
        this.checkFPS = this.checkFPS.bind(this);
        this.applyRecoveryMeasures = this.applyRecoveryMeasures.bind(this);
    }

    /**
     * Updates the FPS stabilizer
     * @param {Object} gameInstance - Game instance
     * @param {number} currentFPS - Current FPS
     */
    update(gameInstance, currentFPS) {
        if (!this.options.enabled || !gameInstance) return;

        // Add FPS to history
        this.fpsHistory.push(currentFPS);
        if (this.fpsHistory.length > 10) {
            this.fpsHistory.shift();
        }

        const now = performance.now();

        // Skip if we're already in recovery mode
        if (this.isRecovering) return;

        // Check FPS periodically
        if (now - this.lastCheckTime > this.options.checkInterval) {
            this.checkFPS(gameInstance);
            this.lastCheckTime = now;
        }
    }

    /**
     * Checks if FPS is acceptable
     * @param {Object} gameInstance - Game instance
     */
    checkFPS(gameInstance) {
        if (this.fpsHistory.length < 3) return;

        // Calculate average FPS
        const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;

        // Log current FPS status
        if (gameInstance.logger) {
            gameInstance.logger.info(`FPS Stabilizer: Current average FPS: ${avgFPS.toFixed(1)}`);
        }

        // Check if FPS is below acceptable threshold
        if (avgFPS < this.options.minAcceptableFPS) {
            if (gameInstance.logger) {
                gameInstance.logger.warn(`FPS Stabilizer: FPS below acceptable threshold (${avgFPS.toFixed(1)} < ${this.options.minAcceptableFPS})`);
            }

            this.applyRecoveryMeasures(gameInstance, avgFPS);
        }
    }

    /**
     * Applies recovery measures to improve FPS
     * @param {Object} gameInstance - Game instance
     * @param {number} currentFPS - Current FPS
     */
    applyRecoveryMeasures(gameInstance, currentFPS) {
        this.isRecovering = true;

        try {
            // Determine which recovery measures to apply based on FPS
            const isCritical = currentFPS <= this.options.criticalFPS;

            if (gameInstance.logger) {
                gameInstance.logger.warn(`FPS Stabilizer: Applying recovery measures (FPS: ${currentFPS.toFixed(1)}, Critical: ${isCritical})`);
            }

            // Apply measures in order of increasing severity
            if (this.options.recoveryMeasures.includes('gc')) {
                this.forceGarbageCollection(gameInstance);
            }

            if (this.options.recoveryMeasures.includes('textures')) {
                this.purgeTextures(gameInstance);
            }

            if (this.options.recoveryMeasures.includes('entities')) {
                this.purgeEntities(gameInstance);
            }

            // We've disabled drastic measures like resetting the game state
            // or using simplified renderers per user request

            // Instead, we'll just focus on basic optimizations like
            // garbage collection and entity/texture cleanup
        } catch (error) {
            if (gameInstance.logger) {
                gameInstance.logger.error('FPS Stabilizer: Error applying recovery measures:', error);
            }
        } finally {
            this.isRecovering = false;
        }
    }

    /**
     * Forces garbage collection
     * @param {Object} gameInstance - Game instance
     */
    forceGarbageCollection(gameInstance) {
        if (gameInstance.logger) {
            gameInstance.logger.info('FPS Stabilizer: Forcing garbage collection');
        }

        // Clear any caches
        if (gameInstance.memoryManager) {
            gameInstance.memoryManager.cleanupMemory(gameInstance);
        }

        // Force garbage collection if available
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                // Ignore errors
            }
        }
    }

    /**
     * Purges all textures and regenerates only essential ones
     * @param {Object} gameInstance - Game instance
     */
    purgeTextures(gameInstance) {
        if (gameInstance.logger) {
            gameInstance.logger.info('FPS Stabilizer: Purging textures');
        }

        try {
            // Clear texture cache
            if (gameInstance.tileManager && gameInstance.tileManager.textures) {
                // Keep track of essential textures
                const essentialTypes = ['grass', 'dirt', 'water'];
                const essentialTextures = new Map();

                // Save essential textures
                for (const type of essentialTypes) {
                    if (gameInstance.tileManager.textures.has(type)) {
                        essentialTextures.set(type, gameInstance.tileManager.textures.get(type));
                    }
                }

                // Clear all textures
                gameInstance.tileManager.textures.clear();

                // Restore essential textures
                for (const [type, texture] of essentialTextures.entries()) {
                    gameInstance.tileManager.textures.set(type, texture);
                }

                if (gameInstance.logger) {
                    gameInstance.logger.info(`FPS Stabilizer: Purged textures, kept ${essentialTextures.size} essential textures`);
                }
            }
        } catch (e) {
            if (gameInstance.logger) {
                gameInstance.logger.error('FPS Stabilizer: Error purging textures:', e);
            }
        }
    }

    /**
     * Purges non-essential entities
     * @param {Object} gameInstance - Game instance
     */
    purgeEntities(gameInstance) {
        if (gameInstance.logger) {
            gameInstance.logger.info('FPS Stabilizer: Purging non-essential entities');
        }

        try {
            // Remove distant entities
            if (gameInstance.world && gameInstance.world.entities && gameInstance.player) {
                const playerX = gameInstance.player.x;
                const playerY = gameInstance.player.y;
                const maxDistance = 10; // Only keep entities very close to player

                // Filter entities
                const originalCount = gameInstance.world.entities.length;
                gameInstance.world.entities = gameInstance.world.entities.filter(entity => {
                    // Keep essential entities
                    if (entity.isImportant || entity.isPersistent || entity === gameInstance.player) {
                        return true;
                    }

                    // Calculate distance to player
                    const dx = entity.x - playerX;
                    const dy = entity.y - playerY;
                    const distanceSquared = dx * dx + dy * dy;

                    // Keep only close entities
                    return distanceSquared <= maxDistance * maxDistance;
                });

                const removedCount = originalCount - gameInstance.world.entities.length;

                if (gameInstance.logger) {
                    gameInstance.logger.info(`FPS Stabilizer: Removed ${removedCount} distant entities`);
                }
            }
        } catch (e) {
            if (gameInstance.logger) {
                gameInstance.logger.error('FPS Stabilizer: Error purging entities:', e);
            }
        }
    }

    /**
     * Performs a gentle cleanup of game resources
     * @param {Object} gameInstance - Game instance
     */
    resetGameState(gameInstance) {
        if (gameInstance.logger) {
            gameInstance.logger.warn(`FPS Stabilizer: Performing gentle cleanup (cleanup #${this.resetCount + 1})`);
        }

        try {
            // Clear caches but don't reset the entire game state
            if (gameInstance.memoryManager) {
                gameInstance.memoryManager.cleanupMemory(gameInstance);
            }

            // Reset spatial grid without removing entities
            if (gameInstance.spatialGrid) {
                gameInstance.spatialGrid.refresh(); // Just refresh instead of clear
            }

            // Reset occlusion culling
            if (gameInstance.occlusionCulling) {
                gameInstance.occlusionCulling.refreshOccluders(); // Refresh instead of release
            }

            // Reset render batches
            if (gameInstance.renderBatch) {
                gameInstance.renderBatch.clear();
            }

            // Force garbage collection
            this.forceGarbageCollection(gameInstance);

            if (gameInstance.logger) {
                gameInstance.logger.info('FPS Stabilizer: Gentle cleanup complete');
            }
        } catch (e) {
            if (gameInstance.logger) {
                gameInstance.logger.error('FPS Stabilizer: Error during cleanup:', e);
            }
        }
    }

    /**
     * Applies moderate performance optimizations
     * @param {Object} gameInstance - Game instance
     */
    applyDrasticMeasures(gameInstance) {
        if (gameInstance.logger) {
            gameInstance.logger.warn('FPS Stabilizer: Applying moderate performance optimizations');
        }

        try {
            // Apply moderate performance settings
            if (gameInstance.performanceMode) {
                gameInstance.performanceMode.enabled = true;
                gameInstance.performanceMode.frameSkip = 2; // Skip 2 frames for every 1 rendered
                gameInstance.performanceMode.maxEntitiesRendered = 30;
                gameInstance.performanceMode.cullingDistance = 15;
                gameInstance.performanceMode.lodDistance = 8;
                gameInstance.performanceMode.lodEnabled = true;
            }

            // Keep essential systems enabled but optimize them
            if (gameInstance.occlusionCulling) {
                gameInstance.occlusionCulling.options.maxOccluders = 20; // Reduce number of occluders
            }

            // Reduce texture quality but keep regeneration
            if (gameInstance.tileManager) {
                gameInstance.tileManager.textureQuality = 'medium';
            }

            // Adjust logger settings
            if (gameInstance.logger) {
                gameInstance.logger.setLevel('warn'); // Reduce logging but keep important messages
                gameInstance.logger.warn('FPS Stabilizer: Applied moderate performance optimizations');
            }
        } catch (e) {
            if (gameInstance.logger) {
                gameInstance.logger.error('FPS Stabilizer: Error applying performance optimizations:', e);
            }
        }
    }

    /**
     * Resets the stabilizer state
     */
    reset() {
        this.lastCheckTime = 0;
        this.resetCount = 0;
        this.lastResetTime = 0;
        this.fpsHistory = [];
        this.isRecovering = false;
    }
}
