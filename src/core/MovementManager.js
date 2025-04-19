/**
 * MovementManager - Handles all movement-related logic and coordinate transformations
 * Simplified implementation with direct movement
 */
export class MovementManager {
    constructor(game) {
        this.game = game;
        this.world = game.world;

        // Use the game's debug setting
        this.debug = () => this.game.options.debug;
    }

    /**
     * Moves the player to a specific tile using a simplified direct approach
     * @param {IsometricTile} targetTile - The tile to move to
     * @returns {boolean} True if movement was started, false if invalid
     */
    movePlayerToTile(targetTile) {
        const player = this.game.player;

        if (!player || !targetTile || !this.world) {
            console.warn('Cannot move player: missing required references');
            return false;
        }

        // Log the movement request
        if (this.debug()) {
            console.log(`Movement request: Player at (${player.gridX}, ${player.gridY}) to tile (${targetTile.gridX}, ${targetTile.gridY})`);
        }

        // Basic validation checks
        if (!this.isValidMoveTarget(targetTile)) {
            return false;
        }

        // Get current tile for comparison
        const currentTile = this.world.getTile(player.gridX, player.gridY);
        if (currentTile === targetTile) {
            console.log(`Player is already on tile (${targetTile.gridX}, ${targetTile.gridY})`);
            return false;
        }

        // Get world position of the target tile
        const worldTarget = targetTile.getCenter();
        if (!this.isValidWorldPosition(worldTarget)) {
            return false;
        }

        // Update tile highlighting
        this.updateDestinationHighlight(targetTile);

        // SIMPLIFIED APPROACH: Direct movement to target tile
        // Instead of complex pathfinding, we'll move directly to the target
        this.movePlayerDirectlyToTile(player, targetTile, worldTarget);

        // Update camera to follow player
        this.world.setCameraTarget(player);

        return true;
    }

    /**
     * Moves the player directly to a target tile without pathfinding
     * @param {Character} player - The player character
     * @param {IsometricTile} targetTile - The target tile
     * @param {Object} worldTarget - The world position of the target
     * @private
     */
    movePlayerDirectlyToTile(player, targetTile, worldTarget) {
        // Set the target grid position
        const targetGridX = targetTile.gridX;
        const targetGridY = targetTile.gridY;

        if (this.debug()) {
            console.log(`Moving player directly to tile (${targetGridX}, ${targetGridY})`);
            console.log(`World target: (${worldTarget.x}, ${worldTarget.y})`);
        }

        // Set the player's move target with the simplified approach
        player.setMoveTarget(worldTarget, {
            targetGridX: targetGridX,
            targetGridY: targetGridY,
            // Flag to use direct movement instead of pathfinding
            useDirectMovement: true
        });
    }

    /**
     * Checks if a tile is a valid move target
     * @param {IsometricTile} tile - The tile to check
     * @returns {boolean} True if the tile is a valid move target
     */
    isValidMoveTarget(tile) {
        // Check walkability
        if (!tile.walkable || tile.structure) {
            console.log(`Cannot move to tile (${tile.gridX}, ${tile.gridY}): not walkable or has structure`);
            return false;
        }

        // Check boundaries - more lenient for chunk-based worlds
        const maxDistance = 1000; // Allow coordinates up to 1000 tiles away from origin
        if (tile.gridY < -maxDistance || tile.gridX < -maxDistance ||
            tile.gridX >= this.game.options.worldWidth + maxDistance ||
            tile.gridY >= this.game.options.worldHeight + maxDistance) {
            console.log(`Cannot move to tile (${tile.gridX}, ${tile.gridY}): far outside valid world bounds`);
            return false;
        }

        return true;
    }

    /**
     * Checks if a world position is valid
     * @param {Object} position - The world position {x, y}
     * @returns {boolean} True if the position is valid
     */
    isValidWorldPosition(position) {
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' ||
            isNaN(position.x) || isNaN(position.y)) {
            console.error(`Invalid world position: (${position?.x}, ${position?.y})`);
            return false;
        }
        return true;
    }

    /**
     * Updates destination tile highlighting
     * @param {IsometricTile} newDestination - The new destination tile
     */
    updateDestinationHighlight(newDestination) {
        // Clear old highlight
        if (this.game.destinationTile && this.game.destinationTile !== newDestination) {
            try {
                this.game.destinationTile.unhighlight();
            } catch (error) {
                console.error('Error unhighlighting previous destination:', error);
            }
        }

        // Set new highlight
        try {
            newDestination.highlight(0x00FFFF, 0.5);
            this.game.destinationTile = newDestination;
        } catch (error) {
            console.error('Error highlighting new destination:', error);
        }

        // Set up auto-clear of highlight when destination is reached
        if (this.game.destinationCheckInterval) {
            clearInterval(this.game.destinationCheckInterval);
        }

        this.game.destinationCheckInterval = setInterval(() => {
            if (!this.game.player.isMoving && this.game.destinationTile) {
                this.game.destinationTile.unhighlight();
                this.game.destinationTile = null;
                clearInterval(this.game.destinationCheckInterval);
                this.game.destinationCheckInterval = null;
            }
        }, 100);
    }
}