// Merchant NPC - Sells consumable items (keyboard-only)
class MerchantNPC {
    constructor(scene, x, y, name = 'Item Merchant') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80;
        this.isShopOpen = false;

        // Controller selection
        this.selectedItemIndex = 0;
        this.itemHighlights = []; // Store highlight rectangles

        // Keyboard keys
        this.keys = [];

        // Available items for sale
        this.items = [
            {
                id: 'health_potion',
                name: "Health Potion",
                description: 'Instantly restore to full health',
                cost: 5,
                keyBind: '1',
                spriteFrame: 14
            },
            {
                id: 'regen_potion',
                name: "Regen Potion",
                description: 'Heal 3 HP/sec for 10 seconds',
                cost: 3,
                keyBind: '2',
                spriteFrame: 28
            }
        ];

        this.createSprite();
        this.createPrompt();
        this.createShopUI();
        this.setupKeyboardControls();
    }

    createSprite() {
        // Create animated sprite from frames
        this.sprite = this.scene.add.sprite(this.x, this.y, 'merchant_1');
        this.sprite.setDepth(this.y); // Y-based depth so NPCs render under roofs
        this.sprite.setScale(1.5);

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
            this.x, this.y - 40,
            this.name,
            {
                font: 'bold 14px monospace',
                fill: '#66ff66',
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
        this.prompt = this.scene.add.container(this.x, this.y - 70);
        this.prompt.setDepth(1000);
        this.prompt.setScrollFactor(1, 1);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 200, 30, 0x000000, 0.8);
        bg.setStrokeStyle(2, 0x66ff66);

        // Text (store reference for updating)
        this.promptText = this.scene.add.text(0, 0, 'Press F to Buy Items', {
            font: 'bold 12px monospace',
            fill: '#66ff66',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.prompt.add([bg, this.promptText]);
        this.prompt.setVisible(false);
    }

    createShopUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Shop container
        this.shopContainer = this.scene.add.container(width / 2, height / 2);
        this.shopContainer.setScrollFactor(0);
        this.shopContainer.setDepth(100000);
        this.shopContainer.setVisible(false);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 650, 500, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(3, 0x66ff66);

        // Title
        const title = this.scene.add.text(0, -230, 'ITEM MERCHANT', {
            font: 'bold 24px monospace',
            fill: '#66ff66',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Instructions
        const instructions = this.scene.add.text(0, -195, 'Press number key to purchase', {
            font: '12px monospace',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Close hint (store reference for updating)
        this.closeHintText = this.scene.add.text(0, 235, 'Press F or ESC to close', {
            font: '12px monospace',
            fill: '#666666',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.shopContainer.add([bg, title, instructions, this.closeHintText]);

        // Create item cards
        this.createItemCards();
    }

    createItemCards() {
        const startY = -140;
        const cardHeight = 60;
        const cardSpacing = 8;

        // Clear existing highlights
        this.itemHighlights = [];

        this.items.forEach((item, index) => {
            const y = startY + (index * (cardHeight + cardSpacing));

            // Card background
            const cardBg = this.scene.add.rectangle(0, y, 600, cardHeight, 0x2a2a3e, 1);
            cardBg.setStrokeStyle(2, 0x66ff66);

            // Controller selection highlight (hidden by default)
            const highlight = this.scene.add.rectangle(0, y, 610, cardHeight + 4, 0x000000, 0);
            highlight.setStrokeStyle(4, 0xffff00);
            highlight.setVisible(false);
            this.itemHighlights.push(highlight);

            // Item name
            const nameText = this.scene.add.text(-280, y - 15, item.name, {
                font: 'bold 16px monospace',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // Description
            const descText = this.scene.add.text(-280, y + 10, item.description, {
                font: '12px monospace',
                fill: '#cccccc',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5);

            // Cost (with soul sprite icon)
            const soulIcon = this.scene.add.sprite(170, y, 'souls', 0);
            soulIcon.setScale(0.6); // Scale down the 32x32 sprite

            const costText = this.scene.add.text(190, y, `${item.cost}`, {
                font: 'bold 18px monospace',
                fill: '#9d00ff', // Purple color for souls
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // Key bind indicator
            const keyBg = this.scene.add.rectangle(265, y, 40, 40, 0x1a1a2e, 1);
            keyBg.setStrokeStyle(3, 0x66ff66);

            const keyText = this.scene.add.text(265, y, `[${item.keyBind}]`, {
                font: 'bold 20px monospace',
                fill: '#66ff66',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.shopContainer.add([highlight, cardBg, nameText, descText, soulIcon, costText, keyBg, keyText]);
        });
    }

    setupKeyboardControls() {
        // Check if keyboard is available
        if (!this.scene.input || !this.scene.input.keyboard) {
            console.warn('⚠️ Keyboard input not available for MerchantNPC');
            return;
        }

        // Number keys 1-2 for purchasing
        for (let i = 0; i < 2; i++) {
            const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes['ONE'] + i);
            key.on('down', () => {
                if (this.isShopOpen) {
                    this.tryPurchaseItem((i + 1).toString());
                }
            });
            this.keys.push(key);
        }
    }

    checkPlayerDistance(playerX, playerY) {
        const dist = Phaser.Math.Distance.Between(
            playerX, playerY,
            this.x, this.y
        );

        const isInRange = dist < this.interactionRange;
        this.prompt.setVisible(isInRange && !this.isShopOpen);

        return isInRange;
    }

    openShop() {
        this.isShopOpen = true;
        this.shopContainer.setVisible(true);
        this.prompt.setVisible(false);

        // Reset controller selection to first item
        this.selectedItemIndex = 0;
        this.updateHighlight();

        console.log('🛒 Item merchant opened');
    }

    closeShop() {
        this.isShopOpen = false;
        this.shopContainer.setVisible(false);

        // Hide all highlights
        this.itemHighlights.forEach(h => h.setVisible(false));

        console.log('🛒 Item merchant closed');
    }

    toggleShop() {
        if (this.isShopOpen) {
            this.closeShop();
        } else {
            this.openShop();
        }
    }

    tryPurchaseItem(keyPressed) {
        if (!this.isShopOpen) return;

        const item = this.items.find(i => i.keyBind === keyPressed);
        if (!item) return;

        // Check if player has enough currency
        const currentCurrency = this.scene.modernHUD ? this.scene.modernHUD.getCurrency() : 0;
        if (currentCurrency < item.cost) {
            console.log('⚠️ Not enough souls!');
            this.showFeedback('Not Enough Souls!', '#ff6666');
            return;
        }

        // Check if inventory is full
        if (this.scene.inventoryUI && this.scene.inventoryUI.isFull()) {
            console.log('⚠️ Inventory is full!');
            this.showFeedback('Inventory Full!', '#ff6666');
            return;
        }

        // Purchase successful!
        if (this.scene.modernHUD) {
            this.scene.modernHUD.addCurrency(-item.cost);
        }

        // Try to add directly to hotbar first, otherwise add to inventory
        if (this.scene.inventoryUI) {
            const added = this.scene.inventoryUI.addItemToHotbar(item.id);
            if (!added) {
                // Hotbar full, add to inventory instead
                this.scene.inventoryUI.addItem(item.id);
            }
        }

        console.log(`✅ Purchased item: ${item.name}`);
        this.showFeedback('Item Purchased!', '#00ff00');
    }

    showFeedback(text, color) {
        const feedbackText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            text,
            {
                font: 'bold 20px monospace',
                fill: color,
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        feedbackText.setScrollFactor(0);
        feedbackText.setDepth(100001);

        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });
    }

    // Controller navigation methods
    moveSelectionUp() {
        if (!this.isShopOpen) return;
        this.selectedItemIndex = (this.selectedItemIndex - 1 + this.items.length) % this.items.length;
        this.updateHighlight();
        console.log(`🎮 Merchant: Selected item ${this.selectedItemIndex + 1}`);
    }

    moveSelectionDown() {
        if (!this.isShopOpen) return;
        this.selectedItemIndex = (this.selectedItemIndex + 1) % this.items.length;
        this.updateHighlight();
        console.log(`🎮 Merchant: Selected item ${this.selectedItemIndex + 1}`);
    }

    updateHighlight() {
        // Hide all highlights
        this.itemHighlights.forEach((h, i) => {
            h.setVisible(i === this.selectedItemIndex);
        });
    }

    purchaseSelectedItem() {
        if (!this.isShopOpen) return;
        const item = this.items[this.selectedItemIndex];
        if (!item) return;

        // Check if player has enough currency
        const currentCurrency = this.scene.modernHUD ? this.scene.modernHUD.getCurrency() : 0;
        if (currentCurrency < item.cost) {
            console.log('⚠️ Not enough souls!');
            this.showFeedback('Not Enough Souls!', '#ff6666');
            return;
        }

        // Check if inventory is full
        if (this.scene.inventoryUI && this.scene.inventoryUI.isFull()) {
            console.log('⚠️ Inventory is full!');
            this.showFeedback('Inventory Full!', '#ff6666');
            return;
        }

        // Purchase successful!
        if (this.scene.modernHUD) {
            this.scene.modernHUD.addCurrency(-item.cost);
        }

        // Try to add directly to hotbar first, otherwise add to inventory
        if (this.scene.inventoryUI) {
            const added = this.scene.inventoryUI.addItemToHotbar(item.id);
            if (!added) {
                // Hotbar full, add to inventory instead
                this.scene.inventoryUI.addItem(item.id);
            }
        }

        console.log(`✅ Purchased item: ${item.name}`);
        this.showFeedback('Item Purchased!', '#00ff00');
    }

    setInputMode(mode) {
        // Update prompt texts based on input mode
        const interactButton = mode === 'controller' ? 'A' : 'F';
        const closeButton = mode === 'controller' ? 'Start' : 'ESC';

        if (this.promptText) {
            this.promptText.setText(`Press ${interactButton} to Buy Items`);
        }
        if (this.closeHintText) {
            this.closeHintText.setText(`Press ${interactButton} or ${closeButton} to close`);
        }
    }

    destroy() {
        // Clean up keyboard keys
        this.keys.forEach(key => {
            if (key && typeof key.removeAllListeners === 'function') {
                key.removeAllListeners();
            }
        });
        this.keys = [];

        if (this.sprite) this.sprite.destroy();
        if (this.nameLabel) this.nameLabel.destroy();
        if (this.prompt) this.prompt.destroy();
        if (this.shopContainer) this.shopContainer.destroy();
    }
}
