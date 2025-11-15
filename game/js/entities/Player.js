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
            networkManager.movePlayer({
                x: Math.floor(this.sprite.x / tileSize),
                y: Math.floor(this.sprite.y / tileSize)
            });
        }
    }

    // ==================== COMBAT ====================

    attack(targetX, targetY) {
        console.log(`🎯 ATTACK CALLED - autoAttackConfig:`, this.autoAttackConfig ? this.autoAttackConfig.name : 'NONE');

        this.spriteRenderer.animateAttack(targetX, targetY);

        // Safety check
        if (!this.spriteRenderer || !this.spriteRenderer.sprite) return;

        // Find and damage nearby enemies
        const attackRange = 50; // Attack range in pixels
        const playerPos = { x: this.spriteRenderer.sprite.x, y: this.spriteRenderer.sprite.y };

        // Check all enemies and wolves
        const allEnemies = [
            ...Object.values(this.scene.enemies),
            ...Object.values(this.scene.wolves)
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

        // Execute auto-attack based on skill configuration
        if (this.autoAttackConfig) {
            console.log(`🎯 Auto-attack triggered: ${this.autoAttackConfig.name}`);
            this.executeAutoAttack();
        } else {
            console.log(`⚠️ No autoAttackConfig set for player`);
        }
    }

    executeAutoAttack() {
        const config = this.autoAttackConfig;
        if (!config) {
            console.log(`❌ executeAutoAttack called but config is missing`);
            return;
        }

        // Check cooldown
        const now = Date.now();
        if (this.lastAutoAttackTime && (now - this.lastAutoAttackTime) < (config.cooldown || 1000)) {
            console.log(`⏱️ Auto-attack on cooldown`);
            return; // Still on cooldown
        }

        this.lastAutoAttackTime = now;

        // Handle different auto-attack types
        if (config.target === 'minion_or_ally') {
            // Command Bolt: Buff nearest minion OR ally
            console.log(`🔮 Executing Command Bolt`);
            this.commandBolt();
        } else if (config.target === 'enemy') {
            // Already handled by normal attack damage above
            console.log(`⚔️ ${config.name}: ${config.damage} damage`);
        } else {
            console.log(`❓ Unknown auto-attack target: ${config.target}`);
        }
    }

    commandBolt() {
        console.log(`🔍 Looking for minions to buff...`);

        // Find nearest minion owned by this player
        let nearestMinion = null;
        let nearestDistance = Infinity;
        const range = this.autoAttackConfig.range * GameConfig.GAME.TILE_SIZE || 10 * GameConfig.GAME.TILE_SIZE;

        console.log(`  Range: ${range} pixels, Total minions in scene: ${Object.keys(this.scene.minions).length}`);

        Object.values(this.scene.minions).forEach(minion => {
            if (minion.ownerId === this.data.id && minion.isAlive) {
                const dx = minion.sprite.x - this.spriteRenderer.sprite.x;
                const dy = minion.sprite.y - this.spriteRenderer.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < nearestDistance && distance <= range) {
                    nearestDistance = distance;
                    nearestMinion = minion;
                }
            }
        });

        console.log(`  Found minions owned by me: ${Object.values(this.scene.minions).filter(m => m.ownerId === this.data.id).length}`);
        console.log(`  Nearest minion: ${nearestMinion ? nearestMinion.minionId.slice(0, 8) : 'NONE'}, distance: ${nearestDistance}`);

        // Buff the nearest minion
        if (nearestMinion) {
            console.log(`✅ Buffing minion!`);
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

            console.log(`✨ Command Bolt: Buffed minion ${nearestMinion.minionId.slice(0, 8)} +${(buffEffect.damageBonus * 100).toFixed(0)}% damage for ${duration / 1000}s`);
        } else {
            console.log(`❌ No minions found in range to buff`);
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

    die() {
        this.isAlive = false;

        // Death animation
        this.spriteRenderer.fadeOut(500);
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
    }

    // ==================== CLEANUP ====================

    destroy() {
        this.spriteRenderer.destroy();
        this.ui.destroy();
    }
}
