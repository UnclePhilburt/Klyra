// KLYRA VEGETATION SYSTEM - Trees and Flora with Wind Animation
// Handles procedural vegetation placement and rendering

class VegetationSystem {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.trees = new Map(); // Key: "chunkX,chunkY", Value: array of trees
        this.animationTime = 0;
        this.windSpeed = 0.0008; // Much slower wind animation
        this.windStrength = 0.008; // Much subtler wind movement - realistic not cartoony
        
        // Comprehensive tree definitions - MASSIVE VARIETY with realistic rendering
        this.treeTypes = {
            // FORESTS - Mixed variety
            Forest: [
                { name: 'Oak', trunkColor: '#4a3820', trunkWidth: 22, trunkHeight: 105, crownColor: '#2d5016', crownRadius: 72, crownHeight: 90, density: 0.0037, windSensitivity: 0.3 },
                { name: 'Maple', trunkColor: '#5a4830', trunkWidth: 20, trunkHeight: 100, crownColor: '#3a5a20', crownRadius: 68, crownHeight: 85, density: 0.0030, windSensitivity: 0.32 },
                { name: 'Birch', trunkColor: '#e8e8e8', trunkWidth: 14, trunkHeight: 90, crownColor: '#3a6a2a', crownRadius: 50, crownHeight: 72, density: 0.0045, windSensitivity: 0.38 },
                { name: 'Ash', trunkColor: '#6a5a48', trunkWidth: 18, trunkHeight: 95, crownColor: '#2a5a1a', crownRadius: 60, crownHeight: 80, density: 0.0025, windSensitivity: 0.28 },
                { name: 'Elm', trunkColor: '#5a4a38', trunkWidth: 21, trunkHeight: 108, crownColor: '#3a6a28', crownRadius: 70, crownHeight: 88, density: 0.0032, windSensitivity: 0.3 },
                { name: 'Pine', trunkColor: '#3a2810', trunkWidth: 16, trunkHeight: 120, crownColor: '#1a3a1a', crownRadius: 48, crownHeight: 108, shape: 'triangle', density: 0.0035, windSensitivity: 0.22 }
            ],
            
            OakForest: [
                { name: 'Giant Oak', trunkColor: '#4a3820', trunkWidth: 28, trunkHeight: 115, crownColor: '#2d5016', crownRadius: 85, crownHeight: 95, density: 0.0030, windSensitivity: 0.2 },
                { name: 'Old Oak', trunkColor: '#3a2810', trunkWidth: 25, trunkHeight: 105, crownColor: '#2a4a16', crownRadius: 78, crownHeight: 90, density: 0.0037, windSensitivity: 0.22 },
                { name: 'Red Oak', trunkColor: '#5a3828', trunkWidth: 22, trunkHeight: 98, crownColor: '#3a4a20', crownRadius: 70, crownHeight: 85, density: 0.0045, windSensitivity: 0.28 },
                { name: 'White Oak', trunkColor: '#6a5848', trunkWidth: 24, trunkHeight: 102, crownColor: '#3a5a24', crownRadius: 75, crownHeight: 88, density: 0.0035, windSensitivity: 0.25 }
            ],
            
            PineForest: [
                { name: 'Norwegian Spruce', trunkColor: '#3a2810', trunkWidth: 18, trunkHeight: 135, crownColor: '#1a3a1a', crownRadius: 50, crownHeight: 120, shape: 'triangle', density: 0.0040, windSensitivity: 0.18 },
                { name: 'Douglas Fir', trunkColor: '#4a3820', trunkWidth: 20, trunkHeight: 140, crownColor: '#1a3a20', crownRadius: 52, crownHeight: 125, shape: 'triangle', density: 0.0035, windSensitivity: 0.2 },
                { name: 'Pine', trunkColor: '#3a2a18', trunkWidth: 16, trunkHeight: 118, crownColor: '#1a3a1a', crownRadius: 48, crownHeight: 105, shape: 'triangle', density: 0.0045, windSensitivity: 0.22 },
                { name: 'Scots Pine', trunkColor: '#5a4a38', trunkWidth: 17, trunkHeight: 110, crownColor: '#2a4a2a', crownRadius: 46, crownHeight: 98, shape: 'triangle', density: 0.0037, windSensitivity: 0.24 }
            ],
            
            DenseForest: [
                { name: 'Dark Oak', trunkColor: '#2a1808', trunkWidth: 22, trunkHeight: 100, crownColor: '#1a3010', crownRadius: 72, crownHeight: 88, density: 0.0070, windSensitivity: 0.25 },
                { name: 'Shadow Maple', trunkColor: '#3a2818', trunkWidth: 20, trunkHeight: 95, crownColor: '#1a3a14', crownRadius: 68, crownHeight: 82, density: 0.0075, windSensitivity: 0.28 },
                { name: 'Deep Pine', trunkColor: '#2a2010', trunkWidth: 16, trunkHeight: 125, crownColor: '#0a2a0a', crownRadius: 50, crownHeight: 112, shape: 'triangle', density: 0.0063, windSensitivity: 0.2 },
                { name: 'Forest Giant', trunkColor: '#4a3820', trunkWidth: 26, trunkHeight: 110, crownColor: '#2a4a18', crownRadius: 80, crownHeight: 92, density: 0.0050, windSensitivity: 0.22 }
            ],
            
            Taiga: [
                { name: 'Black Spruce', trunkColor: '#2a2018', trunkWidth: 15, trunkHeight: 115, crownColor: '#1a2a1a', crownRadius: 45, crownHeight: 102, shape: 'triangle', density: 0.0050, windSensitivity: 0.2 },
                { name: 'White Spruce', trunkColor: '#4a4038', trunkWidth: 16, trunkHeight: 120, crownColor: '#2a3a2a', crownRadius: 48, crownHeight: 108, shape: 'triangle', density: 0.0045, windSensitivity: 0.22 },
                { name: 'Larch', trunkColor: '#5a4a38', trunkWidth: 14, trunkHeight: 105, crownColor: '#2a4a2a', crownRadius: 42, crownHeight: 95, shape: 'triangle', density: 0.0037, windSensitivity: 0.25 },
                { name: 'Taiga Fir', trunkColor: '#3a2a20', trunkWidth: 15, trunkHeight: 110, crownColor: '#1a3a20', crownRadius: 44, crownHeight: 98, shape: 'triangle', density: 0.0043, windSensitivity: 0.22 }
            ],
            
            // GRASSLANDS - Fruit and ornamental trees
            Plains: [
                { name: 'Apple Tree', trunkColor: '#5a4a38', trunkWidth: 15, trunkHeight: 65, crownColor: '#4a7a3a', crownRadius: 50, crownHeight: 58, density: 0.0020, windSensitivity: 0.35 },
                { name: 'Pear Tree', trunkColor: '#6a5a48', trunkWidth: 14, trunkHeight: 68, crownColor: '#3a6a2a', crownRadius: 48, crownHeight: 60, density: 0.0018, windSensitivity: 0.38 },
                { name: 'Cherry Tree', trunkColor: '#4a3828', trunkWidth: 13, trunkHeight: 60, crownColor: '#5a7a4a', crownRadius: 45, crownHeight: 55, density: 0.0022, windSensitivity: 0.4 },
                { name: 'Plum Tree', trunkColor: '#5a4830', trunkWidth: 12, trunkHeight: 58, crownColor: '#4a6a3a', crownRadius: 42, crownHeight: 52, density: 0.0025, windSensitivity: 0.42 },
                { name: 'Oak Sapling', trunkColor: '#5a4830', trunkWidth: 10, trunkHeight: 48, crownColor: '#4a7a3a', crownRadius: 35, crownHeight: 42, density: 0.0030, windSensitivity: 0.45 },
                { name: 'Bush', trunkColor: '#3a5a2a', trunkWidth: 8, trunkHeight: 22, crownColor: '#3a6a2a', crownRadius: 30, crownHeight: 30, density: 0.0037, windSensitivity: 0.5 }
            ],
            
            Grassland: [
                { name: 'Lone Oak', trunkColor: '#5a4830', trunkWidth: 18, trunkHeight: 78, crownColor: '#4a7a3a', crownRadius: 58, crownHeight: 68, density: 0.0015, windSensitivity: 0.3 },
                { name: 'Walnut Tree', trunkColor: '#4a3820', trunkWidth: 16, trunkHeight: 72, crownColor: '#3a6a28', crownRadius: 54, crownHeight: 62, density: 0.0013, windSensitivity: 0.32 },
                { name: 'Chestnut', trunkColor: '#5a4a38', trunkWidth: 17, trunkHeight: 75, crownColor: '#3a5a28', crownRadius: 56, crownHeight: 65, density: 0.0018, windSensitivity: 0.35 },
                { name: 'Hawthorn', trunkColor: '#6a5a48', trunkWidth: 11, trunkHeight: 45, crownColor: '#4a6a38', crownRadius: 38, crownHeight: 42, density: 0.0025, windSensitivity: 0.4 },
                { name: 'Wild Bush', trunkColor: '#3a5a2a', trunkWidth: 7, trunkHeight: 18, crownColor: '#4a7a4a', crownRadius: 28, crownHeight: 28, density: 0.0045, windSensitivity: 0.52 }
            ],
            
            Meadow: [
                { name: 'Weeping Willow', trunkColor: '#5a5a3a', trunkWidth: 16, trunkHeight: 85, crownColor: '#3a6a3a', crownRadius: 68, crownHeight: 72, density: 0.0015, windSensitivity: 0.45 },
                { name: 'Flowering Dogwood', trunkColor: '#6a5a48', trunkWidth: 12, trunkHeight: 52, crownColor: '#5a8a5a', crownRadius: 45, crownHeight: 48, density: 0.0030, windSensitivity: 0.4 },
                { name: 'Magnolia', trunkColor: '#5a4a38', trunkWidth: 14, trunkHeight: 58, crownColor: '#4a7a48', crownRadius: 50, crownHeight: 52, density: 0.0020, windSensitivity: 0.38 },
                { name: 'Peach Tree', trunkColor: '#6a5840', trunkWidth: 13, trunkHeight: 55, crownColor: '#5a7a4a', crownRadius: 46, crownHeight: 50, density: 0.0025, windSensitivity: 0.42 },
                { name: 'Flower Bush', trunkColor: '#3a5a2a', trunkWidth: 6, trunkHeight: 16, crownColor: '#4a8a4a', crownRadius: 25, crownHeight: 25, density: 0.0063, windSensitivity: 0.55 }
            ],
            
            Prairie: [
                { name: 'Acacia', trunkColor: '#6a5840', trunkWidth: 12, trunkHeight: 68, crownColor: '#5a7a4a', crownRadius: 50, crownHeight: 58, density: 0.0018, windSensitivity: 0.35 },
                { name: 'Honey Locust', trunkColor: '#7a6850', trunkWidth: 14, trunkHeight: 70, crownColor: '#4a6a3a', crownRadius: 48, crownHeight: 60, density: 0.0015, windSensitivity: 0.32 },
                { name: 'Mesquite', trunkColor: '#5a4830', trunkWidth: 10, trunkHeight: 45, crownColor: '#4a5a30', crownRadius: 40, crownHeight: 42, density: 0.0022, windSensitivity: 0.38 },
                { name: 'Scrub Oak', trunkColor: '#4a4a2a', trunkWidth: 9, trunkHeight: 38, crownColor: '#5a6a3a', crownRadius: 35, crownHeight: 38, density: 0.0030, windSensitivity: 0.45 },
                { name: 'Tumbleweed Bush', trunkColor: '#6a5a48', trunkWidth: 6, trunkHeight: 15, crownColor: '#7a6a50', crownRadius: 22, crownHeight: 22, density: 0.0050, windSensitivity: 0.6 }
            ],
            
            // DESERTS - Cacti and dead trees
            Desert: [
                { name: 'Saguaro Cactus', trunkColor: '#4a7a4a', trunkWidth: 26, trunkHeight: 95, crownColor: '#4a7a4a', crownRadius: 26, crownHeight: 95, shape: 'cactus', density: 0.0010, windSensitivity: 0.05 },
                { name: 'Barrel Cactus', trunkColor: '#5a8a5a', trunkWidth: 20, trunkHeight: 45, crownColor: '#5a8a5a', crownRadius: 20, crownHeight: 45, shape: 'cactus', density: 0.0020, windSensitivity: 0.03 },
                { name: 'Dead Tree', trunkColor: '#5a4a3a', trunkWidth: 15, trunkHeight: 75, crownColor: '#4a3a2a', crownRadius: 38, crownHeight: 38, shape: 'dead', density: 0.0015, windSensitivity: 0.25 },
                { name: 'Skeletal Tree', trunkColor: '#6a5a4a', trunkWidth: 12, trunkHeight: 62, crownColor: '#5a4a3a', crownRadius: 30, crownHeight: 30, shape: 'dead', density: 0.0013, windSensitivity: 0.28 }
            ],
            
            SandDesert: [
                { name: 'Giant Saguaro', trunkColor: '#4a8a5a', trunkWidth: 30, trunkHeight: 110, crownColor: '#4a8a5a', crownRadius: 30, crownHeight: 110, shape: 'cactus', density: 0.0008, windSensitivity: 0.02 },
                { name: 'Tall Cactus', trunkColor: '#5a7a5a', trunkWidth: 24, trunkHeight: 88, crownColor: '#5a7a5a', crownRadius: 24, crownHeight: 88, shape: 'cactus', density: 0.0013, windSensitivity: 0.04 },
                { name: 'Prickly Pear', trunkColor: '#4a7a4a', trunkWidth: 18, trunkHeight: 35, crownColor: '#4a7a4a', crownRadius: 18, crownHeight: 35, shape: 'cactus', density: 0.0025, windSensitivity: 0.06 },
                { name: 'Bleached Bones Tree', trunkColor: '#8a8a7a', trunkWidth: 10, trunkHeight: 55, crownColor: '#7a7a6a', crownRadius: 28, crownHeight: 28, shape: 'dead', density: 0.0010, windSensitivity: 0.3 }
            ],
            
            RockDesert: [
                { name: 'Stone Cactus', trunkColor: '#5a7a5a', trunkWidth: 22, trunkHeight: 70, crownColor: '#5a7a5a', crownRadius: 22, crownHeight: 70, shape: 'cactus', density: 0.0010, windSensitivity: 0.06 },
                { name: 'Joshua Tree', trunkColor: '#6a7a6a', trunkWidth: 16, trunkHeight: 65, crownColor: '#5a6a4a', crownRadius: 40, crownHeight: 45, shape: 'dead', density: 0.0013, windSensitivity: 0.22 },
                { name: 'Twisted Dead', trunkColor: '#6a5a4a', trunkWidth: 13, trunkHeight: 60, crownColor: '#6a5a4a', crownRadius: 30, crownHeight: 30, shape: 'dead', density: 0.0015, windSensitivity: 0.28 }
            ],
            
            Dunes: [
                { name: 'Dune Cactus', trunkColor: '#4a7a5a', trunkWidth: 20, trunkHeight: 65, crownColor: '#4a7a5a', crownRadius: 20, crownHeight: 65, shape: 'cactus', density: 0.0005, windSensitivity: 0.08 },
                { name: 'Sand Bush', trunkColor: '#7a6a5a', trunkWidth: 8, trunkHeight: 25, crownColor: '#8a7a6a', crownRadius: 22, crownHeight: 22, shape: 'dead', density: 0.0013, windSensitivity: 0.4 }
            ],
            
            Savanna: [
                { name: 'Baobab', trunkColor: '#7a6a5a', trunkWidth: 35, trunkHeight: 80, crownColor: '#5a7a4a', crownRadius: 75, crownHeight: 68, density: 0.0010, windSensitivity: 0.18 },
                { name: 'Umbrella Acacia', trunkColor: '#6a5840', trunkWidth: 14, trunkHeight: 72, crownColor: '#5a7a4a', crownRadius: 60, crownHeight: 48, density: 0.0020, windSensitivity: 0.32 },
                { name: 'African Acacia', trunkColor: '#5a4830', trunkWidth: 12, trunkHeight: 68, crownColor: '#4a6a3a', crownRadius: 52, crownHeight: 55, density: 0.0025, windSensitivity: 0.35 },
                { name: 'Whistling Thorn', trunkColor: '#6a5a48', trunkWidth: 10, trunkHeight: 48, crownColor: '#5a6a40', crownRadius: 38, crownHeight: 42, density: 0.0030, windSensitivity: 0.4 }
            ],
            
            // COLD BIOMES
            Snow: [
                { name: 'Snowy Spruce', trunkColor: '#2a2020', trunkWidth: 18, trunkHeight: 118, crownColor: '#e8f0f8', crownRadius: 52, crownHeight: 105, shape: 'triangle', density: 0.0030, windSensitivity: 0.18 },
                { name: 'Frost Pine', trunkColor: '#3a3030', trunkWidth: 16, trunkHeight: 105, crownColor: '#d8e8f0', crownRadius: 48, crownHeight: 95, shape: 'triangle', density: 0.0035, windSensitivity: 0.2 },
                { name: 'Ice Tree', trunkColor: '#4a4848', trunkWidth: 15, trunkHeight: 95, crownColor: '#c8d8e8', crownRadius: 45, crownHeight: 85, shape: 'triangle', density: 0.0040, windSensitivity: 0.22 },
                { name: 'Winter Birch', trunkColor: '#d8d8d8', trunkWidth: 13, trunkHeight: 80, crownColor: '#e0e8f0', crownRadius: 42, crownHeight: 70, density: 0.0025, windSensitivity: 0.25 }
            ],
            
            Tundra: [
                { name: 'Dwarf Pine', trunkColor: '#3a3020', trunkWidth: 12, trunkHeight: 52, crownColor: '#2a3a2a', crownRadius: 36, crownHeight: 48, shape: 'triangle', density: 0.0022, windSensitivity: 0.28 },
                { name: 'Arctic Willow', trunkColor: '#4a4030', trunkWidth: 9, trunkHeight: 32, crownColor: '#3a4a3a', crownRadius: 28, crownHeight: 30, density: 0.0030, windSensitivity: 0.4 },
                { name: 'Tundra Shrub', trunkColor: '#5a5040', trunkWidth: 7, trunkHeight: 18, crownColor: '#4a5a4a', crownRadius: 22, crownHeight: 22, density: 0.0037, windSensitivity: 0.48 }
            ],
            
            IceField: [
                { name: 'Frozen Pine', trunkColor: '#3a3a40', trunkWidth: 14, trunkHeight: 75, crownColor: '#d0e0f0', crownRadius: 42, crownHeight: 68, shape: 'triangle', density: 0.0008, windSensitivity: 0.15 },
                { name: 'Ice Spike Tree', trunkColor: '#c0d0e0', trunkWidth: 10, trunkHeight: 60, crownColor: '#e0f0ff', crownRadius: 35, crownHeight: 55, shape: 'triangle', density: 0.0005, windSensitivity: 0.1 }
            ],
            
            // COASTAL & WETLANDS
            Beach: [
                { name: 'Coconut Palm', trunkColor: '#8a6a4a', trunkWidth: 16, trunkHeight: 120, crownColor: '#3a6a2a', crownRadius: 65, crownHeight: 52, shape: 'palm', density: 0.0013, windSensitivity: 0.5 },
                { name: 'Date Palm', trunkColor: '#7a5a3a', trunkWidth: 15, trunkHeight: 110, crownColor: '#3a5a2a', crownRadius: 60, crownHeight: 48, shape: 'palm', density: 0.0015, windSensitivity: 0.48 },
                { name: 'Fan Palm', trunkColor: '#6a5a4a', trunkWidth: 14, trunkHeight: 95, crownColor: '#4a6a3a', crownRadius: 55, crownHeight: 45, shape: 'palm', density: 0.0018, windSensitivity: 0.52 }
            ],
            
            Swamp: [
                { name: 'Cypress', trunkColor: '#4a4a3a', trunkWidth: 20, trunkHeight: 105, crownColor: '#2a4a2a', crownRadius: 58, crownHeight: 82, density: 0.0037, windSensitivity: 0.25 },
                { name: 'Mangrove', trunkColor: '#5a4a38', trunkWidth: 16, trunkHeight: 75, crownColor: '#3a5a2a', crownRadius: 50, crownHeight: 65, density: 0.0045, windSensitivity: 0.3 },
                { name: 'Swamp Oak', trunkColor: '#3a3828', trunkWidth: 18, trunkHeight: 88, crownColor: '#2a4a20', crownRadius: 55, crownHeight: 72, density: 0.0030, windSensitivity: 0.28 },
                { name: 'Bog Tree', trunkColor: '#4a4a38', trunkWidth: 14, trunkHeight: 70, crownColor: '#3a4a28', crownRadius: 48, crownHeight: 62, density: 0.0050, windSensitivity: 0.32 }
            ],
            
            Wetland: [
                { name: 'Swamp Willow', trunkColor: '#5a5a48', trunkWidth: 15, trunkHeight: 78, crownColor: '#3a5a38', crownRadius: 60, crownHeight: 68, density: 0.0030, windSensitivity: 0.4 },
                { name: 'Water Birch', trunkColor: '#d8d8c8', trunkWidth: 12, trunkHeight: 65, crownColor: '#4a6a48', crownRadius: 48, crownHeight: 58, density: 0.0037, windSensitivity: 0.38 },
                { name: 'Reed Cluster', trunkColor: '#5a6a5a', trunkWidth: 8, trunkHeight: 35, crownColor: '#4a5a48', crownRadius: 30, crownHeight: 35, density: 0.0063, windSensitivity: 0.55 }
            ],
            
            // MOUNTAINS
            Mountain: [
                { name: 'Mountain Pine', trunkColor: '#3a2a1a', trunkWidth: 18, trunkHeight: 105, crownColor: '#2a4a2a', crownRadius: 46, crownHeight: 92, shape: 'triangle', density: 0.0020, windSensitivity: 0.2 },
                { name: 'Alpine Fir', trunkColor: '#4a3a28', trunkWidth: 16, trunkHeight: 95, crownColor: '#1a3a1a', crownRadius: 42, crownHeight: 85, shape: 'triangle', density: 0.0025, windSensitivity: 0.22 },
                { name: 'Stone Pine', trunkColor: '#5a5a48', trunkWidth: 14, trunkHeight: 85, crownColor: '#2a3a2a', crownRadius: 40, crownHeight: 75, shape: 'triangle', density: 0.0018, windSensitivity: 0.25 }
            ],
            
            Foothills: [
                { name: 'Foothill Oak', trunkColor: '#5a4a38', trunkWidth: 17, trunkHeight: 82, crownColor: '#3a5a2a', crownRadius: 56, crownHeight: 72, density: 0.0030, windSensitivity: 0.3 },
                { name: 'Hill Pine', trunkColor: '#4a3828', trunkWidth: 15, trunkHeight: 90, crownColor: '#2a4a2a', crownRadius: 44, crownHeight: 80, shape: 'triangle', density: 0.0025, windSensitivity: 0.25 },
                { name: 'Cedar', trunkColor: '#6a5840', trunkWidth: 16, trunkHeight: 88, crownColor: '#2a4a28', crownRadius: 48, crownHeight: 78, shape: 'triangle', density: 0.0022, windSensitivity: 0.22 }
            ],
            
            Peaks: [
                { name: 'Peak Pine', trunkColor: '#3a3a38', trunkWidth: 14, trunkHeight: 70, crownColor: '#2a3a2a', crownRadius: 38, crownHeight: 65, shape: 'triangle', density: 0.0013, windSensitivity: 0.18 },
                { name: 'Wind-Bent Tree', trunkColor: '#4a4a48', trunkWidth: 12, trunkHeight: 55, crownColor: '#3a4a3a', crownRadius: 35, crownHeight: 48, shape: 'triangle', density: 0.0015, windSensitivity: 0.15 }
            ],
            
            Volcanic: [
                { name: 'Lava Tree', trunkColor: '#2a1a1a', trunkWidth: 18, trunkHeight: 75, crownColor: '#4a2a1a', crownRadius: 48, crownHeight: 65, shape: 'dead', density: 0.0008, windSensitivity: 0.2 },
                { name: 'Charred Pine', trunkColor: '#1a1a1a', trunkWidth: 14, trunkHeight: 68, crownColor: '#3a2a2a', crownRadius: 40, crownHeight: 58, shape: 'triangle', density: 0.0010, windSensitivity: 0.22 },
                { name: 'Obsidian Cactus', trunkColor: '#2a2a2a', trunkWidth: 22, trunkHeight: 60, crownColor: '#2a2a2a', crownRadius: 22, crownHeight: 60, shape: 'cactus', density: 0.0005, windSensitivity: 0.05 }
            ],
            
            // THEMED BIOMES - Fun and creative
            Disco: [
                { name: 'Neon Palm', trunkColor: '#ff00ff', trunkWidth: 14, trunkHeight: 95, crownColor: '#00ffff', crownRadius: 60, crownHeight: 50, shape: 'palm', density: 0.0030, windSensitivity: 0.6 },
                { name: 'Glitter Tree', trunkColor: '#ffff00', trunkWidth: 16, trunkHeight: 80, crownColor: '#ff00ff', crownRadius: 55, crownHeight: 70, density: 0.0037, windSensitivity: 0.5 },
                { name: 'Disco Ball Tree', trunkColor: '#c0c0c0', trunkWidth: 12, trunkHeight: 65, crownColor: '#ffffff', crownRadius: 48, crownHeight: 60, density: 0.0025, windSensitivity: 0.45 }
            ],
            
            Mushroom: [
                { name: 'Giant Mushroom', trunkColor: '#d8a8a8', trunkWidth: 25, trunkHeight: 85, crownColor: '#ff6060', crownRadius: 70, crownHeight: 65, density: 0.0045, windSensitivity: 0.35 },
                { name: 'Blue Mushroom', trunkColor: '#a8a8d8', trunkWidth: 20, trunkHeight: 70, crownColor: '#6060ff', crownRadius: 60, crownHeight: 58, density: 0.0050, windSensitivity: 0.4 },
                { name: 'Spotted Mushroom', trunkColor: '#c8c8a8', trunkWidth: 18, trunkHeight: 62, crownColor: '#ffff88', crownRadius: 52, crownHeight: 50, density: 0.0037, windSensitivity: 0.38 }
            ],
            
            RobotCyber: [
                { name: 'Circuit Tree', trunkColor: '#00ff00', trunkWidth: 16, trunkHeight: 90, crownColor: '#00ffff', crownRadius: 50, crownHeight: 75, density: 0.0025, windSensitivity: 0.15 },
                { name: 'Data Tower', trunkColor: '#0080ff', trunkWidth: 14, trunkHeight: 100, crownColor: '#8000ff', crownRadius: 42, crownHeight: 85, shape: 'triangle', density: 0.0020, windSensitivity: 0.1 },
                { name: 'Holo-Tree', trunkColor: '#ff0080', trunkWidth: 12, trunkHeight: 75, crownColor: '#00ffff', crownRadius: 48, crownHeight: 65, density: 0.0030, windSensitivity: 0.2 }
            ],
            
            Valentine: [
                { name: 'Heart Tree', trunkColor: '#ff8080', trunkWidth: 18, trunkHeight: 82, crownColor: '#ff00ff', crownRadius: 65, crownHeight: 72, density: 0.0037, windSensitivity: 0.35 },
                { name: 'Rose Bush', trunkColor: '#ff6090', trunkWidth: 10, trunkHeight: 45, crownColor: '#ff0050', crownRadius: 40, crownHeight: 42, density: 0.0063, windSensitivity: 0.45 },
                { name: 'Love Oak', trunkColor: '#d06080', trunkWidth: 20, trunkHeight: 90, crownColor: '#ff80a0', crownRadius: 60, crownHeight: 78, density: 0.0030, windSensitivity: 0.3 }
            ],
            
            Christmas: [
                { name: 'Christmas Pine', trunkColor: '#2a4a2a', trunkWidth: 18, trunkHeight: 110, crownColor: '#00ff00', crownRadius: 52, crownHeight: 98, shape: 'triangle', density: 0.0050, windSensitivity: 0.2 },
                { name: 'Snow Fir', trunkColor: '#3a5a3a', trunkWidth: 16, trunkHeight: 98, crownColor: '#e8f0e8', crownRadius: 48, crownHeight: 88, shape: 'triangle', density: 0.0045, windSensitivity: 0.22 },
                { name: 'Holly Tree', trunkColor: '#4a3828', trunkWidth: 14, trunkHeight: 72, crownColor: '#ff0000', crownRadius: 50, crownHeight: 65, density: 0.0037, windSensitivity: 0.28 }
            ],
            
            Halloween: [
                { name: 'Spooky Oak', trunkColor: '#3a2a3a', trunkWidth: 22, trunkHeight: 95, crownColor: '#4a3a4a', crownRadius: 68, crownHeight: 82, density: 0.0037, windSensitivity: 0.3 },
                { name: 'Dead Haunted', trunkColor: '#2a2a2a', trunkWidth: 16, trunkHeight: 85, crownColor: '#3a3a3a', crownRadius: 45, crownHeight: 50, shape: 'dead', density: 0.0045, windSensitivity: 0.35 },
                { name: 'Twisted Horror', trunkColor: '#4a3a4a', trunkWidth: 18, trunkHeight: 90, crownColor: '#ff4500', crownRadius: 55, crownHeight: 75, shape: 'dead', density: 0.0030, windSensitivity: 0.28 },
                { name: 'Pumpkin Bush', trunkColor: '#ff8800', trunkWidth: 12, trunkHeight: 40, crownColor: '#ff6600', crownRadius: 38, crownHeight: 38, density: 0.0050, windSensitivity: 0.4 }
            ],
            
            Easter: [
                { name: 'Pastel Tree', trunkColor: '#ffb0d0', trunkWidth: 16, trunkHeight: 78, crownColor: '#ffd0ff', crownRadius: 58, crownHeight: 68, density: 0.0037, windSensitivity: 0.35 },
                { name: 'Egg Bush', trunkColor: '#d0ffff', trunkWidth: 10, trunkHeight: 42, crownColor: '#ffd0d0', crownRadius: 38, crownHeight: 40, density: 0.0063, windSensitivity: 0.45 },
                { name: 'Bunny Oak', trunkColor: '#ffe0c0', trunkWidth: 18, trunkHeight: 85, crownColor: '#ffc0e0', crownRadius: 62, crownHeight: 75, density: 0.0030, windSensitivity: 0.32 }
            ]
        };
    }
    
    // Generate trees for a chunk
    generateTreesForChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        
        // Don't regenerate if already exists
        if (this.trees.has(chunkKey)) {
            return;
        }
        
        const trees = [];
        const chunkWorldX = chunkX * CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        const chunkWorldY = chunkY * CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        const chunkPixelSize = CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        
        // Sample multiple points in the chunk to determine tree placement
        const samples = 8;
        const sampleSize = chunkPixelSize / samples;
        
        for (let sy = 0; sy < samples; sy++) {
            for (let sx = 0; sx < samples; sx++) {
                const worldX = chunkWorldX + sx * sampleSize + sampleSize / 2;
                const worldY = chunkWorldY + sy * sampleSize + sampleSize / 2;
                
                const biome = this.mapGenerator.getBiomeAt(worldX, worldY);
                const tileTypes = this.treeTypes[biome];
                
                if (!tileTypes) continue;
                
                // Check each tree type for this biome
                for (const treeType of tileTypes) {
                    // Use noise to determine if tree should be placed
                    const noise = UTILS.simpleNoise(
                        worldX / 100,
                        worldY / 100,
                        treeType.name.charCodeAt(0)
                    );
                    
                    if (noise > (1 - treeType.density)) {
                        // Random offset within sample area
                        const offsetX = (Math.random() - 0.5) * sampleSize * 0.8;
                        const offsetY = (Math.random() - 0.5) * sampleSize * 0.8;
                        
                        trees.push({
                            x: worldX + offsetX,
                            y: worldY + offsetY,
                            type: treeType,
                            windOffset: Math.random() * Math.PI * 2,
                            scale: 0.8 + Math.random() * 0.4,
                            // Collision box at tree base
                            collision: {
                                x: worldX + offsetX - (treeType.trunkWidth * 0.6),
                                y: worldY + offsetY - (treeType.trunkWidth * 0.6),
                                width: treeType.trunkWidth * 1.2,
                                height: treeType.trunkWidth * 1.2
                            }
                        });
                    }
                }
            }
        }
        
        this.trees.set(chunkKey, trees);
    }
    
    // Update animation time
    update(deltaTime) {
        this.animationTime += deltaTime * this.windSpeed;
    }
    
    // Get all visible trees for depth sorting
    getVisibleTrees(renderer) {
        const camX = renderer.cameraX;
        const camY = renderer.cameraY;
        const camW = renderer.canvas.width;
        const camH = renderer.canvas.height;
        
        const visibleTrees = [];
        
        // Increased buffer zone to render trees before they enter viewport
        // Prevents pop-in effect - trees smoothly appear from off-screen
        const buffer = 500; // Increased from 200 for smoother appearance
        
        // Get visible chunks with buffer zone
        const startChunkX = Math.floor((camX - buffer) / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE));
        const startChunkY = Math.floor((camY - buffer) / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE));
        const endChunkX = Math.ceil((camX + camW + buffer) / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE));
        const endChunkY = Math.ceil((camY + camH + buffer) / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE));
        
        // Collect trees from visible chunks
        for (let cx = startChunkX; cx <= endChunkX; cx++) {
            for (let cy = startChunkY; cy <= endChunkY; cy++) {
                const chunkKey = `${cx},${cy}`;
                const chunkTrees = this.trees.get(chunkKey);
                
                if (chunkTrees) {
                    for (const tree of chunkTrees) {
                        // Check if tree is in extended view (with buffer)
                        const treeSize = Math.max(tree.type.crownRadius * 2, tree.type.trunkHeight) * tree.scale;
                        const treeBounds = {
                            x: tree.x - treeSize,
                            y: tree.y - treeSize,
                            w: treeSize * 2,
                            h: treeSize * 2
                        };
                        
                        // Check if tree is within buffered viewport
                        if (!(treeBounds.x + treeBounds.w < camX - buffer ||
                              treeBounds.x > camX + camW + buffer ||
                              treeBounds.y + treeBounds.h < camY - buffer ||
                              treeBounds.y > camY + camH + buffer)) {
                            visibleTrees.push(tree);
                        }
                    }
                }
            }
        }
        
        return visibleTrees;
    }
    
    // Render trees in view (kept for backwards compatibility but now uses depth sorting in renderer)
    render(renderer) {
        const visibleTrees = this.getVisibleTrees(renderer);
        
        for (const tree of visibleTrees) {
            this.renderTree(renderer, tree);
        }
    }
    
    // Render a single tree with wind animation
    renderTree(renderer, tree) {
        const ctx = renderer.ctx;
        const type = tree.type;
        
        // Check if tree is in view
        const treeSize = Math.max(type.crownRadius * 2, type.trunkHeight) * tree.scale;
        if (!renderer.isInView(tree.x - treeSize, tree.y - treeSize, treeSize * 2, treeSize * 2)) {
            return;
        }
        
        // Calculate wind sway
        const windAngle = Math.sin(this.animationTime + tree.windOffset) * 
                         this.windStrength * 
                         type.windSensitivity;
        
        ctx.save();
        ctx.translate(tree.x, tree.y);
        
        // Apply wind rotation at the base
        ctx.rotate(windAngle);
        ctx.scale(tree.scale, tree.scale);
        
        // Render based on shape
        switch (type.shape) {
            case 'cactus':
                this.renderCactus(ctx, type);
                break;
            case 'palm':
                this.renderPalm(ctx, type);
                break;
            case 'triangle':
                this.renderPineTree(ctx, type);
                break;
            case 'dead':
                this.renderDeadTree(ctx, type);
                break;
            default:
                this.renderRoundTree(ctx, type);
        }
        
        ctx.restore();
    }
    
    // Render round-crowned tree (oak, birch, etc) - REALISTIC AAA QUALITY
    renderRoundTree(ctx, type) {
        const crownY = -type.trunkHeight - type.crownHeight / 2;
        
        // Soft realistic shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 6, type.trunkWidth + 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Trunk with natural taper and bark texture
        const trunkTop = -type.trunkHeight;
        const trunkBottom = 0;
        const trunkWidthTop = type.trunkWidth * 0.75;
        const trunkWidthBottom = type.trunkWidth;
        
        // Main trunk fill
        ctx.fillStyle = type.trunkColor;
        ctx.beginPath();
        ctx.moveTo(-trunkWidthBottom / 2, trunkBottom);
        ctx.lineTo(-trunkWidthTop / 2, trunkTop);
        ctx.lineTo(trunkWidthTop / 2, trunkTop);
        ctx.lineTo(trunkWidthBottom / 2, trunkBottom);
        ctx.closePath();
        ctx.fill();
        
        // Left side trunk shadow for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.moveTo(-trunkWidthBottom / 2, trunkBottom);
        ctx.lineTo(-trunkWidthTop / 2, trunkTop);
        ctx.lineTo(-trunkWidthTop / 2 + 3, trunkTop);
        ctx.lineTo(-trunkWidthBottom / 2 + 3, trunkBottom);
        ctx.closePath();
        ctx.fill();
        
        // Organic bark texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        const barkLines = Math.floor(type.trunkHeight / 15);
        for (let i = 1; i < barkLines; i++) {
            const y = trunkBottom - (i * type.trunkHeight / barkLines);
            const offset = Math.sin(i * 0.7) * 2;
            ctx.beginPath();
            ctx.moveTo(-trunkWidthBottom / 2 + 1 + offset, y);
            ctx.lineTo(trunkWidthBottom / 2 - 1 + offset, y);
            ctx.stroke();
        }
        
        // Vertical bark cracks
        for (let i = 0; i < 3; i++) {
            const xPos = -trunkWidthBottom / 2 + (i * trunkWidthBottom / 2);
            ctx.beginPath();
            ctx.moveTo(xPos, trunkBottom - 5);
            ctx.lineTo(xPos + (Math.sin(i) * 2), trunkTop + 10);
            ctx.stroke();
        }
        
        // Crown - layered organic clusters for realism
        // Dark shadow base layer
        ctx.fillStyle = this.darkenColor(type.crownColor, 35);
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const offsetX = Math.cos(angle) * type.crownRadius * 0.3;
            const offsetY = Math.sin(angle) * type.crownHeight * 0.15;
            ctx.beginPath();
            ctx.ellipse(
                offsetX + 3, 
                crownY + offsetY + 4, 
                type.crownRadius * 0.6, 
                type.crownHeight * 0.35, 
                angle * 0.3, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Mid-tone layer
        ctx.fillStyle = this.darkenColor(type.crownColor, 15);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + 0.5;
            const offsetX = Math.cos(angle) * type.crownRadius * 0.35;
            const offsetY = Math.sin(angle) * type.crownHeight * 0.2;
            ctx.beginPath();
            ctx.ellipse(
                offsetX + 1, 
                crownY + offsetY + 2, 
                type.crownRadius * 0.65, 
                type.crownHeight * 0.38, 
                angle * 0.4, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Main crown color layer
        ctx.fillStyle = type.crownColor;
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + 0.3;
            const offsetX = Math.cos(angle) * type.crownRadius * 0.38;
            const offsetY = Math.sin(angle) * type.crownHeight * 0.22;
            ctx.beginPath();
            ctx.ellipse(
                offsetX, 
                crownY + offsetY, 
                type.crownRadius * 0.68, 
                type.crownHeight * 0.4, 
                angle * 0.5, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Highlight clusters for sunlight effect
        ctx.fillStyle = this.lightenColor(type.crownColor, 25);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 - 0.8;
            const offsetX = Math.cos(angle) * type.crownRadius * 0.25;
            const offsetY = Math.sin(angle) * type.crownHeight * 0.15 - 8;
            ctx.beginPath();
            ctx.ellipse(
                offsetX, 
                crownY + offsetY, 
                type.crownRadius * 0.4, 
                type.crownHeight * 0.25, 
                angle * 0.3, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Bright highlight spots for realism
        ctx.fillStyle = this.lightenColor(type.crownColor, 40);
        for (let i = 0; i < 2; i++) {
            const angle = -1.2 + i * 0.5;
            const offsetX = Math.cos(angle) * type.crownRadius * 0.2;
            const offsetY = Math.sin(angle) * type.crownHeight * 0.12 - 12;
            ctx.beginPath();
            ctx.ellipse(
                offsetX, 
                crownY + offsetY, 
                type.crownRadius * 0.25, 
                type.crownHeight * 0.18, 
                angle * 0.2, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    // Render pine/conifer tree - REALISTIC with layered branches
    renderPineTree(ctx, type) {
        // Soft shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 6, type.trunkWidth + 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Trunk with natural taper
        const trunkTop = -type.trunkHeight;
        const trunkWidthTop = type.trunkWidth * 0.7;
        const trunkWidthBottom = type.trunkWidth;
        
        ctx.fillStyle = type.trunkColor;
        ctx.beginPath();
        ctx.moveTo(-trunkWidthBottom / 2, 0);
        ctx.lineTo(-trunkWidthTop / 2, trunkTop);
        ctx.lineTo(trunkWidthTop / 2, trunkTop);
        ctx.lineTo(trunkWidthBottom / 2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Trunk shadow side
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(-trunkWidthBottom / 2, 0);
        ctx.lineTo(-trunkWidthTop / 2, trunkTop);
        ctx.lineTo(-trunkWidthTop / 2 + 2, trunkTop);
        ctx.lineTo(-trunkWidthBottom / 2 + 2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Triangular crown in organic layers - more realistic
        const layers = 7;
        for (let i = 0; i < layers; i++) {
            const progress = i / layers;
            const layerY = trunkTop - (i * type.crownHeight / layers);
            const layerWidth = type.crownRadius * (1 - progress * 0.85);
            const nextLayerY = trunkTop - ((i + 1) * type.crownHeight / layers);
            
            // Shadow layer
            ctx.fillStyle = this.darkenColor(type.crownColor, 25 + i * 2);
            ctx.beginPath();
            ctx.moveTo(0, nextLayerY - (type.crownHeight / layers) * 0.3);
            ctx.lineTo(-layerWidth + 2, layerY + 3);
            ctx.lineTo(layerWidth + 2, layerY + 3);
            ctx.closePath();
            ctx.fill();
            
            // Main layer with slight irregularity
            const irregularity = Math.sin(i * 2.3) * 3;
            ctx.fillStyle = i % 2 === 0 ? type.crownColor : this.darkenColor(type.crownColor, 8);
            ctx.beginPath();
            ctx.moveTo(0, nextLayerY - (type.crownHeight / layers) * 0.3);
            ctx.lineTo(-layerWidth + irregularity, layerY);
            ctx.lineTo(layerWidth - irregularity, layerY);
            ctx.closePath();
            ctx.fill();
            
            // Highlight on sunny side
            if (i < layers - 1) {
                ctx.fillStyle = this.lightenColor(type.crownColor, 15);
                ctx.beginPath();
                ctx.moveTo(-2, nextLayerY - (type.crownHeight / layers) * 0.25);
                ctx.lineTo(-layerWidth * 0.6, layerY);
                ctx.lineTo(-layerWidth * 0.4, layerY);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    // Render cactus
    renderCactus(ctx, type) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 5, type.trunkWidth + 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main body
        ctx.fillStyle = type.trunkColor;
        ctx.fillRect(-type.trunkWidth / 2, -type.trunkHeight, type.trunkWidth, type.trunkHeight);
        
        // Arms
        const armWidth = type.trunkWidth * 0.6;
        const armHeight = type.trunkHeight * 0.4;
        
        // Left arm
        ctx.fillRect(-type.trunkWidth / 2 - armWidth, -type.trunkHeight * 0.6, armWidth, armHeight);
        ctx.fillRect(-type.trunkWidth / 2 - armWidth, -type.trunkHeight * 0.6 - armHeight / 2, armWidth, armHeight / 2);
        
        // Right arm
        ctx.fillRect(type.trunkWidth / 2, -type.trunkHeight * 0.7, armWidth, armHeight);
        ctx.fillRect(type.trunkWidth / 2, -type.trunkHeight * 0.7 - armHeight / 2, armWidth, armHeight / 2);
        
        // Spines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const y = -type.trunkHeight + (i * type.trunkHeight / 8);
            ctx.beginPath();
            ctx.moveTo(-type.trunkWidth / 2 - 2, y);
            ctx.lineTo(-type.trunkWidth / 2 + 2, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(type.trunkWidth / 2 - 2, y);
            ctx.lineTo(type.trunkWidth / 2 + 2, y);
            ctx.stroke();
        }
    }
    
    // Render palm tree
    renderPalm(ctx, type) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 5, type.trunkWidth + 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Curved trunk
        ctx.strokeStyle = type.trunkColor;
        ctx.lineWidth = type.trunkWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            type.trunkWidth * 1.5,
            -type.trunkHeight / 2,
            type.trunkWidth * 2,
            -type.trunkHeight
        );
        ctx.stroke();
        
        // Palm fronds
        const frondCount = 6;
        const frondLength = type.crownRadius * 1.5;
        ctx.fillStyle = type.crownColor;
        
        for (let i = 0; i < frondCount; i++) {
            const angle = (i / frondCount) * Math.PI * 2;
            ctx.save();
            ctx.translate(type.trunkWidth * 2, -type.trunkHeight);
            ctx.rotate(angle);
            
            // Frond shape
            ctx.beginPath();
            ctx.ellipse(frondLength / 2, 0, frondLength / 2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Render dead tree
    renderDeadTree(ctx, type) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 5, type.trunkWidth + 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Trunk
        ctx.strokeStyle = type.trunkColor;
        ctx.lineWidth = type.trunkWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -type.trunkHeight);
        ctx.stroke();
        
        // Dead branches
        ctx.lineWidth = type.trunkWidth * 0.5;
        
        // Left branch
        ctx.beginPath();
        ctx.moveTo(0, -type.trunkHeight * 0.6);
        ctx.lineTo(-type.crownRadius * 0.8, -type.trunkHeight * 0.7);
        ctx.stroke();
        
        // Right branch
        ctx.beginPath();
        ctx.moveTo(0, -type.trunkHeight * 0.7);
        ctx.lineTo(type.crownRadius * 0.6, -type.trunkHeight * 0.8);
        ctx.stroke();
        
        // Small twigs
        ctx.lineWidth = type.trunkWidth * 0.3;
        ctx.beginPath();
        ctx.moveTo(-type.crownRadius * 0.8, -type.trunkHeight * 0.7);
        ctx.lineTo(-type.crownRadius * 1.0, -type.trunkHeight * 0.75);
        ctx.stroke();
    }
    
    // Helper: Darken a color
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    // Helper: Lighten a color
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    // Clean up trees far from player
    cleanup(playerX, playerY, radius = 10000) {
        const toDelete = [];
        
        this.trees.forEach((trees, key) => {
            const [chunkX, chunkY] = key.split(',').map(Number);
            const chunkWorldX = chunkX * CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
            const chunkWorldY = chunkY * CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
            
            const distance = Math.sqrt(
                (chunkWorldX - playerX) ** 2 + 
                (chunkWorldY - playerY) ** 2
            );
            
            if (distance > radius) {
                toDelete.push(key);
            }
        });
        
        toDelete.forEach(key => this.trees.delete(key));
    }
    
    // Check collision with trees
    checkCollision(x, y, width = 16, height = 16) {
        // Get nearby chunks to check
        const chunkSize = CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        const centerChunkX = Math.floor(x / chunkSize);
        const centerChunkY = Math.floor(y / chunkSize);
        
        // Check current chunk and adjacent chunks
        for (let cy = centerChunkY - 1; cy <= centerChunkY + 1; cy++) {
            for (let cx = centerChunkX - 1; cx <= centerChunkX + 1; cx++) {
                const chunkKey = `${cx},${cy}`;
                const chunkTrees = this.trees.get(chunkKey);
                
                if (chunkTrees) {
                    for (const tree of chunkTrees) {
                        const collision = tree.collision;
                        
                        // Check AABB collision
                        if (x < collision.x + collision.width &&
                            x + width > collision.x &&
                            y < collision.y + collision.height &&
                            y + height > collision.y) {
                            return true; // Collision detected
                        }
                    }
                }
            }
        }
        
        return false; // No collision
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VegetationSystem;
}