// Sword Demon Enemy Entity
class SwordDemon {
    constructor(scene, data) {
        this.scene = scene;
        this.data = data;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.isAlive = data.isAlive !== false;
        this.damage = data.damage || 8;

        if (!this.isAlive) {
            console.warn(`⚠️ SwordDemon ${data.id} created with isAlive: false`);
        }

        this.createSprite();
    }

    createSprite() {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        const x = this.data.position.x * tileSize + tileSize / 2;
        const y = this.data.position.y * tileSize + tileSize / 2;

        // Get variant data from server
        const glowColor = this.data.glowColor || 0xff0000;
        const variant = this.data.variant || 'normal';

        // All sword demons are same size: 124px tall (3.875 tiles)
        // 64px sprite → 124px = scale 1.9375
        const scale = 1.9375;

        // Create sword demon sprite
        this.sprite = this.scene.add.sprite(x, y, 'sworddemon', 0);
        this.sprite.setOrigin(0.5);
        this.sprite.setScale(scale);
        this.sprite.setDepth(2);

        // Add physics
        this.scene.physics.add.existing(this.sprite);

        if (!this.sprite.body) {
            console.error(`❌ SwordDemon ${this.data.id}: Physics body failed to create!`);
            return;
        }

        // Set hitbox (fixed at 3 tiles = 96px)
        const hitboxSize = 96;
        this.sprite.body.setSize(hitboxSize, hitboxSize);
        this.sprite.body.setCollideWorldBounds(false);

        // Store reference for collision detection (use 'enemyEntity' for compatibility)
        this.sprite.enemyEntity = this;
        this.sprite.wolfEntity = this; // Legacy compatibility

        // Prevent camera culling
        this.sprite.setScrollFactor(1, 1);

        // Play idle animation (check if it exists first)
        if (this.scene.anims.exists('sworddemon_idle')) {
            this.sprite.play('sworddemon_idle');
        } else {
            console.warn('⚠️ Animation sworddemon_idle does not exist yet');
        }

        // Track movement
        this.lastX = x;

        // Store variant
        this.variant = variant;
        this.scale = scale;

        // Add boss crown for boss variants
        if (variant === 'boss') {
            // Fixed crown position (124px tall, crown above)
            this.crownText = this.scene.add.text(x, y - 70, '👑', {
                font: '20px Arial',
                fill: '#FFD700'
            });
            this.crownText.setOrigin(0.5);
            this.crownText.setDepth(3);
            this.crownText.setScrollFactor(1, 1);
        }
    }

    attack() {
        console.log(`⚔️ SwordDemon attack() called`);
        // Play attack animation
        if (this.sprite && this.sprite.anims && this.isAlive) {
            console.log(`   Checking animation exists...`);
            if (this.scene.anims.exists('sworddemon_attack')) {
                console.log(`   ✅ Playing sworddemon_attack`);
                this.sprite.play('sworddemon_attack');
            } else {
                console.warn(`   ❌ sworddemon_attack animation does NOT exist`);
            }
            // Return to previous animation after attack (8 frames at 12fps = ~667ms)
            this.scene.time.delayedCall(667, () => {
                if (this.sprite && this.sprite.active && this.isAlive) {
                    const wasMoving = this.currentState === 'walking';
                    const animKey = wasMoving ? 'sworddemon_walk' : 'sworddemon_idle';
                    if (this.scene.anims.exists(animKey)) {
                        this.sprite.play(animKey);
                    }
                }
            });
        } else {
            console.warn(`   ❌ Cannot attack - sprite:${!!this.sprite}, anims:${!!(this.sprite?.anims)}, alive:${this.isAlive}`);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
        }

        // Play damage animation
        if (this.sprite && this.sprite.anims && this.health > 0) {
            if (this.scene.anims.exists('sworddemon_damage')) {
                this.sprite.play('sworddemon_damage');
            }
            // Return to previous animation after damage (2 frames at 12fps = ~167ms)
            this.scene.time.delayedCall(167, () => {
                if (this.sprite && this.sprite.active && this.health > 0) {
                    const wasMoving = this.currentState === 'walking';
                    const animKey = wasMoving ? 'sworddemon_walk' : 'sworddemon_idle';
                    if (this.scene.anims.exists(animKey)) {
                        this.sprite.play(animKey);
                    }
                }
            });
        }

        // Damage flash
        this.sprite.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite) this.sprite.clearTint();
        });
    }

    die() {
        this.isAlive = false;

        // Play death animation
        if (this.sprite && this.sprite.anims && this.scene.anims.exists('sworddemon_death')) {
            this.sprite.play('sworddemon_death');
        }

        // Death particles (scaled for 124px size)
        const particleColor = this.data.glowColor || 0xff0000;
        const particleCount = this.variant === 'boss' ? 16 : 10;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = this.variant === 'boss' ? 100 : 75;
            const particle = this.scene.add.circle(
                this.sprite.x,
                this.sprite.y,
                this.variant === 'boss' ? 5 : 3,
                particleColor
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.sprite.x + Math.cos(angle) * distance,
                y: this.sprite.y + Math.sin(angle) * distance,
                alpha: 0,
                duration: this.variant === 'boss' ? 800 : 500,
                onComplete: () => particle.destroy()
            });
        }

        // Fade out after death animation (9 frames at 10fps = 900ms)
        const deathAnimDuration = 900;
        const targets = [this.sprite];
        if (this.crownText) targets.push(this.crownText);

        this.scene.tweens.add({
            targets: targets,
            alpha: 0,
            duration: 300,
            delay: deathAnimDuration,
            onComplete: () => {
                if (this.sprite) this.sprite.destroy();
                if (this.crownText) this.crownText.destroy();
            }
        });
    }

    setTargetPosition(x, y) {
        if (!this.sprite) return;
        this.targetX = x;
        this.targetY = y;
    }

    update() {
        if (!this.sprite || !this.sprite.active) return;

        // Check if stunned - don't move if stunned
        if (this.isStunned && Date.now() < this.stunnedUntil) {
            // Stop physics velocity
            if (this.sprite.body) {
                this.sprite.body.setVelocity(0, 0);
            }
            return; // Skip movement while stunned
        }

        // Clear stun flag if expired
        if (this.isStunned && Date.now() >= this.stunnedUntil) {
            this.isStunned = false;
            this.stunnedUntil = 0;
        }

        // Stop physics velocity
        if (this.sprite.body) {
            this.sprite.body.setVelocity(0, 0);
        }

        // Smooth movement towards target
        if (this.targetX !== undefined && this.targetY !== undefined) {
            const dx = this.targetX - this.sprite.x;
            const dy = this.targetY - this.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Faster lerp for smoother movement
            const lerpSpeed = 0.15;

            if (dist > 2) {
                this.sprite.x += dx * lerpSpeed;
                this.sprite.y += dy * lerpSpeed;
            } else {
                // Snap to target when close enough
                this.sprite.x = this.targetX;
                this.sprite.y = this.targetY;
            }

            // Animation state - only walk if moving significantly
            const shouldWalk = dist > 3;

            // Only change animation if state actually changed
            if (shouldWalk && this.currentState !== 'walking') {
                this.currentState = 'walking';
                if (this.scene.anims.exists('sworddemon_walk')) {
                    this.sprite.play('sworddemon_walk', true);
                }
            } else if (!shouldWalk && this.currentState !== 'idle') {
                this.currentState = 'idle';
                if (this.scene.anims.exists('sworddemon_idle')) {
                    this.sprite.play('sworddemon_idle', true);
                }
            }

            // Flip sprite based on movement direction
            if (Math.abs(dx) > 0.5) {
                this.sprite.setFlipX(dx < 0);
            }
        }

        // Update crown for boss variants
        if (this.crownText && this.crownText.active) {
            this.crownText.setPosition(this.sprite.x, this.sprite.y - 70);
        }
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        if (this.crownText) {
            this.crownText.destroy();
            this.crownText = null;
        }
        this.isAlive = false;
    }
}
