export class DebugLogger {
    constructor(config = { enabled: false, flags: {} }) {
        this.debug = config;
    }

    log(message, flag = null, ...args) {
        if (!this.debug?.enabled) return;
        if (flag && !this.debug.flags?.[flag]) return;
        if (args.length > 0) {
            console.log(`[DEBUG] ${message}`, ...args);
        } else {
            console.log(`[DEBUG] ${message}`);
        }
    }

    warn(message, ...args) {
        if (!this.debug?.enabled) return;
        console.warn(`[DEBUG] ${message}`, ...args);
    }

    error(message, ...args) {
        if (!this.debug?.enabled) return;
        console.error(`[DEBUG] ${message}`, ...args);
    }
}
