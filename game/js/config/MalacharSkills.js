// Malachar Skill Tree - Complete System
// Designed for: Hybrid exploration + swarm combat
// Controls: WASD + Q/E/R (one-handed, no cursor)
// Run length: 5 minutes to hours (scalable)

const MalacharSkillTree = {
    
    // =================================================================
    // TIER 1 - CHOOSE YOUR PATH (Level 1)
    // =================================================================
    
    tier1: {
        level: 1,
        title: "Choose Your Path",
        description: "Define your core identity",
        choices: [
            {
                id: 'necromancer',
                name: '🔵 NECROMANCER',
                subtitle: 'The Conductor',
                description: 'Command an army of skeletons. Your minions ARE your weapon.',
                
                stats: {
                    playerDamage: 0, // You don't damage enemies
                    startingMinions: 8,
                    minionCap: 8,
                    minionHealth: 100,
                    minionDamage: 20
                },
                
                autoAttack: {
                    name: 'Empowering Bolt',
                    description: 'Shoot healing bolts at your minions',
                    target: 'minion', // Targets minions, not enemies
                    heal: 15,
                    buffDamage: 1.5, // +50% damage
                    buffDuration: 3000, // 3 seconds
                    cooldown: 1000 // 1 per second
                },
                
                abilities: {
                    q: {
                        name: 'Rally Command',
                        description: 'All minions gain +100% attack speed for 6 seconds',
                        cooldown: 12000,
                        duration: 6000,
                        effect: {
                            minionAttackSpeed: 2.0
                        }
                    },
                    e: {
                        name: 'Skeletal Fury',
                        description: 'Sacrifice 20% of each minion\'s current HP. They gain +150% damage and +50% size for 10 seconds',
                        cooldown: 25000,
                        duration: 10000,
                        effect: {
                            minionHPSacrifice: 0.2,
                            minionDamageBonus: 2.5,
                            minionSizeBonus: 1.5
                        }
                    },
                    r: {
                        name: 'Mass Resurrection',
                        description: 'Revive all dead minions at full HP. Spawn 3 temporary elite skeletons (15s lifespan)',
                        cooldown: 60000,
                        effect: {
                            reviveAll: true,
                            spawnTemps: 3,
                            tempDuration: 15000,
                            tempElite: true // 2x stats
                        }
                    }
                },
                
                unlocks: 'necromancer_tier2'
            },
            
            {
                id: 'shadowcaster',
                name: '🔴 SHADOWCASTER',
                subtitle: 'The Glass Cannon',
                description: 'Unleash devastating shadow magic. YOU are the weapon.',
                
                stats: {
                    playerDamage: 30,
                    startingMinions: 3,
                    minionCap: 3,
                    minionHealth: 80,
                    minionDamage: 10 // Just bodyguards
                },
                
                autoAttack: {
                    name: 'Shadow Bolt',
                    description: 'Fire shadow bolts at enemies',
                    target: 'enemy',
                    damage: 30,
                    cooldown: 1000
                },
                
                abilities: {
                    q: {
                        name: 'Shadowbolt Storm',
                        description: 'Fire 3 waves of shadow bolts in all directions (36 total bolts, 15 damage each)',
                        cooldown: 8000,
                        effect: {
                            waves: 3,
                            boltsPerWave: 12,
                            boltDamage: 15,
                            pattern: '360_spread'
                        }
                    },
                    e: {
                        name: 'Blink Strike',
                        description: 'Teleport 6 tiles in movement direction. Leave void zone at start (40 DPS for 5s)',
                        cooldown: 15000,
                        effect: {
                            teleportDistance: 6,
                            voidZoneRadius: 3,
                            voidZoneDPS: 40,
                            voidZoneDuration: 5000
                        }
                    },
                    r: {
                        name: 'Oblivion Beam',
                        description: 'Channel massive beam at nearest enemy (150 DPS for 4s). Can still move.',
                        cooldown: 45000,
                        duration: 4000,
                        effect: {
                            beamDPS: 150,
                            autoTarget: true,
                            canMove: true
                        }
                    }
                },
                
                unlocks: 'shadowcaster_tier2'
            },
            
            {
                id: 'blood_ritualist',
                name: '🟣 BLOOD RITUALIST',
                subtitle: 'The Symbiotic',
                description: 'Sacrifice and blood magic. You AND your minions share power.',
                
                stats: {
                    playerDamage: 20,
                    startingMinions: 5,
                    minionCap: 5,
                    minionHealth: 90,
                    minionDamage: 16
                },
                
                autoAttack: {
                    name: 'Blood Bolt',
                    description: 'Fire blood bolts at enemies',
                    target: 'enemy',
                    damage: 20,
                    cooldown: 1000
                },
                
                abilities: {
                    q: {
                        name: 'Blood Boil',
                        description: 'Deal 10% of YOUR current HP as damage to all enemies in 7-tile radius',
                        cooldown: 12000,
                        effect: {
                            damagePercent: 0.10,
                            radius: 7,
                            usePlayerHP: true
                        }
                    },
                    e: {
                        name: 'Crimson Harvest',
                        description: 'All damage you and minions deal heals you for 50% (6s duration)',
                        cooldown: 20000,
                        duration: 6000,
                        effect: {
                            lifestealPercent: 0.5,
                            affectsMinions: true
                        }
                    },
                    r: {
                        name: 'Blood Moon Ritual',
                        description: 'Sacrifice 50% of YOUR HP. Minions gain +200% all stats for 12s. Heal 10% max HP per kill.',
                        cooldown: 60000,
                        duration: 12000,
                        effect: {
                            playerHPSacrifice: 0.5,
                            minionStatsBonus: 3.0,
                            healPerKill: 0.10
                        }
                    }
                },
                
                unlocks: 'blood_ritualist_tier2'
            }
        ]
    },
    
    // =================================================================
    // TIER 2 - SPECIALIZATION (Level 5)
    // =================================================================
    
    // NECROMANCER SPECIALIZATIONS
    necromancer_tier2: {
        level: 5,
        requires: ['necromancer'],
        title: "Necromancer Specialization",
        description: "How will you command your army?",
        choices: [
            {
                id: 'horde_master',
                name: 'Horde Master',
                icon: '🌊',
                description: 'Overwhelm with numbers. Quantity over quality.',
                
                modifications: {
                    minionCap: 12, // 8 → 12
                    q: {
                        bonusEffect: {
                            spawnTemps: 2,
                            tempDuration: 10000
                        }
                    },
                    e: {
                        bonusEffect: {
                            affectsTemps: true
                        }
                    },
                    r: {
                        bonusEffect: {
                            spawnTemps: 5 // 3 → 5
                        }
                    }
                },
                
                unlocks: 'horde_master_tier3'
            },
            
            {
                id: 'bone_commander',
                name: 'Bone Commander',
                icon: '💀',
                description: 'Elite skeletons. Quality over quantity.',
                
                modifications: {
                    minionCap: 5, // 8 → 5
                    minionHealth: 2.0, // +100% HP
                    minionDamage: 1.5, // +50% damage
                    q: {
                        bonusEffect: {
                            permanentDamageStack: 0.3 // +30% permanent per use
                        }
                    },
                    e: {
                        bonusEffect: {
                            hpSacrifice: 0.1, // 20% → 10%
                            damageBonus: 3.0 // 150% → 200%
                        }
                    },
                    r: {
                        bonusEffect: {
                            reviveMaxHPBonus: 1.5 // +50% max HP when revived
                        }
                    }
                },
                
                unlocks: 'bone_commander_tier3'
            },
            
            {
                id: 'death_conductor',
                name: 'Death Conductor',
                icon: '🎯',
                description: 'Tactical formations and coordinated strikes.',
                
                modifications: {
                    autoAttack: {
                        prioritizeLowHP: true // Heal injured minions first
                    },
                    q: {
                        bonusEffect: {
                            teleportToPlayer: true,
                            burstPattern: 'radial'
                        }
                    },
                    e: {
                        bonusEffect: {
                            formCircle: true,
                            givePlayerShield: 100
                        }
                    },
                    r: {
                        bonusEffect: {
                            spawnInFormation: true,
                            formationType: 'circle'
                        }
                    }
                },
                
                unlocks: 'death_conductor_tier3'
            }
        ]
    },
    
    // SHADOWCASTER SPECIALIZATIONS
    shadowcaster_tier2: {
        level: 5,
        requires: ['shadowcaster'],
        title: "Shadowcaster Specialization",
        description: "How will you wield dark magic?",
        choices: [
            {
                id: 'void_mage',
                name: 'Void Mage',
                icon: '⚫',
                description: 'Master of void magic. Sustained damage zones.',
                
                modifications: {
                    playerDamage: 1.2, // +20%
                    q: {
                        bonusEffect: {
                            boltsPerWave: 15, // 12 → 15
                            pierceEnemies: true
                        }
                    },
                    e: {
                        bonusEffect: {
                            voidZoneDuration: 8000, // 5s → 8s
                            voidZoneDPS: 60, // 40 → 60
                            voidZoneFollows: true // Follows you
                        }
                    },
                    r: {
                        bonusEffect: {
                            beamDPS: 200, // 150 → 200
                            beamWidth: 1.5
                        }
                    }
                },
                
                unlocks: 'void_mage_tier3'
            },
            
            {
                id: 'shadow_assassin',
                name: 'Shadow Assassin',
                icon: '🗡️',
                description: 'Mobility and burst damage. In and out.',
                
                modifications: {
                    moveSpeed: 1.3, // +30% move speed
                    q: {
                        bonusEffect: {
                            cooldown: 6000, // 8s → 6s
                            boltDamage: 20 // 15 → 20
                        }
                    },
                    e: {
                        bonusEffect: {
                            charges: 2, // Can use twice
                            cooldown: 12000, // per charge
                            damageOnArrival: 80
                        }
                    },
                    r: {
                        bonusEffect: {
                            duration: 6000, // 4s → 6s
                            invulnerable: true
                        }
                    }
                },
                
                unlocks: 'shadow_assassin_tier3'
            },
            
            {
                id: 'dark_artillery',
                name: 'Dark Artillery',
                icon: '💥',
                description: 'Raw power. Maximum damage output.',
                
                modifications: {
                    playerDamage: 1.5, // +50%
                    q: {
                        bonusEffect: {
                            waves: 5, // 3 → 5
                            boltDamage: 20 // 15 → 20
                        }
                    },
                    e: {
                        bonusEffect: {
                            voidZoneRadius: 5, // 3 → 5
                            voidZoneDPS: 80, // 40 → 80
                            explosionOnEnd: 150
                        }
                    },
                    r: {
                        bonusEffect: {
                            beamDPS: 250, // 150 → 250
                            cannotMove: true, // Rooted but more damage
                            beamPierceAll: true
                        }
                    }
                },
                
                unlocks: 'dark_artillery_tier3'
            }
        ]
    },
    
    // BLOOD RITUALIST SPECIALIZATIONS
    blood_ritualist_tier2: {
        level: 5,
        requires: ['blood_ritualist'],
        title: "Blood Ritualist Specialization",
        description: "How will you balance life and death?",
        choices: [
            {
                id: 'blood_prophet',
                name: 'Blood Prophet',
                icon: '🩸',
                description: 'Extreme sacrifice for extreme power.',
                
                modifications: {
                    q: {
                        bonusEffect: {
                            damagePercent: 0.20, // 10% → 20%
                            cannotKillYou: true // Stops at 1 HP
                        }
                    },
                    e: {
                        bonusEffect: {
                            lifestealPercent: 0.8, // 50% → 80%
                            healMinions: true
                        }
                    },
                    r: {
                        bonusEffect: {
                            playerHPSacrifice: 0.7, // 50% → 70%
                            minionStatsBonus: 4.0, // 200% → 300%
                            healPerKill: 0.15 // 10% → 15%
                        }
                    }
                },
                
                unlocks: 'blood_prophet_tier3'
            },
            
            {
                id: 'crimson_knight',
                name: 'Crimson Knight',
                icon: '⚔️',
                description: 'Tanky melee hybrid. Fight alongside your minions.',
                
                modifications: {
                    playerHealth: 1.5, // +50% HP
                    playerDamage: 1.3, // +30% damage
                    q: {
                        bonusEffect: {
                            radius: 4, // 7 → 4 (closer range)
                            knockback: true,
                            damagePercent: 0.15 // 10% → 15%
                        }
                    },
                    e: {
                        bonusEffect: {
                            duration: 10000, // 6s → 10s
                            lifestealPercent: 0.7, // 50% → 70%
                            damageReduction: 0.3 // Take 30% less damage
                        }
                    },
                    r: {
                        bonusEffect: {
                            playerHPSacrifice: 0.3, // 50% → 30%
                            playerStatsBonus: 2.0, // YOU also get +100% stats
                            minionStatsBonus: 2.5 // 200% → 150%
                        }
                    }
                },
                
                unlocks: 'crimson_knight_tier3'
            },
            
            {
                id: 'plague_doctor',
                name: 'Plague Doctor',
                icon: '☣️',
                description: 'Spread disease and decay. DOT focus.',
                
                modifications: {
                    autoAttack: {
                        bonusEffect: {
                            poisonOnHit: true,
                            poisonDPS: 10,
                            poisonDuration: 5000
                        }
                    },
                    q: {
                        bonusEffect: {
                            damagePercent: 0.08, // 10% → 8%
                            leavePoisonCloud: true,
                            cloudDPS: 30,
                            cloudDuration: 8000
                        }
                    },
                    e: {
                        bonusEffect: {
                            spreadToMinions: true, // Minions also lifesteal
                            spreadToEnemies: true // Damage spreads between enemies
                        }
                    },
                    r: {
                        bonusEffect: {
                            minionExplosionOnDeath: true,
                            explosionDamage: 100,
                            explosionPoison: true
                        }
                    }
                },
                
                unlocks: 'plague_doctor_tier3'
            }
        ]
    },
    
    // =================================================================
    // TIER 3 - MASTERY (Level 10)
    // I'll create 2 masteries per spec for now (can expand to 3 later)
    // =================================================================
    
    // HORDE MASTER MASTERIES
    horde_master_tier3: {
        level: 10,
        requires: ['horde_master'],
        title: "Horde Master Mastery",
        choices: [
            {
                id: 'endless_legion',
                name: 'Endless Legion',
                description: 'Dark Harvest spawns more minions. Cap increased to 20.',
                effect: {
                    minionCap: 20,
                    darkHarvestChance: 0.20,
                    spawnCount: 2
                },
                unlocks: 'endless_legion_tier4'
            },
            {
                id: 'skeleton_king',
                name: 'Skeleton King',
                description: 'Every 5th minion spawned is an Elite with triple stats.',
                effect: {
                    eliteSpawnInterval: 5,
                    eliteStatMultiplier: 3.0
                },
                unlocks: 'skeleton_king_tier4'
            }
        ]
    },
    
    // BONE COMMANDER MASTERIES
    bone_commander_tier3: {
        level: 10,
        requires: ['bone_commander'],
        title: "Bone Commander Mastery",
        choices: [
            {
                id: 'immortal_guard',
                name: 'Immortal Guard',
                description: 'Minions revive once per life with 50% HP (60s cooldown per minion).',
                effect: {
                    minionAutoRevive: true,
                    revivePercent: 0.5,
                    reviveCooldown: 60000
                },
                unlocks: 'immortal_guard_tier4'
            },
            {
                id: 'titans_blessing',
                name: "Titan's Blessing",
                description: 'Minions grow in size and power over time (+10% per 10s, caps at +100%).',
                effect: {
                    growthRate: 0.10,
                    growthInterval: 10000,
                    growthCap: 2.0
                },
                unlocks: 'titans_blessing_tier4'
            }
        ]
    },
    
    // DEATH CONDUCTOR MASTERIES
    death_conductor_tier3: {
        level: 10,
        requires: ['death_conductor'],
        title: "Death Conductor Mastery",
        choices: [
            {
                id: 'perfect_formation',
                name: 'Perfect Formation',
                description: 'Minions in formation gain +100% all stats. Formation never breaks.',
                effect: {
                    formationBonus: 2.0,
                    formationUnbreakable: true
                },
                unlocks: 'perfect_formation_tier4'
            },
            {
                id: 'tactical_genius',
                name: 'Tactical Genius',
                description: 'All abilities have 50% reduced cooldown. Q/E/R can be used while moving.',
                effect: {
                    cooldownReduction: 0.5,
                    castWhileMoving: true
                },
                unlocks: 'tactical_genius_tier4'
            }
        ]
    },
    
    // VOID MAGE MASTERIES
    void_mage_tier3: {
        level: 10,
        requires: ['void_mage'],
        title: "Void Mage Mastery",
        choices: [
            {
                id: 'void_convergence',
                name: 'Void Convergence',
                description: 'Void zones stack. Each additional zone increases damage by +50%.',
                effect: {
                    voidStacking: true,
                    stackBonus: 1.5
                },
                unlocks: 'void_convergence_tier4'
            },
            {
                id: 'entropy_master',
                name: 'Entropy Master',
                description: 'Enemies in void zones are slowed 50% and take +100% damage from all sources.',
                effect: {
                    voidSlow: 0.5,
                    voidVulnerable: 2.0
                },
                unlocks: 'entropy_master_tier4'
            }
        ]
    },
    
    // SHADOW ASSASSIN MASTERIES
    shadow_assassin_tier3: {
        level: 10,
        requires: ['shadow_assassin'],
        title: "Shadow Assassin Mastery",
        choices: [
            {
                id: 'phantom_strikes',
                name: 'Phantom Strikes',
                description: 'After Blink Strike, gain +200% attack speed for 4s.',
                effect: {
                    postBlinkBuff: true,
                    attackSpeedBonus: 3.0,
                    buffDuration: 4000
                },
                unlocks: 'phantom_strikes_tier4'
            },
            {
                id: 'shadow_dance',
                name: 'Shadow Dance',
                description: 'Blink Strike now has 3 charges. Reset all charges on kill.',
                effect: {
                    blinkCharges: 3,
                    resetOnKill: true
                },
                unlocks: 'shadow_dance_tier4'
            }
        ]
    },
    
    // DARK ARTILLERY MASTERIES
    dark_artillery_tier3: {
        level: 10,
        requires: ['dark_artillery'],
        title: "Dark Artillery Mastery",
        choices: [
            {
                id: 'apocalypse',
                name: 'Apocalypse',
                description: 'All abilities deal +100% damage. Cooldowns increased by 50%.',
                effect: {
                    abilityDamage: 2.0,
                    cooldownIncrease: 1.5
                },
                unlocks: 'apocalypse_tier4'
            },
            {
                id: 'chain_reaction',
                name: 'Chain Reaction',
                description: 'Enemies killed by abilities explode for 100 damage.',
                effect: {
                    explosionOnAbilityKill: true,
                    explosionDamage: 100,
                    explosionRadius: 3
                },
                unlocks: 'chain_reaction_tier4'
            }
        ]
    },
    
    // BLOOD PROPHET MASTERIES
    blood_prophet_tier3: {
        level: 10,
        requires: ['blood_prophet'],
        title: "Blood Prophet Mastery",
        choices: [
            {
                id: 'crimson_ascension',
                name: 'Crimson Ascension',
                description: 'At 1 HP, gain +300% all stats. Cannot die for 5s (60s cooldown).',
                effect: {
                    lowHPBonus: 4.0,
                    lowHPThreshold: 1,
                    deathImmunity: true,
                    immunityDuration: 5000,
                    immunityCooldown: 60000
                },
                unlocks: 'crimson_ascension_tier4'
            },
            {
                id: 'blood_god',
                name: 'Blood God',
                description: 'All HP costs also damage nearby enemies. The more HP spent, the more damage.',
                effect: {
                    hpCostDamagesEnemies: true,
                    damageRadius: 6,
                    damageMultiplier: 10 // 1% HP = 10 damage
                },
                unlocks: 'blood_god_tier4'
            }
        ]
    },
    
    // CRIMSON KNIGHT MASTERIES
    crimson_knight_tier3: {
        level: 10,
        requires: ['crimson_knight'],
        title: "Crimson Knight Mastery",
        choices: [
            {
                id: 'blood_armor',
                name: 'Blood Armor',
                description: 'Gain shield equal to 50% of damage dealt. Shield caps at 200% max HP.',
                effect: {
                    damageToShield: 0.5,
                    shieldCap: 2.0
                },
                unlocks: 'blood_armor_tier4'
            },
            {
                id: 'berserker_rage',
                name: 'Berserker Rage',
                description: 'Below 50% HP, gain +200% damage and +50% attack speed.',
                effect: {
                    rageThreshold: 0.5,
                    rageDamage: 3.0,
                    rageAttackSpeed: 1.5
                },
                unlocks: 'berserker_rage_tier4'
            }
        ]
    },
    
    // PLAGUE DOCTOR MASTERIES
    plague_doctor_tier3: {
        level: 10,
        requires: ['plague_doctor'],
        title: "Plague Doctor Mastery",
        choices: [
            {
                id: 'pandemic',
                name: 'Pandemic',
                description: 'Poison spreads to nearby enemies every 2s. Infinite spread.',
                effect: {
                    poisonSpread: true,
                    spreadInterval: 2000,
                    spreadRadius: 4,
                    infiniteChain: true
                },
                unlocks: 'pandemic_tier4'
            },
            {
                id: 'toxic_evolution',
                name: 'Toxic Evolution',
                description: 'Poison damage increases by +5 DPS every second it\'s active (per enemy).',
                effect: {
                    poisonRamping: true,
                    rampPerSecond: 5,
                    noCap: true
                },
                unlocks: 'toxic_evolution_tier4'
            }
        ]
    },
    
    // =================================================================
    // TIER 4 - ULTIMATE POWER (Level 15)
    // Build-defining capstones
    // =================================================================
    
    // For brevity, I'll create 2 ultimates per mastery
    // (In full version, could have 3 per mastery)
    
    endless_legion_tier4: {
        level: 15,
        requires: ['endless_legion'],
        title: "Endless Legion Ultimate",
        choices: [
            {
                id: 'infinite_army',
                name: 'INFINITE ARMY',
                description: 'Remove minion cap. Dark Harvest chance increased to 30%. Temporary minions last forever.',
                rarity: 'legendary',
                effect: {
                    noMinionCap: true,
                    darkHarvestChance: 0.30,
                    tempMinionsInfinite: true
                }
            },
            {
                id: 'army_of_darkness',
                name: 'ARMY OF DARKNESS',
                description: 'At 20+ minions, they merge into one god-minion with combined stats.',
                rarity: 'legendary',
                effect: {
                    fusionThreshold: 20,
                    fusionCombinedStats: true,
                    godMinion: true
                }
            }
        ]
    },
    
    skeleton_king_tier4: {
        level: 15,
        requires: ['skeleton_king'],
        title: "Skeleton King Ultimate",
        choices: [
            {
                id: 'lord_of_undeath',
                name: 'LORD OF UNDEATH',
                description: 'All minions become Elites. Elite bonus increased to 5x stats.',
                rarity: 'legendary',
                effect: {
                    allElite: true,
                    eliteMultiplier: 5.0
                }
            },
            {
                id: 'bone_emperor',
                name: 'BONE EMPEROR',
                description: 'Elites summon their own skeleton army (3 minions per Elite).',
                rarity: 'legendary',
                effect: {
                    elitesSummon: true,
                    summonCount: 3,
                    summonInterval: 10000
                }
            }
        ]
    },
    
    immortal_guard_tier4: {
        level: 15,
        requires: ['immortal_guard'],
        title: "Immortal Guard Ultimate",
        choices: [
            {
                id: 'eternal_sentinels',
                name: 'ETERNAL SENTINELS',
                description: 'Minions revive instantly instead of after 60s. Each revive grants +50% permanent stats.',
                rarity: 'legendary',
                effect: {
                    instantRevive: true,
                    reviveStacksStats: true,
                    stackBonus: 1.5
                }
            },
            {
                id: 'phoenix_legion',
                name: 'PHOENIX LEGION',
                description: 'When minions revive, they explode for 200 damage and spawn 2 temporary copies.',
                rarity: 'legendary',
                effect: {
                    reviveExplosion: 200,
                    reviveRadius: 5,
                    spawnCopiesOnRevive: 2
                }
            }
        ]
    },
    
    titans_blessing_tier4: {
        level: 15,
        requires: ['titans_blessing'],
        title: "Titan's Blessing Ultimate",
        choices: [
            {
                id: 'colossal_titans',
                name: 'COLOSSAL TITANS',
                description: 'Remove growth cap. Growth rate doubled. Minions create shockwaves when attacking.',
                rarity: 'legendary',
                effect: {
                    noCap: true,
                    growthRate: 0.20,
                    shockwaveOnHit: true,
                    shockwaveDamage: 30
                }
            },
            {
                id: 'world_breakers',
                name: 'WORLD BREAKERS',
                description: 'At max growth, minions deal damage to ALL enemies on screen with each attack.',
                rarity: 'legendary',
                effect: {
                    globalDamage: true,
                    requiresMaxGrowth: true
                }
            }
        ]
    },
    
    perfect_formation_tier4: {
        level: 15,
        requires: ['perfect_formation'],
        title: "Perfect Formation Ultimate",
        choices: [
            {
                id: 'tactical_supremacy',
                name: 'TACTICAL SUPREMACY',
                description: 'Formation bonus increased to +300%. Minions teleport to maintain formation.',
                rarity: 'legendary',
                effect: {
                    formationBonus: 4.0,
                    autoTeleport: true
                }
            },
            {
                id: 'synchronized_destruction',
                name: 'SYNCHRONIZED DESTRUCTION',
                description: 'All minions attack the same target. When target dies, it explodes for massive damage.',
                rarity: 'legendary',
                effect: {
                    focusFire: true,
                    targetExplosion: true,
                    explosionDamage: 500
                }
            }
        ]
    },
    
    tactical_genius_tier4: {
        level: 15,
        requires: ['tactical_genius'],
        title: "Tactical Genius Ultimate",
        choices: [
            {
                id: 'instant_command',
                name: 'INSTANT COMMAND',
                description: 'All abilities have no cooldown for 10s after using R (60s cooldown).',
                rarity: 'legendary',
                effect: {
                    zeroCooldownWindow: 10000,
                    triggerOnR: true,
                    metaCooldown: 60000
                }
            },
            {
                id: 'perfect_execution',
                name: 'PERFECT EXECUTION',
                description: 'Abilities can be cast simultaneously. Combo them for massive effects.',
                rarity: 'legendary',
                effect: {
                    simultaneousCast: true,
                    comboBonus: 2.0
                }
            }
        ]
    },
    
    // SHADOWCASTER ULTIMATES
    void_convergence_tier4: {
        level: 15,
        requires: ['void_convergence'],
        title: "Void Convergence Ultimate",
        choices: [
            {
                id: 'collapse_reality',
                name: 'COLLAPSE REALITY',
                description: 'All void zones merge into one massive zone. DPS scales with number of casts.',
                rarity: 'legendary',
                effect: {
                    mergeZones: true,
                    dpsPerCast: 20,
                    noCap: true
                }
            },
            {
                id: 'void_god',
                name: 'VOID GOD',
                description: 'Become void itself. Entire screen becomes void zone (50 DPS) for 15s (90s cooldown).',
                rarity: 'legendary',
                effect: {
                    screenWideVoid: true,
                    voidDPS: 50,
                    duration: 15000,
                    cooldown: 90000
                }
            }
        ]
    },
    
    entropy_master_tier4: {
        level: 15,
        requires: ['entropy_master'],
        title: "Entropy Master Ultimate",
        choices: [
            {
                id: 'heat_death',
                name: 'HEAT DEATH',
                description: 'Enemies in void zones lose 5% max HP per second. Ignores all resistances.',
                rarity: 'legendary',
                effect: {
                    percentHPDamage: 0.05,
                    ignoreResistances: true
                }
            },
            {
                id: 'absolute_zero',
                name: 'ABSOLUTE ZERO',
                description: 'Void zones freeze enemies after 3s. Frozen enemies shatter when damaged.',
                rarity: 'legendary',
                effect: {
                    freezeDelay: 3000,
                    shatterOnHit: true,
                    shatterDamage: 300,
                    shatterAOE: 4
                }
            }
        ]
    },
    
    phantom_strikes_tier4: {
        level: 15,
        requires: ['phantom_strikes'],
        title: "Phantom Strikes Ultimate",
        choices: [
            {
                id: 'shadow_fury',
                name: 'SHADOW FURY',
                description: 'During phantom strikes buff, auto-attacks hit 5 times simultaneously.',
                rarity: 'legendary',
                effect: {
                    multiHit: 5,
                    requiresBuff: true
                }
            },
            {
                id: 'death_mark',
                name: 'DEATH MARK',
                description: 'Attacks during buff mark enemies for death. Marked enemies die in 5 hits.',
                rarity: 'legendary',
                effect: {
                    markOnHit: true,
                    executeHits: 5
                }
            }
        ]
    },
    
    shadow_dance_tier4: {
        level: 15,
        requires: ['shadow_dance'],
        title: "Shadow Dance Ultimate",
        choices: [
            {
                id: 'shadow_master',
                name: 'SHADOW MASTER',
                description: 'Blink Strike charges increased to 5. Each blink creates a shadow clone (3s, 50% damage).',
                rarity: 'legendary',
                effect: {
                    blinkCharges: 5,
                    spawnClone: true,
                    cloneDuration: 3000,
                    cloneDamage: 0.5
                }
            },
            {
                id: 'phase_walker',
                name: 'PHASE WALKER',
                description: 'Become permanently untargetable while Blink Strike has charges available.',
                rarity: 'legendary',
                effect: {
                    untargetableWithCharges: true,
                    phaseWalking: true
                }
            }
        ]
    },
    
    apocalypse_tier4: {
        level: 15,
        requires: ['apocalypse'],
        title: "Apocalypse Ultimate",
        choices: [
            {
                id: 'armageddon',
                name: 'ARMAGEDDON',
                description: 'Abilities deal +300% damage. Cooldowns reduced by 30% instead of increased.',
                rarity: 'legendary',
                effect: {
                    abilityDamage: 4.0,
                    cooldownReduction: 0.7
                }
            },
            {
                id: 'cataclysm',
                name: 'CATACLYSM',
                description: 'Using all 3 abilities within 5s triggers screen-wide explosion (1000 damage).',
                rarity: 'legendary',
                effect: {
                    comboWindow: 5000,
                    screenExplosion: true,
                    explosionDamage: 1000
                }
            }
        ]
    },
    
    chain_reaction_tier4: {
        level: 15,
        requires: ['chain_reaction'],
        title: "Chain Reaction Ultimate",
        choices: [
            {
                id: 'nuclear_cascade',
                name: 'NUCLEAR CASCADE',
                description: 'Explosions trigger more explosions. Each chain increases damage by +50%.',
                rarity: 'legendary',
                effect: {
                    chainExplosions: true,
                    chainBonus: 1.5,
                    maxChains: 10
                }
            },
            {
                id: 'extinction_event',
                name: 'EXTINCTION EVENT',
                description: 'At 10+ explosions in 5s, trigger map-wide explosion (2000 damage).',
                rarity: 'legendary',
                effect: {
                    thresholdExplosions: 10,
                    timeWindow: 5000,
                    mapWideExplosion: true,
                    mapExplosionDamage: 2000
                }
            }
        ]
    },
    
    // BLOOD RITUALIST ULTIMATES
    crimson_ascension_tier4: {
        level: 15,
        requires: ['crimson_ascension'],
        title: "Crimson Ascension Ultimate",
        choices: [
            {
                id: 'blood_immortal',
                name: 'BLOOD IMMORTAL',
                description: 'At 1 HP, cannot die. Heal 1% max HP per kill. +500% all stats at 1 HP.',
                rarity: 'legendary',
                effect: {
                    cannotDie: true,
                    healPerKill: 0.01,
                    lowHPBonus: 6.0
                }
            },
            {
                id: 'crimson_god',
                name: 'CRIMSON GOD',
                description: 'HP costs become HP gains. Abilities heal you instead of costing HP.',
                rarity: 'legendary',
                effect: {
                    invertCosts: true,
                    costBecomesHeal: true
                }
            }
        ]
    },
    
    blood_god_tier4: {
        level: 15,
        requires: ['blood_god'],
        title: "Blood God Ultimate",
        choices: [
            {
                id: 'blood_reaper',
                name: 'BLOOD REAPER',
                description: 'HP costs deal 50x damage instead of 10x. Gain +10% max HP per kill.',
                rarity: 'legendary',
                effect: {
                    damageMultiplier: 50,
                    maxHPPerKill: 0.10
                }
            },
            {
                id: 'crimson_nova',
                name: 'CRIMSON NOVA',
                description: 'Spend 90% HP to create massive explosion (radius = HP spent, 1 HP = 1 tile).',
                rarity: 'legendary',
                effect: {
                    nuclearOption: true,
                    hpCost: 0.90,
                    radiusPerHP: 1,
                    damagePerHP: 10
                }
            }
        ]
    },
    
    blood_armor_tier4: {
        level: 15,
        requires: ['blood_armor'],
        title: "Blood Armor Ultimate",
        choices: [
            {
                id: 'crimson_fortress',
                name: 'CRIMSON FORTRESS',
                description: 'Shield has no cap. While shield exceeds max HP, reflect 100% damage.',
                rarity: 'legendary',
                effect: {
                    noShieldCap: true,
                    reflectWhenOvercharged: true,
                    reflectPercent: 1.0
                }
            },
            {
                id: 'living_weapon',
                name: 'LIVING WEAPON',
                description: 'Convert shield to damage. 100 shield = +100% damage bonus.',
                rarity: 'legendary',
                effect: {
                    shieldToDamage: true,
                    conversionRate: 0.01
                }
            }
        ]
    },
    
    berserker_rage_tier4: {
        level: 15,
        requires: ['berserker_rage'],
        title: "Berserker Rage Ultimate",
        choices: [
            {
                id: 'eternal_rage',
                name: 'ETERNAL RAGE',
                description: 'Stay at 1 HP permanently. +1000% damage, +100% attack speed.',
                rarity: 'legendary',
                effect: {
                    lockAt1HP: true,
                    rageDamage: 11.0,
                    rageAttackSpeed: 2.0
                }
            },
            {
                id: 'blood_frenzy',
                name: 'BLOOD FRENZY',
                description: 'Lose 1% HP per second. Gain +10% all stats per 1% HP lost (stacks infinitely).',
                rarity: 'legendary',
                effect: {
                    hpDrain: 0.01,
                    stacksPerPercent: 0.10,
                    infiniteStacking: true
                }
            }
        ]
    },
    
    pandemic_tier4: {
        level: 15,
        requires: ['pandemic'],
        title: "Pandemic Ultimate",
        choices: [
            {
                id: 'global_plague',
                name: 'GLOBAL PLAGUE',
                description: 'All enemies on screen are permanently infected. Infection cannot be removed.',
                rarity: 'legendary',
                effect: {
                    screenWideInfection: true,
                    permanentInfection: true
                }
            },
            {
                id: 'plague_god',
                name: 'PLAGUE GOD',
                description: 'Each poisoned enemy increases YOUR damage by +5%. No cap.',
                rarity: 'legendary',
                effect: {
                    damagePerPoisoned: 0.05,
                    noCap: true
                }
            }
        ]
    },
    
    toxic_evolution_tier4: {
        level: 15,
        requires: ['toxic_evolution'],
        title: "Toxic Evolution Ultimate",
        choices: [
            {
                id: 'hyper_toxin',
                name: 'HYPER TOXIN',
                description: 'Poison ramps +20 DPS per second instead of +5. Enemies explode at 500 DPS.',
                rarity: 'legendary',
                effect: {
                    rampPerSecond: 20,
                    explodeThreshold: 500,
                    explosionDamage: 300,
                    explosionRadius: 5
                }
            },
            {
                id: 'terminal_plague',
                name: 'TERMINAL PLAGUE',
                description: 'Poison kills spread to ALL enemies instantly. Map-wide chain reaction.',
                rarity: 'legendary',
                effect: {
                    killsSpreadGlobally: true,
                    instantSpread: true,
                    mapWideChain: true
                }
            }
        ]
    }
};

// =================================================================
// ENDLESS SCALING (Level 16+)
// =================================================================

const EndlessUpgrades = {
    // These are offered every level after completing Tier 4 (Level 16+)
    // Player picks ONE per level
    
    common: [
        { id: 'damage_up', name: '+10% Damage', effect: { playerDamage: 1.1 } },
        { id: 'health_up', name: '+15% Max HP', effect: { playerHealth: 1.15 } },
        { id: 'speed_up', name: '+10% Movement Speed', effect: { moveSpeed: 1.1 } },
        { id: 'minion_damage', name: '+10% Minion Damage', effect: { minionDamage: 1.1 } },
        { id: 'minion_health', name: '+15% Minion HP', effect: { minionHealth: 1.15 } },
        { id: 'attack_speed', name: '+10% Attack Speed', effect: { attackSpeed: 1.1 } }
    ],
    
    rare: [
        { id: 'cooldown_reduction', name: '-10% Cooldowns', effect: { cooldownReduction: 0.9 } },
        { id: 'crit_chance', name: '+10% Crit Chance', effect: { critChance: 0.1 } },
        { id: 'lifesteal', name: '+5% Lifesteal', effect: { lifesteal: 0.05 } },
        { id: 'extra_minion', name: '+1 Max Minions', effect: { minionCap: 1 } },
        { id: 'ability_damage', name: '+20% Ability Damage', effect: { abilityDamage: 1.2 } }
    ],
    
    epic: [
        { id: 'double_cast', name: 'Q Ability: Gain 2nd Charge', effect: { qCharges: 2 } },
        { id: 'instant_cooldown', name: 'Kills reduce all cooldowns by 1s', effect: { cdrOnKill: 1000 } },
        { id: 'giant_minions', name: '+50% Minion Size and Stats', effect: { minionSize: 1.5, minionStats: 1.5 } },
        { id: 'super_speed', name: '+50% Movement Speed', effect: { moveSpeed: 1.5 } },
        { id: 'explosive_finish', name: 'Kills explode for 100 damage', effect: { explosionOnKill: 100 } }
    ],
    
    legendary: [
        { id: 'god_mode', name: 'GOD MODE: +100% All Stats (10 minute cooldown)', effect: { godMode: true } },
        { id: 'army_doubling', name: 'DOUBLE ARMY: Spawn duplicate of every minion', effect: { duplicateArmy: true } },
        { id: 'time_stop', name: 'TIME FREEZE: Stop time for 5s (60s cooldown)', effect: { timeStop: true } },
        { id: 'screen_nuke', name: 'SCREEN NUKE: Kill all enemies (120s cooldown)', effect: { screenNuke: true } }
    ]
};

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Get available choices based on player's current build
 */
function getAvailableChoices(playerLevel, unlockedSkills = []) {
    // Level 1: Choose path
    if (playerLevel === 1 && unlockedSkills.length === 0) {
        return MalacharSkillTree.tier1.choices;
    }
    
    // Level 5: Choose specialization
    if (playerLevel === 5) {
        const path = unlockedSkills[0]; // First choice is the path
        const tier2Key = `${path}_tier2`;
        return MalacharSkillTree[tier2Key]?.choices || [];
    }
    
    // Level 10: Choose mastery
    if (playerLevel === 10) {
        const spec = unlockedSkills[1]; // Second choice is specialization
        const tier3Key = `${spec}_tier3`;
        return MalacharSkillTree[tier3Key]?.choices || [];
    }
    
    // Level 15: Choose ultimate
    if (playerLevel === 15) {
        const mastery = unlockedSkills[2]; // Third choice is mastery
        const tier4Key = `${mastery}_tier4`;
        return MalacharSkillTree[tier4Key]?.choices || [];
    }
    
    // Level 16+: Endless upgrades
    if (playerLevel >= 16) {
        // Randomly offer 3 upgrades: 1 common, 1 rare, 1 epic/legendary
        const commonChoice = EndlessUpgrades.common[Math.floor(Math.random() * EndlessUpgrades.common.length)];
        const rareChoice = EndlessUpgrades.rare[Math.floor(Math.random() * EndlessUpgrades.rare.length)];
        
        // 20% chance for legendary, otherwise epic
        const specialPool = Math.random() < 0.2 ? EndlessUpgrades.legendary : EndlessUpgrades.epic;
        const specialChoice = specialPool[Math.floor(Math.random() * specialPool.length)];
        
        return [commonChoice, rareChoice, specialChoice];
    }
    
    return [];
}

/**
 * Get skill by ID
 */
function getSkillById(skillId) {
    // Search all tiers
    for (let tier in MalacharSkillTree) {
        const tierData = MalacharSkillTree[tier];
        if (tierData.choices) {
            const skill = tierData.choices.find(s => s.id === skillId);
            if (skill) return skill;
        }
    }
    return null;
}

/**
 * Get build summary
 */
function getBuildSummary(unlockedSkills) {
    if (unlockedSkills.length === 0) return null;
    
    const path = getSkillById(unlockedSkills[0]);
    const spec = unlockedSkills.length > 1 ? getSkillById(unlockedSkills[1]) : null;
    const mastery = unlockedSkills.length > 2 ? getSkillById(unlockedSkills[2]) : null;
    const ultimate = unlockedSkills.length > 3 ? getSkillById(unlockedSkills[3]) : null;
    
    return {
        path: path?.name,
        specialization: spec?.name,
        mastery: mastery?.name,
        ultimate: ultimate?.name,
        level: unlockedSkills.length
    };
}

// =================================================================
// EXPORT
// =================================================================

if (typeof window !== 'undefined') {
    window.MalacharSkillTree = MalacharSkillTree;
    window.EndlessUpgrades = EndlessUpgrades;
    window.getAvailableChoices = getAvailableChoices;
    window.getSkillById = getSkillById;
    window.getBuildSummary = getBuildSummary;
    
    console.log('✅ Malachar Skill Tree v2 loaded!');
    console.log('📊 System:');
    console.log('  - 3 Paths');
    console.log('  - 9 Specializations');
    console.log('  - 18 Masteries');
    console.log('  - 36 Ultimates');
    console.log('  - Endless scaling post-15');
    console.log('🎮 Total unique builds: 3 × 3 × 2 × 2 = 36 core builds');
}