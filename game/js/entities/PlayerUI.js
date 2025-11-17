// PlayerUI - Clean, modern health bars for other players
class PlayerUI {
    constructor(scene, player, config = {}) {
        this.scene = scene;
        this.player = player;
        this.config = {
            isLocalPlayer: config.isLocalPlayer || false,
            yOffset: config.yOffset || 40
        };

        // UI elements
        this.container = null;
        this.healthBarBg = null;
        this.healthBarFill = null;
        this.shieldBarFill = null;
        this.healthText = null;
        this.nameText = null;
        this.levelBadge = null;

        // Cache
        this.lastHealth = -1;
        this.lastMaxHealth = -1;
        this.lastShield = -1;

        if (!this.config.isLocalPlayer) {
            this.create();
        }
    }

    create() {
        const sprite = this.player.spriteRenderer?.sprite || this.player.sprite;
        if (!sprite) return;

        // Create container for all UI elements
        this.container = this.scene.add.container(sprite.x, sprite.y - this.config.yOffset);

        // Health bar background (dark with border)
        this.healthBarBg = this.scene.add.graphics();
        this.healthBarBg.fillStyle(0x000000, 0.7);
        this.healthBarBg.fillRoundedRect(-40, -5, 80, 10, 3);
        this.healthBarBg.lineStyle(2, 0x333333, 1);
        this.healthBarBg.strokeRoundedRect(-40, -5, 80, 10, 3);
        this.container.add(this.healthBarBg);

        // Health bar fill (will be drawn dynamically)
        this.healthBarFill = this.scene.add.graphics();
        this.container.add(this.healthBarFill);

        // Shield bar fill (rendered over health)
        this.shieldBarFill = this.scene.add.graphics();
        this.container.add(this.shieldBarFill);

        // Health text (shows HP numbers)
        this.healthText = this.scene.add.text(0, 0, '', {
            font: 'bold 10px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.container.add(this.healthText);

        // Player name
        this.nameText = this.scene.add.text(0, 12, this.player.data.username, {
            font: 'bold 12px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
                offsetX: 0,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5);
        this.container.add(this.nameText);

        // Level badge (if level > 1)
        if (this.player.level && this.player.level > 1) {
            this.levelBadge = this.scene.add.text(-45, 12, `${this.player.level}`, {
                font: 'bold 10px Arial',
                fill: '#ffffff',
                backgroundColor: '#6366f1',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
            this.container.add(this.levelBadge);
        }

        this.updateHealthBar();
    }

    update() {
        if (this.config.isLocalPlayer || !this.container) return;

        const sprite = this.player.spriteRenderer?.sprite || this.player.sprite;
        if (!sprite) return;

        // Update container position
        this.container.setPosition(sprite.x, sprite.y - this.config.yOffset);
        this.container.setDepth(sprite.depth + 100);

        // Update health bar if health changed
        const health = this.player.health || 0;
        const maxHealth = this.player.maxHealth || 100;
        const shield = this.player.shield || 0;

        if (health !== this.lastHealth || maxHealth !== this.lastMaxHealth || shield !== this.lastShield) {
            this.lastHealth = health;
            this.lastMaxHealth = maxHealth;
            this.lastShield = shield;
            this.updateHealthBar();
        }

        // Update level badge if level changed
        if (this.player.level && this.player.level > 1 && !this.levelBadge) {
            this.levelBadge = this.scene.add.text(-45, 12, `${this.player.level}`, {
                font: 'bold 10px Arial',
                fill: '#ffffff',
                backgroundColor: '#6366f1',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
            this.container.add(this.levelBadge);
        } else if (this.levelBadge && this.player.level) {
            this.levelBadge.setText(`${this.player.level}`);
        }
    }

    updateHealthBar() {
        if (!this.healthBarFill || !this.shieldBarFill) return;

        const health = Math.max(0, this.player.health || 0);
        const maxHealth = this.player.maxHealth || 100;
        const shield = Math.max(0, this.player.shield || 0);

        // Calculate bar widths
        const barWidth = 76; // Slightly smaller than background
        const healthPercent = health / maxHealth;
        const healthWidth = barWidth * healthPercent;
        const shieldPercent = Math.min(shield / maxHealth, 1 - healthPercent);
        const shieldWidth = barWidth * shieldPercent;

        // Clear previous drawings
        this.healthBarFill.clear();
        this.shieldBarFill.clear();

        // Determine health color based on percentage
        let healthColor, healthGlowColor;
        if (healthPercent > 0.6) {
            healthColor = 0x22c55e;      // Green
            healthGlowColor = 0x4ade80;
        } else if (healthPercent > 0.3) {
            healthColor = 0xf59e0b;      // Amber
            healthGlowColor = 0xfbbf24;
        } else {
            healthColor = 0xef4444;      // Red
            healthGlowColor = 0xf87171;
        }

        // Draw health bar with glow
        if (healthWidth > 0) {
            // Outer glow
            this.healthBarFill.fillStyle(healthGlowColor, 0.5);
            this.healthBarFill.fillRoundedRect(-38 - 1, -3 - 1, healthWidth + 2, 6 + 2, 2);

            // Main bar
            this.healthBarFill.fillStyle(healthColor, 1);
            this.healthBarFill.fillRoundedRect(-38, -3, healthWidth, 6, 2);
        }

        // Draw shield bar if player has shield
        if (shieldWidth > 0) {
            const shieldX = -38 + healthWidth;

            // Shield glow
            this.shieldBarFill.fillStyle(0x60a5fa, 0.6);
            this.shieldBarFill.fillRoundedRect(shieldX - 1, -3 - 1, shieldWidth + 2, 6 + 2, 2);

            // Shield main bar
            this.shieldBarFill.fillStyle(0x3b82f6, 1);
            this.shieldBarFill.fillRoundedRect(shieldX, -3, shieldWidth, 6, 2);
        }

        // Update health text
        let healthString;
        if (shield > 0) {
            healthString = `${Math.round(health)}+${Math.round(shield)}/${maxHealth}`;
        } else {
            healthString = `${Math.round(health)}/${maxHealth}`;
        }
        this.healthText.setText(healthString);

        // Low health pulse animation
        if (healthPercent <= 0.25 && healthPercent > 0) {
            this.scene.tweens.add({
                targets: this.healthBarFill,
                alpha: 0.6,
                duration: 400,
                yoyo: true,
                repeat: 0
            });
        }
    }

    setAlpha(alpha) {
        if (this.container) {
            this.container.setAlpha(alpha);
        }
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}
