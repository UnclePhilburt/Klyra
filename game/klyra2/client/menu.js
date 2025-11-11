// KLYRA MAIN MENU - PREMIUM EDITION

class Menu {
    constructor() {
        this.menuElement = null;
        this.gameStarted = false;
        this.onPlayCallback = null;
        
        // Player customization
        this.playerName = '';
        this.playerColor = '#e74c3c';
        
        // Particle system
        this.particleCanvas = null;
        this.particleCtx = null;
        this.particles = [];
        this.particleAnimationId = null;
        
        // Settings
        this.settingsOpen = false;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.musicVolume = 0.5;
        
        // Audio
        this.menuMusic = null;
        
        // Music Playlist (add more tracks here as you get them)
        this.menuMusicPlaylist = [
            './assets/music/mainmenu/return-to-the-8-bit-past.mp3'
            // Add more tracks like:
            // './assets/music/mainmenu/another-track.mp3',
            // './assets/music/mainmenu/third-track.mp3',
        ];
        this.currentTrackIndex = -1;
        this.playedTracks = []; // Track which songs have played
    }
    
    // Initialize menu
    init() {
        this.menuElement = document.getElementById('mainMenu');
        
        if (!this.menuElement) {
            console.error('Menu element not found!');
            return;
        }
        
        // Initialize audio
        this.initAudio();
        
        // Initialize particle system
        this.initParticles();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show menu
        this.show();
        
        console.log('Premium menu initialized');
    }
    
    // Initialize audio system
    initAudio() {
        this.menuMusic = document.getElementById('menuMusic');
        
        if (this.menuMusic) {
            // Set initial volume
            this.menuMusic.volume = this.musicVolume;
            
            // Load first random track
            this.playRandomTrack();
            
            // When track ends, play another random track
            this.menuMusic.addEventListener('ended', () => {
                this.playRandomTrack();
            });
            
            // Handle autoplay blocking with visual feedback
            const playPromise = this.menuMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Music started successfully
                    console.log('Music started automatically');
                    this.hideMusicPrompt();
                }).catch(error => {
                    // Autoplay blocked - show prompt
                    console.log('Autoplay blocked - showing prompt');
                    this.showMusicPrompt();
                    
                    // Start music on ANY user interaction
                    const startMusic = () => {
                        if (this.musicEnabled && this.menuMusic.paused) {
                            this.menuMusic.play().then(() => {
                                console.log('Music started after user interaction');
                                this.hideMusicPrompt();
                                // Remove listeners after music starts
                                document.removeEventListener('click', startMusic);
                                document.removeEventListener('keydown', startMusic);
                            }).catch(err => {
                                console.log('Still blocked:', err);
                            });
                        }
                    };
                    
                    document.addEventListener('click', startMusic);
                    document.addEventListener('keydown', startMusic);
                });
            }
        }
    }
    
    // Show music prompt
    showMusicPrompt() {
        const prompt = document.getElementById('musicPrompt');
        if (prompt) {
            prompt.classList.remove('hidden');
        }
    }
    
    // Hide music prompt
    hideMusicPrompt() {
        const prompt = document.getElementById('musicPrompt');
        if (prompt) {
            prompt.classList.add('hidden');
        }
    }
    
    // Play a random track from the playlist
    playRandomTrack() {
        if (!this.menuMusic || this.menuMusicPlaylist.length === 0) return;
        
        // If we've played all tracks, reset the played list
        if (this.playedTracks.length >= this.menuMusicPlaylist.length) {
            this.playedTracks = [];
            console.log('Playlist cycled, reshuffling...');
        }
        
        // Get available tracks (not yet played this cycle)
        const availableTracks = this.menuMusicPlaylist
            .map((track, index) => ({ track, index }))
            .filter(item => !this.playedTracks.includes(item.index));
        
        // Pick random track from available
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        const selectedTrack = availableTracks[randomIndex];
        
        // Mark as played
        this.playedTracks.push(selectedTrack.index);
        this.currentTrackIndex = selectedTrack.index;
        
        // Load and play track
        this.menuMusic.src = selectedTrack.track;
        this.menuMusic.load();
        
        console.log(`Playing: ${selectedTrack.track.split('/').pop()}`);
        
        // Play if music is enabled
        if (this.musicEnabled) {
            const playPromise = this.menuMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Play blocked:', error);
                });
            }
        }
    }
    
    // Initialize particle system
    initParticles() {
        this.particleCanvas = document.getElementById('particleCanvas');
        if (!this.particleCanvas) return;
        
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        // Create particles
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.particleCanvas.width,
                y: Math.random() * this.particleCanvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        
        // Start animation
        this.animateParticles();
        
        // Handle resize
        window.addEventListener('resize', () => {
            if (this.particleCanvas) {
                this.particleCanvas.width = window.innerWidth;
                this.particleCanvas.height = window.innerHeight;
            }
        });
    }
    
    // Animate particles
    animateParticles() {
        if (!this.particleCtx || !this.particleCanvas) return;
        
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Update and draw particles
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.particleCanvas.width;
            if (particle.x > this.particleCanvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.particleCanvas.height;
            if (particle.y > this.particleCanvas.height) particle.y = 0;
            
            // Draw particle
            this.particleCtx.fillStyle = `rgba(231, 76, 60, ${particle.opacity})`;
            this.particleCtx.beginPath();
            this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.particleCtx.fill();
            
            // Draw connections to nearby particles
            this.particles.slice(index + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.particleCtx.strokeStyle = `rgba(231, 76, 60, ${0.1 * (1 - distance / 150)})`;
                    this.particleCtx.lineWidth = 1;
                    this.particleCtx.beginPath();
                    this.particleCtx.moveTo(particle.x, particle.y);
                    this.particleCtx.lineTo(otherParticle.x, otherParticle.y);
                    this.particleCtx.stroke();
                }
            });
        });
        
        this.particleAnimationId = requestAnimationFrame(() => this.animateParticles());
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Player name input
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput) {
            // Load saved name from localStorage
            const savedName = localStorage.getItem('klyraPlayerName');
            if (savedName) {
                nameInput.value = savedName;
                this.playerName = savedName;
            }
            
            // Save name as user types
            nameInput.addEventListener('input', (e) => {
                this.playerName = e.target.value.trim();
                // Save to localStorage
                if (this.playerName) {
                    localStorage.setItem('klyraPlayerName', this.playerName);
                }
            });
            
            // Focus input on load
            setTimeout(() => {
                if (!nameInput.value) {
                    nameInput.focus();
                }
            }, 1500);
        }
        
        // Music prompt click
        const musicPrompt = document.getElementById('musicPrompt');
        if (musicPrompt) {
            musicPrompt.addEventListener('click', () => {
                if (this.menuMusic && this.musicEnabled && this.menuMusic.paused) {
                    this.menuMusic.play().then(() => {
                        this.hideMusicPrompt();
                    });
                }
            });
        }
        
        // Play button
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => this.startGame());
            
            // Add sound effect on hover (visual feedback)
            playButton.addEventListener('mouseenter', () => {
                playButton.style.transform = 'translateY(-3px) scale(1.05)';
            });
            
            playButton.addEventListener('mouseleave', () => {
                if (!playButton.disabled) {
                    playButton.style.transform = '';
                }
            });
        }
        
        // Settings button
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => this.toggleSettings());
        }
        
        // Settings panel close on mobile (clicking the X or panel itself)
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.addEventListener('click', (e) => {
                // Check if mobile (screen width < 1024)
                if (window.innerWidth < 1024) {
                    // Close if clicking the panel background (not a control)
                    if (e.target === settingsPanel) {
                        this.toggleSettings();
                    }
                    // Also close if clicking in the top-right area (close button)
                    const rect = settingsPanel.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;
                    
                    // Close button is top-right 60px square
                    if (clickX > rect.width - 60 && clickY < 60) {
                        this.toggleSettings();
                    }
                }
            });
        }
        
        // Music volume slider
        const musicVolumeSlider = document.getElementById('musicVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.musicVolume = volume;
                musicVolumeValue.textContent = `${e.target.value}%`;
                
                // Update slider fill
                e.target.style.setProperty('--volume-percent', `${e.target.value}%`);
                
                if (this.menuMusic) {
                    this.menuMusic.volume = volume;
                }
            });
            
            // Initialize slider fill
            musicVolumeSlider.style.setProperty('--volume-percent', '50%');
        }
        
        // Music toggle
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                this.musicEnabled = !this.musicEnabled;
                musicToggle.classList.toggle('active');
                
                if (this.menuMusic) {
                    if (this.musicEnabled) {
                        // Resume or start playing
                        if (this.menuMusic.src) {
                            this.menuMusic.play();
                        } else {
                            this.playRandomTrack();
                        }
                    } else {
                        this.menuMusic.pause();
                    }
                }
            });
        }
        
        // SFX toggle
        const sfxToggle = document.getElementById('sfxToggle');
        if (sfxToggle) {
            sfxToggle.addEventListener('click', () => {
                this.sfxEnabled = !this.sfxEnabled;
                sfxToggle.classList.toggle('active');
            });
        }
        
        // Close settings when clicking outside (desktop only)
        document.addEventListener('click', (e) => {
            const settingsPanel = document.getElementById('settingsPanel');
            const settingsButton = document.getElementById('settingsButton');
            
            // Only apply this on desktop
            if (window.innerWidth >= 1024) {
                if (this.settingsOpen && 
                    settingsPanel && 
                    !settingsPanel.contains(e.target) && 
                    !settingsButton.contains(e.target)) {
                    this.toggleSettings();
                }
            }
        });
        
        // Enter key to play
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' && !this.gameStarted) {
                this.startGame();
            }
        });
    }
    
    // Toggle settings panel
    toggleSettings() {
        this.settingsOpen = !this.settingsOpen;
        const settingsPanel = document.getElementById('settingsPanel');
        
        if (settingsPanel) {
            if (this.settingsOpen) {
                settingsPanel.classList.add('open');
            } else {
                settingsPanel.classList.remove('open');
            }
        }
    }
    
    // Show menu
    show() {
        if (this.menuElement) {
            this.menuElement.classList.remove('hidden');
            this.menuElement.style.opacity = '0';
            
            // Fade in
            setTimeout(() => {
                this.menuElement.style.transition = 'opacity 0.8s ease-out';
                this.menuElement.style.opacity = '1';
            }, 100);
        }
        
        // Hide game canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
        
        // Start/resume music with fade in
        if (this.menuMusic && this.musicEnabled) {
            // If no track is loaded, play a random one
            if (!this.menuMusic.src) {
                this.playRandomTrack();
            } else {
                // Resume current track
                this.menuMusic.volume = 0;
                this.menuMusic.play();
            }
            
            const targetVolume = this.musicVolume;
            const fadeInInterval = setInterval(() => {
                if (this.menuMusic.volume < targetVolume - 0.05) {
                    this.menuMusic.volume += 0.05;
                } else {
                    this.menuMusic.volume = targetVolume;
                    clearInterval(fadeInInterval);
                }
            }, 50);
        }
        
        // Restart particle animation if stopped
        if (!this.particleAnimationId) {
            this.animateParticles();
        }
    }
    
    // Hide menu with premium transition
    hide() {
        if (this.menuElement) {
            // Add exit animation
            this.menuElement.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            this.menuElement.style.opacity = '0';
            this.menuElement.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                this.menuElement.classList.add('hidden');
                this.menuElement.style.transform = '';
            }, 600);
        }
        
        // Hide music prompt
        this.hideMusicPrompt();
        
        // Fade out music
        if (this.menuMusic && !this.menuMusic.paused) {
            const fadeOutInterval = setInterval(() => {
                if (this.menuMusic.volume > 0.05) {
                    this.menuMusic.volume -= 0.05;
                } else {
                    this.menuMusic.volume = 0;
                    this.menuMusic.pause();
                    clearInterval(fadeOutInterval);
                }
            }, 50);
        }
        
        // Stop particle animation
        if (this.particleAnimationId) {
            cancelAnimationFrame(this.particleAnimationId);
            this.particleAnimationId = null;
        }
        
        // Show game canvas with fade in
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.opacity = '0';
            canvas.style.display = 'block';
            setTimeout(() => {
                canvas.style.transition = 'opacity 0.6s ease-in';
                canvas.style.opacity = '1';
            }, 100);
        }
    }
    
    // Start game with premium effects
    startGame() {
        if (this.gameStarted) return;
        
        console.log('Starting game...');
        this.gameStarted = true;
        
        // Update button with loading state
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.textContent = 'CONNECTING...';
            playButton.disabled = true;
            playButton.style.transform = '';
        }
        
        // Hide menu after short delay
        setTimeout(() => {
            this.hide();
            
            // Show loading screen
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.classList.remove('hidden');
            }
            
            // Call game start callback
            if (this.onPlayCallback) {
                this.onPlayCallback();
            }
        }, 400);
    }
    
    // Set callback for when play is clicked
    onPlay(callback) {
        this.onPlayCallback = callback;
    }
    
    // Get player customization
    getCustomization() {
        // Make sure name is trimmed and not empty
        const finalName = this.playerName && this.playerName.trim() ? this.playerName.trim() : 'Player';
        
        return {
            name: finalName,
            color: this.playerColor
        };
    }
    
    // Show error message with premium styling
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.95) 0%, rgba(192, 57, 43, 0.95) 100%);
            color: white;
            padding: 25px 40px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(231, 76, 60, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.2);
            animation: errorPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds with fade out
        setTimeout(() => {
            errorDiv.style.transition = 'opacity 0.3s, transform 0.3s';
            errorDiv.style.opacity = '0';
            errorDiv.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }
    
    // Cleanup
    destroy() {
        if (this.particleAnimationId) {
            cancelAnimationFrame(this.particleAnimationId);
        }
        this.particles = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Menu;
}