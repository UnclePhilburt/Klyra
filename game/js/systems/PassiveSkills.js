// PassiveSkills - Manages passive skills and their visual effects
class PassiveSkills {
    constructor(scene, player = null) {
        this.scene = scene;
        this.player = player; // Player object (local or remote)
        this.ownedSkills = new Set(); // Skills the player owns
        this.activeEffects = {}; // Active visual effects for skills
    }

    hasSkill(skillId) {
        return this.ownedSkills.has(skillId);
    }

    addSkill(skillId, isLocalPlayer = true) {
        if (this.ownedSkills.has(skillId)) {
            console.log('⚠️ Already own skill:', skillId);
            return false;
        }

        this.ownedSkills.add(skillId);
        this.activateSkill(skillId);

        // Add to HUD display (only for local player)
        if (isLocalPlayer && this.scene.modernHUD) {
            const skillName = this.getSkillName(skillId);
            this.scene.modernHUD.addSkillToDisplay(skillId, skillName);
        }

        console.log('✅ Skill added and activated:', skillId);
        return true;
    }

    getSkillName(skillId) {
        const skillNames = {
            'orbital_shield': "Chad's Shield",
            'fireball_rain': "Meteor Storm",
            'damage_aura': "Burning Aura",
            'piercing_fireball': "Piercing Inferno"
        };
        return skillNames[skillId] || skillId;
    }

    activateSkill(skillId) {
        switch(skillId) {
            case 'orbital_shield':
                this.activateOrbitalShield();
                break;
            case 'fireball_rain':
                this.activateFireballRain();
                break;
            case 'damage_aura':
                this.activateDamageAura();
                break;
            case 'piercing_fireball':
                this.activatePiercingFireball();
                break;
            default:
                console.warn('Unknown skill:', skillId);
        }
    }

    activateOrbitalShield() {
        // Create orbiting shield sprite
        const orbitRadius = 90; // pixels from player center (increased from 60)
        const orbitSpeed = 4; // seconds for one full rotation (increased from 2)
        const rotationSpeed = -0.03; // radians per frame for shield rotation (negative = counter-clockwise)

        // Create the orbiting sprite using Chad's Shield image
        const orbSprite = this.scene.add.sprite(0, 0, 'chads_shield');
        orbSprite.setDepth(4); // Just below player depth (5)
        orbSprite.setScale(1.5); // Increased from 1 to 1.5 (50% bigger)

        this.activeEffects.orbital_shield = {
            sprite: orbSprite,
            radius: orbitRadius,
            angle: 0,
            speed: (Math.PI * 2) / (orbitSpeed * 60), // positive = clockwise orbit
            rotationSpeed: rotationSpeed,
            damage: 10,
            hitCooldowns: new Map() // Track when each enemy was last hit
        };

        console.log("🛡️ Chad's Shield activated!");
    }

    activateFireballRain() {
        // Configure fireball rain effect
        const attackInterval = 2000; // Attack every 2 seconds
        const range = 400; // pixels from player
        const damage = 15;
        const fireballsPerAttack = 3; // Number of fireballs per wave

        this.activeEffects.fireball_rain = {
            interval: attackInterval,
            range: range,
            damage: damage,
            fireballsPerAttack: fireballsPerAttack,
            lastAttackTime: 0
        };

        console.log("🔥 Meteor Storm activated!");
    }

    activateDamageAura() {
        // Configure damage aura effect
        const auraRadius = 150; // pixels from player
        const damagePerSecond = 5;
        const tickRate = 500; // Damage every 500ms (0.5 seconds)
        const damagePerTick = (damagePerSecond * tickRate) / 1000; // 2.5 damage per tick

        // Create visual aura sprite using animated sprite sheet
        const auraSprite = this.scene.add.sprite(0, 0, 'burningaura');
        auraSprite.setScale(5); // Scale up the 64x64 sprite to cover ~150px radius (64 * 5 = 320px diameter)
        auraSprite.setDepth(3); // Below player (depth 5)
        auraSprite.setAlpha(0.25); // Very transparent so enemies are visible

        // Play the pulsing animation
        auraSprite.play('burningaura_pulse');

        this.activeEffects.damage_aura = {
            sprite: auraSprite,
            radius: auraRadius,
            damagePerTick: damagePerTick,
            tickRate: tickRate,
            lastTickTime: 0,
            hitCooldowns: new Map() // Track when each enemy was last hit
        };

        // Add gentle pulsing scale animation on top of the frame animation
        this.scene.tweens.add({
            targets: auraSprite,
            scaleX: 5.2,
            scaleY: 5.2,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        console.log("🔥 Burning Aura activated!");
    }

    activatePiercingFireball() {
        // Configure piercing fireball effect
        const attackInterval = 3000; // Attack every 3 seconds
        const range = 500; // Look for enemies within 500 pixels
        const damage = 12;
        const maxPierces = 3; // Can hit up to 3 enemies

        this.activeEffects.piercing_fireball = {
            interval: attackInterval,
            range: range,
            damage: damage,
            maxPierces: maxPierces,
            lastAttackTime: 0
        };

        console.log("🔥 Piercing Inferno activated!");
    }

    update(playerX, playerY, isLocalPlayer = true) {
        // Update orbital shield position and check for enemy collisions
        if (this.activeEffects.orbital_shield) {
            const effect = this.activeEffects.orbital_shield;

            // Debug log occasionally
            if (Math.random() < 0.001) {
                console.log(`🛡️ Shield update - Player: (${playerX}, ${playerY}), Shield angle: ${effect.angle.toFixed(2)}`);
            }

            // Update angle
            effect.angle += effect.speed;
            if (effect.angle > Math.PI * 2) {
                effect.angle -= Math.PI * 2;
            }

            // Calculate position in orbit
            const x = playerX + Math.cos(effect.angle) * effect.radius;
            const y = playerY + Math.sin(effect.angle) * effect.radius;

            effect.sprite.setPosition(x, y);

            // Rotate the shield sprite
            effect.sprite.rotation += effect.rotationSpeed;

            // Check collision with enemies (only for local player to avoid duplicate damage)
            if (isLocalPlayer) {
                this.checkShieldCollisions(effect, x, y);
            }
        }

        // Update fireball rain
        if (this.activeEffects.fireball_rain) {
            const effect = this.activeEffects.fireball_rain;
            const currentTime = Date.now();

            // Check if it's time to attack
            if (currentTime - effect.lastAttackTime >= effect.interval) {
                effect.lastAttackTime = currentTime;
                this.spawnFireballRain(playerX, playerY, effect, isLocalPlayer);
            }
        }

        // Update damage aura
        if (this.activeEffects.damage_aura) {
            const effect = this.activeEffects.damage_aura;

            // Keep aura centered on player
            effect.sprite.setPosition(playerX, playerY);

            // Check for damage tick (only for local player)
            if (isLocalPlayer) {
                const currentTime = Date.now();
                if (currentTime - effect.lastTickTime >= effect.tickRate) {
                    effect.lastTickTime = currentTime;
                    this.checkAuraDamage(effect, playerX, playerY);
                }
            }
        }

        // Update piercing fireball
        if (this.activeEffects.piercing_fireball) {
            const effect = this.activeEffects.piercing_fireball;
            const currentTime = Date.now();

            // Check if it's time to shoot (only for local player to avoid duplicate damage)
            if (isLocalPlayer && currentTime - effect.lastAttackTime >= effect.interval) {
                effect.lastAttackTime = currentTime;
                this.shootPiercingFireball(playerX, playerY, effect);
            }
        }
    }

    shootPiercingFireball(playerX, playerY, effect) {
        // Get all enemies within range
        const allEnemies = [];

        if (this.scene.swordDemons) {
            allEnemies.push(...Object.values(this.scene.swordDemons));
        }
        if (this.scene.minotaurs) {
            allEnemies.push(...Object.values(this.scene.minotaurs));
        }
        if (this.scene.mushrooms) {
            allEnemies.push(...Object.values(this.scene.mushrooms));
        }
        if (this.scene.emberclaws) {
            allEnemies.push(...Object.values(this.scene.emberclaws));
        }

        // Filter enemies within range and alive
        const enemiesInRange = allEnemies.filter(enemy => {
            if (!enemy || !enemy.sprite || !enemy.isAlive) return false;

            const dist = Phaser.Math.Distance.Between(
                playerX, playerY,
                enemy.sprite.x, enemy.sprite.y
            );

            return dist <= effect.range;
        });

        if (enemiesInRange.length === 0) {
            console.log('🔥 No enemies in range for Piercing Inferno');
            return;
        }

        // Pick random enemy as target
        const target = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];

        console.log(`🔥 Piercing Inferno launching at enemy`);

        // Create piercing fireball projectile
        this.createPiercingFireballProjectile(playerX, playerY, target, effect);
    }

    createPiercingFireballProjectile(startX, startY, initialTarget, effect) {
        // Calculate direction to target first
        const targetX = initialTarget.sprite.x;
        const targetY = initialTarget.sprite.y;
        const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);

        // Create fireball sprite with animation
        const fireball = this.scene.add.sprite(startX, startY, 'piercingflame');
        fireball.setScale(0.8); // Larger scale
        fireball.setDepth(10000);
        fireball.setRotation(angle); // Rotate to face direction of travel
        fireball.play('piercingflame_shoot');

        // No glow - just the sprite
        const glow = null;

        // Add trail (smaller)
        const trail = this.scene.add.circle(startX, startY, 10, 0xff8800, 0.5);
        trail.setDepth(9998);

        // Travel distance (go far past the target)
        const travelDistance = 1000;
        const endX = startX + Math.cos(angle) * travelDistance;
        const endY = startY + Math.sin(angle) * travelDistance;

        // Track pierced enemies
        const piercedEnemies = [];
        let pierceCount = 0;

        // Move fireball in straight line
        const duration = travelDistance / 0.3; // Speed: 0.3 pixels per ms

        this.scene.tweens.add({
            targets: [fireball, trail],
            x: endX,
            y: endY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                // Check if objects are still valid
                if (!fireball.active || !trail.active) {
                    return;
                }

                // Check if fireball should be destroyed
                if (fireball.shouldDestroy) {
                    fireball.destroy();
                    trail.destroy();
                    return;
                }

                // Keep trail behind fireball
                trail.x = fireball.x - Math.cos(angle) * 12;
                trail.y = fireball.y - Math.sin(angle) * 12;

                // Check for collisions with enemies (only if we haven't maxed out yet)
                if (pierceCount >= effect.maxPierces) {
                    // Max pierces reached, mark for destruction
                    fireball.shouldDestroy = true;
                    return;
                }

                // Get all enemies
                const allEnemies = [];
                if (this.scene.swordDemons) allEnemies.push(...Object.values(this.scene.swordDemons));
                if (this.scene.minotaurs) allEnemies.push(...Object.values(this.scene.minotaurs));
                if (this.scene.mushrooms) allEnemies.push(...Object.values(this.scene.mushrooms));
                if (this.scene.emberclaws) allEnemies.push(...Object.values(this.scene.emberclaws));

                // Check collision with each enemy
                allEnemies.forEach(enemy => {
                    if (!enemy || !enemy.sprite || !enemy.isAlive) return;

                    const enemyId = enemy.data?.id || enemy.id;
                    if (piercedEnemies.includes(enemyId)) return; // Already hit

                    // Check distance to fireball
                    const dist = Phaser.Math.Distance.Between(
                        fireball.x, fireball.y,
                        enemy.sprite.x, enemy.sprite.y
                    );

                    // Collision radius (fireball + enemy hitbox)
                    if (dist < 25) {
                        // Hit!
                        piercedEnemies.push(enemyId);
                        pierceCount++;
                        this.damageEnemy(enemyId, effect.damage);

                        // Create hit effect
                        const hitEffect = this.scene.add.circle(enemy.sprite.x, enemy.sprite.y, 15, 0xff4400, 0.8);
                        hitEffect.setDepth(10001);
                        this.scene.tweens.add({
                            targets: hitEffect,
                            scaleX: 2,
                            scaleY: 2,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => hitEffect.destroy()
                        });

                        console.log(`💥 Piercing fireball hit enemy ${enemyId} (pierce ${pierceCount}/${effect.maxPierces})`);
                    }
                });
            },
            onComplete: () => {
                // Destroy fireball when it reaches end (check if still active)
                if (fireball.active) fireball.destroy();
                if (trail.active) trail.destroy();
            }
        });
    }

    checkAuraDamage(effect, playerX, playerY) {
        // Get all enemies within aura range
        const allEnemies = [];

        if (this.scene.swordDemons) {
            allEnemies.push(...Object.values(this.scene.swordDemons));
        }
        if (this.scene.minotaurs) {
            allEnemies.push(...Object.values(this.scene.minotaurs));
        }
        if (this.scene.mushrooms) {
            allEnemies.push(...Object.values(this.scene.mushrooms));
        }
        if (this.scene.emberclaws) {
            allEnemies.push(...Object.values(this.scene.emberclaws));
        }

        let enemiesHit = 0;

        // Check each enemy
        allEnemies.forEach(enemy => {
            if (!enemy || !enemy.sprite || !enemy.isAlive) return;

            // Calculate distance between player and enemy
            const dist = Phaser.Math.Distance.Between(
                playerX, playerY,
                enemy.sprite.x, enemy.sprite.y
            );

            // If enemy is within aura radius
            if (dist < effect.radius) {
                const enemyId = enemy.data?.id || enemy.id;

                // Damage the enemy
                this.damageEnemy(enemyId, effect.damagePerTick);
                enemiesHit++;

                // Visual feedback - small flame puff on enemy
                if (Math.random() < 0.3) { // 30% chance for visual effect per tick
                    const flamePuff = this.scene.add.circle(
                        enemy.sprite.x + (Math.random() - 0.5) * 20,
                        enemy.sprite.y + (Math.random() - 0.5) * 20,
                        8,
                        0xff6600,
                        0.6
                    );
                    flamePuff.setDepth(9000);

                    this.scene.tweens.add({
                        targets: flamePuff,
                        y: flamePuff.y - 30,
                        alpha: 0,
                        scale: 1.5,
                        duration: 800,
                        ease: 'Cubic.easeOut',
                        onComplete: () => flamePuff.destroy()
                    });
                }
            }
        });

        // Debug log occasionally
        if (enemiesHit > 0 && Math.random() < 0.1) {
            console.log(`🔥 Burning Aura damaged ${enemiesHit} enemies`);
        }
    }

    spawnFireballRain(playerX, playerY, effect, isLocalPlayer = true) {
        // Get all enemies within range
        const allEnemies = [];

        if (this.scene.swordDemons) {
            allEnemies.push(...Object.values(this.scene.swordDemons));
        }
        if (this.scene.minotaurs) {
            allEnemies.push(...Object.values(this.scene.minotaurs));
        }
        if (this.scene.mushrooms) {
            allEnemies.push(...Object.values(this.scene.mushrooms));
        }
        if (this.scene.emberclaws) {
            allEnemies.push(...Object.values(this.scene.emberclaws));
        }

        // Filter enemies within range
        const enemiesInRange = allEnemies.filter(enemy => {
            if (!enemy || !enemy.sprite || !enemy.isAlive) return false;

            const dist = Phaser.Math.Distance.Between(
                playerX, playerY,
                enemy.sprite.x, enemy.sprite.y
            );

            return dist <= effect.range;
        });

        if (enemiesInRange.length === 0) {
            // Only log for local player to avoid spam
            if (isLocalPlayer) {
                console.log('🔥 No enemies in range for Meteor Storm');
            }
            return;
        }

        // Randomly select enemies to hit (up to fireballsPerAttack)
        const numFireballs = Math.min(effect.fireballsPerAttack, enemiesInRange.length);
        const shuffled = [...enemiesInRange].sort(() => Math.random() - 0.5);
        const targets = shuffled.slice(0, numFireballs);

        if (isLocalPlayer) {
            console.log(`🔥 Meteor Storm targeting ${targets.length} enemies`);
        }

        // Spawn fireball for each target
        targets.forEach((enemy, index) => {
            // Stagger the fireballs slightly
            this.scene.time.delayedCall(index * 150, () => {
                this.spawnFireball(enemy, effect.damage, isLocalPlayer);
            });
        });
    }

    spawnFireball(targetEnemy, damage, isLocalPlayer = true) {
        if (!targetEnemy || !targetEnemy.sprite || !targetEnemy.isAlive) return;

        const targetX = targetEnemy.sprite.x;
        const targetY = targetEnemy.sprite.y;

        // Starting position (high above target)
        const startX = targetX + (Math.random() - 0.5) * 100; // Random offset
        const startY = targetY - 400; // Start 400 pixels above

        // Create meteor sprite with animation
        const meteor = this.scene.add.sprite(startX, startY, 'meteorstorm');
        meteor.setScale(0.3); // Start small when falling
        meteor.setDepth(10000); // Very high depth to appear above everything

        // Play falling animation
        meteor.play('meteorstorm_fall');

        // Add glow effect behind the meteor (smaller initially)
        const glow = this.scene.add.circle(startX, startY, 12, 0xff6600, 0.4);
        glow.setDepth(9999);

        // Add trail effect (smaller initially)
        const trail = this.scene.add.circle(startX, startY, 8, 0xff8800, 0.6);
        trail.setDepth(9998);

        // Rotate meteor as it falls
        const rotationSpeed = (Math.random() - 0.5) * 0.3; // Random rotation

        // Animate meteor falling
        const fallDuration = 600; // 600ms to fall

        this.scene.tweens.add({
            targets: [meteor, glow, trail],
            x: targetX,
            y: targetY,
            duration: fallDuration,
            ease: 'Cubic.easeIn',
            onUpdate: () => {
                // Rotate meteor as it falls
                meteor.rotation += rotationSpeed;

                // Gradually scale up the meteor as it approaches (perspective effect)
                const progress = this.scene.tweens.getTweens().find(t => t.targets.includes(meteor))?.progress || 0;
                meteor.setScale(0.3 + (progress * 0.4)); // Scale from 0.3 to 0.7 during fall

                // Update trail to follow meteor (scale with meteor)
                trail.x = meteor.x;
                trail.y = meteor.y - 15;
                trail.radius = 8 + (progress * 12); // Scale from 8 to 20

                // Update glow position (scale with meteor)
                glow.x = meteor.x;
                glow.y = meteor.y;
                glow.radius = 12 + (progress * 23); // Scale from 12 to 35
            },
            onComplete: () => {
                // Destroy falling visuals
                meteor.destroy();
                glow.destroy();
                trail.destroy();

                // Create impact crater with larger meteor sprite
                this.createFireballImpact(targetX, targetY);

                // Only deal damage if this is the local player (avoid duplicate damage)
                if (isLocalPlayer) {
                    const enemyId = targetEnemy.data?.id || targetEnemy.id;
                    this.damageEnemy(enemyId, damage);
                    console.log(`💥 Meteor hit enemy ${enemyId} for ${damage} damage`);
                }
            }
        });
    }

    createFireballImpact(x, y) {
        // Create larger meteor sprite on impact (crater effect)
        const impactMeteor = this.scene.add.sprite(x, y, 'meteorstorm');
        impactMeteor.setScale(1.5); // Much bigger on impact
        impactMeteor.setDepth(10003); // Highest depth - on top of everything
        impactMeteor.setFrame(9); // Use last frame of animation (most "impacted" looking)
        impactMeteor.setAlpha(1.0); // Full opacity

        // Fade out the impact crater
        this.scene.tweens.add({
            targets: impactMeteor,
            alpha: 0,
            scale: 1.8, // Expand slightly as it fades
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => impactMeteor.destroy()
        });

        // Create explosion glow behind the sprite
        const explosion = this.scene.add.circle(x, y, 30, 0xff4400, 0.5);
        explosion.setDepth(9998); // Behind the meteor sprite

        this.scene.tweens.add({
            targets: explosion,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => explosion.destroy()
        });

        // Add ring effect behind sprite
        const ring = this.scene.add.circle(x, y, 20, 0xff6600, 0);
        ring.setStrokeStyle(4, 0xff4400);
        ring.setDepth(9999); // Behind the meteor sprite

        this.scene.tweens.add({
            targets: ring,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });

        // Add secondary shockwave ring behind sprite
        const shockwave = this.scene.add.circle(x, y, 15, 0xffaa00, 0);
        shockwave.setStrokeStyle(3, 0xff6600);
        shockwave.setDepth(9997); // Behind everything

        this.scene.tweens.add({
            targets: shockwave,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 700,
            ease: 'Cubic.easeOut',
            delay: 100,
            onComplete: () => shockwave.destroy()
        });
    }

    checkShieldCollisions(effect, shieldX, shieldY) {
        const currentTime = Date.now();
        const hitCooldown = 500; // 500ms cooldown between hits on same enemy
        const collisionRadius = 32; // Shield collision radius (increased for better hit detection)

        // Collect all enemy types from the scene
        const allEnemies = [];

        if (this.scene.swordDemons) {
            allEnemies.push(...Object.values(this.scene.swordDemons));
        }
        if (this.scene.minotaurs) {
            allEnemies.push(...Object.values(this.scene.minotaurs));
        }
        if (this.scene.mushrooms) {
            allEnemies.push(...Object.values(this.scene.mushrooms));
        }
        if (this.scene.emberclaws) {
            allEnemies.push(...Object.values(this.scene.emberclaws));
        }

        // Debug log occasionally
        if (Math.random() < 0.01) {
            console.log(`🛡️ Checking shield collisions. Total enemies: ${allEnemies.length}`);
            console.log(`   Shield position: (${shieldX.toFixed(1)}, ${shieldY.toFixed(1)})`);
            if (allEnemies.length > 0) {
                const firstEnemy = allEnemies[0];
                console.log(`   First enemy: ${firstEnemy.id} at (${firstEnemy.sprite?.x?.toFixed(1)}, ${firstEnemy.sprite?.y?.toFixed(1)})`);
            }
        }

        // Check collisions with all enemies
        allEnemies.forEach(enemy => {
            if (!enemy || !enemy.sprite || !enemy.isAlive) return;

            // Calculate distance between shield and enemy
            const dist = Phaser.Math.Distance.Between(
                shieldX, shieldY,
                enemy.sprite.x, enemy.sprite.y
            );

            // Check if collision occurred
            if (dist < collisionRadius + 16) { // 16 = approximate enemy radius
                // Get enemy ID from data object
                const enemyId = enemy.data?.id || enemy.id;
                console.log(`💥 Shield collision detected! Enemy: ${enemyId}, Distance: ${dist.toFixed(2)}`);
                const lastHit = effect.hitCooldowns.get(enemyId) || 0;

                // Only damage if cooldown has passed
                if (currentTime - lastHit > hitCooldown) {
                    console.log(`⚔️ Attempting to damage enemy ${enemyId}`);
                    // Damage the enemy
                    this.damageEnemy(enemyId, effect.damage);
                    effect.hitCooldowns.set(enemyId, currentTime);
                } else {
                    console.log(`⏱️ Enemy ${enemyId} on cooldown. Last hit: ${currentTime - lastHit}ms ago`);
                }
            }
        });

        // Clean up old cooldown entries (enemies that no longer exist)
        if (effect.hitCooldowns.size > 50) {
            effect.hitCooldowns.clear();
        }
    }

    damageEnemy(enemyId, damage) {
        console.log(`🎯 damageEnemy called for enemy ${enemyId}`);
        console.log(`   NetworkManager exists: ${!!window.networkManager}`);
        console.log(`   NetworkManager connected: ${window.networkManager?.connected}`);
        console.log(`   Scene localPlayer: ${!!this.scene.localPlayer}`);

        // Request damage through network manager (multiplayer safe)
        if (window.networkManager && window.networkManager.connected) {
            // Get player ID from network manager
            const playerId = window.networkManager.currentPlayer?.id;

            // Use hitEnemy method with player position
            const playerPos = this.scene.localPlayer ? {
                x: this.scene.localPlayer.sprite.x,
                y: this.scene.localPlayer.sprite.y
            } : null;

            console.log(`   Calling hitEnemy with:`, {
                enemyId: enemyId,
                damage: damage,
                playerId: playerId,
                playerPos: playerPos
            });

            window.networkManager.hitEnemy(
                enemyId,
                damage,
                playerId,
                playerPos
            );
            console.log(`✅ Chad's Shield hit enemy ${enemyId} for ${damage} damage`);
        } else {
            console.log(`❌ Cannot damage enemy - NetworkManager not ready`);
        }
    }

    getOwnedSkillsList() {
        return Array.from(this.ownedSkills);
    }

    destroy() {
        // Clean up all active effects
        Object.values(this.activeEffects).forEach(effect => {
            if (effect.sprite) {
                effect.sprite.destroy();
            }
        });
        this.activeEffects = {};
        this.ownedSkills.clear();
    }
}
