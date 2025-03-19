
/**
 * Manages the game camera and view transformations
 * @class Camera
 */
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.target = null;
        this.followSpeed = 0.1; // Adjust this to change how quickly camera follows target
    }

    follow(target) {
        this.target = target;
    }

    /**
     * Updates camera position based on input
     * @param {number} deltaTime - Time elapsed since last update in seconds
     * @param {InputManager} inputManager - Reference to input manager
     */
    update(deltaTime, inputManager) {
        // Follow target if one is set
        if (this.target) {
            const targetPos = this.target.getPosition();
            this.x += (targetPos.x - this.x) * this.followSpeed;
            this.y += (targetPos.y - this.y) * this.followSpeed;
        }

        // Handle zoom input
        if (inputManager.isKeyPressed('Equal')) { // Plus key
            this.scale = Math.min(this.scale * 1.01, 2.0);
        }
        if (inputManager.isKeyPressed('Minus')) {
            this.scale = Math.max(this.scale * 0.99, 0.5);
        }
    }

    /**
     * Gets the current view transformation matrix
     * @returns {Object} Transform object with scale and offset
     */
    getTransform() {
        return {
            scale: this.scale,
            offsetX: -this.x * this.scale,
            offsetY: -this.y * this.scale
        };
    }
}



