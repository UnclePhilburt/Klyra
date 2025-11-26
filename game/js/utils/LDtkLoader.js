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


        const layers = [];
        const entities = [];
        const collisionBodies = [];
        const roofLayers = []; // Track roof layers for transparency

        // Process each layer (LDtk layers are in reverse order)
        if (level.layerInstances) {
            // Reverse to render in correct order (bottom to top)
            const layerInstances = [...level.layerInstances].reverse();

            layerInstances.forEach((layer, layerIndex) => {
                // Check if this layer needs collision (doc field is in layer definition, not instance)
                const layerDef = ldtkData.defs.layers.find(l => l.uid === layer.layerDefUid);
                const hasCollision = layerDef && layerDef.doc && (
                    layerDef.doc.toLowerCase().includes('collision') ||
                    layerDef.doc.toLowerCase().includes('water')
                );
                const isRoof = layerDef && layerDef.doc && layerDef.doc.toLowerCase().includes('roof');
                const isWater = layerDef && layerDef.doc && layerDef.doc.toLowerCase().includes('water');

                if (layer.__type === 'Tiles' || layer.__type === 'IntGrid') {
                    // Render tile layer
                    const container = scene.add.container(offsetX, offsetY);

                    // Roof layers render above player (depth 1000+), everything else behind player (depth -100)
                    container.setDepth(isRoof ? (1000 + layerIndex) : (-100 + layerIndex));

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

                    // Check if texture exists
                    if (!scene.textures.exists(textureKey)) {
                        console.warn(`   ⚠️ Texture "${textureKey}" not found, skipping layer`);
                        return;
                    }

                    // Render tiles - use Blitter for massive performance boost
                    const gridTiles = layer.gridTiles || [];
                    const autoTiles = layer.autoLayerTiles || [];
                    const allTiles = [...gridTiles, ...autoTiles];

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

                            collisionBodies.push(rect); // Push the game object, not just the body
                        }
                    }

                    // Add blitter to container
                    container.add(blitter);

                    layers.push({
                        name: layer.__identifier,
                        type: layer.__type,
                        container: container,
                        blitter: blitter,  // Store blitter reference
                        depth: container.depth
                    });

                    // Track roof layers for transparency
                    if (isRoof) {
                        container.alpha = 1.0; // Start fully visible
                        blitter.alpha = 1.0; // Also set blitter alpha

                        // Calculate the bounding box of roof tiles
                        let minX = Infinity, minY = Infinity;
                        let maxX = -Infinity, maxY = -Infinity;

                        allTiles.forEach(tile => {
                            const tileX = tile.px[0];
                            const tileY = tile.px[1];
                            const tileSize = tileset.tileGridSize;

                            minX = Math.min(minX, tileX);
                            minY = Math.min(minY, tileY);
                            maxX = Math.max(maxX, tileX + tileSize);
                            maxY = Math.max(maxY, tileY + tileSize);
                        });

                        // Store roof bounds in world coordinates
                        container.roofBounds = {
                            x: offsetX + minX,
                            y: offsetY + minY,
                            width: maxX - minX,
                            height: maxY - minY
                        };

                        // Store blitter reference on container for depth updates
                        container.blitter = blitter;

                        roofLayers.push(container);
                    }

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

        return {
            layers: layers,
            entities: entities,
            collisionBodies: collisionBodies,
            roofLayers: roofLayers,
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
            'Fantasy_Roofs': 'fantasy_roofs',
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
            '!$Glowing_tree': 'glowing_tree',
            // Winlu exterior remaster tilesets
            'Fantasy_Outside_A2': 'fantasy_outside_a2',
            'Fantasy_Outside_A4': 'fantasy_outside_a4',
            // Winlu exterior remaster characters/objects
            '!$Big_Decoration': 'big_decoration',
            '!diagonal_walls_top': 'diagonal_walls_top',
            '!Fantasy_door1': 'fantasy_door1',
            '!$Big_drawbridge': 'big_drawbridge',
            '!Flags_banner': 'flags_banner',
            '!Signs': 'signs',
            '!Statue': 'statue',
            '!Fantasy_chest': 'fantasy_chest',
            '!Decoration_vegetation': 'decoration_vegetation',
            '!Decoration': 'decoration',
            '!$Smith': 'smith',
            '!$Waterwheel': 'waterwheel',
            '!lamp': 'lamp',
            '!Roof_Windows': 'roof_windows',
            '!Fantasy_switches': 'fantasy_switches',
            '!$Gate_Cathedral1': 'gate_cathedral1'
        };

        return mappings[filename] || filename;
    }
}
