/**
 * BiomeChunkSystem - Enhanced biome chunk rendering with caching and improved noise
 *
 * Design:
 * - Uses 48px tiles throughout (no conversion needed)
 * - Chunks are 1776x1776 pixels (37x37 tiles)
 * - Multi-octave noise for organic biome distribution
 * - 3x3 chunk loading for smooth exploration
 * - Chunk caching to avoid repeated loading
 */
class BiomeChunkSystem {
    constructor(scene) {
        this.scene = scene;

        // Constants
        this.TILE_SIZE = 48;              // Everything uses 48px tiles
        this.CHUNK_SIZE_TILES = 37;       // Each chunk is 37x37 tiles
        this.CHUNK_SIZE_PIXELS = 37 * 48; // = 1776 pixels

        // State
        this.loadedChunks = new Map();    // Currently visible chunks: "x,y" -> chunk data
        this.loadingChunks = new Set();   // Track chunks currently loading
        this.chunkCache = new Map();      // Cached chunk data: "x,y" -> chunk data (for quick reload)
        this.MAX_CACHE_SIZE = 100;        // Keep up to 100 chunks in cache (~130MB)

        // Biome configuration
        this.biomes = {
            dark_forest: {
                name: 'Dark Forest',
                chunks: ['darkForestChunk1', 'darkForestChunk2', 'darkForestChunk3'],
                tileset: 'a2_terrain_green',
                threshold: 0.5 // If noise < 0.5, use this biome
            },
            ember_wilds: {
                name: 'Ember Wilds',
                chunks: ['emberChunk1', 'emberChunk2'],
                tileset: 'a2_terrain_red',
                threshold: 1.0 // If noise >= 0.5, use this biome
            }
        };

        // Preload settings
        this.preloadRadius = 0; // Will be set during preloadNearSpawn
        this.isPreloaded = false;

        console.log('🎮 BiomeChunkSystem initialized');
        console.log(`   Tile size: ${this.TILE_SIZE}px`);
        console.log(`   Chunk size: ${this.CHUNK_SIZE_TILES} tiles (${this.CHUNK_SIZE_PIXELS}px)`);
    }

    /**
     * Update which chunks should be loaded based on player position
     */
    update(playerX, playerY) {
        // Calculate which chunk the player is in
        const playerChunkX = Math.floor(playerX / this.CHUNK_SIZE_PIXELS);
        const playerChunkY = Math.floor(playerY / this.CHUNK_SIZE_PIXELS);

        // Load 3x3 grid with hardware-accelerated tilemaps (should handle 100+ FPS now)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                this.loadChunk(playerChunkX + dx, playerChunkY + dy);
            }
        }

        // Move distant chunks to cache instead of destroying
        this.cacheDistantChunks(playerChunkX, playerChunkY);
    }

    /**
     * Load a specific chunk if not already loaded
     */
    loadChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;

        // Skip if already loaded or loading
        if (this.loadedChunks.has(key) || this.loadingChunks.has(key)) {
            return;
        }

        // Check if chunk is in cache - if so, restore it instantly
        if (this.chunkCache.has(key)) {
            const cachedChunk = this.chunkCache.get(key);
            this.loadedChunks.set(key, cachedChunk);
            this.chunkCache.delete(key);

            // Make containers visible again
            cachedChunk.containers.forEach(c => c.setVisible(true));

            console.log(`♻️ Restored chunk (${chunkX},${chunkY}) from cache`);
            return;
        }

        // Determine biome for this chunk
        const biome = this.getBiomeForChunk(chunkX, chunkY);

        // Pick random chunk variant
        const variants = this.biomes[biome].chunks;
        const seed = chunkX * 7919 + chunkY * 6563;
        const variantIndex = Math.floor(this.seededRandom(seed) * variants.length);
        const chunkKey = variants[variantIndex];

        // Mark as loading
        this.loadingChunks.add(key);

        // Check if chunk JSON is cached in Phaser
        if (!this.scene.cache.json.exists(chunkKey)) {
            // Load chunk file
            const filePath = this.getChunkFilePath(biome, variantIndex + 1);

            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    this.scene.cache.json.add(chunkKey, data);
                    this.loadingChunks.delete(key);
                    this.loadChunk(chunkX, chunkY); // Retry now that it's cached
                })
                .catch(err => {
                    console.error(`❌ Failed to load ${chunkKey} from ${filePath}:`, err);
                    this.loadingChunks.delete(key);
                    // Load fallback chunk to avoid holes in the world
                    this.loadFallbackChunk(chunkX, chunkY, biome);
                });
            return;
        }

        // Chunk is cached, render it
        const worldX = chunkX * this.CHUNK_SIZE_PIXELS;
        const worldY = chunkY * this.CHUNK_SIZE_PIXELS;

        const chunkData = this.renderChunk(chunkKey, worldX, worldY);

        if (chunkData) {
            this.loadedChunks.set(key, {
                biome: biome,
                chunkKey: chunkKey,
                position: { x: worldX, y: worldY },
                containers: chunkData.layers.map(l => l.container),
                chunkX: chunkX,
                chunkY: chunkY
            });
        } else {
            console.error(`❌ Failed to render chunk (${chunkX},${chunkY})`);
        }

        this.loadingChunks.delete(key);
    }

    /**
     * Render a chunk's LDtk data at a specific world position
     */
    renderChunk(chunkKey, worldX, worldY) {
        const ldtkData = this.scene.cache.json.get(chunkKey);
        if (!ldtkData || !ldtkData.levels || ldtkData.levels.length === 0) {
            console.error(`❌ Invalid chunk data for ${chunkKey}`);
            return null;
        }

        const level = ldtkData.levels[0];
        const layers = [];

        // Process layers
        if (level.layerInstances) {
            const layerInstances = [...level.layerInstances].reverse();

            layerInstances.forEach((layer, index) => {
                if (layer.__type !== 'Tiles' && layer.__type !== 'IntGrid') return;

                const tileset = layer.__tilesetDefUid ?
                    ldtkData.defs.tilesets.find(t => t.uid === layer.__tilesetDefUid) : null;

                if (!tileset) return;

                const textureKey = this.getTextureKey(tileset.relPath);
                if (!this.scene.textures.exists(textureKey)) {
                    console.warn(`⚠️ Texture ${textureKey} not found`);
                    return;
                }

                // PERFORMANCE: Use StaticTilemap instead of Blitter for hardware acceleration
                // Create a tilemap for this layer (one draw call instead of thousands)
                const map = this.scene.make.tilemap({
                    tileWidth: tileset.tileGridSize,
                    tileHeight: tileset.tileGridSize,
                    width: 37,  // Chunk is 37x37 tiles
                    height: 37
                });

                // Add tileset image
                const tilesetImage = map.addTilesetImage(textureKey, textureKey, tileset.tileGridSize, tileset.tileGridSize);

                // Create static layer (single draw call, hardware accelerated)
                const tilemapLayer = map.createBlankLayer(layer.__identifier, tilesetImage, worldX, worldY);
                tilemapLayer.setDepth(-200 + index);

                // Fill tiles
                const tiles = [...(layer.gridTiles || []), ...(layer.autoLayerTiles || [])];
                tiles.forEach(tile => {
                    const tileX = Math.floor(tile.px[0] / tileset.tileGridSize);
                    const tileY = Math.floor(tile.px[1] / tileset.tileGridSize);
                    const frameX = tile.src[0] / tileset.tileGridSize;
                    const frameY = tile.src[1] / tileset.tileGridSize;
                    const frameIndex = frameY * (tileset.pxWid / tileset.tileGridSize) + frameX;

                    const placedTile = tilemapLayer.putTileAt(frameIndex, tileX, tileY);
                    if (placedTile) {
                        if (tile.f === 1) placedTile.flipX = true;
                        if (tile.f === 2) placedTile.flipY = true;
                        if (tile.f === 3) { placedTile.flipX = true; placedTile.flipY = true; }
                    }
                });

                layers.push({ name: layer.__identifier, container: tilemapLayer });
            });
        }

        return { layers };
    }

    /**
     * Determine which biome a chunk should be using multi-octave noise
     */
    getBiomeForChunk(chunkX, chunkY) {
        // Use multiple octaves of noise for more organic distribution
        const noise1 = this.smoothNoise(chunkX, chunkY, 3.0, 12345);      // Large features
        const noise2 = this.smoothNoise(chunkX, chunkY, 1.5, 54321);      // Medium features
        const noise3 = this.smoothNoise(chunkX, chunkY, 0.75, 98765);     // Small features

        // Weighted combination (large features matter most)
        const combined = (noise1 * 0.6) + (noise2 * 0.25) + (noise3 * 0.15);

        // Slightly favor dark forest (55% dark forest, 45% ember wilds)
        if (combined < 0.55) return 'dark_forest';
        return 'ember_wilds';
    }

    /**
     * Smooth noise for coherent biome regions
     */
    smoothNoise(x, y, scale, seed) {
        const scaledX = x / scale;
        const scaledY = y / scale;

        const x0 = Math.floor(scaledX);
        const y0 = Math.floor(scaledY);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const fx = scaledX - x0;
        const fy = scaledY - y0;

        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);

        const v00 = this.seededRandom(seed + x0 * 7919 + y0 * 6563);
        const v10 = this.seededRandom(seed + x1 * 7919 + y0 * 6563);
        const v01 = this.seededRandom(seed + x0 * 7919 + y1 * 6563);
        const v11 = this.seededRandom(seed + x1 * 7919 + y1 * 6563);

        const top = v00 * (1 - sx) + v10 * sx;
        const bottom = v01 * (1 - sx) + v11 * sx;
        return top * (1 - sy) + bottom * sy;
    }

    /**
     * Seeded random
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Get file path for a chunk
     */
    getChunkFilePath(biome, chunkNum) {
        if (biome === 'dark_forest') {
            return `assets/ldtk/biomes/Dark Forest/chunk${chunkNum}.ldtk`;
        } else {
            return `assets/ldtk/biomes/Ember Wilds/chunk${chunkNum}.ldtk`;
        }
    }

    /**
     * Get Phaser texture key from LDtk path
     */
    getTextureKey(path) {
        const filename = path.split('/').pop().replace('.png', '');
        return filename; // a2_terrain_green, a2_terrain_red, etc.
    }

    /**
     * Move distant chunks to cache instead of destroying them
     */
    cacheDistantChunks(playerChunkX, playerChunkY) {
        const maxDistance = 2; // Keep chunks within 2 chunks of player

        for (const [key, chunkData] of this.loadedChunks) {
            const [x, y] = key.split(',').map(Number);
            const dist = Math.max(Math.abs(x - playerChunkX), Math.abs(y - playerChunkY));

            if (dist > maxDistance) {
                // Hide containers instead of destroying
                chunkData.containers.forEach(c => c.setVisible(false));

                // Move to cache
                this.chunkCache.set(key, chunkData);
                this.loadedChunks.delete(key);

                // Enforce cache size limit
                if (this.chunkCache.size > this.MAX_CACHE_SIZE) {
                    // Remove oldest cached chunk
                    const oldestKey = this.chunkCache.keys().next().value;
                    const oldChunk = this.chunkCache.get(oldestKey);

                    // Now actually destroy it
                    oldChunk.containers.forEach(c => c.destroy(true));
                    this.chunkCache.delete(oldestKey);
                }
            }
        }
    }

    /**
     * Load a fallback chunk if the requested chunk fails to load
     */
    loadFallbackChunk(chunkX, chunkY, biome) {
        console.warn(`⚠️ Loading fallback for (${chunkX},${chunkY})`);

        // Try to load the first chunk variant as fallback
        const variants = this.biomes[biome].chunks;
        const fallbackKey = variants[0];

        if (this.scene.cache.json.exists(fallbackKey)) {
            const worldX = chunkX * this.CHUNK_SIZE_PIXELS;
            const worldY = chunkY * this.CHUNK_SIZE_PIXELS;

            const chunkData = this.renderChunk(fallbackKey, worldX, worldY);

            if (chunkData) {
                const key = `${chunkX},${chunkY}`;
                this.loadedChunks.set(key, {
                    biome: biome,
                    chunkKey: fallbackKey,
                    position: { x: worldX, y: worldY },
                    containers: chunkData.layers.map(l => l.container),
                    chunkX: chunkX,
                    chunkY: chunkY,
                    isFallback: true
                });
                console.log(`🔄 Loaded fallback chunk at (${chunkX},${chunkY})`);
            }
        } else {
            console.error(`❌ No fallback available for (${chunkX},${chunkY})`);
        }
    }

    /**
     * Get biome at a specific tile position (for decorations)
     */
    getBiomeAtTile(tileX, tileY) {
        const chunkX = Math.floor(tileX / this.CHUNK_SIZE_TILES);
        const chunkY = Math.floor(tileY / this.CHUNK_SIZE_TILES);
        return this.getBiomeForChunk(chunkX, chunkY);
    }

    /**
     * Preload chunks in a radius around spawn point
     * @param {number} spawnX - Spawn X in pixels
     * @param {number} spawnY - Spawn Y in pixels
     * @param {number} radius - Radius in chunks to preload
     * @returns {Promise} Resolves when all chunks are loaded
     */
    async preloadNearSpawn(spawnX, spawnY, radius = 5) {
        console.log(`🔄 Preloading ${radius * 2 + 1}x${radius * 2 + 1} chunk grid (radius ${radius})...`);

        const spawnChunkX = Math.floor(spawnX / this.CHUNK_SIZE_PIXELS);
        const spawnChunkY = Math.floor(spawnY / this.CHUNK_SIZE_PIXELS);

        this.preloadRadius = radius;
        const totalChunks = (radius * 2 + 1) * (radius * 2 + 1);
        let loadedCount = 0;

        console.log(`📊 Total chunks to load: ${totalChunks} (${radius * 2 + 1} x ${radius * 2 + 1} grid)`);

        const loadPromises = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const chunkX = spawnChunkX + dx;
                const chunkY = spawnChunkY + dy;

                // Load chunk and wait for it
                const promise = new Promise((resolve) => {
                    // Check if already loaded
                    const key = `${chunkX},${chunkY}`;
                    if (this.loadedChunks.has(key)) {
                        resolve();
                        return;
                    }

                    // Load the chunk
                    this.loadChunk(chunkX, chunkY);

                    // Wait a frame for it to process
                    this.scene.time.delayedCall(10, () => {
                        loadedCount++;
                        const percent = Math.floor((loadedCount / totalChunks) * 100);

                        // Update loading progress in GameScene
                        if (this.scene.updateLoadingProgress) {
                            this.scene.updateLoadingProgress(loadedCount, totalChunks);
                        }

                        if (loadedCount % 5 === 0 || loadedCount === totalChunks) {
                            console.log(`   Loading chunks: ${loadedCount}/${totalChunks} (${percent}%)`);
                        }
                        resolve();
                    });
                });

                loadPromises.push(promise);
            }
        }

        await Promise.all(loadPromises);
        this.isPreloaded = true;
        console.log(`✅ Preloaded ${totalChunks} chunks!`);
    }
}
