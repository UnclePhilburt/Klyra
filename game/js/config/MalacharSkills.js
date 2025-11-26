// Malachar Skill Tree - Bone Commander Only
// Single permanent minion build for co-op gameplay

const MalacharSkillTree = {
    
    // =================================================================
    // TIER 1 - CHOOSE YOUR BUILD (Level 1)
    // =================================================================
    
    tier1: {
        level: 1,
        title: "Choose Your Path",
        description: "Define your identity",
        choices: [
            {
                id: 'bone_commander',
                name: 'BONE COMMANDER',
                subtitle: 'Co-op + Permanent Minions',
                description: 'Your power multiplies with allies. Command elite undead.',
                path: 'coop',
                minionType: 'permanent',
                
                stats: {
                    playerDamage: 10, // HORDE MODE: Increased for balance
                    startingMinions: 5,
                    minionCap: 5,
                    minionHealth: 100,
                    minionDamage: 30, // HORDE MODE: Increased for balance
                    allyScaling: 0.20 // +20% minion stats per ally in 8 tiles
                },
                
                autoAttack: {
                    name: 'Command Bolt',
                    description: 'Shoots a bone projectile at lowest HP minion, healing and buffing it',
                    target: 'minion_lowest_hp', // Targets lowest HP minion
                    range: 10,
                    cooldown: 3000, // 3 seconds instead of 1
                    projectileSpeed: 400, // Pixels per second
                    effects: {
                        onMinion: {
                            damageBonus: 0.25, // 25% damage boost (down from 40%)
                            heal: 15, // Heal 15 HP
                            duration: 3000
                        },
                        onAlly: {
                            damageBonus: 0.20,
                            duration: 3000
                        }
                    }
                },
                
                abilities: {
                    q: {
                        name: 'Unified Front',
                        description: 'Minions teleport to nearest ally. That ally gains shield. Minions deal +50% damage near allies for 6s.',
                        cooldown: 12000,
                        duration: 6000,
                        effect: {
                            teleportToAlly: true,
                            allyShield: 80,
                            minionDamageBonus: 0.50,
                            requireNearAlly: true,
                            nearRange: 6
                        }
                    },
                    e: {
                        name: "Legion's Call",
                        description: 'Revive all dead minions. Spawn 2 temps at each ally position. All minions +40% damage for 10s.',
                        cooldown: 60000,
                        duration: 10000,
                        effect: {
                            reviveAll: true,
                            spawnPerAlly: 2,
                            tempDuration: 15000,
                            tempStats: { health: 80, damage: 27 }, // HORDE MODE: Increased for balance
                            allMinionBonus: 0.40
                        }
                    },
                    r: {
                        name: 'Pact of Bones',
                        description: 'All minions explode dealing massive AOE damage, then instantly respawn at your position ready to fight.',
                        cooldown: 15000,
                        effect: {
                            explodeMinions: true,
                            explosionDamage: 375, // HORDE MODE: Increased for balance
                            explosionRadius: 3,
                            instantRespawn: true,
                            respawnInvulnDuration: 1000
                        }
                    }
                }
            }
        ]
    }
};

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Get available choices for a given level
 * Malachar now has a single fixed path: Bone Commander
 * Abilities unlock at: E - Legion's Call (level 1), Q - Unified Front (level 5), R - Pact of Bones (level 10)
 * @param {number} level - The level to get choices for
 * @param {array} unlockedSkills - Array of unlocked skill IDs
 * @returns {array} - Array of skill choices (empty if no choices for this level)
 */
function getAvailableChoices(level, unlockedSkills = []) {
    console.log(`🔍 getAvailableChoices called with level: ${level}`);
    const boneCommander = MalacharSkillTree.tier1.choices.find(c => c.id === 'bone_commander');

    if (!boneCommander) {
        console.error('❌ Bone Commander build not found!');
        return [];
    }

    // Level 1: Unlock E ability (Legion's Call - minion revive)
    if (level === 1) {
        console.log('✅ Level 1 detected - returning E ability (Legion\'s Call)');
        const result = [{
            id: 'bone_commander_e',
            name: boneCommander.abilities.e.name,
            description: boneCommander.abilities.e.description,
            type: 'ability',
            abilityKey: 'e',
            build: boneCommander,
            effects: boneCommander.abilities.e.effect,
            cooldown: boneCommander.abilities.e.cooldown,
            duration: boneCommander.abilities.e.duration
        }];
        console.log('✅ Returning E ability:', result);
        return result;
    }

    // Level 5: Unlock Q ability (Unified Front)
    if (level === 5) {
        return [{
            id: 'bone_commander_q',
            name: boneCommander.abilities.q.name,
            description: boneCommander.abilities.q.description,
            type: 'ability',
            abilityKey: 'q',
            build: boneCommander,
            effects: boneCommander.abilities.q.effect,
            cooldown: boneCommander.abilities.q.cooldown,
            duration: boneCommander.abilities.q.duration
        }];
    }

    // Level 10: Unlock R ability (Pact of Bones)
    if (level === 10) {
        return [{
            id: 'bone_commander_r',
            name: boneCommander.abilities.r.name,
            description: boneCommander.abilities.r.description,
            type: 'ability',
            abilityKey: 'r',
            build: boneCommander,
            effects: boneCommander.abilities.r.effect,
            cooldown: boneCommander.abilities.r.cooldown
        }];
    }

    // No abilities for other levels
    console.log(`🔒 No abilities unlock at level ${level}`);
    return [];
}

/**
 * Get build by ID
 */
function getBuildById(buildId) {
    return MalacharSkillTree.tier1.choices.find(b => b.id === buildId);
}

/**
 * Get build info summary
 */
function getBuildSummary(buildId) {
    const build = getBuildById(buildId);
    if (!build) return null;
    
    return {
        name: build.name,
        path: build.path,
        minionType: build.minionType,
        description: build.description,
        playstyle: `${build.path === 'coop' ? 'CO-OP FOCUSED' : 'SOLO FOCUSED'} - ${build.minionType === 'permanent' ? 'PERMANENT MINIONS' : 'TEMPORARY MINIONS'}`
    };
}

// =================================================================
// EXPORT
// =================================================================

if (typeof window !== 'undefined') {
    window.MalacharSkillTree = MalacharSkillTree;
    window.getAvailableChoices = getAvailableChoices;
    window.getBuildById = getBuildById;
    window.getBuildSummary = getBuildSummary;
}