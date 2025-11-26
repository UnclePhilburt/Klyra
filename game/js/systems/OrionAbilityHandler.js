// Orion Ability Handler - Implements Orion E ability (Shadow Roll)
class OrionAbilityHandler {
    constructor(scene, player, abilityManager) {
        this.scene = scene;
        this.player = player;
        this.abilityManager = abilityManager;

        console.log(`⚡ Orion Ability Handler initialized`);
    }

    // Use Q ability - Arrow Barrage
    useQ(ability) {
        console.log(`⚡ Using Arrow Barrage`);
        this.createArrowBarrage(ability);
        return true;
    }

    // Use E ability - Shadow Roll
    useE(ability) {
        console.log(`⚡ Using Shadow Roll`);
        this.createShadowRoll(ability);
        return true;
    }

    // Arrow Barrage - Shoots 5 arrows in a cone every second for 10 seconds
    createArrowBarrage(ability) {
        const effect = ability.effect;
        const duration = effect.duration || 10000;  // 10 seconds
        const volleyInterval = effect.volleyInterval || 1000;  // 1 second
        const arrowsPerVolley = effect.arrowsPerVolley || 5;
        const coneSpread = effect.coneSpread || 30;  // degrees
        const damage = effect.damage || 25;

        console.log(`🏹 Arrow Barrage - Duration: ${duration}ms, Volleys every ${volleyInterval}ms`);

        // Get initial facing direction to broadcast
        const initialDirection = this.getPlayerFacingDirection();

        // Broadcast to other players
        const networkManager = this.scene.game.registry.get('networkManager');
        if (networkManager && networkManager.connected) {
            networkManager.useAbility('q', 'Arrow Barrage', null, {
                type: 'orion_arrow_barrage',
                playerId: this.player.data.id,
                position: { x: this.player.sprite.x, y: this.player.sprite.y },
                direction: initialDirection,  // Send the direction
                duration: duration,
                volleyInterval: volleyInterval,
                arrowsPerVolley: arrowsPerVolley,
                coneSpread: coneSpread,
                damage: damage
            });
        }

        // Track barrage state
        let volleyCount = 0;
        const maxVolleys = Math.floor(duration / volleyInterval);

        // Start the barrage
        const barrageInterval = this.scene.time.addEvent({
            delay: volleyInterval,
            callback: () => {
                if (volleyCount >= maxVolleys || !this.player.isAlive) {
                    barrageInterval.remove();
                    console.log('🏹 Arrow Barrage complete');
                    return;
                }

                // Get player's facing direction
                const direction = this.getPlayerFacingDirection();

                // Calculate base angle
                const baseAngle = Math.atan2(direction.y, direction.x);

                // Shoot arrows in a cone
                for (let i = 0; i < arrowsPerVolley; i++) {
                    // Calculate spread angle for this arrow
                    const spreadRange = (coneSpread * Math.PI) / 180;  // Convert to radians
                    const angleOffset = (i / (arrowsPerVolley - 1) - 0.5) * spreadRange;
                    const arrowAngle = baseAngle + angleOffset;

                    // Calculate arrow direction
                    const arrowDirection = {
                        x: Math.cos(arrowAngle),
                        y: Math.sin(arrowAngle)
                    };

                    // Create the arrow projectile
                    this.createArrowProjectile(arrowDirection, damage);
                }

                volleyCount++;
                console.log(`🏹 Volley ${volleyCount}/${maxVolleys} fired`);
            },
            loop: true
        });

        // Fire the first volley immediately
        barrageInterval.callback();

        console.log('✅ Arrow Barrage activated');
    }

    // Helper to get player's facing direction
    getPlayerFacingDirection() {
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

        return direction;
    }

    // Create a single arrow projectile
    createArrowProjectile(direction, damage) {
        const startX = this.player.sprite.x;
        const startY = this.player.sprite.y;

        // Create arrow sprite (same as auto attack)
        const arrow = this.scene.add.sprite(startX, startY, 'orion_projectile');
        arrow.setScale(1.0);
        arrow.setDepth(3);
        arrow.setRotation(Math.atan2(direction.y, direction.x));

        // Add physics
        this.scene.physics.add.existing(arrow);
        arrow.body.setSize(16, 16);

        // Set velocity
        const speed = 800;  // Increased from 500 for faster arrows
        arrow.body.setVelocity(direction.x * speed, direction.y * speed);

        // Track projectile for collision detection
        const projectileData = {
            sprite: arrow,
            damage: damage,
            ownerId: this.player.data.id,
            startTime: Date.now()
        };

        // Add to player's projectiles array for collision detection
        if (!this.player.barrageProjectiles) {
            this.player.barrageProjectiles = [];
        }
        this.player.barrageProjectiles.push(projectileData);

        // Destroy after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            if (arrow && arrow.active) {
                arrow.destroy();
                if (this.player.barrageProjectiles) {
                    this.player.barrageProjectiles = this.player.barrageProjectiles.filter(p => p.sprite !== arrow);
                }
            }
        });

        // Check for collisions each frame
        const updateTimer = this.scene.time.addEvent({
            delay: 16,  // ~60 FPS
            callback: () => {
                if (!arrow || !arrow.active) {
                    updateTimer.remove();
                    return;
                }

                this.checkArrowCollisions(projectileData, updateTimer);
            },
            loop: true
        });
    }

    // Check arrow collisions with enemies
    checkArrowCollisions(projectileData, timer) {
        const arrow = projectileData.sprite;
        if (!arrow || !arrow.active) {
            timer.remove();
            return;
        }

        // Check collision with enemies
        const enemies = [
            ...Object.values(this.scene.enemies || {}),
            ...Object.values(this.scene.minotaurs || {}),
            ...Object.values(this.scene.mushrooms || {}),
            ...Object.values(this.scene.emberclaws || {}),
            ...Object.values(this.scene.swordDemons || {})
        ];

        for (const enemy of enemies) {
            if (!enemy || !enemy.sprite || !enemy.isAlive) continue;

            const dist = Phaser.Math.Distance.Between(
                arrow.x,
                arrow.y,
                enemy.sprite.x,
                enemy.sprite.y
            );

            if (dist < 30) {
                // Hit!
                console.log(`🏹 Arrow hit ${enemy.constructor.name} for ${projectileData.damage} damage`);

                // Apply damage to enemy (handled by server)
                const networkManager = this.scene.game.registry.get('networkManager');
                if (networkManager && networkManager.connected) {
                    networkManager.hitEnemy(enemy.data.id, projectileData.damage);
                }

                // Destroy arrow
                arrow.destroy();
                if (this.player.barrageProjectiles) {
                    this.player.barrageProjectiles = this.player.barrageProjectiles.filter(p => p.sprite !== arrow);
                }
                timer.remove();
                return;
            }
        }
    }

    // Shadow Roll - Quick evasive roll with invulnerability
    createShadowRoll(ability) {
        const effect = ability.effect;
        const rollDistance = effect.range || 150;
        const invulnerable = effect.invulnerable || false;

        // Calculate roll duration to match animation (7 frames at 10 FPS = 700ms)
        const rollDuration = 700;

        console.log(`🌀 Shadow Roll - Distance: ${rollDistance}px, Duration: ${rollDuration}ms`);

        // Play roll animation
        if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
            this.player.spriteRenderer.sprite.play('orion_roll', true);
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

        console.log(`🌀 Roll direction: (${direction.x.toFixed(2)}, ${direction.y.toFixed(2)})`);

        // Broadcast to other players
        const networkManager = this.scene.game.registry.get('networkManager');
        if (networkManager && networkManager.connected) {
            const facingRight = this.player.spriteRenderer && this.player.spriteRenderer.sprite ?
                !this.player.spriteRenderer.sprite.flipX : true;

            networkManager.useAbility('e', 'Shadow Roll', null, {
                type: 'orion_roll',
                playerId: this.player.data.id,
                position: { x: this.player.sprite.x, y: this.player.sprite.y },
                direction: direction,
                facingRight: facingRight,
                invulnerable: invulnerable,
                range: rollDistance,
                duration: rollDuration
            });
        }

        const startX = this.player.sprite.x;
        const startY = this.player.sprite.y;
        const endX = startX + (direction.x * rollDistance);
        const endY = startY + (direction.y * rollDistance);

        // Grant temporary invulnerability if enabled
        if (invulnerable) {
            this.player.isInvincible = true;
        }

        // Create roll trail effect with purple arcane theme
        const trail = this.scene.add.graphics();
        trail.setDepth(this.player.sprite.depth - 1);

        // Draw trail
        trail.lineStyle(4, 0x9370DB, 0.7); // Purple arcane color
        trail.beginPath();
        trail.moveTo(startX, startY);
        trail.lineTo(endX, endY);
        trail.strokePath();

        // Fade out trail
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                trail.destroy();
            }
        });

        // Create afterimage effects during roll
        const afterimageCount = 5;
        const afterimageInterval = rollDuration / afterimageCount;

        for (let i = 0; i < afterimageCount; i++) {
            this.scene.time.delayedCall(afterimageInterval * i, () => {
                if (this.player.sprite && this.player.spriteRenderer) {
                    const afterimage = this.scene.add.sprite(
                        this.player.sprite.x,
                        this.player.sprite.y,
                        'orion'
                    );

                    // Match current frame and flip
                    afterimage.setFrame(this.player.spriteRenderer.sprite.frame.name);
                    afterimage.setFlipX(this.player.spriteRenderer.sprite.flipX);
                    afterimage.setScale(this.player.spriteRenderer.sprite.scaleX);
                    afterimage.setDepth(this.player.sprite.depth - 1);
                    afterimage.setTint(0x9370DB); // Purple tint
                    afterimage.setAlpha(0.5);

                    // Fade out afterimage
                    this.scene.tweens.add({
                        targets: afterimage,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => afterimage.destroy()
                    });
                }
            });
        }

        // Perform the roll
        this.scene.tweens.add({
            targets: this.player.sprite,
            x: endX,
            y: endY,
            duration: rollDuration,
            ease: 'Power2',
            onComplete: () => {
                console.log('🌀 Roll complete');

                // Remove invulnerability after roll
                if (invulnerable) {
                    this.player.isInvincible = false;
                }

                // Flash effect when ending
                if (this.player.sprite) {
                    this.scene.tweens.add({
                        targets: this.player.sprite,
                        alpha: 0.7,
                        duration: 50,
                        yoyo: true,
                        repeat: 1
                    });
                }

                // Reset animation state by resetting isMoving flag and playing idle
                // This allows the movement system to properly restart the running animation
                if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
                    // Reset the movement state flag
                    this.player.spriteRenderer.isMoving = false;

                    // Play idle animation briefly so the system can transition properly
                    if (this.scene.anims.exists('orion_idle')) {
                        this.player.spriteRenderer.sprite.play('orion_idle', true);
                    }
                }
            }
        });

        console.log('✅ Shadow Roll activated');
    }
}
