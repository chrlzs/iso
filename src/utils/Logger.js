/**
 * Logger - Centralized logging utility with log level control
 */
export class Logger {
    // Log levels
    static LEVELS = {
        NONE: 0,    // No logging
        ERROR: 1,   // Only errors
        WARN: 2,    // Errors and warnings
        INFO: 3,    // Errors, warnings, and info
        DEBUG: 4,   // All messages including debug
        VERBOSE: 5  // All messages including verbose debug
    };

    // Current log level - default to ERROR only
    static level = Logger.LEVELS.ERROR;

    /**
     * Sets the global log level
     * @param {number} level - Log level from Logger.LEVELS
     */
    static setLevel(level) {
        Logger.level = level;
    }

    /**
     * Logs an error message (always shown unless level is NONE)
     * @param {string} message - The message to log
     * @param {any} data - Optional data to log
     */
    static error(message, data) {
        if (Logger.level >= Logger.LEVELS.ERROR) {
            if (data !== undefined) {
                console.error(`[ERROR] ${message}`, data);
            } else {
                console.error(`[ERROR] ${message}`);
            }
        }
    }

    /**
     * Logs a warning message
     * @param {string} message - The message to log
     * @param {any} data - Optional data to log
     */
    static warn(message, data) {
        if (Logger.level >= Logger.LEVELS.WARN) {
            if (data !== undefined) {
                console.warn(`[WARN] ${message}`, data);
            } else {
                console.warn(`[WARN] ${message}`);
            }
        }
    }

    /**
     * Logs an info message
     * @param {string} message - The message to log
     * @param {any} data - Optional data to log
     */
    static info(message, data) {
        if (Logger.level >= Logger.LEVELS.INFO) {
            if (data !== undefined) {
                console.log(`[INFO] ${message}`, data);
            } else {
                console.log(`[INFO] ${message}`);
            }
        }
    }

    /**
     * Logs a debug message
     * @param {string} message - The message to log
     * @param {any} data - Optional data to log
     */
    static debug(message, data) {
        if (Logger.level >= Logger.LEVELS.DEBUG) {
            if (data !== undefined) {
                console.log(`[DEBUG] ${message}`, data);
            } else {
                console.log(`[DEBUG] ${message}`);
            }
        }
    }

    /**
     * Logs a verbose debug message (most detailed level)
     * @param {string} message - The message to log
     * @param {any} data - Optional data to log
     */
    static verbose(message, data) {
        if (Logger.level >= Logger.LEVELS.VERBOSE) {
            if (data !== undefined) {
                console.log(`[VERBOSE] ${message}`, data);
            } else {
                console.log(`[VERBOSE] ${message}`);
            }
        }
    }
}
