/**
 * Utility for programmatic performance profiling
 * Helps identify performance bottlenecks and memory leaks
 */
class PerformanceProfiler {
    /**
     * Creates a new performance profiler
     * @param {Object} options - Profiler options
     * @param {boolean} options.includeMemory - Whether to include memory usage in the profile
     * @param {boolean} options.includeFPS - Whether to include FPS data in the profile
     * @param {number} options.sampleInterval - Interval between samples in ms
     */
    constructor(options = {}) {
        this.options = {
            includeMemory: true,
            includeFPS: true,
            sampleInterval: 1000, // 1 second between samples
            ...options
        };
        
        this.isRecording = false;
        this.startTime = 0;
        this.endTime = 0;
        this.samples = [];
        this.intervalId = null;
        this.frameCountStart = 0;
        this.lastFrameCount = 0;
        this.gameInstance = null;
    }
    
    /**
     * Starts recording performance data
     * @param {Object} gameInstance - Game instance to profile
     * @returns {Promise} Promise that resolves when recording starts
     */
    startRecording(gameInstance) {
        if (this.isRecording) {
            console.warn('Performance profiler is already recording');
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            this.isRecording = true;
            this.gameInstance = gameInstance;
            this.startTime = performance.now();
            this.samples = [];
            this.frameCountStart = gameInstance.frameCount || 0;
            this.lastFrameCount = this.frameCountStart;
            
            // Take initial sample
            this._takeSample();
            
            // Set up interval for regular sampling
            this.intervalId = setInterval(() => {
                this._takeSample();
            }, this.options.sampleInterval);
            
            // Resolve immediately
            resolve();
        });
    }
    
    /**
     * Stops recording performance data
     * @returns {Promise<Object>} Promise that resolves with the profile data
     */
    stopRecording() {
        if (!this.isRecording) {
            console.warn('Performance profiler is not recording');
            return Promise.resolve(null);
        }
        
        return new Promise((resolve) => {
            // Take final sample
            this._takeSample();
            
            // Clear interval
            clearInterval(this.intervalId);
            
            // Update state
            this.isRecording = false;
            this.endTime = performance.now();
            
            // Generate profile data
            const profileData = this._generateProfileData();
            
            // Resolve with profile data
            resolve(profileData);
        });
    }
    
    /**
     * Takes a sample of performance data
     * @private
     */
    _takeSample() {
        if (!this.gameInstance) return;
        
        const timestamp = performance.now();
        const elapsedTime = timestamp - this.startTime;
        const sample = {
            timestamp,
            elapsedTime,
            fps: this.gameInstance.currentFPS || 0
        };
        
        // Calculate FPS from frame count if available
        if (this.gameInstance.frameCount) {
            const framesDelta = this.gameInstance.frameCount - this.lastFrameCount;
            const timeDelta = this.options.sampleInterval / 1000; // Convert to seconds
            sample.calculatedFPS = framesDelta / timeDelta;
            this.lastFrameCount = this.gameInstance.frameCount;
        }
        
        // Add memory info if available and requested
        if (this.options.includeMemory && window.performance && window.performance.memory) {
            sample.memory = {
                usedJSHeapSize: window.performance.memory.usedJSHeapSize,
                totalJSHeapSize: window.performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
            };
        }
        
        // Add entity counts if available
        if (this.gameInstance.world && this.gameInstance.world.entities) {
            sample.entityCount = this.gameInstance.world.entities.length;
        }
        
        // Add structure counts if available
        if (this.gameInstance.world && this.gameInstance.world.structures) {
            sample.structureCount = this.gameInstance.world.structures.length;
        }
        
        // Add to samples
        this.samples.push(sample);
    }
    
    /**
     * Generates profile data from samples
     * @private
     * @returns {Object} Profile data
     */
    _generateProfileData() {
        // Calculate summary statistics
        const fpsSamples = this.samples.map(s => s.fps).filter(fps => fps > 0);
        const avgFPS = fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length;
        const minFPS = Math.min(...fpsSamples);
        const maxFPS = Math.max(...fpsSamples);
        
        // Calculate FPS stability (standard deviation)
        const fpsVariance = fpsSamples.reduce((sum, fps) => sum + Math.pow(fps - avgFPS, 2), 0) / fpsSamples.length;
        const fpsStdDev = Math.sqrt(fpsVariance);
        
        // Calculate memory growth if available
        let memoryGrowth = null;
        if (this.options.includeMemory && this.samples.length > 1 && this.samples[0].memory && this.samples[this.samples.length - 1].memory) {
            const startMemory = this.samples[0].memory.usedJSHeapSize;
            const endMemory = this.samples[this.samples.length - 1].memory.usedJSHeapSize;
            memoryGrowth = endMemory - startMemory;
        }
        
        return {
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this.endTime - this.startTime,
            sampleCount: this.samples.length,
            sampleInterval: this.options.sampleInterval,
            fps: {
                average: avgFPS,
                min: minFPS,
                max: maxFPS,
                stdDev: fpsStdDev
            },
            memory: memoryGrowth !== null ? {
                growth: memoryGrowth,
                growthMB: memoryGrowth / (1024 * 1024)
            } : null,
            samples: this.samples
        };
    }
    
    /**
     * Saves profile data to a file
     * @param {Object} profileData - Profile data to save
     * @param {string} filename - Filename to save to
     * @returns {Promise} Promise that resolves when the file is saved
     */
    saveProfile(profileData, filename = 'profile.json') {
        return new Promise((resolve, reject) => {
            try {
                // Create a blob with the profile data
                const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
                
                // Create a download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                
                // Trigger download
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    resolve();
                }, 100);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default PerformanceProfiler;
