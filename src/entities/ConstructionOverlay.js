import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Construction overlay for buildings
 * This is a separate entity that displays construction progress
 */
export class ConstructionOverlay extends PIXI.Container {
    /**
     * Creates a new construction overlay
     * @param {Object} options - Overlay options
     */
    constructor(options = {}) {
        super();

        this.gridX = options.gridX || 0;
        this.gridY = options.gridY || 0;
        this.buildingType = options.buildingType || 'house';
        this.buildProgress = options.buildProgress || 0;
        this.buildTime = options.buildTime || 30; // 30 seconds to complete
        this.world = options.world;
        this.building = options.building;

        // Create the overlay graphics
        this.createOverlayGraphics();

        // Set position
        if (this.world) {
            const worldPos = this.world.gridToWorld(this.gridX, this.gridY);
            this.position.set(worldPos.x, worldPos.y - 60); // Offset Y to make it more visible
        }

        // Ensure the overlay is visible
        this.visible = true;
        this.alpha = 1.0;

        // Set a high zIndex to ensure it's above other elements
        this.zIndex = 200;

    }

    /**
     * Creates the overlay graphics
     * @private
     */
    createOverlayGraphics() {

        // Create a new graphics object
        const graphics = new PIXI.Graphics();

        // Construction scaffolding - much thicker and more visible
        graphics.lineStyle(8, 0x95a5a6, 1);
        graphics.moveTo(-110, -210);
        graphics.lineTo(-110, 10);
        graphics.moveTo(110, -210);
        graphics.lineTo(110, 10);
        graphics.moveTo(-110, -70);
        graphics.lineTo(110, -70);
        graphics.moveTo(-110, -140);
        graphics.lineTo(110, -140);

        // Construction outline - much thicker and more visible
        graphics.lineStyle(10, 0xFF0000, 1);
        graphics.drawRect(-120, -220, 240, 240);

        // Add construction progress bar background - much larger
        graphics.lineStyle(3, 0x000000, 1);
        graphics.beginFill(0x95a5a6);
        graphics.drawRect(-100, 30, 200, 20);
        graphics.endFill();

        // Create a separate graphics object for the progress bar so we can update it
        this.progressBar = new PIXI.Graphics();
        this.progressBar.beginFill(0xFF0000);
        this.progressBar.drawRect(-100, 30, 200 * this.buildProgress, 20);
        this.progressBar.endFill();
        graphics.addChild(this.progressBar);

        // Add construction text - much larger and more visible
        this.constructionText = new PIXI.Text('UNDER CONSTRUCTION', {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xFF0000,
            stroke: 0xFFFFFF,
            strokeThickness: 5,
            align: 'center'
        });
        this.constructionText.anchor.set(0.5, 0.5);
        this.constructionText.position.set(0, -170);
        graphics.addChild(this.constructionText);

        // Add progress percentage text
        this.progressText = new PIXI.Text(`${Math.floor(this.buildProgress * 100)}%`, {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4,
            align: 'center'
        });
        this.progressText.anchor.set(0.5, 0.5);
        this.progressText.position.set(0, 40);
        graphics.addChild(this.progressText);

        // Add construction crane
        graphics.lineStyle(6, 0xFFFF00, 1);
        graphics.moveTo(120, -220);
        graphics.lineTo(120, 0);
        graphics.moveTo(120, -220);
        graphics.lineTo(0, -220);
        graphics.moveTo(0, -220);
        graphics.lineTo(0, -180);

        // Add crane hook as a separate graphics object so we can animate it
        const craneHook = new PIXI.Graphics();
        craneHook.name = 'craneHook'; // Name it so we can find it later
        craneHook.lineStyle(3, 0x000000, 1);
        craneHook.moveTo(0, -180);
        craneHook.lineTo(0, -150);
        craneHook.drawCircle(0, -140, 10);
        graphics.addChild(craneHook);

        // Add the graphics to the container
        this.addChild(graphics);
        this.graphics = graphics;
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
            if (this.progressBar) {
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
                this.progressBar.drawRect(-100, 30, 200 * this.buildProgress, 20);
                this.progressBar.endFill();
            }

            // Update the progress text
            if (this.progressText) {
                const progressPercent = Math.floor(this.buildProgress * 100);
                this.progressText.text = `${progressPercent}%`;

                // Make the text pulse
                const scale = 1.0 + 0.2 * Math.sin(Date.now() / 200);
                this.progressText.scale.set(scale, scale);
            }

            // Update the construction text
            if (this.constructionText) {
                // Make the text pulse with a different frequency
                const scale = 1.0 + 0.1 * Math.sin(Date.now() / 300);
                this.constructionText.scale.set(scale, scale);
            }

            // Animate the crane hook
            if (this.graphics) {
                // Move the crane hook up and down
                const hookY = -140 + 20 * Math.sin(Date.now() / 500);

                // Find and update the hook
                for (let i = 0; i < this.graphics.children.length; i++) {
                    const child = this.graphics.children[i];
                    if (child.name === 'craneHook') {
                        child.clear();
                        child.lineStyle(3, 0x000000, 1);
                        child.moveTo(0, -180);
                        child.lineTo(0, hookY - 10);
                        child.drawCircle(0, hookY, 10);
                    }
                }
            }

            // Log progress at 10% intervals
            const progressPercent = Math.floor(this.buildProgress * 100);
            if (progressPercent % 10 === 0 && progressPercent > 0) {
                const lastProgressKey = `lastLoggedProgress_${this.gridX}_${this.gridY}`;
                const lastProgress = window[lastProgressKey] || 0;

                if (progressPercent > lastProgress) {
                    window[lastProgressKey] = progressPercent;
                }
            }

            // Check if construction is complete
            if (this.buildProgress >= 1) {
                // Add completion effect
                this.addCompletionEffect();

                // Update the building if it exists
                if (this.building) {
                    this.building.isUnderConstruction = false;
                    this.building.isBuilt = true;
                    this.building.buildProgress = 1;

                    // First try the gentle approach
                    console.log(`Ensuring visibility for ${this.building.buildingType} at (${this.gridX}, ${this.gridY})`);
                    this.building.ensureVisibility();

                    // Then use the more aggressive approach
                    console.log(`Forcing redraw for ${this.building.buildingType} at (${this.gridX}, ${this.gridY})`);
                    this.building.forceRedraw();
                    console.log('Building redraw complete');

                    // Try multiple approaches at different intervals to ensure the building appears
                    const delays = [500, 1000, 2000, 5000];
                    delays.forEach((delay, index) => {
                        setTimeout(() => {
                            if (this.building) {
                                // Alternate between gentle and aggressive approaches
                                if (index % 2 === 0) {
                                    console.log(`Delayed visibility check at ${delay}ms...`);
                                    this.building.ensureVisibility();
                                } else {
                                    console.log(`Delayed redraw at ${delay}ms...`);
                                    this.building.forceRedraw();
                                }
                            }
                        }, delay);
                    });

                    // Final check after all other attempts
                    setTimeout(() => {
                        if (this.building) {
                            console.log('FINAL ATTEMPT: Adding debug marker as last resort...');
                            // Add a debug marker
                            this.building.addDebugMarker();

                            // Try to place the building in the world again if needed
                            if (!this.building.parent || !this.building.visible) {
                                console.log('Building still not visible, trying to place in world again...');
                                if (this.building.world) {
                                    this.building.placeInWorld(this.building.world, this.gridX, this.gridY);
                                }
                            }
                        }
                    }, 10000); // 10 seconds later
                }

                // Remove the overlay after a delay
                setTimeout(() => {
                    if (this.parent) {
                        this.parent.removeChild(this);
                    }
                }, 2000);
            }
        }
    }

    /**
     * Adds a visual effect when construction is complete
     * @private
     */
    addCompletionEffect() {
        try {

            // Create a massive flash effect
            const flash = new PIXI.Graphics();
            flash.beginFill(0xFFFFFF, 0.9);
            flash.drawRect(-150, -250, 300, 300);
            flash.endFill();
            this.addChild(flash);

            // Add completion text
            const completionText = new PIXI.Text('CONSTRUCTION COMPLETE!', {
                fontFamily: 'Arial',
                fontSize: 24,
                fontWeight: 'bold',
                fill: 0x00FF00,
                stroke: 0x000000,
                strokeThickness: 5,
                align: 'center'
            });
            completionText.anchor.set(0.5, 0.5);
            completionText.position.set(0, -100);
            flash.addChild(completionText);

            // Add fireworks effect using circles and rectangles instead of stars
            for (let i = 0; i < 10; i++) {
                const firework = new PIXI.Graphics();
                const x = Math.random() * 200 - 100;
                const y = Math.random() * 200 - 200;
                const color = Math.random() * 0xFFFFFF;

                // Draw a circle for the firework center
                firework.beginFill(color);
                firework.drawCircle(x, y, 10);
                firework.endFill();

                // Draw some lines radiating outward
                firework.lineStyle(3, color);
                for (let j = 0; j < 8; j++) {
                    const angle = j * Math.PI / 4;
                    const endX = x + Math.cos(angle) * 20;
                    const endY = y + Math.sin(angle) * 20;
                    firework.moveTo(x, y);
                    firework.lineTo(endX, endY);
                }

                flash.addChild(firework);
            }

            // Animate the flash effect with scaling and rotation
            let alpha = 0.9;
            let scale = 1.0;
            let rotation = 0;

            const animateInterval = setInterval(() => {
                // Update alpha
                alpha -= 0.02; // Slower fade
                flash.alpha = alpha;

                // Update scale - make it pulse
                scale = 1.0 + 0.2 * Math.sin(Date.now() / 100);
                flash.scale.set(scale, scale);

                // Update rotation - make fireworks spin
                rotation += 0.02;
                for (let i = 0; i < flash.children.length; i++) {
                    if (i > 0) { // Skip the text
                        flash.children[i].rotation = rotation;
                    }
                }

                if (alpha <= 0) {
                    clearInterval(animateInterval);
                    this.removeChild(flash);
                }
            }, 50); // Faster updates for smoother animation
        } catch (error) {
            console.error('Error adding completion effect:', error);
        }
    }
}
