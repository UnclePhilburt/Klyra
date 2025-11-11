// KLYRA NETWORK - Colyseus Connection & State Sync

class Network {
    constructor(game) {
        this.game = game;
        this.client = null;
        this.room = null;
        this.connected = false;
        this.sessionId = null;
        
        // Network timing
        this.lastSyncTime = 0;
        this.syncInterval = 1000 / CONSTANTS.NETWORK_TICK_RATE;
        
        // State tracking
        this.lastSentPosition = { x: 0, y: 0 };
        
        // UI elements
        this.statusElement = document.getElementById('connectionStatus');
        this.loadingElement = document.getElementById('loading');
    }
    
    // Connect to Colyseus server
    async connect() {
        try {
            // Check if Colyseus is loaded
            if (typeof Colyseus === 'undefined') {
                throw new Error('Colyseus library not loaded. Please refresh the page.');
            }
            
            // Determine server URL (development vs production)
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const serverUrl = isDev ? CONSTANTS.SERVER_URL_DEV : CONSTANTS.SERVER_URL;
            
            console.log('Connecting to server:', serverUrl);
            
            // Create Colyseus client
            this.client = new Colyseus.Client(serverUrl);
            
            // Join or create room
            this.room = await this.client.joinOrCreate(CONSTANTS.ROOM_NAME, {
                customization: this.getPlayerCustomization()
            });
            
            this.sessionId = this.room.sessionId;
            this.connected = true;
            
            console.log('Connected! Session ID:', this.sessionId);
            this.updateConnectionStatus(true);
            
            // Hide loading screen
            if (this.loadingElement) {
                this.loadingElement.classList.add('hidden');
            }
            
            // Setup room listeners
            this.setupRoomListeners();
            
            return true;
            
        } catch (error) {
            console.error('Connection failed:', error);
            this.updateConnectionStatus(false);
            
            // Show error to user
            if (this.loadingElement) {
                this.loadingElement.innerHTML = `
                    <div>CONNECTION FAILED</div>
                    <div style="font-size: 14px; margin-top: 10px;">${error.message}</div>
                    <div style="font-size: 12px; margin-top: 10px;">Retrying in 5 seconds...</div>
                `;
            }
            
            // Retry connection after 5 seconds
            setTimeout(() => this.connect(), 5000);
            
            return false;
        }
    }
    
    // Setup room event listeners
    setupRoomListeners() {
        // Listen for state changes
        this.room.onStateChange((state) => {
            // Update game state when server state changes
            if (this.game) {
                this.game.onServerStateChange(state);
            }
        });
        
        // Listen for player additions
        this.room.state.players.onAdd((player, sessionId) => {
            console.log('Player joined:', sessionId);
            if (this.game) {
                this.game.onPlayerJoined(player, sessionId);
            }
        });
        
        // Listen for player removals
        this.room.state.players.onRemove((player, sessionId) => {
            console.log('Player left:', sessionId);
            if (this.game) {
                this.game.onPlayerLeft(sessionId);
            }
        });
        
        // Listen for player changes
        this.room.state.players.onChange((player, sessionId) => {
            if (this.game) {
                this.game.onPlayerChanged(player, sessionId);
            }
        });
        
        // Listen for game start
        this.room.state.listen('gameStarted', (value) => {
            if (value && this.game) {
                console.log('Game started!');
                this.game.onGameStarted();
            }
        });
        
        // Listen for map generation
        this.room.state.listen('mapGenerated', (value) => {
            if (value && this.game) {
                console.log('Map generated!');
            }
        });
        
        // Listen for disconnection
        this.room.onLeave((code) => {
            console.log('Disconnected from room:', code);
            this.connected = false;
            this.updateConnectionStatus(false);
            
            // Try to reconnect
            setTimeout(() => this.connect(), 3000);
        });
        
        // Listen for errors
        this.room.onError((code, message) => {
            console.error('Room error:', code, message);
        });
    }
    
    // Send player input to server
    sendInput(inputData) {
        if (!this.connected || !this.room) return;
        
        // Send to server
        this.room.send('input', inputData);
    }
    
    // Send player position to server (with throttling)
    sendPosition(x, y, direction, moving) {
        if (!this.connected || !this.room) return;
        
        const now = Date.now();
        
        // Check if enough time has passed
        if (now - this.lastSyncTime < this.syncInterval) {
            return;
        }
        
        // Check if position changed significantly
        const dx = Math.abs(x - this.lastSentPosition.x);
        const dy = Math.abs(y - this.lastSentPosition.y);
        
        if (dx < CONSTANTS.POSITION_SYNC_THRESHOLD && 
            dy < CONSTANTS.POSITION_SYNC_THRESHOLD) {
            return;
        }
        
        // Send position update
        this.room.send('input', {
            x: Math.floor(x),
            y: Math.floor(y),
            direction: direction,
            moving: moving
        });
        
        this.lastSentPosition = { x, y };
        this.lastSyncTime = now;
    }
    
    // Notify server that map is generated
    sendMapGenerated() {
        if (!this.connected || !this.room) return;
        
        console.log('Sending map generated notification');
        this.room.send('mapGenerated');
    }
    
    // Start game (host only)
    sendStartGame() {
        if (!this.connected || !this.room) return;
        
        if (this.isHost()) {
            console.log('Starting game as host');
            this.room.send('startGame');
        } else {
            console.warn('Only host can start the game');
        }
    }
    
    // Check if current player is host
    isHost() {
        if (!this.room || !this.room.state) return false;
        return this.room.state.hostId === this.sessionId;
    }
    
    // Get player customization data
    getPlayerCustomization() {
        // Get customization from menu if available
        let customization = {
            color: '#e74c3c',
            name: 'Player'
        };
        
        // Try to get name from menu
        if (window.menu && window.menu.getCustomization) {
            const menuCustom = window.menu.getCustomization();
            customization = menuCustom;
            console.log('Got customization from menu:', menuCustom);
        } else {
            console.warn('Menu not available, using default customization');
        }
        
        console.log('Sending player customization to server:', customization);
        return customization;
    }
    
    // Get current game state
    getGameState() {
        if (!this.room || !this.room.state) return null;
        return this.room.state;
    }
    
    // Get all players
    getPlayers() {
        if (!this.room || !this.room.state) return new Map();
        return this.room.state.players;
    }
    
    // Get local player
    getLocalPlayer() {
        if (!this.room || !this.room.state || !this.sessionId) return null;
        return this.room.state.players.get(this.sessionId);
    }
    
    // Get map seed
    getMapSeed() {
        if (!this.room || !this.room.state) return 0;
        return this.room.state.mapSeed;
    }
    
    // Update connection status UI
    updateConnectionStatus(connected) {
        if (!this.statusElement) return;
        
        if (connected) {
            this.statusElement.textContent = 'CONNECTED';
            this.statusElement.className = 'status-connected';
        } else {
            this.statusElement.textContent = 'DISCONNECTED';
            this.statusElement.className = 'status-disconnected';
        }
    }
    
    // Disconnect from server
    disconnect() {
        if (this.room) {
            this.room.leave();
            this.room = null;
        }
        
        this.connected = false;
        this.sessionId = null;
        this.updateConnectionStatus(false);
    }
    
    // Get network stats for debug
    getNetworkStats() {
        return {
            connected: this.connected,
            sessionId: this.sessionId ? this.sessionId.substring(0, 8) : 'null',
            isHost: this.isHost(),
            players: this.getPlayers().size,
            ping: this.room ? Math.round(this.room.ping || 0) : 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Network;
}