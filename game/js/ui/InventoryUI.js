// Inventory UI - 8-slot inventory system
class InventoryUI {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.isOpen = false;

        // Inventory data
        this.slots = 8;
        this.items = new Array(this.slots).fill(null);

        // UI elements
        this.inventoryElements = [];
        this.slotGraphics = [];
        this.itemSprites = [];
        this.itemTexts = [];

        this.createInventoryUI();
        this.setupControls();
    }

    createInventoryUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Inventory panel dimensions
        const panelWidth = 400;
        const panelHeight = 200;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;

        // Background panel
        this.inventoryBg = this.scene.add.rectangle(
            panelX, panelY,
            panelWidth, panelHeight,
            0x1f2937, 0.95
        ).setOrigin(0);
        this.inventoryBg.setDepth(1000);
        this.inventoryBg.setScrollFactor(0);
        this.inventoryBg.setStrokeStyle(2, 0x4b5563);
        this.inventoryBg.setVisible(false);
        this.inventoryElements.push(this.inventoryBg);

        // Title
        this.inventoryTitle = this.scene.add.text(
            panelX + panelWidth / 2, panelY + 20,
            'INVENTORY',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                fontStyle: 'bold',
                fill: '#f9fafb',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        this.inventoryTitle.setDepth(1001);
        this.inventoryTitle.setScrollFactor(0);
        this.inventoryTitle.setVisible(false);
        this.inventoryElements.push(this.inventoryTitle);

        // Create 8 inventory slots (2 rows of 4)
        const slotSize = 60;
        const slotPadding = 10;
        const startX = panelX + (panelWidth - (4 * slotSize + 3 * slotPadding)) / 2;
        const startY = panelY + 60;

        for (let i = 0; i < this.slots; i++) {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const x = startX + col * (slotSize + slotPadding);
            const y = startY + row * (slotSize + slotPadding);

            // Slot background
            const slotBg = this.scene.add.rectangle(
                x, y,
                slotSize, slotSize,
                0x374151, 1
            ).setOrigin(0);
            slotBg.setDepth(1001);
            slotBg.setScrollFactor(0);
            slotBg.setStrokeStyle(2, 0x6b7280);
            slotBg.setVisible(false);
            slotBg.setInteractive();

            // Hover effect
            slotBg.on('pointerover', () => {
                slotBg.setStrokeStyle(2, 0x9ca3af);
            });
            slotBg.on('pointerout', () => {
                slotBg.setStrokeStyle(2, 0x6b7280);
            });

            // Click to drop item (when inventory is open)
            slotBg.on('pointerdown', () => {
                if (this.isOpen) {
                    this.dropItem(i);
                }
            });

            this.slotGraphics.push(slotBg);
            this.inventoryElements.push(slotBg);

            // Slot number
            const slotNum = this.scene.add.text(
                x + 5, y + 5,
                `${i + 1}`,
                {
                    fontFamily: 'Arial',
                    fontSize: '12px',
                    fill: '#9ca3af',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0);
            slotNum.setDepth(1002);
            slotNum.setScrollFactor(0);
            slotNum.setVisible(false);
            this.inventoryElements.push(slotNum);

            // Item icon placeholder (will be replaced with actual items)
            const itemSprite = this.scene.add.rectangle(
                x + slotSize / 2, y + slotSize / 2,
                40, 40,
                0x000000, 0
            ).setOrigin(0.5);
            itemSprite.setDepth(1002);
            itemSprite.setScrollFactor(0);
            itemSprite.setVisible(false);
            this.itemSprites.push(itemSprite);
            this.inventoryElements.push(itemSprite);

            // Item count/name text
            const itemText = this.scene.add.text(
                x + slotSize / 2, y + slotSize - 8,
                '',
                {
                    fontFamily: 'Arial',
                    fontSize: '11px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5);
            itemText.setDepth(1003);
            itemText.setScrollFactor(0);
            itemText.setVisible(false);
            this.itemTexts.push(itemText);
            this.inventoryElements.push(itemText);
        }

        // Close hint
        this.closeHint = this.scene.add.text(
            panelX + panelWidth / 2, panelY + panelHeight - 20,
            'Press C or ESC to close',
            {
                fontFamily: 'Arial',
                fontSize: '12px',
                fill: '#9ca3af',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        this.closeHint.setDepth(1001);
        this.closeHint.setScrollFactor(0);
        this.closeHint.setVisible(false);
        this.inventoryElements.push(this.closeHint);

        console.log('✅ Inventory UI created with', this.slots, 'slots');
    }

    setupControls() {
        // C key to toggle inventory
        const cKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        cKey.on('down', () => {
            this.toggle();
        });

        // ESC key to close inventory
        const escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey.on('down', () => {
            if (this.isOpen) {
                this.close();
            }
        });

        // Number keys 1-8 to use items (when inventory is closed)
        for (let i = 1; i <= 8; i++) {
            const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[`DIGIT${i}`]);
            key.on('down', () => {
                if (!this.isOpen) {
                    this.useItem(i - 1);
                }
            });
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.inventoryElements.forEach(elem => elem.setVisible(true));
        this.updateDisplay();
        console.log('📦 Inventory opened');
    }

    close() {
        this.isOpen = false;
        this.inventoryElements.forEach(elem => elem.setVisible(false));
        console.log('📦 Inventory closed');
    }

    isFull() {
        // Check if all slots are occupied
        for (let i = 0; i < this.slots; i++) {
            if (!this.items[i]) {
                return false; // Found an empty slot
            }
        }
        return true; // All slots full
    }

    addItem(itemType, quantity = 1, itemData = {}) {
        // NO STACKING - Each item gets its own slot (for unique names later)
        let targetSlot = -1;

        // Find empty slot
        for (let i = 0; i < this.slots; i++) {
            if (!this.items[i]) {
                this.items[i] = {
                    type: itemType,
                    quantity: quantity,
                    data: itemData
                };
                targetSlot = i;
                break;
            }
        }

        if (targetSlot !== -1) {
            this.updateDisplay();
            console.log(`📦 Added ${quantity}x ${itemType} to slot ${targetSlot + 1}`);
            return true;
        } else {
            console.log('⚠️ Inventory full!');
            return false;
        }
    }

    removeItem(slot, quantity = 1) {
        if (this.items[slot]) {
            this.items[slot].quantity -= quantity;
            if (this.items[slot].quantity <= 0) {
                this.items[slot] = null;
            }
            this.updateDisplay();
            return true;
        }
        return false;
    }

    dropItem(slot) {
        const item = this.items[slot];
        if (!item) return;

        console.log(`📦 Dropping item from slot ${slot + 1}:`, item.type);

        // Get player position in tiles
        const playerX = Math.floor(this.player.sprite.x / 32);
        const playerY = Math.floor(this.player.sprite.y / 32);

        // Send drop request to server
        networkManager.emit('item:drop', {
            itemType: item.type,
            itemColor: item.data.color || this.getItemColor(item.type),
            playerX: playerX,
            playerY: playerY
        });

        // Remove one from stack
        this.removeItem(slot, 1);
    }

    getItemColor(itemType) {
        // Default colors for item types
        const colors = {
            'health_potion': 0xff0000,
            'mana_potion': 0x0099ff,
            'speed_potion': 0xffff00,
            'strength_potion': 0xff6600,
            'defense_potion': 0x999999,
            'star': 0xffff00  // Gold/yellow star
        };
        return colors[itemType] || 0xffffff;
    }

    useItem(slot) {
        const item = this.items[slot];
        if (!item) return;

        console.log(`🔔 Using item in slot ${slot + 1}:`, item.type);

        // Item effects
        switch (item.type) {
            case 'health_potion':
                this.useHealthPotion();
                break;
            case 'mana_potion':
                this.useManaPotion();
                break;
            case 'speed_potion':
                this.useSpeedPotion();
                break;
            case 'strength_potion':
                this.useStrengthPotion();
                break;
            case 'defense_potion':
                this.useDefensePotion();
                break;
            case 'star':
                // Stars are currency, can't be "used" - just collected
                console.log('⭐ Stars are currency! Cannot be used.');
                return; // Don't remove from inventory
            default:
                console.log('⚠️ Unknown item type:', item.type);
                return;
        }

        // Remove one from stack
        this.removeItem(slot, 1);
    }

    useHealthPotion() {
        if (this.player.health < this.player.maxHealth) {
            const healAmount = 50;
            this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);
            if (this.player.ui) {
                this.player.ui.updateHealthBar();
            }
            console.log(`💚 Healed ${healAmount} HP`);

            // Visual effect
            this.showItemEffect(0x00ff00, '💚 +50 HP');
        }
    }

    useManaPotion() {
        console.log('💙 Mana potion used (not implemented yet)');
        this.showItemEffect(0x0099ff, '💙 +50 MP');
    }

    useSpeedPotion() {
        console.log('⚡ Speed boost activated!');
        this.showItemEffect(0xffff00, '⚡ SPEED!');

        // Temporary speed boost (example)
        if (this.player.stats) {
            const originalSpeed = this.player.stats.speed || 200;
            this.player.stats.speed = originalSpeed * 1.5;

            // Revert after 10 seconds
            this.scene.time.delayedCall(10000, () => {
                this.player.stats.speed = originalSpeed;
                console.log('⚡ Speed boost ended');
            });
        }
    }

    useStrengthPotion() {
        console.log('💪 Strength boost activated!');
        this.showItemEffect(0xff6600, '💪 POWER!');

        // Temporary strength boost
        if (this.player.stats) {
            const originalDamage = this.player.stats.damage || 10;
            this.player.stats.damage = Math.floor(originalDamage * 1.5);

            // Revert after 10 seconds
            this.scene.time.delayedCall(10000, () => {
                this.player.stats.damage = originalDamage;
                console.log('💪 Strength boost ended');
            });
        }
    }

    useDefensePotion() {
        console.log('🛡️ Defense boost activated!');
        this.showItemEffect(0x999999, '🛡️ ARMOR!');

        // Temporary defense boost
        if (this.player.stats) {
            const originalDefense = this.player.stats.defense || 0;
            this.player.stats.defense = originalDefense + 5;

            // Revert after 10 seconds
            this.scene.time.delayedCall(10000, () => {
                this.player.stats.defense = originalDefense;
                console.log('🛡️ Defense boost ended');
            });
        }
    }

    showItemEffect(color, text) {
        if (!this.player.spriteRenderer || !this.player.spriteRenderer.sprite) return;

        const effectText = this.scene.add.text(
            this.player.spriteRenderer.sprite.x,
            this.player.spriteRenderer.sprite.y - 50,
            text,
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                fontStyle: 'bold',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        effectText.setDepth(1000);

        this.scene.tweens.add({
            targets: effectText,
            y: effectText.y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => effectText.destroy()
        });
    }

    updateDisplay() {
        for (let i = 0; i < this.slots; i++) {
            const item = this.items[i];

            if (item) {
                // Show item icon (color coded - use stored color or default)
                let itemColor = item.data?.color || this.getItemColor(item.type);

                this.itemSprites[i].setFillStyle(itemColor, 1);
                this.itemSprites[i].setVisible(this.isOpen);

                // Show item count
                this.itemTexts[i].setText(`x${item.quantity}`);
                this.itemTexts[i].setVisible(this.isOpen);
            } else {
                // Empty slot
                this.itemSprites[i].setVisible(false);
                this.itemTexts[i].setVisible(false);
            }
        }
    }

    destroy() {
        this.inventoryElements.forEach(elem => {
            if (elem) elem.destroy();
        });
        this.inventoryElements = [];
        this.slotGraphics = [];
        this.itemSprites = [];
        this.itemTexts = [];
    }
}
