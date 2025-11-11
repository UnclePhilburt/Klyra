// KLYRA MOBILE INPUT - Touch Controls & Virtual Joystick

class MobileInput {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.isMobile = this.detectMobile();
        
        // Joystick state
        this.joystickActive = false;
        this.joystickBase = { x: 0, y: 0 };
        this.joystickStick = { x: 0, y: 0 };
        this.joystickTouchId = null;
        this.joystickRadius = 60;
        this.joystickStickRadius = 25;
        
        // Input values
        this.inputX = 0;
        this.inputY = 0;
        
        // UI elements
        this.joystickContainer = null;
        this.joystickBaseElement = null;
        this.joystickStickElement = null;
    }
    
    // Detect if device is mobile
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Check for mobile devices
        if (/android/i.test(userAgent)) return true;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return true;
        
        // Check for touch support
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            // Also check screen size - tablets and phones
            if (window.innerWidth < 1024) return true;
        }
        
        return false;
    }
    
    // Initialize mobile controls
    init() {
        if (!this.isMobile) {
            console.log('Desktop detected - mobile controls disabled');
            return;
        }
        
        console.log('Mobile detected - enabling touch controls');
        this.enabled = true;
        
        // Create joystick UI
        this.createJoystickUI();
        
        // Setup touch event listeners
        this.setupTouchListeners();
        
        // Show mobile controls
        this.show();
    }
    
    // Create virtual joystick UI
    createJoystickUI() {
        // Container
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.id = 'joystickContainer';
        this.joystickContainer.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 80px;
            width: ${this.joystickRadius * 2}px;
            height: ${this.joystickRadius * 2}px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        
        // Base (outer circle)
        this.joystickBaseElement = document.createElement('div');
        this.joystickBaseElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(231, 76, 60, 0.3) 0%, rgba(231, 76, 60, 0.1) 70%, transparent 100%);
            border: 3px solid rgba(231, 76, 60, 0.5);
            border-radius: 50%;
            box-shadow: 0 0 20px rgba(231, 76, 60, 0.3);
        `;
        
        // Stick (inner circle)
        this.joystickStickElement = document.createElement('div');
        this.joystickStickElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${this.joystickStickRadius * 2}px;
            height: ${this.joystickStickRadius * 2}px;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            transition: transform 0.1s;
        `;
        
        this.joystickContainer.appendChild(this.joystickBaseElement);
        this.joystickContainer.appendChild(this.joystickStickElement);
        document.body.appendChild(this.joystickContainer);
    }
    
    // Setup touch event listeners
    setupTouchListeners() {
        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Touch start
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        
        // Touch move
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        
        // Touch end
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        document.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
    }
    
    // Handle touch start
    handleTouchStart(e) {
        if (!this.enabled) return;
        
        // Get first touch
        const touch = e.touches[0];
        
        // Check if touch is in left half of screen (for joystick)
        if (touch.clientX < window.innerWidth / 2) {
            this.joystickActive = true;
            this.joystickTouchId = touch.identifier;
            
            // Position joystick at touch location
            this.joystickBase.x = touch.clientX;
            this.joystickBase.y = touch.clientY;
            this.joystickStick.x = touch.clientX;
            this.joystickStick.y = touch.clientY;
            
            this.updateJoystickUI();
            this.joystickContainer.style.opacity = '1';
        }
    }
    
    // Handle touch move
    handleTouchMove(e) {
        if (!this.enabled || !this.joystickActive) return;
        
        // Find the touch that controls the joystick
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            
            if (touch.identifier === this.joystickTouchId) {
                // Calculate stick position relative to base
                const dx = touch.clientX - this.joystickBase.x;
                const dy = touch.clientY - this.joystickBase.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Limit stick movement to joystick radius
                const maxDistance = this.joystickRadius - this.joystickStickRadius;
                
                if (distance > maxDistance) {
                    const angle = Math.atan2(dy, dx);
                    this.joystickStick.x = this.joystickBase.x + Math.cos(angle) * maxDistance;
                    this.joystickStick.y = this.joystickBase.y + Math.sin(angle) * maxDistance;
                } else {
                    this.joystickStick.x = touch.clientX;
                    this.joystickStick.y = touch.clientY;
                }
                
                // Calculate normalized input (-1 to 1)
                this.inputX = (this.joystickStick.x - this.joystickBase.x) / maxDistance;
                this.inputY = (this.joystickStick.y - this.joystickBase.y) / maxDistance;
                
                this.updateJoystickUI();
                break;
            }
        }
    }
    
    // Handle touch end
    handleTouchEnd(e) {
        if (!this.enabled || !this.joystickActive) return;
        
        // Check if the joystick touch ended
        let touchStillActive = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.joystickTouchId) {
                touchStillActive = true;
                break;
            }
        }
        
        if (!touchStillActive) {
            this.joystickActive = false;
            this.joystickTouchId = null;
            this.inputX = 0;
            this.inputY = 0;
            
            // Reset stick to center
            this.joystickStick.x = this.joystickBase.x;
            this.joystickStick.y = this.joystickBase.y;
            
            this.updateJoystickUI();
            this.joystickContainer.style.opacity = '0';
        }
    }
    
    // Update joystick UI position
    updateJoystickUI() {
        if (!this.joystickContainer) return;
        
        // Position container at base
        this.joystickContainer.style.left = (this.joystickBase.x - this.joystickRadius) + 'px';
        this.joystickContainer.style.bottom = (window.innerHeight - this.joystickBase.y - this.joystickRadius) + 'px';
        
        // Position stick relative to base
        const stickX = this.joystickStick.x - this.joystickBase.x;
        const stickY = this.joystickStick.y - this.joystickBase.y;
        
        this.joystickStickElement.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
    }
    
    // Get input state
    getInput() {
        if (!this.enabled) {
            return { x: 0, y: 0, active: false };
        }
        
        return {
            x: this.inputX,
            y: this.inputY,
            active: this.joystickActive
        };
    }
    
    // Show mobile controls
    show() {
        if (this.joystickContainer) {
            this.joystickContainer.style.display = 'block';
        }
    }
    
    // Hide mobile controls
    hide() {
        if (this.joystickContainer) {
            this.joystickContainer.style.display = 'none';
        }
    }
    
    // Check if mobile controls are enabled
    isMobileEnabled() {
        return this.enabled;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileInput;
}
