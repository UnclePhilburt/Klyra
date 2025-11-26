/**
 * Post-Processing Manager
 * Handles visual post-processing effects for fast and flashy combat
 */
class PostProcessingManager {
    constructor(scene) {
        this.scene = scene;

        // Motion blur settings
        this.motionBlurEnabled = true;
        this.motionBlurStrength = 0.15;
        this.lastPlayerPos = { x: 0, y: 0 };
        this.playerVelocity = { x: 0, y: 0 };

        // Bloom/glow settings
        this.bloomEnabled = true;
        this.bloomStrength = 1.5;

        // Screen flash settings
        this.flashActive = false;
        this.flashColor = 0xffffff;
        this.flashAlpha = 0;
        this.flashDecay = 0.05;

        // Chromatic aberration
        this.chromaticEnabled = false;
        this.chromaticStrength = 0;

        // Speed lines
        this.speedLines = [];
        this.maxSpeedLines = 20;

        this.init();
    }

    init() {
        // Create flash overlay
        this.flashOverlay = this.scene.add.rectangle(
            0, 0,
            this.scene.cameras.main.width * 2,
            this.scene.cameras.main.height * 2,
            0xffffff,
            0
        );
        this.flashOverlay.setOrigin(0.5, 0.5);
        this.flashOverlay.setScrollFactor(0);
        this.flashOverlay.setDepth(100000);

        // Create graphics for speed lines
        this.speedLinesGraphics = this.scene.add.graphics();
        this.speedLinesGraphics.setDepth(99999);
        this.speedLinesGraphics.setScrollFactor(0);

        // Setup Phaser post-processing pipelines
        this.setupPipelines();

        console.log('✅ PostProcessingManager initialized');
    }

    setupPipelines() {
        const camera = this.scene.cameras.main;

        // Add bloom effect (if WebGL is available)
        if (this.scene.game.renderer.type === Phaser.WEBGL && this.bloomEnabled) {
            // Phaser 3 doesn't have built-in bloom, but we can use glow via RenderTexture
            // For now, we'll enhance particle effects manually
            console.log('📊 WebGL renderer detected - bloom will be simulated');
        }
    }

    /**
     * Screen flash effect
     * @param {number} color - Flash color (0xffffff for white, 0xff0000 for red, etc.)
     * @param {number} intensity - Flash intensity 0-1
     * @param {number} duration - Flash duration in ms
     */
    flash(color = 0xffffff, intensity = 0.3, duration = 150) {
        this.flashColor = color;
        this.flashAlpha = intensity;
        this.flashActive = true;
        this.flashDecay = intensity / (duration / 16.67); // Decay per frame at 60fps

        this.flashOverlay.setFillStyle(color, this.flashAlpha);
    }

    /**
     * Motion blur effect based on player velocity
     * @param {object} player - Player object with x, y position
     */
    updateMotionBlur(player) {
        if (!this.motionBlurEnabled) return;

        // Calculate velocity
        this.playerVelocity.x = player.x - this.lastPlayerPos.x;
        this.playerVelocity.y = player.y - this.lastPlayerPos.y;

        const speed = Math.sqrt(
            this.playerVelocity.x * this.playerVelocity.x +
            this.playerVelocity.y * this.playerVelocity.y
        );

        // If moving fast, create speed lines
        if (speed > 3) {
            this.createSpeedLine(player, speed);
        }

        this.lastPlayerPos.x = player.x;
        this.lastPlayerPos.y = player.y;
    }

    /**
     * Create speed line effect
     */
    createSpeedLine(player, speed) {
        if (this.speedLines.length >= this.maxSpeedLines) {
            this.speedLines.shift();
        }

        const angle = Math.atan2(this.playerVelocity.y, this.playerVelocity.x);
        const distance = Phaser.Math.Between(30, 60);
        const offsetX = Math.cos(angle + Math.PI) * distance;
        const offsetY = Math.sin(angle + Math.PI) * distance;

        this.speedLines.push({
            x: player.x + offsetX + Phaser.Math.Between(-20, 20),
            y: player.y + offsetY + Phaser.Math.Between(-20, 20),
            angle: angle,
            length: Phaser.Math.Between(20, 40),
            alpha: Math.min(speed / 10, 1),
            life: 1.0
        });
    }

    /**
     * Update speed lines
     */
    updateSpeedLines() {
        this.speedLines.forEach((line, index) => {
            line.life -= 0.1;
            line.alpha *= 0.9;

            if (line.life <= 0) {
                this.speedLines.splice(index, 1);
            }
        });
    }

    /**
     * Draw speed lines
     */
    drawSpeedLines() {
        this.speedLinesGraphics.clear();

        const camera = this.scene.cameras.main;

        this.speedLines.forEach(line => {
            const screenX = line.x - camera.scrollX;
            const screenY = line.y - camera.scrollY;

            const endX = screenX + Math.cos(line.angle) * line.length;
            const endY = screenY + Math.sin(line.angle) * line.length;

            this.speedLinesGraphics.lineStyle(2, 0xffffff, line.alpha * 0.5);
            this.speedLinesGraphics.beginPath();
            this.speedLinesGraphics.moveTo(screenX, screenY);
            this.speedLinesGraphics.lineTo(endX, endY);
            this.speedLinesGraphics.strokePath();
        });
    }

    /**
     * Apply chromatic aberration effect
     * @param {number} strength - Aberration strength (0-1)
     * @param {number} duration - Effect duration in ms
     */
    chromaticAberration(strength = 0.5, duration = 200) {
        this.chromaticEnabled = true;
        this.chromaticStrength = strength;

        // Fade out chromatic effect
        this.scene.time.delayedCall(duration, () => {
            this.chromaticEnabled = false;
            this.chromaticStrength = 0;
        });
    }

    /**
     * Create trail effect for projectiles/fast objects
     * @param {object} sprite - Sprite to create trail for
     * @param {number} color - Trail color
     * @param {number} length - Trail length (number of trail sprites)
     */
    createTrail(sprite, color = 0xffffff, length = 5) {
        if (!sprite.trailSprites) {
            sprite.trailSprites = [];
        }

        // Add new trail position
        sprite.trailSprites.push({
            x: sprite.x,
            y: sprite.y,
            alpha: 1.0,
            scale: sprite.scale || 1
        });

        // Limit trail length
        if (sprite.trailSprites.length > length) {
            sprite.trailSprites.shift();
        }

        // Draw trails (fading older positions)
        sprite.trailSprites.forEach((trail, index) => {
            const alpha = (index / sprite.trailSprites.length) * 0.5;
            const scale = trail.scale * (0.7 + (index / sprite.trailSprites.length) * 0.3);

            // Create trail sprite (simplified - using graphics)
            const trailGraphic = this.scene.add.circle(
                trail.x,
                trail.y,
                sprite.width / 2 * scale,
                color,
                alpha
            );
            trailGraphic.setDepth(sprite.depth - 1);

            // Auto-destroy trail after 100ms
            this.scene.time.delayedCall(100, () => {
                trailGraphic.destroy();
            });
        });
    }

    /**
     * Enhanced particle bloom effect
     * Makes particles glow brighter
     */
    enhanceParticles(particles) {
        if (!this.bloomEnabled) return;

        // Add glow to particles
        particles.setBlendMode(Phaser.BlendModes.ADD);
        particles.setAlpha(0.8);
    }

    /**
     * Main update loop
     */
    update(player) {
        // Update flash effect
        if (this.flashActive) {
            this.flashAlpha -= this.flashDecay;
            if (this.flashAlpha <= 0) {
                this.flashActive = false;
                this.flashAlpha = 0;
            }
            this.flashOverlay.setAlpha(this.flashAlpha);
        }

        // Update motion blur
        if (player) {
            this.updateMotionBlur(player);
        }

        // Update and draw speed lines
        this.updateSpeedLines();
        this.drawSpeedLines();
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.flashOverlay) this.flashOverlay.destroy();
        if (this.speedLinesGraphics) this.speedLinesGraphics.destroy();
        this.speedLines = [];
    }
}
