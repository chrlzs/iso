/**
 * Game profiling script
 * 
 * This script runs a comprehensive performance profile of the game
 * and generates a detailed report of the results.
 */
import PerformanceProfiler from '../core/utils/PerformanceProfiler.js';

/**
 * Runs a comprehensive performance profile of the game
 * @param {Object} gameInstance - The game instance to profile
 * @param {Object} options - Profiling options
 * @returns {Promise<Object>} - The profile results
 */
export async function runGameProfile(gameInstance, options = {}) {
    const defaultOptions = {
        duration: 60, // Profile for 60 seconds by default
        sampleInterval: 500, // Take samples every 500ms
        includeMemory: true,
        includeFPS: true,
        saveResults: true,
        filename: `game-profile-${new Date().toISOString().replace(/:/g, '-')}.json`,
        logResults: true,
        runWithPerformanceMode: true, // Run with performance mode enabled
        runWithoutPerformanceMode: true, // Also run with performance mode disabled
        movementPattern: 'random', // 'random', 'circle', 'zigzag', or 'none'
        spawnEntities: true, // Spawn additional entities during the test
        entityCount: 50, // Number of entities to spawn
        captureFrameTimes: true, // Capture detailed frame timing data
    };

    const profileOptions = { ...defaultOptions, ...options };
    
    // Create UI to show profiling progress
    const progressUI = createProgressUI();
    
    try {
        // Show progress UI
        progressUI.show();
        progressUI.updateStatus('Starting performance profile...');
        
        // Create profiler
        const profiler = new PerformanceProfiler({
            includeMemory: profileOptions.includeMemory,
            includeFPS: profileOptions.includeFPS,
            sampleInterval: profileOptions.sampleInterval
        });
        
        // Store original performance mode setting
        const originalPerformanceMode = gameInstance.performanceMode.enabled;
        
        // Results array to store multiple profile runs
        const results = [];
        
        // Run with performance mode if requested
        if (profileOptions.runWithPerformanceMode) {
            progressUI.updateStatus('Running profile with performance mode enabled...');
            
            // Enable performance mode
            gameInstance.performanceMode.enabled = true;
            
            // Wait for performance mode to take effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Run the profile
            const performanceModeResults = await runProfileSession(
                gameInstance, 
                profiler, 
                profileOptions, 
                progressUI,
                'performance-mode'
            );
            
            results.push({
                mode: 'performance-mode',
                results: performanceModeResults
            });
        }
        
        // Run without performance mode if requested
        if (profileOptions.runWithoutPerformanceMode) {
            progressUI.updateStatus('Running profile with performance mode disabled...');
            
            // Disable performance mode
            gameInstance.performanceMode.enabled = false;
            
            // Wait for performance mode change to take effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Run the profile
            const normalModeResults = await runProfileSession(
                gameInstance, 
                profiler, 
                profileOptions, 
                progressUI,
                'normal-mode'
            );
            
            results.push({
                mode: 'normal-mode',
                results: normalModeResults
            });
        }
        
        // Restore original performance mode setting
        gameInstance.performanceMode.enabled = originalPerformanceMode;
        
        // Generate combined results
        const combinedResults = {
            timestamp: new Date().toISOString(),
            gameVersion: gameInstance.version || 'unknown',
            profiles: results,
            summary: generateSummary(results)
        };
        
        // Log results if requested
        if (profileOptions.logResults) {
            console.log('Profile results:', combinedResults);
            logProfileSummary(combinedResults);
        }
        
        // Save results if requested
        if (profileOptions.saveResults) {
            await profiler.saveProfile(combinedResults, profileOptions.filename);
            progressUI.updateStatus(`Profile saved to ${profileOptions.filename}`);
        }
        
        // Show results in UI
        progressUI.showResults(combinedResults);
        
        return combinedResults;
    } catch (error) {
        console.error('Error running profile:', error);
        progressUI.updateStatus(`Error: ${error.message}`);
        throw error;
    }
}

/**
 * Runs a single profile session
 * @param {Object} gameInstance - The game instance to profile
 * @param {Object} profiler - The performance profiler
 * @param {Object} options - Profiling options
 * @param {Object} progressUI - The progress UI
 * @param {string} mode - The profile mode ('performance-mode' or 'normal-mode')
 * @returns {Promise<Object>} - The profile results
 */
async function runProfileSession(gameInstance, profiler, options, progressUI, mode) {
    // Start recording
    await profiler.startRecording(gameInstance);
    
    // Set up movement pattern if requested
    let movementInterval = null;
    if (options.movementPattern !== 'none') {
        movementInterval = setupMovementPattern(gameInstance, options.movementPattern);
    }
    
    // Spawn entities if requested
    const spawnedEntities = [];
    if (options.spawnEntities) {
        for (let i = 0; i < options.entityCount; i++) {
            const entity = spawnTestEntity(gameInstance);
            if (entity) {
                spawnedEntities.push(entity);
            }
            
            // Space out entity creation to avoid frame spikes
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        progressUI.updateStatus(`Spawned ${spawnedEntities.length} test entities`);
    }
    
    // Set up frame time capture if requested
    let frameTimes = [];
    let lastFrameTime = performance.now();
    let frameTimeCapture = null;
    
    if (options.captureFrameTimes) {
        frameTimeCapture = () => {
            const now = performance.now();
            const frameTime = now - lastFrameTime;
            frameTimes.push(frameTime);
            lastFrameTime = now;
            
            // Continue capturing
            requestAnimationFrame(frameTimeCapture);
        };
        
        // Start capturing
        requestAnimationFrame(frameTimeCapture);
    }
    
    // Update progress during profiling
    const startTime = performance.now();
    const duration = options.duration * 1000; // Convert to milliseconds
    
    const progressInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        progressUI.updateProgress(progress);
        
        const remainingSeconds = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        progressUI.updateStatus(`Profiling ${mode}: ${remainingSeconds}s remaining...`);
    }, 500);
    
    // Wait for the specified duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Clean up
    clearInterval(progressInterval);
    clearInterval(movementInterval);
    
    // Stop frame time capture
    if (frameTimeCapture) {
        cancelAnimationFrame(frameTimeCapture);
    }
    
    // Remove spawned entities
    for (const entity of spawnedEntities) {
        if (entity && entity.dispose) {
            entity.dispose();
        }
    }
    
    // Stop recording and get results
    const results = await profiler.stopRecording();
    
    // Add frame time data if captured
    if (frameTimes.length > 0) {
        results.frameTimes = {
            count: frameTimes.length,
            min: Math.min(...frameTimes),
            max: Math.max(...frameTimes),
            average: frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length,
            median: getMedian(frameTimes),
            percentile95: getPercentile(frameTimes, 95),
            percentile99: getPercentile(frameTimes, 99),
            raw: frameTimes
        };
    }
    
    return results;
}

/**
 * Creates a UI to show profiling progress
 * @returns {Object} - The progress UI
 */
function createProgressUI() {
    // Create container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.color = 'white';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.zIndex = '1000';
    container.style.width = '300px';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.style.display = 'none';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Game Performance Profile';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '14px';
    container.appendChild(title);
    
    // Create status
    const status = document.createElement('div');
    status.textContent = 'Initializing...';
    status.style.marginBottom = '10px';
    container.appendChild(status);
    
    // Create progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '100%';
    progressContainer.style.height = '20px';
    progressContainer.style.backgroundColor = '#333';
    progressContainer.style.borderRadius = '3px';
    progressContainer.style.overflow = 'hidden';
    container.appendChild(progressContainer);
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#4CAF50';
    progressBar.style.transition = 'width 0.3s';
    progressContainer.appendChild(progressBar);
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.style.marginTop = '10px';
    resultsContainer.style.maxHeight = '300px';
    resultsContainer.style.overflowY = 'auto';
    resultsContainer.style.display = 'none';
    container.appendChild(resultsContainer);
    
    // Add to document
    document.body.appendChild(container);
    
    return {
        show: () => {
            container.style.display = 'block';
        },
        hide: () => {
            container.style.display = 'none';
        },
        updateStatus: (text) => {
            status.textContent = text;
        },
        updateProgress: (percent) => {
            progressBar.style.width = `${percent}%`;
        },
        showResults: (results) => {
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = formatResults(results);
        }
    };
}

/**
 * Formats profile results as HTML
 * @param {Object} results - The profile results
 * @returns {string} - HTML representation of the results
 */
function formatResults(results) {
    let html = '<h4 style="margin: 0 0 5px 0;">Profile Results</h4>';
    
    // Add summary
    html += '<div style="margin-bottom: 10px; padding: 5px; background-color: #333;">';
    html += '<strong>Summary:</strong><br>';
    
    if (results.summary) {
        const summary = results.summary;
        html += `Average FPS: ${summary.avgFPS.toFixed(1)}<br>`;
        html += `Min FPS: ${summary.minFPS.toFixed(1)}<br>`;
        html += `Max FPS: ${summary.maxFPS.toFixed(1)}<br>`;
        html += `FPS Stability: ${summary.fpsStability.toFixed(2)}<br>`;
        
        if (summary.memoryGrowth !== undefined) {
            html += `Memory Growth: ${summary.memoryGrowth.toFixed(2)} MB<br>`;
        }
        
        if (summary.frameTimeAvg !== undefined) {
            html += `Avg Frame Time: ${summary.frameTimeAvg.toFixed(2)} ms<br>`;
            html += `95th Percentile: ${summary.frameTime95.toFixed(2)} ms<br>`;
        }
    }
    
    html += '</div>';
    
    // Add individual profiles
    results.profiles.forEach(profile => {
        html += `<div style="margin-bottom: 10px; padding: 5px; background-color: #333;">`;
        html += `<strong>${profile.mode}</strong><br>`;
        
        const data = profile.results;
        html += `FPS: ${data.fps.average.toFixed(1)} (${data.fps.min.toFixed(1)}-${data.fps.max.toFixed(1)})<br>`;
        
        if (data.memory) {
            html += `Memory: ${(data.memory.growth / (1024 * 1024)).toFixed(2)} MB<br>`;
        }
        
        if (data.frameTimes) {
            html += `Frame Time: ${data.frameTimes.average.toFixed(2)} ms<br>`;
            html += `95%: ${data.frameTimes.percentile95.toFixed(2)} ms<br>`;
        }
        
        html += '</div>';
    });
    
    return html;
}

/**
 * Generates a summary of the profile results
 * @param {Array} profiles - The profile results
 * @returns {Object} - The summary
 */
function generateSummary(profiles) {
    // Initialize summary
    const summary = {
        avgFPS: 0,
        minFPS: Infinity,
        maxFPS: 0,
        fpsStability: 0,
        memoryGrowth: 0,
        frameTimeAvg: 0,
        frameTime95: 0,
        frameTime99: 0
    };
    
    // Calculate summary statistics
    let totalFPS = 0;
    let totalProfiles = profiles.length;
    
    profiles.forEach(profile => {
        const data = profile.results;
        
        // FPS stats
        totalFPS += data.fps.average;
        summary.minFPS = Math.min(summary.minFPS, data.fps.min);
        summary.maxFPS = Math.max(summary.maxFPS, data.fps.max);
        
        // Memory stats if available
        if (data.memory) {
            summary.memoryGrowth += data.memory.growthMB || 0;
        }
        
        // Frame time stats if available
        if (data.frameTimes) {
            summary.frameTimeAvg += data.frameTimes.average;
            summary.frameTime95 += data.frameTimes.percentile95;
            summary.frameTime99 += data.frameTimes.percentile99;
        }
    });
    
    // Calculate averages
    summary.avgFPS = totalFPS / totalProfiles;
    summary.fpsStability = (summary.maxFPS - summary.minFPS) / summary.avgFPS;
    
    if (totalProfiles > 0) {
        summary.memoryGrowth /= totalProfiles;
        summary.frameTimeAvg /= totalProfiles;
        summary.frameTime95 /= totalProfiles;
        summary.frameTime99 /= totalProfiles;
    }
    
    return summary;
}

/**
 * Logs a summary of the profile results to the console
 * @param {Object} results - The profile results
 */
function logProfileSummary(results) {
    console.log('=== GAME PERFORMANCE PROFILE ===');
    console.log(`Timestamp: ${results.timestamp}`);
    console.log(`Game Version: ${results.gameVersion}`);
    console.log('');
    
    console.log('=== SUMMARY ===');
    const summary = results.summary;
    console.log(`Average FPS: ${summary.avgFPS.toFixed(1)}`);
    console.log(`Min FPS: ${summary.minFPS.toFixed(1)}`);
    console.log(`Max FPS: ${summary.maxFPS.toFixed(1)}`);
    console.log(`FPS Stability: ${summary.fpsStability.toFixed(2)}`);
    
    if (summary.memoryGrowth !== undefined) {
        console.log(`Memory Growth: ${summary.memoryGrowth.toFixed(2)} MB`);
    }
    
    if (summary.frameTimeAvg !== undefined) {
        console.log(`Avg Frame Time: ${summary.frameTimeAvg.toFixed(2)} ms`);
        console.log(`95th Percentile: ${summary.frameTime95.toFixed(2)} ms`);
        console.log(`99th Percentile: ${summary.frameTime99.toFixed(2)} ms`);
    }
    
    console.log('');
    
    // Log individual profiles
    results.profiles.forEach(profile => {
        console.log(`=== ${profile.mode.toUpperCase()} ===`);
        const data = profile.results;
        console.log(`FPS: ${data.fps.average.toFixed(1)} (${data.fps.min.toFixed(1)}-${data.fps.max.toFixed(1)})`);
        console.log(`FPS Stability: ${data.fps.stdDev.toFixed(2)}`);
        
        if (data.memory) {
            console.log(`Memory Growth: ${(data.memory.growth / (1024 * 1024)).toFixed(2)} MB`);
        }
        
        if (data.frameTimes) {
            console.log(`Frame Time: ${data.frameTimes.average.toFixed(2)} ms (${data.frameTimes.min.toFixed(2)}-${data.frameTimes.max.toFixed(2)} ms)`);
            console.log(`Median Frame Time: ${data.frameTimes.median.toFixed(2)} ms`);
            console.log(`95th Percentile: ${data.frameTimes.percentile95.toFixed(2)} ms`);
            console.log(`99th Percentile: ${data.frameTimes.percentile99.toFixed(2)} ms`);
        }
        
        console.log('');
    });
    
    console.log('=== END OF PROFILE ===');
}

/**
 * Sets up a movement pattern for the player
 * @param {Object} gameInstance - The game instance
 * @param {string} pattern - The movement pattern
 * @returns {number} - The interval ID
 */
function setupMovementPattern(gameInstance, pattern) {
    const player = gameInstance.player;
    if (!player) return null;
    
    // Store original position
    const originalX = player.x;
    const originalY = player.y;
    
    // Movement parameters
    const moveDistance = 0.5;
    const moveInterval = 100;
    
    // Pattern-specific variables
    let angle = 0;
    let direction = 1;
    let step = 0;
    
    // Set up interval
    const interval = setInterval(() => {
        switch (pattern) {
            case 'random':
                // Random movement
                player.x += (Math.random() * 2 - 1) * moveDistance;
                player.y += (Math.random() * 2 - 1) * moveDistance;
                break;
                
            case 'circle':
                // Circular movement
                angle += 0.1;
                player.x = originalX + Math.cos(angle) * 5;
                player.y = originalY + Math.sin(angle) * 5;
                break;
                
            case 'zigzag':
                // Zigzag movement
                step += 0.2;
                player.x = originalX + step * direction;
                
                // Change direction at boundaries
                if (Math.abs(player.x - originalX) > 10) {
                    direction *= -1;
                    player.y += 2;
                }
                break;
        }
    }, moveInterval);
    
    return interval;
}

/**
 * Spawns a test entity in the game
 * @param {Object} gameInstance - The game instance
 * @returns {Object} - The spawned entity
 */
function spawnTestEntity(gameInstance) {
    // Get player position
    const player = gameInstance.player;
    if (!player) return null;
    
    // Calculate random position near player
    const x = player.x + (Math.random() * 40 - 20);
    const y = player.y + (Math.random() * 40 - 20);
    
    // Create entity
    try {
        // Try to use NPC class if available
        if (gameInstance.createNPC) {
            return gameInstance.createNPC({
                x,
                y,
                name: `Test Entity ${Math.floor(Math.random() * 1000)}`,
                type: 'test',
                isTest: true
            });
        }
        
        // Fallback to generic entity
        if (gameInstance.createEntity) {
            return gameInstance.createEntity({
                x,
                y,
                name: `Test Entity ${Math.floor(Math.random() * 1000)}`,
                type: 'test',
                isTest: true
            });
        }
    } catch (error) {
        console.error('Error spawning test entity:', error);
    }
    
    return null;
}

/**
 * Calculates the median value of an array
 * @param {Array} values - The array of values
 * @returns {number} - The median value
 */
function getMedian(values) {
    if (values.length === 0) return 0;
    
    // Sort values
    const sorted = [...values].sort((a, b) => a - b);
    
    // Get median
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
        return sorted[middle];
    }
}

/**
 * Calculates a percentile value of an array
 * @param {Array} values - The array of values
 * @param {number} percentile - The percentile to calculate (0-100)
 * @returns {number} - The percentile value
 */
function getPercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    // Sort values
    const sorted = [...values].sort((a, b) => a - b);
    
    // Calculate index
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}
