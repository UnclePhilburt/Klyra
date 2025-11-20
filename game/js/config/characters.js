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
        abilities: {
            e: {
                name: "Dash Strike",
                cooldown: 6000,  // 6 second cooldown
                effect: {
                    type: "dash",
                    damage: 40,
                    range: 200,  // Dash distance in pixels
                    speed: 800   // Dash speed
                }
            }
        },
        stats: {
            base: {
                maxHP: 120,
                damage: 16,
                defense: 14,
                moveSpeed: 220, // Quick and agile rogue
                attackSpeed: 1.2,
                critChance: 0.10,
                critDamage: 1.8,
                armor: 14
            },
            growth: {
                hpPerLevel: 10,
                damagePerLevel: 2.0
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
        // Abilities are now defined in MalacharSkillTree.js and unlock at specific levels
        // abilities: {} - removed to prevent conflicts
        stats: {
            base: {
                maxHP: 100,
                damage: 6,
                defense: 6,
                moveSpeed: 240, // Fast to kite and stay safe with low HP
                attackSpeed: 0.8,
                critChance: 0.05,
                critDamage: 1.5,
                armor: 6,
                lifesteal: 0.05
            },
            growth: {
                hpPerLevel: 8,
                damagePerLevel: 1.5
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
    },

    ALDRIC: {
        id: "ALDRIC",
        display: {
            name: "Aldric",
            description: "Stalwart defender with unyielding resolve",
            class: "Tank/Fighter",
            color: 0x4169E1,
            locked: false,
            avatar: "assets/sprites/Aldric/Idle.png"
        },
        sprite: {
            frameWidth: 67,
            frameHeight: 86,
            frames: {
                // Aldric is 1x1 tile with varying frame sizes
                idle: { start: 0, end: 3 },      // 4 frames (67x86)
                running: { start: 0, end: 5 },   // 6 frames (72x86) - uses move spritesheet
                death: { start: 0, end: 4 },     // 5 frames (83x86)
                attack: { start: 0, end: 4 }     // 5 frames (83x86)
            },
            tileSize: 1  // 1x1 character
        },
        equipment: {
            startingWeapon: "iron_sword"
        },
        autoAttack: {
            name: "Crushing Blow",
            damage: 35,
            cooldown: 900,  // Slower attack speed - 0.9s between attacks to enjoy animation
            range: 4.0,     // 4.0 tiles - good reach for a fighter
            target: "enemy",
            effects: {
                onHit: {
                    damageBonus: 0
                }
            }
        },
        abilities: {
            e: {
                name: "Shockwave",
                cooldown: 8000,  // 8 second cooldown
                effect: {
                    type: "shockwave",
                    damage: 50,
                    knockback: 150,
                    range: 300,  // Max travel distance in pixels
                    speed: 400,  // Speed of the shockwave
                    width: 100   // Width of the shockwave
                }
            }
        },
        stats: {
            base: {
                maxHP: 180,
                damage: 11,
                defense: 30,
                moveSpeed: 180, // Slowest - high HP tank doesn't need to run
                attackSpeed: 0.9,
                critChance: 0.05,
                critDamage: 1.6,
                armor: 30
            },
            growth: {
                hpPerLevel: 15,
                damagePerLevel: 1.5
            }
        },
        passives: [
            { id: "shield_wall", name: "Shield Wall", description: "+50% armor when below 50% HP" },
            { id: "iron_will", name: "Iron Will", description: "+10% damage reduction" },
            { id: "steadfast", name: "Steadfast", description: "Cannot be slowed below 70% movement speed" }
        ],
        lore: {
            title: "The Iron Guardian",
            background: "Aldric stands as an immovable fortress on the battlefield. Trained in the ancient defensive arts, he protects his allies while crushing those foolish enough to challenge him.",
            quote: "I am the wall that will never fall."
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
