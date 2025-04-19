import { PIXI } from '../utils/PixiWrapper.js';

/**
 * GlitchEffect - Creates a glitchy, digital disintegration effect
 * Perfect for synthwave/outrun aesthetic
 */
export class GlitchEffect {
    /**
     * Creates a new glitch effect
     * @param {Object} options - Effect options
     * @param {PIXI.DisplayObject} options.target - The target object to apply the effect to
     * @param {Function} options.onComplete - Callback when effect is complete
     * @param {number} options.duration - Duration of the effect in milliseconds
     * @param {PIXI.Application} options.app - The PIXI application
     */
    constructor(options = {}) {
        this.target = options.target;
        this.onComplete = options.onComplete || (() => {});
        this.duration = options.duration || 1000;
        this.app = options.app;
        this.startTime = performance.now();
        this.isActive = true;
        
        // Create container for effect
        this.container = new PIXI.Container();
        this.container.position.set(this.target.x, this.target.y);
        
        // Create snapshot of target
        this.createSnapshot();
        
        // Set up animation
        if (this.app) {
            this.tickerCallback = this.update.bind(this);
            this.app.ticker.add(this.tickerCallback);
        }
    }
    
    /**
     * Creates a snapshot of the target
     * @private
     */
    createSnapshot() {
        // If target is a PIXI.Graphics, we need to recreate it
        if (this.target.sprite && this.target.sprite instanceof PIXI.Graphics) {
            // Clone the graphics object
            this.snapshot = new PIXI.Container();
            
            // Get the original graphics
            const originalGraphics = this.target.sprite;
            
            // Create slices for glitch effect
            const numSlices = 10;
            const sliceHeight = originalGraphics.height / numSlices;
            
            // Create renderer if needed
            let renderer = this.app?.renderer;
            if (!renderer) {
                console.warn('No renderer available for snapshot, using simplified effect');
                this.snapshot.addChild(originalGraphics.clone());
                return;
            }
            
            // Create texture from the original graphics
            const texture = renderer.generateTexture(originalGraphics);
            
            // Create slices
            for (let i = 0; i < numSlices; i++) {
                const slice = new PIXI.Sprite(texture);
                slice.y = -originalGraphics.height / 2 + i * sliceHeight;
                slice.anchor.set(0.5, 0);
                slice.height = sliceHeight;
                
                // Store original position
                slice.originalX = 0;
                slice.originalY = slice.y;
                
                this.snapshot.addChild(slice);
            }
        } else if (this.target.sprite instanceof PIXI.Sprite) {
            // For sprites, we can just clone them
            this.snapshot = new PIXI.Container();
            
            // Get the original sprite
            const originalSprite = this.target.sprite;
            const texture = originalSprite.texture;
            
            // Create slices for glitch effect
            const numSlices = 10;
            const sliceHeight = originalSprite.height / numSlices;
            
            // Create slices
            for (let i = 0; i < numSlices; i++) {
                const slice = new PIXI.Sprite(texture);
                slice.y = -originalSprite.height / 2 + i * sliceHeight;
                slice.anchor.set(0.5, 0);
                slice.height = sliceHeight;
                
                // Set crop area
                const cropRect = new PIXI.Rectangle(
                    0, 
                    i * sliceHeight, 
                    texture.width, 
                    sliceHeight
                );
                slice.texture.frame = cropRect;
                
                // Store original position
                slice.originalX = 0;
                slice.originalY = slice.y;
                
                this.snapshot.addChild(slice);
            }
        } else {
            // Fallback for other display objects
            console.warn('Unsupported target type for glitch effect, using simplified effect');
            this.snapshot = new PIXI.Container();
            const graphics = new PIXI.Graphics();
            
            // Draw a placeholder shape
            graphics.beginFill(0xFF00FF);
            graphics.drawCircle(0, 0, 20);
            graphics.endFill();
            
            this.snapshot.addChild(graphics);
        }
        
        // Add snapshot to container
        this.container.addChild(this.snapshot);
        
        // Hide original target
        this.target.visible = false;
        
        // Add container to target's parent
        if (this.target.parent) {
            this.target.parent.addChild(this.container);
        }
    }
    
    /**
     * Updates the effect
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        const now = performance.now();
        const elapsed = now - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // Apply glitch effect
        this.applyGlitchEffect(progress);
        
        // Check if effect is complete
        if (progress >= 1) {
            this.complete();
        }
    }
    
    /**
     * Applies the glitch effect
     * @param {number} progress - Progress of the effect (0-1)
     * @private
     */
    applyGlitchEffect(progress) {
        if (!this.snapshot) return;
        
        // Intensity increases as the effect progresses
        const intensity = progress * 100;
        const slices = this.snapshot.children;
        
        // Apply different effects based on progress
        if (progress < 0.3) {
            // Initial phase: slight glitches
            this.applyPhase1Glitch(slices, intensity, progress);
        } else if (progress < 0.7) {
            // Middle phase: more intense glitches and color shifts
            this.applyPhase2Glitch(slices, intensity, progress);
        } else {
            // Final phase: disintegration
            this.applyPhase3Glitch(slices, intensity, progress);
        }
    }
    
    /**
     * Applies phase 1 glitch effect (slight glitches)
     * @param {Array} slices - Array of slices
     * @param {number} intensity - Effect intensity
     * @param {number} progress - Progress of the effect (0-1)
     * @private
     */
    applyPhase1Glitch(slices, intensity, progress) {
        // Random glitch timing
        const time = performance.now();
        const glitchActive = Math.sin(time / 50) > 0.7;
        
        slices.forEach((slice, index) => {
            // Reset position first
            slice.x = slice.originalX;
            
            // Apply random horizontal offset to some slices
            if (glitchActive && Math.random() < 0.3) {
                const offset = (Math.random() - 0.5) * intensity * 0.5;
                slice.x += offset;
            }
            
            // Apply slight alpha reduction
            slice.alpha = 1 - progress * 0.2;
            
            // Apply color shift
            if (glitchActive && Math.random() < 0.2) {
                slice.tint = Math.random() < 0.5 ? 0xFF00FF : 0x00FFFF;
            } else {
                slice.tint = 0xFFFFFF;
            }
        });
    }
    
    /**
     * Applies phase 2 glitch effect (more intense glitches and color shifts)
     * @param {Array} slices - Array of slices
     * @param {number} intensity - Effect intensity
     * @param {number} progress - Progress of the effect (0-1)
     * @private
     */
    applyPhase2Glitch(slices, intensity, progress) {
        // Normalized progress within this phase (0-1)
        const phaseProgress = (progress - 0.3) / 0.4;
        
        slices.forEach((slice, index) => {
            // More aggressive horizontal offset
            const offset = (Math.random() - 0.5) * intensity;
            slice.x = slice.originalX + offset;
            
            // Random vertical offset
            if (Math.random() < 0.3) {
                slice.y = slice.originalY + (Math.random() - 0.5) * intensity * 0.2;
            }
            
            // Progressive alpha reduction
            slice.alpha = 1 - phaseProgress * 0.5;
            
            // Color shift
            if (Math.random() < 0.5) {
                slice.tint = Math.random() < 0.5 ? 0xFF00FF : 0x00FFFF;
            } else {
                slice.tint = 0xFFFFFF;
            }
            
            // Scale distortion
            if (Math.random() < 0.3) {
                slice.scale.x = 1 + (Math.random() - 0.5) * 0.3;
            } else {
                slice.scale.x = 1;
            }
        });
    }
    
    /**
     * Applies phase 3 glitch effect (disintegration)
     * @param {Array} slices - Array of slices
     * @param {number} intensity - Effect intensity
     * @param {number} progress - Progress of the effect (0-1)
     * @private
     */
    applyPhase3Glitch(slices, intensity, progress) {
        // Normalized progress within this phase (0-1)
        const phaseProgress = (progress - 0.7) / 0.3;
        
        slices.forEach((slice, index) => {
            // Extreme horizontal offset
            const offset = (Math.random() - 0.5) * intensity * 2;
            slice.x = slice.originalX + offset;
            
            // Vertical scatter
            const verticalOffset = (Math.random() - 0.5) * intensity;
            slice.y = slice.originalY + verticalOffset;
            
            // Progressive alpha reduction to zero
            slice.alpha = 1 - phaseProgress;
            
            // Extreme color shift
            slice.tint = Math.random() < 0.5 ? 0xFF00FF : 0x00FFFF;
            
            // Scale distortion
            slice.scale.x = 1 + (Math.random() - 0.5) * phaseProgress;
            
            // Rotation
            slice.rotation = (Math.random() - 0.5) * phaseProgress * 0.5;
        });
        
        // Add particle effect as disintegration progresses
        if (Math.random() < 0.3) {
            this.addDisintegrationParticle();
        }
    }
    
    /**
     * Adds a disintegration particle
     * @private
     */
    addDisintegrationParticle() {
        const particle = new PIXI.Graphics();
        
        // Random particle color
        const color = Math.random() < 0.5 ? 0xFF00FF : 0x00FFFF;
        
        // Draw particle
        particle.beginFill(color, 0.7);
        particle.drawRect(-1, -1, 2, 2);
        particle.endFill();
        
        // Random position
        particle.x = (Math.random() - 0.5) * 40;
        particle.y = (Math.random() - 0.5) * 40;
        
        // Random velocity
        particle.vx = (Math.random() - 0.5) * 5;
        particle.vy = (Math.random() - 0.5) * 5;
        
        // Add to container
        this.container.addChild(particle);
        
        // Animate particle
        const animate = () => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.05;
            
            if (particle.alpha <= 0) {
                this.container.removeChild(particle);
                this.app.ticker.remove(animate);
            }
        };
        
        this.app.ticker.add(animate);
    }
    
    /**
     * Completes the effect
     * @private
     */
    complete() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Remove ticker callback
        if (this.app && this.tickerCallback) {
            this.app.ticker.remove(this.tickerCallback);
        }
        
        // Remove container
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        
        // Call onComplete callback
        this.onComplete();
    }
    
    /**
     * Stops the effect immediately
     */
    stop() {
        this.complete();
    }
}
