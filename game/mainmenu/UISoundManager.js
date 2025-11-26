// UI Sound Manager - Handles button hover and click sounds
class UISoundManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.1; // Low volume for UI sounds
    }

    // Initialize sounds (called after Phaser loads them)
    init(phaserGame) {
        if (!phaserGame || !phaserGame.sound) {
            console.warn('⚠️ UISoundManager: Phaser game not ready');
            return;
        }

        try {
            this.sounds.cursor = phaserGame.sound.add('ui_cursor', { volume: this.volume });
            this.sounds.select = phaserGame.sound.add('ui_select', { volume: this.volume });
            console.log('🔊 UI sounds loaded: cursor (hover), select (click)');
        } catch (error) {
            console.warn('⚠️ UISoundManager: Failed to load sounds', error);
        }
    }

    // Play cursor hover sound
    playHover() {
        if (this.sounds.cursor) {
            this.sounds.cursor.play();
        }
    }

    // Play select click sound
    playClick() {
        if (this.sounds.select) {
            this.sounds.select.play();
        }
    }

    // Set volume for all UI sounds
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.sounds.cursor) this.sounds.cursor.setVolume(this.volume);
        if (this.sounds.select) this.sounds.select.setVolume(this.volume);
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.uiSoundManager = new UISoundManager();
}
