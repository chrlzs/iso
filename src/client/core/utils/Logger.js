/**
 * Logger - Efficient logging system with production safeguards
 */
export class Logger {
    /**
     * Creates a new logger
     * @param {Object} options - Logger options
     */
    constructor(options = {}) {
        this.options = {
            enabled: true,
            level: 'info', // 'debug', 'info', 'warn', 'error'
            maxHistory: 100,
            throttleMs: 1000, // Throttle similar messages within this time window
            productionMode: false, // Set to true in production to disable most logging
            ...options
        };
        
        // Log levels
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        // Log history
        this.history = [];
        
        // Throttle tracking
        this.throttled = new Map();
        
        // Performance tracking
        this.stats = {
            debugCount: 0,
            infoCount: 0,
            warnCount: 0,
            errorCount: 0,
            throttledCount: 0
        };
    }
    
    /**
     * Gets the current level as a number
     * @returns {number} Level number
     * @private
     */
    _getLevelNumber() {
        return this.levels[this.options.level] || 0;
    }
    
    /**
     * Checks if a message should be throttled
     * @param {string} message - Message to check
     * @returns {boolean} True if throttled
     * @private
     */
    _shouldThrottle(message) {
        const now = Date.now();
        const key = message.substring(0, 100); // Use first 100 chars as key
        
        if (this.throttled.has(key)) {
            const lastTime = this.throttled.get(key);
            if (now - lastTime < this.options.throttleMs) {
                this.stats.throttledCount++;
                return true;
            }
        }
        
        this.throttled.set(key, now);
        return false;
    }
    
    /**
     * Adds a log entry to history
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @private
     */
    _addToHistory(level, message, data) {
        this.history.push({
            timestamp: Date.now(),
            level,
            message,
            data
        });
        
        // Trim history if needed
        if (this.history.length > this.options.maxHistory) {
            this.history.shift();
        }
    }
    
    /**
     * Logs a debug message
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    debug(message, data) {
        if (!this.options.enabled) return;
        if (this.options.productionMode) return;
        if (this._getLevelNumber() > this.levels.debug) return;
        if (this._shouldThrottle(message)) return;
        
        this.stats.debugCount++;
        this._addToHistory('debug', message, data);
        console.debug(message, data);
    }
    
    /**
     * Logs an info message
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    info(message, data) {
        if (!this.options.enabled) return;
        if (this.options.productionMode) return;
        if (this._getLevelNumber() > this.levels.info) return;
        if (this._shouldThrottle(message)) return;
        
        this.stats.infoCount++;
        this._addToHistory('info', message, data);
        console.info(message, data);
    }
    
    /**
     * Logs a warning message
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    warn(message, data) {
        if (!this.options.enabled) return;
        if (this._getLevelNumber() > this.levels.warn) return;
        if (this._shouldThrottle(message)) return;
        
        this.stats.warnCount++;
        this._addToHistory('warn', message, data);
        console.warn(message, data);
    }
    
    /**
     * Logs an error message
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    error(message, data) {
        if (!this.options.enabled) return;
        if (this._getLevelNumber() > this.levels.error) return;
        
        this.stats.errorCount++;
        this._addToHistory('error', message, data);
        console.error(message, data);
    }
    
    /**
     * Logs a performance message (only in development)
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    performance(message, data) {
        if (!this.options.enabled) return;
        if (this.options.productionMode) return;
        if (this._getLevelNumber() > this.levels.debug) return;
        if (this._shouldThrottle(message)) return;
        
        this._addToHistory('performance', message, data);
        console.log(`%c[PERF] ${message}`, 'color: purple', data);
    }
    
    /**
     * Gets log statistics
     * @returns {Object} Log statistics
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Gets log history
     * @returns {Array} Log history
     */
    getHistory() {
        return [...this.history];
    }
    
    /**
     * Clears log history
     */
    clearHistory() {
        this.history = [];
    }
    
    /**
     * Enables or disables logging
     * @param {boolean} enabled - Whether logging is enabled
     */
    setEnabled(enabled) {
        this.options.enabled = enabled;
    }
    
    /**
     * Sets the log level
     * @param {string} level - Log level ('debug', 'info', 'warn', 'error')
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.options.level = level;
        }
    }
    
    /**
     * Sets production mode
     * @param {boolean} productionMode - Whether to use production mode
     */
    setProductionMode(productionMode) {
        this.options.productionMode = productionMode;
    }
}
