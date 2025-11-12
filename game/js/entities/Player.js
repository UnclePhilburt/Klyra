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

            // Frame configuration (56 frames per row)
            const FRAMES_PER_ROW = 56;

            // Idle animation frames (8 frames total)
            this.idleFrames = [
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

            // Create 4 sprites for 2x2 character
            // Position them relative to origin (0, 0) within the container
            this.topLeft = this.scene.add.sprite(0, 0, textureKey, this.idleFrames[0].topLeft);
            this.topRight = this.scene.add.sprite(32, 0, textureKey, this.idleFrames[0].topRight);
            this.bottomLeft = this.scene.add.sprite(0, 32, textureKey, this.idleFrames[0].bottomLeft);
            this.bottomRight = this.scene.add.sprite(32, 32, textureKey, this.idleFrames[0].bottomRight);

            // Set origin to top-left for all sprites
            [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight].forEach(s => {
                s.setOrigin(0, 0);
                s.setScale(scale);
            });

            // Create container to hold all 4 sprites as one unit
            this.container = this.scene.add.container(x, y, [
                this.topLeft,
                this.topRight,
                this.bottomLeft,
                this.bottomRight
            ]);

            // Container origin is center-bottom for proper foot position
            // Offset container position so bottom-center is at (x, y)
            this.container.x = x - 32; // Move left by half width (64/2)
            this.container.y = y - 64; // Move up by full height

            // Add physics to the container
            this.scene.physics.add.existing(this.container);
            this.container.body.setSize(32, 32); // Physics body is 1 tile
            this.container.body.setOffset(16, 32); // Center bottom of the visual sprite

            // The container IS our main sprite now
            this.sprite = this.container;
            this.sprite.setDepth(y + 1000);

            // Animation state
            this.currentAnimFrame = 0;
            this.animTimer = 0;
            this.animState = 'idle';

            this.usingSprite = true;

            console.log(`✅ Container-based 2x2 sprite created at (${x}, ${y})`);
            console.log(`  - Container size: 64x64 (2x2 tiles @ 32px each)`);
            console.log(`  - Physics body: 32x32 with offset (16, 32)`);
            console.log(`  - Scale: ${scale}, Frames/row: ${FRAMES_PER_ROW}`);

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

            this.container = this.scene.add.container(0, 0, [this.glow, this.sprite, this.weapon]);
            this.usingSprite = false;
        }

        this.currentDirection = 'down';
    }

    updateSpriteFrames(frameData) {
        if (!this.usingSprite || !this.topLeft) return;

        this.topLeft.setFrame(frameData.topLeft);
        this.topRight.setFrame(frameData.topRight);
        this.bottomLeft.setFrame(frameData.bottomLeft);
        this.bottomRight.setFrame(frameData.bottomRight);
    }

    updateAnimation(delta) {
        if (!this.usingSprite || !this.topLeft) return;

        this.animTimer += delta;
        const frameTime = 125; // 8 fps

        if (this.animTimer >= frameTime) {
            this.animTimer = 0;

            if (this.animState === 'idle') {
                this.currentAnimFrame = (this.currentAnimFrame + 1) % this.idleFrames.length;
                this.updateSpriteFrames(this.idleFrames[this.currentAnimFrame]);
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

        // Update animations and direction
        if (velocityX !== 0 || velocityY !== 0) {
            this.animState = 'moving';

            if (!this.usingSprite && this.weapon) {
                // Update weapon rotation for circle placeholder
                const angle = Math.atan2(velocityY, velocityX);
                this.weapon.setRotation(angle);
            }

            // Send position to server (throttled)
            const now = Date.now();
            if (!this.lastUpdate || now - this.lastUpdate > 50) {
                this.lastUpdate = now;
                const tileSize = GameConfig.GAME.TILE_SIZE;
                networkManager.movePlayer({
                    x: Math.floor(this.sprite.x / tileSize),
                    y: Math.floor(this.sprite.y / tileSize)
                });
            }
        } else {
            this.animState = 'idle';
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

        // Flash effect
        const targets = this.usingSprite && this.topLeft
            ? [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight]
            : [this.sprite];

        this.scene.tweens.add({
            targets: targets,
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }

        // Damage flash
        const targets = this.usingSprite && this.topLeft
            ? [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight]
            : [this.sprite];

        targets.forEach(s => s.setTint(0xff0000));
        this.scene.time.delayedCall(100, () => {
            targets.forEach(s => s.clearTint());
        });

        this.updateHealthBar();
    }

    die() {
        this.isAlive = false;

        // Death animation
        const targets = this.usingSprite && this.topLeft
            ? [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight]
            : [this.sprite, this.glow, this.weapon].filter(x => x);

        this.scene.tweens.add({
            targets: targets,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                targets.forEach(s => s.setVisible(false));
            }
        });

        this.nameTag.setAlpha(0.5);
    }

    updateElements() {
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
        const yOffset = this.usingSprite ? 35 : 25;
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
