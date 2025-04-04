/**
 * WorkerManager - Manages web workers for background processing
 */
export class WorkerManager {
    /**
     * Creates a new worker manager
     */
    constructor() {
        this.workers = new Map();
        this.callbacks = new Map();
        this.nextId = 1;
        this.isSupported = typeof Worker !== 'undefined';
        
        if (!this.isSupported) {
            console.warn('Web Workers are not supported in this browser. Falling back to main thread processing.');
        }
    }
    
    /**
     * Creates a new worker
     * @param {string} name - Worker name
     * @param {string} scriptPath - Path to worker script
     * @returns {boolean} True if worker was created successfully
     */
    createWorker(name, scriptPath) {
        if (!this.isSupported) {
            return false;
        }
        
        if (this.workers.has(name)) {
            console.warn(`Worker '${name}' already exists`);
            return true;
        }
        
        try {
            const worker = new Worker(scriptPath);
            
            worker.onmessage = (e) => {
                this.handleWorkerMessage(name, e.data);
            };
            
            worker.onerror = (error) => {
                console.error(`Error in worker '${name}':`, error);
            };
            
            this.workers.set(name, worker);
            this.callbacks.set(name, new Map());
            
            return true;
        } catch (error) {
            console.error(`Failed to create worker '${name}':`, error);
            return false;
        }
    }
    
    /**
     * Sends a message to a worker
     * @param {string} name - Worker name
     * @param {Object} message - Message to send
     * @param {Function} [callback] - Callback function for response
     * @returns {number|null} Message ID or null if worker doesn't exist
     */
    sendMessage(name, message, callback = null) {
        if (!this.isSupported) {
            return null;
        }
        
        const worker = this.workers.get(name);
        if (!worker) {
            console.warn(`Worker '${name}' not found`);
            return null;
        }
        
        const id = this.nextId++;
        const messageWithId = { ...message, id };
        
        if (callback) {
            const callbacks = this.callbacks.get(name);
            callbacks.set(id, callback);
        }
        
        worker.postMessage(messageWithId);
        return id;
    }
    
    /**
     * Handles messages from workers
     * @param {string} name - Worker name
     * @param {Object} data - Message data
     */
    handleWorkerMessage(name, data) {
        const callbacks = this.callbacks.get(name);
        if (!callbacks) {
            return;
        }
        
        const id = data.id;
        if (id && callbacks.has(id)) {
            const callback = callbacks.get(id);
            callback(data);
            callbacks.delete(id);
        }
    }
    
    /**
     * Terminates a worker
     * @param {string} name - Worker name
     * @returns {boolean} True if worker was terminated successfully
     */
    terminateWorker(name) {
        if (!this.isSupported) {
            return false;
        }
        
        const worker = this.workers.get(name);
        if (!worker) {
            console.warn(`Worker '${name}' not found`);
            return false;
        }
        
        worker.terminate();
        this.workers.delete(name);
        this.callbacks.delete(name);
        
        return true;
    }
    
    /**
     * Terminates all workers
     */
    terminateAll() {
        if (!this.isSupported) {
            return;
        }
        
        for (const [name, worker] of this.workers) {
            worker.terminate();
        }
        
        this.workers.clear();
        this.callbacks.clear();
    }
    
    /**
     * Checks if a worker exists
     * @param {string} name - Worker name
     * @returns {boolean} True if worker exists
     */
    hasWorker(name) {
        return this.workers.has(name);
    }
}
