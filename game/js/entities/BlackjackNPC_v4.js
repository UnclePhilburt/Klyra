// Multiplayer Blackjack NPC - HIGH ROLLER CASINO EDITION
// Deep burgundy felt, gold accents, card animations, arc layout
class BlackjackNPC {
    constructor(scene, x, y, name = 'Dealer') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80;
        this.isGameOpen = false;

        // Multiplayer state
        this.gameState = null;
        this.previousGameState = null;
        this.isSpectating = false;
        this.networkListenersSetup = false;

        // Animation tracking
        this.dealingCards = false;
        this.hasShuffledThisRound = false;
        this.cardAnimations = [];
        this.animatingCards = new Set(); // Track cards currently animating

        // Controller selection
        this.selectedActionIndex = 0;
        this.selectedBetIndex = 0;
        this.actionButtons = []; // Will store all action button references
        this.actionHighlights = []; // Will store highlight rectangles
        this.betHighlights = []; // Will store bet chip highlight rectangles

        this.createSprite();
        this.createPrompt();
        this.createGameUI();
        this.setupKeyboardControls();

        if (typeof networkManager !== 'undefined' && networkManager.socket) {
            this.setupNetworkListeners();
        }
    }

    createSprite() {
        this.sprite = this.scene.add.sprite(this.x, this.y, 'merchant_1');
        this.sprite.setDepth(this.y);
        this.sprite.setScale(1.5);
        this.sprite.setTint(0x228822);

        if (!this.scene.anims.exists('dealer_idle')) {
            this.scene.anims.create({
                key: 'dealer_idle',
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

        this.sprite.play('dealer_idle');
    }

    createPrompt() {
        this.promptText = this.scene.add.text(this.x, this.y - 60, '[F] High Roller Blackjack', {
            font: 'bold 16px Arial',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        });
        this.promptText.setOrigin(0.5);
        this.promptText.setDepth(this.y + 1000);
        this.promptText.setVisible(false);
    }

    async createGameUI() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const baseDepth = 100000;

        console.log('BlackjackNPC createGameUI: width =', width, 'height =', height);

        this.uiElements = [];

        // Load blackjack.ldtk to get player positions
        await this.loadBlackjackPositions();

        this.MAX_PLAYERS = 6;

        // === BLACKJACK TABLE BACKGROUND IMAGE ===
        this.tableImage = this.scene.add.image(width / 2, height / 2, 'blackjack_table');
        this.tableImage.setScrollFactor(0);
        this.tableImage.setDepth(baseDepth);
        this.tableImage.setVisible(false);

        // Scale to fit screen (table PNG is small, need to scale up but not too much)
        const scaleX = (width * 0.9) / this.tableImage.width;
        const scaleY = (height * 0.85) / this.tableImage.height;
        const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit entirely
        this.tableImage.setScale(scale);

        this.uiElements.push(this.tableImage);

        // === DEALER AREA (TOP CENTER) ===
        this.dealerLabel = this.scene.add.text(width / 2, height * 0.18, 'DEALER', {
            font: 'bold 20px Georgia',
            fill: '#F5DEB3', // Cream color
            stroke: '#000000',
            strokeThickness: 2
        });
        this.dealerLabel.setOrigin(0.5);
        this.dealerLabel.setScrollFactor(0);
        this.dealerLabel.setDepth(baseDepth + 10);
        this.dealerLabel.setVisible(false);
        this.uiElements.push(this.dealerLabel);

        // Dealer cards container
        this.dealerCardsContainer = this.scene.add.container(width / 2, height * 0.28);
        this.dealerCardsContainer.setScrollFactor(0);
        this.dealerCardsContainer.setDepth(baseDepth + 15);
        this.dealerCardsContainer.setVisible(false);
        this.uiElements.push(this.dealerCardsContainer);

        // === PLAYER POSITIONS (ARC LAYOUT) ===
        // Container for all player positions
        this.playersContainer = this.scene.add.container(width / 2, height * 0.75);
        this.playersContainer.setScrollFactor(0);
        this.playersContainer.setDepth(baseDepth + 15);
        this.playersContainer.setVisible(false);
        this.uiElements.push(this.playersContainer);

        // === STATUS TEXT (CENTER) ===
        this.statusText = this.scene.add.text(width / 2, height * 0.5, '', {
            font: 'bold 18px Georgia',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        this.statusText.setOrigin(0.5);
        this.statusText.setScrollFactor(0);
        this.statusText.setDepth(baseDepth + 20);
        this.statusText.setVisible(false);
        this.uiElements.push(this.statusText);

        // === JOIN BUTTON (SPECTATOR) ===
        this.joinButton = this.createGoldButton(width / 2, height * 0.85 - 300, 'JOIN NEXT ROUND', () => {
            this.joinNextRound();
        });
        // Elements are tracked in uiElements, will be hidden initially

        // === BETTING CHIPS ===
        // Soul count display
        this.soulCountText = this.scene.add.text(width / 2, height * 0.78 - 150, 'YOUR SOULS: 0', {
            font: 'bold 20px Georgia',
            fill: '#9D00FF',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.soulCountText.setOrigin(0.5);
        this.soulCountText.setScrollFactor(0);
        this.soulCountText.setDepth(baseDepth + 20);
        this.soulCountText.setVisible(false);
        this.uiElements.push(this.soulCountText);

        this.betLabel = this.scene.add.text(width / 2, height * 0.78 - 100, 'PLACE YOUR BET', {
            font: 'bold 18px Georgia',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.betLabel.setOrigin(0.5);
        this.betLabel.setScrollFactor(0);
        this.betLabel.setDepth(baseDepth + 20);
        this.betLabel.setVisible(false);
        this.uiElements.push(this.betLabel);

        // Casino chip buttons
        this.betButtons = [];
        const betAmounts = [5, 10, 25, 50];
        const chipSpacing = 90;
        const startX = -(betAmounts.length * chipSpacing) / 2 + chipSpacing / 2;

        betAmounts.forEach((amount, index) => {
            const chip = this.createCasinoChip(
                width / 2 + startX + index * chipSpacing,
                height * 0.85 - 100,
                amount,
                index + 1
            );
            this.betButtons.push(chip);

            // Create controller highlight for this bet chip
            const highlight = this.scene.add.circle(
                width / 2 + startX + index * chipSpacing,
                height * 0.85 - 100,
                50,
                0x000000,
                0
            );
            highlight.setStrokeStyle(4, 0xffff00);
            highlight.setScrollFactor(0);
            highlight.setDepth(baseDepth + 19); // Just below chips
            highlight.setVisible(false);
            this.betHighlights.push(highlight);
            this.uiElements.push(highlight);
        });

        // === ACTION BUTTONS (HIT/STAND/DOUBLE/SPLIT/INSURANCE) ===
        this.actionContainer = this.scene.add.container(width / 2, height * 0.88);
        this.actionContainer.setScrollFactor(0);
        this.actionContainer.setDepth(baseDepth + 20);
        this.actionContainer.setVisible(false);
        this.uiElements.push(this.actionContainer);

        const hitBtn = this.createActionButton(-280, 0, 'HIT', 'W', 0x228B22, () => this.hit());
        const standBtn = this.createActionButton(-140, 0, 'STAND', 'S', 0x8B0000, () => this.stand());
        this.doubleBtn = this.createActionButton(0, 0, 'DOUBLE', 'D', 0xFF8C00, () => this.doubleDown());
        this.splitBtn = this.createActionButton(140, 0, 'SPLIT', 'A', 0x4169E1, () => this.split());
        this.insuranceBtn = this.createActionButton(280, 0, 'INSURE', 'Q', 0x9400D3, () => this.insurance());

        // Store action buttons for controller navigation
        this.actionButtons = [hitBtn, standBtn, this.doubleBtn, this.splitBtn, this.insuranceBtn];

        // Create controller selection highlights for each button
        const buttonPositions = [-280, -140, 0, 140, 280];
        buttonPositions.forEach((xPos, index) => {
            const highlight = this.scene.add.rectangle(xPos, 0, 140, 60, 0x000000, 0);
            highlight.setStrokeStyle(4, 0xffff00);
            highlight.setVisible(false);
            this.actionHighlights.push(highlight);
            this.actionContainer.add(highlight);
        });

        this.actionContainer.add([hitBtn.bg, hitBtn.text, hitBtn.keyHint]);
        this.actionContainer.add([standBtn.bg, standBtn.text, standBtn.keyHint]);
        this.actionContainer.add([this.doubleBtn.bg, this.doubleBtn.text, this.doubleBtn.keyHint]);
        this.actionContainer.add([this.splitBtn.bg, this.splitBtn.text, this.splitBtn.keyHint]);
        this.actionContainer.add([this.insuranceBtn.bg, this.insuranceBtn.text, this.insuranceBtn.keyHint]);

        // Start with special buttons hidden
        this.doubleBtn.bg.setVisible(false);
        this.doubleBtn.text.setVisible(false);
        this.doubleBtn.keyHint.setVisible(false);
        this.splitBtn.bg.setVisible(false);
        this.splitBtn.text.setVisible(false);
        this.splitBtn.keyHint.setVisible(false);
        this.insuranceBtn.bg.setVisible(false);
        this.insuranceBtn.text.setVisible(false);
        this.insuranceBtn.keyHint.setVisible(false);

        // === CLOSE HINT ===
        this.closeHint = this.scene.add.text(width / 2, height * 0.96, 'ESC or F to Close', {
            font: '14px Arial',
            fill: '#999999'
        });
        this.closeHint.setOrigin(0.5);
        this.closeHint.setScrollFactor(0);
        this.closeHint.setDepth(baseDepth + 20);
        this.closeHint.setVisible(false);
        this.uiElements.push(this.closeHint);
    }

    createGoldButton(x, y, text, callback) {
        const btn = this.scene.add.rectangle(x, y, 280, 55, 0xDAA520, 1);
        btn.setStrokeStyle(3, 0xFFD700, 1);
        btn.setScrollFactor(0);
        btn.setDepth(100020);
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', callback);
        btn.on('pointerover', () => btn.setFillStyle(0xFFD700));
        btn.on('pointerout', () => btn.setFillStyle(0xDAA520));
        btn.setVisible(false);
        this.uiElements.push(btn);

        const btnText = this.scene.add.text(x, y, text, {
            font: 'bold 20px Georgia',
            fill: '#000000'
        });
        btnText.setOrigin(0.5);
        btnText.setScrollFactor(0);
        btnText.setDepth(100021);
        btnText.setVisible(false);
        this.uiElements.push(btnText);

        return { bg: btn, text: btnText };
    }

    createCasinoChip(x, y, amount, keyNum) {
        const baseDepth = 100020;

        // Soul-themed purple buttons with white numbers
        const soulRadius = 38;

        // Outer glow (purple)
        const outerGlow = this.scene.add.circle(x, y, soulRadius, 0x9d00ff, 0.4);
        outerGlow.setScrollFactor(0);
        outerGlow.setDepth(baseDepth);
        outerGlow.setVisible(false);
        this.uiElements.push(outerGlow);

        // Inner highlight (light purple)
        const innerGlow = this.scene.add.circle(x, y - 8, 12, 0xB366FF, 0.7);
        innerGlow.setScrollFactor(0);
        innerGlow.setDepth(baseDepth + 2);
        innerGlow.setVisible(false);
        this.uiElements.push(innerGlow);

        // Amount text (white, bold)
        const amountText = this.scene.add.text(x, y - 5, `${amount}`, {
            font: 'bold 24px Arial',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        });
        amountText.setOrigin(0.5);
        amountText.setScrollFactor(0);
        amountText.setDepth(baseDepth + 3);
        amountText.setVisible(false);
        this.uiElements.push(amountText);

        // "SOULS" label
        const soulsLabel = this.scene.add.text(x, y + 12, 'SOULS', {
            font: 'bold 10px Arial',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        });
        soulsLabel.setOrigin(0.5);
        soulsLabel.setScrollFactor(0);
        soulsLabel.setDepth(baseDepth + 3);
        soulsLabel.setVisible(false);
        this.uiElements.push(soulsLabel);

        // Main soul circle (darker purple) - created after text elements so hover handlers can reference them
        const soulCircle = this.scene.add.circle(x, y, soulRadius - 6, 0x6B00B8, 1);
        soulCircle.setStrokeStyle(3, 0x9d00ff, 1);
        soulCircle.setScrollFactor(0);
        soulCircle.setDepth(baseDepth + 1);
        soulCircle.setInteractive({ useHandCursor: true });
        soulCircle.on('pointerdown', () => this.placeBet(amount));
        soulCircle.on('pointerover', () => {
            this.scene.tweens.add({
                targets: [outerGlow, soulCircle, innerGlow],
                scale: 1.15,
                y: y - 8,
                duration: 150,
                ease: 'Back.easeOut'
            });
            amountText.setScale(1.15);
            amountText.y = y - 13; // Adjusted for new position
            soulsLabel.setScale(1.15);
            soulsLabel.y = y + 4; // Adjusted for new position
        });
        soulCircle.on('pointerout', () => {
            this.scene.tweens.add({
                targets: [outerGlow, soulCircle, innerGlow],
                scale: 1.0,
                y: y,
                duration: 150,
                ease: 'Sine.easeOut'
            });
            amountText.setScale(1.0);
            amountText.y = y - 5;
            soulsLabel.setScale(1.0);
            soulsLabel.y = y + 12;
        });
        soulCircle.setVisible(false);
        this.uiElements.push(soulCircle);

        // Key hint
        const keyHint = this.scene.add.text(x, y + 50, `[${keyNum}]`, {
            font: 'bold 12px Arial',
            fill: '#9d00ff',
            stroke: '#000000',
            strokeThickness: 2
        });
        keyHint.setOrigin(0.5);
        keyHint.setScrollFactor(0);
        keyHint.setDepth(baseDepth + 3);
        keyHint.setVisible(false);
        this.uiElements.push(keyHint);

        return { outer: outerGlow, inner: soulCircle, text: amountText, soulsLabel, keyHint, amount };
    }

    createActionButton(x, y, label, key, color, callback) {
        const bg = this.scene.add.rectangle(x, y, 130, 50, color, 1);
        bg.setStrokeStyle(3, 0xFFD700, 1);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', callback);
        bg.on('pointerover', () => {
            bg.setFillStyle(0xFFD700);
            bg.setScale(1.05);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(color);
            bg.setScale(1);
        });

        const text = this.scene.add.text(x, y - 3, label, {
            font: 'bold 16px Georgia',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);

        const keyHint = this.scene.add.text(x, y + 18, `[${key}]`, {
            font: '12px Arial',
            fill: '#FFD700'
        });
        keyHint.setOrigin(0.5);

        return { bg, text, keyHint };
    }

    // Card creation using pixel art PNGs
    createCardSprite(card, x, y, scale = 1.0) {
        // Map server card format to PNG filename
        // Server sends: { suit: 'hearts', value: '10' }
        // We need: '10_hearts'
        const suit = card.suit;
        const value = card.value || card.rank; // Handle both formats

        const cardKey = `${value}_${suit}`;

        // Create sprite
        const cardSprite = this.scene.add.sprite(x, y, cardKey);
        cardSprite.setScale(scale);

        // Add shadow effect
        cardSprite.setTint(0xFFFFFF);

        return cardSprite;
    }

    // Create card back (face-down card)
    createCardBack(x, y, scale = 1.0) {
        const cardBack = this.scene.add.sprite(x, y, 'card_back');
        cardBack.setScale(scale);
        return cardBack;
    }

    playShuffleAnimation() {
        // Play shuffle sound
        this.scene.sound.play('cardshuffle', { volume: 0.6 });

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const baseDepth = 100020;

        // Create all 52 cards for shuffle animation
        const numCards = 52;
        const cards = [];

        for (let i = 0; i < numCards; i++) {
            // Start cards in two piles (left and right of center)
            const pile = i % 2;
            const startX = centerX + (pile === 0 ? -150 : 150);
            const startY = centerY + (Math.random() - 0.5) * 50;

            const card = this.scene.add.sprite(startX, startY, 'card_back');
            card.setScale(0.9);
            card.setScrollFactor(0);
            card.setDepth(baseDepth + 100 + i);
            card.setAlpha(0);
            cards.push(card);

            // Phase 1: Fade in
            this.scene.tweens.add({
                targets: card,
                alpha: 1,
                duration: 150,
                delay: i * 10
            });

            // Phase 2: Spread cards around in a wide arc
            const spreadAngle = (i / numCards) * Math.PI * 2;
            const spreadRadius = 250 + Math.random() * 150;
            this.scene.tweens.add({
                targets: card,
                x: centerX + Math.cos(spreadAngle) * spreadRadius,
                y: centerY + Math.sin(spreadAngle) * spreadRadius * 0.6,
                angle: Math.random() * 360,
                duration: 400,
                delay: i * 10,
                ease: 'Cubic.easeOut'
            });

            // Phase 3: Swirl cards around the center
            const swirlAngle1 = spreadAngle + Math.PI * 0.5;
            const swirlRadius1 = 200 + Math.random() * 100;
            this.scene.tweens.add({
                targets: card,
                x: centerX + Math.cos(swirlAngle1) * swirlRadius1,
                y: centerY + Math.sin(swirlAngle1) * swirlRadius1 * 0.7,
                angle: card.angle + 180 + Math.random() * 180,
                duration: 500,
                delay: 600 + i * 8,
                ease: 'Sine.easeInOut'
            });

            // Phase 4: Gather back to center in a tighter spiral
            const gatherAngle = (i / numCards) * Math.PI * 4;
            const gatherRadius = 80 + (i / numCards) * 120;
            this.scene.tweens.add({
                targets: card,
                x: centerX + Math.cos(gatherAngle) * gatherRadius,
                y: centerY + Math.sin(gatherAngle) * gatherRadius * 0.5,
                angle: card.angle + 360,
                duration: 500,
                delay: 1200 + i * 6,
                ease: 'Cubic.easeIn'
            });

            // Phase 5: Final collapse to center and fade out
            this.scene.tweens.add({
                targets: card,
                x: centerX + (Math.random() - 0.5) * 60,
                y: centerY + (Math.random() - 0.5) * 40,
                alpha: 0,
                scale: 0.3,
                angle: card.angle + 90,
                duration: 400,
                delay: 1800 + i * 4,
                ease: 'Back.easeIn',
                onComplete: () => {
                    card.destroy();
                }
            });
        }
    }

    // Load player positions from blackjack.ldtk
    async loadBlackjackPositions() {
        try {
            const response = await fetch('assets/casino/blackjack.ldtk');
            const ldtkData = await response.json();

            // Find the Blackjack2 layer with integer grid
            const level = ldtkData.levels[0];
            const blackjackLayer = level.layerInstances.find(l => l.__identifier === 'Blackjack2');

            if (!blackjackLayer) {
                console.error('Blackjack2 layer not found in blackjack.ldtk');
                return;
            }

            this.ldtkGridWidth = blackjackLayer.__cWid;
            this.ldtkGridHeight = blackjackLayer.__cHei;
            this.ldtkTileSize = blackjackLayer.__gridSize; // 16px per tile
            this.ldtkIntGrid = blackjackLayer.intGridCsv;

            // Find player positions (values 2-7 represent players 1-6)
            this.playerCardPositions = [];
            for (let value = 2; value <= 7; value++) {
                const index = this.ldtkIntGrid.indexOf(value);
                if (index !== -1) {
                    const col = index % this.ldtkGridWidth;
                    const row = Math.floor(index / this.ldtkGridWidth);
                    this.playerCardPositions.push({
                        value: value,
                        index: index,
                        col: col,
                        row: row,
                        pixelX: col * this.ldtkTileSize,
                        pixelY: row * this.ldtkTileSize
                    });
                    console.log(`📍 Player ${value - 1} position: tile index ${index}, col ${col}, row ${row}, pixels (${col * this.ldtkTileSize}, ${row * this.ldtkTileSize})`);
                }
            }

            console.log('✅ Loaded blackjack positions from LDtk:', this.playerCardPositions);
        } catch (error) {
            console.error('❌ Failed to load blackjack.ldtk:', error);
        }
    }

    // Get card position for a player based on LDtk data
    getPlayerCardPosition(playerIndex) {
        if (!this.playerCardPositions || playerIndex >= this.playerCardPositions.length) {
            console.warn(`⚠️ Player positions not loaded yet or invalid index ${playerIndex}`);
            return { x: 0, y: -100 }; // Default fallback position
        }

        const pos = this.playerCardPositions[playerIndex];
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const tableScale = this.tableImage.scale;

        // Calculate position relative to center of table
        const tableCenterX = width / 2;
        const tableCenterY = height / 2;
        const tableWidth = this.tableImage.width * tableScale;
        const tableHeight = this.tableImage.height * tableScale;

        // Convert LDtk tile position to screen position
        const screenX = tableCenterX - tableWidth / 2 + pos.pixelX * tableScale;
        const screenY = tableCenterY - tableHeight / 2 + pos.pixelY * tableScale;

        // Convert to playersContainer coordinates (container is at width/2, height*0.75)
        return {
            x: screenX - width / 2,
            y: screenY - height * 0.75
        };
    }

    // Fixed player positions matching the blackjack table image
    getPlayerPosition(playerIndex) {
        // Fixed positions for up to 6 players (matching yellow circles on table)
        // Positions are relative offsets from center of screen
        const positions = [
            { x: -150, y: 180 },  // Player 1: Center-left bottom
            { x: -50, y: 200 },   // Player 2: Center bottom
            { x: 50, y: 200 },    // Player 3: Center bottom
            { x: 150, y: 180 },   // Player 4: Center-right bottom
            { x: -280, y: 50 },   // Player 5: Left side
            { x: 280, y: 50 }     // Player 6: Right side
        ];

        if (playerIndex < positions.length) {
            return positions[playerIndex];
        }

        // Fallback for spectators (shouldn't reach here with 6 player cap)
        return { x: 0, y: 250 };
    }

    // Render with FIXED POSITIONS
    renderPlayerHands() {
        this.playersContainer.removeAll(true);

        if (!this.gameState || !this.gameState.players || this.gameState.players.length === 0) {
            return;
        }

        if (typeof networkManager === 'undefined' || !networkManager.socket) return;

        // Check if positions are loaded
        if (!this.playerCardPositions || this.playerCardPositions.length === 0) {
            console.warn('⚠️ Player card positions not loaded yet from LDtk!');
        }

        const myId = networkManager.socket.id;
        const playerCount = Math.min(this.gameState.players.length, this.MAX_PLAYERS);

        // Calculate total cards dealt before each player (for sequential animation)
        let totalCardsDealtBefore = 0;

        // Only render first 6 players (others are spectators)
        this.gameState.players.slice(0, this.MAX_PLAYERS).forEach((player, index) => {
            const isMe = player.socketId === myId;

            // Get fixed position for this player slot
            const pos = this.getPlayerPosition(index);
            const xPos = pos.x;
            const yPos = pos.y;

            // Player name (no need for betting circle - it's on the table image)
            const nameColor = isMe ? '#4ADE80' : '#F5DEB3';
            const nameText = isMe ? 'YOU' : (player.username || `PLAYER ${index + 1}`);
            const turnIndicator = player.isCurrentTurn ? ' 🎯' : '';

            const name = this.scene.add.text(xPos - 100, yPos + 10, `${nameText}${turnIndicator}`, {
                font: 'bold 16px Georgia',
                fill: nameColor,
                stroke: '#000000',
                strokeThickness: 2
            });
            name.setOrigin(0.5);
            this.playersContainer.add(name);

            // Bet amount (in the circle)
            const betText = this.scene.add.text(xPos, yPos, `${player.bet}`, {
                font: 'bold 20px Arial',
                fill: '#FFD700',
                stroke: '#000000',
                strokeThickness: 2
            });
            betText.setOrigin(0.5);
            this.playersContainer.add(betText);

            // Hand value & status (below the cards)
            const statusColor = {
                'bust': '#FF0000',
                'blackjack': '#FFD700',
                'standing': '#4ADE80',
                'playing': '#FFFFFF'
            }[player.status] || '#CCCCCC';

            const valueText = this.scene.add.text(xPos, yPos - 90, `${player.value}`, {
                font: 'bold 24px Arial',
                fill: statusColor,
                stroke: '#000000',
                strokeThickness: 2
            });
            valueText.setOrigin(0.5);
            this.playersContainer.add(valueText);

            // Cards (spread horizontally in a row)
            // Use LDtk-based positioning for cards
            const cardPos = this.getPlayerCardPosition(index);

            console.log(`🃏 Player ${index + 1} (${isMe ? 'YOU' : player.username}) card position:`, cardPos);

            const cardSpacing = 140; // Wider spacing to prevent overlap with larger cards
            const totalCardWidth = player.hand.length * cardSpacing;
            const cardsStartX = cardPos.x - totalCardWidth / 2 + cardSpacing / 2;

            // Check if this player had cards before (for animation)
            const previousPlayer = this.previousGameState?.players?.find(p => p.socketId === player.socketId);
            const previousCardCount = previousPlayer?.hand?.length || 0;

            player.hand.forEach((card, cardIndex) => {
                const cardX = cardsStartX + cardIndex * cardSpacing;
                const cardY = cardPos.y;  // Cards positioned at LDtk location

                if (isMe && cardIndex === 0) {
                    console.log(`🎴 Your first card at: X=${cardX}, Y=${cardY}`);
                }

                // If this is a new card (wasn't in previous state), animate it
                if (cardIndex >= previousCardCount) {
                    // Get dealer position (animation start)
                    const width = this.scene.scale.width;
                    const height = this.scene.scale.height;
                    const dealerX = width / 2;
                    const dealerY = height * 0.28;

                    // Convert to playersContainer coordinates (playersContainer is centered)
                    const startX = dealerX - width / 2;
                    const startY = dealerY - height / 2;

                    // Create animated card
                    const animatedCard = this.createCardSprite(card, startX, startY, 1.8);
                    animatedCard.setAlpha(0);
                    this.playersContainer.add(animatedCard);

                    // Calculate delay: deal one player at a time
                    // Total cards dealt before this player + this card's index
                    const cardDelay = (totalCardsDealtBefore + cardIndex) * 200;

                    // Animate to final position
                    this.scene.tweens.add({
                        targets: animatedCard,
                        x: cardX,
                        y: cardY,
                        alpha: 1,
                        angle: 360,
                        duration: 400,
                        delay: cardDelay,
                        ease: 'Back.easeOut',
                        onStart: () => {
                            // Play card deal sound
                            this.scene.sound.play('carddeal', { volume: 0.8 });
                        }
                    });
                } else {
                    // Existing card, render instantly
                    const cardSprite = this.createCardSprite(card, cardX, cardY, 1.8);
                    this.playersContainer.add(cardSprite);
                }
            });

            // Add this player's new cards to the total count
            const newCardsForThisPlayer = player.hand.length - previousCardCount;
            totalCardsDealtBefore += newCardsForThisPlayer;
        });
    }

    renderDealerHand() {
        this.dealerCardsContainer.removeAll(true);

        if (!this.gameState || !this.gameState.dealer.hand || this.gameState.dealer.hand.length === 0) {
            return;
        }

        const dealer = this.gameState.dealer;
        const cardSpacing = 130;

        // Check if dealer had cards before (for animation)
        const previousDealerCardCount = this.previousGameState?.dealer?.hand?.length || 0;

        // Calculate total player cards dealt (for dealer delay)
        let totalPlayerCards = 0;
        if (this.gameState.players) {
            this.gameState.players.slice(0, this.MAX_PLAYERS).forEach(player => {
                const prevPlayer = this.previousGameState?.players?.find(p => p.socketId === player.socketId);
                const prevCardCount = prevPlayer?.hand?.length || 0;
                const newCards = player.hand.length - prevCardCount;
                totalPlayerCards += newCards;
            });
        }

        dealer.hand.forEach((card, index) => {
            const xPos = index * cardSpacing - (dealer.hand.length * cardSpacing) / 2 + cardSpacing / 2;

            // Determine if this is a new card
            const isNewCard = index >= previousDealerCardCount;

            if (index === 1 && dealer.value === null) {
                // Face-down card (hole card) - use card back sprite
                const cardBackSprite = this.createCardBack(xPos, 0, 2.25);

                if (isNewCard) {
                    // Animate the card back - delay after all player cards
                    const dealerDelay = (totalPlayerCards + index) * 200;
                    cardBackSprite.setAlpha(0);
                    cardBackSprite.setY(-100);
                    this.scene.tweens.add({
                        targets: cardBackSprite,
                        y: 0,
                        alpha: 1,
                        duration: 400,
                        delay: dealerDelay,
                        ease: 'Back.easeOut',
                        onStart: () => {
                            // Play card deal sound
                            this.scene.sound.play('carddeal', { volume: 0.8 });
                        }
                    });
                }

                this.dealerCardsContainer.add(cardBackSprite);
            } else {
                const cardSprite = this.createCardSprite(card, xPos, 0, 2.25);

                if (isNewCard) {
                    // Animate the card - delay after all player cards
                    const dealerDelay = (totalPlayerCards + index) * 200;
                    cardSprite.setAlpha(0);
                    cardSprite.setY(-100);
                    this.scene.tweens.add({
                        targets: cardSprite,
                        y: 0,
                        alpha: 1,
                        angle: 360,
                        duration: 400,
                        delay: dealerDelay,
                        ease: 'Back.easeOut',
                        onStart: () => {
                            // Play card deal sound
                            this.scene.sound.play('carddeal', { volume: 0.8 });
                        }
                    });
                }

                this.dealerCardsContainer.add(cardSprite);
            }
        });

        // Dealer value (if revealed)
        if (dealer.value !== null) {
            this.dealerLabel.setText(`DEALER (${dealer.value})`);
        } else {
            this.dealerLabel.setText('DEALER');
        }
    }

    // Animation: Deal card from dealer to player
    dealCardAnimated(fromX, fromY, toX, toY, card, callback) {
        const tempCard = this.createCardSprite(card, fromX, fromY, 1.0);
        tempCard.setDepth(100050);

        this.scene.tweens.add({
            targets: tempCard,
            x: toX,
            y: toY,
            angle: 360,
            duration: 400,
            ease: 'Quad.easeOut',
            onComplete: () => {
                tempCard.destroy();
                if (callback) callback();
            }
        });
    }

    setupKeyboardControls() {
        // Store key references for proper cleanup
        this.keys = {
            one: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            two: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            three: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            four: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
            w: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            s: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            e: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            a: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            d: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            q: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
        };

        this.keys.one.on('down', () => {
            if (this.isGameOpen) this.placeBet(5);
        });

        this.keys.two.on('down', () => {
            if (this.isGameOpen) this.placeBet(10);
        });

        this.keys.three.on('down', () => {
            if (this.isGameOpen) this.placeBet(25);
        });

        this.keys.four.on('down', () => {
            if (this.isGameOpen) this.placeBet(50);
        });

        this.keys.w.on('down', () => {
            if (this.isGameOpen) this.hit();
        });

        this.keys.s.on('down', () => {
            if (this.isGameOpen) this.stand();
        });

        this.keys.e.on('down', () => {
            if (this.isGameOpen) this.joinNextRound();
        });

        this.keys.a.on('down', () => {
            if (this.isGameOpen) this.split();
        });

        this.keys.d.on('down', () => {
            if (this.isGameOpen) this.doubleDown();
        });

        this.keys.q.on('down', () => {
            if (this.isGameOpen) this.insurance();
        });

        // F key handled by GameScene via checkPlayerDistance/toggleGame
        // Don't add duplicate handler here to avoid conflicts
    }

    // Continue with existing methods (setupNetworkListeners, openGame, updateUI, etc.)
    setupNetworkListeners() {
        if (this.networkListenersSetup) return;
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;

        networkManager.socket.on('blackjack:state', (state) => {
            this.previousGameState = this.gameState;
            this.gameState = state;
            this.updateUI();
        });

        networkManager.socket.on('blackjack:joined_next_round', (data) => {
            this.isSpectating = false;
            console.log('Joined next round:', data.message);
        });

        networkManager.socket.on('blackjack:bet_placed', (data) => {
            console.log(`Bet placed: ${data.amount} souls. Remaining: ${data.remainingSouls}`);
        });

        networkManager.socket.on('blackjack:countdown', (data) => {
            this.statusText.setText(`⏰ Game starting in ${data.timeLeft}...`);
        });

        networkManager.socket.on('blackjack:error', (data) => {
            console.error('Blackjack error:', data.message);
            this.statusText.setText(`❌ ${data.message}`);
        });

        networkManager.socket.on('blackjack:payout', (data) => {
            // Play win/lose sound for local player
            const myId = networkManager.socket.id;
            const myResult = data.results.find(r => r.socketId === myId);

            if (myResult) {
                // Win sounds: BLACKJACK, WIN
                // Lose sounds: BUST, LOSE
                // No sound for PUSH (tie)
                if (myResult.result === 'BLACKJACK' || myResult.result === 'WIN') {
                    this.scene.sound.play('cardwin', { volume: 0.7 });
                    console.log(`🎉 You ${myResult.result}! Won ${myResult.payout} souls`);
                } else if (myResult.result === 'BUST' || myResult.result === 'LOSE') {
                    this.scene.sound.play('cardlose', { volume: 0.6 });
                    console.log(`😢 You ${myResult.result}!`);
                }
                // PUSH = no sound (just get bet back)
            }
        });

        this.networkListenersSetup = true;
    }

    openGame() {
        console.log('BlackjackNPC: Opening game, uiElements count:', this.uiElements.length);
        this.isGameOpen = true;
        this.isSpectating = true;

        // Reset controller selection to first action
        this.selectedActionIndex = 0;

        // Show all UI elements
        this.uiElements.forEach((el, index) => {
            if (el && el.setVisible) {
                el.setVisible(true);
            } else {
                console.warn('Invalid UI element at index', index, el);
            }
        });

        // Show join button initially
        if (this.joinButton && this.joinButton.bg) {
            this.joinButton.bg.setVisible(true);
            this.joinButton.text.setVisible(true);
        }

        this.statusText.setText('Connecting to table...');
        this.scene.blackjackUIOpen = true;

        console.log('BlackjackNPC: Game opened, requesting state from server');

        // Request game state from server
        if (typeof networkManager !== 'undefined' && networkManager.socket) {
            networkManager.socket.emit('blackjack:join', {});
        }
    }

    closeGame() {
        this.isGameOpen = false;
        this.uiElements.forEach(el => el.setVisible(false));
        this.scene.blackjackUIOpen = false;

        if (typeof networkManager !== 'undefined' && networkManager.socket) {
            networkManager.socket.emit('blackjack:leave', {});
        }
    }

    updateUI() {
        if (!this.gameState) {
            console.log('BlackjackNPC: No game state yet');
            return;
        }
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;

        const myId = networkManager.socket.id;
        const phase = this.gameState.phase;

        // Play shuffle animation and sound when transitioning from payout to waiting (new round starting)
        const previousPhase = this.previousGameState?.phase;

        if (previousPhase === 'payout' && phase === 'waiting' && !this.hasShuffledThisRound) {
            console.log('🎴 Shuffling cards for new round...');
            this.hasShuffledThisRound = true;
            this.playShuffleAnimation();
        }

        // Reset shuffle flag when round starts (countdown or playing)
        if (phase === 'countdown' || phase === 'playing') {
            this.hasShuffledThisRound = false;
        }

        // Update status text
        let status = '';
        if (phase === 'waiting') {
            status = 'Waiting for players...';
        } else if (phase === 'countdown') {
            status = '⏰ Starting soon...';
        } else if (phase === 'playing') {
            const currentPlayer = this.gameState.players.find(p => p.isCurrentTurn);
            if (currentPlayer) {
                const isMe = currentPlayer.socketId === myId;
                status = isMe ? '🎯 YOUR TURN!' : `⏳ ${currentPlayer.username || 'Player'}'s turn...`;
                if (currentPlayer.turnTime) {
                    status += ` (${currentPlayer.turnTime}s)`;
                }
            }
        } else if (phase === 'dealer_turn') {
            status = '🎲 Dealer is playing...';
        } else if (phase === 'payout') {
            status = '💰 Calculating payouts...';
        }

        this.statusText.setText(status);

        // Update dealer & player hands
        this.renderDealerHand();
        this.renderPlayerHands();

        // Show/hide UI based on state
        const amIPlaying = this.gameState.players.some(p => p.socketId === myId);
        const myTurn = this.gameState.currentTurn === myId;

        // Join button (show when spectating)
        const showJoin = this.isSpectating && !amIPlaying;
        this.joinButton.bg.setVisible(showJoin);
        this.joinButton.text.setVisible(showJoin);

        // Reset bet selection when showing join button
        if (showJoin) {
            this.selectedBetIndex = 0;
            this.betHighlights.forEach(h => h.setVisible(false));
        }

        // Bet chips (show when player hasn't bet yet)
        const myPlayer = this.gameState.players.find(p => p.socketId === myId);
        const canBet = amIPlaying && myPlayer && myPlayer.bet === 0 && (phase === 'waiting' || phase === 'countdown');

        // Update soul count display (using currency from killing enemies)
        const localPlayer = this.scene.localPlayer;
        if (localPlayer && this.soulCountText) {
            const currency = localPlayer.currency || 0;
            this.soulCountText.setText(`YOUR SOULS: ${currency}`);
            this.soulCountText.setVisible(canBet || amIPlaying); // Show when betting or playing
        }

        this.betLabel.setVisible(canBet);
        this.betButtons.forEach(chip => {
            chip.outer.setVisible(canBet);
            chip.inner.setVisible(canBet);
            chip.text.setVisible(canBet);
            chip.soulsLabel.setVisible(canBet);
            chip.keyHint.setVisible(canBet);
        });

        // Update bet highlights for controller
        if (canBet) {
            this.updateBetHighlight();
        } else {
            this.betHighlights.forEach(h => h.setVisible(false));
        }

        // Action buttons (show during my turn)
        const showActions = amIPlaying && myTurn && phase === 'playing';
        this.actionContainer.setVisible(showActions);

        // Special action buttons visibility
        if (showActions && myPlayer) {
            // Double down: only available on first 2 cards
            const canDouble = myPlayer.hand && myPlayer.hand.length === 2;
            this.doubleBtn.bg.setVisible(canDouble);
            this.doubleBtn.text.setVisible(canDouble);
            this.doubleBtn.keyHint.setVisible(canDouble);

            // Split: only available when both cards have same value
            const canSplit = myPlayer.hand && myPlayer.hand.length === 2 && this.canSplitCards(myPlayer.hand);
            this.splitBtn.bg.setVisible(canSplit);
            this.splitBtn.text.setVisible(canSplit);
            this.splitBtn.keyHint.setVisible(canSplit);

            // Insurance: only available when dealer shows an Ace
            const dealerShowsAce = this.gameState.dealer && this.gameState.dealer.hand &&
                                   this.gameState.dealer.hand.length > 0 &&
                                   this.gameState.dealer.hand[0].value === 'ace';
            const canInsure = dealerShowsAce && myPlayer.hand && myPlayer.hand.length === 2 && !myPlayer.insurance;
            this.insuranceBtn.bg.setVisible(canInsure);
            this.insuranceBtn.text.setVisible(canInsure);
            this.insuranceBtn.keyHint.setVisible(canInsure);

            // Update controller highlight to show on first visible button
            this.updateActionHighlight();
        } else {
            // Hide all special buttons when not player's turn
            this.doubleBtn.bg.setVisible(false);
            this.doubleBtn.text.setVisible(false);
            this.doubleBtn.keyHint.setVisible(false);
            this.splitBtn.bg.setVisible(false);
            this.splitBtn.text.setVisible(false);
            this.splitBtn.keyHint.setVisible(false);
            this.insuranceBtn.bg.setVisible(false);
            this.insuranceBtn.text.setVisible(false);
            this.insuranceBtn.keyHint.setVisible(false);

            // Hide all highlights when actions are not visible
            this.actionHighlights.forEach(h => h.setVisible(false));
        }
    }

    // Check if player can split their hand (both cards have same value)
    canSplitCards(hand) {
        if (!hand || hand.length !== 2) return false;

        const getValue = (card) => {
            if (card.value === 'ace') return 11;
            if (['jack', 'queen', 'king'].includes(card.value)) return 10;
            return parseInt(card.value);
        };

        return getValue(hand[0]) === getValue(hand[1]);
    }

    checkPlayerDistance(playerX, playerY) {
        const distance = Phaser.Math.Distance.Between(
            playerX,
            playerY,
            this.x,
            this.y
        );

        const isInRange = distance < this.interactionRange;
        this.promptText.setVisible(isInRange && !this.isGameOpen);

        return isInRange;
    }

    toggleGame() {
        if (this.isGameOpen) {
            this.closeGame();
        } else {
            this.openGame();
        }
    }

    update() {
        // Can be called by scene if needed, but checkPlayerDistance handles prompt visibility
    }

    joinNextRound() {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;
        networkManager.socket.emit('blackjack:join_next', {});
    }

    placeBet(amount) {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;
        networkManager.socket.emit('blackjack:bet', { amount });
    }

    hit() {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;
        networkManager.socket.emit('blackjack:hit', {});
    }

    stand() {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;
        networkManager.socket.emit('blackjack:stand', {});
    }

    doubleDown() {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;
        networkManager.socket.emit('blackjack:double', {});
    }

    split() {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;
        networkManager.socket.emit('blackjack:split', {});
    }

    insurance() {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;
        networkManager.socket.emit('blackjack:insurance', {});
    }

    // Controller navigation methods
    moveSelectionLeft() {
        if (!this.isGameOpen || !this.actionContainer.visible) return;

        // Get visible action buttons
        const visibleButtons = this.actionButtons.filter(btn => btn.bg.visible);
        if (visibleButtons.length === 0) return;

        // Move selection left
        do {
            this.selectedActionIndex = (this.selectedActionIndex - 1 + this.actionButtons.length) % this.actionButtons.length;
        } while (!this.actionButtons[this.selectedActionIndex].bg.visible);

        this.updateActionHighlight();
        console.log(`🎮 Blackjack: Selected action ${this.selectedActionIndex}`);
    }

    moveSelectionRight() {
        if (!this.isGameOpen || !this.actionContainer.visible) return;

        // Get visible action buttons
        const visibleButtons = this.actionButtons.filter(btn => btn.bg.visible);
        if (visibleButtons.length === 0) return;

        // Move selection right
        do {
            this.selectedActionIndex = (this.selectedActionIndex + 1) % this.actionButtons.length;
        } while (!this.actionButtons[this.selectedActionIndex].bg.visible);

        this.updateActionHighlight();
        console.log(`🎮 Blackjack: Selected action ${this.selectedActionIndex}`);
    }

    updateActionHighlight() {
        // Hide all highlights
        this.actionHighlights.forEach((h, i) => {
            h.setVisible(i === this.selectedActionIndex && this.actionButtons[i].bg.visible);
        });
    }

    executeSelectedAction() {
        if (!this.isGameOpen) return;

        // If join button is visible, join the game
        if (this.joinButton && this.joinButton.bg.visible) {
            this.joinNextRound();
            return;
        }

        // If bet buttons are visible, place selected bet
        if (this.betButtons.length > 0 && this.betButtons[0].outer.visible) {
            const selectedBet = this.betButtons[this.selectedBetIndex];
            if (selectedBet) {
                this.placeBet(selectedBet.amount);
            }
            return;
        }

        // If action buttons are visible, execute selected action
        if (this.actionContainer.visible) {
            const selectedButton = this.actionButtons[this.selectedActionIndex];
            if (!selectedButton || !selectedButton.bg.visible) return;

            switch (this.selectedActionIndex) {
                case 0: this.hit(); break;
                case 1: this.stand(); break;
                case 2: this.doubleDown(); break;
                case 3: this.split(); break;
                case 4: this.insurance(); break;
            }
        }
    }

    moveSelectionLeft() {
        if (!this.isGameOpen) return;

        // If betting phase, navigate bet chips
        if (this.betButtons.length > 0 && this.betButtons[0].outer.visible) {
            this.selectedBetIndex = (this.selectedBetIndex - 1 + this.betButtons.length) % this.betButtons.length;
            this.updateBetHighlight();
            console.log(`🎮 Blackjack: Selected bet ${this.selectedBetIndex}`);
            return;
        }

        // If playing phase, navigate action buttons
        if (this.actionContainer.visible) {
            const visibleButtons = this.actionButtons.filter(btn => btn.bg.visible);
            if (visibleButtons.length === 0) return;

            do {
                this.selectedActionIndex = (this.selectedActionIndex - 1 + this.actionButtons.length) % this.actionButtons.length;
            } while (!this.actionButtons[this.selectedActionIndex].bg.visible);

            this.updateActionHighlight();
            console.log(`🎮 Blackjack: Selected action ${this.selectedActionIndex}`);
        }
    }

    moveSelectionRight() {
        if (!this.isGameOpen) return;

        // If betting phase, navigate bet chips
        if (this.betButtons.length > 0 && this.betButtons[0].outer.visible) {
            this.selectedBetIndex = (this.selectedBetIndex + 1) % this.betButtons.length;
            this.updateBetHighlight();
            console.log(`🎮 Blackjack: Selected bet ${this.selectedBetIndex}`);
            return;
        }

        // If playing phase, navigate action buttons
        if (this.actionContainer.visible) {
            const visibleButtons = this.actionButtons.filter(btn => btn.bg.visible);
            if (visibleButtons.length === 0) return;

            do {
                this.selectedActionIndex = (this.selectedActionIndex + 1) % this.actionButtons.length;
            } while (!this.actionButtons[this.selectedActionIndex].bg.visible);

            this.updateActionHighlight();
            console.log(`🎮 Blackjack: Selected action ${this.selectedActionIndex}`);
        }
    }

    updateBetHighlight() {
        this.betHighlights.forEach((h, i) => {
            h.setVisible(i === this.selectedBetIndex && this.betButtons[i].outer.visible);
        });
    }

    setInputMode(mode) {
        // Update prompt and close hint based on input mode
        const interactButton = mode === 'controller' ? 'A' : 'F';
        const closeButton = mode === 'controller' ? 'Start' : 'ESC';

        if (this.promptText) {
            this.promptText.setText(`[${interactButton}] High Roller Blackjack`);
        }
        if (this.closeHint) {
            this.closeHint.setText(`${closeButton} or ${interactButton} to Close`);
        }
    }

    destroy() {
        // Clean up keyboard listeners
        if (this.keys && this.scene && this.scene.input && this.scene.input.keyboard) {
            try {
                Object.values(this.keys).forEach(key => {
                    if (key && typeof key.removeAllListeners === 'function') {
                        key.removeAllListeners();
                    }
                });
            } catch (e) {
                console.warn('Error cleaning up blackjack keyboard listeners:', e);
            }
        }

        if (this.sprite) this.sprite.destroy();
        if (this.promptText) this.promptText.destroy();
        this.uiElements.forEach(el => {
            if (el && el.destroy) el.destroy();
        });
    }
}
