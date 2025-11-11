// KLYRA PROJECTILE MANAGER - Projectile Physics & Collision

class ProjectileManager {
    constructor(game, combatSystem) {
        this.game = game;
        this.combatSystem = combatSystem;
        this.projectiles = [];
    }
    
    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            if (!proj.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Move projectile
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            // Check collision with enemies
            this.checkCollisions(proj, i);
            
            // Remove if traveled too far
            this.checkRange(proj, i);
        }
    }
    
    createProjectile(startX, startY, target) {
        const projectile = {
            x: startX,
            y: startY,
            targetX: target.x,
            targetY: target.y,
            speed: 10,
            size: 6,
            active: true,
            targetId: target.id
        };
        
        // Calculate direction
        const dx = target.x - projectile.x;
        const dy = target.y - projectile.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        projectile.vx = (dx / dist) * projectile.speed;
        projectile.vy = (dy / dist) * projectile.speed;
        
        this.projectiles.push(projectile);
    }
    
    checkCollisions(proj, projIndex) {
        if (!this.combatSystem.enemyManager) return;
        
        let hitEnemy = false;
        const enemies = this.combatSystem.enemyManager.getEnemies();
        
        enemies.forEach((enemy) => {
            if (!enemy.active || hitEnemy) return;
            
            const dist = UTILS.distance(proj.x, proj.y, enemy.x, enemy.y);
            
            if (dist < enemy.size) {
                // Hit! Create explosion
                if (this.combatSystem.explosionManager) {
                    this.combatSystem.explosionManager.createExplosion(enemy.x, enemy.y);
                }
                
                proj.active = false;
                hitEnemy = true;
                
                // Notify combat system of kill
                this.combatSystem.onEnemyKilled();
                
                // Notify server of kill
                if (this.game.network && this.game.network.room) {
                    this.game.network.room.send("killEnemy", { enemyId: enemy.id });
                }
                
                // Screen shake on kill
                if (this.game.renderer) {
                    this.game.renderer.shake(3);
                }
            }
        });
    }
    
    checkRange(proj, projIndex) {
        if (!this.game.localPlayer) return;
        
        const distTraveled = UTILS.distance(
            this.game.localPlayer.x,
            this.game.localPlayer.y,
            proj.x,
            proj.y
        );
        
        const maxRange = CONSTANTS.TILE_SIZE * 6 * 1.5;
        
        if (distTraveled > maxRange) {
            this.projectiles.splice(projIndex, 1);
        }
    }
    
    render(ctx, cameraX, cameraY) {
        for (const proj of this.projectiles) {
            if (!proj.active) continue;
            
            // Check if in view
            if (!this.game.renderer.isInView(
                proj.x - proj.size,
                proj.y - proj.size,
                proj.size * 2,
                proj.size * 2
            )) {
                continue;
            }
            
            this.renderProjectile(ctx, proj);
        }
    }
    
    renderProjectile(ctx, proj) {
        // Glowing projectile
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Trail effect
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(
            proj.x - proj.vx * 2,
            proj.y - proj.vy * 2,
            proj.size * 0.6,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectileManager;
}
