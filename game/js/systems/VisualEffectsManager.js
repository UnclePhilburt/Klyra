// VisualEffectsManager - Handles all temporary visual effects for skills
class VisualEffectsManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Active visual effects
        this.activeEffects = [];

        // Aura visuals
        this.auraCircles = new Map(); // Map of aura type -> graphics object

        // Particle emitters
        this.particleEmitters = new Map();

        console.log('✅ VisualEffectsManager initialized');
    }

    // ==================== AURA EFFECTS ====================

    createAura(type, config) {
        // Remove existing aura of this type
        if (this.auraCircles.has(type)) {
            this.removeAura(type);
        }

        const {
            radius = 150,
            color = 0x8b5cf6,
            alpha = 0.2,
            strokeColor = 0x8b5cf6,
            strokeAlpha = 0.5,
            strokeWidth = 2,
            pulseSpeed = 2000,
            pulseAmount = 0.1
        } = config;

        // Create graphics object
        const graphics = this.scene.add.graphics();
        graphics.setDepth(99);
        graphics.setScrollFactor(1);

        // Draw initial aura
        graphics.clear();
        graphics.fillStyle(color, alpha);
        graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
        graphics.fillCircle(0, 0, radius);
        graphics.strokeCircle(0, 0, radius);

        // Store aura data
        const auraData = {
            graphics,
            radius,
            color,
            alpha,
            strokeColor,
            strokeAlpha,
            strokeWidth,
            baseAlpha: alpha,
            pulseSpeed,
            pulseAmount
        };

        this.auraCircles.set(type, auraData);

        // Add pulsing animation
        this.scene.tweens.add({
            targets: auraData,
            alpha: alpha + pulseAmount,
            strokeAlpha: strokeAlpha + pulseAmount,
            duration: pulseSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        console.log(`🔮 Created ${type} aura visual`);
    }

    removeAura(type) {
        const auraData = this.auraCircles.get(type);
        if (auraData) {
            auraData.graphics.destroy();
            this.auraCircles.delete(type);
            console.log(`🔮 Removed ${type} aura visual`);
        }
    }

    updateAuras() {
        // Update aura positions to follow player
        this.auraCircles.forEach((auraData, type) => {
            const { graphics, radius, color, alpha, strokeColor, strokeAlpha, strokeWidth } = auraData;

            graphics.clear();
            graphics.fillStyle(color, alpha);
            graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
            graphics.fillCircle(this.player.sprite.x, this.player.sprite.y, radius);
            graphics.strokeCircle(this.player.sprite.x, this.player.sprite.y, radius);
        });
    }

    // ==================== PROJECTILE EFFECTS ====================

    createShadowBolt(startX, startY, targetX, targetY, damage, onHitCallback) {
        // Create shadow bolt sprite (simple circle for now)
        const bolt = this.scene.add.circle(startX, startY, 6, 0x8b5cf6, 1);
        bolt.setDepth(1000);

        // Add glow effect
        bolt.setStrokeStyle(2, 0xec4899, 0.8);

        // Calculate angle and velocity
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const speed = 500;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        // Enable physics
        this.scene.physics.add.existing(bolt);
        bolt.body.setVelocity(velocityX, velocityY);

        // Add trail particles
        const trailParticles = this.scene.add.particles(startX, startY, 'particle', {
            speed: { min: 0, max: 50 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0x8b5cf6, 0xec4899],
            lifespan: 300,
            frequency: 30,
            follow: bolt
        });
        trailParticles.setDepth(999);

        // Store for cleanup
        const effectData = {
            bolt,
            trailParticles,
            damage,
            onHitCallback,
            startTime: Date.now()
        };

        this.activeEffects.push(effectData);

        // Auto-destroy after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            this.cleanupProjectile(effectData);
        });

        return bolt;
    }

    createVoidExplosion(x, y, radius, damage) {
        // Create explosion circle
        const explosion = this.scene.add.circle(x, y, 0, 0x5b21b6, 0.6);
        explosion.setDepth(1000);
        explosion.setStrokeStyle(4, 0x8b5cf6, 1);

        // Expand animation
        this.scene.tweens.add({
            targets: explosion,
            radius: radius,
            alpha: 0,
            strokeAlpha: 0,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => explosion.destroy()
        });

        // Particle burst
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 100, max: 300 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x5b21b6, 0x8b5cf6, 0xec4899],
            lifespan: 600,
            quantity: 20,
            rotate: { min: 0, max: 360 }
        });
        particles.setDepth(1001);
        particles.explode();

        this.scene.time.delayedCall(1000, () => particles.destroy());

        console.log(`💥 Void explosion at (${x}, ${y})`);
    }

    createCorpseExplosion(x, y, radius, damage) {
        // Blood red explosion
        const explosion = this.scene.add.circle(x, y, 0, 0x7f1d1d, 0.7);
        explosion.setDepth(1000);
        explosion.setStrokeStyle(3, 0xef4444, 1);

        this.scene.tweens.add({
            targets: explosion,
            radius: radius,
            alpha: 0,
            strokeAlpha: 0,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => explosion.destroy()
        });

        // Blood particles
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 80, max: 250 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x7f1d1d, 0xef4444, 0xfca5a5],
            lifespan: 500,
            quantity: 15,
            rotate: { min: 0, max: 360 }
        });
        particles.setDepth(1001);
        particles.explode();

        this.scene.time.delayedCall(800, () => particles.destroy());
    }

    createDeathSpiralEffect(x, y, radius) {
        // Spinning black/purple slash effect
        const numSlashes = 8;
        const slashes = [];

        for (let i = 0; i < numSlashes; i++) {
            const angle = (Math.PI * 2 / numSlashes) * i;
            const slash = this.scene.add.line(
                0, 0,
                x, y,
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                0x8b5cf6, 0.8
            );
            slash.setLineWidth(4);
            slash.setDepth(1000);
            slashes.push(slash);
        }

        // Fade out and destroy
        this.scene.tweens.add({
            targets: slashes,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => slashes.forEach(s => s.destroy())
        });
    }

    createDamageNumber(x, y, damage, options = {}) {
        const {
            isCrit = false,
            damageType = 'physical', // physical, magic, fire, poison, true
            isHeal = false
        } = options;

        // Randomize position slightly to avoid stacking
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = -20 + (Math.random() - 0.5) * 10;

        // Determine color and styling based on type
        let color, fontSize, strokeColor, prefix = '';

        if (isHeal) {
            color = '#10b981'; // Green
            strokeColor = '#065f46';
            fontSize = isCrit ? '20px' : '16px';
            prefix = '+';
        } else if (isCrit) {
            color = '#fbbf24'; // Gold for crits
            strokeColor = '#92400e';
            fontSize = '24px';
        } else {
            // Damage type colors
            switch(damageType) {
                case 'physical':
                    color = '#ffffff'; // White
                    strokeColor = '#000000';
                    break;
                case 'magic':
                    color = '#a855f7'; // Purple
                    strokeColor = '#581c87';
                    break;
                case 'fire':
                    color = '#f97316'; // Orange
                    strokeColor = '#7c2d12';
                    break;
                case 'poison':
                    color = '#84cc16'; // Lime green
                    strokeColor = '#365314';
                    break;
                case 'true':
                    color = '#ec4899'; // Pink
                    strokeColor = '#831843';
                    break;
                default:
                    color = '#ffffff';
                    strokeColor = '#000000';
            }
            fontSize = '16px';
        }

        // Create damage text
        const damageText = this.scene.add.text(
            x + offsetX,
            y + offsetY,
            `${prefix}${Math.floor(damage)}${isCrit ? '!' : ''}`,
            {
                fontFamily: 'Arial',
                fontSize: fontSize,
                fontStyle: 'bold',
                fill: color,
                stroke: strokeColor,
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(10000);

        // Add "CRIT" text for critical hits
        if (isCrit && !isHeal) {
            const critText = this.scene.add.text(
                x + offsetX,
                y + offsetY - 20,
                'CRIT',
                {
                    fontFamily: 'Arial',
                    fontSize: '12px',
                    fontStyle: 'bold',
                    fill: '#fbbf24',
                    stroke: '#92400e',
                    strokeThickness: 3
                }
            ).setOrigin(0.5).setDepth(10000);

            this.scene.tweens.add({
                targets: critText,
                y: y + offsetY - 40,
                alpha: 0,
                scale: 1.3,
                duration: 800,
                ease: 'Power2',
                onComplete: () => critText.destroy()
            });
        }

        // Animate damage number
        const animDuration = isCrit ? 1200 : 1000;
        const floatDistance = isCrit ? 60 : 40;

        this.scene.tweens.add({
            targets: damageText,
            y: y + offsetY - floatDistance,
            alpha: 0,
            scale: isCrit ? 1.3 : 1.0,
            duration: animDuration,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }

    createHealEffect(x, y, amount) {
        // Green healing particles rising up
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 30, max: 80 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x10b981, 0x34d399],
            lifespan: 800,
            quantity: 8,
            angle: { min: -100, max: -80 }, // Upward
            gravityY: -50
        });
        particles.setDepth(1001);
        particles.explode();

        // Use new damage number system for heal
        this.createDamageNumber(x, y, amount, { isHeal: true });

        this.scene.time.delayedCall(1000, () => particles.destroy());
    }

    createBuffEffect(x, y, color = 0xfbbf24, icon = '⬆') {
        // Buff icon that floats up
        const buffIcon = this.scene.add.text(x, y, icon, {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(10000);

        this.scene.tweens.add({
            targets: buffIcon,
            y: y - 40,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => buffIcon.destroy()
        });

        // Sparkle particles
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 20, max: 50 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: color,
            lifespan: 600,
            quantity: 10,
            angle: { min: 0, max: 360 }
        });
        particles.setDepth(1001);
        particles.explode();

        this.scene.time.delayedCall(800, () => particles.destroy());
    }

    createLevelUpEffect(x, y) {
        // Epic level up burst
        const burst = this.scene.add.circle(x, y, 0, 0xfbbf24, 0.6);
        burst.setDepth(1000);
        burst.setStrokeStyle(5, 0xfbbf24, 1);

        this.scene.tweens.add({
            targets: burst,
            radius: 150,
            alpha: 0,
            strokeAlpha: 0,
            duration: 600,
            ease: 'Cubic.easeOut',
            onComplete: () => burst.destroy()
        });

        // Massive particle burst
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 100, max: 400 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xfbbf24, 0xf59e0b, 0xfde047],
            lifespan: 1000,
            quantity: 40,
            angle: { min: 0, max: 360 }
        });
        particles.setDepth(1001);
        particles.explode();

        this.scene.time.delayedCall(1200, () => particles.destroy());
    }

    createMinionSummonEffect(x, y) {
        // Purple summoning circle
        const circle = this.scene.add.circle(x, y, 60, 0x8b5cf6, 0.3);
        circle.setDepth(1000);
        circle.setStrokeStyle(3, 0x8b5cf6, 0.8);

        this.scene.tweens.add({
            targets: circle,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 500,
            ease: 'Back.easeIn',
            onComplete: () => circle.destroy()
        });

        // Purple particles
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x8b5cf6, 0xec4899],
            lifespan: 700,
            quantity: 15,
            angle: { min: 0, max: 360 }
        });
        particles.setDepth(1001);
        particles.explode();

        this.scene.time.delayedCall(900, () => particles.destroy());
    }

    createStatusEffect(target, type) {
        // Visual indicator for status effects (slow, stun, etc.)
        let color, icon;

        switch(type) {
            case 'slow':
                color = 0x06b6d4;
                icon = '❄';
                break;
            case 'stun':
                color = 0xfbbf24;
                icon = '⭐';
                break;
            case 'curse':
                color = 0x8b5cf6;
                icon = '💀';
                break;
            case 'poison':
                color = 0x10b981;
                icon = '☠';
                break;
            default:
                color = 0xffffff;
                icon = '?';
        }

        const statusIcon = this.scene.add.text(target.x, target.y - 40, icon, {
            fontSize: '16px'
        }).setOrigin(0.5).setDepth(10000);

        // Float and fade
        this.scene.tweens.add({
            targets: statusIcon,
            y: target.y - 60,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => statusIcon.destroy()
        });
    }

    // ==================== UTILITY ====================

    cleanupProjectile(effectData) {
        if (effectData.bolt) effectData.bolt.destroy();
        if (effectData.trailParticles) effectData.trailParticles.destroy();

        const index = this.activeEffects.indexOf(effectData);
        if (index > -1) {
            this.activeEffects.splice(index, 1);
        }
    }

    update() {
        // Update all aura positions
        this.updateAuras();

        // Check projectile collisions
        this.activeEffects.forEach(effect => {
            if (effect.bolt && effect.bolt.active) {
                this.checkProjectileCollisions(effect);
            }
        });
    }

    checkProjectileCollisions(effectData) {
        const { bolt, damage, onHitCallback } = effectData;

        // PERFORMANCE: Direct iteration instead of creating arrays with Object.values()
        const enemyCollections = [this.scene.enemies, this.scene.wolves];

        for (const collection of enemyCollections) {
            if (!collection) continue;

            for (const enemyId in collection) {
                const enemy = collection[enemyId];
                if (!enemy || !enemy.sprite || !enemy.isAlive) continue;

                // PERFORMANCE: Use squared distance to avoid expensive Math.sqrt()
                const dx = bolt.x - enemy.sprite.x;
                const dy = bolt.y - enemy.sprite.y;
                const distSquared = dx * dx + dy * dy;
                const hitRadiusSquared = 20 * 20; // 400

                if (distSquared < hitRadiusSquared) {
                    // Deal damage
                    if (onHitCallback) {
                        onHitCallback(enemy, damage);
                    }

                    // Destroy projectile
                    this.cleanupProjectile(effectData);
                    return; // Exit early after hit
                }
            }
        }
    }

    destroy() {
        // Cleanup all effects
        this.auraCircles.forEach((auraData) => {
            if (auraData.graphics) auraData.graphics.destroy();
        });
        this.auraCircles.clear();

        this.activeEffects.forEach(effect => {
            this.cleanupProjectile(effect);
        });
        this.activeEffects = [];

        console.log('🗑️ VisualEffectsManager destroyed');
    }
}
