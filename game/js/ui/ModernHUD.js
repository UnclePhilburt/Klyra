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

        // OPTION 2: MINIMAL CORNER HUD - Bottom-left vertical stack
        const padding = 20;
        const barWidth = 250; // Compact width
        const healthBarHeight = 12; // Very thin
        const xpBarHeight = 8; // Thin
        const barSpacing = 6; // Space between bars

        const barX = padding;
        const healthBarY = height - padding - healthBarHeight - xpBarHeight - barSpacing - 10; // Above abilities
        const xpBarY = healthBarY + healthBarHeight + barSpacing;

        // No background container - minimalist design
        this.healthBarBg = this.scene.add.graphics();
        this.healthBarBg.setScrollFactor(0);
        this.healthBarBg.setDepth(99000);

        // Health bar fill (will be drawn dynamically)
        this.healthBarFill = this.scene.add.graphics();
        this.healthBarFill.setScrollFactor(0);
        this.healthBarFill.setDepth(99001);

        // Shield bar fill (rendered over health)
        this.shieldBarFill = this.scene.add.graphics();
        this.shieldBarFill.setScrollFactor(0);
        this.shieldBarFill.setDepth(99002);

        // XP bar fill
        this.xpBarFill = this.scene.add.graphics();
        this.xpBarFill.setScrollFactor(0);
        this.xpBarFill.setDepth(99001);

        // Store bar dimensions for dynamic drawing
        this.healthBarX = barX;
        this.healthBarY = healthBarY;
        this.healthBarWidth = barWidth;
        this.healthBarHeight = healthBarHeight;
        this.xpBarHeight = xpBarHeight;
        this.xpBarY = xpBarY;

        // Health text (compact, inside bar)
        this.healthText = this.scene.add.text(barX + 6, healthBarY + healthBarHeight / 2, '100/100', {
            fontFamily: 'Arial',
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(99003);

        // Level indicator (compact, on XP bar)
        this.levelText = this.scene.add.text(barX + 6, xpBarY + xpBarHeight / 2, 'Lv 1', {
            fontFamily: 'Arial',
            fontSize: '10px',
            fontStyle: 'bold',
            fill: '#a5b4fc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(99003);

        // XP text (compact, right side of XP bar)
        this.xpText = this.scene.add.text(barX + barWidth - 6, xpBarY + xpBarHeight / 2, '0/100', {
            fontFamily: 'Arial',
            fontSize: '9px',
            fill: '#a5b4fc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(99003);

        // MINIMALIST INFO HUB (Top-Left)
        this.infoHubExpanded = false;
        this.createInfoHub();

        // Initial update
        this.update();
    }

    createInfoHub() {
        const padding = 16;
        const width = this.scene.cameras.main.width;

        // Currency display (top-right, compact design)
        this.currencyContainer = this.scene.add.container(width - padding - 100, padding);
        this.currencyContainer.setScrollFactor(0);
        this.currencyContainer.setDepth(99600);

        // Currency background (compact)
        const currencyBg = this.scene.add.graphics();
        currencyBg.fillStyle(0x000000, 0.5);
        currencyBg.fillRoundedRect(0, 0, 100, 32, 6);
        currencyBg.lineStyle(1, 0x9d00ff, 0.6); // Purple border for souls
        currencyBg.strokeRoundedRect(0, 0, 100, 32, 6);

        // Soul icon (sprite from souls sheet, smaller)
        const soulIcon = this.scene.add.sprite(18, 16, 'souls', 0);
        soulIcon.setScale(0.6); // Smaller icon
        soulIcon.setOrigin(0.5, 0.5);

        // Currency text (compact)
        this.currencyText = this.scene.add.text(35, 16, '0', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fontStyle: 'bold',
            fill: '#9d00ff', // Purple color for souls
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        this.currencyContainer.add([currencyBg, soulIcon, this.currencyText]);

        // Skills display (top-right, always visible when skills owned)
        const screenRightX = this.scene.cameras.main.width - padding - 180; // Adjusted for text width
        const screenTopY = padding;

        this.skillsContainer = this.scene.add.container(screenRightX, screenTopY);
        this.skillsContainer.setScrollFactor(0);
        this.skillsContainer.setDepth(99600);

        // Skills background (initially hidden, shown when skills are acquired)
        this.skillsBg = this.scene.add.graphics();

        // Skills text container (will hold individual skill names)
        this.skillTexts = [];

        this.skillsContainer.add([this.skillsBg]);
        this.skillsContainer.setVisible(false); // Hidden until player gets a skill

        // COMPACT VIEW (always visible)
        this.compactHub = this.scene.add.container(padding, padding); // Closer to top edge
        this.compactHub.setScrollFactor(0);
        this.compactHub.setDepth(99500);

        // Compact background (simple for performance) - made taller for username
        const compactBg = this.scene.add.graphics();
        compactBg.fillStyle(0x0a0a0f, 0.9);
        compactBg.fillRect(0, 0, 200, 105);
        compactBg.lineStyle(2, 0x6366f1, 0.6);
        compactBg.strokeRect(0, 0, 200, 105);
        this.compactHub.add(compactBg);

        // Username display at top
        const username = this.player.username || 'Player';
        this.usernameText = this.scene.add.text(100, 8, username, {
            fontFamily: 'Arial',
            fontSize: '13px',
            fontStyle: 'bold',
            fill: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0);
        this.compactHub.add(this.usernameText);

        // Level badge (circular) - moved down to make room for username
        const levelBadge = this.scene.add.circle(30, 45, 22, 0x6366f1, 0.2);
        levelBadge.setStrokeStyle(3, 0x6366f1, 1);
        this.compactHub.add(levelBadge);

        this.levelText = this.scene.add.text(30, 45, '1', {
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

        this.xpText = this.scene.add.text(100, 50, 'XP: 0 / 100', {
            fontFamily: 'Arial',
            fontSize: '11px',
            fill: '#a5b4fc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0);
        this.compactHub.add(this.xpText);

        // Quick stats (kills, time) - moved down
        this.quickStatsText = this.scene.add.text(12, 80, '⚔ 0  ⏱ 0:00', {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#d1d5db',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0);
        this.compactHub.add(this.quickStatsText);

        // Tab hint (static for performance)
        this.tabHint = this.scene.add.text(200, 94, '[TAB]', {
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

        // ESC key to toggle menu OR close inventory/shops
        const escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey.on('down', () => {
            // Close inventory first if it's open
            if (this.scene.inventoryUI && this.scene.inventoryUI.isOpen) {
                this.scene.inventoryUI.toggleInventory();
                return;
            }
            // Close merchant shop if open
            if (this.scene.merchantNPC && this.scene.merchantNPC.isShopOpen) {
                this.scene.merchantNPC.closeShop();
                return;
            }
            // Close skill shop if open
            if (this.scene.skillShopNPC && this.scene.skillShopNPC.isShopOpen) {
                this.scene.skillShopNPC.closeShop();
                return;
            }
            // Otherwise toggle the stats menu
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
        this.healthBarBg.clear();
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

        // Draw subtle background (dark, semi-transparent)
        this.healthBarBg.fillStyle(0x000000, 0.4);
        this.healthBarBg.fillRoundedRect(
            this.healthBarX,
            this.healthBarY,
            this.healthBarWidth,
            this.healthBarHeight,
            3
        );

        // Draw outer glow for depth
        this.healthBarFill.fillStyle(healthColor, 0.3);
        this.healthBarFill.fillRoundedRect(
            this.healthBarX - 1,
            this.healthBarY - 1,
            currentHealthWidth + 2,
            this.healthBarHeight + 2,
            3
        );

        // Draw main health bar
        this.healthBarFill.fillStyle(healthColor, 0.85);
        this.healthBarFill.fillRoundedRect(
            this.healthBarX,
            this.healthBarY,
            currentHealthWidth,
            this.healthBarHeight,
            3
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
            this.shieldBarFill.fillStyle(0x60a5fa, 0.4);
            this.shieldBarFill.fillRoundedRect(
                shieldX - 1,
                this.healthBarY - 1,
                shieldWidth + 2,
                this.healthBarHeight + 2,
                3
            );

            // Shield main bar
            this.shieldBarFill.fillStyle(0x60a5fa, 0.8);
            this.shieldBarFill.fillRoundedRect(
                shieldX,
                this.healthBarY,
                shieldWidth,
                this.healthBarHeight,
                3
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
        this.levelText.setText(`Lv ${level}`);
    }

    updateXPBar() {
        const xp = this.player.experience || 0;
        const level = this.player.level || 1;
        const xpToNext = GameConfig.getXPRequired(level);
        const xpPercent = Math.min(xp / xpToNext, 1);

        // Clear previous XP bar
        this.xpBarFill.clear();

        // Calculate fill width
        const fillWidth = this.healthBarWidth * xpPercent;

        // Draw subtle background
        this.xpBarFill.fillStyle(0x000000, 0.4);
        this.xpBarFill.fillRoundedRect(
            this.healthBarX,
            this.xpBarY,
            this.healthBarWidth,
            this.xpBarHeight,
            2
        );

        // XP bar glow
        this.xpBarFill.fillStyle(0x6366f1, 0.4);
        this.xpBarFill.fillRoundedRect(
            this.healthBarX - 1,
            this.xpBarY - 1,
            fillWidth + 2,
            this.xpBarHeight + 2,
            2
        );

        // XP bar fill
        this.xpBarFill.fillStyle(0x818cf8, 0.8);
        this.xpBarFill.fillRoundedRect(
            this.healthBarX,
            this.xpBarY,
            fillWidth,
            this.xpBarHeight,
            2
        );

        // Update text
        this.xpText.setText(`${xp}/${xpToNext}`);
    }

    // Update username display
    updateUsername(username) {
        if (this.usernameText && username) {
            this.usernameText.setText(username);
        }
    }

    // Update currency display
    updateCurrency(amount) {
        if (this.currencyText) {
            this.currencyText.setText(amount.toString());
        }
    }

    // Add currency
    addCurrency(amount) {
        if (!this.player.currency) {
            this.player.currency = 0;
        }
        this.player.currency += amount;
        this.updateCurrency(this.player.currency);
        console.log(`⭐ Added ${amount} stars. Total: ${this.player.currency}`);
    }

    // Get current currency
    getCurrency() {
        return this.player.currency || 0;
    }

    // Add skill to display
    addSkillToDisplay(skillId, skillName) {
        // Show the skills container if it's hidden
        this.skillsContainer.setVisible(true);

        const skillIndex = this.skillTexts.length;
        const yOffset = skillIndex * 30; // Stack skills vertically with 30px spacing

        // Create skill name text
        const nameText = this.scene.add.text(
            12,
            12 + yOffset,
            skillName,
            {
                fontFamily: 'Arial',
                fontSize: '14px',
                fontStyle: 'bold',
                fill: '#aa66ff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0, 0);

        this.skillTexts.push({ text: nameText, skillId: skillId });
        this.skillsContainer.add(nameText);

        // Redraw background to fit all skills
        this.updateSkillsBackground();

        console.log(`🎨 Added skill to HUD display: ${skillName}`);
    }

    clearAllSkills() {
        // Destroy all skill text elements
        this.skillTexts.forEach(skill => {
            if (skill.text) {
                skill.text.destroy();
            }
        });

        // Clear the array
        this.skillTexts = [];

        // Hide the container
        this.skillsContainer.setVisible(false);

        // Clear the background
        this.skillsBg.clear();

        console.log('🧹 Cleared all skills from HUD');
    }

    // Update skills background based on number of skills
    updateSkillsBackground() {
        this.skillsBg.clear();

        if (this.skillTexts.length === 0) return;

        const bgHeight = this.skillTexts.length * 30 + 16; // 30px per skill + padding
        const bgWidth = 180;

        this.skillsBg.fillStyle(0x000000, 0.7);
        this.skillsBg.fillRoundedRect(0, 0, bgWidth, bgHeight, 8);
        this.skillsBg.lineStyle(2, 0x9933ff, 1);
        this.skillsBg.strokeRoundedRect(0, 0, bgWidth, bgHeight, 8);
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

    // Reposition UI elements when screen size changes
    repositionUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const padding = 16;

        // Update currency container position (top-right)
        if (this.currencyContainer) {
            this.currencyContainer.x = width - padding - 100;
            this.currencyContainer.y = padding;
        }

        // Update skills container position (top-right)
        if (this.skillsContainer) {
            this.skillsContainer.x = width - padding - 180;
            this.skillsContainer.y = padding;
        }

        // Update compact hub position (top-left)
        if (this.compactHub) {
            this.compactHub.x = padding;
            this.compactHub.y = padding;
        }

        // Update health/xp bar positions (bottom-left)
        const barX = 20;
        const healthBarHeight = 12;
        const xpBarHeight = 8;
        const barSpacing = 6;
        const healthBarY = height - 20 - healthBarHeight - xpBarHeight - barSpacing - 10;
        const xpBarY = healthBarY + healthBarHeight + barSpacing;

        this.healthBarX = barX;
        this.healthBarY = healthBarY;
        this.xpBarY = xpBarY;

        // Update text positions
        if (this.healthText) {
            this.healthText.y = healthBarY + healthBarHeight / 2;
        }

        // Force redraw health and XP bars with new positions
        if (this.player) {
            this.updateHealthBar();
            this.updateXPBar();
        }
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
