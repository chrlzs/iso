import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Construction UI overlay for buildings
 * This is a UI element that displays construction progress
 */
export class ConstructionUIOverlay {
    /**
     * Creates a new construction UI overlay
     * @param {Object} options - Overlay options
     */
    constructor(options = {}) {
        this.buildingType = options.buildingType || 'house';
        this.buildProgress = options.buildProgress || 0;
        this.buildTime = options.buildTime || 30; // 30 seconds to complete
        this.game = options.game;
        this.building = options.building;
        this.gridX = options.gridX || 0;
        this.gridY = options.gridY || 0;
        
        // Create the container
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.container.zIndex = 1000; // Very high zIndex to ensure it's on top
        
        // Create the overlay graphics
        this.createOverlayGraphics();
        
        // Add to the game's UI container
        if (this.game && this.game.ui && this.game.ui.container) {
            this.game.ui.container.addChild(this.container);
            console.log('Added construction UI overlay to game UI container');
        } else {
            console.error('Could not add construction UI overlay to game UI container');
        }
        
        // Start the update interval
        this.startUpdateInterval();
        
        console.log(`Construction UI overlay created for ${this.buildingType} at (${this.gridX}, ${this.gridY})`);
    }
    
    /**
     * Creates the overlay graphics
     * @private
     */
    createOverlayGraphics() {
        console.log('Creating construction UI overlay graphics');
        
        // Create a new graphics object
        const graphics = new PIXI.Graphics();
        
        // Create a semi-transparent background
        graphics.beginFill(0x000000, 0.7);
        graphics.drawRect(0, 0, 300, 100);
        graphics.endFill();
        
        // Position in the top-right corner
        graphics.position.set(this.game.app.renderer.width - 320, 20);
        
        // Add a title
        const title = new PIXI.Text(`BUILDING ${this.buildingType.toUpperCase()}`, {
            fontFamily: 'Arial',
            fontSize: 18,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center'
        });
        title.position.set(150, 15);
        title.anchor.set(0.5, 0);
        graphics.addChild(title);
        
        // Add coordinates
        const coords = new PIXI.Text(`at (${this.gridX}, ${this.gridY})`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xCCCCCC,
            align: 'center'
        });
        coords.position.set(150, 40);
        coords.anchor.set(0.5, 0);
        graphics.addChild(coords);
        
        // Add progress bar background
        graphics.beginFill(0x333333);
        graphics.drawRect(20, 65, 260, 20);
        graphics.endFill();
        
        // Add progress bar
        this.progressBar = new PIXI.Graphics();
        this.updateProgressBar();
        graphics.addChild(this.progressBar);
        
        // Add progress text
        this.progressText = new PIXI.Text(`${Math.floor(this.buildProgress * 100)}%`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.progressText.position.set(150, 75);
        this.progressText.anchor.set(0.5, 0.5);
        graphics.addChild(this.progressText);
        
        // Add the graphics to the container
        this.container.addChild(graphics);
        this.graphics = graphics;
        
        console.log('Construction UI overlay graphics created');
    }
    
    /**
     * Updates the progress bar
     * @private
     */
    updateProgressBar() {
        this.progressBar.clear();
        
        // Use different colors based on progress
        let color;
        if (this.buildProgress < 0.3) {
            color = 0xFF0000; // Red for early progress
        } else if (this.buildProgress < 0.6) {
            color = 0xFFFF00; // Yellow for mid progress
        } else {
            color = 0x00FF00; // Green for late progress
        }
        
        this.progressBar.beginFill(color);
        this.progressBar.drawRect(20, 65, 260 * this.buildProgress, 20);
        this.progressBar.endFill();
    }
    
    /**
     * Starts the update interval
     * @private
     */
    startUpdateInterval() {
        this.updateInterval = setInterval(() => {
            this.update(0.1);
        }, 100);
    }
    
    /**
     * Updates the construction overlay
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update construction progress
        if (this.buildProgress < 1) {
            // VERY slow construction for better visualization - 30 seconds to complete
            const progressRate = deltaTime / this.buildTime;
            this.buildProgress = Math.min(1, this.buildProgress + progressRate);
            
            // Update the progress bar
            this.updateProgressBar();
            
            // Update the progress text
            if (this.progressText) {
                const progressPercent = Math.floor(this.buildProgress * 100);
                this.progressText.text = `${progressPercent}%`;
                
                // Make the text pulse
                const scale = 1.0 + 0.2 * Math.sin(Date.now() / 200);
                this.progressText.scale.set(scale, scale);
            }
            
            // Log progress at 10% intervals
            const progressPercent = Math.floor(this.buildProgress * 100);
            if (progressPercent % 10 === 0 && progressPercent > 0) {
                const lastProgressKey = `lastLoggedProgress_UI_${this.gridX}_${this.gridY}`;
                const lastProgress = window[lastProgressKey] || 0;
                
                if (progressPercent > lastProgress) {
                    console.log(`Building UI progress: ${progressPercent}%`);
                    window[lastProgressKey] = progressPercent;
                }
            }
            
            // Check if construction is complete
            if (this.buildProgress >= 1) {
                console.log(`Construction UI of ${this.buildingType} at (${this.gridX}, ${this.gridY}) completed`);
                
                // Update the building if it exists
                if (this.building) {
                    this.building.isUnderConstruction = false;
                    this.building.isBuilt = true;
                    this.building.buildProgress = 1;
                }
                
                // Show completion message
                this.showCompletionMessage();
                
                // Remove the overlay after a delay
                setTimeout(() => {
                    this.dispose();
                }, 3000);
                
                // Clear the update interval
                clearInterval(this.updateInterval);
            }
        }
    }
    
    /**
     * Shows a completion message
     * @private
     */
    showCompletionMessage() {
        try {
            console.log('Showing construction completion message');
            
            // Create a completion message
            const message = new PIXI.Container();
            message.position.set(this.game.app.renderer.width / 2, this.game.app.renderer.height / 2);
            
            // Add a background
            const background = new PIXI.Graphics();
            background.beginFill(0x000000, 0.8);
            background.drawRect(-200, -100, 400, 200);
            background.endFill();
            message.addChild(background);
            
            // Add a title
            const title = new PIXI.Text('CONSTRUCTION COMPLETE!', {
                fontFamily: 'Arial',
                fontSize: 24,
                fontWeight: 'bold',
                fill: 0x00FF00,
                align: 'center'
            });
            title.position.set(0, -50);
            title.anchor.set(0.5, 0.5);
            message.addChild(title);
            
            // Add building info
            const info = new PIXI.Text(`${this.buildingType.toUpperCase()} at (${this.gridX}, ${this.gridY})`, {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'center'
            });
            info.position.set(0, 0);
            info.anchor.set(0.5, 0.5);
            message.addChild(info);
            
            // Add a close button
            const closeButton = new PIXI.Graphics();
            closeButton.beginFill(0x333333);
            closeButton.drawRect(-75, 30, 150, 40);
            closeButton.endFill();
            closeButton.interactive = true;
            closeButton.cursor = 'pointer';
            closeButton.on('pointerdown', () => {
                this.game.ui.container.removeChild(message);
            });
            message.addChild(closeButton);
            
            // Add button text
            const buttonText = new PIXI.Text('CLOSE', {
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xFFFFFF,
                align: 'center'
            });
            buttonText.position.set(0, 50);
            buttonText.anchor.set(0.5, 0.5);
            message.addChild(buttonText);
            
            // Add to UI container
            this.game.ui.container.addChild(message);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (message.parent) {
                    message.parent.removeChild(message);
                }
            }, 5000);
        } catch (error) {
            console.error('Error showing completion message:', error);
        }
    }
    
    /**
     * Disposes of the overlay
     */
    dispose() {
        // Clear the update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Remove from UI container
        if (this.container && this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        
        console.log(`Construction UI overlay for ${this.buildingType} at (${this.gridX}, ${this.gridY}) disposed`);
    }
}
