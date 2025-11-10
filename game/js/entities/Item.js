// Item Entity
class Item {
    constructor(scene, data) {
        this.scene = scene;
        this.data = data;
        this.pickedUp = false;

        this.createSprite();
    }

    createSprite() {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        const x = this.data.position.x * tileSize + tileSize / 2;
        const y = this.data.position.y * tileSize + tileSize / 2;

        // Item colors by rarity
        const rarityColors = {
            common: 0xaaaaaa,
            uncommon: 0x00ff00,
            rare: 0x0088ff,
            legendary: 0xff8800,
            special: 0xff00ff
        };

        const color = rarityColors[this.data.rarity] || 0xffffff;

        // Create item sprite (diamond shape)
        this.sprite = this.scene.add.star(x, y, 4, 4, 8, color);

        // Glow effect
        this.glow = this.scene.add.circle(x, y, 10, color, 0.3);

        // Floating animation
        this.scene.tweens.add({
            targets: [this.sprite, this.glow],
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotation animation
        this.scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });

        // Pulse glow
        this.scene.tweens.add({
            targets: this.glow,
            scale: 1.3,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Label
        this.label = this.scene.add.text(x, y - 20, this.getItemName(), {
            font: '8px monospace',
            fill: Phaser.Display.Color.IntegerToRGB(color).rgba,
            backgroundColor: '#000000',
            padding: { x: 2, y: 1 }
        }).setOrigin(0.5);
    }

    getItemName() {
        return this.data.type.replace('_', ' ').toUpperCase();
    }

    checkCollision(playerX, playerY) {
        if (this.pickedUp) return false;

        const dist = Phaser.Math.Distance.Between(
            playerX,
            playerY,
            this.sprite.x,
            this.sprite.y
        );

        return dist < 30;
    }

    pickup() {
        if (this.pickedUp) return;
        this.pickedUp = true;

        // Pickup animation - fly to player
        const targetX = this.scene.cameras.main.centerX;
        const targetY = this.scene.cameras.main.centerY;

        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.label],
            x: targetX,
            y: targetY,
            scale: 0,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.sprite.destroy();
                this.glow.destroy();
                this.label.destroy();
            }
        });

        // Show pickup text
        this.showPickupText();
    }

    showPickupText() {
        const pickupText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.scrollY + 150,
            `+${this.getItemName()}`,
            {
                font: 'bold 16px monospace',
                fill: Phaser.Display.Color.IntegerToRGB(
                    { common: 0xaaaaaa, uncommon: 0x00ff00, rare: 0x0088ff, legendary: 0xff8800, special: 0xff00ff }[this.data.rarity]
                ).rgba,
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0);

        this.scene.tweens.add({
            targets: pickupText,
            y: this.scene.cameras.main.scrollY + 120,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => pickupText.destroy()
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.glow) this.glow.destroy();
        if (this.label) this.label.destroy();
    }
}
