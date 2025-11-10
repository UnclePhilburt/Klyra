// Main game initialization
const config = {
    type: Phaser.AUTO,
    width: GameConfig.GAME.WIDTH,
    height: GameConfig.GAME.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    pixelArt: GameConfig.GAME.PIXEL_ART,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);

// Hide loading screen when game starts
game.events.once('ready', () => {
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }, 1000);
});
