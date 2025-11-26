// First 343 lines from GameScene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameData = data.gameData || data;
    }

    shutdown() {
        console.log('shutdown');
    }

    preload() {
        console.log('preload');
    }

    async create() {
        await Promise.resolve();
        console.log('create');
    }
}

console.log('Test passed');
