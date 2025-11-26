// Kelise Ability Handler - Implements all Kelise Q/E/R abilities
class KeliseAbilityHandler {
    constructor(scene, player, abilityManager) {
        this.scene = scene;
        this.player = player;
        this.abilityManager = abilityManager;

        console.log(`⚡ Kelise Ability Handler initialized`);
    }

    // Use Q ability - Life Drain
    useQ(ability) {
        console.log(`⚡ Using Life Drain`);
        this.createLifeDrain(ability);
        return true;
    }

    // Life Drain - Channel to become invincible, immobile, and drain life from nearby enemies
    createLifeDrain(ability) {
        const effect = ability.effect || {};
        const duration = effect.duration || 4000; // 4 seconds
        const healPerEnemyPerSecond = effect.healPerEnemyPerSecond || 1;
        const range = effect.range || 300; // 300 pixels

        console.log(`💀 Life Drain - Duration: ${duration}ms, Range: ${range}px, Heal: ${healPerEnemyPerSecond} HP/enemy/s`);

        // Grant invincibility and freeze movement
        this.player.isInvincible = true;
        this.player.isChanneling = true; // Prevent movement

        // Store original velocity and stop movement
        const originalVelocity = this.player.body ? {
            x: this.player.body.velocity.x,
            y: this.player.body.velocity.y
        } : { x: 0, y: 0 };

        if (this.player.body) {
            this.player.body.setVelocity(0, 0);
        }

        // Create animation if it doesn't exist
        if (!this.scene.anims.exists('kelise_lifedrain_aura')) {
            this.scene.anims.create({
                key: 'kelise_lifedrain_aura',
                frames: this.scene.anims.generateFrameNumbers('kelise_swiftdash', {
                    start: 15,
                    end: 29
                }),
                frameRate: 15,
                repeat: -1 // Loop indefinitely
            });
        }

        // Create drain visual effect (animated sprite)
        const drainAura = this.scene.add.sprite(
            this.player.sprite.x,
            this.player.sprite.y,
            'kelise_swiftdash',
            15
        );
        drainAura.setDepth(this.player.sprite.depth - 1);
        drainAura.setScale(range / 32); // Scale to match the range (64px sprite to 300px range)
        drainAura.setAlpha(0.3); // More transparent to see drain lines
        drainAura.play('kelise_lifedrain_aura');

        // Update position to follow player
        const updateAura = () => {
            if (this.player.sprite && drainAura.active) {
                drainAura.x = this.player.sprite.x;
                drainAura.y = this.player.sprite.y;
            }
        };

        // Position update event
        const updateEvent = this.scene.time.addEvent({
            delay: 16,
            callback: updateAura,
            loop: true
        });

        // Drain ticks (4 times over 4 seconds = once per second)
        const tickInterval = 1000; // 1 second
        const totalTicks = Math.floor(duration / tickInterval);
        let tickCount = 0;

        const drainTick = () => {
            tickCount++;

            // Find enemies in range
            const enemiesInRange = [];

            // Check all enemy collections (same pattern as Dash Strike)
            const enemyCollections = [
                this.scene.swordDemons,
                this.scene.minotaurs,
                this.scene.mushrooms,
                this.scene.emberclaws
            ];

            enemyCollections.forEach(collection => {
                if (!collection) return;

                Object.values(collection).forEach(enemy => {
                    if (enemy && enemy.sprite && enemy.isAlive) {
                        const dx = enemy.sprite.x - this.player.sprite.x;
                        const dy = enemy.sprite.y - this.player.sprite.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance <= range) {
                            enemiesInRange.push(enemy);
                        }
                    }
                });
            });

            const healAmount = enemiesInRange.length * healPerEnemyPerSecond;

            if (healAmount > 0) {
                // Heal the player
                this.player.health = Math.min(this.player.health + healAmount, this.player.maxHealth);
                if (this.player.ui && this.player.ui.updateHealthBar) {
                    this.player.ui.updateHealthBar();
                }

                // Visual feedback - healing numbers
                const healText = this.scene.add.text(
                    this.player.sprite.x,
                    this.player.sprite.y - 60,
                    `+${healAmount}`,
                    {
                        font: 'bold 20px Arial',
                        fill: '#00FF00',
                        stroke: '#000000',
                        strokeThickness: 4
                    }
                );
                healText.setOrigin(0.5);
                healText.setDepth(this.player.sprite.depth + 100);

                this.scene.tweens.add({
                    targets: healText,
                    y: healText.y - 40,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => healText.destroy()
                });

                // Draw drain lines to enemies
                enemiesInRange.forEach(enemy => {
                    const drainLine = this.scene.add.line(
                        0, 0,
                        this.player.sprite.x, this.player.sprite.y,
                        enemy.sprite.x, enemy.sprite.y,
                        0xFF0000,
                        0.5
                    );
                    drainLine.setDepth(this.player.sprite.depth - 1);
                    drainLine.setLineWidth(2);

                    this.scene.tweens.add({
                        targets: drainLine,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => drainLine.destroy()
                    });
                });

                console.log(`💀 Life Drain tick ${tickCount}/${totalTicks}: Drained ${healAmount} HP from ${enemiesInRange.length} enemies`);
            }

            // Schedule next tick if not done
            if (tickCount < totalTicks) {
                this.scene.time.delayedCall(tickInterval, drainTick);
            }
        };

        // Start first tick immediately
        drainTick();

        // Play sound effect
        if (this.scene.sound) {
            this.scene.sound.play('kelise_lifedrain', { volume: 0.6 });
        }

        // End visual drain after duration (4 seconds)
        console.log(`⏰ Life Drain visuals will end in ${duration}ms`);
        this.scene.time.delayedCall(duration, () => {
            console.log('⏰ Life Drain visuals callback fired');

            // Restore movement (but keep invincibility for 0.5s more)
            this.player.isChanneling = false;

            // Destroy aura and stop update event
            if (updateEvent && updateEvent.remove) {
                updateEvent.remove();
            }
            if (drainAura && !drainAura.destroyed) {
                drainAura.destroy();
            }

            console.log('💀 Life Drain visuals ended, movement restored');
        });

        // End invincibility after 4.5 seconds (0.5s grace period)
        const invincibilityDuration = duration + 500; // 4.5 seconds
        console.log(`⏰ Invincibility will end in ${invincibilityDuration}ms`);
        this.scene.time.delayedCall(invincibilityDuration, () => {
            console.log('⏰ Invincibility callback fired');

            // Remove invincibility
            this.player.isInvincible = false;

            console.log('   isInvincible:', this.player.isInvincible);
            console.log('   isChanneling:', this.player.isChanneling);

            // Flash effect when ending
            if (this.player.sprite) {
                this.scene.tweens.add({
                    targets: this.player.sprite,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
            }

            console.log('💀 Invincibility ended');
        });

        console.log('✅ Life Drain activated');
    }

    // Use E ability - Dash Strike
    useE(ability) {
        console.log(`⚡ Using Dash Strike`);
        this.createDashStrike(ability);
        return true;
    }

    // Use R ability - Blood Harvest
    useR(ability) {
        console.log(`⚡ Using Blood Harvest`);
        this.createBloodHarvest(ability);
        return true;
    }

    // Blood Harvest - Heal for all bleed damage dealt
    createBloodHarvest(ability) {
        const effect = ability.effect || {};
        const duration = effect.duration || 30000; // 30 seconds

        console.log(`🩸 Blood Harvest - Duration: ${duration}ms`);

        // Enable blood harvest mode
        this.player.bloodHarvestActive = true;

        // Play sound effect
        if (this.scene.sound) {
            this.scene.sound.play('kelise_bloodharvest', { volume: 0.6 });
        }

        // Create animation if it doesn't exist
        if (!this.scene.anims.exists('kelise_bloodharvest_flash')) {
            this.scene.anims.create({
                key: 'kelise_bloodharvest_flash',
                frames: this.scene.anims.generateFrameNumbers('kelise_bloodharvest', {
                    start: 84,
                    end: 95
                }),
                frameRate: 30,
                repeat: 0 // Play once
            });
        }

        // Red highlight effect with animated sprite
        const redTint = this.scene.add.sprite(
            this.player.sprite.x,
            this.player.sprite.y,
            'kelise_bloodharvest',
            84
        );
        redTint.setDepth(this.player.sprite.depth + 1);
        redTint.setScale(2); // Make it bigger to cover the player
        redTint.play('kelise_bloodharvest_flash');

        // Follow player
        const updateTint = () => {
            if (this.player.sprite && redTint.active) {
                redTint.x = this.player.sprite.x;
                redTint.y = this.player.sprite.y;
            }
        };

        const updateEvent = this.scene.time.addEvent({
            delay: 16,
            callback: updateTint,
            loop: true
        });

        // End Blood Harvest after duration
        this.scene.time.delayedCall(duration, () => {
            this.player.bloodHarvestActive = false;
            updateEvent.remove();
            redTint.destroy();

            // Flash effect when ending
            if (this.player.sprite) {
                this.scene.tweens.add({
                    targets: this.player.sprite,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
            }

            console.log('🩸 Blood Harvest ended');
        });

        console.log('✅ Blood Harvest activated');
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

        // Get direction from player's current or last movement
        let direction = { x: 0, y: 0 };

        if (this.player.body) {
            const vx = this.player.body.velocity.x;
            const vy = this.player.body.velocity.y;
            const magnitude = Math.sqrt(vx * vx + vy * vy);

            if (magnitude > 0) {
                // Use current movement direction
                direction.x = vx / magnitude;
                direction.y = vy / magnitude;
            } else if (this.player.lastMovementDirection) {
                // Not currently moving - use last movement direction
                direction.x = this.player.lastMovementDirection.x;
                direction.y = this.player.lastMovementDirection.y;
            } else {
                // No last movement - use facing direction from sprite
                if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
                    const facingRight = !this.player.spriteRenderer.sprite.flipX;
                    direction.x = facingRight ? 1 : -1;
                    direction.y = 0;
                } else {
                    // Fallback to right
                    direction.x = 1;
                    direction.y = 0;
                }
            }
        } else {
            // No physics body - use last movement or facing direction
            if (this.player.lastMovementDirection) {
                direction.x = this.player.lastMovementDirection.x;
                direction.y = this.player.lastMovementDirection.y;
            } else if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
                const facingRight = !this.player.spriteRenderer.sprite.flipX;
                direction.x = facingRight ? 1 : -1;
                direction.y = 0;
            } else {
                direction.x = 1;
                direction.y = 0;
            }
        }

        console.log(`⚡ Dash direction: (${direction.x.toFixed(2)}, ${direction.y.toFixed(2)})`);


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

                // BIG AOE DAMAGE BURST AT END OF DASH
                const burstRadius = 100; // pixels
                const burstDamage = Math.floor(damage * 1.5); // 50% more damage than dash hits

                console.log(`💥 Dash Strike burst: ${burstDamage} damage in ${burstRadius}px radius`);

                // Create animation if it doesn't exist
                if (!this.scene.anims.exists('kelise_dash_burst')) {
                    this.scene.anims.create({
                        key: 'kelise_dash_burst',
                        frames: this.scene.anims.generateFrameNumbers('kelise_swiftdash', {
                            start: 120,
                            end: 134
                        }),
                        frameRate: 30,
                        repeat: 0
                    });
                }

                // Visual burst effect (animated sprite)
                const burst = this.scene.add.sprite(
                    this.player.sprite.x,
                    this.player.sprite.y,
                    'kelise_swiftdash',
                    120
                );
                burst.setDepth(9000);
                burst.setScale(burstRadius / 32); // Scale to match burst radius
                burst.setAlpha(0.8);
                burst.play('kelise_dash_burst');

                // Destroy when animation completes
                burst.once('animationcomplete', () => {
                    burst.destroy();
                });

                // Damage all enemies in burst radius
                const enemyCollections = [
                    this.scene.swordDemons,
                    this.scene.minotaurs,
                    this.scene.mushrooms,
                    this.scene.emberclaws
                ];

                let burstHits = 0;
                enemyCollections.forEach(collection => {
                    if (!collection) return;

                    Object.values(collection).forEach(enemy => {
                        if (!enemy || !enemy.sprite || !enemy.data?.id) return;

                        const dx = enemy.sprite.x - this.player.sprite.x;
                        const dy = enemy.sprite.y - this.player.sprite.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance <= burstRadius) {
                            // Deal burst damage
                            if (typeof networkManager !== 'undefined') {
                                networkManager.hitEnemy(
                                    enemy.data.id,
                                    burstDamage,
                                    this.player.data.id,
                                    { x: this.player.sprite.x, y: this.player.sprite.y }
                                );
                                burstHits++;
                            }

                            // Visual hit effect
                            const hitFlash = this.scene.add.circle(
                                enemy.sprite.x,
                                enemy.sprite.y,
                                30,
                                0xFF1493,
                                0.8
                            );
                            hitFlash.setDepth(enemy.sprite.depth + 1);

                            this.scene.tweens.add({
                                targets: hitFlash,
                                scale: 2.5,
                                alpha: 0,
                                duration: 300,
                                ease: 'Power2',
                                onComplete: () => hitFlash.destroy()
                            });
                        }
                    });
                });

                console.log(`💥 Burst hit ${burstHits} enemies`);

                // Camera shake for impact
                this.scene.cameras.main.shake(200, 0.006);

                // Reset animation to appropriate state
                if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
                    // Check if player is still moving
                    const isMoving = this.player.body &&
                                   (Math.abs(this.player.body.velocity.x) > 0 ||
                                    Math.abs(this.player.body.velocity.y) > 0);

                    if (isMoving) {
                        // Play running animation
                        if (this.scene.anims.exists('kelise_running')) {
                            this.player.spriteRenderer.sprite.play('kelise_running', true);
                        }
                    } else {
                        // Play idle animation
                        if (this.scene.anims.exists('kelise_idle')) {
                            this.player.spriteRenderer.sprite.play('kelise_idle', true);
                        }
                    }
                }
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
                    if (!enemy || !enemy.sprite || !enemy.data?.id || hitEnemies.has(enemy.data.id)) return;

                    const dx = enemy.sprite.x - this.player.sprite.x;
                    const dy = enemy.sprite.y - this.player.sprite.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= 50) {
                        hitEnemies.add(enemy.data.id);

                        if (typeof networkManager !== 'undefined') {
                            networkManager.hitEnemy(
                                enemy.data.id,
                                damage,
                                this.player.data.id,
                                { x: this.player.sprite.x, y: this.player.sprite.y }
                            );
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
        if (this.scene.sound) {
            this.scene.sound.play('kelise_swiftdash', { volume: 0.5 });
        }

        console.log('✅ Dash Strike created');
    }
}
