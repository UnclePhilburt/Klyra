// Player Entity
class Player {
    constructor(scene, data) {
        this.scene = scene;
        this.data = data;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.level = data.level;
        this.experience = data.experience || 0;
        this.class = data.class;
        this.stats = data.stats;
        this.isAlive = data.isAlive;

        this.createSprite();
        this.createNameTag();
    }

    createSprite() {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        const x = this.data.position.x * tileSize + tileSize / 2;
        const y = this.data.position.y * tileSize + tileSize / 2;

        // Get character config
        const character = CHARACTERS[this.class] || CHARACTERS.ALDRIC;
        const classConfig = { color: character.display.color };
        const textureKey = this.class.toLowerCase();

        // Check if sprite sheet exists for this character
        if (this.scene.textures.exists(textureKey)) {
            console.log(`✅ Creating 2x2 sprite character: ${this.data.username} (${textureKey})`);
            console.log(`🎬 Using sprite-swapping animation (no setFrame calls)`);

            // Frame configuration (56 frames per row)
            const FRAMES_PER_ROW = 56;

            // Idle animation frames (8 frames total)
            const frameData = [
                { topLeft: 57, topRight: 58, bottomLeft: 113, bottomRight: 114 },
                { topLeft: 60, topRight: 61, bottomLeft: 116, bottomRight: 117 },
                { topLeft: 63, topRight: 64, bottomLeft: 119, bottomRight: 120 },
                { topLeft: 67, topRight: 68, bottomLeft: 123, bottomRight: 124 },
                { topLeft: 70, topRight: 71, bottomLeft: 126, bottomRight: 127 },
                { topLeft: 74, topRight: 75, bottomLeft: 130, bottomRight: 131 },
                { topLeft: 77, topRight: 78, bottomLeft: 133, bottomRight: 134 },
                { topLeft: 80, topRight: 81, bottomLeft: 136, bottomRight: 137 }
            ];

            // Each frame is 48x48, we want 32x32 (one game tile per sprite)
            const scale = 32 / 48; // 0.667

            // Create invisible physics rectangle (this is what actually moves)
            this.physicsBody = this.scene.add.rectangle(x, y, tileSize, tileSize, 0x000000, 0);
            this.scene.physics.add.existing(this.physicsBody);

            // This is our main "sprite" reference
            this.sprite = this.physicsBody;
            this.sprite.setDepth(y + 1000);

            // Create 8 sets of 4 sprites (32 sprites total - one set per animation frame)
            // We'll show/hide sets instead of calling setFrame()
            this.spriteSets = [];

            for (let i = 0; i < frameData.length; i++) {
                const frames = frameData[i];

                const set = {
                    topLeft: this.scene.add.sprite(0, 0, textureKey, frames.topLeft),
                    topRight: this.scene.add.sprite(0, 0, textureKey, frames.topRight),
                    bottomLeft: this.scene.add.sprite(0, 0, textureKey, frames.bottomLeft),
                    bottomRight: this.scene.add.sprite(0, 0, textureKey, frames.bottomRight)
                };

                // Set origin and scale for all sprites in this set
                [set.topLeft, set.topRight, set.bottomLeft, set.bottomRight].forEach(s => {
                    s.setOrigin(0, 0);
                    s.setScale(scale);
                    s.setVisible(i === 0); // Only first frame visible initially
                });

                this.spriteSets.push(set);
            }

            // Position all sprites
            this.updateSpritePositions();

            // Animation state
            this.currentAnimFrame = 0;
            this.animTimer = 0;
            this.animState = 'idle';

            this.usingSprite = true;

            console.log(`✅ Created ${frameData.length} animation frames (${frameData.length * 4} sprites total)`);
            console.log(`  - Frame 0 visible, others hidden`);
            console.log(`  - NO setFrame() calls - just show/hide sprite sets`);

        } else {
            // Fallback to circle placeholder
            console.log(`⚠️ No sprite for ${textureKey}, using placeholder for ${this.data.username}`);

            this.sprite = this.scene.add.circle(x, y, 12, classConfig.color);
            this.sprite.setDepth(y + 1000);
            this.scene.physics.add.existing(this.sprite);

            // Add glow effect
            this.glow = this.scene.add.circle(x, y, 14, classConfig.color, 0.3);
            this.glow.setDepth(y + 999);

            // Add weapon indicator
            this.weapon = this.scene.add.rectangle(x + 15, y, 20, 4, 0xffffff);
            this.weapon.setOrigin(0, 0.5);
            this.weapon.setDepth(y + 1000);

            this.usingSprite = false;
        }

        this.currentDirection = 'down';
    }

    updateSpritePositions() {
        if (!this.usingSprite || !this.spriteSets) return;

        const x = this.sprite.x;
        const y = this.sprite.y;
        const spriteSize = 32;

        // Calculate positions
        const left = x - spriteSize;
        const right = x;
        const top = y - spriteSize * 2;
        const bottom = y - spriteSize;
        const depth = y + 1000;

        // Update ALL sprite sets to the same position
        // (they're all at the same spot, just different frames)
        for (let i = 0; i < this.spriteSets.length; i++) {
            const set = this.spriteSets[i];

            set.topLeft.setPosition(left, top);
            set.topRight.setPosition(right, top);
            set.bottomLeft.setPosition(left, bottom);
            set.bottomRight.setPosition(right, bottom);

            set.topLeft.setDepth(depth);
            set.topRight.setDepth(depth);
            set.bottomLeft.setDepth(depth);
            set.bottomRight.setDepth(depth);
        }
    }

    updateAnimation(delta) {
        if (!this.usingSprite || !this.spriteSets) return;

        this.animTimer += delta;
        const frameTime = 125; // 8 fps

        if (this.animTimer >= frameTime) {
            this.animTimer = 0;

            if (this.animState === 'idle') {
                // Hide current frame
                const currentSet = this.spriteSets[this.currentAnimFrame];
                currentSet.topLeft.setVisible(false);
                currentSet.topRight.setVisible(false);
                currentSet.bottomLeft.setVisible(false);
                currentSet.bottomRight.setVisible(false);

                // Move to next frame
                this.currentAnimFrame = (this.currentAnimFrame + 1) % this.spriteSets.length;

                // Show new frame
                const newSet = this.spriteSets[this.currentAnimFrame];
                newSet.topLeft.setVisible(true);
                newSet.topRight.setVisible(true);
                newSet.bottomLeft.setVisible(true);
                newSet.bottomRight.setVisible(true);
            }
        }
    }

    createNameTag() {
        const x = this.sprite.x;
        const y = this.sprite.y - 25;

        this.nameTag = this.scene.add.text(x, y, this.data.username, {
            font: '10px monospace',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Health bar above name
        this.healthBarBg = this.scene.add.rectangle(x, y - 15, 40, 4, 0x000000);
        this.healthBar = this.scene.add.rectangle(x, y - 15, 40, 4, 0x00ff00);
    }

    move(velocityX, velocityY) {
        const speed = GameConfig.PLAYER.SPEED;
        const body = this.sprite.body;

        body.setVelocity(velocityX * speed, velocityY * speed);

        // Update sprite positions to follow physics body
        if (this.usingSprite) {
            this.updateSpritePositions();
        }

        if (!this.usingSprite && this.weapon && (velocityX !== 0 || velocityY !== 0)) {
            // Update weapon rotation for circle placeholder
            const angle = Math.atan2(velocityY, velocityX);
            this.weapon.setRotation(angle);
        }

        // Update animation state
        if (velocityX !== 0 || velocityY !== 0) {
            this.animState = 'moving'; // Could add walking frames later
        } else {
            this.animState = 'idle';
        }

        // Send position to server (throttled)
        if (velocityX !== 0 || velocityY !== 0) {
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
    }

    moveToPosition(position) {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        const targetX = position.x * tileSize + tileSize / 2;
        const targetY = position.y * tileSize + tileSize / 2;

        // Use physics velocity for movement
        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const speed = GameConfig.PLAYER.SPEED;
            this.sprite.body.setVelocity(
                (dx / distance) * speed,
                (dy / distance) * speed
            );
            this.animState = 'moving';
        } else {
            this.sprite.body.setVelocity(0, 0);
            this.sprite.x = targetX;
            this.sprite.y = targetY;
            this.animState = 'idle';
        }

        // Update sprite positions
        if (this.usingSprite) {
            this.updateSpritePositions();
        }
    }

    attack(targetX, targetY) {
        if (!this.usingSprite && this.weapon) {
            // Point weapon at target for circle placeholder
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x,
                this.sprite.y,
                targetX,
                targetY
            );
            this.weapon.setRotation(angle);

            // Attack animation
            this.scene.tweens.add({
                targets: this.weapon,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 100,
                yoyo: true
            });
        }

        // Flash effect on current visible frame
        if (this.usingSprite && this.spriteSets) {
            const currentSet = this.spriteSets[this.currentAnimFrame];
            const targets = [currentSet.topLeft, currentSet.topRight, currentSet.bottomLeft, currentSet.bottomRight];

            this.scene.tweens.add({
                targets: targets,
                alpha: 0.5,
                duration: 50,
                yoyo: true
            });
        } else if (!this.usingSprite) {
            this.scene.tweens.add({
                targets: [this.sprite],
                alpha: 0.5,
                duration: 50,
                yoyo: true
            });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }

        // Damage flash on current visible frame
        if (this.usingSprite && this.spriteSets) {
            const currentSet = this.spriteSets[this.currentAnimFrame];
            const targets = [currentSet.topLeft, currentSet.topRight, currentSet.bottomLeft, currentSet.bottomRight];

            targets.forEach(s => s.setTint(0xff0000));
            this.scene.time.delayedCall(100, () => {
                targets.forEach(s => s.clearTint());
            });
        } else if (!this.usingSprite) {
            this.sprite.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => {
                this.sprite.clearTint();
            });
        }

        this.updateHealthBar();
    }

    die() {
        this.isAlive = false;

        // Death animation - fade out ALL sprite sets
        if (this.usingSprite && this.spriteSets) {
            const allSprites = [];
            this.spriteSets.forEach(set => {
                allSprites.push(set.topLeft, set.topRight, set.bottomLeft, set.bottomRight);
            });

            this.scene.tweens.add({
                targets: allSprites,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    allSprites.forEach(s => s.setVisible(false));
                }
            });
        } else if (!this.usingSprite) {
            const targets = [this.sprite, this.glow, this.weapon].filter(x => x);
            this.scene.tweens.add({
                targets: targets,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    targets.forEach(s => s.setVisible(false));
                }
            });
        }

        this.nameTag.setAlpha(0.5);
    }

    updateElements() {
        // Update sprite positions
        if (this.usingSprite) {
            this.updateSpritePositions();
        }

        // Update depth for Y-sorting
        const spriteDepth = this.sprite.y + 1000;
        this.sprite.setDepth(spriteDepth);

        if (!this.usingSprite && this.glow && this.weapon) {
            // Update glow position for circle placeholder
            this.glow.setPosition(this.sprite.x, this.sprite.y);
            this.glow.setDepth(spriteDepth - 1);

            // Update weapon position
            const angle = this.weapon.rotation;
            const distance = 15;
            this.weapon.setPosition(
                this.sprite.x + Math.cos(angle) * distance,
                this.sprite.y + Math.sin(angle) * distance
            );
            this.weapon.setDepth(spriteDepth);
        }

        // Update name tag and health bar
        const yOffset = this.usingSprite ? 75 : 25;
        this.nameTag.setPosition(this.sprite.x, this.sprite.y - yOffset);
        this.nameTag.setDepth(spriteDepth + 1);

        this.healthBarBg.setPosition(this.sprite.x, this.sprite.y - (yOffset - 10));
        this.healthBarBg.setDepth(spriteDepth + 1);

        const healthPercent = this.health / this.maxHealth;
        this.healthBar.setPosition(
            this.sprite.x - 20 + (40 * healthPercent / 2),
            this.sprite.y - (yOffset - 10)
        );
        this.healthBar.setDepth(spriteDepth + 2);

        this.updateHealthBar();
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.width = 40 * healthPercent;

        const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        this.healthBar.setFillStyle(color);
    }
}
