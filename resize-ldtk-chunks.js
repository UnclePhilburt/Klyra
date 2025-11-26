// Script to resize chunk4 and chunk5 from 2400x2400 to 1776x1776 pixels
const fs = require('fs');
const path = require('path');

const TARGET_SIZE = 1776; // 37 tiles * 48 pixels
const TILE_SIZE = 48;
const TARGET_TILES = 37;

function resizeChunk(filePath) {
    console.log(`\n📏 Resizing ${path.basename(filePath)}...`);

    // Read the LDtk file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.levels || data.levels.length === 0) {
        console.error(`❌ No levels found in ${filePath}`);
        return;
    }

    const level = data.levels[0];
    const oldWidth = level.pxWid;
    const oldHeight = level.pxHei;

    console.log(`   Current size: ${oldWidth}x${oldHeight} pixels`);
    console.log(`   Target size: ${TARGET_SIZE}x${TARGET_SIZE} pixels`);

    // Update level dimensions
    level.pxWid = TARGET_SIZE;
    level.pxHei = TARGET_SIZE;

    // Process each layer
    if (level.layerInstances) {
        level.layerInstances.forEach(layer => {
            console.log(`   Processing layer: ${layer.__identifier}`);

            // Update layer dimensions
            layer.pxTotalOffsetX = 0;
            layer.pxTotalOffsetY = 0;
            layer.cWid = TARGET_TILES;
            layer.cHei = TARGET_TILES;

            // Filter tiles to only keep those within the new bounds
            if (layer.gridTiles) {
                const originalCount = layer.gridTiles.length;
                layer.gridTiles = layer.gridTiles.filter(tile => {
                    return tile.px[0] < TARGET_SIZE && tile.px[1] < TARGET_SIZE;
                });
                console.log(`      gridTiles: ${originalCount} → ${layer.gridTiles.length} (removed ${originalCount - layer.gridTiles.length})`);
            }

            if (layer.autoLayerTiles) {
                const originalCount = layer.autoLayerTiles.length;
                layer.autoLayerTiles = layer.autoLayerTiles.filter(tile => {
                    return tile.px[0] < TARGET_SIZE && tile.px[1] < TARGET_SIZE;
                });
                console.log(`      autoLayerTiles: ${originalCount} → ${layer.autoLayerTiles.length} (removed ${originalCount - layer.autoLayerTiles.length})`);
            }

            // Update intGrid if present
            if (layer.intGridCsv && layer.intGridCsv.length > 0) {
                // Reshape intGrid from old size to new size
                const oldTilesWide = Math.floor(oldWidth / TILE_SIZE);
                const newTilesWide = TARGET_TILES;
                const newGrid = [];

                for (let y = 0; y < TARGET_TILES; y++) {
                    for (let x = 0; x < TARGET_TILES; x++) {
                        const oldIndex = y * oldTilesWide + x;
                        newGrid.push(layer.intGridCsv[oldIndex] || 0);
                    }
                }

                layer.intGridCsv = newGrid;
                console.log(`      intGridCsv: ${layer.intGridCsv.length} values`);
            }

            // Filter entity instances to keep only those within bounds
            if (layer.entityInstances) {
                const originalCount = layer.entityInstances.length;
                layer.entityInstances = layer.entityInstances.filter(entity => {
                    return entity.px[0] < TARGET_SIZE && entity.px[1] < TARGET_SIZE;
                });
                console.log(`      entityInstances: ${originalCount} → ${layer.entityInstances.length} (removed ${originalCount - layer.entityInstances.length})`);
            }
        });
    }

    // Create backup
    const backupPath = filePath.replace('.ldtk', '.ldtk.backup');
    fs.copyFileSync(filePath, backupPath);
    console.log(`   ✅ Backup created: ${path.basename(backupPath)}`);

    // Save resized file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`   ✅ Resized and saved: ${oldWidth}x${oldHeight} → ${TARGET_SIZE}x${TARGET_SIZE}`);
}

// Resize chunk4 and chunk5
const chunk4Path = path.join(__dirname, 'game', 'assets', 'ldtk', 'biomes', 'Dark Forest', 'chunk4.ldtk');
const chunk5Path = path.join(__dirname, 'game', 'assets', 'ldtk', 'biomes', 'Dark Forest', 'chunk5.ldtk');

console.log('🔧 LDtk Chunk Resizer');
console.log('======================');

if (fs.existsSync(chunk4Path)) {
    resizeChunk(chunk4Path);
} else {
    console.log(`⚠️  chunk4.ldtk not found at: ${chunk4Path}`);
}

if (fs.existsSync(chunk5Path)) {
    resizeChunk(chunk5Path);
} else {
    console.log(`⚠️  chunk5.ldtk not found at: ${chunk5Path}`);
}

console.log('\n✅ Done! Chunks resized to 1776x1776 pixels (37x37 tiles)');
console.log('💾 Backups saved with .backup extension');
console.log('\n📝 Next steps:');
console.log('   1. Test the resized chunks in-game');
console.log('   2. If everything works, you can delete the .backup files');
console.log('   3. Commit the resized chunk files to git');
