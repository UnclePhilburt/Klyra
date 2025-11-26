// Bastion Ability Handler - Tactical Weapon Switching System
// Handles SCAR, Shield+Pistol, and Shotgun stances with ammo management

class BastionAbilityHandler {
    constructor(player, scene) {
        this.player = player;
        this.scene = scene;

        // Get character config
        this.config = window.CharacterSystem.getCharacter('BASTION');
        if (!this.config) {
            console.error('❌ Bastion character config not found!');
            return;
        }

        // Current stance (scar, shield, shotgun)
        this.currentStance = 'scar';
        this.lastStanceSwitch = 0;
        this.stanceSwitchCooldown = 2000; // 2 seconds

        // Ammo system
        this.currentAmmo = 10; // Start with full SCAR ammo
        this.maxAmmo = 10;
        this.isReloading = false;
        this.reloadStartTime = 0;

        // Shooting
        this.lastShotTime = 0;
        this.projectiles = [];
        this.autoShootEnabled = true; // Auto-attack ON by default

        // Out of ammo vibration
        this.outOfAmmoVibrationInterval = null;

        // Apply initial stance stats
        this.applyStanceStats();

        console.log('✅ Bastion ability handler initialized - Starting with SCAR');
    }

    update(time, enemies) {
        const now = Date.now();

        // Always update projectiles (even while reloading)
        this.updateProjectiles(enemies);

        // Handle reloading
        if (this.isReloading) {
            const stance = this.config.stances[this.currentStance];
            if (now - this.reloadStartTime >= stance.reloadTime) {
                this.finishReload();
            }
            return; // Can't shoot while reloading
        }

        // Auto-shoot at nearest enemy (only if enabled)
        if (this.autoShootEnabled) {
            this.autoShoot(now, enemies);
        }
    }

    autoShoot(now, enemies) {
        if (!enemies || enemies.length === 0) return;

        const stance = this.config.stances[this.currentStance];

        // Check fire rate cooldown
        if (now - this.lastShotTime < stance.fireRate) return;

        // Check ammo (no auto-reload, player must press Q)
        if (this.currentAmmo <= 0) {
            return;
        }

        // Find nearest enemy in range
        const target = this.findNearestEnemyInRange(enemies, stance.range);
        if (!target) {
            return;
        }

        // Shoot!
        console.log(`🔫 Bastion auto-shooting at enemy with ${this.currentStance}!`);
        this.shoot(target);
        this.lastShotTime = now;
    }

    manualShoot(direction) {
        const now = Date.now();
        const stance = this.config.stances[this.currentStance];

        // Check fire rate cooldown
        if (now - this.lastShotTime < stance.fireRate) {
            return;
        }

        // Check ammo (no auto-reload, player must press Q)
        if (this.currentAmmo <= 0) {
            return;
        }

        // Check if reloading
        if (this.isReloading) {
            return;
        }

        // Consume ammo
        this.currentAmmo--;
        console.log(`🎮 Manual ${this.currentStance.toUpperCase()} shot! Ammo: ${this.currentAmmo}/${this.maxAmmo}`);

        // Start out of ammo vibration if ammo reaches 0
        if (this.currentAmmo === 0) {
            this.startOutOfAmmoVibration();
        }

        // Face the shooting direction
        if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
            // Flip sprite based on aiming direction
            // If aiming left (direction.x < 0), flip sprite
            this.player.spriteRenderer.sprite.setFlipX(direction.x < 0);
        }

        // Play weapon sound
        this.playWeaponSound();

        // Play attack animation
        if (this.player.spriteRenderer && this.player.spriteRenderer.playAttackAnimation) {
            this.player.spriteRenderer.playAttackAnimation();
        }

        // Calculate attack angle for network sync
        const attackAngle = Math.atan2(direction.y, direction.x);

        // Broadcast attack to other players
        this.broadcastAttack({
            stance: this.currentStance,
            angle: attackAngle,
            position: { x: this.player.sprite.x, y: this.player.sprite.y },
            isManual: true
        });

        // Create projectile(s) in the specified direction (with spread)
        if (this.currentStance === 'shotgun') {
            this.createManualShotgunBlast(direction, stance);
        } else {
            this.createManualProjectile(direction, stance);
        }

        this.lastShotTime = now;

        // Update UI
        this.updateAmmoUI();

        // Vibrate controller
        if (this.scene.controllerManager) {
            this.scene.controllerManager.vibrateAttack();
        }
    }

    shoot(target) {
        const stance = this.config.stances[this.currentStance];

        // Consume ammo
        this.currentAmmo--;
        console.log(`🔫 ${this.currentStance.toUpperCase()} fired! Ammo: ${this.currentAmmo}/${this.maxAmmo}`);

        // Start out of ammo vibration if ammo reaches 0
        if (this.currentAmmo === 0) {
            this.startOutOfAmmoVibration();
        }

        // Face the target direction
        if (this.player.spriteRenderer && this.player.spriteRenderer.sprite && target.sprite) {
            const dx = target.sprite.x - this.player.sprite.x;
            // Flip sprite based on target direction
            // If target is to the left (dx < 0), flip sprite
            this.player.spriteRenderer.sprite.setFlipX(dx < 0);
        }

        // Play weapon sound
        this.playWeaponSound();

        // Play attack animation using PlayerSprite's method
        if (this.player.spriteRenderer && this.player.spriteRenderer.playAttackAnimation) {
            this.player.spriteRenderer.playAttackAnimation();
        }

        // Calculate attack direction for network sync
        const attackAngle = Phaser.Math.Angle.Between(
            this.player.sprite.x, this.player.sprite.y,
            target.sprite.x, target.sprite.y
        );

        // Broadcast attack to other players
        this.broadcastAttack({
            stance: this.currentStance,
            angle: attackAngle,
            position: { x: this.player.sprite.x, y: this.player.sprite.y },
            isManual: false
        });

        // Create projectile(s) with auto-attack spread
        if (this.currentStance === 'shotgun') {
            // Shotgun fires multiple pellets
            this.createShotgunBlast(target, stance, true); // true = add random spread
        } else {
            // SCAR and Pistol fire single bullets
            this.createProjectile(target, stance, true); // true = add random spread
        }

        // Update UI
        this.updateAmmoUI();

        // Vibrate controller
        if (this.scene.controllerManager) {
            this.scene.controllerManager.vibrateAttack();
        }
    }

    createProjectile(target, stance, addSpread = true) {
        let angle = Phaser.Math.Angle.Between(
            this.player.sprite.x, this.player.sprite.y,
            target.sprite.x, target.sprite.y
        );

        // Add random spread for auto-attack (not for manual)
        if (addSpread) {
            // Spread varies by weapon: SCAR has less spread, pistol medium, shotgun doesn't use this
            let spreadAmount = 0;
            switch (this.currentStance) {
                case 'scar':
                    spreadAmount = 0.05; // ~3 degrees
                    break;
                case 'shield':
                    spreadAmount = 0.08; // ~5 degrees
                    break;
                default:
                    spreadAmount = 0.05;
            }
            // Add random spread in radians
            angle += (Math.random() - 0.5) * spreadAmount * 2;
        }

        const projectile = this.scene.add.circle(
            this.player.sprite.x,
            this.player.sprite.y,
            4, // Bullet size
            this.currentStance === 'shield' ? 0xFFD700 : 0xFF4500 // Gold for pistol, orange for SCAR
        );
        projectile.setDepth(1000);

        this.projectiles.push({
            sprite: projectile,
            vx: Math.cos(angle) * stance.projectileSpeed,
            vy: Math.sin(angle) * stance.projectileSpeed,
            damage: stance.damage * (this.player.stats?.damage || 10) / 10,
            range: stance.range,
            distanceTraveled: 0,
            damageDropoff: stance.damageDropoff || 0
        });
    }

    createManualProjectile(direction, stance) {
        let angle = Math.atan2(direction.y, direction.x);

        // Subtle auto-aim for SCAR and Pistol (not shotgun)
        if (this.currentStance === 'scar' || this.currentStance === 'shield') {
            // Find nearest enemy in range
            // Convert enemies object/map to array
            let enemies = [];
            if (this.scene.enemies) {
                if (Array.isArray(this.scene.enemies)) {
                    enemies = this.scene.enemies;
                } else if (typeof this.scene.enemies === 'object') {
                    enemies = Object.values(this.scene.enemies);
                }
            }

            const nearestEnemy = this.findNearestEnemyInRange(enemies, stance.range);

            if (nearestEnemy && nearestEnemy.sprite) {
                // Calculate angle to enemy
                const enemyAngle = Phaser.Math.Angle.Between(
                    this.player.sprite.x, this.player.sprite.y,
                    nearestEnemy.sprite.x, nearestEnemy.sprite.y
                );

                // Calculate angle difference
                let angleDiff = enemyAngle - angle;

                // Normalize angle difference to -PI to PI
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // Only apply auto-aim if aiming somewhat close to the enemy (within ~30 degrees)
                if (Math.abs(angleDiff) < 0.52) { // 0.52 radians = ~30 degrees
                    // Adjust angle by 15% towards the enemy (subtle)
                    angle += angleDiff * 0.15;
                }
            }
        }

        // Add random spread for manual mode too
        let spreadAmount = 0;
        switch (this.currentStance) {
            case 'scar':
                spreadAmount = 0.05; // ~3 degrees
                break;
            case 'shield':
                spreadAmount = 0.08; // ~5 degrees
                break;
            default:
                spreadAmount = 0.05;
        }
        // Add random spread in radians
        angle += (Math.random() - 0.5) * spreadAmount * 2;

        const projectile = this.scene.add.circle(
            this.player.sprite.x,
            this.player.sprite.y,
            4, // Bullet size
            this.currentStance === 'shield' ? 0xFFD700 : 0xFF4500 // Gold for pistol, orange for SCAR
        );
        projectile.setDepth(1000);

        this.projectiles.push({
            sprite: projectile,
            vx: Math.cos(angle) * stance.projectileSpeed,
            vy: Math.sin(angle) * stance.projectileSpeed,
            damage: stance.damage * (this.player.stats?.damage || 10) / 10,
            range: stance.range,
            distanceTraveled: 0,
            damageDropoff: stance.damageDropoff || 0
        });
    }

    createShotgunBlast(target, stance, addRandomSpread = true) {
        let baseAngle = Phaser.Math.Angle.Between(
            this.player.sprite.x, this.player.sprite.y,
            target.sprite.x, target.sprite.y
        );

        // Add random inaccuracy for auto-attack
        if (addRandomSpread) {
            baseAngle += (Math.random() - 0.5) * 0.1; // ~6 degrees random offset
        }

        // Fire 5 pellets with spread
        for (let i = 0; i < stance.pellets; i++) {
            const spreadOffset = (i - 2) * (stance.spread / 180 * Math.PI); // -2, -1, 0, 1, 2
            const angle = baseAngle + spreadOffset;

            const projectile = this.scene.add.circle(
                this.player.sprite.x,
                this.player.sprite.y,
                3, // Slightly smaller pellets
                0xDC143C // Crimson red for shotgun
            );
            projectile.setDepth(1000);

            this.projectiles.push({
                sprite: projectile,
                vx: Math.cos(angle) * stance.projectileSpeed,
                vy: Math.sin(angle) * stance.projectileSpeed,
                damage: stance.damage * (this.player.stats?.damage || 10) / 10,
                range: stance.range,
                distanceTraveled: 0,
                damageDropoff: stance.damageDropoff || 0
            });
        }
    }

    createManualShotgunBlast(direction, stance) {
        let baseAngle = Math.atan2(direction.y, direction.x);

        // Add random inaccuracy for manual mode too
        baseAngle += (Math.random() - 0.5) * 0.1; // ~6 degrees random offset

        // Fire 5 pellets with spread
        for (let i = 0; i < stance.pellets; i++) {
            const spreadOffset = (i - 2) * (stance.spread / 180 * Math.PI); // -2, -1, 0, 1, 2
            const angle = baseAngle + spreadOffset;

            const projectile = this.scene.add.circle(
                this.player.sprite.x,
                this.player.sprite.y,
                3, // Slightly smaller pellets
                0xDC143C // Crimson red for shotgun
            );
            projectile.setDepth(1000);

            this.projectiles.push({
                sprite: projectile,
                vx: Math.cos(angle) * stance.projectileSpeed,
                vy: Math.sin(angle) * stance.projectileSpeed,
                damage: stance.damage * (this.player.stats?.damage || 10) / 10,
                range: stance.range,
                distanceTraveled: 0,
                damageDropoff: stance.damageDropoff || 0
            });
        }
    }

    updateProjectiles(enemies) {
        const tileSize = 48; // GameConfig.GAME.TILE_SIZE

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Move projectile
            proj.sprite.x += proj.vx * (1/60); // Assuming 60fps
            proj.sprite.y += proj.vy * (1/60);

            // Track distance
            const distance = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) * (1/60);
            proj.distanceTraveled += distance;

            // Check if out of range
            const maxDistance = proj.range * tileSize;
            if (proj.distanceTraveled > maxDistance) {
                proj.sprite.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check collision with enemies
            let hit = false;
            for (const enemy of enemies) {
                if (!enemy.isAlive || !enemy.sprite) continue;

                const dist = Phaser.Math.Distance.Between(
                    proj.sprite.x, proj.sprite.y,
                    enemy.sprite.x, enemy.sprite.y
                );

                if (dist < 30) {
                    // Hit!
                    let damage = proj.damage;

                    // Apply damage dropoff for shotgun
                    if (proj.damageDropoff > 0) {
                        const distancePercent = proj.distanceTraveled / maxDistance;
                        damage = damage * (1 - distancePercent * proj.damageDropoff);
                    }

                    // Damage enemy
                    const networkManager = this.scene.game.registry.get('networkManager');
                    if (networkManager && networkManager.connected) {
                        networkManager.hitEnemy(enemy.data.id, Math.round(damage));
                    }

                    proj.sprite.destroy();
                    this.projectiles.splice(i, 1);
                    hit = true;
                    break;
                }
            }
        }
    }

    findNearestEnemyInRange(enemies, rangeTiles) {
        const tileSize = 48;
        const maxDistance = rangeTiles * tileSize;
        let nearest = null;
        let nearestDist = Infinity;

        if (!this.player.sprite) return null;

        for (const enemy of enemies) {
            if (!enemy.isAlive || !enemy.sprite) continue;

            const dist = Phaser.Math.Distance.Between(
                this.player.sprite.x, this.player.sprite.y,
                enemy.sprite.x, enemy.sprite.y
            );

            if (dist <= maxDistance && dist < nearestDist) {
                nearest = enemy;
                nearestDist = dist;
            }
        }

        return nearest;
    }

    switchStance() {
        const now = Date.now();

        // Check cooldown
        if (now - this.lastStanceSwitch < this.stanceSwitchCooldown) {
            const remaining = Math.ceil((this.stanceSwitchCooldown - (now - this.lastStanceSwitch)) / 1000);
            console.log(`⏰ Stance switch on cooldown: ${remaining}s`);
            return;
        }

        // Stop out of ammo vibration when switching stances
        this.stopOutOfAmmoVibration();

        // Cycle through stances: scar -> shield -> shotgun -> scar
        const stances = ['scar', 'shield', 'shotgun'];
        const currentIndex = stances.indexOf(this.currentStance);
        this.currentStance = stances[(currentIndex + 1) % stances.length];

        this.lastStanceSwitch = now;

        // Reset ammo and reload
        const newStance = this.config.stances[this.currentStance];
        this.maxAmmo = newStance.maxAmmo;
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;

        // Apply new stance stats
        this.applyStanceStats();

        // Update sprite
        this.updateSprite();

        console.log(`🔄 Switched to ${this.currentStance.toUpperCase()} - Ammo: ${this.currentAmmo}/${this.maxAmmo}`);
        this.updateAmmoUI();
    }

    applyStanceStats() {
        const stance = this.config.stances[this.currentStance];

        // Update movement speed
        if (this.player.stats) {
            this.player.stats.moveSpeed = stance.moveSpeed;
        }

        // Apply/remove shield defense bonus
        if (this.currentStance === 'shield') {
            if (this.player.stats) {
                this.player.stats.armor = (this.player.stats.armor || 0) + stance.defenseBonus;
            }
        } else {
            // Remove shield bonus if switching away from shield
            if (this.player.stats && this.previousStance === 'shield') {
                const prevStance = this.config.stances.shield;
                this.player.stats.armor = (this.player.stats.armor || 0) - prevStance.defenseBonus;
            }
        }

        this.previousStance = this.currentStance;
    }

    updateSprite() {
        if (!this.player.spriteRenderer) return;

        // Call the PlayerSprite's switchStance method to update the visual sprite
        if (this.player.spriteRenderer.switchStance) {
            this.player.spriteRenderer.switchStance(this.currentStance);
        } else {
            console.warn('⚠️ PlayerSprite does not have switchStance method');
        }
    }

    startReload() {
        if (this.isReloading) return;

        // Stop out of ammo vibration when reload starts
        this.stopOutOfAmmoVibration();

        this.isReloading = true;
        this.reloadStartTime = Date.now();

        // Play reload animation
        const reloadAnimKey = `bastion_${this.currentStance}_recharge`;
        if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
            if (this.scene.anims.exists(reloadAnimKey)) {
                this.player.spriteRenderer.sprite.play(reloadAnimKey, true);
                console.log(`🎬 Playing reload animation: ${reloadAnimKey}`);
            } else {
                console.warn(`⚠️ Reload animation not found: ${reloadAnimKey}`);
            }
        }

        const stance = this.config.stances[this.currentStance];
        console.log(`🔄 Reloading ${this.currentStance.toUpperCase()}... (${stance.reloadTime}ms) - Started at ${this.reloadStartTime}`);
        this.updateAmmoUI();
    }

    finishReload() {
        this.isReloading = false;
        this.currentAmmo = this.maxAmmo;
        const finishTime = Date.now();
        const reloadDuration = finishTime - this.reloadStartTime;
        console.log(`✅ ${this.currentStance.toUpperCase()} reloaded! Ammo: ${this.currentAmmo}/${this.maxAmmo} (took ${reloadDuration}ms)`);

        // Return to idle animation
        const idleAnimKey = `bastion_${this.currentStance}_idle`;
        if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
            if (this.scene.anims.exists(idleAnimKey)) {
                this.player.spriteRenderer.sprite.play(idleAnimKey, true);
                console.log(`🎬 Returning to idle animation: ${idleAnimKey}`);
            }
        }

        this.updateAmmoUI();

        // Vibrate controller to indicate reload complete
        if (this.scene.controllerManager) {
            this.scene.controllerManager.vibrateMedium();
        }
    }

    updateAmmoUI() {
        // TODO: Create ammo display UI
        // For now, just log to console
    }

    playWeaponSound() {
        if (!this.scene.sound) return;

        let soundKey;
        let volume = 0.3; // Default volume

        // Select sound based on current stance
        switch (this.currentStance) {
            case 'scar':
                soundKey = 'bastion_scar';
                volume = 0.25; // SCAR is a bit quieter (rapid fire)
                break;
            case 'shield':
                soundKey = 'bastion_pistol';
                volume = 0.3; // Pistol medium volume
                break;
            case 'shotgun':
                soundKey = 'bastion_shotgun';
                volume = 0.4; // Shotgun is louder
                break;
        }

        // Play the sound
        if (soundKey) {
            this.scene.sound.play(soundKey, { volume: volume });
        }
    }

    broadcastAttack(attackData) {
        // Broadcast Bastion attack to other players via network
        if (window.networkManager && window.networkManager.connected) {
            window.networkManager.socket.emit('bastion:attack', {
                stance: attackData.stance,
                angle: attackData.angle,
                position: attackData.position,
                isManual: attackData.isManual
            });
            console.log(`📡 Broadcasting Bastion ${attackData.stance} attack at angle ${attackData.angle.toFixed(2)}`);
        }
    }

    useQ() {
        // Manual reload
        if (!this.isReloading && this.currentAmmo < this.maxAmmo) {
            this.startReload();
        } else if (this.currentAmmo >= this.maxAmmo) {
            console.log('⚠️ Magazine already full!');
        }
    }

    useE() {
        this.switchStance();
    }

    useAbility(abilityKey) {
        if (abilityKey === 'q') {
            this.useQ();
        } else if (abilityKey === 'e') {
            this.switchStance();
        }
    }

    startOutOfAmmoVibration() {
        // Clear any existing vibration interval
        this.stopOutOfAmmoVibration();

        // Start pulsing vibration (300ms on, 300ms off)
        let isVibrating = false;
        this.outOfAmmoVibrationInterval = setInterval(() => {
            if (!isVibrating && this.scene.controllerManager) {
                this.scene.controllerManager.vibrateLight();
                isVibrating = true;
            } else {
                isVibrating = false;
            }
        }, 300);

        console.log('🎮 Out of ammo - controller vibrating');
    }

    stopOutOfAmmoVibration() {
        if (this.outOfAmmoVibrationInterval) {
            clearInterval(this.outOfAmmoVibrationInterval);
            this.outOfAmmoVibrationInterval = null;
            console.log('🎮 Stopped out of ammo vibration');
        }
    }

    destroy() {
        // Stop out of ammo vibration
        this.stopOutOfAmmoVibration();

        // Clean up projectiles
        this.projectiles.forEach(proj => {
            if (proj.sprite) proj.sprite.destroy();
        });
        this.projectiles = [];

        // Remove shield defense bonus if equipped
        if (this.currentStance === 'shield' && this.player.stats) {
            const stance = this.config.stances.shield;
            this.player.stats.armor = (this.player.stats.armor || 0) - stance.defenseBonus;
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BastionAbilityHandler = BastionAbilityHandler;
}
