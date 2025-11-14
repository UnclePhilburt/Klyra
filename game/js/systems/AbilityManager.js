// Ability Manager - Handles Q/E/R ability activation and cooldowns
class AbilityManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Cooldown tracking
        this.cooldowns = {
            q: 0,
            e: 0,
            r: 0
        };

        // Cooldown UI elements
        this.cooldownUI = null;

        this.createCooldownUI();
    }

    createCooldownUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Position at bottom center (above skill selector area)
        const startY = height - 450;
        const centerX = width / 2;
        const spacing = 100;

        this.cooldownUI = {
            q: this.createAbilityButton(centerX - spacing, startY, 'Q'),
            e: this.createAbilityButton(centerX, startY, 'E'),
            r: this.createAbilityButton(centerX + spacing, startY, 'R')
        };
    }

    createAbilityButton(x, y, key) {
        const container = this.scene.add.container(x, y);
        container.setScrollFactor(0);
        container.setDepth(10000);

        // Background circle
        const bg = this.scene.add.circle(0, 0, 35, 0x1a1a2e, 0.9);
        bg.setStrokeStyle(3, 0x6B4FFF, 0.8);
        container.add(bg);

        // Cooldown overlay (starts hidden)
        const cooldownOverlay = this.scene.add.circle(0, 0, 35, 0x000000, 0.7);
        cooldownOverlay.setVisible(false);
        container.add(cooldownOverlay);

        // Key text
        const keyText = this.scene.add.text(0, 0, key, {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        container.add(keyText);

        // Cooldown text (seconds remaining)
        const cooldownText = this.scene.add.text(0, 0, '', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '16px',
            fill: '#FF4444'
        }).setOrigin(0.5);
        cooldownText.setVisible(false);
        container.add(cooldownText);

        // Ability name (shown on hover or when available)
        const abilityName = this.scene.add.text(0, -55, '', {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '12px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#0a0a0fdd',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        abilityName.setVisible(false);
        container.add(abilityName);

        return {
            container,
            bg,
            cooldownOverlay,
            keyText,
            cooldownText,
            abilityName
        };
    }

    update(time, delta) {
        // Update cooldowns
        Object.keys(this.cooldowns).forEach(key => {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key] -= delta;
                if (this.cooldowns[key] < 0) {
                    this.cooldowns[key] = 0;
                }
            }
        });

        // Update UI
        this.updateCooldownUI();
    }

    updateCooldownUI() {
        Object.keys(this.cooldownUI).forEach(key => {
            const ui = this.cooldownUI[key];
            const cooldown = this.cooldowns[key];
            const ability = this.player.abilities ? this.player.abilities[key] : null;

            // Show/hide ability name
            if (ability) {
                ui.abilityName.setText(ability.name);
                ui.abilityName.setVisible(true);
            } else {
                ui.abilityName.setVisible(false);
            }

            // Update cooldown display
            if (cooldown > 0) {
                ui.cooldownOverlay.setVisible(true);
                ui.cooldownText.setVisible(true);
                ui.cooldownText.setText(Math.ceil(cooldown / 1000).toString());
                ui.bg.setStrokeStyle(3, 0x444444, 0.8);
            } else {
                ui.cooldownOverlay.setVisible(false);
                ui.cooldownText.setVisible(false);

                // Available - glow
                if (ability) {
                    ui.bg.setStrokeStyle(3, 0x6B4FFF, 0.8);
                } else {
                    ui.bg.setStrokeStyle(3, 0x333333, 0.3);
                }
            }
        });
    }

    canUseAbility(key) {
        // Check if ability exists
        if (!this.player.abilities || !this.player.abilities[key]) {
            return false;
        }

        // Check cooldown
        if (this.cooldowns[key] > 0) {
            return false;
        }

        return true;
    }

    useAbility(key) {
        if (!this.canUseAbility(key)) {
            console.log(`❌ Ability ${key.toUpperCase()} not ready`);
            return false;
        }

        const ability = this.player.abilities[key];
        console.log(`✨ Using ability: ${ability.name} (${key.toUpperCase()})`);

        // Start cooldown
        this.cooldowns[key] = ability.cooldown;

        // Execute ability effect
        this.executeAbility(key, ability);

        // Flash the UI button
        this.flashButton(key);

        return true;
    }

    flashButton(key) {
        const ui = this.cooldownUI[key];

        this.scene.tweens.add({
            targets: ui.bg,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    executeAbility(key, ability) {
        console.log(`🔥 Executing ${key.toUpperCase()}: ${ability.name}`);
        console.log(`   Effect:`, ability.effect);
        console.log(`   Bonus Effect:`, ability.bonusEffect);

        // Get combined effects
        const effect = { ...ability.effect, ...ability.bonusEffect };

        // ==== NECROMANCER ABILITIES ====

        // Q - Rally Command / Variants
        if (effect.minionAttackSpeed) {
            console.log(`  💨 Minion attack speed boost: ${effect.minionAttackSpeed}x`);
            // TODO: Apply temporary attack speed buff to all minions

            // Bonus: Spawn temps
            if (effect.spawnTemps) {
                console.log(`  👥 Spawning ${effect.spawnTemps} temporary minions`);
                for (let i = 0; i < effect.spawnTemps; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 100;
                    const x = this.player.sprite.x + Math.cos(angle) * distance;
                    const y = this.player.sprite.y + Math.sin(angle) * distance;

                    const minion = this.scene.spawnMinion(x, y, this.player.data.id, false);
                    // TODO: Apply elite stats if tempElite is true

                    // Auto-remove after duration
                    if (effect.tempDuration) {
                        setTimeout(() => {
                            if (minion && minion.sprite) {
                                minion.health = 0;
                                // Death will be handled by normal minion death logic
                            }
                        }, effect.tempDuration);
                    }
                }
            }

            // Bonus: Teleport to player
            if (effect.teleportToPlayer) {
                console.log(`  📍 Teleporting minions to player`);
                // TODO: Teleport all minions to player position in radial pattern
            }
        }

        // E - Skeletal Fury / Variants
        if (effect.minionHPSacrifice) {
            console.log(`  💀 Sacrificing ${effect.minionHPSacrifice * 100}% minion HP`);
            console.log(`  ⚔️ Damage bonus: ${effect.minionDamageBonus}x`);
            console.log(`  📏 Size bonus: ${effect.minionSizeBonus}x`);
            // TODO: Sacrifice minion HP, apply damage/size buff temporarily
        }

        // R - Mass Resurrection / Variants
        if (effect.reviveAll) {
            console.log(`  ⚰️ Reviving all dead minions`);
            // TODO: Track dead minions and revive them
        }

        // ==== SHADOWCASTER ABILITIES ====

        // Q - Shadowbolt Storm
        if (effect.waves && effect.boltsPerWave) {
            console.log(`  💫 Firing ${effect.waves} waves of ${effect.boltsPerWave} bolts`);
            // TODO: Fire shadow bolt waves in all directions
        }

        // E - Blink Strike
        if (effect.teleportDistance) {
            console.log(`  🌀 Teleporting ${effect.teleportDistance} tiles`);
            // TODO: Teleport player in movement direction, leave void zone
        }

        // R - Oblivion Beam
        if (effect.beamDPS) {
            console.log(`  ⚡ Channeling beam: ${effect.beamDPS} DPS for ${ability.duration}ms`);
            // TODO: Create beam targeting nearest enemy
        }

        // ==== BLOOD RITUALIST ABILITIES ====

        // Q - Blood Boil
        if (effect.damagePercent && effect.usePlayerHP) {
            const damage = this.player.health * effect.damagePercent;
            console.log(`  🩸 Dealing ${damage} damage in ${effect.radius} tile radius`);
            // TODO: Damage all enemies in radius based on player HP
        }

        // E - Crimson Harvest
        if (effect.lifestealPercent) {
            console.log(`  💉 Lifesteal: ${effect.lifestealPercent * 100}% for ${ability.duration}ms`);
            // TODO: Apply temporary lifesteal to player and minions
        }

        // R - Blood Moon Ritual
        if (effect.playerHPSacrifice) {
            const sacrifice = this.player.health * effect.playerHPSacrifice;
            this.player.health = Math.max(1, this.player.health - sacrifice);
            console.log(`  💔 Sacrificed ${sacrifice} HP`);
            console.log(`  💪 Minion stats: ${effect.minionStatsBonus}x for ${ability.duration}ms`);
            // TODO: Apply temporary minion stat boost
        }

        console.log(`✅ Ability ${key.toUpperCase()} executed`);
    }

    destroy() {
        if (this.cooldownUI) {
            Object.values(this.cooldownUI).forEach(ui => {
                if (ui.container) {
                    ui.container.destroy();
                }
            });
        }
    }
}
