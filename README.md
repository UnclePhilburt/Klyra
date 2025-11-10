# Klyra - Multiplayer Roguelike

An immersive multiplayer roguelike adventure with procedurally generated dungeons, real-time co-op gameplay, and tactical combat.

## 🎮 Features

- **Automatic Matchmaking** - Click play and instantly join a game with other players
- **10-Player Co-op** - Team up with up to 10 players per session
- **Procedural Generation** - Every dungeon is unique
- **Real-time Combat** - Synchronized battles with tactical positioning
- **Rich Loot System** - Discover weapons, armor, and artifacts
- **Multiple Classes** - Choose your playstyle
- **Persistent Progression** - Unlock upgrades that carry between runs

## 🌐 Architecture

This repository contains:

- **Website** (`index.html`) - Landing page hosted on Siteground at [klyra.lol](https://klyra.lol)
- **Multiplayer Server** (`server.js`) - Node.js backend for game hosting, deployed on Render

## 🚀 Quick Start

### Website (Already Deployed)
The game website is live at: **https://klyra.lol**

### Multiplayer Server Deployment

1. **Install Dependencies**
```bash
npm install
```

2. **Test Locally**
```bash
npm start
```

3. **Deploy to Render**
   - Push code to GitHub
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Create New Web Service
   - Connect your GitHub repo
   - Render will auto-detect and deploy

4. **Get Server URL**
   - After deployment, save your Render URL (e.g., `https://klyra-server.onrender.com`)
   - Use this URL in your game client to connect

## 📁 Project Structure

```
klyra/
├── index.html              # Landing page (hosted on Siteground)
├── server.js               # Multiplayer server (deploy to Render)
├── package.json            # Node.js dependencies
├── render.yaml             # Render deployment config
├── client-example.html     # Test client for server connection
├── SERVER_README.md        # Detailed server documentation
└── README.md              # This file
```

## 🛠 Server Technology

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **Auto-matchmaking** - Smart lobby system

## 📊 Server Endpoints

- `GET /health` - Health check and server status
- `GET /stats` - Detailed lobby and player statistics

## 🎯 How It Works

1. Player visits **klyra.lol** and clicks "Play"
2. Game client connects to multiplayer server
3. Server automatically matches player to available lobby (or creates new one)
4. When lobby reaches 10 players, game auto-starts
5. Players explore procedurally generated dungeon together
6. Real-time sync for all player actions, combat, and loot

## 🔧 Development

### Run Server Locally
```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

### Test Client
Open `client-example.html` in browser to test server connection

## 📚 Documentation

- **Server Documentation**: See [SERVER_README.md](SERVER_README.md)
- **Socket Events**: Full event list in SERVER_README.md
- **API Integration**: Client connection examples included

## 🌟 Future Features

- Multiple dungeon floors
- Boss battles
- Player trading
- Leaderboards
- Persistent accounts
- Guild system

## 📝 License

MIT

---

**Website**: https://klyra.lol
**Status**: Live and ready to play! 🎮
