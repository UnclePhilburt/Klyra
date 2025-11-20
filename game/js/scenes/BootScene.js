// Boot Scene - Load assets and connect to server
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#00ff00'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Load character sprite sheets
        // Kelise sprite sheet (32x32 frames, 1x1 tile character)
        this.load.spritesheet('kelise', 'assets/sprites/Kelise.png', {
            frameWidth: 32,
            frameHeight: 32,
            margin: 0,
            spacing: 0
        });

        // Malachar sprite sheets (individual animation files, all 140x140 frames)
        this.load.spritesheet('malachar_idle', 'assets/sprites/malachar/Idle.png', {
            frameWidth: 140,
            frameHeight: 140,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('malachar_walk', 'assets/sprites/malachar/Walk.png', {
            frameWidth: 140,
            frameHeight: 140,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('malachar_attack', 'assets/sprites/malachar/Attack.png', {
            frameWidth: 140,
            frameHeight: 140,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('malachar_death', 'assets/sprites/malachar/Death.png', {
            frameWidth: 140,
            frameHeight: 140,
            margin: 0,
            spacing: 0
        });

        // Aldric sprite sheets (individual animation files, all 83x86 frames)
        this.load.spritesheet('aldric_attack1', 'assets/sprites/Aldric/Attack 1.png', {
            frameWidth: 83,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('aldric_dead', 'assets/sprites/Aldric/Dead.png', {
            frameWidth: 83,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('aldric_defend', 'assets/sprites/Aldric/Defend.png', {
            frameWidth: 83,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('aldric_hurt', 'assets/sprites/Aldric/Hurt.png', {
            frameWidth: 83,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        // Aldric sprite sheets (107x86 frames)
        this.load.spritesheet('aldric_attack2', 'assets/sprites/Aldric/Attack 2.png', {
            frameWidth: 107,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('aldric_attack3', 'assets/sprites/Aldric/Attack 3.png', {
            frameWidth: 107,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        // Aldric sprite sheets (67x86 frames for idle)
        this.load.spritesheet('aldric_idle', 'assets/sprites/Aldric/Idle.png', {
            frameWidth: 67,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('aldric_move', 'assets/sprites/Aldric/Run.png', {
            frameWidth: 72,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('aldric_run_attack', 'assets/sprites/Aldric/Run+Attack.png', {
            frameWidth: 72,
            frameHeight: 86,
            margin: 0,
            spacing: 0
        });

        // Aldric's Shockwave ability sprite sheet (64x64px, row 5 frames 0-8 = tiles 50-58)
        this.load.spritesheet('aldric_shockwave', 'assets/sprites/Aldric/shockwave.png', {
            frameWidth: 64,
            frameHeight: 64,
            margin: 0,
            spacing: 0
        });

        // Malachar's Minion sprite sheet (5 rows x 13 columns, 64x64px)
        this.load.spritesheet('malacharminion', 'assets/sprites/malacharminion.png', {
            frameWidth: 64,
            frameHeight: 64,
            spacing: 0,
            margin: 0
        });

        // Malachar's Auto Attack Effect sprite sheet (64x64px, row 2 has 15 frames)
        this.load.spritesheet('malacharautoattack', 'assets/skilleffects/malacharautoattack.png', {
            frameWidth: 64,
            frameHeight: 64,
            spacing: 0,
            margin: 0
        });

        console.log('📦 Loading sprite: kelise from assets/sprites/Kelise.png');
        console.log('📦 Loading Malachar animations:');
        console.log('  - Idle (10 frames)');
        console.log('  - Walk (8 frames)');
        console.log('  - Attack (13 frames)');
        console.log('  - Death (18 frames)');
        console.log('📦 Loading sprite: malacharminion from assets/sprites/malacharminion.png');

        // Load bone commander auto-attack aura (9 frames, 64x64px each)
        this.load.spritesheet('autoattackbonecommander', 'assets/sprites/malachar/autoattackbonecommander.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        console.log('📦 Loading sprite: autoattackbonecommander (bone commander aura)');

        // Load blood damage sprite sheet (124x124px frames)
        this.load.spritesheet('blood', 'assets/sprites/blood.png', {
            frameWidth: 124,
            frameHeight: 124
        });
        console.log('📦 Loading sprite: blood (damage effects)');

        // Load blood splash animations (48x48px, 4x4 grid = 16 frames each)
        this.load.spritesheet('blood_splash_1', 'assets/sprites/Blood Animations/Blood Splash/Blood Splash 1.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('blood_splash_2', 'assets/sprites/Blood Animations/Blood Splash/Blood Splash 2.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('blood_splash_3', 'assets/sprites/Blood Animations/Blood Splash/Blood Splash 3.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        console.log('📦 Loading sprites: blood_splash_1, blood_splash_2, blood_splash_3 (gore effects)');

        // Load Legion's Call ability effect (row 3, 9 frames, 64x64px each)
        this.load.spritesheet('legionscall', 'assets/sprites/malachar/legionscall.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        console.log('📦 Loading sprite: legionscall (Legion\'s Call R ability)');

        // Load fire sprites for Pact of Bones (32x32px, 8 frames each, 0-7)
        const fireSprites = ['4-2', '4-4', '4-5', '5-1', '5-2', '5-4', '5-5', '6-1', '6-2', '6-4', '6-5', '7-1', '7-2', '7-4', '7-5'];
        fireSprites.forEach(sprite => {
            this.load.spritesheet(`fire_${sprite.replace('-', '_')}`, `assets/sprites/fire/${sprite}.png`, {
                frameWidth: 32,
                frameHeight: 32
            });
        });
        console.log(`📦 Loading ${fireSprites.length} fire sprites (Pact of Bones effect)`);

        // Load music files
        MusicManager.preload(this);

        // Load footstep sound effects
        this.load.audio('footstep1', 'assets/soundeffects/digital_footstep_grass_1.wav');
        this.load.audio('footstep2', 'assets/soundeffects/digital_footstep_grass_2.wav');
        this.load.audio('footstep3', 'assets/soundeffects/digital_footstep_grass_3.wav');
        this.load.audio('footstep4', 'assets/soundeffects/digital_footstep_grass_4.wav');
        console.log('📦 Loading footstep sounds (4 variations)');

        // Load UI sound effects
        this.load.audio('ui_cursor', 'assets/soundeffects/JDSherbert - Ultimate UI SFX Pack - Cursor - 1.mp3');
        this.load.audio('ui_select', 'assets/soundeffects/JDSherbert - Ultimate UI SFX Pack - Select - 1.mp3');
        console.log('📦 Loading UI sounds (cursor hover, select click)');

        // Load attack sound effects
        this.load.audio('swipe', 'assets/soundeffects/swipe.wav');
        console.log('📦 Loading attack sound: swipe');

        // Load death sound effects
        this.load.audio('death_bone_snap', 'assets/soundeffects/deathsounds/bone_snap.wav');
        this.load.audio('death_crunch', 'assets/soundeffects/deathsounds/crunch.wav');
        this.load.audio('death_crunch_quick', 'assets/soundeffects/deathsounds/crunch_quick.wav');
        this.load.audio('death_crunch_splat', 'assets/soundeffects/deathsounds/crunch_splat.wav');
        this.load.audio('death_crunch_splat_2', 'assets/soundeffects/deathsounds/crunch_splat_2.wav');
        this.load.audio('death_kick', 'assets/soundeffects/deathsounds/kick.wav');
        this.load.audio('death_punch', 'assets/soundeffects/deathsounds/punch.wav');
        this.load.audio('death_punch_2', 'assets/soundeffects/deathsounds/punch_2.wav');
        this.load.audio('death_punch_3', 'assets/soundeffects/deathsounds/punch_3.wav');
        this.load.audio('death_slap', 'assets/soundeffects/deathsounds/slap.wav');
        this.load.audio('death_splat_double', 'assets/soundeffects/deathsounds/splat_double_quick.wav');
        this.load.audio('death_squelch_1', 'assets/soundeffects/deathsounds/squelching_1.wav');
        this.load.audio('death_squelch_2', 'assets/soundeffects/deathsounds/squelching_2.wav');
        this.load.audio('death_squelch_3', 'assets/soundeffects/deathsounds/squelching_3.wav');
        this.load.audio('death_squelch_4', 'assets/soundeffects/deathsounds/squelching_4.wav');
        console.log('📦 Loading death sounds (15 variations)');

        // Load minion attack sound
        this.load.audio('minion_punch', 'assets/soundeffects/punch.wav');
        console.log('📦 Loading minion attack sound');

        // Load minion explosion sound (Pact of Bones ability)
        this.load.audio('minionexplosion', 'assets/soundeffects/minionexplosion.mp3');
        console.log('📦 Loading minion explosion sound');

        // Load orb collection and level up sounds
        this.load.audio('orbcollect', 'assets/soundeffects/orbcollect.mp3');
        this.load.audio('levelup', 'assets/soundeffects/levelup.mp3');
        console.log('📦 Loading orb collection and level up sounds');

        // Load Aldric attack sounds
        this.load.audio('aldric_attack1', 'assets/soundeffects/aldrick/attack1.mp3');
        this.load.audio('aldric_attack2', 'assets/soundeffects/aldrick/attack2.mp3');
        this.load.audio('aldric_attack3', 'assets/soundeffects/aldrick/attack3.mp3');
        this.load.audio('aldric_shockwave', 'assets/soundeffects/aldrick/shockwave.mp3');
        console.log('📦 Loading Aldric attack sounds (3 variations + shockwave)');

        // Load potions sprite sheet (16x16px, 14 frames per row)
        this.load.spritesheet('potions', 'assets/sprites/potions.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        console.log('📦 Loading potions sprite sheet (for XP orbs)');

        // Load NPC sprites (32x32px individual frames)
        // Merchant NPC (4 frames)
        this.load.image('merchant_1', 'assets/sprites/merchant/1.png');
        this.load.image('merchant_2', 'assets/sprites/merchant/2.png');
        this.load.image('merchant_3', 'assets/sprites/merchant/3.png');
        this.load.image('merchant_4', 'assets/sprites/merchant/4.png');
        console.log('📦 Loading merchant NPC sprites (4 frames)');

        // Skill Merchant NPC (4 frames)
        this.load.image('skillmerchant_1', 'assets/sprites/skillmerchant/1.png');
        this.load.image('skillmerchant_2', 'assets/sprites/skillmerchant/2.png');
        this.load.image('skillmerchant_3', 'assets/sprites/skillmerchant/3.png');
        this.load.image('skillmerchant_4', 'assets/sprites/skillmerchant/4.png');
        console.log('📦 Loading skill merchant NPC sprites (4 frames)');

        // Merchant items sprite sheet (potions, etc)
        this.load.spritesheet('merchantitems', 'assets/sprites/merchantitems/potions.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        console.log('📦 Loading merchant items sprite sheet');

        // Load passive skill sprites
        this.load.image('chads_shield', 'assets/sprites/skills/pic/Chad\'s Shield.png');
        console.log('📦 Loading Chad\'s Shield sprite (passive skill)');

        // Load Meteor Storm sprite sheet (64x64 frames, row 0 tiles 0-9)
        this.load.spritesheet('meteorstorm', 'assets/sprites/skills/pic/meteorstormrow1.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        console.log('📦 Loading Meteor Storm sprite sheet (passive skill)');

        // Load Burning Aura sprite sheet (64x64 frames, row 7 tiles 98-111)
        this.load.spritesheet('burningaura', 'assets/sprites/skills/pic/Burningaurarow7.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        console.log('📦 Loading Burning Aura sprite sheet (passive skill)');

        // Load Piercing Flame sprite sheet (64x64 frames, row 2 tiles 24-35)
        this.load.spritesheet('piercingflame', 'assets/sprites/skills/pic/piercingflamerow2.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        console.log('📦 Loading Piercing Flame sprite sheet (passive skill)');

        console.log('✅ Loaded character sprites: kelise, malachar');
    }

    async create() {
        console.log('🚀 Booting game assets...');

        // Create Kelise animations (1x1 character with animated frames)
        this.anims.create({
            key: 'kelise_idle',
            frames: this.anims.generateFrameNumbers('kelise', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'kelise_running',
            frames: this.anims.generateFrameNumbers('kelise', { start: 24, end: 31 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'kelise_attack',
            frames: this.anims.generateFrameNumbers('kelise', { start: 64, end: 71 }),
            frameRate: 16,
            repeat: 0
        });

        this.anims.create({
            key: 'kelise_death',
            frames: this.anims.generateFrameNumbers('kelise', { start: 56, end: 63 }),
            frameRate: 10,
            repeat: 0
        });

        console.log('✅ Created Kelise animations: idle (0-1), running (24-31), attack (64-71), death (56-63)');

        // Create Malachar animations (1x1 character with 140x140 frames)
        this.anims.create({
            key: 'malachar_idle',
            frames: this.anims.generateFrameNumbers('malachar_idle', { start: 0, end: 9 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'malachar_walk',
            frames: this.anims.generateFrameNumbers('malachar_walk', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'malachar_attack',
            frames: this.anims.generateFrameNumbers('malachar_attack', { start: 0, end: 12 }),
            frameRate: 16,
            repeat: 0
        });

        this.anims.create({
            key: 'malachar_death',
            frames: this.anims.generateFrameNumbers('malachar_death', { start: 0, end: 17 }),
            frameRate: 10,
            repeat: 0
        });

        console.log('✅ Created Malachar animations: idle (10 frames), walk (8 frames), attack (13 frames), death (18 frames)');

        // Create Aldric animations (1x1 character with varying frame sizes)
        this.anims.create({
            key: 'aldric_idle',
            frames: this.anims.generateFrameNumbers('aldric_idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'aldric_running',
            frames: this.anims.generateFrameNumbers('aldric_move', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'aldric_attack',
            frames: this.anims.generateFrameNumbers('aldric_attack1', { start: 0, end: 4 }),
            frameRate: 16,
            repeat: 0
        });

        this.anims.create({
            key: 'aldric_attack2',
            frames: this.anims.generateFrameNumbers('aldric_attack2', { start: 0, end: 3 }),
            frameRate: 16,
            repeat: 0
        });

        this.anims.create({
            key: 'aldric_attack3',
            frames: this.anims.generateFrameNumbers('aldric_attack3', { start: 0, end: 2 }),
            frameRate: 16,
            repeat: 0
        });

        this.anims.create({
            key: 'aldric_death',
            frames: this.anims.generateFrameNumbers('aldric_dead', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'aldric_defend',
            frames: this.anims.generateFrameNumbers('aldric_defend', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'aldric_hurt',
            frames: this.anims.generateFrameNumbers('aldric_hurt', { start: 0, end: 0 }),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'aldric_run_attack',
            frames: this.anims.generateFrameNumbers('aldric_run_attack', { start: 0, end: 5 }),
            frameRate: 20,
            repeat: 0
        });

        console.log('✅ Created Aldric animations: idle (4 frames), running (6 frames), attack1 (5 frames), attack2 (4 frames), attack3 (3 frames), death (5 frames), defend (4 frames), hurt (1 frame), run_attack (6 frames)');

        // Create Meteor Storm animation (passive skill)
        this.anims.create({
            key: 'meteorstorm_fall',
            frames: this.anims.generateFrameNumbers('meteorstorm', { start: 0, end: 9 }),
            frameRate: 20,
            repeat: 0
        });
        console.log('✅ Created Meteor Storm animation: fall (10 frames)');

        // Create Burning Aura animation (passive skill)
        // Row 7 tiles 98-111 = 14 frames total, but using frames 98-111 (0-13 in the sheet)
        this.anims.create({
            key: 'burningaura_pulse',
            frames: this.anims.generateFrameNumbers('burningaura', { start: 98, end: 111 }),
            frameRate: 12,
            repeat: -1
        });
        console.log('✅ Created Burning Aura animation: pulse (14 frames)');

        // Create Piercing Flame animation (passive skill)
        // Row 2 tiles 24-35 = 12 frames
        this.anims.create({
            key: 'piercingflame_shoot',
            frames: this.anims.generateFrameNumbers('piercingflame', { start: 24, end: 35 }),
            frameRate: 18,
            repeat: -1
        });
        console.log('✅ Created Piercing Flame animation: shoot (12 frames)');

        // Create minion animations
        // 5 rows x 13 columns, 64x64px
        // Row 1 (index 0): attack animation, 13 frames (frames 0-12)
        // Row 3 (index 2): walking animation, 12 frames (frames 26-37)
        // Row 4 (index 3): idle animation, 4 frames (frames 39-42)

        this.anims.create({
            key: 'minion_idle',
            frames: this.anims.generateFrameNumbers('malacharminion', { start: 39, end: 42 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'minion_walk',
            frames: this.anims.generateFrameNumbers('malacharminion', { start: 26, end: 37 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'minion_attack',
            frames: this.anims.generateFrameNumbers('malacharminion', { start: 0, end: 12 }),
            frameRate: 16,
            repeat: 0 // Play once, don't loop
        });

        // Malachar healing auto attack effect (row 2, 15 frames)
        this.anims.create({
            key: 'malachar_heal_attack',
            frames: this.anims.generateFrameNumbers('malacharautoattack', { start: 30, end: 44 }),
            frameRate: 20,
            repeat: 0 // Play once
        });

        // Bone Commander aura effect (row 1, tiles 0-8, 9 frames)
        // 10 sprites per row, row 1 starts at frame 10
        this.anims.create({
            key: 'bone_commander_aura',
            frames: this.anims.generateFrameNumbers('autoattackbonecommander', { start: 10, end: 18 }),
            frameRate: 12,
            repeat: 0 // Play once
        });

        // Legion's Call effect (row 3, tiles 0-8, 9 frames)
        // 10 sprites per row, row 3 starts at frame 30
        this.anims.create({
            key: 'legions_call',
            frames: this.anims.generateFrameNumbers('legionscall', { start: 30, end: 38 }),
            frameRate: 15,
            repeat: 0 // Play once
        });

        console.log('✅ Created minion animations: idle (frames 39-42), walk (frames 26-37), attack (frames 0-12)');
        console.log('✅ Created Malachar heal attack animation: (row 2, frames 30-44)');
        console.log('✅ Created Bone Commander aura animation: (row 1, frames 10-18)');
        console.log('✅ Created Legion\'s Call animation: (row 3, frames 30-38)');

        // Create blood damage animation
        // Sprite sheet: 124x124px frames, ~12 frames per row
        // Row 6, 14 frames: starts at frame 72 (6 rows × 12 frames)
        this.anims.create({
            key: 'blood_splatter',
            frames: this.anims.generateFrameNumbers('blood', {
                start: 72,
                end: 85
            }),
            frameRate: 18,
            repeat: 0
        });

        console.log('✅ Created blood damage animation (row 6, 14 frames)');

        // Create blood splash animations (48x48px sprites)
        // Splash 1: 4x4 grid = 16 frames (0-15) - general spray
        this.anims.create({
            key: 'blood_splash_1_anim',
            frames: this.anims.generateFrameNumbers('blood_splash_1', { start: 0, end: 15 }),
            frameRate: 24,
            repeat: 0
        });

        // Splash 2: 3 rows × 5 tiles = 15 frames (0-14) - bottom-up spray
        this.anims.create({
            key: 'blood_splash_2_anim',
            frames: this.anims.generateFrameNumbers('blood_splash_2', { start: 0, end: 14 }),
            frameRate: 24,
            repeat: 0
        });

        // Splash 3: 3 rows × 4 tiles = 12 frames (0-11) - center burst outward
        this.anims.create({
            key: 'blood_splash_3_anim',
            frames: this.anims.generateFrameNumbers('blood_splash_3', { start: 0, end: 11 }),
            frameRate: 24,
            repeat: 0
        });

        console.log('✅ Created blood splash animations: Splash1 (16f), Splash2 (15f bottom-up), Splash3 (12f burst)');

        // Create fire animations for Pact of Bones (all 32x32px, 8 frames 0-7)
        const fireAnimSprites = ['4_2', '4_4', '4_5', '5_1', '5_2', '5_4', '5_5', '6_1', '6_2', '6_4', '6_5', '7_1', '7_2', '7_4', '7_5'];
        fireAnimSprites.forEach(sprite => {
            this.anims.create({
                key: `fire_${sprite}_anim`,
                frames: this.anims.generateFrameNumbers(`fire_${sprite}`, { start: 0, end: 7 }),
                frameRate: 12,
                repeat: -1 // Loop fire animation
            });
        });
        console.log(`✅ Created ${fireAnimSprites.length} fire animations (Pact of Bones effect)`);

        // Don't connect to server - custom menu handles that
        // Just load assets and wait for custom menu to call game.connect()
        console.log('✅ Game assets loaded - waiting for menu...');

        // Initialize UI sound manager with Phaser game instance
        if (window.uiSoundManager) {
            window.uiSoundManager.init(this.game);
        }

        // Hide Phaser canvas initially (custom menu is shown)
        this.game.canvas.style.display = 'none';
    }
}
