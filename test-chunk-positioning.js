// Simulate chunk positioning logic

const TILE_SIZE = 48;
const CHUNK_SIZE_TILES = 37;
const CHUNK_SIZE_PIXELS = 37 * 48; // = 1776 pixels

console.log("Chunk system constants:");
console.log(`  TILE_SIZE: ${TILE_SIZE}px`);
console.log(`  CHUNK_SIZE_TILES: ${CHUNK_SIZE_TILES} tiles`);
console.log(`  CHUNK_SIZE_PIXELS: ${CHUNK_SIZE_PIXELS}px`);
console.log();

// Test positioning for a 3x3 grid around spawn
const playerX = 888; // Center of spawn chunk (half of 1776)
const playerY = 888;

const playerChunkX = Math.floor(playerX / CHUNK_SIZE_PIXELS);
const playerChunkY = Math.floor(playerY / CHUNK_SIZE_PIXELS);

console.log(`Player position: (${playerX}, ${playerY})`);
console.log(`Player chunk: (${playerChunkX}, ${playerChunkY})`);
console.log();

console.log("3x3 chunk grid positions:");
for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
        const chunkX = playerChunkX + dx;
        const chunkY = playerChunkY + dy;
        const worldX = chunkX * CHUNK_SIZE_PIXELS;
        const worldY = chunkY * CHUNK_SIZE_PIXELS;

        console.log(`  Chunk (${chunkX},${chunkY}): worldX=${worldX}, worldY=${worldY}`);
    }
}
console.log();

// Check if chunks would overlap
console.log("Chunk boundaries:");
console.log(`  Chunk (0,0): X [0, 1776), Y [0, 1776)`);
console.log(`  Chunk (1,0): X [1776, 3552), Y [0, 1776)`);
console.log(`  Chunk (0,1): X [0, 1776), Y [1776, 3552)`);
console.log(`  Chunk (1,1): X [1776, 3552), Y [1776, 3552)`);
console.log();

// The key issue: What are the actual tilemap dimensions?
console.log("CRITICAL: Tilemap creation:");
console.log(`  When creating tilemap with width=37, height=37`);
console.log(`  Each tile is ${TILE_SIZE}px`);
console.log(`  Expected tilemap size: ${37 * TILE_SIZE}px = ${37 * 48}px`);
console.log();
console.log("But if the tilemap is using a DIFFERENT tile size internally...");
console.log("  OR if it's calculating size differently, chunks will overlap!");
