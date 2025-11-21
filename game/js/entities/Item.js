// Item Entity
class Item {
    constructor(scene, data) {
        this.scene = scene;
        this.data = data;
        this.pickedUp = false;
        this.id = data.id || data.itemId;

        this.createSprite();
    }

    createSprite() {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        // Support both data.position.x and data.x formats
        const posX = this.data.position?.x ?? this.data.x;
        const posY = this.data.position?.y ?? this.data.y;
        const x = posX * tileSize + tileSize / 2;
        const y = posY * tileSize + tileSize / 2;

        console.log(`✨ Creating item sprite: ${this.data.type} at tile (${posX}, ${posY}) -> pixels (${x}, ${y})`);

        // Use color from data if provided, otherwise use rarity colors
        let color = this.data.color;
        if (!color && this.data.rarity) {
            const rarityColors = {
                common: 0xaaaaaa,
                uncommon: 0x00ff00,
                rare: 0x0088ff,
                legendary: 0xff8800,
                special: 0xff00ff
            };
            color = rarityColors[this.data.rarity] || 0xffffff;
        }
        if (!color) color = 0xffffff;

        // Check if this is a special item type (use sprite instead of star)
        const itemTypes = {
            'health_potion': { sheet: 'merchantitems', frame: 14, scale: 2 },
            'regen_potion': { sheet: 'merchantitems', frame: 28, scale: 2 },
            'soul': { sheet: 'souls', frame: 0, scale: 1.5 } // Currency item
        };

        if (itemTypes[this.data.type] !== undefined) {
            // Create sprite from sprite sheet
            const itemConfig = itemTypes[this.data.type];
            this.sprite = this.scene.add.sprite(x, y, itemConfig.sheet, itemConfig.frame);
            this.sprite.setScale(itemConfig.scale);
        } else {
            // Create item sprite (diamond shape for other items)
            this.sprite = this.scene.add.star(x, y, 4, 4, 8, color);
        }

        this.sprite.setInteractive({ cursor: 'pointer' });

        // Click/touch to pickup
        this.sprite.on('pointerdown', () => {
            if (!this.pickedUp) {
                this.requestPickup();
            }
        });

        // Hover effect
        this.sprite.on('pointerover', () => {
            this.sprite.setScale(1.2);
        });
        this.sprite.on('pointerout', () => {
            this.sprite.setScale(1);
        });

        // Glow effects (enhanced like orbs)
        this.glow = this.scene.add.circle(x, y, 16, color, 0.4);
        this.glow.setDepth(99); // Below sprite but above ground

        // Second outer glow for depth
        this.outerGlow = this.scene.add.circle(x, y, 20, color, 0.2);
        this.outerGlow.setDepth(98);

        // Floating animation (same as orbs)
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.outerGlow],
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

        // Pulse glow (enhanced like orbs)
        this.scene.tweens.add({
            targets: this.glow,
            scale: 1.8,
            alpha: 0.6,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Outer glow pulse (like orbs)
        this.scene.tweens.add({
            targets: this.outerGlow,
            scale: 2,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeOut'
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

    // Send pickup request to server
    requestPickup() {
        if (this.pickupRequested) return;
        console.log('📦 Requesting pickup of item:', this.id, this.data.type);

        networkManager.pickupItem(this.id);

        // Mark as requested to prevent duplicate requests
        this.pickupRequested = true;
    }

    checkCollision(playerX, playerY) {
        if (this.pickupRequested || this.pickedUp) return false;

        const dist = Phaser.Math.Distance.Between(
            playerX,
            playerY,
            this.sprite.x,
            this.sprite.y
        );

        return dist < 80; // Same pickup radius as orbs
    }

    // Renamed to collect (called when server confirms pickup)
    collect() {
        if (this.pickedUp) return;
        this.pickup();
    }

    pickup() {
        if (this.pickedUp) return;
        this.pickedUp = true;

        // Play pickup sound based on item type
        if (this.data.type === 'soul') {
            // Play soul collection sound
            if (this.scene.sound) {
                this.scene.sound.play('soulcollect', { volume: 0.3 });
            }
        }

        // Pickup animation - fly to player
        const targetX = this.scene.cameras.main.centerX;
        const targetY = this.scene.cameras.main.centerY;

        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.outerGlow, this.label],
            x: targetX,
            y: targetY,
            scale: 0,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.sprite.destroy();
                this.glow.destroy();
                if (this.outerGlow) this.outerGlow.destroy();
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
        if (this.outerGlow) this.outerGlow.destroy();
        if (this.label) this.label.destroy();
    }
}
