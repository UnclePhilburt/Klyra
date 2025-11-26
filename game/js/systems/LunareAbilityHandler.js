// Lunare Ability Handler - Implements Lunare E ability (Shadow Vortex)
class LunareAbilityHandler {
    constructor(scene, player, abilityManager) {
        this.scene = scene;
        this.player = player;
        this.abilityManager = abilityManager;

        console.log(`⚡ Lunare Ability Handler initialized`);
    }

    // Use E ability - Shadow Vortex
    useE(ability) {
        console.log(`⚡ Using Shadow Vortex`);

        // Disable auto-attacks while boomerang is away
        this.player.eAbilityActive = true;
        console.log(`🚫 Auto-attacks disabled - boomerang is away`);

        this.createShadowVortex(ability);
        return true;
    }

    // Shadow Vortex - Throws boomerang, holds it in place for 3 seconds pulling enemies, then returns
    createShadowVortex(ability) {
        const effect = ability.effect;
        const range = (effect.range || 5.0) * GameConfig.GAME.TILE_SIZE;
        const holdDuration = effect.holdDuration || 3000;  // 3 seconds
        const pullStrength = effect.pullStrength || 150;
        const pullRadius = effect.pullRadius || 200;

        console.log(`🌀 Shadow Vortex - Range: ${range}px, Hold: ${holdDuration}ms`);

        // Get facing direction
        const direction = this.getPlayerFacingDirection();
        const playerPos = { x: this.player.sprite.x, y: this.player.sprite.y };

        // Calculate vortex position (farthest point)
        const vortexX = playerPos.x + (direction.x * range);
        const vortexY = playerPos.y + (direction.y * range);

        // Broadcast to other players
        const networkManager = this.scene.game.registry.get('networkManager');
        if (networkManager && networkManager.connected) {
            networkManager.useAbility('e', 'Shadow Vortex', null, {
                type: 'lunare_vortex',
                playerId: this.player.data.id,
                position: playerPos,
                direction: direction,
                vortexPosition: { x: vortexX, y: vortexY },
                range: range,
                holdDuration: holdDuration,
                pullStrength: pullStrength,
                pullRadius: pullRadius
            });
        }

        // Get reference to underglow
        const underglow = this.player.spriteRenderer.underglow;
        if (underglow) {
            this.player.spriteRenderer.underglowFollowsPlayer = false;

            // Force animation switch to "without boomerang"
            const body = this.player.sprite.body;
            if (body && this.player.spriteRenderer.sprite) {
                const isMoving = body.velocity.x !== 0 || body.velocity.y !== 0;
                const animKey = isMoving ? 'lunare_running_noboomerang' : 'lunare_idle_noboomerang';
                if (this.scene.anims.exists(animKey)) {
                    this.player.spriteRenderer.sprite.play(animKey, true);
                }
            }
        }

        // Create the boomerang star
        const star = this.scene.add.graphics();
        star.x = playerPos.x;
        star.y = playerPos.y - 10;

        // Draw star
        const starSize = 12;
        star.fillStyle(0xFF0000, 1);
        star.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = (i % 2 === 0) ? starSize : starSize * 0.4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                star.moveTo(x, y);
            } else {
                star.lineTo(x, y);
            }
        }
        star.closePath();
        star.fillPath();

        // Add glow
        const glow = this.scene.add.circle(star.x, star.y, starSize * 1.5, 0xFF6B6B, 0.3);
        glow.setDepth(1);
        star.setDepth(2);
        glow.setBlendMode(Phaser.BlendModes.ADD);

        // Calculate curve for outward path
        const speed = 250;
        const outwardTime = (range / speed) * 1000;

        const perpX = -direction.y;
        const perpY = direction.x;
        const arcOffset = range * 0.8;
        const midX = playerPos.x + (direction.x * range * 0.5) + (perpX * arcOffset);
        const midY = playerPos.y + (direction.y * range * 0.5) + (perpY * arcOffset);

        // Spinning animation
        this.scene.tweens.add({
            targets: star,
            rotation: Math.PI * 10,  // More spins for longer duration
            duration: outwardTime + holdDuration + (outwardTime * 0.8),
            ease: 'Linear'
        });

        // Outward path - use simple tween instead of bezier
        console.log(`🌀 Creating tween to (${vortexX.toFixed(0)}, ${vortexY.toFixed(0)}) over ${outwardTime}ms`);

        this.scene.tweens.add({
            targets: [star, glow],
            x: vortexX,
            y: vortexY,
            duration: outwardTime,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                if (underglow) {
                    underglow.setPosition(star.x, star.y);
                }
            },
            onComplete: () => {
                // Hold at vortex position and pull enemies
                console.log(`🌀 Vortex active at (${vortexX.toFixed(0)}, ${vortexY.toFixed(0)}), radius: ${pullRadius}px, pull: ${pullStrength}`);

                // Create visual vortex effect
                const vortexCircle = this.scene.add.circle(vortexX, vortexY, pullRadius, 0xFF0000, 0.1);
                vortexCircle.setDepth(0);
                vortexCircle.setBlendMode(Phaser.BlendModes.ADD);

                // Pulsing effect
                this.scene.tweens.add({
                    targets: vortexCircle,
                    alpha: 0.2,
                    scale: 1.1,
                    duration: 500,
                    yoyo: true,
                    repeat: Math.floor(holdDuration / 1000)
                });

                // Pull enemies every frame
                let pullTicks = 0;
                const pullInterval = this.scene.time.addEvent({
                    delay: 16,  // ~60fps
                    callback: () => {
                        pullTicks++;
                        if (pullTicks === 1) {
                            console.log(`🌀 Starting pull loop - will run ${Math.floor(holdDuration / 16)} times`);
                        }
                        this.pullEnemies(vortexX, vortexY, pullRadius, pullStrength / 60);  // Divide by 60 for per-frame
                    },
                    repeat: Math.floor(holdDuration / 16)
                });

                // Explosion right before returning
                this.scene.time.delayedCall(holdDuration - 100, () => {
                    console.log(`💥 Vortex explosion visual effect`);

                    // Large explosion flash
                    const explosionFlash = this.scene.add.circle(vortexX, vortexY, pullRadius, 0xFF0000, 0.6);
                    explosionFlash.setDepth(10);
                    explosionFlash.setBlendMode(Phaser.BlendModes.ADD);

                    this.scene.tweens.add({
                        targets: explosionFlash,
                        scale: 1.3,
                        alpha: 0,
                        duration: 300,
                        ease: 'Cubic.easeOut',
                        onComplete: () => explosionFlash.destroy()
                    });

                    // Explosion particles
                    for (let i = 0; i < 16; i++) {
                        const angle = (Math.PI * 2 * i) / 16;
                        const particle = this.scene.add.circle(
                            vortexX,
                            vortexY,
                            6,
                            0xFF0000
                        );
                        particle.setDepth(10);
                        particle.setBlendMode(Phaser.BlendModes.ADD);

                        this.scene.tweens.add({
                            targets: particle,
                            x: vortexX + Math.cos(angle) * pullRadius * 0.8,
                            y: vortexY + Math.sin(angle) * pullRadius * 0.8,
                            alpha: 0,
                            duration: 400,
                            ease: 'Cubic.easeOut',
                            onComplete: () => particle.destroy()
                        });
                    }
                });

                // After hold duration, return
                this.scene.time.delayedCall(holdDuration, () => {
                    pullInterval.remove();
                    vortexCircle.destroy();

                    // Clear pull forces from all enemies
                    const allEnemies = this.scene.getAllEnemies();
                    for (const enemy of allEnemies) {
                        if (enemy.pullForce) {
                            enemy.pullForce = null;
                        }
                    }

                    const returnTime = outwardTime * 0.8;

                    // Return path
                    this.scene.tweens.add({
                        targets: [star, glow],
                        x: this.player.spriteRenderer.sprite.x,
                        y: this.player.spriteRenderer.sprite.y,
                        duration: returnTime,
                        ease: 'Sine.easeIn',
                        onUpdate: () => {
                            if (underglow) {
                                underglow.setPosition(star.x, star.y);
                            }
                        },
                        onComplete: () => {
                            star.destroy();
                            glow.destroy();

                            // Re-enable auto-attacks now that boomerang has returned
                            this.player.eAbilityActive = false;
                            console.log(`✅ Auto-attacks re-enabled - boomerang has returned`);

                            // Return underglow and animation
                            if (underglow && this.player.spriteRenderer.sprite) {
                                underglow.setPosition(
                                    this.player.spriteRenderer.sprite.x,
                                    this.player.spriteRenderer.sprite.y + 20
                                );
                                this.player.spriteRenderer.underglowFollowsPlayer = true;

                                const body = this.player.sprite.body;
                                if (body) {
                                    const isMoving = body.velocity.x !== 0 || body.velocity.y !== 0;
                                    const animKey = isMoving ? 'lunare_running' : 'lunare_idle';
                                    if (this.scene.anims.exists(animKey)) {
                                        this.player.spriteRenderer.sprite.play(animKey, true);
                                    }
                                }
                            }
                        }
                    });
                });
            }
        });
    }

    // Pull enemies towards vortex position
    pullEnemies(vortexX, vortexY, pullRadius, pullForce) {
        const allEnemies = this.scene.getAllEnemies();
        let pullCount = 0;

        for (const enemy of allEnemies) {
            if (!enemy.isAlive || !enemy.sprite) continue;

            // Calculate distance to vortex
            const dx = vortexX - enemy.sprite.x;
            const dy = vortexY - enemy.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Only pull if within radius
            if (distance < pullRadius && distance > 10) {
                // Calculate pull direction (normalized)
                const pullX = (dx / distance) * pullForce;
                const pullY = (dy / distance) * pullForce;

                // Set pull force on enemy (will be applied in enemy update)
                enemy.pullForce = { x: pullX, y: pullY };
                pullCount++;

                if (pullCount === 1) {
                    console.log(`🌀 Pulling enemy - distance: ${distance.toFixed(0)}px, force: (${pullX.toFixed(2)}, ${pullY.toFixed(2)})`);
                }
            } else {
                // Clear pull force if out of range
                enemy.pullForce = null;
            }
        }

        if (pullCount > 0) {
            console.log(`🌀 Vortex pulling ${pullCount} enemies`);
        }
    }

    // Get player facing direction
    getPlayerFacingDirection() {
        // Use last movement direction or default to down
        if (this.player.lastMovementDirection) {
            return this.player.lastMovementDirection;
        }

        // Default to facing down
        return { x: 0, y: 1 };
    }
}
