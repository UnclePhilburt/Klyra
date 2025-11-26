// Script to upscale chunk1-3 from 1776x1776 to 2400x2400 pixels
const fs = require('fs');
const path = require('path');

const OLD_SIZE = 1776; // 37 tiles * 48 pixels
const NEW_SIZE = 2400; // 50 tiles * 48 pixels
const TILE_SIZE = 48;
const OLD_TILES = 37;
const NEW_TILES = 50;
const PADDING_TILES = Math.floor((NEW_TILES - OLD_TILES) / 2); // Center old content

function upscaleChunk(filePath) {
    console.log(`\n📏 Upscaling ${path.basename(filePath)}...`);

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
    console.log(`   Target size: ${NEW_SIZE}x${NEW_SIZE} pixels`);

    // Update level dimensions
    level.pxWid = NEW_SIZE;
    level.pxHei = NEW_SIZE;

    // Calculate offset to center the old content
    const offsetX = PADDING_TILES * TILE_SIZE;
    const offsetY = PADDING_TILES * TILE_SIZE;

    console.log(`   Centering content with offset: (${offsetX}, ${offsetY})`);

    // Process each layer
    if (level.layerInstances) {
        level.layerInstances.forEach(layer => {
            console.log(`   Processing layer: ${layer.__identifier}`);

            // Update layer dimensions
            layer.cWid = NEW_TILES;
            layer.cHei = NEW_TILES;

            // Offset all tiles
            if (layer.gridTiles) {
                layer.gridTiles.forEach(tile => {
                    tile.px[0] += offsetX;
                    tile.px[1] += offsetY;
                });
                console.log(`      gridTiles: ${layer.gridTiles.length} tiles offset`);
            }

            if (layer.autoLayerTiles) {
                layer.autoLayerTiles.forEach(tile => {
                    tile.px[0] += offsetX;
                    tile.px[1] += offsetY;
                });
                console.log(`      autoLayerTiles: ${layer.autoLayerTiles.length} tiles offset`);
            }

            // Update intGrid if present
            if (layer.intGridCsv && layer.intGridCsv.length > 0) {
                // Create new larger grid filled with 0s
                const newGrid = new Array(NEW_TILES * NEW_TILES).fill(0);

                // Copy old grid to center of new grid
                for (let y = 0; y < OLD_TILES; y++) {
                    for (let x = 0; x < OLD_TILES; x++) {
                        const oldIndex = y * OLD_TILES + x;
                        const newX = x + PADDING_TILES;
                        const newY = y + PADDING_TILES;
                        const newIndex = newY * NEW_TILES + newX;
                        newGrid[newIndex] = layer.intGridCsv[oldIndex] || 0;
                    }
                }

                layer.intGridCsv = newGrid;
                console.log(`      intGridCsv: ${OLD_TILES}x${OLD_TILES} → ${NEW_TILES}x${NEW_TILES}`);
            }

            // Offset entity instances
            if (layer.entityInstances) {
                layer.entityInstances.forEach(entity => {
                    entity.px[0] += offsetX;
                    entity.px[1] += offsetY;
                });
                console.log(`      entityInstances: ${layer.entityInstances.length} entities offset`);
            }
        });
    }

    // Create backup
    const backupPath = filePath.replace('.ldtk', '.ldtk.backup');
    fs.copyFileSync(filePath, backupPath);
    console.log(`   ✅ Backup created: ${path.basename(backupPath)}`);

    // Save upscaled file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`   ✅ Upscaled and saved: ${oldWidth}x${oldHeight} → ${NEW_SIZE}x${NEW_SIZE}`);
}

// Upscale chunk1, chunk2, chunk3 for Dark Forest
const darkForestPath = path.join(__dirname, 'game', 'assets', 'ldtk', 'biomes', 'Dark Forest');
const chunk1Path = path.join(darkForestPath, 'chunk1.ldtk');
const chunk2Path = path.join(darkForestPath, 'chunk2.ldtk');
const chunk3Path = path.join(darkForestPath, 'chunk3.ldtk');

// Also upscale Ember Wilds chunks
const emberWildsPath = path.join(__dirname, 'game', 'assets', 'ldtk', 'biomes', 'Ember Wilds');
const emberChunk1Path = path.join(emberWildsPath, 'chunk1.ldtk');
const emberChunk2Path = path.join(emberWildsPath, 'chunk2.ldtk');

console.log('🔧 LDtk Chunk Upscaler');
console.log('======================');
console.log('Upscaling chunks from 1776x1776 to 2400x2400 (37x37 → 50x50 tiles)');
console.log('Old content will be centered with padding on all sides\n');

// Dark Forest chunks
if (fs.existsSync(chunk1Path)) {
    upscaleChunk(chunk1Path);
} else {
    console.log(`⚠️  chunk1.ldtk not found at: ${chunk1Path}`);
}

if (fs.existsSync(chunk2Path)) {
    upscaleChunk(chunk2Path);
} else {
    console.log(`⚠️  chunk2.ldtk not found at: ${chunk2Path}`);
}

if (fs.existsSync(chunk3Path)) {
    upscaleChunk(chunk3Path);
} else {
    console.log(`⚠️  chunk3.ldtk not found at: ${chunk3Path}`);
}

// Ember Wilds chunks
console.log('\n--- EMBER WILDS BIOME ---');
if (fs.existsSync(emberChunk1Path)) {
    upscaleChunk(emberChunk1Path);
} else {
    console.log(`⚠️  Ember Wilds chunk1.ldtk not found at: ${emberChunk1Path}`);
}

if (fs.existsSync(emberChunk2Path)) {
    upscaleChunk(emberChunk2Path);
} else {
    console.log(`⚠️  Ember Wilds chunk2.ldtk not found at: ${emberChunk2Path}`);
}

console.log('\n✅ Done! All chunks upscaled to 2400x2400 pixels (50x50 tiles)');
console.log('💾 Backups saved with .backup extension');
console.log('\n📝 Next steps:');
console.log('   1. Update BiomeChunkSystem to use 50x50 tile chunks');
console.log('   2. Test the upscaled chunks in-game');
console.log('   3. If everything works, you can delete the .backup files');
console.log('   4. Commit the upscaled chunk files to git');
