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

        const classConfig = GameConfig.CLASSES[this.class];

        // Create sprite (using a circle for now)
        this.sprite = this.scene.add.circle(x, y, 12, classConfig.color);
        this.scene.physics.add.existing(this.sprite);

        // Add glow effect
        this.glow = this.scene.add.circle(x, y, 14, classConfig.color, 0.3);

        // Add weapon indicator
        this.weapon = this.scene.add.rectangle(x + 15, y, 20, 4, 0xffffff);
        this.weapon.setOrigin(0, 0.5);

        this.container = this.scene.add.container(0, 0, [this.glow, this.sprite, this.weapon]);
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

        // Update weapon rotation to face movement direction
        if (velocityX !== 0 || velocityY !== 0) {
            const angle = Math.atan2(velocityY, velocityX);
            this.weapon.setRotation(angle);

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
        }

        this.updateElements();
    }

    moveToPosition(position) {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        const targetX = position.x * tileSize + tileSize / 2;
        const targetY = position.y * tileSize + tileSize / 2;

        // Smooth movement
        this.scene.tweens.add({
            targets: this.sprite,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: 'Linear'
        });
    }

    attack(targetX, targetY) {
        // Point weapon at target
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

        // Flash effect
        this.scene.tweens.add({
            targets: this.sprite,
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
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });

        this.updateHealthBar();
    }

    die() {
        this.isAlive = false;

        // Death animation
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.weapon],
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.sprite.setVisible(false);
                this.glow.setVisible(false);
                this.weapon.setVisible(false);
            }
        });

        this.nameTag.setAlpha(0.5);
    }

    updateElements() {
        // Update glow position
        this.glow.setPosition(this.sprite.x, this.sprite.y);

        // Update weapon position
        const angle = this.weapon.rotation;
        const distance = 15;
        this.weapon.setPosition(
            this.sprite.x + Math.cos(angle) * distance,
            this.sprite.y + Math.sin(angle) * distance
        );

        // Update name tag and health bar
        this.nameTag.setPosition(this.sprite.x, this.sprite.y - 25);
        this.healthBarBg.setPosition(this.sprite.x, this.sprite.y - 15);
        this.healthBar.setPosition(this.sprite.x - 20 + (40 * (this.health / this.maxHealth) / 2), this.sprite.y - 15);

        this.updateHealthBar();
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.width = 40 * healthPercent;

        const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        this.healthBar.setFillStyle(color);
    }
}
