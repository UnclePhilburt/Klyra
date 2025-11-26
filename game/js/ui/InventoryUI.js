// Hotbar Inventory UI - Keyboard-only, one-handed gameplay
class InventoryUI {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Hotbar slots (1-5 keys)
        this.hotbarSlots = 5;
        this.hotbar = new Array(this.hotbarSlots).fill(null);

        // Full inventory (opened with C)
        this.inventorySlots = 12;
        this.inventory = new Array(this.inventorySlots).fill(null);

        // UI state
        this.isOpen = false;
        this.selectedSlot = 0;

        // Active buffs tracking
        this.activeBuffs = [];

        // UI elements
        this.hotbarElements = [];
        this.inventoryElements = [];

        // Keyboard keys
        this.keys = [];

        this.createHotbarUI();
        this.createInventoryUI();
        this.createBuffDisplayUI();
        this.setupControls();
    }

    createHotbarUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // MINIMAL HOTBAR - No backgrounds, just icons with glows
        const slotSize = 35; // Smaller
        const slotPadding = 10; // More spacing between icons
        const totalWidth = this.hotbarSlots * slotSize + (this.hotbarSlots - 1) * slotPadding;
        const startX = (width - totalWidth) / 2;
        const startY = height - 50; // Bottom center

        this.hotbarSlotGraphics = [];
        this.hotbarItemTexts = [];
        this.hotbarKeyTexts = [];
        this.hotbarItemSprites = [];

        for (let i = 0; i < this.hotbarSlots; i++) {
            const x = startX + i * (slotSize + slotPadding);

            // NO slot background - minimalist!
            // Just a subtle glow circle that only appears when slot has item
            const slotBg = this.scene.add.circle(
                x + slotSize / 2, startY + slotSize / 2,
                slotSize / 2,
                0x000000, 0
            ); // Invisible by default
            slotBg.setDepth(99499);
            slotBg.setScrollFactor(0);

            // Key number indicator (very small, bottom-right corner)
            const keyText = this.scene.add.text(
                x + slotSize - 2, startY + slotSize - 2,
                (i + 1).toString(),
                {
                    fontFamily: 'Arial',
                    fontSize: '9px',
                    fontStyle: 'bold',
                    fill: '#4b5563',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(1, 1);
            keyText.setDepth(99502);
            keyText.setScrollFactor(0);

            // Item sprite (hidden initially)
            const itemSprite = this.scene.add.sprite(
                x + slotSize / 2, startY + slotSize / 2,
                'merchantitems',
                0
            );
            itemSprite.setDepth(99503);
            itemSprite.setScrollFactor(0);
            itemSprite.setVisible(false);
            itemSprite.setScale(1.3); // Slightly larger since no background

            // Item name text (fallback for non-sprite items)
            const itemText = this.scene.add.text(
                x + slotSize / 2, startY + slotSize / 2,
                '',
                {
                    fontFamily: 'Arial',
                    fontSize: '10px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    wordWrap: { width: slotSize - 10 },
                    align: 'center'
                }
            ).setOrigin(0.5);
            itemText.setDepth(99503);
            itemText.setScrollFactor(0);

            this.hotbarSlotGraphics.push(slotBg);
            this.hotbarItemTexts.push(itemText);
            this.hotbarKeyTexts.push(keyText);
            this.hotbarItemSprites.push(itemSprite);
            this.hotbarElements.push(slotBg, keyText, itemText, itemSprite);
        }
    }

    createInventoryUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Inventory panel dimensions
        const panelWidth = 600;
        const panelHeight = 400;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;

        // Outer shadow/glow
        this.inventoryShadow = this.scene.add.rectangle(
            panelX + 5, panelY + 5,
            panelWidth, panelHeight,
            0x000000, 0.5
        ).setOrigin(0);
        this.inventoryShadow.setDepth(99999);
        this.inventoryShadow.setScrollFactor(0);
        this.inventoryShadow.setVisible(false);
        this.inventoryElements.push(this.inventoryShadow);

        // Background panel with gradient effect
        this.inventoryBg = this.scene.add.rectangle(
            panelX, panelY,
            panelWidth, panelHeight,
            0x1a1a2e, 0.98
        ).setOrigin(0);
        this.inventoryBg.setDepth(100000);
        this.inventoryBg.setScrollFactor(0);
        this.inventoryBg.setStrokeStyle(4, 0x6366f1);
        this.inventoryBg.setVisible(false);
        this.inventoryElements.push(this.inventoryBg);

        // Title bar background
        const titleBarBg = this.scene.add.rectangle(
            panelX, panelY,
            panelWidth, 60,
            0x312e81, 0.9
        ).setOrigin(0);
        titleBarBg.setDepth(100000);
        titleBarBg.setScrollFactor(0);
        titleBarBg.setVisible(false);
        this.inventoryElements.push(titleBarBg);

        // Title with icon
        this.inventoryTitle = this.scene.add.text(
            panelX + panelWidth / 2, panelY + 20,
            '📦 INVENTORY',
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                fontStyle: 'bold',
                fill: '#e0e7ff',
                stroke: '#1e1b4b',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        this.inventoryTitle.setDepth(100001);
        this.inventoryTitle.setScrollFactor(0);
        this.inventoryTitle.setVisible(false);
        this.inventoryElements.push(this.inventoryTitle);

        // Instructions with better formatting
        this.inventoryInstructions = this.scene.add.text(
            panelX + panelWidth / 2, panelY + 42,
            'WASD  Navigate  |  V  Move to Hotbar  |  Delete  Drop  |  C/ESC  Close',
            {
                fontFamily: 'Arial',
                fontSize: '11px',
                fill: '#c7d2fe',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        this.inventoryInstructions.setDepth(100001);
        this.inventoryInstructions.setScrollFactor(0);
        this.inventoryInstructions.setVisible(false);
        this.inventoryElements.push(this.inventoryInstructions);

        // Decorative corner accents
        const cornerSize = 15;
        const corners = [
            { x: panelX + 5, y: panelY + 5 }, // top-left
            { x: panelX + panelWidth - 5, y: panelY + 5 }, // top-right
            { x: panelX + 5, y: panelY + panelHeight - 5 }, // bottom-left
            { x: panelX + panelWidth - 5, y: panelY + panelHeight - 5 } // bottom-right
        ];

        corners.forEach(corner => {
            const accent = this.scene.add.rectangle(
                corner.x, corner.y, cornerSize, cornerSize, 0x818cf8, 0.6
            );
            accent.setDepth(100001);
            accent.setScrollFactor(0);
            accent.setVisible(false);
            this.inventoryElements.push(accent);
        });

        // Create inventory grid (4 columns x 3 rows = 12 slots)
        const slotSize = 85;
        const slotPadding = 12;
        const cols = 4;
        const rows = 3;
        const gridWidth = cols * slotSize + (cols - 1) * slotPadding;
        const startX = panelX + (panelWidth - gridWidth) / 2;
        const startY = panelY + 90;

        this.inventorySlotGraphics = [];
        this.inventoryItemTexts = [];
        this.inventoryItemSprites = [];
        this.inventorySlotBorders = [];

        for (let i = 0; i < this.inventorySlots; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (slotSize + slotPadding);
            const y = startY + row * (slotSize + slotPadding);

            // Inner shadow for depth
            const shadow = this.scene.add.rectangle(
                x + 2, y + 2,
                slotSize, slotSize,
                0x000000, 0.4
            ).setOrigin(0);
            shadow.setDepth(100001);
            shadow.setScrollFactor(0);
            shadow.setVisible(false);
            this.inventoryElements.push(shadow);

            // Slot background with gradient
            const slotBg = this.scene.add.rectangle(
                x, y,
                slotSize, slotSize,
                0x2d2d44, 1
            ).setOrigin(0);
            slotBg.setDepth(100001);
            slotBg.setScrollFactor(0);
            slotBg.setStrokeStyle(2, 0x4b4b6b);
            slotBg.setVisible(false);

            // Slot number indicator (small)
            const slotNumber = this.scene.add.text(
                x + 6, y + 6,
                (i + 1).toString(),
                {
                    fontFamily: 'Arial',
                    fontSize: '10px',
                    fill: '#6b7280',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0);
            slotNumber.setDepth(100002);
            slotNumber.setScrollFactor(0);
            slotNumber.setVisible(false);

            // Item sprite (hidden initially)
            const itemSprite = this.scene.add.sprite(
                x + slotSize / 2, y + slotSize / 2,
                'merchantitems',
                0
            );
            itemSprite.setDepth(100003);
            itemSprite.setScrollFactor(0);
            itemSprite.setVisible(false);
            itemSprite.setScale(2.5);

            // Item text (fallback for non-sprite items)
            const itemText = this.scene.add.text(
                x + slotSize / 2, y + slotSize / 2,
                '',
                {
                    fontFamily: 'Arial',
                    fontSize: '12px',
                    fontStyle: 'bold',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3,
                    wordWrap: { width: slotSize - 10 },
                    align: 'center'
                }
            ).setOrigin(0.5);
            itemText.setDepth(100003);
            itemText.setScrollFactor(0);
            itemText.setVisible(false);

            this.inventorySlotGraphics.push(slotBg);
            this.inventoryItemTexts.push(itemText);
            this.inventoryItemSprites.push(itemSprite);
            this.inventorySlotBorders.push({ bg: slotBg, shadow: shadow });
            this.inventoryElements.push(slotBg, itemText, itemSprite, slotNumber);
        }
    }

    createBuffDisplayUI() {
        // Active buffs display (top right, below skills)
        const width = this.scene.cameras.main.width;

        this.buffsContainer = this.scene.add.container(width - 200, 200);
        this.buffsContainer.setScrollFactor(0);
        this.buffsContainer.setDepth(99600);

        this.buffTexts = [];
    }

    setupControls() {
        // Check if keyboard is available
        if (!this.scene.input || !this.scene.input.keyboard) {
            console.warn('⚠️ Keyboard input not available for InventoryUI');
            return;
        }

        // Hotbar keys (1-5)
        for (let i = 0; i < this.hotbarSlots; i++) {
            const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes['ONE'] + i);
            key.on('down', () => {
                // Don't use hotbar items if blackjack UI is open
                if (this.scene.blackjackUIOpen) return;

                this.useHotbarItem(i);
            });
            this.keys.push(key);
        }

        // C key to toggle inventory
        const cKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        cKey.on('down', () => {
            this.toggleInventory();
        });
        this.keys.push(cKey);

        // WASD keys for navigation (when inventory is open)
        const wKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        const aKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        const sKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        const dKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        wKey.on('down', () => {
            if (this.isOpen) this.moveSelection(0, -1);
        });
        sKey.on('down', () => {
            if (this.isOpen) this.moveSelection(0, 1);
        });
        aKey.on('down', () => {
            if (this.isOpen) this.moveSelection(-1, 0);
        });
        dKey.on('down', () => {
            if (this.isOpen) this.moveSelection(1, 0);
        });
        this.keys.push(wKey, aKey, sKey, dKey);

        // V to move item to hotbar
        const vKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);
        vKey.on('down', () => {
            if (this.isOpen) {
                this.moveToHotbar();
            }
        });
        this.keys.push(vKey);

        // Delete to drop item
        const deleteKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
        deleteKey.on('down', () => {
            if (this.isOpen) {
                this.dropSelectedItem();
            }
        });
        this.keys.push(deleteKey);
    }

    moveSelection(dx, dy) {
        const cols = 4;
        const row = Math.floor(this.selectedSlot / cols);
        const col = this.selectedSlot % cols;

        const newCol = Math.max(0, Math.min(cols - 1, col + dx));
        const newRow = Math.max(0, Math.min(2, row + dy));

        this.selectedSlot = newRow * cols + newCol;
        this.updateInventoryUI();
    }

    moveToHotbar() {
        const item = this.inventory[this.selectedSlot];
        if (!item) return;

        // Find first empty hotbar slot
        let targetSlot = -1;
        for (let i = 0; i < this.hotbarSlots; i++) {
            if (!this.hotbar[i]) {
                targetSlot = i;
                break;
            }
        }

        if (targetSlot === -1) {
            console.log('⚠️ Hotbar is full!');
            return;
        }

        // Move item to hotbar
        this.hotbar[targetSlot] = item;
        this.inventory[this.selectedSlot] = null;

        this.updateHotbarUI();
        this.updateInventoryUI();

        console.log(`📦 Moved ${item.name} to hotbar slot ${targetSlot + 1}`);
    }

    dropSelectedItem() {
        const item = this.inventory[this.selectedSlot];
        if (!item) return;

        this.inventory[this.selectedSlot] = null;
        this.updateInventoryUI();

        console.log(`🗑️ Dropped ${item.name}`);
    }

    toggleInventory() {
        this.isOpen = !this.isOpen;

        this.inventoryElements.forEach(elem => {
            elem.setVisible(this.isOpen);
        });

        if (this.isOpen) {
            this.selectedSlot = 0;
            this.updateInventoryUI();
        }
    }

    useHotbarItem(slotIndex) {
        const item = this.hotbar[slotIndex];
        if (!item) return;

        console.log(`✨ Using ${item.name} from hotbar slot ${slotIndex + 1}`);

        // Apply item effect
        this.applyItemEffect(item);

        // Remove from hotbar (consumed)
        this.hotbar[slotIndex] = null;
        this.updateHotbarUI();
    }

    applyItemEffect(item) {
        switch (item.type) {
            case 'health_potion':
                // Instantly restore to full health
                this.player.health = this.player.maxHealth;
                console.log(`✨ Health restored to ${this.player.maxHealth}`);

                // Broadcast healing to other players
                if (this.scene.networkManager && this.scene.networkManager.connected) {
                    this.scene.networkManager.socket.emit('player:healed', {
                        health: this.player.health
                    });
                }

                // Update local health bar
                if (this.player.ui && this.player.ui.updateHealthBar) {
                    this.player.ui.updateHealthBar();
                }
                break;

            case 'regen_potion':
                // Heal 3 HP per second for 10 seconds
                this.addBuff('Regen', 10, () => {
                    this.scene.time.addEvent({
                        delay: 1000,
                        callback: () => {
                            if (this.player.health < this.player.maxHealth) {
                                this.player.health = Math.min(this.player.maxHealth, this.player.health + 3);

                                // Broadcast healing to other players
                                if (this.scene.networkManager && this.scene.networkManager.connected) {
                                    this.scene.networkManager.socket.emit('player:healed', {
                                        health: this.player.health
                                    });
                                }

                                // Update local health bar
                                if (this.player.ui && this.player.ui.updateHealthBar) {
                                    this.player.ui.updateHealthBar();
                                }
                            }
                        },
                        repeat: 9 // 10 total ticks
                    });
                });
                break;
        }
    }

    addBuff(name, durationSeconds, effectCallback) {
        // Execute the effect
        effectCallback();

        // Add to active buffs display
        const buff = {
            name: name,
            endTime: durationSeconds ? Date.now() + (durationSeconds * 1000) : null
        };

        this.activeBuffs.push(buff);
        this.updateBuffDisplay();

        // Remove buff when expired
        if (durationSeconds) {
            this.scene.time.delayedCall(durationSeconds * 1000, () => {
                const index = this.activeBuffs.indexOf(buff);
                if (index > -1) {
                    this.activeBuffs.splice(index, 1);
                    this.updateBuffDisplay();
                }
            });
        }

        console.log(`✨ Buff applied: ${name}` + (durationSeconds ? ` (${durationSeconds}s)` : ' (until triggered)'));
    }

    updateBuffDisplay() {
        // Clear existing buff texts
        this.buffTexts.forEach(text => text.destroy());
        this.buffTexts = [];

        // Recreate buff list
        this.activeBuffs.forEach((buff, index) => {
            const timeLeft = buff.endTime ? Math.ceil((buff.endTime - Date.now()) / 1000) : '∞';
            const text = this.scene.add.text(
                0, index * 25,
                `${buff.name}: ${timeLeft}s`,
                {
                    fontFamily: 'Arial',
                    fontSize: '12px',
                    fill: '#66ff66',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0);

            this.buffTexts.push(text);
            this.buffsContainer.add(text);
        });
    }

    addItem(itemType, quantity = 1, metadata = {}) {
        const itemData = this.getItemData(itemType);
        if (!itemData) {
            console.warn(`Unknown item type: ${itemType}`);
            return false;
        }

        // Find first empty inventory slot
        for (let i = 0; i < this.inventorySlots; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = {
                    type: itemType,
                    name: itemData.name,
                    ...metadata
                };

                this.updateInventoryUI();
                console.log(`📦 Added ${itemData.name} to inventory slot ${i + 1}`);
                return true;
            }
        }

        console.log('⚠️ Inventory is full!');
        return false;
    }

    getItemData(itemType) {
        const items = {
            'health_potion': { name: 'Health Potion', color: 0xff0000, spriteFrame: 14 },
            'regen_potion': { name: 'Regen Potion', color: 0xff6666, spriteFrame: 28 }
        };

        return items[itemType] || null;
    }

    updateHotbarUI() {
        for (let i = 0; i < this.hotbarSlots; i++) {
            const item = this.hotbar[i];

            if (item) {
                const itemData = this.getItemData(item.type);

                // If item has a sprite frame, show sprite instead of text
                if (itemData && itemData.spriteFrame !== undefined) {
                    this.hotbarItemSprites[i].setFrame(itemData.spriteFrame);
                    this.hotbarItemSprites[i].setVisible(true);
                    this.hotbarItemTexts[i].setText('');
                } else {
                    // Fallback to text for items without sprites
                    this.hotbarItemSprites[i].setVisible(false);
                    this.hotbarItemTexts[i].setText(item.name);
                }

                this.hotbarSlotGraphics[i].setStrokeStyle(2, 0x818cf8);
            } else {
                this.hotbarItemSprites[i].setVisible(false);
                this.hotbarItemTexts[i].setText('');
                this.hotbarSlotGraphics[i].setStrokeStyle(2, 0x6b7280);
            }
        }
    }

    updateInventoryUI() {
        for (let i = 0; i < this.inventorySlots; i++) {
            const item = this.inventory[i];

            if (item) {
                const itemData = this.getItemData(item.type);

                // If item has a sprite frame, show sprite instead of text
                if (itemData && itemData.spriteFrame !== undefined) {
                    this.inventoryItemSprites[i].setFrame(itemData.spriteFrame);
                    this.inventoryItemSprites[i].setVisible(true);
                    this.inventoryItemTexts[i].setText('');
                } else {
                    // Fallback to text for items without sprites
                    this.inventoryItemSprites[i].setVisible(false);
                    this.inventoryItemTexts[i].setText(item.name);
                }
            } else {
                this.inventoryItemSprites[i].setVisible(false);
                this.inventoryItemTexts[i].setText('');
            }

            // Highlight selected slot with glow effect
            if (i === this.selectedSlot) {
                this.inventorySlotGraphics[i].setStrokeStyle(4, 0xfbbf24);
                this.inventorySlotGraphics[i].setFillStyle(0x3d3d5c, 1);
            } else if (item) {
                // Slots with items have a subtle highlight
                this.inventorySlotGraphics[i].setStrokeStyle(2, 0x6366f1);
                this.inventorySlotGraphics[i].setFillStyle(0x2d2d44, 1);
            } else {
                // Empty slots
                this.inventorySlotGraphics[i].setStrokeStyle(2, 0x4b4b6b);
                this.inventorySlotGraphics[i].setFillStyle(0x2d2d44, 1);
            }
        }
    }

    isFull() {
        return this.inventory.every(slot => slot !== null);
    }

    addItemToHotbar(itemType, metadata = {}) {
        const itemData = this.getItemData(itemType);
        if (!itemData) {
            console.warn(`Unknown item type: ${itemType}`);
            return false;
        }

        // Find first empty hotbar slot
        for (let i = 0; i < this.hotbarSlots; i++) {
            if (!this.hotbar[i]) {
                this.hotbar[i] = {
                    type: itemType,
                    name: itemData.name,
                    ...metadata
                };

                this.updateHotbarUI();
                console.log(`📦 Added ${itemData.name} to hotbar slot ${i + 1}`);
                return true;
            }
        }

        console.log('⚠️ Hotbar is full!');
        return false;
    }

    update() {
        // Update buff timers
        if (this.activeBuffs.length > 0) {
            this.updateBuffDisplay();
        }
    }

    // Controller support: Highlight selected hotbar slot
    setControllerSelection(slotIndex) {
        // Clear all highlights first
        for (let i = 0; i < this.hotbarSlots; i++) {
            const slotBg = this.hotbarSlotGraphics[i];
            if (slotBg) {
                slotBg.setFillStyle(0x000000, 0); // Make invisible
                slotBg.setStrokeStyle(0, 0x000000, 0); // No stroke
            }
        }

        // Highlight the selected slot
        if (slotIndex >= 0 && slotIndex < this.hotbarSlots) {
            const slotBg = this.hotbarSlotGraphics[slotIndex];
            if (slotBg) {
                slotBg.setFillStyle(0x6B4FFF, 0.3); // Purple glow
                slotBg.setStrokeStyle(3, 0x6B4FFF, 1); // Purple border
            }
        }
    }

    setInputMode(mode) {
        // For now, inventory doesn't have button prompts to update
        // This is a placeholder for future hotbar key display updates
        console.log(`🎮 InventoryUI: Switched to ${mode} mode`);
    }

    // Reposition UI elements when screen size changes
    repositionUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Calculate scale based on aspect ratio (ultrawide = bigger UI)
        const aspectRatio = width / height;
        let uiScale = 1.0;

        // Scale up for ultrawide monitors
        if (aspectRatio > 1.78) { // Wider than 16:9
            uiScale = 1.0 + ((aspectRatio - 1.78) * 0.3); // Scale up gradually
            uiScale = Math.min(uiScale, 1.5); // Max 1.5x scale
        }

        const slotSize = 35;
        const slotPadding = 10;
        const totalWidth = this.hotbarSlots * slotSize + (this.hotbarSlots - 1) * slotPadding;
        const startX = (width - totalWidth) / 2;
        const startY = height - (50 * uiScale);

        // Update positions and scale of all hotbar elements
        for (let i = 0; i < this.hotbarSlots; i++) {
            const x = startX + i * (slotSize + slotPadding);

            if (this.hotbarSlotGraphics[i]) {
                this.hotbarSlotGraphics[i].setScale(uiScale);
                this.hotbarSlotGraphics[i].x = x + slotSize / 2;
                this.hotbarSlotGraphics[i].y = startY + slotSize / 2;
            }
            if (this.hotbarKeyTexts[i]) {
                this.hotbarKeyTexts[i].setScale(uiScale);
                this.hotbarKeyTexts[i].x = x + slotSize - 2;
                this.hotbarKeyTexts[i].y = startY + slotSize - 2;
            }
            if (this.hotbarItemSprites[i]) {
                this.hotbarItemSprites[i].setScale(1.3 * uiScale);
                this.hotbarItemSprites[i].x = x + slotSize / 2;
                this.hotbarItemSprites[i].y = startY + slotSize / 2;
            }
            if (this.hotbarItemTexts[i]) {
                this.hotbarItemTexts[i].setScale(uiScale);
                this.hotbarItemTexts[i].x = x + slotSize / 2;
                this.hotbarItemTexts[i].y = startY + slotSize / 2;
            }
        }

        // Update buffs container position and scale (top-right)
        if (this.buffsContainer) {
            this.buffsContainer.setScale(uiScale);
            this.buffsContainer.x = width - (200 * uiScale);
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

        this.hotbarElements.forEach(elem => {
            if (elem) elem.destroy();
        });
        this.inventoryElements.forEach(elem => {
            if (elem) elem.destroy();
        });
        if (this.buffsContainer) this.buffsContainer.destroy();
    }
}
