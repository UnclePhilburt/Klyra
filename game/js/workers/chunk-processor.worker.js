/**
 * chunk-processor.worker.js
 * Web Worker for preprocessing LDTK tile data off the main thread
 *
 * Purpose:
 * - Pre-process LDTK tile data
 * - Calculate tile positions, frames, flipping
 * - Generate collision metadata
 * - Return structured data ready for Phaser to render
 *
 * Receives: { ldtkData, worldX, worldY, chunkX, chunkY, chunkKey }
 * Returns: { chunkKey, chunkX, chunkY, processedLayers: [...], collisionMetadata: [...], success: boolean }
 */

// Log helper that sends logs back to main thread
function log(message) {
    try {
        self.postMessage({ type: 'log', message: message });
    } catch (err) {
        console.error('Log failed:', err);
    }
}

// Send startup message
log('🚀 Processor Worker initialized');

self.onmessage = function(e) {
    try {
        log('📨 Processor received message');

        const { ldtkData, worldX, worldY, chunkX, chunkY, chunkKey } = e.data;

        log(`⚙️ Processor started ${chunkKey}`);
        const processedData = processChunkData(ldtkData, worldX, worldY);

        log(`✅ Processor finished ${chunkKey}`);
        self.postMessage({
            chunkKey,
            chunkX,
            chunkY,
            ...processedData,
            success: true
        });
    } catch (error) {
        log(`❌ Processor failed ${chunkKey}: ${error.message}`);
        self.postMessage({
            chunkKey,
            chunkX,
            chunkY,
            success: false,
            error: error.message
        });
    }
};

function processChunkData(ldtkData, worldX, worldY) {
    const level = ldtkData.levels[0];
    const layerInstances = level.layerInstances || [];
    const processedLayers = [];
    const collisionMetadata = [];

    // Reverse to render back-to-front
    const reversedLayers = [...layerInstances].reverse();

    reversedLayers.forEach((layer, index) => {
        const layerData = {
            identifier: layer.__identifier,
            type: layer.__type,
            gridSize: layer.__gridSize,
            tilesetUid: layer.__tilesetDefUid,
            opacity: layer.__opacity,
            tiles: [],
            isRoof: layer.__identifier.toLowerCase().includes('roof'),
            hasCollision: false,
            layerDefUid: layer.layerDefUid
        };

        // Check if layer has collision by looking at layer definition
        const layerDef = ldtkData.defs?.layers?.find(l => l.uid === layer.layerDefUid);
        if (layerDef && layerDef.doc) {
            const doc = layerDef.doc.toLowerCase();
            layerData.hasCollision = doc.includes('collision') || doc.includes('water');
        }

        // Process tiles
        const tiles = [...(layer.gridTiles || []), ...(layer.autoLayerTiles || [])];

        tiles.forEach(tile => {
            const tileData = {
                px: tile.px,
                src: tile.src,
                f: tile.f,
                t: tile.t
            };

            layerData.tiles.push(tileData);
        });

        // Process collision data
        if (layerData.hasCollision && layer.intGridCsv) {
            const gridSize = layer.__gridSize;
            const gridWidth = layer.__cWid;

            layer.intGridCsv.forEach((value, index) => {
                if (value === 1) { // Collision tile
                    const tileX = index % gridWidth;
                    const tileY = Math.floor(index / gridWidth);
                    const worldTileX = worldX + tileX * gridSize;
                    const worldTileY = worldY + tileY * gridSize;

                    collisionMetadata.push({
                        x: worldTileX + gridSize / 2,
                        y: worldTileY + gridSize / 2,
                        width: gridSize,
                        height: gridSize
                    });
                }
            });
        }

        processedLayers.push(layerData);
    });

    // Extract tileset information
    const tilesets = level.layerInstances
        .filter(l => l.__tilesetDefUid)
        .map(l => ({
            uid: l.__tilesetDefUid,
            identifier: l.__tilesetRelPath
        }));

    // Find NPC spawns
    const npcSpawns = findNPCSpawns(level, worldX, worldY);

    return {
        processedLayers,
        collisionMetadata,
        tilesets,
        npcSpawns
    };
}

/**
 * Find NPC spawn markers in chunk IntGrid layers
 */
function findNPCSpawns(level, worldX, worldY) {
    const spawns = [];

    if (!level.layerInstances) return spawns;

    // Look for IntGrid layers with NPC markers
    level.layerInstances.forEach(layer => {
        if (layer.__type !== 'IntGrid') return;

        const intGrid = layer.intGridCsv;
        const gridWidth = layer.__cWid;
        const tileSize = layer.__gridSize;

        // Scan for NPC markers (2 = item merchant, 3 = skill trader, 4 = banker)
        for (let i = 0; i < intGrid.length; i++) {
            const value = intGrid[i];

            if (value === 2 || value === 3 || value === 4) {
                // Convert 1D index to 2D coordinates
                const gridX = i % gridWidth;
                const gridY = Math.floor(i / gridWidth);

                // Convert to world coordinates (center of tile)
                const spawnX = worldX + (gridX * tileSize) + (tileSize / 2);
                const spawnY = worldY + (gridY * tileSize) + (tileSize / 2);

                let npcType;
                if (value === 2) npcType = 'item_merchant';
                else if (value === 3) npcType = 'skill_trader';
                else if (value === 4) npcType = 'banker';

                spawns.push({
                    type: npcType,
                    x: spawnX,
                    y: spawnY
                });
            }
        }
    });

    return spawns;
}
