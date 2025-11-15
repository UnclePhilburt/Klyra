// Player Entity - Core player logic and state management
class Player {
    constructor(scene, data, isLocalPlayer = false) {
        // Defensive checks for required dependencies
        if (typeof PlayerSprite === 'undefined') {
            console.error('❌ PlayerSprite is not defined! Make sure PlayerSprite.js is loaded before Player.js');
            throw new Error('PlayerSprite class not found. Check script loading order in index.html');
        }
        if (typeof PlayerUI === 'undefined') {
            console.error('❌ PlayerUI is not defined! Make sure PlayerUI.js is loaded before Player.js');
            throw new Error('PlayerUI class not found. Check script loading order in index.html');
        }

        this.scene = scene;
        this.data = data;

        // Player state
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.level = data.level;
        this.experience = data.experience || 0;
        this.class = data.class;
        this.stats = data.stats;
        this.isAlive = data.isAlive !== undefined ? data.isAlive : true; // Default to true
        this.currentDirection = 'down';

        // Debug: Log if isAlive is false on spawn
        if (!this.isAlive && isLocalPlayer) {
            console.warn(`⚠️ Player spawned with isAlive: false! Data:`, data);
        }

        // Network throttling
        this.lastUpdate = 0;

        // Create modular components
        this.spriteRenderer = new PlayerSprite(scene, data.position, this.class);

        // Expose sprite for backward compatibility (MUST be set before creating UI!)
        this.sprite = this.spriteRenderer.getPhysicsBody();
        this.usingSprite = this.spriteRenderer.isUsingSprite();

        // Now create UI (needs this.sprite to exist first)
        this.ui = new PlayerUI(scene, this, {
            useSprite: this.spriteRenderer.isUsingSprite(),
            visualOffsetX: 32,
            visualOffsetY: 55,
            yOffset: 105,
            isLocalPlayer: isLocalPlayer
        });
    }

    // ==================== MOVEMENT ====================

    move(velocityX, velocityY) {
        const speed = GameConfig.PLAYER.SPEED;
        const body = this.sprite.body;

        body.setVelocity(velocityX * speed, velocityY * speed);

        // Update visual sprite positions
        if (this.usingSprite) {
            this.spriteRenderer.updateSpritePositions();
        }

        // Update animation state based on movement
        this.spriteRenderer.updateMovementState(velocityX, velocityY);

        // Update weapon rotation for fallback
        if (!this.usingSprite && (velocityX !== 0 || velocityY !== 0)) {
            const angle = Math.atan2(velocityY, velocityX);
            this.spriteRenderer.setWeaponRotation(angle);
        }

        // Send position to server (throttled)
        if (velocityX !== 0 || velocityY !== 0) {
            this.sendPositionUpdate();
        }
    }

    moveToPosition(position) {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        const targetX = position.x * tileSize + tileSize / 2;
        const targetY = position.y * tileSize + tileSize / 2;

        // Store target for interpolation
        this.targetPosition = { x: targetX, y: targetY };
    }

    // Smooth interpolation instead of instant teleport
    updateInterpolation() {
        if (!this.targetPosition) return;

        const lerpSpeed = 0.3; // Smooth interpolation
        const dx = this.targetPosition.x - this.sprite.x;
        const dy = this.targetPosition.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If very close, snap to target
        if (distance < 1) {
            this.sprite.x = this.targetPosition.x;
            this.sprite.y = this.targetPosition.y;
            this.sprite.body.setVelocity(0, 0);
            this.targetPosition = null;
        } else {
            // Smooth interpolation
            this.sprite.x += dx * lerpSpeed;
            this.sprite.y += dy * lerpSpeed;
        }

        if (this.usingSprite) {
            this.spriteRenderer.updateSpritePositions();
        }
    }

    sendPositionUpdate() {
        const now = Date.now();
        if (!this.lastUpdate || now - this.lastUpdate > 50) {
            this.lastUpdate = now;
            const tileSize = GameConfig.GAME.TILE_SIZE;
            const gridPos = {
                x: Math.floor(this.sprite.x / tileSize),
                y: Math.floor(this.sprite.y / tileSize)
            };

            // DEBUG: Log position updates occasionally
            if (Math.random() < 0.05) {
                console.log(`📍 CLIENT: Sending position (${gridPos.x}, ${gridPos.y}), isAlive=${this.isAlive}`);
            }

            networkManager.movePlayer(gridPos);
        }
    }

    // ==================== COMBAT ====================

    attack(targetX, targetY) {
        this.spriteRenderer.animateAttack(targetX, targetY);

        // Safety check
        if (!this.spriteRenderer || !this.spriteRenderer.sprite) return;

        // Find and damage nearby enemies
        const attackRange = 50; // Attack range in pixels
        const playerPos = { x: this.spriteRenderer.sprite.x, y: this.spriteRenderer.sprite.y };

        // Check all enemies (sword demons and minotaurs)
        const allEnemies = [
            ...Object.values(this.scene.enemies || {}),
            ...Object.values(this.scene.swordDemons || {}),
            ...Object.values(this.scene.minotaurs || {})
        ];

        allEnemies.forEach(enemy => {
            if (!enemy.isAlive || !enemy.sprite) return;

            const dx = enemy.sprite.x - targetX;
            const dy = enemy.sprite.y - targetY;
            const distSquared = dx * dx + dy * dy;

            // If enemy is within attack range of click position
            if (distSquared < attackRange * attackRange) {
                // Calculate damage based on player stats
                const baseDamage = this.stats?.damage || 10;
                networkManager.hitEnemy(enemy.data.id, baseDamage, this.data.id, playerPos);
            }
        });

        // Note: Auto-attacks now happen automatically in update() loop
        // No need to trigger manually here
    }

    executeAutoAttack() {
        // Safety check: ensure player sprite exists before attempting auto-attack
        if (!this.spriteRenderer || !this.spriteRenderer.sprite) {
            return; // Silently skip until player is ready
        }

        const config = this.autoAttackConfig;
        if (!config) {
            return; // No config, nothing to do
        }

        // Check cooldown
        const now = Date.now();
        if (this.lastAutoAttackTime && (now - this.lastAutoAttackTime) < (config.cooldown || 1000)) {
            return; // Still on cooldown
        }

        this.lastAutoAttackTime = now;

        // Handle different auto-attack types
        if (config.target === 'minion_or_ally') {
            // Command Bolt: Buff nearest minion OR ally
            this.commandBolt();
        } else if (config.target === 'enemy') {
            // Attack nearest enemy
            this.autoAttackEnemy(config);
        }
    }

    autoAttackEnemy(config) {
        // Find all enemies in front of Kelise within range
        const range = (config.range || 3) * GameConfig.GAME.TILE_SIZE;
        const playerPos = { x: this.spriteRenderer.sprite.x, y: this.spriteRenderer.sprite.y };

        // Determine facing direction based on sprite flip
        const facingLeft = this.spriteRenderer.sprite && this.spriteRenderer.sprite.flipX;

        // Get all enemies
        const allEnemies = [
            ...Object.values(this.scene.enemies || {}),
            ...Object.values(this.scene.swordDemons || {}),
            ...Object.values(this.scene.minotaurs || {})
        ];

        const enemiesInFront = [];

        allEnemies.forEach(enemy => {
            if (!enemy.isAlive || !enemy.sprite) return;

            const dx = enemy.sprite.x - playerPos.x;
            const dy = enemy.sprite.y - playerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if enemy is within range
            if (distance > range) return;

            // Check if enemy is in front based on facing direction
            // Front cone: 120 degrees in the facing direction
            if (facingLeft && dx >= 0) return; // Facing left but enemy is on right
            if (!facingLeft && dx <= 0) return; // Facing right but enemy is on left

            enemiesInFront.push(enemy);
        });

        // Attack all enemies in front
        if (enemiesInFront.length > 0) {
            const damage = config.damage || 10;

            // Play attack animation once
            this.spriteRenderer.playAttackAnimation();

            enemiesInFront.forEach(enemy => {
                // Stun enemy for 1000ms (1 second)
                const stunDuration = 1000;

                // Deal damage with stun effect
                networkManager.hitEnemy(enemy.data.id, damage, this.data.id, playerPos, {
                    stun: stunDuration,
                    knockback: {
                        distance: 50,
                        sourceX: playerPos.x,
                        sourceY: playerPos.y
                    }
                });

                // Apply client-side stun immediately for responsiveness
                enemy.isStunned = true;
                enemy.stunnedUntil = Date.now() + stunDuration;

                // Store velocity before stunning
                if (enemy.sprite.body) {
                    enemy.preStunVelocity = {
                        x: enemy.sprite.body.velocity.x,
                        y: enemy.sprite.body.velocity.y
                    };
                    enemy.sprite.body.setVelocity(0, 0);
                }

                // Apply client-side knockback immediately for instant feedback
                // Server will sync the authoritative position
                const knockbackDistance = 50; // pixels
                const dx = enemy.sprite.x - playerPos.x;
                const dy = enemy.sprite.y - playerPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0 && enemy.sprite) {
                    const knockbackX = (dx / distance) * knockbackDistance;
                    const knockbackY = (dy / distance) * knockbackDistance;

                    // Smooth knockback tween
                    this.scene.tweens.add({
                        targets: enemy.sprite,
                        x: enemy.sprite.x + knockbackX,
                        y: enemy.sprite.y + knockbackY,
                        duration: 150,
                        ease: 'Power2',
                        onComplete: () => {
                            // Update target positions after tween
                            if (enemy.setTargetPosition) {
                                enemy.setTargetPosition(enemy.sprite.x, enemy.sprite.y);
                            } else if (enemy.targetX !== undefined) {
                                enemy.targetX = enemy.sprite.x;
                                enemy.targetY = enemy.sprite.y;
                            }
                        }
                    });
                }

                // Visual stun indicator - stars/sparkles
                const stunEffect = this.scene.add.text(
                    enemy.sprite.x,
                    enemy.sprite.y - 40,
                    '★',
                    {
                        fontSize: '24px',
                        color: '#FFFF00'
                    }
                );
                stunEffect.setOrigin(0.5);
                stunEffect.setDepth(10001);

                this.scene.tweens.add({
                    targets: stunEffect,
                    y: enemy.sprite.y - 50,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => stunEffect.destroy()
                });

                // Remove stun after duration
                this.scene.time.delayedCall(stunDuration, () => {
                    enemy.isStunned = false;
                    enemy.stunnedUntil = 0;
                });

                // Visual effect - slash at enemy
                const slashEffect = this.scene.add.circle(
                    enemy.sprite.x,
                    enemy.sprite.y,
                    20,
                    0xFF6B9D,
                    0.6
                );
                slashEffect.setDepth(10000);

                this.scene.tweens.add({
                    targets: slashEffect,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => slashEffect.destroy()
                });
            });

            console.log(`⚔️ ${config.name}: ${damage} damage to ${enemiesInFront.length} enemies + knockback`);
        }
    }

    commandBolt() {
        // Safety check: ensure player sprite exists
        if (!this.spriteRenderer || !this.spriteRenderer.sprite) {
            return; // Silently skip
        }

        // Find nearest minion owned by this player
        let nearestMinion = null;
        let nearestDistance = Infinity;
        const range = this.autoAttackConfig.range * GameConfig.GAME.TILE_SIZE || 10 * GameConfig.GAME.TILE_SIZE;

        Object.values(this.scene.minions || {}).forEach(minion => {
            // Safety check: ensure minion and sprite exist
            if (!minion || !minion.sprite || !minion.isAlive) return;
            if (minion.ownerId !== this.data.id) return;

            const dx = minion.sprite.x - this.spriteRenderer.sprite.x;
            const dy = minion.sprite.y - this.spriteRenderer.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDistance && distance <= range) {
                nearestDistance = distance;
                nearestMinion = minion;
            }
        });

        // Buff the nearest minion
        if (nearestMinion && nearestMinion.sprite) {
            const buffEffect = this.autoAttackConfig.effects.onMinion;
            const duration = buffEffect.duration || 3000;

            // Apply damage buff to minion
            if (!nearestMinion.damageBuffs) nearestMinion.damageBuffs = [];

            const buffId = `command_bolt_${Date.now()}`;
            const buff = {
                id: buffId,
                bonus: buffEffect.damageBonus,
                endTime: Date.now() + duration
            };

            nearestMinion.damageBuffs.push(buff);

            // Visual effect - purple/pink glow
            const glowCircle = this.scene.add.circle(
                nearestMinion.sprite.x,
                nearestMinion.sprite.y,
                30,
                0x8b5cf6,
                0.3
            );
            glowCircle.setDepth(1);

            this.scene.tweens.add({
                targets: glowCircle,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 500,
                onComplete: () => glowCircle.destroy()
            });

            // Remove buff after duration
            this.scene.time.delayedCall(duration, () => {
                const index = nearestMinion.damageBuffs.findIndex(b => b.id === buffId);
                if (index !== -1) {
                    nearestMinion.damageBuffs.splice(index, 1);
                }
            });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }

        // Damage flash
        this.spriteRenderer.tint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.spriteRenderer.clearTint();
        });

        this.ui.updateHealthBar();
    }

    die(killedBy = 'unknown') {
        // Only die once - prevent multiple death reports
        if (!this.isAlive) {
            return; // Already dead
        }

        this.isAlive = false;

        // Report death to server
        if (networkManager && networkManager.connected) {
            networkManager.reportDeath(killedBy);
            console.log(`💀 Player died, reporting to server (killed by: ${killedBy})`);
        } else {
            console.error('❌ Cannot report death - network manager not connected');
        }

        // Play death animation
        this.spriteRenderer.playDeathAnimation();

        // Fade out after animation
        this.spriteRenderer.fadeOut(1000);
        this.ui.setAlpha(0.5);
    }

    // ==================== UPDATE LOOP ====================

    updateAnimation(delta) {
        // Stub for animation updates
        // Current implementation uses static sprite frames
        // Future: Implement walk/run animations here
        // Could delegate to: this.spriteRenderer.updateAnimation(delta, velocityX, velocityY)
    }

    updateElements() {
        // Update sprite rendering
        if (this.usingSprite) {
            this.spriteRenderer.updateSpritePositions();
        } else {
            this.spriteRenderer.updateFallbackPositions();
        }

        // Update depth for Y-sorting
        const spriteDepth = this.spriteRenderer.updateDepth();

        // Update UI (handles its own position caching)
        this.ui.update(spriteDepth);

        // AUTO-ATTACK: Execute automatically on cooldown
        if (this.autoAttackConfig) {
            const now = Date.now();
            const cooldown = this.autoAttackConfig.cooldown || 1000;

            // Check if cooldown has passed
            if (!this.lastAutoAttackTime || (now - this.lastAutoAttackTime) >= cooldown) {
                this.executeAutoAttack();
            }
        }
    }

    // ==================== CLEANUP ====================

    destroy() {
        this.spriteRenderer.destroy();
        this.ui.destroy();
    }
}
