// Menu Scene - Glassmorphism character select
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedClass = 'malachar';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // WHITE background
        this.cameras.main.setBackgroundColor('#f5f7fa');

        // Colorful gradient orbs floating around (glassmorphism style)
        const orb1 = this.add.circle(width * 0.2, height * 0.3, 200, 0xff6b9d, 0.3);
        const orb2 = this.add.circle(width * 0.8, height * 0.2, 250, 0x12d8fa, 0.3);
        const orb3 = this.add.circle(width * 0.7, height * 0.8, 180, 0xc471f5, 0.3);
        const orb4 = this.add.circle(width * 0.1, height * 0.7, 220, 0xfeca57, 0.3);
        const orb5 = this.add.circle(width * 0.5, height * 0.1, 150, 0x6366f1, 0.25);

        // Animate orbs (floating effect)
        [orb1, orb2, orb3, orb4, orb5].forEach((orb, i) => {
            this.tweens.add({
                targets: orb,
                y: orb.y + (i % 2 === 0 ? 30 : -30),
                x: orb.x + (i % 2 === 0 ? 20 : -20),
                duration: 4000 + i * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Center glass card
        const cardX = width * 0.5;
        const cardY = height * 0.5;
        const cardWidth = 900;
        const cardHeight = 550;

        // Glass card background (simulated blur with multiple layers)
        const glassCard = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, 0xffffff, 0.2);
        glassCard.setStrokeStyle(2, 0xffffff, 0.5);

        // Inner glow for glass effect
        const innerGlow = this.add.rectangle(cardX, cardY, cardWidth - 4, cardHeight - 4, 0xffffff, 0.4);

        // Character on left side of card
        const charX = cardX - 250;
        const charY = cardY;

        if (this.textures.exists('malachar')) {
            this.characterSprite = this.add.sprite(charX, charY, 'malachar');
            this.characterSprite.setScale(7);
            this.characterSprite.setDepth(10);

            // Breathing animation
            this.tweens.add({
                targets: this.characterSprite,
                scaleX: 7.15,
                scaleY: 7.15,
                duration: 2500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            if (this.anims.exists('malachar_idle')) {
                this.characterSprite.play('malachar_idle');
            }

            // Colorful glow behind character
            const characterGlow = this.add.circle(charX, charY, 200, 0xff6b9d, 0.15);
            characterGlow.setDepth(5);
            this.tweens.add({
                targets: characterGlow,
                fillColor: { from: 0xff6b9d, to: 0xc471f5 },
                alpha: { from: 0.15, to: 0.25 },
                scale: { from: 1, to: 1.1 },
                duration: 3000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Right side - Character info
        const infoX = cardX + 180;
        const infoY = cardY - 180;

        // Character name
        this.add.text(infoX, infoY, 'MALACHAR', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '48px',
            fontStyle: 'bold',
            fill: '#2d3748',
            letterSpacing: 3
        }).setOrigin(0.5);

        // Subtitle with gradient text effect
        this.add.text(infoX, infoY + 50, 'SHADOW WARRIOR', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fill: '#718096',
            letterSpacing: 4
        }).setOrigin(0.5);

        // Stats in 2x2 grid with colorful glass cards
        const stats = [
            { label: 'STRENGTH', value: 16, color: 0xff6b9d, x: -90, y: 0 },
            { label: 'HEALTH', value: 115, color: 0xc471f5, x: 90, y: 0 },
            { label: 'DEFENSE', value: 10, color: 0x12d8fa, x: -90, y: 100 },
            { label: 'SPEED', value: 9, color: 0xfeca57, x: 90, y: 100 }
        ];

        stats.forEach(stat => {
            const statX = infoX + stat.x;
            const statY = infoY + 130 + stat.y;

            // Colorful glass card for each stat
            const statCard = this.add.rectangle(statX, statY, 150, 70, stat.color, 0.15);
            statCard.setStrokeStyle(2, stat.color, 0.4);

            // Stat value
            this.add.text(statX, statY - 10, stat.value.toString(), {
                fontFamily: 'Arial, sans-serif',
                fontSize: '32px',
                fontStyle: 'bold',
                fill: '#2d3748'
            }).setOrigin(0.5);

            // Stat label
            this.add.text(statX, statY + 22, stat.label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                fill: '#718096',
                letterSpacing: 1
            }).setOrigin(0.5);
        });

        // Username input with glassmorphism
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.placeholder = 'Enter your username';
        this.usernameInput.maxLength = 20;
        this.usernameInput.value = localStorage.getItem('klyra_username') || '';
        this.usernameInput.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${cardY + 150}px;
            transform: translateX(-50%);
            width: 400px;
            padding: 16px 24px;
            font-family: Arial, sans-serif;
            font-size: 15px;
            font-weight: 500;
            background: rgba(255, 255, 255, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 16px;
            color: #2d3748;
            text-align: center;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            outline: none;
            transition: all 0.3s ease;
        `;
        this.usernameInput.addEventListener('focus', () => {
            this.usernameInput.style.background = 'rgba(255, 255, 255, 0.9)';
            this.usernameInput.style.borderColor = 'rgba(99, 102, 241, 0.6)';
            this.usernameInput.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.3)';
        });
        this.usernameInput.addEventListener('blur', () => {
            this.usernameInput.style.background = 'rgba(255, 255, 255, 0.7)';
            this.usernameInput.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            this.usernameInput.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
        });
        document.body.appendChild(this.usernameInput);

        // Play button with gradient glass effect
        const playButton = this.add.rectangle(cardX, cardY + 220, 400, 56, 0x6366f1, 0.8);
        playButton.setInteractive({ useHandCursor: true });
        playButton.setStrokeStyle(2, 0xffffff, 0.6);

        const playText = this.add.text(cardX, cardY + 220, 'ENTER GAME', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            fill: '#ffffff',
            letterSpacing: 3
        }).setOrigin(0.5);

        // Button hover effects
        playButton.on('pointerover', () => {
            this.tweens.add({
                targets: playButton,
                scaleX: 1.03,
                scaleY: 1.08,
                alpha: 1,
                duration: 250,
                ease: 'Back.easeOut'
            });
        });

        playButton.on('pointerout', () => {
            this.tweens.add({
                targets: playButton,
                scaleX: 1,
                scaleY: 1,
                alpha: 0.8,
                duration: 250
            });
        });

        playButton.on('pointerdown', () => {
            this.startGame();
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
