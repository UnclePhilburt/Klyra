// Pet Storage NPC - Manages pet storage (deposit/withdraw)
class PetStorageNPC {
    constructor(scene, x, y, name = 'Pet Storage') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80;
        this.isStorageOpen = false;

        // Storage data
        this.storedPets = []; // Array of pet IDs stored in database
        this.currentPet = null; // Player's current active pet

        // Controller selection
        this.selectedActionIndex = 0; // 0 = deposit, 1+ = withdraw pets
        this.actionHighlights = []; // Store highlight rectangles

        // Available pets (will be populated from player's inventory)
        this.availablePets = [
            {
                id: 'red_panda',
                name: 'Red Panda',
                description: 'Cute companion that follows you',
                spriteKey: 'red_panda',
                spriteFrame: 0
            }
        ];

        // Withdraw pet buttons (will be created dynamically)
        this.withdrawPetButtons = [];

        // Keyboard keys
        this.keys = [];

        this.createSprite();
        this.createPrompt();
        this.createStorageUI();
        this.setupKeyboardControls();
        this.setupNetworkListeners();

        // Fetch storage data from server
        this.fetchStorageData();
    }

    setupNetworkListeners() {
        if (!window.networkManager || !window.networkManager.socket) return;

        // Pet storage data received
        window.networkManager.socket.on('petStorage:data', (data) => {
            this.updateStorageData(data);
        });

        // Deposit confirmed
        window.networkManager.socket.on('petStorage:depositConfirm', (data) => {
            this.storedPets = data.storedPets;
            this.currentPet = data.currentPet;
            this.updateDisplay();
            this.showFeedback('Pet deposited!', '#00ff00');
        });

        // Withdraw confirmed
        window.networkManager.socket.on('petStorage:withdrawConfirm', (data) => {
            this.storedPets = data.storedPets;
            this.currentPet = data.currentPet;
            this.updateDisplay();
            this.showFeedback('Pet withdrawn!', '#00ff00');
        });

        // Error handling
        window.networkManager.socket.on('petStorage:error', (data) => {
            this.showFeedback(`Error: ${data.error}`, '#ff6666');
        });
    }

    createSprite() {
        // Create animated sprite (using merchant sprite with green tint)
        this.sprite = this.scene.add.sprite(this.x, this.y, 'merchant_1');
        this.sprite.setDepth(this.y); // Y-based depth so NPCs render under roofs
        this.sprite.setScale(1.5);
        this.sprite.setTint(0x22bb44); // Green tint for pet storage

        // Create animation if it doesn't exist
        if (!this.scene.anims.exists('pet_storage_idle')) {
            this.scene.anims.create({
                key: 'pet_storage_idle',
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
        this.sprite.play('pet_storage_idle');

        // Name label
        this.nameLabel = this.scene.add.text(
            this.x, this.y - 40,
            this.name,
            {
                font: 'bold 14px monospace',
                fill: '#22bb44',
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
        const bg = this.scene.add.rectangle(0, 0, 240, 35, 0x000000, 0.85);
        bg.setStrokeStyle(2, 0x22bb44);

        // Text
        this.promptText = this.scene.add.text(0, 0, 'Press F for Pet Storage', {
            font: 'bold 13px monospace',
            fill: '#22bb44',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.prompt.add([bg, this.promptText]);
        this.prompt.setVisible(false);
    }

    createStorageUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.storageContainer = this.scene.add.container(width / 2, height / 2);
        this.storageContainer.setScrollFactor(0);
        this.storageContainer.setDepth(100000);
        this.storageContainer.setVisible(false);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 700, 550, 0x0f1419, 0.95);
        bg.setStrokeStyle(4, 0x22bb44);

        // Title
        const title = this.scene.add.text(0, -255, '🐾 PET STORAGE 🐾', {
            font: 'bold 28px monospace',
            fill: '#22bb44',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Storage info
        const info = this.scene.add.text(0, -215, 'Store your pets safely between sessions', {
            font: '13px monospace',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Current pet display
        this.currentPetText = this.scene.add.text(0, -180, 'Current Pet: None', {
            font: 'bold 16px monospace',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Stored pets section
        const storedLabel = this.scene.add.text(-320, -130, 'STORED PETS:', {
            font: 'bold 14px monospace',
            fill: '#22bb44',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        this.storedPetsText = this.scene.add.text(-320, -100, 'No pets stored', {
            font: '12px monospace',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: 620 }
        }).setOrigin(0, 0);

        // Divider
        const divider = this.scene.add.graphics();
        divider.lineStyle(2, 0x22bb44, 0.5);
        divider.lineBetween(-320, -40, 320, -40);

        // Actions section
        const actionsLabel = this.scene.add.text(0, -10, 'ACTIONS', {
            font: 'bold 16px monospace',
            fill: '#22bb44',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Deposit button
        this.depositButton = this.createActionButton(0, 40, 'DEPOSIT Current Pet', '1', () => this.depositPet());

        // Withdraw pets section (will be populated dynamically)
        this.withdrawPetsContainer = this.scene.add.container(0, 110);

        // Close hint
        this.closeHintText = this.scene.add.text(0, 250, 'Press ESC to close', {
            font: '12px monospace',
            fill: '#666666',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.storageContainer.add([
            bg, title, info, this.currentPetText, storedLabel, this.storedPetsText,
            divider, actionsLabel, this.depositButton.container, this.withdrawPetsContainer,
            this.closeHintText
        ]);
    }

    createActionButton(x, y, label, keyHint, callback) {
        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, 400, 50, 0x1a1a2e, 0.9);
        bg.setStrokeStyle(2, 0x22bb44);

        const text = this.scene.add.text(-150, 0, label, {
            font: 'bold 14px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        const keyText = this.scene.add.text(180, 0, `[${keyHint}]`, {
            font: 'bold 14px monospace',
            fill: '#22bb44',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(1, 0.5);

        container.add([bg, text, keyText]);

        // Make interactive
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', callback);

        return { container, bg, text, keyText, callback };
    }

    setupKeyboardControls() {
        // Deposit (1)
        const depositKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        depositKey.on('down', () => {
            if (this.isStorageOpen) this.depositPet();
        });
        this.keys.push(depositKey);

        // Withdraw keys (2-9 for up to 8 pets)
        for (let i = 0; i < 8; i++) {
            const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO + i);
            key.on('down', () => {
                if (this.isStorageOpen && this.storedPets.length > i) {
                    this.withdrawPetByIndex(i);
                }
            });
            this.keys.push(key);
        }

        // Close (ESC only, not F)
        const escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey.on('down', () => {
            if (this.isStorageOpen) this.closeStorage();
        });
        this.keys.push(escKey);
    }

    fetchStorageData() {
        // Request pet storage data from server (uses player's userId from socket)
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('petStorage:getData', {});
        }
    }

    updateStorageData(data) {
        this.storedPets = data.storedPets || [];
        this.currentPet = data.currentPet || null;
        this.updateDisplay();
    }

    updateDisplay() {
        // Check for active pet in the scene's pet manager
        let activePetId = null;
        if (this.scene.petManager && this.scene.petManager.activePet) {
            activePetId = this.scene.petManager.activePet.petType || 'red_panda';
        } else if (this.currentPet) {
            activePetId = this.currentPet;
        }

        // Update current pet display
        if (activePetId) {
            const petInfo = this.availablePets.find(p => p.id === activePetId);
            this.currentPetText.setText(`Current Pet: ${petInfo ? petInfo.name : activePetId}`);
        } else {
            this.currentPetText.setText('Current Pet: None');
        }

        // Update stored pets display
        if (this.storedPets.length === 0) {
            this.storedPetsText.setText('No pets stored');
        } else {
            const petNames = this.storedPets.map(petId => {
                const petInfo = this.availablePets.find(p => p.id === petId);
                return petInfo ? petInfo.name : petId;
            }).join(', ');
            this.storedPetsText.setText(`Stored: ${petNames}`);
        }

        // Update withdraw buttons
        this.updateWithdrawButtons();
    }

    updateWithdrawButtons() {
        // Clear existing withdraw buttons
        this.withdrawPetsContainer.removeAll(true);
        this.withdrawPetButtons = [];
        this.actionHighlights = [];

        // Add deposit button highlight
        const depositHighlight = this.scene.add.rectangle(
            0, -70, // Position relative to actionsLabel
            400, 50,
            0xffffff,
            0.2
        );
        depositHighlight.setStrokeStyle(2, 0x22bb44);
        depositHighlight.setVisible(false);
        this.actionHighlights.push(depositHighlight);
        this.storageContainer.add(depositHighlight);

        // Create withdraw button for each stored pet
        if (this.storedPets.length === 0) {
            const noPetsText = this.scene.add.text(0, 0, 'No pets to withdraw', {
                font: '12px monospace',
                fill: '#888888',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.withdrawPetsContainer.add(noPetsText);
        } else {
            this.storedPets.forEach((petId, index) => {
                const petInfo = this.availablePets.find(p => p.id === petId);
                const petName = petInfo ? petInfo.name : petId;
                const yPos = index * 60;

                const button = this.createActionButton(0, yPos, `Withdraw ${petName}`, `${index + 2}`, () => this.withdrawPetByIndex(index));
                this.withdrawPetsContainer.add(button.container);
                this.withdrawPetButtons.push(button);

                // Add highlight for this button
                const highlight = this.scene.add.rectangle(
                    0, yPos,
                    400, 50,
                    0xffffff,
                    0.2
                );
                highlight.setStrokeStyle(2, 0x22bb44);
                highlight.setVisible(false);
                this.actionHighlights.push(highlight);
                this.withdrawPetsContainer.add(highlight);
            });
        }
    }

    depositPet() {
        // Get active pet from pet manager
        let activePetId = null;
        if (this.scene.petManager && this.scene.petManager.activePet) {
            activePetId = this.scene.petManager.activePet.petType || 'red_panda';
        }

        if (!activePetId) {
            this.showFeedback('No pet to deposit!', '#ff6666');
            return;
        }

        // Check if player is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            this.showFeedback('You must be logged in to use pet storage!', '#ff6666');
            return;
        }

        // Unequip the pet locally
        if (this.scene.petManager) {
            this.scene.petManager.unequipPet();
        }

        // Send deposit request to server
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('petStorage:deposit', { petId: activePetId });
            console.log(`🐾 Deposited pet: ${activePetId}`);
        }
    }

    withdrawPetByIndex(index) {
        if (index < 0 || index >= this.storedPets.length) {
            this.showFeedback('Invalid pet selection!', '#ff6666');
            return;
        }

        const petId = this.storedPets[index];

        // Equip the pet locally
        if (this.scene.petManager) {
            // Add to owned pets if not already owned
            if (!this.scene.petManager.ownedPets.has(petId)) {
                this.scene.petManager.ownedPets.add(petId);
            }
            // Equip the pet
            this.scene.petManager.equipPet(petId);
        }

        // Send withdraw request to server
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('petStorage:withdraw', { petId });
            console.log(`🐾 Withdrew pet: ${petId}`);
        }
    }

    showFeedback(message, color) {
        // Create temporary feedback text
        const feedback = this.scene.add.text(0, 200, message, {
            font: 'bold 16px monospace',
            fill: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        feedback.setScrollFactor(0);
        feedback.setDepth(100001);

        this.storageContainer.add(feedback);

        // Fade out and destroy
        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            y: 180,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => feedback.destroy()
        });
    }

    checkPlayerDistance(playerX, playerY) {
        const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
        const inRange = distance < this.interactionRange;

        this.prompt.setVisible(inRange && !this.isStorageOpen);

        return inRange;
    }

    toggleStorage() {
        if (this.isStorageOpen) {
            this.closeStorage();
        } else {
            this.openStorage();
        }
    }

    openStorage() {
        this.isStorageOpen = true;
        this.storageContainer.setVisible(true);
        this.prompt.setVisible(false);

        // Reset controller selection to first option (deposit)
        this.selectedActionIndex = 0;
        this.updateHighlight();

        this.updateDisplay();
        console.log('🐾 Pet Storage opened');
    }

    closeStorage() {
        this.isStorageOpen = false;
        this.storageContainer.setVisible(false);

        // Hide all highlights
        this.actionHighlights.forEach(h => h.setVisible(false));

        console.log('🐾 Pet Storage closed');
    }

    moveSelectionUp() {
        if (!this.isStorageOpen) return;
        const totalOptions = 1 + this.storedPets.length; // 1 for deposit + stored pets
        this.selectedActionIndex = (this.selectedActionIndex - 1 + totalOptions) % totalOptions;
        this.updateHighlight();
        console.log(`🎮 Pet Storage: Selected option ${this.selectedActionIndex}`);
    }

    moveSelectionDown() {
        if (!this.isStorageOpen) return;
        const totalOptions = 1 + this.storedPets.length; // 1 for deposit + stored pets
        this.selectedActionIndex = (this.selectedActionIndex + 1) % totalOptions;
        this.updateHighlight();
        console.log(`🎮 Pet Storage: Selected option ${this.selectedActionIndex}`);
    }

    updateHighlight() {
        // Hide all highlights
        this.actionHighlights.forEach((h, i) => {
            h.setVisible(i === this.selectedActionIndex);
        });
    }

    confirmSelection() {
        if (!this.isStorageOpen) return;

        if (this.selectedActionIndex === 0) {
            // Deposit current pet
            this.depositPet();
        } else {
            // Withdraw pet at index (selectedActionIndex - 1)
            this.withdrawPetByIndex(this.selectedActionIndex - 1);
        }
    }

    setInputMode(mode) {
        const interactButton = mode === 'controller' ? 'Ⓐ' : 'F';
        const closeButton = mode === 'controller' ? 'Start' : 'ESC';

        if (this.promptText) {
            this.promptText.setText(`Press ${interactButton} for Pet Storage`);
        }
        if (this.closeHintText) {
            this.closeHintText.setText(`Press ${interactButton} or ${closeButton} to close`);
        }

        // Update deposit button key hint
        if (this.depositButton && this.depositButton.keyText) {
            if (mode === 'controller') {
                this.depositButton.keyText.setText('[Ⓐ]');
            } else {
                this.depositButton.keyText.setText('[1]');
            }
        }

        // Update withdraw button key hints
        this.withdrawPetButtons.forEach((button, index) => {
            if (button && button.keyText) {
                if (mode === 'controller') {
                    button.keyText.setText('[Ⓐ]');
                } else {
                    button.keyText.setText(`[${index + 2}]`);
                }
            }
        });
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
        if (this.storageContainer) this.storageContainer.destroy();
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.PetStorageNPC = PetStorageNPC;
}
