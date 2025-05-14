/**
 * Isometric Prison Tycoon
 * Main entry point
 */

// Import core components
import { Game, isPixiAvailable, testPixiRendering } from '@iso-game/core';

// Import prison-specific components
import { PrisonGame } from './game/PrisonGame.js';
import { PrisonUI } from './ui/PrisonUI.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if PIXI is available
  const pixiAvailable = isPixiAvailable();
  console.log('PIXI available:', pixiAvailable);

  if (!pixiAvailable) {
    console.error('PIXI.js is not available. Cannot initialize game.');
    document.getElementById('game-container').innerHTML = '<div style="color: white; padding: 20px;">PIXI.js is required to run this game. Please check your internet connection and try again.</div>';
    return;
  }

  // Test PIXI rendering
  const pixiTestSuccessful = testPixiRendering();

  if (!pixiTestSuccessful) {
    console.error('PIXI test failed. Not initializing game.');
    document.getElementById('game-container').innerHTML = '<div style="color: white; padding: 20px;">PIXI.js initialization failed. Check console for errors.</div>';
    return;
  }

  // Clear the test canvas
  document.getElementById('game-container').innerHTML = '';

  // Hide loading screen
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.style.display = 'none';

  // Create game instance
  const game = new PrisonGame({
    container: document.getElementById('game-container'),
    width: window.innerWidth,
    height: window.innerHeight,
    debug: false,
    worldWidth: 64,
    worldHeight: 64,
    chunkSize: 16,
    loadDistance: 2,
    unloadDistance: 3,
    generateDistance: 1,
    worldId: 'prison',
    persistChunks: true,
    autoSave: true,
    autoSaveInterval: 60000,
    generateWorld: false
  });

  // Initialize game
  game.init();

  // Handle window resize
  window.addEventListener('resize', () => {
    game.resize(window.innerWidth, window.innerHeight);
  });

  // Update version info with timestamp
  const versionInfo = document.getElementById('version-info');
  if (versionInfo) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    versionInfo.textContent = `v0.1.0 - Prison Tycoon (${timestamp})`;
  }
});
