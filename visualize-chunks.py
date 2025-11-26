import json

# Simulate the chunk loading system
TILE_SIZE = 48
CHUNK_SIZE_TILES = 37
CHUNK_SIZE_PIXELS = 37 * 48  # 1776

print("="*60)
print("CHUNK SYSTEM VISUALIZATION")
print("="*60)
print()

# Load chunk1 to verify its actual structure
chunk1_path = r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk1.ldtk'
with open(chunk1_path) as f:
    data = json.load(f)
    level = data['levels'][0]

    print(f"Chunk1.ldtk level data:")
    print(f"  Level size: {level['pxWid']}x{level['pxHei']} pixels")
    print(f"  Expected: {CHUNK_SIZE_PIXELS}x{CHUNK_SIZE_PIXELS} pixels")
    print(f"  Match: {level['pxWid'] == CHUNK_SIZE_PIXELS and level['pxHei'] == CHUNK_SIZE_PIXELS}")
    print()

# Simulate chunk positioning
print("Chunk positioning simulation:")
print()

test_cases = [
    (0, 0, "Spawn chunk"),
    (1, 0, "East of spawn"),
    (0, 1, "South of spawn"),
    (-1, 0, "West of spawn"),
    (0, -1, "North of spawn"),
]

for chunkX, chunkY, label in test_cases:
    worldX = chunkX * CHUNK_SIZE_PIXELS
    worldY = chunkY * CHUNK_SIZE_PIXELS

    endX = worldX + CHUNK_SIZE_PIXELS
    endY = worldY + CHUNK_SIZE_PIXELS

    print(f"Chunk ({chunkX:2d},{chunkY:2d}) - {label:15s}")
    print(f"  Position: ({worldX:6d}, {worldY:6d})")
    print(f"  Coverage: X=[{worldX:6d}, {endX:6d}), Y=[{worldY:6d}, {endY:6d})")
    print()

# Check for overlaps
print("="*60)
print("OVERLAP CHECK")
print("="*60)
print()

chunk_00_x = (0, 1776)
chunk_10_x = (1776, 3552)

print(f"Chunk (0,0) X range: [{chunk_00_x[0]}, {chunk_00_x[1]})")
print(f"Chunk (1,0) X range: [{chunk_10_x[0]}, {chunk_10_x[1]})")
print(f"Do they overlap? {chunk_00_x[1] > chunk_10_x[0] and chunk_10_x[0] < chunk_00_x[1]}")
print(f"Gap between them: {chunk_10_x[0] - chunk_00_x[1]} pixels")
print()

print("Expected: No overlap (gap = 0)")
print("If chunks ARE overlapping, the issue is NOT in the positioning math!")
print()

print("="*60)
print("POSSIBLE ROOT CAUSES")
print("="*60)
print()
print("1. Tilemap creation issue:")
print("   - Tilemap created with width=37, height=37")
print("   - But is Phaser interpreting this correctly?")
print()
print("2. Tilemap layer positioning issue:")
print("   - createBlankLayer(name, tileset, worldX, worldY)")
print("   - Is worldX/worldY being used as expected?")
print()
print("3. Tile placement issue:")
print("   - putTileAt(frameIndex, tileX, tileY)")
print("   - Are tiles being placed at correct grid positions?")
print()
print("4. Different layers have different sizes:")
print("   - Not all layers might be 37x37")
print("   - Need to check each layer's __cWid and __cHei")
print()

# Check all layers in chunk1
print("="*60)
print("LAYER ANALYSIS FOR CHUNK1")
print("="*60)
print()

for layer in level['layerInstances']:
    if layer['__type'] not in ['Tiles', 'IntGrid']:
        continue

    print(f"Layer: {layer['__identifier']}")
    print(f"  Type: {layer['__type']}")
    print(f"  Grid size: {layer['__gridSize']}px")
    print(f"  Dimensions: {layer['__cWid']}x{layer['__cHei']} cells")
    print(f"  Pixel size: {layer['__cWid'] * layer['__gridSize']}x{layer['__cHei'] * layer['__gridSize']}px")

    # Check if this matches expected
    expected_width = level['pxWid']
    expected_height = level['pxHei']
    actual_width = layer['__cWid'] * layer['__gridSize']
    actual_height = layer['__cHei'] * layer['__gridSize']

    if actual_width != expected_width or actual_height != expected_height:
        print(f"  ⚠️  MISMATCH! Expected {expected_width}x{expected_height}px")
    else:
        print(f"  ✅ Matches level size")
    print()
