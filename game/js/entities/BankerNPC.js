// Banker NPC - Manages soul banking (deposit/withdraw)
class BankerNPC {
    constructor(scene, x, y, name = 'Soul Banker') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80;
        this.isBankOpen = false;

        // Bank data
        this.bankedSouls = 0;
        this.carriedSouls = 0;

        this.createSprite();
        this.createPrompt();
        this.createBankUI();
        this.setupKeyboardControls();

        // Fetch bank data from server
        this.fetchBankData();
    }

    createSprite() {
        // Create animated sprite from frames (using merchant sprite for now)
        this.sprite = this.scene.add.sprite(this.x, this.y, 'merchant_1');
        this.sprite.setDepth(5);
        this.sprite.setScale(1.5);
        this.sprite.setTint(0xffaa00); // Orange tint to differentiate from merchant

        // Create animation if it doesn't exist
        if (!this.scene.anims.exists('banker_idle')) {
            this.scene.anims.create({
                key: 'banker_idle',
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
        this.sprite.play('banker_idle');

        // Name label
        this.nameLabel = this.scene.add.text(
            this.x, this.y - 40,
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
        this.prompt = this.scene.add.container(this.x, this.y - 70);
        this.prompt.setDepth(1000);
        this.prompt.setScrollFactor(1, 1);

        // Background (wider to accommodate text)
        const bg = this.scene.add.rectangle(0, 0, 240, 35, 0x000000, 0.85);
        bg.setStrokeStyle(2, 0xffaa00);

        // Text
        this.promptText = this.scene.add.text(0, 0, 'Press F to Bank', {
            font: 'bold 13px monospace',
            fill: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.prompt.add([bg, this.promptText]);
        this.prompt.setVisible(false);
    }

    createBankUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Bank container
        this.bankContainer = this.scene.add.container(width / 2, height / 2);
        this.bankContainer.setScrollFactor(0);
        this.bankContainer.setDepth(100000);
        this.bankContainer.setVisible(false);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 600, 350, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(3, 0xffaa00);

        // Title
        const title = this.scene.add.text(0, -210, 'SOUL BANKER', {
            font: 'bold 24px monospace',
            fill: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Description
        const desc = this.scene.add.text(0, -175, 'Permanently deposit souls to unlock characters', {
            font: '12px monospace',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Carried souls display
        this.carriedSoulsText = this.scene.add.text(0, -120, 'Carried Souls: 0', {
            font: 'bold 18px monospace',
            fill: '#9d00ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Banked souls display
        this.bankedSoulsText = this.scene.add.text(0, -85, 'Banked Souls: 0', {
            font: 'bold 18px monospace',
            fill: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Deposit section
        const depositBg = this.scene.add.rectangle(0, 20, 550, 120, 0x2a2a3e, 1);
        depositBg.setStrokeStyle(2, 0x66ff66);

        const depositTitle = this.scene.add.text(0, -30, 'DEPOSIT SOULS', {
            font: 'bold 18px monospace',
            fill: '#66ff66',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        const depositInstructions = this.scene.add.text(0, 10, 'Press [1] to deposit 10 | [2] to deposit 50 | [3] to deposit ALL', {
            font: '12px monospace',
            fill: '#cccccc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        const depositNote = this.scene.add.text(0, 50, 'Souls are permanently stored and cannot be withdrawn', {
            font: '11px monospace',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Close hint
        this.closeHintText = this.scene.add.text(0, 140, 'Press F or ESC to close', {
            font: '12px monospace',
            fill: '#666666',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.bankContainer.add([
            bg, title, desc,
            this.carriedSoulsText, this.bankedSoulsText,
            depositBg, depositTitle, depositInstructions, depositNote,
            this.closeHintText
        ]);
    }

    setupKeyboardControls() {
        // Deposit keys 1-3
        const depositKey1 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        depositKey1.on('down', () => {
            if (this.isBankOpen) this.deposit(10);
        });

        const depositKey2 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        depositKey2.on('down', () => {
            if (this.isBankOpen) this.deposit(50);
        });

        const depositKey3 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        depositKey3.on('down', () => {
            if (this.isBankOpen) this.deposit(this.carriedSouls);
        });
    }

    fetchBankData() {
        // Get token from localStorage
        const token = localStorage.getItem('klyra_token');
        if (!token) {
            console.log('⚠️ No token found - player not logged in');
            return;
        }

        // Request bank data from server
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('bank:getData', { token });
        }
    }

    updateBankData(bankedSouls) {
        this.bankedSouls = bankedSouls;
        this.updateDisplay();
    }

    updateDisplay() {
        this.carriedSouls = this.scene.modernHUD ? this.scene.modernHUD.getCurrency() : 0;
        this.carriedSoulsText.setText(`Carried Souls: ${this.carriedSouls}`);
        this.bankedSoulsText.setText(`Banked Souls: ${this.bankedSouls}`);
    }

    deposit(amount) {
        if (amount <= 0) {
            this.showFeedback('Invalid Amount!', '#ff6666');
            return;
        }

        if (this.carriedSouls < amount) {
            this.showFeedback('Not Enough Souls!', '#ff6666');
            return;
        }

        // Get token
        const token = localStorage.getItem('klyra_token');
        if (!token) {
            this.showFeedback('Not Logged In!', '#ff6666');
            return;
        }

        // Send deposit request to server
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('bank:deposit', { amount, token });

            // Optimistically update UI (server will confirm)
            if (this.scene.modernHUD) {
                this.scene.modernHUD.addCurrency(-amount);
            }
            this.bankedSouls += amount;
            this.updateDisplay();
            this.showFeedback(`Deposited ${amount} Souls!`, '#00ff00');
            console.log(`💰 Deposited ${amount} souls to bank`);
        }
    }

    withdraw(amount) {
        if (amount <= 0) {
            this.showFeedback('Invalid Amount!', '#ff6666');
            return;
        }

        if (this.bankedSouls < amount) {
            this.showFeedback('Not Enough Banked Souls!', '#ff6666');
            return;
        }

        // Get token
        const token = localStorage.getItem('klyra_token');
        if (!token) {
            this.showFeedback('Not Logged In!', '#ff6666');
            return;
        }

        // Send withdraw request to server
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('bank:withdraw', { amount, token });

            // Optimistically update UI (server will confirm)
            if (this.scene.modernHUD) {
                this.scene.modernHUD.addCurrency(amount);
            }
            this.bankedSouls -= amount;
            this.updateDisplay();
            this.showFeedback(`Withdrew ${amount} Souls!`, '#00ff00');
            console.log(`💰 Withdrew ${amount} souls from bank`);
        }
    }

    checkPlayerDistance(playerX, playerY) {
        const dist = Phaser.Math.Distance.Between(
            playerX, playerY,
            this.x, this.y
        );

        const isInRange = dist < this.interactionRange;

        // Update prompt text based on login status
        if (isInRange && !this.isBankOpen) {
            const token = localStorage.getItem('klyra_token');
            if (!token) {
                this.promptText.setText('Login Required');
                this.promptText.setStyle({ fill: '#ff6666' });
            } else {
                this.promptText.setText('Press F to Bank');
                this.promptText.setStyle({ fill: '#ffaa00' });
            }
        }

        this.prompt.setVisible(isInRange && !this.isBankOpen);

        return isInRange;
    }

    openBank() {
        // Check if player is logged in
        const token = localStorage.getItem('klyra_token');
        if (!token) {
            this.showFeedback('You must be logged in to use the bank!', '#ff6666');
            console.log('⚠️ Player not logged in - cannot access bank');
            return;
        }

        this.isBankOpen = true;
        this.bankContainer.setVisible(true);
        this.prompt.setVisible(false);
        this.updateDisplay();
        console.log('💰 Soul bank opened');
    }

    closeBank() {
        this.isBankOpen = false;
        this.bankContainer.setVisible(false);
        console.log('💰 Soul bank closed');
    }

    toggleBank() {
        if (this.isBankOpen) {
            this.closeBank();
        } else {
            this.openBank();
        }
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

    setInputMode(mode) {
        const interactButton = mode === 'controller' ? 'A' : 'F';
        const closeButton = mode === 'controller' ? 'Start' : 'ESC';

        if (this.promptText) {
            this.promptText.setText(`Press ${interactButton} to Bank`);
        }
        if (this.closeHintText) {
            this.closeHintText.setText(`Press ${interactButton} or ${closeButton} to close`);
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.nameLabel) this.nameLabel.destroy();
        if (this.prompt) this.prompt.destroy();
        if (this.bankContainer) this.bankContainer.destroy();
    }
}
