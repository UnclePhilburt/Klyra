// KLYRA COMBAT SYSTEM - Enemy Spawning & Auto-Attack

class CombatSystem {
    constructor(game) {
        this.game = game;
        
        // Enemy system (synced from server)
        this.enemies = new Map(); // enemyId -> enemy data
        
        // Auto-attack system
        this.autoAttackTimer = 0;
        this.autoAttackCooldown = 1000; // Fire every 1 second
        this.autoAttackRange = CONSTANTS.TILE_SIZE * 6; // 6 tiles range
        
        // Projectiles & explosions (client-side)
        this.projectiles = [];
        this.explosions = [];
        
        // Stats
        this.killCount = 0;
    }
    
    update(deltaTime) {
        // Sync enemies from server
        this.syncEnemiesFromServer();
        
        // Update auto-attack
        this.autoAttackTimer += deltaTime;
        if (this.autoAttackTimer >= this.autoAttackCooldown) {
            this.autoAttackTimer = 0;
            this.fireAutoAttack();
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update explosions
        this.updateExplosions(deltaTime);
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
    
    fireAutoAttack() {
        if (!this.game.localPlayer) return;
        if (this.enemies.size === 0) return;
        
        // Find nearest enemy within range
        let nearestEnemy = null;
        let nearestDist = this.autoAttackRange;
        
        this.enemies.forEach((enemy) => {
            if (!enemy.active) return;
            
            const dist = UTILS.distance(
                this.game.localPlayer.x,
                this.game.localPlayer.y,
                enemy.x,
                enemy.y
            );
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });
        
        // Fire projectile at nearest enemy
        if (nearestEnemy) {
            this.createProjectile(nearestEnemy);
        }
    }
    
    createProjectile(target) {
        const projectile = {
            x: this.game.localPlayer.x,
            y: this.game.localPlayer.y,
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
    
    updateProjectiles(deltaTime) {
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
            let hitEnemy = false;
            this.enemies.forEach((enemy) => {
                if (!enemy.active || hitEnemy) return;
                
                const dist = UTILS.distance(proj.x, proj.y, enemy.x, enemy.y);
                
                if (dist < enemy.size) {
                    // Hit! Create explosion
                    this.createExplosion(enemy.x, enemy.y);
                    proj.active = false;
                    hitEnemy = true;
                    this.killCount++;
                    
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
            
            // Remove if traveled too far
            if (!hitEnemy) {
                const distTraveled = UTILS.distance(
                    this.game.localPlayer.x,
                    this.game.localPlayer.y,
                    proj.x,
                    proj.y
                );
                
                if (distTraveled > this.autoAttackRange * 1.5) {
                    this.projectiles.splice(i, 1);
                }
            }
        }
    }
    
    createExplosion(x, y) {
        const explosion = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 24,
            duration: 300, // 300ms animation
            elapsed: 0,
            active: true
        };
        
        this.explosions.push(explosion);
    }
    
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            
            exp.elapsed += deltaTime;
            
            // Expand explosion
            const progress = exp.elapsed / exp.duration;
            exp.radius = exp.maxRadius * progress;
            
            // Remove when finished
            if (exp.elapsed >= exp.duration) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    render(ctx, cameraX, cameraY) {
        // Render enemies
        this.enemies.forEach((enemy) => {
            if (!enemy.active) return;
            
            // Check if in view
            if (!this.game.renderer.isInView(enemy.x - enemy.size, enemy.y - enemy.size, enemy.size * 2, enemy.size * 2)) {
                return;
            }
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y + 6, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Enemy body (dark red skull-like appearance)
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
            
            // Eyes (glowing)
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x - 4, enemy.y - 4, 3, 3);
            ctx.fillRect(enemy.x + 1, enemy.y - 4, 3, 3);
            
            // Health indicator (small dot above)
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y - enemy.size, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render projectiles
        for (const proj of this.projectiles) {
            if (!proj.active) continue;
            
            // Check if in view
            if (!this.game.renderer.isInView(proj.x - proj.size, proj.y - proj.size, proj.size * 2, proj.size * 2)) {
                continue;
            }
            
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
            ctx.arc(proj.x - proj.vx * 2, proj.y - proj.vy * 2, proj.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render explosions
        for (const exp of this.explosions) {
            const progress = exp.elapsed / exp.duration;
            const alpha = 1 - progress; // Fade out
            
            // Check if in view
            if (!this.game.renderer.isInView(exp.x - exp.radius, exp.y - exp.radius, exp.radius * 2, exp.radius * 2)) {
                continue;
            }
            
            // Outer ring (orange)
            ctx.strokeStyle = `rgba(255, 140, 0, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner ring (yellow)
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 1.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Center flash (white)
            if (progress < 0.3) {
                ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress / 0.3) * 0.8})`;
                ctx.beginPath();
                ctx.arc(exp.x, exp.y, exp.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    getStats() {
        return {
            enemies: this.enemies.size,
            kills: this.killCount
        };
    }
    
    cleanup() {
        // Cleanup is handled by server - enemies auto-sync
        // Just clean up old explosions if needed
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
}