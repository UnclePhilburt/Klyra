// Controller Manager - Handles gamepad input for player movement and abilities
class ControllerManager {
    constructor(scene) {
        this.scene = scene;
        this.gamepad = null;
        this.deadzone = 0.15; // Ignore stick values below this threshold
        this.enabled = true;

        // Button mapping (standard gamepad layout)
        this.buttons = {
            A: 0,      // Bottom button (Xbox A, PS X)
            B: 1,      // Right button (Xbox B, PS Circle)
            X: 2,      // Left button (Xbox X, PS Square)
            Y: 3,      // Top button (Xbox Y, PS Triangle)
            LB: 4,     // Left bumper
            RB: 5,     // Right bumper
            LT: 6,     // Left trigger
            RT: 7,     // Right trigger
            SELECT: 8, // Select/Back/Share
            START: 9,  // Start/Options
            L3: 10,    // Left stick click
            R3: 11,    // Right stick click
            DPAD_UP: 12,
            DPAD_DOWN: 13,
            DPAD_LEFT: 14,
            DPAD_RIGHT: 15
        };

        this.setupController();
        console.log('🎮 Controller Manager initialized');
    }

    setupController() {
        // Phaser's gamepad manager
        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.once('connected', (pad) => {
                this.gamepad = pad;
                console.log(`🎮 Controller connected: ${pad.id}`);
            });

            // Check if already connected
            if (this.scene.input.gamepad.total > 0) {
                this.gamepad = this.scene.input.gamepad.getPad(0);
                console.log(`🎮 Controller already connected: ${this.gamepad.id}`);
            }
        }
    }

    // Get movement vector from left analog stick
    getMovementVector() {
        if (!this.enabled || !this.gamepad) {
            return { x: 0, y: 0 };
        }

        let x = this.gamepad.axes[0].getValue();
        let y = this.gamepad.axes[1].getValue();

        // Apply deadzone
        if (Math.abs(x) < this.deadzone) x = 0;
        if (Math.abs(y) < this.deadzone) y = 0;

        return { x, y };
    }

    // Check if ability button is pressed
    isAbilityPressed(abilityKey) {
        if (!this.enabled || !this.gamepad) {
            return false;
        }

        // Map keyboard keys to controller buttons
        const buttonMap = {
            'Q': this.buttons.LB,  // Q ability = Left bumper
            'W': this.buttons.Y,   // W ability = Y button (top)
            'E': this.buttons.RB,  // E ability = Right bumper
            'R': this.buttons.RT,  // R ability = Right trigger
            'D': this.buttons.B    // D ability = B button (right)
        };

        const buttonIndex = buttonMap[abilityKey.toUpperCase()];
        if (buttonIndex === undefined) return false;

        return this.gamepad.buttons[buttonIndex].pressed;
    }

    // Check if ability button was just pressed (for single trigger)
    isAbilityJustPressed(abilityKey) {
        if (!this.enabled || !this.gamepad) {
            return false;
        }

        const buttonMap = {
            'Q': this.buttons.LB,
            'W': this.buttons.Y,
            'E': this.buttons.RB,
            'R': this.buttons.RT,
            'D': this.buttons.B
        };

        const buttonIndex = buttonMap[abilityKey.toUpperCase()];
        if (buttonIndex === undefined) return false;

        const button = this.gamepad.buttons[buttonIndex];
        return button.pressed && button.duration < 100; // Just pressed within 100ms
    }

    // Get whether controller is connected and active
    isConnected() {
        return this.gamepad !== null;
    }

    // Enable/disable controller input
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    update() {
        // Check for controller connection changes
        if (this.scene.input.gamepad && !this.gamepad) {
            if (this.scene.input.gamepad.total > 0) {
                this.gamepad = this.scene.input.gamepad.getPad(0);
                if (this.gamepad) {
                    console.log(`🎮 Controller connected: ${this.gamepad.id}`);
                }
            }
        }
    }
}
