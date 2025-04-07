import { PIXI, Container } from '../utils/PixiWrapper.js';

/**
 * Base Entity class for game objects
 * Extends PIXI.Container for rendering capabilities
 */
export class Entity extends Container {
    /**
     * Creates a new entity
     * @param {Object} options - Entity options
     */
    constructor(options = {}) {
        super();

        // Basic properties
        this.id = options.id || `entity_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.type = options.type || 'entity';
        this.tags = options.tags || [];

        // State
        this.active = options.active !== undefined ? options.active : true;
        this.visible = options.visible !== undefined ? options.visible : true;

        // Physics properties
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.friction = options.friction || 0.9;
        this.maxSpeed = options.maxSpeed || 10;
        this.mass = options.mass || 1;

        // Collision properties
        this.solid = options.solid !== undefined ? options.solid : true;
        this.collidable = options.collidable !== undefined ? options.collidable : true;
        this.collisionRadius = options.collisionRadius || Math.max(this.width, this.height) / 2;
        this.collisionShape = options.collisionShape || 'circle';

        // References
        this.game = options.game || null;
        this.world = options.world || null;
        this.parent = null;
        this.target = null;

        // Pool tracking
        this._pooled = false;
        this._active = true;
        this._poolTimestamp = Date.now();

        // Initialize components
        this.components = new Map();

        // Initialize from options
        this.init(options);
    }

    /**
     * Initialize the entity with options
     * @param {Object} options - Entity options
     */
    init(options = {}) {
        // Set position
        if (options.x !== undefined) this.x = options.x;
        if (options.y !== undefined) this.y = options.y;

        // Set dimensions
        if (options.width !== undefined) this.width = options.width;
        if (options.height !== undefined) this.height = options.height;

        // Set scale
        if (options.scale !== undefined) {
            this.scale.set(options.scale);
        } else {
            if (options.scaleX !== undefined) this.scale.x = options.scaleX;
            if (options.scaleY !== undefined) this.scale.y = options.scaleY;
        }

        // Set rotation
        if (options.rotation !== undefined) this.rotation = options.rotation;

        // Set alpha
        if (options.alpha !== undefined) this.alpha = options.alpha;

        // Set velocity
        if (options.velocity) {
            this.velocity.x = options.velocity.x || 0;
            this.velocity.y = options.velocity.y || 0;
        }

        // Set acceleration
        if (options.acceleration) {
            this.acceleration.x = options.acceleration.x || 0;
            this.acceleration.y = options.acceleration.y || 0;
        }

        // Add components
        if (options.components && Array.isArray(options.components)) {
            options.components.forEach(component => {
                this.addComponent(component);
            });
        }
    }

    /**
     * Resets the entity to its default state
     * Called when entity is returned to the pool
     */
    reset() {
        // Reset transform
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.scale.set(1);
        this.rotation = 0;
        this.alpha = 1;

        // Reset state
        this.active = false;
        this.visible = false;

        // Reset physics
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.acceleration.x = 0;
        this.acceleration.y = 0;

        // Reset references
        this.parent = null;
        this.target = null;

        // Reset components
        this.components.forEach(component => {
            if (typeof component.reset === 'function') {
                component.reset();
            }
        });

        // Clear children
        this.removeChildren();
    }

    /**
     * Updates the entity
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.active) return;

        // Update physics
        this.updatePhysics(deltaTime);

        // Update components
        this.updateComponents(deltaTime);
    }

    /**
     * Updates entity physics
     * @param {number} deltaTime - Time since last update in seconds
     */
    updatePhysics(deltaTime) {
        // Apply acceleration
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Limit speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            const ratio = this.maxSpeed / speed;
            this.velocity.x *= ratio;
            this.velocity.y *= ratio;
        }

        // Only update position if velocity is significant
        if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.y) > 0.01) {
            // Update position
            const oldX = this.x;
            const oldY = this.y;

            this.x += this.velocity.x * deltaTime;
            this.y += this.velocity.y * deltaTime;

            // Log position change if significant
            if (Math.abs(this.x - oldX) > 0.1 || Math.abs(this.y - oldY) > 0.1) {
                console.log(`Entity ${this.id} moved from (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) to (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
            }
        }
    }

    /**
     * Updates all components
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateComponents(deltaTime) {
        this.components.forEach(component => {
            if (component.active && typeof component.update === 'function') {
                component.update(deltaTime, this);
            }
        });
    }

    /**
     * Adds a component to the entity
     * @param {Object} component - The component to add
     * @returns {Object} The added component
     */
    addComponent(component) {
        if (!component.type) {
            console.warn('Component must have a type');
            return null;
        }

        // Set entity reference
        component.entity = this;

        // Initialize component if needed
        if (typeof component.init === 'function') {
            component.init(this);
        }

        // Add to components map
        this.components.set(component.type, component);

        return component;
    }

    /**
     * Gets a component by type
     * @param {string} type - Component type
     * @returns {Object} The component or null if not found
     */
    getComponent(type) {
        return this.components.get(type) || null;
    }

    /**
     * Removes a component by type
     * @param {string} type - Component type
     * @returns {boolean} Whether the component was removed
     */
    removeComponent(type) {
        const component = this.components.get(type);

        if (!component) return false;

        // Call dispose if available
        if (typeof component.dispose === 'function') {
            component.dispose();
        }

        // Remove from map
        this.components.delete(type);

        return true;
    }

    /**
     * Checks if the entity has a component
     * @param {string} type - Component type
     * @returns {boolean} Whether the entity has the component
     */
    hasComponent(type) {
        return this.components.has(type);
    }

    /**
     * Checks if the entity has all the specified components
     * @param {Array} types - Array of component types
     * @returns {boolean} Whether the entity has all components
     */
    hasComponents(types) {
        return types.every(type => this.hasComponent(type));
    }

    /**
     * Checks if the entity has any of the specified components
     * @param {Array} types - Array of component types
     * @returns {boolean} Whether the entity has any of the components
     */
    hasAnyComponent(types) {
        return types.some(type => this.hasComponent(type));
    }

    /**
     * Checks if the entity has a tag
     * @param {string} tag - The tag to check
     * @returns {boolean} Whether the entity has the tag
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }

    /**
     * Adds a tag to the entity
     * @param {string} tag - The tag to add
     */
    addTag(tag) {
        if (!this.hasTag(tag)) {
            this.tags.push(tag);
        }
    }

    /**
     * Removes a tag from the entity
     * @param {string} tag - The tag to remove
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index !== -1) {
            this.tags.splice(index, 1);
        }
    }

    /**
     * Disposes of the entity
     * Cleans up resources and prepares for garbage collection
     */
    dispose() {
        // Dispose of components
        this.components.forEach(component => {
            if (typeof component.dispose === 'function') {
                component.dispose();
            }
        });

        // Clear components
        this.components.clear();

        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Destroy PIXI container
        this.destroy({ children: true });
    }

    /**
     * Creates a new entity from the pool
     * @param {Object} options - Entity options
     * @returns {Entity} A new or recycled entity
     * @static
     */
    static create(options = {}) {
        // Use the pool if available
        if (Entity.pool) {
            return Entity.pool.get(options);
        }

        // Otherwise create a new instance
        return new Entity(options);
    }
}
