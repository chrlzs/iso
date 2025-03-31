/**
 * Manages sprite animations and transitions
 * @class AnimationSystem
 */
export class AnimationSystem {
    /**
     * Creates a new AnimationSystem instance
     * @param {GameInstance} game - Reference to game instance
     */
    constructor(game) {
        this.game = game;
        this.animations = new Map();
        this.activeAnimations = new Map();
        this.lastUpdate = performance.now();
    }

    /**
     * Registers a new animation
     * @param {string} id - Animation identifier
     * @param {Object} config - Animation configuration
     * @param {number} config.frameWidth - Width of each frame
     * @param {number} config.frameHeight - Height of each frame
     * @param {number} config.frameCount - Number of frames
     * @param {number} config.frameDuration - Duration of each frame in ms
     * @param {boolean} [config.loop=false] - Whether animation should loop
     */
    registerAnimation(id, config) {
        this.animations.set(id, {
            ...config,
            currentFrame: 0,
            elapsed: 0,
            isPlaying: false
        });
    }

    /**
     * Plays an animation on an entity
     * @param {Entity} entity - Entity to animate
     * @param {string} animationId - Animation to play
     * @param {Object} [options={}] - Playback options
     * @returns {boolean} True if animation started successfully
     */
    play(entity, animationId, options = {}) {
        const animation = this.animations.get(animationId);
        if (!animation) {
            console.warn(`Animation ${animationId} not found`);
            return false;
        }

        this.activeAnimations.set(entity.id, {
            entity,
            animation: { ...animation },
            options
        });

        return true;
    }

    /**
     * Stops an entity's current animation
     * @param {Entity} entity - Entity to stop animating
     */
    stop(entity) {
        this.activeAnimations.delete(entity.id);
    }

    /**
     * Updates all active animations
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        const now = performance.now();
        const elapsed = now - this.lastUpdate;

        this.activeAnimations.forEach((data, entityId) => {
            const { entity, animation, options } = data;
            
            animation.elapsed += elapsed;
            if (animation.elapsed >= animation.frameDuration) {
                animation.currentFrame = (animation.currentFrame + 1) % animation.frameCount;
                animation.elapsed = 0;

                if (!animation.loop && animation.currentFrame === 0) {
                    this.activeAnimations.delete(entityId);
                    options.onComplete?.();
                }
            }
        });

        this.lastUpdate = now;
    }
}
