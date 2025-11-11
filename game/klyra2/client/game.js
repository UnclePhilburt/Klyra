// KLYRA GAME - Main Game Loop & Initialization

class Game {
    constructor() {
        // Core systems
        this.renderer = null;
        this.network = null;
        this.mobileInput = null;
        this.mapGenerator = null;
        this.vegetationSystem = null;
        this.flowerSystem = null;
        this.combatSystem = null;
        
        // Game state
        this.running = false;
        this.initialized = false;
        this.localPlayer = null;
        this.remotePlayers = new Map();
        
        // World
        this.worldSeed = 0;
        this.tiles = new Map();
        this.chunks = new Map();
        
        // Input
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Timing
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / 60;
        
        // Debug
        this.debugMode = CONSTANTS.DEBUG_MODE;
        
        window.game = this;
    }
    
    async init() {
        console.log('Initializing Klyra...');
        
        // Initialize renderer
        this.renderer = new Renderer();
        console.log('Renderer initialized');
        
        // Initialize mobile input
        this.mobileInput = new MobileInput(this);
        this.mobileInput.init();
        
        // Initialize network
        this.network = new Network(this);
        console.log('Network initialized');
        
        // Connect to server
        const connected = await this.network.connect();
        
        if (connected) {
            // Setup input handlers
            this.setupInput();
            
            // Wait for room state and get world seed
            await this.waitForRoomState();
            this.worldSeed = this.network.getMapSeed();
            console.log('World seed:', this.worldSeed);
            
            // Initialize map generator
            this.mapGenerator = new MapGenerator(this.worldSeed);
            console.log('Map generator initialized');
            
            // Initialize vegetation system
            if (typeof VegetationSystem !== 'undefined') {
                this.vegetationSystem = new VegetationSystem(this.mapGenerator);
                console.log('Vegetation system initialized');
            } else {
                console.warn('VegetationSystem not found - trees disabled');
            }
            
            // Initialize flower system
            if (typeof FlowerSystem !== 'undefined') {
                this.flowerSystem = new FlowerSystem(this.mapGenerator);
                console.log('Flower system initialized');
            } else {
                console.warn('FlowerSystem not found - flowers disabled');
            }
            
            // Initialize combat system
            if (typeof CombatSystem !== 'undefined') {
                this.combatSystem = new CombatSystem(this);
                console.log('Combat system initialized');
            } else {
                console.warn('CombatSystem not found - combat disabled');
            }
            
            // Log tile library info
            console.log(`Tile Library loaded: ${TILE_LIBRARY.totalTiles} tiles available`);
            console.log('Available biomes:', TILE_LIBRARY.getAllBiomes());
            
            // Generate initial world around spawn
            this.generateWorldAroundPoint(CONSTANTS.PLAYER_SPAWN_X, CONSTANTS.PLAYER_SPAWN_Y);
            
            // Notify server that map is generated
            this.network.sendMapGenerated();
            
            this.initialized = true;
            
            // Start game loop
            this.start();
        }
    }
    
    async waitForRoomState() {
        return new Promise((resolve) => {
            const checkState = () => {
                if (this.network.room && this.network.room.state && this.network.room.state.mapSeed) {
                    resolve();
                } else {
                    setTimeout(checkState, 50);
                }
            };
            checkState();
        });
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game started!');
    }
    
    gameLoop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.accumulator += this.deltaTime;
        
        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        if (!this.initialized) return;
        
        // Update local player
        this.updateLocalPlayer(deltaTime);
        
        // Update remote players
        this.updateRemotePlayers(deltaTime);
        
        // Update vegetation animation
        if (this.vegetationSystem) {
            this.vegetationSystem.update(deltaTime);
        }
        
        // Update flower animation
        if (this.flowerSystem) {
            this.flowerSystem.update(deltaTime);
        }
        
        // Update combat system
        if (this.combatSystem) {
            this.combatSystem.update(deltaTime);
        }
        
        // Generate world around player
        if (this.localPlayer) {
            this.generateWorldAroundPoint(this.localPlayer.x, this.localPlayer.y);
            
            // Cleanup distant vegetation and flowers to prevent memory issues
            if (this.vegetationSystem) {
                this.vegetationSystem.cleanup(this.localPlayer.x, this.localPlayer.y, 10000);
            }
            if (this.flowerSystem) {
                this.flowerSystem.cleanup(this.localPlayer.x, this.localPlayer.y, 10000);
            }
            if (this.combatSystem) {
                this.combatSystem.cleanup();
            }
        }
    }
    
    updateLocalPlayer(deltaTime) {
        const serverPlayer = this.network.getLocalPlayer();
        if (!serverPlayer) return;
        
        if (!this.localPlayer) {
            this.localPlayer = {
                x: serverPlayer.x,
                y: serverPlayer.y,
                vx: 0,
                vy: 0,
                direction: serverPlayer.direction,
                moving: false,
                animFrame: 0,
                customization: serverPlayer.customization || ''
            };
        }
        
        if (serverPlayer.customization !== this.localPlayer.customization) {
            console.log('Syncing local player customization:', serverPlayer.customization);
            this.localPlayer.customization = serverPlayer.customization || '';
        }
        
        // Handle input
        let inputVel = { x: 0, y: 0 };
        
        if (this.mobileInput && this.mobileInput.isMobileEnabled()) {
            const mobileInput = this.mobileInput.getInput();
            if (mobileInput.active) {
                inputVel.x = mobileInput.x;
                inputVel.y = mobileInput.y;
            }
        } else {
            if (this.isKeyDown('up')) inputVel.y = -1;
            if (this.isKeyDown('down')) inputVel.y = 1;
            if (this.isKeyDown('left')) inputVel.x = -1;
            if (this.isKeyDown('right')) inputVel.x = 1;
        }
        
        // Normalize diagonal movement
        if (inputVel.x !== 0 && inputVel.y !== 0) {
            const len = Math.sqrt(inputVel.x * inputVel.x + inputVel.y * inputVel.y);
            inputVel.x /= len;
            inputVel.y /= len;
        }
        
        this.localPlayer.vx = inputVel.x * CONSTANTS.PLAYER_SPEED;
        this.localPlayer.vy = inputVel.y * CONSTANTS.PLAYER_SPEED;
        
        if (this.localPlayer.vx !== 0 || this.localPlayer.vy !== 0) {
            this.localPlayer.moving = true;
            
            const newX = this.localPlayer.x + this.localPlayer.vx;
            const newY = this.localPlayer.y + this.localPlayer.vy;
            
            if (this.canMoveTo(newX, newY)) {
                this.localPlayer.x = newX;
                this.localPlayer.y = newY;
                
                if (Math.abs(this.localPlayer.vx) > Math.abs(this.localPlayer.vy)) {
                    this.localPlayer.direction = this.localPlayer.vx > 0 ? 'right' : 'left';
                } else {
                    this.localPlayer.direction = this.localPlayer.vy > 0 ? 'down' : 'up';
                }
                
                this.localPlayer.animFrame += CONSTANTS.ANIM_SPEED;
                if (this.localPlayer.animFrame >= CONSTANTS.ANIM_FRAMES) {
                    this.localPlayer.animFrame = 0;
                }
            }
        } else {
            this.localPlayer.moving = false;
            this.localPlayer.animFrame = 0;
        }
        
        this.network.sendPosition(this.localPlayer.x, this.localPlayer.y, this.localPlayer.direction);
    }
    
    updateRemotePlayers(deltaTime) {
        const players = this.network.getPlayers();
        
        this.remotePlayers.clear();
        
        for (const [sessionId, player] of players.entries()) {
            if (sessionId === this.network.sessionId) continue;
            
            this.remotePlayers.set(sessionId, {
                x: player.x,
                y: player.y,
                direction: player.direction || 'down',
                customization: player.customization || ''
            });
        }
    }
    
    canMoveTo(x, y) {
        if (this.mapGenerator && !this.mapGenerator.isWalkable(x, y)) {
            return false;
        }
        
        // Check tree collision
        if (this.vegetationSystem) {
            if (this.vegetationSystem.checkCollision(x - 8, y - 8, 16, 16)) {
                return false;
            }
        }
        
        return true;
    }
    
    generateWorldAroundPoint(x, y) {
        if (!this.mapGenerator) return;
        
        const chunkSize = CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        // Generate chunks further out than render distance to prevent pop-in
        // Trees will spawn smoothly just outside viewport
        const generationDist = CONSTANTS.RENDER_DISTANCE + 2; // +2 chunks buffer
        
        const centerChunk = {
            x: Math.floor(x / chunkSize),
            y: Math.floor(y / chunkSize)
        };
        
        // Generate chunks in wider area for smooth tree appearance
        for (let cy = centerChunk.y - generationDist; cy <= centerChunk.y + generationDist; cy++) {
            for (let cx = centerChunk.x - generationDist; cx <= centerChunk.x + generationDist; cx++) {
                const chunkKey = UTILS.chunkKey(cx, cy);
                
                if (!this.chunks.has(chunkKey)) {
                    this.generateChunk(cx, cy);
                }
            }
        }
    }
    
    generateChunk(chunkX, chunkY) {
        const chunkKey = UTILS.chunkKey(chunkX, chunkY);
        
        if (this.chunks.has(chunkKey)) {
            return;
        }
        
        this.chunks.set(chunkKey, true);
        
        // MULTIPLAYER SYNC: Map and trees use world seed for deterministic generation
        // Both players generate identical chunks/trees from same seed = perfect sync
        if (this.mapGenerator) {
            this.mapGenerator.generateChunk(chunkX, chunkY);
        }
        
        // Generate trees for this chunk (deterministic - same for all players)
        if (this.vegetationSystem) {
            this.vegetationSystem.generateTreesForChunk(chunkX, chunkY);
        }
        
        // Generate flowers for this chunk (deterministic - same for all players)
        if (this.flowerSystem) {
            this.flowerSystem.generateFlowersForChunk(chunkX, chunkY);
        }
    }
    
    render() {
        if (!this.renderer || !this.initialized) return;
        
        this.renderer.updateFPS();
        this.renderer.clear();
        
        if (this.localPlayer) {
            this.renderer.updateCamera(this.localPlayer.x, this.localPlayer.y);
        }
        
        this.renderer.begin();
        
        // Render world tiles
        this.renderWorld();
        
        // Render flowers (ground layer - behind everything)
        if (this.flowerSystem) {
            this.flowerSystem.render(
                this.renderer.ctx, 
                this.renderer.cameraX, 
                this.renderer.cameraY
            );
        }
        
        // Render vegetation AND players with depth sorting
        // This handles both trees and players, sorting by Y position for proper depth
        if (this.vegetationSystem) {
            // Combine remote and local players
            const allPlayers = new Map(this.remotePlayers);
            if (this.localPlayer) {
                const serverPlayer = this.network.getLocalPlayer();
                if (serverPlayer) {
                    allPlayers.set(this.network.sessionId, this.localPlayer);
                }
            }
            
            // Render everything with depth sorting
            this.renderer.renderEntitiesWithDepth(allPlayers, this.network.sessionId, this.vegetationSystem);
        } else {
            // Fallback if no vegetation system - render players normally
            this.remotePlayers.forEach((player, sessionId) => {
                this.renderer.renderPlayer(player, sessionId, false);
            });
            
            if (this.localPlayer) {
                const serverPlayer = this.network.getLocalPlayer();
                if (serverPlayer) {
                    this.renderer.renderPlayer(this.localPlayer, this.network.sessionId, true);
                }
            }
        }
        
        // Render combat system (enemies, projectiles, explosions)
        if (this.combatSystem) {
            this.combatSystem.render(
                this.renderer.ctx,
                this.renderer.cameraX,
                this.renderer.cameraY
            );
        }
        
        this.renderer.renderGrid();
        this.renderer.end();
        
        const debugInfo = this.getDebugInfo();
        this.renderer.renderUI(debugInfo);
    }
    
    renderWorld() {
        if (!this.localPlayer || !this.mapGenerator) return;
        
        const camX = this.renderer.cameraX;
        const camY = this.renderer.cameraY;
        const camW = this.renderer.canvas.width;
        const camH = this.renderer.canvas.height;
        
        const startTile = UTILS.worldToTile(camX - CONSTANTS.TILE_SIZE, camY - CONSTANTS.TILE_SIZE);
        const endTile = UTILS.worldToTile(camX + camW + CONSTANTS.TILE_SIZE, camY + camH + CONSTANTS.TILE_SIZE);
        
        for (let tx = startTile.x; tx <= endTile.x; tx++) {
            for (let ty = startTile.y; ty <= endTile.y; ty++) {
                const tile = this.mapGenerator.getTileAt(tx, ty);
                
                if (tile) {
                    const worldX = tx * CONSTANTS.TILE_SIZE;
                    const worldY = ty * CONSTANTS.TILE_SIZE;
                    
                    if (this.renderer.isInView(worldX, worldY, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE)) {
                        this.renderer.ctx.fillStyle = tile.color;
                        this.renderer.ctx.fillRect(worldX, worldY, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
                        
                        const hillNoise = UTILS.simpleNoise(tx / 8, ty / 8, tile.id);
                        
                        if (hillNoise > 0.8) {
                            const elevationShade = tile.elevation ? tile.elevation * 0.02 : 0.01;
                            this.renderer.ctx.fillStyle = `rgba(0, 0, 0, ${elevationShade})`;
                            this.renderer.ctx.fillRect(worldX, worldY, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
                        } else if (hillNoise < 0.2) {
                            const elevationHighlight = tile.elevation ? (1 - tile.elevation) * 0.02 : 0.01;
                            this.renderer.ctx.fillStyle = `rgba(255, 255, 255, ${elevationHighlight})`;
                            this.renderer.ctx.fillRect(worldX, worldY, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
                        }
                    }
                }
            }
        }
    }
    
    getDebugInfo() {
        if (!this.debugMode) return {};
        
        const networkStats = this.network.getNetworkStats();
        
        let currentBiome = 'Unknown';
        if (this.localPlayer && this.mapGenerator) {
            currentBiome = this.mapGenerator.getBiomeAt(this.localPlayer.x, this.localPlayer.y);
        }
        
        const debugInfo = {
            'Position': this.localPlayer ? 
                `${Math.floor(this.localPlayer.x)}, ${Math.floor(this.localPlayer.y)}` : 'N/A',
            'Biome': currentBiome,
            'Chunks': this.mapGenerator ? this.mapGenerator.getChunkCount() : 0,
            'Players': networkStats.players,
            'Ping': `${networkStats.ping}ms`,
            'Host': networkStats.isHost ? 'YES' : 'NO',
            'Seed': this.worldSeed
        };
        
        // Add combat stats
        if (this.combatSystem) {
            const combatStats = this.combatSystem.getStats();
            debugInfo['Enemies'] = combatStats.enemies;
            debugInfo['Kills'] = combatStats.kills;
        }
        
        return debugInfo;
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (CONSTANTS.KEY_DEBUG.includes(e.code)) {
                this.debugMode = !this.debugMode;
                CONSTANTS.DEBUG_MODE = this.debugMode;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            const rect = this.renderer.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        window.addEventListener('mousedown', (e) => {
            this.keys['Mouse' + e.button] = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            this.keys['Mouse' + e.button] = false;
        });
    }
    
    isKeyDown(action) {
        const keys = CONSTANTS[`KEY_${action.toUpperCase()}`];
        if (!keys) return false;
        
        return keys.some(key => this.keys[key]);
    }
    
    onServerStateChange(state) {}
    onPlayerJoined(player, sessionId) { console.log('Player joined:', sessionId); }
    onPlayerLeft(sessionId) { console.log('Player left:', sessionId); this.remotePlayers.delete(sessionId); }
    onPlayerChanged(player, sessionId) {}
    onGameStarted() { console.log('Game has started!'); }
    
    stop() {
        this.running = false;
        console.log('Game stopped');
    }
    
    destroy() {
        this.stop();
        
        if (this.network) {
            this.network.disconnect();
        }
        
        console.log('Game destroyed');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}