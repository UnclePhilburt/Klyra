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
            console.log(`⚠️ DEBUG MODE: Static frames only (no animation) to test if setFrame() causes stuttering`);

            // Frame configuration (56 frames per row)
            const FRAMES_PER_ROW = 56;

            // Use only first frame for testing
            const testFrame = { topLeft: 57, topRight: 58, bottomLeft: 113, bottomRight: 114 };

            // Each frame is 48x48, we want 32x32 (one game tile per sprite)
            const scale = 32 / 48; // 0.667

            // Create invisible physics rectangle (this is what actually moves)
            this.physicsBody = this.scene.add.rectangle(x, y, tileSize, tileSize, 0x000000, 0);
            this.scene.physics.add.existing(this.physicsBody);

            // This is our main "sprite" reference
            this.sprite = this.physicsBody;
            this.sprite.setDepth(y + 1000);

            // Create 4 visual sprites (not physics-enabled)
            // These will be manually positioned to follow physicsBody
            this.topLeft = this.scene.add.sprite(0, 0, textureKey, testFrame.topLeft);
            this.topRight = this.scene.add.sprite(0, 0, textureKey, testFrame.topRight);
            this.bottomLeft = this.scene.add.sprite(0, 0, textureKey, testFrame.bottomLeft);
            this.bottomRight = this.scene.add.sprite(0, 0, textureKey, testFrame.bottomRight);

            // Set origin and scale
            [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight].forEach(s => {
                s.setOrigin(0, 0);
                s.setScale(scale);
            });

            // Position them initially
            this.updateSpritePositions();

            this.usingSprite = true;

            console.log(`✅ Static 2x2 sprite created at (${x}, ${y})`);
            console.log(`  - Using frames: TL=${testFrame.topLeft}, TR=${testFrame.topRight}, BL=${testFrame.bottomLeft}, BR=${testFrame.bottomRight}`);
            console.log(`  - NO ANIMATION - if this stutters, problem is NOT setFrame()`);

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
        if (!this.usingSprite || !this.topLeft) return;

        const x = this.sprite.x;
        const y = this.sprite.y;
        const spriteSize = 32;

        // Calculate positions - simple and direct
        const left = x - spriteSize;
        const right = x;
        const top = y - spriteSize * 2;
        const bottom = y - spriteSize;

        // Set positions (no rounding, no math tricks, just direct assignment)
        this.topLeft.setPosition(left, top);
        this.topRight.setPosition(right, top);
        this.bottomLeft.setPosition(left, bottom);
        this.bottomRight.setPosition(right, bottom);

        // Set depth
        const depth = y + 1000;
        this.topLeft.setDepth(depth);
        this.topRight.setDepth(depth);
        this.bottomLeft.setDepth(depth);
        this.bottomRight.setDepth(depth);
    }

    updateAnimation(delta) {
        // DISABLED FOR TESTING
        // If static sprite doesn't stutter, then setFrame() is the problem
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
        } else {
            this.sprite.body.setVelocity(0, 0);
            this.sprite.x = targetX;
            this.sprite.y = targetY;
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
