// Network Manager - Handles all Socket.IO communication
class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.currentPlayer = null;
        this.lobbyId = null;
        this.players = new Map();
        this.callbacks = {};

        // Batching system
        this.updateQueue = [];
        this.lastBatchTime = 0;
        this.BATCH_INTERVAL = 50; // Send batches every 50ms
        this.batchSenderInterval = null; // PERFORMANCE: Store interval ID for cleanup

        // Delta compression
        this.lastPosition = null;

        // Start batch sender
        this.startBatchSender();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(GameConfig.SERVER_URL, {
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to server');
                this.connected = true;
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Connection error:', error);
                this.connected = false;
                reject(error);
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 Disconnected from server');
                this.connected = false;
                this.emit('disconnected');
            });

            this.setupListeners();
        });
    }

    setupListeners() {
        // Lobby events
        this.socket.on('lobby:joined', (data) => {
            console.log('🎮 Joined lobby:', data);
            this.currentPlayer = data.player;
            this.lobbyId = data.lobbyId;
            this.players.clear();
            data.players.forEach(p => this.players.set(p.id, p));
            this.emit('lobby:joined', data);
        });

        this.socket.on('player:joined', (data) => {
            console.log('👋 Player joined:', data.player.username);
            this.players.set(data.player.id, data.player);
            this.emit('player:joined', data);
        });

        this.socket.on('player:left', (data) => {
            console.log('👋 Player left:', data.username);
            this.players.delete(data.playerId);
            this.emit('player:left', data);
        });

        this.socket.on('player:disconnected', (data) => {
            console.log('⚠️ Player disconnected:', data.username);
            this.emit('player:disconnected', data);
        });

        this.socket.on('player:ready', (data) => {
            console.log('✅ Player ready:', data.username);
            const player = this.players.get(data.playerId);
            if (player) player.isReady = true;
            this.emit('player:ready', data);
        });

        this.socket.on('player:update', (data) => {
            // Update player data (e.g., currency from blackjack)
            const player = this.players.get(data.id);
            if (player) {
                if (data.currency !== undefined) {
                    player.currency = data.currency;
                    console.log(`💰 Player ${data.id} currency updated: ${data.currency}`);
                }
                if (data.souls !== undefined) {
                    player.souls = data.souls;
                    console.log(`💰 Player ${data.id} souls updated: ${data.souls}`);
                }
            }
            this.emit('player:update', data);
        });

        // Game events
        this.socket.on('game:countdown', (data) => {
            console.log('⏰ Game starting in', data.seconds, 'seconds');
            this.emit('game:countdown', data);
        });

        this.socket.on('game:start', (data) => {
            console.log('🎮 Game started!', data);
            // Set player data (instant join - no lobby wait)
            this.currentPlayer = data.player;
            this.lobbyId = data.lobbyId;
            this.players.clear();
            data.players.forEach(p => this.players.set(p.id, p));
            this.emit('game:start', data);
        });

        this.socket.on('player:moved', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.position = data.position;
            }
            this.emit('player:moved', data);
        });

        this.socket.on('player:attacked', (data) => {
            this.emit('player:attacked', data);
        });

        this.socket.on('player:damaged', (data) => {
            this.emit('player:damaged', data);
        });

        this.socket.on('player:levelup', (data) => {
            console.log(`🎉 ${data.playerName} leveled up to level ${data.level}!`);
            this.emit('player:levelup', data);
        });

        this.socket.on('skill:sound', (data) => {
            this.emit('skill:sound', data);
        });

        this.socket.on('player:died', (data) => {
            const player = this.players.get(data.playerId);
            if (player) player.isAlive = false;
            this.emit('player:died', data);
        });

        // Enemy events
        this.socket.on('enemy:moved', (data) => {
            this.emit('enemy:moved', data);
        });

        // PERFORMANCE: Batched enemy movements
        this.socket.on('enemies:moved:batch', (data) => {
            this.emit('enemies:moved:batch', data);
        });

        this.socket.on('enemy:spawned', (data) => {
            this.emit('enemy:spawned', data);
        });

        // DYNAMIC SPAWN SYSTEM: Handle enemy despawns
        this.socket.on('enemy:despawned', (data) => {
            this.emit('enemy:despawned', data);
        });

        this.socket.on('enemy:damaged', (data) => {
            this.emit('enemy:damaged', data);
        });

        this.socket.on('enemy:position', (data) => {
            this.emit('enemy:position', data);
        });

        this.socket.on('enemy:killed', (data) => {
            this.emit('enemy:killed', data);
        });

        this.socket.on('enemy:attack', (data) => {
            this.emit('enemy:attack', data);
        });

        // Item events
        this.socket.on('item:spawned', (data) => {
            // PERFORMANCE: Removed debug logging
            this.emit('item:spawned', data);
        });

        this.socket.on('item:picked', (data) => {
            this.emit('item:picked', data);
        });

        // Minion events
        this.socket.on('minion:spawned', (data) => {
            // PERFORMANCE: Removed debug logging
            this.emit('minion:spawned', data);
        });

        this.socket.on('minion:moved', (data) => {
            this.emit('minion:moved', data);
        });

        this.socket.on('minion:died', (data) => {
            this.emit('minion:died', data);
        });

        this.socket.on('minion:damaged', (data) => {
            this.emit('minion:damaged', data);
        });

        this.socket.on('minion:healed', (data) => {
            this.emit('minion:healed', data);
        });

        // Chat events
        this.socket.on('chat:message', (data) => {
            console.log(`💬 ${data.username}: ${data.message}`);
            this.emit('chat:message', data);
        });

        // Server events
        this.socket.on('server:shutdown', (data) => {
            console.log('⚠️ Server shutdown:', data.message);
            this.emit('server:shutdown', data);
        });

        this.socket.on('kicked', (data) => {
            console.log('⛔ Kicked:', data.reason);
            this.emit('kicked', data);
        });

        this.socket.on('error', (data) => {
            console.error('❌ Server error:', data.message);
            this.emit('error', data);
        });

        // Skill system events
        this.socket.on('player:skillUpdate', (data) => {
            console.log(`✨ Player ${data.playerId} updated skills`);
            this.emit('player:skillUpdate', data);
        });

        this.socket.on('player:respawned', (data) => {
            console.log(`💚 Player respawned:`, data.playerName);

            // CRITICAL FIX: Reset position tracking on respawn
            // This ensures the next movement sends absolute position, not delta
            this.lastPosition = null;

            this.emit('player:respawned', data);
        });

        this.socket.on('skills:restored', (data) => {
            console.log('🔄 Skills restored from server:', data);
            this.emit('skills:restored', data);
        });

        // Pet system events
        this.socket.on('player:petEquipped', (data) => {
            console.log(`🐾 Player ${data.playerId} equipped pet: ${data.petType}`);
            this.emit('player:petEquipped', data);
        });

        this.socket.on('player:petUnequipped', (data) => {
            console.log(`🐾 Player ${data.playerId} unequipped pet`);
            this.emit('player:petUnequipped', data);
        });

        // Pet position/state updates from other players
        this.socket.on('pet:updated', (data) => {
            this.emit('pet:updated', data);
        });

        // Bank system events
        this.socket.on('bank:data', (data) => {
            console.log('💰 NetworkManager received bank:data:', data);
            this.emit('bank:data', data);
        });

        this.socket.on('bank:depositConfirm', (data) => {
            console.log('💰 NetworkManager received bank:depositConfirm:', data);
            this.emit('bank:depositConfirm', data);
        });

        this.socket.on('bank:withdrawConfirm', (data) => {
            console.log('💰 NetworkManager received bank:withdrawConfirm:', data);
            this.emit('bank:withdrawConfirm', data);
        });

        this.socket.on('bank:error', (data) => {
            console.error('💰 NetworkManager received bank:error:', data);
            this.emit('bank:error', data);
        });

        // Malachar ability events
        this.socket.on('ability:used', (data) => {
            // PERFORMANCE: Removed debug logging
            this.emit('ability:used', data);
        });

        // Orb collection events
        this.socket.on('orb:collected', (data) => {
            // PERFORMANCE: Removed debug logging
            this.emit('orb:collected', data);
        });

        // Passive skill events
        this.socket.on('passiveSkill:activated', (data) => {
            // PERFORMANCE: Removed debug logging
            this.emit('passiveSkill:activated', data);
        });

        // Piercing fireball cast
        this.socket.on('piercingFireball:cast', (data) => {
            // PERFORMANCE: Removed debug logging
            this.emit('piercingFireball:cast', data);
        });
    }

    // Send player join
    joinGame(username, characterClass = 'warrior', difficulty = 'normal') {
        // Get JWT token from localStorage if user is logged in
        const token = localStorage.getItem('klyra_token');

        this.socket.emit('player:join', {
            username,
            characterClass,
            difficulty,
            token: token || null
        });
    }

    // Send player ready
    playerReady() {
        this.socket.emit('player:ready');
    }

    // Batch sender (runs continuously)
    startBatchSender() {
        // PERFORMANCE: Clear any existing interval first (prevent memory leak)
        if (this.batchSenderInterval) {
            clearInterval(this.batchSenderInterval);
        }

        this.batchSenderInterval = setInterval(() => {
            if (this.updateQueue.length > 0 && this.connected) {
                // PERFORMANCE: Removed debug logging (was causing 2-5 FPS loss)
                // Send all queued updates at once
                this.socket.emit('batch:update', this.updateQueue);
                this.updateQueue = [];
            }
        }, this.BATCH_INTERVAL);
    }

    // Queue update for batching
    queueUpdate(type, data) {
        this.updateQueue.push({ type, data, timestamp: Date.now() });
    }

    // Send player movement (with delta compression)
    movePlayer(position) {
        // Delta compression: only send if position changed significantly
        if (this.lastPosition) {
            const dx = position.x - this.lastPosition.x;
            const dy = position.y - this.lastPosition.y;

            // Only send if moved at least 1 pixel (smooth movement)
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                return; // Skip redundant update
            }

            // Send delta instead of absolute position
            this.queueUpdate('move', { delta: { x: dx, y: dy } });
        } else {
            // First update: send absolute position
            this.queueUpdate('move', { position });
        }

        this.lastPosition = { ...position };
    }

    // Send attack
    attack(target, damage) {
        this.socket.emit('player:attack', { target, damage });
    }

    // Hit enemy
    hitEnemy(enemyId, damage, attackerId = null, attackerPosition = null, effects = null) {
        this.socket.emit('enemy:hit', { enemyId, damage, attackerId, attackerPosition, effects });
    }

    // Pick up item
    pickupItem(itemId) {
        this.socket.emit('item:pickup', { itemId });
    }

    // Send chat message
    sendChat(message) {
        this.socket.emit('chat:message', { message });
    }

    // Report death
    reportDeath(killedBy) {
        this.socket.emit('player:death', { killedBy });
    }

    // Report minion death
    reportMinionDeath(minionId, isPermanent) {
        this.socket.emit('minion:death', { minionId, isPermanent });
        // PERFORMANCE: Removed debug logging
    }

    // Update minion position (so enemies can target them)
    updateMinionPosition(minionId, position, isPermanent = false, animationState = 'minion_idle', flipX = false) {
        this.socket.emit('minion:position', { minionId, position, isPermanent, animationState, flipX });
    }

    // Change map (interior/exterior)
    changeMap(mapName) {
        this.socket.emit('player:changeMap', { mapName });
        // PERFORMANCE: Removed debug logging
    }

    // Send skill selection to server
    selectSkill(skill, multipliers) {
        this.socket.emit('skill:selected', { skill, multipliers });
        // PERFORMANCE: Removed debug logging
    }

    // Track permanent minion
    trackPermanentMinion(minionId, action = 'add') {
        this.socket.emit('minion:permanent', { minionId, action });
    }

    // Request minion spawn from server (server-authoritative)
    requestMinionSpawn(minionId, position, isPermanent) {
        this.socket.emit('minion:requestSpawn', {
            minionId,
            position,
            isPermanent
        });
        // PERFORMANCE: Removed debug logging
    }

    // Request skill restoration from server
    requestSkillRestore() {
        this.socket.emit('skills:requestRestore');
        // PERFORMANCE: Removed debug logging
    }

    // Send respawn request
    respawn() {
        this.socket.emit('player:respawn');
        // PERFORMANCE: Removed debug logging
    }

    // Send skill sound event to other players
    playSkillSound(soundKey, position) {
        this.socket.emit('skill:sound', { soundKey, position });
    }

    // Send Malachar ability usage
    useAbility(abilityKey, abilityName, targetPlayerId, effects) {
        // PERFORMANCE: Removed debug logging
        this.socket.emit('ability:use', {
            abilityKey,
            abilityName,
            targetPlayerId,
            effects
        });
    }

    // Send auto-attack effect (for visual sync across clients)
    broadcastAutoAttack(autoAttackName, targetMinionId) {
        this.socket.emit('ability:use', {
            abilityKey: 'autoattack',
            abilityName: autoAttackName,
            targetMinionId: targetMinionId,
            effects: {}
        });
    }

    // Broadcast orb collection to other players
    collectOrb(orbId, expValue, playerX, playerY) {
        // PERFORMANCE: Removed debug logging
        this.socket.emit('orb:collect', {
            orbId: orbId,
            expValue: expValue,
            collectorX: playerX,
            collectorY: playerY
        });
    }

    // Event emitter
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    disconnect() {
        // PERFORMANCE: Clear batch sender interval (prevent memory leak)
        if (this.batchSenderInterval) {
            clearInterval(this.batchSenderInterval);
            this.batchSenderInterval = null;
        }

        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Global network manager instance
const networkManager = new NetworkManager();
window.networkManager = networkManager; // Make it globally accessible
