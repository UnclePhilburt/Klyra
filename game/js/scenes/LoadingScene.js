/**
 * LoadingScene - Shows loading screen while chunks preload
 */
class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
        console.log('🎬 LoadingScene constructor called');
    }

    init(data) {
        console.log('🎬 LoadingScene init() called with data:', data);
        // Store data passed from main menu
        this.gameData = data.gameData;
        this.username = data.username;
        this.selectedCharacter = data.selectedCharacter;
    }

    create() {
        console.log('🎬 LoadingScene create() called');
        console.log('🎬 Camera size:', this.cameras.main.width, 'x', this.cameras.main.height);
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create black background
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
        bg.setDepth(10000); // Very high depth to be on top
        console.log('  Background created:', bg);

        // Loading title
        this.loadingText = this.add.text(width / 2, height / 2 - 60, 'LOADING WORLD', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '32px',
            fill: '#00ff00'
        });
        this.loadingText.setOrigin(0.5);
        this.loadingText.setDepth(10001);
        console.log('  Loading text created:', this.loadingText);

        // Progress text
        this.progressText = this.add.text(width / 2, height / 2, 'Preparing chunks...', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '14px',
            fill: '#ffffff'
        });
        this.progressText.setOrigin(0.5);
        this.progressText.setDepth(10001);

        // Percentage text
        this.percentText = this.add.text(width / 2, height / 2 + 40, '0%', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '18px',
            fill: '#00ff00'
        });
        this.percentText.setOrigin(0.5);
        this.percentText.setDepth(10001);

        // Tip text
        const tips = [
            'Tip: Use WASD to move',
            'Tip: Use QERF for abilities',
            'Tip: Press I for inventory',
            'Tip: Level up to unlock new abilities',
            'Tip: Work together with other players'
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        this.tipText = this.add.text(width / 2, height / 2 + 100, randomTip, {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            fill: '#888888'
        });
        this.tipText.setOrigin(0.5);
        this.tipText.setDepth(10001);

        // Pulsing animation on loading text
        this.tweens.add({
            targets: this.loadingText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        console.log('📺 LoadingScene created - starting chunk preload...');

        // Small delay to ensure everything is rendered
        this.time.delayedCall(100, () => {
            this.startPreloading();
        });
    }

    startPreloading() {
        console.log('🔄 Starting GameScene in background...');

        // Launch GameScene - let it run but LoadingScene UI is on top
        this.scene.launch('GameScene', {
            username: this.username,
            selectedCharacter: this.selectedCharacter,
            gameData: this.gameData,
            loadingScene: this // Pass reference to update progress
        });

        console.log('✅ GameScene launched (running in background)');
    }

    updateProgress(current, total) {
        const percent = Math.floor((current / total) * 100);
        this.percentText.setText(`${percent}%`);
        this.progressText.setText(`Loading chunks: ${current}/${total}`);
    }

    finishLoading() {
        console.log('✅ Loading complete - starting game!');

        // Fade out loading screen
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Resume GameScene and stop LoadingScene
            console.log('▶️ Resuming GameScene, stopping LoadingScene');
            this.scene.resume('GameScene');
            this.scene.stop('LoadingScene');
        });
    }
}
