class MainMenu {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.menuMusic = null;
        this.soundEffects = {};
        this.serverOnline = false;
        this.checkingServer = true;
        this.musicStarted = false;
        
        this.portalCenter = { x: 0, y: 0 };

        // Controller navigation state
        this.controllerMenuOptions = [];
        this.selectedMenuIndex = 0;
        this.selectedCharacterIndex = 0;
        this.controllerDebugLogged = false;
        this.screenDebugLogged = false;
        this.gamepadDebugLogged = false;

        // Analog stick navigation
        this.analogDeadzone = 0.3; // Threshold for analog stick input
        this.lastAnalogInputTime = 0;
        this.analogInputDelay = 200; // ms between analog stick navigation inputs

        this.lastButtonState = {
            A: false,
            B: false,
            DPadUp: false,
            DPadDown: false,
            DPadLeft: false,
            DPadRight: false,
            Start: false
        };

        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.calculatePortalCenter();
        this.createParticles();
        this.addServerStatusIndicator();
        this.checkServerStatus();
        this.setupPortalInteraction();
        this.loadSoundEffects();
        this.animate();
        this.setupEventListeners();
        this.loadMenuMusic();
        this.loadSavedPlayerName();
        this.setupLobbyControllerNavigation();
        // this.setupControllerActivation(); // Disabled - no popup needed

        // Auto-start music immediately (user already clicked start screen)
        // Small delay to ensure audio context is ready
        setTimeout(() => {
            this.playMusic();
        }, 100);

        // Check server every 10 seconds
        setInterval(() => this.checkServerStatus(), 10000);
    }
    
    addServerStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'serverStatus';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 3px solid #FFD700;
            padding: 15px 25px;
            border-radius: 10px;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            color: #FFD700;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        `;
        
        indicator.innerHTML = `
            <span id="serverStatusDot" style="
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #888;
                display: inline-block;
                animation: pulse 1.5s ease-in-out infinite;
            "></span>
            <span id="serverStatusText">CHECKING SERVER...</span>
        `;
        
        document.body.appendChild(indicator);
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    async checkServerStatus() {
        const statusDot = document.getElementById('serverStatusDot');
        const statusText = document.getElementById('serverStatusText');
        const enterButton = document.querySelector('.enter-prompt');

        try {
            // Check health endpoint
            const serverURL = typeof GameConfig !== 'undefined' ? GameConfig.SERVER_URL : 'http://localhost:3002';
            const response = await fetch(`${serverURL}/health`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });

            // Check if we got a valid response
            if (response.ok) {
                const data = await response.json();
                this.serverOnline = true;
                this.checkingServer = false;

                statusDot.style.background = '#4AE290';
                statusDot.style.boxShadow = '0 0 10px #4AE290';
                statusDot.style.animation = 'none';
                statusText.textContent = 'SERVER ONLINE';
                statusText.style.color = '#4AE290';

                if (enterButton) {
                    enterButton.style.opacity = '1';
                    enterButton.style.cursor = 'pointer';
                    enterButton.style.pointerEvents = 'all';
                    // Keep original red button color
                    enterButton.style.removeProperty('background');
                }

                console.log('✅ Server check passed');
            } else {
                throw new Error(`Server returned ${response.status}`);
            }
        } catch (error) {
            // Even on error, enable the button - let the actual connection attempt handle it
            console.warn('⚠️ Server check failed, but enabling button anyway:', error);

            this.serverOnline = true; // Changed to true to enable button
            this.checkingServer = false;

            statusDot.style.background = '#FFA500'; // Orange - uncertain
            statusDot.style.boxShadow = '0 0 10px #FFA500';
            statusDot.style.animation = 'pulse 1.5s ease-in-out infinite';
            statusText.textContent = 'CHECKING...';
            statusText.style.color = '#FFA500';

            if (enterButton) {
                enterButton.style.opacity = '1';
                enterButton.style.cursor = 'pointer';
                enterButton.style.pointerEvents = 'all';
                enterButton.style.removeProperty('background');
            }
            
            console.warn('❌ Server is offline:', error.message);
        }
    }
    
    calculatePortalCenter() {
        this.portalCenter.x = window.innerWidth / 2;
        this.portalCenter.y = window.innerHeight / 2;
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new GravityParticle(this.canvas, this.portalCenter));
        }
    }
    
    loadSoundEffects() {
        const soundsPath = 'mainmenu/sounds/';
        
        this.soundEffects.portalHum = this.createOscillatorHum();
        this.soundEffects.hover = this.createSynthSound(400, 0.1);
        this.soundEffects.click = this.createSynthSound(600, 0.2);
        this.soundEffects.whoosh = this.createWhoosh();
    }
    
    createOscillatorHum() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        return { oscillator, gainNode, audioContext, isPlaying: false };
    }
    
    createSynthSound(frequency, duration) {
        return () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }
    
    createWhoosh() {
        return () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = audioContext.sampleRate * 1;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioContext.sampleRate * 0.3));
            }
            
            const noise = audioContext.createBufferSource();
            noise.buffer = buffer;
            
            const filter = audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            
            noise.connect(filter);
            filter.connect(audioContext.destination);
            
            noise.start();
        };
    }
    
    setupPortalInteraction() {
        const enterButton = document.querySelector('.enter-prompt');
        const portalClick = document.getElementById('portalClick');
        const statusText = document.getElementById('statusText');
        const lobbyScreen = document.getElementById('lobbyScreen');

        if (enterButton) {
            enterButton.addEventListener('click', async (e) => {
                e.stopPropagation();

                if (!this.serverOnline || this.checkingServer) {
                    statusText.textContent = 'Server not ready...';
                    statusText.style.color = '#FF4444';
                    return;
                }

                // Check if user is logged in
                let name = '';
                const token = localStorage.getItem('klyra_token');
                const userData = localStorage.getItem('klyra_user');

                if (token && userData) {
                    try {
                        const user = JSON.parse(userData);
                        if (user.username) {
                            name = user.username;
                            console.log('🔐 Using account username:', name);
                        }
                    } catch (e) {
                        console.error('Failed to parse user data:', e);
                    }
                }

                // If not logged in, send empty name - server will generate cute random name
                if (!token) {
                    name = '';
                    console.log('👤 Guest mode - server will generate random username');
                }

                enterButton.style.pointerEvents = 'none';
                statusText.textContent = 'Starting adventure...';
                statusText.style.color = '#4AE290';

                setTimeout(() => {
                    lobbyScreen.classList.add('portal-activated');
                }, 100);

                try {
                    if (window.game) {
                        console.log('🚀 Starting game.connect()...');
                        await window.game.connect(name);
                        console.log('✅ game.connect() completed successfully');

                        // Save game session for auto-reconnect on refresh
                        const selectedCharacter = window.characterSelectManager
                            ? window.characterSelectManager.getSelectedCharacter()
                            : 'MALACHAR';
                        localStorage.setItem('klyra_game_session', JSON.stringify({
                            username: name,
                            character: selectedCharacter,
                            timestamp: Date.now()
                        }));
                        console.log('💾 Game session saved for auto-reconnect');

                        setTimeout(() => {
                            // Use ScreenManager for clean transition
                            if (window.screenManager) {
                                console.log('🎬 Transitioning to game screen');
                                window.screenManager.transitionToGame();
                            } else {
                                console.error('❌ screenManager not found!');
                            }
                        }, 500);
                    } else {
                        console.error('❌ window.game not found!');
                        throw new Error('Game not initialized');
                    }
                } catch (error) {
                    console.error('❌ Gateway refused entry:', error);
                    console.error('Error details:', error.message, error.stack);
                    statusText.textContent = `Connection failed: ${error.message}`;
                    statusText.style.color = '#FF4444';
                    enterButton.style.pointerEvents = 'all';
                    lobbyScreen.classList.remove('portal-activated');
                }
            });
        }

        // Button is visible by default - removed hiding code
    }
    
    animateCarvedText(text) {
        // Placeholder for carved text animation
    }
    
    animate() {
        // Stop animation if we've stopped (entered game)
        if (this.animationStopped) return;

        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';  // Changed from blue to black
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
    
    // Add UI sounds to a button element
    addButtonSounds(button) {
        if (!button) return;

        // Add hover sound
        button.addEventListener('mouseenter', () => {
            if (window.uiSoundManager) {
                window.uiSoundManager.playHover();
            }
        });

        // Add click sound
        button.addEventListener('click', () => {
            if (window.uiSoundManager) {
                window.uiSoundManager.playClick();
            }
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.calculatePortalCenter();
        });

        const settingsBtn = document.getElementById('settingsBtn');
        const settingsPanel = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const musicVolume = document.getElementById('musicVolume');
        const volumeValue = document.getElementById('volumeValue');

        // Add UI sounds to buttons
        this.addButtonSounds(settingsBtn);
        this.addButtonSounds(closeSettings);
        this.addButtonSounds(document.querySelector('.enter-prompt'));
        this.addButtonSounds(document.getElementById('startButton'));
        this.addButtonSounds(document.getElementById('charactersBtn'));
        this.addButtonSounds(document.getElementById('closeCharacterSelect'));
        this.addButtonSounds(document.getElementById('fullscreenToggle'));

        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', () => {
                settingsPanel.classList.add('active');
            });
        }

        if (closeSettings && settingsPanel) {
            closeSettings.addEventListener('click', () => {
                settingsPanel.classList.remove('active');
            });
        }
        
        if (settingsPanel) {
            settingsPanel.addEventListener('click', (e) => {
                if (e.target === settingsPanel) {
                    settingsPanel.classList.remove('active');
                }
            });
        }
        
        if (musicVolume) {
            const savedVolume = localStorage.getItem('menuMusicVolume');
            if (savedVolume !== null) {
                musicVolume.value = savedVolume;
                if (volumeValue) {
                    volumeValue.textContent = savedVolume + '%';
                }
            }

            musicVolume.addEventListener('input', (e) => {
                const volume = e.target.value;
                if (volumeValue) {
                    volumeValue.textContent = volume + '%';
                }
                localStorage.setItem('menuMusicVolume', volume);

                if (this.menuMusic) {
                    this.menuMusic.volume = volume / 100;
                }
            });
        }
    }

    setupLobbyControllerNavigation() {
        // Setup menu options for controller navigation
        this.controllerMenuOptions = [
            {
                element: document.querySelector('.enter-prompt'),
                name: 'Enter Realm',
                action: () => {
                    // Trigger the enter button click
                    if (this.controllerMenuOptions[0].element) {
                        this.controllerMenuOptions[0].element.click();
                    }
                }
            },
            {
                element: document.getElementById('charactersBtn'),
                name: 'Characters',
                action: () => {
                    if (this.controllerMenuOptions[1].element) {
                        this.controllerMenuOptions[1].element.click();
                    }
                }
            },
            {
                element: document.getElementById('settingsBtn'),
                name: 'Settings',
                action: () => {
                    if (this.controllerMenuOptions[2].element) {
                        this.controllerMenuOptions[2].element.click();
                    }
                }
            }
        ];

        // Start with Enter Realm selected
        this.selectedMenuIndex = 0;
        this.updateLobbyMenuHighlight();

        // Add gamepad connection listeners
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Lobby: Gamepad connected:', e.gamepad.id);
            this.gamepadDebugLogged = false; // Reset flag to log detection again
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('🎮 Lobby: Gamepad disconnected:', e.gamepad.id);
        });

        // Start controller polling loop
        this.controllerLoopRunning = true;
        const controllerLoop = () => {
            if (!this.controllerLoopRunning) return;
            this.handleLobbyControllerInput();
            requestAnimationFrame(controllerLoop);
        };
        controllerLoop();

        console.log('🎮 Lobby controller navigation initialized');

        // Debug: Check if gamepads are available
        setTimeout(() => {
            const gamepads = navigator.getGamepads();
            console.log('🎮 Lobby: Checking gamepads after 1 second:', gamepads);
            if (gamepads && gamepads[0]) {
                console.log('🎮 Lobby: Gamepad found:', gamepads[0].id);
            } else {
                console.log('🎮 Lobby: No gamepad found. Try pressing any button on your controller.');
            }
        }, 1000);
    }

    handleLobbyControllerInput() {
        // Only handle input when on lobby screen
        const currentScreen = window.screenManager ? window.screenManager.getCurrentScreen() : 'UNKNOWN';
        if (window.screenManager && currentScreen !== 'LOBBY') {
            if (!this.screenDebugLogged) {
                console.log(`🎮 Lobby: Not on lobby screen, current screen is: ${currentScreen}`);
                this.screenDebugLogged = true;
            }
            return;
        } else {
            // Reset flag when we're back on lobby screen
            if (this.screenDebugLogged) {
                this.screenDebugLogged = false;
            }
        }

        const gamepads = navigator.getGamepads();

        // Look for any non-null gamepad in the array
        let activeGamepad = null;
        if (gamepads) {
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    activeGamepad = gamepads[i];
                    break;
                }
            }
        }

        if (!activeGamepad) {
            // No gamepad detected
            if (!this.gamepadDebugLogged) {
                console.log('🎮 Lobby: No gamepad detected - press any button on your controller');
                this.gamepadDebugLogged = true;
            }
            return;
        } else {
            if (this.gamepadDebugLogged) {
                console.log('🎮 Lobby: Gamepad now detected!', activeGamepad.id);
                this.gamepadDebugLogged = false;
            }
        }

        const pad = activeGamepad;

        // Debug: Log that we're processing controller input
        if (!this.controllerDebugLogged) {
            console.log('🎮 Lobby: Controller detected and processing input');
            this.controllerDebugLogged = true;
        }

        // Check if controller activation modal is still showing
        const activationModal = document.getElementById('controllerActivationModal');
        if (activationModal && activationModal.style.display === 'flex') {
            // Don't handle lobby input while activation modal is showing
            return;
        }

        // Check if settings or character select panels are open
        const settingsModal = document.getElementById('settingsModal');
        const characterSelectPanel = document.getElementById('characterSelectModal');
        const settingsPanelOpen = settingsModal && settingsModal.classList.contains('active');
        const characterSelectOpen = characterSelectPanel && characterSelectPanel.classList.contains('active');

        // Handle settings panel controller input
        if (settingsPanelOpen) {
            this.handleSettingsPanelController(pad);
            return;
        }

        // Handle character select panel controller input
        if (characterSelectOpen) {
            this.handleCharacterSelectController(pad);
            return;
        }

        // Get analog stick values (left stick vertical axis)
        const leftStickY = pad.axes[1] || 0; // Vertical axis (up/down)
        const now = Date.now();

        // D-pad up OR left stick up - navigate up
        if (this.isControllerButtonPressed(pad, 'DPadUp') ||
            (leftStickY < -this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
            this.selectedMenuIndex = (this.selectedMenuIndex - 1 + this.controllerMenuOptions.length) % this.controllerMenuOptions.length;
            this.updateLobbyMenuHighlight();
            console.log(`🎮 Lobby: Selected ${this.controllerMenuOptions[this.selectedMenuIndex].name}`);
            if (leftStickY < -this.analogDeadzone) {
                this.lastAnalogInputTime = now;
            }
        }

        // D-pad down OR left stick down - navigate down
        if (this.isControllerButtonPressed(pad, 'DPadDown') ||
            (leftStickY > this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
            this.selectedMenuIndex = (this.selectedMenuIndex + 1) % this.controllerMenuOptions.length;
            this.updateLobbyMenuHighlight();
            console.log(`🎮 Lobby: Selected ${this.controllerMenuOptions[this.selectedMenuIndex].name}`);
            if (leftStickY > this.analogDeadzone) {
                this.lastAnalogInputTime = now;
            }
        }

        // A button or Start button - activate selected option
        if (this.isControllerButtonPressed(pad, 'A') || this.isControllerButtonPressed(pad, 'Start')) {
            const selected = this.controllerMenuOptions[this.selectedMenuIndex];
            if (selected && selected.action) {
                console.log(`🎮 Lobby: Activated ${selected.name}`);
                selected.action();
            }
        }
    }

    handleSettingsPanelController(pad) {
        const settingsModal = document.getElementById('settingsModal');
        const musicVolume = document.getElementById('musicVolume');
        const closeSettings = document.getElementById('closeSettings');

        // B button or Start button to close settings
        if (this.isControllerButtonPressed(pad, 'B') || this.isControllerButtonPressed(pad, 'Start')) {
            if (closeSettings) closeSettings.click();
            console.log('🎮 Closed settings with controller');
            return;
        }

        // Get analog stick values
        const leftStickX = pad.axes[0] || 0; // Horizontal axis (left/right)
        const now = Date.now();

        // D-pad left/right OR left stick left/right to adjust volume
        if (musicVolume) {
            let volumeChanged = false;
            let newVolume = parseInt(musicVolume.value);

            if (this.isControllerButtonPressed(pad, 'DPadLeft') ||
                (leftStickX < -this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
                newVolume = Math.max(0, newVolume - 5);
                volumeChanged = true;
                if (leftStickX < -this.analogDeadzone) {
                    this.lastAnalogInputTime = now;
                }
            }
            if (this.isControllerButtonPressed(pad, 'DPadRight') ||
                (leftStickX > this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
                newVolume = Math.min(100, newVolume + 5);
                volumeChanged = true;
                if (leftStickX > this.analogDeadzone) {
                    this.lastAnalogInputTime = now;
                }
            }

            if (volumeChanged) {
                musicVolume.value = newVolume;
                // Trigger input event to update display and save
                const event = new Event('input', { bubbles: true });
                musicVolume.dispatchEvent(event);
                console.log(`🎮 Settings: Volume set to ${newVolume}%`);
            }
        }
    }

    handleCharacterSelectController(pad) {
        // Get all character cards
        const characterGrid = document.getElementById('characterGrid');
        if (!characterGrid) return;

        const characterCards = Array.from(characterGrid.querySelectorAll('.character-card:not(.locked)'));
        if (characterCards.length === 0) return;

        // Calculate grid dimensions based on window width
        const gridWidth = characterGrid.offsetWidth;
        const cardMinWidth = 320; // From CSS: minmax(320px, 1fr)
        const gap = 35; // From CSS
        const columnsPerRow = Math.max(1, Math.floor((gridWidth + gap) / (cardMinWidth + gap)));

        // Initialize highlight on first call
        if (!this.characterSelectInitialized) {
            this.selectedCharacterIndex = 0;
            this.updateCharacterSelectHighlight(characterCards);
            this.characterSelectInitialized = true;
            console.log(`🎮 Character Select: Controller navigation initialized (${columnsPerRow} columns)`);
        }

        // B button to close character select
        if (this.isControllerButtonPressed(pad, 'B')) {
            const closeBtn = document.getElementById('closeCharacterSelect');
            if (closeBtn) {
                closeBtn.click();
                this.characterSelectInitialized = false; // Reset for next time
            }
            console.log('🎮 Closed character select with B button');
            return;
        }

        // Get analog stick values
        const leftStickX = pad.axes[0] || 0; // Horizontal axis (left/right)
        const leftStickY = pad.axes[1] || 0; // Vertical axis (up/down)
        const now = Date.now();

        // Calculate current row and column
        const currentRow = Math.floor(this.selectedCharacterIndex / columnsPerRow);
        const currentCol = this.selectedCharacterIndex % columnsPerRow;
        const totalRows = Math.ceil(characterCards.length / columnsPerRow);

        // D-pad UP OR left stick up - move up one row
        if (this.isControllerButtonPressed(pad, 'DPadUp') ||
            (leftStickY < -this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
            if (currentRow > 0) {
                // Move to same column in previous row
                const newIndex = (currentRow - 1) * columnsPerRow + currentCol;
                this.selectedCharacterIndex = Math.min(newIndex, characterCards.length - 1);
            } else {
                // Wrap to bottom row, same column
                const newRow = totalRows - 1;
                const newIndex = newRow * columnsPerRow + currentCol;
                this.selectedCharacterIndex = Math.min(newIndex, characterCards.length - 1);
            }
            this.updateCharacterSelectHighlight(characterCards);
            console.log(`🎮 Character Select: Moved UP to card ${this.selectedCharacterIndex + 1}/${characterCards.length}`);
            if (leftStickY < -this.analogDeadzone) {
                this.lastAnalogInputTime = now;
            }
        }

        // D-pad DOWN OR left stick down - move down one row
        if (this.isControllerButtonPressed(pad, 'DPadDown') ||
            (leftStickY > this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
            if (currentRow < totalRows - 1) {
                // Move to same column in next row
                const newIndex = (currentRow + 1) * columnsPerRow + currentCol;
                this.selectedCharacterIndex = Math.min(newIndex, characterCards.length - 1);
            } else {
                // Wrap to top row, same column
                this.selectedCharacterIndex = currentCol;
            }
            this.updateCharacterSelectHighlight(characterCards);
            console.log(`🎮 Character Select: Moved DOWN to card ${this.selectedCharacterIndex + 1}/${characterCards.length}`);
            if (leftStickY > this.analogDeadzone) {
                this.lastAnalogInputTime = now;
            }
        }

        // D-pad LEFT OR left stick left - move left within row
        if (this.isControllerButtonPressed(pad, 'DPadLeft') ||
            (leftStickX < -this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
            if (currentCol > 0) {
                // Move left in same row
                this.selectedCharacterIndex--;
            } else {
                // Wrap to end of previous row
                if (currentRow > 0) {
                    const prevRowEnd = currentRow * columnsPerRow - 1;
                    this.selectedCharacterIndex = prevRowEnd;
                } else {
                    // Wrap to last card
                    this.selectedCharacterIndex = characterCards.length - 1;
                }
            }
            this.updateCharacterSelectHighlight(characterCards);
            console.log(`🎮 Character Select: Moved LEFT to card ${this.selectedCharacterIndex + 1}/${characterCards.length}`);
            if (leftStickX < -this.analogDeadzone) {
                this.lastAnalogInputTime = now;
            }
        }

        // D-pad RIGHT OR left stick right - move right within row
        if (this.isControllerButtonPressed(pad, 'DPadRight') ||
            (leftStickX > this.analogDeadzone && now - this.lastAnalogInputTime > this.analogInputDelay)) {
            const rowEnd = Math.min((currentRow + 1) * columnsPerRow - 1, characterCards.length - 1);
            if (this.selectedCharacterIndex < rowEnd) {
                // Move right in same row
                this.selectedCharacterIndex++;
            } else {
                // Wrap to start of next row
                if (currentRow < totalRows - 1) {
                    this.selectedCharacterIndex = (currentRow + 1) * columnsPerRow;
                } else {
                    // Wrap to first card
                    this.selectedCharacterIndex = 0;
                }
            }
            this.updateCharacterSelectHighlight(characterCards);
            console.log(`🎮 Character Select: Moved RIGHT to card ${this.selectedCharacterIndex + 1}/${characterCards.length}`);
            if (leftStickX > this.analogDeadzone) {
                this.lastAnalogInputTime = now;
            }
        }

        // A button - select character
        if (this.isControllerButtonPressed(pad, 'A')) {
            const selectedCard = characterCards[this.selectedCharacterIndex];
            if (selectedCard) {
                selectedCard.click();
                console.log(`🎮 Character Select: Selected character at index ${this.selectedCharacterIndex}`);
            }
        }
    }

    updateCharacterSelectHighlight(characterCards) {
        // Remove highlight from all cards
        characterCards.forEach((card, index) => {
            if (index === this.selectedCharacterIndex) {
                // Add controller highlight
                card.style.outline = '4px solid #FFD700';
                card.style.outlineOffset = '4px';
                card.style.transform = 'scale(1.05)';
                card.style.transition = 'all 0.2s ease';

                // Scroll card into view if needed
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                // Remove highlight
                card.style.outline = '';
                card.style.outlineOffset = '';
                card.style.transform = '';
            }
        });
    }

    updateLobbyMenuHighlight() {
        // Remove highlight from all menu options
        this.controllerMenuOptions.forEach((option, index) => {
            if (option.element) {
                if (index === this.selectedMenuIndex) {
                    // Add highlight
                    option.element.style.boxShadow = '0 0 20px 5px rgba(255, 255, 0, 0.8)';
                    option.element.style.transform = 'scale(1.1)';
                    option.element.style.transition = 'all 0.2s ease';
                } else {
                    // Remove highlight
                    option.element.style.boxShadow = '';
                    option.element.style.transform = '';
                }
            }
        });
    }

    isControllerButtonPressed(pad, buttonName) {
        if (!pad) return false;

        let currentState = false;

        // Map button names to gamepad buttons
        switch(buttonName) {
            case 'A':
                currentState = pad.buttons[0] ? pad.buttons[0].pressed : false;
                break;
            case 'B':
                currentState = pad.buttons[1] ? pad.buttons[1].pressed : false;
                break;
            case 'Start':
                currentState = pad.buttons[9] ? pad.buttons[9].pressed : false;
                break;
            case 'DPadUp':
                currentState = pad.buttons[12] ? pad.buttons[12].pressed : false;
                break;
            case 'DPadDown':
                currentState = pad.buttons[13] ? pad.buttons[13].pressed : false;
                break;
            case 'DPadLeft':
                currentState = pad.buttons[14] ? pad.buttons[14].pressed : false;
                break;
            case 'DPadRight':
                currentState = pad.buttons[15] ? pad.buttons[15].pressed : false;
                break;
        }

        // Edge detection: only return true on button down (not held)
        const wasPressed = this.lastButtonState[buttonName];
        this.lastButtonState[buttonName] = currentState;

        return currentState && !wasPressed;
    }

    setupControllerActivation() {
        const modal = document.getElementById('controllerActivationModal');
        const skipBtn = document.getElementById('skipControllerActivation');

        if (!modal || !skipBtn) {
            console.warn('⚠️ Controller activation modal elements not found');
            return;
        }

        let modalShown = false;
        let controllerActivated = false;

        // Check if controller was previously activated or skipped
        const wasActivated = localStorage.getItem('klyra_controller_activated');
        if (wasActivated === 'true' || wasActivated === 'skipped') {
            controllerActivated = true;
            console.log('🎮 Controller previously activated or skipped');
        }

        // Check for gamepad and handle activation
        const checkAndActivateGamepad = () => {
            const gamepads = navigator.getGamepads();
            if (!gamepads || !gamepads[0]) {
                modalShown = false;
                return;
            }

            const pad = gamepads[0];

            // If controller is already activated, no need to show modal
            if (controllerActivated) {
                return;
            }

            // Show modal if gamepad detected and not yet shown
            if (!modalShown) {
                modal.style.display = 'flex';
                modalShown = true;
                console.log('🎮 Controller detected - showing activation modal');
            }

            // Check for any button press to activate
            let anyButtonPressed = false;
            for (let i = 0; i < pad.buttons.length; i++) {
                if (pad.buttons[i].pressed) {
                    anyButtonPressed = true;
                    break;
                }
            }

            if (anyButtonPressed) {
                controllerActivated = true;
                modalShown = false;
                localStorage.setItem('klyra_controller_activated', 'true');
                modal.style.display = 'none';
                console.log('🎮 Controller activated via button press');
            }
        };

        // Skip button handler
        skipBtn.addEventListener('click', () => {
            controllerActivated = true; // Mark as handled so modal doesn't reappear
            modalShown = false;
            localStorage.setItem('klyra_controller_activated', 'skipped');
            modal.style.display = 'none';
            console.log('🎮 Controller activation skipped - using keyboard');
        });

        // Listen for gamepad connection events
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id);
            if (!controllerActivated && !modalShown) {
                modal.style.display = 'flex';
                modalShown = true;
            }
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('🎮 Gamepad disconnected:', e.gamepad.id);
            modal.style.display = 'none';
            modalShown = false;
        });

        // Continuously check for gamepad and activation
        const activationLoop = () => {
            checkAndActivateGamepad();
            requestAnimationFrame(activationLoop);
        };
        activationLoop();

        console.log('🎮 Controller activation system initialized');
    }

    loadMenuMusic() {
        const musicPath = 'assets/music/poltergeist-and-a-piano.mp3';
        this.menuMusic = new Audio(musicPath);
        this.menuMusic.loop = true;

        const savedVolume = localStorage.getItem('menuMusicVolume');
        const volumeLevel = savedVolume !== null ? parseInt(savedVolume) / 100 : 0.025; // Default 2.5%
        this.menuMusic.volume = volumeLevel;

        console.log('🎵 Menu music loaded: Poltergeist and a Piano');
    }
    
    playMusic() {
        if (this.menuMusic && !this.musicStarted) {
            this.menuMusic.play().then(() => {
                this.musicStarted = true;
                console.log('🎵 Menu music started playing');
            }).catch(err => {
                console.log('Could not play menu music:', err);
            });
        }
    }
    
    stopMusic() {
        if (this.menuMusic) {
            this.menuMusic.pause();
            this.menuMusic.currentTime = 0;
            this.musicStarted = false;
        }
        // Stop particle animation to save performance in-game
        this.animationStopped = true;

        // Stop controller loop
        this.controllerLoopRunning = false;

        // Clear controller highlights when leaving lobby
        this.controllerMenuOptions.forEach(option => {
            if (option.element) {
                option.element.style.boxShadow = '';
                option.element.style.transform = '';
            }
        });
    }
    
    loadSavedPlayerName() {
        const nameDisplay = document.getElementById('nameDisplay');

        // Check if user is logged in
        const token = localStorage.getItem('klyra_token');
        const userData = localStorage.getItem('klyra_user');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                if (user.username) {
                    // User is logged in - show welcome message
                    if (nameDisplay) {
                        nameDisplay.innerHTML = `
                            <div class="name-label" style="margin-bottom: 10px;">WELCOME BACK</div>
                            <div style="font-size: 24px; background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-family: 'Press Start 2P', monospace; text-shadow: 0 0 20px rgba(139, 92, 246, 0.8);">
                                ${user.username.toUpperCase()}
                            </div>
                        `;
                    }
                    console.log('✅ Logged in as:', user.username);
                    return;
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }

        // Not logged in - show guest message
        if (nameDisplay) {
            nameDisplay.innerHTML = `
                <div class="name-label" style="margin-bottom: 15px;">PLAYING AS GUEST</div>
                <div style="font-size: 12px; color: #AAA; font-family: 'Press Start 2P', monospace; line-height: 1.6; margin-bottom: 10px;">
                    You'll get a random username
                </div>
                <a href="../account.html" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #8b5cf6, #ec4899);
                    color: white;
                    text-decoration: none;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 10px;
                    border-radius: 5px;
                    transition: transform 0.3s, box-shadow 0.3s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 20px rgba(139, 92, 246, 0.4)';"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    CREATE ACCOUNT FOR CUSTOM NAME
                </a>
            `;
        }
        console.log('👤 Guest mode - random username will be assigned');
    }
}

class GravityParticle {
    constructor(canvas, portalCenter) {
        this.canvas = canvas;
        this.portalCenter = portalCenter;
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.vx = 0;
        this.vy = 0;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.3;
    }
    
    update() {
        const dx = this.portalCenter.x - this.x;
        const dy = this.portalCenter.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            this.reset();
            return;
        }
        
        const force = 100 / (distance * distance);
        const angle = Math.atan2(dy, dx);
        
        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;
        
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0 || this.x > this.canvas.width || 
            this.y < 0 || this.y > this.canvas.height) {
            this.reset();
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = `rgba(107, 79, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Main menu will be initialized by start screen
// Don't auto-create instance here anymore