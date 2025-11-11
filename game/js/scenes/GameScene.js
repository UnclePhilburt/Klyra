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

    preload() {
        // Load tileset images for dungeon rendering
        console.log('📦 Loading PNG tilesets...');

        // Terrain tilesets
        this.load.image('terrain_base', 'assets/tilesets/a2_terrain_base.png');
        this.load.image('terrain_green', 'assets/tilesets/a2_terrain_green.png');
        this.load.image('terrain_red', 'assets/tilesets/a2_terrain_red.png');

        // Forest tilesets
        this.load.image('forest', 'assets/tilesets/a2_forest.png');
        this.load.image('forest_extended', 'assets/tilesets/A2_extended_forest_terrain.png');

        // Water tilesets
        this.load.image('water_base', 'assets/tilesets/a1_water_base.png');
        this.load.image('water_green', 'assets/tilesets/a1_water_green.png');
        this.load.image('water_red', 'assets/tilesets/a1_water_red.png');

        // Additional terrain
        this.load.image('walls_floors', 'assets/tilesets/A3 - Walls And Floors.png');
        this.load.image('walls', 'assets/tilesets/A4 - Walls.png');

        console.log('✅ All tilesets queued for loading');
    }

    create() {
        // Show loading message
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.loadingText = this.add.text(width / 2, height / 2, 'Joining game...', {
            font: '24px monospace',
            fill: '#00ff00'
        }).setOrigin(0.5);

        // Wait for game:start event (instant join - no lobby)
        networkManager.on('game:start', (data) => {
            this.gameData = data;
            this.initializeGame();
        });

        // If gameData already exists (from init), initialize immediately
        if (this.gameData) {
            this.initializeGame();
        }
    }

    initializeGame() {
        // Remove loading text
        if (this.loadingText) {
            this.loadingText.destroy();
        }

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
        const { width, height, tiles, biomes, decorations } = dungeonData;

        console.log('🎨 Rendering dungeon with PNG tilesets...');

        // Create container for tiles
        this.tileContainer = this.add.container(0, 0);

        // Map biome types to tileset textures
        const BIOME_TILESET_MAP = {
            // Grassland - Use green terrain
            10: { texture: 'terrain_green', tint: 0xffffff },
            11: { texture: 'terrain_green', tint: 0xeeeeee },
            12: { texture: 'terrain_green', tint: 0xdddddd },

            // Forest - Use forest tiles
            20: { texture: 'forest', tint: 0xffffff },
            21: { texture: 'forest', tint: 0xdddddd },
            22: { texture: 'forest', tint: 0xbbbbbb },

            // Magic Grove - Use base terrain with purple tint
            30: { texture: 'terrain_base', tint: 0xbb88ff },
            31: { texture: 'terrain_base', tint: 0xaa77ee },
            32: { texture: 'terrain_base', tint: 0x9966dd },

            // Dark Woods - Use forest with dark tint
            40: { texture: 'forest', tint: 0x666666 },
            41: { texture: 'forest', tint: 0x555555 },
            42: { texture: 'forest', tint: 0x444444 },

            // Crystal Plains - Use water base
            50: { texture: 'water_base', tint: 0xaaffff },
            51: { texture: 'water_base', tint: 0x88ddff },
            52: { texture: 'water_base', tint: 0x66bbff },

            // Void Zone - Use terrain with dark purple tint
            60: { texture: 'terrain_base', tint: 0x442266 },
            61: { texture: 'terrain_base', tint: 0x331155 },
            62: { texture: 'terrain_base', tint: 0x220044 }
        };

        // Render tiles using PNG sprites
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = tiles[y][x];
                const px = x * tileSize;
                const py = y * tileSize;

                // Get tileset mapping for this biome
                const tileInfo = BIOME_TILESET_MAP[tile] || { texture: 'terrain_base', tint: 0xffffff };

                // Create sprite from tileset
                const tileSprite = this.add.image(px, py, tileInfo.texture);
                tileSprite.setOrigin(0, 0);
                tileSprite.setDisplaySize(tileSize, tileSize);
                tileSprite.setTint(tileInfo.tint);

                // Add slight depth by varying alpha slightly
                const depthVariation = 0.05 * ((x + y) % 3);
                tileSprite.setAlpha(0.95 + depthVariation);

                this.tileContainer.add(tileSprite);
            }
        }

        // Render decorations (trees, crystals, rocks, etc.)
        if (decorations) {
            decorations.forEach(deco => {
                this.createDecoration(deco.x, deco.y, deco.type, tileSize);
            });
        }

        // Set world bounds
        this.physics.world.setBounds(0, 0, width * tileSize, height * tileSize);
        this.cameras.main.setBounds(0, 0, width * tileSize, height * tileSize);

        // Store tiles for collision
        this.dungeonTiles = tiles;

        console.log(`✅ Dungeon rendered with ${width * height} PNG tiles`);
    }

    adjustColor(color, amount) {
        const r = Math.max(0, Math.min(255, ((color >> 16) & 0xFF) + amount));
        const g = Math.max(0, Math.min(255, ((color >> 8) & 0xFF) + amount));
        const b = Math.max(0, Math.min(255, (color & 0xFF) + amount));
        return (r << 16) | (g << 8) | b;
    }

    createDecoration(x, y, type, tileSize) {
        const px = x * tileSize + tileSize / 2;
        const py = y * tileSize + tileSize / 2;

        const DECORATION_STYLES = {
            // Grassland decorations
            flower: { color: 0xff69b4, size: 4, shape: 'star' },
            rock: { color: 0x808080, size: 6, shape: 'circle' },

            // Forest decorations
            tree: { color: 0x2d5016, size: 8, shape: 'triangle' },
            bush: { color: 0x3d6026, size: 5, shape: 'circle' },

            // Magic decorations
            magic_tree: { color: 0xff00ff, size: 10, shape: 'star', glow: true },
            rune_stone: { color: 0x00ffff, size: 7, shape: 'diamond', glow: true },

            // Dark decorations
            dead_tree: { color: 0x3a3a3a, size: 9, shape: 'line' },
            skull: { color: 0xeeeeee, size: 6, shape: 'circle' },

            // Crystal decorations
            crystal: { color: 0x00ffff, size: 8, shape: 'diamond', glow: true },
            gem_rock: { color: 0x4dd0e1, size: 7, shape: 'star', glow: true },

            // Void decorations
            void_portal: { color: 0x8b00ff, size: 10, shape: 'circle', glow: true, pulse: true },
            shadow: { color: 0x1a0a2a, size: 8, shape: 'circle' }
        };

        const style = DECORATION_STYLES[type];
        if (!style) return;

        // Draw decoration based on shape
        let decoration;
        switch (style.shape) {
            case 'star':
                decoration = this.add.star(px, py, 5, style.size/2, style.size, style.color);
                break;
            case 'circle':
                decoration = this.add.circle(px, py, style.size, style.color);
                break;
            case 'triangle':
                decoration = this.add.triangle(px, py, 0, style.size, -style.size, -style.size, style.size, -style.size, style.color);
                break;
            case 'diamond':
                decoration = this.add.star(px, py, 4, style.size/2, style.size, style.color);
                break;
            case 'line':
                decoration = this.add.rectangle(px, py, 2, style.size * 2, style.color);
                break;
        }

        // Add glow effect for magical items
        if (style.glow) {
            const glow = this.add.circle(px, py, style.size + 4, style.color, 0.2);

            if (style.pulse) {
                this.tweens.add({
                    targets: glow,
                    alpha: 0.4,
                    scale: 1.2,
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // Add subtle floating animation to some decorations
        if (type.includes('magic') || type.includes('crystal') || type.includes('void')) {
            this.tweens.add({
                targets: decoration,
                y: py - 3,
                duration: 2000 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
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
