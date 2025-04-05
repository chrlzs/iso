/**
 * GameStateSnapshot - Saves and restores minimal game state
 */
export class GameStateSnapshot {
    /**
     * Creates a new game state snapshot
     * @param {Object} options - Snapshot options
     */
    constructor(options = {}) {
        this.options = {
            includeEntities: true,
            includePlayer: true,
            includeCamera: true,
            ...options
        };

        this.snapshot = null;
    }

    /**
     * Takes a snapshot of the current game state
     * @param {Object} gameInstance - Game instance
     */
    takeSnapshot(gameInstance) {
        if (!gameInstance) return;

        try {
            const snapshot = {
                timestamp: Date.now(),
                player: null,
                camera: null,
                entities: [],
                worldState: {}
            };

            // Save player state
            if (this.options.includePlayer && gameInstance.player) {
                snapshot.player = {
                    x: gameInstance.player.x,
                    y: gameInstance.player.y,
                    health: gameInstance.player.health,
                    inventory: this.getInventoryCopy(gameInstance.player)
                };
            }

            // Save camera state
            if (this.options.includeCamera && gameInstance.camera) {
                snapshot.camera = {
                    x: gameInstance.camera.x,
                    y: gameInstance.camera.y,
                    followPlayer: gameInstance.camera.followPlayer,
                    offsetX: gameInstance.camera.offsetX,
                    offsetY: gameInstance.camera.offsetY
                };
            }

            // Save essential entities (not all entities to keep snapshot small)
            if (this.options.includeEntities && gameInstance.world && gameInstance.world.entities) {
                // Only save important entities
                for (const entity of gameInstance.world.entities) {
                    if (entity.isImportant || entity.isPersistent) {
                        snapshot.entities.push({
                            id: entity.id,
                            type: entity.type,
                            x: entity.x,
                            y: entity.y,
                            state: entity.state
                        });
                    }
                }
            }

            // Save minimal world state
            if (gameInstance.world) {
                snapshot.worldState = {
                    seed: gameInstance.world.seed,
                    width: gameInstance.world.width,
                    height: gameInstance.world.height
                };
            }

            this.snapshot = snapshot;

            if (gameInstance.logger) {
                gameInstance.logger.info('Game state snapshot taken', {
                    timestamp: new Date(snapshot.timestamp).toISOString(),
                    entities: snapshot.entities.length
                });
            }

            return true;
        } catch (error) {
            // Use logger if available, otherwise fall back to console
            if (gameInstance.logger) {
                gameInstance.logger.error('Error taking game state snapshot:', error);
            } else {
                console.error('Error taking game state snapshot:', error);
            }
            return false;
        }
    }

    /**
     * Restores the game state from a snapshot
     * @param {Object} gameInstance - Game instance
     * @returns {boolean} True if successful
     */
    restoreSnapshot(gameInstance) {
        if (!gameInstance || !this.snapshot) return false;

        try {
            // Restore player state
            if (this.snapshot.player && gameInstance.player) {
                gameInstance.player.x = this.snapshot.player.x;
                gameInstance.player.y = this.snapshot.player.y;

                if (typeof this.snapshot.player.health !== 'undefined') {
                    gameInstance.player.health = this.snapshot.player.health;
                }

                // Restore inventory if it exists
                if (this.snapshot.player.inventory) {
                    this.restoreInventory(gameInstance.player, this.snapshot.player.inventory);
                }
            }

            // Restore camera state
            if (this.snapshot.camera && gameInstance.camera) {
                gameInstance.camera.x = this.snapshot.camera.x;
                gameInstance.camera.y = this.snapshot.camera.y;
                gameInstance.camera.followPlayer = this.snapshot.camera.followPlayer;
                gameInstance.camera.offsetX = this.snapshot.camera.offsetX;
                gameInstance.camera.offsetY = this.snapshot.camera.offsetY;
            }

            // Don't restore entities - let the game regenerate them
            // This is intentional to avoid memory issues

            if (gameInstance.logger) {
                gameInstance.logger.info('Game state snapshot restored', {
                    timestamp: new Date(this.snapshot.timestamp).toISOString()
                });
            }

            return true;
        } catch (error) {
            // Use logger if available, otherwise fall back to console
            if (gameInstance.logger) {
                gameInstance.logger.error('Error restoring game state snapshot:', error);
            } else {
                console.error('Error restoring game state snapshot:', error);
            }
            return false;
        }
    }

    /**
     * Checks if a snapshot exists
     * @returns {boolean} True if a snapshot exists
     */
    hasSnapshot() {
        return this.snapshot !== null;
    }

    /**
     * Gets the age of the snapshot in milliseconds
     * @returns {number} Age in milliseconds or -1 if no snapshot
     */
    getSnapshotAge() {
        if (!this.snapshot) return -1;
        return Date.now() - this.snapshot.timestamp;
    }

    /**
     * Gets a safe copy of the player's inventory
     * @param {Object} player - Player object
     * @returns {Array|Object} Copy of inventory or empty array
     * @private
     */
    getInventoryCopy(player) {
        if (!player) return [];

        try {
            // Check if inventory exists
            if (!player.inventory) return [];

            // Handle different inventory types
            if (Array.isArray(player.inventory)) {
                // If it's an array, make a shallow copy
                return [...player.inventory];
            } else if (player.inventory instanceof Map) {
                // If it's a Map, convert to array of entries
                return Array.from(player.inventory.entries());
            } else if (player.inventory instanceof Set) {
                // If it's a Set, convert to array
                return Array.from(player.inventory);
            } else if (typeof player.inventory === 'object') {
                // If it's a plain object, make a shallow copy
                return {...player.inventory};
            }

            // Fallback to empty array
            return [];
        } catch (error) {
            // Safely handle any errors
            // Silent fail with empty array
            return [];
        }
    }

    /**
     * Restores inventory to player
     * @param {Object} player - Player object
     * @param {Array|Object} inventory - Inventory data
     * @private
     */
    restoreInventory(player, inventory) {
        if (!player) return;

        try {
            // If player has no inventory property, create one
            if (!player.inventory) {
                player.inventory = [];
            }

            // Handle different inventory types
            if (Array.isArray(player.inventory)) {
                // If player inventory is an array
                if (Array.isArray(inventory)) {
                    player.inventory = [...inventory];
                } else if (typeof inventory === 'object') {
                    // Convert object to array if needed
                    player.inventory = Object.values(inventory);
                }
            } else if (player.inventory instanceof Map) {
                // If player inventory is a Map
                player.inventory.clear();
                if (Array.isArray(inventory)) {
                    // Assume array of key-value pairs
                    for (const [key, value] of inventory) {
                        player.inventory.set(key, value);
                    }
                } else if (typeof inventory === 'object') {
                    // Convert object to Map entries
                    for (const [key, value] of Object.entries(inventory)) {
                        player.inventory.set(key, value);
                    }
                }
            } else if (player.inventory instanceof Set) {
                // If player inventory is a Set
                player.inventory.clear();
                if (Array.isArray(inventory)) {
                    for (const item of inventory) {
                        player.inventory.add(item);
                    }
                }
            } else if (typeof player.inventory === 'object') {
                // If player inventory is a plain object
                // Clear existing properties
                for (const key in player.inventory) {
                    delete player.inventory[key];
                }

                // Copy new properties
                if (typeof inventory === 'object') {
                    Object.assign(player.inventory, inventory);
                } else if (Array.isArray(inventory)) {
                    // Convert array to object with numeric keys
                    inventory.forEach((item, index) => {
                        player.inventory[index] = item;
                    });
                }
            }
        } catch (error) {
            // Silent fail - inventory restoration is non-critical
        }
    }

    /**
     * Clears the snapshot
     */
    clearSnapshot() {
        this.snapshot = null;
    }
}
