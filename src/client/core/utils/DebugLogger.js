export class DebugLogger {
    constructor(config = { enabled: false, flags: {} }) {
        this.debug = config;
    }

    log(message, flag = null, ...args) {
        if (!this.debug?.enabled) return;
        if (flag && !this.debug.flags?.[flag]) return;
        console.log(message, ...args);
    }

    warn(message, ...args) {
        if (!this.debug?.enabled) return;
        console.warn(message, ...args);
    }

    error(message, ...args) {
        if (!this.debug?.enabled) return;
        console.error(message, ...args);
    }
}