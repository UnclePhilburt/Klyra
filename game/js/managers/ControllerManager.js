// Controller Manager - Handles gamepad input
class ControllerManager {
    constructor(scene) {
        this.scene = scene;
        this.pad = null;
        this.enabled = false;

        // Hotbar selection
        this.selectedHotbarSlot = 0; // 0-3 for slots 1-4

        // Right stick auto-attack toggle
        this.rightStickAttackEnabled = false;

        // Button state tracking (for edge detection)
        this.lastButtonState = {
            A: false,
            B: false,
            X: false,
            Y: false,
            LB: false,
            RB: false,
            Start: false,
            Select: false, // Menu/Back button
            R3: false // Right stick click
        };

        // Deadzone for analog sticks
        this.deadzone = 0.2;
        this.attackStickDeadzone = 0.3; // Higher deadzone for attack stick

        // Track last input type for UI switching
        this.lastInputType = 'keyboard'; // 'keyboard' or 'controller'
        this.lastInputTime = 0;

        // Check for controller
        this.checkForController();

        console.log('🎮 ControllerManager initialized');
    }

    checkForController() {
        // Phaser's gamepad plugin
        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.once('connected', (pad) => {
                this.pad = pad;
                this.enabled = true;
                console.log('🎮 Controller connected:', pad.id);
                this.showControllerNotification('Controller Connected!');
            });

            this.scene.input.gamepad.once('disconnected', (pad) => {
                if (this.pad === pad) {
                    this.pad = null;
                    this.enabled = false;
                    console.log('🎮 Controller disconnected');
                    this.showControllerNotification('Controller Disconnected');
                }
            });

            // Check if already connected
            const pads = this.scene.input.gamepad.gamepads;
            if (pads.length > 0 && pads[0]) {
                this.pad = pads[0];
                this.enabled = true;
                console.log('🎮 Controller already connected:', this.pad.id);
            }
        }
    }

    update() {
        if (!this.enabled || !this.pad) return;

        // Detect if controller is being used
        this.detectControllerInput();

        // Handle movement (left stick)
        this.handleMovement();

        // Handle right stick attack toggle
        this.handleRightStickToggle();

        // Handle right stick attacks
        this.handleRightStickAttack();

        // Handle abilities (face buttons)
        this.handleAbilities();

        // Handle hotbar navigation (bumpers)
        this.handleHotbarNavigation();

        // Handle hotbar use (Y button)
        this.handleHotbarUse();

        // Handle menus
        this.handleMenus();

        // Handle interact (A button when near NPCs)
        this.handleInteract();
    }

    detectControllerInput() {
        // Only check if we're not already in controller mode
        if (this.lastInputType === 'controller') return;

        // Check if any controller input is happening
        const stickMoved = Math.abs(this.pad.leftStick.x) > 0.1 ||
                          Math.abs(this.pad.leftStick.y) > 0.1 ||
                          Math.abs(this.pad.rightStick.x) > 0.1 ||
                          Math.abs(this.pad.rightStick.y) > 0.1;

        const buttonPressed = this.pad.buttons.some(btn => btn && btn.pressed);

        if (stickMoved || buttonPressed) {
            this.switchToControllerUI();
        }
    }

    detectKeyboardInput() {
        // This will be called from GameScene when keyboard input is detected
        this.switchToKeyboardUI();
    }

    switchToControllerUI() {
        if (this.lastInputType !== 'controller') {
            this.lastInputType = 'controller';
            console.log('🎮 Switched to controller UI');

            // Notify all UI elements to show controller buttons
            if (this.scene.abilityManager) {
                this.scene.abilityManager.setInputMode('controller');
            }
            if (this.scene.inventoryUI) {
                this.scene.inventoryUI.setInputMode('controller');
            }
            if (this.scene.merchantNPC) {
                this.scene.merchantNPC.setInputMode('controller');
            }
            if (this.scene.skillShopNPC) {
                this.scene.skillShopNPC.setInputMode('controller');
            }
        }
    }

    switchToKeyboardUI() {
        if (this.lastInputType !== 'keyboard') {
            this.lastInputType = 'keyboard';
            console.log('⌨️ Switched to keyboard UI');

            // Notify all UI elements to show keyboard keys
            if (this.scene.abilityManager) {
                this.scene.abilityManager.setInputMode('keyboard');
            }
            if (this.scene.inventoryUI) {
                this.scene.inventoryUI.setInputMode('keyboard');
            }
            if (this.scene.merchantNPC) {
                this.scene.merchantNPC.setInputMode('keyboard');
            }
            if (this.scene.skillShopNPC) {
                this.scene.skillShopNPC.setInputMode('keyboard');
            }
        }
    }

    handleMovement() {
        // Movement is handled by GameScene.update() which calls getMovementInput()
        // This method is kept for compatibility but does nothing
    }

    handleRightStickToggle() {
        // R3 (right stick click) = Toggle right stick attack mode
        if (this.isButtonPressed('R3')) {
            this.rightStickAttackEnabled = !this.rightStickAttackEnabled;

            // Disable automatic auto-attack when right stick mode is enabled
            if (this.scene.localPlayer) {
                this.scene.localPlayer.disableAutoAttack = this.rightStickAttackEnabled;
            }

            const status = this.rightStickAttackEnabled ? 'ON (Manual)' : 'OFF (Auto)';
            console.log(`🎮 Right Stick Attack: ${status}`);
            this.showControllerNotification(`Right Stick Attack: ${status}`);
        }
    }

    handleRightStickAttack() {
        if (!this.rightStickAttackEnabled) {
            return;
        }

        if (!this.scene.localPlayer) {
            console.log('⚠️ No local player');
            return;
        }

        // Get right stick axes
        const rightStickX = this.pad.rightStick.x;
        const rightStickY = this.pad.rightStick.y;

        // Apply deadzone
        const magnitude = Math.sqrt(rightStickX * rightStickX + rightStickY * rightStickY);
        if (magnitude < this.attackStickDeadzone) {
            return; // No attack
        }

        console.log(`🎮 Right stick moved past deadzone: ${magnitude.toFixed(2)}`);

        const player = this.scene.localPlayer;
        if (!player.autoAttackConfig) {
            console.log('⚠️ Player has no autoAttackConfig');
            return;
        }

        // Check cooldown manually
        const now = Date.now();
        const cooldown = player.autoAttackConfig.cooldown || 1000; // Already in milliseconds
        if (player.lastAutoAttackTime && (now - player.lastAutoAttackTime < cooldown)) {
            console.log(`⏱️ Still on cooldown: ${((cooldown - (now - player.lastAutoAttackTime)) / 1000).toFixed(2)}s remaining`);
            return; // Still on cooldown
        }

        // Calculate attack direction from right stick
        const attackDirection = {
            x: rightStickX,
            y: rightStickY
        };

        // Trigger auto-attack with forceAnimation=true and custom direction
        console.log(`🎮 Triggering auto-attack via right stick, direction: ${attackDirection.x.toFixed(2)}, ${attackDirection.y.toFixed(2)}`);
        player.executeAutoAttack(true, attackDirection);
    }

    getMovementInput() {
        if (!this.enabled || !this.pad) {
            return { x: 0, y: 0, active: false };
        }

        // Get left stick axes
        const leftStickX = this.pad.leftStick.x;
        const leftStickY = this.pad.leftStick.y;

        // Apply deadzone
        const magnitude = Math.sqrt(leftStickX * leftStickX + leftStickY * leftStickY);
        if (magnitude < this.deadzone) {
            return { x: 0, y: 0, active: false };
        }

        // Normalize direction
        const normalizedX = leftStickX / magnitude;
        const normalizedY = leftStickY / magnitude;

        return { x: normalizedX, y: normalizedY, active: true };
    }

    handleAbilities() {
        if (!this.scene.abilityManager) return;

        // A Button = E ability
        if (this.isButtonPressed('A')) {
            console.log('🎮 Controller: A pressed (E ability)');
            this.scene.abilityManager.useAbility('e');
        }

        // B Button = R ability
        if (this.isButtonPressed('B')) {
            console.log('🎮 Controller: B pressed (R ability)');
            this.scene.abilityManager.useAbility('r');
        }

        // X Button = Q ability
        if (this.isButtonPressed('X')) {
            console.log('🎮 Controller: X pressed (Q ability)');
            this.scene.abilityManager.useAbility('q');
        }
    }

    handleHotbarNavigation() {
        // Right Bumper = Cycle right
        if (this.isButtonPressed('RB')) {
            this.selectedHotbarSlot = (this.selectedHotbarSlot + 1) % 4;
            console.log(`🎮 Hotbar slot: ${this.selectedHotbarSlot + 1}`);
            this.updateHotbarHighlight();
        }

        // Left Bumper = Cycle left
        if (this.isButtonPressed('LB')) {
            this.selectedHotbarSlot = (this.selectedHotbarSlot - 1 + 4) % 4;
            console.log(`🎮 Hotbar slot: ${this.selectedHotbarSlot + 1}`);
            this.updateHotbarHighlight();
        }
    }

    handleHotbarUse() {
        // Y Button = Use selected hotbar slot
        if (this.isButtonPressed('Y')) {
            const slotNumber = this.selectedHotbarSlot + 1; // 1-4
            console.log(`🎮 Using hotbar slot ${slotNumber}`);

            // Trigger the hotbar slot (simulate number key press)
            if (this.scene.inventoryUI) {
                this.scene.inventoryUI.useHotbarItem(this.selectedHotbarSlot); // 0-indexed
            }
        }
    }

    handleMenus() {
        // Select/Back/Menu Button = Open Inventory (I key)
        if (this.isButtonPressed('Select')) {
            console.log('🎮 Menu button pressed (Inventory)');
            if (this.scene.inventoryUI) {
                this.scene.inventoryUI.toggleInventory();
            }
        }

        // Start Button = ESC (close menus)
        if (this.isButtonPressed('Start')) {
            console.log('🎮 Start button pressed (ESC)');

            // Close any open menus
            if (this.scene.inventoryUI && this.scene.inventoryUI.isOpen) {
                this.scene.inventoryUI.toggleInventory();
            } else if (this.scene.merchantNPC && this.scene.merchantNPC.isShopOpen) {
                this.scene.merchantNPC.closeShop();
            } else if (this.scene.skillShopNPC && this.scene.skillShopNPC.isShopOpen) {
                this.scene.skillShopNPC.closeShop();
            }
        }
    }

    handleInteract() {
        // A button also works as interact (F key) when near NPCs
        if (this.isButtonPressed('A') && this.scene.localPlayer) {
            const playerX = this.scene.localPlayer.sprite.x;
            const playerY = this.scene.localPlayer.sprite.y;

            // Check merchant NPC
            if (this.scene.merchantNPC) {
                const merchantInRange = this.scene.merchantNPC.checkPlayerDistance(playerX, playerY);
                if (merchantInRange) {
                    this.scene.merchantNPC.toggleShop();
                    return;
                }
            }

            // Check skill shop NPC
            if (this.scene.skillShopNPC) {
                const skillShopInRange = this.scene.skillShopNPC.checkPlayerDistance(playerX, playerY);
                if (skillShopInRange) {
                    this.scene.skillShopNPC.toggleShop();
                    return;
                }
            }
        }
    }

    updateHotbarHighlight() {
        // Update visual highlight on inventory UI
        if (this.scene.inventoryUI) {
            this.scene.inventoryUI.setControllerSelection(this.selectedHotbarSlot);
        }
    }

    isButtonPressed(buttonName) {
        if (!this.pad) return false;

        let currentState = false;

        // Map button names to gamepad buttons
        switch(buttonName) {
            case 'A':
                currentState = this.pad.A; // Bottom button (Xbox A, PS Cross)
                break;
            case 'B':
                currentState = this.pad.B; // Right button (Xbox B, PS Circle)
                break;
            case 'X':
                currentState = this.pad.X; // Left button (Xbox X, PS Square)
                break;
            case 'Y':
                currentState = this.pad.Y; // Top button (Xbox Y, PS Triangle)
                break;
            case 'LB':
                currentState = this.pad.L1; // Left bumper
                break;
            case 'RB':
                currentState = this.pad.R1; // Right bumper
                break;
            case 'Start':
                currentState = this.pad.buttons[9] ? this.pad.buttons[9].pressed : false; // Start
                break;
            case 'Select':
                currentState = this.pad.buttons[8] ? this.pad.buttons[8].pressed : false; // Select/Back/Menu
                break;
            case 'R3':
                currentState = this.pad.buttons[11] ? this.pad.buttons[11].pressed : false; // Right stick click
                break;
        }

        // Edge detection: only return true on button down (not held)
        const wasPressed = this.lastButtonState[buttonName];
        this.lastButtonState[buttonName] = currentState;

        return currentState && !wasPressed;
    }

    showControllerNotification(text) {
        const notification = this.scene.add.text(
            this.scene.cameras.main.centerX,
            100,
            text,
            {
                font: 'bold 20px monospace',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(100001);

        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    destroy() {
        this.enabled = false;
        this.pad = null;
    }
}
