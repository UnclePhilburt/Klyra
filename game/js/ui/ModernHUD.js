// ═══════════════════════════════════════════════════════════════════════════════
// ModernHUD - Bottom-Center Action Bar (Performance Optimized)
// ═══════════════════════════════════════════════════════════════════════════════

class ModernHUD {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // ─── Cache (Critical for FPS) ────────────────────────────────────────
        this.cache = {
            health: -1,
            maxHealth: -1,
            shield: -1,
            level: -1,
            experience: -1
        };

        // ─── Stats ───────────────────────────────────────────────────────────
        this.playerStats = {
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            startTime: Date.now()
        };

        // ─── State ───────────────────────────────────────────────────────────
        this.menuOpen = false;
        this.menuElements = [];
        this.skillTexts = [];
        this.lowHealthTween = null;

        // ─── Controller ──────────────────────────────────────────────────────
        this.controllerIndex = 0;
        this.controllerMenuItems = [];
        this.lastControllerInput = 0;

        // ─── Throttle ────────────────────────────────────────────────────────
        this.lastStatsUpdate = 0;

        // Keyboard keys
        this.keys = [];

        // Build UI
        this.create();
    }

    create() {
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;

        this.createBottomBar(w, h);
        this.createTopBar(w);
        this.createMenu(w, h);
        this.setupKeyboard();

        this.update();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BOTTOM BAR
    // ═══════════════════════════════════════════════════════════════════════════

    createBottomBar(screenW, screenH) {
        const barW = Math.min(500, screenW - 40);
        const barH = 64;
        const barX = (screenW - barW) / 2;
        const barY = screenH - barH - 57;

        this.bottomBar = this.scene.add.container(barX, barY);
        this.bottomBar.setScrollFactor(0).setDepth(99500);

        // Background (drawn once, never redrawn)
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x111111, 0.9);
        bg.fillRoundedRect(0, 0, barW, barH, 16);
        bg.lineStyle(1, 0x333333, 0.8);
        bg.strokeRoundedRect(0, 0, barW, barH, 16);
        this.bottomBar.add(bg);

        // ─── Health Bar (Left) ───────────────────────────────────────────────
        const hpX = 20;
        const hpY = barH / 2;
        const hpW = 160;
        const hpH = 10;

        // HP Background (static)
        const hpBg = this.scene.add.graphics();
        hpBg.fillStyle(0x222222, 1);
        hpBg.fillRoundedRect(hpX, hpY - hpH/2, hpW, hpH, 4);
        this.bottomBar.add(hpBg);

        // HP Fill (updated dynamically)
        this.hpFill = this.scene.add.graphics();
        this.bottomBar.add(this.hpFill);

        // Shield Fill
        this.shieldFill = this.scene.add.graphics();
        this.bottomBar.add(this.shieldFill);

        // HP Text
        this.hpText = this.scene.add.text(hpX + hpW/2, hpY, '100', {
            fontFamily: 'Arial',
            fontSize: '10px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.bottomBar.add(this.hpText);

        // HP Label
        const hpLabel = this.scene.add.text(hpX, hpY - hpH/2 - 8, 'HP', {
            fontFamily: 'Arial',
            fontSize: '9px',
            fill: '#666666'
        }).setOrigin(0, 1);
        this.bottomBar.add(hpLabel);

        this.hpBar = { x: hpX, y: hpY, w: hpW, h: hpH };

        // ─── Level + XP (Center) ─────────────────────────────────────────────
        const centerX = barW / 2;

        // Level circle (static bg)
        const lvlBg = this.scene.add.graphics();
        lvlBg.fillStyle(0x1a1a1a, 1);
        lvlBg.fillCircle(centerX, barH/2, 22);
        lvlBg.lineStyle(2, 0x8b5cf6, 0.8);
        lvlBg.strokeCircle(centerX, barH/2, 22);
        this.bottomBar.add(lvlBg);

        // Level text
        this.lvlText = this.scene.add.text(centerX, barH/2 - 2, '1', {
            fontFamily: 'Arial',
            fontSize: '16px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.bottomBar.add(this.lvlText);

        // LVL micro label
        const lvlLabel = this.scene.add.text(centerX, barH/2 + 10, 'LVL', {
            fontFamily: 'Arial',
            fontSize: '7px',
            fill: '#666666'
        }).setOrigin(0.5);
        this.bottomBar.add(lvlLabel);

        // XP Ring (updated dynamically)
        this.xpRing = this.scene.add.graphics();
        this.bottomBar.add(this.xpRing);

        // XP % text
        this.xpText = this.scene.add.text(centerX, barH/2 + 28, '0%', {
            fontFamily: 'Arial',
            fontSize: '9px',
            fill: '#8b5cf6'
        }).setOrigin(0.5, 0);
        this.bottomBar.add(this.xpText);

        this.lvlBadge = { x: centerX, y: barH/2, r: 26 };

        // ─── Stats (Right) ───────────────────────────────────────────────────
        const statsX = barW - 20;

        // Kills
        this.killsText = this.scene.add.text(statsX - 110, barH/2 - 6, '0', {
            fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', fill: '#f87171'
        }).setOrigin(0, 0.5);
        this.bottomBar.add(this.killsText);

        const killsLbl = this.scene.add.text(statsX - 110, barH/2 + 8, 'KILLS', {
            fontFamily: 'Arial', fontSize: '8px', fill: '#666666'
        }).setOrigin(0, 0.5);
        this.bottomBar.add(killsLbl);

        // Time
        this.timeText = this.scene.add.text(statsX - 60, barH/2 - 6, '0:00', {
            fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', fill: '#60a5fa'
        }).setOrigin(0, 0.5);
        this.bottomBar.add(this.timeText);

        const timeLbl = this.scene.add.text(statsX - 60, barH/2 + 8, 'TIME', {
            fontFamily: 'Arial', fontSize: '8px', fill: '#666666'
        }).setOrigin(0, 0.5);
        this.bottomBar.add(timeLbl);

        // Deaths
        this.deathsText = this.scene.add.text(statsX - 10, barH/2 - 6, '0', {
            fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', fill: '#a78bfa'
        }).setOrigin(0, 0.5);
        this.bottomBar.add(this.deathsText);

        const deathsLbl = this.scene.add.text(statsX - 10, barH/2 + 8, 'DEATHS', {
            fontFamily: 'Arial', fontSize: '8px', fill: '#666666'
        }).setOrigin(0, 0.5);
        this.bottomBar.add(deathsLbl);

        this.barDimensions = { w: barW, h: barH, x: barX, y: barY };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOP BAR
    // ═══════════════════════════════════════════════════════════════════════════

    createTopBar(screenW) {
        this.topBar = this.scene.add.container(0, 0);
        this.topBar.setScrollFactor(0).setDepth(99500);

        // Username (top left)
        const username = this.player.username || 'Player';
        const userBg = this.scene.add.graphics();
        userBg.fillStyle(0x111111, 0.85);
        userBg.fillRoundedRect(16, 16, 100, 32, 10);
        this.topBar.add(userBg);

        this.usernameText = this.scene.add.text(66, 32, username, {
            fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', fill: '#fbbf24'
        }).setOrigin(0.5);
        this.topBar.add(this.usernameText);

        // Currency (top right)
        const currBg = this.scene.add.graphics();
        currBg.fillStyle(0x111111, 0.85);
        currBg.fillRoundedRect(screenW - 100 - 16, 16, 100, 32, 10);
        this.topBar.add(currBg);

        // Soul icon
        const soulIcon = this.scene.add.sprite(screenW - 100, 32, 'souls', 0);
        soulIcon.setScale(0.5).setOrigin(0.5);
        this.topBar.add(soulIcon);

        this.currencyText = this.scene.add.text(screenW - 80, 32, '0', {
            fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', fill: '#c084fc'
        }).setOrigin(0, 0.5);
        this.topBar.add(this.currencyText);

        // Menu button
        const menuBtnX = screenW - 16 - 36;
        const menuBtnY = 56;

        this.menuBtn = this.scene.add.container(menuBtnX, menuBtnY);
        this.menuBtn.setScrollFactor(0).setDepth(99501);

        const menuBtnBg = this.scene.add.graphics();
        menuBtnBg.fillStyle(0x111111, 0.85);
        menuBtnBg.fillRoundedRect(0, 0, 36, 32, 8);
        this.menuBtn.add(menuBtnBg);

        const menuIcon = this.scene.add.text(18, 16, '☰', {
            fontSize: '16px', fill: '#888888'
        }).setOrigin(0.5);
        this.menuBtn.add(menuIcon);

        this.menuBtn.setSize(36, 32).setInteractive({ useHandCursor: true });
        this.menuBtn.on('pointerdown', () => this.toggleMenu());

        // Skills container
        this.skillsContainer = this.scene.add.container(screenW - 16 - 150, 100);
        this.skillsContainer.setScrollFactor(0).setDepth(99500).setVisible(false);
        this.skillsBg = this.scene.add.graphics();
        this.skillsContainer.add(this.skillsBg);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MENU
    // ═══════════════════════════════════════════════════════════════════════════

    createMenu(screenW, screenH) {
        const menuW = 340;
        const menuH = 420;
        const menuX = (screenW - menuW) / 2;
        const menuY = (screenH - menuH) / 2;

        // Overlay (not interactive until opened)
        this.menuOverlay = this.scene.add.graphics();
        this.menuOverlay.setScrollFactor(0).setDepth(99600);
        this.menuOverlay.fillStyle(0x000000, 0.75);
        this.menuOverlay.fillRect(0, 0, screenW, screenH);
        this.menuOverlay.setVisible(false);
        this.menuElements.push(this.menuOverlay);

        // Panel
        this.menuPanel = this.scene.add.container(menuX, menuY);
        this.menuPanel.setScrollFactor(0).setDepth(99601).setVisible(false);
        this.menuElements.push(this.menuPanel);

        // Panel bg
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a1a, 0.98);
        panelBg.fillRoundedRect(0, 0, menuW, menuH, 16);
        panelBg.lineStyle(1, 0x333333, 0.6);
        panelBg.strokeRoundedRect(0, 0, menuW, menuH, 16);
        this.menuPanel.add(panelBg);

        // Header
        const header = this.scene.add.text(menuW/2, 28, 'MENU', {
            fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold',
            fill: '#ffffff', letterSpacing: 4
        }).setOrigin(0.5, 0);
        this.menuPanel.add(header);

        // Stats text
        this.statsText = this.scene.add.text(24, 70, '', {
            fontFamily: 'Courier New', fontSize: '11px', fill: '#aaaaaa', lineSpacing: 6
        });
        this.menuPanel.add(this.statsText);

        // Buttons
        const btnY = 260;
        const btnGap = 52;

        this.controllerMenuItems = [];

        const resumeBtn = this.createMenuButton(menuW/2, btnY, 'RESUME', 0x22c55e, () => this.toggleMenu());
        this.menuPanel.add(resumeBtn.container);
        this.controllerMenuItems.push(resumeBtn);

        const settingsBtn = this.createMenuButton(menuW/2, btnY + btnGap, 'SETTINGS', 0x8b5cf6, () => {});
        this.menuPanel.add(settingsBtn.container);
        this.controllerMenuItems.push(settingsBtn);

        const mainBtn = this.createMenuButton(menuW/2, btnY + btnGap*2, 'MAIN MENU', 0xef4444, () => {
            // Clear game session so they don't auto-reconnect
            localStorage.removeItem('klyra_game_session');
            window.location.reload();
        });
        this.menuPanel.add(mainBtn.container);
        this.controllerMenuItems.push(mainBtn);

        // Close hint
        const hint = this.scene.add.text(menuW/2, menuH - 20, 'TAB / ESC / Ⓑ to close', {
            fontFamily: 'Arial', fontSize: '10px', fill: '#555555'
        }).setOrigin(0.5);
        this.menuPanel.add(hint);
    }

    createMenuButton(x, y, label, color, callback) {
        const w = 180, h = 42;
        const container = this.scene.add.container(x - w/2, y - h/2);

        const bg = this.scene.add.graphics();
        bg.fillStyle(color, 0.15);
        bg.fillRoundedRect(0, 0, w, h, 8);
        bg.lineStyle(1.5, color, 0.7);
        bg.strokeRoundedRect(0, 0, w, h, 8);
        container.add(bg);

        const txt = this.scene.add.text(w/2, h/2, label, {
            fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
            fill: '#ffffff', letterSpacing: 2
        }).setOrigin(0.5);
        container.add(txt);

        container.setSize(w, h).setInteractive({ useHandCursor: true });

        const highlight = (on) => {
            bg.clear();
            bg.fillStyle(color, on ? 0.3 : 0.15);
            bg.fillRoundedRect(0, 0, w, h, 8);
            bg.lineStyle(on ? 2 : 1.5, color, on ? 1 : 0.7);
            bg.strokeRoundedRect(0, 0, w, h, 8);
            container.setScale(on ? 1.03 : 1);
        };

        container.on('pointerover', () => highlight(true));
        container.on('pointerout', () => highlight(false));
        container.on('pointerdown', callback);

        return { container, highlight, callback };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTROLS
    // ═══════════════════════════════════════════════════════════════════════════

    setupKeyboard() {
        // Check if keyboard is available
        if (!this.scene.input || !this.scene.input.keyboard) {
            console.warn('⚠️ Keyboard input not available for ModernHUD');
            return;
        }

        const tab = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        tab.on('down', e => { e?.preventDefault?.(); this.toggleMenu(); });
        this.keys.push(tab);

        const esc = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        esc.on('down', () => {
            if (this.scene.inventoryUI?.isOpen) return this.scene.inventoryUI.toggleInventory();
            if (this.scene.merchantNPC?.isShopOpen) return this.scene.merchantNPC.closeShop();
            if (this.scene.skillShopNPC?.isShopOpen) return this.scene.skillShopNPC.closeShop();
            if (this.menuOpen) this.toggleMenu();
        });
        this.keys.push(esc);
    }

    // Controller polling IN update() - no separate timer
    pollController() {
        if (!navigator.getGamepads) return;
        const gp = navigator.getGamepads()[0];
        if (!gp) return;

        const now = Date.now();
        if (now - this.lastControllerInput < 180) return;

        const up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
        const down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
        const a = gp.buttons[0]?.pressed;
        const b = gp.buttons[1]?.pressed;
        const start = gp.buttons[9]?.pressed;

        if (start) {
            this.lastControllerInput = now;
            this.toggleMenu();
            return;
        }

        if (!this.menuOpen) return;

        if (up) {
            this.lastControllerInput = now;
            this.controllerMenuItems[this.controllerIndex]?.highlight(false);
            this.controllerIndex = (this.controllerIndex - 1 + this.controllerMenuItems.length) % this.controllerMenuItems.length;
            this.controllerMenuItems[this.controllerIndex]?.highlight(true);
        } else if (down) {
            this.lastControllerInput = now;
            this.controllerMenuItems[this.controllerIndex]?.highlight(false);
            this.controllerIndex = (this.controllerIndex + 1) % this.controllerMenuItems.length;
            this.controllerMenuItems[this.controllerIndex]?.highlight(true);
        }

        if (a) {
            this.lastControllerInput = now;
            this.controllerMenuItems[this.controllerIndex]?.callback();
        }

        if (b && this.menuOpen) {
            this.lastControllerInput = now;
            this.toggleMenu();
        }
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;

        if (this.menuOpen) {
            this.updateMenuStats();
            this.menuOverlay.setVisible(true);
            this.menuPanel.setVisible(true);
            this.controllerIndex = 0;
            this.controllerMenuItems[0]?.highlight(true);

            // Make overlay interactive only when open
            this.menuOverlay.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height),
                Phaser.Geom.Rectangle.Contains
            );
            this.menuOverlay.once('pointerdown', () => this.toggleMenu());
        } else {
            this.menuOverlay.setVisible(false);
            this.menuPanel.setVisible(false);
            this.menuOverlay.disableInteractive();
            this.controllerMenuItems.forEach(b => b.highlight(false));
        }
    }

    updateMenuStats() {
        const elapsed = Date.now() - this.playerStats.startTime;
        const m = Math.floor(elapsed / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        const stats = this.player.stats || {};
        const lvl = this.player.level || 1;
        const xp = this.player.experience || 0;
        const xpReq = GameConfig.getXPRequired(lvl);

        this.statsText.setText([
            `Level:    ${lvl}`,
            `XP:       ${xp} / ${xpReq}`,
            ``,
            `Kills:    ${this.playerStats.kills}`,
            `Deaths:   ${this.playerStats.deaths}`,
            `Time:     ${m}:${String(s).padStart(2,'0')}`,
            ``,
            `Damage Dealt:  ${Math.floor(this.playerStats.damageDealt)}`,
            `Damage Taken:  ${Math.floor(this.playerStats.damageTaken)}`,
            ``,
            `ATK: ${stats.attack||10}  DEF: ${stats.defense||5}  SPD: ${stats.speed||100}`
        ].join('\n'));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE (Called by scene)
    // ═══════════════════════════════════════════════════════════════════════════

    update() {
        if (!this.player) return;

        // Controller (inline, no timer)
        this.pollController();

        // Health (only if changed)
        const hp = this.player.health;
        const maxHp = this.player.maxHealth;
        const shield = this.player.shield || 0;

        if (hp !== this.cache.health || maxHp !== this.cache.maxHealth || shield !== this.cache.shield) {
            this.drawHealthBar(hp, maxHp, shield);
            this.cache.health = hp;
            this.cache.maxHealth = maxHp;
            this.cache.shield = shield;
        }

        // XP (only if changed)
        const xp = this.player.experience || 0;
        const lvl = this.player.level || 1;

        if (xp !== this.cache.experience || lvl !== this.cache.level) {
            this.drawXP(xp, lvl);
            this.cache.experience = xp;
            this.cache.level = lvl;
        }

        // Stats (throttled - once per second)
        const now = Date.now();
        if (now - this.lastStatsUpdate > 1000) {
            this.updateQuickStats();
            this.lastStatsUpdate = now;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAW METHODS (Only called when values change)
    // ═══════════════════════════════════════════════════════════════════════════

    drawHealthBar(hp, maxHp, shield) {
        const pct = Math.max(0, hp / maxHp);
        const { x, y, w, h } = this.hpBar;
        const fillW = w * pct;

        // Color
        let color;
        if (pct > 0.6) color = 0x22c55e;
        else if (pct > 0.4) color = 0xeab308;
        else if (pct > 0.25) color = 0xf97316;
        else color = 0xef4444;

        // Clear and redraw fill
        this.hpFill.clear();
        if (fillW > 0) {
            this.hpFill.fillStyle(color, 1);
            this.hpFill.fillRoundedRect(x, y - h/2, fillW, h, 4);
        }

        // Shield
        this.shieldFill.clear();
        if (shield > 0) {
            const shieldW = Math.min((shield / maxHp) * w, w - fillW);
            this.shieldFill.fillStyle(0x3b82f6, 0.9);
            this.shieldFill.fillRoundedRect(x + fillW, y - h/2, shieldW, h, 4);
        }

        // Low health pulse
        if (pct < 0.25) {
            if (!this.lowHealthTween) {
                this.lowHealthTween = this.scene.tweens.add({
                    targets: this.hpFill, alpha: 0.5,
                    duration: 400, yoyo: true, repeat: -1
                });
            }
        } else if (this.lowHealthTween) {
            this.lowHealthTween.stop();
            this.lowHealthTween = null;
            this.hpFill.alpha = 1;
        }

        // Text
        this.hpText.setText(shield > 0 ? `${Math.ceil(hp)}+${Math.ceil(shield)}` : String(Math.ceil(hp)));
    }

    drawXP(xp, lvl) {
        const xpReq = GameConfig.getXPRequired(lvl);
        const pct = Math.min(xp / xpReq, 1);

        this.lvlText.setText(String(lvl));

        // XP ring
        this.xpRing.clear();
        if (pct > 0) {
            const { x, y, r } = this.lvlBadge;
            const start = -Math.PI / 2;
            const end = start + Math.PI * 2 * pct;
            this.xpRing.lineStyle(3, 0x8b5cf6, 0.9);
            this.xpRing.beginPath();
            this.xpRing.arc(x, y, r, start, end);
            this.xpRing.strokePath();
        }

        this.xpText.setText(`${Math.floor(pct * 100)}%`);
    }

    updateQuickStats() {
        const elapsed = Date.now() - this.playerStats.startTime;
        const m = Math.floor(elapsed / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);

        this.killsText.setText(String(this.playerStats.kills));
        this.timeText.setText(`${m}:${String(s).padStart(2, '0')}`);
        this.deathsText.setText(String(this.playerStats.deaths));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    updateUsername(name) { if (this.usernameText) this.usernameText.setText(name); }

    updateCurrency(amt) {
        if (this.currencyText) this.currencyText.setText(String(amt));
    }

    addCurrency(amt) {
        this.player.currency = (this.player.currency || 0) + amt;
        this.updateCurrency(this.player.currency);
    }

    getCurrency() { return this.player.currency || 0; }

    addKill() { this.playerStats.kills++; }
    addDeath() { this.playerStats.deaths++; }
    addDamageDealt(amt) { this.playerStats.damageDealt += amt; }
    addDamageTaken(amt) { this.playerStats.damageTaken += amt; }

    // Skills
    addSkillToDisplay(id, name) {
        this.skillsContainer.setVisible(true);
        const yOff = this.skillTexts.length * 24 + 10;
        const txt = this.scene.add.text(10, yOff, `◆ ${name}`, {
            fontFamily: 'Arial', fontSize: '11px', fill: '#c084fc'
        });
        this.skillTexts.push({ text: txt, id });
        this.skillsContainer.add(txt);
        this.updateSkillsBg();
    }

    clearAllSkills() {
        this.skillTexts.forEach(s => s.text?.destroy());
        this.skillTexts = [];
        this.skillsContainer.setVisible(false);
        this.skillsBg.clear();
    }

    updateSkillsBg() {
        this.skillsBg.clear();
        if (!this.skillTexts.length) return;
        const h = this.skillTexts.length * 24 + 16;
        this.skillsBg.fillStyle(0x111111, 0.85);
        this.skillsBg.fillRoundedRect(0, 0, 140, h, 8);
    }

    // Responsive
    repositionUI() {
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;
        const barW = Math.min(500, w - 40);
        this.bottomBar?.setPosition((w - barW) / 2, h - 64 - 57);
    }

    // Cleanup
    destroy() {
        // Clean up keyboard keys
        this.keys.forEach(key => {
            if (key && typeof key.removeAllListeners === 'function') {
                key.removeAllListeners();
            }
        });
        this.keys = [];

        if (this.lowHealthTween) this.lowHealthTween.stop();
        this.bottomBar?.destroy();
        this.topBar?.destroy();
        this.menuBtn?.destroy();
        this.menuElements.forEach(e => e?.destroy?.());
        this.skillsContainer?.destroy();
    }

    // Legacy compat
    get infoHubExpanded() { return this.menuOpen; }
    set infoHubExpanded(v) { this.menuOpen = v; }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernHUD;
}