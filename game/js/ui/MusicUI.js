// Music UI - Modern glass morphism music controls
class MusicUI {
    constructor(scene, musicManager) {
        this.scene = scene;
        this.musicManager = musicManager;
        this.elements = [];
        this.volumeSliderVisible = false;
        this.isAnimating = false;

        this.createUI();

        // Listen for track changes
        this.musicManager.onTrackChange = (track) => {
            this.updateTrackDisplay(track);
        };
    }

    createUI() {
        const width = this.scene.cameras.main.width;

        // Create container for the entire UI
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(99998);

        // Glass morphism background with gradient
        const bgGraphics = this.scene.add.graphics();
        bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 0.95, 0.95, 0.85, 0.85);
        bgGraphics.fillRoundedRect(10, 5, width - 20, 40, 20);
        
        // Add subtle border glow
        bgGraphics.lineStyle(2, 0x00d4ff, 0.3);
        bgGraphics.strokeRoundedRect(10, 5, width - 20, 40, 20);
        
        this.container.add(bgGraphics);
        this.elements.push(bgGraphics);

        // Animated equalizer bars (left side decoration)
        this.createEqualizerBars(30, 15);

        // Track title with glow effect
        this.trackTitle = this.scene.add.text(80, 25, '♪ Loading...', {
            fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
            fontSize: '14px',
            fontStyle: '600',
            fill: '#ffffff',
            stroke: '#00d4ff',
            strokeThickness: 0.5
        });
        this.trackTitle.setOrigin(0, 0.5);
        this.trackTitle.setScrollFactor(0);
        this.trackTitle.setDepth(99999);
        this.trackTitle.setShadow(0, 0, '#00d4ff', 8, false, true);
        
        // Pulsing animation for track title
        this.scene.tweens.add({
            targets: this.trackTitle,
            alpha: { from: 1, to: 0.7 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.elements.push(this.trackTitle);

        // Progress bar (subtle under title)
        this.createProgressBar(80, 35, width - 250);

        // Buttons container (right side)
        const buttonX = width - 180;
        const buttonY = 25;

        // Skip button
        this.skipButton = this.createModernButton(buttonX, buttonY, '⏭', () => {
            this.musicManager.skipTrack();
            this.animateButtonPress(this.skipButton);
        });

        // Mute button
        this.muteButton = this.createModernButton(buttonX + 45, buttonY, '🔊', () => {
            const isMuted = this.musicManager.toggleMute();
            this.muteButton.setText(isMuted ? '🔇' : '🔊');
            this.animateButtonPress(this.muteButton);
        });

        // Volume button
        this.volumeButton = this.createModernButton(buttonX + 90, buttonY, '🎚', () => {
            this.toggleVolumeSlider();
            this.animateButtonPress(this.volumeButton);
        });

        // Volume slider (initially hidden)
        this.createModernVolumeSlider(buttonX + 135, buttonY);

        // Update initial track display
        const currentTrack = this.musicManager.getCurrentTrack();
        if (currentTrack) {
            this.updateTrackDisplay(currentTrack);
        }
    }

    createEqualizerBars(x, y) {
        this.eqBars = [];
        const barCount = 4;
        const barWidth = 3;
        const barSpacing = 5;

        for (let i = 0; i < barCount; i++) {
            const bar = this.scene.add.rectangle(
                x + (i * (barWidth + barSpacing)),
                y,
                barWidth,
                10,
                0x00d4ff
            );
            bar.setOrigin(0.5, 1);
            bar.setScrollFactor(0);
            bar.setDepth(99999);

            // Animate each bar at different speeds
            this.scene.tweens.add({
                targets: bar,
                scaleY: { from: 0.3, to: 1 },
                duration: 300 + (i * 100),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.eqBars.push(bar);
            this.elements.push(bar);
        }
    }

    createProgressBar(x, y, width) {
        // Background track
        this.progressBg = this.scene.add.rectangle(x, y, width, 2, 0x333333, 0.5);
        this.progressBg.setOrigin(0, 0.5);
        this.progressBg.setScrollFactor(0);
        this.progressBg.setDepth(99999);
        this.elements.push(this.progressBg);

        // Progress fill with gradient effect
        this.progressFill = this.scene.add.rectangle(x, y, 0, 2, 0x00d4ff);
        this.progressFill.setOrigin(0, 0.5);
        this.progressFill.setScrollFactor(0);
        this.progressFill.setDepth(100000);
        this.elements.push(this.progressFill);

        // Store max width for updates
        this.progressMaxWidth = width;
    }

    createModernButton(x, y, icon, callback) {
        // Button background circle
        const buttonBg = this.scene.add.circle(x, y, 16, 0x2a2a4e, 0.8);
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(99999);
        this.elements.push(buttonBg);

        // Button glow (invisible by default)
        const buttonGlow = this.scene.add.circle(x, y, 20, 0x00d4ff, 0);
        buttonGlow.setScrollFactor(0);
        buttonGlow.setDepth(99998);
        this.elements.push(buttonGlow);

        // Button text/icon
        const button = this.scene.add.text(x, y, icon, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fill: '#ffffff'
        });
        button.setOrigin(0.5);
        button.setScrollFactor(0);
        button.setDepth(100000);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', callback);

        button.on('pointerover', () => {
            // Hover animation
            this.scene.tweens.add({
                targets: buttonBg,
                scale: 1.15,
                alpha: 1,
                duration: 150,
                ease: 'Back.easeOut'
            });
            this.scene.tweens.add({
                targets: buttonGlow,
                alpha: 0.3,
                duration: 150
            });
            button.setTint(0x00d4ff);
        });

        button.on('pointerout', () => {
            // Reset animation
            this.scene.tweens.add({
                targets: buttonBg,
                scale: 1.0,
                alpha: 0.8,
                duration: 150,
                ease: 'Back.easeIn'
            });
            this.scene.tweens.add({
                targets: buttonGlow,
                alpha: 0,
                duration: 150
            });
            button.clearTint();
        });

        this.elements.push(button);
        button.bgCircle = buttonBg;
        button.glowCircle = buttonGlow;
        return button;
    }

    animateButtonPress(button) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // Ripple effect
        const ripple = this.scene.add.circle(button.x, button.y, 16, 0x00d4ff, 0.5);
        ripple.setScrollFactor(0);
        ripple.setDepth(99997);

        this.scene.tweens.add({
            targets: ripple,
            scale: 2,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                ripple.destroy();
                this.isAnimating = false;
            }
        });

        // Button press animation
        this.scene.tweens.add({
            targets: button.bgCircle,
            scale: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    createModernVolumeSlider(x, y) {
        // Slider container with glass effect
        this.sliderContainer = this.scene.add.container(x, y);
        this.sliderContainer.setScrollFactor(0);
        this.sliderContainer.setDepth(99999);
        this.sliderContainer.setVisible(false);

        const sliderGraphics = this.scene.add.graphics();
        sliderGraphics.fillStyle(0x1a1a2e, 0.95);
        sliderGraphics.fillRoundedRect(-5, -15, 110, 30, 15);
        sliderGraphics.lineStyle(1.5, 0x00d4ff, 0.4);
        sliderGraphics.strokeRoundedRect(-5, -15, 110, 30, 15);
        this.sliderContainer.add(sliderGraphics);

        // Slider track background
        this.sliderBg = this.scene.add.rectangle(50, 0, 90, 6, 0x333333, 0.6);
        this.sliderBg.setScrollFactor(0);
        this.sliderBg.setDepth(99999);
        this.sliderContainer.add(this.sliderBg);

        // Slider fill with gradient
        this.sliderFill = this.scene.add.rectangle(
            5, 0, 90 * this.musicManager.getVolume(), 6, 0x00d4ff
        );
        this.sliderFill.setOrigin(0, 0.5);
        this.sliderFill.setScrollFactor(0);
        this.sliderFill.setDepth(100000);
        this.sliderContainer.add(this.sliderFill);

        // Slider handle with glow
        const handleGlow = this.scene.add.circle(
            5 + (90 * this.musicManager.getVolume()), 0, 12, 0x00d4ff, 0.3
        );
        handleGlow.setScrollFactor(0);
        handleGlow.setDepth(100000);
        this.sliderContainer.add(handleGlow);

        this.sliderHandle = this.scene.add.circle(
            5 + (90 * this.musicManager.getVolume()), 0, 8, 0xffffff
        );
        this.sliderHandle.setScrollFactor(0);
        this.sliderHandle.setDepth(100001);
        this.sliderHandle.setInteractive({ draggable: true, useHandCursor: true });
        this.sliderContainer.add(this.sliderHandle);

        // Pulse animation on handle
        this.scene.tweens.add({
            targets: handleGlow,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.3, to: 0.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Drag functionality
        this.sliderHandle.on('drag', (pointer) => {
            const localX = pointer.x - this.sliderContainer.x;
            const sliderWidth = 90;
            const newX = Phaser.Math.Clamp(localX, 5, 95);

            this.sliderHandle.x = newX;
            handleGlow.x = newX;
            const volume = (newX - 5) / sliderWidth;
            this.sliderFill.width = sliderWidth * volume;

            this.musicManager.setVolume(volume);
        });

        // Hover effect on handle
        this.sliderHandle.on('pointerover', () => {
            this.scene.tweens.add({
                targets: this.sliderHandle,
                scale: 1.2,
                duration: 150,
                ease: 'Back.easeOut'
            });
        });

        this.sliderHandle.on('pointerout', () => {
            this.scene.tweens.add({
                targets: this.sliderHandle,
                scale: 1.0,
                duration: 150,
                ease: 'Back.easeIn'
            });
        });

        // Click on slider to jump
        this.sliderBg.setInteractive({ useHandCursor: true });
        this.sliderBg.on('pointerdown', (pointer) => {
            const localX = pointer.x - this.sliderContainer.x;
            const sliderWidth = 90;
            const clickX = Phaser.Math.Clamp(localX, 5, 95);

            this.sliderHandle.x = clickX;
            handleGlow.x = clickX;
            const volume = (clickX - 5) / sliderWidth;
            this.sliderFill.width = sliderWidth * volume;

            this.musicManager.setVolume(volume);
        });

        this.elements.push(this.sliderContainer);
        this.sliderHandleGlow = handleGlow;
    }

    toggleVolumeSlider() {
        this.volumeSliderVisible = !this.volumeSliderVisible;
        
        if (this.volumeSliderVisible) {
            this.sliderContainer.setVisible(true);
            this.sliderContainer.setAlpha(0);
            this.scene.tweens.add({
                targets: this.sliderContainer,
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
        } else {
            this.scene.tweens.add({
                targets: this.sliderContainer,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    this.sliderContainer.setVisible(false);
                }
            });
        }
    }

    updateTrackDisplay(track) {
        if (track && this.trackTitle) {
            // Fade out old title
            this.scene.tweens.add({
                targets: this.trackTitle,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.trackTitle.setText(`♪ ${track.title}`);
                    // Fade in new title
                    this.scene.tweens.add({
                        targets: this.trackTitle,
                        alpha: 1,
                        duration: 200
                    });
                }
            });
        }
    }

    update() {
        // Update progress bar based on actual playback
        if (this.progressFill && this.musicManager) {
            const progress = this.musicManager.getProgress();
            this.progressFill.width = this.progressMaxWidth * progress;
        }
    }

    destroy() {
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
        
        if (this.container) {
            this.container.destroy();
        }
    }
}