// Merchant NPC - Buys items from players
class MerchantNPC {
    constructor(scene, x, y, name = 'Merchant') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80; // pixels

        this.createSprite();
        this.createPrompt();
    }

    createSprite() {
        // Create animated sprite from frames
        this.sprite = this.scene.add.sprite(this.x, this.y, 'merchant_1');
        this.sprite.setDepth(5);
        this.sprite.setScale(1); // 32x32 sprite

        // Create animation if it doesn't exist
        if (!this.scene.anims.exists('merchant_idle')) {
            this.scene.anims.create({
                key: 'merchant_idle',
                frames: [
                    { key: 'merchant_1' },
                    { key: 'merchant_2' },
                    { key: 'merchant_3' },
                    { key: 'merchant_4' }
                ],
                frameRate: 4,
                repeat: -1
            });
        }

        // Play animation
        this.sprite.play('merchant_idle');

        // Name label
        this.nameLabel = this.scene.add.text(
            this.x, this.y - 35,
            this.name,
            {
                font: 'bold 14px monospace',
                fill: '#ffaa00',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        this.nameLabel.setDepth(6);

        // Floating animation
        this.scene.tweens.add({
            targets: [this.sprite, this.nameLabel],
            y: this.y - 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createPrompt() {
        // Interaction prompt (hidden by default)
        this.prompt = this.scene.add.container(this.x, this.y - 60);
        this.prompt.setDepth(1000);
        this.prompt.setScrollFactor(1, 1);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 180, 30, 0x000000, 0.8);
        bg.setStrokeStyle(2, 0xff9900);

        // Text
        const text = this.scene.add.text(0, 0, 'Press F to Sell Items', {
            font: 'bold 12px monospace',
            fill: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.prompt.add([bg, text]);
        this.prompt.setVisible(false);
    }

    checkPlayerDistance(playerX, playerY) {
        const dist = Phaser.Math.Distance.Between(
            playerX, playerY,
            this.x, this.y
        );

        const isInRange = dist < this.interactionRange;
        this.prompt.setVisible(isInRange);

        return isInRange;
    }

    sellItems(inventoryUI) {
        if (!inventoryUI) {
            console.log('⚠️ No inventoryUI provided!');
            return;
        }

        console.log('🛒 Attempting to sell items...');
        console.log('   Inventory slots:', inventoryUI.slots);
        console.log('   Items array:', inventoryUI.items);

        let totalStars = 0;
        let itemsSold = 0;

        // Sell all items in inventory (except stars)
        for (let i = 0; i < inventoryUI.slots; i++) {
            const item = inventoryUI.items[i];
            console.log(`   Slot ${i}:`, item);
            if (item && item.type !== 'star') {
                // Calculate value based on item type
                let value = this.getItemValue(item.type);
                totalStars += value * item.quantity;
                itemsSold += item.quantity;

                console.log(`   ✅ Selling slot ${i}: ${item.type} x${item.quantity} for ${value * item.quantity} stars`);

                // Remove item from inventory
                inventoryUI.items[i] = null;
            }
        }

        console.log(`   Total items sold: ${itemsSold}, Total stars: ${totalStars}`);

        if (itemsSold > 0) {
            // Update display to show cleared inventory
            inventoryUI.updateDisplay();

            // Add stars to HUD currency instead of inventory
            if (this.scene.modernHUD) {
                this.scene.modernHUD.addCurrency(totalStars);
            }

            // Show feedback
            this.showSellFeedback(itemsSold, totalStars);
            console.log(`💰 Sold ${itemsSold} items for ${totalStars} stars!`);
        } else {
            console.log('⚠️ No items to sell!');
            this.showNoItemsFeedback();
        }
    }

    getItemValue(itemType) {
        // Item prices (in stars)
        const prices = {
            'health_potion': 5,
            'mana_potion': 5,
            'speed_potion': 8,
            'strength_potion': 10,
            'defense_potion': 10,
            'star': 1 // Stars keep their value
        };
        return prices[itemType] || 1;
    }

    showSellFeedback(itemCount, starCount) {
        const feedbackText = this.scene.add.text(
            this.x, this.y - 80,
            `Sold ${itemCount} items\n+${starCount} ⭐`,
            {
                font: 'bold 16px monospace',
                fill: '#ffaa00',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        ).setOrigin(0.5);
        feedbackText.setDepth(1001);

        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });
    }

    showNoItemsFeedback() {
        const feedbackText = this.scene.add.text(
            this.x, this.y - 80,
            'No items to sell!',
            {
                font: 'bold 14px monospace',
                fill: '#999999',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        feedbackText.setDepth(1001);

        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 20,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.nameLabel) this.nameLabel.destroy();
        if (this.prompt) this.prompt.destroy();
    }
}
