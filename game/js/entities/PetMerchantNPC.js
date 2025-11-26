// Pet Merchant NPC - Sells companion pets
class PetMerchantNPC {
    constructor(scene, x, y, name = 'Pet Merchant') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80;
        this.isShopOpen = false;

        // Controller selection
        this.selectedItemIndex = 0;
        this.itemHighlights = [];

        // Keyboard keys
        this.keys = [];

        // Available pets for sale
        this.pets = [
            {
                id: 'red_panda',
                name: "Red Panda",
                description: 'Cute companion that follows you and collects XP orbs',
                cost: 125,
                keyBind: '1',
                spriteKey: 'red_panda',
                spriteFrame: 0
            }
        ];

        this.createSprite();
        this.createPrompt();
        this.createShopUI();
        this.setupKeyboardControls();
    }

    createSprite() {
        // Create animated sprite - using merchant sprite for now
        // TODO: Create unique pet merchant sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, 'merchant_1');
        this.sprite.setDepth(this.y);
        this.sprite.setScale(1.5);

        // Use existing merchant animation for now
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

        this.sprite.play('merchant_idle');

        // Name label (yellow/gold color for pet merchant)
        this.nameLabel = this.scene.add.text(
            this.x, this.y - 40,
            this.name,
            {
                font: 'bold 14px monospace',
                fill: '#FFD700', // Gold color
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
        this.prompt = this.scene.add.container(this.x, this.y - 70);
        this.prompt.setDepth(1000);
        this.prompt.setScrollFactor(1, 1);

        const bg = this.scene.add.rectangle(0, 0, 200, 30, 0x000000, 0.8);
        bg.setStrokeStyle(2, 0xFFD700);

        this.promptText = this.scene.add.text(0, 0, 'Press F to Buy Pets', {
            font: 'bold 12px monospace',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.prompt.add([bg, this.promptText]);
        this.prompt.setVisible(false);
    }

    createShopUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.shopContainer = this.scene.add.container(width / 2, height / 2);
        this.shopContainer.setScrollFactor(0);
        this.shopContainer.setDepth(100000);
        this.shopContainer.setVisible(false);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 650, 500, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(3, 0xFFD700);

        // Title
        const title = this.scene.add.text(0, -230, 'PET MERCHANT', {
            font: 'bold 24px monospace',
            fill: '#FFD700',
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

        // Close hint
        this.closeHintText = this.scene.add.text(0, 235, 'Press F or ESC to close', {
            font: '12px monospace',
            fill: '#666666',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.shopContainer.add([bg, title, instructions, this.closeHintText]);

        // Create pet cards
        this.createPetCards();
    }

    createPetCards() {
        const startY = -140;
        const cardHeight = 80;
        const cardSpacing = 12;

        this.itemHighlights = [];

        this.pets.forEach((pet, index) => {
            const y = startY + (index * (cardHeight + cardSpacing));

            // Card background
            const cardBg = this.scene.add.rectangle(0, y, 600, cardHeight, 0x2a2a3e, 1);
            cardBg.setStrokeStyle(2, 0xFFD700);

            // Controller selection highlight
            const highlight = this.scene.add.rectangle(0, y, 610, cardHeight + 4, 0x000000, 0);
            highlight.setStrokeStyle(4, 0xffff00);
            highlight.setVisible(false);
            this.itemHighlights.push(highlight);

            // Pet sprite preview
            const petSprite = this.scene.add.sprite(-270, y, pet.spriteKey, pet.spriteFrame);
            petSprite.setScale(2);

            // Pet name
            const nameText = this.scene.add.text(-230, y - 20, pet.name, {
                font: 'bold 18px monospace',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // Description
            const descText = this.scene.add.text(-230, y + 5, pet.description, {
                font: '12px monospace',
                fill: '#cccccc',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5);

            // Ownership status - only check if currently equipped (not stored)
            const isActive = this.scene.petManager &&
                           this.scene.petManager.activePet &&
                           this.scene.petManager.activePet.petType === pet.id;
            const statusText = this.scene.add.text(-230, y + 25, isActive ? '✓ Currently Active' : '', {
                font: 'bold 11px monospace',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5);

            // Cost (with soul sprite icon)
            const soulIcon = this.scene.add.sprite(170, y, 'souls', 0);
            soulIcon.setScale(0.6);

            const costText = this.scene.add.text(190, y, `${pet.cost}`, {
                font: 'bold 18px monospace',
                fill: '#9d00ff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // Key bind indicator
            const keyBg = this.scene.add.rectangle(265, y, 40, 40, 0x1a1a2e, 1);
            keyBg.setStrokeStyle(3, 0xFFD700);

            const keyText = this.scene.add.text(265, y, `[${pet.keyBind}]`, {
                font: 'bold 20px monospace',
                fill: '#FFD700',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.shopContainer.add([highlight, cardBg, petSprite, nameText, descText, statusText, soulIcon, costText, keyBg, keyText]);
        });
    }

    setupKeyboardControls() {
        // Check if keyboard is available
        if (!this.scene.input || !this.scene.input.keyboard) {
            console.warn('⚠️ Keyboard input not available for PetMerchantNPC');
            return;
        }

        // Number keys for purchasing
        for (let i = 0; i < this.pets.length; i++) {
            const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes['ONE'] + i);
            key.on('down', () => {
                if (this.isShopOpen) {
                    this.tryPurchasePet((i + 1).toString());
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

        // Refresh cards to show ownership status
        this.refreshPetCards();

        this.selectedItemIndex = 0;
        this.updateHighlight();

        console.log('🐾 Pet merchant opened');
    }

    closeShop() {
        this.isShopOpen = false;
        this.shopContainer.setVisible(false);
        this.itemHighlights.forEach(h => h.setVisible(false));

        console.log('🐾 Pet merchant closed');
    }

    toggleShop() {
        if (this.isShopOpen) {
            this.closeShop();
        } else {
            this.openShop();
        }
    }

    refreshPetCards() {
        // Destroy existing cards and recreate them
        this.shopContainer.removeAll(true);

        // Re-add background and title
        const bg = this.scene.add.rectangle(0, 0, 650, 500, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(3, 0xFFD700);

        const title = this.scene.add.text(0, -230, 'PET MERCHANT', {
            font: 'bold 24px monospace',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const instructions = this.scene.add.text(0, -195, 'Press number key to purchase', {
            font: '12px monospace',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.closeHintText = this.scene.add.text(0, 235, 'Press F or ESC to close', {
            font: '12px monospace',
            fill: '#666666',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.shopContainer.add([bg, title, instructions, this.closeHintText]);

        // Recreate pet cards with updated ownership
        this.createPetCards();
    }

    tryPurchasePet(keyPressed) {
        if (!this.isShopOpen) return;

        const pet = this.pets.find(p => p.keyBind === keyPressed);
        if (!pet) return;

        // Check if player currently has an active pet (not stored)
        if (this.scene.petManager && this.scene.petManager.activePet) {
            console.log('⚠️ You already have an active pet! Store it first.');
            this.showFeedback('Store Your Current Pet First!', '#ff6666');
            return;
        }

        // Check if on localhost (testing mode)
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';

        // Check if player has enough currency (skip check on localhost)
        if (!isLocalhost) {
            const currentCurrency = this.scene.modernHUD ? this.scene.modernHUD.getCurrency() : 0;
            if (currentCurrency < pet.cost) {
                console.log('⚠️ Not enough souls!');
                this.showFeedback('Not Enough Souls!', '#ff6666');
                return;
            }

            // Deduct currency (only in production)
            if (this.scene.modernHUD) {
                this.scene.modernHUD.addCurrency(-pet.cost);
            }
        } else {
            console.log('🔓 Localhost detected - pet is FREE for testing');
        }

        // Add pet to player's collection
        if (this.scene.petManager) {
            this.scene.petManager.addPet(pet.id);
        }

        console.log(`✅ Purchased pet: ${pet.name}`);
        this.showFeedback('Pet Purchased!', '#00ff00');

        // Refresh UI to show ownership
        this.refreshPetCards();
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

    moveSelectionUp() {
        if (!this.isShopOpen) return;
        this.selectedItemIndex = (this.selectedItemIndex - 1 + this.pets.length) % this.pets.length;
        this.updateHighlight();
    }

    moveSelectionDown() {
        if (!this.isShopOpen) return;
        this.selectedItemIndex = (this.selectedItemIndex + 1) % this.pets.length;
        this.updateHighlight();
    }

    updateHighlight() {
        this.itemHighlights.forEach((h, i) => {
            h.setVisible(i === this.selectedItemIndex);
        });
    }

    purchaseSelectedItem() {
        if (!this.isShopOpen) return;
        const pet = this.pets[this.selectedItemIndex];
        if (pet) {
            this.tryPurchasePet(pet.keyBind);
        }
    }

    setInputMode(mode) {
        const interactButton = mode === 'controller' ? 'A' : 'F';
        const closeButton = mode === 'controller' ? 'Start' : 'ESC';

        if (this.promptText) {
            this.promptText.setText(`Press ${interactButton} to Buy Pets`);
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
