// KLYRA TILE LIBRARY - 2000+ TILES
// The Ultimate Tile Library of Truth
// Use this to generate infinite procedural worlds with ANY theme

const TILE_LIBRARY = {
    version: "1.0.0",
    totalTiles: 2048,
    
    // ============================================
    // STANDARD BIOMES (Tiles 1-600)
    // ============================================
    
    standardBiomes: {
        // PLAINS (1-50)
        plains: [
            { id: 1, name: "grass_plains_light_01", biome: "Plains", color: "#4a7c3e", walkable: true, temp: 70, moisture: 40 },
            { id: 2, name: "grass_plains_light_02", biome: "Plains", color: "#4b7d3f", walkable: true, temp: 70, moisture: 40 },
            { id: 3, name: "grass_plains_light_03", biome: "Plains", color: "#4c7e40", walkable: true, temp: 70, moisture: 40 },
            { id: 4, name: "grass_plains_medium_01", biome: "Plains", color: "#3f6a35", walkable: true, temp: 68, moisture: 45 },
            { id: 5, name: "grass_plains_medium_02", biome: "Plains", color: "#406b36", walkable: true, temp: 68, moisture: 45 },
            { id: 6, name: "grass_plains_dark_01", biome: "Plains", color: "#355a2c", walkable: true, temp: 65, moisture: 50 },
            { id: 7, name: "grass_plains_dark_02", biome: "Plains", color: "#365b2d", walkable: true, temp: 65, moisture: 50 },
            { id: 8, name: "grass_plains_yellow_01", biome: "Plains", color: "#6b8e23", walkable: true, temp: 75, moisture: 30 },
            { id: 9, name: "grass_plains_yellow_02", biome: "Plains", color: "#6c8f24", walkable: true, temp: 75, moisture: 30 },
            { id: 10, name: "grass_plains_dry_01", biome: "Plains", color: "#8b7d3a", walkable: true, temp: 78, moisture: 25 },
            { id: 11, name: "dirt_plains_light", biome: "Plains", color: "#8b6f47", walkable: true, temp: 70, moisture: 20 },
            { id: 12, name: "dirt_plains_medium", biome: "Plains", color: "#7a5f3e", walkable: true, temp: 70, moisture: 20 },
            { id: 13, name: "dirt_plains_dark", biome: "Plains", color: "#6a4f2e", walkable: true, temp: 70, moisture: 20 },
            { id: 14, name: "grass_plains_flowers_01", biome: "Plains", color: "#5a8c3e", walkable: true, temp: 72, moisture: 50 },
            { id: 15, name: "grass_plains_flowers_02", biome: "Plains", color: "#5b8d3f", walkable: true, temp: 72, moisture: 50 },
            { id: 16, name: "grass_plains_lush_01", biome: "Plains", color: "#3e9c3e", walkable: true, temp: 68, moisture: 60 },
            { id: 17, name: "grass_plains_lush_02", biome: "Plains", color: "#3f9d3f", walkable: true, temp: 68, moisture: 60 },
            { id: 18, name: "grass_plains_patchy_01", biome: "Plains", color: "#5a7c4a", walkable: true, temp: 70, moisture: 35 },
            { id: 19, name: "grass_plains_patchy_02", biome: "Plains", color: "#5b7d4b", walkable: true, temp: 70, moisture: 35 },
            { id: 20, name: "grass_plains_tall_01", biome: "Plains", color: "#4d8f4d", walkable: true, temp: 70, moisture: 55 },
            // 21-50: More plains variations
            ...Array.from({length: 30}, (_, i) => ({
                id: 21 + i,
                name: `grass_plains_var_${i + 1}`,
                biome: "Plains",
                color: `#${Math.floor(Math.random() * 50 + 60).toString(16)}${Math.floor(Math.random() * 40 + 110).toString(16)}${Math.floor(Math.random() * 50 + 50).toString(16)}`,
                walkable: true,
                temp: Math.floor(Math.random() * 20 + 60),
                moisture: Math.floor(Math.random() * 40 + 30)
            }))
        ],
        
        // FOREST (51-120)
        forest: [
            { id: 51, name: "grass_forest_dark_01", biome: "Forest", color: "#2d5016", walkable: true, temp: 62, moisture: 70 },
            { id: 52, name: "grass_forest_dark_02", biome: "Forest", color: "#2e5117", walkable: true, temp: 62, moisture: 70 },
            { id: 53, name: "grass_forest_moss_01", biome: "Forest", color: "#3a6622", walkable: true, temp: 60, moisture: 75 },
            { id: 54, name: "grass_forest_moss_02", biome: "Forest", color: "#3b6723", walkable: true, temp: 60, moisture: 75 },
            { id: 55, name: "grass_forest_dense_01", biome: "Forest", color: "#1f3d0f", walkable: true, temp: 58, moisture: 80 },
            { id: 56, name: "dirt_forest_rich_01", biome: "Forest", color: "#5c4033", walkable: true, temp: 60, moisture: 65 },
            { id: 57, name: "dirt_forest_rich_02", biome: "Forest", color: "#5d4134", walkable: true, temp: 60, moisture: 65 },
            { id: 58, name: "leaves_forest_brown", biome: "Forest", color: "#8b6914", walkable: true, temp: 62, moisture: 60 },
            { id: 59, name: "leaves_forest_orange", biome: "Forest", color: "#cc7722", walkable: true, temp: 62, moisture: 60 },
            { id: 60, name: "leaves_forest_red", biome: "Forest", color: "#8b2500", walkable: true, temp: 62, moisture: 60 },
            // 61-120: More forest variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 61 + i,
                name: `forest_var_${i + 1}`,
                biome: "Forest",
                color: `#${Math.floor(Math.random() * 40 + 30).toString(16)}${Math.floor(Math.random() * 30 + 60).toString(16)}${Math.floor(Math.random() * 30 + 20).toString(16)}`,
                walkable: true,
                temp: Math.floor(Math.random() * 15 + 55),
                moisture: Math.floor(Math.random() * 30 + 60)
            }))
        ],
        
        // DESERT (121-190)
        desert: [
            { id: 121, name: "sand_desert_light", biome: "Desert", color: "#f4d03f", walkable: true, temp: 95, moisture: 10 },
            { id: 122, name: "sand_desert_medium", biome: "Desert", color: "#e6c730", walkable: true, temp: 95, moisture: 10 },
            { id: 123, name: "sand_desert_dark", biome: "Desert", color: "#d4b828", walkable: true, temp: 95, moisture: 10 },
            { id: 124, name: "sand_desert_red", biome: "Desert", color: "#c85a17", walkable: true, temp: 98, moisture: 5 },
            { id: 125, name: "sand_desert_orange", biome: "Desert", color: "#e6853d", walkable: true, temp: 96, moisture: 8 },
            { id: 126, name: "sand_desert_dune_01", biome: "Desert", color: "#f5deb3", walkable: true, temp: 94, moisture: 12 },
            { id: 127, name: "sand_desert_dune_02", biome: "Desert", color: "#f4ddb2", walkable: true, temp: 94, moisture: 12 },
            { id: 128, name: "stone_desert_red", biome: "Desert", color: "#b85450", walkable: true, temp: 100, moisture: 5 },
            { id: 129, name: "stone_desert_brown", biome: "Desert", color: "#8b6347", walkable: true, temp: 99, moisture: 5 },
            { id: 130, name: "sand_desert_cracked", biome: "Desert", color: "#d9a441", walkable: true, temp: 102, moisture: 3 },
            // 131-190: More desert variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 131 + i,
                name: `desert_var_${i + 1}`,
                biome: "Desert",
                color: `#${Math.floor(Math.random() * 40 + 200).toString(16)}${Math.floor(Math.random() * 50 + 150).toString(16)}${Math.floor(Math.random() * 60 + 40).toString(16)}`,
                walkable: true,
                temp: Math.floor(Math.random() * 20 + 90),
                moisture: Math.floor(Math.random() * 15 + 3)
            }))
        ],
        
        // SNOW/TUNDRA (191-260)
        snow: [
            { id: 191, name: "snow_fresh_01", biome: "Snow", color: "#f0f8ff", walkable: true, temp: 20, moisture: 40 },
            { id: 192, name: "snow_fresh_02", biome: "Snow", color: "#f1f9ff", walkable: true, temp: 20, moisture: 40 },
            { id: 193, name: "snow_packed", biome: "Snow", color: "#e6f0fa", walkable: true, temp: 18, moisture: 35 },
            { id: 194, name: "snow_dirty", biome: "Snow", color: "#d9e9f0", walkable: true, temp: 25, moisture: 30 },
            { id: 195, name: "ice_clear", biome: "Snow", color: "#b0e0e6", walkable: true, temp: 15, moisture: 20 },
            { id: 196, name: "ice_blue", biome: "Snow", color: "#87ceeb", walkable: true, temp: 10, moisture: 15 },
            { id: 197, name: "ice_dark", biome: "Snow", color: "#4682b4", walkable: false, temp: 5, moisture: 10 },
            { id: 198, name: "snow_melting", biome: "Snow", color: "#dceef3", walkable: true, temp: 32, moisture: 50 },
            { id: 199, name: "tundra_grass", biome: "Snow", color: "#8fbc8f", walkable: true, temp: 35, moisture: 45 },
            { id: 200, name: "tundra_rock", biome: "Snow", color: "#808080", walkable: true, temp: 28, moisture: 25 },
            // 201-260: More snow variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 201 + i,
                name: `snow_var_${i + 1}`,
                biome: "Snow",
                color: `#${Math.floor(Math.random() * 30 + 220).toString(16)}${Math.floor(Math.random() * 30 + 220).toString(16)}${Math.floor(Math.random() * 30 + 220).toString(16)}`,
                walkable: i % 5 !== 0, // Some ice tiles not walkable
                temp: Math.floor(Math.random() * 30 + 5),
                moisture: Math.floor(Math.random() * 40 + 15)
            }))
        ],
        
        // WATER (261-330)
        water: [
            { id: 261, name: "water_deep_01", biome: "Water", color: "#1e3a5f", walkable: false, temp: 60, moisture: 100 },
            { id: 262, name: "water_deep_02", biome: "Water", color: "#1f3b60", walkable: false, temp: 60, moisture: 100 },
            { id: 263, name: "water_medium", biome: "Water", color: "#2e5090", walkable: false, temp: 62, moisture: 100 },
            { id: 264, name: "water_shallow", biome: "Water", color: "#4682b4", walkable: true, temp: 65, moisture: 100 },
            { id: 265, name: "water_clear", biome: "Water", color: "#5f9ea0", walkable: true, temp: 68, moisture: 100 },
            { id: 266, name: "water_murky", biome: "Water", color: "#2f4f4f", walkable: false, temp: 58, moisture: 100 },
            { id: 267, name: "water_ocean_01", biome: "Water", color: "#003366", walkable: false, temp: 55, moisture: 100 },
            { id: 268, name: "water_lake_01", biome: "Water", color: "#4169e1", walkable: false, temp: 63, moisture: 100 },
            { id: 269, name: "water_river_01", biome: "Water", color: "#5f9ea0", walkable: true, temp: 65, moisture: 100 },
            { id: 270, name: "water_pond_01", biome: "Water", color: "#6495ed", walkable: true, temp: 67, moisture: 100 },
            // 271-330: More water variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 271 + i,
                name: `water_var_${i + 1}`,
                biome: "Water",
                color: `#${Math.floor(Math.random() * 60 + 30).toString(16)}${Math.floor(Math.random() * 80 + 80).toString(16)}${Math.floor(Math.random() * 100 + 140).toString(16)}`,
                walkable: i % 3 === 0, // Some shallow water walkable
                temp: Math.floor(Math.random() * 20 + 50),
                moisture: 100
            }))
        ],
        
        // MOUNTAIN/STONE (331-400)
        mountain: [
            { id: 331, name: "stone_mountain_grey", biome: "Mountain", color: "#696969", walkable: true, temp: 40, moisture: 30 },
            { id: 332, name: "stone_mountain_dark", biome: "Mountain", color: "#555555", walkable: true, temp: 38, moisture: 25 },
            { id: 333, name: "stone_cliff_01", biome: "Mountain", color: "#708090", walkable: false, temp: 35, moisture: 20 },
            { id: 334, name: "stone_peak_snow", biome: "Mountain", color: "#b0c4de", walkable: false, temp: 15, moisture: 40 },
            { id: 335, name: "gravel_mountain", biome: "Mountain", color: "#808080", walkable: true, temp: 42, moisture: 15 },
            { id: 336, name: "rock_dark", biome: "Mountain", color: "#2f4f4f", walkable: true, temp: 40, moisture: 20 },
            { id: 337, name: "boulder_grey", biome: "Mountain", color: "#696969", walkable: false, temp: 38, moisture: 18 },
            { id: 338, name: "slate_smooth", biome: "Mountain", color: "#708090", walkable: true, temp: 40, moisture: 22 },
            { id: 339, name: "granite_speckled", biome: "Mountain", color: "#a9a9a9", walkable: true, temp: 42, moisture: 20 },
            { id: 340, name: "basalt_black", biome: "Mountain", color: "#36454f", walkable: true, temp: 40, moisture: 15 },
            // 341-400: More mountain variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 341 + i,
                name: `mountain_var_${i + 1}`,
                biome: "Mountain",
                color: `#${Math.floor(Math.random() * 80 + 80).toString(16)}${Math.floor(Math.random() * 80 + 80).toString(16)}${Math.floor(Math.random() * 80 + 80).toString(16)}`,
                walkable: i % 4 !== 0, // Some cliffs not walkable
                temp: Math.floor(Math.random() * 30 + 20),
                moisture: Math.floor(Math.random() * 30 + 10)
            }))
        ],
        
        // SWAMP (401-470)
        swamp: [
            { id: 401, name: "mud_swamp_dark", biome: "Swamp", color: "#3d3d29", walkable: true, temp: 72, moisture: 95 },
            { id: 402, name: "mud_swamp_wet", biome: "Swamp", color: "#4a4a32", walkable: true, temp: 72, moisture: 95 },
            { id: 403, name: "water_swamp_murky", biome: "Swamp", color: "#2f4f2f", walkable: false, temp: 70, moisture: 100 },
            { id: 404, name: "grass_swamp_dead", biome: "Swamp", color: "#556b2f", walkable: true, temp: 68, moisture: 90 },
            { id: 405, name: "moss_swamp_thick", biome: "Swamp", color: "#8fbc8f", walkable: true, temp: 70, moisture: 92 },
            { id: 406, name: "peat_swamp", biome: "Swamp", color: "#5a4a32", walkable: true, temp: 69, moisture: 88 },
            { id: 407, name: "algae_swamp_green", biome: "Swamp", color: "#6b8e23", walkable: false, temp: 71, moisture: 98 },
            { id: 408, name: "bog_dark", biome: "Swamp", color: "#2e2e1a", walkable: true, temp: 67, moisture: 93 },
            { id: 409, name: "quicksand_swamp", biome: "Swamp", color: "#8b7d6b", walkable: false, temp: 73, moisture: 85 },
            { id: 410, name: "roots_swamp_thick", biome: "Swamp", color: "#654321", walkable: true, temp: 70, moisture: 90 },
            // 411-470: More swamp variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 411 + i,
                name: `swamp_var_${i + 1}`,
                biome: "Swamp",
                color: `#${Math.floor(Math.random() * 40 + 40).toString(16)}${Math.floor(Math.random() * 40 + 60).toString(16)}${Math.floor(Math.random() * 40 + 30).toString(16)}`,
                walkable: i % 3 !== 0, // Some deep water not walkable
                temp: Math.floor(Math.random() * 10 + 65),
                moisture: Math.floor(Math.random() * 20 + 80)
            }))
        ],
        
        // BEACH/COAST (471-530)
        beach: [
            { id: 471, name: "sand_beach_light", biome: "Beach", color: "#ffe4b5", walkable: true, temp: 75, moisture: 40 },
            { id: 472, name: "sand_beach_wet", biome: "Beach", color: "#f4d96f", walkable: true, temp: 72, moisture: 60 },
            { id: 473, name: "sand_beach_rocky", biome: "Beach", color: "#d2b48c", walkable: true, temp: 73, moisture: 45 },
            { id: 474, name: "pebbles_beach", biome: "Beach", color: "#b8a88a", walkable: true, temp: 70, moisture: 50 },
            { id: 475, name: "shells_beach", biome: "Beach", color: "#fff0e6", walkable: true, temp: 74, moisture: 42 },
            { id: 476, name: "tide_pool", biome: "Beach", color: "#87ceeb", walkable: true, temp: 70, moisture: 90 },
            { id: 477, name: "coral_beach_pink", biome: "Beach", color: "#ff6b9d", walkable: true, temp: 76, moisture: 55 },
            { id: 478, name: "driftwood_beach", biome: "Beach", color: "#8b7355", walkable: true, temp: 72, moisture: 40 },
            { id: 479, name: "seaweed_beach", biome: "Beach", color: "#2e8b57", walkable: true, temp: 70, moisture: 65 },
            { id: 480, name: "cliff_beach_rock", biome: "Beach", color: "#696969", walkable: false, temp: 68, moisture: 35 },
            // 481-530: More beach variations
            ...Array.from({length: 50}, (_, i) => ({
                id: 481 + i,
                name: `beach_var_${i + 1}`,
                biome: "Beach",
                color: `#${Math.floor(Math.random() * 40 + 200).toString(16)}${Math.floor(Math.random() * 40 + 190).toString(16)}${Math.floor(Math.random() * 80 + 140).toString(16)}`,
                walkable: true,
                temp: Math.floor(Math.random() * 15 + 68),
                moisture: Math.floor(Math.random() * 40 + 35)
            }))
        ],
        
        // VOLCANIC (531-600)
        volcanic: [
            { id: 531, name: "lava_flowing_bright", biome: "Volcanic", color: "#ff4500", walkable: false, temp: 500, moisture: 0 },
            { id: 532, name: "lava_flowing_orange", biome: "Volcanic", color: "#ff6347", walkable: false, temp: 480, moisture: 0 },
            { id: 533, name: "lava_pool_red", biome: "Volcanic", color: "#dc143c", walkable: false, temp: 520, moisture: 0 },
            { id: 534, name: "obsidian_black", biome: "Volcanic", color: "#1c1c1c", walkable: true, temp: 200, moisture: 0 },
            { id: 535, name: "obsidian_purple", biome: "Volcanic", color: "#4b0082", walkable: true, temp: 210, moisture: 0 },
            { id: 536, name: "ash_grey", biome: "Volcanic", color: "#696969", walkable: true, temp: 150, moisture: 5 },
            { id: 537, name: "ash_dark", biome: "Volcanic", color: "#3e3e3e", walkable: true, temp: 160, moisture: 3 },
            { id: 538, name: "pumice_light", biome: "Volcanic", color: "#a9a9a9", walkable: true, temp: 120, moisture: 8 },
            { id: 539, name: "basalt_volcanic_red", biome: "Volcanic", color: "#8b0000", walkable: true, temp: 180, moisture: 2 },
            { id: 540, name: "magma_crust", biome: "Volcanic", color: "#cd5c5c", walkable: false, temp: 300, moisture: 0 },
            // 541-600: More volcanic variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 541 + i,
                name: `volcanic_var_${i + 1}`,
                biome: "Volcanic",
                color: `#${Math.floor(Math.random() * 100 + 150).toString(16)}${Math.floor(Math.random() * 60 + 30).toString(16)}${Math.floor(Math.random() * 40 + 10).toString(16)}`,
                walkable: i % 3 !== 0, // Some lava not walkable
                temp: Math.floor(Math.random() * 400 + 100),
                moisture: Math.floor(Math.random() * 10)
            }))
        ]
    },
    
    // ============================================
    // THEMED BIOMES (Tiles 601-1400)
    // ============================================
    
    themedBiomes: {
        // DISCO (601-680)
        disco: [
            { id: 601, name: "disco_floor_red", biome: "Disco", color: "#ff0000", walkable: true, temp: 75, glow: true },
            { id: 602, name: "disco_floor_orange", biome: "Disco", color: "#ff7f00", walkable: true, temp: 75, glow: true },
            { id: 603, name: "disco_floor_yellow", biome: "Disco", color: "#ffff00", walkable: true, temp: 75, glow: true },
            { id: 604, name: "disco_floor_green", biome: "Disco", color: "#00ff00", walkable: true, temp: 75, glow: true },
            { id: 605, name: "disco_floor_blue", biome: "Disco", color: "#0000ff", walkable: true, temp: 75, glow: true },
            { id: 606, name: "disco_floor_purple", biome: "Disco", color: "#8b00ff", walkable: true, temp: 75, glow: true },
            { id: 607, name: "disco_floor_pink", biome: "Disco", color: "#ff1493", walkable: true, temp: 75, glow: true },
            { id: 608, name: "disco_floor_rainbow_01", biome: "Disco", color: "#ff00ff", walkable: true, temp: 75, glow: true },
            { id: 609, name: "disco_tile_checkered_bw", biome: "Disco", color: "#ffffff", walkable: true, temp: 75 },
            { id: 610, name: "disco_tile_checkered_color", biome: "Disco", color: "#ff69b4", walkable: true, temp: 75 },
            { id: 611, name: "disco_sparkle_gold", biome: "Disco", color: "#ffd700", walkable: true, temp: 75, glow: true },
            { id: 612, name: "disco_sparkle_silver", biome: "Disco", color: "#c0c0c0", walkable: true, temp: 75, glow: true },
            { id: 613, name: "disco_neon_cyan", biome: "Disco", color: "#00ffff", walkable: true, temp: 75, glow: true },
            { id: 614, name: "disco_neon_magenta", biome: "Disco", color: "#ff00ff", walkable: true, temp: 75, glow: true },
            { id: 615, name: "disco_strobe_white", biome: "Disco", color: "#ffffff", walkable: true, temp: 75, glow: true },
            // 616-680: More disco variations (all colors of the rainbow + patterns)
            ...Array.from({length: 65}, (_, i) => ({
                id: 616 + i,
                name: `disco_var_${i + 1}`,
                biome: "Disco",
                color: `#${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
                walkable: true,
                temp: 75,
                glow: i % 2 === 0
            }))
        ],
        
        // MUSHROOM/FUNGI (681-760)
        mushroom: [
            { id: 681, name: "mushroom_cap_red", biome: "Mushroom", color: "#ff0000", walkable: true, temp: 60, spores: true },
            { id: 682, name: "mushroom_cap_orange", biome: "Mushroom", color: "#ff8c00", walkable: true, temp: 60, spores: true },
            { id: 683, name: "mushroom_cap_yellow", biome: "Mushroom", color: "#ffff00", walkable: true, temp: 60, spores: true },
            { id: 684, name: "mushroom_cap_green", biome: "Mushroom", color: "#32cd32", walkable: true, temp: 60, spores: true },
            { id: 685, name: "mushroom_cap_blue", biome: "Mushroom", color: "#1e90ff", walkable: true, temp: 60, spores: true },
            { id: 686, name: "mushroom_cap_purple", biome: "Mushroom", color: "#9370db", walkable: true, temp: 60, spores: true },
            { id: 687, name: "mushroom_cap_pink", biome: "Mushroom", color: "#ff69b4", walkable: true, temp: 60, spores: true },
            { id: 688, name: "mushroom_stem_white", biome: "Mushroom", color: "#f5f5f5", walkable: true, temp: 60 },
            { id: 689, name: "mushroom_stem_brown", biome: "Mushroom", color: "#8b4513", walkable: true, temp: 60 },
            { id: 690, name: "mushroom_gills_dark", biome: "Mushroom", color: "#2f2f2f", walkable: true, temp: 60 },
            { id: 691, name: "mycelium_white", biome: "Mushroom", color: "#fffff0", walkable: true, temp: 58, spores: true },
            { id: 692, name: "mycelium_blue", biome: "Mushroom", color: "#add8e6", walkable: true, temp: 58, spores: true },
            { id: 693, name: "fungus_glowing_green", biome: "Mushroom", color: "#39ff14", walkable: true, temp: 60, glow: true },
            { id: 694, name: "fungus_glowing_blue", biome: "Mushroom", color: "#00bfff", walkable: true, temp: 60, glow: true },
            { id: 695, name: "spore_cloud_purple", biome: "Mushroom", color: "#dda0dd", walkable: true, temp: 60, spores: true },
            { id: 696, name: "toadstool_spotted", biome: "Mushroom", color: "#ff4500", walkable: true, temp: 60 },
            { id: 697, name: "puffball_giant", biome: "Mushroom", color: "#fafad2", walkable: true, temp: 60, spores: true },
            { id: 698, name: "bracket_fungus", biome: "Mushroom", color: "#cd853f", walkable: false, temp: 60 },
            { id: 699, name: "mushroom_bioluminescent", biome: "Mushroom", color: "#7fffd4", walkable: true, temp: 60, glow: true },
            { id: 700, name: "mushroom_toxic_yellow", biome: "Mushroom", color: "#ffff54", walkable: true, temp: 60, toxic: true },
            // 701-760: More mushroom variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 701 + i,
                name: `mushroom_var_${i + 1}`,
                biome: "Mushroom",
                color: `#${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
                walkable: true,
                temp: Math.floor(Math.random() * 10 + 55),
                spores: i % 3 === 0,
                glow: i % 5 === 0
            }))
        ],
        
        // ROBOT/CYBER (761-840)
        robot: [
            { id: 761, name: "metal_floor_steel", biome: "Robot", color: "#b0c4de", walkable: true, temp: 70, electric: true },
            { id: 762, name: "metal_floor_chrome", biome: "Robot", color: "#c0c0c0", walkable: true, temp: 70, electric: true },
            { id: 763, name: "metal_grate_01", biome: "Robot", color: "#696969", walkable: true, temp: 70 },
            { id: 764, name: "metal_grate_02", biome: "Robot", color: "#708090", walkable: true, temp: 70 },
            { id: 765, name: "circuit_board_green", biome: "Robot", color: "#00ff00", walkable: true, temp: 80, electric: true },
            { id: 766, name: "circuit_board_blue", biome: "Robot", color: "#0000ff", walkable: true, temp: 80, electric: true },
            { id: 767, name: "led_floor_red", biome: "Robot", color: "#ff0000", walkable: true, temp: 75, glow: true },
            { id: 768, name: "led_floor_cyan", biome: "Robot", color: "#00ffff", walkable: true, temp: 75, glow: true },
            { id: 769, name: "hologram_platform", biome: "Robot", color: "#7fffd4", walkable: true, temp: 70, glow: true },
            { id: 770, name: "wire_bundle_red", biome: "Robot", color: "#dc143c", walkable: false, temp: 90, electric: true },
            { id: 771, name: "wire_bundle_blue", biome: "Robot", color: "#4169e1", walkable: false, temp: 90, electric: true },
            { id: 772, name: "neon_grid_pink", biome: "Robot", color: "#ff1493", walkable: true, temp: 75, glow: true },
            { id: 773, name: "neon_grid_green", biome: "Robot", color: "#00ff7f", walkable: true, temp: 75, glow: true },
            { id: 774, name: "server_rack_floor", biome: "Robot", color: "#2f4f4f", walkable: false, temp: 85 },
            { id: 775, name: "power_core_blue", biome: "Robot", color: "#1e90ff", walkable: false, temp: 200, glow: true, electric: true },
            { id: 776, name: "plasma_tile_purple", biome: "Robot", color: "#9370db", walkable: true, temp: 150, glow: true },
            { id: 777, name: "datastream_floor", biome: "Robot", color: "#00ced1", walkable: true, temp: 70, glow: true },
            { id: 778, name: "cyber_hex_tile", biome: "Robot", color: "#ff00ff", walkable: true, temp: 70, glow: true },
            { id: 779, name: "scanner_floor_red", biome: "Robot", color: "#ff4500", walkable: true, temp: 70, glow: true },
            { id: 780, name: "titanium_panel", biome: "Robot", color: "#8c92ac", walkable: true, temp: 70 },
            // 781-840: More robot/cyber variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 781 + i,
                name: `robot_var_${i + 1}`,
                biome: "Robot",
                color: `#${Math.floor(Math.random() * 100 + 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 150 + 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}`,
                walkable: i % 5 !== 0,
                temp: Math.floor(Math.random() * 50 + 60),
                electric: i % 3 === 0,
                glow: i % 4 === 0
            }))
        ],
        
        // VALENTINE'S DAY (841-920)
        valentine: [
            { id: 841, name: "heart_tile_red", biome: "Valentine", color: "#ff0000", walkable: true, temp: 70, love: true },
            { id: 842, name: "heart_tile_pink", biome: "Valentine", color: "#ff69b4", walkable: true, temp: 70, love: true },
            { id: 843, name: "heart_tile_white", biome: "Valentine", color: "#ffffff", walkable: true, temp: 70, love: true },
            { id: 844, name: "rose_petals_red", biome: "Valentine", color: "#dc143c", walkable: true, temp: 70 },
            { id: 845, name: "rose_petals_pink", biome: "Valentine", color: "#ffb6c1", walkable: true, temp: 70 },
            { id: 846, name: "chocolate_tile_brown", biome: "Valentine", color: "#8b4513", walkable: true, temp: 70 },
            { id: 847, name: "chocolate_tile_dark", biome: "Valentine", color: "#654321", walkable: true, temp: 70 },
            { id: 848, name: "candy_heart_pink", biome: "Valentine", color: "#ff1493", walkable: true, temp: 70, sweet: true },
            { id: 849, name: "candy_heart_purple", biome: "Valentine", color: "#da70d6", walkable: true, temp: 70, sweet: true },
            { id: 850, name: "lace_tile_white", biome: "Valentine", color: "#fffaf0", walkable: true, temp: 70 },
            { id: 851, name: "ribbon_tile_red", biome: "Valentine", color: "#ff0040", walkable: true, temp: 70 },
            { id: 852, name: "ribbon_tile_pink", biome: "Valentine", color: "#ff77ff", walkable: true, temp: 70 },
            { id: 853, name: "cupid_gold", biome: "Valentine", color: "#ffd700", walkable: true, temp: 70, love: true },
            { id: 854, name: "sparkle_romantic", biome: "Valentine", color: "#ff82ab", walkable: true, temp: 70, glow: true },
            { id: 855, name: "velvet_tile_red", biome: "Valentine", color: "#990000", walkable: true, temp: 70 },
            { id: 856, name: "satin_tile_pink", biome: "Valentine", color: "#ffc0cb", walkable: true, temp: 70 },
            { id: 857, name: "love_letter_tile", biome: "Valentine", color: "#fff8dc", walkable: true, temp: 70 },
            { id: 858, name: "cherub_cloud_pink", biome: "Valentine", color: "#ffb3d9", walkable: true, temp: 70 },
            { id: 859, name: "champagne_bubble", biome: "Valentine", color: "#f5f5dc", walkable: true, temp: 70, glow: true },
            { id: 860, name: "diamond_ring_sparkle", biome: "Valentine", color: "#e0e0e0", walkable: true, temp: 70, glow: true },
            // 861-920: More valentine variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 861 + i,
                name: `valentine_var_${i + 1}`,
                biome: "Valentine",
                color: `#ff${Math.floor(Math.random() * 150 + 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}`,
                walkable: true,
                temp: 70,
                love: i % 4 === 0,
                sweet: i % 5 === 0
            }))
        ],
        
        // CHRISTMAS (921-1000)
        christmas: [
            { id: 921, name: "snow_christmas_fresh", biome: "Christmas", color: "#fffafa", walkable: true, temp: 20, festive: true },
            { id: 922, name: "snow_christmas_sparkle", biome: "Christmas", color: "#f0f8ff", walkable: true, temp: 20, glow: true },
            { id: 923, name: "ice_christmas_blue", biome: "Christmas", color: "#b0e0e6", walkable: true, temp: 15, festive: true },
            { id: 924, name: "red_christmas_tile", biome: "Christmas", color: "#ff0000", walkable: true, temp: 65, festive: true },
            { id: 925, name: "green_christmas_tile", biome: "Christmas", color: "#006400", walkable: true, temp: 65, festive: true },
            { id: 926, name: "gold_christmas_tile", biome: "Christmas", color: "#ffd700", walkable: true, temp: 65, glow: true },
            { id: 927, name: "silver_christmas_tile", biome: "Christmas", color: "#c0c0c0", walkable: true, temp: 65, glow: true },
            { id: 928, name: "ornament_floor_red", biome: "Christmas", color: "#dc143c", walkable: true, temp: 65, festive: true },
            { id: 929, name: "ornament_floor_blue", biome: "Christmas", color: "#4169e1", walkable: true, temp: 65, festive: true },
            { id: 930, name: "tinsel_silver", biome: "Christmas", color: "#d3d3d3", walkable: true, temp: 65, glow: true },
            { id: 931, name: "tinsel_gold", biome: "Christmas", color: "#ffdf00", walkable: true, temp: 65, glow: true },
            { id: 932, name: "candy_cane_stripe", biome: "Christmas", color: "#ff0000", walkable: true, temp: 65, sweet: true },
            { id: 933, name: "gingerbread_tile", biome: "Christmas", color: "#8b4513", walkable: true, temp: 65, sweet: true },
            { id: 934, name: "holly_leaf_green", biome: "Christmas", color: "#228b22", walkable: true, temp: 60, festive: true },
            { id: 935, name: "holly_berry_red", biome: "Christmas", color: "#ff0000", walkable: true, temp: 60, festive: true },
            { id: 936, name: "mistletoe_green", biome: "Christmas", color: "#90ee90", walkable: true, temp: 60, festive: true },
            { id: 937, name: "wreath_tile", biome: "Christmas", color: "#2e8b57", walkable: true, temp: 65, festive: true },
            { id: 938, name: "star_christmas_gold", biome: "Christmas", color: "#ffd700", walkable: true, temp: 65, glow: true },
            { id: 939, name: "lights_string_multi", biome: "Christmas", color: "#ff00ff", walkable: true, temp: 65, glow: true },
            { id: 940, name: "fireplace_tile_warm", biome: "Christmas", color: "#ff6347", walkable: true, temp: 85, festive: true },
            // 941-1000: More christmas variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 941 + i,
                name: `christmas_var_${i + 1}`,
                biome: "Christmas",
                color: i % 2 === 0 ? `#ff${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}` : `#${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100 + 150).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}`,
                walkable: true,
                temp: i % 3 === 0 ? 20 : 65,
                festive: true,
                glow: i % 3 === 0
            }))
        ],
        
        // HALLOWEEN (1001-1080)
        halloween: [
            { id: 1001, name: "pumpkin_tile_orange", biome: "Halloween", color: "#ff7518", walkable: true, temp: 60, spooky: true },
            { id: 1002, name: "pumpkin_tile_dark", biome: "Halloween", color: "#d2691e", walkable: true, temp: 60, spooky: true },
            { id: 1003, name: "jack_o_lantern_glow", biome: "Halloween", color: "#ffa500", walkable: true, temp: 60, glow: true, spooky: true },
            { id: 1004, name: "graveyard_dirt", biome: "Halloween", color: "#3e2723", walkable: true, temp: 55, spooky: true },
            { id: 1005, name: "tombstone_grey", biome: "Halloween", color: "#696969", walkable: false, temp: 55, spooky: true },
            { id: 1006, name: "haunted_fog_purple", biome: "Halloween", color: "#9370db", walkable: true, temp: 50, spooky: true },
            { id: 1007, name: "haunted_fog_green", biome: "Halloween", color: "#90ee90", walkable: true, temp: 50, spooky: true, glow: true },
            { id: 1008, name: "cobweb_tile", biome: "Halloween", color: "#d3d3d3", walkable: true, temp: 60, spooky: true },
            { id: 1009, name: "spider_web_dark", biome: "Halloween", color: "#2f4f4f", walkable: true, temp: 60, spooky: true },
            { id: 1010, name: "blood_splatter", biome: "Halloween", color: "#8b0000", walkable: true, temp: 60, spooky: true },
            { id: 1011, name: "bone_tile_white", biome: "Halloween", color: "#fff8dc", walkable: true, temp: 55, spooky: true },
            { id: 1012, name: "skull_pattern_tile", biome: "Halloween", color: "#f5f5dc", walkable: true, temp: 55, spooky: true },
            { id: 1013, name: "cauldron_green_glow", biome: "Halloween", color: "#00ff00", walkable: false, temp: 80, glow: true, spooky: true },
            { id: 1014, name: "witch_purple_tile", biome: "Halloween", color: "#663399", walkable: true, temp: 60, spooky: true },
            { id: 1015, name: "bat_cave_dark", biome: "Halloween", color: "#1c1c1c", walkable: true, temp: 50, spooky: true },
            { id: 1016, name: "moonlight_silver", biome: "Halloween", color: "#c0c0c0", walkable: true, temp: 50, glow: true },
            { id: 1017, name: "ghost_ectoplasm", biome: "Halloween", color: "#e0ffff", walkable: true, temp: 45, spooky: true, glow: true },
            { id: 1018, name: "candy_corn_tile", biome: "Halloween", color: "#ffff00", walkable: true, temp: 60, sweet: true },
            { id: 1019, name: "trick_treat_tile", biome: "Halloween", color: "#ff8c00", walkable: true, temp: 60, sweet: true },
            { id: 1020, name: "potion_bottle_purple", biome: "Halloween", color: "#8b008b", walkable: false, temp: 60, glow: true, spooky: true },
            // 1021-1080: More halloween variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 1021 + i,
                name: `halloween_var_${i + 1}`,
                biome: "Halloween",
                color: i % 3 === 0 ? `#ff${Math.floor(Math.random() * 150 + 50).toString(16).padStart(2, '0')}00` : i % 3 === 1 ? `#${Math.floor(Math.random() * 100 + 100).toString(16).padStart(2, '0')}00${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}` : `#${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}`,
                walkable: i % 6 !== 0,
                temp: Math.floor(Math.random() * 30 + 45),
                spooky: true,
                glow: i % 4 === 0
            }))
        ],
        
        // EASTER (1081-1160)
        easter: [
            { id: 1081, name: "egg_tile_pink", biome: "Easter", color: "#ffb3d9", walkable: true, temp: 68, festive: true },
            { id: 1082, name: "egg_tile_blue", biome: "Easter", color: "#add8e6", walkable: true, temp: 68, festive: true },
            { id: 1083, name: "egg_tile_yellow", biome: "Easter", color: "#ffff99", walkable: true, temp: 68, festive: true },
            { id: 1084, name: "egg_tile_green", biome: "Easter", color: "#90ee90", walkable: true, temp: 68, festive: true },
            { id: 1085, name: "egg_tile_purple", biome: "Easter", color: "#dda0dd", walkable: true, temp: 68, festive: true },
            { id: 1086, name: "basket_weave_brown", biome: "Easter", color: "#8b7355", walkable: true, temp: 68, festive: true },
            { id: 1087, name: "grass_easter_spring", biome: "Easter", color: "#7cfc00", walkable: true, temp: 68, festive: true },
            { id: 1088, name: "flower_tulip_pink", biome: "Easter", color: "#ff1493", walkable: true, temp: 68, festive: true },
            { id: 1089, name: "flower_tulip_yellow", biome: "Easter", color: "#ffd700", walkable: true, temp: 68, festive: true },
            { id: 1090, name: "flower_daffodil", biome: "Easter", color: "#ffff00", walkable: true, temp: 68, festive: true },
            { id: 1091, name: "bunny_track_white", biome: "Easter", color: "#fffff0", walkable: true, temp: 68, festive: true },
            { id: 1092, name: "carrot_patch_orange", biome: "Easter", color: "#ff7f50", walkable: true, temp: 68, festive: true },
            { id: 1093, name: "jelly_bean_red", biome: "Easter", color: "#ff0000", walkable: true, temp: 68, sweet: true },
            { id: 1094, name: "jelly_bean_green", biome: "Easter", color: "#00ff00", walkable: true, temp: 68, sweet: true },
            { id: 1095, name: "jelly_bean_blue", biome: "Easter", color: "#0000ff", walkable: true, temp: 68, sweet: true },
            { id: 1096, name: "chocolate_bunny_brown", biome: "Easter", color: "#8b4513", walkable: true, temp: 68, sweet: true },
            { id: 1097, name: "marshmallow_peep_pink", biome: "Easter", color: "#ffb6c1", walkable: true, temp: 68, sweet: true },
            { id: 1098, name: "marshmallow_peep_yellow", biome: "Easter", color: "#ffffe0", walkable: true, temp: 68, sweet: true },
            { id: 1099, name: "ribbon_bow_pastel", biome: "Easter", color: "#e6e6fa", walkable: true, temp: 68, festive: true },
            { id: 1100, name: "spring_rain_puddle", biome: "Easter", color: "#b0e0e6", walkable: true, temp: 68, festive: true },
            // 1101-1160: More easter variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 1101 + i,
                name: `easter_var_${i + 1}`,
                biome: "Easter",
                color: `#${Math.floor(Math.random() * 100 + 150).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100 + 150).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100 + 150).toString(16).padStart(2, '0')}`,
                walkable: true,
                temp: 68,
                festive: true,
                sweet: i % 4 === 0
            }))
        ],
        
        // CANDY/SWEETS (1161-1240)
        candy: [
            { id: 1161, name: "candy_floor_pink", biome: "Candy", color: "#ff69b4", walkable: true, temp: 70, sweet: true },
            { id: 1162, name: "candy_floor_blue", biome: "Candy", color: "#87ceeb", walkable: true, temp: 70, sweet: true },
            { id: 1163, name: "lollipop_swirl_red", biome: "Candy", color: "#ff0000", walkable: true, temp: 70, sweet: true },
            { id: 1164, name: "lollipop_swirl_rainbow", biome: "Candy", color: "#ff00ff", walkable: true, temp: 70, sweet: true },
            { id: 1165, name: "gummy_bear_red", biome: "Candy", color: "#dc143c", walkable: true, temp: 70, sweet: true },
            { id: 1166, name: "gummy_bear_green", biome: "Candy", color: "#32cd32", walkable: true, temp: 70, sweet: true },
            { id: 1167, name: "licorice_black", biome: "Candy", color: "#1c1c1c", walkable: true, temp: 70, sweet: true },
            { id: 1168, name: "licorice_red", biome: "Candy", color: "#8b0000", walkable: true, temp: 70, sweet: true },
            { id: 1169, name: "cotton_candy_pink", biome: "Candy", color: "#ffb3de", walkable: true, temp: 70, sweet: true },
            { id: 1170, name: "cotton_candy_blue", biome: "Candy", color: "#add8e6", walkable: true, temp: 70, sweet: true },
            { id: 1171, name: "gumdrop_tile_red", biome: "Candy", color: "#ff1493", walkable: true, temp: 70, sweet: true },
            { id: 1172, name: "gumdrop_tile_green", biome: "Candy", color: "#00ff7f", walkable: true, temp: 70, sweet: true },
            { id: 1173, name: "chocolate_river", biome: "Candy", color: "#654321", walkable: false, temp: 75, sweet: true },
            { id: 1174, name: "frosting_white", biome: "Candy", color: "#fffff0", walkable: true, temp: 70, sweet: true },
            { id: 1175, name: "frosting_pink", biome: "Candy", color: "#ffb6c1", walkable: true, temp: 70, sweet: true },
            { id: 1176, name: "sprinkles_multi", biome: "Candy", color: "#ff00ff", walkable: true, temp: 70, sweet: true },
            { id: 1177, name: "jawbreaker_tile", biome: "Candy", color: "#ff4500", walkable: true, temp: 70, sweet: true },
            { id: 1178, name: "taffy_stretched_pink", biome: "Candy", color: "#ffc0cb", walkable: true, temp: 70, sweet: true },
            { id: 1179, name: "mint_tile_green", biome: "Candy", color: "#98ff98", walkable: true, temp: 68, sweet: true },
            { id: 1180, name: "caramel_golden", biome: "Candy", color: "#daa520", walkable: true, temp: 75, sweet: true },
            // 1181-1240: More candy variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 1181 + i,
                name: `candy_var_${i + 1}`,
                biome: "Candy",
                color: `#${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
                walkable: i % 7 !== 0,
                temp: Math.floor(Math.random() * 10 + 68),
                sweet: true
            }))
        ],
        
        // SPACE/COSMIC (1241-1320)
        space: [
            { id: 1241, name: "space_void_black", biome: "Space", color: "#000000", walkable: true, temp: -270, cosmic: true },
            { id: 1242, name: "space_void_deep", biome: "Space", color: "#0a0a0a", walkable: true, temp: -270, cosmic: true },
            { id: 1243, name: "nebula_purple", biome: "Space", color: "#9370db", walkable: true, temp: -100, glow: true, cosmic: true },
            { id: 1244, name: "nebula_pink", biome: "Space", color: "#ff1493", walkable: true, temp: -100, glow: true, cosmic: true },
            { id: 1245, name: "nebula_blue", biome: "Space", color: "#1e90ff", walkable: true, temp: -100, glow: true, cosmic: true },
            { id: 1246, name: "star_field_white", biome: "Space", color: "#ffffff", walkable: true, temp: 5000, glow: true, cosmic: true },
            { id: 1247, name: "star_field_yellow", biome: "Space", color: "#ffff00", walkable: true, temp: 6000, glow: true, cosmic: true },
            { id: 1248, name: "star_field_blue", biome: "Space", color: "#00bfff", walkable: true, temp: 10000, glow: true, cosmic: true },
            { id: 1249, name: "asteroid_grey", biome: "Space", color: "#696969", walkable: true, temp: -200, cosmic: true },
            { id: 1250, name: "asteroid_brown", biome: "Space", color: "#8b4513", walkable: true, temp: -200, cosmic: true },
            { id: 1251, name: "moon_rock_grey", biome: "Space", color: "#a9a9a9", walkable: true, temp: -180, cosmic: true },
            { id: 1252, name: "moon_dust_light", biome: "Space", color: "#d3d3d3", walkable: true, temp: -180, cosmic: true },
            { id: 1253, name: "solar_flare_orange", biome: "Space", color: "#ff4500", walkable: false, temp: 15000, glow: true, cosmic: true },
            { id: 1254, name: "solar_wind_yellow", biome: "Space", color: "#ffd700", walkable: true, temp: 10000, glow: true, cosmic: true },
            { id: 1255, name: "comet_trail_cyan", biome: "Space", color: "#00ffff", walkable: true, temp: -250, glow: true, cosmic: true },
            { id: 1256, name: "galaxy_swirl_purple", biome: "Space", color: "#8b00ff", walkable: true, temp: -200, glow: true, cosmic: true },
            { id: 1257, name: "black_hole_edge", biome: "Space", color: "#1c1c1c", walkable: false, temp: -273, cosmic: true },
            { id: 1258, name: "plasma_field_green", biome: "Space", color: "#00ff00", walkable: true, temp: 5000, glow: true, cosmic: true },
            { id: 1259, name: "cosmic_dust_red", biome: "Space", color: "#8b0000", walkable: true, temp: -220, cosmic: true },
            { id: 1260, name: "wormhole_portal", biome: "Space", color: "#ff00ff", walkable: true, temp: 0, glow: true, cosmic: true },
            // 1261-1320: More space variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 1261 + i,
                name: `space_var_${i + 1}`,
                biome: "Space",
                color: i % 4 === 0 ? "#000000" : `#${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 150 + 50).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
                walkable: i % 6 !== 0,
                temp: i % 3 === 0 ? Math.floor(Math.random() * 15000) : Math.floor(Math.random() * 200 - 270),
                glow: i % 3 === 0,
                cosmic: true
            }))
        ],
        
        // CRYSTAL (1321-1400)
        crystal: [
            { id: 1321, name: "crystal_clear", biome: "Crystal", color: "#e0ffff", walkable: true, temp: 60, glow: true },
            { id: 1322, name: "crystal_pink", biome: "Crystal", color: "#ffb6c1", walkable: true, temp: 60, glow: true },
            { id: 1323, name: "crystal_purple", biome: "Crystal", color: "#9370db", walkable: true, temp: 60, glow: true },
            { id: 1324, name: "crystal_blue", biome: "Crystal", color: "#1e90ff", walkable: true, temp: 60, glow: true },
            { id: 1325, name: "crystal_green", biome: "Crystal", color: "#00ff7f", walkable: true, temp: 60, glow: true },
            { id: 1326, name: "crystal_red", biome: "Crystal", color: "#ff0000", walkable: true, temp: 60, glow: true },
            { id: 1327, name: "crystal_yellow", biome: "Crystal", color: "#ffff00", walkable: true, temp: 60, glow: true },
            { id: 1328, name: "crystal_orange", biome: "Crystal", color: "#ffa500", walkable: true, temp: 60, glow: true },
            { id: 1329, name: "crystal_cluster_white", biome: "Crystal", color: "#f0f8ff", walkable: false, temp: 60, glow: true },
            { id: 1330, name: "crystal_geode_purple", biome: "Crystal", color: "#8b008b", walkable: false, temp: 60, glow: true },
            { id: 1331, name: "quartz_rose", biome: "Crystal", color: "#ff1493", walkable: true, temp: 60, glow: true },
            { id: 1332, name: "quartz_smoky", biome: "Crystal", color: "#696969", walkable: true, temp: 60 },
            { id: 1333, name: "amethyst_deep", biome: "Crystal", color: "#9966cc", walkable: true, temp: 60, glow: true },
            { id: 1334, name: "emerald_green", biome: "Crystal", color: "#50c878", walkable: true, temp: 60, glow: true },
            { id: 1335, name: "ruby_red", biome: "Crystal", color: "#e0115f", walkable: true, temp: 60, glow: true },
            { id: 1336, name: "sapphire_blue", biome: "Crystal", color: "#0f52ba", walkable: true, temp: 60, glow: true },
            { id: 1337, name: "topaz_golden", biome: "Crystal", color: "#ffc87c", walkable: true, temp: 60, glow: true },
            { id: 1338, name: "diamond_brilliant", biome: "Crystal", color: "#ffffff", walkable: true, temp: 60, glow: true },
            { id: 1339, name: "opal_rainbow", biome: "Crystal", color: "#a8c3bc", walkable: true, temp: 60, glow: true },
            { id: 1340, name: "jade_green", biome: "Crystal", color: "#00a86b", walkable: true, temp: 60, glow: true },
            // 1341-1400: More crystal variations
            ...Array.from({length: 60}, (_, i) => ({
                id: 1341 + i,
                name: `crystal_var_${i + 1}`,
                biome: "Crystal",
                color: `#${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}`,
                walkable: i % 5 !== 0,
                temp: 60,
                glow: i % 2 === 0
            }))
        ]
    },
    
    // ============================================
    // SPECIAL/MISC BIOMES (Tiles 1401-2048)
    // ============================================
    
    specialBiomes: {
        // UNDERWATER (1401-1480)
        underwater: [
            { id: 1401, name: "ocean_floor_sand", biome: "Underwater", color: "#daa520", walkable: true, temp: 45, moisture: 100 },
            { id: 1402, name: "ocean_floor_rock", biome: "Underwater", color: "#696969", walkable: true, temp: 43, moisture: 100 },
            { id: 1403, name: "coral_reef_pink", biome: "Underwater", color: "#ff69b4", walkable: false, temp: 72, moisture: 100 },
            { id: 1404, name: "coral_reef_orange", biome: "Underwater", color: "#ff8c00", walkable: false, temp: 72, moisture: 100 },
            { id: 1405, name: "kelp_forest_green", biome: "Underwater", color: "#2e8b57", walkable: true, temp: 55, moisture: 100 },
            { id: 1406, name: "seaweed_dark", biome: "Underwater", color: "#006400", walkable: true, temp: 52, moisture: 100 },
            { id: 1407, name: "bioluminescent_blue", biome: "Underwater", color: "#00bfff", walkable: true, temp: 50, glow: true, moisture: 100 },
            { id: 1408, name: "bioluminescent_green", biome: "Underwater", color: "#39ff14", walkable: true, temp: 50, glow: true, moisture: 100 },
            { id: 1409, name: "anemone_purple", biome: "Underwater", color: "#9370db", walkable: false, temp: 68, moisture: 100 },
            { id: 1410, name: "sea_sponge_yellow", biome: "Underwater", color: "#ffff00", walkable: false, temp: 65, moisture: 100 },
            ...Array.from({length: 70}, (_, i) => ({
                id: 1411 + i,
                name: `underwater_var_${i + 1}`,
                biome: "Underwater",
                color: `#${Math.floor(Math.random() * 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 150 + 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}`,
                walkable: i % 4 !== 0,
                temp: Math.floor(Math.random() * 30 + 40),
                moisture: 100,
                glow: i % 5 === 0
            }))
        ],
        
        // RAINBOW (1481-1560)
        rainbow: [
            { id: 1481, name: "rainbow_red", biome: "Rainbow", color: "#ff0000", walkable: true, temp: 70, glow: true },
            { id: 1482, name: "rainbow_orange", biome: "Rainbow", color: "#ff7f00", walkable: true, temp: 70, glow: true },
            { id: 1483, name: "rainbow_yellow", biome: "Rainbow", color: "#ffff00", walkable: true, temp: 70, glow: true },
            { id: 1484, name: "rainbow_green", biome: "Rainbow", color: "#00ff00", walkable: true, temp: 70, glow: true },
            { id: 1485, name: "rainbow_blue", biome: "Rainbow", color: "#0000ff", walkable: true, temp: 70, glow: true },
            { id: 1486, name: "rainbow_indigo", biome: "Rainbow", color: "#4b0082", walkable: true, temp: 70, glow: true },
            { id: 1487, name: "rainbow_violet", biome: "Rainbow", color: "#8b00ff", walkable: true, temp: 70, glow: true },
            ...Array.from({length: 73}, (_, i) => ({
                id: 1488 + i,
                name: `rainbow_var_${i + 1}`,
                biome: "Rainbow",
                color: `#${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
                walkable: true,
                temp: 70,
                glow: true
            }))
        ],
        
        // NEON/VAPORWAVE (1561-1640)
        neon: [
            { id: 1561, name: "neon_pink_grid", biome: "Neon", color: "#ff1493", walkable: true, temp: 75, glow: true },
            { id: 1562, name: "neon_cyan_grid", biome: "Neon", color: "#00ffff", walkable: true, temp: 75, glow: true },
            { id: 1563, name: "neon_purple_wave", biome: "Neon", color: "#8b00ff", walkable: true, temp: 75, glow: true },
            { id: 1564, name: "vaporwave_pink", biome: "Neon", color: "#ff69b4", walkable: true, temp: 75, glow: true },
            { id: 1565, name: "vaporwave_blue", biome: "Neon", color: "#87ceeb", walkable: true, temp: 75, glow: true },
            { id: 1566, name: "synthwave_sunset", biome: "Neon", color: "#ff00ff", walkable: true, temp: 75, glow: true },
            ...Array.from({length: 74}, (_, i) => ({
                id: 1567 + i,
                name: `neon_var_${i + 1}`,
                biome: "Neon",
                color: `#${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 150).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
                walkable: true,
                temp: 75,
                glow: true
            }))
        ],
        
        // ALIEN/EXOTIC (1641-1720)
        alien: [
            { id: 1641, name: "alien_ground_purple", biome: "Alien", color: "#9370db", walkable: true, temp: 85, exotic: true },
            { id: 1642, name: "alien_ground_green", biome: "Alien", color: "#00ff7f", walkable: true, temp: 82, exotic: true, glow: true },
            { id: 1643, name: "alien_crystal_blue", biome: "Alien", color: "#00bfff", walkable: false, temp: 70, exotic: true, glow: true },
            { id: 1644, name: "alien_slime_green", biome: "Alien", color: "#32cd32", walkable: true, temp: 78, exotic: true },
            { id: 1645, name: "alien_rock_teal", biome: "Alien", color: "#008080", walkable: true, temp: 75, exotic: true },
            ...Array.from({length: 75}, (_, i) => ({
                id: 1646 + i,
                name: `alien_var_${i + 1}`,
                biome: "Alien",
                color: `#${Math.floor(Math.random() * 150).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200 + 50).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 200).toString(16).padStart(2, '0')}`,
                walkable: i % 5 !== 0,
                temp: Math.floor(Math.random() * 40 + 60),
                exotic: true,
                glow: i % 3 === 0
            }))
        ],
        
        // WASTELAND (1721-1800)
        wasteland: [
            { id: 1721, name: "wasteland_dirt_dry", biome: "Wasteland", color: "#8b7d6b", walkable: true, temp: 95, moisture: 5 },
            { id: 1722, name: "wasteland_dirt_cracked", biome: "Wasteland", color: "#7a6f5d", walkable: true, temp: 98, moisture: 3 },
            { id: 1723, name: "wasteland_sand_grey", biome: "Wasteland", color: "#a9a9a9", walkable: true, temp: 100, moisture: 2 },
            { id: 1724, name: "wasteland_rock_barren", biome: "Wasteland", color: "#696969", walkable: true, temp: 92, moisture: 5 },
            { id: 1725, name: "wasteland_toxic_green", biome: "Wasteland", color: "#9acd32", walkable: true, temp: 88, toxic: true },
            ...Array.from({length: 75}, (_, i) => ({
                id: 1726 + i,
                name: `wasteland_var_${i + 1}`,
                biome: "Wasteland",
                color: `#${Math.floor(Math.random() * 100 + 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100 + 90).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 80 + 70).toString(16).padStart(2, '0')}`,
                walkable: i % 6 !== 0,
                temp: Math.floor(Math.random() * 25 + 85),
                moisture: Math.floor(Math.random() * 8),
                toxic: i % 7 === 0
            }))
        ],
        
        // JUNGLE (1801-1880)
        jungle: [
            { id: 1801, name: "jungle_grass_thick", biome: "Jungle", color: "#228b22", walkable: true, temp: 85, moisture: 90 },
            { id: 1802, name: "jungle_moss_wet", biome: "Jungle", color: "#2e8b57", walkable: true, temp: 83, moisture: 92 },
            { id: 1803, name: "jungle_mud_deep", biome: "Jungle", color: "#3e2723", walkable: true, temp: 84, moisture: 95 },
            { id: 1804, name: "jungle_vines_green", biome: "Jungle", color: "#00ff00", walkable: true, temp: 82, moisture: 88 },
            { id: 1805, name: "jungle_flower_exotic", biome: "Jungle", color: "#ff1493", walkable: true, temp: 85, moisture: 85 },
            ...Array.from({length: 75}, (_, i) => ({
                id: 1806 + i,
                name: `jungle_var_${i + 1}`,
                biome: "Jungle",
                color: `#${Math.floor(Math.random() * 60 + 20).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100 + 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 60 + 20).toString(16).padStart(2, '0')}`,
                walkable: i % 7 !== 0,
                temp: Math.floor(Math.random() * 15 + 78),
                moisture: Math.floor(Math.random() * 20 + 75)
            }))
        ],
        
        // STEAMPUNK (1881-1960)
        steampunk: [
            { id: 1881, name: "brass_gears_tile", biome: "Steampunk", color: "#b87333", walkable: true, temp: 80, mechanical: true },
            { id: 1882, name: "copper_pipe_floor", biome: "Steampunk", color: "#b87333", walkable: true, temp: 85, mechanical: true },
            { id: 1883, name: "iron_rivet_plate", biome: "Steampunk", color: "#696969", walkable: true, temp: 75, mechanical: true },
            { id: 1884, name: "bronze_clockwork", biome: "Steampunk", color: "#cd7f32", walkable: true, temp: 80, mechanical: true },
            { id: 1885, name: "steam_vent_tile", biome: "Steampunk", color: "#e0e0e0", walkable: true, temp: 120 },
            ...Array.from({length: 75}, (_, i) => ({
                id: 1886 + i,
                name: `steampunk_var_${i + 1}`,
                biome: "Steampunk",
                color: `#${Math.floor(Math.random() * 100 + 100).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 80 + 80).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 60 + 30).toString(16).padStart(2, '0')}`,
                walkable: i % 6 !== 0,
                temp: Math.floor(Math.random() * 60 + 70),
                mechanical: i % 3 === 0
            }))
        ],
        
        // RUINS/ANCIENT (1961-2048)
        ruins: [
            { id: 1961, name: "ruins_stone_mossy", biome: "Ruins", color: "#556b2f", walkable: true, temp: 65, ancient: true },
            { id: 1962, name: "ruins_stone_cracked", biome: "Ruins", color: "#696969", walkable: true, temp: 65, ancient: true },
            { id: 1963, name: "ruins_tile_broken", biome: "Ruins", color: "#8b7355", walkable: true, temp: 65, ancient: true },
            { id: 1964, name: "ruins_marble_white", biome: "Ruins", color: "#f5f5dc", walkable: true, temp: 65, ancient: true },
            { id: 1965, name: "ruins_gold_faded", biome: "Ruins", color: "#b8860b", walkable: true, temp: 65, ancient: true },
            ...Array.from({length: 83}, (_, i) => ({
                id: 1966 + i,
                name: `ruins_var_${i + 1}`,
                biome: "Ruins",
                color: `#${Math.floor(Math.random() * 100 + 80).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 100 + 80).toString(16).padStart(2, '0')}${Math.floor(Math.random() * 80 + 60).toString(16).padStart(2, '0')}`,
                walkable: i % 5 !== 0,
                temp: Math.floor(Math.random() * 20 + 60),
                ancient: true
            }))
        ]
    },
    
    // Helper functions
    getTileById(id) {
        // Search through all biome categories
        for (const category of Object.values(this.standardBiomes)) {
            const tile = category.find(t => t.id === id);
            if (tile) return tile;
        }
        for (const category of Object.values(this.themedBiomes)) {
            const tile = category.find(t => t.id === id);
            if (tile) return tile;
        }
        for (const category of Object.values(this.specialBiomes)) {
            const tile = category.find(t => t.id === id);
            if (tile) return tile;
        }
        return null;
    },
    
    getTilesByBiome(biomeName) {
        const tiles = [];
        // Search all categories
        for (const category of Object.values(this.standardBiomes)) {
            tiles.push(...category.filter(t => t.biome === biomeName));
        }
        for (const category of Object.values(this.themedBiomes)) {
            tiles.push(...category.filter(t => t.biome === biomeName));
        }
        for (const category of Object.values(this.specialBiomes)) {
            tiles.push(...category.filter(t => t.biome === biomeName));
        }
        return tiles;
    },
    
    getRandomTileFromBiome(biomeName) {
        const tiles = this.getTilesByBiome(biomeName);
        if (tiles.length === 0) return null;
        return tiles[Math.floor(Math.random() * tiles.length)];
    },
    
    getAllBiomes() {
        const biomes = new Set();
        const addBiomes = (categories) => {
            for (const category of Object.values(categories)) {
                for (const tile of category) {
                    biomes.add(tile.biome);
                }
            }
        };
        addBiomes(this.standardBiomes);
        addBiomes(this.themedBiomes);
        addBiomes(this.specialBiomes);
        return Array.from(biomes);
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TILE_LIBRARY;
}