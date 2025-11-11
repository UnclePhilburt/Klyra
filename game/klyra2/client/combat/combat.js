// KLYRA COMBAT SYSTEM - Main Coordinator

class CombatSystem {
    constructor(game) {
        this.game = game;
        
        // Sub-systems
        this.enemyManager = null;
        this.autoAttack = null;
        this.projectileManager = null;
        this.explosionManager = null;
        
        // Stats
        this.killCount = 0;
        
        this.init();
    }
    
    init() {
        // Initialize sub-systems
        if (typeof EnemyManager !== 'undefined') {
            this.enemyManager = new EnemyManager(this.game);
        }
        
        if (typeof AutoAttack !== 'undefined') {
            this.autoAttack = new AutoAttack(this.game, this);
        }
        
        if (typeof ProjectileManager !== 'undefined') {
            this.projectileManager = new ProjectileManager(this.game, this);
        }
        
        if (typeof ExplosionManager !== 'undefined') {
            this.explosionManager = new ExplosionManager(this.game);
        }
    }
    
    update(deltaTime) {
        // Update enemy positions from server
        if (this.enemyManager) {
            this.enemyManager.update(deltaTime);
        }
        
        // Update auto-attack system
        if (this.autoAttack) {
            this.autoAttack.update(deltaTime);
        }
        
        // Update projectiles
        if (this.projectileManager) {
            this.projectileManager.update(deltaTime);
        }
        
        // Update explosions
        if (this.explosionManager) {
            this.explosionManager.update(deltaTime);
        }
    }
    
    render(ctx, cameraX, cameraY) {
        // Render enemies
        if (this.enemyManager) {
            this.enemyManager.render(ctx, cameraX, cameraY);
        }
        
        // Render projectiles
        if (this.projectileManager) {
            this.projectileManager.render(ctx, cameraX, cameraY);
        }
        
        // Render explosions
        if (this.explosionManager) {
            this.explosionManager.render(ctx, cameraX, cameraY);
        }
    }
    
    onEnemyKilled() {
        this.killCount++;
    }
    
    getStats() {
        return {
            enemies: this.enemyManager ? this.enemyManager.getEnemyCount() : 0,
            kills: this.killCount
        };
    }
    
    cleanup() {
        // Cleanup is handled by server sync
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
}
