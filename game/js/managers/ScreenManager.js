// Screen Manager - Single source of truth for UI state
// Handles transitions between START → LOBBY → GAME screens
class ScreenManager {
    constructor() {
        this.currentScreen = 'START';
        this.screens = {
            START: 'start',
            LOBBY: 'lobby',
            GAME: 'game'
        };

        // References to key elements
        this.startScreen = document.getElementById('startScreen');
        this.lobbyScreen = document.getElementById('lobbyScreen');
        this.gameContainer = document.getElementById('game-container');
        this.backgroundCanvas = document.getElementById('backgroundCanvas');

        // UI elements to hide in game
        this.menuElements = [
            document.getElementById('settingsBtn'),
            document.getElementById('charactersBtn'),
            document.getElementById('serverStatus')
        ];

        // State flags
        this.initialized = false;
        this.transitioning = false;

        this.init();
    }

    init() {
        // Check if user has an active game session (for auto-reconnect)
        const gameSession = localStorage.getItem('klyra_game_session');
        if (gameSession) {
            try {
                const session = JSON.parse(gameSession);
                // Session is valid if less than 30 minutes old
                const sessionAge = Date.now() - session.timestamp;
                if (sessionAge < 30 * 60 * 1000) { // 30 minutes
                    debug.info('CORE', 'Active game session found - auto-reconnecting...');
                    this.autoReconnect(session);
                    return;
                } else {
                    debug.info('CORE', 'Game session expired - clearing');
                    localStorage.removeItem('klyra_game_session');
                }
            } catch (e) {
                debug.error('CORE', 'Invalid game session data');
                localStorage.removeItem('klyra_game_session');
            }
        }

        // Check if user is already logged in
        const token = localStorage.getItem('klyra_token');
        const userData = localStorage.getItem('klyra_user');

        if (token && userData) {
            // User is logged in - skip start screen, go directly to lobby
            debug.info('CORE', 'User logged in - skipping start screen');
            this.setScreen('LOBBY', false);

            // Initialize main menu immediately
            if (!this.initialized) {
                window.mainMenuInstance = new MainMenu();
                this.initialized = true;
            }
        } else {
            // User not logged in - show start screen
            this.setScreen('START', false);

            // Setup start screen interaction
            this.setupStartScreen();
        }

        debug.info('CORE', 'ScreenManager initialized');
    }

    async autoReconnect(session) {
        try {
            debug.info('CORE', `Reconnecting as ${session.username} (${session.character})`);

            // Set screen to lobby first (to hide start screen)
            this.setScreen('LOBBY', false);

            // Initialize main menu
            if (!this.initialized) {
                window.mainMenuInstance = new MainMenu();
                this.initialized = true;
            }

            // Wait a moment for everything to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Set the character selection
            if (window.characterSelectManager) {
                window.characterSelectManager.selectCharacter(session.character);
            }

            // Connect to game
            if (window.game) {
                debug.info('CORE', 'Reconnecting to game...');
                await window.game.connect(session.username);

                // Transition to game screen
                await this.transitionToGame();
                debug.info('CORE', 'Auto-reconnect successful!');
            } else {
                throw new Error('Game not initialized');
            }
        } catch (error) {
            debug.error('CORE', 'Auto-reconnect failed:', error);
            // Clear invalid session and show lobby
            localStorage.removeItem('klyra_game_session');
            this.setScreen('LOBBY', false);
            if (!this.initialized) {
                window.mainMenuInstance = new MainMenu();
                this.initialized = true;
            }
        }
    }

    setupStartScreen() {
        // Click anywhere or press Enter/Space to start
        const startHandler = (e) => {
            if (this.currentScreen === 'START' && !this.transitioning) {
                if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
                    this.transitionToLobby();
                }
            }
        };

        this.startScreen.addEventListener('click', startHandler);
        document.addEventListener('keydown', startHandler);

        // Controller support for start screen - any button press
        this.setupControllerStartScreen();
    }

    setupControllerStartScreen() {
        // Check for controller button presses
        const checkController = () => {
            if (this.currentScreen !== 'START' || this.transitioning) return;

            const gamepads = navigator.getGamepads();
            if (!gamepads) return;

            for (let gamepad of gamepads) {
                if (!gamepad) continue;

                // Check if any button is pressed
                for (let button of gamepad.buttons) {
                    if (button && button.pressed) {
                        console.log('🎮 Controller button pressed on start screen');
                        this.transitionToLobby();
                        return;
                    }
                }
            }
        };

        // Check controller input every frame when on start screen
        const controllerLoop = () => {
            checkController();
            requestAnimationFrame(controllerLoop);
        };
        controllerLoop();
    }

    // Transition from START → LOBBY
    async transitionToLobby() {
        if (this.transitioning) return;

        debug.info('CORE', 'Transitioning START → LOBBY');
        this.transitioning = true;

        // Fade out start screen
        await this.setScreen('LOBBY', true);

        // Initialize main menu (particles, music, server check)
        if (!this.initialized) {
            debug.info('CORE', 'Initializing main menu...');
            window.mainMenuInstance = new MainMenu();
            this.initialized = true;
        }

        this.transitioning = false;
    }

    // Transition from LOBBY → GAME
    async transitionToGame() {
        if (this.transitioning) return;

        debug.info('CORE', 'Transitioning LOBBY → GAME');
        this.transitioning = true;

        // Set to game screen
        await this.setScreen('GAME', true);

        // Hide menu UI elements
        this.hideMenuElements();

        // Stop menu music
        if (window.mainMenuInstance) {
            window.mainMenuInstance.stopMusic();
        }

        this.transitioning = false;
    }

    // Set current screen with optional animation
    setScreen(screen, animate = false) {
        return new Promise((resolve) => {
            const screenName = this.screens[screen];
            if (!screenName) {
                debug.error('CORE', `Invalid screen: ${screen}`);
                resolve();
                return;
            }

            // Update body data attribute (triggers CSS transitions)
            document.body.setAttribute('data-screen', screenName);
            this.currentScreen = screen;

            // Wait for CSS transition if animated
            if (animate) {
                setTimeout(resolve, 500); // Match CSS transition duration
            } else {
                resolve();
            }
        });
    }

    hideMenuElements() {
        this.menuElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
    }

    showMenuElements() {
        this.menuElements.forEach(el => {
            if (el) el.style.display = '';
        });
    }

    // Get current screen
    getCurrentScreen() {
        return this.currentScreen;
    }

    // Check if in game
    isInGame() {
        return this.currentScreen === 'GAME';
    }

    // Check if transitioning
    isTransitioning() {
        return this.transitioning;
    }
}

// Create global instance
window.screenManager = new ScreenManager();
