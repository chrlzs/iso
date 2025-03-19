/**
 * Manages the game camera and view transformations
 * @class Camera
 */
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;
        this.panSpeed = 500; // pixels per second
        this.zoomSpeed = 0.1;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    /**
     * Updates camera position based on input
     * @param {number} deltaTime - Time elapsed since last update in seconds
     * @param {InputManager} inputManager - Reference to input manager
     */
    update(deltaTime, inputManager) {
        const dt = deltaTime / 1000; // Convert to seconds

        // Handle keyboard pan
        if (inputManager.isKeyPressed('ArrowLeft') || inputManager.isKeyPressed('a')) {
            this.x -= this.panSpeed * dt;
        }
        if (inputManager.isKeyPressed('ArrowRight') || inputManager.isKeyPressed('d')) {
            this.x += this.panSpeed * dt;
        }
        if (inputManager.isKeyPressed('ArrowUp') || inputManager.isKeyPressed('w')) {
            this.y -= this.panSpeed * dt;
        }
        if (inputManager.isKeyPressed('ArrowDown') || inputManager.isKeyPressed('s')) {
            this.y += this.panSpeed * dt;
        }

        // Handle mouse drag
        if (inputManager.isMouseButtonDown('middle') || 
            (inputManager.isMouseButtonDown('left') && inputManager.isKeyPressed('Control'))) {
            if (!this.isDragging) {
                this.isDragging = true;
                this.lastMouseX = inputManager.mouseX;
                this.lastMouseY = inputManager.mouseY;
            } else {
                const dx = inputManager.mouseX - this.lastMouseX;
                const dy = inputManager.mouseY - this.lastMouseY;
                this.x -= dx;
                this.y -= dy;
                this.lastMouseX = inputManager.mouseX;
                this.lastMouseY = inputManager.mouseY;
            }
        } else {
            this.isDragging = false;
        }

        // Handle zoom
        const zoomDelta = inputManager.getWheelDelta();
        if (zoomDelta !== 0) {
            this.zoom = Math.max(this.minZoom, 
                Math.min(this.maxZoom, 
                    this.zoom + (zoomDelta > 0 ? -this.zoomSpeed : this.zoomSpeed)
                )
            );
        }
    }

    /**
     * Gets the current view transformation matrix
     * @returns {Object} Transform object with scale and offset
     */
    getTransform() {
        return {
            scale: this.zoom,
            offsetX: -this.x,
            offsetY: -this.y
        };
    }
}

