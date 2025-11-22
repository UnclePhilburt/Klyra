// Main game initialization
const config = {
    type: Phaser.WEBGL, // Force WebGL for better performance
    width: GameConfig.GAME.WIDTH,
    height: GameConfig.GAME.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    pixelArt: GameConfig.GAME.PIXEL_ART,
    disableContextMenu: true,
    // Performance optimizations
    fps: {
        target: 144, // Allow up to 144 FPS (no artificial limit)
        forceSetTimeOut: false,
        smoothStep: true
    },
    render: {
        antialias: false, // Disable for pixel art and performance
        pixelArt: true,
        roundPixels: true,
        batchSize: 4096, // Increase batch size for better performance
        powerPreference: 'high-performance' // Use dedicated GPU
    },
    audio: {
        disableWebAudio: false,
        noAudio: false
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
            // Removed fps: 60 - let physics run at render FPS
        }
    },
    input: {
        gamepad: true
    },
    scene: [BootScene, MenuScene, CharacterSelectScene, LobbyScene, LoadingScene, GameScene]
};

// Verify all scenes are defined
console.log('Scene classes check:');
console.log('  BootScene:', typeof BootScene);
console.log('  MenuScene:', typeof MenuScene);
console.log('  CharacterSelectScene:', typeof CharacterSelectScene);
console.log('  LobbyScene:', typeof LobbyScene);
console.log('  LoadingScene:', typeof LoadingScene);
console.log('  GameScene:', typeof GameScene);

const game = new Phaser.Game(config);

console.log('Game created, scenes:', game.scene.keys);

// Fix for random loud sounds when refocusing window
// Stop all sounds when losing focus, prevent queued sounds on resume
game.events.on('pause', () => {
    console.log('🔇 Game paused - stopping all sounds');
    if (game.sound) {
        game.sound.stopAll();
    }
});

game.events.on('resume', () => {
    console.log('🔊 Game resumed - sounds cleared');
    // Sounds are already stopped, resume will start fresh
});

// Also handle browser visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('🔇 Tab hidden - stopping all sounds');
        if (game.sound) {
            game.sound.stopAll();
        }
    } else {
        console.log('🔊 Tab visible - ready for new sounds');
    }
});

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
        console.log('📡 Connecting to server...');
        await networkManager.connect();
        console.log('✅ Connected to server');
        console.log('🎮 Waiting for game:start event...');

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
                console.log('🚀 Starting GameScene with built-in loading screen...');

                // Stop all other scenes first
                game.scene.stop('BootScene');
                game.scene.stop('MenuScene');
                game.scene.stop('CharacterSelectScene');
                game.scene.stop('LobbyScene');

                // Start GameScene directly (has built-in loading screen now)
                game.scene.start('GameScene', {
                    username: username,
                    selectedCharacter: selectedCharacter,
                    gameData: data
                });

                console.log('✅ GameScene.start() called');
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
