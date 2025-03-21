
export class Player {
    constructor({ x, y }) {
        // Position and movement
        this.x = x;
        this.y = y;
        this.speed = 0.005;
        this.size = 1;
        
        // Path finding
        this.currentPath = null;
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.targetReachThreshold = 0.1;
        
        // Sprite and animation properties
        this.width = 64;
        this.height = 64;
        this.spriteSheet = new Image();
        this.imageLoaded = false; // Add flag to track image loading state
        
        // Animation states
        this.states = {
            idle_down: 0,
            idle_up: 1,
            idle_left: 2,
            idle_right: 3,
            walk_down: 4,
            walk_up: 5,
            walk_left: 6,
            walk_right: 7
        };
        
        this.currentState = 'idle_down';
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 0;
        this.animationSpeed = 8;
        this.direction = 'down';
        
        // Set up image loading
        this.spriteSheet.onload = () => {
            console.log('Player sprite sheet loaded successfully');
            this.imageLoaded = true;
        };
        
        this.spriteSheet.onerror = (error) => {
            console.error('Failed to load player sprite sheet:', error);
            this.imageLoaded = false;
        };
        
        // Make sure this path matches your project structure
        this.spriteSheet.src = './assets/characters/main_character.png';

        // Enhanced shadow properties
        this.shadowOffset = 4; // Reduced from 8
        this.shadowSize = {
            width: 32, // Reduced from 40
            height: 10  // Reduced from 15
        };
        this.shadowColor = 'rgba(0, 0, 0, 0.4)'; // Slightly increased opacity
        
        // Terrain-related properties
        this.terrainHeight = 0;
        this.terrainAngle = 0;
        this.baseHeight = y; // Store the base height for reference

        console.log('Player created at:', x, y);
    }

    setPath(path) {
        if (!path || path.length === 0) {
            console.log('Invalid path provided');
            return;
        }

        this.currentPath = path;
        this.currentPathIndex = 0;
        this.isMoving = true;
    }

    update(deltaTime) {
        // Update animation
        this.frameCount++;
        if (this.frameCount >= this.animationSpeed) {
            this.frameX = (this.frameX + 1) % 12;
            this.frameCount = 0;
        }

        if (!this.isMoving || !this.currentPath || this.currentPathIndex >= this.currentPath.length) {
            this.currentState = `idle_${this.direction}`;
            return;
        }

        const targetPos = this.currentPath[this.currentPathIndex];
        if (!targetPos) {
            this.isMoving = false;
            this.currentPath = null;
            return;
        }

        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.targetReachThreshold) {
            this.currentPathIndex++;
            
            if (this.currentPathIndex >= this.currentPath.length) {
                this.currentPath = null;
                this.isMoving = false;
                console.log('Reached destination');
                return;
            }
        } else {
            const moveDistance = this.speed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            
            this.x += dx * ratio;
            this.y += dy * ratio;
            
            // Update direction and animation state based on movement
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            this.currentState = `walk_${this.direction}`;
            
        }

        // Update frame row based on current state
        this.frameY = this.states[this.currentState];
    }

    render(ctx) {
        ctx.save();
        
        // Convert world coordinates to isometric coordinates
        const isoX = (this.x - this.y) * (64 / 2);
        const isoY = (this.x + this.y) * (32 / 2);
        
        // Draw shadow with terrain angle consideration
        ctx.save();
        
        // Move to shadow position
        ctx.translate(isoX, isoY + this.shadowOffset);
        
        // Apply terrain angle rotation
        ctx.rotate(this.terrainAngle);
        
        // Draw the shadow
        ctx.beginPath();
        ctx.ellipse(
            0, 0, // Center point (already translated)
            this.shadowSize.width / 2,
            this.shadowSize.height / 2,
            0, // Additional rotation (not needed since we rotated the context)
            0,
            Math.PI * 2
        );
        ctx.fillStyle = this.shadowColor;
        ctx.fill();
        
        ctx.restore();
        
        // Draw sprite only if image is loaded
        if (this.imageLoaded) {
            // Calculate vertical offset based on terrain height
            const heightOffset = this.terrainHeight - this.baseHeight;
            
            ctx.drawImage(
                this.spriteSheet,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                isoX - this.width/2,
                isoY - this.height/2 + heightOffset,
                this.width,
                this.height
            );
        } else {
            // Fallback rendering
            ctx.beginPath();
            ctx.arc(isoX, isoY, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.closePath();
        }

        // Draw path if it exists
        if (this.currentPath && this.isMoving) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 0.2;
            ctx.beginPath();
            ctx.moveTo(isoX, isoY);
            
            for (let i = this.currentPathIndex; i < this.currentPath.length; i++) {
                const pathIsoX = (this.currentPath[i].x - this.currentPath[i].y) * (64 / 2);
                const pathIsoY = (this.currentPath[i].x + this.currentPath[i].y) * (32 / 2);
                ctx.lineTo(pathIsoX, pathIsoY);
            }
            
            ctx.stroke();
        }
        
        ctx.restore();
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    // Update terrain information
    updateTerrainInfo(height, angle) {
        this.terrainHeight = height;
        this.terrainAngle = angle;
        this.updateShadow();
    }

    // Updated shadow calculations
    updateShadow() {
        // Calculate height difference between player and terrain
        const heightDifference = Math.max(0, this.y - this.terrainHeight);
        
        // Update shadow offset based on height difference
        this.shadowOffset = 4 + heightDifference * 0.3; // Reduced multiplier from 0.5
        
        // Scale shadow based on height with tighter constraints
        const scale = Math.max(0.4, 1 - heightDifference / 250);
        this.shadowSize.width = 32 * scale;
        this.shadowSize.height = 10 * scale;
        
        // Adjust shadow opacity based on height
        const opacity = Math.max(0.2, 0.4 * scale);
        this.shadowColor = `rgba(0, 0, 0, ${opacity})`;
    }

    // Example method to test shadow effects
    testShadowEffects() {
        // Simulate terrain changes
        const terrainHeight = Math.sin(Date.now() / 1000) * 50; // Oscillating height
        const terrainAngle = Math.sin(Date.now() / 1500) * 0.2; // Oscillating angle
        this.updateTerrainInfo(terrainHeight, terrainAngle);
    }
}







