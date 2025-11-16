// Main game initialization
const config = {
    type: Phaser.AUTO,
    width: GameConfig.GAME.WIDTH,
    height: GameConfig.GAME.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    pixelArt: GameConfig.GAME.PIXEL_ART,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    input: {
        gamepad: true
    },
    scene: [BootScene, MenuScene, CharacterSelectScene, LobbyScene, GameScene]
};

const game = new Phaser.Game(config);

// Add connect method for custom menu system
game.connect = async function(username) {
    console.log('🎮 Connecting to game...', username);

    try {
        // Wait for BootScene to finish loading assets
        const bootScene = game.scene.getScene('BootScene');
        if (bootScene && !bootScene.scene.isActive('BootScene')) {
            console.log('⏳ Waiting for assets to load...');
            await new Promise((resolve) => {
                const checkBoot = setInterval(() => {
                    if (bootScene.anims && bootScene.anims.exists('kelise_idle')) {
                        clearInterval(checkBoot);
                        console.log('✅ Assets loaded');
                        resolve();
                    }
                }, 100);
            });
        }

        // Connect to server
        await networkManager.connect();
        console.log('✅ Connected to server');

        // Get selected character from CharacterSelectManager
        const selectedCharacter = window.characterSelectManager
            ? window.characterSelectManager.getSelectedCharacter()
            : 'MALACHAR';

        console.log('⚔️ Selected character:', selectedCharacter);

        // Join game
        networkManager.joinGame(username, selectedCharacter);

        // Show game container and Phaser canvas
        document.getElementById('game-container').style.display = 'block';
        game.canvas.style.display = 'block';

        // Wait for game:start event
        return new Promise((resolve, reject) => {
            networkManager.on('game:start', (data) => {
                console.log('🎮 Game started!');

                // Start GameScene directly
                game.scene.start('GameScene', {
                    username: username,
                    selectedCharacter: selectedCharacter,
                    gameData: data
                });

                resolve();
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);
        });

    } catch (error) {
        console.error('❌ Connection failed:', error);
        throw error;
    }
};

// Expose game globally for menu system
window.game = game;
