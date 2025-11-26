// Multiplayer Blackjack NPC - Casino gambling with carried souls
class BlackjackNPC {
    constructor(scene, x, y, name = 'Dealer') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80;
        this.isGameOpen = false;

        // Multiplayer state (received from server)
        this.gameState = null; // Will be populated by server
        this.isSpectating = false;
        this.networkListenersSetup = false;

        this.createSprite();
        this.createPrompt();
        this.createGameUI();
        this.setupKeyboardControls();

        // Setup network listeners when available (networkManager is global)
        if (typeof networkManager !== 'undefined' && networkManager.socket) {
            this.setupNetworkListeners();
        }
    }

    createSprite() {
        // Using merchant sprite for now - can be replaced with dealer sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, 'merchant_1');
        this.sprite.setDepth(this.y);
        this.sprite.setScale(1.5);
        this.sprite.setTint(0x228822); // Green tint for casino dealer

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
        this.promptText = this.scene.add.text(this.x, this.y - 80, 'Press F to Play Blackjack', {
            font: '16px monospace',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.promptText.setOrigin(0.5);
        this.promptText.setDepth(this.y + 1);
        this.promptText.setVisible(false);
    }

    createGameUI() {
        // Track all UI elements for visibility toggling
        this.uiElements = [];

        const baseDepth = 100000;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Dark blur background
        this.bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.92);
        this.bg.setScrollFactor(0);
        this.bg.setDepth(baseDepth);
        this.bg.setVisible(false);
        this.uiElements.push(this.bg);

        // Modern game panel
        const panelWidth = 800;
        const panelHeight = 600;

        // Panel shadow
        this.panelShadow = this.scene.add.rectangle(width / 2 + 4, height / 2 + 4, panelWidth, panelHeight, 0x000000, 0.3);
        this.panelShadow.setScrollFactor(0);
        this.panelShadow.setDepth(baseDepth + 1);
        this.panelShadow.setVisible(false);
        this.uiElements.push(this.panelShadow);

        // Panel background (dark blue/purple theme)
        this.panelBg = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x1a1a2e, 1);
        this.panelBg.setScrollFactor(0);
        this.panelBg.setDepth(baseDepth + 2);
        this.panelBg.setVisible(false);
        this.uiElements.push(this.panelBg);

        // Panel border
        this.panelBorder = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight);
        this.panelBorder.setStrokeStyle(3, 0x6f4ff2, 1);
        this.panelBorder.setFillStyle(0x0f0f1e, 1);
        this.panelBorder.setScrollFactor(0);
        this.panelBorder.setDepth(baseDepth + 3);
        this.panelBorder.setVisible(false);
        this.uiElements.push(this.panelBorder);

        // Title
        this.titleText = this.scene.add.text(width / 2, height / 2 - 270, 'MULTIPLAYER BLACKJACK', {
            font: 'bold 36px Arial',
            fill: '#ffffff',
            stroke: '#6f4ff2',
            strokeThickness: 2
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setScrollFactor(0);
        this.titleText.setDepth(baseDepth + 10);
        this.titleText.setVisible(false);
        this.uiElements.push(this.titleText);

        // Status text (phase, countdown, etc.)
        this.statusText = this.scene.add.text(width / 2, height / 2 - 230, '', {
            font: '16px Arial',
            fill: '#a78bfa',
            align: 'center'
        });
        this.statusText.setOrigin(0.5);
        this.statusText.setScrollFactor(0);
        this.statusText.setDepth(baseDepth + 10);
        this.statusText.setVisible(false);
        this.uiElements.push(this.statusText);

        // Dealer hand area
        this.dealerHandText = this.scene.add.text(width / 2, height / 2 - 180, 'DEALER', {
            font: 'bold 18px Arial',
            fill: '#ff6b6b',
            letterSpacing: 1
        });
        this.dealerHandText.setOrigin(0.5);
        this.dealerHandText.setScrollFactor(0);
        this.dealerHandText.setDepth(baseDepth + 10);
        this.dealerHandText.setVisible(false);
        this.uiElements.push(this.dealerHandText);

        this.dealerCardsContainer = this.scene.add.container(width / 2, height / 2 - 135);
        this.dealerCardsContainer.setScrollFactor(0);
        this.dealerCardsContainer.setDepth(baseDepth + 10);
        this.dealerCardsContainer.setVisible(false);
        this.uiElements.push(this.dealerCardsContainer);

        // Player area - will show all players' hands
        this.playersContainer = this.scene.add.container(width / 2, height / 2 + 20);
        this.playersContainer.setScrollFactor(0);
        this.playersContainer.setDepth(baseDepth + 10);
        this.playersContainer.setVisible(false);
        this.uiElements.push(this.playersContainer);

        // Betting UI (spectator/joining) - use absolute positions
        const bettingY = height / 2 + 200;

        // Join button (for spectators)
        this.joinButton = this.scene.add.rectangle(width / 2, bettingY - 50, 300, 50, 0x6f4ff2, 1);
        this.joinButton.setStrokeStyle(2, 0x8b5cf6, 1);
        this.joinButton.setScrollFactor(0);
        this.joinButton.setDepth(baseDepth + 20);
        this.joinButton.setInteractive({ useHandCursor: true });
        this.joinButton.on('pointerdown', () => {
            this.joinNextRound();
        });
        this.joinButton.on('pointerover', () => {
            this.joinButton.setFillStyle(0x8b5cf6);
        });
        this.joinButton.on('pointerout', () => {
            this.joinButton.setFillStyle(0x6f4ff2);
        });
        this.joinButton.setVisible(false);
        this.uiElements.push(this.joinButton);

        this.joinButtonText = this.scene.add.text(width / 2, bettingY - 60, 'JOIN NEXT ROUND', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        });
        this.joinButtonText.setOrigin(0.5);
        this.joinButtonText.setScrollFactor(0);
        this.joinButtonText.setDepth(baseDepth + 21);
        this.joinButtonText.setVisible(false);
        this.uiElements.push(this.joinButtonText);

        this.joinKeyHint = this.scene.add.text(width / 2, bettingY - 35, 'Press [E] or Click', {
            font: '13px Arial',
            fill: '#a78bfa'
        });
        this.joinKeyHint.setOrigin(0.5);
        this.joinKeyHint.setScrollFactor(0);
        this.joinKeyHint.setDepth(baseDepth + 21);
        this.joinKeyHint.setVisible(false);
        this.uiElements.push(this.joinKeyHint);

        // Bet amount input
        this.betLabel = this.scene.add.text(width / 2, bettingY + 10, 'Place Your Bet (Press 1-4 or Click):', {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        });
        this.betLabel.setOrigin(0.5);
        this.betLabel.setScrollFactor(0);
        this.betLabel.setDepth(baseDepth + 20);
        this.betLabel.setVisible(false);
        this.uiElements.push(this.betLabel);

        // Bet buttons
        this.betButtons = [];
        const betAmounts = [5, 10, 25, 50];
        const buttonSpacing = 70;
        const startX = width / 2 - (betAmounts.length * buttonSpacing) / 2 + buttonSpacing / 2;

        betAmounts.forEach((amount, index) => {
            const x = startX + index * buttonSpacing;
            const btn = this.scene.add.rectangle(x, bettingY + 50, 60, 40, 0x4ade80, 1);
            btn.setStrokeStyle(2, 0x22c55e, 1);
            btn.setScrollFactor(0);
            btn.setDepth(baseDepth + 20);

            // Make button interactive
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this.placeBet(amount);
            });
            btn.on('pointerover', () => {
                btn.setFillStyle(0x22c55e);
            });
            btn.on('pointerout', () => {
                btn.setFillStyle(0x4ade80);
            });
            btn.setVisible(false);
            this.uiElements.push(btn);

            const text = this.scene.add.text(x, bettingY + 42, `${amount}`, {
                font: 'bold 18px Arial',
                fill: '#ffffff'
            });
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(baseDepth + 21);
            text.setVisible(false);
            this.uiElements.push(text);

            const keyLabel = this.scene.add.text(x, bettingY + 62, `[${index + 1}]`, {
                font: '11px Arial',
                fill: '#dcfce7'
            });
            keyLabel.setOrigin(0.5);
            keyLabel.setScrollFactor(0);
            keyLabel.setDepth(baseDepth + 21);
            keyLabel.setVisible(false);
            this.uiElements.push(keyLabel);

            this.betButtons.push({ bg: btn, text, keyLabel, amount });
        });

        // Action buttons (hit/stand) - keep container for these
        const actionY = height / 2 + 220;
        this.actionContainer = this.scene.add.container(width / 2, actionY);
        this.actionContainer.setScrollFactor(0);
        this.actionContainer.setDepth(baseDepth + 20);
        this.actionContainer.setVisible(false);
        this.uiElements.push(this.actionContainer);

        const hitBtn = this.scene.add.rectangle(-80, 0, 130, 50, 0x4ade80, 1);
        hitBtn.setStrokeStyle(2, 0x22c55e, 1);
        hitBtn.setInteractive({ useHandCursor: true });
        hitBtn.on('pointerdown', () => {
            this.hit();
        });
        hitBtn.on('pointerover', () => {
            hitBtn.setFillStyle(0x22c55e);
        });
        hitBtn.on('pointerout', () => {
            hitBtn.setFillStyle(0x4ade80);
        });

        const hitText = this.scene.add.text(-80, -5, 'HIT', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        });
        hitText.setOrigin(0.5);
        const hitKey = this.scene.add.text(-80, 18, '[W]', {
            font: '12px Arial',
            fill: '#dcfce7'
        });
        hitKey.setOrigin(0.5);

        const standBtn = this.scene.add.rectangle(80, 0, 130, 50, 0xff6b6b, 1);
        standBtn.setStrokeStyle(2, 0xef4444, 1);
        standBtn.setInteractive({ useHandCursor: true });
        standBtn.on('pointerdown', () => {
            this.stand();
        });
        standBtn.on('pointerover', () => {
            standBtn.setFillStyle(0xef4444);
        });
        standBtn.on('pointerout', () => {
            standBtn.setFillStyle(0xff6b6b);
        });

        const standText = this.scene.add.text(80, -5, 'STAND', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        });
        standText.setOrigin(0.5);
        const standKey = this.scene.add.text(80, 18, '[S]', {
            font: '12px Arial',
            fill: '#fee2e2'
        });
        standKey.setOrigin(0.5);

        this.actionContainer.add([hitBtn, hitText, hitKey, standBtn, standText, standKey]);

        // Result/info text
        this.infoText = this.scene.add.text(width / 2, height / 2 + 260, '', {
            font: 'bold 18px Arial',
            fill: '#ffffff',
            align: 'center'
        });
        this.infoText.setOrigin(0.5);
        this.infoText.setScrollFactor(0);
        this.infoText.setDepth(baseDepth + 20);
        this.infoText.setVisible(false);
        this.uiElements.push(this.infoText);

        // Close hint
        this.closeHint = this.scene.add.text(width / 2, height / 2 + 285, 'ESC or F to Close', {
            font: '13px Arial',
            fill: '#666677'
        });
        this.closeHint.setOrigin(0.5);
        this.closeHint.setScrollFactor(0);
        this.closeHint.setDepth(baseDepth + 20);
        this.closeHint.setVisible(false);
        this.uiElements.push(this.closeHint);
    }

    setupKeyboardControls() {
        this.scene.input.keyboard.on('keydown', (event) => {
            if (!this.isGameOpen) return;

            if (!this.gameState) return;

            // STOP EVENT PROPAGATION - prevent game from processing these keys
            event.stopImmediatePropagation();
            event.preventDefault();

            // Number keys for betting
            if (this.gameState.phase === 'waiting' || this.gameState.phase === 'countdown') {
                if (event.key >= '1' && event.key <= '4') {
                    const index = parseInt(event.key) - 1;
                    if (index < this.betButtons.length) {
                        this.placeBet(this.betButtons[index].amount);
                    }
                }
            }

            // W for hit, S for stand (during my turn)
            if (this.gameState.phase === 'playing' && typeof networkManager !== 'undefined' && networkManager.socket) {
                const myTurn = this.gameState.currentTurn === networkManager.socket.id;
                if (myTurn) {
                    if (event.key.toLowerCase() === 'w') {
                        this.hit();
                    } else if (event.key.toLowerCase() === 's') {
                        this.stand();
                    }
                }
            }

            // E key for join next round (near WASD)
            if (event.key.toLowerCase() === 'e' && this.isSpectating) {
                this.joinNextRound();
            }
        });
    }

    setupNetworkListeners() {
        // networkManager is a global variable
        if (typeof networkManager === 'undefined' || !networkManager.socket) {
            console.warn('BlackjackNPC: NetworkManager not ready yet');
            return;
        }

        if (this.networkListenersSetup) {
            return; // Already setup
        }

        const socket = networkManager.socket;

        // Receive game state updates
        socket.on('blackjack:state', (state) => {
            this.gameState = state;
            if (this.isGameOpen) {
                this.updateUI();
            }
        });

        // Receive payout results
        socket.on('blackjack:payout', (data) => {
            if (this.isGameOpen) {
                this.handlePayout(data);
            }
        });

        // Bet confirmation
        socket.on('blackjack:bet_placed', (data) => {
            this.infoText.setText(`Bet placed: ${data.amount} souls`);
            this.infoText.setColor('#4ade80');

            // Update UI to hide betting options
            if (this.isGameOpen) {
                this.updateUI();
            }
        });

        // Errors
        socket.on('blackjack:error', (data) => {
            this.infoText.setText(data.message);
            this.infoText.setColor('#ff6b6b');
        });

        // Join confirmation
        socket.on('blackjack:joined_next_round', (data) => {
            this.isSpectating = false;
            this.infoText.setText(data.message);
            this.infoText.setColor('#4ade80');

            // Update UI to show betting options
            if (this.isGameOpen) {
                this.updateUI();
            }
        });

        // Left table
        socket.on('blackjack:left', (data) => {
            this.closeGame();
        });

        this.networkListenersSetup = true;
        console.log('BlackjackNPC: Network listeners setup complete');
    }

    checkPlayerDistance(playerX, playerY) {
        const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
        const inRange = distance < this.interactionRange;

        this.promptText.setVisible(inRange && !this.isGameOpen);

        return inRange;
    }

    toggleGame() {
        if (this.isGameOpen) {
            this.closeGame();
        } else {
            this.openGame();
        }
    }

    openGame() {
        // Setup network listeners if not already done
        if (!this.networkListenersSetup) {
            this.setupNetworkListeners();
        }

        if (typeof networkManager === 'undefined' || !networkManager.socket) {
            console.error('BlackjackNPC: Cannot open game - network not ready');
            return;
        }

        this.isGameOpen = true;
        this.isSpectating = true;

        // Show base UI elements (background, panel, title, etc) - not buttons yet
        this.bg.setVisible(true);
        this.panelShadow.setVisible(true);
        this.panelBg.setVisible(true);
        this.panelBorder.setVisible(true);
        this.titleText.setVisible(true);
        this.statusText.setVisible(true);
        this.dealerHandText.setVisible(true);
        this.dealerCardsContainer.setVisible(true);
        this.playersContainer.setVisible(true);
        this.infoText.setVisible(true);
        this.closeHint.setVisible(true);

        // Show join button initially (since we're spectating)
        this.joinButton.setVisible(true);
        this.joinButtonText.setVisible(true);
        this.joinKeyHint.setVisible(true);

        this.statusText.setText('Connecting to table...');

        this.promptText.setVisible(false);

        // Tell GameScene to ignore game controls
        this.scene.blackjackUIOpen = true;

        console.log('BlackjackNPC: Opening game, requesting state from server');

        // Notify server that we're joining as spectator
        networkManager.socket.emit('blackjack:join', {});
    }

    closeGame() {
        this.isGameOpen = false;

        // Hide all UI elements
        this.uiElements.forEach(el => el.setVisible(false));

        // Tell GameScene to resume game controls
        this.scene.blackjackUIOpen = false;

        // Notify server that we're leaving
        if (typeof networkManager !== 'undefined' && networkManager.socket) {
            networkManager.socket.emit('blackjack:leave', {});
        }
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

    updateUI() {
        if (!this.gameState) {
            console.log('BlackjackNPC: No game state yet');
            return;
        }
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;

        const myId = networkManager.socket.id;
        const phase = this.gameState.phase;

        console.log('BlackjackNPC updateUI:', {
            phase,
            isSpectating: this.isSpectating,
            players: this.gameState.players.length
        });

        // Update status text
        let status = '';
        if (phase === 'waiting') {
            status = 'Waiting for players... Place your bet to join!';
        } else if (phase === 'countdown') {
            status = '⏰ Starting soon...';
        } else if (phase === 'playing') {
            const currentPlayer = this.gameState.players.find(p => p.isCurrentTurn);
            if (currentPlayer) {
                const isMe = currentPlayer.socketId === myId;
                status = isMe ? '🎯 YOUR TURN!' : '⏳ Waiting for other players...';
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

        // Update dealer cards
        this.renderDealerHand();

        // Update player hands
        this.renderPlayerHands();

        // Show/hide UI elements based on state
        const amIPlaying = this.gameState.players.some(p => p.socketId === myId);
        const myTurn = this.gameState.currentTurn === myId;

        // Update join button visibility (show when spectating and not playing)
        const showJoin = this.isSpectating && !amIPlaying;
        this.joinButton.setVisible(showJoin);
        this.joinButtonText.setVisible(showJoin);
        this.joinKeyHint.setVisible(showJoin);

        // Update bet controls visibility (show when player hasn't bet yet)
        const myPlayer = this.gameState.players.find(p => p.socketId === myId);
        const canBet = amIPlaying && myPlayer && myPlayer.bet === 0 && (phase === 'waiting' || phase === 'countdown');
        console.log('BlackjackNPC bet visibility:', { amIPlaying, hasBet: myPlayer?.bet, canBet, phase });
        this.betLabel.setVisible(canBet);
        this.betButtons.forEach(btn => {
            btn.bg.setVisible(canBet);
            btn.text.setVisible(canBet);
            btn.keyLabel.setVisible(canBet);
        });

        // Update action buttons visibility (show during my turn while playing)
        const showActions = amIPlaying && myTurn && phase === 'playing';
        this.actionContainer.setVisible(showActions);
    }

    renderDealerHand() {
        this.dealerCardsContainer.removeAll(true);

        if (!this.gameState || !this.gameState.dealer.hand || this.gameState.dealer.hand.length === 0) {
            return;
        }

        const dealer = this.gameState.dealer;
        const cardSpacing = 65;

        // Show dealer value if revealed
        if (dealer.value !== null) {
            this.dealerHandText.setText(`DEALER (${dealer.value})`);

            // Show all cards
            dealer.hand.forEach((card, index) => {
                const xPos = index * cardSpacing - (dealer.hand.length * cardSpacing) / 2 + cardSpacing / 2;
                const cardSprite = this.createCardSprite(card, xPos, 0);
                this.dealerCardsContainer.add(cardSprite);
            });
        } else {
            this.dealerHandText.setText(`DEALER (?)`);

            // Show first card only
            const firstCard = this.createCardSprite(dealer.hand[0], -cardSpacing / 2, 0);
            this.dealerCardsContainer.add(firstCard);

            // Show card back for hidden card
            const backShadow = this.scene.add.rectangle(cardSpacing / 2 + 2, 2, 50, 70, 0x000000, 0.4);
            const cardBack = this.scene.add.rectangle(cardSpacing / 2, 0, 50, 70, 0x6f4ff2, 1);
            cardBack.setStrokeStyle(2, 0x8b5cf6, 1);
            const backText = this.scene.add.text(cardSpacing / 2, 0, '?', {
                font: 'bold 32px Arial',
                fill: '#ffffff'
            });
            backText.setOrigin(0.5);

            this.dealerCardsContainer.add([backShadow, cardBack, backText]);
        }
    }

    renderPlayerHands() {
        this.playersContainer.removeAll(true);

        if (!this.gameState || !this.gameState.players || this.gameState.players.length === 0) {
            const noPlayersText = this.scene.add.text(0, 0, 'No players yet...', {
                font: '16px Arial',
                fill: '#888899'
            });
            noPlayersText.setOrigin(0.5);
            this.playersContainer.add(noPlayersText);
            return;
        }

        if (typeof networkManager === 'undefined' || !networkManager.socket) return;

        const myId = networkManager.socket.id;

        // Display players vertically
        const playerSpacing = 100;
        const startY = -(this.gameState.players.length * playerSpacing) / 2 + playerSpacing / 2;

        this.gameState.players.forEach((player, index) => {
            const yPos = startY + index * playerSpacing;
            const isMe = player.socketId === myId;
            const isTurn = player.isCurrentTurn;

            // Player label
            const labelColor = isMe ? '#4ade80' : '#ffffff';
            const labelText = isMe ? 'YOU' : (player.username || `PLAYER ${index + 1}`);
            const turnIndicator = isTurn ? ' 🎯' : '';

            const label = this.scene.add.text(-320, yPos - 30, `${labelText}${turnIndicator}`, {
                font: 'bold 14px Arial',
                fill: labelColor
            });
            label.setOrigin(0, 0.5);

            // Player value and bet
            const infoText = this.scene.add.text(-320, yPos - 10, `${player.value} | Bet: ${player.bet}`, {
                font: '12px Arial',
                fill: '#a78bfa'
            });
            infoText.setOrigin(0, 0.5);

            // Status
            let statusColor = '#888899';
            let statusText = player.status.toUpperCase();
            if (player.status === 'bust') statusColor = '#ff6b6b';
            if (player.status === 'blackjack') statusColor = '#ffd700';
            if (player.status === 'standing') statusColor = '#4ade80';

            const status = this.scene.add.text(-320, yPos + 10, statusText, {
                font: 'bold 11px Arial',
                fill: statusColor
            });
            status.setOrigin(0, 0.5);

            // Cards
            const cardsStartX = -180;
            const cardSpacing = 55;

            player.hand.forEach((card, cardIndex) => {
                const xPos = cardsStartX + cardIndex * cardSpacing;
                const cardSprite = this.createCardSprite(card, xPos, yPos, 0.7);
                this.playersContainer.add(cardSprite);
            });

            this.playersContainer.add([label, infoText, status]);
        });
    }

    createCardSprite(card, x, y, scale = 1) {
        const cardWidth = 50 * scale;
        const cardHeight = 70 * scale;

        // Card shadow
        const shadow = this.scene.add.rectangle(x + 2, y + 2, cardWidth, cardHeight, 0x000000, 0.4);

        // Card background
        const cardBg = this.scene.add.rectangle(x, y, cardWidth, cardHeight, 0xffffff, 1);
        cardBg.setStrokeStyle(2, 0xe0e0e0, 1);

        // Card suit colors
        const color = (card.suit === 'hearts' || card.suit === 'diamonds') ? '#ef4444' : '#1f2937';

        // Format card value
        let displayValue = card.value.toUpperCase();
        if (card.value === 'ace') displayValue = 'A';
        if (card.value === 'jack') displayValue = 'J';
        if (card.value === 'queen') displayValue = 'Q';
        if (card.value === 'king') displayValue = 'K';

        // Value text
        const valueText = this.scene.add.text(x, y - 10, displayValue, {
            font: `bold ${16 * scale}px Arial`,
            fill: color
        });
        valueText.setOrigin(0.5);

        // Suit symbols
        const suitSymbols = {
            hearts: '♥',
            diamonds: '♦',
            clubs: '♣',
            spades: '♠'
        };

        const suitText = this.scene.add.text(x, y + 10, suitSymbols[card.suit], {
            font: `${20 * scale}px Arial`,
            fill: color
        });
        suitText.setOrigin(0.5);

        const container = this.scene.add.container(0, 0, [shadow, cardBg, valueText, suitText]);
        return container;
    }

    handlePayout(data) {
        if (typeof networkManager === 'undefined' || !networkManager.socket) return;

        const myId = networkManager.socket.id;
        const myResult = data.results.find(r => r.socketId === myId);

        if (myResult) {
            let message = '';
            let color = '#ffffff';

            if (myResult.result === 'BLACKJACK') {
                message = `🎉 BLACKJACK! Won ${myResult.payout} souls!`;
                color = '#ffd700';
            } else if (myResult.result === 'WIN') {
                message = `✅ YOU WIN! Won ${myResult.payout} souls!`;
                color = '#4ade80';
            } else if (myResult.result === 'PUSH') {
                message = `🔄 PUSH! Bet returned`;
                color = '#ffdd00';
            } else if (myResult.result === 'BUST') {
                message = `💥 BUST! Lost your bet`;
                color = '#ff6b6b';
            } else if (myResult.result === 'LOSE') {
                message = `❌ DEALER WINS! Lost your bet`;
                color = '#ff6b6b';
            }

            this.infoText.setText(message);
            this.infoText.setColor(color);
        }

        // Update UI to show all results
        this.updateUI();
    }

    destroy() {
        // Remove network listeners
        if (typeof networkManager !== 'undefined' && networkManager.socket) {
            const socket = networkManager.socket;
            socket.off('blackjack:state');
            socket.off('blackjack:payout');
            socket.off('blackjack:bet_placed');
            socket.off('blackjack:error');
            socket.off('blackjack:joined_next_round');
            socket.off('blackjack:left');
        }

        if (this.sprite) this.sprite.destroy();
        if (this.promptText) this.promptText.destroy();
        if (this.gameContainer) this.gameContainer.destroy();
    }
}
