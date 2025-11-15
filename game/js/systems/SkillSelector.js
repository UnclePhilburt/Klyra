// SkillSelector - Roguelike skill selection system on level up
class SkillSelector {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.selectedSkills = []; // Skills the player has chosen

        // UI elements
        this.cards = [];
        this.selectedIndex = 1; // Start with middle card selected
        this.keyboardControls = null;
        this.instructionText = null;

        // Initialize player multipliers
        this.initializePlayerMultipliers();
    }

    initializePlayerMultipliers() {
        const player = this.scene.localPlayer;
        if (!player) return;

        // Minion multipliers
        if (!player.minionHealthMultiplier) player.minionHealthMultiplier = 1;
        if (!player.minionDamageMultiplier) player.minionDamageMultiplier = 1;
        if (!player.minionSpeedMultiplier) player.minionSpeedMultiplier = 1;
        if (!player.minionAttackSpeedMultiplier) player.minionAttackSpeedMultiplier = 1;
        if (!player.minionAllStatsMultiplier) player.minionAllStatsMultiplier = 1;
        if (!player.minionSizeMultiplier) player.minionSizeMultiplier = 1;
        if (!player.minionDefenseMultiplier) player.minionDefenseMultiplier = 1;
        if (!player.minionArmor) player.minionArmor = 0;

        // Minion special stats
        if (!player.minionLifesteal) player.minionLifesteal = 0;
        if (!player.minionRegen) player.minionRegen = 0;
        if (!player.minionKnockback) player.minionKnockback = false;
        if (!player.minionStun) player.minionStun = 0;
        if (!player.minionCleave) player.minionCleave = false;
        if (!player.minionUnstoppable) player.minionUnstoppable = false;
        if (!player.minionCritChance) player.minionCritChance = 0;
        if (!player.minionCritDamage) player.minionCritDamage = 2.0;

        // Player multipliers
        if (!player.damageMultiplier) player.damageMultiplier = 1;
        if (!player.xpMultiplier) player.xpMultiplier = 1;

        // Player special stats
        if (!player.healPerKill) player.healPerKill = 0;
        if (!player.healOnKillPercent) player.healOnKillPercent = 0;
        if (!player.regenPerMinion) player.regenPerMinion = 0;
        if (!player.packDamageBonus) player.packDamageBonus = 0;
        if (!player.groupedDefense) player.groupedDefense = 0;
        if (!player.coordinatedDamage) player.coordinatedDamage = 0;
        if (!player.perMinionBonus) player.perMinionBonus = 0;
        if (!player.maxMinionBonus) player.maxMinionBonus = 2.0;

        // Special effects
        if (!player.berserkerDamage) player.berserkerDamage = 0;
        if (!player.berserkerThreshold) player.berserkerThreshold = 0.4;
        if (!player.executeThreshold) player.executeThreshold = 0;
        if (!player.executeDamage) player.executeDamage = 2.0;
        if (!player.bossDamage) player.bossDamage = 1.0;
        if (!player.armorPen) player.armorPen = 0;
        if (!player.chainAttack) player.chainAttack = null;
        if (!player.splashDamage) player.splashDamage = null;
        if (!player.dualWield) player.dualWield = false;
        if (!player.attacksPerStrike) player.attacksPerStrike = 1;
        if (!player.commandAura) player.commandAura = null;
        if (!player.flankDamage) player.flankDamage = 1.0;
        if (!player.killDamageStack) player.killDamageStack = 0;
        if (!player.maxKillStacks) player.maxKillStacks = 20;
        if (!player.currentKillStacks) player.currentKillStacks = 0;
        if (!player.reapersMarkThreshold) player.reapersMarkThreshold = 0;
        if (!player.reapersMarkDamage) player.reapersMarkDamage = 1.0;

        // God-tier effects
        if (!player.minionCap) player.minionCap = 20;
        if (!player.legionBuffMultiplier) player.legionBuffMultiplier = 1.0;
        if (!player.instantRevive) player.instantRevive = false;
        if (!player.shockwaveRadius) player.shockwaveRadius = 0;
        if (!player.deathAura) player.deathAura = null;
        if (!player.deathImmunity) player.deathImmunity = false;
    }

    // Get all current multipliers to send to server
    getAllMultipliers() {
        const player = this.scene.localPlayer;
        if (!player) return {};

        return {
            minionHealthMultiplier: player.minionHealthMultiplier,
            minionDamageMultiplier: player.minionDamageMultiplier,
            minionSpeedMultiplier: player.minionSpeedMultiplier,
            minionAttackSpeedMultiplier: player.minionAttackSpeedMultiplier,
            minionAllStatsMultiplier: player.minionAllStatsMultiplier,
            minionSizeMultiplier: player.minionSizeMultiplier,
            minionDefenseMultiplier: player.minionDefenseMultiplier,
            minionArmor: player.minionArmor,
            minionLifesteal: player.minionLifesteal,
            minionRegen: player.minionRegen,
            minionKnockback: player.minionKnockback,
            minionStun: player.minionStun,
            minionCleave: player.minionCleave,
            minionUnstoppable: player.minionUnstoppable,
            minionCritChance: player.minionCritChance,
            minionCritDamage: player.minionCritDamage,
            damageMultiplier: player.damageMultiplier,
            xpMultiplier: player.xpMultiplier,
            healPerKill: player.healPerKill,
            healOnKillPercent: player.healOnKillPercent,
            regenPerMinion: player.regenPerMinion,
            packDamageBonus: player.packDamageBonus,
            groupedDefense: player.groupedDefense,
            coordinatedDamage: player.coordinatedDamage,
            perMinionBonus: player.perMinionBonus,
            maxMinionBonus: player.maxMinionBonus,
            berserkerDamage: player.berserkerDamage,
            berserkerThreshold: player.berserkerThreshold,
            executeThreshold: player.executeThreshold,
            executeDamage: player.executeDamage,
            bossDamage: player.bossDamage,
            armorPen: player.armorPen,
            chainAttack: player.chainAttack,
            splashDamage: player.splashDamage,
            dualWield: player.dualWield,
            attacksPerStrike: player.attacksPerStrike,
            commandAura: player.commandAura,
            flankDamage: player.flankDamage,
            killDamageStack: player.killDamageStack,
            maxKillStacks: player.maxKillStacks,
            currentKillStacks: player.currentKillStacks,
            reapersMarkThreshold: player.reapersMarkThreshold,
            reapersMarkDamage: player.reapersMarkDamage,
            minionCap: player.minionCap,
            legionBuffMultiplier: player.legionBuffMultiplier,
            instantRevive: player.instantRevive,
            shockwaveRadius: player.shockwaveRadius,
            deathAura: player.deathAura,
            deathImmunity: player.deathImmunity
        };
    }

    show(playerClass, currentLevel) {
        if (this.isActive) return;
        this.isActive = true;

        console.log(`\n======= SKILL SELECTOR SHOW CALLED =======`);
        console.log(`📊 Player Class: "${playerClass}"`);
        console.log(`📊 Current Level: ${currentLevel}`);
        console.log(`📊 Selected Skills:`, this.selectedSkills.map(s => `${s.id} (${s.name})`));

        // DON'T pause the game - let gameplay continue!

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Get available skills for this class and level
        const availableSkills = this.getAvailableSkills(playerClass, currentLevel);
        console.log(`📊 Available Skills Found: ${availableSkills.length}`);

        // If no skills available for this level, don't show selector
        if (!availableSkills || availableSkills.length === 0) {
            console.log(`⏭️ No skills available for level ${currentLevel} - skipping skill selector`);
            this.isActive = false;
            return;
        }

        // Show ALL available skills
        const skillChoices = availableSkills;
        console.log(`📊 Showing Skills:`, skillChoices.map(s => s.name));

        // Dark overlay (subtle)
        this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
        this.overlay.setScrollFactor(0);
        this.overlay.setDepth(99999);

        // Compact centered panel
        const panelWidth = Math.min(900, width - 100);
        const panelHeight = Math.min(500, height - 100);

        this.panel = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x0a0a0f, 0.95);
        this.panel.setStrokeStyle(2, 0x8b5cf6, 0.6);
        this.panel.setScrollFactor(0);
        this.panel.setDepth(100000);

        // Title
        this.titleText = this.scene.add.text(width / 2, height / 2 - panelHeight / 2 + 40, 'LEVEL UP!', {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '24px',
            fontStyle: '700',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100001);
        this.titleText.setShadow(0, 0, 10, '#8b5cf6', false, true);

        // Instructions
        const keyText = skillChoices.length === 2 ? '[1] [2]' : skillChoices.length === 3 ? '[1] [2] [3]' : '[1-4]';
        this.instructionText = this.scene.add.text(width / 2, height / 2 - panelHeight / 2 + 75, `Press ${keyText} to select`, {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '13px',
            fontStyle: '400',
            fill: '#a1a1aa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100001);

        // Set initial selection
        this.selectedIndex = 0;

        // Create compact horizontal skill cards
        this.cards = [];
        const cardWidth = Math.min(200, (panelWidth - 60) / skillChoices.length - 15);
        const cardHeight = panelHeight - 180;
        const totalWidth = skillChoices.length * cardWidth + (skillChoices.length - 1) * 15;
        const startX = width / 2 - totalWidth / 2 + cardWidth / 2;
        const cardY = height / 2 + 20;

        skillChoices.forEach((skill, index) => {
            const x = startX + index * (cardWidth + 15);
            const card = this.createCompactCard(skill, x, cardY, cardWidth, cardHeight, index);
            this.cards.push(card);
        });

        // Setup keyboard controls
        this.setupKeyboardControls();

        // Highlight the initially selected card
        this.updateCardSelection();
    }

    createCompactCard(skill, x, y, width, height, index) {
        const card = {
            skill: skill,
            elements: [],
            index: index,
            baseY: y,
            baseX: x
        };

        // Card background
        const bg = this.scene.add.rectangle(x, y, width, height, 0x1a1a2e, 0.9);
        bg.setStrokeStyle(2, 0x52525b, 0.5);
        bg.setScrollFactor(0);
        bg.setDepth(100001);
        card.elements.push(bg);
        card.background = bg;

        // Number indicator
        const numberBadge = this.scene.add.circle(x - width / 2 + 20, y - height / 2 + 20, 14, 0x8b5cf6, 0.3);
        numberBadge.setStrokeStyle(2, 0x8b5cf6, 0.8);
        numberBadge.setScrollFactor(0);
        numberBadge.setDepth(100002);
        card.elements.push(numberBadge);

        const numberText = this.scene.add.text(x - width / 2 + 20, y - height / 2 + 20, (index + 1).toString(), {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '12px',
            fontStyle: '700',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100003);
        card.elements.push(numberText);

        // Skill name
        const name = this.scene.add.text(x, y - height / 2 + 55, skill.name, {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '15px',
            fontStyle: '700',
            fill: '#ffffff',
            wordWrap: { width: width - 20 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100002);
        card.elements.push(name);

        // Generate compact description
        let compactDesc = this.generateCompactDescription(skill);

        // Description
        const desc = this.scene.add.text(x, y - height / 2 + 95, compactDesc, {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '11px',
            fontStyle: '400',
            fill: '#a1a1aa',
            wordWrap: { width: width - 25 },
            align: 'left',
            lineSpacing: 3
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100002);
        card.elements.push(desc);

        return card;
    }

    generateCompactDescription(skill) {
        let details = [];

        if (skill.description) {
            details.push(skill.description);
            details.push('');
        }

        if (skill.subtitle) {
            details.push(skill.subtitle);
            details.push('');
        }

        if (skill.stats) {
            if (skill.stats.playerDamage !== undefined) {
                details.push(`⚔️ ${skill.stats.playerDamage} DMG`);
            }
            if (skill.stats.startingMinions !== undefined) {
                details.push(`👥 ${skill.stats.startingMinions}/${skill.stats.minionCap} Minions`);
            }
            if (skill.stats.minionDamage !== undefined) {
                details.push(`🗡️ ${skill.stats.minionDamage} Minion DMG`);
            }
        }

        if (skill.abilities) {
            details.push('');
            if (skill.abilities.q) details.push(`Q: ${skill.abilities.q.name}`);
            if (skill.abilities.e) details.push(`E: ${skill.abilities.e.name}`);
            if (skill.abilities.r) details.push(`R: ${skill.abilities.r.name}`);
        }

        return details.join('\n');
    }

    generateDetailedDescription(skill) {
        let details = [];

        // Basic description
        if (skill.description) {
            details.push(skill.description);
            details.push(''); // Empty line
        }

        // Subtitle (for paths)
        if (skill.subtitle) {
            details.push(`${skill.subtitle}`);
            details.push(''); // Empty line
        }

        // Stats (for path selection)
        if (skill.stats) {
            details.push('STATS:');
            if (skill.stats.playerDamage !== undefined) {
                details.push(`• Player Damage: ${skill.stats.playerDamage}`);
            }
            if (skill.stats.startingMinions !== undefined) {
                details.push(`• Starting Minions: ${skill.stats.startingMinions}`);
            }
            if (skill.stats.minionCap !== undefined) {
                details.push(`• Max Minions: ${skill.stats.minionCap}`);
            }
            if (skill.stats.minionHealth !== undefined) {
                details.push(`• Minion HP: ${skill.stats.minionHealth}`);
            }
            if (skill.stats.minionDamage !== undefined) {
                details.push(`• Minion Damage: ${skill.stats.minionDamage}`);
            }
            details.push(''); // Empty line
        }

        // Auto-attack (for paths)
        if (skill.autoAttack) {
            details.push(`AUTO: ${skill.autoAttack.name}`);
            details.push(`${skill.autoAttack.description}`);
            details.push(''); // Empty line
        }

        // Abilities (for paths)
        if (skill.abilities) {
            details.push('ABILITIES:');
            if (skill.abilities.q) {
                details.push(`Q - ${skill.abilities.q.name}`);
                details.push(`  ${skill.abilities.q.description}`);
            }
            if (skill.abilities.e) {
                details.push(`E - ${skill.abilities.e.name}`);
                details.push(`  ${skill.abilities.e.description}`);
            }
            if (skill.abilities.r) {
                details.push(`R - ${skill.abilities.r.name}`);
                details.push(`  ${skill.abilities.r.description}`);
            }
            details.push(''); // Empty line
        }

        // Modifications (for specializations)
        if (skill.modifications) {
            details.push('MODIFICATIONS:');
            const mods = skill.modifications;

            if (mods.minionCap !== undefined) {
                details.push(`• Minion Cap: ${mods.minionCap}`);
            }
            if (mods.minionHealth !== undefined) {
                details.push(`• Minion HP: x${mods.minionHealth}`);
            }
            if (mods.minionDamage !== undefined) {
                details.push(`• Minion Damage: x${mods.minionDamage}`);
            }

            // Ability modifications
            if (mods.q && mods.q.bonusEffect) {
                details.push(`Q Bonus:`);
                Object.entries(mods.q.bonusEffect).forEach(([key, value]) => {
                    details.push(`  • ${key}: ${value}`);
                });
            }
            if (mods.e && mods.e.bonusEffect) {
                details.push(`E Bonus:`);
                Object.entries(mods.e.bonusEffect).forEach(([key, value]) => {
                    details.push(`  • ${key}: ${value}`);
                });
            }
            if (mods.r && mods.r.bonusEffect) {
                details.push(`R Bonus:`);
                Object.entries(mods.r.bonusEffect).forEach(([key, value]) => {
                    details.push(`  • ${key}: ${value}`);
                });
            }

            if (mods.autoAttack) {
                details.push(`Auto-Attack:`);
                Object.entries(mods.autoAttack).forEach(([key, value]) => {
                    details.push(`  • ${key}: ${value}`);
                });
            }
        }

        // Endless upgrades (simple effects)
        if (skill.effect && typeof skill.effect === 'object') {
            details.push('EFFECT:');
            Object.entries(skill.effect).forEach(([key, value]) => {
                details.push(`• ${key}: ${value}`);
            });
        }

        return details.join('\n');
    }

    setupKeyboardControls() {
        // Create keyboard inputs for 1, 2, 3
        this.key1 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        // Listen for key presses - press once to highlight, press again to confirm
        this.key1.on('down', () => {
            if (this.isActive) {
                if (this.selectedIndex === 0) {
                    // Already selected, confirm it
                    this.confirmSelection();
                } else {
                    // Not selected, highlight it
                    this.selectCard(0);
                }
            }
        });

        this.key2.on('down', () => {
            if (this.isActive) {
                if (this.selectedIndex === 1) {
                    // Already selected, confirm it
                    this.confirmSelection();
                } else {
                    // Not selected, highlight it
                    this.selectCard(1);
                }
            }
        });

        this.key3.on('down', () => {
            if (this.isActive) {
                if (this.selectedIndex === 2) {
                    // Already selected, confirm it
                    this.confirmSelection();
                } else {
                    // Not selected, highlight it
                    this.selectCard(2);
                }
            }
        });
    }

    selectCard(index) {
        // Directly select a card by index
        if (index >= 0 && index < this.cards.length) {
            this.selectedIndex = index;
            // Update visuals
            this.updateCardSelection();
        }
    }

    updateCardSelection() {
        // Update all cards with subtle highlight
        this.cards.forEach((card, index) => {
            const isSelected = index === this.selectedIndex;

            if (isSelected) {
                // Selected: bright border and slight scale
                card.background.setStrokeStyle(3, 0xec4899, 1.0);
                card.background.setFillStyle(0x1a1a2e, 1.0);

                this.scene.tweens.add({
                    targets: card.background,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 150,
                    ease: 'Back.easeOut'
                });

            } else {
                // Unselected: subtle gray border
                card.background.setStrokeStyle(2, 0x52525b, 0.5);
                card.background.setFillStyle(0x1a1a2e, 0.9);

                this.scene.tweens.add({
                    targets: card.background,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 150,
                    ease: 'Cubic.easeOut'
                });
            }
        });
    }

    confirmSelection() {
        const selectedCard = this.cards[this.selectedIndex];
        if (selectedCard) {
            this.selectSkill(selectedCard.skill);
        }
    }

    selectSkill(skill) {
        console.log(`✨ Selected skill: ${skill.name}`);

        // Add to player's skills
        this.selectedSkills.push(skill);

        // Apply skill effect
        this.applySkill(skill);

        // Sync to server
        const multipliers = this.getAllMultipliers();
        networkManager.selectSkill(skill, multipliers);

        // Hide UI
        this.hide();

        // Game already running - no need to resume!
    }

    applySkill(skill) {
        const player = this.scene.localPlayer;
        if (!player) return;

        console.log(`🔮 Applying skill: ${skill.id} (${skill.name})`);

        // Initialize visual effects manager if needed
        if (!this.scene.visualEffectsManager) {
            this.scene.visualEffectsManager = new VisualEffectsManager(this.scene, player);
        }

        // Initialize passive ability manager if needed
        if (!this.scene.passiveAbilityManager) {
            this.scene.passiveAbilityManager = new PassiveAbilityManager(this.scene, player);
        }

        // ==== NEW SKILL TREE V2 SYSTEM ====
        // Handle path selection (tier 1) - sets up initial stats and abilities
        if (skill.stats) {
            console.log(`🎯 Applying initial path stats for ${skill.name}`);

            // Apply base stats
            if (skill.stats.playerDamage !== undefined) {
                player.baseDamage = skill.stats.playerDamage;
                console.log(`  ⚔️ Player damage: ${skill.stats.playerDamage}`);
            }

            // Initialize multipliers if not already set
            if (!player.minionHealthMultiplier) player.minionHealthMultiplier = 1;
            if (!player.minionDamageMultiplier) player.minionDamageMultiplier = 1;

            if (skill.stats.minionHealth !== undefined) {
                player.baseMinionHealth = skill.stats.minionHealth;
                console.log(`  💚 Base minion health: ${skill.stats.minionHealth}`);
            }
            if (skill.stats.minionDamage !== undefined) {
                player.baseMinionDamage = skill.stats.minionDamage;
                console.log(`  ⚔️ Base minion damage: ${skill.stats.minionDamage}`);
            }

            // Remove ALL existing minions before setting up new path
            const existingMinions = Object.values(this.scene.minions).filter(m => m.ownerId === player.data.id);
            if (existingMinions.length > 0) {
                console.log(`  🗑️ Removing ${existingMinions.length} existing minions for path reset`);
                existingMinions.forEach(minion => {
                    if (minion.minionId) {
                        networkManager.trackPermanentMinion(minion.minionId, 'remove');
                    }
                    minion.health = 0; // Will be cleaned up by death logic
                });
            }

            if (skill.stats.minionCap !== undefined) {
                player.minionCap = skill.stats.minionCap;
                console.log(`  👥 Minion cap: ${skill.stats.minionCap}`);
            }

            // Only spawn starting minions if this is a NEW path selection (not already selected)
            // Count how many times this skill has been selected (current selection is already in array)
            const selectionCount = this.selectedSkills.filter(s => s.id === skill.id).length;
            const isFirstTimeSelecting = selectionCount === 1; // First time if count is exactly 1

            console.log(`  🔍 Minion spawn check:`);
            console.log(`    - startingMinions: ${skill.stats.startingMinions}`);
            console.log(`    - selectionCount: ${selectionCount}`);
            console.log(`    - isFirstTimeSelecting: ${isFirstTimeSelecting}`);
            console.log(`    - player sprite exists: ${!!player.sprite}`);

            if (skill.stats.startingMinions !== undefined && isFirstTimeSelecting) {
                console.log(`  🔮 First time selecting ${skill.name} - Spawning ${skill.stats.startingMinions} starting minions`);

                // Spawn all minions first WITHOUT calling updateMinionFormations each time
                const spawnedMinions = [];
                for (let i = 0; i < skill.stats.startingMinions; i++) {
                    const angle = (Math.PI * 2 * i) / skill.stats.startingMinions;
                    const distance = 100;
                    const spawnX = player.sprite.x + Math.cos(angle) * distance;
                    const spawnY = player.sprite.y + Math.sin(angle) * distance;

                    // Temporarily disable formation updates during batch spawn
                    const minion = this.scene.spawnMinion(spawnX, spawnY, player.data.id, true, null, true);
                    if (minion && minion.minionId) {
                        networkManager.trackPermanentMinion(minion.minionId, 'add');
                        spawnedMinions.push(minion);
                    }
                }

                // Now update formations ONCE for all minions
                console.log(`  ✅ All ${spawnedMinions.length} minions spawned, assigning formations...`);
                this.scene.updateMinionFormations(player.data.id);
            } else if (skill.stats.startingMinions !== undefined && !isFirstTimeSelecting) {
                console.log(`  ⏭️ Already selected ${skill.name} ${selectionCount} times - skipping minion spawn`);
            }
        }

        // Store auto-attack configuration
        if (skill.autoAttack) {
            player.autoAttackConfig = skill.autoAttack;
            console.log(`  🎯 Auto-attack: ${skill.autoAttack.name}`);
            console.log(`  ✅ autoAttackConfig stored on player:`, player.autoAttackConfig);
        } else {
            console.log(`  ⚠️ No autoAttack property on skill`);
        }

        // Store Q/E/R abilities
        if (skill.abilities) {
            if (!player.abilities) player.abilities = {};
            if (skill.abilities.q) {
                player.abilities.q = skill.abilities.q;
                console.log(`  Q: ${skill.abilities.q.name}`);
            }
            if (skill.abilities.e) {
                player.abilities.e = skill.abilities.e;
                console.log(`  E: ${skill.abilities.e.name}`);
            }
            if (skill.abilities.r) {
                player.abilities.r = skill.abilities.r;
                console.log(`  R: ${skill.abilities.r.name}`);
            }

            // Initialize Malachar Ability Handler (for builds with Q/E/R)
            if (player.class === 'MALACHAR' && typeof MalacharAbilityHandler !== 'undefined') {
                // Store the full build data
                player.malacharBuild = skill;

                // Initialize the ability handler
                this.scene.malacharAbilityHandler = new MalacharAbilityHandler(
                    this.scene,
                    player,
                    skill
                );
                console.log(`  🔮 Initialized MalacharAbilityHandler for ${skill.name}`);
            }

            // Update ability UI immediately
            if (this.scene.abilityManager) {
                this.scene.abilityManager.updateCooldownUI();
            }
        }

        // Handle modifications (tier 2+)
        if (skill.modifications) {
            console.log(`🔧 Applying modifications for ${skill.name}`);
            const mods = skill.modifications;

            // Apply stat modifications
            if (mods.minionCap !== undefined) {
                const oldCap = player.minionCap;
                player.minionCap = mods.minionCap;
                console.log(`  👥 Modified minion cap: ${oldCap} → ${mods.minionCap}`);

                // If cap was reduced, remove excess minions
                if (mods.minionCap < oldCap) {
                    this.removeExcessMinions(player, mods.minionCap);
                }
            }
            if (mods.minionHealth !== undefined) {
                player.minionHealthMultiplier = (player.minionHealthMultiplier || 1) * mods.minionHealth;
                console.log(`  💚 Minion health multiplier: ${player.minionHealthMultiplier}x`);
                // Update existing minions with new stats
                this.applyMinionStatUpdates(player);
            }
            if (mods.minionDamage !== undefined) {
                player.minionDamageMultiplier = (player.minionDamageMultiplier || 1) * mods.minionDamage;
                console.log(`  ⚔️ Minion damage multiplier: ${player.minionDamageMultiplier}x`);
                // Update existing minions with new stats
                this.applyMinionStatUpdates(player);
            }

            // Merge ability modifications
            let abilitiesModified = false;
            if (mods.q && player.abilities && player.abilities.q) {
                player.abilities.q.bonusEffect = { ...player.abilities.q.bonusEffect, ...mods.q.bonusEffect };
                console.log(`  Q modified:`, mods.q.bonusEffect);
                abilitiesModified = true;
            }
            if (mods.e && player.abilities && player.abilities.e) {
                player.abilities.e.bonusEffect = { ...player.abilities.e.bonusEffect, ...mods.e.bonusEffect };
                console.log(`  E modified:`, mods.e.bonusEffect);
                abilitiesModified = true;
            }
            if (mods.r && player.abilities && player.abilities.r) {
                player.abilities.r.bonusEffect = { ...player.abilities.r.bonusEffect, ...mods.r.bonusEffect };
                console.log(`  R modified:`, mods.r.bonusEffect);
                abilitiesModified = true;
            }

            // Update ability UI if any abilities were modified
            if (abilitiesModified && this.scene.abilityManager) {
                this.scene.abilityManager.updateCooldownUI();
            }

            // Auto-attack modifications
            if (mods.autoAttack && player.autoAttackConfig) {
                player.autoAttackConfig = { ...player.autoAttackConfig, ...mods.autoAttack };
                console.log(`  Auto-attack modified`);
            }
        }

        // ==== OLD SKILL TREE SYSTEM (fallback) ====
        // Handle special case for spawn_minion effect (used throughout skill tree)
        if (skill.effect === 'spawn_minion') {
            const spawnX = player.sprite.x + 60;
            const spawnY = player.sprite.y;

            // Visual effect for summoning
            if (this.scene.visualEffectsManager) {
                this.scene.visualEffectsManager.createMinionSummonEffect(spawnX, spawnY);
            }

            // Spawn another permanent minion
            const minion = this.scene.spawnMinion(
                spawnX,
                spawnY,
                player.data.id,
                true // permanent
            );

            // Track permanent minion on server
            if (minion && minion.minionId) {
                networkManager.trackPermanentMinion(minion.minionId, 'add');
            }

            console.log(`👹 ${skill.name}: Summoned additional permanent minion!`);
            return;
        }

        // Handle complex effect objects
        if (typeof skill.effect === 'object') {
            const effect = skill.effect;

            // ==== MINION STAT MULTIPLIERS ====
            if (effect.minionHealth) {
                if (!player.minionHealthMultiplier) player.minionHealthMultiplier = 1;
                player.minionHealthMultiplier *= effect.minionHealth;
                // Update existing minions
                Object.values(this.scene.minions).forEach(minion => {
                    minion.maxHealth = Math.floor(minion.maxHealth * effect.minionHealth);
                    minion.health = Math.floor(minion.health * effect.minionHealth);
                });
                console.log(`💚 Minion health: ${player.minionHealthMultiplier}x`);
            }

            if (effect.minionDamage) {
                if (!player.minionDamageMultiplier) player.minionDamageMultiplier = 1;
                player.minionDamageMultiplier *= effect.minionDamage;
                Object.values(this.scene.minions).forEach(minion => {
                    minion.damage *= effect.minionDamage;
                });
                console.log(`⚔️ Minion damage: ${player.minionDamageMultiplier}x`);
            }

            if (effect.minionSpeed) {
                if (!player.minionSpeedMultiplier) player.minionSpeedMultiplier = 1;
                player.minionSpeedMultiplier *= effect.minionSpeed;
                console.log(`💨 Minion speed: ${player.minionSpeedMultiplier}x`);
            }

            if (effect.minionAttackSpeed) {
                if (!player.minionAttackSpeedMultiplier) player.minionAttackSpeedMultiplier = 1;
                player.minionAttackSpeedMultiplier *= effect.minionAttackSpeed;
                console.log(`⚡ Minion attack speed: ${player.minionAttackSpeedMultiplier}x`);
            }

            if (effect.minionAllStats) {
                if (!player.minionAllStatsMultiplier) player.minionAllStatsMultiplier = 1;
                player.minionAllStatsMultiplier *= effect.minionAllStats;
                // Apply to existing minions
                Object.values(this.scene.minions).forEach(minion => {
                    minion.damage *= effect.minionAllStats;
                    minion.maxHealth = Math.floor(minion.maxHealth * effect.minionAllStats);
                    minion.health = Math.floor(minion.health * effect.minionAllStats);
                });
                console.log(`⭐ Minion all stats: ${player.minionAllStatsMultiplier}x`);
            }

            if (effect.minionSize) {
                if (!player.minionSizeMultiplier) player.minionSizeMultiplier = 1;
                player.minionSizeMultiplier *= effect.minionSize;
                Object.values(this.scene.minions).forEach(minion => {
                    if (minion.sprite) {
                        minion.sprite.setScale(player.minionSizeMultiplier);
                    }
                });
                console.log(`📏 Minion size: ${player.minionSizeMultiplier}x`);
            }

            if (effect.minionDefense) {
                if (!player.minionDefenseMultiplier) player.minionDefenseMultiplier = 1;
                player.minionDefenseMultiplier *= effect.minionDefense;
                console.log(`🛡️ Minion defense: ${player.minionDefenseMultiplier}x`);
            }

            if (effect.minionArmor) {
                if (!player.minionArmor) player.minionArmor = 0;
                player.minionArmor += effect.minionArmor;
                console.log(`🛡️ Minion armor: +${player.minionArmor}`);
            }

            if (effect.minionLifesteal) {
                player.minionLifesteal = effect.minionLifesteal;
                console.log(`🩸 Minion lifesteal: ${(player.minionLifesteal * 100).toFixed(0)}%`);
            }

            if (effect.minionRegen) {
                player.minionRegen = effect.minionRegen;
                console.log(`💚 Minion regen: ${(player.minionRegen * 100).toFixed(0)}%/sec`);
            }

            // ==== MINION SPECIAL ABILITIES ====
            if (effect.minionKnockback) {
                player.minionKnockback = true;
                console.log(`💥 Minions knock back enemies`);
            }

            if (effect.minionStun) {
                player.minionStun = effect.minionStun;
                console.log(`💫 Minions can stun enemies`);
            }

            if (effect.cleave) {
                player.minionCleave = true;
                console.log(`🌊 Minions cleave in a cone`);
            }

            if (effect.berserkerDamage) {
                player.berserkerDamage = effect.berserkerDamage;
                player.berserkerThreshold = effect.berserkerThreshold || 0.4;
                console.log(`😡 Berserker rage when below ${(player.berserkerThreshold * 100).toFixed(0)}% HP`);
            }

            if (effect.unstoppable) {
                player.minionUnstoppable = true;
                console.log(`🚀 Minions are unstoppable`);
            }

            if (effect.executeThreshold) {
                player.executeThreshold = effect.executeThreshold;
                player.executeDamage = effect.executeDamage || 2.0;
                console.log(`⚔️ Execute enemies below ${(player.executeThreshold * 100).toFixed(0)}% HP`);
            }

            if (effect.bossDamage) {
                player.bossDamage = effect.bossDamage;
                console.log(`👑 +${((effect.bossDamage - 1) * 100).toFixed(0)}% damage to bosses`);
            }

            if (effect.minionCritChance) {
                player.minionCritChance = effect.minionCritChance;
                player.minionCritDamage = effect.minionCritDamage || 3.0;
                console.log(`💥 ${(effect.minionCritChance * 100).toFixed(0)}% crit chance`);
            }

            if (effect.armorPen) {
                player.armorPen = effect.armorPen;
                console.log(`🗡️ ${(effect.armorPen * 100).toFixed(0)}% armor penetration`);
            }

            if (effect.chainAttack) {
                player.chainAttack = effect.chainAttack;
                console.log(`⚡ Attacks chain to ${effect.chainAttack.targets} enemies`);
            }

            if (effect.splashDamage) {
                player.splashDamage = effect.splashDamage;
                console.log(`💧 ${(effect.splashDamage.percent * 100).toFixed(0)}% splash damage`);
            }

            if (effect.dualWield) {
                player.dualWield = true;
                player.attacksPerStrike = effect.attacksPerStrike || 2;
                console.log(`⚔️ Dual wield - ${player.attacksPerStrike} attacks per strike`);
            }

            // ==== PLAYER STATS ====
            if (effect.maxHealth) {
                player.maxHealth += effect.maxHealth;
                player.health += effect.maxHealth;
                console.log(`❤️ Max health: +${effect.maxHealth}`);
            }

            if (effect.healPerKill) {
                player.healPerKill = effect.healPerKill;
                console.log(`🩸 Heal ${effect.healPerKill} HP per kill`);
            }

            if (effect.healOnKillPercent) {
                player.healOnKillPercent = effect.healOnKillPercent;
                console.log(`💚 Heal ${(effect.healOnKillPercent * 100).toFixed(0)}% max HP per kill`);
            }

            if (effect.regenPerMinion) {
                player.regenPerMinion = effect.regenPerMinion;
                console.log(`🔮 +${effect.regenPerMinion} HP/sec per minion`);
            }

            if (effect.xpBonus) {
                if (!player.xpMultiplier) player.xpMultiplier = 1;
                player.xpMultiplier *= effect.xpBonus;
                console.log(`✨ XP multiplier: ${player.xpMultiplier}x`);
            }

            if (effect.sacrificeHealth) {
                const sacrifice = typeof effect.sacrificeHealth === 'number' && effect.sacrificeHealth < 0 ?
                    Math.abs(effect.sacrificeHealth) : effect.sacrificeHealth * player.maxHealth;
                player.maxHealth -= sacrifice;
                player.health = Math.min(player.health, player.maxHealth);
                console.log(`🩸 Sacrificed ${sacrifice} max HP`);
            }

            if (effect.sacrificeDamage) {
                if (!player.damageMultiplier) player.damageMultiplier = 1;
                player.damageMultiplier *= effect.sacrificeDamage;
                console.log(`💀 Damage multiplier: ${player.damageMultiplier}x`);
            }

            // ==== SPECIAL EFFECTS ====
            if (effect.packDamageBonus) {
                player.packDamageBonus = effect.packDamageBonus;
                console.log(`🐺 +${(effect.packDamageBonus * 100).toFixed(0)}% damage per nearby minion`);
            }

            if (effect.groupedDefense) {
                player.groupedDefense = effect.groupedDefense;
                player.groupRadius = effect.groupRadius || 4;
                console.log(`🛡️ +${((1 - effect.groupedDefense) * 100).toFixed(0)}% defense when grouped`);
            }

            if (effect.coordinatedDamage) {
                player.coordinatedDamage = effect.coordinatedDamage;
                console.log(`🎯 Coordinated assault: ${((effect.coordinatedDamage - 1) * 100).toFixed(0)}% bonus damage`);
            }

            if (effect.perMinionBonus) {
                player.perMinionBonus = effect.perMinionBonus;
                player.maxMinionBonus = effect.maxBonus || 2.0;
                console.log(`💪 +${(effect.perMinionBonus * 100).toFixed(0)}% per minion (max ${(effect.maxBonus * 100).toFixed(0)}%)`);
            }

            if (effect.commandAura) {
                player.commandAura = effect.commandAura;
                console.log(`👑 Command aura: +${((effect.commandAura.bonus - 1) * 100).toFixed(0)}% all stats in ${effect.commandAura.radius} tiles`);
            }

            if (effect.flankDamage) {
                player.flankDamage = effect.flankDamage;
                console.log(`🗡️ +${((effect.flankDamage - 1) * 100).toFixed(0)}% damage from behind`);
            }

            if (effect.killDamageStack) {
                player.killDamageStack = effect.killDamageStack;
                player.maxKillStacks = effect.maxStacks || 20;
                console.log(`🩸 +${(effect.killDamageStack * 100).toFixed(0)}% damage per kill (max ${effect.maxStacks} stacks)`);
            }

            if (effect.reapersMarkThreshold) {
                player.reapersMarkThreshold = effect.reapersMarkThreshold;
                player.reapersMarkDamage = effect.reapersMarkDamage;
                console.log(`💀 Reaper's Mark: enemies below ${(effect.reapersMarkThreshold * 100).toFixed(0)}% HP take +${((effect.reapersMarkDamage - 1) * 100).toFixed(0)}% damage`);
            }

            // ==== PASSIVE ABILITIES (Handled by PassiveAbilityManager) ====
            const passiveEffects = [
                'shadowVolley', 'curseAura', 'lifeDrainAura', 'damageAura', 'corpseExplosion',
                'voidEruption', 'cursedTrail', 'soulCollector', 'retaliationNova', 'plagueAura',
                'shadowDash', 'invisOnKill', 'soulBarrier', 'mindControl', 'doomMark',
                'secondChance', 'eclipseZone', 'darkSovereign', 'fearAura', 'lunarBonus',
                'autoRevive', 'raiseUndead', 'lastStand', 'deathSpiral', 'hexAura',
                'furyOnKill', 'cdrOnHit', 'autoSummon', 'shadowVolleyCount', 'leapAttack',
                'hiveRetribution', 'apocalypseForm', 'painLink', 'chargeAttack', 'savageFrenzy',
                'emergencySwarm', 'colossusCore', 'syncExecute', 'guardianShield', 'soulRend',
                'instakillChance', 'dreadAura', 'killSpree', 'massacre', 'berserkThreshold',
                'painEmpowerment', 'ccImmune', 'attackRange', 'attackSize', 'apocalypseWave',
                'perfectAccuracy', 'vampireLord', 'statsPerLevel', 'instantRevive', 'shadowDominion',
                'instantTeleport', 'trueDamage', 'lifeSteal', 'packMentalityBonus', 'championMastery',
                'reaperMastery', 'phaseMovement', 'ascended', 'evasion', 'vengeance', 'reflectDamage',
                'retaliationBolts', 'permanentConversion', 'multiplicativeStacking', 'exponentialDamage',
                'sharedHP', 'statSharing', 'unityBonus', 'deathExplosion', 'voidZone', 'infiniteMinions',
                'darkHarvestChance', 'executeThreshold', 'executeCooldown', 'autoSpawnInterval',
                'ignorePhysics', 'timeSlow', 'tidalWave', 'invincibleWhileAttacking', 'gravityWell',
                'dodgeChance', 'guaranteedCrit', 'maxDamagePercent', 'randomBuffs', 'randomEffects',
                'chaosMagic', 'ghostRevive', 'bossImmortality', 'statsPerSecond', 'synergyBonus',
                'shareBuffs', 'inheritMinionStats', 'legionNova', 'damageNova', 'periodicExplosion',
                'autoCounter', 'absorbAbilities', 'adaptiveImmunity', 'orbitalStrikes', 'autoTeleport',
                'megaMinion', 'focusBuffs', 'absorbMinions'
            ];

            // Check if this skill has any passive abilities
            let hasPassive = false;
            for (const passiveKey of passiveEffects) {
                if (effect[passiveKey] !== undefined) {
                    hasPassive = true;
                    break;
                }
            }

            if (hasPassive) {
                this.scene.passiveAbilityManager.addPassiveAbility(skill);
                console.log(`✨ Added passive ability: ${skill.name}`);
            }

            // ==== INSTANT EFFECTS ====
            if (effect.instantMinions) {
                for (let i = 0; i < effect.instantMinions; i++) {
                    const minion = this.scene.spawnMinion(
                        player.sprite.x + Phaser.Math.Between(-100, 100),
                        player.sprite.y + Phaser.Math.Between(-100, 100),
                        player.data.id,
                        true // permanent
                    );

                    // Track permanent minion on server
                    if (minion && minion.minionId) {
                        networkManager.trackPermanentMinion(minion.minionId, 'add');
                    }
                }
                console.log(`👥 Summoned ${effect.instantMinions} permanent minions`);
            }

            // ==== GOD-TIER CAPSTONE EFFECTS ====
            if (effect.legionGod) {
                player.minionCap = effect.legionGod.minionCap || 40;
                player.legionBuffMultiplier = effect.legionGod.buffMultiplier || 2.0;
                player.instantRevive = effect.legionGod.instantRevive || true;
                console.log(`👑 LEGION GOD: Max ${player.minionCap} minions, all buffs x${player.legionBuffMultiplier}`);
            }

            if (effect.championGod) {
                const bonus = effect.championGod.statsBonus || 11.0;
                player.minionAllStatsMultiplier = (player.minionAllStatsMultiplier || 1) * bonus;
                player.minionSizeMultiplier = (player.minionSizeMultiplier || 1) * (effect.championGod.size || 3.0);
                player.shockwaveRadius = effect.championGod.shockwaveRadius || 10;
                console.log(`⭐ CHAMPION GOD: +${((bonus - 1) * 100).toFixed(0)}% all stats, shockwaves`);
            }

            if (effect.reaperGod) {
                player.damageMultiplier = (player.damageMultiplier || 1) * (effect.reaperGod.statsBonus || 6.0);
                player.maxHealth = Math.floor(player.maxHealth * (effect.reaperGod.statsBonus || 6.0));
                player.deathAura = effect.reaperGod.deathAura;
                player.deathImmunity = effect.reaperGod.deathImmunity;
                console.log(`💀 REAPER GOD: +${((effect.reaperGod.statsBonus - 1) * 100).toFixed(0)}% all stats, death aura`);
            }
        }

        // No legacy skills - all handled by MalacharSkillTree system above
    }

    hide() {

        // Destroy overlay
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }

        // Destroy panel
        if (this.panel) {
            this.panel.destroy();
            this.panel = null;
        }

        // Destroy title text
        if (this.titleText) {
            this.titleText.destroy();
            this.titleText = null;
        }

        // Destroy instruction text
        if (this.instructionText) {
            this.instructionText.destroy();
            this.instructionText = null;
        }

        // Destroy all cards
        this.cards.forEach(card => {
            card.elements.forEach(element => element.destroy());
        });
        this.cards = [];

        // Cleanup keyboard controls
        if (this.key1) {
            this.key1.removeAllListeners();
            this.key1 = null;
        }
        if (this.key2) {
            this.key2.removeAllListeners();
            this.key2 = null;
        }
        if (this.key3) {
            this.key3.removeAllListeners();
            this.key3 = null;
        }

        this.isActive = false;
        this.selectedIndex = 0;
    }

    getAvailableSkills(playerClass, currentLevel) {
        // Debug logging
        console.log(`\n🔍 ======= SKILL SELECTOR DEBUG =======`);
        console.log(`📊 Player Class: "${playerClass}" (type: ${typeof playerClass})`);
        console.log(`📊 Current Level: ${currentLevel}`);
        console.log(`📊 Local Player Data:`, this.scene.localPlayer ? {
            class: this.scene.localPlayer.class,
            dataClass: this.scene.localPlayer.data ? this.scene.localPlayer.data.class : 'no data',
            characterId: this.scene.localPlayer.data ? this.scene.localPlayer.data.characterId : 'no data'
        } : 'no local player');
        console.log(`📊 MalacharSkillTree exists: ${typeof MalacharSkillTree !== 'undefined'}`);
        console.log(`📊 window.getAvailableChoices exists: ${typeof window.getAvailableChoices === 'function'}`);

        // Load skills from MalacharSkillTree (only for Malachar class)
        // Check both the ID and display name variations
        const isMalachar = playerClass === 'MALACHAR' ||
                          playerClass === 'Malachar' ||
                          playerClass === 'Necromancer' ||
                          (this.scene.localPlayer && this.scene.localPlayer.data && this.scene.localPlayer.data.characterId === 'MALACHAR');

        console.log(`✔️ Is Malachar check: ${isMalachar}`);

        if (isMalachar && typeof MalacharSkillTree !== 'undefined' && typeof window.getAvailableChoices === 'function') {
            // Get unlocked skill IDs (just the IDs, in order)
            const unlockedSkillIds = this.selectedSkills.map(s => s.id);
            console.log(`📊 Unlocked skills:`, unlockedSkillIds);

            // Get skills for this specific level using new v2 API
            // Note: Function signature is (level, unlockedSkills)
            const levelSkills = window.getAvailableChoices(currentLevel, unlockedSkillIds);
            console.log(`✅ Found ${levelSkills ? levelSkills.length : 0} choices for level ${currentLevel}`);

            if (levelSkills && levelSkills.length > 0) {
                console.log(`✅ Returning skills:`, levelSkills.map(s => s.name));
                console.log(`======= END SKILL SELECTOR DEBUG =======\n`);
                return levelSkills;
            } else {
                console.warn(`⚠️ No skills found for level ${currentLevel} in MalacharSkillTree`);
                console.warn(`⚠️ Unlocked skills:`, unlockedSkillIds);
            }
        } else {
            console.log(`ℹ️ Not Malachar or skill tree not loaded`);
            console.log(`ℹ️ Reason: ${!isMalachar ? 'Not Malachar' : typeof MalacharSkillTree === 'undefined' ? 'SkillTree not loaded' : 'getAvailableChoices not a function'}`);
        }
        console.log(`======= END SKILL SELECTOR DEBUG =======\n`);

        // No fallback skills - only use MalacharSkillTree
        console.warn(`⚠️ No skill tree available - returning empty array`);
        return [];
    }

    // Removed old helper methods - no longer needed with MalacharSkillTree

    removeExcessMinions(player, newCap) {
        // Get all minions owned by this player
        const playerMinions = Object.values(this.scene.minions).filter(m => m.ownerId === player.data.id);

        const excessCount = playerMinions.length - newCap;
        if (excessCount <= 0) return;

        console.log(`💀 Removing ${excessCount} excess minions (${playerMinions.length} → ${newCap})`);

        // Sort by health (remove weakest first)
        playerMinions.sort((a, b) => a.health - b.health);

        // Remove excess minions
        for (let i = 0; i < excessCount; i++) {
            const minion = playerMinions[i];
            if (minion && minion.minionId) {
                // Remove from permanent tracking if it was permanent
                if (networkManager && networkManager.permanentMinions) {
                    networkManager.trackPermanentMinion(minion.minionId, 'remove');
                }

                // Destroy the minion
                minion.health = 0;
                // Death animation and cleanup will be handled by normal minion death logic
            }
        }
    }

    applyMinionStatUpdates(player) {
        // Get all minions owned by this player
        const playerMinions = Object.values(this.scene.minions).filter(m => m.ownerId === player.data.id);

        if (playerMinions.length === 0) return;

        console.log(`🔄 Updating stats for ${playerMinions.length} existing minions`);

        playerMinions.forEach(minion => {
            // Recalculate health with new multipliers
            if (player.baseMinionHealth && player.minionHealthMultiplier) {
                const newMaxHealth = player.baseMinionHealth * player.minionHealthMultiplier;
                const healthPercent = minion.health / minion.maxHealth;
                minion.maxHealth = newMaxHealth;
                minion.health = Math.min(minion.health, newMaxHealth); // Don't reduce current health below max
                console.log(`  💚 Minion ${minion.minionId.substring(0,6)}: maxHP ${minion.maxHealth}`);
            }

            // Recalculate damage with new multipliers
            if (player.baseMinionDamage && player.minionDamageMultiplier) {
                minion.damage = player.baseMinionDamage * player.minionDamageMultiplier;
                console.log(`  ⚔️ Minion ${minion.minionId.substring(0,6)}: damage ${minion.damage}`);
            }
        });
    }

    destroy() {
        this.hide();
    }
}
