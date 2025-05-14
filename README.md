# Isometric Game Engine Monorepo

A monorepo for isometric game engine projects built with PixiJS.

## Projects

### Core Library (@iso-game/core)

The core library contains shared components for isometric game development:

- WebGL-based rendering with PixiJS
- Isometric world with tile-based grid and chunk management
- Component-based entity system
- Building placement and construction systems
- UI components with a cyberpunk aesthetic
- Camera controls with zoom and pan
- Performance monitoring and optimization
- Day/night cycle
- Inventory and character systems
- Structure system for buildings and objects

### Isometric PoC (@iso-game/isometric-poc)

The original proof of concept isometric game that demonstrates the core library's capabilities.

### Prison Tycoon (@iso-game/prison-tycoon)

An isometric prison tycoon game built on top of the core library.

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

### Development

To start the development server for the isometric PoC:

```bash
npm run start:poc
```

To start the development server for the prison tycoon game:

```bash
npm run start:prison
```

### Building

To build the isometric PoC:

```bash
npm run build:poc
```

To build the prison tycoon game:

```bash
npm run build:prison
```

## Project Structure

```
iso/
├── packages/
│   ├── core/                  # Shared core functionality
│   │   ├── src/
│   │   │   ├── rendering/     # Rendering systems
│   │   │   ├── entities/      # Entity system
│   │   │   ├── ui/            # UI components
│   │   │   └── utils/         # Utility functions
│   │   └── package.json
│   │
│   ├── isometric-poc/         # Original PoC game
│   │   ├── src/
│   │   │   ├── game-specific/ # PoC-specific code
│   │   │   └── index.js       # Entry point
│   │   └── package.json
│   │
│   └── prison-tycoon/         # Prison tycoon game
│       ├── src/
│       │   ├── game/          # Game-specific code
│       │   ├── ui/            # UI components
│       │   └── index.js       # Entry point
│       └── package.json
│
└── package.json               # Root package.json
```
