// RedPandaManager - Handles the Red Panda pet behavior and animations
class RedPandaManager {
    constructor(scene, player, petManager) {
        this.scene = scene;
        this.player = player;
        this.petManager = petManager;
        this.petType = 'red_panda';

        // Behavior states
        this.states = {
            FOLLOWING: 'following',
            IDLE: 'idle',
            PLAYING: 'playing',
            SLEEPING: 'sleeping',
            COLLECTING: 'collecting'
        };
        this.currentState = this.states.IDLE;

        // Orb collection
        this.orbCollectionRadius = 300; // Radius to detect orbs
        this.targetOrb = null;

        // Animation tracking
        this.currentIdleVariant = 1; // 1 or 2

        // Position and movement
        this.targetX = player.sprite.x;
        this.targetY = player.sprite.y;
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting angle
        this.orbitRadius = 40; // Distance from player

        // Remote pet synchronization (for other players' pets)
        this.remoteTargetX = null;
        this.remoteTargetY = null;
        this.remoteState = null;

        // Timing
        this.stateTimer = 0;
        this.nextStateChange = this.getRandomTime(3000, 6000);
        this.sleepThreshold = this.getRandomTime(5000, 10000); // 5-10 seconds
        this.playChance = 0.15; // 15% chance to play

        // Movement smoothing
        this.moveSpeed = 100; // Pixels per second
        this.remoteMoveSpeed = 200; // Faster speed for remote pets to catch up

        // Create sprite
        this.createSprite();

        console.log('🦊 Red Panda spawned!');
    }

    /**
     * Create the red panda sprite and animations
     */
    createSprite() {
        // Spawn near player
        this.sprite = this.scene.add.sprite(
            this.player.sprite.x + 40,
            this.player.sprite.y,
            'red_panda'
        );
        this.sprite.setScale(2.0); // Make red panda bigger
        this.sprite.setDepth(this.player.sprite.depth - 1); // Behind player slightly

        // Create animations if they don't exist
        this.createAnimations();

        // Start with idle1
        this.sprite.play('red_panda_idle1');
    }

    /**
     * Create all red panda animations
     */
    createAnimations() {
        const anims = this.scene.anims;

        // Idle 1 (tiles 0-5)
        if (!anims.exists('red_panda_idle1')) {
            anims.create({
                key: 'red_panda_idle1',
                frames: anims.generateFrameNumbers('red_panda', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Idle 2 (tiles 8-13)
        if (!anims.exists('red_panda_idle2')) {
            anims.create({
                key: 'red_panda_idle2',
                frames: anims.generateFrameNumbers('red_panda', { start: 8, end: 13 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Move (tiles 16-23)
        if (!anims.exists('red_panda_move')) {
            anims.create({
                key: 'red_panda_move',
                frames: anims.generateFrameNumbers('red_panda', { start: 16, end: 23 }),
                frameRate: 12,
                repeat: -1
            });
        }

        // Play (tiles 24-31)
        if (!anims.exists('red_panda_play')) {
            anims.create({
                key: 'red_panda_play',
                frames: anims.generateFrameNumbers('red_panda', { start: 24, end: 31 }),
                frameRate: 10,
                repeat: 0 // Play once
            });
        }

        // Sleep (tiles 48-55)
        if (!anims.exists('red_panda_sleep')) {
            anims.create({
                key: 'red_panda_sleep',
                frames: anims.generateFrameNumbers('red_panda', { start: 48, end: 55 }),
                frameRate: 6,
                repeat: -1
            });
        }
    }

    /**
     * Main update loop
     */
    update(time, delta) {
        if (!this.sprite || !this.player || !this.player.sprite) return;

        // Check if this is a remote pet (controlled by network updates)
        const isRemote = this.petManager && this.petManager.isRemote;

        if (isRemote) {
            // Remote pets: use network position data
            this.updateRemotePosition(delta);
        } else {
            // Local pet: run full behavior simulation
            // Update state timer
            this.stateTimer += delta;

            // Update behavior based on current state
            this.updateBehavior(delta);

            // Update position
            this.updatePosition(delta);
        }
    }

    /**
     * Update remote pet position (interpolate to network position)
     */
    updateRemotePosition(delta) {
        const deltaSeconds = delta / 1000;

        // If we have a remote target, interpolate to it
        if (this.remoteTargetX !== null && this.remoteTargetY !== null) {
            const distToTarget = Phaser.Math.Distance.Between(
                this.sprite.x,
                this.sprite.y,
                this.remoteTargetX,
                this.remoteTargetY
            );

            if (distToTarget > 2) {
                // Smooth movement toward remote target
                const moveDistance = this.remoteMoveSpeed * deltaSeconds;
                const ratio = Math.min(moveDistance / distToTarget, 1);

                const newX = this.sprite.x + (this.remoteTargetX - this.sprite.x) * ratio;
                const newY = this.sprite.y + (this.remoteTargetY - this.sprite.y) * ratio;

                // Flip sprite based on movement direction
                if (this.remoteTargetX < this.sprite.x - 1) {
                    this.sprite.setFlipX(true);
                } else if (this.remoteTargetX > this.sprite.x + 1) {
                    this.sprite.setFlipX(false);
                }

                this.sprite.x = newX;
                this.sprite.y = newY;
            } else {
                // Close enough - snap to position
                this.sprite.x = this.remoteTargetX;
                this.sprite.y = this.remoteTargetY;
            }

            // Always update animation based on remote state (not just when close)
            this.updateRemoteAnimation();
        }

        // Update depth to match player
        this.sprite.setDepth(this.player.sprite.depth - 1);
    }

    /**
     * Update animation based on remote state
     */
    updateRemoteAnimation() {
        if (!this.remoteState) return;

        const targetAnim = this.getAnimationForState(this.remoteState);
        if (targetAnim && this.sprite.anims.currentAnim?.key !== targetAnim) {
            this.sprite.play(targetAnim);
        }
    }

    /**
     * Get animation key for a given state
     */
    getAnimationForState(state) {
        switch(state) {
            case 'following':
            case 'collecting':
                return 'red_panda_move';
            case 'idle':
                return `red_panda_idle${this.currentIdleVariant}`;
            case 'playing':
                return 'red_panda_play';
            case 'sleeping':
                return 'red_panda_sleep';
            default:
                return 'red_panda_idle1';
        }
    }

    /**
     * Update pet behavior state machine
     */
    updateBehavior(delta) {
        const isPlayerMoving = this.petManager.isPlayerMoving();
        const idleTime = this.petManager.getPlayerIdleTime();

        // Check for nearby orbs (priority behavior - even when sleeping!)
        if (this.currentState !== this.states.COLLECTING) {
            const nearbyOrb = this.findNearbyOrb();
            if (nearbyOrb) {
                this.targetOrb = nearbyOrb;
                this.transitionTo(this.states.COLLECTING);
                return;
            }
        }

        switch(this.currentState) {
            case this.states.FOLLOWING:
                // If player stops, transition to idle only if red panda has reached its position
                if (!isPlayerMoving) {
                    const distToTarget = Phaser.Math.Distance.Between(
                        this.sprite.x,
                        this.sprite.y,
                        this.targetX,
                        this.targetY
                    );

                    // Only transition to idle if close enough to target
                    if (distToTarget <= 5) {
                        this.transitionTo(this.states.IDLE);
                    }
                }
                break;

            case this.states.IDLE:
                // If player moves, follow them
                if (isPlayerMoving) {
                    this.transitionTo(this.states.FOLLOWING);
                    break;
                }

                // Check for sleep (player idle for 5-10 seconds)
                if (idleTime >= this.sleepThreshold) {
                    this.transitionTo(this.states.SLEEPING);
                    break;
                }

                // Switch between idle variants
                if (this.stateTimer >= this.nextStateChange) {
                    // Random chance to play
                    if (Math.random() < this.playChance) {
                        this.transitionTo(this.states.PLAYING);
                    } else {
                        // Switch idle variant
                        this.currentIdleVariant = this.currentIdleVariant === 1 ? 2 : 1;
                        this.sprite.play(`red_panda_idle${this.currentIdleVariant}`);
                        this.stateTimer = 0;
                        this.nextStateChange = this.getRandomTime(3000, 6000);
                    }
                }

                // Randomly move to new orbit position
                if (this.stateTimer % 5000 < delta) {
                    this.orbitAngle = Math.random() * Math.PI * 2;
                }
                break;

            case this.states.PLAYING:
                // Play animation is one-shot, return to idle after it completes
                if (!this.sprite.anims.isPlaying) {
                    this.transitionTo(this.states.IDLE);
                }
                break;

            case this.states.SLEEPING:
                // Wake up when player moves
                if (isPlayerMoving) {
                    this.transitionTo(this.states.FOLLOWING);
                }
                break;

            case this.states.COLLECTING:
                // Check if we've reached the orb
                if (this.targetOrb && this.targetOrb.sprite) {
                    const distToOrb = Phaser.Math.Distance.Between(
                        this.sprite.x,
                        this.sprite.y,
                        this.targetOrb.sprite.x,
                        this.targetOrb.sprite.y
                    );

                    if (distToOrb <= 15) {
                        // Collect the orb for the player
                        this.collectOrb(this.targetOrb);
                        this.targetOrb = null;

                        // Return to following or idle
                        if (isPlayerMoving) {
                            this.transitionTo(this.states.FOLLOWING);
                        } else {
                            this.transitionTo(this.states.IDLE);
                        }
                    }
                } else {
                    // Orb was destroyed or collected by someone else
                    this.targetOrb = null;
                    if (isPlayerMoving) {
                        this.transitionTo(this.states.FOLLOWING);
                    } else {
                        this.transitionTo(this.states.IDLE);
                    }
                }
                break;
        }
    }

    /**
     * Find nearby experience orb or soul to collect
     */
    findNearbyOrb() {
        let closestPickup = null;
        let closestDist = this.orbCollectionRadius;

        // Check experience orbs
        if (this.scene.experienceOrbs) {
            Object.values(this.scene.experienceOrbs).forEach(orb => {
                if (!orb || !orb.sprite || orb.collected) return;

                const dist = Phaser.Math.Distance.Between(
                    this.sprite.x,
                    this.sprite.y,
                    orb.sprite.x,
                    orb.sprite.y
                );

                if (dist < closestDist) {
                    closestDist = dist;
                    closestPickup = orb;
                    closestPickup.pickupType = 'xp';
                }
            });
        }

        // Check souls (currency items)
        if (this.scene.items) {
            Object.values(this.scene.items).forEach(item => {
                if (!item || !item.sprite || item.pickedUp || item.data.type !== 'soul') return;

                const dist = Phaser.Math.Distance.Between(
                    this.sprite.x,
                    this.sprite.y,
                    item.sprite.x,
                    item.sprite.y
                );

                if (dist < closestDist) {
                    closestDist = dist;
                    closestPickup = item;
                    closestPickup.pickupType = 'soul';
                }
            });
        }

        return closestPickup;
    }

    /**
     * Collect an orb or soul for the player
     */
    collectOrb(pickup) {
        if (!pickup) return;

        // Check if already collected (different flags for different types)
        if (pickup.collected || pickup.pickedUp) return;

        if (pickup.pickupType === 'xp') {
            // XP orb collection
            console.log(`🦊 Red Panda collected ${pickup.expValue} XP orb!`);

            // Trigger the orb's collection animation to the player
            pickup.collect(this.player.sprite.x, this.player.sprite.y);

            // Add experience to player
            if (this.player.addExperience) {
                this.player.addExperience(pickup.expValue);
            }
        } else if (pickup.pickupType === 'soul') {
            // Soul (currency) collection
            console.log(`🦊 Red Panda collected a soul!`);

            // Request pickup from server (items use server-validated pickup)
            pickup.requestPickup();
        }
    }

    /**
     * Transition to a new state
     */
    transitionTo(newState) {
        if (this.currentState === newState) return;

        console.log(`🦊 Red Panda: ${this.currentState} → ${newState}`);
        this.currentState = newState;
        this.stateTimer = 0;

        // Update animation based on new state
        switch(newState) {
            case this.states.FOLLOWING:
                this.sprite.play('red_panda_move');
                break;

            case this.states.IDLE:
                this.currentIdleVariant = Math.random() > 0.5 ? 1 : 2;
                this.sprite.play(`red_panda_idle${this.currentIdleVariant}`);
                this.nextStateChange = this.getRandomTime(3000, 6000);
                this.sleepThreshold = this.getRandomTime(5000, 10000);
                break;

            case this.states.PLAYING:
                this.sprite.play('red_panda_play');
                break;

            case this.states.SLEEPING:
                this.sprite.play('red_panda_sleep');
                break;

            case this.states.COLLECTING:
                this.sprite.play('red_panda_move');
                break;
        }
    }

    /**
     * Update pet position (follow player with orbit offset)
     */
    updatePosition(delta) {
        const deltaSeconds = delta / 1000;

        // If collecting orb, move toward orb instead
        if (this.currentState === this.states.COLLECTING && this.targetOrb && this.targetOrb.sprite) {
            // Safety check: Don't go more than 300px from player
            const distFromPlayer = Phaser.Math.Distance.Between(
                this.player.sprite.x,
                this.player.sprite.y,
                this.targetOrb.sprite.x,
                this.targetOrb.sprite.y
            );

            if (distFromPlayer > 300) {
                // Orb too far, cancel collection and return to player
                this.targetOrb = null;
                this.transitionTo(this.states.FOLLOWING);
                this.targetX = this.player.sprite.x + Math.cos(this.orbitAngle) * this.orbitRadius;
                this.targetY = this.player.sprite.y + Math.sin(this.orbitAngle) * this.orbitRadius;
            } else {
                this.targetX = this.targetOrb.sprite.x;
                this.targetY = this.targetOrb.sprite.y;
            }
        } else {
            // Calculate target position (orbit around player)
            this.targetX = this.player.sprite.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            this.targetY = this.player.sprite.y + Math.sin(this.orbitAngle) * this.orbitRadius;
        }

        // Smooth movement toward target
        const distToTarget = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            this.targetX,
            this.targetY
        );

        if (distToTarget > 5) {
            // Move toward target
            const moveDistance = this.moveSpeed * deltaSeconds;
            const ratio = Math.min(moveDistance / distToTarget, 1);

            this.sprite.x += (this.targetX - this.sprite.x) * ratio;
            this.sprite.y += (this.targetY - this.sprite.y) * ratio;

            // Flip sprite based on movement direction
            if (this.targetX < this.sprite.x) {
                this.sprite.setFlipX(true);
            } else if (this.targetX > this.sprite.x) {
                this.sprite.setFlipX(false);
            }
        }

        // Update depth to match player
        this.sprite.setDepth(this.player.sprite.depth - 1);
    }

    /**
     * Get random time in range
     */
    getRandomTime(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }
}

// Export for global use
window.RedPandaManager = RedPandaManager;
