// KLYRA GAME CONSTANTS

const CONSTANTS = {
    // Server Configuration
    SERVER_URL: 'wss://klyra-server.onrender.com',
    SERVER_URL_DEV: 'ws://localhost:2567',
    ROOM_NAME: 'klyra',
    
    // Canvas & Rendering
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    TARGET_FPS: 60,
    
    // Tile System
    TILE_SIZE: 16,
    CHUNK_SIZE: 16, // 16x16 tiles per chunk
    RENDER_DISTANCE: 3, // Chunks to render around player
    
    // Player
    PLAYER_SIZE: 16,
    PLAYER_SPEED: 3, // pixels per frame
    PLAYER_SPAWN_X: 500,
    PLAYER_SPAWN_Y: 500,
    
    // Animation
    ANIM_SPEED: 0.15,
    ANIM_FRAMES: 4,
    
    // Camera
    CAMERA_SMOOTHING: 0.1,
    CAMERA_DEADZONE: 50,
    
    // World Generation
    WORLD_SEED_MAX: 999999999,
    BIOME_SCALE: 0.05,
    TERRAIN_OCTAVES: 4,
    
    // Network
    NETWORK_TICK_RATE: 20, // Updates per second
    POSITION_SYNC_THRESHOLD: 5, // Pixels difference before syncing
    
    // Input
    KEY_UP: ['KeyW', 'ArrowUp'],
    KEY_DOWN: ['KeyS', 'ArrowDown'],
    KEY_LEFT: ['KeyA', 'ArrowLeft'],
    KEY_RIGHT: ['KeyD', 'ArrowRight'],
    KEY_INTERACT: ['KeyE', 'Space'],
    KEY_ATTACK: ['Mouse0', 'KeyF'],
    KEY_DEBUG: ['Backquote'],
    
    // Colors (for procedural generation)
    COLORS: {
        GRASS: '#4a7c3e',
        DIRT: '#8b6f47',
        STONE: '#6b6b6b',
        WATER: '#3498db',
        SAND: '#f4d03f',
        FOREST: '#2d5016',
        SNOW: '#ecf0f1',
        LAVA: '#e74c3c',
        ROAD: '#95a5a6'
    },
    
    // Tile Types
    TILES: {
        VOID: 0,
        GRASS: 1,
        DIRT: 2,
        STONE: 3,
        WATER: 4,
        SAND: 5,
        FOREST: 6,
        SNOW: 7,
        WALL: 8,
        FLOOR: 9,
        DOOR: 10,
        ROAD: 11
    },
    
    // Collision Layers
    COLLISION: {
        NONE: 0,
        SOLID: 1,
        WATER: 2,
        INTERACT: 3
    },
    
    // Debug
    DEBUG_MODE: false,
    SHOW_FPS: true,
    SHOW_GRID: false,
    SHOW_COLLISION: false
};

// Utility Functions
const UTILS = {
    // Check if point is within bounds
    inBounds(x, y, width, height) {
        return x >= 0 && x < width && y >= 0 && y < height;
    },
    
    // Convert world coordinates to tile coordinates
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / CONSTANTS.TILE_SIZE),
            y: Math.floor(worldY / CONSTANTS.TILE_SIZE)
        };
    },
    
    // Convert tile coordinates to world coordinates
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * CONSTANTS.TILE_SIZE,
            y: tileY * CONSTANTS.TILE_SIZE
        };
    },
    
    // Get chunk coordinates from world position
    worldToChunk(worldX, worldY) {
        const chunkSizePixels = CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        return {
            x: Math.floor(worldX / chunkSizePixels),
            y: Math.floor(worldY / chunkSizePixels)
        };
    },
    
    // Generate chunk key for storage
    chunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    },
    
    // Lerp for smooth movement
    lerp(start, end, amount) {
        return start + (end - start) * amount;
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Distance between two points
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Normalize vector
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return {
            x: x / length,
            y: y / length
        };
    },
    
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Random float between min and max
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Seeded random number generator (for procedural generation)
    seededRandom(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    },
    
    // Simple noise function (for terrain generation)
    simpleNoise(x, y, seed) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
        return n - Math.floor(n);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONSTANTS, UTILS };
}
