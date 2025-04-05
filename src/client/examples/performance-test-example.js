/**
 * Example script demonstrating how to use the performance profiling tools
 * 
 * This script shows how to:
 * 1. Run a performance test programmatically
 * 2. Analyze the results
 * 3. Save the profile data to a file
 * 
 * To use this script:
 * 1. Import the game instance
 * 2. Call the runPerformanceTest method
 * 3. Analyze the results
 */

// Example usage in browser console:
async function runGamePerformanceTest() {
    // Get the game instance (assuming it's available as a global variable)
    const game = window.gameInstance;
    
    if (!game) {
        console.error('Game instance not found. Make sure the game is running.');
        return;
    }
    
    try {
        // Run a 30-second performance test
        console.log('Starting 30-second performance test...');
        const profileData = await game.runPerformanceTest(30, {
            saveProfile: true,
            filename: 'game-performance-profile.json'
        });
        
        // Log the results
        console.log('Performance test complete!');
        console.log(`Average FPS: ${profileData.fps.average.toFixed(2)}`);
        console.log(`Min FPS: ${profileData.fps.min.toFixed(2)}`);
        console.log(`Max FPS: ${profileData.fps.max.toFixed(2)}`);
        console.log(`FPS Stability (StdDev): ${profileData.fps.stdDev.toFixed(2)}`);
        
        if (profileData.memory) {
            console.log(`Memory Growth: ${profileData.memory.growthMB.toFixed(2)} MB`);
        }
        
        // Analyze FPS drops
        analyzeFpsDrops(profileData);
        
        return profileData;
    } catch (error) {
        console.error('Error running performance test:', error);
    }
}

/**
 * Analyzes FPS drops in the profile data
 * @param {Object} profileData - Profile data from performance test
 */
function analyzeFpsDrops(profileData) {
    const samples = profileData.samples;
    const fpsThreshold = profileData.fps.average * 0.5; // 50% of average FPS
    
    console.log(`\nAnalyzing FPS drops (threshold: ${fpsThreshold.toFixed(2)} FPS):`);
    
    // Find periods of low FPS
    let dropPeriods = [];
    let currentDrop = null;
    
    for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        
        if (sample.fps < fpsThreshold) {
            // Start or continue a drop period
            if (!currentDrop) {
                currentDrop = {
                    startIndex: i,
                    startTime: sample.elapsedTime,
                    samples: []
                };
            }
            
            currentDrop.samples.push(sample);
            currentDrop.endIndex = i;
            currentDrop.endTime = sample.elapsedTime;
        } else if (currentDrop) {
            // End a drop period
            dropPeriods.push(currentDrop);
            currentDrop = null;
        }
    }
    
    // Add the last drop period if it exists
    if (currentDrop) {
        dropPeriods.push(currentDrop);
    }
    
    // Log drop periods
    if (dropPeriods.length === 0) {
        console.log('No significant FPS drops detected.');
    } else {
        console.log(`Found ${dropPeriods.length} periods of low FPS:`);
        
        dropPeriods.forEach((period, index) => {
            const duration = (period.endTime - period.startTime) / 1000; // Convert to seconds
            const avgFps = period.samples.reduce((sum, s) => sum + s.fps, 0) / period.samples.length;
            const minFps = Math.min(...period.samples.map(s => s.fps));
            
            console.log(`Drop #${index + 1}: ${duration.toFixed(2)}s from ${(period.startTime / 1000).toFixed(2)}s to ${(period.endTime / 1000).toFixed(2)}s`);
            console.log(`  Average FPS: ${avgFps.toFixed(2)}, Min FPS: ${minFps.toFixed(2)}`);
            
            // Check for memory spikes during this period
            if (period.samples[0].memory && period.samples[period.samples.length - 1].memory) {
                const startMemory = period.samples[0].memory.usedJSHeapSize / (1024 * 1024);
                const endMemory = period.samples[period.samples.length - 1].memory.usedJSHeapSize / (1024 * 1024);
                const memoryGrowth = endMemory - startMemory;
                
                console.log(`  Memory: ${startMemory.toFixed(2)}MB → ${endMemory.toFixed(2)}MB (${memoryGrowth > 0 ? '+' : ''}${memoryGrowth.toFixed(2)}MB)`);
            }
            
            // Check for entity count changes
            if ('entityCount' in period.samples[0] && 'entityCount' in period.samples[period.samples.length - 1]) {
                const startEntities = period.samples[0].entityCount;
                const endEntities = period.samples[period.samples.length - 1].entityCount;
                const entityChange = endEntities - startEntities;
                
                console.log(`  Entities: ${startEntities} → ${endEntities} (${entityChange > 0 ? '+' : ''}${entityChange})`);
            }
        });
    }
}

// Export the function for use in modules
export { runGamePerformanceTest, analyzeFpsDrops };
