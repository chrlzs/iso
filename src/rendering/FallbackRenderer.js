/**
 * FallbackRenderer - A simple canvas-based renderer for when PIXI.js is not available
 * This provides a basic isometric grid rendering without requiring PIXI
 */
export class FallbackRenderer {
    /**
     * Creates a new fallback renderer
     * @param {Object} options - Renderer options
     * @param {HTMLElement} options.container - Container element
     * @param {number} options.width - Canvas width
     * @param {number} options.height - Canvas height
     * @param {number} options.tileWidth - Tile width
     * @param {number} options.tileHeight - Tile height
     * @param {number} options.gridWidth - Grid width
     * @param {number} options.gridHeight - Grid height
     */
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.tileWidth = options.tileWidth || 64;
        this.tileHeight = options.tileHeight || 32;
        this.gridWidth = options.gridWidth || 20;
        this.gridHeight = options.gridHeight || 20;
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        
        // Add canvas to container
        this.container.appendChild(this.canvas);
        
        // Camera position
        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = 1;
        
        // Grid data
        this.grid = [];
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initializes the renderer
     * @private
     */
    initialize() {
        console.log('FallbackRenderer: Initializing...');
        
        // Create grid
        this.createGrid();
        
        // Set initial camera position
        this.setCameraPosition(
            (this.gridWidth * this.tileWidth) / 2,
            (this.gridHeight * this.tileHeight) / 2
        );
        
        // Draw initial frame
        this.render();
        
        console.log('FallbackRenderer: Initialization complete.');
    }
    
    /**
     * Creates the grid
     * @private
     */
    createGrid() {
        console.log('FallbackRenderer: Creating grid...');
        
        // Initialize grid
        this.grid = new Array(this.gridWidth);
        
        for (let x = 0; x < this.gridWidth; x++) {
            this.grid[x] = new Array(this.gridHeight);
            
            for (let y = 0; y < this.gridHeight; y++) {
                // Choose a random terrain type
                const terrainTypes = ['grass', 'dirt', 'sand', 'water'];
                const terrainWeights = [0.7, 0.2, 0.05, 0.05];
                
                // Calculate weighted random index
                let random = Math.random();
                let index = 0;
                
                for (let i = 0; i < terrainWeights.length; i++) {
                    random -= terrainWeights[i];
                    if (random <= 0) {
                        index = i;
                        break;
                    }
                }
                
                const terrainType = terrainTypes[index];
                
                // Create tile data
                this.grid[x][y] = {
                    x,
                    y,
                    type: terrainType,
                    elevation: Math.floor(Math.random() * 3) * 8,
                    walkable: terrainType !== 'water'
                };
            }
        }
        
        console.log('FallbackRenderer: Grid created with', this.gridWidth * this.gridHeight, 'tiles.');
    }
    
    /**
     * Sets the camera position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setCameraPosition(x, y) {
        this.cameraX = x;
        this.cameraY = y;
        this.render();
    }
    
    /**
     * Sets the camera zoom
     * @param {number} zoom - Zoom level
     */
    setCameraZoom(zoom) {
        this.zoom = Math.max(0.1, Math.min(2, zoom));
        this.render();
    }
    
    /**
     * Converts grid coordinates to screen coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} Screen coordinates {x, y}
     */
    gridToScreen(gridX, gridY) {
        // Convert to isometric coordinates
        const isoX = (gridX - gridY) * this.tileWidth / 2;
        const isoY = (gridX + gridY) * this.tileHeight / 2;
        
        // Adjust for camera
        const screenX = isoX + this.width / 2 - this.cameraX;
        const screenY = isoY + this.height / 2 - this.cameraY;
        
        return { x: screenX, y: screenY };
    }
    
    /**
     * Renders the grid
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.drawTile(x, y);
            }
        }
        
        // Draw debug info
        this.drawDebugInfo();
    }
    
    /**
     * Draws a tile
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @private
     */
    drawTile(x, y) {
        const tile = this.grid[x][y];
        if (!tile) return;
        
        // Get screen position
        const { x: screenX, y: screenY } = this.gridToScreen(x, y);
        
        // Skip if off screen
        if (screenX < -this.tileWidth || screenX > this.width + this.tileWidth ||
            screenY < -this.tileHeight || screenY > this.height + this.tileHeight) {
            return;
        }
        
        // Get color based on terrain type
        let color;
        switch (tile.type) {
            case 'grass':
                color = '#44AA44';
                break;
            case 'dirt':
                color = '#8B4513';
                break;
            case 'sand':
                color = '#F0E68C';
                break;
            case 'water':
                color = '#4444AA';
                break;
            default:
                color = '#AAAAAA';
                break;
        }
        
        // Draw diamond shape
        this.ctx.save();
        this.ctx.translate(screenX, screenY - tile.elevation);
        
        // Fill
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.tileHeight / 2);
        this.ctx.lineTo(this.tileWidth / 2, 0);
        this.ctx.lineTo(0, this.tileHeight / 2);
        this.ctx.lineTo(-this.tileWidth / 2, 0);
        this.ctx.closePath();
        
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Stroke
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * Draws debug information
     * @private
     */
    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Camera: (${Math.round(this.cameraX)}, ${Math.round(this.cameraY)})`, 10, 20);
        this.ctx.fillText(`Zoom: ${this.zoom.toFixed(2)}`, 10, 40);
        this.ctx.fillText(`Grid: ${this.gridWidth}x${this.gridHeight}`, 10, 60);
        this.ctx.fillText(`Tile Size: ${this.tileWidth}x${this.tileHeight}`, 10, 80);
        this.ctx.fillText('Fallback Renderer Active', 10, 100);
    }
    
    /**
     * Handles keyboard input for camera movement
     * @param {Set} keys - Set of pressed keys
     */
    handleInput(keys) {
        const cameraSpeed = 10;
        
        // Move camera with WASD
        if (keys.has('w')) {
            this.setCameraPosition(this.cameraX, this.cameraY - cameraSpeed);
        }
        if (keys.has('s')) {
            this.setCameraPosition(this.cameraX, this.cameraY + cameraSpeed);
        }
        if (keys.has('a')) {
            this.setCameraPosition(this.cameraX - cameraSpeed, this.cameraY);
        }
        if (keys.has('d')) {
            this.setCameraPosition(this.cameraX + cameraSpeed, this.cameraY);
        }
        
        // Zoom with QE
        if (keys.has('q')) {
            this.setCameraZoom(this.zoom - 0.1);
        }
        if (keys.has('e')) {
            this.setCameraZoom(this.zoom + 0.1);
        }
    }
    
    /**
     * Resizes the renderer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.render();
    }
    
    /**
     * Destroys the renderer
     */
    destroy() {
        // Remove canvas from container
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
