// Aldric Ability Handler - Implements all Aldric Q/E/R abilities
class AldricAbilityHandler {
    constructor(scene, player, abilityManager) {
        this.scene = scene;
        this.player = player;
        this.abilityManager = abilityManager;
    }

    // Use Q ability - Battle Rush
    useQ(ability) {
        console.log(`⚔️ Using Battle Rush`);
        console.log(`   Ability data:`, ability);
        this.useBattleRush(ability);
        return true;
    }

    // Use E ability - Shockwave
    useE(ability) {
        console.log(`⚔️ Using Shockwave`);
        console.log(`   AbilityManager exists:`, !!this.abilityManager);
        console.log(`   createShockwave exists:`, typeof this.abilityManager?.createShockwave);

        // Use existing createShockwave from AbilityManager
        if (this.abilityManager && typeof this.abilityManager.createShockwave === 'function') {
            console.log(`✅ Calling createShockwave()`);
            this.abilityManager.createShockwave();
        } else {
            console.error('❌ createShockwave not found in AbilityManager');
        }
        return true;
    }

    // Use R ability - Titan's Fury
    useR(ability) {
        console.log(`⚔️ Using Titan's Fury`);
        // Use existing createTitansFury from AbilityManager
        if (this.abilityManager && typeof this.abilityManager.createTitansFury === 'function') {
            this.abilityManager.createTitansFury(ability.effect);
        } else {
            console.error('❌ createTitansFury not found in AbilityManager');
        }
        return true;
    }

    // Battle Rush - Dash forward with invincibility
    useBattleRush(ability) {
        const effect = ability.effect;
        const dashDistance = effect.distance || 200;
        const damage = effect.damage || 40;
        const iframesDuration = effect.iframesDuration || 300;

        console.log(`🏃 Battle Rush - Dashing ${dashDistance}px`);

        // Get player's facing direction
        const facingRight = this.player.spriteRenderer && this.player.spriteRenderer.sprite
            ? !this.player.spriteRenderer.sprite.flipX
            : true;
        const direction = facingRight ? 1 : -1;

        const startX = this.player.sprite.x;
        const startY = this.player.sprite.y;
        const endX = startX + (direction * dashDistance);

        // Grant brief invincibility
        this.player.isInvincible = true;
        this.player.isDashing = true; // Flag to prevent animation override
        this.player.sprite.setAlpha(0.5); // Visual feedback for invincibility

        // Play running attack animation
        if (this.player.spriteRenderer && this.player.spriteRenderer.sprite) {
            const runAttackKey = 'aldric_run_attack';
            if (this.scene.anims.exists(runAttackKey)) {
                console.log('🎬 Playing aldric_run_attack animation');
                this.player.spriteRenderer.sprite.stop();
                this.player.spriteRenderer.sprite.play(runAttackKey, true);
            } else {
                console.warn('⚠️ Animation aldric_run_attack does not exist!');
            }
        }

        // Create dash trail particles
        const trailInterval = this.scene.time.addEvent({
            delay: 30,
            repeat: 8,
            callback: () => {
                const trail = this.scene.add.circle(
                    this.player.sprite.x,
                    this.player.sprite.y,
                    8,
                    0x4169E1,
                    0.6
                );
                trail.setDepth(this.player.sprite.depth - 1);

                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 1.5,
                    duration: 400,
                    onComplete: () => trail.destroy()
                });
            }
        });

        // Dash forward
        this.scene.tweens.add({
            targets: this.player.sprite,
            x: endX,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Restore normal appearance
                this.player.sprite.setAlpha(1);
                this.player.isDashing = false;

                // Remove invincibility after delay
                this.scene.time.delayedCall(iframesDuration, () => {
                    this.player.isInvincible = false;
                });
            }
        });

        // Play sound effect
        if (this.scene.sound && this.scene.sound.get('hit_punch_1')) {
            this.scene.sound.play('hit_punch_1', { volume: 0.4 });
        }

        console.log('✅ Battle Rush created');
    }
}
