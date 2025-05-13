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

        // Movement physics parameters
        this.acceleration = 0.5;  // Units per second squared
        this.maxSpeed = 5;       // Maximum units per second
        this.deceleration = 0.8; // Multiplier for slowing down
        this.arrivalThreshold = 5; // Distance at which to start decelerating
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
     * Moves the player directly to a target tile with physics and smooth interpolation
     * @param {Character} player - The player character
     * @param {IsometricTile} targetTile - The target tile
     * @param {Object} worldTarget - The world position of the target
     * @private
     */
    movePlayerDirectlyToTile(player, targetTile, worldTarget) {
        const targetGridX = targetTile.gridX;
        const targetGridY = targetTile.gridY;

        if (this.debug()) {
            console.log(`Moving player to tile (${targetGridX}, ${targetGridY})`);
            console.log(`World target: (${worldTarget.x}, ${worldTarget.y})`);
        }

        // Initialize velocity if not exists
        if (!player.velocity) {
            player.velocity = { x: 0, y: 0 };
        }

        // Set the player's move target with physics parameters
        player.setMoveTarget(worldTarget, {
            targetGridX,
            targetGridY,
            usePhysics: true,
            acceleration: this.acceleration,
            maxSpeed: this.maxSpeed,
            deceleration: this.deceleration,
            arrivalThreshold: this.arrivalThreshold
        });
    }

    /**
     * Checks if a tile is a valid move target
     * @param {IsometricTile} tile - The tile to check
     * @returns {boolean} True if the tile is a valid move target
     */
    isValidMoveTarget(tile) {
        // Only check walkability - allow movement to any walkable tile in loaded chunks
        if (!tile.walkable || tile.structure) {
            console.log(`Cannot move to tile (${tile.gridX}, ${tile.gridY}): not walkable or has structure`);
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

    /**
     * Updates the player's position and velocity based on movement physics
     * @param {number} deltaTime - The time elapsed since the last update
     */
    update(deltaTime) {
        const player = this.game.player;
        if (!player || !player.isMoving) return;

        const target = player.moveTarget;
        if (!target) return;

        // Calculate distance to target
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Apply acceleration
        if (distance > this.arrivalThreshold) {
            player.velocity.x += dirX * this.acceleration * deltaTime;
            player.velocity.y += dirY * this.acceleration * deltaTime;
        } else {
            // Apply deceleration when near target
            player.velocity.x *= this.deceleration;
            player.velocity.y *= this.deceleration;
        }

        // Clamp velocity to max speed
        const currentSpeed = Math.sqrt(player.velocity.x * player.velocity.x + player.velocity.y * player.velocity.y);
        if (currentSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / currentSpeed;
            player.velocity.x *= scale;
            player.velocity.y *= scale;
        }

        // Update position
        player.x += player.velocity.x;
        player.y += player.velocity.y;

        // Check if we've arrived
        if (distance < 1) {
            player.x = target.x;
            player.y = target.y;
            player.velocity.x = 0;
            player.velocity.y = 0;
            player.isMoving = false;
            player.moveTarget = null;
        }

        // Update grid position
        const gridPos = this.world.worldToGrid(player.x, player.y);
        player.gridX = Math.round(gridPos.x);
        player.gridY = Math.round(gridPos.y);
    }
}