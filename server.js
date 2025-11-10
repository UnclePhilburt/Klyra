const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: ["https://klyra.lol", "http://localhost:3000", "http://localhost:5500"],
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Game constants
const MAX_PLAYERS_PER_LOBBY = 10;
const LOBBY_START_DELAY = 3000; // 3 seconds before game starts when lobby is full

// Data structures
const lobbies = new Map(); // lobbyId -> Lobby object
const players = new Map(); // socketId -> Player object
const waitingQueue = []; // Array of player socketIds waiting for a lobby

// Player class
class Player {
    constructor(socketId, username) {
        this.id = socketId;
        this.username = username || `Player_${Math.floor(Math.random() * 9999)}`;
        this.lobbyId = null;
        this.position = { x: 0, y: 0 };
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.class = 'warrior'; // Default class
        this.isAlive = true;
        this.inventory = [];
        this.stats = {
            strength: 10,
            defense: 10,
            speed: 10
        };
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            position: this.position,
            health: this.health,
            maxHealth: this.maxHealth,
            level: this.level,
            class: this.class,
            isAlive: this.isAlive,
            stats: this.stats
        };
    }
}

// Lobby class
class Lobby {
    constructor() {
        this.id = uuidv4();
        this.players = new Map(); // socketId -> Player
        this.maxPlayers = MAX_PLAYERS_PER_LOBBY;
        this.status = 'waiting'; // waiting, starting, active, finished
        this.gameState = {
            floor: 1,
            enemies: [],
            items: [],
            dungeon: null
        };
        this.createdAt = Date.now();
    }

    addPlayer(player) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }

        this.players.set(player.id, player);
        player.lobbyId = this.id;

        // Assign spawn position
        const spawnPoints = this.getSpawnPoints();
        player.position = spawnPoints[this.players.size - 1];

        console.log(`Player ${player.username} joined lobby ${this.id} (${this.players.size}/${this.maxPlayers})`);

        // Check if lobby is full
        if (this.players.size === this.maxPlayers && this.status === 'waiting') {
            this.status = 'starting';
            setTimeout(() => this.startGame(), LOBBY_START_DELAY);
        }

        return true;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            this.players.delete(socketId);
            console.log(`Player ${player.username} left lobby ${this.id} (${this.players.size}/${this.maxPlayers})`);

            // If lobby is empty, mark for deletion
            if (this.players.size === 0) {
                this.status = 'finished';
            }
        }
    }

    getSpawnPoints() {
        // Generate spawn points in a circle
        const points = [];
        const radius = 5;
        for (let i = 0; i < this.maxPlayers; i++) {
            const angle = (2 * Math.PI * i) / this.maxPlayers;
            points.push({
                x: Math.round(radius * Math.cos(angle)),
                y: Math.round(radius * Math.sin(angle))
            });
        }
        return points;
    }

    startGame() {
        if (this.status !== 'starting') return;

        this.status = 'active';
        this.generateDungeon();

        console.log(`Lobby ${this.id} starting game with ${this.players.size} players`);

        // Notify all players in the lobby
        this.broadcast('game:start', {
            lobbyId: this.id,
            players: Array.from(this.players.values()).map(p => p.toJSON()),
            gameState: this.gameState
        });
    }

    generateDungeon() {
        // Simple dungeon generation (placeholder - expand this based on your game design)
        this.gameState.dungeon = {
            width: 50,
            height: 50,
            tiles: this.generateDungeonTiles(50, 50),
            rooms: []
        };

        // Spawn some enemies
        this.spawnEnemies(5);

        // Spawn some items
        this.spawnItems(10);
    }

    generateDungeonTiles(width, height) {
        // Simple tile generation - 0 = floor, 1 = wall
        const tiles = [];
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                // Border walls
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    tiles[y][x] = 1;
                } else {
                    // Random walls (20% chance)
                    tiles[y][x] = Math.random() < 0.2 ? 1 : 0;
                }
            }
        }
        return tiles;
    }

    spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            this.gameState.enemies.push({
                id: uuidv4(),
                type: 'goblin',
                position: {
                    x: Math.floor(Math.random() * 40) + 5,
                    y: Math.floor(Math.random() * 40) + 5
                },
                health: 50,
                maxHealth: 50,
                damage: 10
            });
        }
    }

    spawnItems(count) {
        const itemTypes = ['health_potion', 'sword', 'shield', 'armor', 'key'];
        for (let i = 0; i < count; i++) {
            this.gameState.items.push({
                id: uuidv4(),
                type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
                position: {
                    x: Math.floor(Math.random() * 40) + 5,
                    y: Math.floor(Math.random() * 40) + 5
                }
            });
        }
    }

    broadcast(event, data) {
        this.players.forEach(player => {
            io.to(player.id).emit(event, data);
        });
    }

    toJSON() {
        return {
            id: this.id,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers,
            status: this.status,
            floor: this.gameState.floor
        };
    }
}

// Matchmaking system
function findOrCreateLobby() {
    // Find a lobby that's waiting and not full
    for (const [lobbyId, lobby] of lobbies.entries()) {
        if (lobby.status === 'waiting' && lobby.players.size < lobby.maxPlayers) {
            return lobby;
        }
    }

    // Create a new lobby if none available
    const newLobby = new Lobby();
    lobbies.set(newLobby.id, newLobby);
    console.log(`Created new lobby ${newLobby.id}`);
    return newLobby;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle player joining
    socket.on('player:join', (data) => {
        const { username, characterClass } = data || {};

        // Create player object
        const player = new Player(socket.id, username);
        if (characterClass) {
            player.class = characterClass;
        }
        players.set(socket.id, player);

        // Find or create a lobby
        const lobby = findOrCreateLobby();
        lobby.addPlayer(player);

        // Send lobby info to player
        socket.emit('lobby:joined', {
            lobbyId: lobby.id,
            player: player.toJSON(),
            players: Array.from(lobby.players.values()).map(p => p.toJSON()),
            lobbyStatus: lobby.status,
            playerCount: lobby.players.size,
            maxPlayers: lobby.maxPlayers
        });

        // Notify other players in the lobby
        socket.to(lobby.id).emit('player:joined', {
            player: player.toJSON(),
            playerCount: lobby.players.size
        });

        // Join the socket room for this lobby
        socket.join(lobby.id);
    });

    // Handle player movement
    socket.on('player:move', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.lobbyId) return;

        const lobby = lobbies.get(player.lobbyId);
        if (!lobby || lobby.status !== 'active') return;

        // Update player position
        player.position = data.position;

        // Broadcast to other players in the lobby
        socket.to(lobby.id).emit('player:moved', {
            playerId: player.id,
            position: player.position
        });
    });

    // Handle player attack
    socket.on('player:attack', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.lobbyId) return;

        const lobby = lobbies.get(player.lobbyId);
        if (!lobby || lobby.status !== 'active') return;

        // Broadcast attack to all players
        lobby.broadcast('player:attacked', {
            playerId: player.id,
            target: data.target,
            damage: data.damage
        });
    });

    // Handle enemy hit
    socket.on('enemy:hit', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.lobbyId) return;

        const lobby = lobbies.get(player.lobbyId);
        if (!lobby || lobby.status !== 'active') return;

        // Find enemy and update health
        const enemy = lobby.gameState.enemies.find(e => e.id === data.enemyId);
        if (enemy) {
            enemy.health -= data.damage;

            if (enemy.health <= 0) {
                // Remove enemy
                lobby.gameState.enemies = lobby.gameState.enemies.filter(e => e.id !== data.enemyId);

                lobby.broadcast('enemy:killed', {
                    enemyId: data.enemyId,
                    killedBy: player.id
                });
            } else {
                lobby.broadcast('enemy:damaged', {
                    enemyId: data.enemyId,
                    health: enemy.health,
                    damage: data.damage
                });
            }
        }
    });

    // Handle item pickup
    socket.on('item:pickup', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.lobbyId) return;

        const lobby = lobbies.get(player.lobbyId);
        if (!lobby || lobby.status !== 'active') return;

        // Find and remove item
        const itemIndex = lobby.gameState.items.findIndex(i => i.id === data.itemId);
        if (itemIndex !== -1) {
            const item = lobby.gameState.items[itemIndex];
            lobby.gameState.items.splice(itemIndex, 1);

            // Add to player inventory
            player.inventory.push(item);

            // Broadcast to all players
            lobby.broadcast('item:picked', {
                itemId: data.itemId,
                playerId: player.id
            });
        }
    });

    // Handle chat messages
    socket.on('chat:message', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.lobbyId) return;

        const lobby = lobbies.get(player.lobbyId);
        if (!lobby) return;

        lobby.broadcast('chat:message', {
            playerId: player.id,
            username: player.username,
            message: data.message,
            timestamp: Date.now()
        });
    });

    // Handle player ready status
    socket.on('player:ready', () => {
        const player = players.get(socket.id);
        if (!player || !player.lobbyId) return;

        const lobby = lobbies.get(player.lobbyId);
        if (!lobby) return;

        socket.to(lobby.id).emit('player:ready', {
            playerId: player.id,
            username: player.username
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        const player = players.get(socket.id);
        if (player && player.lobbyId) {
            const lobby = lobbies.get(player.lobbyId);
            if (lobby) {
                lobby.removePlayer(socket.id);

                // Notify other players
                socket.to(lobby.id).emit('player:left', {
                    playerId: player.id,
                    username: player.username,
                    playerCount: lobby.players.size
                });

                // Clean up empty lobbies
                if (lobby.status === 'finished') {
                    lobbies.delete(lobby.id);
                    console.log(`Deleted empty lobby ${lobby.id}`);
                }
            }
        }

        players.delete(socket.id);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        lobbies: lobbies.size,
        players: players.size,
        timestamp: Date.now()
    });
});

// Server stats endpoint
app.get('/stats', (req, res) => {
    const lobbyStats = Array.from(lobbies.values()).map(lobby => lobby.toJSON());

    res.json({
        totalLobbies: lobbies.size,
        totalPlayers: players.size,
        lobbies: lobbyStats,
        serverUptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Cleanup old finished lobbies every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [lobbyId, lobby] of lobbies.entries()) {
        // Remove finished lobbies older than 5 minutes
        if (lobby.status === 'finished' && (now - lobby.createdAt) > 300000) {
            lobbies.delete(lobbyId);
            console.log(`Cleaned up old lobby ${lobbyId}`);
        }
    }
}, 300000);

// Start server
server.listen(PORT, () => {
    console.log(`🎮 Klyra multiplayer server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Stats endpoint: http://localhost:${PORT}/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
