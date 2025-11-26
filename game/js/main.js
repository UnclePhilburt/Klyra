// Main game initialization
const config = {
    type: Phaser.WEBGL, // Force WebGL for better performance
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    pixelArt: GameConfig.GAME.PIXEL_ART,
    disableContextMenu: true,
    // Performance optimizations - realistic 60 FPS target
    fps: {
        target: 60,  // Stable 60 FPS target (realistic for this game)
        forceSetTimeOut: false,
        smoothStep: true,  // Smooth frame timing for consistent feel
        min: 30,     // Minimum acceptable FPS before slowdown
        deltaMin: 4, // Min delta time (ms) for smooth interpolation
        deltaMax: 33 // Max delta time (ms) to prevent large jumps
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
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: '100%',
        height: '100%'
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

const game = new Phaser.Game(config);

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
game.connect = async function(username, overrideCharacter = null) {
    console.log('🎮 Connecting to game...', username, overrideCharacter ? `(char: ${overrideCharacter})` : '');

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

        // Get selected character - use override if provided (for auto-reconnect), otherwise read from UI
        const selectedCharacter = overrideCharacter ||
            (window.characterSelectManager
                ? window.characterSelectManager.getSelectedCharacter()
                : 'MALACHAR');

        console.log('⚔️ Selected character:', selectedCharacter, overrideCharacter ? '(from auto-reconnect)' : '(from UI)');

        // Join game
        networkManager.joinGame(username, selectedCharacter);

        // Show game container and Phaser canvas
        document.getElementById('game-container').style.display = 'block';
        game.canvas.style.display = 'block';

        // Wait for game:start event
        return new Promise((resolve, reject) => {
            networkManager.on('game:start', (data) => {
                console.log('🎮 Game started!');
                console.log('🚀 Starting LoadingScene...');

                // Stop all other scenes first
                game.scene.stop('BootScene');
                game.scene.stop('MenuScene');
                game.scene.stop('CharacterSelectScene');
                game.scene.stop('LobbyScene');

                // Start LoadingScene (which will show logo and then launch GameScene)
                game.scene.start('LoadingScene', {
                    username: username,
                    selectedCharacter: selectedCharacter,
                    gameData: data
                });

                console.log('✅ LoadingScene.start() called');
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
