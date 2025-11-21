// Kelise Ability Handler - Implements all Kelise Q/E/R abilities
class KeliseAbilityHandler {
    constructor(scene, player, abilityManager) {
        this.scene = scene;
        this.player = player;
        this.abilityManager = abilityManager;

        console.log(`⚡ Kelise Ability Handler initialized`);
    }

    // Use Q ability - Shadow Veil (Stealth/Invisibility)
    useQ(ability) {
        console.log(`⚡ Using Shadow Veil (Stealth)`);
        this.createShadowVeil(ability);
        return true;
    }

    // Shadow Veil - Become invisible and invincible
    createShadowVeil(ability) {
        const effect = ability.effect || {};
        const duration = effect.duration || 3000; // 3 seconds default
        const alpha = effect.alpha || 0.3; // Semi-transparent

        console.log(`👻 Shadow Veil - Duration: ${duration}ms, Alpha: ${alpha}`);

        // Grant invincibility and invisibility
        this.player.isInvincible = true;
        this.player.isInvisibleToEnemies = true;

        // Make player semi-transparent
        this.player.sprite.setAlpha(alpha);

        // Create stealth visual effect (purple/shadow aura)
        const stealthAura = this.scene.add.circle(
            this.player.sprite.x,
            this.player.sprite.y,
            40,
            0x9D00FF,
            0.3
        );
        stealthAura.setDepth(this.player.sprite.depth - 1);

        // Pulsing aura effect
        this.scene.tweens.add({
            targets: stealthAura,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            repeat: Math.ceil(duration / 500) - 1,
            yoyo: false,
            onUpdate: () => {
                if (this.player.sprite) {
                    stealthAura.x = this.player.sprite.x;
                    stealthAura.y = this.player.sprite.y;
                }
            },
            onComplete: () => {
                stealthAura.destroy();
            }
        });

        // End stealth after duration
        this.scene.time.delayedCall(duration, () => {
            // Restore normal appearance
            if (this.player.sprite) {
                this.player.sprite.setAlpha(1);
            }
            this.player.isInvincible = false;
            this.player.isInvisibleToEnemies = false;

            // Flash effect when coming out of stealth
            if (this.player.sprite) {
                this.scene.tweens.add({
                    targets: this.player.sprite,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
            }

            console.log('👻 Shadow Veil ended');
        });

        console.log('✅ Shadow Veil activated');
    }

    // Use E ability - Dash Strike
    useE(ability) {
        console.log(`⚡ Using Dash Strike`);
        this.createDashStrike(ability);
        return true;
    }

    // Use R ability - TODO: Define Kelise R ability
    useR(ability) {
        console.log(`⚡ Kelise R ability not yet implemented`);
        return false;
    }

    // Dash Strike - Quick dash attack
    createDashStrike(ability) {
        const effect = ability.effect;
        const dashDistance = effect.range || 200;
        const dashSpeed = effect.speed || 800;
        const damage = (effect.damage || 40) + (this.player.level || 1) * 8;

        console.log(`⚡ Dash Strike - Distance: ${dashDistance}px, Damage: ${damage}`);

        // Play attack animation during dash
        if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
            this.player.spriteRenderer.sprite.play('kelise_attack', true);
        }

        // Get direction from player's last movement or facing direction
        let direction = { x: 0, y: 0 };

        if (this.player.body) {
            const vx = this.player.body.velocity.x;
            const vy = this.player.body.velocity.y;
            const magnitude = Math.sqrt(vx * vx + vy * vy);

            if (magnitude > 0) {
                direction.x = vx / magnitude;
                direction.y = vy / magnitude;
            } else {
                // Default to right if no movement
                direction.x = 1;
                direction.y = 0;
            }
        } else {
            direction.x = 1;
            direction.y = 0;
        }

        const startX = this.player.sprite.x;
        const startY = this.player.sprite.y;
        const endX = startX + (direction.x * dashDistance);
        const endY = startY + (direction.y * dashDistance);

        // Create dash trail effect
        const trail = this.scene.add.graphics();
        trail.setDepth(this.player.sprite.depth - 1);

        // Draw trail
        trail.lineStyle(3, 0xFF6B9D, 0.6);
        trail.beginPath();
        trail.moveTo(startX, startY);
        trail.lineTo(endX, endY);
        trail.strokePath();

        // Fade out trail
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                trail.destroy();
            }
        });

        // Perform the dash
        const dashDuration = (dashDistance / dashSpeed) * 1000;

        this.scene.tweens.add({
            targets: this.player.sprite,
            x: endX,
            y: endY,
            duration: dashDuration,
            ease: 'Power2',
            onComplete: () => {
                console.log('⚡ Dash complete');
            }
        });

        // Damage enemies in dash path
        const hitEnemies = new Set();

        // Check for hits along the dash path
        const checkInterval = this.scene.time.addEvent({
            delay: 16,
            repeat: Math.ceil(dashDuration / 16),
            callback: () => {
                // Get all enemy collections
                const enemyCollections = [
                    this.scene.swordDemons,
                    this.scene.minotaurs,
                    this.scene.mushrooms,
                    this.scene.emberclaws
                ];

                enemyCollections.forEach(collection => {
                    if (!collection) return;

                    Object.values(collection).forEach(enemy => {
                    if (!enemy || !enemy.sprite || hitEnemies.has(enemy.enemyId)) return;

                    const dx = enemy.sprite.x - this.player.sprite.x;
                    const dy = enemy.sprite.y - this.player.sprite.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= 50) {
                        hitEnemies.add(enemy.enemyId);

                        if (this.scene.networkManager) {
                            this.scene.networkManager.dealDamageToEnemy(enemy.enemyId, damage);
                        }

                        // Visual hit effect
                        const hitFlash = this.scene.add.circle(enemy.sprite.x, enemy.sprite.y, 20, 0xFF6B9D, 0.6);
                        hitFlash.setDepth(enemy.sprite.depth + 1);

                        this.scene.tweens.add({
                            targets: hitFlash,
                            scale: 2,
                            alpha: 0,
                            duration: 200,
                            onComplete: () => {
                                hitFlash.destroy();
                            }
                        });
                    }
                    });
                });
            }
        });

        // Play sound effect
        if (this.scene.sound && this.scene.sound.get('hit_punch_1')) {
            this.scene.sound.play('hit_punch_1', { volume: 0.4 });
        }

        console.log('✅ Dash Strike created');
    }
}
