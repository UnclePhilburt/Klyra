// Character Selection Scene
// Clean and maintainable character picker

class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
        this.selectedCharacter = 'ALDRIC';
        this.username = '';
    }

    init(data) {
        this.username = data.username || localStorage.getItem('klyra_username') || 'Player';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x1a1a2e);

        // Title
        this.add.text(width/2, 30, 'SELECT YOUR CHAMPION', {
            font: '28px "Press Start 2P"',
            fill: '#FFD700'
        }).setOrigin(0.5);

        // Username input at the top
        this.createUsernameInput();

        // Get unlocked characters
        const characters = Object.values(CHARACTERS).filter(c => !c.display.locked);
        const startX = width / 2 - (characters.length * 150) / 2 + 75;
        const y = height / 2 - 20; // Moved up slightly to make room for username

        // Create character cards
        this.characterCards = [];
        characters.forEach((char, index) => {
            const x = startX + index * 150;
            this.createCharacterCard(char, x, y);
        });

        // Select first character by default
        this.selectCharacter('ALDRIC');

        // Character info panel
        this.createInfoPanel();

        // Start button
        this.createStartButton();

        // Instructions
        this.add.text(width/2, height - 40, 'Click character to select • Press ENTER to start', {
            font: '12px "Press Start 2P"',
            fill: '#888888'
        }).setOrigin(0.5);

        // Keyboard support
        this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    }

    createUsernameInput() {
        const width = this.cameras.main.width;

        // Username input field
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.placeholder = 'ENTER USERNAME';
        this.usernameInput.maxLength = 20;
        this.usernameInput.value = this.username || '';
        this.usernameInput.style.cssText = `
            position: absolute;
            left: 50%;
            top: 80px;
            transform: translateX(-50%);
            width: 400px;
            padding: 12px 20px;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            background: rgba(42, 42, 58, 0.9);
            border: 2px solid #FFD700;
            color: #FFD700;
            text-align: center;
            outline: none;
            transition: all 0.3s ease;
        `;
        this.usernameInput.addEventListener('focus', () => {
            this.usernameInput.style.borderColor = '#00ffff';
            this.usernameInput.style.color = '#00ffff';
        });
        this.usernameInput.addEventListener('blur', () => {
            this.usernameInput.style.borderColor = '#FFD700';
            this.usernameInput.style.color = '#FFD700';
            this.username = this.usernameInput.value.trim() || 'Player';
            localStorage.setItem('klyra_username', this.username);
        });
        this.usernameInput.addEventListener('input', () => {
            this.username = this.usernameInput.value.trim() || 'Player';
        });
        document.body.appendChild(this.usernameInput);
    }

    createCharacterCard(char, x, y) {
        const container = this.add.container(x, y);

        // Card background
        const card = this.add.rectangle(0, 0, 120, 160, 0x2a2a3a);
        card.setStrokeStyle(3, char.display.color);

        // Character circle
        const circle = this.add.circle(0, -30, 35, char.display.color);

        // Character name
        const name = this.add.text(0, 35, char.display.name, {
            font: '14px "Press Start 2P"',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Class
        const charClass = this.add.text(0, 55, char.display.class, {
            font: '8px "Press Start 2P"',
            fill: '#888888'
        }).setOrigin(0.5);

        container.add([card, circle, name, charClass]);
        container.setSize(120, 160);
        container.setInteractive();

        // Hover effect
        container.on('pointerover', () => {
            card.setFillStyle(0x3a3a4a);
            this.tweens.add({
                targets: container,
                scale: 1.05,
                duration: 100
            });
        });

        container.on('pointerout', () => {
            if (this.selectedCharacter !== char.id) {
                card.setFillStyle(0x2a2a3a);
            }
            this.tweens.add({
                targets: container,
                scale: 1.0,
                duration: 100
            });
        });

        // Click to select
        container.on('pointerdown', () => {
            this.selectCharacter(char.id);
        });

        this.characterCards.push({ container, card, char });
    }

    selectCharacter(characterId) {
        this.selectedCharacter = characterId;

        // Update all cards
        this.characterCards.forEach(({ container, card, char }) => {
            if (char.id === characterId) {
                card.setFillStyle(0x4a4a5a);
                card.setStrokeStyle(4, char.display.color);
            } else {
                card.setFillStyle(0x2a2a3a);
                card.setStrokeStyle(3, char.display.color);
            }
        });

        // Update info panel
        this.updateInfoPanel(CHARACTERS[characterId]);
    }

    createInfoPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const panelY = height - 180;

        this.infoPanelContainer = this.add.container(width/2, panelY);

        // Panel background
        const panel = this.add.rectangle(0, 0, 600, 140, 0x2a2a3a);
        panel.setStrokeStyle(2, 0x4a4a5a);

        this.charDescription = this.add.text(0, -50, '', {
            font: '10px "Press Start 2P"',
            fill: '#cccccc',
            align: 'center',
            wordWrap: { width: 560 }
        }).setOrigin(0.5);

        this.charStats = this.add.text(-280, -10, '', {
            font: '9px monospace',
            fill: '#ffffff',
            lineSpacing: 4
        });

        this.charPassives = this.add.text(0, -10, '', {
            font: '8px "Press Start 2P"',
            fill: '#FFD700',
            lineSpacing: 6,
            wordWrap: { width: 280 }
        });

        this.infoPanelContainer.add([panel, this.charDescription, this.charStats, this.charPassives]);
    }

    updateInfoPanel(char) {
        this.charDescription.setText(char.display.description);

        const stats = char.stats.base;
        this.charStats.setText(
            `HP:    ${stats.maxHP}\n` +
            `DMG:   ${stats.damage}\n` +
            `SPEED: ${Math.round(stats.moveSpeed)}\n` +
            `CRIT:  ${Math.round(stats.critChance * 100)}%`
        );

        const passiveText = char.passives.map(p => `• ${p.name}\n  ${p.description}`).join('\n\n');
        this.charPassives.setText('PASSIVES:\n' + passiveText);
    }

    createStartButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const button = this.add.rectangle(width/2, height - 60, 200, 50, 0x4a7c59);
        button.setStrokeStyle(3, 0x6a9c79);
        button.setInteractive();

        const buttonText = this.add.text(width/2, height - 60, 'START GAME', {
            font: '14px "Press Start 2P"',
            fill: '#ffffff'
        }).setOrigin(0.5);

        button.on('pointerover', () => {
            button.setFillStyle(0x5a8c69);
            buttonText.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x4a7c59);
            buttonText.setScale(1.0);
        });

        button.on('pointerdown', () => this.startGame());
    }

    startGame() {
        console.log('Starting game with character:', this.selectedCharacter);

        // Validate username
        if (!this.username || this.username === 'Player') {
            if (this.usernameInput) {
                this.usernameInput.style.borderColor = '#ff0000';
                this.usernameInput.placeholder = 'Please enter a username!';
            }
            return;
        }

        // Store selected character
        localStorage.setItem('selectedCharacter', this.selectedCharacter);

        // Remove username input
        if (this.usernameInput && this.usernameInput.parentNode) {
            this.usernameInput.remove();
        }

        // Join game with Socket.IO
        networkManager.joinGame(this.username, this.selectedCharacter);

        // Go to game scene
        this.scene.start('GameScene', {
            username: this.username,
            selectedCharacter: this.selectedCharacter
        });
    }

    shutdown() {
        // Clean up input if scene is shut down
        if (this.usernameInput && this.usernameInput.parentNode) {
            this.usernameInput.remove();
        }
    }
}
