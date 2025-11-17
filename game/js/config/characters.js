// Character System - Modular and easy to extend
// Based on klyra2 character definitions

const CHARACTERS = {
    KELISE: {
        id: "KELISE",
        display: {
            name: "Kelise",
            description: "Swift warrior with deadly precision",
            class: "Warrior/DPS",
            color: 0xFF6B9D,
            locked: false,
            avatar: "assets/sprites/Kelise.png"
        },
        sprite: {
            frameWidth: 32,
            frameHeight: 32,
            frames: {
                // Kelise is 1x1 tile (not 2x2 like Malachar)
                idle: { start: 0, end: 1 },      // Row 0, frames 0-1
                running: { start: 24, end: 31 }, // Row 3, frames 24-31
                death: { start: 56, end: 63 },   // Row 7, frames 56-63
                attack: { start: 64, end: 71 }   // Row 8, frames 64-71
            },
            tileSize: 1  // 1x1 character (not 2x2)
        },
        equipment: {
            startingWeapon: "swift_blade"
        },
        autoAttack: {
            name: "Swift Strike",
            damage: 30, // HORDE MODE: Increased for balance
            cooldown: 500,  // Very fast attack speed - 0.5s between attacks
            range: 2.5,     // 2.5 tiles - shorter range for melee feel
            target: "enemy",
            effects: {
                onHit: {
                    damageBonus: 0
                }
            }
        },
        stats: {
            base: {
                maxHP: 100,
                damage: 24, // HORDE MODE: Increased for balance
                moveSpeed: 240, // Increased from 200 for more mobility
                attackSpeed: 1.2,
                critChance: 0.10,
                critDamage: 1.8,
                armor: 5
            },
            growth: {
                hpPerLevel: 10,
                damagePerLevel: 5.0 // HORDE MODE: Increased for balance
            }
        },
        passives: [
            { id: "swift_strikes", name: "Swift Strikes", description: "Auto-attacks strike rapidly" },
            { id: "momentum", name: "Momentum", description: "+10% damage for each consecutive hit" },
            { id: "agile", name: "Agile", description: "+20% movement speed" }
        ],
        lore: {
            title: "The Swift Blade",
            background: "Kelise moves like the wind, her blade a blur of deadly precision. Trained in the ancient arts of speed combat, she overwhelms enemies before they can react.",
            quote: "By the time you see me, it's already over."
        }
    },

    MALACHAR: {
        id: "MALACHAR",
        display: {
            name: "Malachar",
            description: "Dark summoner who commands the dead",
            class: "Necromancer",
            color: 0x8B008B,
            locked: false,
            avatar: "assets/sprites/malachar/Idle.png"
        },
        sprite: {
            frameWidth: 140,
            frameHeight: 140,
            frames: {
                // Malachar is now 1x1 tile (like Kelise)
                idle: { start: 0, end: 9 },      // 10 frames
                walking: { start: 0, end: 7 },   // 8 frames (uses walk spritesheet)
                death: { start: 0, end: 17 },    // 18 frames
                attack: { start: 0, end: 12 }    // 13 frames
            },
            tileSize: 1  // 1x1 character
        },
        equipment: {
            startingWeapon: "necro_staff"
        },
        stats: {
            base: {
                maxHP: 70,
                damage: 16, // HORDE MODE: Increased for balance
                moveSpeed: 150,
                attackSpeed: 0.8,
                critChance: 0.05,
                critDamage: 1.5,
                armor: 2,
                lifesteal: 0.05
            },
            growth: {
                hpPerLevel: 7,
                damagePerLevel: 4 // HORDE MODE: Increased for balance
            }
        },
        passives: [
            { id: "blood_pact", name: "Blood Pact", description: "Lifesteal 5% of damage dealt" },
            { id: "dark_harvest", name: "Dark Harvest", description: "15% chance to summon minion on kill" },
            { id: "cursed_power", name: "Cursed Power", description: "+25% damage, +15% damage taken" }
        ],
        lore: {
            title: "The Shadow Summoner",
            background: "Malachar commands the forces of death itself. Once a noble mage, he embraced forbidden necromancy to save his kingdom - only to become the very thing he fought against.",
            quote: "Death is not the end. It is merely a new beginning under my command."
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHARACTERS };
}

// Make available globally
window.CharacterSystem = {
    CHARACTERS: CHARACTERS, // Uppercase for compatibility with CharacterSelectManager
    characters: CHARACTERS, // Keep lowercase for backwards compatibility

    getCharacter(id) {
        return CHARACTERS[id] || null;
    },

    getAllCharacters() {
        return Object.values(CHARACTERS);
    },

    getUnlockedCharacters() {
        return Object.values(CHARACTERS).filter(char => !char.display.locked);
    }
};

console.log('✅ Character System Loaded:', Object.keys(CHARACTERS).length, 'characters');
