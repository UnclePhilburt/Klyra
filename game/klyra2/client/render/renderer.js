// KLYRA RENDERER - Canvas2D Rendering System

class Renderer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Performance settings
        this.ctx.imageSmoothingEnabled = false;
        
        // Camera
        this.cameraX = 0;
        this.cameraY = 0;
        this.targetCameraX = 0;
        this.targetCameraY = 0;
        
        // Screen shake
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
        
        // Stats
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        
        // Initialize canvas size
        this.handleResize();
    }
    
    handleResize() {
        // Always use full viewport for fullscreen experience
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.ctx.imageSmoothingEnabled = false;
        
        console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }
    
    // Update camera to follow target
    updateCamera(targetX, targetY, smoothing = CONSTANTS.CAMERA_SMOOTHING) {
        this.targetCameraX = targetX - this.canvas.width / 2;
        this.targetCameraY = targetY - this.canvas.height / 2;
        
        // Smooth camera movement
        this.cameraX = UTILS.lerp(this.cameraX, this.targetCameraX, smoothing);
        this.cameraY = UTILS.lerp(this.cameraY, this.targetCameraY, smoothing);
    }
    
    // Add screen shake effect
    shake(amount) {
        this.shakeAmount = amount;
    }
    
    // Clear canvas
    clear() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Begin rendering with camera transform
    begin() {
        this.ctx.save();
        
        // Apply screen shake
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeAmount > 0) {
            shakeX = (Math.random() - 0.5) * this.shakeAmount;
            shakeY = (Math.random() - 0.5) * this.shakeAmount;
            this.shakeAmount *= this.shakeDecay;
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }
        
        // Apply camera transform
        this.ctx.translate(
            -Math.floor(this.cameraX) + shakeX,
            -Math.floor(this.cameraY) + shakeY
        );
    }
    
    // End rendering
    end() {
        this.ctx.restore();
    }
    
    // Render a tile
    renderTile(tileType, x, y) {
        const worldX = x * CONSTANTS.TILE_SIZE;
        const worldY = y * CONSTANTS.TILE_SIZE;
        
        // Skip if outside camera view
        if (!this.isInView(worldX, worldY, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE)) {
            return;
        }
        
        let color = CONSTANTS.COLORS.GRASS;
        
        switch(tileType) {
            case CONSTANTS.TILES.GRASS:
                color = CONSTANTS.COLORS.GRASS;
                break;
            case CONSTANTS.TILES.DIRT:
                color = CONSTANTS.COLORS.DIRT;
                break;
            case CONSTANTS.TILES.STONE:
                color = CONSTANTS.COLORS.STONE;
                break;
            case CONSTANTS.TILES.WATER:
                color = CONSTANTS.COLORS.WATER;
                break;
            case CONSTANTS.TILES.SAND:
                color = CONSTANTS.COLORS.SAND;
                break;
            case CONSTANTS.TILES.FOREST:
                color = CONSTANTS.COLORS.FOREST;
                break;
            case CONSTANTS.TILES.SNOW:
                color = CONSTANTS.COLORS.SNOW;
                break;
            case CONSTANTS.TILES.ROAD:
                color = CONSTANTS.COLORS.ROAD;
                break;
            case CONSTANTS.TILES.WALL:
                color = '#2c2c2c';
                break;
            case CONSTANTS.TILES.FLOOR:
                color = '#8b7355';
                break;
            default:
                color = CONSTANTS.COLORS.GRASS;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(worldX, worldY, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
        
        // Add subtle variation
        const noise = UTILS.simpleNoise(x, y, tileType);
        if (noise > 0.5) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.fillRect(worldX, worldY, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
        }
    }
    
    // Render a player (3x larger size!)
    renderPlayer(player, sessionId, isLocal = false) {
        const x = player.x;
        const y = player.y;
        
        // Skip if outside camera view (3x larger)
        if (!this.isInView(x - 24, y - 24, 48, 48)) {
            return;
        }
        
        // Shadow (3x larger)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 18, 18, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player body (3x larger: 36x42)
        const color = isLocal ? '#e74c3c' : '#3498db';
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - 18, y - 24, 36, 42);
        
        // Player head (3x larger: 24x18)
        this.ctx.fillStyle = '#f8c291';
        this.ctx.fillRect(x - 12, y - 36, 24, 18);
        
        // Direction indicator
        let dirX = x;
        let dirY = y;
        
        switch(player.direction) {
            case 'up':
                dirY -= 30; // 3x larger
                break;
            case 'down':
                dirY += 30;
                break;
            case 'left':
                dirX -= 30;
                break;
            case 'right':
                dirX += 30;
                break;
        }
        
        // Moving animation (bob effect)
        if (player.moving) {
            const bobAmount = Math.sin(player.animFrame * Math.PI) * 3; // 3x larger
            this.ctx.save();
            this.ctx.translate(0, bobAmount);
        }
        
        // Weapon/Hand indicator (3x larger: 12x12)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(dirX - 6, dirY - 6, 12, 12);
        
        if (player.moving) {
            this.ctx.restore();
        }
        
        // Name tag (positioned above 3x larger player)
        // Get player name from customization
        let displayName = sessionId.substring(0, 6);
        if (player.customization) {
            try {
                const customData = JSON.parse(player.customization);
                if (customData.name) {
                    displayName = customData.name.substring(0, 12); // Max 12 chars
                }
            } catch (e) {
                // Use session ID if parsing fails
                console.warn('Failed to parse player customization:', e);
            }
        }
        
        // Measure text width for background (slightly larger font for bigger player)
        this.ctx.font = '12px monospace'; // Bigger font
        const textWidth = this.ctx.measureText(displayName).width;
        const bgPadding = 6;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x - textWidth / 2 - bgPadding, y - 50, textWidth + bgPadding * 2, 14); // Higher position
        
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(displayName, x, y - 43); // Higher position
        
        // Local player indicator (3x larger border)
        if (isLocal) {
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2; // Thicker border
            this.ctx.strokeRect(x - 24, y - 42, 48, 60); // 3x size border
        }
    }
    
    // Render entities with depth sorting (trees and players sorted by Y position)
    renderEntitiesWithDepth(players, localSessionId, vegetationSystem) {
        const entities = [];
        
        // Collect visible trees
        if (vegetationSystem) {
            const visibleTrees = vegetationSystem.getVisibleTrees(this);
            for (const tree of visibleTrees) {
                entities.push({
                    type: 'tree',
                    y: tree.y,
                    data: tree
                });
            }
        }
        
        // Collect players
        if (players) {
            players.forEach((player, sessionId) => {
                entities.push({
                    type: 'player',
                    y: player.y,
                    data: { player, sessionId, isLocal: sessionId === localSessionId }
                });
            });
        }
        
        // Sort by Y position (entities further up screen are drawn first)
        entities.sort((a, b) => a.y - b.y);
        
        // Render all entities in sorted order
        for (const entity of entities) {
            if (entity.type === 'tree' && vegetationSystem) {
                vegetationSystem.renderTree(this, entity.data);
            } else if (entity.type === 'player') {
                this.renderPlayer(entity.data.player, entity.data.sessionId, entity.data.isLocal);
            }
        }
    }
    
    // Check if object is in camera view
    isInView(x, y, width, height) {
        return !(
            x + width < this.cameraX ||
            x > this.cameraX + this.canvas.width ||
            y + height < this.cameraY ||
            y > this.cameraY + this.canvas.height
        );
    }
    
    // Render debug grid
    renderGrid() {
        if (!CONSTANTS.SHOW_GRID) return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const startX = Math.floor(this.cameraX / CONSTANTS.TILE_SIZE) * CONSTANTS.TILE_SIZE;
        const startY = Math.floor(this.cameraY / CONSTANTS.TILE_SIZE) * CONSTANTS.TILE_SIZE;
        const endX = startX + this.canvas.width + CONSTANTS.TILE_SIZE;
        const endY = startY + this.canvas.height + CONSTANTS.TILE_SIZE;
        
        // Vertical lines
        for (let x = startX; x < endX; x += CONSTANTS.TILE_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y < endY; y += CONSTANTS.TILE_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }
    
    // Update FPS counter
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const delta = now - this.lastFpsUpdate;
        
        if (delta >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / delta);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }
    
    // Render UI overlays
    renderUI(debugInfo = {}) {
        // FPS Counter
        if (CONSTANTS.SHOW_FPS) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 100, 30);
            
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`FPS: ${this.fps}`, 20, 25);
        }
        
        // Debug info
        if (CONSTANTS.DEBUG_MODE && Object.keys(debugInfo).length > 0) {
            const debugDiv = document.getElementById('debugInfo');
            if (debugDiv) {
                debugDiv.classList.remove('hidden');
                let html = '';
                for (const [key, value] of Object.entries(debugInfo)) {
                    html += `<div>${key}: ${value}</div>`;
                }
                debugDiv.innerHTML = html;
            }
        }
    }
    
    // Draw text with background
    drawText(text, x, y, color = '#fff', bgColor = 'rgba(0, 0, 0, 0.7)') {
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const metrics = this.ctx.measureText(text);
        const padding = 4;
        
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(
            x - metrics.width / 2 - padding,
            y - 8,
            metrics.width + padding * 2,
            16
        );
        
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
    
    // World to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.cameraX,
            y: worldY - this.cameraY
        };
    }
    
    // Screen to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.cameraX,
            y: screenY + this.cameraY
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}