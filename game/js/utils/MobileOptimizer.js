// MobileOptimizer - Comprehensive mobile experience enhancements
class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isLowEnd = this.detectLowEndDevice();
        this.wakeLock = null;
        this.gameScene = null;

        // Performance settings
        this.settings = {
            particleMultiplier: this.isLowEnd ? 0.3 : (this.isMobile ? 0.5 : 1.0),
            updateThrottle: this.isLowEnd ? 100 : (this.isMobile ? 50 : 16),
            renderScale: this.isLowEnd ? 0.65 : (this.isMobile ? 0.85 : 1.0),
            enableShadows: !this.isMobile,
            maxMinionsVisible: this.isLowEnd ? 15 : (this.isMobile ? 25 : 50)
        };

        if (this.isMobile) {
            this.init();
        }
    }

    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android/i.test(userAgent) && window.innerWidth >= 768;
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 1024;
        return isMobileDevice || isTablet || (hasTouch && isSmallScreen);
    }

    detectLowEndDevice() {
        // Detect low-end devices based on hardware concurrency and memory
        const cores = navigator.hardwareConcurrency || 2;
        const memory = navigator.deviceMemory || 4; // GB
        const isOldIOS = /iPhone OS [1-9]_|iPhone OS 1[0-2]_/.test(navigator.userAgent);

        return cores <= 4 || memory <= 2 || isOldIOS;
    }

    async init() {
        // Wake Lock - prevent screen sleep
        this.setupWakeLock();

        // Auto-pause on background
        this.setupVisibilityHandling();

        // Prevent iOS bounce/zoom
        this.preventIOSBehaviors();

        // Safe area handling
        this.setupSafeAreas();

        // Battery status monitoring
        this.setupBatteryMonitoring();

        // Orientation handling
        this.setupOrientationHandling();

        console.log('✅ Mobile optimizations active');
    }

    // ============ WAKE LOCK ============
    async setupWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                await this.requestWakeLock();

                // Re-acquire wake lock when page becomes visible
                document.addEventListener('visibilitychange', async () => {
                    if (document.visibilityState === 'visible' && this.wakeLock === null) {
                        await this.requestWakeLock();
                    }
                });

                console.log('🔒 Wake Lock enabled - screen won\'t sleep during gameplay');
            } catch (err) {
                console.warn('⚠️ Wake Lock not supported:', err);
            }
        }
    }

    async requestWakeLock() {
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            this.wakeLock.addEventListener('release', () => {
                console.log('🔓 Wake Lock released');
            });
        } catch (err) {
            console.warn('Wake Lock request failed:', err);
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    // ============ VISIBILITY HANDLING ============
    setupVisibilityHandling() {
        // DISABLED: Don't pause when switching tabs/windows
        // This allows multiple game instances to run simultaneously
        console.log('⏯️ Visibility handling disabled - game will not pause when in background');

        // document.addEventListener('visibilitychange', () => {
        //     if (document.hidden) {
        //         this.onGameHidden();
        //     } else {
        //         this.onGameVisible();
        //     }
        // });

        // // Also handle blur/focus
        // window.addEventListener('blur', () => this.onGameHidden());
        // window.addEventListener('focus', () => this.onGameVisible());

        // // Handle phone calls, notifications, etc
        // window.addEventListener('pagehide', () => this.onGameHidden());
        // window.addEventListener('pageshow', () => this.onGameVisible());
    }

    onGameHidden() {
        console.log('⏸️ Game hidden - pausing');

        // Pause Phaser game
        if (this.gameScene && this.gameScene.scene.isActive()) {
            this.gameScene.scene.pause();
        }

        // Mute audio
        if (window.game && window.game.sound) {
            window.game.sound.mute = true;
        }

        // Release wake lock
        this.releaseWakeLock();
    }

    onGameVisible() {
        console.log('▶️ Game visible - resuming');

        // Resume Phaser game
        if (this.gameScene && this.gameScene.scene.isPaused()) {
            this.gameScene.scene.resume();
        }

        // Unmute audio
        if (window.game && window.game.sound) {
            window.game.sound.mute = false;
        }

        // Re-acquire wake lock
        if (this.wakeLock === null) {
            this.requestWakeLock();
        }
    }

    // ============ HAPTIC FEEDBACK ============
    vibrate(pattern) {
        if (!this.isMobile) return;

        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Convenience methods for different haptic patterns
    lightTap() {
        this.vibrate(10); // Very short tap
    }

    mediumTap() {
        this.vibrate(20); // Medium tap
    }

    heavyTap() {
        this.vibrate(30); // Heavy tap
    }

    success() {
        this.vibrate([10, 50, 10]); // Double tap pattern
    }

    error() {
        this.vibrate([20, 100, 20, 100, 20]); // Error pattern
    }

    // ============ IOS PREVENTION ============
    preventIOSBehaviors() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });

        // Prevent pinch zoom
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Prevent elastic scrolling
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';
    }

    // ============ SAFE AREAS ============
    setupSafeAreas() {
        // Add CSS variables for safe areas (handles notches)
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --sat: env(safe-area-inset-top);
                --sar: env(safe-area-inset-right);
                --sab: env(safe-area-inset-bottom);
                --sal: env(safe-area-inset-left);
            }

            body {
                padding-top: var(--sat, 0);
                padding-right: var(--sar, 0);
                padding-bottom: var(--sab, 0);
                padding-left: var(--sal, 0);
            }
        `;
        document.head.appendChild(style);
    }

    // ============ BATTERY MONITORING ============
    async setupBatteryMonitoring() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();

                const checkBattery = () => {
                    const level = battery.level * 100;
                    const isLow = level < 20 && !battery.charging;

                    if (isLow && !this.lowPowerMode) {
                        this.enableLowPowerMode();
                    } else if (!isLow && this.lowPowerMode) {
                        this.disableLowPowerMode();
                    }
                };

                battery.addEventListener('levelchange', checkBattery);
                battery.addEventListener('chargingchange', checkBattery);
                checkBattery();

                console.log('🔋 Battery monitoring enabled');
            } catch (err) {
                console.warn('Battery API not supported');
            }
        }
    }

    enableLowPowerMode() {
        this.lowPowerMode = true;
        this.settings.particleMultiplier *= 0.5;
        this.settings.updateThrottle *= 2;
        console.log('🔋 Low power mode enabled');
    }

    disableLowPowerMode() {
        this.lowPowerMode = false;
        this.settings.particleMultiplier /= 0.5;
        this.settings.updateThrottle /= 2;
        console.log('🔋 Low power mode disabled');
    }

    // ============ ORIENTATION ============
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            // Small delay to let browser finish rotation
            setTimeout(() => {
                if (window.game && window.game.scale) {
                    window.game.scale.refresh();
                }
                console.log('📱 Orientation changed, refreshing scale');
            }, 100);
        });

        // Suggest landscape for better gameplay
        if (window.innerWidth < window.innerHeight && window.innerWidth < 768) {
            console.log('💡 Hint: Rotate to landscape for better experience');
        }
    }

    // ============ TOUCH RIPPLE EFFECT ============
    createTouchRipple(x, y, color = 0xffffff) {
        if (!this.gameScene) return;

        const ripple = this.gameScene.add.circle(x, y, 20, color, 0.3);
        ripple.setDepth(999999);
        ripple.setScrollFactor(0);

        this.gameScene.tweens.add({
            targets: ripple,
            radius: 60,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => ripple.destroy()
        });
    }

    // ============ PERFORMANCE HELPERS ============
    shouldSpawnParticle(baseChance = 1.0) {
        return Math.random() < (baseChance * this.settings.particleMultiplier);
    }

    getParticleCount(baseCount) {
        return Math.floor(baseCount * this.settings.particleMultiplier);
    }

    shouldUpdate(lastUpdate, throttle = null) {
        const delay = throttle || this.settings.updateThrottle;
        return Date.now() - lastUpdate >= delay;
    }

    // ============ UTILITY ============
    setGameScene(scene) {
        this.gameScene = scene;
    }

    getSettings() {
        return this.settings;
    }

    destroy() {
        this.releaseWakeLock();
    }
}

// Global mobile optimizer instance
const mobileOptimizer = new MobileOptimizer();
