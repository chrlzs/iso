export class CacheManager {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    has(key) {
        return this.cache.has(key);
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        return this.cache.delete(key);
    }

    get size() {
        return this.cache.size;
    }
}