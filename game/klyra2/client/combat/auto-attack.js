// KLYRA AUTO-ATTACK SYSTEM - Automatic Target Acquisition & Firing

class AutoAttack {
    constructor(game, combatSystem) {
        this.game = game;
        this.combatSystem = combatSystem;
        
        // Attack parameters
        this.attackTimer = 0;
        this.attackCooldown = 1000; // Fire every 1 second
        this.attackRange = CONSTANTS.TILE_SIZE * 6; // 6 tiles
    }
    
    update(deltaTime) {
        if (!this.game.localPlayer) return;
        
        // Update attack timer
        this.attackTimer += deltaTime;
        
        if (this.attackTimer >= this.attackCooldown) {
            this.attackTimer = 0;
            this.fireAtNearestEnemy();
        }
    }
    
    fireAtNearestEnemy() {
        if (!this.combatSystem.enemyManager) return;
        
        const enemyCount = this.combatSystem.enemyManager.getEnemyCount();
        if (enemyCount === 0) return;
        
        // Find nearest enemy within range
        const nearestEnemy = this.combatSystem.enemyManager.findNearestEnemy(
            this.game.localPlayer.x,
            this.game.localPlayer.y,
            this.attackRange
        );
        
        // Fire projectile at nearest enemy
        if (nearestEnemy && this.combatSystem.projectileManager) {
            this.combatSystem.projectileManager.createProjectile(
                this.game.localPlayer.x,
                this.game.localPlayer.y,
                nearestEnemy
            );
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoAttack;
}
