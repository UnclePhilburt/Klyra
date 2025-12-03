# How to Add This Game to Your Klyra Repo

## Quick Steps

1. **Copy the `reborn` folder** to your UnclePhilburt/Klyra repository
   - The entire `reborn/` folder goes in the root of your Klyra repo

2. **Your repo structure will look like:**
   ```
   Klyra/
   ├── (your existing files and folders)
   └── reborn/              # New FPS game
       ├── assets/
       ├── levels/
       ├── index.html       # Main menu
       ├── game.html        # Game
       ├── editor.html      # Level editor
       ├── config.js
       ├── main.js
       └── level-editor.js
   ```

3. **Add a link from your homepage** to the new game:
   ```html
   <a href="/reborn/">Play FPS Shooter</a>
   ```
   or
   ```html
   <a href="/reborn/index.html">Play FPS Shooter</a>
   ```

4. **Push to GitHub:**
   ```bash
   cd path/to/Klyra
   git add reborn/
   git commit -m "Add FPS multiplayer game"
   git push origin main
   ```

5. **Access your game** at:
   - Main Menu: `https://klyra.lol/reborn/`
   - Game: `https://klyra.lol/reborn/game.html`
   - Editor: `https://klyra.lol/reborn/editor.html`

## Backend Server

The backend is already configured:
- Backend URL: `https://klyra-server.onrender.com`
- Auto-detects localhost vs production
- CORS configured for klyra.lol

## That's It!

Your existing Klyra game stays untouched, and this FPS game runs separately in the `/reborn/` path.
