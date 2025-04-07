# Isometric Game Engine

A lightweight, performance-focused isometric game engine built with PixiJS.

## Features

- WebGL-based rendering for optimal performance
- Object pooling to minimize garbage collection
- Efficient texture atlas system
- Component-based entity system
- Isometric world with tile-based grid
- Camera controls with zoom and pan
- Debug tools for performance monitoring
- Day/night cycle with lighting effects
- Inventory system with items and equipment
- Character system with health and energy
- Structure system for buildings and objects
- Simple UI system with panels and buttons

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd iso
npm install
```

### Running the Development Server

```bash
npm start
```

This will start a development server at http://localhost:3000.

## Controls

- **WASD**: Move camera
- **QE**: Zoom in/out
- **Left Click**: Select tile
- **Right Click**: Move player to tile
- **Shift+Click**: Place house
- **T**: Place tree
- **R**: Place rock
- **F**: Place item
- **X**: Place enemy
- **I**: Toggle inventory
- **P**: Pause/resume time
- **Shift+T**: Toggle time speed

## Project Structure

```
iso/
├── src/
│   ├── assets/       # Game assets (textures, sounds, etc.)
│   ├── core/         # Core game systems
│   ├── entities/     # Entity classes
│   ├── rendering/    # Rendering systems
│   ├── utils/        # Utility classes
│   └── index.js      # Main entry point
├── index.html        # HTML entry point
├── package.json      # Project dependencies
└── vite.config.js    # Vite configuration
```

## Memory Management

The engine uses object pooling to minimize garbage collection pauses:

```javascript
// Create an entity pool
const characterPool = new EntityPool(Character, {
    initialSize: 20,
    maxSize: 100
});

// Get an entity from the pool
const character = characterPool.create({
    x: 100,
    y: 100,
    tags: ['enemy', 'mobile']
});

// Return entity to the pool when done
characterPool.release(character);
```

## Performance Optimization

- Texture atlas for batched rendering
- Entity pooling for reduced GC pauses
- Efficient isometric calculations
- Visibility culling for off-screen entities


## License

MIT
