// Menu Scene - Main menu with class selection
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedClass = 'warrior';
        this.selectedDifficulty = 'normal';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Solid vibrant gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1, 1, 1, 1);
        bg.fillRect(0, 0, width, height);

        // MASSIVE character taking up most of screen
        if (this.textures.exists('malachar')) {
            this.characterSprite = this.add.sprite(width / 2, height / 2 + 40, 'malachar');
            this.characterSprite.setScale(6);
            this.characterSprite.setAlpha(0.95);
            if (this.anims.exists('malachar_idle')) {
                this.characterSprite.play('malachar_idle');
            }
        }

        // Username input - top center, minimal
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.placeholder = 'enter username';
        this.usernameInput.maxLength = 20;
        this.usernameInput.value = localStorage.getItem('klyra_username') || '';
        this.usernameInput.style.cssText = `
            position: absolute;
            left: 50%;
            top: 40px;
            transform: translateX(-50%);
            width: 280px;
            padding: 16px 24px;
            font-family: Arial;
            font-size: 18px;
            background: rgba(255,255,255,0.95);
            border: none;
            border-radius: 50px;
            color: #333;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            outline: none;
        `;
        document.body.appendChild(this.usernameInput);

        // Character name - bottom left
        this.add.text(60, height - 160, 'MALACHAR', {
            font: 'bold 64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        });

        // Simple stat row - bottom left
        const statX = 60;
        const statY = height - 90;

        const statValues = [
            { val: '16', label: 'STR', color: '#ff6b9d' },
            { val: '115', label: 'HP', color: '#c471f5' },
            { val: '10', label: 'DEF', color: '#12d8fa' },
            { val: '9', label: 'SPD', color: '#feca57' }
        ];

        statValues.forEach((stat, i) => {
            const x = statX + (i * 100);

            this.add.text(x, statY, stat.val, {
                font: 'bold 36px Arial',
                fill: stat.color
            });

            this.add.text(x, statY + 40, stat.label, {
                font: '16px Arial',
                fill: 'rgba(255,255,255,0.7)'
            });
        });

        // Giant PLAY button - bottom right
        const playX = width - 180;
        const playY = height - 100;

        const playCircle = this.add.circle(playX, playY, 70, 0xffffff);
        playCircle.setInteractive({ useHandCursor: true });

        this.add.text(playX, playY, '▶', {
            font: 'bold 48px Arial',
            fill: '#667eea'
        }).setOrigin(0.5);

        playCircle.on('pointerover', () => {
            this.tweens.add({
                targets: playCircle,
                scale: 1.1,
                duration: 200
            });
        });

        playCircle.on('pointerout', () => {
            this.tweens.add({
                targets: playCircle,
                scale: 1,
                duration: 200
            });
        });

        playCircle.on('pointerdown', () => {
            this.startGame();
        });

        this.selectedClass = 'malachar';
        this.selectedDifficulty = 'normal';
    }

    startGame() {
        const username = this.usernameInput.value.trim();

        if (!username) {
            this.usernameInput.style.borderColor = '#ff0000';
            this.usernameInput.placeholder = 'Please enter a username!';
            return;
        }

        // Save username
        localStorage.setItem('klyra_username', username);

        // Remove input
        this.usernameInput.remove();

        // Join game
        console.log(`🎮 Joining as ${username} (${this.selectedClass}, ${this.selectedDifficulty})`);
        networkManager.joinGame(username, this.selectedClass, this.selectedDifficulty);

        // Go directly to game (instant join - no lobby)
        this.scene.start('GameScene');
    }

    shutdown() {
        // Clean up input if scene is shut down
        if (this.usernameInput && this.usernameInput.parentNode) {
            this.usernameInput.remove();
        }
    }
}
