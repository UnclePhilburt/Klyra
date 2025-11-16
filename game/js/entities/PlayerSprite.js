// PlayerSprite - Handles all visual sprite rendering for a player
class PlayerSprite {
    constructor(scene, position, characterClass) {
        this.scene = scene;
        this.characterClass = characterClass;
        this.position = position;

        // Visual elements
        this.physicsBody = null;
        this.topLeft = null;
        this.topRight = null;
        this.bottomLeft = null;
        this.bottomRight = null;
        this.collisionDebug = null;

        // Fallback elements
        this.circle = null;
        this.glow = null;
        this.weapon = null;

        this.usingSprite = false;
        this.currentDirection = 'down';
        this.isMoving = false;
        this.character = null;

        this.create();
    }

    create() {
        // Position is now in PIXELS, use directly
        const x = this.position.x;
        const y = this.position.y;

        this.character = CHARACTERS[this.characterClass] || CHARACTERS.MALACHAR;
        const textureKey = this.characterClass.toLowerCase();

        // Check if texture exists (either directly or with _idle suffix for multi-sheet characters)
        const hasTexture = this.scene.textures.exists(textureKey) || this.scene.textures.exists(`${textureKey}_idle`);

        if (hasTexture) {
            this.createSpriteCharacter(x, y, textureKey, this.character);
        } else {
            this.createFallbackCharacter(x, y, this.character);
        }
    }

    createSpriteCharacter(x, y, textureKey, character) {
        const spriteConfig = character.sprite || {};
        const tileSize = spriteConfig.tileSize || 2; // Default to 2x2 for backward compatibility

        if (tileSize === 1) {
            // 1x1 character (like Kelise)
            console.log(`✅ Creating 1x1 sprite for ${this.characterClass}`);
            this.create1x1Sprite(x, y, textureKey, character);
        } else {
            // 2x2 character (like Malachar)
            console.log(`✅ Creating 2x2 sprite for ${this.characterClass}`);
            this.create2x2Sprite(x, y, textureKey, character);
        }
    }

    create1x1Sprite(x, y, textureKey, character) {
        const spriteConfig = character.sprite || {};
        const frameWidth = spriteConfig.frameWidth || 32;

        // Calculate scale based on sprite size
        // Kelise (32px) should be ~48px (scale 1.5)
        // Malachar (140px) should be ~112px (scale 0.8) - 2.3x bigger
        const targetSize = frameWidth > 100 ? 112 : 48;
        const scale = targetSize / frameWidth;

        const collisionWidth = 32;
        const collisionHeight = 16; // Bottom half only

        // Create physics body (invisible rectangle)
        this.physicsBody = this.scene.add.rectangle(x, y + 8, collisionWidth, collisionHeight, 0x000000, 0);
        this.scene.physics.add.existing(this.physicsBody);

        // Debug collision box
        this.collisionDebug = this.scene.add.rectangle(x, y + 8, collisionWidth, collisionHeight, 0x00ff00, 0);
        this.collisionDebug.setStrokeStyle(2, 0x00ff00, 1);
        this.collisionDebug.setDepth(9999);

        if (this.scene.devSettings) {
            this.collisionDebug.setVisible(this.scene.devSettings.showCollisionBoxes);
        }

        // Create single sprite for 1x1 character
        // For Malachar, use the idle texture key since animations reference separate sprite sheets
        const spriteTextureKey = this.scene.textures.exists(`${textureKey}_idle`) ? `${textureKey}_idle` : textureKey;
        this.sprite = this.scene.add.sprite(x, y, spriteTextureKey);
        this.sprite.setOrigin(0.5, 0.75); // Center horizontally, align feet to bottom
        this.sprite.setScale(scale);
        this.sprite.setDepth(2);

        // Start with idle animation
        const idleAnimKey = `${textureKey}_idle`;
        if (this.scene.anims.exists(idleAnimKey)) {
            this.sprite.play(idleAnimKey);
        }

        this.usingSprite = true;
        this.is1x1 = true;

        console.log(`✅ 1x1 sprite character created (${frameWidth}px @ ${scale.toFixed(2)}x scale) with collision box: ${collisionWidth}x${collisionHeight}`);
    }

    create2x2Sprite(x, y, textureKey, character) {
        // Static frames
        const frames = character.sprite?.frames || {
            topLeft: 64,
            topRight: 65,
            bottomLeft: 120,
            bottomRight: 121
        };

        const scale = 1.0;
        const collisionWidth = 48;
        const collisionHeight = 24; // Bottom half only

        // Create physics body (invisible rectangle)
        this.physicsBody = this.scene.add.rectangle(x, y + 12, collisionWidth, collisionHeight, 0x000000, 0);
        this.scene.physics.add.existing(this.physicsBody);

        // Debug collision box
        this.collisionDebug = this.scene.add.rectangle(x, y + 12, collisionWidth, collisionHeight, 0x00ff00, 0);
        this.collisionDebug.setStrokeStyle(2, 0x00ff00, 1);
        this.collisionDebug.setDepth(9999);

        if (this.scene.devSettings) {
            this.collisionDebug.setVisible(this.scene.devSettings.showCollisionBoxes);
        }

        // Create visual sprites (4 tiles for 2x2)
        this.topLeft = this.scene.add.sprite(0, 0, textureKey, frames.topLeft);
        this.topRight = this.scene.add.sprite(0, 0, textureKey, frames.topRight);
        this.bottomLeft = this.scene.add.sprite(0, 0, textureKey, frames.bottomLeft);
        this.bottomRight = this.scene.add.sprite(0, 0, textureKey, frames.bottomRight);

        [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight].forEach(s => {
            s.setOrigin(0, 0);
            s.setScale(scale);
            s.setDepth(2); // Above walkways (depth 1) but with walls (depth 2)
        });

        this.updateSpritePositions();
        this.usingSprite = true;
        this.is1x1 = false;

        console.log(`✅ 2x2 sprite character created with collision box: ${collisionWidth}x${collisionHeight}`);
    }

    createFallbackCharacter(x, y, character) {
        console.log(`⚠️ No sprite found, using fallback for ${this.characterClass}`);

        this.circle = this.scene.add.circle(x, y, 12, character.display.color);
        this.circle.setDepth(y + 1000);
        this.scene.physics.add.existing(this.circle);
        this.physicsBody = this.circle;

        // Glow effect
        this.glow = this.scene.add.circle(x, y, 14, character.display.color, 0.3);
        this.glow.setDepth(y + 999);

        // Weapon indicator
        this.weapon = this.scene.add.rectangle(x + 15, y, 20, 4, 0xffffff);
        this.weapon.setOrigin(0, 0.5);
        this.weapon.setDepth(y + 1000);

        this.usingSprite = false;
    }

    updateSpritePositions() {
        if (!this.usingSprite) return;

        const x = this.physicsBody.x;
        const y = this.physicsBody.y;
        const depth = y + 1000;

        if (this.is1x1 && this.sprite) {
            // 1x1 sprite - simple position update
            this.sprite.setPosition(x, y);
            this.sprite.setDepth(depth);

            if (this.collisionDebug) {
                this.collisionDebug.setPosition(x, y + 8);
            }
        } else if (!this.is1x1 && this.topLeft) {
            // 2x2 sprite - update all 4 tiles
            const spriteSize = 48;

            // Offset to center character visually
            const offsetX = 32;
            const offsetY = 55;

            const left = x - spriteSize + offsetX;
            const right = x + offsetX;
            const top = y - spriteSize * 2 + offsetY;
            const bottom = y - spriteSize + offsetY;

            this.topLeft.setPosition(left, top);
            this.topRight.setPosition(right, top);
            this.bottomLeft.setPosition(left, bottom);
            this.bottomRight.setPosition(right, bottom);

            this.topLeft.setDepth(depth);
            this.topRight.setDepth(depth);
            this.bottomLeft.setDepth(depth);
            this.bottomRight.setDepth(depth);

            if (this.collisionDebug) {
                this.collisionDebug.setPosition(x, y + 12);
            }
        }
    }

    updateDepth() {
        const depth = this.physicsBody.y + 1000;

        if (this.usingSprite) {
            this.physicsBody.setDepth(depth);
            if (this.topLeft) {
                this.topLeft.setDepth(depth);
                this.topRight.setDepth(depth);
                this.bottomLeft.setDepth(depth);
                this.bottomRight.setDepth(depth);
            }
        } else {
            if (this.circle) this.circle.setDepth(depth);
            if (this.glow) this.glow.setDepth(depth - 1);
            if (this.weapon) this.weapon.setDepth(depth);
        }

        return depth;
    }

    updateFallbackPositions() {
        if (this.usingSprite || !this.physicsBody) return;

        const x = this.physicsBody.x;
        const y = this.physicsBody.y;

        if (this.glow) {
            this.glow.setPosition(x, y);
        }

        if (this.weapon) {
            const angle = this.weapon.rotation;
            const distance = 15;
            this.weapon.setPosition(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance
            );
        }
    }

    setWeaponRotation(angle) {
        if (!this.usingSprite && this.weapon) {
            this.weapon.setRotation(angle);
        }
    }

    flash() {
        const targets = this.getVisualTargets();

        this.scene.tweens.add({
            targets: targets,
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });
    }

    tint(color) {
        const targets = this.getVisualTargets();
        targets.forEach(s => {
            if (s.setTint) s.setTint(color);
        });
    }

    clearTint() {
        const targets = this.getVisualTargets();
        targets.forEach(s => {
            if (s.clearTint) s.clearTint();
        });
    }

    fadeOut(duration = 500, onComplete = null) {
        const targets = this.getVisualTargets();

        this.scene.tweens.add({
            targets: targets,
            alpha: 0,
            duration: duration,
            onComplete: () => {
                targets.forEach(s => s.setVisible(false));
                if (onComplete) onComplete();
            }
        });
    }

    animateAttack(targetX, targetY) {
        if (!this.usingSprite && this.weapon) {
            const angle = Phaser.Math.Angle.Between(
                this.physicsBody.x,
                this.physicsBody.y,
                targetX,
                targetY
            );
            this.weapon.setRotation(angle);

            this.scene.tweens.add({
                targets: this.weapon,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 100,
                yoyo: true
            });
        }

        this.flash();
    }

    getVisualTargets() {
        if (this.usingSprite) {
            if (this.is1x1 && this.sprite) {
                return [this.sprite];
            } else if (!this.is1x1 && this.topLeft) {
                return [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
            }
        }
        return [this.circle, this.glow, this.weapon].filter(x => x);
    }

    getPhysicsBody() {
        return this.physicsBody;
    }

    getX() {
        return this.physicsBody.x;
    }

    getY() {
        return this.physicsBody.y;
    }

    isUsingSprite() {
        return this.usingSprite;
    }

    updateMovementState(velocityX, velocityY) {
        // Check if moving
        const isMoving = velocityX !== 0 || velocityY !== 0;

        // Only update if state changed or we're using a 1x1 sprite
        if (this.is1x1 && this.sprite) {
            const textureKey = this.characterClass.toLowerCase();
            const idleAnimKey = `${textureKey}_idle`;

            // Try 'running' first (Kelise), then 'walk' (Malachar)
            let runningAnimKey = `${textureKey}_running`;
            if (!this.scene.anims.exists(runningAnimKey)) {
                runningAnimKey = `${textureKey}_walk`;
            }

            // Handle horizontal flipping based on movement direction
            if (velocityX < 0) {
                // Moving left - flip sprite
                this.sprite.setFlipX(true);
            } else if (velocityX > 0) {
                // Moving right - no flip
                this.sprite.setFlipX(false);
            }

            if (isMoving && !this.isMoving) {
                // Started moving - switch to running/walk animation
                if (this.scene.anims.exists(runningAnimKey)) {
                    this.sprite.play(runningAnimKey, true);
                }
                this.isMoving = true;

                // Start footstep sounds
                if (this.scene.footstepManager && !this.footstepTimer) {
                    this.footstepTimer = this.scene.time.addEvent({
                        delay: 400, // Play footstep every 400ms while moving
                        callback: () => {
                            if (this.isMoving && this.scene.footstepManager) {
                                this.scene.footstepManager.playFootstep();
                            }
                        },
                        loop: true
                    });
                }
            } else if (!isMoving && this.isMoving) {
                // Stopped moving - switch to idle animation
                if (this.scene.anims.exists(idleAnimKey)) {
                    this.sprite.play(idleAnimKey, true);
                }
                this.isMoving = false;

                // Stop footstep sounds
                if (this.footstepTimer) {
                    this.footstepTimer.remove();
                    this.footstepTimer = null;
                }
            }
        }
    }

    playDeathAnimation() {
        if (this.is1x1 && this.sprite) {
            const textureKey = this.characterClass.toLowerCase();
            const deathAnimKey = `${textureKey}_death`;

            if (this.scene.anims.exists(deathAnimKey)) {
                this.sprite.play(deathAnimKey);
                console.log(`💀 Playing death animation: ${deathAnimKey}`);
            }
        }
    }

    playAttackAnimation() {
        if (this.is1x1 && this.sprite) {
            const textureKey = this.characterClass.toLowerCase();
            const attackAnimKey = `${textureKey}_attack`;

            if (this.scene.anims.exists(attackAnimKey)) {
                this.sprite.play(attackAnimKey);
                console.log(`⚔️ Playing attack animation: ${attackAnimKey}`);

                // Play swipe sound for Kelise attacks
                if (textureKey === 'kelise' && this.scene.sound) {
                    this.scene.sound.play('swipe', { volume: 0.2 });
                }
            }
        }
    }

    destroy() {
        // Clean up footstep timer
        if (this.footstepTimer) {
            this.footstepTimer.remove();
            this.footstepTimer = null;
        }

        if (this.physicsBody) this.physicsBody.destroy();
        if (this.sprite) this.sprite.destroy();
        if (this.topLeft) this.topLeft.destroy();
        if (this.topRight) this.topRight.destroy();
        if (this.bottomLeft) this.bottomLeft.destroy();
        if (this.bottomRight) this.bottomRight.destroy();
        if (this.collisionDebug) this.collisionDebug.destroy();
        if (this.circle) this.circle.destroy();
        if (this.glow) this.glow.destroy();
        if (this.weapon) this.weapon.destroy();
    }
}
