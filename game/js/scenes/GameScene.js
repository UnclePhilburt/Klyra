// Game Scene - Main gameplay
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.localPlayer = null;
        this.otherPlayers = {};
        this.enemies = {};
        this.items = {};
        this.dungeon = null;
        this.map = null;
    }

    init(data) {
        this.gameData = data.gameData;
    }

    create() {
        // Create dungeon
        this.createDungeon(this.gameData.gameState.dungeon);

        // Create local player
        const myData = this.gameData.players.find(p => p.id === networkManager.currentPlayer.id);
        if (myData) {
            this.localPlayer = new Player(this, myData);
            this.cameras.main.startFollow(this.localPlayer.sprite, true, 0.1, 0.1);
        }

        // Create other players
        this.gameData.players.forEach(playerData => {
            if (playerData.id !== networkManager.currentPlayer.id) {
                this.otherPlayers[playerData.id] = new Player(this, playerData);
            }
        });

        // Create enemies
        this.gameData.gameState.enemies.forEach(enemyData => {
            this.enemies[enemyData.id] = new Enemy(this, enemyData);
        });

        // Create items
        this.gameData.gameState.items.forEach(itemData => {
            this.items[itemData.id] = new Item(this, itemData);
        });

        // Setup UI
        this.createUI();

        // Setup controls
        this.setupControls();

        // Setup network listeners
        this.setupNetworkListeners();
    }

    createDungeon(dungeonData) {
        const tileSize = GameConfig.GAME.TILE_SIZE;
        const { width, height, tiles } = dungeonData;

        // Create tilemap graphics
        this.dungeon = this.add.graphics();

        // Draw dungeon
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = tiles[y][x];
                const px = x * tileSize;
                const py = y * tileSize;

                if (tile === 0) {
                    // Floor
                    this.dungeon.fillStyle(0x1a1a1a, 1);
                    this.dungeon.fillRect(px, py, tileSize, tileSize);
                    this.dungeon.lineStyle(1, 0x2a2a2a, 0.5);
                    this.dungeon.strokeRect(px, py, tileSize, tileSize);
                } else {
                    // Wall
                    this.dungeon.fillStyle(0x0a0a0a, 1);
                    this.dungeon.fillRect(px, py, tileSize, tileSize);
                    this.dungeon.lineStyle(1, 0x00ff00, 0.3);
                    this.dungeon.strokeRect(px, py, tileSize, tileSize);
                }
            }
        }

        // Set world bounds
        this.physics.world.setBounds(0, 0, width * tileSize, height * tileSize);
        this.cameras.main.setBounds(0, 0, width * tileSize, height * tileSize);

        // Store tiles for collision
        this.dungeonTiles = tiles;
    }

    createUI() {
        const width = this.cameras.main.width;

        // Health bar
        this.healthBarBg = this.add.rectangle(20, 20, 200, 20, 0x000000);
        this.healthBarBg.setOrigin(0, 0);
        this.healthBarBg.setScrollFactor(0);

        this.healthBar = this.add.rectangle(20, 20, 200, 20, 0x00ff00);
        this.healthBar.setOrigin(0, 0);
        this.healthBar.setScrollFactor(0);

        this.healthText = this.add.text(120, 30, '100/100', {
            font: '14px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        // Stats
        this.statsText = this.add.text(20, 50, '', {
            font: '12px monospace',
            fill: '#00ffff'
        }).setScrollFactor(0);

        // Kill counter
        this.killsText = this.add.text(width - 20, 20, 'Kills: 0', {
            font: '14px monospace',
            fill: '#ffff00'
        }).setOrigin(1, 0).setScrollFactor(0);

        // Minimap (optional)
        this.minimapBg = this.add.rectangle(width - 160, 60, 140, 140, 0x000000, 0.7);
        this.minimapBg.setOrigin(0, 0).setScrollFactor(0);

        this.add.text(width - 90, 65, 'MINIMAP', {
            font: '10px monospace',
            fill: '#666666'
        }).setOrigin(0.5, 0).setScrollFactor(0);
    }

    setupControls() {
        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Mouse click to attack
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && this.localPlayer) {
                this.localPlayer.attack(pointer.worldX, pointer.worldY);
            }
        });
    }

    setupNetworkListeners() {
        // Player movement
        networkManager.on('player:moved', (data) => {
            const player = this.otherPlayers[data.playerId];
            if (player) {
                player.moveToPosition(data.position);
            }
        });

        // Player attacked
        networkManager.on('player:attacked', (data) => {
            const player = this.otherPlayers[data.playerId] || this.localPlayer;
            if (player) {
                // Show attack effect
                this.showAttackEffect(data.position);
            }
        });

        // Player died
        networkManager.on('player:died', (data) => {
            const player = this.otherPlayers[data.playerId];
            if (player) {
                player.die();
            }
            if (data.playerId === networkManager.currentPlayer.id) {
                this.localPlayer.die();
                this.showGameOver();
            }
        });

        // Enemy damaged
        networkManager.on('enemy:damaged', (data) => {
            const enemy = this.enemies[data.enemyId];
            if (enemy) {
                enemy.takeDamage(data.damage);
            }
        });

        // Enemy killed
        networkManager.on('enemy:killed', (data) => {
            const enemy = this.enemies[data.enemyId];
            if (enemy) {
                enemy.die();
                delete this.enemies[data.enemyId];
            }
            if (data.killedBy === networkManager.currentPlayer.id) {
                this.updateKills();
            }
        });

        // Item picked
        networkManager.on('item:picked', (data) => {
            const item = this.items[data.itemId];
            if (item) {
                item.pickup();
                delete this.items[data.itemId];
            }
        });

        // Chat
        networkManager.on('chat:message', (data) => {
            this.showChatMessage(data.username, data.message);
        });
    }

    update(time, delta) {
        if (!this.localPlayer) return;

        // Player movement
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -1;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = 1;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -1;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = 1;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }

        this.localPlayer.move(velocityX, velocityY);

        // Update UI
        this.updateUI();

        // Check item collisions
        Object.values(this.items).forEach(item => {
            if (item.checkCollision(this.localPlayer.sprite.x, this.localPlayer.sprite.y)) {
                networkManager.pickupItem(item.data.id);
            }
        });

        // Check enemy collisions for attack
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.attackNearestEnemy();
        }
    }

    updateUI() {
        if (!this.localPlayer) return;

        const player = this.localPlayer;
        const healthPercent = player.health / player.maxHealth;

        this.healthBar.width = 200 * healthPercent;
        this.healthBar.setFillStyle(
            healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000
        );
        this.healthText.setText(`${player.health}/${player.maxHealth}`);

        this.statsText.setText(
            `Level: ${player.level}\nXP: ${player.experience}\nClass: ${player.class}`
        );
    }

    updateKills() {
        const kills = networkManager.currentPlayer.kills || 0;
        this.killsText.setText(`Kills: ${kills}`);
    }

    attackNearestEnemy() {
        let nearest = null;
        let minDist = 100; // Attack range

        Object.values(this.enemies).forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(
                this.localPlayer.sprite.x,
                this.localPlayer.sprite.y,
                enemy.sprite.x,
                enemy.sprite.y
            );

            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        if (nearest) {
            const damage = this.localPlayer.stats.strength;
            networkManager.hitEnemy(nearest.data.id, damage);
            this.showAttackEffect(nearest.sprite);
        }
    }

    showAttackEffect(target) {
        const x = target.x || target;
        const y = target.y || target;

        const effect = this.add.circle(x, y, 20, 0xff0000, 0.5);
        this.tweens.add({
            targets: effect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => effect.destroy()
        });
    }

    showChatMessage(username, message) {
        const chatText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.scrollY + 100,
            `${username}: ${message}`,
            {
                font: '14px monospace',
                fill: '#00ffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setScrollFactor(0);

        this.tweens.add({
            targets: chatText,
            y: this.cameras.main.scrollY + 80,
            alpha: 0,
            duration: 3000,
            onComplete: () => chatText.destroy()
        });
    }

    showGameOver() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(
            this.cameras.main.scrollX + width / 2,
            this.cameras.main.scrollY + height / 2,
            width,
            height,
            0x000000,
            0.8
        ).setScrollFactor(0);

        const gameOverText = this.add.text(
            this.cameras.main.scrollX + width / 2,
            this.cameras.main.scrollY + height / 2 - 50,
            'YOU DIED',
            {
                font: '64px monospace',
                fill: '#ff0000'
            }
        ).setOrigin(0.5).setScrollFactor(0);

        const respawnText = this.add.text(
            this.cameras.main.scrollX + width / 2,
            this.cameras.main.scrollY + height / 2 + 50,
            'Click to return to menu',
            {
                font: '20px monospace',
                fill: '#ffffff'
            }
        ).setOrigin(0.5).setScrollFactor(0);

        this.input.once('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    shutdown() {
        networkManager.off('player:moved');
        networkManager.off('player:attacked');
        networkManager.off('player:died');
        networkManager.off('enemy:damaged');
        networkManager.off('enemy:killed');
        networkManager.off('item:picked');
        networkManager.off('chat:message');
    }
}
