// PlayerUI - Handles all UI elements above a player (name tag, health bar, level badge)
class PlayerUI {
    constructor(scene, player, config = {}) {
        this.scene = scene;
        this.player = player;
        this.config = {
            healthBarWidth: config.healthBarWidth || 70,
            healthBarHeight: config.healthBarHeight || 6,
            barRadius: config.barRadius || 3,
            nameTagHeight: config.nameTagHeight || 20,
            yOffset: config.yOffset || 105,
            visualOffsetX: config.visualOffsetX || 32,
            visualOffsetY: config.visualOffsetY || 55,
            useSprite: config.useSprite || false,
            isLocalPlayer: config.isLocalPlayer || false
        };

        // Graphics objects
        this.healthBarShadow = null;
        this.healthBarContainer = null;
        this.healthBar = null;
        this.shieldBar = null; // Shield bar (rendered over health)
        this.healthBarGloss = null;
        this.nameTagShadow = null;
        this.nameTagBg = null;
        this.nameTag = null;
        this.levelBadge = null;
        this.levelText = null;

        // Cache for optimization
        this.lastUIX = null;
        this.lastUIY = null;
        this.lastHealth = null;
        this.lastShield = null;
        this.currentDepth = 0;

        this.create();
    }

    create() {
        // Skip UI creation for local player (has HUD in top right)
        if (this.config.isLocalPlayer) {
            return;
        }

        const pos = this.getUIPosition();
        const healthBarY = pos.nameY - 20;

        this.createHealthBar(pos.nameX, healthBarY);
        this.createNameTag(pos.nameX, pos.nameY);
        this.createLevelBadge(pos.nameX, pos.nameY);

        // Initial draw
        this.lastUIX = pos.nameX;
        this.lastUIY = pos.nameY;
        this.updateHealthBar();
    }

    createHealthBar(x, y) {
        const { healthBarWidth, healthBarHeight, barRadius } = this.config;

        // Drop shadow
        this.healthBarShadow = this.scene.add.graphics();
        this.healthBarShadow.fillStyle(0x000000, 0.3);
        this.healthBarShadow.fillRoundedRect(
            x - healthBarWidth/2 + 1,
            y - healthBarHeight/2 + 2,
            healthBarWidth,
            healthBarHeight,
            barRadius
        );

        // Container/background (glass effect)
        this.healthBarContainer = this.scene.add.graphics();
        this.healthBarContainer.fillStyle(0x000000, 0.6);
        this.healthBarContainer.fillRoundedRect(
            x - healthBarWidth/2,
            y - healthBarHeight/2,
            healthBarWidth,
            healthBarHeight,
            barRadius
        );
        this.healthBarContainer.lineStyle(1, 0x444444, 0.8);
        this.healthBarContainer.strokeRoundedRect(
            x - healthBarWidth/2,
            y - healthBarHeight/2,
            healthBarWidth,
            healthBarHeight,
            barRadius
        );

        // Health bar fill (dynamic)
        this.healthBar = this.scene.add.graphics();

        // Shield bar (rendered over health bar)
        this.shieldBar = this.scene.add.graphics();

        // Glossy overlay
        this.healthBarGloss = this.scene.add.graphics();
        this.healthBarGloss.fillStyle(0xffffff, 0.15);
        this.healthBarGloss.fillRoundedRect(
            x - healthBarWidth/2,
            y - healthBarHeight/2,
            healthBarWidth,
            healthBarHeight * 0.4,
            barRadius
        );
    }

    createNameTag(x, y) {
        const nameWidth = Math.max(80, this.player.data.username.length * 8 + 20);
        const nameHeight = this.config.nameTagHeight;

        // Drop shadow
        this.nameTagShadow = this.scene.add.graphics();
        this.nameTagShadow.fillStyle(0x000000, 0.4);
        this.nameTagShadow.fillRoundedRect(
            x - nameWidth/2 + 1,
            y - nameHeight/2 + 2,
            nameWidth,
            nameHeight,
            6
        );

        // Background (glassmorphism)
        this.nameTagBg = this.scene.add.graphics();
        this.nameTagBg.fillStyle(0x0a0a0a, 0.85);
        this.nameTagBg.fillRoundedRect(
            x - nameWidth/2,
            y - nameHeight/2,
            nameWidth,
            nameHeight,
            6
        );
        this.nameTagBg.lineStyle(1, 0x555555, 0.6);
        this.nameTagBg.strokeRoundedRect(
            x - nameWidth/2,
            y - nameHeight/2,
            nameWidth,
            nameHeight,
            6
        );

        // Name text
        this.nameTag = this.scene.add.text(x, y, this.player.data.username, {
            font: 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 0,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                fill: true
            }
        }).setOrigin(0.5);
    }

    createLevelBadge(x, y) {
        if (!this.player.level || this.player.level <= 1) return;

        const nameWidth = Math.max(80, this.player.data.username.length * 8 + 20);
        const nameHeight = this.config.nameTagHeight;

        this.levelBadge = this.scene.add.graphics();
        this.levelBadge.fillStyle(0x6366f1, 0.9);
        this.levelBadge.fillRoundedRect(
            x - nameWidth/2 + 4,
            y - nameHeight/2 + 4,
            22,
            12,
            4
        );

        this.levelText = this.scene.add.text(
            x - nameWidth/2 + 15,
            y,
            `${this.player.level}`,
            {
                font: 'bold 9px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
    }

    getUIPosition() {
        const offsetX = this.config.useSprite ? this.config.visualOffsetX : 0;
        const offsetY = this.config.useSprite ? this.config.visualOffsetY : 0;
        const yOffset = this.config.useSprite ? this.config.yOffset : 25;

        const sprite = this.player.sprite;
        const nameX = sprite.x + offsetX;
        const nameY = sprite.y - yOffset + offsetY;

        return { nameX, nameY };
    }

    update(spriteDepth) {
        // Skip UI updates for local player
        if (this.config.isLocalPlayer) {
            return;
        }

        const pos = this.getUIPosition();
        const healthBarY = pos.nameY - 20;

        // Check if position changed significantly
        const posChanged = !this.lastUIX || !this.lastUIY ||
                          Math.abs(pos.nameX - this.lastUIX) > 0.5 ||
                          Math.abs(pos.nameY - this.lastUIY) > 0.5;

        if (posChanged) {
            this.updatePosition(pos.nameX, pos.nameY, healthBarY, spriteDepth);
            this.lastUIX = pos.nameX;
            this.lastUIY = pos.nameY;
        }

        // Update depths (cheap operation)
        this.updateDepths(spriteDepth);

        // Update health bar fill if health changed
        if (!this.lastHealth || this.player.health !== this.lastHealth) {
            this.lastHealth = this.player.health;
            this.updateHealthBar();
        }
    }

    updatePosition(nameX, nameY, healthBarY, spriteDepth) {
        const { healthBarWidth, healthBarHeight, barRadius } = this.config;
        const nameWidth = Math.max(80, this.player.data.username.length * 8 + 20);
        const nameHeight = this.config.nameTagHeight;

        // Update health bar shadow
        if (this.healthBarShadow) {
            this.healthBarShadow.clear();
            this.healthBarShadow.fillStyle(0x000000, 0.3);
            this.healthBarShadow.fillRoundedRect(
                nameX - healthBarWidth/2 + 1,
                healthBarY - healthBarHeight/2 + 2,
                healthBarWidth,
                healthBarHeight,
                barRadius
            );
        }

        // Update health bar container
        if (this.healthBarContainer) {
            this.healthBarContainer.clear();
            this.healthBarContainer.fillStyle(0x000000, 0.6);
            this.healthBarContainer.fillRoundedRect(
                nameX - healthBarWidth/2,
                healthBarY - healthBarHeight/2,
                healthBarWidth,
                healthBarHeight,
                barRadius
            );
            this.healthBarContainer.lineStyle(1, 0x444444, 0.8);
            this.healthBarContainer.strokeRoundedRect(
                nameX - healthBarWidth/2,
                healthBarY - healthBarHeight/2,
                healthBarWidth,
                healthBarHeight,
                barRadius
            );
        }

        // Update glossy overlay
        if (this.healthBarGloss) {
            this.healthBarGloss.clear();
            this.healthBarGloss.fillStyle(0xffffff, 0.15);
            this.healthBarGloss.fillRoundedRect(
                nameX - healthBarWidth/2,
                healthBarY - healthBarHeight/2,
                healthBarWidth,
                healthBarHeight * 0.4,
                barRadius
            );
        }

        // Update name tag shadow
        if (this.nameTagShadow) {
            this.nameTagShadow.clear();
            this.nameTagShadow.fillStyle(0x000000, 0.4);
            this.nameTagShadow.fillRoundedRect(
                nameX - nameWidth/2 + 1,
                nameY - nameHeight/2 + 2,
                nameWidth,
                nameHeight,
                6
            );
        }

        // Update name tag background
        if (this.nameTagBg) {
            this.nameTagBg.clear();
            this.nameTagBg.fillStyle(0x0a0a0a, 0.85);
            this.nameTagBg.fillRoundedRect(
                nameX - nameWidth/2,
                nameY - nameHeight/2,
                nameWidth,
                nameHeight,
                6
            );
            this.nameTagBg.lineStyle(1, 0x555555, 0.6);
            this.nameTagBg.strokeRoundedRect(
                nameX - nameWidth/2,
                nameY - nameHeight/2,
                nameWidth,
                nameHeight,
                6
            );
        }

        // Update level badge
        if (this.levelBadge && this.player.level > 1) {
            this.levelBadge.clear();
            this.levelBadge.fillStyle(0x6366f1, 0.9);
            this.levelBadge.fillRoundedRect(
                nameX - nameWidth/2 + 4,
                nameY - nameHeight/2 + 4,
                22,
                12,
                4
            );
        }

        // Update level text
        if (this.levelText && this.player.level > 1) {
            this.levelText.setPosition(nameX - nameWidth/2 + 15, nameY);
        }

        // Update name tag text
        this.nameTag.setPosition(nameX, nameY);

        // Store position for health bar updates
        this.currentNameX = nameX;
        this.currentHealthBarY = healthBarY;
    }

    updateDepths(spriteDepth) {
        if (this.healthBarShadow) this.healthBarShadow.setDepth(spriteDepth);
        if (this.healthBarContainer) this.healthBarContainer.setDepth(spriteDepth + 1);
        if (this.healthBar) this.healthBar.setDepth(spriteDepth + 2);
        if (this.healthBarGloss) this.healthBarGloss.setDepth(spriteDepth + 3);
        if (this.nameTagShadow) this.nameTagShadow.setDepth(spriteDepth + 1);
        if (this.nameTagBg) this.nameTagBg.setDepth(spriteDepth + 2);
        if (this.levelBadge) this.levelBadge.setDepth(spriteDepth + 3);
        if (this.levelText) this.levelText.setDepth(spriteDepth + 4);
        if (this.nameTag) this.nameTag.setDepth(spriteDepth + 4);
    }

    updateHealthBar() {
        if (!this.healthBar) return;

        const healthPercent = this.player.health / this.player.maxHealth;
        const currentWidth = this.config.healthBarWidth * healthPercent;

        // Clear and redraw
        this.healthBar.clear();
        if (this.shieldBar) this.shieldBar.clear();

        // Determine color
        let color, glowColor;
        if (healthPercent > 0.6) {
            color = 0x10b981; // Emerald green
            glowColor = 0x34d399;
        } else if (healthPercent > 0.4) {
            color = 0xfbbf24; // Amber
            glowColor = 0xfcd34d;
        } else if (healthPercent > 0.25) {
            color = 0xf97316; // Orange
            glowColor = 0xfb923c;
        } else {
            color = 0xef4444; // Red
            glowColor = 0xf87171;
        }

        // Draw glow
        this.healthBar.fillStyle(glowColor, 0.3);
        this.healthBar.fillRoundedRect(
            this.currentNameX - this.config.healthBarWidth/2 - 1,
            this.currentHealthBarY - this.config.healthBarHeight/2 - 1,
            currentWidth + 2,
            this.config.healthBarHeight + 2,
            this.config.barRadius
        );

        // Draw main bar
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRoundedRect(
            this.currentNameX - this.config.healthBarWidth/2,
            this.currentHealthBarY - this.config.healthBarHeight/2,
            currentWidth,
            this.config.healthBarHeight,
            this.config.barRadius
        );

        // Draw shield bar if player has shield
        if (this.shieldBar && this.player.shield > 0) {
            // Shield can extend beyond max health, cap it for display
            const shieldWidth = Math.min(
                (this.player.shield / this.player.maxHealth) * this.config.healthBarWidth,
                this.config.healthBarWidth - currentWidth
            );

            if (shieldWidth > 0) {
                // Shield glow (cyan/blue)
                this.shieldBar.fillStyle(0x60a5fa, 0.4);
                this.shieldBar.fillRoundedRect(
                    this.currentNameX - this.config.healthBarWidth/2 + currentWidth - 1,
                    this.currentHealthBarY - this.config.healthBarHeight/2 - 1,
                    shieldWidth + 2,
                    this.config.healthBarHeight + 2,
                    this.config.barRadius
                );

                // Shield main bar
                this.shieldBar.fillStyle(0x3b82f6, 0.9); // Blue
                this.shieldBar.fillRoundedRect(
                    this.currentNameX - this.config.healthBarWidth/2 + currentWidth,
                    this.currentHealthBarY - this.config.healthBarHeight/2,
                    shieldWidth,
                    this.config.healthBarHeight,
                    this.config.barRadius
                );
            }
        }

        // Pulse animation on low health
        if (healthPercent <= 0.25) {
            this.scene.tweens.add({
                targets: this.healthBar,
                alpha: 0.7,
                duration: 500,
                yoyo: true,
                repeat: 0
            });
        }
    }

    setAlpha(alpha) {
        if (this.healthBarShadow) this.healthBarShadow.setAlpha(alpha);
        if (this.healthBarContainer) this.healthBarContainer.setAlpha(alpha);
        if (this.healthBar) this.healthBar.setAlpha(alpha);
        if (this.healthBarGloss) this.healthBarGloss.setAlpha(alpha);
        if (this.nameTagShadow) this.nameTagShadow.setAlpha(alpha);
        if (this.nameTagBg) this.nameTagBg.setAlpha(alpha);
        if (this.nameTag) this.nameTag.setAlpha(alpha);
        if (this.levelBadge) this.levelBadge.setAlpha(alpha);
        if (this.levelText) this.levelText.setAlpha(alpha);
    }

    destroy() {
        if (this.healthBarShadow) this.healthBarShadow.destroy();
        if (this.healthBarContainer) this.healthBarContainer.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.shieldBar) this.shieldBar.destroy();
        if (this.healthBarGloss) this.healthBarGloss.destroy();
        if (this.nameTagShadow) this.nameTagShadow.destroy();
        if (this.nameTagBg) this.nameTagBg.destroy();
        if (this.nameTag) this.nameTag.destroy();
        if (this.levelBadge) this.levelBadge.destroy();
        if (this.levelText) this.levelText.destroy();
    }
}
