// Music UI - Modern Centered Design
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
        
        // Calculate centered position
        const panelWidth = 700;
        const panelHeight = 85;
        const centerX = width / 2;
        const panelX = centerX - panelWidth / 2;

        // Create main container centered at top
        this.mainContainer = this.scene.add.container(0, 0);
        this.mainContainer.setScrollFactor(0);
        this.mainContainer.setDepth(99998);

        // Modern glass morphism background
        const bgGraphics = this.scene.add.graphics();
        
        // Main background with gradient
        bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 0.95, 0.95, 0.9, 0.9);
        bgGraphics.fillRoundedRect(panelX, 15, panelWidth, panelHeight, 30);
        
        // Glowing border
        bgGraphics.lineStyle(3, 0x00d4ff, 0.5);
        bgGraphics.strokeRoundedRect(panelX, 15, panelWidth, panelHeight, 30);
        
        // Inner subtle highlight
        bgGraphics.lineStyle(1.5, 0xffffff, 0.2);
        bgGraphics.strokeRoundedRect(panelX + 3, 18, panelWidth - 6, panelHeight - 6, 27);
        
        this.mainContainer.add(bgGraphics);
        this.elements.push(bgGraphics);

        // Animated equalizer bars (left side)
        this.createEqualizerBars(panelX + 40, 60);

        // Track title with modern styling
        this.trackTitle = this.scene.add.text(panelX + 130, 45, '♪ Loading Track...', {
            fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
            fontSize: '22px',
            fontStyle: '600',
            fill: '#ffffff',
            stroke: '#00d4ff',
            strokeThickness: 1
        });
        this.trackTitle.setOrigin(0, 0.5);
        this.trackTitle.setScrollFactor(0);
        this.trackTitle.setDepth(99999);
        this.trackTitle.setShadow(0, 0, '#00d4ff', 12, false, true);
        
        // Pulsing glow animation
        this.scene.tweens.add({
            targets: this.trackTitle,
            alpha: { from: 1, to: 0.75 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.mainContainer.add(this.trackTitle);
        this.elements.push(this.trackTitle);

        // Progress bar below title
        this.createProgressBar(panelX + 130, 68, 380);

        // Control buttons (right side)
        const buttonStartX = panelX + panelWidth - 200;
        const buttonY = 57;

        // Skip button
        this.skipButton = this.createModernButton(buttonStartX, buttonY, '⏭', () => {
            this.musicManager.skipTrack();
            this.animateButtonPress(this.skipButton);
        });

        // Mute button
        this.muteButton = this.createModernButton(buttonStartX + 60, buttonY, '🔊', () => {
            const isMuted = this.musicManager.toggleMute();
            this.muteButton.setText(isMuted ? '🔇' : '🔊');
            this.animateButtonPress(this.muteButton);
        });

        // Volume button
        this.volumeButton = this.createModernButton(buttonStartX + 120, buttonY, '🎚', () => {
            this.toggleVolumeSlider();
            this.animateButtonPress(this.volumeButton);
        });

        // Store positions for volume slider
        this.panelCenterX = centerX;
        this.panelBottom = 15 + panelHeight;

        // Volume slider (initially hidden, appears below panel)
        this.createModernVolumeSlider();

        // Update initial track display
        const currentTrack = this.musicManager.getCurrentTrack();
        if (currentTrack) {
            this.updateTrackDisplay(currentTrack);
        }
    }

    createEqualizerBars(x, y) {
        this.eqBars = [];
        const barCount = 5;
        const barWidth = 6;
        const barSpacing = 8;
        const maxHeight = 30;

        for (let i = 0; i < barCount; i++) {
            const bar = this.scene.add.rectangle(
                x + (i * (barWidth + barSpacing)),
                y,
                barWidth,
                maxHeight,
                0x00d4ff
            );
            bar.setOrigin(0.5, 1);
            bar.setScrollFactor(0);
            bar.setDepth(99999);

            // Animate each bar at different speeds
            this.scene.tweens.add({
                targets: bar,
                scaleY: { from: 0.3, to: 1 },
                duration: 400 + (i * 150),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.mainContainer.add(bar);
            this.eqBars.push(bar);
            this.elements.push(bar);
        }
    }

    createProgressBar(x, y, width) {
        // Background track
        const trackBg = this.scene.add.rectangle(x, y, width, 4, 0x333333, 0.6);
        trackBg.setOrigin(0, 0.5);
        trackBg.setScrollFactor(0);
        trackBg.setDepth(99999);
        this.mainContainer.add(trackBg);
        this.elements.push(trackBg);

        // Progress fill with gradient
        this.progressFill = this.scene.add.rectangle(x, y, 0, 4, 0x00d4ff);
        this.progressFill.setOrigin(0, 0.5);
        this.progressFill.setScrollFactor(0);
        this.progressFill.setDepth(100000);
        this.mainContainer.add(this.progressFill);
        this.elements.push(this.progressFill);

        // Glowing tip
        this.progressGlow = this.scene.add.circle(x, y, 6, 0x00d4ff, 0.8);
        this.progressGlow.setScrollFactor(0);
        this.progressGlow.setDepth(100001);
        this.mainContainer.add(this.progressGlow);
        this.elements.push(this.progressGlow);

        // Pulse animation on glow
        this.scene.tweens.add({
            targets: this.progressGlow,
            scale: { from: 1, to: 1.4 },
            alpha: { from: 0.8, to: 0.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Store for real-time updates
        this.progressMaxWidth = width;
        this.progressBarX = x;
        this.progressBarY = y;
    }

    createModernButton(x, y, icon, callback) {
        // Button background circle
        const buttonBg = this.scene.add.circle(x, y, 20, 0x2a2a4e, 0.9);
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(99999);
        this.mainContainer.add(buttonBg);
        this.elements.push(buttonBg);

        // Button glow
        const buttonGlow = this.scene.add.circle(x, y, 26, 0x00d4ff, 0);
        buttonGlow.setScrollFactor(0);
        buttonGlow.setDepth(99998);
        this.mainContainer.add(buttonGlow);
        this.elements.push(buttonGlow);

        // Button icon
        const button = this.scene.add.text(x, y, icon, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            fill: '#ffffff'
        });
        button.setOrigin(0.5);
        button.setScrollFactor(0);
        button.setDepth(100000);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', callback);

        button.on('pointerover', () => {
            this.scene.tweens.add({
                targets: buttonBg,
                scale: 1.2,
                alpha: 1,
                duration: 200,
                ease: 'Back.easeOut'
            });
            this.scene.tweens.add({
                targets: buttonGlow,
                alpha: 0.4,
                duration: 200
            });
            button.setTint(0x00d4ff);
        });

        button.on('pointerout', () => {
            this.scene.tweens.add({
                targets: buttonBg,
                scale: 1.0,
                alpha: 0.9,
                duration: 200,
                ease: 'Back.easeIn'
            });
            this.scene.tweens.add({
                targets: buttonGlow,
                alpha: 0,
                duration: 200
            });
            button.clearTint();
        });

        this.mainContainer.add(button);
        button.bgCircle = buttonBg;
        button.glowCircle = buttonGlow;
        this.elements.push(button);
        return button;
    }

    animateButtonPress(button) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // Ripple effect
        const ripple = this.scene.add.circle(button.x, button.y, 20, 0x00d4ff, 0.6);
        ripple.setScrollFactor(0);
        ripple.setDepth(99997);
        this.mainContainer.add(ripple);

        this.scene.tweens.add({
            targets: ripple,
            scale: 2.5,
            alpha: 0,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                ripple.destroy();
                this.isAnimating = false;
            }
        });

        // Button press
        this.scene.tweens.add({
            targets: button.bgCircle,
            scale: 0.85,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    createModernVolumeSlider() {
        // Create slider container
        this.sliderContainer = this.scene.add.container(this.panelCenterX, this.panelBottom + 20);
        this.sliderContainer.setScrollFactor(0);
        this.sliderContainer.setDepth(100002);
        this.sliderContainer.setVisible(false);

        // Slider panel background
        const sliderBg = this.scene.add.graphics();
        sliderBg.fillStyle(0x1a1a2e, 0.95);
        sliderBg.fillRoundedRect(-150, 0, 300, 50, 20);
        sliderBg.lineStyle(2, 0x00d4ff, 0.5);
        sliderBg.strokeRoundedRect(-150, 0, 300, 50, 20);
        this.sliderContainer.add(sliderBg);

        // Volume label
        const volumeLabel = this.scene.add.text(-130, 15, 'VOLUME', {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '12px',
            fontStyle: '600',
            fill: '#00d4ff'
        });
        volumeLabel.setOrigin(0, 0);
        this.sliderContainer.add(volumeLabel);

        // Volume percentage
        this.volumePercent = this.scene.add.text(130, 15, '100%', {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '12px',
            fontStyle: '600',
            fill: '#ffffff'
        });
        this.volumePercent.setOrigin(1, 0);
        this.sliderContainer.add(this.volumePercent);

        // Slider track background
        const trackWidth = 220;
        const trackHeight = 6;
        const trackY = 32;

        this.sliderTrackBg = this.scene.add.rectangle(0, trackY, trackWidth, trackHeight, 0x333333, 0.6);
        this.sliderTrackBg.setScrollFactor(0);
        this.sliderContainer.add(this.sliderTrackBg);

        // Slider fill
        const initialVolume = this.musicManager.getVolume();
        this.sliderFill = this.scene.add.rectangle(
            -(trackWidth / 2),
            trackY,
            trackWidth * initialVolume,
            trackHeight,
            0x00d4ff
        );
        this.sliderFill.setOrigin(0, 0.5);
        this.sliderFill.setScrollFactor(0);
        this.sliderContainer.add(this.sliderFill);

        // Slider handle with glow
        this.sliderHandleGlow = this.scene.add.circle(
            -(trackWidth / 2) + (trackWidth * initialVolume),
            trackY,
            14,
            0x00d4ff,
            0.3
        );
        this.sliderHandleGlow.setScrollFactor(0);
        this.sliderContainer.add(this.sliderHandleGlow);

        this.sliderHandle = this.scene.add.circle(
            -(trackWidth / 2) + (trackWidth * initialVolume),
            trackY,
            10,
            0xffffff
        );
        this.sliderHandle.setScrollFactor(0);
        this.sliderHandle.setInteractive({ draggable: true, useHandCursor: true });
        this.sliderContainer.add(this.sliderHandle);

        // Glow pulse animation
        this.scene.tweens.add({
            targets: this.sliderHandleGlow,
            scale: { from: 1, to: 1.5 },
            alpha: { from: 0.3, to: 0.1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Store track bounds
        this.trackWidth = trackWidth;
        this.trackMinX = -(trackWidth / 2);
        this.trackMaxX = trackWidth / 2;
        this.trackY = trackY;

        // Drag functionality
        this.sliderHandle.on('drag', (pointer) => {
            this.updateVolumeFromDrag(pointer);
        });

        // Hover effect
        this.sliderHandle.on('pointerover', () => {
            this.scene.tweens.add({
                targets: this.sliderHandle,
                scale: 1.3,
                duration: 200,
                ease: 'Back.easeOut'
            });
        });

        this.sliderHandle.on('pointerout', () => {
            this.scene.tweens.add({
                targets: this.sliderHandle,
                scale: 1.0,
                duration: 200,
                ease: 'Back.easeIn'
            });
        });

        // Click on track to jump
        this.sliderTrackBg.setInteractive({ useHandCursor: true });
        this.sliderTrackBg.on('pointerdown', (pointer) => {
            this.updateVolumeFromClick(pointer);
        });

        this.elements.push(this.sliderContainer);
    }

    updateVolumeFromDrag(pointer) {
        // Get pointer position relative to slider container
        const localX = pointer.x - this.sliderContainer.x;
        const clampedX = Phaser.Math.Clamp(localX, this.trackMinX, this.trackMaxX);
        
        // Update handle position
        this.sliderHandle.x = clampedX;
        this.sliderHandleGlow.x = clampedX;
        
        // Calculate volume
        const volume = (clampedX - this.trackMinX) / this.trackWidth;
        
        // Update fill
        this.sliderFill.width = this.trackWidth * volume;
        
        // Update volume
        this.musicManager.setVolume(volume);
        this.volumePercent.setText(`${Math.round(volume * 100)}%`);
    }

    updateVolumeFromClick(pointer) {
        // Get pointer position relative to slider container
        const localX = pointer.x - this.sliderContainer.x;
        const clampedX = Phaser.Math.Clamp(localX, this.trackMinX, this.trackMaxX);
        
        // Animate handle to new position
        this.scene.tweens.add({
            targets: [this.sliderHandle, this.sliderHandleGlow],
            x: clampedX,
            duration: 200,
            ease: 'Power2'
        });
        
        // Calculate volume
        const volume = (clampedX - this.trackMinX) / this.trackWidth;
        
        // Animate fill
        this.scene.tweens.add({
            targets: this.sliderFill,
            width: this.trackWidth * volume,
            duration: 200,
            ease: 'Power2'
        });
        
        // Update volume
        this.musicManager.setVolume(volume);
        this.volumePercent.setText(`${Math.round(volume * 100)}%`);
    }

    toggleVolumeSlider() {
        this.volumeSliderVisible = !this.volumeSliderVisible;
        
        if (this.volumeSliderVisible) {
            this.sliderContainer.setVisible(true);
            this.sliderContainer.setAlpha(0);
            this.sliderContainer.setScale(0.8);
            
            this.scene.tweens.add({
                targets: this.sliderContainer,
                alpha: 1,
                scale: 1,
                duration: 300,
                ease: 'Back.easeOut'
            });
        } else {
            this.scene.tweens.add({
                targets: this.sliderContainer,
                alpha: 0,
                scale: 0.8,
                duration: 250,
                ease: 'Power2',
                onComplete: () => {
                    this.sliderContainer.setVisible(false);
                }
            });
        }
    }

    updateTrackDisplay(track) {
        if (track && this.trackTitle) {
            // Fade transition
            this.scene.tweens.add({
                targets: this.trackTitle,
                alpha: 0,
                duration: 250,
                onComplete: () => {
                    this.trackTitle.setText(`♪ ${track.title}`);
                    this.scene.tweens.add({
                        targets: this.trackTitle,
                        alpha: 1,
                        duration: 250
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

            // Update glowing tip position
            if (this.progressGlow) {
                this.progressGlow.x = this.progressBarX + this.progressFill.width;
            }
        }
    }

    destroy() {
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
        
        if (this.mainContainer) {
            this.mainContainer.destroy();
        }
    }
}