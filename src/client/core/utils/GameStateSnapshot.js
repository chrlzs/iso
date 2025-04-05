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
                    inventory: gameInstance.player.inventory ? [...gameInstance.player.inventory] : []
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
            if (gameInstance.logger) {
                gameInstance.logger.error('Error taking game state snapshot:', error);
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
                if (this.snapshot.player.inventory && gameInstance.player.inventory) {
                    gameInstance.player.inventory = [...this.snapshot.player.inventory];
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
            if (gameInstance.logger) {
                gameInstance.logger.error('Error restoring game state snapshot:', error);
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
     * Clears the snapshot
     */
    clearSnapshot() {
        this.snapshot = null;
    }
}
