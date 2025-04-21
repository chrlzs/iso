/**
 * Debug overlay for displaying mouse and grid coordinates
 */
export class DebugOverlay {
    /**
     * Creates a new debug overlay
     * @param {Game} game - The game instance
     */
    constructor(game) {
        this.game = game;
        this.world = game.world;
        this.enabled = false;
        this.mousePosition = { x: 0, y: 0 };
        this.gridPosition = { x: 0, y: 0 };
        this.tileInfo = null;

        // Create overlay container with cyberpunk styling
        this.container = document.createElement('div');
        this.container.id = 'debug-overlay';
        this.container.style.position = 'fixed';
        this.container.style.top = '60px'; // Position at top right, below FPS counter
        this.container.style.right = '10px'; // Position on the right side
        this.container.style.zIndex = '1000';
        this.container.style.padding = '15px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.color = '#00FFFF';
        this.container.style.border = '2px solid #00FFFF';
        this.container.style.borderRadius = '5px';
        this.container.style.fontFamily = 'Arial';
        this.container.style.fontSize = '14px';
        this.container.style.maxHeight = '300px';
        this.container.style.overflowY = 'auto';
        this.container.style.display = 'none';
        this.container.style.maxWidth = '250px';
        this.container.style.width = '100%';
        document.body.appendChild(this.container);

        // Create toggle button - positioned next to Q and B buttons
        this.toggleButton = document.createElement('button');
        this.toggleButton.textContent = 'D';
        this.toggleButton.style.position = 'fixed';
        this.toggleButton.style.bottom = '10px';
        this.toggleButton.style.left = '160px';
        this.toggleButton.style.zIndex = '1000';
        this.toggleButton.style.width = '40px';
        this.toggleButton.style.height = '30px';
        this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.toggleButton.style.color = '#00FFFF';
        this.toggleButton.style.border = '2px solid #00FFFF';
        this.toggleButton.style.borderRadius = '5px';
        this.toggleButton.style.cursor = 'pointer';
        this.toggleButton.style.fontSize = '16px';
        this.toggleButton.style.display = 'flex';
        this.toggleButton.style.justifyContent = 'center';
        this.toggleButton.style.alignItems = 'center';
        this.toggleButton.style.padding = '0';
        document.body.appendChild(this.toggleButton);

        // Add event listeners
        this.toggleButton.addEventListener('click', () => this.toggle());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Initialize
        this.update();
    }

    /**
     * Toggles the debug overlay
     */
    toggle() {
        this.enabled = !this.enabled;

        if (this.enabled) {
            // Show loading message first
            this.container.style.display = 'block';
            this.container.innerHTML = `
                <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #00FFFF; text-align: center; padding-bottom: 5px; font-size: 16px;">Debug Info</div>
                <div style="text-align: center; margin: 20px 0;">
                    <div style="color: white; margin-bottom: 10px;">Loading debug information...</div>
                    <div class="loading-spinner" style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0, 255, 255, 0.3); border-radius: 50%; border-top-color: #00FFFF; animation: spin 1s linear infinite;"></div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;

            // Update after a short delay to allow UI to refresh
            setTimeout(() => {
                this.update();
            }, 100);
        } else {
            // Hide the container
            this.container.style.display = 'none';
        }

        this.toggleButton.style.backgroundColor = this.enabled ? 'rgba(0, 128, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        // Keep the same text
        this.toggleButton.textContent = 'D';
    }

    /**
     * Handles mouse movement
     * @param {MouseEvent} event - The mouse event
     */
    onMouseMove(event) {
        if (!this.enabled) return;

        // Get mouse position
        const rect = this.game.app.view.getBoundingClientRect();
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;

        // Convert to grid coordinates
        if (this.world) {
            const gridPos = this.world.screenToGrid(this.mousePosition.x, this.mousePosition.y);
            this.gridPosition.x = Math.floor(gridPos.x);
            this.gridPosition.y = Math.floor(gridPos.y);

            // Get tile info
            const tile = this.world.getTile(this.gridPosition.x, this.gridPosition.y);
            this.tileInfo = tile ? {
                type: tile.type,
                walkable: tile.walkable,
                worldX: tile.x,
                worldY: tile.y
            } : null;
        }

        // Update display with content only (no loading indicator)
        this.updateContent();
    }

    /**
     * Updates the debug overlay
     */
    update() {
        if (!this.enabled) return;

        // Show loading indicator first if this is a full update
        if (arguments.length === 0) {
            this.container.innerHTML = `
                <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #00FFFF; text-align: center; padding-bottom: 5px; font-size: 16px;">Debug Info</div>
                <div style="text-align: center; margin: 20px 0;">
                    <div style="color: white; margin-bottom: 10px;">Loading debug information...</div>
                    <div class="loading-spinner" style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0, 255, 255, 0.3); border-radius: 50%; border-top-color: #00FFFF; animation: spin 1s linear infinite;"></div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;

            // Update with actual content after a short delay
            setTimeout(() => this.updateContent(), 200);
            return;
        }

        this.updateContent();
    }

    /**
     * Updates the debug overlay content
     * @private
     */
    updateContent() {
        if (!this.enabled) return;

        // Update container content with cyberpunk styling
        let html = `
            <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #00FFFF; text-align: center; padding-bottom: 5px; font-size: 16px;">Debug Info</div>
            <div style="margin-bottom: 5px;">Mouse: <span style="color: white;">(${this.mousePosition.x.toFixed(0)}, ${this.mousePosition.y.toFixed(0)})</span></div>
            <div style="margin-bottom: 5px;">Grid: <span style="color: white;">(${this.gridPosition.x}, ${this.gridPosition.y})</span></div>
        `;

        // Add player info if available
        if (this.game.player) {
            html += `
                <div style="margin-bottom: 5px;">Player Grid: <span style="color: white;">(${this.game.player.gridX}, ${this.game.player.gridY})</span></div>
                <div style="margin-bottom: 5px;">Player World: <span style="color: white;">(${this.game.player.x.toFixed(2)}, ${this.game.player.y.toFixed(2)})</span></div>
            `;
        }

        // Add tile info if available
        if (this.tileInfo) {
            html += `
                <div style="margin-bottom: 5px;">Tile Type: <span style="color: white;">${this.tileInfo.type}</span></div>
                <div style="margin-bottom: 5px;">Tile Walkable: <span style="color: white;">${this.tileInfo.walkable}</span></div>
                <div style="margin-bottom: 5px;">Tile World: <span style="color: white;">(${this.tileInfo.worldX.toFixed(2)}, ${this.tileInfo.worldY.toFixed(2)})</span></div>
            `;
        }

        // Add camera info if available
        if (this.world && this.world.camera) {
            html += `
                <div style="margin-bottom: 5px;">Camera: <span style="color: white;">(${this.world.camera.x.toFixed(2)}, ${this.world.camera.y.toFixed(2)})</span></div>
                <div style="margin-bottom: 5px;">Camera Zoom: <span style="color: white;">${this.world.camera.zoom.toFixed(2)}</span></div>
            `;
        }

        // Add timestamp to show when the debug info was last updated
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        html += `
            <div style="margin-top: 15px; font-size: 11px; color: #888; text-align: right;">Updated: ${timeString}</div>
        `;

        this.container.innerHTML = html;
    }
}
