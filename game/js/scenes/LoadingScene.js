/**
 * LoadingScene - Shows loading screen while chunks preload
 */
class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
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

        // Get dimensions from canvas element
        const canvas = this.game.canvas;
        const width = canvas.width || window.innerWidth;
        const height = canvas.height || window.innerHeight;

        console.log('🎬 Canvas size:', width, 'x', height);
        console.log('🔍 Logo texture exists:', this.textures.exists('logo'));
        console.log('🔍 Logo sound exists:', this.cache.audio.exists('logo_sound'));

        // Create black background
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
        bg.setDepth(10000); // Very high depth to be on top
        console.log('  Background created:', bg);

        // Add logo image
        if (this.textures.exists('logo')) {
            try {
                console.log('🖼️ Creating logo image...');
                this.logo = this.add.image(width / 2, height / 2 - 150, 'logo');
                this.logo.setOrigin(0.5);
                this.logo.setDepth(100000); // Very high depth to ensure it's on top
                this.logo.setAlpha(1); // Ensure it's fully visible
                this.logo.setVisible(true); // Ensure visibility is on

                // Scale logo to fit screen nicely (max 400px wide)
                const maxWidth = 400;
                if (this.logo.width > maxWidth) {
                    const scale = maxWidth / this.logo.width;
                    this.logo.setScale(scale);
                }

                // Make sure it's not scrolling with camera
                this.logo.setScrollFactor(0);

                console.log('✅ Logo created:', this.logo.width, 'x', this.logo.height, 'at position', this.logo.x, this.logo.y, 'depth:', this.logo.depth);
            } catch (error) {
                console.error('❌ Failed to create logo image:', error);
            }
        } else {
            console.error('❌ Logo texture not found in cache!');
        }

        // Play logo sound
        if (this.sound && this.cache.audio.exists('logo_sound')) {
            this.sound.play('logo_sound', { volume: 0.21 });
            console.log('🔊 Logo sound playing at 21% volume');
        } else {
            console.error('❌ Logo sound not found in cache!');
        }

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
