# LDtk Integration Guide for KLYRA

## What is LDtk?

LDtk (Level Designer Toolkit) is a modern, user-friendly 2D level editor created by the developer of Dead Cells. It's **much easier to use than Tiled** and includes powerful features like auto-layers, which automatically decorate your terrain.

- **Download:** https://ldtk.io/
- **Free & Open Source** (MIT License)
- **Cross-platform:** Windows, macOS, Linux

---

## Why LDtk over Tiled?

✅ **Better UX** - Clean, modern interface
✅ **Auto-layers** - Terrain automatically decorates itself
✅ **Entities** - Easy placement of NPCs, doors, spawn points
✅ **Faster workflow** - Less clicking, more creating
✅ **JSON format** - Easy to parse and extend

---

## Setup Instructions

### 1. Install LDtk

1. Download LDtk from https://ldtk.io/
2. Install and launch the application
3. Create a new project or open an existing one

### 2. Configure Your Project

#### Tile Size
- KLYRA uses **32x32 game tiles** (scaled from 48x48 source tiles)
- Set your LDtk grid size to **48** (to match your source tilesets)

#### Import Tilesets

LDtk can use your existing tileset images. Import these tilesets:

```
assets/A2 - Terrain And Misc.png
assets/Fantasy_Outside_A5.png
assets/a2_terrain_base.png
assets/A1 - Liquids And Misc.png
assets/A3 - Walls And Floors.png
assets/A4 - Walls.png
assets/Fantasy_door1.png
assets/Fantasy_door2.png
assets/Gate_Cathedral1.png
assets/Fantasy_Outside_D.png
assets/Fantasy_Outside_C.png
assets/A2_extended_forest_terrain.png
assets/Big_Trees_red.png
assets/Fantasy_Outside_D_red.png
assets/Fantasy_Roofs.png
assets/Fantasy_Outside_B.png
```

---

## Creating a Town Map

### Step 1: Create Layers

LDtk supports different layer types:

1. **Tiles Layer** - Standard tile layer (ground, decorations)
2. **Auto Layer** - Automatically decorates based on rules
3. **IntGrid Layer** - For collision/logic (invisible in-game)
4. **Entities Layer** - For NPCs, doors, spawn points

#### Recommended Layer Structure (bottom to top):
1. `Ground` - Base terrain (Tiles)
2. `Water` - Water tiles (Tiles or Auto Layer)
3. `Walkway` - Paths and roads (Tiles)
4. `Walls` - Building walls (Tiles)
5. `Collision` - Collision areas (IntGrid)
6. `Decorations` - Trees, rocks, etc. (Tiles or Auto Layer)
7. `Roofs` - Building roofs (Tiles)
8. `Entities` - NPCs, doors, spawns (Entities)

### Step 2: Paint Your Map

- Use the **Tile Layer** tool to manually place tiles
- Use the **Auto Layer** feature to let LDtk decorate terrain automatically
- Use the **IntGrid** for collision areas (mark which areas block movement)

### Step 3: Add Entities

Create entity definitions for:
- **NPC** - Non-player characters
- **Door** - Teleport/transition points
- **SpawnPoint** - Player spawn locations
- **MerchantNPC** - Shop NPCs

Add custom fields to entities:
- `npcType` (String) - "merchant", "trainer", etc.
- `destination` (String) - For doors, where they lead
- `dialogue` (String) - NPC dialogue text

### Step 4: Export

LDtk automatically saves your map as a `.ldtk` JSON file.

**Save your map to:**
```
game/assets/ldtk/town.ldtk
```

---

## Loading LDtk Maps in KLYRA

### In GameScene.js preload():

```javascript
// Load LDtk map
this.load.json('townLDtk', 'assets/ldtk/town.ldtk');
```

### In GameScene.js create():

```javascript
// Load LDtk town map
const worldCenterX = (WORLD_SIZE / 2) * tileSize;
const worldCenterY = (WORLD_SIZE / 2) * tileSize;

const townMapData = this.loadLDtkMap('townLDtk', worldCenterX, worldCenterY, 32);

if (townMapData) {
    console.log('✅ Town map loaded!');
    console.log('Layers:', townMapData.layers.length);
    console.log('Entities:', townMapData.entities.length);

    // Access entities (NPCs, doors, etc.)
    townMapData.entities.forEach(entity => {
        if (entity.identifier === 'NPC') {
            // Spawn NPC at entity.x, entity.y
            console.log('NPC found:', entity.fields);
        } else if (entity.identifier === 'Door') {
            // Create door at entity.x, entity.y
            console.log('Door found:', entity.fields);
        }
    });
}
```

---

## LDtk Map Properties

### townMapData object structure:

```javascript
{
    level: {},           // Raw LDtk level data
    layers: [],          // Array of Phaser containers for each layer
    entities: [],        // Array of entity objects
    offset: { x, y },    // Map position in world
    size: { width, height } // Map dimensions in pixels
}
```

### Entity object structure:

```javascript
{
    identifier: 'NPC',   // Entity type
    x: 16400,            // World X position (pixels)
    y: 16200,            // World Y position (pixels)
    width: 32,           // Entity width
    height: 32,          // Entity height
    fields: {            // Custom fields you defined
        npcType: 'merchant',
        dialogue: 'Welcome!'
    },
    tags: []             // Entity tags
}
```

---

## Tips & Tricks

### Auto-Layers
- Use Auto-Layers for terrain decoration (grass, flowers, rocks)
- Define rules like "place grass on dirt edges"
- Saves tons of manual work!

### IntGrid for Collision
- Paint collision areas in an IntGrid layer
- Use value `1` for walls, `0` for walkable
- Check collision in your game code

### Entities for NPCs
- Place all NPCs, doors, and interactive objects as entities
- Much easier than hardcoding coordinates
- Easier to move and redesign towns

### Layer Depths
- LDtk layers are automatically assigned depths based on their order
- Bottom layers = lower depth (rendered first)
- Top layers = higher depth (rendered last)

---

## Example: Creating a Simple Town

1. **Open LDtk** and create a new project
2. **Set grid size** to 48x48
3. **Import tilesets** (use the ones listed above)
4. **Create layers:**
   - Ground (Tiles)
   - Buildings (Tiles)
   - Roofs (Tiles)
   - NPCs (Entities)
5. **Paint the ground** with terrain tiles
6. **Add buildings** using wall and floor tiles
7. **Add roofs** on top of buildings
8. **Place NPCs** using the Entity tool
9. **Save** your file to `game/assets/ldtk/town.ldtk`
10. **Load in KLYRA** using the code above

---

## Troubleshooting

### "LDtkLoader not found"
- Make sure `game/js/utils/LDtkLoader.js` is included in `game/index.html`
- Check the browser console for script loading errors

### "Texture not found"
- Ensure all tilesets are loaded in `preload()`
- Check that tileset names in LDtk match your Phaser texture keys
- See `getPhaserTextureKey()` in `LDtkLoader.js` for the mapping

### Tiles not appearing
- Check that layer opacity is 100% in LDtk
- Ensure tiles are using the correct tileset
- Verify tiles have been placed (not just grid cells)

### Entities not spawning
- Check entity coordinates are within the map bounds
- Verify entity identifiers match what your code expects
- Check entity fields are properly defined

---

## Next Steps

1. **Download LDtk** from https://ldtk.io/
2. **Create your first town map**
3. **Export and load it in KLYRA**
4. **Add NPCs and entities**
5. **Enjoy a much better level editor than Tiled!** 🎉

---

## Resources

- **LDtk Official Site:** https://ldtk.io/
- **LDtk Documentation:** https://ldtk.io/docs/
- **LDtk JSON Format:** https://ldtk.io/json/
- **LDtk GitHub:** https://github.com/deepnight/ldtk

---

**Happy Mapping! 🗺️**
