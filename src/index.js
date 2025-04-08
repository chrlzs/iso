import { Game } from './core/Game.js';
import { Character } from './entities/Character.js';
import { Structure } from './entities/Structure.js';
import { Item } from './entities/Item.js';
import { Enemy } from './entities/Enemy.js';
import { testPixiRendering } from './test-pixi.js';
import { FallbackRenderer } from './rendering/FallbackRenderer.js';
import { isPixiAvailable } from './utils/PixiWrapper.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if PIXI is available
    const pixiAvailable = isPixiAvailable();
    console.log('PIXI available:', pixiAvailable);

    if (!pixiAvailable) {
        console.warn('PIXI.js is not available. Using fallback renderer.');

        // Create fallback renderer
        const fallbackRenderer = new FallbackRenderer({
            container: document.getElementById('game-container'),
            width: window.innerWidth,
            height: window.innerHeight,
            tileWidth: 64,
            tileHeight: 32,
            gridWidth: 20,
            gridHeight: 20
        });

        // Set up keyboard input handling
        const keys = new Set();

        window.addEventListener('keydown', (e) => {
            keys.add(e.key.toLowerCase());
            fallbackRenderer.handleInput(keys);
        });

        window.addEventListener('keyup', (e) => {
            keys.delete(e.key.toLowerCase());
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            fallbackRenderer.resize(window.innerWidth, window.innerHeight);
        });

        console.log('Fallback renderer initialized.');
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
    // Create game instance
    const game = new Game({
        container: document.getElementById('game-container'),
        width: window.innerWidth,
        height: window.innerHeight,
        debug: true,
        worldWidth: 20,
        worldHeight: 20,
        generateWorld: true,
        createPlayer: true,
        dayDuration: 300, // 5 minutes per day
        startTime: 8, // Start at 8 AM
        tileWidth: 64,
        tileHeight: 32,

        // Custom tile click handler
        onTileClick: (tile, game) => {
            // If player exists, move to the clicked tile
            if (game.player && game.world) {
                // Get the world position of the tile
                const worldPos = game.world.gridToWorld(tile.gridX, tile.gridY);
                console.log(`Tile click: Moving player to tile (${tile.gridX}, ${tile.gridY}) at world position (${worldPos.x}, ${worldPos.y})`);
                game.player.setMoveTarget(worldPos);
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        game.resize(window.innerWidth, window.innerHeight);
    });

    // Create a simple HTML overlay for tile coordinates
    if (game.options.debug) {
        // Create a small, unobtrusive button to toggle coordinate display
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'C';
        toggleButton.title = 'Toggle Tile Coordinates';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.zIndex = '1000';
        toggleButton.style.padding = '3px 6px';
        toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        toggleButton.style.color = '#fff';
        toggleButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontSize = '10px';
        toggleButton.style.opacity = '0.7';
        toggleButton.style.transition = 'opacity 0.3s';
        document.body.appendChild(toggleButton);

        // Create calibration controls
        const calibrationPanel = document.createElement('div');
        calibrationPanel.style.position = 'fixed';
        calibrationPanel.style.top = '10px';
        calibrationPanel.style.right = '10px';
        calibrationPanel.style.zIndex = '1000';
        calibrationPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        calibrationPanel.style.padding = '15px';
        calibrationPanel.style.borderRadius = '5px';
        calibrationPanel.style.display = 'none';
        calibrationPanel.style.maxHeight = '80vh';
        calibrationPanel.style.overflowY = 'auto';
        calibrationPanel.style.width = '250px';
        calibrationPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        document.body.appendChild(calibrationPanel);

        // Add calibration controls
        const calibrationTitle = document.createElement('div');
        calibrationTitle.textContent = 'Coordinate Calibration';
        calibrationTitle.style.color = '#fff';
        calibrationTitle.style.marginBottom = '15px';
        calibrationTitle.style.fontWeight = 'bold';
        calibrationTitle.style.fontSize = '16px';
        calibrationTitle.style.textAlign = 'center';
        calibrationTitle.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
        calibrationTitle.style.paddingBottom = '5px';
        calibrationPanel.appendChild(calibrationTitle);

        // Create sections
        const createSection = (title) => {
            const section = document.createElement('div');
            section.style.marginBottom = '15px';
            section.style.padding = '8px';
            section.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            section.style.borderRadius = '4px';

            const sectionTitle = document.createElement('div');
            sectionTitle.textContent = title;
            sectionTitle.style.color = '#fff';
            sectionTitle.style.marginBottom = '8px';
            sectionTitle.style.fontWeight = 'bold';
            sectionTitle.style.fontSize = '14px';
            section.appendChild(sectionTitle);

            return section;
        };

        // Create a control with label and input
        const createControl = (label, type, value, min, max, step, parent) => {
            const controlContainer = document.createElement('div');
            controlContainer.style.display = 'flex';
            controlContainer.style.justifyContent = 'space-between';
            controlContainer.style.alignItems = 'center';
            controlContainer.style.marginBottom = '8px';

            const controlLabel = document.createElement('div');
            controlLabel.textContent = label;
            controlLabel.style.color = '#fff';
            controlLabel.style.flexGrow = '1';
            controlContainer.appendChild(controlLabel);

            const controlInput = document.createElement('input');
            controlInput.type = type;
            controlInput.value = value;
            controlInput.min = min;
            controlInput.max = max;
            controlInput.step = step;
            controlInput.style.width = '60px';
            controlInput.style.padding = '3px';
            controlInput.style.borderRadius = '3px';
            controlInput.style.border = '1px solid #ccc';
            controlContainer.appendChild(controlInput);

            parent.appendChild(controlContainer);

            return controlInput;
        };

        // Note: Coordinate transformation is now handled by hit-testing
        // These controls are kept for reference but don't affect the coordinate system
        const coordSection = createSection('Coordinate System');
        calibrationPanel.appendChild(coordSection);

        // Add an explanation about the hit-testing approach
        const hitTestingInfo = document.createElement('div');
        hitTestingInfo.textContent = 'Using hit-testing for coordinate detection';
        hitTestingInfo.style.color = '#00FF00';
        hitTestingInfo.style.fontSize = '12px';
        hitTestingInfo.style.marginBottom = '10px';
        hitTestingInfo.style.textAlign = 'center';
        coordSection.appendChild(hitTestingInfo);

        // Keep these inputs for reference but mark them as disabled
        const xOffsetInput = createControl('X Offset (disabled):', 'number', '9', null, null, '1', coordSection);
        const yOffsetInput = createControl('Y Offset (disabled):', 'number', '8', null, null, '1', coordSection);

        // Disable the inputs
        xOffsetInput.disabled = true;
        yOffsetInput.disabled = true;

        // Grid Visualization Section
        const gridSection = createSection('Grid Visualization');
        calibrationPanel.appendChild(gridSection);

        const gridOffsetXInput = createControl('Grid X Offset:', 'number', '0', null, null, '1', gridSection);
        const gridOffsetYInput = createControl('Grid Y Offset:', 'number', '-32', null, null, '1', gridSection);
        const gridScaleInput = createControl('Grid Scale:', 'number', '1.0', '0.1', '2.0', '0.1', gridSection);

        // Presets Section
        const presetsSection = createSection('Presets');
        calibrationPanel.appendChild(presetsSection);

        // Presets container
        const presetsContainer = document.createElement('div');
        presetsContainer.style.display = 'flex';
        presetsContainer.style.flexWrap = 'wrap';
        presetsContainer.style.gap = '5px';
        presetsSection.appendChild(presetsContainer);

        // Create preset buttons
        const createPresetButton = (name, xOffset, yOffset, gridOffsetX, gridOffsetY, gridScale) => {
            const button = document.createElement('button');
            button.textContent = name;
            button.style.padding = '5px';
            button.style.margin = '2px';
            button.style.backgroundColor = 'rgba(0, 100, 200, 0.5)';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '3px';
            button.style.cursor = 'pointer';
            button.style.flexGrow = '1';
            button.style.minWidth = '70px';

            button.addEventListener('click', () => {
                xOffsetInput.value = xOffset;
                yOffsetInput.value = yOffset;
                gridOffsetXInput.value = gridOffsetX;
                gridOffsetYInput.value = gridOffsetY;
                gridScaleInput.value = gridScale;

                // Apply the preset immediately
                applyCalibration();
            });

            presetsContainer.appendChild(button);
        };

        // Add some preset configurations
        createPresetButton('Working', '9', '8', '0', '-32', '1.0');
        createPresetButton('Default', '6', '7', '0', '0', '1.0');

        // Add a note about the coordinate system
        const noteElement = document.createElement('div');
        noteElement.textContent = 'Using standard isometric coordinate system';
        noteElement.style.color = '#00FF00';
        noteElement.style.fontSize = '12px';
        noteElement.style.marginTop = '10px';
        noteElement.style.textAlign = 'center';
        presetsSection.appendChild(noteElement);

        // Add a special button to highlight the (0,0) tile
        const highlightZeroButton = document.createElement('button');
        highlightZeroButton.textContent = 'Highlight (0,0)';
        highlightZeroButton.style.padding = '8px 15px';
        highlightZeroButton.style.backgroundColor = 'rgba(255, 165, 0, 0.7)';
        highlightZeroButton.style.color = 'white';
        highlightZeroButton.style.border = 'none';
        highlightZeroButton.style.borderRadius = '4px';
        highlightZeroButton.style.cursor = 'pointer';
        highlightZeroButton.style.marginTop = '10px';
        highlightZeroButton.style.width = '100%';
        presetsSection.appendChild(highlightZeroButton);

        // Add event listener to highlight the (0,0) tile
        highlightZeroButton.addEventListener('click', () => {
            // Force highlight the (0,0) tile
            const zeroTile = game.world.getTile(0, 0);
            if (zeroTile) {
                // Create a temporary highlight effect
                const highlight = new PIXI.Graphics();
                highlight.beginFill(0xFF9900, 0.5);
                highlight.drawRect(-game.world.tileWidth/2, -game.world.tileHeight/2,
                                 game.world.tileWidth, game.world.tileHeight);
                highlight.endFill();
                highlight.position.set(zeroTile.x, zeroTile.y);
                game.world.debugGridOverlay.addChild(highlight);

                // Add a text label
                const text = new PIXI.Text('(0,0)', {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fontWeight: 'bold',
                    fill: 0xFFFFFF,
                    stroke: 0x000000,
                    strokeThickness: 4,
                    align: 'center'
                });
                text.position.set(zeroTile.x, zeroTile.y - 30);
                text.anchor.set(0.5, 0.5);
                game.world.debugGridOverlay.addChild(text);

                // Log the tile position
                console.log('Zero tile position:', zeroTile.x, zeroTile.y);
                console.log('Zero tile grid coordinates:', zeroTile.gridX, zeroTile.gridY);

                // Show success message
                statusMessage.textContent = 'Highlighted (0,0) tile!';
                statusMessage.style.color = '#FFAA00';
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 2000);
            } else {
                console.error('Could not find the (0,0) tile!');
                statusMessage.textContent = 'Error: Could not find (0,0) tile';
                statusMessage.style.color = '#FF0000';
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 2000);
            }
        });

        // Action buttons section
        const actionsSection = createSection('Actions');
        calibrationPanel.appendChild(actionsSection);

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '10px';
        actionsSection.appendChild(buttonsContainer);

        // Apply button
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply';
        applyButton.style.padding = '8px 15px';
        applyButton.style.backgroundColor = 'rgba(0, 150, 0, 0.7)';
        applyButton.style.color = 'white';
        applyButton.style.border = 'none';
        applyButton.style.borderRadius = '4px';
        applyButton.style.cursor = 'pointer';
        applyButton.style.flexGrow = '1';
        buttonsContainer.appendChild(applyButton);

        // Reset button
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset';
        resetButton.style.padding = '8px 15px';
        resetButton.style.backgroundColor = 'rgba(150, 0, 0, 0.7)';
        resetButton.style.color = 'white';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '4px';
        resetButton.style.cursor = 'pointer';
        resetButton.style.flexGrow = '1';
        buttonsContainer.appendChild(resetButton);

        // Status message
        const statusMessage = document.createElement('div');
        statusMessage.style.color = '#fff';
        statusMessage.style.fontSize = '12px';
        statusMessage.style.marginTop = '10px';
        statusMessage.style.textAlign = 'center';
        statusMessage.style.height = '20px';
        actionsSection.appendChild(statusMessage);

        // Toggle calibration panel button
        const calibrateButton = document.createElement('button');
        calibrateButton.textContent = 'Cal';
        calibrateButton.title = 'Calibrate Coordinates';
        calibrateButton.style.position = 'fixed';
        calibrateButton.style.bottom = '10px';
        calibrateButton.style.right = '40px';
        calibrateButton.style.zIndex = '1000';
        calibrateButton.style.padding = '3px 6px';
        calibrateButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        calibrateButton.style.color = '#fff';
        calibrateButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        calibrateButton.style.borderRadius = '3px';
        calibrateButton.style.cursor = 'pointer';
        calibrateButton.style.fontSize = '10px';
        calibrateButton.style.opacity = '0.7';
        calibrateButton.style.transition = 'opacity 0.3s';
        document.body.appendChild(calibrateButton);

        // Toggle calibration panel
        calibrateButton.addEventListener('click', () => {
            calibrationPanel.style.display = calibrationPanel.style.display === 'none' ? 'block' : 'none';
        });

        // Function to apply calibration
        const applyCalibration = () => {
            // Note: X and Y offsets are now disabled and don't affect the coordinate system
            // We're using hit-testing instead of coordinate transformations

            // Get grid visualization values
            const gridOffsetX = parseInt(gridOffsetXInput.value);
            const gridOffsetY = parseInt(gridOffsetYInput.value);
            const gridScale = parseFloat(gridScaleInput.value);

            // Update the grid visualization
            game.world.gridOffsetX = gridOffsetX;
            game.world.gridOffsetY = gridOffsetY;
            game.world.gridScale = gridScale;

            // Redraw the debug grid
            game.world.drawDebugGrid();

            // Show success message
            statusMessage.textContent = 'Grid visualization updated!';
            statusMessage.style.color = '#00FF00';
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 2000);

            // Update coordinates
            updateCoordinates();

            // Show success message
            statusMessage.textContent = 'Settings applied successfully!';
            statusMessage.style.color = '#00FF00';
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 2000);

            console.log(`Applied settings - Grid: X=${gridOffsetX}, Y=${gridOffsetY}, Scale=${gridScale}`);
        };

        // Apply calibration when button is clicked
        applyButton.addEventListener('click', applyCalibration);

        // Reset to defaults
        resetButton.addEventListener('click', () => {
            // Note: X and Y offsets are now disabled and don't affect the coordinate system
            xOffsetInput.value = '9';
            yOffsetInput.value = '8';
            gridOffsetXInput.value = '0';
            gridOffsetYInput.value = '-32';
            gridScaleInput.value = '1.0';

            applyCalibration();

            statusMessage.textContent = 'Reset to defaults';
            statusMessage.style.color = '#FFFF00';
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 2000);
        });

        // Make button more visible on hover
        toggleButton.addEventListener('mouseover', () => {
            toggleButton.style.opacity = '1';
        });
        toggleButton.addEventListener('mouseout', () => {
            toggleButton.style.opacity = '0.7';
        });

        // Make calibrate button more visible on hover
        calibrateButton.addEventListener('mouseover', () => {
            calibrateButton.style.opacity = '1';
        });
        calibrateButton.addEventListener('mouseout', () => {
            calibrateButton.style.opacity = '0.7';
        });

        // Create container for coordinate labels
        const coordContainer = document.createElement('div');
        coordContainer.id = 'coord-overlay';
        coordContainer.style.position = 'absolute';
        coordContainer.style.top = '0';
        coordContainer.style.left = '0';
        coordContainer.style.width = '100%';
        coordContainer.style.height = '100%';
        coordContainer.style.pointerEvents = 'none';
        coordContainer.style.display = 'none';
        document.getElementById('game-container').appendChild(coordContainer);

        // Toggle coordinate display
        toggleButton.addEventListener('click', () => {
            if (coordContainer.style.display === 'none') {
                coordContainer.style.display = 'block';
                toggleButton.textContent = 'C✓';
                toggleButton.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
                updateCoordinates();
            } else {
                coordContainer.style.display = 'none';
                toggleButton.textContent = 'C';
                toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        });

        // Function to update coordinate labels
        function updateCoordinates() {
            // Clear existing labels
            coordContainer.innerHTML = '';

            // Only proceed if the overlay is visible
            if (coordContainer.style.display === 'none') return;

            // Get the game container dimensions
            const gameContainer = document.getElementById('game-container');
            const containerRect = gameContainer.getBoundingClientRect();

            // Create labels for each tile
            for (let x = 0; x < game.world.gridWidth; x++) {
                for (let y = 0; y < game.world.gridHeight; y++) {
                    const tile = game.world.getTile(x, y);
                    if (tile) {
                        // Get the tile's position in the PIXI container
                        const tileGlobalPos = tile.getGlobalPosition();

                        // Convert PIXI global position to DOM position
                        const screenX = tileGlobalPos.x;
                        const screenY = tileGlobalPos.y;

                        // Apply a small offset to center the label on the tile
                        const offsetY = -15; // Move the label up a bit to center it better

                        // Only show labels for tiles that are on screen
                        if (screenX >= 0 && screenX <= containerRect.width &&
                            screenY >= 0 && screenY <= containerRect.height) {

                            // Create label element
                            const label = document.createElement('div');
                            label.textContent = `${x},${y}`;
                            label.style.position = 'absolute';
                            label.style.left = `${screenX}px`;
                            label.style.top = `${screenY + offsetY}px`;
                            label.style.transform = 'translate(-50%, -50%)';
                            label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                            label.style.color = 'rgba(255, 255, 0, 0.9)';
                            label.style.padding = '1px 3px';
                            label.style.borderRadius = '2px';
                            label.style.fontSize = '10px';
                            label.style.fontFamily = 'Arial, sans-serif';
                            label.style.textAlign = 'center';
                            label.style.minWidth = '20px';
                            label.style.pointerEvents = 'none';

                            // Add to container
                            coordContainer.appendChild(label);
                        }
                    }
                }
            }
        }

        // Update coordinates periodically instead of on every camera update
        // This is more efficient and less intrusive
        let updateTimer = null;

        // Update coordinates when camera moves, but throttled
        const originalUpdateCamera = game.world.updateCamera;
        game.world.updateCamera = function() {
            originalUpdateCamera.call(game.world);

            // Only schedule an update if coordinates are visible and no update is pending
            if (coordContainer.style.display !== 'none' && !updateTimer) {
                // Throttle updates to once every 500ms for better performance
                updateTimer = setTimeout(() => {
                    updateCoordinates();
                    updateTimer = null;
                }, 500);
            }
        };

        // Also update coordinates on window resize
        window.addEventListener('resize', () => {
            if (coordContainer.style.display !== 'none') {
                updateCoordinates();
            }
        });
    }

    // Log success message
    console.log('Game initialized successfully!');
    console.log('Controls:');
    console.log('- WASD: Move camera');
    console.log('- QE: Zoom in/out');
    console.log('- Left Click: Select tile');
    console.log('- Right Click: Move player to tile');
    console.log('- Shift+Click: Place house');
    console.log('- T: Place tree');
    console.log('- R: Place rock');
    console.log('- F: Place item');
    console.log('- X: Place enemy');
    console.log('- I: Toggle inventory');
    console.log('- P: Pause/resume time');
    console.log('- T (hold Shift): Toggle time speed');
});

