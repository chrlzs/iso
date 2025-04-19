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
        
        // Create overlay container
        this.container = document.createElement('div');
        this.container.id = 'debug-overlay';
        this.container.style.position = 'fixed';
        this.container.style.top = '10px';
        this.container.style.left = '10px';
        this.container.style.zIndex = '1000';
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.color = '#fff';
        this.container.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        this.container.style.borderRadius = '5px';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '14px';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
        
        // Create toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.textContent = 'Debug';
        this.toggleButton.style.position = 'fixed';
        this.toggleButton.style.top = '10px';
        this.toggleButton.style.right = '10px';
        this.toggleButton.style.zIndex = '1000';
        this.toggleButton.style.padding = '5px 10px';
        this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.toggleButton.style.color = '#fff';
        this.toggleButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        this.toggleButton.style.borderRadius = '5px';
        this.toggleButton.style.cursor = 'pointer';
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
        this.container.style.display = this.enabled ? 'block' : 'none';
        this.toggleButton.style.backgroundColor = this.enabled ? 'rgba(0, 128, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
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
        
        // Update display
        this.update();
    }
    
    /**
     * Updates the debug overlay
     */
    update() {
        if (!this.enabled) return;
        
        // Update container content
        let html = `
            <div>Mouse: (${this.mousePosition.x.toFixed(0)}, ${this.mousePosition.y.toFixed(0)})</div>
            <div>Grid: (${this.gridPosition.x}, ${this.gridPosition.y})</div>
        `;
        
        // Add player info if available
        if (this.game.player) {
            html += `
                <div>Player Grid: (${this.game.player.gridX}, ${this.game.player.gridY})</div>
                <div>Player World: (${this.game.player.x.toFixed(2)}, ${this.game.player.y.toFixed(2)})</div>
            `;
        }
        
        // Add tile info if available
        if (this.tileInfo) {
            html += `
                <div>Tile Type: ${this.tileInfo.type}</div>
                <div>Tile Walkable: ${this.tileInfo.walkable}</div>
                <div>Tile World: (${this.tileInfo.worldX.toFixed(2)}, ${this.tileInfo.worldY.toFixed(2)})</div>
            `;
        }
        
        // Add camera info if available
        if (this.world && this.world.camera) {
            html += `
                <div>Camera: (${this.world.camera.x.toFixed(2)}, ${this.world.camera.y.toFixed(2)})</div>
                <div>Camera Zoom: ${this.world.camera.zoom.toFixed(2)}</div>
            `;
        }
        
        this.container.innerHTML = html;
    }
}
