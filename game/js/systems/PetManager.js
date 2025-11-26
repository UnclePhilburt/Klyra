// PetManager - Main system for managing all pets
class PetManager {
    constructor(scene, player, isRemote = false) {
        this.scene = scene;
        this.player = player;
        this.isRemote = isRemote; // If true, this pet belongs to another player (don't emit updates)

        // Track owned pets
        this.ownedPets = new Set();

        // Currently active pet instance
        this.activePet = null;

        // Track player movement state for pet behaviors
        this.playerLastX = player.sprite.x;
        this.playerLastY = player.sprite.y;
        this.playerIdleTime = 0;
        this.playerIsMoving = false;

        // Movement threshold to detect player movement
        this.movementThreshold = 2;

        // Network sync for pet position
        this.lastSyncX = 0;
        this.lastSyncY = 0;
        this.lastSyncState = null;
        this.lastSyncIdleVariant = 1;
        this.syncThreshold = 5; // Only sync if moved more than 5 pixels
        this.syncInterval = 100; // Sync every 100ms max
        this.lastSyncTime = 0;

        console.log('✅ PetManager initialized for player:', player.data.username, isRemote ? '(remote)' : '(local)');
    }

    /**
     * Add a pet to the player's owned pets collection
     */
    addPet(petType) {
        this.ownedPets.add(petType);
        console.log(`🐾 Pet acquired: ${petType}`);

        // Auto-equip if no pet is active
        if (!this.activePet) {
            this.equipPet(petType);
        }
    }

    /**
     * Equip a pet (spawns it and makes it follow the player)
     */
    equipPet(petType) {
        if (!this.ownedPets.has(petType)) {
            console.warn(`Cannot equip pet ${petType} - not owned`);
            return false;
        }

        // Clean up existing pet
        if (this.activePet) {
            this.activePet.destroy();
        }

        // Spawn new pet based on type
        switch(petType) {
            case 'red_panda':
                const RedPandaManager = window.RedPandaManager;
                if (RedPandaManager) {
                    this.activePet = new RedPandaManager(this.scene, this.player, this);
                    console.log('🦊 Red Panda equipped!');
                } else {
                    console.error('RedPandaManager not loaded');
                }
                break;
            default:
                console.warn(`Unknown pet type: ${petType}`);
                return false;
        }

        // Notify server about pet equip (only for local player)
        if (!this.isRemote) {
            const networkManager = this.scene.game?.registry?.get('networkManager');
            if (networkManager && networkManager.socket) {
                networkManager.socket.emit('player:equipPet', { petType });
            }
        }

        return true;
    }

    /**
     * Unequip current pet
     */
    unequipPet() {
        if (this.activePet) {
            this.activePet.destroy();
            this.activePet = null;
            console.log('🐾 Pet unequipped');

            // Notify server about pet unequip (only for local player)
            if (!this.isRemote) {
                const networkManager = this.scene.game?.registry?.get('networkManager');
                if (networkManager && networkManager.socket) {
                    networkManager.socket.emit('player:unequipPet', {});
                }
            }
        }
    }

    /**
     * Update pet system - called every frame
     */
    update(time, delta) {
        if (!this.player || !this.player.sprite) return;

        // Track player movement state
        this.updatePlayerMovementState(delta);

        // Update active pet
        if (this.activePet) {
            this.activePet.update(time, delta);

            // Sync pet position to network (only for local player's pet)
            if (!this.isRemote) {
                this.syncPetPosition(time);
            }
        }
    }

    /**
     * Sync pet position to server for other players to see
     */
    syncPetPosition(time) {
        if (!this.activePet || !this.activePet.sprite) return;

        const networkManager = this.scene.game?.registry?.get('networkManager');
        if (!networkManager || !networkManager.socket) return;

        const petX = this.activePet.sprite.x;
        const petY = this.activePet.sprite.y;
        const petState = this.activePet.currentState || 'idle';
        const flipX = this.activePet.sprite.flipX;
        const idleVariant = this.activePet.currentIdleVariant || 1;

        // Check if enough time has passed and (position OR state OR idle variant changed)
        const timeSinceLastSync = time - this.lastSyncTime;
        const distMoved = Phaser.Math.Distance.Between(this.lastSyncX, this.lastSyncY, petX, petY);
        const stateChanged = petState !== this.lastSyncState;
        const idleVariantChanged = idleVariant !== this.lastSyncIdleVariant;

        if (timeSinceLastSync >= this.syncInterval && (distMoved >= this.syncThreshold || stateChanged || idleVariantChanged)) {
            networkManager.socket.emit('pet:update', {
                x: Math.round(petX),
                y: Math.round(petY),
                state: petState,
                flipX: flipX,
                idleVariant: idleVariant
            });

            this.lastSyncX = petX;
            this.lastSyncY = petY;
            this.lastSyncState = petState;
            this.lastSyncIdleVariant = idleVariant;
            this.lastSyncTime = time;
        }
    }

    /**
     * Apply position update from server (for remote pets)
     */
    applyRemoteUpdate(data) {
        if (!this.activePet || !this.activePet.sprite) return;

        // Set target position for smooth interpolation
        this.activePet.remoteTargetX = data.x;
        this.activePet.remoteTargetY = data.y;
        this.activePet.remoteState = data.state;

        // Update idle variant if provided
        if (data.idleVariant !== undefined) {
            this.activePet.currentIdleVariant = data.idleVariant;
        }

        // Apply flip
        if (data.flipX !== undefined) {
            this.activePet.sprite.setFlipX(data.flipX);
        }
    }

    /**
     * Detect if player is moving or idle
     */
    updatePlayerMovementState(delta) {
        const currentX = this.player.sprite.x;
        const currentY = this.player.sprite.y;

        const distMoved = Phaser.Math.Distance.Between(
            this.playerLastX,
            this.playerLastY,
            currentX,
            currentY
        );

        if (distMoved > this.movementThreshold) {
            // Player is moving
            this.playerIsMoving = true;
            this.playerIdleTime = 0;
        } else {
            // Player is idle
            this.playerIsMoving = false;
            this.playerIdleTime += delta;
        }

        // Update last position
        this.playerLastX = currentX;
        this.playerLastY = currentY;
    }

    /**
     * Get current player idle time in milliseconds
     */
    getPlayerIdleTime() {
        return this.playerIdleTime;
    }

    /**
     * Check if player is currently moving
     */
    isPlayerMoving() {
        return this.playerIsMoving;
    }

    /**
     * Save pet data
     */
    getSaveData() {
        return {
            ownedPets: Array.from(this.ownedPets),
            activePet: this.activePet ? this.activePet.petType : null
        };
    }

    /**
     * Load pet data
     */
    loadSaveData(data) {
        if (data.ownedPets) {
            this.ownedPets = new Set(data.ownedPets);
        }

        if (data.activePet) {
            this.equipPet(data.activePet);
        }
    }

    /**
     * Remove all pets (called on death - player loses all pets)
     */
    removeAllPets() {
        // Destroy active pet
        if (this.activePet) {
            this.activePet.destroy();
            this.activePet = null;
        }

        // Clear ownership
        this.ownedPets.clear();

        console.log('💀 All pets removed (player died)');
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.activePet) {
            this.activePet.destroy();
        }
        this.activePet = null;
        this.ownedPets.clear();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PetManager;
}
