/**
 * MemoryManager - Manages memory usage and performs garbage collection
 */
export class MemoryManager {
    /**
     * Creates a new memory manager
     * @param {Object} options - Manager options
     */
    constructor(options = {}) {
        this.options = {
            cleanupInterval: 60000,  // Clean up every minute
            textureMaxAge: 300000,   // Textures unused for 5 minutes get purged
            entityCullingDistance: 100, // Distance at which to cull entities
            ...options
        };

        this.lastCleanupTime = 0;
        this.textureLastUsed = new Map();
        this.isRunning = false;

        // Bind methods
        this.update = this.update.bind(this);
        this.cleanupMemory = this.cleanupMemory.bind(this);
    }

    /**
     * Updates the memory manager
     * @param {Object} gameInstance - Game instance
     */
    update(gameInstance) {
        try {
            if (!gameInstance) return;

            // Store reference to game instance for logging
            this._gameInstance = gameInstance;

            const now = performance.now();

            // Track texture usage
            try {
                if (gameInstance.tileManager && gameInstance.tileManager.textures) {
                    for (const [key, texture] of gameInstance.tileManager.textures.entries()) {
                        if (texture && texture.isVisible) {
                            this.textureLastUsed.set(key, now);
                        }
                    }
                }
            } catch (e) {
                // Silent fail - texture tracking error
            }

            // Perform cleanup at regular intervals
            if (now - this.lastCleanupTime > this.options.cleanupInterval) {
                this.cleanupMemory(gameInstance);
                this.lastCleanupTime = now;
            }
        } catch (error) {
            // Use logger if available, otherwise fall back to console
            if (gameInstance && gameInstance.logger) {
                gameInstance.logger.error('Error in memory manager update:', error);
            } else {
                console.error('Error in memory manager update:', error);
            }

            // Don't let memory management crash the game
            this.lastCleanupTime = performance.now();
        }
    }

    /**
     * Cleans up memory by removing unused resources
     * @param {Object} gameInstance - Game instance
     */
    cleanupMemory(gameInstance) {
        try {
            if (!gameInstance) return;

            // Log cleanup start
            if (gameInstance && gameInstance.logger) {
                gameInstance.logger.info('Performing memory cleanup...');
            }

            // Clean up unused textures
            try {
                this.cleanupTextures(gameInstance);
            } catch (e) {
                if (gameInstance && gameInstance.logger) {
                    gameInstance.logger.error('Error cleaning up textures:', e);
                }
            }

            // Clean up distant entities
            try {
                this.cleanupEntities(gameInstance);
            } catch (e) {
                if (gameInstance && gameInstance.logger) {
                    gameInstance.logger.error('Error cleaning up entities:', e);
                }
            }

            // Clean up cached data
            try {
                this.cleanupCaches(gameInstance);
            } catch (e) {
                if (gameInstance && gameInstance.logger) {
                    gameInstance.logger.error('Error cleaning up caches:', e);
                }
            }

            // Force garbage collection if possible
            try {
                this.forceGarbageCollection();
            } catch (e) {
                if (gameInstance && gameInstance.logger) {
                    gameInstance.logger.error('Error forcing garbage collection:', e);
                }
            }

            // Log cleanup complete
            if (gameInstance && gameInstance.logger) {
                gameInstance.logger.info('Memory cleanup complete');
            }
        } catch (error) {
            // Use logger if available, otherwise fall back to console
            if (gameInstance && gameInstance.logger) {
                gameInstance.logger.error('Error in memory cleanup:', error);
            } else {
                console.error('Error in memory cleanup:', error);
            }
        }
    }

    /**
     * Cleans up unused textures
     * @param {Object} gameInstance - Game instance
     */
    cleanupTextures(gameInstance) {
        if (!gameInstance.tileManager || !gameInstance.tileManager.textures) return;

        const now = performance.now();
        let texturesRemoved = 0;

        // Get essential textures that should never be removed
        const essentialTextures = ['grass', 'dirt', 'water', 'concrete'];

        // Remove textures that haven't been used recently
        for (const [key, _] of gameInstance.tileManager.textures.entries()) {
            // Skip essential textures
            if (essentialTextures.includes(key)) continue;

            // Skip textures that are currently being generated
            if (gameInstance.tileManager.generatingTextures &&
                gameInstance.tileManager.generatingTextures.has(key)) {
                continue;
            }

            // Check if texture hasn't been used recently
            const lastUsed = this.textureLastUsed.get(key) || 0;
            if (now - lastUsed > this.options.textureMaxAge) {
                gameInstance.tileManager.textures.delete(key);
                this.textureLastUsed.delete(key);
                texturesRemoved++;
            }
        }

        if (texturesRemoved > 0 && gameInstance && gameInstance.logger) {
            gameInstance.logger.info(`Removed ${texturesRemoved} unused textures`);
        }
    }

    /**
     * Cleans up distant entities
     * @param {Object} gameInstance - Game instance
     */
    cleanupEntities(gameInstance) {
        if (!gameInstance || !gameInstance.world || !gameInstance.world.entities || !Array.isArray(gameInstance.world.entities)) return;

        const player = gameInstance.player;
        if (!player || typeof player.x === 'undefined' || typeof player.y === 'undefined') return;

        let entitiesRemoved = 0;

        // Remove entities that are too far from the player
        gameInstance.world.entities = gameInstance.world.entities.filter(entity => {
            // Skip null or invalid entities
            if (!entity || typeof entity.x === 'undefined' || typeof entity.y === 'undefined') return false;

            // Skip important entities
            if (entity.isImportant || entity.isPersistent) return true;

            // Calculate distance to player
            const dx = entity.x - player.x;
            const dy = entity.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Remove if too far
            if (distance > this.options.entityCullingDistance) {
                entitiesRemoved++;
                return false;
            }

            return true;
        });

        if (entitiesRemoved > 0 && gameInstance && gameInstance.logger) {
            gameInstance.logger.info(`Removed ${entitiesRemoved} distant entities`);
        }
    }

    /**
     * Cleans up cached data
     * @param {Object} gameInstance - Game instance
     */
    cleanupCaches(gameInstance) {
        // Clean up path cache
        if (gameInstance.pathCache) {
            gameInstance.pathCache.clear();
            if (gameInstance.logger) {
                gameInstance.logger.debug('Cleared path cache');
            }
        }

        // Clean up asset cache
        if (gameInstance.assetCache) {
            const removed = gameInstance.assetCache.cleanup();
            if (removed > 0 && gameInstance.logger) {
                gameInstance.logger.info(`Removed ${removed} expired assets from cache`);
            }
        }
    }

    /**
     * Forces garbage collection if possible
     */
    forceGarbageCollection() {
        // Try to force garbage collection
        if (window.gc) {
            try {
                window.gc();
                // This is a debug-only message, so use debug level
                if (this._gameInstance && this._gameInstance.logger) {
                    this._gameInstance.logger.debug('Forced garbage collection');
                }
            } catch (e) {
                if (this._gameInstance && this._gameInstance.logger) {
                    this._gameInstance.logger.warn('Failed to force garbage collection:', e);
                }
            }
        }
    }
}
