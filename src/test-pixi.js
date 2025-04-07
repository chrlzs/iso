// Simple PIXI.js test to verify rendering is working

// Import PIXI from our wrapper
import { PIXI, Application } from './utils/PixiWrapper.js';

// Create a simple test function
export function testPixiRendering() {
    console.log('Testing PIXI rendering...');
    
    // Check if PIXI is available
    if (!PIXI) {
        console.error('PIXI is not defined!');
        return false;
    }
    
    try {
        // Create a simple PIXI application
        const app = new Application({
            width: 400,
            height: 300,
            backgroundColor: 0x1099bb
        });
        
        // Add the canvas to the DOM
        document.getElementById('game-container').appendChild(app.view);
        
        // Create a simple graphic
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xFF0000);
        graphics.drawRect(50, 50, 100, 100);
        graphics.endFill();
        
        // Add the graphic to the stage
        app.stage.addChild(graphics);
        
        console.log('PIXI test successful!');
        return true;
    } catch (error) {
        console.error('PIXI test failed:', error);
        return false;
    }
}
