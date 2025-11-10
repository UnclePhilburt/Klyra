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

        // Title
        const title = this.add.text(width / 2, 100, 'KLYRA', {
            font: '64px monospace',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(width / 2, 160, 'Multiplayer Roguelike', {
            font: '20px monospace',
            fill: '#00ffff'
        });
        subtitle.setOrigin(0.5);

        // Username label
        this.add.text(width / 2, 220, 'Username:', {
            font: '18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Username input (HTML element)
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.id = 'username-input';
        this.usernameInput.placeholder = 'Enter your name...';
        this.usernameInput.maxLength = 20;
        this.usernameInput.value = localStorage.getItem('klyra_username') || '';
        this.usernameInput.style.cssText = `
            position: absolute;
            left: 50%;
            top: 250px;
            transform: translateX(-50%);
            width: 300px;
            padding: 10px;
            font-family: monospace;
            font-size: 16px;
            background: #1a1a1a;
            border: 2px solid #00ff00;
            color: #00ff00;
            text-align: center;
        `;
        document.body.appendChild(this.usernameInput);

        // Character Selection - Modern Design
        this.add.text(width / 2, 280, 'SELECT YOUR CHARACTER', {
            font: 'bold 32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Only Malachar for now
        const characters = ['malachar'];
        this.classButtons = [];

        // Create stunning character card
        const cardX = width / 2;
        const cardY = 400;

        // Animated gradient background
        const gradientBg = this.add.graphics();
        gradientBg.fillGradientStyle(0xff0066, 0xff0066, 0x8b00ff, 0x8b00ff, 1, 1, 1, 1);
        gradientBg.fillRoundedRect(cardX - 180, cardY - 120, 360, 240, 20);

        // Pulsing glow effect
        const glow = this.add.graphics();
        glow.fillStyle(0xff0066, 0.3);
        glow.fillRoundedRect(cardX - 190, cardY - 130, 380, 260, 25);
        this.tweens.add({
            targets: glow,
            alpha: 0.6,
            scale: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Character sprite - LARGE
        if (this.textures.exists('malachar')) {
            this.characterSprite = this.add.sprite(cardX - 80, cardY, 'malachar');
            this.characterSprite.setScale(2.5);
            if (this.anims.exists('malachar_idle')) {
                this.characterSprite.play('malachar_idle');
            }

            // Character shadow
            const shadow = this.add.ellipse(cardX - 80, cardY + 80, 100, 30, 0x000000, 0.4);

            // Floating animation
            this.tweens.add({
                targets: this.characterSprite,
                y: cardY - 10,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Character name with neon effect
        const nameText = this.add.text(cardX + 50, cardY - 60, 'MALACHAR', {
            font: 'bold 40px Arial',
            fill: '#ffffff',
            stroke: '#ff0066',
            strokeThickness: 3
        }).setOrigin(0.5);

        const nameShadow = this.add.text(cardX + 52, cardY - 58, 'MALACHAR', {
            font: 'bold 40px Arial',
            fill: '#8b00ff',
            alpha: 0.5
        }).setOrigin(0.5);

        // Character subtitle
        this.add.text(cardX + 50, cardY - 20, 'Dark Berserker', {
            font: 'italic 20px Arial',
            fill: '#ff66cc'
        }).setOrigin(0.5);

        // Stats display - modern cards
        const statsY = cardY + 30;
        const stats = [
            { label: 'STR', value: '16', color: 0xff0066 },
            { label: 'HP', value: '115', color: 0x00ff88 },
            { label: 'DEF', value: '10', color: 0x00ccff },
            { label: 'SPD', value: '9', color: 0xffaa00 }
        ];

        stats.forEach((stat, index) => {
            const statX = cardX - 20 + (index * 80);

            // Stat card
            const statCard = this.add.graphics();
            statCard.fillStyle(0x000000, 0.6);
            statCard.fillRoundedRect(statX - 30, statsY - 15, 60, 50, 8);

            // Stat value - BIG
            this.add.text(statX, statsY, stat.value, {
                font: 'bold 24px Arial',
                fill: Phaser.Display.Color.IntegerToRGB(stat.color).rgba
            }).setOrigin(0.5);

            // Stat label
            this.add.text(statX, statsY + 20, stat.label, {
                font: '12px Arial',
                fill: '#aaaaaa'
            }).setOrigin(0.5);
        });

        // Particle effects around character
        this.createParticles(cardX - 80, cardY);

        this.selectedClass = 'malachar';

        // Difficulty Selection - Modern Pills
        this.add.text(width / 2, 560, 'DIFFICULTY', {
            font: 'bold 24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        const difficulties = ['easy', 'normal', 'hard', 'nightmare'];
        const diffColors = [0x00ff88, 0xffaa00, 0xff4400, 0xff0066];
        const diffIcons = ['✓', '⚔', '☠', '💀'];
        this.diffButtons = [];
        const diffStartX = width / 2 - 300;

        difficulties.forEach((diff, index) => {
            const x = diffStartX + index * 160;
            const y = 610;

            // Pill-shaped button with gradient
            const buttonBg = this.add.graphics();
            buttonBg.fillStyle(0x000000, 0.6);
            buttonBg.fillRoundedRect(x - 70, y - 25, 140, 50, 25);

            const buttonGlow = this.add.graphics();
            buttonGlow.lineStyle(3, diffColors[index], 1);
            buttonGlow.strokeRoundedRect(x - 70, y - 25, 140, 50, 25);

            const button = this.add.rectangle(x, y, 140, 50, 0x000000, 0);
            button.setInteractive({ useHandCursor: true });

            // Icon
            const icon = this.add.text(x - 40, y, diffIcons[index], {
                font: '24px Arial',
                fill: Phaser.Display.Color.IntegerToRGB(diffColors[index]).rgba
            }).setOrigin(0.5);

            // Text
            const text = this.add.text(x + 10, y, diff.toUpperCase(), {
                font: 'bold 16px Arial',
                fill: Phaser.Display.Color.IntegerToRGB(diffColors[index]).rgba
            });
            text.setOrigin(0.5);

            button.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(diffColors[index], 0.2);
                buttonBg.fillRoundedRect(x - 70, y - 25, 140, 50, 25);
                this.tweens.add({
                    targets: [icon, text],
                    scale: 1.1,
                    duration: 100
                });
            });

            button.on('pointerout', () => {
                if (diff !== this.selectedDifficulty) {
                    buttonBg.clear();
                    buttonBg.fillStyle(0x000000, 0.6);
                    buttonBg.fillRoundedRect(x - 70, y - 25, 140, 50, 25);
                }
                this.tweens.add({
                    targets: [icon, text],
                    scale: 1,
                    duration: 100
                });
            });

            button.on('pointerdown', () => {
                this.selectDifficulty(diff);
            });

            this.diffButtons.push({ button, buttonBg, buttonGlow, text, icon, difficulty: diff, color: diffColors[index], x, y });
        });

        // EPIC Play button with animations
        const playY = height - 60;

        // Outer glow
        const playGlow = this.add.graphics();
        playGlow.fillStyle(0x00ff88, 0.3);
        playGlow.fillRoundedRect(width / 2 - 125, playY - 32, 250, 64, 32);
        this.tweens.add({
            targets: playGlow,
            scale: 1.1,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Button gradient background
        const playBg = this.add.graphics();
        playBg.fillGradientStyle(0x00ff88, 0x00ff88, 0x00cc66, 0x00cc66, 1, 1, 1, 1);
        playBg.fillRoundedRect(width / 2 - 120, playY - 30, 240, 60, 30);

        const playButton = this.add.rectangle(width / 2, playY, 240, 60, 0x000000, 0);
        playButton.setInteractive({ useHandCursor: true });

        const playText = this.add.text(width / 2, playY, 'START GAME', {
            font: 'bold 28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        playText.setOrigin(0.5);

        // Sparkles
        const sparkle1 = this.add.text(width / 2 - 100, playY, '✦', {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        const sparkle2 = this.add.text(width / 2 + 100, playY, '✦', {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: [sparkle1, sparkle2],
            alpha: 0.3,
            scale: 1.5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        playButton.on('pointerover', () => {
            playBg.clear();
            playBg.fillGradientStyle(0x00ffaa, 0x00ffaa, 0x00ee88, 0x00ee88, 1, 1, 1, 1);
            playBg.fillRoundedRect(width / 2 - 120, playY - 30, 240, 60, 30);
            this.tweens.add({
                targets: playText,
                scale: 1.1,
                duration: 100
            });
        });

        playButton.on('pointerout', () => {
            playBg.clear();
            playBg.fillGradientStyle(0x00ff88, 0x00ff88, 0x00cc66, 0x00cc66, 1, 1, 1, 1);
            playBg.fillRoundedRect(width / 2 - 120, playY - 30, 240, 60, 30);
            this.tweens.add({
                targets: playText,
                scale: 1,
                duration: 100
            });
        });

        playButton.on('pointerdown', () => {
            this.startGame();
        });

        // Select default
        this.selectDifficulty('normal');

        // Version text
        this.add.text(10, height - 30, 'v2.0', {
            font: '12px monospace',
            fill: '#666666'
        });
    }

    createParticles(x, y) {
        // Create particle emitters around character
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const distance = 150;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;

            const particle = this.add.circle(px, py, 3, 0xff0066, 0.6);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * (distance + 20),
                y: y + Math.sin(angle) * (distance + 20),
                alpha: 0,
                duration: 2000 + Math.random() * 1000,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }
    }

    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;

        this.diffButtons.forEach(btn => {
            if (btn.difficulty === difficulty) {
                btn.buttonBg.clear();
                btn.buttonBg.fillStyle(btn.color, 0.4);
                btn.buttonBg.fillRoundedRect(btn.x - 70, btn.y - 25, 140, 50, 25);
                btn.buttonGlow.lineStyle(3, btn.color, 1);
            } else {
                btn.buttonBg.clear();
                btn.buttonBg.fillStyle(0x000000, 0.6);
                btn.buttonBg.fillRoundedRect(btn.x - 70, btn.y - 25, 140, 50, 25);
            }
        });
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
