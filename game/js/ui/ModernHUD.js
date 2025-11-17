// ModernHUD - Ultra-lightweight, performance-optimized HUD
class ModernHUD {
    constructor(scene, player) {
        console.log('🎮 ModernHUD constructor called!');
        this.scene = scene;
        this.player = player;

        // Cache for optimization - CRITICAL FPS FIX
        this.lastHealth = null;
        this.lastMaxHealth = null;
        this.lastShield = null;
        this.lastLevel = null;
        this.lastExperience = null;
        this.lastStats = null;

        // Simple text elements only
        this.healthText = null;
        this.levelText = null;
        this.xpText = null;
        this.statsText = null;

        // Simple rectangles for bars
        this.healthBarBg = null;
        this.healthBarFill = null;
        this.shieldBarFill = null;
        this.xpBarBg = null;
        this.xpBarFill = null;

        this.create();
    }

    create() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Health bar (bottom center - modern design)
        const healthBarWidth = 400;
        const healthBarHeight = 32;
        const healthBarX = width / 2 - healthBarWidth / 2;
        const healthBarY = height - 45; // Almost touching bottom

        // Health bar background (darker with rounded look)
        this.healthBarBg = this.scene.add.graphics();
        this.healthBarBg.setScrollFactor(0);
        this.healthBarBg.setDepth(99000);
        this.healthBarBg.fillStyle(0x000000, 0.8);
        this.healthBarBg.fillRoundedRect(healthBarX - 4, healthBarY - 4, healthBarWidth + 8, healthBarHeight + 8, 8);
        this.healthBarBg.lineStyle(3, 0x1f2937, 1);
        this.healthBarBg.strokeRoundedRect(healthBarX - 4, healthBarY - 4, healthBarWidth + 8, healthBarHeight + 8, 8);

        // Health bar fill (will be drawn dynamically)
        this.healthBarFill = this.scene.add.graphics();
        this.healthBarFill.setScrollFactor(0);
        this.healthBarFill.setDepth(99001);

        // Shield bar fill (rendered over health)
        this.shieldBarFill = this.scene.add.graphics();
        this.shieldBarFill.setScrollFactor(0);
        this.shieldBarFill.setDepth(99002);

        // Store health bar dimensions for dynamic drawing
        this.healthBarX = healthBarX;
        this.healthBarY = healthBarY;
        this.healthBarWidth = healthBarWidth;
        this.healthBarHeight = healthBarHeight;

        // Health text (centered, larger)
        this.healthText = this.scene.add.text(width / 2, healthBarY + healthBarHeight / 2, '100/100', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
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
        }).setOrigin(0.5).setScrollFactor(0).setDepth(99003);

        // MINIMALIST INFO HUB (Top-Left)
        this.infoHubExpanded = false;
        this.createInfoHub();

        // Initial update
        this.update();
    }

    createInfoHub() {
        const padding = 16;

        // COMPACT VIEW (always visible)
        this.compactHub = this.scene.add.container(padding, padding);
        this.compactHub.setScrollFactor(0);
        this.compactHub.setDepth(99500);

        // Compact background (simple for performance)
        const compactBg = this.scene.add.graphics();
        compactBg.fillStyle(0x0a0a0f, 0.9);
        compactBg.fillRect(0, 0, 200, 85);
        compactBg.lineStyle(2, 0x6366f1, 0.6);
        compactBg.strokeRect(0, 0, 200, 85);
        this.compactHub.add(compactBg);

        // Level badge (circular)
        const levelBadge = this.scene.add.circle(30, 30, 22, 0x6366f1, 0.2);
        levelBadge.setStrokeStyle(3, 0x6366f1, 1);
        this.compactHub.add(levelBadge);

        this.levelText = this.scene.add.text(30, 30, '1', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#818cf8',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.compactHub.add(this.levelText);

        // XP Bar (animated gradient)
        this.xpBarBg = this.scene.add.graphics();
        this.compactHub.add(this.xpBarBg);

        this.xpBarFill = this.scene.add.graphics();
        this.compactHub.add(this.xpBarFill);

        this.xpText = this.scene.add.text(100, 35, 'XP: 0 / 100', {
            fontFamily: 'Arial',
            fontSize: '11px',
            fill: '#a5b4fc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0);
        this.compactHub.add(this.xpText);

        // Quick stats (kills, time)
        this.quickStatsText = this.scene.add.text(12, 60, '⚔ 0  ⏱ 0:00', {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#d1d5db',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0);
        this.compactHub.add(this.quickStatsText);

        // Tab hint (static for performance)
        this.tabHint = this.scene.add.text(200, 74, '[TAB]', {
            fontFamily: 'Arial',
            fontSize: '9px',
            fill: '#9ca3af',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(1, 0);
        this.compactHub.add(this.tabHint);

        // SIMPLE MENU - NO CONTAINERS
        const menuX = padding;
        const menuY = padding;
        const menuWidth = 350;
        const menuHeight = 400;

        this.menuElements = [];

        // Menu background
        this.menuBg = this.scene.add.graphics();
        this.menuBg.setScrollFactor(0);
        this.menuBg.setDepth(99600);
        this.menuBg.fillStyle(0x0a0a0f, 0.96);
        this.menuBg.fillRoundedRect(menuX, menuY, menuWidth, menuHeight, 12);
        this.menuBg.lineStyle(3, 0x818cf8, 0.8);
        this.menuBg.strokeRoundedRect(menuX, menuY, menuWidth, menuHeight, 12);
        this.menuBg.setVisible(false);
        this.menuElements.push(this.menuBg);

        // Header
        this.menuHeader = this.scene.add.text(menuX + menuWidth/2, menuY + 20, 'GAME MENU', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#818cf8',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(99601).setVisible(false);
        this.menuElements.push(this.menuHeader);

        // Stats text
        this.detailedStatsText = this.scene.add.text(menuX + 20, menuY + 60, '', {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#e5e7eb',
            stroke: '#000000',
            strokeThickness: 2,
            lineSpacing: 6
        }).setOrigin(0).setScrollFactor(0).setDepth(99601).setVisible(false);
        this.menuElements.push(this.detailedStatsText);

        // Create simple button texts
        this.menuButtons = [];
        const buttonY = menuY + 280;
        const buttonSpacing = 50;

        // Resume button
        const resumeBtn = this.scene.add.text(menuX + menuWidth/2, buttonY, '[ RESUME ]', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#10b981',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(99602).setVisible(false);
        resumeBtn.setInteractive({ useHandCursor: true });
        resumeBtn.on('pointerover', () => { resumeBtn.setScale(1.1); resumeBtn.setFill('#22c55e'); });
        resumeBtn.on('pointerout', () => { resumeBtn.setScale(1); resumeBtn.setFill('#10b981'); });
        resumeBtn.on('pointerdown', () => { console.log('Resume clicked'); this.toggleMenu(); });
        this.menuElements.push(resumeBtn);
        this.menuButtons.push(resumeBtn);

        // Main Menu button
        const mainMenuBtn = this.scene.add.text(menuX + menuWidth/2, buttonY + buttonSpacing, '[ MAIN MENU ]', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ef4444',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(99602).setVisible(false);
        mainMenuBtn.setInteractive({ useHandCursor: true });
        mainMenuBtn.on('pointerover', () => { mainMenuBtn.setScale(1.1); mainMenuBtn.setFill('#f87171'); });
        mainMenuBtn.on('pointerout', () => { mainMenuBtn.setScale(1); mainMenuBtn.setFill('#ef4444'); });
        mainMenuBtn.on('pointerdown', () => {
            console.log('Main menu clicked');
            if (confirm('Return to main menu? Progress will be lost.')) {
                window.location.reload();
            }
        });
        this.menuElements.push(mainMenuBtn);
        this.menuButtons.push(mainMenuBtn);

        // Close hint
        this.menuCloseHint = this.scene.add.text(menuX + menuWidth/2, menuY + menuHeight - 20, 'Press TAB or ESC to close', {
            fontFamily: 'Arial',
            fontSize: '11px',
            fill: '#6b7280',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0).setDepth(99601).setVisible(false);
        this.menuElements.push(this.menuCloseHint);

        // Track stats
        this.playerStats = {
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            startTime: Date.now()
        };

        // Performance optimization - only update UI once per second
        this.lastQuickStatsUpdate = 0;
        this.quickStatsUpdateInterval = 1000; // 1 second

        // Setup keyboard listeners AFTER all elements are created
        this.setupMenuControls();
    }

    setupMenuControls() {
        console.log('✅ Simple menu created!');

        // Tab key to toggle menu
        const tabKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        tabKey.on('down', (event) => {
            if (event && event.preventDefault) event.preventDefault();
            this.toggleMenu();
        });

        // ESC key to close menu
        const escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey.on('down', () => {
            if (this.infoHubExpanded) {
                this.toggleMenu();
            }
        });
    }

    toggleMenu() {
        this.infoHubExpanded = !this.infoHubExpanded;

        if (this.infoHubExpanded) {
            // Open menu (don't pause - it's multiplayer!)
            this.updateDetailedStats();

            // Show all menu elements
            this.menuElements.forEach(elem => elem.setVisible(true));

            console.log('✅ Menu opened!');
        } else {
            // Close menu
            // Hide all menu elements
            this.menuElements.forEach(elem => elem.setVisible(false));
        }
    }

    updateDetailedStats() {
        const elapsed = Date.now() - this.playerStats.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);

        const stats = this.player.stats || {};

        // Format stats in 2 columns to save space
        const statsText = [
            `Level: ${this.player.level || 1}                XP: ${this.player.experience || 0} / ${GameConfig.getXPRequired(this.player.level || 1)}`,
            '',
            `⚔️ Kills: ${this.playerStats.kills}              💀 Deaths: ${this.playerStats.deaths}`,
            `⏱️ Time: ${minutes}:${seconds.toString().padStart(2, '0')}           💥 Dealt: ${Math.floor(this.playerStats.damageDealt)}`,
            `💔 Taken: ${Math.floor(this.playerStats.damageTaken)}`,
            '',
            `💪 Attack: ${stats.attack || 10}            🛡️ Defense: ${stats.defense || 5}`,
            `⚡ Speed: ${stats.speed || 100}           ✨ Critical: ${stats.critical || 5}%`
        ];

        this.detailedStatsText.setText(statsText.join('\n'));
    }

    update() {
        if (!this.player) return;

        // Only update health bar if health or shield changed (CRITICAL FPS FIX)
        const shield = this.player.shield || 0;
        if (this.player.health !== this.lastHealth || this.player.maxHealth !== this.lastMaxHealth || shield !== this.lastShield) {
            this.updateHealthBar();
            this.lastHealth = this.player.health;
            this.lastMaxHealth = this.player.maxHealth;
            this.lastShield = shield;
        }

        // Only update XP bar if XP/level changed
        if (this.player.experience !== this.lastExperience || this.player.level !== this.lastLevel) {
            this.updateXPBar();
            this.updateLevel();
            this.lastExperience = this.player.experience;
            this.lastLevel = this.player.level;
        }

        // Update quick stats only once per second (PERFORMANCE FIX)
        const now = Date.now();
        if (now - this.lastQuickStatsUpdate >= this.quickStatsUpdateInterval) {
            this.updateQuickStats();
            this.lastQuickStatsUpdate = now;
        }
    }

    updateQuickStats() {
        const elapsed = Date.now() - this.playerStats.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.quickStatsText.setText(`⚔ ${this.playerStats.kills}  ⏱ ${timeStr}`);
    }

    updateHealthBar() {
        const health = this.player.health;
        const maxHealth = this.player.maxHealth;
        const shield = this.player.shield || 0;
        const healthPercent = health / maxHealth;

        // Clear previous graphics
        this.healthBarFill.clear();
        this.shieldBarFill.clear();

        // Calculate width based on health
        const currentHealthWidth = this.healthBarWidth * healthPercent;

        // Determine color based on health percentage
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = 0x10b981; // Green
        } else if (healthPercent > 0.4) {
            healthColor = 0xfbbf24; // Yellow
        } else if (healthPercent > 0.25) {
            healthColor = 0xf97316; // Orange
        } else {
            healthColor = 0xef4444; // Red
        }

        // Draw outer glow for depth
        this.healthBarFill.fillStyle(healthColor, 0.3);
        this.healthBarFill.fillRoundedRect(
            this.healthBarX - 2,
            this.healthBarY - 2,
            currentHealthWidth + 4,
            this.healthBarHeight + 4,
            6
        );

        // Draw main health bar
        this.healthBarFill.fillStyle(healthColor, 1);
        this.healthBarFill.fillRoundedRect(
            this.healthBarX,
            this.healthBarY,
            currentHealthWidth,
            this.healthBarHeight,
            6
        );

        // Draw inner highlight for 3D effect
        this.healthBarFill.fillStyle(0xffffff, 0.2);
        this.healthBarFill.fillRoundedRect(
            this.healthBarX,
            this.healthBarY,
            currentHealthWidth,
            this.healthBarHeight / 3,
            6
        );

        // Low health pulse effect
        if (healthPercent < 0.25 && !this.lowHealthPulse) {
            this.lowHealthPulse = this.scene.tweens.add({
                targets: this.healthBarFill,
                alpha: 0.7,
                duration: 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (healthPercent >= 0.25 && this.lowHealthPulse) {
            this.lowHealthPulse.stop();
            this.lowHealthPulse = null;
            this.healthBarFill.alpha = 1;
        }

        // Draw shield bar if present
        if (shield > 0) {
            const shieldWidth = Math.min((shield / maxHealth) * this.healthBarWidth, this.healthBarWidth - currentHealthWidth);
            const shieldX = this.healthBarX + currentHealthWidth;

            // Shield glow
            this.shieldBarFill.fillStyle(0x3b82f6, 0.4);
            this.shieldBarFill.fillRoundedRect(
                shieldX - 2,
                this.healthBarY - 2,
                shieldWidth + 4,
                this.healthBarHeight + 4,
                6
            );

            // Shield main bar
            this.shieldBarFill.fillStyle(0x60a5fa, 1);
            this.shieldBarFill.fillRoundedRect(
                shieldX,
                this.healthBarY,
                shieldWidth,
                this.healthBarHeight,
                6
            );

            // Shield highlight
            this.shieldBarFill.fillStyle(0xffffff, 0.3);
            this.shieldBarFill.fillRoundedRect(
                shieldX,
                this.healthBarY,
                shieldWidth,
                this.healthBarHeight / 3,
                6
            );
        }

        // Update text (include shield if present)
        if (shield > 0) {
            this.healthText.setText(`${Math.ceil(health)}/${Math.ceil(maxHealth)} (+${Math.ceil(shield)})`);
        } else {
            this.healthText.setText(`${Math.ceil(health)}/${Math.ceil(maxHealth)}`);
        }
    }

    updateLevel() {
        const level = this.player.level || 1;
        this.levelText.setText(level.toString());
    }

    updateXPBar() {
        const xp = this.player.experience || 0;
        const level = this.player.level || 1;
        const xpToNext = GameConfig.getXPRequired(level);
        const xpPercent = Math.min(xp / xpToNext, 1);

        // OPTIMIZED: Simple rectangles instead of rounded
        this.xpBarBg.clear();
        this.xpBarFill.clear();

        const barWidth = 140;
        const barHeight = 6;
        const barX = 60;
        const barY = 48;

        // Simple background
        this.xpBarBg.fillStyle(0x000000, 0.6);
        this.xpBarBg.fillRect(barX, barY, barWidth, barHeight);

        // Simple fill (no gradient layers for performance)
        const fillWidth = barWidth * xpPercent;
        this.xpBarFill.fillStyle(0x6366f1, 1);
        this.xpBarFill.fillRect(barX, barY, fillWidth, barHeight);

        // Update text
        this.xpText.setText(`${xp} / ${xpToNext}`);
    }

    // Methods to track stats (call these from game events)
    addKill() {
        this.playerStats.kills++;
    }

    addDeath() {
        this.playerStats.deaths++;
    }

    addDamageDealt(amount) {
        this.playerStats.damageDealt += amount;
    }

    addDamageTaken(amount) {
        this.playerStats.damageTaken += amount;
    }

    destroy() {
        // Stop any active tweens
        if (this.lowHealthPulse) {
            this.lowHealthPulse.stop();
            this.lowHealthPulse = null;
        }

        // Destroy all elements
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.shieldBarFill) this.shieldBarFill.destroy();
        if (this.healthText) this.healthText.destroy();
        if (this.compactHub) this.compactHub.destroy();
        if (this.xpBarBg) this.xpBarBg.destroy();
        if (this.xpBarFill) this.xpBarFill.destroy();

        // Destroy menu elements
        if (this.menuElements) {
            this.menuElements.forEach(elem => {
                if (elem) elem.destroy();
            });
        }
    }
}
