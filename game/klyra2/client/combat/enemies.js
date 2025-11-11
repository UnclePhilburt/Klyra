// KLYRA ENEMY MANAGER - Enemy Rendering & Sync

class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = new Map();
    }
    
    update(deltaTime) {
        this.syncEnemiesFromServer();
    }
    
    syncEnemiesFromServer() {
        if (!this.game.network || !this.game.network.room) return;
        
        const serverEnemies = this.game.network.room.state.enemies;
        if (!serverEnemies) return;
        
        // Clear old enemies
        this.enemies.clear();
        
        // Sync active enemies from server
        serverEnemies.forEach((serverEnemy, enemyId) => {
            if (serverEnemy.active) {
                this.enemies.set(enemyId, {
                    id: enemyId,
                    x: serverEnemy.x,
                    y: serverEnemy.y,
                    hp: serverEnemy.hp,
                    size: 12,
                    active: true
                });
            }
        });
    }
    
    getEnemies() {
        return this.enemies;
    }
    
    getEnemyCount() {
        return this.enemies.size;
    }
    
    findNearestEnemy(x, y, maxRange) {
        let nearestEnemy = null;
        let nearestDist = maxRange;
        
        this.enemies.forEach((enemy) => {
            if (!enemy.active) return;
            
            const dist = UTILS.distance(x, y, enemy.x, enemy.y);
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });
        
        return nearestEnemy;
    }
    
    render(ctx, cameraX, cameraY) {
        this.enemies.forEach((enemy) => {
            if (!enemy.active) return;
            
            // Check if in view
            if (!this.game.renderer.isInView(
                enemy.x - enemy.size,
                enemy.y - enemy.size,
                enemy.size * 2,
                enemy.size * 2
            )) {
                return;
            }
            
            this.renderEnemy(ctx, enemy);
        });
    }
    
    renderEnemy(ctx, enemy) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + 6, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Enemy body (dark red skull-like appearance)
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(
            enemy.x - enemy.size / 2,
            enemy.y - enemy.size / 2,
            enemy.size,
            enemy.size
        );
        
        // Eyes (glowing)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - 4, enemy.y - 4, 3, 3);
        ctx.fillRect(enemy.x + 1, enemy.y - 4, 3, 3);
        
        // Health indicator (small dot above)
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - enemy.size, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyManager;
}
