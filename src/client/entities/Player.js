class Player {
  constructor(context, x, y) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.width = 64;  // Width of a single frame
    this.height = 64; // Height of a single frame
    
    // Sprite setup
    this.spriteSheet = new Image();
    this.spriteSheet.src = '/client/assets/characters/main_character.png';
    
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
    
    // Animation properties
    this.currentState = 'idle_down';
    this.frameX = 0;        // Current frame in animation sequence (0-11)
    this.frameY = 0;        // Current animation state row (0-7)
    this.frameCount = 0;    // Counter for animation timing
    this.animationSpeed = 8; // Frames to wait before next animation frame
    
    // Movement properties
    this.speed = 5;
    this.moving = false;
    this.direction = 'down';
  }

  update(deltaTime) {
    // Update animation frame
    this.frameCount++;
    if (this.frameCount >= this.animationSpeed) {
      this.frameX = (this.frameX + 1) % 12; // Loop through 12 frames
      this.frameCount = 0;
    }

    // Update frame row based on state
    this.frameY = this.states[this.currentState];
  }

  draw() {
    this.context.drawImage(
      this.spriteSheet,
      this.frameX * this.width,    // Source X
      this.frameY * this.height,   // Source Y
      this.width,                  // Source width
      this.height,                 // Source height
      this.x - this.width/2,       // Destination X (centered)
      this.y - this.height/2,      // Destination Y (centered)
      this.width,                  // Destination width
      this.height                  // Destination height
    );
  }

  move(dx, dy) {
    this.x += dx * this.speed;
    this.y += dy * this.speed;
    
    // Update animation state based on movement
    if (dx === 0 && dy === 0) {
      this.currentState = `idle_${this.direction}`;
      this.moving = false;
    } else {
      // Determine direction based on movement
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.direction = dy > 0 ? 'down' : 'up';
      }
      this.currentState = `walk_${this.direction}`;
      this.moving = true;
    }
  }

  setState(state) {
    if (this.states[state] !== undefined) {
      this.currentState = state;
      this.frameX = 0; // Reset animation to first frame
    }
  }
}

export default Player;