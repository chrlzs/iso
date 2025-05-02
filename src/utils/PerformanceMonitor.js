/**
 * PerformanceMonitor - Utility for monitoring and optimizing game performance
 */
export class PerformanceMonitor {
    /**
     * Creates a new performance monitor
     * @param {Object} options - Monitor options
     * @param {Game} options.game - Reference to the game instance
     */
    constructor(options = {}) {
        this.game = options.game;
        this.metrics = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            chunkLoadTime: 0,
            entityUpdateTime: 0,
            tileCount: 0,
            entityCount: 0,
            activeChunks: 0,
            memoryUsage: 0
        };
        
        this.samples = [];
        this.maxSamples = 60; // 1 second of samples at 60 FPS
        this.enabled = true;
        this.lastTime = performance.now();
        
        // Create performance markers
        this.markers = {};
    }
    
    /**
     * Starts timing a section of code
     * @param {string} name - Name of the section
     */
    startTimer(name) {
        if (!this.enabled) return;
        this.markers[name] = performance.now();
    }
    
    /**
     * Ends timing a section of code and records the duration
     * @param {string} name - Name of the section
     * @returns {number} The duration in milliseconds
     */
    endTimer(name) {
        if (!this.enabled || !this.markers[name]) return 0;
        const duration = performance.now() - this.markers[name];
        this.metrics[`${name}Time`] = duration;
        return duration;
    }
    
    /**
     * Updates performance metrics
     * @param {number} delta - Time since last update in frames
     */
    update(delta) {
        if (!this.enabled) return;
        
        const now = performance.now();
        const frameTime = now - this.lastTime;
        this.lastTime = now;
        
        // Calculate FPS
        const fps = 1000 / frameTime;
        
        // Add sample
        this.samples.push(fps);
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
        
        // Calculate average FPS
        const avgFps = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length;
        
        // Update metrics
        this.metrics.fps = Math.round(avgFps);
        this.metrics.frameTime = frameTime;
        
        // Update entity and tile counts
        if (this.game && this.game.world) {
            this.metrics.entityCount = this.game.world.entities.length;
            this.metrics.activeChunks = this.game.world.activeChunks.size;
            
            // Count visible tiles
            let tileCount = 0;
            for (const key of this.game.world.activeChunks) {
                const [chunkX, chunkY] = key.split(',').map(Number);
                const chunk = this.game.world.getChunk(chunkX, chunkY);
                if (chunk && chunk.container.visible) {
                    // Estimate tile count based on chunk size
                    tileCount += chunk.size * chunk.size;
                }
            }
            this.metrics.tileCount = tileCount;
        }
        
        // Estimate memory usage (Chrome only)
        if (window.performance && window.performance.memory) {
            this.metrics.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
        }
    }
    
    /**
     * Gets the current performance metrics
     * @returns {Object} The current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Suggests optimizations based on current metrics
     * @returns {Array<string>} Suggested optimizations
     */
    suggestOptimizations() {
        const suggestions = [];
        
        if (this.metrics.fps < 30) {
            if (this.metrics.updateTime > 16) {
                suggestions.push('Reduce update frequency or complexity');
            }
            
            if (this.metrics.renderTime > 16) {
                suggestions.push('Reduce visible entities or simplify rendering');
            }
            
            if (this.metrics.chunkLoadTime > 100) {
                suggestions.push('Reduce chunk size or load distance');
            }
            
            if (this.metrics.tileCount > 2000) {
                suggestions.push('Reduce visible tiles or chunk load distance');
            }
            
            if (this.metrics.entityCount > 100) {
                suggestions.push('Reduce number of active entities');
            }
        }
        
        return suggestions;
    }
}
