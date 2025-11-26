/**
 * BiomeChunkSystem - Enhanced biome chunk rendering with caching and improved noise
 *
 * Design:
 * - Uses 48px tiles throughout (no conversion needed)
 * - All chunks are 1776x1776 pixels (37x37 tiles)
 * - Multi-octave noise for organic biome distribution
 * - 3x3 chunk loading for smooth exploration
 * - Chunk caching to avoid repeated loading
 */
class BiomeChunkSystem {
    constructor(scene, worldSeed) {
        this.scene = scene;
        this.worldSeed = worldSeed;

        // Convert world seed to numeric value for seeded random
        this.numericSeed = worldSeed ? worldSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;

        // Constants
        this.TILE_SIZE = 48;              // Everything uses 48px tiles
        this.CHUNK_SIZE_TILES = 37;       // All chunks are 37x37 tiles
        this.CHUNK_SIZE_PIXELS = 37 * 48; // = 1776 pixels

        // State
        this.loadedChunks = new Map();    // Currently visible chunks: "x,y" -> chunk data
        this.loadingChunks = new Set();   // Track chunks currently loading
        this.chunkCache = new Map();      // Cached chunk data: "x,y" -> chunk data (for quick reload)
        this.MAX_CACHE_SIZE = 100;        // Keep up to 100 chunks in cache (~130MB)

        // Web Worker Pool for chunk loading optimization
        this.loaderWorkers = [];
        this.processorWorkers = [];
        this.workerIndex = 0;
        this.pendingChunks = new Map();

        // Promise tracking for async chunk loading
        this.chunkLoadPromises = new Map();  // "x,y" -> Promise
        this.chunkResolvers = new Map();     // "x,y" -> resolve function

        // Web Workers disabled - using direct loading for stability
        console.log('🔧 Web Workers disabled - using direct loading');

        /* DISABLED - Web Workers have stability issues
        const workerCount = navigator.hardwareConcurrency || 4;
        try {
            for (let i = 0; i < Math.min(workerCount, 8); i++) {
                const loaderWorker = new Worker('js/workers/chunk-loader.worker.js');
                const processorWorker = new Worker('js/workers/chunk-processor.worker.js');

                // Add error handlers
                loaderWorker.onerror = (e) => {
                    console.error(`❌ Loader Worker ${i} error:`, e.message, e.filename, e.lineno);
                };
                processorWorker.onerror = (e) => {
                    console.error(`❌ Processor Worker ${i} error:`, e.message, e.filename, e.lineno);
                };

                // Add global message handlers for log messages
                loaderWorker.addEventListener('message', (e) => {
                    if (e.data.type === 'log') {
                        console.log(`[LoaderWorker-${i}]`, e.data.message);
                    }
                });
                processorWorker.addEventListener('message', (e) => {
                    if (e.data.type === 'log') {
                        console.log(`[ProcessorWorker-${i}]`, e.data.message);
                    }
                });

                this.loaderWorkers.push(loaderWorker);
                this.processorWorkers.push(processorWorker);
            }
            console.log(`⚡ Web Workers initialized: ${this.loaderWorkers.length} loader workers, ${this.processorWorkers.length} processor workers`);
        } catch (err) {
            console.error(`❌ Failed to create workers:`, err);
            this.loaderWorkers = [];
            this.processorWorkers = [];
        }
        */

        // Biome configuration
        this.biomes = {
            dark_forest: {
                name: 'Dark Forest',
                chunks: ['darkForestChunk1', 'darkForestChunk2', 'darkForestChunk3', 'darkForestChunk4', 'darkForestChunk5'],
                tileset: 'a2_terrain_green',
                threshold: 0.55 // 55% dark forest
            },
            ember_wilds: {
                name: 'Ember Wilds',
                chunks: ['emberChunk1', 'emberChunk2'],
                tileset: 'a2_terrain_red',
                threshold: 1.0 // 45% ember wilds
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
     * Load a specific chunk if not already loaded (with Web Worker optimization)
     */
    loadChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        // console.log(`📍 loadChunk(${chunkX}, ${chunkY}) called`);

        // Return existing promise if already loading
        if (this.chunkLoadPromises.has(key)) {
            // console.log(`  ⏳ Already loading, returning existing promise`);
            return this.chunkLoadPromises.get(key);
        }

        // Skip if already loaded - return resolved promise
        if (this.loadedChunks.has(key)) {
            // console.log(`  ⏭️ Already loaded`);
            return Promise.resolve();
        }

        // Create promise for this chunk
        const promise = new Promise((resolve) => {
            this.chunkResolvers.set(key, resolve);
            this._loadChunkAsync(chunkX, chunkY, key);
        });

        this.chunkLoadPromises.set(key, promise);
        return promise;
    }

    _loadChunkAsync(chunkX, chunkY, key) {

        // Check if chunk is in cache - if so, restore it instantly
        if (this.chunkCache.has(key)) {
            console.log(`  ♻️ Restoring from cache`);

            const cachedChunk = this.chunkCache.get(key);
            this.loadedChunks.set(key, cachedChunk);
            this.chunkCache.delete(key);

            // Make containers visible again
            cachedChunk.containers.forEach(c => c.setVisible(true));

            // RECREATION: Recreate collision bodies from metadata using physics groups (O(n) instead of O(n²))
            if (cachedChunk.collisionMetadata && cachedChunk.collisionMetadata.length > 0) {
                cachedChunk.collisionBodies = []; // Reset array

                // Create a static physics group for all collision bodies in this chunk
                if (!cachedChunk.collisionGroup) {
                    cachedChunk.collisionGroup = this.scene.physics.add.staticGroup();
                }

                // Recreate collision bodies and add them to the group
                cachedChunk.collisionMetadata.forEach(meta => {
                    const rect = this.scene.add.rectangle(meta.x, meta.y, meta.width, meta.height);
                    rect.setOrigin(0.5, 0.5);
                    this.scene.physics.add.existing(rect, true); // Static body
                    rect.setVisible(false);

                    cachedChunk.collisionBodies.push(rect);
                    cachedChunk.collisionGroup.add(rect);
                });

                // OPTIMIZATION: Create single colliders per entity collection instead of per body (O(n) vs O(n²))
                // Add collider with local player
                if (this.scene.localPlayer && this.scene.localPlayer.sprite) {
                    this.scene.physics.add.collider(this.scene.localPlayer.sprite, cachedChunk.collisionGroup);
                }

                // Add colliders with other players
                if (this.scene.players) {
                    Object.values(this.scene.players).forEach(player => {
                        if (player && player.sprite) {
                            this.scene.physics.add.collider(player.sprite, cachedChunk.collisionGroup);
                        }
                    });
                }

                // Add colliders with enemies - one collider per enemy sprite, not per body
                const enemyCollections = [
                    this.scene.swordDemons,
                    this.scene.minotaurs,
                    this.scene.mushrooms,
                    this.scene.emberclaws
                ];

                enemyCollections.forEach(collection => {
                    if (collection) {
                        Object.values(collection).forEach(enemy => {
                            if (enemy && enemy.sprite) {
                                this.scene.physics.add.collider(enemy.sprite, cachedChunk.collisionGroup);
                            }
                        });
                    }
                });

                console.log(`🔨 Recreated ${cachedChunk.collisionBodies.length} collision bodies for chunk ${key} (O(n) optimization)`);
            }

            console.log(`♻️ Restored chunk (${chunkX},${chunkY}) from cache`);

            // Resolve promise for this chunk
            this._resolveChunkPromise(key);
            return;
        }

        // Check if already loading (this shouldn't happen since we check promises earlier)
        if (this.loadingChunks.has(key)) {
            console.warn(`⚠️ Chunk ${key} already loading - this shouldn't happen!`);
            return;
        }
        this.loadingChunks.add(key);
        console.log(`  🔵 Added ${key} to loadingChunks`);


        // Determine biome for this chunk
        const biome = this.getBiomeForChunk(chunkX, chunkY);

        // Pick random chunk variant using world seed + chunk coordinates
        const chunkKey = this.getChunkKey(chunkX, chunkY, biome);

        // Check if chunk JSON is already cached in Phaser
        if (this.scene.cache.json.has(chunkKey)) {
            console.log(`  ✅ Found in Phaser cache: ${chunkKey}`);
            const data = this.scene.cache.json.get(chunkKey);
            this.processChunkWithWorker(chunkKey, chunkX, chunkY, data);
            return;
        }

        // Check if workers are available
        if (this.loaderWorkers.length === 0) {
            console.warn(`  ⚠️ No workers available, falling back to direct loading`);
            this._loadChunkDirect(chunkX, chunkY, chunkKey, biome);
            return;
        }

        // Load with worker
        const filePath = this.getChunkFilePath(chunkKey);
        const worker = this.loaderWorkers[this.workerIndex % this.loaderWorkers.length];
        this.workerIndex++;

        console.log(`  🔄 Loading with worker: ${chunkKey} from ${filePath}`);

        let timeoutHandle;

        const messageHandler = (e) => {
            // Handle log messages from worker
            if (e.data.type === 'log') {
                console.log('[LoaderWorker]', e.data.message);
                return;
            }

            // Handle actual chunk data
            if (e.data.chunkKey === chunkKey) {
                clearTimeout(timeoutHandle);
                worker.removeEventListener('message', messageHandler);
                console.log(`  📨 Worker response for ${chunkKey}:`, e.data.success ? 'SUCCESS' : 'FAILED');

                if (e.data.success) {
                    // Cache the loaded data
                    this.scene.cache.json.add(chunkKey, e.data.data);
                    // Process with second worker
                    this.processChunkWithWorker(chunkKey, chunkX, chunkY, e.data.data);
                } else {
                    console.error(`❌ Failed to load chunk ${chunkKey}:`, e.data.error);
                    this.loadingChunks.delete(key);
                    this._resolveChunkPromise(key);
                    this.loadFallbackChunk(chunkX, chunkY, biome);
                }
            }
        };

        // Setup listener with timeout (after messageHandler is defined)
        timeoutHandle = setTimeout(() => {
            worker.removeEventListener('message', messageHandler);
            console.warn(`  ⏱️ Worker timeout for ${chunkKey}, falling back to direct loading`);
            this._loadChunkDirect(chunkX, chunkY, chunkKey, biome);
        }, 5000); // 5 second timeout

        worker.addEventListener('message', messageHandler);
        worker.postMessage({ filePath, chunkKey, chunkX, chunkY });
    }

    /**
     * Fallback: Load chunk directly without workers (synchronous)
     */
    _loadChunkDirect(chunkX, chunkY, chunkKey, biome) {
        const key = `${chunkX},${chunkY}`;
        const filePath = this.getChunkFilePath(chunkKey);
        console.log(`  🔄 Loading directly: ${chunkKey} from ${filePath}`);

        // Use Phaser's built-in loader for async loading
        this.scene.load.json(chunkKey, filePath);

        this.scene.load.once(`filecomplete-json-${chunkKey}`, () => {
            console.log(`  ✅ Loaded ${chunkKey}`);
            const data = this.scene.cache.json.get(chunkKey);

            // Render directly (no worker processing) and store the data
            const worldX = chunkX * this.CHUNK_SIZE_PIXELS;
            const worldY = chunkY * this.CHUNK_SIZE_PIXELS;
            const renderData = this.renderChunk(chunkKey, worldX, worldY, chunkX, chunkY);

            if (renderData) {
                const biome = this.getBiomeForChunk(chunkX, chunkY);
                const containers = renderData.layers.map(l => l.container);

                // Spawn NPCs for chunk5 (direct loading path)
                this.spawnChunkNPCs(chunkKey, renderData.npcSpawns, renderData.collisionBodies);

                this.loadedChunks.set(key, {
                    biome: biome,
                    chunkKey: chunkKey,
                    position: { x: worldX, y: worldY },
                    containers: containers,
                    collisionBodies: renderData.collisionBodies,
                    collisionMetadata: renderData.collisionMetadata,
                    collisionGroup: null,
                    roofLayers: renderData.roofLayers,
                    chunkX: chunkX,
                    chunkY: chunkY
                });
            }

            this.loadingChunks.delete(key);
            this._resolveChunkPromise(key);
        });

        this.scene.load.once(`loaderror`, (file) => {
            if (file.key === chunkKey) {
                console.error(`❌ Failed to load ${chunkKey}`);
                this.loadingChunks.delete(key);
                this._resolveChunkPromise(key);
                this.loadFallbackChunk(chunkX, chunkY, biome);
            }
        });

        this.scene.load.start();
    }

    /**
     * Resolve the promise for a chunk that finished loading
     */
    _resolveChunkPromise(key) {
        if (this.chunkResolvers.has(key)) {
            const resolve = this.chunkResolvers.get(key);
            resolve();
            this.chunkResolvers.delete(key);
            this.chunkLoadPromises.delete(key);
            console.log(`✅ Chunk ${key} promise resolved`);
        }
    }

    /**
     * Get chunk key from coordinates and biome
     */
    getChunkKey(chunkX, chunkY, biome) {
        // Weighted selection: chunk5 is extremely rare (1% chance)
        const variants = this.biomes[biome].chunks;
        const seed = this.numericSeed + (chunkX * 7919) + (chunkY * 6563);

        let variantIndex;
        if (biome === 'dark_forest') {
            // Dark Forest weighted distribution:
            // chunk1: 33%, chunk2: 33%, chunk3: 25%, chunk4: 8%, chunk5: 1% (EXTREMELY RARE)
            const random = this.seededRandom(seed);
            if (random < 0.33) {
                variantIndex = 0; // chunk1
            } else if (random < 0.66) {
                variantIndex = 1; // chunk2
            } else if (random < 0.91) {
                variantIndex = 2; // chunk3
            } else if (random < 0.99) {
                variantIndex = 3; // chunk4
            } else {
                variantIndex = 4; // chunk5 (1% chance - EXTREMELY RARE!)
            }
        } else {
            // Equal distribution for other biomes
            variantIndex = Math.floor(this.seededRandom(seed) * variants.length);
        }

        return variants[variantIndex];
    }

    /**
     * Process chunk data with worker thread
     */
    processChunkWithWorker(chunkKey, chunkX, chunkY, ldtkData) {
        const worldX = chunkX * this.CHUNK_SIZE_PIXELS;
        const worldY = chunkY * this.CHUNK_SIZE_PIXELS;

        // Fallback to direct processing if no workers
        if (this.processorWorkers.length === 0) {
            console.log(`  🔧 Processing directly (no workers): ${chunkKey}`);
            this.renderChunk(chunkKey, worldX, worldY, chunkX, chunkY);
            return;
        }

        const worker = this.processorWorkers[this.workerIndex % this.processorWorkers.length];
        this.workerIndex++;

        let timeoutHandle;

        const messageHandler = (e) => {
            // Handle log messages from worker (don't remove listener)
            if (e.data.type === 'log') {
                console.log('[ProcessorWorker]', e.data.message);
                return;
            }

            if (e.data.chunkKey === chunkKey) {
                clearTimeout(timeoutHandle);
                worker.removeEventListener('message', messageHandler);

                if (e.data.success) {
                    // Now create Phaser objects on main thread with preprocessed data
                    this.createChunkFromProcessedData(e.data, ldtkData);
                } else {
                    console.error(`Failed to process chunk ${chunkKey}:`, e.data.error);
                    this.loadingChunks.delete(`${chunkX},${chunkY}`);
                    this._resolveChunkPromise(`${chunkX},${chunkY}`); // Resolve promise even on failure
                }
            }
        };

        // Setup timeout after messageHandler is defined
        timeoutHandle = setTimeout(() => {
            worker.removeEventListener('message', messageHandler);
            console.warn(`  ⏱️ Processor timeout for ${chunkKey}, falling back to direct processing`);

            // Render chunk and properly store the data
            const key = `${chunkX},${chunkY}`;
            const renderData = this.renderChunk(chunkKey, worldX, worldY, chunkX, chunkY);

            if (renderData) {
                const biome = this.getBiomeForChunk(chunkX, chunkY);
                const containers = renderData.layers.map(l => l.container);

                // Spawn NPCs for chunk5 (timeout fallback path)
                this.spawnChunkNPCs(chunkKey, renderData.npcSpawns, renderData.collisionBodies);

                this.loadedChunks.set(key, {
                    biome: biome,
                    chunkKey: chunkKey,
                    position: { x: worldX, y: worldY },
                    containers: containers,
                    collisionBodies: renderData.collisionBodies,
                    collisionMetadata: renderData.collisionMetadata,
                    collisionGroup: null,
                    roofLayers: renderData.roofLayers,
                    chunkX: chunkX,
                    chunkY: chunkY
                });
            }

            this.loadingChunks.delete(key);
            this._resolveChunkPromise(key);
        }, 5000);

        worker.addEventListener('message', messageHandler);
        worker.postMessage({ ldtkData, worldX, worldY, chunkX, chunkY, chunkKey });
    }

    /**
     * Create Phaser objects from preprocessed chunk data
     */
    createChunkFromProcessedData(processedData, ldtkData) {
        const { chunkKey, chunkX, chunkY, processedLayers, collisionMetadata, npcSpawns } = processedData;
        const key = `${chunkX},${chunkY}`;
        const worldX = chunkX * this.CHUNK_SIZE_PIXELS;
        const worldY = chunkY * this.CHUNK_SIZE_PIXELS;

        console.log(`🎨 Creating chunk (${chunkX},${chunkY}) with ${processedLayers.length} layers`);

        const containers = [];
        const collisionBodies = [];
        const roofLayers = [];

        // Process each layer from preprocessed data
        processedLayers.forEach((layerData, index) => {
            console.log(`  Layer ${index}: ${layerData.identifier}, type: ${layerData.type}, tiles: ${layerData.tiles.length}`);

            if (layerData.type !== 'Tiles' && layerData.type !== 'IntGrid') {
                console.log(`  ⏭️ Skipping layer ${layerData.identifier} - not Tiles/IntGrid`);
                return;
            }
            if (layerData.tiles.length === 0) {
                console.log(`  ⏭️ Skipping layer ${layerData.identifier} - no tiles`);
                return;
            }

            // Get tileset info
            const tileset = ldtkData.defs.tilesets.find(t => t.uid === layerData.tilesetUid);
            if (!tileset) {
                console.warn(`⚠️ Tileset not found for UID ${layerData.tilesetUid} in layer ${layerData.identifier}`);
                return;
            }

            const textureKey = this.getTextureKey(tileset.relPath);
            console.log(`  🖼️ Layer ${layerData.identifier}: texture key "${textureKey}" from path "${tileset.relPath}"`);

            if (!this.scene.textures.exists(textureKey)) {
                console.error(`⚠️ Texture "${textureKey}" not found (from path: ${tileset.relPath})`);
                console.log('Available textures:', Object.keys(this.scene.textures.list).filter(k => k !== '__DEFAULT' && k !== '__MISSING').slice(0, 20));
                return;
            }

            // Create tilemap for this layer
            const map = this.scene.make.tilemap({
                tileWidth: tileset.tileGridSize,
                tileHeight: tileset.tileGridSize,
                width: 37,
                height: 37
            });

            const tilesetImage = map.addTilesetImage(textureKey, textureKey, tileset.tileGridSize, tileset.tileGridSize);
            const uniqueLayerName = `${layerData.identifier}_c${chunkX}_${chunkY}`;
            const tilemapLayer = map.createBlankLayer(uniqueLayerName, tilesetImage, worldX, worldY);

            // Set depth based on layer type
            if (layerData.isRoof) {
                tilemapLayer.setDepth(20000);
            } else {
                tilemapLayer.setDepth(-200 + index);
            }

            // Track roof bounds
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            // Place tiles
            layerData.tiles.forEach(tile => {
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

                // Track roof bounds
                if (layerData.isRoof) {
                    const worldTileX = worldX + tile.px[0];
                    const worldTileY = worldY + tile.px[1];
                    minX = Math.min(minX, worldTileX);
                    minY = Math.min(minY, worldTileY);
                    maxX = Math.max(maxX, worldTileX + tileset.tileGridSize);
                    maxY = Math.max(maxY, worldTileY + tileset.tileGridSize);
                }
            });

            containers.push(tilemapLayer);

            // Store roof layer info
            if (layerData.isRoof && layerData.tiles.length > 0) {
                roofLayers.push({
                    container: tilemapLayer,
                    bounds: { minX, minY, maxX, maxY }
                });
                console.log(`🏠 Roof layer "${layerData.identifier}" tracked: ${layerData.tiles.length} tiles`);
            }
        });

        // Create collision bodies from metadata
        collisionMetadata.forEach(meta => {
            const rect = this.scene.add.rectangle(meta.x, meta.y, meta.width, meta.height);
            rect.setOrigin(0.5, 0.5);
            this.scene.physics.add.existing(rect, true);
            rect.setVisible(false);
            collisionBodies.push(rect);
        });

        // Setup collision groups
        let collisionGroup = null;
        if (collisionBodies.length > 0) {
            collisionGroup = this.scene.physics.add.staticGroup();
            collisionBodies.forEach(body => collisionGroup.add(body));

            // Add colliders with entities
            if (this.scene.localPlayer && this.scene.localPlayer.sprite) {
                this.scene.physics.add.collider(this.scene.localPlayer.sprite, collisionGroup);
            }

            if (this.scene.players) {
                Object.values(this.scene.players).forEach(player => {
                    if (player && player.sprite) {
                        this.scene.physics.add.collider(player.sprite, collisionGroup);
                    }
                });
            }

            const enemyCollections = [
                this.scene.swordDemons,
                this.scene.minotaurs,
                this.scene.mushrooms,
                this.scene.emberclaws
            ];

            enemyCollections.forEach(collection => {
                if (collection) {
                    Object.values(collection).forEach(enemy => {
                        if (enemy && enemy.sprite) {
                            this.scene.physics.add.collider(enemy.sprite, collisionGroup);
                        }
                    });
                }
            });

            console.log(`🧱 Setup ${collisionBodies.length} collision bodies for chunk ${key} (O(n) optimization)`);
        }

        // Spawn NPCs for chunk5 (worker callback path)
        this.spawnChunkNPCs(chunkKey, npcSpawns, collisionBodies);

        // Store chunk data
        const biome = this.getBiomeForChunk(chunkX, chunkY);
        this.loadedChunks.set(key, {
            biome: biome,
            chunkKey: chunkKey,
            position: { x: worldX, y: worldY },
            containers: containers,
            collisionBodies: collisionBodies,
            collisionMetadata: collisionMetadata,
            collisionGroup: collisionGroup,
            roofLayers: roofLayers,
            chunkX: chunkX,
            chunkY: chunkY
        });

        this.loadingChunks.delete(key);

        // Resolve promise for this chunk
        this._resolveChunkPromise(key);
    }

    /**
     * Render a chunk's LDtk data at a specific world position
     */
    renderChunk(chunkKey, worldX, worldY, chunkX, chunkY) {
        const ldtkData = this.scene.cache.json.get(chunkKey);
        if (!ldtkData || !ldtkData.levels || ldtkData.levels.length === 0) {
            console.error(`❌ Invalid chunk data for ${chunkKey}`);
            return null;
        }

        const level = ldtkData.levels[0];
        const layers = [];
        const collisionBodies = [];
        const collisionMetadata = [];
        const roofLayers = [];

        // Process layers
        if (level.layerInstances) {
            const layerInstances = [...level.layerInstances].reverse();

            layerInstances.forEach((layer, index) => {
                if (layer.__type !== 'Tiles' && layer.__type !== 'IntGrid') return;

                // Check if this layer needs collision or roof handling
                const layerDef = ldtkData.defs.layers.find(l => l.uid === layer.layerDefUid);
                const hasCollision = layerDef && layerDef.doc && (
                    layerDef.doc.toLowerCase().includes('collision') ||
                    layerDef.doc.toLowerCase().includes('water')
                );
                const isRoof = layerDef && layerDef.doc && layerDef.doc.toLowerCase().includes('roof');

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
                    width: 37,  // All chunks are 37x37 tiles
                    height: 37
                });

                const tiles = [...(layer.gridTiles || []), ...(layer.autoLayerTiles || [])];

                // Track roof bounds if this is a roof layer
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                // For roof layers, use tilemaps for better performance (single draw call per layer)
                // For other layers, also use tilemap for performance
                if (isRoof) {
                    // Check for overlapping tiles at same position (LDtk supports multiple tiles per cell)
                    const tilePositions = new Map(); // key: "x,y" -> array of tiles
                    tiles.forEach(tile => {
                        const key = `${tile.px[0]},${tile.px[1]}`;
                        if (!tilePositions.has(key)) {
                            tilePositions.set(key, []);
                        }
                        tilePositions.get(key).push(tile);
                    });

                    // Check if any position has multiple tiles (needs sprite-based rendering)
                    // Only use sprite mode for chunk5 to avoid memory issues on normal chunks
                    let hasOverlapping = false;
                    const isSpecialChunk = chunkKey === 'darkForestChunk5';

                    if (isSpecialChunk) {
                        for (const tilesAtPos of tilePositions.values()) {
                            if (tilesAtPos.length > 1) {
                                hasOverlapping = true;
                                break;
                            }
                        }
                    }

                    if (hasOverlapping) {
                        // Use sprite container for overlapping tiles (supports multiple tiles per position)
                        // Only use sprite mode for special chunks to avoid memory issues
                        const roofContainer = this.scene.add.container(0, 0);
                        roofContainer.setDepth(20000);

                        tiles.forEach((tile, tileIndex) => {
                            const frameX = tile.src[0] / tileset.tileGridSize;
                            const frameY = tile.src[1] / tileset.tileGridSize;
                            const frameIndex = frameY * (tileset.pxWid / tileset.tileGridSize) + frameX;

                            // Use make.sprite instead of add.sprite to avoid adding to scene display list
                            // (container will manage the sprite)
                            const sprite = this.scene.make.sprite({
                                x: worldX + tile.px[0] + tileset.tileGridSize / 2,
                                y: worldY + tile.px[1] + tileset.tileGridSize / 2,
                                key: textureKey,
                                frame: frameIndex,
                                add: false // Don't add to scene - container handles it
                            });
                            sprite.setOrigin(0.5, 0.5);

                            if (tile.f === 1) sprite.setFlipX(true);
                            if (tile.f === 2) sprite.setFlipY(true);
                            if (tile.f === 3) { sprite.setFlipX(true); sprite.setFlipY(true); }

                            roofContainer.add(sprite);

                            // Track roof bounds
                            const worldTileX = worldX + tile.px[0];
                            const worldTileY = worldY + tile.px[1];
                            minX = Math.min(minX, worldTileX);
                            minY = Math.min(minY, worldTileY);
                            maxX = Math.max(maxX, worldTileX + tileset.tileGridSize);
                            maxY = Math.max(maxY, worldTileY + tileset.tileGridSize);
                        });

                        if (tiles.length > 0) {
                            roofLayers.push({
                                container: roofContainer,
                                bounds: { minX, minY, maxX, maxY }
                            });
                            console.log(`🏠 Roof layer "${layer.__identifier}" (sprite mode - overlapping tiles): ${tiles.length} tiles`);
                        }

                        layers.push({ container: roofContainer, hasCollision: false });
                    } else {
                        // OPTIMIZATION: Use tilemap for non-overlapping roofs (single draw call)
                        const tilesetImage = map.addTilesetImage(textureKey, textureKey, tileset.tileGridSize, tileset.tileGridSize);
                        const uniqueLayerName = `${layer.__identifier}_c${chunkX}_${chunkY}`;
                        const tilemapLayer = map.createBlankLayer(uniqueLayerName, tilesetImage, worldX, worldY);
                        tilemapLayer.setDepth(20000);

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

                            // Track roof bounds
                            const worldTileX = worldX + tile.px[0];
                            const worldTileY = worldY + tile.px[1];
                            minX = Math.min(minX, worldTileX);
                            minY = Math.min(minY, worldTileY);
                            maxX = Math.max(maxX, worldTileX + tileset.tileGridSize);
                            maxY = Math.max(maxY, worldTileY + tileset.tileGridSize);
                        });

                        if (tiles.length > 0) {
                            roofLayers.push({
                                container: tilemapLayer,
                                bounds: { minX, minY, maxX, maxY }
                            });
                            console.log(`🏠 Roof layer "${layer.__identifier}" (tilemap mode): ${tiles.length} tiles`);
                        }

                        layers.push({ container: tilemapLayer, hasCollision: false });
                    }
                } else {
                    // Use tilemap for non-roof layers (better performance)
                    const tilesetImage = map.addTilesetImage(textureKey, textureKey, tileset.tileGridSize, tileset.tileGridSize);
                    const uniqueLayerName = `${layer.__identifier}_c${chunkX}_${chunkY}`;
                    const tilemapLayer = map.createBlankLayer(uniqueLayerName, tilesetImage, worldX, worldY);
                    tilemapLayer.setDepth(-200 + index);

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

                        // Create collision body for this tile if needed
                        if (hasCollision) {
                            const worldTileX = worldX + tile.px[0];
                            const worldTileY = worldY + tile.px[1];
                            const tileSize = tileset.tileGridSize;

                            const rect = this.scene.add.rectangle(
                                worldTileX + tileSize / 2,
                                worldTileY + tileSize / 2,
                                tileSize,
                                tileSize
                            );
                            rect.setOrigin(0.5, 0.5);
                            this.scene.physics.add.existing(rect, true); // Static body
                            rect.setVisible(false);

                            collisionBodies.push(rect);

                            // Store metadata for recreation after caching
                            collisionMetadata.push({
                                x: worldTileX + tileSize / 2,
                                y: worldTileY + tileSize / 2,
                                width: tileSize,
                                height: tileSize
                            });
                        }
                    });

                    layers.push({ container: tilemapLayer, hasCollision: hasCollision });
                }

                if (hasCollision) {
                    console.log(`🧱 Collision layer "${layer.__identifier}": ${collisionBodies.length} bodies created`);
                }
            });
        }

        // Check for NPC spawn markers in IntGrid layers
        const npcSpawns = this.findNPCSpawnsInChunk(level, worldX, worldY);

        return { layers, npcSpawns, collisionBodies, collisionMetadata, roofLayers };
    }

    /**
     * Find NPC spawn markers in chunk IntGrid layers
     */
    findNPCSpawnsInChunk(level, worldX, worldY) {
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

    /**
     * Spawn NPCs and setup collision for special chunks like chunk5
     */
    spawnChunkNPCs(chunkKey, npcSpawns, collisionBodies) {
        // Only process chunk5 for now
        if (chunkKey !== 'darkForestChunk5') return;
        if (!npcSpawns || npcSpawns.length === 0) return;

        console.log(`🏪 Spawning ${npcSpawns.length} NPCs for ${chunkKey}`);

        if (!this.scene.chunk5NPCs) {
            this.scene.chunk5NPCs = [];
        }

        npcSpawns.forEach(spawn => {
            if (spawn.type === 'item_merchant') {
                const merchant = new MerchantNPC(this.scene, spawn.x, spawn.y, 'Item Merchant');
                this.scene.chunk5NPCs.push(merchant);
                console.log(`✅ Item Merchant spawned in chunk5 at (${spawn.x}, ${spawn.y})`);
            } else if (spawn.type === 'skill_trader') {
                const trader = new SkillShopNPC(this.scene, spawn.x, spawn.y, 'Skill Trader');
                this.scene.chunk5NPCs.push(trader);
                console.log(`✅ Skill Trader spawned in chunk5 at (${spawn.x}, ${spawn.y})`);
            } else if (spawn.type === 'banker') {
                const banker = new BankerNPC(this.scene, spawn.x, spawn.y, 'Soul Banker');
                this.scene.chunk5NPCs.push(banker);
                console.log(`✅ Soul Banker spawned in chunk5 at (${spawn.x}, ${spawn.y})`);
            }
        });

        // Setup chunk5 collision groups
        if (collisionBodies && collisionBodies.length > 0) {
            console.log(`🧱 Setting up ${collisionBodies.length} collision bodies for chunk5`);

            if (!this.scene.chunk5CollisionBodies) {
                this.scene.chunk5CollisionBodies = [];
            }
            this.scene.chunk5CollisionBodies.push(...collisionBodies);

            if (!this.scene.chunk5CollisionGroup) {
                this.scene.chunk5CollisionGroup = this.scene.physics.add.staticGroup();
            }
            collisionBodies.forEach(body => {
                this.scene.chunk5CollisionGroup.add(body);
            });

            // Add colliders for chunk5
            if (this.scene.localPlayer && this.scene.localPlayer.sprite) {
                this.scene.physics.add.collider(this.scene.localPlayer.sprite, this.scene.chunk5CollisionGroup);
            }

            if (this.scene.players) {
                Object.values(this.scene.players).forEach(player => {
                    if (player && player.sprite) {
                        this.scene.physics.add.collider(player.sprite, this.scene.chunk5CollisionGroup);
                    }
                });
            }

            const enemyCollections = [
                this.scene.swordDemons,
                this.scene.minotaurs,
                this.scene.mushrooms,
                this.scene.emberclaws
            ];

            enemyCollections.forEach(collection => {
                if (collection) {
                    Object.values(collection).forEach(enemy => {
                        if (enemy && enemy.sprite) {
                            this.scene.physics.add.collider(enemy.sprite, this.scene.chunk5CollisionGroup);
                        }
                    });
                }
            });

            console.log(`✅ Chunk5 collision setup complete`);
        }
    }

    /**
     * Determine which biome a chunk should be using multi-octave noise
     */
    getBiomeForChunk(chunkX, chunkY) {
        // Use world seed to make biome distribution unique per world
        const seed1 = this.numericSeed + 12345;
        const seed2 = this.numericSeed + 54321;
        const seed3 = this.numericSeed + 98765;

        // Use multiple octaves of noise for more organic distribution
        const noise1 = this.smoothNoise(chunkX, chunkY, 3.0, seed1);      // Large features
        const noise2 = this.smoothNoise(chunkX, chunkY, 1.5, seed2);      // Medium features
        const noise3 = this.smoothNoise(chunkX, chunkY, 0.75, seed3);     // Small features

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
     * Get file path for a chunk from chunk key
     */
    getChunkFilePath(chunkKey) {
        // Parse chunk key (e.g., 'darkForestChunk1', 'emberChunk1')
        if (chunkKey.startsWith('darkForest')) {
            const chunkNum = chunkKey.replace('darkForestChunk', '');
            return `assets/ldtk/biomes/Dark Forest/chunk${chunkNum}.ldtk`;
        } else if (chunkKey.startsWith('ember')) {
            const chunkNum = chunkKey.replace('emberChunk', '');
            return `assets/ldtk/biomes/Ember Wilds/chunk${chunkNum}.ldtk`;
        }

        // Fallback
        console.error(`Unknown chunk key format: ${chunkKey}`);
        return `assets/ldtk/biomes/Dark Forest/chunk1.ldtk`;
    }

    /**
     * Get Phaser texture key from LDtk path
     */
    getTextureKey(path) {
        const filename = path.split('/').pop().replace('.png', '');

        // Map LDtk tileset names to BootScene texture keys
        // BootScene loads textures with original capitalization
        const tilesetMap = {
            // Original capitalization
            'A4 - Walls': 'A4 - Walls',
            'A3 - Walls And Floors': 'A3 - Walls And Floors',
            'Fantasy_Outside_B': 'Fantasy_Outside_B',
            'Fantasy_Outside_C': 'Fantasy_Outside_C',
            'Fantasy_Outside_D': 'Fantasy_Outside_D',
            'Fantasy_Roofs': 'Fantasy_Roofs',
            'a1_water_green': 'a1_water_green',
            'a2_terrain_green': 'a2_terrain_green',
            'a2_terrain_red': 'a2_terrain_red',
            '!$Glowing_tree': '!$Glowing_tree',
            // Lowercase versions (for backwards compatibility)
            'a4 - walls': 'walls',
            'a3 - walls and floors': 'walls_floors',
            'fantasy_outside_b': 'fantasy_outside_b',
            'fantasy_roofs': 'fantasy_roofs',
            'glowing_tree': 'glowing_tree',
            'water_green': 'water_green',
            'walls': 'walls',
            'walls_floors': 'walls_floors',
            'terrain_green': 'terrain_green',
            'terrain_red': 'terrain_red',
            'fantasy_outside_c': 'fantasy_outside_c',
            'fantasy_outside_d': 'fantasy_outside_d'
        };

        return tilesetMap[filename] || filename;
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

                // CLEANUP: Destroy collision bodies and group to free physics memory
                if (chunkData.collisionBodies && chunkData.collisionBodies.length > 0) {
                    chunkData.collisionBodies.forEach(body => {
                        if (body && body.body) {
                            body.body.destroy(); // Destroy physics body
                        }
                        if (body) {
                            body.destroy(); // Destroy game object
                        }
                    });
                    console.log(`🧹 Destroyed ${chunkData.collisionBodies.length} collision bodies for chunk ${key}`);
                    chunkData.collisionBodies = []; // Clear the array
                }

                // Clean up collision group reference
                if (chunkData.collisionGroup) {
                    chunkData.collisionGroup = null;
                }

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

        if (this.scene.cache.json.has(fallbackKey)) {
            // Use worker system for fallback as well
            const data = this.scene.cache.json.get(fallbackKey);
            this.processChunkWithWorker(fallbackKey, chunkX, chunkY, data);
            console.log(`🔄 Loading fallback chunk at (${chunkX},${chunkY})`);
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
    /**
     * Preload and RENDER ALL chunks in the entire world during loading phase
     * This renders every single chunk tile before gameplay starts
     * World is 1000 tiles = ~27x27 chunks = ~729 total chunks to render
     */
    async preloadAndRenderAllChunks(worldSizeTiles = 1000, progressCallback = null) {
        console.log('🔄 Preloading and RENDERING ALL chunks in the world...');

        // Step 1: Load all LDTK files first
        const allChunkFiles = [
            'assets/ldtk/biomes/Dark Forest/chunk1.ldtk',
            'assets/ldtk/biomes/Dark Forest/chunk2.ldtk',
            'assets/ldtk/biomes/Dark Forest/chunk3.ldtk',
            'assets/ldtk/biomes/Dark Forest/chunk4.ldtk',
            'assets/ldtk/biomes/Dark Forest/chunk5.ldtk',
            'assets/ldtk/biomes/Ember Wilds/chunk1.ldtk',
            'assets/ldtk/biomes/Ember Wilds/chunk2.ldtk'
        ];

        console.log('📦 Step 1/2: Loading LDTK chunk files...');
        for (const filePath of allChunkFiles) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    console.error(`❌ Failed to load ${filePath}: ${response.status}`);
                    continue;
                }

                const ldtkData = await response.json();
                const fileName = filePath.split('/').pop().replace('.ldtk', '');
                const biomeFolder = filePath.includes('Dark Forest') ? 'darkForest' : 'ember';
                const cacheKey = `${biomeFolder}${fileName.charAt(0).toUpperCase() + fileName.slice(1)}`;
                this.scene.cache.json.add(cacheKey, ldtkData);
                console.log(`✅ Loaded ${cacheKey}`);
            } catch (error) {
                console.error(`❌ Error loading ${filePath}:`, error);
            }
        }

        // Step 2: Calculate how many chunks cover the world
        const worldSizePixels = worldSizeTiles * this.TILE_SIZE;
        const chunksWide = Math.ceil(worldSizePixels / this.CHUNK_SIZE_PIXELS);
        const chunksHigh = Math.ceil(worldSizePixels / this.CHUNK_SIZE_PIXELS);
        const totalChunks = chunksWide * chunksHigh;

        console.log(`🗺️ Step 2/2: Rendering ${totalChunks} chunks (${chunksWide}x${chunksHigh} grid)...`);
        console.log(`   World: ${worldSizeTiles} tiles (${worldSizePixels}px)`);
        console.log(`   Chunk: ${this.CHUNK_SIZE_TILES} tiles (${this.CHUNK_SIZE_PIXELS}px)`);

        let renderedCount = 0;

        // Render all chunks in the world
        for (let chunkX = 0; chunkX < chunksWide; chunkX++) {
            for (let chunkY = 0; chunkY < chunksHigh; chunkY++) {
                // Load and render this chunk
                this.loadChunk(chunkX, chunkY);

                renderedCount++;

                // Update progress every 10 chunks
                if (renderedCount % 10 === 0 || renderedCount === totalChunks) {
                    const percent = Math.floor((renderedCount / totalChunks) * 100);
                    console.log(`🎨 Rendered ${renderedCount}/${totalChunks} chunks (${percent}%)`);

                    if (progressCallback) {
                        progressCallback(renderedCount, totalChunks);
                    }

                    // Yield to prevent freezing (every 10 chunks)
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        }

        this.isPreloaded = true;
        console.log(`✅ ALL ${totalChunks} chunks fully rendered! World ready for gameplay.`);
    }

    async preloadNearSpawn(spawnX, spawnY, radius = 5) {
        console.log(`🔄 Preloading ${radius * 2 + 1}x${radius * 2 + 1} chunk grid (radius ${radius})...`);

        const spawnChunkX = Math.floor(spawnX / this.CHUNK_SIZE_PIXELS);
        const spawnChunkY = Math.floor(spawnY / this.CHUNK_SIZE_PIXELS);

        this.preloadRadius = radius;
        const totalChunks = (radius * 2 + 1) * (radius * 2 + 1);
        let loadedCount = 0;

        console.log(`📊 Total chunks to load: ${totalChunks} (${radius * 2 + 1} x ${radius * 2 + 1} grid)`);

        const loadPromises = [];
        const chunkStatus = new Map(); // Track which chunks finished

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const chunkX = spawnChunkX + dx;
                const chunkY = spawnChunkY + dy;
                const key = `${chunkX},${chunkY}`;

                chunkStatus.set(key, 'loading');

                // Load chunk and wait for it to actually finish
                const promise = this.loadChunk(chunkX, chunkY).then(() => {
                    loadedCount++;
                    chunkStatus.set(key, 'loaded');
                    const percent = Math.floor((loadedCount / totalChunks) * 100);

                    // Update loading progress in GameScene
                    if (this.scene.updateLoadingProgress) {
                        this.scene.updateLoadingProgress(loadedCount, totalChunks);
                    }
                });

                loadPromises.push(promise);
            }
        }

        // Wait for all chunks OR timeout after 30 seconds (whichever comes first)
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.warn(`⏱️ Preload timeout after 30s - ${loadedCount}/${totalChunks} chunks loaded`);

                // Log which chunks are still stuck
                const stuckChunks = [];
                chunkStatus.forEach((status, key) => {
                    if (status === 'loading') {
                        stuckChunks.push(key);
                    }
                });
                if (stuckChunks.length > 0) {
                    console.warn(`🔴 Stuck chunks (${stuckChunks.length}):`, stuckChunks.slice(0, 10).join(', '));
                }

                resolve();
            }, 30000);
        });

        await Promise.race([Promise.all(loadPromises), timeoutPromise]);
        this.isPreloaded = true;
        console.log(`✅ Preloaded ${loadedCount}/${totalChunks} chunks!`);
    }
}
