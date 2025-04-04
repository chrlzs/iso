/**
 * PerformanceMonitor - Tracks performance metrics and identifies memory leaks
 */
export class PerformanceMonitor {
    /**
     * Creates a new performance monitor
     * @param {Object} options - Monitor options
     */
    constructor(options = {}) {
        this.options = {
            sampleInterval: 10000, // Sample every 10 seconds
            historySize: 60,       // Keep 10 minutes of history
            logToConsole: true,    // Log to console
            ...options
        };

        this.metrics = {
            fps: [],
            memory: [],
            entities: [],
            drawCalls: [],
            textures: [],
            timestamp: []
        };

        this.lastSampleTime = 0;
        this.frameCount = 0;
        this.isRunning = false;

        // Bind methods
        this.update = this.update.bind(this);
        this.startMonitoring = this.startMonitoring.bind(this);
        this.stopMonitoring = this.stopMonitoring.bind(this);
    }

    /**
     * Starts performance monitoring
     */
    startMonitoring() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastSampleTime = performance.now();
        this.frameCount = 0;

        // Clear previous metrics
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = [];
        });

        console.log('Performance monitoring started');
    }

    /**
     * Stops performance monitoring
     */
    stopMonitoring() {
        this.isRunning = false;
        console.log('Performance monitoring stopped');
    }

    /**
     * Updates performance metrics
     * @param {Object} gameInstance - Game instance
     */
    update(gameInstance) {
        if (!this.isRunning) return;

        this.frameCount++;
        const now = performance.now();
        const elapsed = now - this.lastSampleTime;

        // Sample metrics at regular intervals
        if (elapsed >= this.options.sampleInterval) {
            const fps = Math.round((this.frameCount / elapsed) * 1000);

            // Get memory usage if available
            let memory = null;
            if (window.performance && window.performance.memory) {
                memory = {
                    usedJSHeapSize: window.performance.memory.usedJSHeapSize / (1024 * 1024),
                    totalJSHeapSize: window.performance.memory.totalJSHeapSize / (1024 * 1024),
                    jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit / (1024 * 1024)
                };
            }

            // Get entity count with proper null checks
            const entityCount = gameInstance && gameInstance.world && gameInstance.world.entities ? gameInstance.world.entities.length : 0;

            // Get draw calls with proper null checks
            const drawCalls = gameInstance && gameInstance.renderer && gameInstance.renderer.stats ? gameInstance.renderer.stats.drawCalls || 0 : 0;

            // Get texture count with proper null checks
            const textureCount = gameInstance && gameInstance.tileManager && gameInstance.tileManager.textures ? gameInstance.tileManager.textures.size : 0;

            // Add metrics to history
            this.metrics.fps.push(fps);
            this.metrics.memory.push(memory);
            this.metrics.entities.push(entityCount);
            this.metrics.drawCalls.push(drawCalls);
            this.metrics.textures.push(textureCount);
            this.metrics.timestamp.push(now);

            // Trim history if needed
            if (this.metrics.fps.length > this.options.historySize) {
                Object.keys(this.metrics).forEach(key => {
                    this.metrics[key] = this.metrics[key].slice(-this.options.historySize);
                });
            }

            // Log metrics
            if (this.options.logToConsole) {
                console.log('Performance metrics:', {
                    fps,
                    memory: memory ? `${memory.usedJSHeapSize.toFixed(2)}MB / ${memory.totalJSHeapSize.toFixed(2)}MB` : 'N/A',
                    entities: entityCount,
                    drawCalls,
                    textures: textureCount,
                    elapsedTime: Math.floor((now - this.metrics.timestamp[0]) / 1000) + 's'
                });

                // Check for memory leaks
                this.checkForMemoryLeaks();
            }

            // Reset counters
            this.lastSampleTime = now;
            this.frameCount = 0;
        }
    }

    /**
     * Checks for potential memory leaks
     */
    checkForMemoryLeaks() {
        if (this.metrics.memory.length < 5) return; // Need at least 5 samples

        const memoryHistory = this.metrics.memory.filter(m => m !== null);
        if (memoryHistory.length < 5) return; // Need at least 5 valid memory samples

        // Check for consistent memory growth
        let consistentGrowth = true;
        for (let i = 1; i < memoryHistory.length; i++) {
            if (memoryHistory[i].usedJSHeapSize <= memoryHistory[i-1].usedJSHeapSize) {
                consistentGrowth = false;
                break;
            }
        }

        if (consistentGrowth) {
            const startMemory = memoryHistory[0].usedJSHeapSize;
            const endMemory = memoryHistory[memoryHistory.length - 1].usedJSHeapSize;
            const growthRate = (endMemory - startMemory) / (this.metrics.timestamp[this.metrics.timestamp.length - 1] - this.metrics.timestamp[0]) * 1000;

            console.warn('Potential memory leak detected!', {
                startMemory: `${startMemory.toFixed(2)}MB`,
                currentMemory: `${endMemory.toFixed(2)}MB`,
                growth: `${(endMemory - startMemory).toFixed(2)}MB`,
                growthRate: `${growthRate.toFixed(2)}MB/s`,
                timeElapsed: `${((this.metrics.timestamp[this.metrics.timestamp.length - 1] - this.metrics.timestamp[0]) / 1000).toFixed(0)}s`
            });
        }

        // Check for entity growth
        const entityStart = this.metrics.entities[0];
        const entityEnd = this.metrics.entities[this.metrics.entities.length - 1];
        if (entityEnd > entityStart * 1.5) {
            console.warn('Entity count growing rapidly!', {
                startCount: entityStart,
                currentCount: entityEnd,
                growth: entityEnd - entityStart
            });
        }

        // Check for texture growth
        const textureStart = this.metrics.textures[0];
        const textureEnd = this.metrics.textures[this.metrics.textures.length - 1];
        if (textureEnd > textureStart * 1.5) {
            console.warn('Texture count growing rapidly!', {
                startCount: textureStart,
                currentCount: textureEnd,
                growth: textureEnd - textureStart
            });
        }
    }

    /**
     * Gets the current FPS
     * @returns {number} Current FPS
     */
    getCurrentFPS() {
        if (this.metrics.fps.length === 0) return 0;
        return this.metrics.fps[this.metrics.fps.length - 1];
    }

    /**
     * Gets performance metrics history
     * @returns {Object} Metrics history
     */
    getMetricsHistory() {
        return { ...this.metrics };
    }
}
