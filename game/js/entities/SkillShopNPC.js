// Skill Shop NPC - Sells passive skills
class SkillShopNPC {
    constructor(scene, x, y, name = 'Skill Trader') {
        this.scene = scene;
        this.name = name;
        this.x = x;
        this.y = y;
        this.interactionRange = 80; // pixels
        this.isShopOpen = false;

        // Controller selection
        this.selectedSkillIndex = 0;
        this.skillHighlights = []; // Store highlight rectangles

        // All available skills for purchase
        this.allSkills = [
            {
                id: 'orbital_shield',
                name: "Chad's Shield",
                description: 'A protective shield orbits around you, dealing 10 damage on contact',
                cost: 75
            },
            {
                id: 'fireball_rain',
                name: "Meteor Storm",
                description: 'Fireballs rain from the sky, hitting random enemies within 400 pixels every 2 seconds for 15 damage',
                cost: 115
            },
            {
                id: 'damage_aura',
                name: "Burning Aura",
                description: 'A fiery aura surrounds you, dealing 5 damage per second to all enemies within 150 pixels',
                cost: 85
            },
            {
                id: 'piercing_fireball',
                name: "Piercing Inferno",
                description: 'Shoots a fireball at a random nearby enemy every 3 seconds. Pierces through up to 3 enemies for 12 damage each',
                cost: 100
            }
        ];

        // Currently displayed skills (3 random)
        this.currentSkills = [];

        this.createSprite();
        this.createPrompt();
        this.createShopUI();

        // Randomize initial skills
        this.refreshSkills();

        // Set up rotation timer (60 seconds)
        this.setupRotationTimer();
    }

    createSprite() {
        // Create animated sprite from frames
        this.sprite = this.scene.add.sprite(this.x, this.y, 'skillmerchant_1');
        this.sprite.setDepth(this.y); // Y-based depth so NPCs render under roofs
        this.sprite.setScale(1); // 32x32 sprite

        // Create animation if it doesn't exist
        if (!this.scene.anims.exists('skillmerchant_idle')) {
            this.scene.anims.create({
                key: 'skillmerchant_idle',
                frames: [
                    { key: 'skillmerchant_1' },
                    { key: 'skillmerchant_2' },
                    { key: 'skillmerchant_3' },
                    { key: 'skillmerchant_4' }
                ],
                frameRate: 4,
                repeat: -1
            });
        }

        // Play animation
        this.sprite.play('skillmerchant_idle');

        // Name label
        this.nameLabel = this.scene.add.text(
            this.x, this.y - 35,
            this.name,
            {
                font: 'bold 14px monospace',
                fill: '#aa66ff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        this.nameLabel.setDepth(6);

        // Floating animation
        this.scene.tweens.add({
            targets: [this.sprite, this.nameLabel],
            y: this.y - 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createPrompt() {
        // Interaction prompt (hidden by default)
        this.prompt = this.scene.add.container(this.x, this.y - 60);
        this.prompt.setDepth(1000);
        this.prompt.setScrollFactor(1, 1);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 180, 30, 0x000000, 0.8);
        bg.setStrokeStyle(2, 0x9933ff);

        // Text (store reference for updating)
        this.promptText = this.scene.add.text(0, 0, 'Press F to Buy Skills', {
            font: 'bold 12px monospace',
            fill: '#aa66ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.prompt.add([bg, this.promptText]);
        this.prompt.setVisible(false);
    }

    createShopUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Shop container
        this.shopContainer = this.scene.add.container(width / 2, height / 2);
        this.shopContainer.setScrollFactor(0);
        this.shopContainer.setDepth(100000);
        this.shopContainer.setVisible(false);

        // Background for 3 skills
        const bg = this.scene.add.rectangle(0, 0, 600, 450, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(3, 0x9933ff);

        // Title
        const title = this.scene.add.text(0, -200, 'SKILL SHOP', {
            font: 'bold 24px monospace',
            fill: '#aa66ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Instructions
        const instructions = this.scene.add.text(0, -165, 'Press number key to purchase', {
            font: '12px monospace',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Timer display
        this.timerText = this.scene.add.text(0, -140, 'Refreshes in: 60s', {
            font: 'bold 14px monospace',
            fill: '#66ccff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Close hint (store reference for updating)
        this.closeHintText = this.scene.add.text(0, 205, 'Press F or ESC to close', {
            font: '12px monospace',
            fill: '#666666',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.shopContainer.add([bg, title, instructions, this.timerText, this.closeHintText]);

        // Container for skill cards (will be refreshed)
        this.cardsContainer = this.scene.add.container(0, 0);
        this.shopContainer.add(this.cardsContainer);
    }

    createSkillCards() {
        // Clear existing cards
        this.cardsContainer.removeAll(true);

        // Clear existing highlights
        this.skillHighlights = [];

        const startY = -80;
        const cardHeight = 90;
        const cardSpacing = 12;

        this.currentSkills.forEach((skill, index) => {
            const y = startY + (index * (cardHeight + cardSpacing));

            // Card background with gradient effect
            const cardBg = this.scene.add.rectangle(0, y, 520, cardHeight, 0x2a2a3e, 1);
            cardBg.setStrokeStyle(2, 0x9933ff);

            // Controller selection highlight (hidden by default)
            const highlight = this.scene.add.rectangle(0, y, 530, cardHeight + 4, 0x000000, 0);
            highlight.setStrokeStyle(4, 0xffff00);
            highlight.setVisible(false);
            this.skillHighlights.push(highlight);

            // Skill name
            const nameText = this.scene.add.text(-240, y - 28, skill.name, {
                font: 'bold 16px monospace',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // Description with word wrap
            const descText = this.scene.add.text(-240, y - 3, skill.description, {
                font: '12px monospace',
                fill: '#cccccc',
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: { width: 380, useAdvancedWrap: true }
            }).setOrigin(0, 0.5);

            // Cost (with soul sprite icon)
            const soulIcon = this.scene.add.sprite(-240, y + 26, 'souls', 0);
            soulIcon.setScale(0.5); // Scale down the 32x32 sprite
            soulIcon.setOrigin(0, 0.5);

            const costText = this.scene.add.text(-220, y + 26, `Cost: ${skill.cost}`, {
                font: 'bold 14px monospace',
                fill: '#9d00ff', // Purple color for souls
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // Key bind indicator with background
            const keyBg = this.scene.add.rectangle(225, y, 50, 50, 0x1a1a2e, 1);
            keyBg.setStrokeStyle(3, 0xaa66ff);

            const keyText = this.scene.add.text(225, y, `[${skill.keyBind}]`, {
                font: 'bold 22px monospace',
                fill: '#aa66ff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.cardsContainer.add([highlight, cardBg, nameText, descText, soulIcon, costText, keyBg, keyText]);
        });
    }

    checkPlayerDistance(playerX, playerY) {
        const dist = Phaser.Math.Distance.Between(
            playerX, playerY,
            this.x, this.y
        );

        const isInRange = dist < this.interactionRange;
        this.prompt.setVisible(isInRange && !this.isShopOpen);

        return isInRange;
    }

    openShop() {
        this.isShopOpen = true;
        this.shopContainer.setVisible(true);
        this.prompt.setVisible(false);

        // Reset controller selection to first item
        this.selectedSkillIndex = 0;
        this.updateHighlight();

        console.log('🛍️ Skill shop opened');
    }

    closeShop() {
        this.isShopOpen = false;
        this.shopContainer.setVisible(false);

        // Hide all highlights
        this.skillHighlights.forEach(h => h.setVisible(false));

        console.log('🛍️ Skill shop closed');
    }

    toggleShop() {
        if (this.isShopOpen) {
            this.closeShop();
        } else {
            this.openShop();
        }
    }

    refreshSkills() {
        // Shuffle and pick 3 random skills
        const shuffled = [...this.allSkills].sort(() => Math.random() - 0.5);
        this.currentSkills = shuffled.slice(0, 3);

        // Assign key bindings 1, 2, 3
        this.currentSkills.forEach((skill, index) => {
            skill.keyBind = String(index + 1);
        });

        // Recreate the skill cards
        this.createSkillCards();
    }

    setupRotationTimer() {
        // Reset countdown
        this.timeUntilRefresh = 60;

        // Update timer display every second
        if (this.timerEvent) {
            this.timerEvent.remove();
        }

        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeUntilRefresh--;

                if (this.timerText) {
                    this.timerText.setText(`Refreshes in: ${this.timeUntilRefresh}s`);
                }

                if (this.timeUntilRefresh <= 0) {
                    this.refreshSkills();
                    this.timeUntilRefresh = 60;
                }
            },
            loop: true
        });
    }

    tryPurchaseSkill(keyPressed) {
        if (!this.isShopOpen) return;

        const skill = this.currentSkills.find(s => s.keyBind === keyPressed);
        if (!skill) return;

        // Check if player already has this skill
        if (this.scene.passiveSkills && this.scene.passiveSkills.hasSkill(skill.id)) {
            console.log('⚠️ Already own this skill!');
            this.showFeedback('Already Owned!', '#ff6666');
            return;
        }

        // Check if player has enough currency
        const currentCurrency = this.scene.modernHUD ? this.scene.modernHUD.getCurrency() : 0;
        if (currentCurrency < skill.cost) {
            console.log('⚠️ Not enough souls!');
            this.showFeedback('Not Enough Souls!', '#ff6666');
            return;
        }

        // Purchase successful!
        if (this.scene.modernHUD) {
            this.scene.modernHUD.addCurrency(-skill.cost);
        }

        // Activate skill locally
        if (this.scene.passiveSkills) {
            this.scene.passiveSkills.addSkill(skill.id);
        }

        // Broadcast skill purchase to server (for multiplayer sync)
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('passiveSkill:purchased', {
                skillId: skill.id,
                playerId: window.networkManager.currentPlayer.id
            });
            console.log(`📡 Broadcasting passive skill purchase: ${skill.id}`);
        }

        console.log(`✅ Purchased skill: ${skill.name}`);
        this.showFeedback('Skill Purchased!', '#00ff00');
    }

    showFeedback(text, color) {
        const feedbackText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            text,
            {
                font: 'bold 20px monospace',
                fill: color,
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        feedbackText.setScrollFactor(0);
        feedbackText.setDepth(100001);

        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });
    }

    // Controller navigation methods
    moveSelectionUp() {
        if (!this.isShopOpen) return;
        this.selectedSkillIndex = (this.selectedSkillIndex - 1 + this.currentSkills.length) % this.currentSkills.length;
        this.updateHighlight();
        console.log(`🎮 Skill Shop: Selected skill ${this.selectedSkillIndex + 1}`);
    }

    moveSelectionDown() {
        if (!this.isShopOpen) return;
        this.selectedSkillIndex = (this.selectedSkillIndex + 1) % this.currentSkills.length;
        this.updateHighlight();
        console.log(`🎮 Skill Shop: Selected skill ${this.selectedSkillIndex + 1}`);
    }

    updateHighlight() {
        // Hide all highlights
        this.skillHighlights.forEach((h, i) => {
            h.setVisible(i === this.selectedSkillIndex);
        });
    }

    setInputMode(mode) {
        // Update prompt texts based on input mode
        const interactButton = mode === 'controller' ? 'A' : 'F';
        const closeButton = mode === 'controller' ? 'Start' : 'ESC';

        if (this.promptText) {
            this.promptText.setText(`Press ${interactButton} to Buy Skills`);
        }
        if (this.closeHintText) {
            this.closeHintText.setText(`Press ${interactButton} or ${closeButton} to close`);
        }
    }

    destroy() {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }
        if (this.sprite) this.sprite.destroy();
        if (this.nameLabel) this.nameLabel.destroy();
        if (this.prompt) this.prompt.destroy();
        if (this.shopContainer) this.shopContainer.destroy();
    }
}
