# Biome Chunk Overlap Investigation

## Problem
Biome chunks are appearing overlapped/on top of each other instead of being positioned adjacent to each other in the game world.

## Analysis

### Chunk Configuration
- All chunks are standardized to 1776x1776 pixels (37x37 tiles at 48px per tile)
- Verified in .ldtk files: chunk1 through chunk5 are all 1776x1776
- All layers within each chunk are 37x37 cells

### Positioning Math
The chunk positioning calculations are CORRECT:

```javascript
// In loadChunk(chunkX, chunkY):
const worldX = chunkX * this.CHUNK_SIZE_PIXELS;  // chunkX * 1776
const worldY = chunkY * this.CHUNK_SIZE_PIXELS;  // chunkY * 1776
```

Expected positions:
- Chunk (0,0): X=[0, 1776), Y=[0, 1776)
- Chunk (1,0): X=[1776, 3552), Y=[0, 1776)
- Chunk (0,1): X=[0, 1776), Y=[1776, 3552)

These ranges do NOT overlap - they are perfectly adjacent.

### Rendering System

The issue is likely in how the Phaser tilemap is being created and positioned.

#### Current Implementation (lines 301-377):
```javascript
// For EACH layer in the chunk:
const map = this.scene.make.tilemap({
    tileWidth: tileset.tileGridSize,  // 48
    tileHeight: tileset.tileGridSize, // 48
    width: 37,   // HARDCODED
    height: 37   // HARDCODED
});

const tilemapLayer = map.createBlankLayer(
    layer.__identifier,
    tilesetImage,
    worldX,  // e.g., 0, 1776, 3552, ...
    worldY   // e.g., 0, 1776, 3552, ...
);
```

## Root Cause Hypothesis

The problem is likely one of these:

###  Hypothesis 1: Layer Name Collision
Each layer in the .ldtk file has a name like "Base_baked", "Grass_baked", etc.
If multiple CHUNKS are being loaded, and they all have layers with the SAME names,
Phaser might be reusing the same tilemap layer object, causing all chunks to render
to the same layer.

**Fix**: Make layer names unique per chunk by appending chunk coordinates:
```javascript
const uniqueLayerName = `${layer.__identifier}_${chunkX}_${chunkY}`;
const tilemapLayer = map.createBlankLayer(uniqueLayerName, tilesetImage, worldX, worldY);
```

### Hypothesis 2: Tilemap Not Respecting Position
The `createBlankLayer(name, tileset, x, y)` function might not be positioning
the tilemap layer at (x, y) as expected.

**Test**: Add console.log to verify tilemapLayer.x and tilemapLayer.y after creation

### Hypothesis 3: Shared Tilemap Object
A new `map` object is created for each layer, but maybe this is causing issues.
Multiple tilemaps all trying to render at different positions but conflicting.

**Fix**: Create ONE tilemap per chunk (not per layer), then create multiple layers
within that single tilemap.

## Recommended Fix

The most likely issue is **Hypothesis 1** - layer name collisions causing all chunks
to render to the same visual layer objects.

### Files to Modify
- `C:\klyra\game\js\systems\BiomeChunkSystem.js`

### Changes Needed
Line 377 (and similar for roof layers):
```javascript
// OLD (causes name collisions):
const tilemapLayer = map.createBlankLayer(layer.__identifier, tilesetImage, worldX, worldY);

// NEW (unique names per chunk):
const uniqueLayerName = `${layer.__identifier}_chunk_${chunkX}_${chunkY}`;
const tilemapLayer = map.createBlankLayer(uniqueLayerName, tilesetImage, worldX, worldY);
```

This ensures that each chunk's layers have unique names and won't conflict with
other chunks' layers.

## Testing
After fix, verify:
1. Multiple chunks load without overlapping
2. Chunks appear adjacent to each other (not on top)
3. No gaps between chunks
4. Chunk transitions are seamless
