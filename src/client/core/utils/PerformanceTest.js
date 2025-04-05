/**
 * Utility for running performance tests on the game
 */
import PerformanceProfiler from './PerformanceProfiler.js';

class PerformanceTest {
    /**
     * Creates a new performance test
     * @param {Object} gameInstance - Game instance to test
     */
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        this.profiler = new PerformanceProfiler();
        this.isRunning = false;
        this.testDuration = 0;
        this.startTime = 0;
        this.testPromise = null;
        this.testResolve = null;
        this.testReject = null;
    }
    
    /**
     * Runs the game for a specified duration and captures a performance profile
     * @param {number} seconds - Duration to run the test for in seconds
     * @param {Object} options - Test options
     * @param {boolean} options.saveProfile - Whether to automatically save the profile
     * @param {string} options.filename - Filename to save the profile to
     * @returns {Promise<Object>} Promise that resolves with the profile data
     */
    async runFor(seconds, options = {}) {
        if (this.isRunning) {
            throw new Error('Performance test is already running');
        }
        
        const defaultOptions = {
            saveProfile: true,
            filename: `profile_${new Date().toISOString().replace(/:/g, '-')}.json`
        };
        
        const testOptions = { ...defaultOptions, ...options };
        
        this.isRunning = true;
        this.testDuration = seconds * 1000; // Convert to milliseconds
        this.startTime = performance.now();
        
        // Create a promise that will resolve when the test is complete
        this.testPromise = new Promise((resolve, reject) => {
            this.testResolve = resolve;
            this.testReject = reject;
        });
        
        // Start recording
        await this.profiler.startRecording(this.gameInstance);
        
        // Set up a timeout to stop the test
        setTimeout(() => this._completeTest(testOptions), this.testDuration);
        
        // Log start of test
        console.log(`Starting performance test for ${seconds} seconds...`);
        
        // Return the promise
        return this.testPromise;
    }
    
    /**
     * Completes the test and resolves the promise
     * @private
     * @param {Object} options - Test options
     */
    async _completeTest(options) {
        try {
            // Stop recording
            const profileData = await this.profiler.stopRecording();
            
            // Log results
            console.log('Performance test complete!');
            console.log(`Average FPS: ${profileData.fps.average.toFixed(2)}`);
            console.log(`Min FPS: ${profileData.fps.min.toFixed(2)}`);
            console.log(`Max FPS: ${profileData.fps.max.toFixed(2)}`);
            console.log(`FPS Stability (StdDev): ${profileData.fps.stdDev.toFixed(2)}`);
            
            if (profileData.memory) {
                console.log(`Memory Growth: ${profileData.memory.growthMB.toFixed(2)} MB`);
            }
            
            // Save profile if requested
            if (options.saveProfile) {
                await this.profiler.saveProfile(profileData, options.filename);
                console.log(`Profile saved to ${options.filename}`);
            }
            
            // Update state
            this.isRunning = false;
            
            // Resolve the promise
            this.testResolve(profileData);
        } catch (error) {
            console.error('Error completing performance test:', error);
            this.testReject(error);
        }
    }
    
    /**
     * Cancels the current test
     */
    cancel() {
        if (!this.isRunning) {
            console.warn('No performance test is running');
            return;
        }
        
        this.isRunning = false;
        this.profiler.stopRecording();
        this.testReject(new Error('Performance test cancelled'));
    }
}

export default PerformanceTest;
