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
            avatar: "assets/sprites/Kelise.png",
            soulCost: 300
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
                cooldown: 4000,  // 4 second cooldown
                effect: {
                    type: "kelise_dash",
                    damage: 40,
                    range: 200,  // Dash distance in pixels
                    speed: 800   // Dash speed
                }
            }
            // Q ability (Life Drain) is unlocked at level 5 via GameScene.checkAndUnlockAbilities
        },
        stats: {
            base: {
                maxHP: 120,
                damage: 16,
                defense: 14,
                moveSpeed: 200, // Quick and agile rogue
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
            avatar: "assets/sprites/malachar/Idle.png",
            soulCost: 200
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
                moveSpeed: 180, // Fast to kite and stay safe with low HP
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
            avatar: "assets/sprites/Aldric/Idle.png",
            soulCost: 300
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
            // R ability (Titan's Fury) is unlocked at level 10 via GameScene.checkAndUnlockAbilities
        },
        stats: {
            base: {
                maxHP: 180,
                damage: 11,
                defense: 30,
                moveSpeed: 140, // Slowest - high HP tank doesn't need to run
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
    },

    ZENRYU: {
        id: "ZENRYU",
        display: {
            name: "Zenryu",
            description: "Mystical samurai wielding both blade and dragon spirit",
            class: "Samurai/DPS",
            color: 0x4B0082,
            locked: false,
            avatar: "assets/sprites/Zenryu/IDLE.png",
            soulCost: 600
        },
        sprite: {
            frameWidth: 96,
            frameHeight: 96,
            frames: {
                // Zenryu is 1x1 tile (96x96 sprite)
                idle: { start: 0, end: 9 },      // 10 frames
                running: { start: 0, end: 15 },  // 16 frames - uses RUN spritesheet
                death: { start: 0, end: 3 },     // 4 frames - uses HURT spritesheet
                attack: { start: 0, end: 6 }     // 7 frames
            },
            tileSize: 1  // 1x1 character
        },
        equipment: {
            startingWeapon: "katana"
        },
        autoAttack: {
            name: "Dragon Slash",
            damage: 40,
            cooldown: 700,  // Fast attack speed - 0.7s between attacks
            range: 3.5,     // 3.5 tiles - medium reach
            target: "enemy",
            effects: {
                onHit: {
                    damageBonus: 0
                }
            }
        },
        abilities: {
            // Abilities will be added later
        },
        stats: {
            base: {
                maxHP: 90, // Extreme glass cannon - very fragile
                damage: 18, // Highest base damage - deadly strikes
                defense: 6, // Extremely low defense - unarmored samurai
                moveSpeed: 240, // Fastest character - relies on speed
                attackSpeed: 1.1,
                critChance: 0.18, // 18% crit chance - high precision
                critDamage: 2.1, // 2.1x crit damage - deadly crits
                armor: 6 // Matches defense - minimal protection
            },
            growth: {
                hpPerLevel: 12,
                damagePerLevel: 2.2
            }
        },
        passives: [
            { id: "dragon_spirit", name: "Dragon Spirit", description: "+15% critical chance" },
            { id: "zen_focus", name: "Zen Focus", description: "+25% critical damage" },
            { id: "way_of_the_blade", name: "Way of the Blade", description: "+10% attack speed" }
        ],
        lore: {
            title: "The Dragon Blade",
            background: "Zenryu channels the ancient power of the dragon through his blade. His strikes are swift and deadly, combining meditative discipline with explosive power.",
            quote: "The dragon sleeps within... until I draw my blade."
        }
    },

    ORION: {
        id: "ORION",
        display: {
            name: "Orion",
            description: "Arcane ranger with deadly precision",
            class: "Arcane Ranger/DPS",
            color: 0x9370DB,
            locked: false,
            avatar: "assets/sprites/Orion/orion.png",
            soulCost: 500
        },
        sprite: {
            frameWidth: 64,
            frameHeight: 64,
            frames: {
                // Orion is 1x1 tile (64x64 sprite)
                idle: { start: 40, end: 43 },    // 4 frames
                running: { start: 0, end: 7 },   // 8 frames
                death: { start: 8, end: 15 },    // 8 frames
                roll: { start: 16, end: 22 },    // 7 frames (E ability)
                attack: { start: 24, end: 30 }   // 7 frames
            },
            tileSize: 1  // 1x1 character
        },
        equipment: {
            startingWeapon: "arcane_bow"
        },
        autoAttack: {
            name: "Arcane Arrow",
            damage: 35,
            cooldown: 800,  // Medium attack speed - 0.8s between attacks
            range: 6.0,     // 6 tiles - long range archer
            target: "enemy",
            projectile: true, // Uses projectile system
            projectileSpeed: 500, // pixels per second
            effects: {
                onHit: {
                    damageBonus: 0
                }
            }
        },
        abilities: {
            q: {
                name: "Arrow Barrage",
                cooldown: 15000,  // 15 second cooldown
                effect: {
                    type: "orion_arrow_barrage",
                    duration: 5000,  // 5 seconds
                    volleyInterval: 500,  // Shoot every 0.5 seconds
                    arrowsPerVolley: 5,  // 5 arrows per volley
                    coneSpread: 30,  // 30 degree spread (total cone)
                    damage: 25  // Damage per arrow
                }
            },
            e: {
                name: "Shadow Roll",
                cooldown: 5000,  // 5 second cooldown
                effect: {
                    type: "orion_roll",
                    invulnerable: true,
                    range: 250,  // Roll distance in pixels (increased from 150)
                    speed: 600   // Roll speed
                }
            }
        },
        stats: {
            base: {
                maxHP: 110,
                damage: 15,
                defense: 10,
                moveSpeed: 190, // Medium speed - balanced ranger
                attackSpeed: 1.0,
                critChance: 0.12, // 12% crit chance - skilled marksman
                critDamage: 1.9, // 1.9x crit damage
                armor: 10
            },
            growth: {
                hpPerLevel: 11,
                damagePerLevel: 2.0
            }
        },
        passives: [
            { id: "arcane_precision", name: "Arcane Precision", description: "+12% critical chance" },
            { id: "enchanted_arrows", name: "Enchanted Arrows", description: "+15% projectile damage" },
            { id: "ranger_focus", name: "Ranger Focus", description: "+20% attack range" }
        ],
        lore: {
            title: "The Arcane Marksman",
            background: "Orion blends ancient archery with arcane magic, imbuing each arrow with mystical energy. His precision is legendary, striking targets from impossible distances.",
            quote: "Every arrow finds its mark, guided by the arcane."
        }
    },

    LUNARE: {
        id: "LUNARE",
        display: {
            name: "Lunare",
            description: "Dark mystical rabbit mage wielding shadow magic",
            class: "Dark Mage",
            color: 0x4B0082, // Indigo/dark purple
            locked: false,
            avatar: "assets/sprites/Lunare/Lunare.png",
            soulCost: 400
        },
        sprite: {
            frameWidth: 45,
            frameHeight: 64,
            frames: {
                idle: { start: 8, end: 11 },     // Frames 8-11
                running: { start: 12, end: 15 }  // Frames 12-15
                // death and attack animations not yet available
            },
            tileSize: 1  // 1x1 character
        },
        equipment: {
            startingWeapon: "lunar_staff"
        },
        autoAttack: {
            name: "Shadow Bolt",
            damage: 28,
            cooldown: 800,  // 0.8s between attacks - medium speed
            range: 5.0,     // 5 tiles - medium-long range mage
            target: "enemy",
            projectile: true,
            projectileSpeed: 450,
            effects: {
                onHit: {
                    damageBonus: 0
                }
            }
        },
        abilities: {
            q: {
                name: "Dark Veil",
                cooldown: 12000,  // 12 second cooldown
                effect: {
                    type: "lunare_dark_veil",
                    duration: 5000,  // 5 seconds
                    damageReduction: 0.4,  // 40% damage reduction
                    movementSpeed: 1.2  // 20% movement speed boost
                }
            },
            e: {
                name: "Shadow Vortex",
                cooldown: 12000,  // 12 second cooldown
                effect: {
                    type: "lunare_vortex",
                    range: 5.0,  // 5 tiles - how far the boomerang goes
                    holdDuration: 3000,  // Hold for 3 seconds
                    pullStrength: 300,  // Pull force towards vortex per second (5 pixels per frame at 60fps)
                    pullRadius: 250,  // How far enemies are pulled from (pixels)
                    damage: 0  // No damage, just crowd control
                }
            }
        },
        stats: {
            base: {
                maxHP: 95,
                damage: 18,
                defense: 8,
                moveSpeed: 180, // Slightly slower than average
                attackSpeed: 1.0,
                critChance: 0.08,
                critDamage: 2.0,
                armor: 8
            },
            growth: {
                hpPerLevel: 8,
                damagePerLevel: 2.5
            }
        },
        passives: [
            { id: "lunar_affinity", name: "Lunar Affinity", description: "+15% magic damage" },
            { id: "shadow_form", name: "Shadow Form", description: "Evade 10% of incoming attacks" },
            { id: "mystical_energy", name: "Mystical Energy", description: "+10% ability cooldown reduction" }
        ],
        lore: {
            title: "The Twilight Conjurer",
            background: "Lunare is a mysterious rabbit mage who draws power from the shadows and moonlight. Once a guardian of the lunar realm, they now walk the mortal plane, wielding dark magic with ancient wisdom.",
            quote: "In darkness, I find my light. In shadows, my power."
        }
    },

    BASTION: {
        id: "BASTION",
        display: {
            name: "Bastion",
            description: "Tactical SWAT operator with adaptive weapon systems",
            class: "Tank/Versatile",
            color: 0x2E4057,
            locked: false,
            avatar: "assets/sprites/Bastion/SWAT_1/Idle.png",
            soulCost: 250
        },
        sprite: {
            frameWidth: 128,
            frameHeight: 128,
            frames: {
                idle: { start: 0, end: 9 },
                walking: { start: 0, end: 7 },
                death: { start: 0, end: 9 },
                attack: { start: 0, end: 9 },
                recharge: { start: 0, end: 9 }
            },
            tileSize: 1
        },
        equipment: {
            startingWeapon: "scar"
        },
        // Bastion uses custom weapon system with ammo
        autoAttack: null, // Handled by BastionAbilityHandler
        abilities: {
            q: {
                name: "Reload",
                description: "Reload your current weapon",
                cooldown: 0,
                levelRequired: 1,
                effect: {
                    type: "bastion_reload"
                }
            },
            e: {
                name: "Tactical Stance",
                description: "Switch between SCAR, Shield+Pistol, or Shotgun",
                cooldown: 2000,
                levelRequired: 1,
                effect: {
                    type: "bastion_stance_switch"
                }
            }
        },
        // Weapon stances configuration
        stances: {
            scar: {
                name: "SCAR",
                spriteFolder: "SWAT_1",
                damage: 8,
                fireRate: 150, // Very high fire rate (ms between shots)
                range: 8, // tiles
                maxAmmo: 10,
                reloadTime: 2000,
                moveSpeed: 180,
                projectileSpeed: 600
            },
            shield: {
                name: "Shield + Pistol",
                spriteFolder: "SWAT_2",
                damage: 12,
                fireRate: 600, // Low fire rate
                range: 6, // tiles
                maxAmmo: 10,
                reloadTime: 1500,
                moveSpeed: 140, // Slower with shield
                defenseBonus: 15, // +15 armor when shield equipped
                projectileSpeed: 500
            },
            shotgun: {
                name: "Shotgun",
                spriteFolder: "SWAT_3",
                damage: 45, // High damage
                fireRate: 800, // Slow fire rate
                range: 4, // Short range
                maxAmmo: 5,
                reloadTime: 2500,
                moveSpeed: 200, // Faster for aggressive push
                pellets: 5, // Shotgun fires 5 pellets
                spread: 15, // Spread angle in degrees
                damageDropoff: 0.5, // 50% damage at max range
                projectileSpeed: 400
            }
        },
        stats: {
            base: {
                maxHP: 130,
                damage: 10,
                defense: 12,
                moveSpeed: 180, // Default SCAR speed
                attackSpeed: 1.0,
                critChance: 0.03,
                critDamage: 1.5,
                armor: 12
            },
            growth: {
                hpPerLevel: 10,
                damagePerLevel: 1.5
            }
        },
        passives: [
            { id: "tactical_armor", name: "Tactical Armor", description: "+20% defense" },
            { id: "combat_training", name: "Combat Training", description: "+15% reload speed" },
            { id: "heavy_weapons", name: "Heavy Weapons", description: "+10% damage with all weapons" }
        ],
        lore: {
            title: "The Tactical Operator",
            background: "Bastion is an elite SWAT operator equipped with cutting-edge tactical gear. With years of combat experience, he adapts to any situation by switching between his arsenal of weapons.",
            quote: "Adapt, overcome, dominate."
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
