// Lobby Scene - Waiting room before game starts
class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
        this.playersList = [];
        this.countdown = null;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Title
        this.add.text(width / 2, 60, 'LOBBY', {
            font: '48px monospace',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Lobby ID
        this.lobbyIdText = this.add.text(width / 2, 120, 'Connecting...', {
            font: '14px monospace',
            fill: '#666666'
        }).setOrigin(0.5);

        // Player count
        this.playerCountText = this.add.text(width / 2, 160, '0 / 10 Players', {
            font: '24px monospace',
            fill: '#00ffff'
        }).setOrigin(0.5);

        // Status text
        this.statusText = this.add.text(width / 2, 200, 'Waiting for players...', {
            font: '18px monospace',
            fill: '#ffff00'
        }).setOrigin(0.5);

        // Countdown text
        this.countdownText = this.add.text(width / 2, 240, '', {
            font: '32px monospace',
            fill: '#ff00ff'
        }).setOrigin(0.5);

        // Players container
        this.playersContainer = this.add.container(width / 2 - 250, 300);

        // Ready button
        this.readyButton = this.add.rectangle(width / 2, height - 100, 250, 60, 0x222222);
        this.readyButton.setStrokeStyle(3, 0x00ff00);
        this.readyButton.setInteractive({ useHandCursor: true });

        this.readyButtonText = this.add.text(width / 2, height - 100, 'READY', {
            font: '24px monospace',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.readyButton.on('pointerover', () => {
            this.readyButton.setFillStyle(0x00ff00, 0.3);
        });

        this.readyButton.on('pointerout', () => {
            this.readyButton.setFillStyle(0x222222);
        });

        this.readyButton.on('pointerdown', () => {
            this.markReady();
        });

        // Back button
        const backButton = this.add.text(30, 30, '< BACK', {
            font: '16px monospace',
            fill: '#ffffff'
        }).setInteractive({ useHandCursor: true });

        backButton.on('pointerover', () => {
            backButton.setFill('#00ff00');
        });

        backButton.on('pointerout', () => {
            backButton.setFill('#ffffff');
        });

        backButton.on('pointerdown', () => {
            networkManager.disconnect();
            this.scene.start('MenuScene');
        });

        // Setup network listeners
        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        // Lobby joined
        networkManager.on('lobby:joined', (data) => {
            this.lobbyIdText.setText(`Lobby: ${data.lobbyId.slice(0, 8)}`);
            this.updatePlayersList(data.players);
            this.updatePlayerCount(data.playerCount, data.maxPlayers);
        });

        // Player joined
        networkManager.on('player:joined', (data) => {
            const players = Array.from(networkManager.players.values());
            this.updatePlayersList(players);
            this.updatePlayerCount(data.playerCount, 10);

            // Show notification
            this.showNotification(`${data.player.username} joined`, 0x00ff00);
        });

        // Player left
        networkManager.on('player:left', (data) => {
            const players = Array.from(networkManager.players.values());
            this.updatePlayersList(players);
            this.updatePlayerCount(data.playerCount, 10);

            this.showNotification(`${data.username} left`, 0xff8800);
        });

        // Player ready
        networkManager.on('player:ready', (data) => {
            this.showNotification(`${data.username} is ready!`, 0x00ffff);
            const players = Array.from(networkManager.players.values());
            this.updatePlayersList(players);
        });

        // Game countdown
        networkManager.on('game:countdown', (data) => {
            this.startCountdown(data.seconds);
        });

        // Game start
        networkManager.on('game:start', (data) => {
            console.log('🎮 Starting game!', data);
            this.scene.start('GameScene', { gameData: data });
        });
    }

    updatePlayersList(players) {
        // Clear existing
        this.playersContainer.removeAll(true);

        players.forEach((player, index) => {
            const y = index * 40;
            const classConfig = GameConfig.CLASSES[player.class];

            // Player box
            const box = this.scene.add.rectangle(0, y, 500, 35, 0x222222);
            box.setStrokeStyle(2, classConfig.color);
            box.setOrigin(0, 0);

            // Username
            const nameText = this.scene.add.text(10, y + 18, player.username, {
                font: '16px monospace',
                fill: '#ffffff'
            }).setOrigin(0, 0.5);

            // Class
            const classText = this.scene.add.text(250, y + 18, classConfig.name, {
                font: '14px monospace',
                fill: Phaser.Display.Color.IntegerToRGB(classConfig.color).rgba
            }).setOrigin(0, 0.5);

            // Ready indicator
            if (player.isReady) {
                const readyText = this.scene.add.text(450, y + 18, '✓', {
                    font: '20px monospace',
                    fill: '#00ff00'
                }).setOrigin(0.5);

                this.playersContainer.add(readyText);
            }

            this.playersContainer.add([box, nameText, classText]);
        });
    }

    updatePlayerCount(current, max) {
        this.playerCountText.setText(`${current} / ${max} Players`);

        if (current >= 4) {
            this.statusText.setText('Waiting for players to ready up...');
        } else {
            this.statusText.setText(`Need ${4 - current} more players to start`);
        }
    }

    markReady() {
        networkManager.playerReady();
        this.readyButtonText.setText('READY ✓');
        this.readyButton.setFillStyle(0x00ff00, 0.5);
        this.readyButton.disableInteractive();
    }

    startCountdown(seconds) {
        this.statusText.setText('GAME STARTING!');
        this.countdown = seconds;

        const timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.countdown--;
                this.countdownText.setText(this.countdown > 0 ? this.countdown : 'GO!');

                if (this.countdown === 0) {
                    timer.remove();
                }
            },
            repeat: seconds
        });

        this.countdownText.setText(seconds);
    }

    showNotification(text, color) {
        const notif = this.add.text(
            this.cameras.main.centerX,
            50,
            text,
            {
                font: '16px monospace',
                fill: Phaser.Display.Color.IntegerToRGB(color).rgba,
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        // Fade out
        this.tweens.add({
            targets: notif,
            alpha: 0,
            y: 30,
            duration: 2000,
            onComplete: () => notif.destroy()
        });
    }

    shutdown() {
        // Clean up listeners
        networkManager.off('lobby:joined');
        networkManager.off('player:joined');
        networkManager.off('player:left');
        networkManager.off('player:ready');
        networkManager.off('game:countdown');
        networkManager.off('game:start');
    }
}
