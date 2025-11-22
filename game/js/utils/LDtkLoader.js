/**
 * LDtkLoader - Utility class for loading and rendering LDtk maps in Phaser 3
 */
class LDtkLoader {
    /**
     * Load an LDtk map and render it in Phaser
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {Object} ldtkData - The loaded LDtk JSON data
     * @param {number} worldX - World X position to render at
     * @param {number} worldY - World Y position to render at
     * @param {number} tileSize - Target tile size (default 32)
     * @param {boolean} topLeft - If true, position is top-left corner; if false, center (default false)
     * @returns {Object} Map data with layers and entities
     */
    static load(scene, ldtkData, worldX, worldY, tileSize = 32, topLeft = false) {
        if (!ldtkData || !ldtkData.levels || ldtkData.levels.length === 0) {
            console.error('❌ Invalid LDtk data');
            return null;
        }

        // Get the first level
        const level = ldtkData.levels[0];
        const mapWidth = level.pxWid;
        const mapHeight = level.pxHei;

        // Calculate offset based on positioning mode
        let offsetX, offsetY;
        if (topLeft) {
            // Position as top-left corner
            offsetX = worldX;
            offsetY = worldY;
        } else {
            // Position as center (default)
            offsetX = worldX - (mapWidth / 2);
            offsetY = worldY - (mapHeight / 2);
        }

        console.log(`📦 Loading LDtk level: ${level.identifier}`);
        console.log(`   Size: ${mapWidth}x${mapHeight}px`);
        console.log(`   Offset: (${offsetX}, ${offsetY})`);
        console.log(`   Layers: ${level.layerInstances?.length || 0}`);

        const layers = [];
        const entities = [];
        const collisionBodies = [];

        // Process each layer (LDtk layers are in reverse order)
        if (level.layerInstances) {
            // Reverse to render in correct order (bottom to top)
            const layerInstances = [...level.layerInstances].reverse();

            layerInstances.forEach((layer, layerIndex) => {
                console.log(`   Processing layer: ${layer.__identifier} (type: ${layer.__type})`);

                // Check if this layer needs collision
                const hasCollision = layer.doc && layer.doc.toLowerCase().includes('collision');
                if (hasCollision) {
                    console.log(`   🛡️ Layer has collision enabled`);
                }

                if (layer.__type === 'Tiles' || layer.__type === 'IntGrid') {
                    // Render tile layer
                    const container = scene.add.container(offsetX, offsetY);
                    container.setDepth(-100 + layerIndex); // Spawn building behind everything

                    // Get tileset
                    const tileset = layer.__tilesetDefUid ?
                        ldtkData.defs.tilesets.find(t => t.uid === layer.__tilesetDefUid) : null;

                    if (!tileset) {
                        console.warn(`   ⚠️ No tileset found for layer ${layer.__identifier}`);
                        return;
                    }

                    // Get texture key from tileset relative path
                    const tilesetPath = tileset.relPath;
                    let textureKey = LDtkLoader.getTextureKey(tilesetPath);

                    console.log(`   Tileset: ${tilesetPath} -> ${textureKey}`);

                    // Check if texture exists
                    if (!scene.textures.exists(textureKey)) {
                        console.warn(`   ⚠️ Texture "${textureKey}" not found, skipping layer`);
                        return;
                    }

                    // Render tiles - use Blitter for massive performance boost
                    const gridTiles = layer.gridTiles || [];
                    const autoTiles = layer.autoLayerTiles || [];
                    const allTiles = [...gridTiles, ...autoTiles];

                    console.log(`   Rendering ${allTiles.length} tiles with Blitter...`);

                    // Only render tiles if there are any
                    if (allTiles.length === 0) {
                        return;
                    }

                    // Create a Blitter (renders thousands of tiles as 1 draw call)
                    const blitter = scene.add.blitter(0, 0, textureKey);

                    for (let i = 0; i < allTiles.length; i++) {
                        const tile = allTiles[i];
                        const tileX = tile.px[0];
                        const tileY = tile.px[1];
                        const srcX = tile.src[0];
                        const srcY = tile.src[1];

                        // Calculate frame index from source position
                        const tilesetGridWidth = tileset.pxWid / tileset.tileGridSize;
                        const frameX = srcX / tileset.tileGridSize;
                        const frameY = srcY / tileset.tileGridSize;
                        const frameIndex = frameY * tilesetGridWidth + frameX;

                        // Add bob to blitter (much faster than individual sprites)
                        const bob = blitter.create(tileX, tileY, frameIndex);

                        // Handle flipping
                        if (tile.f === 1) bob.flipX = true;
                        if (tile.f === 2) bob.flipY = true;
                        if (tile.f === 3) {
                            bob.flipX = true;
                            bob.flipY = true;
                        }

                        // Create collision body for this tile if needed
                        if (hasCollision) {
                            const worldTileX = offsetX + tileX;
                            const worldTileY = offsetY + tileY;
                            const tileSize = tileset.tileGridSize;

                            // Create a static rectangle body for collision
                            const rect = scene.add.rectangle(
                                worldTileX + tileSize / 2,
                                worldTileY + tileSize / 2,
                                tileSize,
                                tileSize
                            );
                            rect.setOrigin(0.5, 0.5);
                            scene.physics.add.existing(rect, true); // true = static body
                            rect.setVisible(false); // Hide the rectangle (only used for collision)

                            collisionBodies.push(rect.body);
                        }
                    }

                    // Add blitter to container
                    container.add(blitter);

                    layers.push({
                        name: layer.__identifier,
                        type: layer.__type,
                        container: container,
                        depth: container.depth
                    });

                } else if (layer.__type === 'Entities') {
                    // Process entities
                    layer.entityInstances?.forEach(entity => {
                        entities.push({
                            identifier: entity.__identifier,
                            x: offsetX + entity.px[0],
                            y: offsetY + entity.px[1],
                            width: entity.width,
                            height: entity.height,
                            properties: entity.fieldInstances
                        });
                    });
                }
            });
        }

        console.log(`✅ LDtk map loaded: ${layers.length} layers, ${entities.length} entities, ${collisionBodies.length} collision tiles`);

        return {
            layers: layers,
            entities: entities,
            collisionBodies: collisionBodies,
            size: { width: mapWidth, height: mapHeight },
            offset: { x: offsetX, y: offsetY }
        };
    }

    /**
     * Convert LDtk tileset path to Phaser texture key
     * @param {string} path - LDtk relative path
     * @returns {string} Texture key
     */
    static getTextureKey(path) {
        // Extract filename without extension
        const filename = path.split('/').pop().replace('.png', '');

        // Map common tileset names to texture keys
        const mappings = {
            'A2 - Terrain And Misc': 'terrain_misc',
            'a2_terrain_base': 'a2_terrain_base',
            'a2_terrain_green': 'a2_terrain_green',
            'a2_terrain_red': 'a2_terrain_red',
            'A1 - Liquids And Misc': 'liquids_misc',
            'A3 - Walls And Floors': 'walls_floors',
            'A4 - Walls': 'walls',
            'Fantasy_Outside_A5': 'fantasy_outside_a5',
            'Fantasy_Outside_B': 'fantasy_outside_b',
            'Fantasy_Outside_C': 'fantasy_outside_c',
            'Fantasy_Outside_D': 'objects_d',
            'A2_extended_forest_terrain': 'forest_extended',
            'Big_Trees_red': 'red_trees',
            'Fantasy_Outside_D_red': 'red_decorations',
            'Fantasy_door1': 'fantasy_door1',
            'Fantasy_door2': 'fantasy_door2',
            'Gate_Cathedral1': 'gate_cathedral1',
            'a2_forest': 'forest',
            'a1_water_base': 'water_base',
            'a1_water_green': 'water_green',
            'a1_water_red': 'water_red',
            '!$Glowing_tree': 'glowing_tree'
        };

        return mappings[filename] || filename;
    }
}
