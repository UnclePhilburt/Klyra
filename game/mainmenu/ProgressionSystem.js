// PROGRESSION SYSTEM
// Manages character unlocks, selection, and player progression
// Stores data in localStorage

class ProgressionSystem {
    constructor() {
        this.saveKey = 'klyra_progression';
        this.version = 3; // Version 3: ALL characters locked by default, only free rotation available
        this.data = this.loadData();

        // Auto-unlock all characters on localhost for testing
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';

        if (isLocalhost) {
            console.log('🔓 Localhost detected - unlocking all characters for testing');
            this.unlockAllCharacters();
        }
    }

    loadData() {
        const saved = localStorage.getItem(this.saveKey);

        if (saved) {
            try {
                const data = JSON.parse(saved);

                // Check version - if old version, reset to defaults
                if (!data.version || data.version < this.version) {
                    console.log('🔄 Progression system updated - resetting character unlocks');
                    return this.getDefaultData();
                }

                return data;
            } catch (e) {
                console.warn('⚠️ Failed to load progression data, using defaults');
                return this.getDefaultData();
            }
        }

        return this.getDefaultData();
    }

    getDefaultData() {
        return {
            version: this.version,
            selectedCharacter: null, // No default character - will use free rotation
            unlockedCharacters: [
                // ALL characters are locked by default
                // Must be unlocked with souls or play during free rotation
            ],
            stats: {
                totalRuns: 0,
                totalKills: 0,
                totalDeaths: 0,
                highestLevel: 1,
                playtime: 0
            },
            achievements: [],
            settings: {
                volume: 30,
                fullscreen: false,
                particleEffects: true
            }
        };
    }

    saveData() {
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(this.data));
            console.log('💾 Progression saved');
        } catch (e) {
            console.error('❌ Failed to save progression:', e);
        }
    }

    // Character Management
    getSelectedCharacter() {
        // Return selected character, or null if none selected
        // CharacterSelectManager will handle defaulting to free character
        return this.data.selectedCharacter || null;
    }

    selectCharacter(characterId, isFree = false) {
        if (!this.isCharacterUnlocked(characterId) && !isFree) {
            console.warn(`⚠️ Cannot select locked character: ${characterId}`);
            return false;
        }

        this.data.selectedCharacter = characterId;
        this.saveData();

        if (isFree) {
            console.log(`✅ Free character selected: ${characterId}`);
        } else {
            console.log(`✅ Character selected: ${characterId}`);
        }
        return true;
    }

    isCharacterUnlocked(characterId) {
        return this.data.unlockedCharacters.includes(characterId);
    }

    unlockCharacter(characterId) {
        if (!this.isCharacterUnlocked(characterId)) {
            this.data.unlockedCharacters.push(characterId);
            this.saveData();
            console.log(`🎉 Character unlocked: ${characterId}`);
            return true;
        }
        return false;
    }

    getUnlockedCharacters() {
        return [...this.data.unlockedCharacters];
    }

    unlockAllCharacters() {
        // Get all character IDs from CharacterSystem
        if (typeof CharacterSystem !== 'undefined' && CharacterSystem.CHARACTERS) {
            const allCharacterIds = Object.keys(CharacterSystem.CHARACTERS);
            allCharacterIds.forEach(charId => {
                if (!this.isCharacterUnlocked(charId)) {
                    this.data.unlockedCharacters.push(charId);
                }
            });
            this.saveData();
            console.log('🎉 All characters unlocked:', this.data.unlockedCharacters);
        }
    }

    // Stats Management
    incrementRuns() {
        this.data.stats.totalRuns++;
        this.saveData();
    }

    incrementKills(count = 1) {
        this.data.stats.totalKills += count;
        this.saveData();
    }

    incrementDeaths() {
        this.data.stats.totalDeaths++;
        this.saveData();
    }

    updateHighestLevel(level) {
        if (level > this.data.stats.highestLevel) {
            this.data.stats.highestLevel = level;
            this.saveData();
        }
    }

    addPlaytime(seconds) {
        this.data.stats.playtime += seconds;
        this.saveData();
    }

    getStats() {
        return { ...this.data.stats };
    }

    // Achievements
    unlockAchievement(achievementId) {
        if (!this.data.achievements.includes(achievementId)) {
            this.data.achievements.push(achievementId);
            this.saveData();
            console.log(`🏆 Achievement unlocked: ${achievementId}`);
            return true;
        }
        return false;
    }

    hasAchievement(achievementId) {
        return this.data.achievements.includes(achievementId);
    }

    getAchievements() {
        return [...this.data.achievements];
    }

    // Settings
    getSetting(key) {
        return this.data.settings[key];
    }

    setSetting(key, value) {
        this.data.settings[key] = value;
        this.saveData();
    }

    // Utility
    resetProgress() {
        if (confirm('⚠️ Are you sure you want to reset ALL progress? This cannot be undone!')) {
            this.data = this.getDefaultData();
            this.saveData();
            console.log('🔄 Progress reset');
            return true;
        }
        return false;
    }

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.data = imported;
            this.saveData();
            console.log('✅ Data imported successfully');
            return true;
        } catch (e) {
            console.error('❌ Failed to import data:', e);
            return false;
        }
    }
}

// Create global instance
const progressionSystem = new ProgressionSystem();
window.progressionSystem = progressionSystem;

// Connect to character select manager (try multiple times if needed)
function connectProgressionSystem() {
    if (window.characterSelectManager) {
        window.characterSelectManager.setProgressionSystem(progressionSystem);
        console.log('✅ Progression system connected to character select');
        return true;
    }
    return false;
}

// Try immediately
if (!connectProgressionSystem()) {
    // Try again after a delay
    setTimeout(() => {
        if (!connectProgressionSystem()) {
            // One more try after a longer delay
            setTimeout(connectProgressionSystem, 500);
        }
    }, 100);
}
