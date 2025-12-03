import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

// Loading manager
let totalAssets = 0;
let loadedAssets = 0;
let gameReady = false;
let preloadedUnarmedAnims = [];
let preloadedRifleAnims = [];

function updateLoadingProgress(message) {
    const percentage = Math.floor((loadedAssets / totalAssets) * 100);
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingPercentage = document.getElementById('loading-percentage');

    if (loadingBar) loadingBar.style.width = percentage + '%';
    if (loadingText) loadingText.textContent = message;
    if (loadingPercentage) loadingPercentage.textContent = percentage + '%';

    console.log(`Loading: ${percentage}% - ${message}`);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const teamSelectionScreen = document.getElementById('team-selection-screen');

    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';

                // Check if level has a player spawn point
                if (currentLevelData && currentLevelData.playerSpawn) {
                    // Spawn player directly at the player spawn point
                    console.log('Level has player spawn, skipping team selection');
                    spawnPlayerAtPlayerSpawn();
                } else {
                    // Show team selection screen
                    if (teamSelectionScreen) {
                        teamSelectionScreen.classList.remove('hidden');
                    }
                }
            }, 500);
        }, 500);
    }
}

function spawnPlayerAtPlayerSpawn() {
    if (!currentLevelData || !currentLevelData.playerSpawn) {
        console.warn('Cannot spawn player: missing level data');
        return;
    }

    if (!character) {
        console.warn('Character not loaded yet, will spawn after character loads');
        // Flag to spawn player when character loads
        window.shouldSpawnAtPlayerSpawn = true;
        return;
    }

    const spawn = currentLevelData.playerSpawn;

    // Set player position
    character.position.set(
        spawn.position.x,
        spawn.position.y,
        spawn.position.z
    );

    // Set player rotation
    if (spawn.rotation) {
        character.rotation.y = spawn.rotation.y;
    }

    console.log('Player spawned at player spawn point:', character.position);

    // Initialize player health
    playerHealth = maxPlayerHealth;
    updatePlayerHealthUI();

    // Hide HUD elements in lobby
    hideHUD();
}

function hideHUD() {
    const hudElements = [
        document.getElementById('crosshair'),
        document.getElementById('player-health-bar'),
        document.getElementById('score-display'),
        document.getElementById('kill-feed'),
        document.querySelector('.player-stats') // Kills and deaths display
    ];

    hudElements.forEach(el => {
        if (el) el.style.display = 'none';
    });
}

function showHUD() {
    const hudElements = [
        document.getElementById('crosshair'),
        document.getElementById('player-health-bar'),
        document.getElementById('score-display'),
        document.getElementById('kill-feed'),
        document.querySelector('.player-stats') // Kills and deaths display
    ];

    hudElements.forEach(el => {
        if (el) el.style.display = '';
    });
}

function selectTeam(teamId) {
    playerTeamId = teamId;
    console.log(`Player selected Team ${teamId}`);

    // Hide team selection screen
    const teamSelectionScreen = document.getElementById('team-selection-screen');
    if (teamSelectionScreen) {
        teamSelectionScreen.classList.add('hidden');
        setTimeout(() => {
            teamSelectionScreen.style.display = 'none';
        }, 500);
    }

    // Start the game with selected team
    startGameWithTeam(teamId);
}

function startGameWithTeam(teamId) {
    console.log(`Starting game as Team ${teamId}`);

    // Find spawn points for the player's team
    if (currentLevelData && currentLevelData.objects && character) {
        const teamSpawnPoints = currentLevelData.objects.filter(obj =>
            obj.type === 'spawn' && obj.subtype === `team${teamId}`
        );

        if (teamSpawnPoints.length > 0) {
            // Pick a random spawn point
            const spawnPoint = teamSpawnPoints[Math.floor(Math.random() * teamSpawnPoints.length)];

            // Move character to spawn point
            character.position.set(
                spawnPoint.position.x,
                spawnPoint.position.y,
                spawnPoint.position.z
            );

            console.log(`Player spawned at Team ${teamId} spawn point:`, character.position);
        } else {
            console.warn(`No spawn points found for Team ${teamId}`);
        }
    }

    // Initialize player health
    playerHealth = maxPlayerHealth;
    updatePlayerHealthUI();

    // Show HUD elements in team-based levels
    showHUD();
}

// Update player health UI
function updatePlayerHealthUI() {
    const healthFill = document.getElementById('player-health-fill');
    const healthText = document.getElementById('player-health-text');

    if (healthFill && healthText) {
        const healthPercent = (playerHealth / maxPlayerHealth) * 100;
        healthFill.style.width = healthPercent + '%';
        healthText.textContent = Math.max(0, Math.round(playerHealth));

        // Change color when low health
        if (healthPercent < 30) {
            healthFill.classList.add('low');
        } else {
            healthFill.classList.remove('low');
        }
    }
}

// Player takes damage
function damagePlayer(damage) {
    if (playerIsDead) return false;

    playerHealth -= damage;
    updatePlayerHealthUI();

    // Screen flash effect
    if (damage > 0) {
        document.body.style.transition = 'background-color 0.1s';
        document.body.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        setTimeout(() => {
            document.body.style.backgroundColor = '';
        }, 100);
    }

    if (playerHealth <= 0) {
        playerHealth = 0;
        killPlayer();
        return true; // Player died
    }

    return false; // Player still alive
}

// Kill player
function killPlayer() {
    if (playerIsDead) return;

    playerIsDead = true;
    console.log('Player died!');

    // Show death screen
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
        deathScreen.classList.add('visible');
    }

    // Hide crosshair
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        crosshair.style.display = 'none';
    }

    // Start respawn timer
    respawnTimer = respawnDelay;
    updateRespawnTimer();
}

// Update respawn timer display
function updateRespawnTimer() {
    const timerElement = document.getElementById('respawn-timer');
    if (timerElement) {
        timerElement.textContent = Math.ceil(respawnTimer);
    }

    if (respawnTimer > 0) {
        setTimeout(() => {
            respawnTimer -= 0.1;
            updateRespawnTimer();
        }, 100);
    } else {
        respawnPlayer();
    }
}

// Respawn player
function respawnPlayer() {
    console.log('Respawning player...');

    // Reset health
    playerHealth = maxPlayerHealth;
    playerIsDead = false;
    updatePlayerHealthUI();

    // Hide death screen
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
        deathScreen.classList.remove('visible');
    }

    // Show crosshair
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        crosshair.style.display = '';
    }

    // Check if level has a player spawn point (for lobby levels)
    if (currentLevelData && currentLevelData.playerSpawn && character) {
        const spawn = currentLevelData.playerSpawn;
        character.position.set(
            spawn.position.x,
            spawn.position.y,
            spawn.position.z
        );
        if (spawn.rotation) {
            character.rotation.y = spawn.rotation.y;
        }
        console.log('Player respawned at player spawn point:', character.position);

        // Hide HUD in lobby
        hideHUD();
    }
    // Otherwise spawn at team spawn point (for team-based levels)
    else if (playerTeamId && currentLevelData && currentLevelData.objects && character) {
        const teamSpawnPoints = currentLevelData.objects.filter(obj =>
            obj.type === 'spawn' && obj.subtype === `team${playerTeamId}`
        );

        if (teamSpawnPoints.length > 0) {
            // Pick a random spawn point
            const spawnPoint = teamSpawnPoints[Math.floor(Math.random() * teamSpawnPoints.length)];

            // Move character to spawn point
            character.position.set(
                spawnPoint.position.x,
                spawnPoint.position.y,
                spawnPoint.position.z
            );

            console.log(`Player respawned at Team ${playerTeamId} spawn point:`, character.position);
        }

        // Show HUD in team-based levels
        showHUD();
    }
}

// Preload all animations before game starts
async function preloadAllAnimations() {
    return new Promise((resolve) => {
        // Count total assets to load
        totalAssets =
            unarmedAnimationFiles.length +  // 19 unarmed animations
            rifleAnimationFiles.length +     // 24 rifle animations
            7 +  // Special rifle animations (ADS Idle, Fire, DryFire, Reload, Melee, Spawn, Equip)
            4 +  // Additive animations
            18;  // Aim offset animations (9 hipfire + 9 ADS)

        loadedAssets = 0;

        console.log(`Starting to preload ${totalAssets} animations...`);

        // Load unarmed animations
        let loadedCount = 0;
        unarmedAnimationFiles.forEach((file, index) => {
            loader.load(
                file,
                (gltf) => {
                    if (gltf.animations.length > 0) {
                        preloadedUnarmedAnims[index] = gltf.animations[0];
                    }
                    loadedAssets++;
                    loadedCount++;
                    updateLoadingProgress(`Loading unarmed animations... (${loadedCount}/${unarmedAnimationFiles.length})`);
                    checkComplete();
                },
                undefined,
                (error) => {
                    console.error('Error loading unarmed animation:', file, error);
                    loadedAssets++;
                    checkComplete();
                }
            );
        });

        // Load rifle animations
        loadedCount = 0;
        rifleAnimationFiles.forEach((file, index) => {
            loader.load(
                file,
                (gltf) => {
                    if (gltf.animations.length > 0) {
                        preloadedRifleAnims[index] = gltf.animations[0];
                    }
                    loadedAssets++;
                    loadedCount++;
                    updateLoadingProgress(`Loading rifle animations... (${loadedCount}/${rifleAnimationFiles.length})`);
                    checkComplete();
                },
                undefined,
                (error) => {
                    console.error('Error loading rifle animation:', file, error);
                    loadedAssets++;
                    checkComplete();
                }
            );
        });

        // Load special rifle animations
        loader.load('animations/MM_Rifle_Idle_ADS.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleADSIdleAnim = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading special animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Fire.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleFireAnim = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading special animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_DryFire.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleDryFireAnim = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading special animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Reload.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleReloadAnim = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading special animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Melee.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleMeleeAnim = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading special animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Spawn.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleSpawnAnim = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading special animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Equip.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleEquipAnim = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading special animations...');
            checkComplete();
        });

        // Load additive animations
        loader.load('animations/MM_Rifle_Reload_Additive.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleReloadAdditive = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading additive animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Melee_Additive.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleMeleeAdditive = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading additive animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Equip_Additive.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleEquipAdditive = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading additive animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_DryFire_Additive.glb', (gltf) => {
            if (gltf.animations.length > 0) rifleDryFireAdditive = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading additive animations...');
            checkComplete();
        });

        // Load Aim Offset animations - Hipfire
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_CC.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.CC = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_CU.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.CU = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_CD.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.CD = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_LC.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.LC = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_LU.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.LU = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_LD.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.LD = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_RC.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.RC = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_RU.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.RU = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_Hipfire_AO_RD.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetHipfire.RD = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });

        // Load Aim Offset animations - ADS
        loader.load('animations/MM_Rifle_Idle_ADS_AO_CC.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.CC = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_CU.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.CU = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_CD.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.CD = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_LC.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.LC = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_LU.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.LU = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_LD.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.LD = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_RC.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.RC = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_RU.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.RU = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });
        loader.load('animations/MM_Rifle_Idle_ADS_AO_RD.glb', (gltf) => {
            if (gltf.animations.length > 0) aimOffsetADS.RD = gltf.animations[0];
            loadedAssets++;
            updateLoadingProgress('Loading aim offset animations...');
            checkComplete();
        });

        function checkComplete() {
            if (loadedAssets >= totalAssets) {
                console.log('✓ All animations preloaded!');
                updateLoadingProgress('Complete!');
                gameReady = true;
                resolve();
            }
        }
    });
}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 1.5, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5 for performance
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // Cheaper shadows than PCFSoft
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic color grading
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Post-processing setup (AAA visual quality)
const composer = new EffectComposer(renderer);

// Base render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// SSAO (Screen Space Ambient Occlusion) - DISABLED due to black aura artifacts
// const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
// ssaoPass.kernelRadius = 1;
// ssaoPass.minDistance = 0.0001;
// ssaoPass.maxDistance = 0.01;
// ssaoPass.output = SSAOPass.OUTPUT.Default;
// composer.addPass(ssaoPass);

// Bloom effect (glow on bright areas - realistic lighting)
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,  // strength (subtle)
    0.4,  // radius
    0.85  // threshold (only bright areas glow)
);
composer.addPass(bloomPass);

// Anti-aliasing (smooth edges)
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * renderer.getPixelRatio());
fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * renderer.getPixelRatio());
composer.addPass(fxaaPass);

// Camera control variables
let cameraDistance = 3.5;
let cameraDistanceTarget = 3.5; // Target distance for smooth zoom
const normalCameraDistance = 3.5;
const adsCameraDistance = 1.5; // Closer when aiming
const cameraZoomSpeed = 0.1; // How fast camera zooms in/out
let cameraTheta = 0; // Horizontal angle
let cameraPhi = Math.PI / 2; // Vertical angle (PI/2 = looking straight forward)
let mouseSensitivity = 0.003;

// First-person mode
let isFirstPerson = true; // Start in first-person
let headBone = null; // Reference to character's head bone

// Aim bones for direct rotation
let spineBones = [];
let neckBone = null;

// NPC and shooting system
let npc = null;
let npcHealth = 100;
let npcMixer = null;
const maxNpcHealth = 100;

// Raycaster for shooting
const raycaster = new THREE.Raycaster();
const bulletDirection = new THREE.Vector3();

// Collision system - Capsule-based (AAA style)
const collidableObjects = [];
const collisionRaycaster = new THREE.Raycaster();
const playerRadius = 0.3; // Player collision radius (smaller for doorways)
const playerHeight = 1.8; // Player height for capsule
const playerCapsule = new THREE.Sphere(new THREE.Vector3(), playerRadius); // Simplified as sphere for performance
const collisionBoxes = []; // Bounding boxes for fast collision

// ==================== PERFORMANCE OPTIMIZATION SYSTEMS ====================
// Instanced rendering - group identical objects for massive performance boost
const instancedMeshes = new Map(); // Map of file -> InstancedMesh
const instanceData = new Map(); // Map of file -> array of transform data
const instancedObjects = []; // Track all instanced objects for updates

// LOD (Level of Detail) system
const lodObjects = []; // Objects with LOD enabled
const LOD_DISTANCES = {
    HIGH: 30,    // Full detail within 30 units
    MEDIUM: 60,  // Medium detail 30-60 units
    LOW: 100     // Low detail 60-100 units, cull beyond 100
};

// Frustum culling stats (Three.js does this automatically, we just track it)
let visibleObjects = 0;
let totalObjects = 0;
let culledObjects = 0;

// Occlusion culling - don't render objects behind walls
const occlusionCullingEnabled = true;
const occlusionCheckInterval = 5; // Check every N frames
let occlusionFrame = 0;
const occludedObjects = new Set();

// Jump system
let jumpVelocity = 0;
const jumpStrength = 5;
const gravity = 15;
let isGrounded = true;
let jumpState = 'none'; // none, start, apex, fall, land
const JUMP_START_INDEX = 7;
const JUMP_APEX_INDEX = 8;
const JUMP_FALL_INDEX = 9;
const JUMP_LAND_INDEX = 10;

// Smooth camera position
const smoothCameraPosition = new THREE.Vector3(0, 1.5, 3);
const smoothCameraTarget = new THREE.Vector3(0, 1, 0);
const cameraSmoothness = 0.1; // Lower = smoother (0.05-0.15 range)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffefd5, 1.5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;   // Increased from -10 to -50
directionalLight.shadow.camera.right = 50;   // Increased from 10 to 50
directionalLight.shadow.camera.top = 50;     // Increased from 10 to 50
directionalLight.shadow.camera.bottom = -50; // Increased from -10 to -50
directionalLight.shadow.mapSize.width = 2048; // Increased from 1024 for better quality with larger area
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Sun direction offset (updated when level loads with custom sun position)
let sunDirectionOffset = new THREE.Vector3(5, 10, 5);

// ===== PARTICLE SYSTEM (AAA Effects) =====
class ParticleSystem {
    constructor(config) {
        this.particles = [];
        this.particleCount = config.count || 20;
        this.lifetime = config.lifetime || 0.5;
        this.size = config.size || 0.1;
        this.color = config.color || 0xffaa00;
        this.velocity = config.velocity || new THREE.Vector3(0, 2, 0);
        this.spread = config.spread || 1;
        this.gravity = config.gravity !== undefined ? config.gravity : -9.8;

        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];

        for (let i = 0; i < this.particleCount; i++) {
            positions.push(0, 0, 0);
            colors.push(1, 1, 1);
            sizes.push(this.size);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        // Create particle material
        const material = new THREE.PointsMaterial({
            size: this.size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.system = new THREE.Points(geometry, material);
        this.system.visible = false;
        scene.add(this.system);
    }

    emit(position) {
        const positions = this.system.geometry.attributes.position.array;
        const colors = this.system.geometry.attributes.color.array;

        this.particles = [];
        const col = new THREE.Color(this.color);

        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 3;

            // Set initial position
            positions[idx] = position.x;
            positions[idx + 1] = position.y;
            positions[idx + 2] = position.z;

            // Set color
            colors[idx] = col.r;
            colors[idx + 1] = col.g;
            colors[idx + 2] = col.b;

            // Create particle data
            this.particles.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * this.spread + this.velocity.x,
                    (Math.random() - 0.5) * this.spread + this.velocity.y,
                    (Math.random() - 0.5) * this.spread + this.velocity.z
                ),
                life: this.lifetime,
                age: 0
            });
        }

        this.system.geometry.attributes.position.needsUpdate = true;
        this.system.geometry.attributes.color.needsUpdate = true;
        this.system.visible = true;
    }

    update(delta) {
        if (!this.system.visible) return;

        const positions = this.system.geometry.attributes.position.array;
        const colors = this.system.geometry.attributes.color.array;
        let anyAlive = false;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.age += delta;

            if (particle.age < particle.life) {
                anyAlive = true;
                const idx = i * 3;

                // Apply velocity
                particle.velocity.y += this.gravity * delta;
                positions[idx] += particle.velocity.x * delta;
                positions[idx + 1] += particle.velocity.y * delta;
                positions[idx + 2] += particle.velocity.z * delta;

                // Fade out
                const alpha = 1 - (particle.age / particle.life);
                colors[idx] *= alpha;
                colors[idx + 1] *= alpha;
                colors[idx + 2] *= alpha;
            }
        }

        this.system.geometry.attributes.position.needsUpdate = true;
        this.system.geometry.attributes.color.needsUpdate = true;

        if (!anyAlive) {
            this.system.visible = false;
        }
    }
}

// Create particle systems for different effects
const muzzleFlashParticles = new ParticleSystem({
    count: 15,
    lifetime: 0.1,
    size: 0.15,
    color: 0xffaa00,
    velocity: new THREE.Vector3(0, 0.5, 2),
    spread: 0.3,
    gravity: 0
});

const bulletImpactParticles = new ParticleSystem({
    count: 20,
    lifetime: 0.3,
    size: 0.08,
    color: 0x888888,
    velocity: new THREE.Vector3(0, 1, 0),
    spread: 2,
    gravity: -5
});

const dustParticles = new ParticleSystem({
    count: 8,
    lifetime: 0.6,
    size: 0.15,
    color: 0xccaa88,
    velocity: new THREE.Vector3(0, 0.3, 0),
    spread: 0.4,
    gravity: -0.5
});

// ===== TERRAIN TEXTURE SYSTEM =====
function createSandTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const variation = (Math.random() - 0.5) * 15;
            ctx.fillStyle = `rgb(${194 + variation}, ${178 + variation}, ${128 + variation})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, size = Math.random() * 2 + 1;
        const brightness = Math.random() * 40 - 20;
        ctx.fillStyle = `rgba(${194 + brightness}, ${173 + brightness}, ${118 + brightness}, ${0.3 + Math.random() * 0.3})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 15000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, brightness = Math.random() * 50 - 25;
        ctx.fillStyle = `rgb(${194 + brightness}, ${170 + brightness}, ${113 + brightness})`;
        ctx.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, size = Math.random() * 1.5;
        ctx.fillStyle = `rgba(140, 120, 80, ${0.2 + Math.random() * 0.2})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
    return canvas;
}

function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#5a8f3a'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, brightness = Math.random() * 40 - 20;
        ctx.fillStyle = `rgb(${90 + brightness}, ${143 + brightness}, ${58 + brightness})`;
        ctx.fillRect(x, y, 1, 2);
    }
    return canvas;
}

function createDirtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8B4513'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 12000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, brightness = Math.random() * 50 - 25;
        ctx.fillStyle = `rgb(${139 + brightness}, ${69 + brightness}, ${19 + brightness})`;
        ctx.fillRect(x, y, Math.random() * 2, Math.random() * 2);
    }
    return canvas;
}

function createConcreteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 15000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, brightness = Math.random() * 40 - 20, grey = 128 + brightness;
        ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey})`;
        ctx.fillRect(x, y, Math.random() * 1.5, Math.random() * 1.5);
    }
    return canvas;
}

function createAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 18000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, dark = 42 + Math.random() * 30 - 15;
        ctx.fillStyle = `rgb(${dark}, ${dark}, ${dark})`;
        ctx.fillRect(x, y, Math.random() * 1, Math.random() * 1);
    }
    return canvas;
}

function createSnowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 6000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, size = Math.random() * 2.5 + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + Math.random() * 0.2})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, size = Math.random() * 1.5;
        ctx.fillStyle = `rgba(230, 240, 255, 0.4)`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
    return canvas;
}

function createMudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#5c4033'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, brightness = Math.random() * 40 - 20;
        ctx.fillStyle = `rgb(${92 + brightness}, ${64 + brightness}, ${51 + brightness})`;
        ctx.fillRect(x, y, Math.random() * 2.5, Math.random() * 2.5);
    }
    return canvas;
}

function createRockTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#666666'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 14000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, brightness = Math.random() * 50 - 25, grey = 102 + brightness;
        ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey})`;
        ctx.fillRect(x, y, Math.random() * 2, Math.random() * 2);
    }
    return canvas;
}

// Create tiled versions of textures for 2048x2048 terrain canvas
function createTiledCanvas(sourceCanvas, tileCount = 20) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const tileSize = canvas.width / tileCount;
    for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
            ctx.drawImage(sourceCanvas, x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }
    return canvas;
}

const sandCanvas = createTiledCanvas(createSandTexture(), 20);
const grassCanvas = createTiledCanvas(createGrassTexture(), 20);
const dirtCanvas = createTiledCanvas(createDirtTexture(), 20);
const concreteCanvas = createTiledCanvas(createConcreteTexture(), 20);
const asphaltCanvas = createTiledCanvas(createAsphaltTexture(), 20);
const snowCanvas = createTiledCanvas(createSnowTexture(), 20);
const mudCanvas = createTiledCanvas(createMudTexture(), 20);
const rockCanvas = createTiledCanvas(createRockTexture(), 20);

const terrainCanvas = document.createElement('canvas');
terrainCanvas.width = 2048; terrainCanvas.height = 2048;
const terrainCtx = terrainCanvas.getContext('2d');
terrainCtx.drawImage(sandCanvas, 0, 0, 2048, 2048);

// Create initial texture from canvas data URL (not CanvasTexture)
const initialDataURL = terrainCanvas.toDataURL('image/png');
const initialImg = new Image();
initialImg.src = initialDataURL;
const terrainTexture = new THREE.Texture(initialImg);
terrainTexture.wrapS = THREE.ClampToEdgeWrapping;
terrainTexture.wrapT = THREE.ClampToEdgeWrapping;
terrainTexture.colorSpace = THREE.SRGBColorSpace; // Fix: Set correct color space
initialImg.onload = function() {
    terrainTexture.needsUpdate = true;
};


function extractChannel(splatData, channelIndex, width, height) {
    const mask = new ImageData(width, height);
    for (let i = 0; i < splatData.data.length; i += 4) {
        const value = splatData.data[i + channelIndex];
        mask.data[i] = value; 
        mask.data[i + 1] = value; 
        mask.data[i + 2] = value; 
        mask.data[i + 3] = value;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').putImageData(mask, 0, 0);
    return canvas;
}

function applyTextureLayer(ctx, tempCtx, textureCanvas, maskCanvas, width, height) {
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-over';
    tempCtx.drawImage(textureCanvas, 0, 0, width, height);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tempCtx.canvas, 0, 0);
}

function updateTerrainTexture(splatmap1Data, splatmap2Data) {
    const ctx = terrainCtx, width = terrainCanvas.width, height = terrainCanvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(sandCanvas, 0, 0, width, height);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width; tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    // Scale splatmaps to terrain size before extracting channels
    let splat1Scaled = null, splat2Scaled = null;

    if (splatmap1Data) {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const tempCtx2 = canvas.getContext('2d');
        const imgData = new ImageData(splatmap1Data.data, splatmap1Data.width, splatmap1Data.height);
        const tempCanvas2 = document.createElement('canvas');
        tempCanvas2.width = splatmap1Data.width; tempCanvas2.height = splatmap1Data.height;
        tempCanvas2.getContext('2d').putImageData(imgData, 0, 0);
        tempCtx2.drawImage(tempCanvas2, 0, 0, width, height);
        splat1Scaled = tempCtx2.getImageData(0, 0, width, height);
    }

    if (splatmap2Data) {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const tempCtx2 = canvas.getContext('2d');
        const imgData = new ImageData(splatmap2Data.data, splatmap2Data.width, splatmap2Data.height);
        const tempCanvas2 = document.createElement('canvas');
        tempCanvas2.width = splatmap2Data.width; tempCanvas2.height = splatmap2Data.height;
        tempCanvas2.getContext('2d').putImageData(imgData, 0, 0);
        tempCtx2.drawImage(tempCanvas2, 0, 0, width, height);
        splat2Scaled = tempCtx2.getImageData(0, 0, width, height);

    }

    if (splat1Scaled) {

        applyTextureLayer(ctx, tempCtx, grassCanvas, extractChannel(splat1Scaled, 0, width, height), width, height);
        applyTextureLayer(ctx, tempCtx, dirtCanvas, extractChannel(splat1Scaled, 1, width, height), width, height);
        applyTextureLayer(ctx, tempCtx, concreteCanvas, extractChannel(splat1Scaled, 2, width, height), width, height);
    }
    if (splat2Scaled) {

        applyTextureLayer(ctx, tempCtx, asphaltCanvas, extractChannel(splat2Scaled, 0, width, height), width, height);
        applyTextureLayer(ctx, tempCtx, snowCanvas, extractChannel(splat2Scaled, 1, width, height), width, height);
        applyTextureLayer(ctx, tempCtx, mudCanvas, extractChannel(splat2Scaled, 2, width, height), width, height);
    }

    // DEBUG: Log first pixel color to see what texture is being applied
    const debugPixel = ctx.getImageData(1024, 1024, 1, 1).data;
    console.log('[Terrain] Center pixel color (R,G,B):', debugPixel[0], debugPixel[1], debugPixel[2]);

    // Create completely new texture from canvas
    const dataURL = terrainCanvas.toDataURL('image/png');

    // DEBUG: Log data URL length
    console.log('[Terrain] Canvas data URL length:', dataURL.length);
    console.log('[Terrain] Canvas data URL preview:', dataURL.substring(0, 100));

    const img = new Image();
    img.onload = function() {
        console.log('[Terrain] Image loaded, size:', img.width, 'x', img.height);

        // Dispose old texture completely
        if (groundMaterial.map) {
            groundMaterial.map.dispose();
        }

        // Create brand new texture
        const newTexture = new THREE.Texture(img);
        newTexture.wrapS = THREE.ClampToEdgeWrapping;
        newTexture.wrapT = THREE.ClampToEdgeWrapping;
        newTexture.colorSpace = THREE.SRGBColorSpace;
        newTexture.needsUpdate = true;

        // Replace material's map
        groundMaterial.map = newTexture;
        groundMaterial.needsUpdate = true;

        console.log('[Terrain] Material map replaced with new texture');
    };
    img.src = dataURL;
}

const groundGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
    map: terrainTexture,
    roughness: 0.9,
    metalness: 0.0
});
let ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ===== ASSET MANAGEMENT SYSTEM =====
// Texture cache to avoid loading the same texture multiple times
const textureCache = new Map();

// GLTF model cache to avoid loading the same models multiple times
const modelCache = new Map();

// Enhanced GLTF loader with caching
async function loadModelWithCache(path) {
    // Check cache first
    if (modelCache.has(path)) {
        console.log(`[Model] Using cached model: ${path}`);
        // Clone the cached model to allow multiple instances
        return modelCache.get(path).clone();
    }

    // Load the model
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                path,
                resolve,
                undefined,
                reject
            );
        });

        // Cache the loaded model
        modelCache.set(path, gltf.scene);
        console.log(`[Model] Loaded and cached: ${path}`);
        return gltf.scene.clone();
    } catch (error) {
        console.error(`[Model] Failed to load ${path}:`, error.message);
        throw error;
    }
}

// Create fallback textures for when files are missing
function createFallbackTextures() {
    const fallbacks = {};

    // Create a simple colored texture as fallback
    const createColorTexture = (color, name) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        console.log(`[Texture] Created fallback ${name} texture`);
        return texture;
    };

    // Create a normal map fallback (neutral normal)
    const createNormalFallback = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#8080ff'; // Normal pointing up (0.5, 0.5, 1.0 in RGB)
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        console.log('[Texture] Created fallback normal texture');
        return texture;
    };

    // Create grayscale texture for roughness/AO
    const createGrayscaleFallback = (brightness, name) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gray = Math.floor(brightness * 255);
        ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        console.log(`[Texture] Created fallback ${name} texture`);
        return texture;
    };

    fallbacks.albedo = createColorTexture('#808080', 'albedo');
    fallbacks.normal = createNormalFallback();
    fallbacks.roughness = createGrayscaleFallback(0.8, 'roughness');
    fallbacks.ao = createGrayscaleFallback(1.0, 'ao');
    fallbacks.orm = createGrayscaleFallback(0.5, 'orm');
    fallbacks.displacement = createGrayscaleFallback(0.5, 'displacement');

    return fallbacks;
}

const fallbackTextures = createFallbackTextures();

// ===== JSON VALIDATION SYSTEM =====
function validateLevelJSON(levelData, filename = 'level file') {
    if (!levelData || typeof levelData !== 'object') {
        console.error(`[Validation] ${filename}: Invalid JSON structure`);
        return false;
    }

    // Basic structure validation (more lenient for game runtime)
    if (!levelData.objects && !levelData.terrain) {
        console.warn(`[Validation] ${filename}: No objects or terrain data found`);
    }

    if (levelData.version) {
        console.log(`[Validation] ${filename}: Version ${levelData.version}`);
    } else {
        console.warn(`[Validation] ${filename}: No version information`);
    }

    return true;
}

// Enhanced texture loader with caching and fallback
async function loadTextureWithCache(path, fallbackType = 'albedo') {
    // Check cache first
    if (textureCache.has(path)) {
        console.log(`[Texture] Using cached texture: ${path}`);
        return textureCache.get(path).clone();
    }

    // Try to load the texture
    const textureLoader = new THREE.TextureLoader();
    try {
        const texture = await new Promise((resolve, reject) => {
            textureLoader.load(
                path,
                resolve,
                undefined,
                reject
            );
        });

        // Cache the loaded texture
        textureCache.set(path, texture);
        console.log(`[Texture] Loaded and cached: ${path}`);
        return texture;
    } catch (error) {
        console.warn(`[Texture] Failed to load ${path}, using fallback ${fallbackType}:`, error.message);
        return fallbackTextures[fallbackType].clone();
    }
}

// Function to load PBR ground texture from assets/textures/ground
async function loadGroundTextureFromAssets(textureName) {
    try {
        const texturePath = `assets/textures/ground/${textureName}`;
        console.log('[Ground Texture] Loading from:', texturePath);

        const textureLoader = new THREE.TextureLoader();
        let detectedPattern = null; // Store the pattern from first successful load
        let detectedPatternDef = null; // Store the pattern definition (with shortSuffixes if applicable)

        // Helper to find and load a texture file by searching for suffix patterns
        const loadTexture = async (baseName, unrealFabSuffixes) => {
            const applyTextureSettings = (texture, filename, matchedPatternDef) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(20, 20);

                // Extract pattern from first successful load
                if (!detectedPattern && filename && filename.includes('_')) {
                    const parts = filename.split('_');
                    if (parts.length >= 2) {
                        detectedPattern = {
                            prefix: parts[0],
                            resolution: '_' + parts[1]
                        };
                        detectedPatternDef = matchedPatternDef; // Store the pattern definition
                        console.log(`[Ground Texture] Detected pattern: ${detectedPattern.prefix}${detectedPattern.resolution}_*`);
                    }
                }

                return texture;
            };

            // Try simple naming first
            const simpleNames = [`${baseName}.jpg`, `${baseName}.png`];

            for (const name of simpleNames) {
                try {
                    const texture = await loadTextureWithCache(`${texturePath}/${name}`, baseName);
                    console.log(`[Ground Texture] Loaded ${name}`);
                    return applyTextureSettings(texture, name, null);
                } catch (e) {
                    // Continue to next pattern
                }
            }

            // If we already detected a pattern, try that first
            if (detectedPattern && detectedPatternDef) {
                // Use short suffix if available, otherwise use the full suffix
                const suffixesToTry = detectedPatternDef.shortSuffixes && detectedPatternDef.shortSuffixes[baseName]
                    ? [detectedPatternDef.shortSuffixes[baseName]]
                    : unrealFabSuffixes;

                for (const suffix of suffixesToTry) {
                    const extensions = ['.jpg', '.png', '.PNG', '.JPG'];
                    for (const ext of extensions) {
                        const filename = `${detectedPattern.prefix}${detectedPattern.resolution}_${suffix}${ext}`;
                        try {
                            const texture = await loadTextureWithCache(`${texturePath}/${filename}`, baseName);
                            console.log(`[Ground Texture] Loaded ${filename}`);
                            return applyTextureSettings(texture, filename, detectedPatternDef);
                        } catch (e) {
                            // Continue to next extension
                        }
                    }
                }
            }

            // All texture files have been renamed to simple names
            // If we reach here, the simple names weren't found - use fallback
            console.warn(`[Ground Texture] Could not load ${baseName}, using fallback texture`);
            const fallback = fallbackTextures[baseName] || fallbackTextures.albedo;
            return applyTextureSettings(fallback.clone(), null, null);
        };

        // Load textures sequentially so pattern detection works
        const albedo = await loadTexture('albedo', ['Color']);
        const normal = await loadTexture('normal', ['NormalGL', 'NormalDX']);

        // Try to load ORM packed texture (Occlusion, Roughness, Metallic)
        const orm = await loadTexture('orm', ['ORM']);

        let roughness, ao;
        if (orm) {
            console.log('[Ground Texture] Using ORM packed texture for roughness and AO');
            roughness = orm; // Roughness is in the G channel
            ao = orm;        // AO is in the R channel
        } else {
            roughness = await loadTexture('roughness', ['Roughness']);
            ao = await loadTexture('ao', ['AmbientOcclusion']);
        }

        const displacement = await loadTexture('displacement', ['Displacement']);

        // Dispose old textures
        if (groundMaterial.map) groundMaterial.map.dispose();
        if (groundMaterial.normalMap) groundMaterial.normalMap.dispose();
        if (groundMaterial.roughnessMap) groundMaterial.roughnessMap.dispose();
        if (groundMaterial.aoMap) groundMaterial.aoMap.dispose();
        if (groundMaterial.displacementMap) groundMaterial.displacementMap.dispose();

        // Apply new textures to ground material
        groundMaterial.map = albedo;
        if (albedo) {
            albedo.colorSpace = THREE.SRGBColorSpace; // Critical for correct colors
        }

        groundMaterial.normalMap = normal;
        groundMaterial.roughnessMap = roughness;
        groundMaterial.aoMap = ao;
        if (ao) {
            groundMaterial.aoMapIntensity = 1.0; // Match level editor
        }

        groundMaterial.displacementMap = displacement;
        if (displacement) {
            groundMaterial.displacementScale = 0.1;
        }

        // Set material properties
        // Add blue tint for snow to make it look cooler/whiter
        if (textureName === 'snow') {
            groundMaterial.color.setHex(0xe8f4ff); // Cool blue-white tint for snow
        } else {
            groundMaterial.color.setHex(0xffffff); // White so texture colors show true
        }
        groundMaterial.roughness = roughness ? 1.0 : 0.9;
        groundMaterial.metalness = 0.0;

        groundMaterial.needsUpdate = true;

        console.log('[Ground Texture] Successfully loaded:', textureName);
    } catch (error) {
        console.error('[Ground Texture] Error loading texture:', error);
    }
}

// Level loading system
async function loadLobbyLevel() {
    try {
        updateLoadingProgress('Loading lobby level...');
        const response = await fetch('levels/lobby.json');
        const levelData = await response.json();

        // Validate level data
        if (!validateLevelJSON(levelData, 'lobby.json')) {
            throw new Error('Invalid lobby level data');
        }

        currentLevelData = levelData; // Store globally



        // Update map size if different
        // Update map size
        if (levelData.mapSize && levelData.mapSize !== 100) {
            currentMapSize = levelData.mapSize; // Update global map size
            scene.remove(ground);
            const newGeometry = new THREE.PlaneGeometry(levelData.mapSize, levelData.mapSize, 100, 100);
            ground = new THREE.Mesh(newGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);
        } else {
            currentMapSize = 100; // Default size
        }

        // Load heightmap data for terrain
        if (levelData.terrain && levelData.terrain.heightmap) {
            const positions = ground.geometry.attributes.position;
            const heightmap = levelData.terrain.heightmap;

            for (let i = 0; i < positions.count && i < heightmap.length; i++) {
                positions.setZ(i, heightmap[i]);
            }
            positions.needsUpdate = true;
            ground.geometry.computeVertexNormals();
        }

        // Load ground texture from assets/ground if specified
        let hasCustomGroundTexture = false;
        if (levelData.terrain && levelData.terrain.groundTexture && levelData.terrain.groundTexture !== 'default') {
            console.log('[Terrain] Loading ground texture:', levelData.terrain.groundTexture);
            await loadGroundTextureFromAssets(levelData.terrain.groundTexture);
            hasCustomGroundTexture = true;
        }

        // Load terrain painting (splatmaps) - only apply if no custom ground texture
        if (!hasCustomGroundTexture && levelData.terrain && (levelData.terrain.splatmap1 || levelData.terrain.splatmap2)) {
            console.log('[Terrain] Loading splatmaps...');

            let splatmap1Data = null;
            let splatmap2Data = null;

            // Load splatmap 1
            if (levelData.terrain.splatmap1) {
                console.log('[Terrain] Loading splatmap1');
                const splatmap1Image = new Image();
                await new Promise((resolve) => {
                    splatmap1Image.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = splatmap1Image.width;
                        canvas.height = splatmap1Image.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(splatmap1Image, 0, 0);
                        splatmap1Data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        console.log('[Terrain] Splatmap1 loaded:', canvas.width, 'x', canvas.height);
                        resolve();
                    };
                    splatmap1Image.onerror = () => {
                        console.error('[Terrain] Failed to load splatmap1');
                        resolve();
                    };
                    splatmap1Image.src = levelData.terrain.splatmap1;
                });
            }

            // Load splatmap 2
            if (levelData.terrain.splatmap2) {
                console.log('[Terrain] Loading splatmap2');
                const splatmap2Image = new Image();
                await new Promise((resolve) => {
                    splatmap2Image.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = splatmap2Image.width;
                        canvas.height = splatmap2Image.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(splatmap2Image, 0, 0);
                        splatmap2Data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        console.log('[Terrain] Splatmap2 loaded:', canvas.width, 'x', canvas.height);
                        resolve();
                    };
                    splatmap2Image.onerror = () => {
                        console.error('[Terrain] Failed to load splatmap2');
                        resolve();
                    };
                    splatmap2Image.src = levelData.terrain.splatmap2;
                });
            }

            // Apply terrain textures based on splatmaps
            updateTerrainTexture(splatmap1Data, splatmap2Data);

        } else {
            console.log('[Terrain] No splatmap data in level, using default grass texture');
        }

        // Load placed objects (props, buildings, etc.)
        if (levelData.objects && levelData.objects.length > 0) {
            const gltfLoader = new GLTFLoader();
            let loadedObjects = 0;

            for (const objData of levelData.objects) {
                if (objData.file) {
                    await new Promise((resolve) => {
                        // Build correct path based on object type
                        const path = objData.type === 'building'
                            ? `assets/buildings/${objData.file}`
                            : `assets/props/${objData.file}`;

                        gltfLoader.load(
                            path,
                            (gltf) => {
                                const object = gltf.scene;
                                object.position.set(objData.position.x, objData.position.y, objData.position.z);
                                object.rotation.y = objData.rotation.y;
                                object.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);

                                object.traverse(child => {
                                    if (child.isMesh) {
                                        child.castShadow = true;
                                        child.receiveShadow = true;

                                        // Ensure materials are properly configured
                                        if (child.material) {
                                            // Handle array of materials
                                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                                            materials.forEach(mat => {
                                                if (mat) {
                                                    // Ensure textures use correct color space
                                                    if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
                                                    if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;

                                                    // Set proper rendering properties
                                                    mat.needsUpdate = true;
                                                }
                                            });
                                        }
                                    }
                                });

                                scene.add(object);
                                collidableObjects.push(object); // Add to collision array

                                // Compute bounding box for fast collision detection
                                const box = new THREE.Box3().setFromObject(object);
                                collisionBoxes.push(box);

                                loadedObjects++;

                                if (loadedObjects % 10 === 0) {
                                    updateLoadingProgress(`Loading objects... ${loadedObjects}/${levelData.objects.length}`);
                                }

                                resolve();
                            },
                            undefined,
                            (error) => {
                                console.error('Error loading object:', path, error);
                                resolve();
                            }
                        );
                    });
                }
            }

            // Find and store briefing board reference for game setup interaction
            for (const objData of levelData.objects) {
                if (objData.file && objData.file.includes('Briefing_Board')) {
                    // Find the briefing board object in collidableObjects by matching position
                    for (const obj of collidableObjects) {
                        const posMatch = Math.abs(obj.position.x - objData.position.x) < 0.1 &&
                                        Math.abs(obj.position.y - objData.position.y) < 0.1 &&
                                        Math.abs(obj.position.z - objData.position.z) < 0.1;
                        if (posMatch) {
                            briefingBoard = obj;
                            console.log('Found briefing board at:', obj.position);
                            break;
                        }
                    }
                }
            }

        }

        // Load environment settings (skybox, lighting, fog, clouds)
        if (levelData.environment) {
            const env = levelData.environment;

            // Skybox definitions matching the level editor
            const skyboxes = {
                default: { fogColor: 0x87CEEB, ambientIntensity: 0.5, dirIntensity: 1.5, dirColor: 0xffefd5 },
                sunset: { fogColor: 0xff8c61, ambientIntensity: 0.4, dirIntensity: 1.2, dirColor: 0xff6b35 },
                dusk: { fogColor: 0x3a3a5e, ambientIntensity: 0.25, dirIntensity: 0.5, dirColor: 0x9b7fa8 },
                'night-moon': { fogColor: 0x0f1a2e, ambientIntensity: 0.15, dirIntensity: 0.4, dirColor: 0x6b8cff },
                'night-dark': { fogColor: 0x000000, ambientIntensity: 0.0, dirIntensity: 0.0, dirColor: 0x000000 },
                overcast: { fogColor: 0xb0b5ba, ambientIntensity: 0.7, dirIntensity: 0.5, dirColor: 0xffffff }
            };

            // Apply skybox settings if present
            if (env.skybox && skyboxes[env.skybox]) {
                const skybox = skyboxes[env.skybox];

                // Update fog color
                scene.fog.color.setHex(skybox.fogColor);
                scene.background = new THREE.Color(skybox.fogColor);

                // Update ambient light
                ambientLight.intensity = skybox.ambientIntensity;

                // Update directional light
                directionalLight.intensity = skybox.dirIntensity;
                directionalLight.color.setHex(skybox.dirColor);

                console.log(`Applied skybox: ${env.skybox}`);
            }

            // Apply sun/moon position if present
            if (env.sunAltitude !== undefined && env.sunAzimuth !== undefined) {
                const altRad = (env.sunAltitude * Math.PI) / 180;
                const aziRad = (env.sunAzimuth * Math.PI) / 180;
                const distance = 100;
                const x = distance * Math.cos(altRad) * Math.sin(aziRad);
                const y = distance * Math.sin(altRad);
                const z = distance * Math.cos(altRad) * Math.cos(aziRad);
                // Store sun direction as offset (will follow player in animation loop)
                sunDirectionOffset.set(x, y, z);
                console.log(`Set sun position: altitude ${env.sunAltitude}°, azimuth ${env.sunAzimuth}°`);
            }

            // Apply fog distance if present
            if (env.fogDistance !== undefined) {
                scene.fog.far = env.fogDistance;
                console.log(`Set fog distance: ${env.fogDistance}`);
            }
        }

        // Load placed lights
        if (levelData.lights && levelData.lights.length > 0) {
            levelData.lights.forEach(lightData => {
                let light;

                // Create light based on type
                if (lightData.lightType === 'point') {
                    light = new THREE.PointLight(
                        lightData.color,
                        lightData.intensity,
                        lightData.distance
                    );
                    if (lightData.decay !== undefined) {
                        light.decay = lightData.decay;
                    }
                } else if (lightData.lightType === 'spot') {
                    light = new THREE.SpotLight(
                        lightData.color,
                        lightData.intensity,
                        lightData.distance,
                        lightData.angle,
                        lightData.penumbra
                    );
                    if (lightData.decay !== undefined) {
                        light.decay = lightData.decay;
                    }
                    // Set target position
                    if (lightData.targetPosition) {
                        light.target.position.set(
                            lightData.targetPosition.x,
                            lightData.targetPosition.y,
                            lightData.targetPosition.z
                        );
                        scene.add(light.target);
                    }
                } else if (lightData.lightType === 'directional') {
                    light = new THREE.DirectionalLight(
                        lightData.color,
                        lightData.intensity
                    );
                    // Set target position
                    if (lightData.targetPosition) {
                        light.target.position.set(
                            lightData.targetPosition.x,
                            lightData.targetPosition.y,
                            lightData.targetPosition.z
                        );
                        scene.add(light.target);
                    }
                }

                if (light) {
                    // Set position
                    light.position.set(
                        lightData.position.x,
                        lightData.position.y,
                        lightData.position.z
                    );

                    // Set shadow properties
                    light.castShadow = lightData.castShadow;
                    if (light.castShadow && light.shadow) {
                        light.shadow.mapSize.width = 1024;
                        light.shadow.mapSize.height = 1024;
                    }

                    // Mark as level light so it can be cleared when switching maps
                    light.userData.isLevelLight = true;

                    scene.add(light);
                    console.log(`Added ${lightData.lightType} light at`, light.position);
                }
            });
        }

        // Spawn AI soldiers from spawn points
        spawnAISoldiers(levelData);

    } catch (error) {
        console.error('Error loading lobby level:', error);
        console.log('Continuing with default level...');
    }
}

// Animation list - unarmed animations
const unarmedAnimationFiles = [
    'animations/MM_Unarmed_Idle_Ready.glb',
    'animations/MM_Unarmed_Walk_Fwd.glb',
    'animations/MM_Unarmed_Jog_Fwd.glb',
    'animations/MM_Unarmed_Walk_Bwd.glb',
    'animations/MM_Unarmed_Walk_Left.glb',
    'animations/MM_Unarmed_Walk_Right.glb',
    'animations/MM_Unarmed_Crouch_Idle.glb',
    'animations/MM_Unarmed_Jump_Start.glb',
    'animations/MM_Unarmed_Jump_Apex.glb',
    'animations/MM_Unarmed_Jump_Fall_Loop.glb',
    'animations/MM_Unarmed_Jump_Fall_Land.glb',
    'animations/MM_Unarmed_TurnLeft_90.glb',
    'animations/MM_Unarmed_TurnRight_90.glb',
    'animations/MM_Unarmed_IdleBreak_Fidget.glb',
    'animations/MM_Unarmed_IdleBreak_Scan.glb',
    'animations/MM_Unarmed_Crouch_Entry.glb',
    'animations/MM_Unarmed_Crouch_Exit.glb',
    'animations/MM_Unarmed_Crouch_Walk_Fwd.glb',
    'animations/MM_Unarmed_Crouch_Walk_Bwd.glb',
];

// Animation list - rifle animations (simplified to working set)
const rifleAnimationFiles = [
    'animations/MM_Rifle_Idle_Hipfire.glb',      // 0 - Idle
    'animations/MM_Rifle_Walk_Fwd.glb',          // 1 - Walk forward
    'animations/MM_Rifle_Jog_Fwd.glb',           // 2 - Jog forward
    'animations/MM_Rifle_Walk_Bwd.glb',          // 3 - Walk backward
    'animations/MM_Rifle_Walk_Left.glb',         // 4 - Walk left
    'animations/MM_Rifle_Walk_Right.glb',        // 5 - Walk right
    'animations/MM_Rifle_Crouch_Idle.glb',       // 6 - Crouch idle
    'animations/MM_Rifle_Jump_Start.glb',        // 7
    'animations/MM_Rifle_Jump_Apex.glb',         // 8
    'animations/MM_Rifle_Jump_Fall_Loop.glb',    // 9
    'animations/MM_Rifle_Jump_Fall_Land.glb',    // 10
    'animations/MM_Rifle_TurnLeft_90.glb',       // 11
    'animations/MM_Rifle_TurnRight_90.glb',      // 12
    'animations/MM_Rifle_IdleBreak_Fidget.glb',  // 13
    'animations/MM_Rifle_IdleBreak_Scan.glb',    // 14
    'animations/MM_Rifle_Crouch_Entry.glb',      // 15
    'animations/MM_Rifle_Crouch_Exit.glb',       // 16
    'animations/MM_Rifle_Crouch_Walk_Fwd.glb',   // 17 - Crouch walk forward
    'animations/MM_Rifle_Crouch_Walk_Bwd.glb',   // 18 - Crouch walk backward
    'animations/MM_Rifle_Jog_Bwd.glb',           // 19 - Jog backward
    'animations/MM_Rifle_Jog_Left.glb',          // 20 - Jog left
    'animations/MM_Rifle_Jog_Right.glb',         // 21 - Jog right
    'animations/MM_Rifle_Crouch_Walk_Left.glb',  // 22 - Crouch walk left
    'animations/MM_Rifle_Crouch_Walk_Right.glb', // 23 - Crouch walk right
];

let animationFiles = unarmedAnimationFiles;
let isRifleEquipped = false;

// Character models available (all re-rigged)
const characterModels = [
    'characters/skeletalmeshes/SK_Chr_Civilian_Female_01.glb',
    'characters/skeletalmeshes/SK_Chr_Civilian_Female_02.glb',
    'characters/skeletalmeshes/SK_Chr_Civilian_Male_01.glb',
    'characters/skeletalmeshes/SK_Chr_Civilian_Male_02.glb',
    'characters/skeletalmeshes/SK_Chr_Contractor_Female_01.glb',
    'characters/skeletalmeshes/SK_Chr_Contractor_Male_01.glb',
    'characters/skeletalmeshes/SK_Chr_Contractor_Male_02.glb',
    'characters/skeletalmeshes/SK_Chr_Ghillie_Male_01.glb',
    'characters/skeletalmeshes/SK_Chr_Insurgent_Female_01.glb',
    'characters/skeletalmeshes/SK_Chr_Insurgent_Female_02.glb',
    'characters/skeletalmeshes/SK_Chr_Insurgent_Male_01.glb',
    'characters/skeletalmeshes/SK_Chr_Insurgent_Male_02.glb',
    'characters/skeletalmeshes/SK_Chr_Insurgent_Male_03.glb',
    'characters/skeletalmeshes/SK_Chr_Insurgent_Male_04.glb',
    'characters/skeletalmeshes/SK_Chr_Insurgent_Male_05.glb',
    'characters/skeletalmeshes/SK_Chr_Leader_Male_01.glb',
    'characters/skeletalmeshes/SK_Chr_Pilot_Female_01.glb',
    'characters/skeletalmeshes/SK_Chr_Pilot_Male_01.glb',
    'characters/skeletalmeshes/SK_Chr_Soldier_Female_01.glb',
    'characters/skeletalmeshes/SK_Chr_Soldier_Female_02.glb',
    'characters/skeletalmeshes/SK_Chr_Soldier_Male_01.glb',
    'characters/skeletalmeshes/SK_Chr_Soldier_Male_02.glb',
];

let currentCharacterIndex = 0;

// Animation system
let mixer;
let character;
let playerTeamId = null; // Player's team (1 or 2)
let currentLevelData = null; // Store loaded level data
let currentMapSize = 100; // Default map size (can be updated from level data)
let briefingBoard = null; // Reference to briefing board object
let isNearBriefingBoard = false; // Track proximity to board
let gameSetupConfig = { // Store game setup configuration
    aiCount: 20,
    team1Count: 10,
    team2Count: 10,
    aiDifficulty: 'normal',
    aiBehavior: 'balanced',
    selectedMap: 'test1'
};
let animations = [];
let currentAction = null;
let currentAnimationIndex = 0;
let rifle = null; // Rifle model attached to character
let isJogging = false; // Track if player is jogging
let isCrouching = false; // Track if player is crouching
let isADS = false; // Track if player is aiming down sights
let ammoCount = 30; // Simulated ammo count

// Player health system
let playerHealth = 100;
let maxPlayerHealth = 100;
let playerIsDead = false;
let respawnTimer = 0;
let respawnDelay = 5; // 5 seconds

// Game scoring system
let gameScore = {
    team1: {
        kills: 0,
        deaths: 0
    },
    team2: {
        kills: 0,
        deaths: 0
    }
};

let playerStats = {
    kills: 0,
    deaths: 0
};

const killsToWin = 50; // First team to 50 kills wins
let gameOver = false;

// Update score display UI
function updateScoreUI() {
    const team1ScoreEl = document.getElementById('team1-score');
    const team2ScoreEl = document.getElementById('team2-score');
    const playerKillsEl = document.getElementById('player-kills');
    const playerDeathsEl = document.getElementById('player-deaths');
    
    if (team1ScoreEl) team1ScoreEl.textContent = gameScore.team1.kills;
    if (team2ScoreEl) team2ScoreEl.textContent = gameScore.team2.kills;
    if (playerKillsEl) playerKillsEl.textContent = playerStats.kills;
    if (playerDeathsEl) playerDeathsEl.textContent = playerStats.deaths;
}

// Add kill to feed
function addKillToFeed(killerName, killerTeam, victimName) {
    const killFeed = document.getElementById('kill-feed');
    if (!killFeed) return;
    
    const killItem = document.createElement('div');
    killItem.className = 'kill-feed-item team' + killerTeam;
    
    killItem.innerHTML = '<span class="kill-feed-killer">' + killerName + '</span>' +
                         '<span class="kill-feed-icon">💀</span>' +
                         '<span class="kill-feed-victim">' + victimName + '</span>';
    
    killFeed.insertBefore(killItem, killFeed.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        killItem.style.opacity = '0';
        setTimeout(() => {
            if (killItem.parentNode) {
                killItem.parentNode.removeChild(killItem);
            }
        }, 500);
    }, 5000);
    
    // Keep only the last 5 kills
    while (killFeed.children.length > 5) {
        killFeed.removeChild(killFeed.lastChild);
    }
}

// Register kill
function registerKill(killerTeam, isPlayer = false) {
    // Update team score
    if (killerTeam === 1) {
        gameScore.team1.kills++;
    } else {
        gameScore.team2.kills++;
    }
    
    // Update player stats if player got the kill
    if (isPlayer) {
        playerStats.kills++;
    }
    
    updateScoreUI();
    
    // Check for victory
    if (gameScore.team1.kills >= killsToWin) {
        endGame(1);
    } else if (gameScore.team2.kills >= killsToWin) {
        endGame(2);
    }
}

// Register death
function registerDeath(deadTeam, isPlayer = false) {
    // Update team deaths
    if (deadTeam === 1) {
        gameScore.team1.deaths++;
    } else {
        gameScore.team2.deaths++;
    }
    
    // Update player stats if player died
    if (isPlayer) {
        playerStats.deaths++;
    }
    
    updateScoreUI();
}


// End game and show victory screen
function endGame(winningTeam) {
    if (gameOver) return;

    gameOver = true;
    console.log(`Game Over! Team ${winningTeam} wins!`);

    // Show end-game screen
    const endGameScreen = document.getElementById('end-game-screen');
    const victoryTitle = document.getElementById('victory-title');
    const finalScore = document.getElementById('final-score');
    const finalKills = document.getElementById('final-kills');
    const finalDeaths = document.getElementById('final-deaths');
    const finalKD = document.getElementById('final-kd');

    if (endGameScreen) {
        endGameScreen.classList.add('visible');
    }

    if (victoryTitle) {
        victoryTitle.textContent = `TEAM ${winningTeam} WINS!`;
        victoryTitle.className = 'victory-title team' + winningTeam;
    }

    if (finalScore) {
        finalScore.textContent = `${gameScore.team1.kills} - ${gameScore.team2.kills}`;
    }

    if (finalKills) {
        finalKills.textContent = playerStats.kills;
    }

    if (finalDeaths) {
        finalDeaths.textContent = playerStats.deaths;
    }

    if (finalKD) {
        const kd = playerStats.deaths > 0 ? (playerStats.kills / playerStats.deaths).toFixed(2) : playerStats.kills.toFixed(2);
        finalKD.textContent = kd;
    }

    // Disable player controls
    playerIsDead = true;

    // Unlock mouse cursor
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}



// Map boundary checking
function isWithinMapBounds(x, z) {
    const halfSize = currentMapSize / 2;
    return x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;
}

function clampToMapBounds(position) {
    const halfSize = currentMapSize / 2;
    const margin = 2; // Stay 2 units away from edge

    position.x = Math.max(-halfSize + margin, Math.min(halfSize - margin, position.x));
    position.z = Math.max(-halfSize + margin, Math.min(halfSize - margin, position.z));

    return position;
}

// Special rifle animations
let rifleADSIdleAnim = null;
let rifleFireAnim = null;
let rifleDryFireAnim = null;
let rifleEquipAnim = null;
let rifleReloadAnim = null;
let rifleMeleeAnim = null;
let rifleSpawnAnim = null;

// Additive rifle animations (upper body only)
let rifleReloadAdditive = null;
let rifleFireAdditive = null;
let rifleMeleeAdditive = null;
let rifleEquipAdditive = null;
let rifleDryFireAdditive = null;

// Aim Offset animations - Hipfire
let aimOffsetHipfire = {
    CC: null, // Center-Center
    CU: null, // Center-Up
    CD: null, // Center-Down
    LC: null, // Left-Center
    LU: null, // Left-Up
    LD: null, // Left-Down
    RC: null, // Right-Center
    RU: null, // Right-Up
    RD: null  // Right-Down
};

// Aim Offset animations - ADS
let aimOffsetADS = {
    CC: null,
    CU: null,
    CD: null,
    LC: null,
    LU: null,
    LD: null,
    RC: null,
    RU: null,
    RD: null
};

// Aim offset actions (for blending)
let aimOffsetActions = {};
let isUsingAimOffset = false;

// Smoothing for aim offset transitions
let lastAimKey = 'CC';
let aimSmoothFactor = 0.1; // How quickly to change aim (lower = smoother)

// Target positions for smooth transitions
const rifleTargetPosition = new THREE.Vector3();
const rifleTargetRotation = new THREE.Euler();
const rifleTransitionSpeed = 0.25; // Increased for faster response // Higher = faster transition
let manualRifleAdjustMode = false; // Toggle for manual rifle positioning

// Movement system
const moveSpeed = 2.5; // units per second
const rotationSpeed = 3; // radians per second
const cameraRotationSpeed = 1.5; // radians per second for camera
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    c: false,
    arrowLeft: false,
    arrowRight: false,
    arrowUp: false,
    arrowDown: false
};

let isRightMouseDown = false; // Track right mouse button for ADS

const loader = new GLTFLoader();

// Multiplayer - connect to server
const socket = io(window.CONFIG.BACKEND_URL);
const otherPlayers = {};

// Listen for existing players
socket.on('currentPlayers', (players) => {
    console.log('Received currentPlayers:', players);
    Object.keys(players).forEach((id) => {
        if (id !== socket.id) {
            console.log('Adding existing player:', id, players[id]);
            addOtherPlayer(id, players[id]);
        }
    });
});

// Listen for new players
socket.on('newPlayer', (playerInfo) => {
    console.log('New player joined:', playerInfo);
    addOtherPlayer(playerInfo.id, playerInfo);
});

// Listen for player movements
socket.on('playerMoved', (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].targetPosition = new THREE.Vector3(
            data.position.x,
            data.position.y,
            data.position.z
        );
        otherPlayers[data.id].targetRotation = data.rotation.y;
        otherPlayers[data.id].isJogging = data.isJogging || false;
        otherPlayers[data.id].isCrouching = data.isCrouching || false;
    }
});

// Listen for animation changes
socket.on('playerAnimationChange', (data) => {
    if (otherPlayers[data.id] && otherPlayers[data.id].mixer) {
        playOtherPlayerAnimation(data.id, data.animationIndex);
    }
});

// Listen for character changes
socket.on('playerCharacterChange', (data) => {
    if (otherPlayers[data.id]) {
        loadOtherPlayerCharacter(data.id, data.characterIndex);
    }
});

// Listen for weapon toggle
socket.on('playerWeaponToggle', (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].isRifleEquipped = data.isRifleEquipped;

        if (data.isRifleEquipped) {
            // Load rifle for other player
            loadOtherPlayerRifle(data.id);
            // Reload rifle animations for this player
            loadOtherPlayerAnimations(data.id, true, otherPlayers[data.id].animationIndex);
        } else {
            // Remove rifle from other player
            if (otherPlayers[data.id].rifle) {
                if (otherPlayers[data.id].rifle.parent) {
                    otherPlayers[data.id].rifle.parent.remove(otherPlayers[data.id].rifle);
                }
                otherPlayers[data.id].rifle = null;
            }
            // Reload unarmed animations for this player
            loadOtherPlayerAnimations(data.id, false, otherPlayers[data.id].animationIndex);
        }
        console.log(`Player ${data.id} toggled weapon: ${data.isRifleEquipped ? 'Rifle' : 'Unarmed'}`);
    }
});

// Listen for player disconnects
socket.on('playerDisconnected', (id) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id].model);
        delete otherPlayers[id];
    }
});

// Function to find and store aim bones
function findAimBones() {
    if (!character) return;

    spineBones = [];
    neckBone = null;
    headBone = null;

    character.traverse((bone) => {
        if (bone.isBone) {
            const name = bone.name.toLowerCase();

            // Find spine bones (usually Spine, Spine1, Spine2, etc.)
            if ((name.includes('spine') || name.includes('chest')) && !name.includes('twist')) {
                spineBones.push(bone);
                console.log('Found spine bone:', bone.name);
            }

            // Find neck bone
            if (name.includes('neck') && !neckBone) {
                neckBone = bone;
                console.log('Found neck bone:', bone.name);
            }

            // Find head bone
            if (name.includes('head') && !headBone && !name.includes('headtop')) {
                headBone = bone;
                console.log('Found head bone:', bone.name);
            }
        }
    });

    console.log(`Found ${spineBones.length} spine bones for aiming`);
}

// Function to update bone rotations for aiming
function updateAimBoneRotation() {
    // DISABLED: Direct bone rotation conflicts with animation system
    // Causes torso shrinking and 180 degree rotation issues
    return;

    if (!isRifleEquipped || !character) return;
    if (spineBones.length === 0 && !neckBone) return;

    // Calculate vertical aim angle
    // cameraPhi ranges from 0.1 (looking up) to Math.PI - 0.1 (looking down)
    // Map to rotation: negative = look up, positive = look down
    const verticalAim = (cameraPhi - Math.PI / 2); // Center around 0

    // Calculate horizontal aim angle relative to character facing
    let horizontalAim = 0;
    if (!isFirstPerson) {
        // In third-person, only rotate if looking away from character's forward
        const angleDiff = cameraTheta - (character.rotation.y - Math.PI);
        let normalizedAngle = angleDiff;
        while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
        while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;
        horizontalAim = normalizedAngle;
    }
    // In first-person, character already rotates to face camera, so no horizontal offset needed

    // Apply rotation to spine bones
    spineBones.forEach((bone, index) => {
        if (bone) {
            // Distribute rotation across spine bones (upper bones get more rotation)
            const factor = (index + 1) / spineBones.length;

            // Rotate around X axis for vertical aiming (pitch)
            bone.rotation.x = verticalAim * 0.3 * factor; // Limit to 30% of camera angle

            // Rotate around Y axis for horizontal aiming (yaw) - only in third person
            if (!isFirstPerson) {
                bone.rotation.y = horizontalAim * 0.2 * factor;
            }
        }
    });

    // Apply rotation to neck bone
    if (neckBone) {
        neckBone.rotation.x = verticalAim * 0.4; // Neck contributes more to vertical aim
        if (!isFirstPerson) {
            neckBone.rotation.y = horizontalAim * 0.3;
        }
    }
}

// Function to reset bone rotations
function resetAimBoneRotation() {
    spineBones.forEach((bone) => {
        if (bone) {
            bone.rotation.x = 0;
            bone.rotation.y = 0;
            bone.rotation.z = 0;
        }
    });

    if (neckBone) {
        neckBone.rotation.x = 0;
        neckBone.rotation.y = 0;
        neckBone.rotation.z = 0;
    }
}

// Function to fire weapon
function fireWeapon() {
    if (playerIsDead) return; // Can't shoot while dead
    if (!isRifleEquipped || !mixer) return;

    // Play fire animation
    if (rifleFireAnim) {
        const fireAction = mixer.clipAction(rifleFireAnim);
        fireAction.setLoop(THREE.LoopOnce);
        fireAction.clampWhenFinished = true;
        fireAction.reset().play();
        console.log('Firing weapon!');
    }

    // Create raycast from camera center
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Check for hits on NPC
    if (npc) {
        const intersects = raycaster.intersectObject(npc, true);

        if (intersects.length > 0) {
            // Hit the NPC!
            damageNPC(10); // 10 damage per shot

            // Visual feedback - flash red
            intersects[0].object.material.emissive.setHex(0xff0000);
            setTimeout(() => {
                if (intersects[0].object.material) {
                    intersects[0].object.material.emissive.setHex(0x000000);
                }
            }, 100);

            console.log('Hit NPC! Health:', npcHealth);
        }
    }

    // Check for hits on AI soldiers - only damage enemy soldiers
    for (const soldier of aiSoldiers) {
        if (!soldier.model || soldier.isDead) continue;

        // Skip friendly AI soldiers
        if (playerTeamId !== null && soldier.teamId === playerTeamId) {
            continue; // Don't shoot friendlies!
        }

        const intersects = raycaster.intersectObject(soldier.model, true);

        if (intersects.length > 0) {
            // Hit an enemy AI soldier!
            const died = soldier.takeDamage(10); // 10 damage per shot
            console.log(`Hit AI Soldier Team ${soldier.teamId}! Health: ${soldier.health}`);

            if (died && playerTeamId !== null) {
                // Player got a kill!
                registerKill(playerTeamId, true);
                registerDeath(soldier.teamId, false);
                addKillToFeed('You', playerTeamId, 'AI Soldier');
            }

            break; // Only hit one soldier per shot
        }
    }
}

// Function to damage NPC
function damageNPC(damage) {
    npcHealth -= damage;

    if (npcHealth <= 0) {
        npcHealth = 0;
        killNPC();
    }

    // Update health bar UI
    updateNPCHealthUI();
}

// Function to update NPC health UI
function updateNPCHealthUI() {
    const healthBar = document.getElementById('npc-health-bar');
    const healthText = document.getElementById('npc-health-text');
    const healthContainer = document.getElementById('npc-health-container');

    if (healthBar && healthText && healthContainer) {
        const healthPercent = (npcHealth / maxNpcHealth) * 100;
        healthBar.style.width = healthPercent + '%';
        healthText.textContent = Math.max(0, npcHealth);

        // Show health bar
        healthContainer.style.display = 'block';

        // Change color based on health
        if (healthPercent > 60) {
            healthBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        } else if (healthPercent > 30) {
            healthBar.style.background = 'linear-gradient(90deg, #FFC107, #FFD54F)';
        } else {
            healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6b6b)';
        }
    }
}

// Function to kill NPC
function killNPC() {
    if (!npc) return;

    console.log('NPC killed!');

    // Simple death: make NPC fall down by rotating
    if (npc) {
        // Animate falling over
        let fallRotation = 0;
        const fallInterval = setInterval(() => {
            fallRotation += 0.05;
            npc.rotation.z = fallRotation;

            if (fallRotation >= Math.PI / 2) {
                clearInterval(fallInterval);

                // Respawn after 3 seconds
                setTimeout(() => {
                    if (npc) {
                        npc.rotation.z = 0;
                        npcHealth = maxNpcHealth;
                        updateNPCHealthUI();
                        console.log('NPC respawned!');
                    }
                }, 3000);
            }
        }, 16);
    }
}

// Function to spawn NPC
function spawnNPC() {
    console.log('Spawning NPC target...');

    // Load a random character as NPC
    loader.load(
        characterModels[5], // Use character index 5
        (gltf) => {
            npc = gltf.scene;

            // Position NPC in front of player
            npc.position.set(0, 0, -5);
            npc.rotation.y = Math.PI; // Face the player

            npc.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;

                    // Store original material for damage flash
                    if (!node.material.emissive) {
                        node.material.emissive = new THREE.Color(0x000000);
                    }
                }
            });

            scene.add(npc);

            // Add idle animation to NPC
            npcMixer = new THREE.AnimationMixer(npc);

            // Load idle animation for NPC
            loader.load('animations/MM_Rifle_Idle_Hipfire.glb', (gltf) => {
                if (gltf.animations.length > 0 && npcMixer) {
                    const idleAction = npcMixer.clipAction(gltf.animations[0]);
                    idleAction.play();
                }
            });

            // Show health bar
            updateNPCHealthUI();

            console.log('NPC spawned at position:', npc.position);
        },
        undefined,
        (error) => {
            console.error('Error loading NPC:', error);
        }
    );
}

// Spawn NPC when game starts
// spawnNPC(); // Disabled for lobby

// ===== AI SOLDIER SYSTEM =====
class AISoldier {
    constructor(position, teamId) {
        this.position = position.clone();
        this.teamId = teamId; // 1 or 2
        this.health = 100;
        this.maxHealth = 100;
        this.model = null;
        this.mixer = null;
        this.rifle = null;
        this.isDead = false;
        this.teamIndicator = null;
        this.healthBar = null;

        // Team colors
        this.teamColor = teamId === 1 ? 0xff4444 : 0x4444ff; // Red or Blue

        // AI state
        this.state = 'idle'; // idle, patrol, combat, dead
        this.target = null;
        this.detectionRadius = 30;
        this.shootCooldown = 0;
        this.shootInterval = 1.0; // Seconds between shots

        // Movement
        this.moveSpeed = 2.0; // Walk speed
        this.runSpeed = 5.0; // Run/sprint speed
        this.isMoving = false;
        this.isRunning = false;
        this.stoppingDistance = 10; // Stop this far from target
        this.combatDistance = 15; // Start slowing down at this distance

        // Combat tactics
        this.strafeDirection = 1; // 1 for right, -1 for left
        this.strafeTimer = 0;
        this.strafeChangeTime = 2.0; // Change strafe direction every 2 seconds
        this.canStrafe = true;

        // Accuracy system
        this.baseAccuracy = 0.7; // 70% base accuracy
        this.aimTime = 0; // Time spent aiming at current target
        this.aimImprovementRate = 0.3; // Accuracy improves over time
        this.maxAccuracy = 0.95; // Maximum 95% accuracy

        // Behavior
        this.retreatHealthThreshold = 30; // Retreat when health below 30%
        this.isRetreating = false;
        this.retreatPoint = null;
        this.reactionTime = 0.3 + Math.random() * 0.5; // 0.3-0.8 second reaction delay
        this.reactionTimer = 0;
        this.hasReactedToTarget = false;

        // Patrol behavior
        this.patrolWaypoint = null;
        this.patrolRadius = 40; // How far to wander from spawn (increased from 20)
        this.spawnPosition = position.clone();
        this.waypointReachedDistance = 2; // How close to get to waypoint
        this.idleTimer = 0; // Time to wait before moving to next waypoint
        this.idleWaitTime = 1.5; // Seconds to wait at each waypoint (reduced from 3)

        // Automatic cover system
        this.currentCover = null; // Current cover position
        this.coverScanRadius = 15; // How far to scan for cover
        this.coverScanInterval = 2; // Scan for cover every 2 seconds
        this.coverScanTimer = 0;
        this.isInCover = false;
        this.coverMinDistance = 3; // Minimum distance from cover object
        this.timeSinceLastHit = 0; // Track when we got hit
        this.seekCoverAfterHit = 3; // Seek cover for 3 seconds after getting hit

        // High ground preference
        this.preferHighGround = true;
        this.highGroundBonus = 2; // Extra range when on high ground

        // Flanking behavior
        this.flankingAttempts = 0;
        this.maxFlankAttempts = 3;
        this.flankDirection = 1; // 1 for right, -1 for left
        this.lastLineOfSightCheck = true;

        // Advanced combat tactics
        this.isPeeking = false; // Peeking from cover
        this.peekTimer = 0;
        this.peekDuration = 2.0; // Peek for 2 seconds
        this.peekCooldown = 1.5; // Wait 1.5 seconds between peeks
        this.inPeekCooldown = false;
        this.suppressingFire = false; // Shooting to pin enemy
        this.suppressFireChance = 0.3; // 30% chance to use suppressing fire

        // Burst fire system
        this.burstSize = 3 + Math.floor(Math.random() * 3); // 3-5 shots per burst
        this.shotsInCurrentBurst = 0;
        this.burstFireRate = 0.15; // Time between shots in burst (faster than normal)
        this.burstCooldown = 1.5; // Time between bursts
        this.inBurstCooldown = false;

        // Target leading (for moving targets)
        this.leadTargetMovement = true;
        this.targetVelocity = new THREE.Vector3();
        this.lastTargetPosition = null;

        // Team coordination
        this.squadId = null; // Assigned squad
        this.isSquadLeader = false;
        this.squadMembers = []; // Other AI in same squad
        this.sharedTargets = new Map(); // Shared enemy information
        this.callForBackup = false;
        this.backupRequestCooldown = 0;
        this.lastKnownEnemyPos = null;

        // Better movement/pathfinding
        this.stuckTimer = 0;
        this.stuckThreshold = 2.0; // Consider stuck if no movement for 2 seconds
        this.lastPosition = position.clone();
        this.avoidanceRayDistance = 3; // Look ahead distance for obstacles
        this.pathfindingWaypoints = []; // Waypoints to navigate around obstacles

        // Sound detection system
        this.hearingRadius = 40; // Can hear sounds within 40 units
        this.gunshotDetectionRadius = 60; // Gunshots heard from further
        this.investigatePosition = null; // Position to investigate
        this.investigationTimer = 0;
        this.investigationDuration = 5; // Investigate for 5 seconds

        // Awareness and memory
        this.lastKnownEnemyPosition = null;
        this.timeSinceLastSawEnemy = 999;
        this.searchTimer = 0;
        this.searchDuration = 8; // Search for 8 seconds after losing sight
        this.checkCorners = true;
        this.nextCornerCheckTimer = 0;
        this.witnessedDeaths = []; // Track deaths this AI has seen

        // Personality system
        this.personality = this.generatePersonality();
        this.applyPersonality();

        // Ammo and reload system
        this.maxAmmo = 30;
        this.currentAmmo = 30;
        this.isReloading = false;
        this.reloadTime = 2.5; // 2.5 seconds to reload
        this.reloadTimer = 0;

        // Difficulty level (will be set during spawn organization)
        this.difficulty = 'medium'; // easy, medium, hard
        this.difficultyMultipliers = {
            accuracy: 1.0,
            reactionTime: 1.0,
            detectionRange: 1.0
        };

        // Combat reactions
        this.isSuppressed = false;
        this.suppressionLevel = 0; // 0-100
        this.suppressionDecayRate = 20; // Decay per second
        this.morale = 100; // 0-100
        this.isPanicking = false;
        this.panicThreshold = 30; // Panic below 30 morale

        // Formations and advanced tactics
        this.formationPosition = null; // Position in squad formation
        this.isInFormation = false;
        this.formationType = 'wedge'; // wedge, line, column
        this.isBounding = false; // Part of bounding overwatch
        this.isOverwatching = false; // Providing overwatch

        // Fire team roles
        this.fireTeamRole = null; // pointman, rifleman, support, medic
        this.roleModifiers = {};

        // Squad leader commands
        this.currentOrder = 'patrol'; // patrol, advance, hold, fallback, assault
        this.orderTarget = null; // Where to execute order
        this.followingLeaderOrder = false;

        // Focus fire system
        this.squadPriorityTarget = null; // Target entire squad is focusing
        this.focusFireWeight = 1.5; // Priority multiplier for focus targets

        // Bounding overwatch
        this.boundingGroup = 'A'; // A or B (squads split into two groups)
        this.boundingState = 'ready'; // ready, moving, overwatching
        this.overwatchPosition = null;
        this.boundingTarget = null;

        // Formation management
        this.desiredFormationOffset = new THREE.Vector3(0, 0, 0);
        this.formationSpacing = 3; // Distance between squad members
        this.maintainFormation = true;

        // Rally system
        this.rallyPoint = null;
        this.needsRally = false;
        this.squadCohesionRadius = 20; // Max distance from squad before rallying
        this.isRallying = false;

        // Fire discipline
        this.fireTeam = 'alpha'; // alpha or bravo (alternates firing)
        this.holdFire = false; // Ordered not to shoot
        this.controlledFireMode = false; // Alternating fire pattern
        this.lastTeamToFire = null;

        // Dynamic spacing
        this.idealSpacing = 3; // Changes based on situation
        this.minSpacing = 2;
        this.maxSpacing = 8;
        this.currentThreatLevel = 0; // 0-10, affects spacing

        // Room clearing
        this.isClearing = false;
        this.clearingStack = []; // Order in stack for breaching
        this.roomClearTarget = null;
        this.cornerToCheck = null;

        // Crossfire coordination
        this.flankSide = null; // 'left', 'right', or null
        this.engagementAngle = 0; // Desired angle to target for crossfire

        // Multi-squad coordination
        this.supportingSquads = []; // Other squads providing support
        this.supportZonePosition = null;

        // Animations
        this.idleAnim = null;
        this.walkAnim = null;
        this.runAnim = null; // Will use walk for now, can add run later
        this.currentAction = null;
    }

    generatePersonality() {
        const personalities = ['aggressive', 'defensive', 'balanced'];
        return personalities[Math.floor(Math.random() * personalities.length)];
    }

    applyPersonality() {
        switch (this.personality) {
            case 'aggressive':
                this.baseAccuracy = 0.65; // Slightly less accurate
                this.moveSpeed = 2.5; // Faster movement
                this.runSpeed = 6.0; // Faster sprint
                this.retreatHealthThreshold = 15; // Only retreat at very low health
                this.detectionRadius = 35; // Larger detection radius
                this.shootInterval = 0.8; // Shoots more frequently
                this.coverScanInterval = 3; // Less concerned about cover
                console.log(`AI personality: Aggressive (rushes, less cautious)`);
                break;

            case 'defensive':
                this.baseAccuracy = 0.75; // More accurate
                this.moveSpeed = 1.5; // Slower, more cautious
                this.runSpeed = 4.0; // Slower sprint
                this.retreatHealthThreshold = 50; // Retreats earlier
                this.detectionRadius = 35; // Good awareness
                this.shootInterval = 1.2; // More careful shots
                this.coverScanInterval = 1; // Always looking for cover
                console.log(`AI personality: Defensive (uses cover, cautious)`);
                break;

            case 'balanced':
                // Use default values (already set in constructor)
                console.log(`AI personality: Balanced (standard tactics)`);
                break;
        }
    }

    async spawn() {
        // Load random character model
        const randomIndex = Math.floor(Math.random() * characterModels.length);

        return new Promise((resolve, reject) => {
            loader.load(
                characterModels[randomIndex],
                async (gltf) => {
                    this.model = gltf.scene;
                    this.model.position.copy(this.position);

                    // Setup model
                    this.model.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;

                            if (!node.material.emissive) {
                                node.material.emissive = new THREE.Color(0x000000);
                            }
                        }
                    });

                    // Add to scene
                    scene.add(this.model);

                    // Create animation mixer
                    this.mixer = new THREE.AnimationMixer(this.model);

                    // Load animations (wait for both to load)
                    const idlePromise = new Promise((resolveIdle) => {
                        loader.load('animations/MM_Rifle_Idle_Hipfire.glb', (gltf) => {
                            if (gltf.animations.length > 0 && this.mixer) {
                                this.idleAnim = gltf.animations[0];
                                console.log('AI idle animation loaded');
                            }
                            resolveIdle();
                        }, undefined, (error) => {
                            console.error('Error loading AI idle animation:', error);
                            resolveIdle();
                        });
                    });

                    const walkPromise = new Promise((resolveWalk) => {
                        loader.load('animations/MM_Rifle_Walk_Fwd.glb', (gltf) => {
                            if (gltf.animations.length > 0 && this.mixer) {
                                this.walkAnim = gltf.animations[0];
                                console.log('AI walk animation loaded');
                            }
                            resolveWalk();
                        }, undefined, (error) => {
                            console.error('Error loading AI walk animation:', error);
                            resolveWalk();
                        });
                    });

                    // Wait for both animations to load before continuing
                    await Promise.all([idlePromise, walkPromise]);

                    // Now play idle animation
                    this.playAnimation('idle');

                    // Create team indicator (colored sphere above head)
                    this.createTeamIndicator();

                    // Load and attach rifle
                    this.attachRifle();

                    // Store reference to soldier on model
                    this.model.userData.aiSoldier = this;

                    resolve(this);
                },
                undefined,
                (error) => {
                    console.error('Error loading AI soldier:', error);
                    reject(error);
                }
            );
        });
    }

    createTeamIndicator() {
        // Create a small sphere above the soldier's head
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: this.teamColor,
            transparent: true,
            opacity: 0.8
        });
        this.teamIndicator = new THREE.Mesh(geometry, material);
        this.teamIndicator.position.set(0, 2.2, 0); // Above head
        this.model.add(this.teamIndicator);
    }

    attachRifle() {
        // Load rifle model and attach to soldier's right hand
        loader.load(
            'weapons/SK_Wep_Rifle_01.glb',
            (weaponGltf) => {
                if (weaponGltf.scene && this.model) {
                    this.rifle = weaponGltf.scene;

                    // Attach rifle to soldier's right hand
                    let attached = false;
                    this.model.traverse((bone) => {
                        if (!attached && bone.isBone && (
                            bone.name.includes('RightHand') ||
                            bone.name.includes('Hand_R') ||
                            bone.name.includes('hand_r') ||
                            bone.name.includes('R_Hand')
                        )) {
                            bone.add(this.rifle);

                            // Set rifle position/rotation
                            this.rifle.position.set(-0.1, 0.01, -0.03);
                            this.rifle.rotation.set(
                                -180 * (Math.PI / 180),  // X rotation in radians
                                -79 * (Math.PI / 180),   // Y rotation in radians
                                -11 * (Math.PI / 180)    // Z rotation in radians
                            );
                            this.rifle.scale.set(1.1, 1.1, 1.1);

                            attached = true;
                        }
                    });

                    if (!attached) {
                        console.warn('Could not find hand bone for AI soldier, attaching to root');
                        this.model.add(this.rifle);
                    }
                }
            },
            undefined,
            (error) => {
                console.error('Error loading rifle for AI soldier:', error);
            }
        );
    }

    takeDamage(damage) {
        if (this.isDead) return false;

        this.health -= damage;

        // Apply suppression when hit
        this.takeSuppression(30); // Taking damage adds significant suppression

        // Reduce morale when hit
        this.morale -= 5;
        this.checkMorale();

        // Damage flash effect
        if (this.model) {
            this.model.traverse((node) => {
                if (node.isMesh && node.material && node.material.emissive) {
                    node.material.emissive.setHex(0xff0000);
                    setTimeout(() => {
                        if (node.material.emissive) {
                            node.material.emissive.setHex(0x000000);
                        }
                    }, 100);
                }
            });
        }

        if (this.health <= 0) {
            this.die();
            return true; // Soldier died
        }

        return false; // Soldier is still alive
    }

    die() {
        this.isDead = true;
        this.state = 'dead';
        console.log(`AI Soldier Team ${this.teamId} killed`);

        // Store last known enemy position for teammates
        if (this.target) {
            this.lastKnownEnemyPosition = this.target.position.clone();
        }

        // Notify teammates of death
        for (const soldier of aiSoldiers) {
            if (soldier !== this && !soldier.isDead && soldier.teamId === this.teamId) {
                const distance = soldier.model.position.distanceTo(this.model.position);
                if (distance < 30) { // Only if close enough to witness
                    soldier.witnessTeammateDeath(this);
                }
            }
        }

        // Handle leader succession if this was the squad leader
        if (this.isSquadLeader) {
            this.handleLeaderDeath();
        }

        // Death animation - fall down
        if (this.model) {
            let fallRotation = 0;
            const fallInterval = setInterval(() => {
                fallRotation += 0.05;
                if (fallRotation >= Math.PI / 2) {
                    clearInterval(fallInterval);

                    // Respawn after 5 seconds
                    setTimeout(() => {
                        this.respawn();
                    }, 5000);
                } else {
                    this.model.rotation.x = fallRotation;
                }
            }, 16);
        }
    }

    respawn() {
        if (!this.model) return;

        this.health = this.maxHealth;
        this.isDead = false;
        this.state = 'idle';
        this.model.rotation.x = 0;
        this.playAnimation('idle');
        console.log(`AI Soldier Team ${this.teamId} respawned`);
    }

    playAnimation(animType) {
        if (!this.mixer) {
            console.warn('AI playAnimation: No mixer!');
            return;
        }

        let anim = null;
        if (animType === 'idle' && this.idleAnim) {
            anim = this.idleAnim;
        } else if (animType === 'walk' && this.walkAnim) {
            anim = this.walkAnim;
        }

        if (anim) {
            // Stop current action
            if (this.currentAction) {
                this.currentAction.fadeOut(0.2);
            }

            // Play new action
            this.currentAction = this.mixer.clipAction(anim);
            this.currentAction.reset().fadeIn(0.2).play();
        } else {
            console.warn(`AI Team ${this.teamId} cannot play ${animType} - anim not loaded (idle: ${!!this.idleAnim}, walk: ${!!this.walkAnim})`);
        }
    }

    update(delta) {
        if (this.isDead) return;
        if (!this.model) return;

        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= delta;
        }

        // Update cover scan timer
        this.coverScanTimer += delta;
        this.timeSinceLastHit += delta;

        // Update backup request cooldown
        if (this.backupRequestCooldown > 0) {
            this.backupRequestCooldown -= delta;
        }

        // Suppression decay
        if (this.suppressionLevel > 0) {
            this.suppressionLevel = Math.max(0, this.suppressionLevel - this.suppressionDecayRate * delta);
            this.isSuppressed = this.suppressionLevel > 40;
        }

        // Morale recovery (slowly)
        if (this.morale < 100 && !this.isPanicking) {
            this.morale = Math.min(100, this.morale + 2 * delta); // Recover 2 morale per second
        }

        // Squad management updates
        this.updateDynamicSpacing(delta);
        this.checkSquadCohesion();

        // Rally if separated from squad
        if (this.needsRally) {
            this.executeRally(delta);
            return; // Focus on rallying
        }

        // Update formation position
        if (this.state === 'idle' || (this.state === 'combat' && !this.target)) {
            this.updateFormationPosition();
        }

        // Bounding overwatch
        if (this.isBounding) {
            this.updateBoundingOverwatch(delta);
            return; // Bounding takes priority
        }

        // Sound investigation
        if (this.investigatePosition && this.state === 'idle') {
            this.investigationTimer += delta;

            const distanceToSound = this.model.position.distanceTo(this.investigatePosition);

            if (distanceToSound > 2) {
                // Move towards sound
                this.moveTowardsPoint(this.investigatePosition, delta, false);
                if (!this.isMoving) {
                    this.isMoving = true;
                    this.playAnimation('walk');
                }
            } else {
                // Reached sound location, look around
                if (this.isMoving) {
                    this.isMoving = false;
                    this.playAnimation('idle');
                }
            }

            // Stop investigating after duration
            if (this.investigationTimer >= this.investigationDuration) {
                this.investigatePosition = null;
                this.investigationTimer = 0;
                console.log(`AI Team ${this.teamId} finished investigating`);
            }

            // Still check for enemies while investigating
            this.detectEnemies();
            return; // Don't do normal behavior while investigating
        }

        // Basic AI behavior
        switch (this.state) {
            case 'idle':
                // Patrol behavior - wander around
                if (!this.patrolWaypoint) {
                    // Generate a new waypoint immediately (no waiting)
                    this.generateRandomWaypoint();

                    // Stand idle for a brief moment
                    if (this.isMoving) {
                        this.isMoving = false;
                        this.playAnimation('idle');
                    }
                } else {
                    // Move towards waypoint
                    const stillMoving = this.moveTowardsWaypoint(delta);

                    if (stillMoving) {
                        // Walking to waypoint
                        if (!this.isMoving) {
                            this.isMoving = true;
                            this.playAnimation('walk');
                        }
                    } else {
                        // Reached waypoint - clear it to generate new one
                        this.patrolWaypoint = null;
                        if (this.isMoving) {
                            this.isMoving = false;
                            this.playAnimation('idle');
                        }
                    }
                }

                // Always look for enemies while patrolling
                this.detectEnemies();
                break;

            case 'combat':
                // Clear patrol waypoint when in combat
                this.patrolWaypoint = null;

                // Check if we should retreat (low health)
                const healthPercent = (this.health / this.maxHealth) * 100;
                if (healthPercent < this.retreatHealthThreshold && !this.isRetreating) {
                    this.isRetreating = true;

                    // Call for backup when retreating
                    this.requestBackup();

                    // Generate retreat point away from target
                    if (this.target) {
                        const awayDirection = new THREE.Vector3();
                        awayDirection.subVectors(this.model.position, this.target.position).normalize();
                        const retreatPoint = new THREE.Vector3(
                            this.model.position.x + awayDirection.x * 15,
                            this.model.position.y,
                            this.model.position.z + awayDirection.z * 15
                        );

                        // Clamp to map bounds
                        clampToMapBounds(retreatPoint);
                        this.retreatPoint = retreatPoint;
                    }
                }

                // Retreat behavior
                if (this.isRetreating && this.retreatPoint) {
                    const distanceToRetreat = this.model.position.distanceTo(this.retreatPoint);

                    if (distanceToRetreat > 2) {
                        // Move to retreat point
                        this.moveTowardsPoint(this.retreatPoint, delta, true); // Sprint!
                        if (!this.isRunning) {
                            this.isRunning = true;
                            this.isMoving = true;
                            this.playAnimation('walk'); // Use walk animation (no run anim yet)
                        }
                    } else {
                        // Reached retreat point - reassess
                        this.isRetreating = false;
                        this.retreatPoint = null;
                        this.state = 'idle';
                        this.target = null;
                    }
                    break;
                }

                // Scan for cover periodically or when recently hit
                if (this.coverScanTimer >= this.coverScanInterval || this.timeSinceLastHit < this.seekCoverAfterHit) {
                    this.coverScanTimer = 0;

                    // Check if we need cover
                    const needsCover = !this.isPositionCovered(this.target);

                    if (needsCover && this.target) {
                        const coverPos = this.findNearestCover(this.target);
                        if (coverPos) {
                            this.currentCover = coverPos;
                            this.isInCover = false; // Not in cover yet, moving to it
                        }
                    }
                }

                // Normal combat behavior
                if (this.target && !this.target.userData.aiSoldier?.isDead) {
                    const distanceToTarget = this.model.position.distanceTo(this.target.position);

                    // Check if we can see the target
                    const hasLOS = this.hasLineOfSight(this.target);

                    // If we lost line of sight, try flanking
                    if (!hasLOS && this.lastLineOfSightCheck) {
                        this.flankingAttempts = 0;
                        this.flankDirection = Math.random() > 0.5 ? 1 : -1; // Random direction
                    }
                    this.lastLineOfSightCheck = hasLOS;

                    // If no line of sight and within range, try to flank
                    if (!hasLOS && distanceToTarget < this.detectionRadius && this.flankingAttempts < this.maxFlankAttempts) {
                        // Move perpendicular to target to get around obstacle
                        const directionToTarget = new THREE.Vector3();
                        directionToTarget.subVectors(this.target.position, this.model.position);
                        directionToTarget.normalize();

                        // Get perpendicular direction (flanking direction)
                        const perpendicular = new THREE.Vector3(-directionToTarget.z, 0, directionToTarget.x);
                        perpendicular.multiplyScalar(this.flankDirection);

                        // Calculate flank position
                        const flankPos = new THREE.Vector3(
                            this.model.position.x + perpendicular.x * 5,
                            this.model.position.y,
                            this.model.position.z + perpendicular.z * 5
                        );

                        // Move to flank position
                        clampToMapBounds(flankPos);
                        this.moveTowardsPoint(flankPos, delta, true); // Sprint while flanking

                        if (!this.isRunning) {
                            this.isRunning = true;
                            this.isMoving = true;
                            this.playAnimation('walk');
                        }

                        this.flankingAttempts++;

                        // Face where we're going
                        const lookDirection = new THREE.Vector3();
                        lookDirection.subVectors(flankPos, this.model.position);
                        if (lookDirection.length() > 0.1) {
                            const angle = Math.atan2(lookDirection.x, lookDirection.z);
                            this.model.rotation.y = angle;
                        }
                    } else if (hasLOS) {
                        // Reset flanking attempts when we regain line of sight
                        this.flankingAttempts = 0;
                    }

                    // If we have a cover position and not in cover yet, move to it
                    if (this.currentCover && !this.isInCover) {
                        const distanceToCover = this.model.position.distanceTo(this.currentCover);

                        if (distanceToCover > 1.5) {
                            // Move to cover position
                            this.moveTowardsPoint(this.currentCover, delta, true); // Sprint to cover!
                            if (!this.isRunning) {
                                this.isRunning = true;
                                this.isMoving = true;
                                this.playAnimation('walk');
                            }
                        } else {
                            // Reached cover
                            this.isInCover = true;
                        }
                    }
                    // Sprint to combat if far away and no cover needed
                    else if (distanceToTarget > this.combatDistance) {
                        this.moveTowardsTarget(delta, true); // Sprint!
                        if (!this.isRunning) {
                            this.isRunning = true;
                            this.isMoving = true;
                            this.playAnimation('walk');
                        }
                    }
                    // Move closer if still too far
                    else if (distanceToTarget > this.stoppingDistance) {
                        this.moveTowardsTarget(delta, false); // Walk
                        if (!this.isMoving || this.isRunning) {
                            this.isRunning = false;
                            this.isMoving = true;
                            this.playAnimation('walk');
                        }
                    }
                    // Good range - use cover or strafe and shoot
                    else {
                        // If in cover, peek out and shoot
                        if (this.isInCover) {
                            // Face target
                            this.faceTarget();

                            // Peek system - periodically expose and hide
                            if (!this.inPeekCooldown) {
                                this.peekTimer += delta;

                                if (!this.isPeeking && this.peekTimer < this.peekDuration) {
                                    // Start peeking
                                    this.isPeeking = true;
                                } else if (this.isPeeking && this.peekTimer >= this.peekDuration) {
                                    // Stop peeking, enter cooldown
                                    this.isPeeking = false;
                                    this.inPeekCooldown = true;
                                    this.peekTimer = 0;

                                    // Decide if next peek should use suppressing fire
                                    this.suppressingFire = Math.random() < this.suppressFireChance;
                                }
                            } else {
                                // In peek cooldown
                                this.peekTimer += delta;
                                if (this.peekTimer >= this.peekCooldown) {
                                    this.inPeekCooldown = false;
                                    this.peekTimer = 0;
                                }
                            }

                            // Only shoot when peeking
                            if (this.isPeeking) {
                                this.shootAtTarget(delta);
                            }

                            // Stand still in cover
                            if (this.isMoving) {
                                this.isMoving = false;
                                this.playAnimation('idle');
                            }
                            this.isRunning = false;

                            // Leave cover if it's no longer effective or enemy flanked us
                            if (!this.isPositionCovered(this.target)) {
                                this.currentCover = null;
                                this.isInCover = false;
                                this.isPeeking = false;
                                this.inPeekCooldown = false;
                            }
                        } else {
                            // No cover - strafe and shoot
                            // Update strafe timer
                            this.strafeTimer += delta;
                            if (this.strafeTimer >= this.strafeChangeTime) {
                                this.strafeDirection *= -1; // Flip direction
                                this.strafeTimer = 0;
                            }

                            // Strafe movement
                            this.strafeMovement(delta);

                            // Always face target while strafing
                            this.faceTarget();

                            // Shoot at target
                            this.shootAtTarget(delta);

                            // Keep moving animation for strafe
                            if (!this.isMoving) {
                                this.isMoving = true;
                                this.playAnimation('walk');
                            }
                            this.isRunning = false;
                        }
                    }
                } else {
                    // Target lost or dead - return to patrol
                    this.state = 'idle';
                    this.target = null;
                    this.aimTime = 0; // Reset aim time
                    this.isRetreating = false;
                    this.retreatPoint = null;
                    if (this.isMoving) {
                        this.isMoving = false;
                        this.isRunning = false;
                        this.playAnimation('idle');
                    }
                }
                break;
        }
    }

    hasLineOfSight(target) {
        if (!target || !this.model) return false;

        // Raycast from AI to target
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3();
        const aiPosition = this.model.position.clone();
        aiPosition.y += 1.5; // Eye level
        const targetPosition = target.position.clone();
        targetPosition.y += 1.5; // Target eye level

        direction.subVectors(targetPosition, aiPosition).normalize();
        raycaster.set(aiPosition, direction);

        const distance = aiPosition.distanceTo(targetPosition);

        // Check for obstacles between AI and target
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const intersect of intersects) {
            // Ignore the AI itself, the target, and team indicators
            if (intersect.object === this.model ||
                intersect.object.parent === this.model ||
                intersect.object === target ||
                intersect.object.parent === target ||
                intersect.object === this.teamIndicator ||
                intersect.object.userData.isTeamIndicator) {
                continue;
            }

            // If we hit something before reaching the target, no line of sight
            if (intersect.distance < distance - 1) {
                return false;
            }
        }

        return true; // Clear line of sight!
    }

    // Find nearby cover positions automatically
    findNearestCover(fromEnemy) {
        if (!this.model || !fromEnemy) return null;

        const raycaster = new THREE.Raycaster();
        const coverPositions = [];
        const scanRadius = this.coverScanRadius;
        const currentPos = this.model.position.clone();
        const enemyPos = fromEnemy.position.clone();

        // Scan in a circle around AI for potential cover
        const numRays = 16; // Check 16 directions
        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2;
            const dx = Math.cos(angle) * scanRadius;
            const dz = Math.sin(angle) * scanRadius;

            const testPos = new THREE.Vector3(
                currentPos.x + dx,
                currentPos.y + 1,
                currentPos.z + dz
            );

            // Check if this position is within map bounds
            if (!isWithinMapBounds(testPos.x, testPos.z)) continue;

            // Raycast from test position toward enemy
            const dirToEnemy = new THREE.Vector3();
            dirToEnemy.subVectors(enemyPos, testPos).normalize();
            raycaster.set(testPos, dirToEnemy);

            const intersects = raycaster.intersectObjects(scene.children, true);

            // Check if there's an obstacle between this position and enemy (cover!)
            for (const intersect of intersects) {
                // Ignore ground, AI models, and team indicators
                if (intersect.object.userData.type === 'ground' ||
                    intersect.object.userData.aiSoldier ||
                    intersect.object.userData.isTeamIndicator) {
                    continue;
                }

                // Found cover! This object blocks line of sight to enemy
                const coverDist = currentPos.distanceTo(testPos);
                const heightAtPos = this.getTerrainHeightAt(testPos.x, testPos.z);

                coverPositions.push({
                    position: new THREE.Vector3(testPos.x, heightAtPos, testPos.z),
                    distance: coverDist,
                    height: heightAtPos,
                    coverObject: intersect.object
                });
                break; // Found cover in this direction
            }
        }

        if (coverPositions.length === 0) return null;

        // Sort by distance (prefer closer cover) and height (prefer high ground)
        coverPositions.sort((a, b) => {
            const scoreA = a.distance - (this.preferHighGround ? a.height * 2 : 0);
            const scoreB = b.distance - (this.preferHighGround ? b.height * 2 : 0);
            return scoreA - scoreB;
        });

        return coverPositions[0].position;
    }

    // Check if current position provides cover from enemy
    isPositionCovered(fromEnemy) {
        if (!this.model || !fromEnemy) return false;

        const raycaster = new THREE.Raycaster();
        const aiPos = this.model.position.clone();
        aiPos.y += 1.5; // Eye level
        const enemyPos = fromEnemy.position.clone();
        enemyPos.y += 1.5;

        const direction = new THREE.Vector3();
        direction.subVectors(enemyPos, aiPos).normalize();
        raycaster.set(aiPos, direction);

        const distance = aiPos.distanceTo(enemyPos);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const intersect of intersects) {
            // Ignore self and team indicators
            if (intersect.object === this.model ||
                intersect.object.parent === this.model ||
                intersect.object.userData.isTeamIndicator) {
                continue;
            }

            // If something blocks the shot before reaching full distance, we're in cover
            if (intersect.distance < distance - 1) {
                return true;
            }
        }

        return false; // No cover, exposed!
    }

    // Get terrain height at position
    getTerrainHeightAt(x, z) {
        const raycaster = new THREE.Raycaster();
        const origin = new THREE.Vector3(x, 100, z); // Start high above
        const direction = new THREE.Vector3(0, -1, 0); // Point down
        raycaster.set(origin, direction);

        const intersects = raycaster.intersectObject(ground, false);
        if (intersects.length > 0) {
            return intersects[0].point.y;
        }
        return 0; // Default ground level
    }

    detectEnemies() {
        // Build list of potential targets with priority scores
        const potentialTargets = [];

        // Check for enemy AI soldiers
        for (const soldier of aiSoldiers) {
            if (soldier === this) continue;
            if (soldier.isDead) continue;
            if (soldier.teamId === this.teamId) continue; // Same team

            const distance = this.model.position.distanceTo(soldier.model.position);

            if (distance < this.detectionRadius && this.hasLineOfSight(soldier.model)) {
                // Calculate priority score
                let priority = 100;

                // Closer enemies get higher priority
                priority += (this.detectionRadius - distance) * 2;

                // Low health enemies get higher priority (easier kills)
                const healthPercent = (soldier.health / soldier.maxHealth) * 100;
                if (healthPercent < 50) {
                    priority += 20;
                }

                // Squad focus fire priority
                if (this.squadPriorityTarget === soldier.model) {
                    priority *= this.focusFireWeight; // 50% priority boost
                }

                potentialTargets.push({
                    target: soldier.model,
                    distance: distance,
                    priority: priority
                });
            }
        }

        // Check for player - only target if on opposite team
        if (character && playerTeamId !== null && playerTeamId !== this.teamId) {
            const distanceToPlayer = this.model.position.distanceTo(character.position);

            if (distanceToPlayer < this.detectionRadius && this.hasLineOfSight(character)) {
                // Calculate priority score for player
                let priority = 150; // Players get higher base priority (more dangerous)

                // Closer player gets even higher priority
                priority += (this.detectionRadius - distanceToPlayer) * 3;

                // Very high priority if player is close
                if (distanceToPlayer < 10) {
                    priority += 50;
                }

                potentialTargets.push({
                    target: character,
                    distance: distanceToPlayer,
                    priority: priority
                });
            }
        }

        // If we found enemies, pick the highest priority one
        if (potentialTargets.length > 0) {
            // Sort by priority (highest first)
            potentialTargets.sort((a, b) => b.priority - a.priority);

            // If we don't have a target yet, apply reaction time delay
            if (!this.target) {
                if (!this.hasReactedToTarget) {
                    this.reactionTimer += 0.016; // Approximate delta time
                    if (this.reactionTimer >= this.reactionTime) {
                        // Reaction time complete - acquire target
                        this.target = potentialTargets[0].target;
                        this.state = 'combat';
                        this.aimTime = 0; // Reset aim time for new target
                        this.hasReactedToTarget = true;

                        // Voice callout when spotting enemy
                        this.voiceCallout("Enemy spotted!");

                        // Share target with squad
                        this.shareTargetInfo(this.target, potentialTargets[0].priority);

                        // Squad leader sets priority target for focus fire
                        if (this.isSquadLeader) {
                            this.setSquadPriorityTarget(this.target);

                            // Decide on tactics based on situation
                            const aliveSquad = this.squadMembers.filter(m => !m.isDead).length;
                            if (aliveSquad >= 3) {
                                // Enough squad members for crossfire
                                this.setupCrossfire(this.target);
                            }
                        }
                    }
                }
            } else {
                // Already have target - switch if new target is significantly higher priority
                const currentTargetData = potentialTargets.find(t => t.target === this.target);
                const bestTarget = potentialTargets[0];

                // Switch if current target is not in list (lost) or new target is much better
                if (!currentTargetData || (bestTarget.priority > currentTargetData.priority + 50)) {
                    this.target = bestTarget.target;
                    this.aimTime = 0; // Reset aim time for new target
                }
            }
        } else {
            // No enemies detected - reset reaction timer
            this.reactionTimer = 0;
            this.hasReactedToTarget = false;
        }
    }

    generateRandomWaypoint() {
        // Generate a random point within patrol radius from spawn
        const angle = Math.random() * Math.PI * 2;

        // Bias toward outer patrol radius (between 50%-100% of radius)
        const minDistance = this.patrolRadius * 0.5;
        const distance = minDistance + Math.random() * (this.patrolRadius - minDistance);

        const waypoint = new THREE.Vector3(
            this.spawnPosition.x + Math.cos(angle) * distance,
            this.spawnPosition.y,
            this.spawnPosition.z + Math.sin(angle) * distance
        );

        // Clamp to map bounds
        clampToMapBounds(waypoint);
        this.patrolWaypoint = waypoint;
    }

    moveTowardsWaypoint(delta) {
        if (!this.patrolWaypoint || !this.model) return;

        const direction = new THREE.Vector3();
        direction.subVectors(this.patrolWaypoint, this.model.position);
        direction.y = 0; // Keep on horizontal plane

        const distanceToWaypoint = direction.length();

        // Check if reached waypoint
        if (distanceToWaypoint < this.waypointReachedDistance) {
            this.patrolWaypoint = null;
            return false; // Reached waypoint
        }

        direction.normalize();

        // Face the direction we're moving
        const targetRotation = Math.atan2(direction.x, direction.z);
        this.model.rotation.y = targetRotation;

        // Move forward
        const moveDistance = this.moveSpeed * delta;

        // Calculate new position and clamp to map bounds
        const newPos = new THREE.Vector3(
            this.model.position.x + direction.x * moveDistance,
            this.model.position.y,
            this.model.position.z + direction.z * moveDistance
        );
        clampToMapBounds(newPos);

        this.model.position.x = newPos.x;
        this.model.position.z = newPos.z;

        return true; // Still moving
    }

    moveTowardsTarget(delta, sprint = false) {
        if (!this.target || !this.model) return;

        const targetPos = this.target.position;
        const direction = new THREE.Vector3();
        direction.subVectors(targetPos, this.model.position);
        direction.y = 0; // Keep on horizontal plane
        direction.normalize();

        // Face the direction we're moving
        const targetRotation = Math.atan2(direction.x, direction.z);
        this.model.rotation.y = targetRotation;

        // Move forward (sprint if requested)
        const speed = sprint ? this.runSpeed : this.moveSpeed;
        const moveDistance = speed * delta;

        // Calculate new position and clamp to map bounds
        const newPos = new THREE.Vector3(
            this.model.position.x + direction.x * moveDistance,
            this.model.position.y,
            this.model.position.z + direction.z * moveDistance
        );
        clampToMapBounds(newPos);

        this.model.position.x = newPos.x;
        this.model.position.z = newPos.z;
    }

    moveTowardsPoint(point, delta, sprint = false) {
        if (!point || !this.model) return;

        let direction = new THREE.Vector3();
        direction.subVectors(point, this.model.position);
        direction.y = 0; // Keep on horizontal plane

        // Store original direction
        const originalDir = direction.clone().normalize();

        // Check for obstacles ahead
        const avoidanceDir = this.checkObstaclesAhead(originalDir);
        if (avoidanceDir) {
            // Blend avoidance with original direction
            direction = originalDir.lerp(avoidanceDir, 0.7).normalize();
        } else {
            direction.normalize();
        }

        // Face the direction we're moving
        const targetRotation = Math.atan2(direction.x, direction.z);
        this.model.rotation.y = targetRotation;

        // Move forward (sprint if requested)
        const speed = sprint ? this.runSpeed : this.moveSpeed;
        const moveDistance = speed * delta;

        // Calculate new position and clamp to map bounds
        const newPos = new THREE.Vector3(
            this.model.position.x + direction.x * moveDistance,
            this.model.position.y,
            this.model.position.z + direction.z * moveDistance
        );
        clampToMapBounds(newPos);

        // Check if we're actually moving (not stuck)
        const actualMovement = this.model.position.distanceTo(newPos);
        if (actualMovement < 0.01) {
            this.stuckTimer += delta;
        } else {
            this.stuckTimer = 0;
        }

        // If stuck, try a random direction
        if (this.stuckTimer > this.stuckThreshold) {
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDir = new THREE.Vector3(Math.cos(randomAngle), 0, Math.sin(randomAngle));
            const unstuckPos = this.model.position.clone().add(randomDir.multiplyScalar(2));
            clampToMapBounds(unstuckPos);
            this.model.position.x = unstuckPos.x;
            this.model.position.z = unstuckPos.z;
            this.stuckTimer = 0;
        } else {
            this.model.position.x = newPos.x;
            this.model.position.z = newPos.z;
        }
    }

    checkObstaclesAhead(direction) {
        if (!this.model) return null;

        const raycaster = new THREE.Raycaster();
        const origin = this.model.position.clone();
        origin.y += 1; // Check at chest height

        // Cast ray in movement direction
        raycaster.set(origin, direction);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const intersect of intersects) {
            // Ignore self and other AI soldiers
            if (intersect.object === this.model ||
                intersect.object.parent === this.model ||
                intersect.object.userData.aiSoldier ||
                intersect.object === character) {
                continue;
            }

            // If obstacle is close, return avoidance direction
            if (intersect.distance < this.avoidanceRayDistance) {
                // Calculate avoidance direction (perpendicular to obstacle)
                const toObstacle = intersect.point.clone().sub(origin);
                const avoidRight = new THREE.Vector3(-toObstacle.z, 0, toObstacle.x).normalize();
                const avoidLeft = new THREE.Vector3(toObstacle.z, 0, -toObstacle.x).normalize();

                // Choose direction that's closer to our goal
                const rightDot = avoidRight.dot(direction);
                const leftDot = avoidLeft.dot(direction);

                return rightDot > leftDot ? avoidRight : avoidLeft;
            }
        }

        return null; // No obstacles
    }

    // Team coordination methods
    shareTargetInfo(target, priority) {
        if (!target || !this.squadMembers) return;

        // Share target with squad members
        for (const member of this.squadMembers) {
            if (member && member !== this && !member.isDead) {
                member.receiveTargetInfo(target, priority, this);
            }
        }
    }

    receiveTargetInfo(target, priority, sender) {
        if (!target || !this.model) return;

        // Store shared target information
        if (!this.sharedTargets.has(target)) {
            this.sharedTargets.set(target, { priority: priority, sharedBy: sender, timestamp: Date.now() });
        } else {
            // Update if higher priority
            const existing = this.sharedTargets.get(target);
            if (priority > existing.priority) {
                existing.priority = priority;
                existing.sharedBy = sender;
                existing.timestamp = Date.now();
            }
        }

        // If we don't have a target, consider this one
        if (!this.target && this.state !== 'combat') {
            const distance = this.model.position.distanceTo(target.position);
            if (distance < this.detectionRadius * 1.5) { // Extend range for shared targets
                this.target = target;
                this.state = 'combat';
                this.lastKnownEnemyPos = target.position.clone();
            }
        }
    }

    requestBackup() {
        if (this.backupRequestCooldown > 0 || !this.squadMembers || !this.model) return;

        console.log(`AI Team ${this.teamId} calling for backup!`);

        // Alert nearby squad members
        for (const member of this.squadMembers) {
            if (member && member !== this && !member.isDead && member.model) {
                const distance = this.model.position.distanceTo(member.model.position);
                if (distance < 30) { // Within backup response range
                    member.respondToBackup(this);
                }
            }
        }

        this.backupRequestCooldown = 10; // 10 second cooldown
        this.callForBackup = true;
    }

    respondToBackup(caller) {
        if (!caller || !caller.target) return;

        if (this.state === 'idle' && caller.target) {
            console.log(`AI Team ${this.teamId} responding to backup call!`);
            // Adopt caller's target
            this.target = caller.target;
            this.state = 'combat';
            this.lastKnownEnemyPos = caller.target.position.clone();
        }
    }

    coordinateFlank() {
        // Check if squad members are engaging same target
        let alliesOnTarget = 0;
        if (!this.target || !this.squadMembers) return false;

        for (const member of this.squadMembers) {
            if (member && member !== this && !member.isDead && member.target === this.target) {
                alliesOnTarget++;
            }
        }

        // If 2+ allies attacking same target, coordinate flanking
        return alliesOnTarget >= 1;
    }

    strafeMovement(delta) {
        if (!this.target || !this.model) return;

        // Calculate perpendicular direction for strafing
        const toTarget = new THREE.Vector3();
        toTarget.subVectors(this.target.position, this.model.position);
        toTarget.y = 0;
        toTarget.normalize();

        // Get right vector (perpendicular to direction to target)
        const rightVector = new THREE.Vector3(-toTarget.z, 0, toTarget.x);

        // Strafe left or right
        const strafeSpeed = this.moveSpeed * 0.6; // Strafe slower than forward movement
        const strafeDistance = strafeSpeed * delta * this.strafeDirection;

        // Calculate new position and clamp to map bounds
        const newPos = new THREE.Vector3(
            this.model.position.x + rightVector.x * strafeDistance,
            this.model.position.y,
            this.model.position.z + rightVector.z * strafeDistance
        );
        clampToMapBounds(newPos);

        this.model.position.x = newPos.x;
        this.model.position.z = newPos.z;
    }

    faceTarget() {
        if (!this.target || !this.model) return;

        const targetPos = this.target.position;
        const direction = new THREE.Vector3();
        direction.subVectors(targetPos, this.model.position);
        direction.y = 0; // Keep on horizontal plane
        direction.normalize();

        const targetRotation = Math.atan2(direction.x, direction.z);
        this.model.rotation.y = targetRotation;
    }

    shootAtTarget(delta) {
        // Check if reloading
        if (this.isReloading) {
            this.reloadTimer += delta;
            if (this.reloadTimer >= this.reloadTime) {
                // Reload complete
                this.currentAmmo = this.maxAmmo;
                this.isReloading = false;
                this.reloadTimer = 0;
                this.voiceCallout("I'm back up!");
                console.log(`AI Team ${this.teamId} finished reloading`);
            }
            return; // Can't shoot while reloading
        }

        // Check if need to reload
        if (this.currentAmmo <= 0 && !this.isReloading) {
            this.startReload();
            return;
        }

        // Update target velocity for leading
        if (this.target && this.leadTargetMovement) {
            if (this.lastTargetPosition) {
                this.targetVelocity.subVectors(this.target.position, this.lastTargetPosition);
                this.targetVelocity.divideScalar(delta);
            }
            this.lastTargetPosition = this.target.position.clone();
        }

        // Fire discipline check
        if (!this.shouldFireBasedOnDiscipline()) {
            return; // Hold fire for discipline
        }

        // Burst fire system
        if (!this.inBurstCooldown && this.shotsInCurrentBurst < this.burstSize) {
            if (this.shootCooldown <= 0 && this.currentAmmo > 0) {
                this.fireSingleShot();
                this.shotsInCurrentBurst++;
                this.currentAmmo--; // Use ammo
                this.shootCooldown = this.burstFireRate; // Faster shots in burst

                // Auto-reload if burst would exceed ammo
                if (this.currentAmmo <= 3 && this.shotsInCurrentBurst >= this.burstSize - 1) {
                    this.inBurstCooldown = true;
                    this.shotsInCurrentBurst = 0;
                }
            }
        } else if (this.shotsInCurrentBurst >= this.burstSize) {
            // Burst complete, enter cooldown
            this.inBurstCooldown = true;
            this.shotsInCurrentBurst = 0;
            this.shootCooldown = this.burstCooldown;

            // Consider reloading during burst cooldown if ammo low
            if (this.currentAmmo < this.maxAmmo * 0.3 && !this.isReloading) {
                this.startReload();
            }
        } else if (this.inBurstCooldown && this.shootCooldown <= 0) {
            // Cooldown complete, ready for next burst
            this.inBurstCooldown = false;
        }

        // Update cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= delta;
        }

        // Track aim time for accuracy improvement
        this.aimTime += delta;
    }

    startReload() {
        this.isReloading = true;
        this.reloadTimer = 0;
        this.voiceCallout("Reloading!");
        console.log(`AI Team ${this.teamId} reloading (${this.currentAmmo}/${this.maxAmmo} rounds left)`);

        // Try to find cover while reloading
        if (!this.isInCover && this.target) {
            const coverPos = this.findNearestCover(this.target);
            if (coverPos) {
                this.currentCover = coverPos;
                this.isInCover = false; // Will move to it
            }
        }
    }

    fireSingleShot() {
        // Calculate accuracy based on distance and aim time
        const distance = this.model.position.distanceTo(this.target.position);

        // Base accuracy modified by distance (worse at long range)
        let currentAccuracy = this.baseAccuracy;

        // Distance penalty: accuracy decreases beyond 15 units
        if (distance > 15) {
            const distancePenalty = Math.min((distance - 15) * 0.02, 0.4); // Max 40% penalty
            currentAccuracy -= distancePenalty;
        }

        // Aim time bonus: accuracy improves the longer you aim
        const aimBonus = Math.min(this.aimTime * this.aimImprovementRate, this.maxAccuracy - this.baseAccuracy);
        currentAccuracy += aimBonus;

        // Movement penalty: less accurate while moving
        if (this.isMoving) {
            currentAccuracy *= 0.7; // 30% penalty while moving
        }

        // Peeking bonus (more accurate when stable in cover)
        if (this.isPeeking && !this.isMoving) {
            currentAccuracy *= 1.1; // 10% bonus when peeking
        }

        // Suppressing fire mode (less accurate but keeps enemy pinned)
        if (this.suppressingFire) {
            currentAccuracy *= 0.6; // Less accurate but shoots more
        }

        // Suppression penalty (being shot at reduces accuracy)
        if (this.isSuppressed) {
            const suppressionPenalty = this.suppressionLevel / 100 * 0.4; // Up to 40% penalty
            currentAccuracy *= (1 - suppressionPenalty);
        }

        // Panic penalty (already applied to baseAccuracy, but add extra here)
        if (this.isPanicking) {
            currentAccuracy *= 0.7; // Additional 30% penalty when panicking
        }

        // Clamp accuracy
        currentAccuracy = Math.max(0.1, Math.min(this.maxAccuracy, currentAccuracy));

        // Lead moving targets
        let aimPosition = this.target.position.clone();
        if (this.leadTargetMovement && this.targetVelocity.length() > 0.1) {
            // Predict where target will be
            const timeToHit = distance / 100; // Assume bullet speed of 100 units/sec
            const leadAmount = this.targetVelocity.clone().multiplyScalar(timeToHit);
            aimPosition.add(leadAmount);
        }

        // Roll for hit
        const hitRoll = Math.random();
        const didHit = hitRoll < currentAccuracy;

        console.log(`AI Team ${this.teamId} shooting: accuracy=${(currentAccuracy * 100).toFixed(1)}%, hit=${didHit}, burst=${this.shotsInCurrentBurst}/${this.burstSize}, ammo=${this.currentAmmo}`);

        // Near-miss suppression (even if miss, add suppression if close)
        if (this.target && !didHit && hitRoll < currentAccuracy + 0.2) {
            // Close miss - add suppression
            if (this.target.userData.aiSoldier) {
                this.target.userData.aiSoldier.takeSuppression(10);
            }
        }

        // Check if target is still valid
        if (this.target && didHit) {
            // Raycast to check line of sight (use original target position for raycast)
            const raycaster = new THREE.Raycaster();
            const direction = new THREE.Vector3();
            direction.subVectors(this.target.position, this.model.position).normalize();

            raycaster.set(this.model.position, direction);
            const intersects = raycaster.intersectObject(this.target, true);

            if (intersects.length > 0) {
                // Hit!
                if (this.target.userData.aiSoldier) {
                    // Shooting at another AI soldier
                    const targetSoldier = this.target.userData.aiSoldier;
                    const died = targetSoldier.takeDamage(15 + Math.random() * 15); // 15-30 damage

                    // Record hit for squad communication
                    targetSoldier.timeSinceLastHit = 0;

                    if (died) {
                        // AI killed another AI
                        registerKill(this.teamId, false);
                        registerDeath(targetSoldier.teamId, false);
                        const killerName = 'AI Soldier ' + this.teamId;
                        const victimName = 'AI Soldier ' + targetSoldier.teamId;
                        addKillToFeed(killerName, this.teamId, victimName);
                    }
                } else if (this.target === character) {
                    // Shooting at player
                    const died = damagePlayer(15 + Math.random() * 15); // 15-30 damage

                    if (died && playerTeamId !== null) {
                        // AI killed player
                        registerKill(this.teamId, false);
                        registerDeath(playerTeamId, true);
                        const killerName = 'AI Soldier ' + this.teamId;
                        addKillToFeed(killerName, this.teamId, 'You');
                    }
                }
            }
        }

        // Broadcast gunshot sound
        this.createGunshotSound();
    }

    // Voice callouts system
    voiceCallout(message) {
        const callouts = {
            "Enemy spotted!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "Enemy spotted!"`),
            "Reloading!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "Reloading!"`),
            "I'm back up!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "Back up!"`),
            "Taking fire!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "Taking fire!"`),
            "Man down!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "Man down!"`),
            "Moving up!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "Moving up!"`),
            "Covering!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "Covering!"`),
            "Need backup!": () => console.log(`[AI Team ${this.teamId}] ${this.personality.toUpperCase()}: "I need backup!"`),
        };

        if (callouts[message]) {
            callouts[message]();
        }
    }

    // Sound creation and detection
    createGunshotSound() {
        // Broadcast gunshot sound to all AI
        for (const soldier of aiSoldiers) {
            if (soldier !== this && !soldier.isDead) {
                soldier.hearSound(this.model.position, 'gunshot', this.teamId);
            }
        }
    }

    hearSound(position, soundType, sourceTeamId) {
        if (!this.model) return;

        const distance = this.model.position.distanceTo(position);
        const hearingRange = soundType === 'gunshot' ? this.gunshotDetectionRadius : this.hearingRadius;

        if (distance < hearingRange) {
            // Heard something!
            if (sourceTeamId !== this.teamId) {
                // Enemy sound
                if (this.state === 'idle') {
                    this.investigatePosition = position.clone();
                    this.investigationTimer = 0;
                    console.log(`AI Team ${this.teamId} heard enemy ${soundType} at distance ${distance.toFixed(1)}`);
                }
            }
        }
    }

    // Suppression and morale system
    takeSuppression(amount) {
        this.suppressionLevel = Math.min(100, this.suppressionLevel + amount);
        this.isSuppressed = this.suppressionLevel > 40;

        if (this.isSuppressed && !this.isPanicking) {
            this.voiceCallout("Taking fire!");
            this.morale -= 10;
            this.checkMorale();
        }
    }

    checkMorale() {
        if (this.morale < this.panicThreshold && !this.isPanicking) {
            this.isPanicking = true;
            this.voiceCallout("Need backup!");
            this.requestBackup();
            console.log(`AI Team ${this.teamId} is panicking! (Morale: ${this.morale})`);

            // Panic reduces accuracy significantly
            this.baseAccuracy *= 0.5;
        } else if (this.morale > this.panicThreshold + 20 && this.isPanicking) {
            // Recovered from panic
            this.isPanicking = false;
            this.applyPersonality(); // Restore normal accuracy
            console.log(`AI Team ${this.teamId} recovered from panic`);
        }
    }

    witnessTeammateDeath(deadSoldier) {
        if (this.witnessedDeaths.includes(deadSoldier)) return;

        this.witnessedDeaths.push(deadSoldier);
        this.morale -= 15; // Witnessing death lowers morale
        this.voiceCallout("Man down!");
        this.checkMorale();

        // Remember last known enemy position
        if (deadSoldier.lastKnownEnemyPosition) {
            this.lastKnownEnemyPosition = deadSoldier.lastKnownEnemyPosition.clone();
        }

        console.log(`AI Team ${this.teamId} witnessed teammate death (Morale: ${this.morale})`);
    }

    // Apply difficulty multipliers
    setDifficulty(difficulty) {
        this.difficulty = difficulty;

        switch (difficulty) {
            case 'easy':
                this.difficultyMultipliers.accuracy = 0.6; // 40% less accurate
                this.difficultyMultipliers.reactionTime = 1.5; // 50% slower reactions
                this.difficultyMultipliers.detectionRange = 0.8; // 20% shorter range
                this.baseAccuracy *= 0.6;
                this.reactionTime *= 1.5;
                this.detectionRadius *= 0.8;
                console.log(`AI Team ${this.teamId} set to EASY difficulty`);
                break;

            case 'hard':
                this.difficultyMultipliers.accuracy = 1.3; // 30% more accurate
                this.difficultyMultipliers.reactionTime = 0.7; // 30% faster reactions
                this.difficultyMultipliers.detectionRange = 1.2; // 20% longer range
                this.baseAccuracy *= 1.3;
                this.reactionTime *= 0.7;
                this.detectionRadius *= 1.2;
                console.log(`AI Team ${this.teamId} set to HARD difficulty`);
                break;

            default: // medium
                console.log(`AI Team ${this.teamId} set to MEDIUM difficulty`);
                break;
        }
    }

    // === FIRE TEAM ROLES ===
    assignFireTeamRole(role) {
        this.fireTeamRole = role;

        switch (role) {
            case 'pointman':
                this.roleModifiers = {
                    detectionBonus: 1.3, // Better awareness
                    speedBonus: 1.1, // Faster
                    coverPriority: 0.7 // Less concerned with cover
                };
                this.detectionRadius *= 1.3;
                this.moveSpeed *= 1.1;
                console.log(`AI Team ${this.teamId} assigned as POINTMAN`);
                break;

            case 'rifleman':
                this.roleModifiers = {
                    accuracyBonus: 1.1, // Slightly more accurate
                    aggressionBonus: 1.2 // More aggressive
                };
                this.baseAccuracy *= 1.1;
                console.log(`AI Team ${this.teamId} assigned as RIFLEMAN`);
                break;

            case 'support':
                this.roleModifiers = {
                    suppressionBonus: 1.5, // Better at suppressing
                    ammoBonus: 1.5 // More ammo
                };
                this.maxAmmo = 45; // 50% more ammo
                this.currentAmmo = 45;
                this.suppressFireChance = 0.6; // 60% chance to suppress
                console.log(`AI Team ${this.teamId} assigned as SUPPORT GUNNER`);
                break;

            case 'medic':
                this.roleModifiers = {
                    survivalBonus: 1.3, // More health
                    cautionBonus: 1.5 // Very cautious
                };
                this.maxHealth = 130;
                this.health = 130;
                this.retreatHealthThreshold = 60; // Retreats earlier
                this.coverScanInterval = 0.8; // Always looking for cover
                console.log(`AI Team ${this.teamId} assigned as MEDIC`);
                break;
        }
    }

    // === SQUAD LEADER COMMANDS ===
    issueSquadOrder(order, target = null) {
        if (!this.isSquadLeader || !this.squadMembers) return;

        console.log(`[SQUAD LEADER Team ${this.teamId}] Ordering: ${order.toUpperCase()}`);

        for (const member of this.squadMembers) {
            if (member && member !== this && !member.isDead) {
                member.receiveOrder(order, target, this);
            }
        }

        // Leader also follows own order
        this.currentOrder = order;
        this.orderTarget = target;
    }

    receiveOrder(order, target, leader) {
        this.currentOrder = order;
        this.orderTarget = target;
        this.followingLeaderOrder = true;

        console.log(`AI Team ${this.teamId} (${this.fireTeamRole}) received order: ${order}`);

        // Voice callout
        if (order === 'advance') this.voiceCallout("Moving up!");
        if (order === 'hold') this.voiceCallout("Covering!");
        if (order === 'fallback') this.voiceCallout("Falling back!");
    }

    // === FOCUS FIRE SYSTEM ===
    setSquadPriorityTarget(target) {
        if (!this.isSquadLeader || !this.squadMembers || !target) return;

        this.squadPriorityTarget = target;

        // Share with squad
        for (const member of this.squadMembers) {
            if (member && member !== this && !member.isDead) {
                member.squadPriorityTarget = target;
            }
        }

        console.log(`[SQUAD] Team ${this.teamId} squad focusing fire on target`);
    }

    // === BOUNDING OVERWATCH ===
    initiateBoundingOverwatch(targetPosition) {
        if (!this.isSquadLeader || !this.squadMembers || !targetPosition) return;

        // Split squad into two groups
        for (let i = 0; i < this.squadMembers.length; i++) {
            const member = this.squadMembers[i];
            if (!member || member.isDead) continue;

            member.boundingGroup = i % 2 === 0 ? 'A' : 'B';
            member.boundingTarget = targetPosition;
            member.isBounding = true;

            // Group A moves first
            if (member.boundingGroup === 'A') {
                member.boundingState = 'moving';
            } else {
                member.boundingState = 'overwatching';
                member.isOverwatching = true;
            }
        }

        console.log(`[SQUAD] Team ${this.teamId} squad initiating bounding overwatch`);
    }

    updateBoundingOverwatch(delta) {
        if (!this.isBounding || !this.boundingTarget) return;

        if (this.boundingState === 'moving') {
            // Move toward target
            const distance = this.model.position.distanceTo(this.boundingTarget);

            if (distance > 3) {
                this.moveTowardsPoint(this.boundingTarget, delta, true);
                if (!this.isMoving) {
                    this.isMoving = true;
                    this.playAnimation('walk');
                }
            } else {
                // Reached position, switch to overwatch
                this.boundingState = 'overwatching';
                this.isOverwatching = true;
                this.isMoving = false;

                // Signal other group to move
                this.signalBoundingGroupSwitch();
            }
        } else if (this.boundingState === 'overwatching') {
            // Provide covering fire
            if (this.target) {
                this.shootAtTarget(delta);
            }
        }
    }

    signalBoundingGroupSwitch() {
        if (!this.squadMembers) return;

        for (const member of this.squadMembers) {
            if (member && member !== this && !member.isDead && member.boundingGroup !== this.boundingGroup) {
                if (member.boundingState === 'overwatching') {
                    member.boundingState = 'moving';
                    member.isOverwatching = false;
                }
            }
        }
    }

    // === FORMATION MOVEMENT ===
    updateFormationPosition() {
        if (!this.maintainFormation || this.isDead) return;
        if (!this.squadMembers || this.squadMembers.length === 0) return;

        const leader = this.squadMembers.find(m => m && m.isSquadLeader && !m.isDead);
        if (!leader || leader === this || !leader.model) return;

        // Calculate formation offset based on position in squad
        const myIndex = this.squadMembers.indexOf(this);
        if (myIndex < 0) return;

        const offset = this.calculateFormationOffset(myIndex, this.formationType);

        // Get leader's facing direction
        const leaderDir = new THREE.Vector3(
            Math.sin(leader.model.rotation.y),
            0,
            Math.cos(leader.model.rotation.y)
        );

        // Calculate desired position
        const right = new THREE.Vector3(-leaderDir.z, 0, leaderDir.x);
        this.formationPosition = leader.model.position.clone()
            .add(leaderDir.clone().multiplyScalar(offset.forward * this.formationSpacing))
            .add(right.clone().multiplyScalar(offset.right * this.formationSpacing));
    }

    calculateFormationOffset(index, formationType) {
        switch (formationType) {
            case 'wedge':
                // V-shaped formation
                const side = index % 2 === 0 ? 1 : -1;
                const row = Math.floor(index / 2);
                return { forward: -row, right: side * row };

            case 'line':
                // Horizontal line
                return { forward: 0, right: index - 1 };

            case 'column':
                // Single file
                return { forward: -index, right: 0 };

            default:
                return { forward: 0, right: 0 };
        }
    }

    // === RALLY SYSTEM ===
    checkSquadCohesion() {
        if (this.isDead || !this.squadMembers || this.squadMembers.length === 0) return;
        if (!this.model) return;

        const leader = this.squadMembers.find(m => m && m.isSquadLeader && !m.isDead);
        if (!leader || leader === this || !leader.model) return;

        const distanceToLeader = this.model.position.distanceTo(leader.model.position);

        if (distanceToLeader > this.squadCohesionRadius && !this.isRallying) {
            this.needsRally = true;
            this.rallyPoint = leader.model.position.clone();
            console.log(`AI Team ${this.teamId} needs to rally (distance: ${distanceToLeader.toFixed(1)})`);
        } else if (distanceToLeader < 5 && this.isRallying) {
            // Reached rally point
            this.isRallying = false;
            this.needsRally = false;
        }
    }

    executeRally(delta) {
        if (!this.needsRally || !this.rallyPoint) return;

        this.isRallying = true;
        const distance = this.model.position.distanceTo(this.rallyPoint);

        if (distance > 2) {
            this.moveTowardsPoint(this.rallyPoint, delta, true); // Sprint to rally
            if (!this.isMoving) {
                this.isMoving = true;
                this.playAnimation('walk');
            }
        }
    }

    // === FIRE DISCIPLINE ===
    shouldFireBasedOnDiscipline() {
        if (this.holdFire) return false;
        if (!this.controlledFireMode) return true;

        // Get squad's last team to fire
        const leader = this.squadMembers ? this.squadMembers.find(m => m && m.isSquadLeader && !m.isDead) : null;
        if (!leader) return true; // No leader, fire freely

        // Alternating fire between alpha and bravo teams
        const canFire = leader.lastTeamToFire !== this.fireTeam;

        if (canFire && this.shotsInCurrentBurst === 0) {
            leader.lastTeamToFire = this.fireTeam;
        }

        return canFire;
    }

    // === DYNAMIC SPACING ===
    updateDynamicSpacing(delta) {
        // Adjust spacing based on threat level
        if (this.isSuppressed || this.timeSinceLastHit < 3) {
            // Under fire - spread out!
            this.currentThreatLevel = Math.min(10, this.currentThreatLevel + delta * 2);
        } else {
            // Safe - can group up
            this.currentThreatLevel = Math.max(0, this.currentThreatLevel - delta);
        }

        // Calculate ideal spacing (more threat = more spread)
        this.idealSpacing = this.minSpacing + (this.maxSpacing - this.minSpacing) * (this.currentThreatLevel / 10);
        this.formationSpacing = this.idealSpacing;
    }

    // === ROOM CLEARING ===
    detectAndClearRoom() {
        // Check if near a building/room
        // This would integrate with your building system
        // For now, basic corner checking
        if (this.checkCorners && !this.cornerToCheck) {
            // Look for corners to pie-slice
            this.cornerToCheck = this.findNearestCorner();
        }
    }

    findNearestCorner() {
        // Raycast to find corners (walls at 90 degrees)
        // Simplified version - would need actual building detection
        return null; // Placeholder
    }

    // === CROSSFIRE COORDINATION ===
    setupCrossfire(target) {
        if (!this.isSquadLeader || !target || !this.squadMembers) return;

        const squadSize = this.squadMembers.filter(m => m && !m.isDead).length;
        if (squadSize < 2) return;

        // Assign flanking sides
        for (let i = 0; i < this.squadMembers.length; i++) {
            const member = this.squadMembers[i];
            if (!member || member.isDead) continue;

            // Half flank left, half flank right
            member.flankSide = i < squadSize / 2 ? 'left' : 'right';
            member.calculateFlankPosition(target);
        }

        console.log(`[SQUAD] Team ${this.teamId} squad setting up crossfire`);
    }

    calculateFlankPosition(target) {
        if (!target || !this.flankSide) return;

        const toTarget = new THREE.Vector3();
        toTarget.subVectors(target.position, this.model.position);
        toTarget.y = 0;
        toTarget.normalize();

        // 90 degree flank
        const flankDir = new THREE.Vector3(
            this.flankSide === 'left' ? toTarget.z : -toTarget.z,
            0,
            this.flankSide === 'left' ? -toTarget.x : toTarget.x
        );

        this.engagementAngle = Math.atan2(flankDir.x, flankDir.z);
    }

    // === LEADER SUCCESSION ===
    handleLeaderDeath() {
        // Called when leader dies
        if (!this.squadMembers || this.squadMembers.length === 0) return;

        const aliveMembers = this.squadMembers.filter(m => m && !m.isDead && m !== this);
        if (aliveMembers.length === 0) return;

        // Promote highest-ranked alive member
        let newLeader = null;

        // Priority: support gunner > rifleman > pointman > medic
        const priorityOrder = ['support', 'rifleman', 'pointman', 'medic'];

        for (const role of priorityOrder) {
            newLeader = aliveMembers.find(m => m && m.fireTeamRole === role);
            if (newLeader) break;
        }

        if (!newLeader) newLeader = aliveMembers[0];
        if (!newLeader) return; // Safety check

        // Promote
        newLeader.isSquadLeader = true;
        newLeader.voiceCallout("Moving up!");
        console.log(`[SQUAD] AI Team ${newLeader.teamId} (${newLeader.fireTeamRole}) promoted to SQUAD LEADER`);

        // Update all squad members
        for (const member of this.squadMembers) {
            if (member && !member.isDead) {
                member.isSquadLeader = (member === newLeader);
            }
        }
    }
}

// Array to store all AI soldiers
const aiSoldiers = [];

// Function to spawn AI soldiers from level spawn points
async function spawnAISoldiers(levelData) {
    if (!levelData || !levelData.objects) return;

    console.log('Spawning AI soldiers from level data...');

    // Find all AI spawn points
    const aiSpawns = levelData.objects.filter(obj =>
        obj.type === 'spawn' &&
        (obj.subtype === 'ai-team1' || obj.subtype === 'ai-team2')
    );

    console.log(`Found ${aiSpawns.length} AI spawn points`);

    // Spawn AI at each point
    const spawnPromises = aiSpawns.map(async (spawnData) => {
        const teamId = spawnData.subtype === 'ai-team1' ? 1 : 2;
        const position = new THREE.Vector3(
            spawnData.position.x,
            spawnData.position.y,
            spawnData.position.z
        );

        const soldier = new AISoldier(position, teamId);
        await soldier.spawn();
        aiSoldiers.push(soldier);

        console.log(`Spawned AI soldier for Team ${teamId} at`, position);
        return soldier;
    });

    // Wait for all AI to spawn
    await Promise.all(spawnPromises);

    // Organize into squads after all spawned
    organizeSquads();
}

// Function to organize AI soldiers into squads
function organizeSquads() {
    const squadSize = 3; // 3 AI per squad
    const team1 = aiSoldiers.filter(s => s.teamId === 1);
    const team2 = aiSoldiers.filter(s => s.teamId === 2);

    const difficulties = ['easy', 'medium', 'medium', 'hard']; // 25% easy, 50% medium, 25% hard

    // Assign squads for team 1
    for (let i = 0; i < team1.length; i++) {
        const squadId = Math.floor(i / squadSize);
        team1[i].squadId = `team1_squad${squadId}`;

        // Assign squad members (all AI in same squad)
        team1[i].squadMembers = team1.filter((s, idx) =>
            Math.floor(idx / squadSize) === squadId
        );

        // First in squad is leader
        if (i % squadSize === 0) {
            team1[i].isSquadLeader = true;
            console.log(`AI Team 1 Squad Leader at squad ${squadId}`);
        }

        // Assign random difficulty FIRST (before role modifiers)
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        team1[i].setDifficulty(difficulty);

        // Then assign fire team roles (modifies stats on top of difficulty)
        const roles = ['pointman', 'rifleman', 'support', 'medic'];
        const roleIndex = i % squadSize;
        if (roleIndex < roles.length) {
            team1[i].assignFireTeamRole(roles[roleIndex]);
            team1[i].fireTeam = roleIndex % 2 === 0 ? 'alpha' : 'bravo'; // Alternate teams
        }
    }

    // Assign squads for team 2
    for (let i = 0; i < team2.length; i++) {
        const squadId = Math.floor(i / squadSize);
        team2[i].squadId = `team2_squad${squadId}`;

        // Assign squad members
        team2[i].squadMembers = team2.filter((s, idx) =>
            Math.floor(idx / squadSize) === squadId
        );

        // First in squad is leader
        if (i % squadSize === 0) {
            team2[i].isSquadLeader = true;
            console.log(`AI Team 2 Squad Leader at squad ${squadId}`);
        }

        // Assign random difficulty FIRST (before role modifiers)
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        team2[i].setDifficulty(difficulty);

        // Then assign fire team roles
        const roles = ['pointman', 'rifleman', 'support', 'medic'];
        const roleIndex = i % squadSize;
        if (roleIndex < roles.length) {
            team2[i].assignFireTeamRole(roles[roleIndex]);
            team2[i].fireTeam = roleIndex % 2 === 0 ? 'alpha' : 'bravo';
        }
    }

    console.log(`Organized ${team1.length} Team 1 AI into ${Math.ceil(team1.length / squadSize)} squads`);
    console.log(`Organized ${team2.length} Team 2 AI into ${Math.ceil(team2.length / squadSize)} squads`);

    // Enable squad tactics
    const allSquadLeaders = aiSoldiers.filter(s => s.isSquadLeader);

    for (const leader of allSquadLeaders) {
        // Enable formation movement
        leader.maintainFormation = true;
        leader.formationType = ['wedge', 'line', 'column'][Math.floor(Math.random() * 3)];

        // 50% chance to use controlled fire discipline
        if (Math.random() > 0.5) {
            for (const member of leader.squadMembers) {
                member.controlledFireMode = true;
            }
            console.log(`[SQUAD] Team ${leader.teamId} squad using CONTROLLED FIRE`);
        }

        console.log(`[SQUAD] Team ${leader.teamId} squad formation: ${leader.formationType.toUpperCase()}`);
    }
}

// Function to set first-person visibility (hide body, keep arms)
function setFirstPersonVisibility() {
    if (!character) return;

    character.traverse((node) => {
        if (node.isMesh) {
            const name = node.name.toLowerCase();

            // Hide head, body, and legs
            if (name.includes('head') ||
                name.includes('neck') ||
                name.includes('spine') ||
                name.includes('chest') ||
                name.includes('torso') ||
                name.includes('pelvis') ||
                name.includes('hip') ||
                name.includes('thigh') ||
                name.includes('leg') ||
                name.includes('calf') ||
                name.includes('foot')) {
                node.visible = false;
            }
            // Keep arms visible
            else {
                node.visible = true;
            }
        }
    });

    // Find aim bones for direct rotation
    findAimBones();
}

// Function to set third-person visibility (show everything)
function setThirdPersonVisibility() {
    if (!character) return;

    character.traverse((node) => {
        if (node.isMesh) {
            node.visible = true;
        }
    });
}

// Function to load a character model
function loadCharacter(characterIndex) {
    // Store current character position
    const currentPosition = character ? character.position.clone() : new THREE.Vector3(0, 0, 0);
    const currentRotation = character ? character.rotation.clone() : new THREE.Euler(0, 0, 0);

    // Store rifle state
    const wasRifleEquipped = isRifleEquipped && rifle !== null;

    // Remove rifle from old character
    if (rifle && rifle.parent) {
        rifle.parent.remove(rifle);
        rifle = null;
    }

    // Remove old character if exists
    if (character) {
        scene.remove(character);
        character = null;
        headBone = null; // Reset head bone reference
        if (mixer) {
            mixer.stopAllAction();
        }
    }

    console.log('Loading character:', characterModels[characterIndex]);

    loader.load(
        characterModels[characterIndex],
        (gltf) => {
            character = gltf.scene;

            // Make character invisible initially
            character.visible = false;

            character.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            // Restore position and rotation
            character.position.copy(currentPosition);
            character.rotation.copy(currentRotation);

            // Add to scene but invisible
            scene.add(character);

            // Setup animation mixer with the character
            mixer = new THREE.AnimationMixer(character);
            currentAction = null; // Reset current action

            // Play current animation if loaded
            if (animations.length > 0) {
                // Ensure we're playing a valid animation index
                if (currentAnimationIndex >= animations.length) {
                    currentAnimationIndex = 0;
                }
                currentAction = mixer.clipAction(animations[currentAnimationIndex]);
                currentAction.reset().play();

                // Use requestAnimationFrame to ensure animation is applied before showing character
                let framesProcessed = 0;
                const processFrames = () => {
                    if (framesProcessed < 5 && mixer) {
                        mixer.update(0.016);
                        framesProcessed++;
                        requestAnimationFrame(processFrames);
                    } else {
                        // Make character visible AFTER animation frames applied
                        if (character) {
                            character.visible = true;
                            console.log('Character made visible with animation ready');
                        }
                    }
                };
                requestAnimationFrame(processFrames);
            } else {
                console.warn(`Cannot play animation: No animations loaded yet!`);
                // Make visible anyway if no animations
                character.visible = true;
            }

            updateCharacterUI();

            // Find aim bones for direct rotation
            findAimBones();

            // Apply first-person visibility
            if (isFirstPerson) {
                setFirstPersonVisibility();
            }

            // Re-attach rifle if it was equipped
            if (wasRifleEquipped) {
                reattachRifle();
            }

            // Notify server of character change
            socket.emit('characterChange', { characterIndex: characterIndex });

            // If we're in lobby mode, spawn at player spawn
            if (window.shouldSpawnAtPlayerSpawn) {
                window.shouldSpawnAtPlayerSpawn = false;
                setTimeout(() => {
                    spawnPlayerAtPlayerSpawn();
                }, 100); // Small delay to ensure character is fully loaded
            }
        },
        (progress) => {
            console.log('Loading character: ' + (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading character:', error);
        }
    );
}

// Load animations for other player
function loadOtherPlayerAnimations(id, isRifle, initialAnimIndex) {
    const playerData = otherPlayers[id];
    if (!playerData) return;

    const animFiles = isRifle ? rifleAnimationFiles : unarmedAnimationFiles;
    playerData.animations = [];

    // Load all animations for this player
    let loaded = 0;
    let firstAnimationPlayed = false;

    function loadNext() {
        if (loaded >= animFiles.length) {
            console.log(`Loaded all ${isRifle ? 'rifle' : 'unarmed'} animations for player ${id}`);
            return;
        }

        loader.load(
            animFiles[loaded],
            (gltf) => {
                if (gltf.animations.length > 0) {
                    const currentIndex = loaded; // Capture current index
                    playerData.animations.push(gltf.animations[0]);

                    // Play animation immediately to avoid T-pose
                    if (!firstAnimationPlayed && playerData.mixer) {
                        // Play the correct animation index (prefer initialAnimIndex, fallback to first)
                        const indexToPlay = currentIndex === initialAnimIndex ? currentIndex : (currentIndex === 0 ? 0 : null);
                        if (indexToPlay !== null) {
                            playOtherPlayerAnimation(id, indexToPlay);
                            firstAnimationPlayed = true;
                        }
                    }
                }
                loaded++;
                loadNext();
            },
            undefined,
            (error) => {
                console.error('Error loading animation for other player:', animFiles[loaded], error);
                loaded++;
                loadNext();
            }
        );
    }

    loadNext();
}

// Add other player to the scene
function addOtherPlayer(id, playerInfo) {
    console.log(`Adding player ${id} - isRifleEquipped: ${playerInfo.isRifleEquipped}, animationIndex: ${playerInfo.animationIndex}`);

    loader.load(
        characterModels[playerInfo.characterIndex],
        (gltf) => {
            const playerModel = gltf.scene;
            playerModel.position.set(
                playerInfo.position.x,
                playerInfo.position.y,
                playerInfo.position.z
            );
            playerModel.rotation.y = playerInfo.rotation.y;

            playerModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            scene.add(playerModel);

            const playerMixer = new THREE.AnimationMixer(playerModel);

            otherPlayers[id] = {
                model: playerModel,
                mixer: playerMixer,
                currentAction: null,
                targetPosition: playerModel.position.clone(),
                targetRotation: playerModel.rotation.y,
                characterIndex: playerInfo.characterIndex,
                animationIndex: playerInfo.animationIndex,
                rifle: null,
                isRifleEquipped: playerInfo.isRifleEquipped || false,
                isJogging: playerInfo.isJogging || false,
                isCrouching: playerInfo.isCrouching || false,
                rifleTargetPosition: new THREE.Vector3(),
                rifleTargetRotation: new THREE.Euler(),
                animations: [] // Store animations for this player
            };

            console.log(`Player ${id} data stored - will load ${playerInfo.isRifleEquipped ? 'rifle' : 'unarmed'} animations`);

            // Load animations for this player based on their weapon state
            loadOtherPlayerAnimations(id, playerInfo.isRifleEquipped || false, playerInfo.animationIndex);

            // Load rifle if equipped
            if (playerInfo.isRifleEquipped) {
                console.log(`Loading rifle for player ${id}`);
                loadOtherPlayerRifle(id);
            }
        }
    );
}

// Load character for other player
function loadOtherPlayerCharacter(id, characterIndex) {
    const playerData = otherPlayers[id];
    if (!playerData) return;

    const currentPosition = playerData.model.position.clone();
    const currentRotation = playerData.model.rotation.y;

    scene.remove(playerData.model);

    loader.load(
        characterModels[characterIndex],
        (gltf) => {
            const playerModel = gltf.scene;
            playerModel.position.copy(currentPosition);
            playerModel.rotation.y = currentRotation;

            playerModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            scene.add(playerModel);

            const playerMixer = new THREE.AnimationMixer(playerModel);

            // Clear old animation state
            if (otherPlayers[id].currentAction) {
                otherPlayers[id].currentAction.stop();
            }

            otherPlayers[id].model = playerModel;
            otherPlayers[id].mixer = playerMixer;
            otherPlayers[id].currentAction = null; // Clear current action
            otherPlayers[id].characterIndex = characterIndex;
            otherPlayers[id].targetPosition = currentPosition.clone();
            otherPlayers[id].targetRotation = currentRotation;
            otherPlayers[id].animations = []; // Clear animations array

            // Reload animations for this player based on their weapon state
            loadOtherPlayerAnimations(id, playerData.isRifleEquipped, playerData.animationIndex);

            // Re-attach rifle if equipped
            if (playerData.isRifleEquipped) {
                loadOtherPlayerRifle(id);
            }
        }
    );
}

// Play animation for other player
function playOtherPlayerAnimation(id, animationIndex) {
    const playerData = otherPlayers[id];
    if (!playerData || !playerData.mixer) return;

    if (playerData.currentAction) {
        playerData.currentAction.fadeOut(0.3);
    }

    // Use the player's own animations array, not the global one
    if (playerData.animations.length > animationIndex) {
        playerData.currentAction = playerData.mixer.clipAction(playerData.animations[animationIndex]);
        playerData.currentAction.reset().fadeIn(0.3).play();
        playerData.animationIndex = animationIndex;
    }
}

// Load rifle for other player
function loadOtherPlayerRifle(id) {
    const playerData = otherPlayers[id];
    if (!playerData || !playerData.model) return;

    // Remove existing rifle if any
    if (playerData.rifle) {
        if (playerData.rifle.parent) {
            playerData.rifle.parent.remove(playerData.rifle);
        }
        playerData.rifle = null;
    }

    // Load rifle model
    loader.load(
        'weapons/SK_Wep_Rifle_01.glb',
        (weaponGltf) => {
            if (weaponGltf.scene && otherPlayers[id]) {
                const otherRifle = weaponGltf.scene;

                // Attach rifle to player's right hand
                let attached = false;
                playerData.model.traverse((bone) => {
                    if (!attached && bone.isBone && (
                        bone.name.includes('RightHand') ||
                        bone.name.includes('Hand_R') ||
                        bone.name.includes('hand_r') ||
                        bone.name.includes('R_Hand')
                    )) {
                        bone.add(otherRifle);

                        // Set initial rifle position/rotation (idle/walk position)
                        otherRifle.position.set(-0.1, 0.01, -0.03);
                        otherRifle.rotation.set(
                            -180 * (Math.PI / 180),
                            -79 * (Math.PI / 180),
                            -11 * (Math.PI / 180)
                        );
                        otherRifle.scale.set(1.1, 1.1, 1.1);

                        // Initialize target positions
                        otherPlayers[id].rifleTargetPosition.copy(otherRifle.position);
                        otherPlayers[id].rifleTargetRotation.copy(otherRifle.rotation);

                        attached = true;
                        console.log('Other player rifle attached to:', bone.name);
                    }
                });

                if (!attached) {
                    console.warn('Could not find hand bone for other player, trying root attachment');
                    playerData.model.add(otherRifle);
                }

                otherPlayers[id].rifle = otherRifle;
            }
        },
        undefined,
        (error) => {
            console.error('Error loading rifle for other player:', error);
        }
    );
}

// Update other player's rifle position
function updateOtherPlayerRiflePosition(id) {
    const playerData = otherPlayers[id];
    if (!playerData || !playerData.rifle) return;

    // Use same position for both idle and moving (jog)
    playerData.rifleTargetPosition.set(-0.1, 0.01, -0.03);
    playerData.rifleTargetRotation.set(
        -180 * (Math.PI / 180),
        -79 * (Math.PI / 180),
        -11 * (Math.PI / 180)
    );

    // Smoothly interpolate to target position
    playerData.rifle.position.lerp(playerData.rifleTargetPosition, rifleTransitionSpeed);

    // Smoothly interpolate to target rotation
    playerData.rifle.rotation.x += (playerData.rifleTargetRotation.x - playerData.rifle.rotation.x) * rifleTransitionSpeed;
    playerData.rifle.rotation.y += (playerData.rifleTargetRotation.y - playerData.rifle.rotation.y) * rifleTransitionSpeed;
    playerData.rifle.rotation.z += (playerData.rifleTargetRotation.z - playerData.rifle.rotation.z) * rifleTransitionSpeed;
}

// Function to reattach rifle to new character
function reattachRifle() {
    if (!character) return;

    console.log('Re-attaching rifle to new character...');

    // Load rifle model
    loader.load(
        'weapons/SK_Wep_Rifle_01.glb',
        (weaponGltf) => {
            if (weaponGltf.scene && character) {
                rifle = weaponGltf.scene;

                // Attach rifle to character's right hand
                let attached = false;
                character.traverse((bone) => {
                    if (!attached && bone.isBone && (
                        bone.name.includes('RightHand') ||
                        bone.name.includes('Hand_R') ||
                        bone.name.includes('hand_r') ||
                        bone.name.includes('R_Hand')
                    )) {
                        bone.add(rifle);

                        // Initialize rifle position/rotation (idle/walk position)
                        rifle.position.set(-0.1, 0.01, -0.03);
                        rifle.rotation.set(
                            -180 * (Math.PI / 180),  // X rotation in radians
                            -79 * (Math.PI / 180),   // Y rotation in radians
                            -11 * (Math.PI / 180)    // Z rotation in radians
                        );
                        rifle.scale.set(1.1, 1.1, 1.1);

                        // Set initial target position
                        rifleTargetPosition.copy(rifle.position);
                        rifleTargetRotation.copy(rifle.rotation);

                        attached = true;
                        console.log('Rifle re-attached to:', bone.name);
                    }
                });

                if (!attached) {
                    console.warn('Could not find hand bone, trying root attachment');
                    character.add(rifle);
                }

                // Show weapon controls
                setupWeaponControls();
            }
        },
        undefined,
        (error) => {
            console.error('Error re-attaching rifle model:', error);
        }
    );
}

// Function to toggle weapon
function toggleWeapon() {
    isRifleEquipped = !isRifleEquipped;

    // Update UI
    const weaponElement = document.getElementById('current-weapon');
    if (weaponElement) {
        weaponElement.textContent = isRifleEquipped ? 'Rifle' : 'Unarmed';
        weaponElement.style.color = isRifleEquipped ? '#4CAF50' : '#ff9800';
    }

    // Show/hide rifle controls info
    const rifleControlsInfo = document.getElementById('rifle-controls-info');
    if (rifleControlsInfo) {
        rifleControlsInfo.style.display = isRifleEquipped ? 'block' : 'none';
    }

    if (isRifleEquipped) {
        // Use preloaded rifle animations (instant, no lag!)
        animations = [...preloadedRifleAnims];
        animationFiles = rifleAnimationFiles;
        currentAnimationIndex = 0;
        isJogging = false;

        console.log('✓ Switched to rifle animations (preloaded)');

        // Play rifle idle animation immediately
        if (mixer && animations.length > 0) {
            if (currentAction) {
                currentAction.fadeOut(0.3);
            }

            // Play equip animation if available
            if (rifleEquipAnim) {
                const equipAction = mixer.clipAction(rifleEquipAnim);
                equipAction.setLoop(THREE.LoopOnce);
                equipAction.clampWhenFinished = true;
                equipAction.reset().play();

                // After equip finishes, play idle
                const onFinished = (e) => {
                    if (e.action === equipAction && animations.length > 0) {
                        currentAction = mixer.clipAction(animations[0]);
                        currentAction.play();
                        mixer.removeEventListener('finished', onFinished);
                    }
                };
                mixer.addEventListener('finished', onFinished);
            } else {
                // No equip animation, just play idle
                currentAction = mixer.clipAction(animations[0]);
                currentAction.reset().fadeIn(0.3).play();
            }
        }

        // Load rifle model and attach to character
        loader.load(
            'weapons/SK_Wep_Rifle_01.glb',
            (weaponGltf) => {
                if (weaponGltf.scene && character) {
                    rifle = weaponGltf.scene;

                    // Attach rifle to character's right hand
                    let attached = false;
                    character.traverse((bone) => {
                        if (!attached && bone.isBone && (
                            bone.name.includes('RightHand') ||
                            bone.name.includes('Hand_R') ||
                            bone.name.includes('hand_r') ||
                            bone.name.includes('R_Hand')
                        )) {
                            bone.add(rifle);

                            // Initialize rifle position/rotation (idle/walk position)
                            rifle.position.set(-0.1, 0.01, -0.03);
                            rifle.rotation.set(
                                -180 * (Math.PI / 180),  // X rotation in radians
                                -79 * (Math.PI / 180),   // Y rotation in radians
                                -11 * (Math.PI / 180)    // Z rotation in radians
                            );
                            rifle.scale.set(1.1, 1.1, 1.1);

                            // Set initial target position
                            rifleTargetPosition.copy(rifle.position);
                            rifleTargetRotation.copy(rifle.rotation);

                            attached = true;
                            console.log('Rifle attached to:', bone.name);
                        }
                    });

                    if (!attached) {
                        console.warn('Could not find hand bone, trying root attachment');
                        character.add(rifle);
                    }

                    // Show weapon controls
                    setupWeaponControls();
                }
            },
            undefined,
            (error) => {
                console.error('Error loading rifle model:', error);
            }
        );
    } else {
        // Remove rifle
        if (rifle && rifle.parent) {
            rifle.parent.remove(rifle);
            rifle = null;
        }

        // Stop all aim offset actions
        Object.keys(aimOffsetActions).forEach(key => {
            if (aimOffsetActions[key]) {
                aimOffsetActions[key].stop();
            }
        });
        aimOffsetActions = {};

        // Reset bone rotations
        resetAimBoneRotation();

        // Reset animation state
        isJogging = false;
        currentAnimationIndex = 0;

        // Disable manual adjustment mode and ADS
        manualRifleAdjustMode = false;
        isADS = false;
        cameraDistanceTarget = normalCameraDistance; // Reset camera zoom

        // Hide weapon controls
        const weaponControls = document.getElementById('weapon-controls');
        if (weaponControls) {
            weaponControls.classList.remove('active');
            weaponControls.style.border = 'none';
        }

        // Use preloaded unarmed animations (instant, no lag!)
        animations = [...preloadedUnarmedAnims];
        animationFiles = unarmedAnimationFiles;
        currentAnimationIndex = 0;

        console.log('✓ Switched to unarmed animations (preloaded)');

        // Play idle animation immediately
        if (animations.length > 0 && mixer) {
            if (currentAction) {
                currentAction.fadeOut(0.3);
            }
            currentAction = mixer.clipAction(animations[0]);
            currentAction.reset().fadeIn(0.3).play();
        }
    }

    // Notify server
    socket.emit('weaponToggle', { isRifleEquipped: isRifleEquipped });
}

// Setup weapon position controls
function setupWeaponControls() {
    const weaponControls = document.getElementById('weapon-controls');
    if (!weaponControls || !rifle) return;

    // Show controls
    weaponControls.classList.add('active');

    // Get slider elements
    const posXSlider = document.getElementById('pos-x');
    const posYSlider = document.getElementById('pos-y');
    const posZSlider = document.getElementById('pos-z');
    const rotXSlider = document.getElementById('rot-x');
    const rotYSlider = document.getElementById('rot-y');
    const rotZSlider = document.getElementById('rot-z');
    const scaleSlider = document.getElementById('scale');

    // Get value display elements
    const posXVal = document.getElementById('pos-x-val');
    const posYVal = document.getElementById('pos-y-val');
    const posZVal = document.getElementById('pos-z-val');
    const rotXVal = document.getElementById('rot-x-val');
    const rotYVal = document.getElementById('rot-y-val');
    const rotZVal = document.getElementById('rot-z-val');
    const scaleVal = document.getElementById('scale-val');

    // Set initial values from current rifle position
    posXSlider.value = rifle.position.x;
    posYSlider.value = rifle.position.y;
    posZSlider.value = rifle.position.z;
    rotXSlider.value = rifle.rotation.x * (180 / Math.PI);
    rotYSlider.value = rifle.rotation.y * (180 / Math.PI);
    rotZSlider.value = rifle.rotation.z * (180 / Math.PI);
    scaleSlider.value = rifle.scale.x;

    // Update displays
    posXVal.textContent = rifle.position.x.toFixed(2);
    posYVal.textContent = rifle.position.y.toFixed(2);
    posZVal.textContent = rifle.position.z.toFixed(2);
    rotXVal.textContent = Math.round(rifle.rotation.x * (180 / Math.PI));
    rotYVal.textContent = Math.round(rifle.rotation.y * (180 / Math.PI));
    rotZVal.textContent = Math.round(rifle.rotation.z * (180 / Math.PI));
    scaleVal.textContent = rifle.scale.x.toFixed(1);

    // Position sliders
    posXSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        rifle.position.x = value;
        posXVal.textContent = value.toFixed(2);
    });

    posYSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        rifle.position.y = value;
        posYVal.textContent = value.toFixed(2);
    });

    posZSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        rifle.position.z = value;
        posZVal.textContent = value.toFixed(2);
    });

    // Rotation sliders (convert degrees to radians)
    rotXSlider.addEventListener('input', (e) => {
        const degrees = parseFloat(e.target.value);
        rifle.rotation.x = degrees * (Math.PI / 180);
        rotXVal.textContent = degrees;
    });

    rotYSlider.addEventListener('input', (e) => {
        const degrees = parseFloat(e.target.value);
        rifle.rotation.y = degrees * (Math.PI / 180);
        rotYVal.textContent = degrees;
    });

    rotZSlider.addEventListener('input', (e) => {
        const degrees = parseFloat(e.target.value);
        rifle.rotation.z = degrees * (Math.PI / 180);
        rotZVal.textContent = degrees;
    });

    // Scale slider
    scaleSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        rifle.scale.set(value, value, value);
        scaleVal.textContent = value.toFixed(1);
    });

    // Copy values button
    const copyButton = document.getElementById('copy-values');
    copyButton.addEventListener('click', () => {
        const values = {
            position: {
                x: parseFloat(posXSlider.value),
                y: parseFloat(posYSlider.value),
                z: parseFloat(posZSlider.value)
            },
            rotation: {
                x: parseFloat(rotXSlider.value),
                y: parseFloat(rotYSlider.value),
                z: parseFloat(rotZSlider.value)
            },
            scale: parseFloat(scaleSlider.value)
        };

        console.log('=== RIFLE POSITION VALUES ===');
        console.log('Position:', values.position);
        console.log('Rotation (degrees):', values.rotation);
        console.log('Scale:', values.scale);
        console.log('=============================');

        alert('Values copied to console! Press F12 to see them.');
    });
}

// Initialize game with preloaded animations
async function initGame() {
    console.log('Starting game initialization...');

    // Preload ALL animations first
    await preloadAllAnimations();

    // Load lobby level
    await loadLobbyLevel();

    // Copy preloaded unarmed animations to active animations array
    animations = [...preloadedUnarmedAnims];
    animationFiles = unarmedAnimationFiles;

    console.log('All animations preloaded, loading character...');

    // Load initial character
    loadCharacter(currentCharacterIndex);

    // Hide loading screen
    hideLoadingScreen();
}

// Start the game
initGame();

// Team selection event listeners
document.getElementById('select-team1')?.addEventListener('click', () => {
    selectTeam(1);
});

document.getElementById('select-team2')?.addEventListener('click', () => {
    selectTeam(2);
});

// Load remaining animations
function loadAnimations(startIndex) {
    let loaded = startIndex;

    function loadNext() {
        if (loaded >= animationFiles.length) {
            console.log('All animations loaded!');
            updateUI();
            // Don't call playAnimation(0) here - let the current animation continue
            return;
        }

        loader.load(
            animationFiles[loaded],
            (gltf) => {
                if (gltf.animations.length > 0) {
                    animations.push(gltf.animations[0]);
                }
                loaded++;
                updateUI();
                loadNext();
            },
            undefined,
            (error) => {
                console.error('Error loading animation:', animationFiles[loaded], error);
                loaded++;
                loadNext();
            }
        );
    }

    loadNext();
}

// Play animation by index
function playAnimation(index) {
    if (index < 0 || index >= animations.length) {
        console.warn(`Cannot play animation ${index}: out of bounds (0-${animations.length - 1})`);
        return;
    }

    if (!mixer) {
        console.warn(`Cannot play animation ${index}: mixer not initialized`);
        return;
    }

    currentAnimationIndex = index;

    if (currentAction) {
        currentAction.fadeOut(0.3);
    }

    currentAction = mixer.clipAction(animations[index]);
    currentAction.reset().fadeIn(0.3).play();

    updateUI();

    // Notify server of animation change
    socket.emit('animationChange', { animationIndex: index });
}

// Update character UI
function updateCharacterUI() {
    const characterElement = document.getElementById('current-character');
    if (characterElement) {
        const charName = characterModels[currentCharacterIndex]
            .split('/').pop()
            .replace('.glb', '')
            .replace('SK_Chr_', '')
            .replace(/_/g, ' ');
        characterElement.textContent = charName;
    }
}

// Update UI
function updateUI() {
    // Animation demo overlay disabled
    return;
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    // Movement keys
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;
    if (key === 'shift') keys.shift = true;
    
    // Jump
    if (key === ' ' && isGrounded && jumpState === 'none') {
        jumpVelocity = jumpStrength;
        isGrounded = false;
        jumpState = 'start';
        playAnimation(JUMP_START_INDEX);
    }

    // Crouch toggle
    if (key === 'c') {
        isCrouching = !isCrouching;
    }

    // Camera rotation keys (unless opening game setup menu)
    if (key === 'arrowleft') keys.arrowLeft = true;
    if (key === 'arrowright') keys.arrowRight = true;
    if (key === 'arrowup') {
        // Check if near briefing board - open game setup menu
        if (isNearBriefingBoard) {
            openGameSetupMenu();
        } else {
            keys.arrowUp = true;
        }
    }
    if (key === 'arrowdown') keys.arrowDown = true;

    // Character switching
    if (key === 'q') {
        currentCharacterIndex = (currentCharacterIndex - 1 + characterModels.length) % characterModels.length;
        loadCharacter(currentCharacterIndex);
    }
    if (key === 'e') {
        currentCharacterIndex = (currentCharacterIndex + 1) % characterModels.length;
        loadCharacter(currentCharacterIndex);
    }

    // Weapon toggle
    if (key === 'r') {
        toggleWeapon();
    }

    // Toggle manual rifle adjustment mode - M key
    if (key === 'm' && isRifleEquipped) {
        manualRifleAdjustMode = !manualRifleAdjustMode;
        console.log('Manual rifle adjustment mode:', manualRifleAdjustMode ? 'ON' : 'OFF');

        // Update UI to show mode status
        const weaponControls = document.getElementById('weapon-controls');
        if (weaponControls) {
            if (manualRifleAdjustMode) {
                weaponControls.style.borderColor = '#4CAF50';
                weaponControls.style.borderWidth = '3px';
                weaponControls.style.borderStyle = 'solid';
            } else {
                weaponControls.style.border = 'none';
            }
        }
    }

    // Toggle crosshair style - H key
    if (key === 'h') {
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.classList.toggle('dot');
            console.log('Crosshair style:', crosshair.classList.contains('dot') ? 'Dot' : 'Cross');
        }
    }

    // Toggle first/third person - P key
    if (key === 'p') {
        isFirstPerson = !isFirstPerson;
        console.log('Camera mode:', isFirstPerson ? 'First-Person' : 'Third-Person');

        if (isFirstPerson) {
            setFirstPersonVisibility();
        } else {
            setThirdPersonVisibility();
        }

        // Update UI
        const cameraModeElement = document.getElementById('camera-mode');
        if (cameraModeElement) {
            cameraModeElement.textContent = isFirstPerson ? 'First-Person' : 'Third-Person';
        }
    }

    // Rifle special animations (only when rifle is equipped)
    if (isRifleEquipped && mixer) {
        // Reload - T key
        if (key === 't' && rifleReloadAnim) {
            const reloadAction = mixer.clipAction(rifleReloadAnim);
            reloadAction.setLoop(THREE.LoopOnce);
            reloadAction.clampWhenFinished = true;
            if (currentAction) currentAction.fadeOut(0.2);
            reloadAction.reset().fadeIn(0.2).play();

            // Return to idle after reload
            setTimeout(() => {
                if (animations.length > 0) {
                    currentAction = mixer.clipAction(animations[0]);
                    currentAction.reset().fadeIn(0.3).play();
                }
            }, reloadAction.getClip().duration * 1000);
        }

        // Melee - G key
        if (key === 'g' && rifleMeleeAnim) {
            const meleeAction = mixer.clipAction(rifleMeleeAnim);
            meleeAction.setLoop(THREE.LoopOnce);
            meleeAction.clampWhenFinished = true;
            if (currentAction) currentAction.fadeOut(0.1);
            meleeAction.reset().fadeIn(0.1).play();

            // Return to idle after melee
            setTimeout(() => {
                if (animations.length > 0) {
                    currentAction = mixer.clipAction(animations[0]);
                    currentAction.reset().fadeIn(0.3).play();
                }
            }, meleeAction.getClip().duration * 1000);
        }

        // Fire - F key
        if (key === 'f' && rifleFireAnim) {
            const fireAction = mixer.clipAction(rifleFireAnim);
            fireAction.setLoop(THREE.LoopOnce);
            fireAction.clampWhenFinished = true;
            fireAction.reset().play();

            // Spawn muzzle flash particles at rifle position
            if (rifle && character) {
                const muzzlePos = new THREE.Vector3();
                rifle.getWorldPosition(muzzlePos);
                // Offset forward from rifle
                const forward = new THREE.Vector3(0, 0, 1);
                forward.applyQuaternion(character.quaternion);
                muzzlePos.add(forward.multiplyScalar(0.5));
                muzzleFlashParticles.emit(muzzlePos);
            }

            // Return to idle after fire
            setTimeout(() => {
                if (animations.length > 0) {
                    currentAction = mixer.clipAction(animations[0]);
                    currentAction.reset().play();
                }
            }, fireAction.getClip().duration * 1000);
        }

        // Toggle ADS (Aim Down Sights) - V key
        if (key === 'v') {
            isADS = !isADS;
            console.log('ADS toggled:', isADS);

            if (isADS && rifleADSIdleAnim) {
                // Enter ADS
                cameraDistanceTarget = adsCameraDistance;
                if (currentAction) currentAction.fadeOut(0.2);
                currentAction = mixer.clipAction(rifleADSIdleAnim);
                currentAction.reset().fadeIn(0.2).play();
            } else if (!isADS && animations.length > 0) {
                // Exit ADS
                cameraDistanceTarget = normalCameraDistance;
                if (currentAction) currentAction.fadeOut(0.2);
                currentAction = mixer.clipAction(animations[0]);
                currentAction.reset().fadeIn(0.2).play();
                console.log('Returning to hipfire idle');
            }
        }
    }

    // Number keys for manual animation switching (for testing)
    const numKey = parseInt(event.key);
    if (numKey >= 1 && numKey <= 9) {
        const index = numKey - 1;
        if (index < animations.length) {
            playAnimation(index);
        }
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();

    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;
    if (key === 'shift') keys.shift = false;

    // Camera rotation keys
    if (key === 'arrowleft') keys.arrowLeft = false;
    if (key === 'arrowright') keys.arrowRight = false;
    if (key === 'arrowup') keys.arrowUp = false;
    if (key === 'arrowdown') keys.arrowDown = false;
});

// Pointer lock for mouse control
let isPointerLocked = false;

// Request pointer lock when clicking on canvas
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// Handle pointer lock change
document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === renderer.domElement;

    // Update UI status
    const statusElement = document.getElementById('pointer-status');
    if (isPointerLocked) {
        statusElement.textContent = 'Mouse Locked - Press ESC to unlock';
        statusElement.style.color = '#4CAF50';
    } else {
        statusElement.textContent = 'Click to lock mouse';
        statusElement.style.color = '#ff9800';

        // Reset all keys when pointer is unlocked to prevent stuck keys
        keys.w = false;
        keys.a = false;
        keys.s = false;
        keys.d = false;
        keys.shift = false;
        keys.arrowLeft = false;
        keys.arrowRight = false;
        keys.arrowUp = false;
        keys.arrowDown = false;
    }
});

// Mouse movement for camera rotation (only when pointer is locked)
document.addEventListener('mousemove', (event) => {
    if (!isPointerLocked) return;

    cameraTheta -= event.movementX * mouseSensitivity;
    cameraPhi += event.movementY * mouseSensitivity;  // Mouse up = look up

    // Clamp vertical angle (allow looking down more)
    cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi));
});

// Mouse wheel for zoom
document.addEventListener('wheel', (event) => {
    cameraDistanceTarget += event.deltaY * 0.01;
    cameraDistanceTarget = Math.max(2, Math.min(10, cameraDistanceTarget));
});

// Left mouse button for shooting
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left mouse button
        if (isPointerLocked && isRifleEquipped && mixer) {
            fireWeapon();
        }
    }
});

// Right mouse button for ADS
document.addEventListener('mousedown', (event) => {
    if (event.button === 2) { // Right mouse button
        event.preventDefault();
        isRightMouseDown = true;

        if (isRifleEquipped && rifleADSIdleAnim && mixer) {
            // Enter ADS
            isADS = true;
            cameraDistanceTarget = adsCameraDistance;

            if (currentAction) currentAction.fadeOut(0.2);
            currentAction = mixer.clipAction(rifleADSIdleAnim);
            currentAction.reset().fadeIn(0.2).play();
            console.log('Entering ADS');
        }
    }
});

document.addEventListener('mouseup', (event) => {
    if (event.button === 2) { // Right mouse button
        isRightMouseDown = false;

        if (isRifleEquipped && animations.length > 0 && mixer) {
            // Exit ADS
            isADS = false;
            cameraDistanceTarget = normalCameraDistance;

            if (currentAction) currentAction.fadeOut(0.2);
            currentAction = mixer.clipAction(animations[0]);
            currentAction.reset().fadeIn(0.2).play();
            console.log('Exiting ADS');
        }
    }
});

// Prevent context menu on right click
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    // Update SSAO
    ssaoPass.setSize(window.innerWidth, window.innerHeight);

    // Update FXAA resolution
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * renderer.getPixelRatio());
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * renderer.getPixelRatio());
});

// Update rifle position
function updateRiflePosition() {
    if (!rifle || manualRifleAdjustMode) return; // Skip if in manual adjustment mode

    // Base position for rifle
    rifleTargetPosition.set(-0.1, 0.01, -0.03);

    // Base rotation for rifle
    let baseRotX = -180 * (Math.PI / 180);
    let baseRotY = -79 * (Math.PI / 180);
    let baseRotZ = -11 * (Math.PI / 180);

    // In first-person, make rifle follow camera rotation exactly (like FPS viewmodel)
    if (isFirstPerson) {
        // Calculate vertical look angle from camera
        // cameraPhi ranges from 0.1 (looking up) to Math.PI - 0.1 (looking down)
        const verticalLookAngle = (cameraPhi - Math.PI / 2); // Center around 0

        // Make rifle follow camera pitch exactly - inverted to match camera direction
        baseRotX -= verticalLookAngle * 1.0; // Inverted: when looking down, rifle tilts down

        // Slightly adjust position when looking down for better view
        rifleTargetPosition.y = 0.01 - (verticalLookAngle * 0.03);
    }

    rifleTargetRotation.set(baseRotX, baseRotY, baseRotZ);

    // Smoothly interpolate to target position
    rifle.position.lerp(rifleTargetPosition, rifleTransitionSpeed);

    // Smoothly interpolate to target rotation
    rifle.rotation.x += (rifleTargetRotation.x - rifle.rotation.x) * rifleTransitionSpeed;
    rifle.rotation.y += (rifleTargetRotation.y - rifle.rotation.y) * rifleTransitionSpeed;
    rifle.rotation.z += (rifleTargetRotation.z - rifle.rotation.z) * rifleTransitionSpeed;
}

// Update aim offset based on camera angles (Option 2: Use as primary animation)
function updateAimOffset() {
    if (!mixer || !isRifleEquipped || !character) return;

    // Choose the correct aim offset set based on ADS state
    const aimOffset = isADS ? aimOffsetADS : aimOffsetHipfire;

    // Check if aim offset animations are loaded
    if (!aimOffset.CC) return; // Not loaded yet

    // Only use aim offset when idle (not moving, not crouching)
    // Check if any movement keys are pressed
    const isMoving = keys.w || keys.s || keys.a || keys.d;
    if (isMoving) {
        lastAimKey = 'CC'; // Reset to center when moving
        return; // Don't use aim offset while moving
    }
    if (isCrouching) {
        lastAimKey = 'CC'; // Reset to center when crouching
        return; // Don't use aim offset while crouching
    }

    // Only allow aim offset during basic idle (index 0)
    // Don't use during any other animations
    if (currentAnimationIndex !== 0) {
        lastAimKey = 'CC';
        return;
    }

    // Calculate vertical aim (-1 = up, 0 = center, 1 = down)
    // cameraPhi ranges from 0.1 (looking up) to Math.PI - 0.1 (looking down)
    const verticalNormalized = (cameraPhi - Math.PI / 2) / (Math.PI / 2);
    const verticalAim = Math.max(-1, Math.min(1, verticalNormalized));

    // Determine which animations to use based on aim direction
    // Use larger thresholds for smoother transitions
    let verticalZone = 'C'; // Center
    let verticalBlend = 0;

    if (verticalAim < -0.2) {  // Reduced from -0.3 for earlier transitions
        verticalZone = 'U'; // Up
        verticalBlend = Math.abs(verticalAim);
    } else if (verticalAim > 0.2) {  // Reduced from 0.3
        verticalZone = 'D'; // Down
        verticalBlend = Math.abs(verticalAim);
    } else {
        verticalZone = 'C'; // Center
        verticalBlend = 1.0 - Math.abs(verticalAim) / 0.2;
    }

    let horizontalZone = 'C'; // Center - always center in first-person
    let horizontalBlend = 0;

    // Only use horizontal aim in third-person mode
    if (!isFirstPerson) {
        // Calculate horizontal aim relative to character facing direction
        const angleDiff = cameraTheta - (character.rotation.y - Math.PI);

        // Normalize to -PI to PI
        let normalizedAngle = angleDiff;
        while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
        while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

        // Map to -1 (left) to 1 (right), with deadzone in center
        const horizontalAim = Math.max(-1, Math.min(1, normalizedAngle / (Math.PI / 3)));

        if (horizontalAim < -0.2) {
            horizontalZone = 'L'; // Left
            horizontalBlend = Math.abs(horizontalAim);
        } else if (horizontalAim > 0.2) {
            horizontalZone = 'R'; // Right
            horizontalBlend = Math.abs(horizontalAim);
        } else {
            horizontalZone = 'C'; // Center
            horizontalBlend = 1.0 - Math.abs(horizontalAim) / 0.2;
        }
    }

    // Build the animation key (e.g., "CC", "LU", "RD")
    const aimKey = horizontalZone + verticalZone;

    // Get the target animation
    const targetAnim = aimOffset[aimKey];
    if (!targetAnim) {
        return; // Animation not loaded yet
    }

    // Only switch animation if it's different from last frame (prevent flickering)
    if (aimKey === lastAimKey) {
        return; // Already on the correct animation
    }

    // Update last aim key
    lastAimKey = aimKey;

    // Check if we're already playing this aim animation
    if (currentAction && currentAction.getClip() === targetAnim) {
        return; // Already playing the correct animation
    }

    // Fade out current action with longer fade for smoother transition
    if (currentAction) {
        currentAction.fadeOut(0.5); // Increased from 0.2 for smoother blend
    }

    // Play the aim offset animation as PRIMARY (not additive)
    const action = mixer.clipAction(targetAnim);
    action.blendMode = THREE.NormalAnimationBlendMode; // Use normal blending, not additive
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1.0);
    action.reset().fadeIn(0.5).play(); // Increased from 0.2 for smoother blend

    currentAction = action;
}

// Character movement and animation
let autoAnimationEnabled = true;

// Footstep particle system
let footstepTimer = 0;
const footstepInterval = 0.3; // Spawn dust every 0.3 seconds when moving
const footstepIntervalRun = 0.2; // Faster when running

// Ground check cache for performance
let groundCheckCounter = 0;
let cachedGroundY = 0;

// Update player height based on ground/stairs below with jump physics
function updateGroundHeight(delta) {
    if (!character) return;

    let targetGroundY = cachedGroundY;

    // Only check ground every 5 frames for performance
    groundCheckCounter++;
    if (groundCheckCounter % 5 === 0) {
        // Raycast downward from above the player
        const rayOrigin = new THREE.Vector3(character.position.x, character.position.y + 5, character.position.z);
        const rayDirection = new THREE.Vector3(0, -1, 0);

        collisionRaycaster.set(rayOrigin, rayDirection);
        collisionRaycaster.far = 15; // Check up to 15 units down

        // Check collidable objects (stairs, floors) and ground
        const objectsToCheck = [...collidableObjects];
        if (ground) objectsToCheck.push(ground);

        const intersects = collisionRaycaster.intersectObjects(objectsToCheck, true);

        targetGroundY = 0;
        if (intersects.length > 0) {
            // Find the closest surface BELOW the player's feet
            const playerFeetY = character.position.y;
            const surfacesBelow = intersects.filter(hit => hit.point.y < playerFeetY + 0.5);

            if (surfacesBelow.length > 0) {
                // Use the highest surface below us (closest one)
                targetGroundY = surfacesBelow[0].point.y;
            }
        }

        cachedGroundY = targetGroundY;
    }
    
    // Apply gravity and jump physics
    jumpVelocity -= gravity * delta;
    character.position.y += jumpVelocity * delta;
    
    // Update jump state and animations based on velocity
    if (jumpState !== 'none') {
        if (jumpState === 'start' && jumpVelocity < 2) {
            // Reached apex
            jumpState = 'apex';
            playAnimation(JUMP_APEX_INDEX);
        } else if ((jumpState === 'apex' || jumpState === 'start') && jumpVelocity < -1) {
            // Started falling
            jumpState = 'fall';
            playAnimation(JUMP_FALL_INDEX);
        }
    }
    
    // Check if landed on ground
    if (character.position.y <= targetGroundY) {
        character.position.y = targetGroundY;
        jumpVelocity = 0;
        
        if (jumpState !== 'none') {
            // Just landed
            jumpState = 'land';
            playAnimation(JUMP_LAND_INDEX);
            // Return to idle after landing animation
            setTimeout(() => {
                jumpState = 'none';
                if (isGrounded) {
                    playAnimation(0); // Idle
                }
            }, 300);
        }
        
        isGrounded = true;
    } else {
        isGrounded = false;
    }
}

// Collision cache for performance
let stuckFrameCounter = 0;
const tempBox = new THREE.Box3(); // Reusable box for performance

// Check for collisions using raycasts against actual geometry (tight collision)
function checkCollision(x, z) {
    if (collidableObjects.length === 0) {
        return false;
    }

    if (!character) return false;

    const playerPos = new THREE.Vector3(x, 1.2, z);

    // Cast rays in 4 cardinal directions (optimized)
    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];

    // First pass: quick bounding box check to filter nearby objects
    const nearbyObjects = [];
    const playerBox = new THREE.Box3(
        new THREE.Vector3(x - 2, 0, z - 2),
        new THREE.Vector3(x + 2, 3, z + 2)
    );

    for (let i = 0; i < collidableObjects.length; i++) {
        const obj = collidableObjects[i];
        const box = collisionBoxes[i];

        if (box && box.intersectsBox(playerBox)) {
            nearbyObjects.push(obj);
        }
    }

    // Second pass: precise raycast only against nearby objects
    for (const direction of directions) {
        collisionRaycaster.set(playerPos, direction);
        collisionRaycaster.far = playerRadius;

        const intersects = collisionRaycaster.intersectObjects(nearbyObjects, true);

        if (intersects.length > 0 && intersects[0].distance < playerRadius) {
            return true;
        }
    }

    return false;
}

function updateCharacterMovement(delta) {
    if (!character) return;
    if (playerIsDead) return; // Can't move while dead

    // Calculate movement direction based on camera
    const moveDirection = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep movement horizontal
    cameraDirection.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, camera.up).normalize();

    let isMoving = false;

    // Calculate movement based on input
    if (keys.w) {
        moveDirection.add(cameraDirection);  // Forward
        isMoving = true;
    }
    if (keys.s) {
        moveDirection.sub(cameraDirection);  // Backward
        isMoving = true;
    }
    if (keys.a) {
        moveDirection.sub(cameraRight);  // Left
        isMoving = true;
    }
    if (keys.d) {
        moveDirection.add(cameraRight);  // Right
        isMoving = true;
    }

    // Auto-switch animations based on movement
    if (autoAnimationEnabled && mixer && animations.length > 0) {
        if (isCrouching) {
            // Crouching animations
            if (isMoving) {
                // Crouch walk forward (animation index 17)
                if (currentAnimationIndex !== 17 && animations.length > 17) {
                    playAnimation(17);
                }
            } else {
                // Crouch idle (animation index 6)
                if (currentAnimationIndex !== 6 && animations.length > 6) {
                    playAnimation(6);
                }
            }
            isJogging = false;
        } else {
            // Standing animations
            if (isMoving) {
                if (keys.shift) {
                    // Jog forward (animation index 2)
                    if (currentAnimationIndex !== 2 && animations.length > 2) {
                        playAnimation(2);
                    }
                    isJogging = true;
                } else {
                    // Walk forward (animation index 1)
                    if (currentAnimationIndex !== 1 && animations.length > 1) {
                        playAnimation(1);
                    }
                    isJogging = false;
                }
            } else {
                // Idle (animation index 0)
                if (currentAnimationIndex !== 0 && animations.length > 0) {
                    playAnimation(0);
                }
                isJogging = false;
            }
        }
    }

    // Update rifle position based on movement state
    updateRiflePosition();

    // Apply movement
    if (isMoving) {
        moveDirection.normalize();

        if (!isFirstPerson) {
            // Third-person: Rotate character to face movement direction
            const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
            const currentRotation = character.rotation.y;
            const rotationDiff = targetRotation - currentRotation;

            // Normalize rotation difference to -PI to PI
            let normalizedDiff = rotationDiff;
            while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
            while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;

            // Smoothly rotate towards target
            const rotationStep = rotationSpeed * delta;
            if (Math.abs(normalizedDiff) < rotationStep) {
                character.rotation.y = targetRotation;
            } else {
                character.rotation.y += Math.sign(normalizedDiff) * rotationStep;
            }
        }
        // First-person rotation is handled in camera update (line 1692)

        // Move character with collision detection and sliding
        const speed = keys.shift ? moveSpeed * 1.5 : moveSpeed;
        const moveAmount = speed * delta;

        // Calculate desired position
        const newPosX = character.position.x + moveDirection.x * moveAmount;
        const newPosZ = character.position.z + moveDirection.z * moveAmount;

        // Try moving to desired position
        if (!checkCollision(newPosX, newPosZ)) {
            // No collision, move freely
            character.position.x = newPosX;
            character.position.z = newPosZ;
        } else {
            // Collision detected - try sliding along walls (AAA game feel)
            // Try X movement only
            if (!checkCollision(newPosX, character.position.z)) {
                character.position.x = newPosX;
            }
            // Try Z movement only
            if (!checkCollision(character.position.x, newPosZ)) {
                character.position.z = newPosZ;
            }
        }

        // Spawn footstep dust particles
        footstepTimer += delta;
        const interval = keys.shift ? footstepIntervalRun : footstepInterval;

        if (footstepTimer >= interval && isGrounded) {
            footstepTimer = 0;

            // Spawn dust at character's feet
            const footPos = new THREE.Vector3(
                character.position.x,
                character.position.y + 0.1, // Slightly above ground
                character.position.z
            );
            dustParticles.emit(footPos);
        }

        // Update ground height (for stairs, terrain, floors) and apply jump physics
        updateGroundHeight(delta);
    } else {
        // Not moving - reset footstep timer
        footstepTimer = 0;
    }
}

// Camera rotation with arrow keys and mouse
function updateCameraRotation(delta) {
    if (!character) return;

    // Rotate camera with arrow keys
    if (keys.arrowLeft) {
        cameraTheta -= cameraRotationSpeed * delta;
    }
    if (keys.arrowRight) {
        cameraTheta += cameraRotationSpeed * delta;
    }
    if (keys.arrowUp) {
        cameraPhi -= cameraRotationSpeed * delta;
    }
    if (keys.arrowDown) {
        cameraPhi += cameraRotationSpeed * delta;
    }

    // Clamp vertical angle (allow looking down more)
    cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi));
}

// Animation loop
const clock = new THREE.Clock();
let lastUpdateTime = 0;
const updateInterval = 50; // Send updates every 50ms

// FPS counter
let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 60;

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const currentTime = Date.now();

    // Update FPS counter with performance stats
    frameCount++;
    if (currentTime - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = currentTime;
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
            // Color based on FPS: green (60+), yellow (30-59), red (<30)
            const color = fps >= 60 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00';
            fpsCounter.style.color = color;

            // Show detailed performance stats
            const cullPercent = totalObjects > 0 ? Math.round((culledObjects / totalObjects) * 100) : 0;

            fpsCounter.innerHTML = `FPS: ${fps}<br>` +
                `<span style="font-size: 10px; opacity: 0.7;">` +
                `Objects: ${visibleObjects}/${totalObjects} | ` +
                `Culled: ${cullPercent}%` +
                `</span>`;
        }
    }

    // Check proximity to briefing board (lobby only)
    const promptElement = document.getElementById('briefing-board-prompt');
    if (briefingBoard && character && promptElement) {
        const distance = character.position.distanceTo(briefingBoard.position);
        const proximityThreshold = 5; // 5 units distance

        if (distance < proximityThreshold && !isNearBriefingBoard) {
            // Just entered range - show prompt
            isNearBriefingBoard = true;
            promptElement.style.display = 'block';
        } else if (distance >= proximityThreshold && isNearBriefingBoard) {
            // Just left range - hide prompt
            isNearBriefingBoard = false;
            promptElement.style.display = 'none';
        }
    }

    // Update character movement
    updateCharacterMovement(delta);

    if (mixer) {
        mixer.update(delta);
    }

    // Update NPC animations
    if (npcMixer) {
        npcMixer.update(delta);
    }

    // Update AI soldiers
    aiSoldiers.forEach(soldier => {
        soldier.update(delta);
    });

    // Update particle systems
    muzzleFlashParticles.update(delta);
    bulletImpactParticles.update(delta);
    dustParticles.update(delta);

    // Update aim offset animations (DISABLED - causing issues)
    // Only update aim offset when standing still
    // const isPlayerMoving = keys.w || keys.s || keys.a || keys.d;
    // if (isRifleEquipped && character && !isPlayerMoving) {
    //     updateAimOffset();
    // }

    // Update other players (every frame for smooth movement)
    let otherPlayerIndex = 0;
    Object.keys(otherPlayers).forEach((id) => {
        const playerData = otherPlayers[id];

        // Smoothly interpolate position
        playerData.model.position.lerp(playerData.targetPosition, 0.2);

        // Smoothly interpolate rotation
        const rotationDiff = playerData.targetRotation - playerData.model.rotation.y;
        playerData.model.rotation.y += rotationDiff * 0.2;

        // Update animations every 2 frames for performance (alternating between players)
        if (playerData.mixer && !playerData.isRagdoll) {
            if ((currentTime + otherPlayerIndex * 30) % 2 === 0) {
                playerData.mixer.update(delta * 2); // Double delta to compensate for skipped frames
            }
        }

        // Update rifle position based on jog state
        updateOtherPlayerRiflePosition(id);
        otherPlayerIndex++;
    });

    // Send position updates to server periodically
    if (character && currentTime - lastUpdateTime > updateInterval) {
        socket.emit('playerMovement', {
            position: {
                x: character.position.x,
                y: character.position.y,
                z: character.position.z
            },
            rotation: {
                y: character.rotation.y
            },
            isJogging: isJogging,
            isCrouching: isCrouching
        });
        lastUpdateTime = currentTime;
    }

    // Rotate camera with arrow keys (updates angles)
    updateCameraRotation(delta);

    // Smoothly interpolate camera distance for zoom
    cameraDistance += (cameraDistanceTarget - cameraDistance) * cameraZoomSpeed;

    // Update camera to follow character
    if (character) {
        if (isFirstPerson && headBone) {
            // First-person mode: position camera at head
            const headPosition = new THREE.Vector3();
            headBone.getWorldPosition(headPosition);

            // Calculate look direction based on camera angles (forward direction)
            const lookDirection = new THREE.Vector3(
                -Math.sin(cameraPhi) * Math.sin(cameraTheta),
                Math.cos(cameraPhi),
                -Math.sin(cameraPhi) * Math.cos(cameraTheta)
            );

            // Position camera at head/eye level (offset forward from head)
            // Calculate forward direction based on character rotation
            const forwardOffset = new THREE.Vector3(
                Math.sin(character.rotation.y) * 0.25,  // Forward in character's direction (increased from 0.15)
                0.1,  // Slightly up for eye level (increased from 0.05)
                Math.cos(character.rotation.y) * 0.25  // Increased from 0.15
            );
            camera.position.copy(headPosition).add(forwardOffset);

            // Look in the direction of camera angles
            const lookAtTarget = new THREE.Vector3().copy(camera.position).add(lookDirection);
            camera.lookAt(lookAtTarget);

            // Always rotate character to face camera direction in first-person
            character.rotation.y = cameraTheta + Math.PI;
        } else {
            // Third-person mode: original over-the-shoulder camera
            const characterPosition = new THREE.Vector3();
            character.getWorldPosition(characterPosition);

            // Calculate base camera position using spherical coordinates
            const x = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
            const y = cameraDistance * -Math.cos(cameraPhi); // Inverted for correct third-person look
            const z = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);

            // Over-the-shoulder offset (shift right)
            const shoulderOffset = new THREE.Vector3();
            const rightVector = new THREE.Vector3(-Math.cos(cameraTheta), 0, Math.sin(cameraTheta));
            shoulderOffset.copy(rightVector).multiplyScalar(0.5); // 0.5 units to the right

            // Target position for camera (behind and above character)
            const targetCameraPos = new THREE.Vector3(
                characterPosition.x + x + shoulderOffset.x,
                characterPosition.y + y + 1.2,
                characterPosition.z + z + shoulderOffset.z
            );

            // Look-at target (slightly in front and to the left of character)
            const lookAtTarget = characterPosition.clone();
            lookAtTarget.y += 1.5; // Head height
            lookAtTarget.add(rightVector.multiplyScalar(-0.3)); // Offset left to frame character

            // Smooth camera movement
            smoothCameraPosition.lerp(targetCameraPos, cameraSmoothness);
            smoothCameraTarget.lerp(lookAtTarget, cameraSmoothness);

            camera.position.copy(smoothCameraPosition);
            camera.lookAt(smoothCameraTarget);
        }
    }

    // ==================== PERFORMANCE OPTIMIZATIONS ====================
    // LOD (Level of Detail) - Hide distant objects for massive FPS boost
    if (character && frameCount % 3 === 0) { // Update every 3 frames
        const playerPos = character.position;
        totalObjects = collidableObjects.length;
        visibleObjects = 0;
        culledObjects = 0;

        collidableObjects.forEach(obj => {
            const distance = playerPos.distanceTo(obj.position);

            // LOD: Cull objects beyond 150 units (increased from 100 to avoid flickering)
            if (distance > 150) {
                obj.visible = false;
                culledObjects++;
            } else {
                // Make sure object is visible if not occluded
                if (!occludedObjects.has(obj)) {
                    obj.visible = true;
                    visibleObjects++;
                }
            }
        });

        // Update shadow camera to follow player (shadows render around player)
        // Use the sun direction offset (set by level or default)
        directionalLight.position.copy(playerPos).add(sunDirectionOffset);
        directionalLight.target.position.copy(playerPos);
        directionalLight.target.updateMatrixWorld();
    }

    // Occlusion Culling - DISABLED for now (was causing flickering)
    // TODO: Implement proper occlusion culling with spatial partitioning
    occlusionFrame++;

    composer.render(); // Render with post-processing effects
}

// ========================
// GAME SETUP MENU SYSTEM
// ========================

function openGameSetupMenu() {
    const menu = document.getElementById('game-setup-menu');
    const prompt = document.getElementById('briefing-board-prompt');

    if (menu && prompt) {
        // Hide prompt, show menu
        prompt.style.display = 'none';
        menu.style.display = 'block';

        // Lock pointer to stop camera movement
        document.exitPointerLock();

        console.log('Opening game setup menu');
    }
}

function closeGameSetupMenu() {
    const menu = document.getElementById('game-setup-menu');
    if (menu) {
        menu.style.display = 'none';
        console.log('Closing game setup menu');
    }
}

function updateGameSetupPreview() {
    // Update the preview stats at bottom of menu
    document.getElementById('preview-map').textContent = gameSetupConfig.selectedMap === 'test1' ? 'Test Map 1' : gameSetupConfig.selectedMap;
    document.getElementById('preview-bots').textContent = gameSetupConfig.aiCount;
    document.getElementById('preview-difficulty').textContent = gameSetupConfig.aiDifficulty.charAt(0).toUpperCase() + gameSetupConfig.aiDifficulty.slice(1);
    document.getElementById('preview-behavior').textContent = gameSetupConfig.aiBehavior.charAt(0).toUpperCase() + gameSetupConfig.aiBehavior.slice(1);
}

// Setup menu event listeners
document.addEventListener('DOMContentLoaded', () => {
    // AI Count Slider
    const aiCountSlider = document.getElementById('ai-count-slider');
    const aiCountDisplay = document.getElementById('ai-count-display');
    const team1Count = document.getElementById('team1-ai-count');
    const team2Count = document.getElementById('team2-ai-count');

    if (aiCountSlider) {
        aiCountSlider.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            gameSetupConfig.aiCount = count;
            gameSetupConfig.team1Count = Math.floor(count / 2);
            gameSetupConfig.team2Count = Math.ceil(count / 2);

            aiCountDisplay.textContent = count;
            team1Count.textContent = gameSetupConfig.team1Count;
            team2Count.textContent = gameSetupConfig.team2Count;

            updateGameSetupPreview();
        });
    }

    // AI Difficulty
    const aiDifficulty = document.getElementById('ai-difficulty');
    if (aiDifficulty) {
        aiDifficulty.addEventListener('change', (e) => {
            gameSetupConfig.aiDifficulty = e.target.value;
            updateGameSetupPreview();
        });
    }

    // AI Behavior
    const aiBehavior = document.getElementById('ai-behavior');
    if (aiBehavior) {
        aiBehavior.addEventListener('change', (e) => {
            gameSetupConfig.aiBehavior = e.target.value;
            updateGameSetupPreview();
        });
    }

    // Map Selection (future: add more maps)
    const mapOptions = document.querySelectorAll('.map-option');
    mapOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Deselect all
            mapOptions.forEach(opt => {
                opt.style.background = 'rgba(0, 0, 0, 0.3)';
                opt.style.border = '2px solid rgba(255, 255, 255, 0.1)';
            });

            // Select clicked
            option.style.background = 'rgba(76, 175, 80, 0.2)';
            option.style.border = '3px solid #4CAF50';

            gameSetupConfig.selectedMap = option.getAttribute('data-map');
            updateGameSetupPreview();
        });
    });

    // Start Game Button
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            console.log('Starting game with config:', gameSetupConfig);
            closeGameSetupMenu();

            // Load the selected map and start the game
            startGameWithConfig(gameSetupConfig);
        });

        // Add hover effect
        startGameBtn.addEventListener('mouseenter', () => {
            startGameBtn.style.transform = 'scale(1.05)';
            startGameBtn.style.boxShadow = '0 8px 30px rgba(76, 175, 80, 0.6)';
        });

        startGameBtn.addEventListener('mouseleave', () => {
            startGameBtn.style.transform = 'scale(1)';
            startGameBtn.style.boxShadow = '0 5px 20px rgba(76, 175, 80, 0.4)';
        });
    }

    // Cancel Button
    const cancelBtn = document.getElementById('cancel-game-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Game setup cancelled');
            closeGameSetupMenu();
        });

        // Add hover effect
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.transform = 'scale(1.05)';
            cancelBtn.style.background = 'rgba(255, 68, 68, 0.3)';
        });

        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.transform = 'scale(1)';
            cancelBtn.style.background = 'rgba(255, 68, 68, 0.2)';
        });
    }
});

async function startGameWithConfig(config) {
    console.log('Starting game with configuration:', config);

    try {
        // Show loading message
        updateLoadingProgress('Preparing match...');
        document.getElementById('loading-screen').style.display = 'flex';

        // Re-lock pointer for gameplay
        renderer.domElement.requestPointerLock();

        // Load the selected map
        console.log(`Loading map: ${config.selectedMap}`);
        const mapFile = `levels/${config.selectedMap}.json`;

        // Clear existing level objects (but keep player)
        const objectsToRemove = [];
        for (const obj of collidableObjects) {
            if (obj !== character) {
                scene.remove(obj);
                objectsToRemove.push(obj);
            }
        }
        // Remove from array without reassigning
        for (const obj of objectsToRemove) {
            const index = collidableObjects.indexOf(obj);
            if (index > -1) {
                collidableObjects.splice(index, 1);
            }
        }

        // Clear all lights from the scene (except ambient and main directional light)
        const lightsToRemove = [];
        scene.traverse((obj) => {
            if ((obj.isSpotLight || obj.isPointLight || (obj.isDirectionalLight && obj !== directionalLight)) && obj.userData.isLevelLight) {
                lightsToRemove.push(obj);
            }
        });
        for (const light of lightsToRemove) {
            scene.remove(light);
            if (light.target) scene.remove(light.target);
        }
        console.log(`Cleared ${lightsToRemove.length} level lights`);

        // Clear briefing board reference (we're leaving the lobby)
        briefingBoard = null;
        isNearBriefingBoard = false;
        document.getElementById('briefing-board-prompt').style.display = 'none';

        // Load the new map
        updateLoadingProgress(`Loading ${config.selectedMap} map...`);
        const response = await fetch(mapFile);
        if (!response.ok) {
            throw new Error(`Map file not found: ${mapFile}`);
        }
        const levelData = await response.json();

        // Validate level data
        if (!validateLevelJSON(levelData, config.selectedMap)) {
            throw new Error(`Invalid map data: ${config.selectedMap}`);
        }

        currentLevelData = levelData;

        // Update map size if different
        if (levelData.mapSize && levelData.mapSize !== currentMapSize) {
            currentMapSize = levelData.mapSize;
            scene.remove(ground);
            const newGeometry = new THREE.PlaneGeometry(levelData.mapSize, levelData.mapSize, 100, 100);
            ground = new THREE.Mesh(newGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);
        }

        // Load terrain/ground texture if specified
        if (levelData.terrain && levelData.terrain.groundTexture && levelData.terrain.groundTexture !== 'default') {
            console.log('[Match] Loading ground texture:', levelData.terrain.groundTexture);
            await loadGroundTextureFromAssets(levelData.terrain.groundTexture);
        }

        // Load map objects (buildings, props, etc.)
        if (levelData.objects) {
            let loadedCount = 0;
            for (const objData of levelData.objects) {
                // Load similar to loadLobbyLevel
                if (objData.type === 'building' || objData.type === 'prop') {
                    try {
                        const loader = new GLTFLoader();
                        const gltf = await new Promise((resolve, reject) => {
                            loader.load(
                                `assets/models/${objData.file}`,
                                resolve,
                                undefined,
                                reject
                            );
                        });

                        const model = gltf.scene;
                        model.position.set(objData.position.x, objData.position.y, objData.position.z);
                        if (objData.rotation) {
                            model.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
                        }
                        if (objData.scale) {
                            model.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
                        }

                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });

                        scene.add(model);
                        collidableObjects.push(model);
                        loadedCount++;
                    } catch (err) {
                        console.warn(`Failed to load ${objData.file}:`, err);
                    }
                }
            }
            console.log(`Loaded ${loadedCount} objects for ${config.selectedMap}`);
        }

        // Load lights if specified in map data
        if (levelData.lights && levelData.lights.length > 0) {
            updateLoadingProgress('Loading level lights...');
            levelData.lights.forEach((lightData) => {
                let light;
                if (lightData.lightType === 'point') {
                    light = new THREE.PointLight(
                        lightData.color,
                        lightData.intensity,
                        lightData.distance
                    );
                    if (lightData.decay !== undefined) {
                        light.decay = lightData.decay;
                    }
                } else if (lightData.lightType === 'spot') {
                    light = new THREE.SpotLight(
                        lightData.color,
                        lightData.intensity,
                        lightData.distance,
                        lightData.angle,
                        lightData.penumbra
                    );
                    if (lightData.decay !== undefined) {
                        light.decay = lightData.decay;
                    }
                    if (lightData.targetPosition) {
                        light.target.position.set(
                            lightData.targetPosition.x,
                            lightData.targetPosition.y,
                            lightData.targetPosition.z
                        );
                        scene.add(light.target);
                    }
                } else if (lightData.lightType === 'directional') {
                    light = new THREE.DirectionalLight(
                        lightData.color,
                        lightData.intensity
                    );
                    if (lightData.targetPosition) {
                        light.target.position.set(
                            lightData.targetPosition.x,
                            lightData.targetPosition.y,
                            lightData.targetPosition.z
                        );
                        scene.add(light.target);
                    }
                }

                if (light) {
                    light.position.set(
                        lightData.position.x,
                        lightData.position.y,
                        lightData.position.z
                    );
                    light.castShadow = lightData.castShadow;
                    if (light.castShadow && light.shadow) {
                        light.shadow.mapSize.width = 1024;
                        light.shadow.mapSize.height = 1024;
                    }
                    light.userData.isLevelLight = true;
                    scene.add(light);
                    console.log(`Added ${lightData.lightType} light to new map`);
                }
            });
        }

        // TODO: Spawn AI bots based on config
        updateLoadingProgress('Spawning AI bots...');
        console.log(`Spawning ${config.aiCount} AI bots...`);
        console.log(`Team 1: ${config.team1Count}, Team 2: ${config.team2Count}`);
        console.log(`Difficulty: ${config.aiDifficulty}, Behavior: ${config.aiBehavior}`);

        // AI spawning will be implemented in a future update
        // For now, log the configuration

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            updateLoadingProgress('Match started!');
        }, 1000);

        console.log('Match started successfully!');

    } catch (error) {
        console.error('Error starting match:', error);
        alert(`Failed to start match: ${error.message}`);
        document.getElementById('loading-screen').style.display = 'none';
    }
}

animate();

// Initial UI update
updateUI();
