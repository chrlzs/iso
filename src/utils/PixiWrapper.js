/**
 * PixiWrapper - Ensures PIXI is properly loaded and available to modules
 * This wrapper allows us to use PIXI in ES modules
 */

console.log('PixiWrapper: Initializing...');

// Check if PIXI is already defined globally
if (typeof window.PIXI === 'undefined') {
    console.error('PIXI.js is not loaded. Make sure to include the PIXI.js script before loading the game.');

    // Check if we're still waiting for PIXI to load
    if (typeof window.pixiLoaded !== 'undefined' && window.pixiLoaded === false) {
        console.log('PixiWrapper: Waiting for PIXI.js to load...');

        // We'll continue without PIXI and use the fallback renderer
    } else {
        // Try to load PIXI dynamically as a fallback
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pixi.js@7.3.2/dist/pixi.min.js';
        script.async = false;
        document.head.appendChild(script);

        console.log('PixiWrapper: Attempting to load PIXI.js dynamically...');

        // Wait for script to load
        script.onload = () => {
            console.log('PixiWrapper: PIXI.js loaded dynamically!');
            window.pixiLoaded = true;
            // Force page reload to ensure PIXI is available
            window.location.reload();
        };

        script.onerror = () => {
            console.error('PixiWrapper: Failed to load PIXI.js dynamically!');
        };
    }
} else {
    console.log('PixiWrapper: PIXI.js is already loaded. Version:', window.PIXI.VERSION);
    window.pixiLoaded = true;
}

// Export PIXI from the global scope
export const PIXI = window.PIXI;

// Log PIXI availability
console.log('PixiWrapper: PIXI export is', PIXI ? 'available' : 'NOT available');

// Export common PIXI classes for convenience
export const {
    Application = class MockApplication { constructor() { console.error('PIXI Application not available'); } },
    Container = class MockContainer { constructor() { console.error('PIXI Container not available'); } },
    Graphics = class MockGraphics { constructor() { console.error('PIXI Graphics not available'); } },
    Sprite = class MockSprite { constructor() { console.error('PIXI Sprite not available'); } },
    Text = class MockText { constructor() { console.error('PIXI Text not available'); } },
    TextStyle = class MockTextStyle { constructor() { console.error('PIXI TextStyle not available'); } },
    Texture = {
        from: () => { console.error('PIXI Texture.from not available'); return {}; }
    },
    BaseTexture = class MockBaseTexture { constructor() { console.error('PIXI BaseTexture not available'); } },
    Rectangle = class MockRectangle { constructor() { console.error('PIXI Rectangle not available'); } },
    Point = class MockPoint { constructor() { console.error('PIXI Point not available'); } },
    utils = {}
} = window.PIXI || {};

console.log('PixiWrapper: Initialization complete.');

// Export a function to check if PIXI is properly loaded
export function isPixiAvailable() {
    // Check if PIXI is defined and has necessary components
    const pixi = window.PIXI;
    if (!pixi) return false;

    // Check for essential PIXI components
    const hasApplication = typeof pixi.Application === 'function';
    const hasContainer = typeof pixi.Container === 'function';
    const hasGraphics = typeof pixi.Graphics === 'function';

    console.log('PIXI components check:', {
        hasApplication,
        hasContainer,
        hasGraphics
    });

    return hasApplication && hasContainer && hasGraphics;
}
