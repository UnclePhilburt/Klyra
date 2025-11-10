// Boot Scene - Load assets and connect to server
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#00ff00'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Here you would load sprites, tilesets, etc.
        // For now, we'll use simple shapes
    }

    async create() {
        console.log('🚀 Booting game...');

        try {
            await networkManager.connect();
            console.log('✅ Connected to server');

            // Wait a moment then go to menu
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });

        } catch (error) {
            console.error('❌ Failed to connect:', error);

            // Show error message
            const errorText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                'Failed to connect to server\nClick to retry',
                {
                    font: '24px monospace',
                    fill: '#ff0000',
                    align: 'center'
                }
            );
            errorText.setOrigin(0.5);

            this.input.once('pointerdown', () => {
                this.scene.restart();
            });
        }
    }
}
