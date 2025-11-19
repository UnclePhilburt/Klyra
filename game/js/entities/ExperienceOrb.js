// Experience Orb Entity
class ExperienceOrb {
    constructor(scene, data) {
        this.scene = scene;
        this.data = data;
        this.collected = false;
        this.expValue = data.expValue || 10; // Default 10 XP per orb

        // Determine orb type based on XP value
        // 10 XP = common orb (row 1, frame 5)
        // 100 XP = rare orb (row 1, frame 11)
        this.isRare = this.expValue >= 100;
        // Rows 0-3, 14 frames per row (0-13)
        // Row 1, frame 5 = absolute frame 19 (14 + 5)
        // Row 1, frame 11 = absolute frame 25 (14 + 11)
        this.orbFrame = this.isRare ? 25 : 19;

        this.createSprite();
    }

    createSprite() {
        const x = this.data.x;
        const y = this.data.y;

        // Create sprite from potions sprite sheet
        // Common orb: frame 18 (tile 19)
        // Rare orb: frame 24 (tile 25)
        this.sprite = this.scene.add.sprite(x, y, 'potions', this.orbFrame);
        this.sprite.setScale(1.5); // Scale up from 16x16 to be more visible
        this.sprite.setDepth(100); // Render above blood splats

        // Glow effects based on orb type
        const glowColor = this.isRare ? 0xffaa00 : 0x00ffff; // Orange for rare, cyan for common
        const innerColor = this.isRare ? 0xff6600 : 0xff00ff; // Dark orange for rare, purple for common

        // Outer glow effect - bigger and brighter
        this.glow = this.scene.add.circle(x, y, 16, glowColor, 0.4);
        this.glow.setDepth(99); // Below sprite but above blood

        // Second outer glow for depth
        this.outerGlow = this.scene.add.circle(x, y, 20, innerColor, 0.2);
        this.outerGlow.setDepth(98); // Furthest back but still above blood

        // Floating animation - more pronounced
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.outerGlow],
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Sprite rotation for rare orbs (more dramatic)
        if (this.isRare) {
            this.scene.tweens.add({
                targets: this.sprite,
                angle: 360,
                duration: 3000,
                repeat: -1,
                ease: 'Linear'
            });
        }

        // Pulse glow - faster and more dramatic
        this.scene.tweens.add({
            targets: this.glow,
            scale: 1.8,
            alpha: 0.6,
            duration: this.isRare ? 400 : 600, // Faster pulse for rare
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Outer glow pulse
        this.scene.tweens.add({
            targets: this.outerGlow,
            scale: 2,
            alpha: 0,
            duration: this.isRare ? 400 : 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeOut'
        });
    }

    checkCollision(playerX, playerY) {
        if (this.collected) return false;

        const dist = Phaser.Math.Distance.Between(
            playerX,
            playerY,
            this.sprite.x,
            this.sprite.y
        );

        return dist < 80; // Larger pickup radius - orbs will fly to player
    }

    collect(playerX, playerY) {
        if (this.collected) return;
        this.collected = true;

        // Play orb collection sound
        this.playPickupSound();

        // Burst particle effect
        this.createPickupParticles();

        // Collection animation - fly to player position
        const targetX = playerX || this.scene.cameras.main.centerX;
        const targetY = playerY || this.scene.cameras.main.centerY;

        // Fly to player smoothly
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.outerGlow],
            x: targetX,
            y: targetY,
            scale: 0.5,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Flash and disappear at player
                this.scene.tweens.add({
                    targets: [this.sprite, this.glow, this.outerGlow],
                    scale: 2,
                    alpha: 0,
                    duration: 150,
                    ease: 'Power2',
                    onComplete: () => {
                        this.sprite.destroy();
                        this.glow.destroy();
                        this.outerGlow.destroy();
                    }
                });
            }
        });

        // Show XP text
        this.showExpText();
    }

    createPickupParticles() {
        // Create sparkle particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.scene.add.circle(
                this.sprite.x,
                this.sprite.y,
                3,
                Math.random() > 0.5 ? 0x00ffff : 0xff00ff,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.sprite.x + Math.cos(angle) * 30,
                y: this.sprite.y + Math.sin(angle) * 30,
                alpha: 0,
                scale: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    playPickupSound() {
        // Play loaded orb collection sound
        if (this.scene.sound) {
            try {
                this.scene.sound.play('orbcollect', { volume: 0.15 });
            } catch (e) {
                console.warn('Could not play orb collection sound:', e);
            }
        }
    }

    showExpText() {
        const expText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.scrollY + 150,
            `+${this.expValue} XP`,
            {
                font: 'bold 14px monospace',
                fill: '#00ffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0);

        this.scene.tweens.add({
            targets: expText,
            y: this.scene.cameras.main.scrollY + 120,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => expText.destroy()
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.glow) this.glow.destroy();
        if (this.outerGlow) this.outerGlow.destroy();
    }
}
