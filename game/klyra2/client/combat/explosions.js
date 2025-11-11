// KLYRA EXPLOSION MANAGER - Visual Impact Effects

class ExplosionManager {
    constructor(game) {
        this.game = game;
        this.explosions = [];
    }
    
    update(deltaTime) {
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
    
    render(ctx, cameraX, cameraY) {
        for (const exp of this.explosions) {
            const progress = exp.elapsed / exp.duration;
            const alpha = 1 - progress; // Fade out
            
            // Check if in view
            if (!this.game.renderer.isInView(
                exp.x - exp.radius,
                exp.y - exp.radius,
                exp.radius * 2,
                exp.radius * 2
            )) {
                continue;
            }
            
            this.renderExplosion(ctx, exp, alpha);
        }
    }
    
    renderExplosion(ctx, exp, alpha) {
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
        const progress = exp.elapsed / exp.duration;
        if (progress < 0.3) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress / 0.3) * 0.8})`;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplosionManager;
}
