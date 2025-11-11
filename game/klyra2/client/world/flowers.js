// KLYRA FLOWER SYSTEM - Complete Biome Coverage for ALL 44 Biomes
// Handles procedural flower placement and rendering

class FlowerSystem {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.flowers = new Map();
        this.animationTime = 0;
        this.windSpeed = 0.001;
        this.windStrength = 0.015;
        
        // Flower patch settings for clustering
        this.patchScale = 25; // How large each patch area is
        this.patchThreshold = 0.6; // Higher = fewer patches but denser
        
        this.flowerTypes = {
            // WATER BIOMES
            Ocean: [],
            DeepOcean: [],
            
            // BEACH
            Beach: [
                { name: 'Beach Rose', petalColor: '#ffaacc', centerColor: '#ffee88', stemColor: '#5a7a5a', height: 22, width: 18, petalCount: 5, density: 0.015, windSensitivity: 0.55 },
                { name: 'Sea Lavender', petalColor: '#bb99ff', centerColor: '#ffffff', stemColor: '#6a8a6a', height: 18, width: 14, petalCount: 8, density: 0.020, windSensitivity: 0.6 },
                { name: 'Beach Grass Bloom', petalColor: '#ffeecc', centerColor: '#ddaa66', stemColor: '#7a9a7a', height: 24, width: 12, petalCount: 3, density: 0.025, windSensitivity: 0.7 }
            ],
            
            // GRASSLANDS
            Plains: [
                { name: 'Black-Eyed Susan', petalColor: '#ffcc22', centerColor: '#553311', stemColor: '#4a7a3a', height: 28, width: 20, petalCount: 13, density: 0.030, windSensitivity: 0.5 },
                { name: 'Daisy', petalColor: '#ffffff', centerColor: '#ffee66', stemColor: '#4a7a3a', height: 22, width: 18, petalCount: 15, density: 0.040, windSensitivity: 0.6 },
                { name: 'Buttercup', petalColor: '#ffee44', centerColor: '#ffaa22', stemColor: '#3a6a2a', height: 18, width: 16, petalCount: 5, density: 0.045, windSensitivity: 0.65 },
                { name: 'Wild Rose', petalColor: '#ffaacc', centerColor: '#ffee88', stemColor: '#4a7a3a', height: 26, width: 20, petalCount: 5, density: 0.025, windSensitivity: 0.48 }
            ],
            
            Grassland: [
                { name: 'Goldenrod', petalColor: '#ffdd44', centerColor: '#ffaa22', stemColor: '#4a7a3a', height: 34, width: 16, petalCount: 20, density: 0.035, windSensitivity: 0.55 },
                { name: 'Clover', petalColor: '#ffddff', centerColor: '#dd99dd', stemColor: '#3a6a2a', height: 28, width: 28, petalCount: 3, density: 0.080, windSensitivity: 0.7 },
                { name: 'Dandelion', petalColor: '#ffee33', centerColor: '#ffcc22', stemColor: '#4a7a3a', height: 16, width: 18, petalCount: 30, density: 0.055, windSensitivity: 0.75 },
                { name: 'Cornflower', petalColor: '#5588ff', centerColor: '#3355dd', stemColor: '#3a6a2a', height: 24, width: 18, petalCount: 8, density: 0.035, windSensitivity: 0.58 }
            ],
            
            Meadow: [
                { name: 'Poppy', petalColor: '#ff4444', centerColor: '#222222', stemColor: '#4a7a3a', height: 26, width: 22, petalCount: 4, density: 0.030, windSensitivity: 0.62 },
                { name: 'Bellflower', petalColor: '#6688ff', centerColor: '#ffffff', stemColor: '#3a6a2a', height: 24, width: 14, petalCount: 5, density: 0.035, windSensitivity: 0.55 },
                { name: 'Forget-Me-Not', petalColor: '#5599ff', centerColor: '#ffee66', stemColor: '#4a7a3a', height: 24, width: 21, petalCount: 5, density: 0.080, windSensitivity: 0.8 },
                { name: 'Wild Geranium', petalColor: '#dd77dd', centerColor: '#ffee88', stemColor: '#4a7a3a', height: 22, width: 18, petalCount: 5, density: 0.035, windSensitivity: 0.58 }
            ],
            
            Prairie: [
                { name: 'Prairie Rose', petalColor: '#ff99aa', centerColor: '#ffee88', stemColor: '#5a7a4a', height: 24, width: 20, petalCount: 5, density: 0.025, windSensitivity: 0.5 },
                { name: 'Sunflower', petalColor: '#ffdd44', centerColor: '#885533', stemColor: '#4a7a3a', height: 40, width: 26, petalCount: 15, density: 0.015, windSensitivity: 0.35 },
                { name: 'Blazing Star', petalColor: '#dd77dd', centerColor: '#ff99ff', stemColor: '#5a7a4a', height: 36, width: 14, petalCount: 6, density: 0.020, windSensitivity: 0.48 }
            ],
            
            // FOREST BIOMES
            Forest: [
                { name: 'Bluebell', petalColor: '#5577dd', centerColor: '#ffee88', stemColor: '#2a5a2a', height: 24, width: 16, petalCount: 5, density: 0.025, windSensitivity: 0.5 },
                { name: 'Foxglove', petalColor: '#dd77bb', centerColor: '#ffddee', stemColor: '#3a6a3a', height: 36, width: 12, petalCount: 4, density: 0.020, windSensitivity: 0.4 },
                { name: 'Wood Anemone', petalColor: '#ffffff', centerColor: '#ffee66', stemColor: '#2a5a2a', height: 20, width: 18, petalCount: 6, density: 0.030, windSensitivity: 0.6 },
                { name: 'Wild Violet', petalColor: '#7744bb', centerColor: '#ffee44', stemColor: '#3a6a3a', height: 16, width: 14, petalCount: 5, density: 0.035, windSensitivity: 0.55 }
            ],
            
            OakForest: [
                { name: 'Trillium', petalColor: '#eeeeee', centerColor: '#ffdd66', stemColor: '#3a6a3a', height: 22, width: 20, petalCount: 3, density: 0.025, windSensitivity: 0.45 },
                { name: 'Columbine', petalColor: '#5588dd', centerColor: '#ffee88', stemColor: '#2a5a2a', height: 30, width: 18, petalCount: 5, density: 0.020, windSensitivity: 0.5 },
                { name: 'Spring Beauty', petalColor: '#ffccee', centerColor: '#ffee66', stemColor: '#2a5a2a', height: 28, width: 21, petalCount: 5, density: 0.080, windSensitivity: 0.6 }
            ],
            
            PineForest: [
                { name: 'Bunchberry', petalColor: '#ffffff', centerColor: '#44aa44', stemColor: '#3a6a3a', height: 28, width: 28, petalCount: 4, density: 0.080, windSensitivity: 0.55 },
                { name: 'Twinflower', petalColor: '#ffaacc', centerColor: '#ffeeee', stemColor: '#2a5a2a', height: 20, width: 10, petalCount: 2, density: 0.035, windSensitivity: 0.65 },
                { name: 'Wintergreen', petalColor: '#ffeeee', centerColor: '#ff8888', stemColor: '#3a6a3a', height: 24, width: 21, petalCount: 5, density: 0.080, windSensitivity: 0.5 }
            ],
            
            DenseForest: [
                { name: 'Jack-in-the-Pulpit', petalColor: '#664433', centerColor: '#88aa66', stemColor: '#3a6a3a', height: 28, width: 16, petalCount: 1, density: 0.018, windSensitivity: 0.35 },
                { name: 'Bloodroot', petalColor: '#ffffff', centerColor: '#ffee66', stemColor: '#2a5a2a', height: 16, width: 18, petalCount: 8, density: 0.025, windSensitivity: 0.55 },
                { name: 'Wild Ginger', petalColor: '#773355', centerColor: '#554433', stemColor: '#3a6a3a', height: 24, width: 28, petalCount: 3, density: 0.080, windSensitivity: 0.48 }
            ],
            
            Taiga: [
                { name: 'Arctic Lupine', petalColor: '#5577ff', centerColor: '#ffffff', stemColor: '#3a6a3a', height: 26, width: 14, petalCount: 5, density: 0.020, windSensitivity: 0.42 },
                { name: 'Bearberry', petalColor: '#ffddee', centerColor: '#ffaacc', stemColor: '#2a5a2a', height: 20, width: 21, petalCount: 5, density: 0.080, windSensitivity: 0.55 },
                { name: 'Cloudberry', petalColor: '#ffffee', centerColor: '#ffcc66', stemColor: '#2a5a2a', height: 28, width: 28, petalCount: 5, density: 0.080, windSensitivity: 0.52 }
            ],
            
            // DESERT BIOMES
            Desert: [
                { name: 'Desert Marigold', petalColor: '#ffcc33', centerColor: '#ff8822', stemColor: '#6a7a5a', height: 16, width: 16, petalCount: 8, density: 0.009, windSensitivity: 0.45 },
                { name: 'Brittlebush', petalColor: '#ffdd44', centerColor: '#885533', stemColor: '#7a8a6a', height: 20, width: 18, petalCount: 12, density: 0.012, windSensitivity: 0.42 },
                { name: 'Desert Lily', petalColor: '#ffffee', centerColor: '#ffee88', stemColor: '#6a7a5a', height: 28, width: 14, petalCount: 6, density: 0.006, windSensitivity: 0.38 }
            ],
            
            SandDesert: [
                { name: 'Evening Primrose', petalColor: '#ffeeaa', centerColor: '#ffcc77', stemColor: '#7a8a6a', height: 18, width: 16, petalCount: 4, density: 0.009, windSensitivity: 0.48 },
                { name: 'Sand Verbena', petalColor: '#ff99dd', centerColor: '#ffddee', stemColor: '#6a7a5a', height: 12, width: 14, petalCount: 5, density: 0.012, windSensitivity: 0.52 },
                { name: 'Desert Gold', petalColor: '#ffdd33', centerColor: '#ff9922', stemColor: '#7a8a6a', height: 16, width: 16, petalCount: 10, density: 0.009, windSensitivity: 0.45 }
            ],
            
            RockDesert: [
                { name: 'Rock Daisy', petalColor: '#ffffee', centerColor: '#ffdd88', stemColor: '#8a9a7a', height: 12, width: 12, petalCount: 8, density: 0.012, windSensitivity: 0.5 },
                { name: 'Desert Lupine', petalColor: '#6677ff', centerColor: '#ffffff', stemColor: '#7a8a6a', height: 22, width: 12, petalCount: 5, density: 0.009, windSensitivity: 0.42 },
                { name: 'Globemallow', petalColor: '#ff9966', centerColor: '#ffcc88', stemColor: '#7a8a6a', height: 20, width: 16, petalCount: 5, density: 0.009, windSensitivity: 0.48 }
            ],
            
            Dunes: [
                { name: 'Dune Primrose', petalColor: '#ffffcc', centerColor: '#ffee88', stemColor: '#8a9a7a', height: 14, width: 14, petalCount: 4, density: 0.006, windSensitivity: 0.6 },
                { name: 'Sand Lily', petalColor: '#ffddee', centerColor: '#ffaacc', stemColor: '#7a8a6a', height: 18, width: 12, petalCount: 6, density: 0.006, windSensitivity: 0.55 },
                { name: 'Desert Star', petalColor: '#ffffff', centerColor: '#ffee77', stemColor: '#8a9a7a', height: 10, width: 10, petalCount: 5, density: 0.009, windSensitivity: 0.65 }
            ],
            
            Savanna: [
                { name: 'Acacia Bloom', petalColor: '#ffffaa', centerColor: '#ffdd77', stemColor: '#6a7a5a', height: 14, width: 10, petalCount: 5, density: 0.015, windSensitivity: 0.52 },
                { name: 'Fireball Lily', petalColor: '#ff6644', centerColor: '#ff9966', stemColor: '#5a6a4a', height: 24, width: 16, petalCount: 6, density: 0.012, windSensitivity: 0.45 },
                { name: 'Blue Flax', petalColor: '#5588ff', centerColor: '#ffffff', stemColor: '#6a7a5a', height: 20, width: 14, petalCount: 5, density: 0.018, windSensitivity: 0.58 }
            ],
            
            // COLD BIOMES
            Snow: [
                { name: 'Snow Buttercup', petalColor: '#ffffee', centerColor: '#ffee88', stemColor: '#5a7a6a', height: 12, width: 10, petalCount: 5, density: 0.012, windSensitivity: 0.55 },
                { name: 'Alpine Forget-Me-Not', petalColor: '#5599ff', centerColor: '#ffffff', stemColor: '#4a6a5a', height: 10, width: 9, petalCount: 5, density: 0.018, windSensitivity: 0.6 },
                { name: 'Snow Crocus', petalColor: '#ddbbff', centerColor: '#ffee66', stemColor: '#5a7a6a', height: 14, width: 10, petalCount: 6, density: 0.015, windSensitivity: 0.52 }
            ],
            
            Tundra: [
                { name: 'Tundra Rose', petalColor: '#ffaacc', centerColor: '#ffddee', stemColor: '#5a7a6a', height: 12, width: 12, petalCount: 5, density: 0.015, windSensitivity: 0.55 },
                { name: 'Arctic Saxifrage', petalColor: '#ffffee', centerColor: '#ffdd99', stemColor: '#4a6a5a', height: 10, width: 10, petalCount: 5, density: 0.021, windSensitivity: 0.6 },
                { name: 'Moss Campion', petalColor: '#ff99bb', centerColor: '#ffccdd', stemColor: '#5a7a6a', height: 8, width: 12, petalCount: 5, density: 0.030, windSensitivity: 0.65 }
            ],
            
            IceField: [
                { name: 'Ice Plant', petalColor: '#aaddff', centerColor: '#ffffff', stemColor: '#6a8a9a', height: 8, width: 9, petalCount: 6, density: 0.006, windSensitivity: 0.5 },
                { name: 'Glacier Bloom', petalColor: '#ffffff', centerColor: '#ccddff', stemColor: '#5a7a8a', height: 10, width: 10, petalCount: 5, density: 0.009, windSensitivity: 0.52 }
            ],
            
            // WETLAND BIOMES
            Swamp: [
                { name: 'Marsh Marigold', petalColor: '#ffee33', centerColor: '#ffaa22', stemColor: '#3a6a4a', height: 18, width: 16, petalCount: 5, density: 0.024, windSensitivity: 0.58 },
                { name: 'Water Lily', petalColor: '#ffccee', centerColor: '#ffee88', stemColor: '#3a6a4a', height: 12, width: 19, petalCount: 8, density: 0.015, windSensitivity: 0.35 },
                { name: 'Cardinal Flower', petalColor: '#ff3344', centerColor: '#ffaa88', stemColor: '#3a6a4a', height: 16, width: 8, petalCount: 5, density: 0.005, windSensitivity: 0.48 }
            ],
            
            Wetland: [
                { name: 'Pickerelweed', petalColor: '#6688dd', centerColor: '#8899ee', stemColor: '#3a6a4a', height: 26, width: 12, petalCount: 6, density: 0.024, windSensitivity: 0.5 },
                { name: 'Swamp Rose', petalColor: '#ff99aa', centerColor: '#ffddee', stemColor: '#4a7a5a', height: 22, width: 18, petalCount: 5, density: 0.018, windSensitivity: 0.52 },
                { name: 'Blue Flag Iris', petalColor: '#5577dd', centerColor: '#ffee66', stemColor: '#3a6a4a', height: 28, width: 16, petalCount: 3, density: 0.018, windSensitivity: 0.45 }
            ],
            
            // MOUNTAIN BIOMES
            Mountain: [
                { name: 'Alpine Aster', petalColor: '#9955ff', centerColor: '#ffee66', stemColor: '#5a7a6a', height: 16, width: 14, petalCount: 10, density: 0.018, windSensitivity: 0.55 },
                { name: 'Mountain Columbine', petalColor: '#5588ff', centerColor: '#ffffee', stemColor: '#4a6a5a', height: 24, width: 16, petalCount: 5, density: 0.015, windSensitivity: 0.5 },
                { name: 'Mountain Daisy', petalColor: '#ffffee', centerColor: '#ffdd77', stemColor: '#4a6a5a', height: 14, width: 12, petalCount: 12, density: 0.024, windSensitivity: 0.6 }
            ],
            
            Foothill: [
                { name: 'Foothill Poppy', petalColor: '#ff8844', centerColor: '#ffdd88', stemColor: '#5a7a6a', height: 20, width: 16, petalCount: 4, density: 0.021, windSensitivity: 0.58 },
                { name: 'Hill Daisy', petalColor: '#ffffee', centerColor: '#ffcc66', stemColor: '#4a6a5a', height: 16, width: 14, petalCount: 10, density: 0.030, windSensitivity: 0.6 },
                { name: 'Wild Bergamot', petalColor: '#dd88ff', centerColor: '#ffccee', stemColor: '#5a7a6a', height: 24, width: 12, petalCount: 6, density: 0.018, windSensitivity: 0.52 }
            ],
            
            Peaks: [
                { name: 'Edelweiss', petalColor: '#ffffee', centerColor: '#ffffff', stemColor: '#6a8a7a', height: 14, width: 12, petalCount: 6, density: 0.012, windSensitivity: 0.48 },
                { name: 'Alpine Poppy', petalColor: '#ffee55', centerColor: '#ffffff', stemColor: '#5a7a6a', height: 18, width: 14, petalCount: 4, density: 0.015, windSensitivity: 0.52 },
                { name: 'Gentian', petalColor: '#4466ff', centerColor: '#ffffff', stemColor: '#5a7a6a', height: 16, width: 12, petalCount: 5, density: 0.018, windSensitivity: 0.55 }
            ],
            
            // TROPICAL BIOMES
            Jungle: [
                { name: 'Orchid', petalColor: '#dd77ff', centerColor: '#ffee88', stemColor: '#3a6a3a', height: 26, width: 18, petalCount: 5, density: 0.018, windSensitivity: 0.45 },
                { name: 'Heliconia', petalColor: '#ff5544', centerColor: '#ffaa66', stemColor: '#3a6a3a', height: 16, width: 9, petalCount: 3, density: 0.005, windSensitivity: 0.4 },
                { name: 'Passion Flower', petalColor: '#8855ff', centerColor: '#ffee88', stemColor: '#3a6a3a', height: 24, width: 19, petalCount: 10, density: 0.021, windSensitivity: 0.5 }
            ],
            
            // VOLCANIC
            Volcanic: [
                { name: 'Fire Lily', petalColor: '#ff4422', centerColor: '#ffaa00', stemColor: '#663322', height: 22, width: 16, petalCount: 6, density: 0.009, windSensitivity: 0.4 },
                { name: 'Lava Bloom', petalColor: '#ff6633', centerColor: '#ffcc44', stemColor: '#553322', height: 18, width: 14, petalCount: 5, density: 0.012, windSensitivity: 0.45 },
                { name: 'Ember Flower', petalColor: '#ff8844', centerColor: '#ffee66', stemColor: '#664433', height: 16, width: 12, petalCount: 7, density: 0.015, windSensitivity: 0.5 }
            ],
            
            // MUSHROOM
            Mushroom: [
                { name: 'Spore Bloom', petalColor: '#ff99cc', centerColor: '#ffffff', stemColor: '#8866aa', height: 20, width: 18, petalCount: 8, density: 0.036, windSensitivity: 0.5 },
                { name: 'Mycelia Flower', petalColor: '#aa88ff', centerColor: '#ffccee', stemColor: '#6655aa', height: 16, width: 16, petalCount: 6, density: 0.045, windSensitivity: 0.55 },
                { name: 'Fairy Ring Bloom', petalColor: '#ffaaff', centerColor: '#ffffff', stemColor: '#7766bb', height: 14, width: 14, petalCount: 12, density: 0.030, windSensitivity: 0.6 }
            ],
            
            // HOLIDAY THEMED
            Christmas: [
                { name: 'Poinsettia', petalColor: '#ff2244', centerColor: '#ffee66', stemColor: '#2a5a2a', height: 24, width: 19, petalCount: 6, density: 0.024, windSensitivity: 0.45 },
                { name: 'Christmas Rose', petalColor: '#ffffff', centerColor: '#ffcc44', stemColor: '#3a6a3a', height: 20, width: 16, petalCount: 5, density: 0.030, windSensitivity: 0.5 },
                { name: 'Holly Berry Bloom', petalColor: '#ffeeee', centerColor: '#ff3333', stemColor: '#2a5a2a', height: 16, width: 12, petalCount: 4, density: 0.036, windSensitivity: 0.52 }
            ],
            
            Easter: [
                { name: 'Easter Lily', petalColor: '#ffffff', centerColor: '#ffee88', stemColor: '#4a7a4a', height: 28, width: 18, petalCount: 6, density: 0.030, windSensitivity: 0.48 },
                { name: 'Spring Tulip', petalColor: '#ff88cc', centerColor: '#ffee77', stemColor: '#3a6a3a', height: 24, width: 16, petalCount: 6, density: 0.036, windSensitivity: 0.52 },
                { name: 'Pastel Bloom', petalColor: '#ccaaff', centerColor: '#ffeeaa', stemColor: '#4a7a4a', height: 20, width: 14, petalCount: 5, density: 0.045, windSensitivity: 0.55 }
            ],
            
            Halloween: [
                { name: 'Ghost Flower', petalColor: '#eeeeff', centerColor: '#666688', stemColor: '#443355', height: 22, width: 16, petalCount: 5, density: 0.021, windSensitivity: 0.5 },
                { name: 'Pumpkin Bloom', petalColor: '#ff8822', centerColor: '#ffaa44', stemColor: '#553322', height: 20, width: 18, petalCount: 7, density: 0.024, windSensitivity: 0.48 },
                { name: 'Witch Hazel', petalColor: '#aa77ff', centerColor: '#ffccee', stemColor: '#443366', height: 18, width: 14, petalCount: 6, density: 0.027, windSensitivity: 0.52 }
            ],
            
            Valentine: [
                { name: 'Rose of Love', petalColor: '#ff3366', centerColor: '#ffccdd', stemColor: '#3a5a3a', height: 26, width: 19, petalCount: 5, density: 0.030, windSensitivity: 0.45 },
                { name: 'Heart Bloom', petalColor: '#ff88aa', centerColor: '#ffddee', stemColor: '#4a6a4a', height: 22, width: 18, petalCount: 5, density: 0.036, windSensitivity: 0.5 },
                { name: 'Cupids Flower', petalColor: '#ffaacc', centerColor: '#ffffff', stemColor: '#3a5a3a', height: 18, width: 16, petalCount: 8, density: 0.045, windSensitivity: 0.55 }
            ],
            
            // FANTASY THEMED
            Candy: [
                { name: 'Lollipop Bloom', petalColor: '#ff66cc', centerColor: '#ffee99', stemColor: '#dd88bb', height: 20, width: 18, petalCount: 8, density: 0.045, windSensitivity: 0.5 },
                { name: 'Gumball Flower', petalColor: '#66ccff', centerColor: '#ffccee', stemColor: '#99aaff', height: 18, width: 16, petalCount: 12, density: 0.054, windSensitivity: 0.55 },
                { name: 'Cotton Candy Blossom', petalColor: '#ffaaee', centerColor: '#ffffff', stemColor: '#dd99ee', height: 16, width: 14, petalCount: 20, density: 0.060, windSensitivity: 0.6 }
            ],
            
            Cosmic: [
                { name: 'Nebula Flower', petalColor: '#8844ff', centerColor: '#ffccff', stemColor: '#664499', height: 24, width: 18, petalCount: 7, density: 0.024, windSensitivity: 0.45 },
                { name: 'Star Bloom', petalColor: '#ffff66', centerColor: '#ffffff', stemColor: '#8866cc', height: 20, width: 16, petalCount: 5, density: 0.030, windSensitivity: 0.5 },
                { name: 'Galaxy Blossom', petalColor: '#4466ff', centerColor: '#ff88ff', stemColor: '#5544aa', height: 22, width: 18, petalCount: 8, density: 0.027, windSensitivity: 0.48 }
            ],
            
            Crystal: [
                { name: 'Diamond Flower', petalColor: '#ccffff', centerColor: '#ffffff', stemColor: '#88ccdd', height: 22, width: 16, petalCount: 6, density: 0.021, windSensitivity: 0.4 },
                { name: 'Prism Bloom', petalColor: '#aaccff', centerColor: '#ffccff', stemColor: '#77aacc', height: 20, width: 14, petalCount: 8, density: 0.024, windSensitivity: 0.42 },
                { name: 'Quartz Blossom', petalColor: '#ffffff', centerColor: '#ccddff', stemColor: '#99bbdd', height: 18, width: 14, petalCount: 5, density: 0.027, windSensitivity: 0.45 }
            ],
            
            Underwater: [
                { name: 'Coral Flower', petalColor: '#ff8866', centerColor: '#ffccaa', stemColor: '#cc6644', height: 20, width: 18, petalCount: 12, density: 0.030, windSensitivity: 0.3 },
                { name: 'Sea Anemone Bloom', petalColor: '#ff66aa', centerColor: '#ffaacc', stemColor: '#dd5588', height: 16, width: 16, petalCount: 20, density: 0.036, windSensitivity: 0.25 },
                { name: 'Kelp Flower', petalColor: '#66aa88', centerColor: '#88cc99', stemColor: '#559977', height: 24, width: 12, petalCount: 4, density: 0.024, windSensitivity: 0.35 }
            ],
            
            Rainbow: [
                { name: 'Spectrum Flower', petalColor: '#ff6688', centerColor: '#ffee66', stemColor: '#66aa88', height: 22, width: 18, petalCount: 7, density: 0.036, windSensitivity: 0.5 },
                { name: 'Prismatic Bloom', petalColor: '#88ccff', centerColor: '#ffaaff', stemColor: '#66cc88', height: 20, width: 16, petalCount: 12, density: 0.045, windSensitivity: 0.55 },
                { name: 'Aurora Blossom', petalColor: '#aa88ff', centerColor: '#ffccee', stemColor: '#88bb66', height: 18, width: 14, petalCount: 8, density: 0.039, windSensitivity: 0.52 }
            ],
            
            Neon: [
                { name: 'Glow Flower', petalColor: '#ff00ff', centerColor: '#00ffff', stemColor: '#ff00aa', height: 20, width: 16, petalCount: 6, density: 0.030, windSensitivity: 0.48 },
                { name: 'Electric Bloom', petalColor: '#00ffff', centerColor: '#ffff00', stemColor: '#00ffaa', height: 22, width: 18, petalCount: 8, density: 0.036, windSensitivity: 0.5 },
                { name: 'Cyber Blossom', petalColor: '#ff00aa', centerColor: '#00ff00', stemColor: '#aa00ff', height: 18, width: 14, petalCount: 5, density: 0.033, windSensitivity: 0.52 }
            ],
            
            Alien: [
                { name: 'Xenoflower', petalColor: '#88ff66', centerColor: '#ff88ff', stemColor: '#66aa88', height: 24, width: 19, petalCount: 7, density: 0.024, windSensitivity: 0.45 },
                { name: 'Otherworld Bloom', petalColor: '#ff6688', centerColor: '#88ffaa', stemColor: '#aa6688', height: 20, width: 16, petalCount: 9, density: 0.027, windSensitivity: 0.48 },
                { name: 'Strange Blossom', petalColor: '#66ffaa', centerColor: '#ffaa66', stemColor: '#88aa66', height: 22, width: 18, petalCount: 6, density: 0.030, windSensitivity: 0.5 }
            ],
            
            Wasteland: [
                { name: 'Survivor Flower', petalColor: '#998877', centerColor: '#ccaa88', stemColor: '#665544', height: 16, width: 12, petalCount: 5, density: 0.009, windSensitivity: 0.5 },
                { name: 'Ash Bloom', petalColor: '#aaaaaa', centerColor: '#cccccc', stemColor: '#777777', height: 14, width: 10, petalCount: 4, density: 0.006, windSensitivity: 0.52 },
                { name: 'Ruin Blossom', petalColor: '#aa9988', centerColor: '#ddccbb', stemColor: '#887766', height: 12, width: 10, petalCount: 6, density: 0.012, windSensitivity: 0.48 }
            ],
            
            Steampunk: [
                { name: 'Gear Flower', petalColor: '#cc9966', centerColor: '#ffcc88', stemColor: '#996644', height: 20, width: 16, petalCount: 8, density: 0.021, windSensitivity: 0.4 },
                { name: 'Brass Bloom', petalColor: '#ddaa66', centerColor: '#ffddaa', stemColor: '#aa8844', height: 18, width: 14, petalCount: 6, density: 0.024, windSensitivity: 0.42 },
                { name: 'Copper Blossom', petalColor: '#dd8844', centerColor: '#ffaa66', stemColor: '#bb6633', height: 16, width: 12, petalCount: 5, density: 0.027, windSensitivity: 0.45 }
            ],
            
            Ruins: [
                { name: 'Ancient Flower', petalColor: '#aa99aa', centerColor: '#ccbbcc', stemColor: '#887788', height: 18, width: 14, petalCount: 6, density: 0.018, windSensitivity: 0.48 },
                { name: 'Forgotten Bloom', petalColor: '#bbaacc', centerColor: '#ddccee', stemColor: '#9988aa', height: 16, width: 12, petalCount: 5, density: 0.021, windSensitivity: 0.5 },
                { name: 'Relic Blossom', petalColor: '#9988bb', centerColor: '#ccbbdd', stemColor: '#7766aa', height: 14, width: 10, petalCount: 7, density: 0.024, windSensitivity: 0.52 }
            ],
            
            RobotCyber: [
                { name: 'Digital Flower', petalColor: '#00ffcc', centerColor: '#ff00ff', stemColor: '#0088cc', height: 20, width: 16, petalCount: 4, density: 0.024, windSensitivity: 0.45 },
                { name: 'Circuit Bloom', petalColor: '#00ff00', centerColor: '#ffff00', stemColor: '#00aa00', height: 18, width: 14, petalCount: 6, density: 0.027, windSensitivity: 0.48 },
                { name: 'Techno Blossom', petalColor: '#0066ff', centerColor: '#ff6600', stemColor: '#0044cc', height: 22, width: 18, petalCount: 8, density: 0.030, windSensitivity: 0.5 }
            ],
            
            Disco: [
                { name: 'Disco Ball Flower', petalColor: '#ff00ff', centerColor: '#ffff00', stemColor: '#ff00aa', height: 22, width: 18, petalCount: 12, density: 0.036, windSensitivity: 0.55 },
                { name: 'Funk Bloom', petalColor: '#00ffff', centerColor: '#ff00ff', stemColor: '#00aaaa', height: 20, width: 16, petalCount: 8, density: 0.045, windSensitivity: 0.6 },
                { name: 'Groove Blossom', petalColor: '#ffff00', centerColor: '#ff0088', stemColor: '#aaaa00', height: 18, width: 14, petalCount: 10, density: 0.039, windSensitivity: 0.58 }
            ]
        };
    }
    
    generateFlowersForChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        
        if (this.flowers.has(chunkKey)) {
            return this.flowers.get(chunkKey);
        }
        
        const chunkFlowers = [];
        const chunkWorldX = chunkX * CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        const chunkWorldY = chunkY * CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE;
        
        for (let ty = 0; ty < CONSTANTS.CHUNK_SIZE; ty++) {
            for (let tx = 0; tx < CONSTANTS.CHUNK_SIZE; tx++) {
                const worldX = chunkWorldX + tx * CONSTANTS.TILE_SIZE;
                const worldY = chunkWorldY + ty * CONSTANTS.TILE_SIZE;
                
                // Use generateChunk which returns existing or creates new chunk
                const chunk = this.mapGenerator.generateChunk(chunkX, chunkY);
                if (!chunk || !chunk.tiles || !chunk.tiles[ty] || !chunk.tiles[ty][tx]) continue;
                
                // Access chunk as 2D array: tiles[y][x]
                const biomeData = chunk.tiles[ty][tx];
                if (!biomeData || !biomeData.biome) continue;
                
                const biome = biomeData.biome;
                const flowersForBiome = this.flowerTypes[biome];
                
                if (!flowersForBiome || flowersForBiome.length === 0) continue;
                
                // FLOWER PATCH SYSTEM - Check if this tile is in a flower patch
                const patchNoise = this.getPatchNoise(worldX, worldY);
                const inPatch = patchNoise > this.patchThreshold;
                const patchMultiplier = inPatch ? 3.5 : 1.0; // 3.5x more flowers in patches!
                
                for (const flowerType of flowersForBiome) {
                    const seed = worldX * 73856093 ^ worldY * 19349663 ^ this.mapGenerator.seed;
                    const random = Math.abs(Math.sin(seed)) * 10000;
                    
                    // Apply patch multiplier to density
                    const effectiveDensity = flowerType.density * patchMultiplier;
                    
                    if (random % 1 < effectiveDensity) {
                        const offsetX = (random * 7919) % CONSTANTS.TILE_SIZE;
                        const offsetY = (random * 6547) % CONSTANTS.TILE_SIZE;
                        
                        chunkFlowers.push({
                            x: worldX + offsetX,
                            y: worldY + offsetY,
                            type: flowerType,
                            swayOffset: random % (Math.PI * 2),
                            inPatch: inPatch
                        });
                    }
                }
            }
        }
        
        this.flowers.set(chunkKey, chunkFlowers);
        return chunkFlowers;
    }
    
    // Generate flower patch noise for clustering
    getPatchNoise(x, y) {
        const nx = x / this.patchScale;
        const ny = y / this.patchScale;
        
        // Simple noise function for patches
        const seed1 = this.mapGenerator.seed + 12345;
        const seed2 = this.mapGenerator.seed + 67890;
        
        const noise1 = Math.abs(Math.sin(nx * 0.1 + seed1) * Math.cos(ny * 0.1 + seed1));
        const noise2 = Math.abs(Math.sin(nx * 0.05 + seed2) * Math.cos(ny * 0.05 + seed2));
        
        return (noise1 + noise2) / 2;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime * this.windSpeed;
    }
    
    render(ctx, cameraX, cameraY) {
        // Get actual canvas dimensions (not constants, as canvas can be resized)
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        const viewportLeft = cameraX;
        const viewportRight = cameraX + canvasWidth;
        const viewportTop = cameraY;
        const viewportBottom = cameraY + canvasHeight;
        
        const startChunkX = Math.floor(viewportLeft / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE)) - 1;
        const endChunkX = Math.ceil(viewportRight / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE)) + 1;
        const startChunkY = Math.floor(viewportTop / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE)) - 1;
        const endChunkY = Math.ceil(viewportBottom / (CONSTANTS.CHUNK_SIZE * CONSTANTS.TILE_SIZE)) + 1;
        
        for (let cy = startChunkY; cy <= endChunkY; cy++) {
            for (let cx = startChunkX; cx <= endChunkX; cx++) {
                const flowers = this.generateFlowersForChunk(cx, cy);
                
                for (const flower of flowers) {
                    // Simple culling - only render flowers in viewport
                    if (flower.x < viewportLeft || flower.x > viewportRight ||
                        flower.y < viewportTop || flower.y > viewportBottom) {
                        continue;
                    }
                    
                    this.renderFlower(ctx, flower, cameraX, cameraY);
                }
            }
        }
    }
    
    renderFlower(ctx, flower, cameraX, cameraY) {
        // Flowers are rendered in world space (camera transform already applied)
        const worldX = flower.x;
        const worldY = flower.y;
        
        const sway = Math.sin(this.animationTime + flower.swayOffset) * 
                     this.windStrength * flower.type.windSensitivity;
        
        ctx.save();
        ctx.translate(worldX, worldY);
        ctx.rotate(sway);
        
        // Render stem
        ctx.strokeStyle = flower.type.stemColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -flower.type.height);
        ctx.stroke();
        
        // Move to top of stem for petals
        ctx.translate(0, -flower.type.height);
        
        // Render petals
        const angleStep = (Math.PI * 2) / flower.type.petalCount;
        for (let i = 0; i < flower.type.petalCount; i++) {
            const angle = i * angleStep;
            const petalX = Math.cos(angle) * flower.type.width * 0.4;
            const petalY = Math.sin(angle) * flower.type.width * 0.4;
            
            ctx.fillStyle = flower.type.petalColor;
            ctx.beginPath();
            ctx.arc(petalX, petalY, flower.type.width * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render center
        ctx.fillStyle = flower.type.centerColor;
        ctx.beginPath();
        ctx.arc(0, 0, flower.type.width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    cleanup(playerX, playerY, radius = 10000) {
        const toDelete = [];
        
        this.flowers.forEach((flowers, key) => {
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
        
        toDelete.forEach(key => this.flowers.delete(key));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowerSystem;
}