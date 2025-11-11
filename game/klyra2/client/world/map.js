// KLYRA MAP GENERATION - Complete Biome System with ALL Themes
// Natural + Holiday + Fantasy themed biomes

class MapGenerator {
    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 999999999);
        this.chunks = new Map();
        this.CHUNK_SIZE = 16;
        this.season = 0;
        
        // RESERVED CASTLE SPAWN AREA - Always Forest biome
        this.castleSpawnArea = {
            centerX: 0,
            centerY: 0,
            radius: 1000  // 2000x2000 pixel Forest clearing for MASSIVE AAA castle
        };
        
        this.biomeConfig = {
            // NATURAL BIOMES
            "Ocean": {
                tempMin: 30, tempMax: 90, moistMin: 95, moistMax: 100, elevationMax: 0.3,
                baseTiles: [261, 262, 263, 267, 271, 272, 273, 274, 275, 276],
                transitionTiles: [264, 265, 268, 269, 270],
                accentTiles: [266, 311, 312, 313],
                rare: false, coastal: false
            },
            "DeepOcean": {
                tempMin: 20, tempMax: 80, moistMin: 95, moistMax: 100, elevationMax: 0.2,
                baseTiles: [277, 278, 279, 280, 281, 282, 283, 284, 285],
                transitionTiles: [296, 297, 298, 299, 300],
                accentTiles: [320, 321, 322, 323],
                rare: false, coastal: false
            },
            "Beach": {
                tempMin: 60, tempMax: 85, moistMin: 30, moistMax: 70, elevationMin: 0.28, elevationMax: 0.35,
                baseTiles: [471, 472, 473, 474, 481, 482, 483, 484, 485, 486],
                transitionTiles: [475, 478, 501, 502, 503, 504],
                accentTiles: [476, 477, 479, 480, 516, 517, 518],
                rare: false, coastal: true
            },
            "Plains": {
                tempMin: 55, tempMax: 80, moistMin: 30, moistMax: 65, elevationMin: 0.3, elevationMax: 0.6,
                baseTiles: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 21, 22, 23, 24, 25],
                transitionTiles: [6, 7, 18, 19, 41, 42, 43, 44],
                accentTiles: [14, 15, 16, 17, 20],
                rare: false, coastal: false
            },
            "Grassland": {
                tempMin: 60, tempMax: 75, moistMin: 35, moistMax: 55, elevationMin: 0.3, elevationMax: 0.55,
                baseTiles: [1, 2, 3, 8, 9, 21, 22, 23, 24, 25, 26, 27],
                transitionTiles: [6, 7, 41, 42, 43],
                accentTiles: [14, 15, 16],
                rare: false, coastal: false
            },
            "Meadow": {
                tempMin: 58, tempMax: 78, moistMin: 45, moistMax: 65, elevationMin: 0.35, elevationMax: 0.58,
                baseTiles: [4, 5, 10, 11, 12, 13, 28, 29, 30, 31, 32, 33],
                transitionTiles: [18, 19, 44, 45, 46],
                accentTiles: [14, 15, 17, 20],
                rare: false, coastal: false
            },
            "Prairie": {
                tempMin: 62, tempMax: 82, moistMin: 25, moistMax: 45, elevationMin: 0.32, elevationMax: 0.52,
                baseTiles: [34, 35, 36, 37, 38, 39, 40, 3, 4, 8, 9],
                transitionTiles: [47, 48, 49, 50, 6, 7],
                accentTiles: [16, 17],
                rare: false, coastal: false
            },
            "Forest": {
                tempMin: 45, tempMax: 75, moistMin: 55, moistMax: 90, elevationMin: 0.3, elevationMax: 0.7,
                baseTiles: [51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
                transitionTiles: [56, 57, 91, 92, 93, 94, 95],
                accentTiles: [58, 59, 60, 107, 108, 109],
                rare: false, coastal: false
            },
            "OakForest": {
                tempMin: 50, tempMax: 72, moistMin: 58, moistMax: 85, elevationMin: 0.32, elevationMax: 0.65,
                baseTiles: [51, 52, 53, 61, 62, 63, 71, 72, 73, 74],
                transitionTiles: [56, 91, 92, 93],
                accentTiles: [58, 59, 107, 108],
                rare: false, coastal: false
            },
            "PineForest": {
                tempMin: 35, tempMax: 65, moistMin: 50, moistMax: 80, elevationMin: 0.4, elevationMax: 0.75,
                baseTiles: [54, 55, 64, 65, 66, 75, 76, 77, 78, 79],
                transitionTiles: [57, 94, 95, 96],
                accentTiles: [60, 109, 110, 111],
                rare: false, coastal: false
            },
            "DenseForest": {
                tempMin: 48, tempMax: 70, moistMin: 65, moistMax: 92, elevationMin: 0.35, elevationMax: 0.68,
                baseTiles: [67, 68, 69, 70, 80, 81, 82, 83, 84, 85, 86],
                transitionTiles: [97, 98, 99, 100, 101],
                accentTiles: [112, 113, 114, 115, 116, 117],
                rare: false, coastal: false
            },
            "Taiga": {
                tempMin: 20, tempMax: 45, moistMin: 40, moistMax: 75, elevationMin: 0.35, elevationMax: 0.7,
                baseTiles: [87, 88, 89, 90, 54, 55, 66, 191, 192, 193],
                transitionTiles: [102, 103, 104, 105, 195, 199],
                accentTiles: [106, 118, 119, 120, 196, 197],
                rare: false, coastal: false
            },
            "Desert": {
                tempMin: 80, tempMax: 110, moistMin: 0, moistMax: 25, elevationMin: 0.3, elevationMax: 0.6,
                baseTiles: [121, 122, 123, 126, 127, 131, 132, 133, 134, 135],
                transitionTiles: [124, 125, 128, 129, 156, 157],
                accentTiles: [130, 171, 172, 173],
                rare: false, coastal: false
            },
            "SandDesert": {
                tempMin: 85, tempMax: 108, moistMin: 0, moistMax: 18, elevationMin: 0.32, elevationMax: 0.55,
                baseTiles: [121, 122, 123, 131, 132, 133, 136, 137, 138],
                transitionTiles: [124, 125, 156, 157],
                accentTiles: [130, 171, 172],
                rare: false, coastal: false
            },
            "RockDesert": {
                tempMin: 82, tempMax: 112, moistMin: 0, moistMax: 20, elevationMin: 0.38, elevationMax: 0.62,
                baseTiles: [126, 127, 134, 135, 139, 140, 141, 142, 143],
                transitionTiles: [128, 129, 158, 159],
                accentTiles: [173, 174, 175, 176],
                rare: false, coastal: false
            },
            "Dunes": {
                tempMin: 88, tempMax: 110, moistMin: 0, moistMax: 15, elevationMin: 0.3, elevationMax: 0.58,
                baseTiles: [144, 145, 146, 147, 148, 149, 150, 151, 152],
                transitionTiles: [160, 161, 162, 163],
                accentTiles: [177, 178, 179, 180],
                rare: false, coastal: false
            },
            "Savanna": {
                tempMin: 75, tempMax: 95, moistMin: 20, moistMax: 45, elevationMin: 0.32, elevationMax: 0.58,
                baseTiles: [153, 154, 155, 34, 35, 36, 121, 122],
                transitionTiles: [164, 165, 166, 167],
                accentTiles: [181, 182, 183],
                rare: false, coastal: false
            },
            "Snow": {
                tempMin: 0, tempMax: 35, moistMin: 10, moistMax: 85, elevationMin: 0.3, elevationMax: 0.8,
                baseTiles: [191, 192, 193, 194, 198, 201, 202, 203, 204, 205],
                transitionTiles: [195, 199, 200, 226, 227, 228],
                accentTiles: [196, 197, 243, 244, 245],
                rare: false, coastal: false
            },
            "Tundra": {
                tempMin: 5, tempMax: 32, moistMin: 15, moistMax: 50, elevationMin: 0.32, elevationMax: 0.65,
                baseTiles: [206, 207, 208, 209, 210, 211, 212, 213],
                transitionTiles: [229, 230, 231, 232],
                accentTiles: [246, 247, 248],
                rare: false, coastal: false
            },
            "IceField": {
                tempMin: -10, tempMax: 25, moistMin: 20, moistMax: 90, elevationMin: 0.3, elevationMax: 0.75,
                baseTiles: [214, 215, 216, 217, 218, 219, 220, 221],
                transitionTiles: [233, 234, 235, 236],
                accentTiles: [249, 250, 251, 252],
                rare: false, coastal: false
            },
            "Swamp": {
                tempMin: 60, tempMax: 80, moistMin: 75, moistMax: 95, elevationMin: 0.28, elevationMax: 0.38,
                baseTiles: [401, 402, 404, 405, 411, 412, 413, 414, 415],
                transitionTiles: [406, 408, 431, 432, 433],
                accentTiles: [403, 407, 409, 410, 448, 449],
                rare: false, coastal: false
            },
            "Wetland": {
                tempMin: 55, tempMax: 75, moistMin: 70, moistMax: 90, elevationMin: 0.3, elevationMax: 0.4,
                baseTiles: [416, 417, 418, 419, 420, 421, 422],
                transitionTiles: [434, 435, 436, 437],
                accentTiles: [450, 451, 452, 453],
                rare: false, coastal: true
            },
            "Mountain": {
                tempMin: 15, tempMax: 55, moistMin: 10, moistMax: 50, elevationMin: 0.65, elevationMax: 1.0,
                baseTiles: [331, 332, 335, 336, 341, 342, 343, 344, 345],
                transitionTiles: [338, 339, 363, 364, 365],
                accentTiles: [333, 334, 337, 340, 380, 381],
                rare: false, coastal: false
            },
            "Foothills": {
                tempMin: 25, tempMax: 60, moistMin: 15, moistMax: 55, elevationMin: 0.58, elevationMax: 0.72,
                baseTiles: [346, 347, 348, 349, 350, 351, 352],
                transitionTiles: [366, 367, 368, 369],
                accentTiles: [382, 383, 384, 385],
                rare: false, coastal: false
            },
            "Peaks": {
                tempMin: -5, tempMax: 40, moistMin: 10, moistMax: 45, elevationMin: 0.75, elevationMax: 1.0,
                baseTiles: [353, 354, 355, 356, 357, 358, 359, 360],
                transitionTiles: [370, 371, 372, 373],
                accentTiles: [386, 387, 388, 389, 390],
                rare: false, coastal: false
            },
            "Volcanic": {
                tempMin: 90, tempMax: 130, moistMin: 0, moistMax: 15, elevationMin: 0.5, elevationMax: 0.9,
                baseTiles: [534, 536, 537, 538, 541, 542, 543, 544],
                transitionTiles: [535, 539, 563, 564, 565],
                accentTiles: [531, 532, 533, 540, 580, 581],
                rare: true, coastal: false, rarity: 0.02
            },
            
            // THEMED BIOMES (RARE)
            "Disco": {
                tempMin: 50, tempMax: 90, moistMin: 30, moistMax: 70, elevationMin: 0.3, elevationMax: 0.6,
                baseTiles: [601, 602, 603, 604, 605, 611, 612, 613, 614, 615, 621, 622, 623],
                transitionTiles: [606, 607, 608, 616, 617, 618, 624, 625],
                accentTiles: [609, 610, 619, 620, 626, 627, 628],
                rare: true, coastal: false, rarity: 0.01
            },
            "Mushroom": {
                tempMin: 45, tempMax: 75, moistMin: 60, moistMax: 90, elevationMin: 0.3, elevationMax: 0.65,
                baseTiles: [681, 682, 683, 684, 685, 691, 692, 693, 694, 695, 701, 702, 703],
                transitionTiles: [686, 687, 688, 696, 697, 698, 704, 705],
                accentTiles: [689, 690, 699, 700, 706, 707, 708],
                rare: true, coastal: false, rarity: 0.02
            },
            "RobotCyber": {
                tempMin: 40, tempMax: 80, moistMin: 20, moistMax: 60, elevationMin: 0.3, elevationMax: 0.7,
                baseTiles: [761, 762, 763, 764, 765, 771, 772, 773, 774, 775, 781, 782, 783],
                transitionTiles: [766, 767, 768, 776, 777, 778, 784, 785],
                accentTiles: [769, 770, 779, 780, 786, 787, 788],
                rare: true, coastal: false, rarity: 0.01
            },
            "Valentine": {
                tempMin: 60, tempMax: 85, moistMin: 40, moistMax: 75, elevationMin: 0.3, elevationMax: 0.6,
                baseTiles: [841, 842, 843, 844, 845, 851, 852, 853, 854, 855, 861, 862, 863],
                transitionTiles: [846, 847, 848, 856, 857, 858, 864, 865],
                accentTiles: [849, 850, 859, 860, 866, 867, 868],
                rare: true, coastal: false, rarity: 0.005
            },
            "Christmas": {
                tempMin: 10, tempMax: 40, moistMin: 30, moistMax: 70, elevationMin: 0.3, elevationMax: 0.7,
                baseTiles: [921, 922, 923, 924, 925, 931, 932, 933, 934, 935, 941, 942, 943],
                transitionTiles: [926, 927, 928, 936, 937, 938, 944, 945],
                accentTiles: [929, 930, 939, 940, 946, 947, 948],
                rare: true, coastal: false, rarity: 0.005
            },
            "Halloween": {
                tempMin: 45, tempMax: 75, moistMin: 40, moistMax: 80, elevationMin: 0.3, elevationMax: 0.65,
                baseTiles: [1001, 1002, 1003, 1004, 1005, 1011, 1012, 1013, 1014, 1015, 1021, 1022, 1023],
                transitionTiles: [1006, 1007, 1008, 1016, 1017, 1018, 1024, 1025],
                accentTiles: [1009, 1010, 1019, 1020, 1026, 1027, 1028],
                rare: true, coastal: false, rarity: 0.01
            },
            "Easter": {
                tempMin: 55, tempMax: 80, moistMin: 40, moistMax: 75, elevationMin: 0.3, elevationMax: 0.6,
                baseTiles: [1081, 1082, 1083, 1084, 1085, 1091, 1092, 1093, 1094, 1095, 1101, 1102, 1103],
                transitionTiles: [1086, 1087, 1088, 1096, 1097, 1098, 1104, 1105],
                accentTiles: [1089, 1090, 1099, 1100, 1106, 1107, 1108],
                rare: true, coastal: false, rarity: 0.005
            },
            "Candy": {
                tempMin: 60, tempMax: 90, moistMin: 35, moistMax: 70, elevationMin: 0.3, elevationMax: 0.6,
                baseTiles: [1161, 1162, 1163, 1164, 1165, 1171, 1172, 1173, 1174, 1175, 1181, 1182, 1183],
                transitionTiles: [1166, 1167, 1168, 1176, 1177, 1178, 1184, 1185],
                accentTiles: [1169, 1170, 1179, 1180, 1186, 1187, 1188],
                rare: true, coastal: false, rarity: 0.015
            },
            "Cosmic": {
                tempMin: 20, tempMax: 100, moistMin: 10, moistMax: 90, elevationMin: 0.3, elevationMax: 0.8,
                baseTiles: [1241, 1242, 1243, 1244, 1245, 1251, 1252, 1253, 1254, 1255, 1261, 1262, 1263],
                transitionTiles: [1246, 1247, 1248, 1256, 1257, 1258, 1264, 1265],
                accentTiles: [1249, 1250, 1259, 1260, 1266, 1267, 1268],
                rare: true, coastal: false, rarity: 0.01
            },
            "Crystal": {
                tempMin: 30, tempMax: 70, moistMin: 30, moistMax: 70, elevationMin: 0.4, elevationMax: 0.8,
                baseTiles: [1321, 1322, 1323, 1324, 1325, 1331, 1332, 1333, 1334, 1335, 1341, 1342, 1343],
                transitionTiles: [1326, 1327, 1328, 1336, 1337, 1338, 1344, 1345],
                accentTiles: [1329, 1330, 1339, 1340, 1346, 1347, 1348],
                rare: true, coastal: false, rarity: 0.015
            },
            "Underwater": {
                tempMin: 40, tempMax: 80, moistMin: 85, moistMax: 100, elevationMin: 0.0, elevationMax: 0.35,
                baseTiles: [1401, 1402, 1403, 1404, 1405, 1411, 1412, 1413, 1414, 1415, 1421, 1422, 1423],
                transitionTiles: [1406, 1407, 1408, 1416, 1417, 1418, 1424, 1425],
                accentTiles: [1409, 1410, 1419, 1420, 1426, 1427, 1428],
                rare: true, coastal: false, rarity: 0.02
            },
            "Rainbow": {
                tempMin: 50, tempMax: 85, moistMin: 50, moistMax: 85, elevationMin: 0.3, elevationMax: 0.65,
                baseTiles: [1481, 1482, 1483, 1484, 1485, 1491, 1492, 1493, 1494, 1495, 1501, 1502, 1503],
                transitionTiles: [1486, 1487, 1488, 1496, 1497, 1498, 1504, 1505],
                accentTiles: [1489, 1490, 1499, 1500, 1506, 1507, 1508],
                rare: true, coastal: false, rarity: 0.01
            },
            "Neon": {
                tempMin: 55, tempMax: 90, moistMin: 25, moistMax: 65, elevationMin: 0.3, elevationMax: 0.65,
                baseTiles: [1561, 1562, 1563, 1564, 1565, 1571, 1572, 1573, 1574, 1575, 1581, 1582, 1583],
                transitionTiles: [1566, 1567, 1568, 1576, 1577, 1578, 1584, 1585],
                accentTiles: [1569, 1570, 1579, 1580, 1586, 1587, 1588],
                rare: true, coastal: false, rarity: 0.01
            },
            "Alien": {
                tempMin: 30, tempMax: 110, moistMin: 20, moistMax: 80, elevationMin: 0.3, elevationMax: 0.75,
                baseTiles: [1641, 1642, 1643, 1644, 1645, 1651, 1652, 1653, 1654, 1655, 1661, 1662, 1663],
                transitionTiles: [1646, 1647, 1648, 1656, 1657, 1658, 1664, 1665],
                accentTiles: [1649, 1650, 1659, 1660, 1666, 1667, 1668],
                rare: true, coastal: false, rarity: 0.015
            },
            "Wasteland": {
                tempMin: 70, tempMax: 105, moistMin: 0, moistMax: 30, elevationMin: 0.3, elevationMax: 0.65,
                baseTiles: [1721, 1722, 1723, 1724, 1725, 1731, 1732, 1733, 1734, 1735, 1741, 1742, 1743],
                transitionTiles: [1726, 1727, 1728, 1736, 1737, 1738, 1744, 1745],
                accentTiles: [1729, 1730, 1739, 1740, 1746, 1747, 1748],
                rare: true, coastal: false, rarity: 0.02
            },
            "Jungle": {
                tempMin: 70, tempMax: 95, moistMin: 75, moistMax: 100, elevationMin: 0.3, elevationMax: 0.65,
                baseTiles: [1801, 1802, 1803, 1804, 1805, 1811, 1812, 1813, 1814, 1815, 1821, 1822, 1823],
                transitionTiles: [1806, 1807, 1808, 1816, 1817, 1818, 1824, 1825],
                accentTiles: [1809, 1810, 1819, 1820, 1826, 1827, 1828],
                rare: true, coastal: false, rarity: 0.03
            },
            "Steampunk": {
                tempMin: 50, tempMax: 85, moistMin: 30, moistMax: 70, elevationMin: 0.35, elevationMax: 0.7,
                baseTiles: [1881, 1882, 1883, 1884, 1885, 1891, 1892, 1893, 1894, 1895, 1901, 1902, 1903],
                transitionTiles: [1886, 1887, 1888, 1896, 1897, 1898, 1904, 1905],
                accentTiles: [1889, 1890, 1899, 1900, 1906, 1907, 1908],
                rare: true, coastal: false, rarity: 0.01
            },
            "Ruins": {
                tempMin: 40, tempMax: 85, moistMin: 25, moistMax: 75, elevationMin: 0.3, elevationMax: 0.7,
                baseTiles: [1961, 1962, 1963, 1964, 1965, 1971, 1972, 1973, 1974, 1975, 1981, 1982, 1983],
                transitionTiles: [1966, 1967, 1968, 1976, 1977, 1978, 1984, 1985],
                accentTiles: [1969, 1970, 1979, 1980, 1986, 1987, 1988],
                rare: true, coastal: false, rarity: 0.02
            }
        };
        
        console.log(`Complete Map Generator initialized with seed: ${this.seed}`);
        console.log(`Total biomes: ${Object.keys(this.biomeConfig).length} (including all themed biomes)`);
    }
    
    noise(x, y, scale = 100, octaves = 3, persistence = 0.4, lacunarity = 2.0) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            const sampleX = x / scale * frequency;
            const sampleY = y / scale * frequency;
            
            const noiseValue = this.smoothNoise(sampleX, sampleY, i);
            
            value += noiseValue * amplitude;
            maxValue += amplitude;
            
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        return value / maxValue;
    }
    
    ridgedNoise(x, y, scale = 100, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            const sampleX = x / scale * frequency;
            const sampleY = y / scale * frequency;
            
            let noiseValue = Math.abs(this.smoothNoise(sampleX, sampleY, i + 100));
            noiseValue = 1 - noiseValue;
            noiseValue = noiseValue * noiseValue;
            
            value += noiseValue * amplitude;
            maxValue += amplitude;
            
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        
        return value / maxValue;
    }
    
    warpedNoise(x, y, scale = 100, warpStrength = 50) {
        const warpX = this.noise(x, y, scale * 0.5, 2, 0.5) * warpStrength;
        const warpY = this.noise(x + 1000, y + 1000, scale * 0.5, 2, 0.5) * warpStrength;
        
        return this.noise(x + warpX, y + warpY, scale, 3, 0.4);
    }
    
    smoothNoise(x, y, seed = 0) {
        const x0 = Math.floor(x);
        const x1 = x0 + 1;
        const y0 = Math.floor(y);
        const y1 = y0 + 1;
        
        const v00 = this.seededRandom(x0, y0, seed);
        const v10 = this.seededRandom(x1, y0, seed);
        const v01 = this.seededRandom(x0, y1, seed);
        const v11 = this.seededRandom(x1, y1, seed);
        
        const wx = this.smoothstep(x - x0);
        const wy = this.smoothstep(y - y0);
        
        const v0 = this.lerp(v00, v10, wx);
        const v1 = this.lerp(v01, v11, wx);
        
        return this.lerp(v0, v1, wy);
    }
    
    smoothstep(t) {
        return t * t * (3 - 2 * t);
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    seededRandom(x, y, offset = 0) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed + offset * 43758.5453) * 43758.5453;
        return n - Math.floor(n);
    }
    
    getContinentalShape(x, y) {
        const continentNoise = this.warpedNoise(x, y, 8000, 1000);
        const continentPattern = this.noise(x, y, 15000, 2, 0.5);
        let continental = continentNoise * 0.7 + continentPattern * 0.3;
        continental = (continental - 0.35) * 1.5;
        return Math.max(0, Math.min(1, continental));
    }
    
    getElevation(x, y) {
        const baseElevation = this.warpedNoise(x, y, 2500, 400);
        const continental = this.getContinentalShape(x, y);
        const mountainRidges = this.ridgedNoise(x, y, 1800, 4);
        let elevation = baseElevation * 0.5 + continental * 0.3 + mountainRidges * 0.2;
        elevation += this.noise(x, y, 300, 2, 0.3) * 0.1;
        return Math.max(0, Math.min(1, elevation));
    }
    
    getTemperature(x, y) {
        const elevation = this.getElevation(x, y);
        const latitudeFactor = Math.abs(y / 12000) % 1;
        const baseTemp = 85 - (latitudeFactor * 70);
        const elevationEffect = elevation * -60;
        const continentalTemp = this.noise(x, y, 4000, 2, 0.35) * 25 - 12;
        const continental = this.getContinentalShape(x, y);
        const oceanModeration = (1 - continental) * 15;
        
        let temp = baseTemp + elevationEffect + continentalTemp;
        
        if (continental > 0.3 && continental < 0.5) {
            temp += oceanModeration;
        }
        
        const seasonalShift = [0, 10, 0, -10][this.season];
        temp += seasonalShift * latitudeFactor;
        
        return temp;
    }
    
    getMoisture(x, y) {
        const elevation = this.getElevation(x, y);
        const continental = this.getContinentalShape(x, y);
        const baseMoisture = this.warpedNoise(x + 5000, y + 5000, 3500, 600) * 100;
        
        let coastalBonus = 0;
        if (continental > 0.25 && continental < 0.45) {
            coastalBonus = 30;
        } else if (continental > 0.45 && continental < 0.55) {
            coastalBonus = 15;
        }
        
        const elevationEffect = (1 - elevation) * 25;
        
        let rainShadow = 0;
        const westElevation = this.getElevation(x - 500, y);
        if (westElevation > elevation + 0.2) {
            rainShadow = -20;
        }
        
        let moisture = baseMoisture + coastalBonus + elevationEffect + rainShadow;
        
        return Math.min(100, Math.max(0, moisture));
    }
    
    getBiomeScores(temp, moisture, elevation, continental) {
        const biomeScores = {};
        
        for (const [biomeName, config] of Object.entries(this.biomeConfig)) {
            if (config.rare) {
                const rareChance = this.seededRandom(Math.floor(temp), Math.floor(moisture), 999);
                if (rareChance > config.rarity) {
                    continue;
                }
            }
            
            if (config.coastal && (continental < 0.25 || continental > 0.45)) {
                continue;
            }
            
            const tempFit = this.getSmoothFit(temp, config.tempMin, config.tempMax);
            const moistFit = this.getSmoothFit(moisture, config.moistMin, config.moistMax);
            
            let elevationFit = 1.0;
            if (config.elevationMin !== undefined) {
                if (elevation < config.elevationMin) {
                    elevationFit *= Math.max(0, 1 - (config.elevationMin - elevation) * 3);
                }
            }
            if (config.elevationMax !== undefined) {
                if (elevation > config.elevationMax) {
                    elevationFit *= Math.max(0, 1 - (elevation - config.elevationMax) * 3);
                }
            }
            
            biomeScores[biomeName] = tempFit * moistFit * elevationFit;
        }
        
        return biomeScores;
    }
    
    getSmoothFit(value, min, max) {
        if (value >= min && value <= max) {
            const center = (min + max) / 2;
            const distance = Math.abs(value - center);
            const range = (max - min) / 2;
            return 1 - (distance / range) * 0.15;
        } else {
            const distance = value < min ? min - value : value - max;
            const falloff = Math.max(0, 1 - distance / 20);
            return falloff * falloff;
        }
    }
    
    getDominantBiome(biomeScores) {
        let bestBiome = "Plains";
        let bestScore = -Infinity;
        
        for (const [biomeName, score] of Object.entries(biomeScores)) {
            if (score > bestScore) {
                bestScore = score;
                bestBiome = biomeName;
            }
        }
        
        return bestBiome;
    }
    
    shouldTransitionBiome(biome1, biome2) {
        const forbidden = [
            ["Desert", "Snow"],
            ["Desert", "IceField"],
            ["Desert", "Tundra"],
            ["Volcanic", "Snow"],
            ["Volcanic", "IceField"],
            ["DeepOcean", "Mountain"],
            ["DeepOcean", "Desert"]
        ];
        
        for (const [a, b] of forbidden) {
            if ((biome1 === a && biome2 === b) || (biome1 === b && biome2 === a)) {
                return false;
            }
        }
        
        return true;
    }
    
    getTransitionBiome(biome1, biome2, temp, moisture, elevation) {
        const transitions = {
            "Plains-Desert": "Savanna",
            "Plains-Forest": "Grassland",
            "Forest-Snow": "Taiga",
            "Forest-Mountain": "Foothills",
            "Ocean-Plains": "Beach",
            "Desert-Mountain": "RockDesert",
            "Snow-Mountain": "Peaks"
        };
        
        const key1 = `${biome1}-${biome2}`;
        const key2 = `${biome2}-${biome1}`;
        
        return transitions[key1] || transitions[key2] || null;
    }
    
    getColorVariation(x, y) {
        return this.noise(x, y, 150, 2, 0.25);
    }
    
    getTileFromSet(x, y, tileArray, variationNoise, contextModifier = 0) {
        if (!tileArray || tileArray.length === 0) return 1;
        
        let index = Math.floor((variationNoise + contextModifier) * tileArray.length);
        index = Math.max(0, Math.min(tileArray.length - 1, index));
        
        return tileArray[index];
    }
    
    getBlendedTile(x, y, biomeScores, temp, moisture, elevation) {
        const sortedBiomes = Object.entries(biomeScores).sort((a, b) => b[1] - a[1]);
        const primaryBiome = sortedBiomes[0][0];
        const primaryScore = sortedBiomes[0][1];
        const secondaryBiome = sortedBiomes[1] ? sortedBiomes[1][0] : null;
        const secondaryScore = sortedBiomes[1] ? sortedBiomes[1][1] : 0;
        
        const primaryConfig = this.biomeConfig[primaryBiome];
        if (!primaryConfig) return 1;
        
        const isEdge = secondaryScore > 0.4 && secondaryBiome && 
                      this.shouldTransitionBiome(primaryBiome, secondaryBiome);
        
        const colorVar = this.getColorVariation(x, y);
        
        let contextModifier = 0;
        
        const nearbyMoisture = this.getMoisture(x + 100, y);
        if (nearbyMoisture > moisture + 20) {
            contextModifier += 0.15;
        }
        
        const nearbyElevation = this.getElevation(x, y + 100);
        if (nearbyElevation > elevation + 0.2) {
            contextModifier -= 0.1;
        }
        
        let tileId;
        
        if (isEdge && secondaryScore > 0.5) {
            const transitionBiome = this.getTransitionBiome(primaryBiome, secondaryBiome, temp, moisture, elevation);
            if (transitionBiome && this.biomeConfig[transitionBiome]) {
                const transConfig = this.biomeConfig[transitionBiome];
                tileId = this.getTileFromSet(x, y, transConfig.baseTiles, colorVar, contextModifier);
            } else {
                tileId = this.getTileFromSet(x, y, primaryConfig.transitionTiles, colorVar, contextModifier);
            }
        } else if (colorVar < 0.80) {
            tileId = this.getTileFromSet(x, y, primaryConfig.baseTiles, colorVar, contextModifier);
        } else if (colorVar < 0.94) {
            tileId = this.getTileFromSet(x, y, primaryConfig.transitionTiles, colorVar, contextModifier);
        } else {
            tileId = this.getTileFromSet(x, y, primaryConfig.accentTiles, colorVar, contextModifier);
        }
        
        return tileId;
    }
    
    generateTile(worldX, worldY) {
        // CHECK IF IN RESERVED CASTLE AREA - FORCE FOREST BIOME
        const dx = worldX - this.castleSpawnArea.centerX;
        const dy = worldY - this.castleSpawnArea.centerY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        if (distanceFromCenter <= this.castleSpawnArea.radius) {
            // FORCE FOREST BIOME - override all normal generation
            const forestConfig = this.biomeConfig["Forest"];
            const tileId = forestConfig.baseTiles[Math.floor(this.noise(worldX * 0.1, worldY * 0.1) * forestConfig.baseTiles.length)];
            const tile = TILE_LIBRARY.getTileById(tileId);
            
            return {
                id: tile ? tile.id : 51,
                color: tile ? tile.color : "#2d5016",
                walkable: true,
                biome: "Forest",
                name: tile ? tile.name : "Forest",
                temp: 60,  // Perfect temperature for Forest
                moisture: 70,  // Perfect moisture for Forest
                elevation: 0.5,  // Perfect elevation for castle
                continental: 1.0,
                castleArea: true  // Mark as castle area
            };
        }
        
        // Normal generation for non-castle areas
        const elevation = this.getElevation(worldX, worldY);
        const continental = this.getContinentalShape(worldX, worldY);
        const temp = this.getTemperature(worldX, worldY);
        const moisture = this.getMoisture(worldX, worldY);
        
        const biomeScores = this.getBiomeScores(temp, moisture, elevation, continental);
        const dominantBiome = this.getDominantBiome(biomeScores);
        
        const tileId = this.getBlendedTile(worldX, worldY, biomeScores, temp, moisture, elevation);
        
        const tile = TILE_LIBRARY.getTileById(tileId);
        
        if (!tile) {
            return {
                id: 1,
                color: "#4a7c3e",
                walkable: true,
                biome: "Plains"
            };
        }
        
        return {
            id: tile.id,
            color: tile.color,
            walkable: tile.walkable !== false,
            biome: dominantBiome,
            name: tile.name,
            temp: temp,
            moisture: moisture,
            elevation: elevation,
            continental: continental
        };
    }
    
    generateChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        
        if (this.chunks.has(chunkKey)) {
            return this.chunks.get(chunkKey);
        }
        
        const chunk = {
            x: chunkX,
            y: chunkY,
            tiles: []
        };
        
        for (let localY = 0; localY < this.CHUNK_SIZE; localY++) {
            chunk.tiles[localY] = [];
            for (let localX = 0; localX < this.CHUNK_SIZE; localX++) {
                const worldX = chunkX * this.CHUNK_SIZE + localX;
                const worldY = chunkY * this.CHUNK_SIZE + localY;
                
                chunk.tiles[localY][localX] = this.generateTile(worldX, worldY);
            }
        }
        
        this.ensureChunkCoherence(chunk);
        
        this.chunks.set(chunkKey, chunk);
        return chunk;
    }
    
    ensureChunkCoherence(chunk) {
        const minPatchSize = 4;
        
        for (let ly = 0; ly < this.CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < this.CHUNK_SIZE; lx++) {
                const tile = chunk.tiles[ly][lx];
                
                const neighbors = [];
                if (lx > 0) neighbors.push(chunk.tiles[ly][lx - 1]);
                if (lx < this.CHUNK_SIZE - 1) neighbors.push(chunk.tiles[ly][lx + 1]);
                if (ly > 0) neighbors.push(chunk.tiles[ly - 1][lx]);
                if (ly < this.CHUNK_SIZE - 1) neighbors.push(chunk.tiles[ly + 1][lx]);
                
                const biomeCounts = {};
                for (const neighbor of neighbors) {
                    biomeCounts[neighbor.biome] = (biomeCounts[neighbor.biome] || 0) + 1;
                }
                
                const differentNeighbors = neighbors.filter(n => n.biome !== tile.biome).length;
                if (differentNeighbors >= 3) {
                    let mostCommonBiome = tile.biome;
                    let maxCount = 0;
                    for (const [biome, count] of Object.entries(biomeCounts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            mostCommonBiome = biome;
                        }
                    }
                    
                    if (mostCommonBiome !== tile.biome) {
                        tile.biome = mostCommonBiome;
                    }
                }
            }
        }
    }
    
    getTileAt(worldX, worldY) {
        const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
        const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
        
        const chunk = this.generateChunk(chunkX, chunkY);
        
        const localX = worldX - (chunkX * this.CHUNK_SIZE);
        const localY = worldY - (chunkY * this.CHUNK_SIZE);
        
        if (localX < 0 || localX >= this.CHUNK_SIZE || 
            localY < 0 || localY >= this.CHUNK_SIZE) {
            return null;
        }
        
        return chunk.tiles[localY][localX];
    }
    
    isWalkable(worldX, worldY) {
        const tileX = Math.floor(worldX / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(worldY / CONSTANTS.TILE_SIZE);
        const tile = this.getTileAt(tileX, tileY);
        return tile ? tile.walkable : true;
    }
    
    getChunkCount() {
        return this.chunks.size;
    }
    
    getBiomeAt(worldX, worldY) {
        const tile = this.getTileAt(
            Math.floor(worldX / CONSTANTS.TILE_SIZE),
            Math.floor(worldY / CONSTANTS.TILE_SIZE)
        );
        return tile ? tile.biome : "Unknown";
    }
    
    getTileData(worldX, worldY) {
        const tile = this.getTileAt(
            Math.floor(worldX / CONSTANTS.TILE_SIZE),
            Math.floor(worldY / CONSTANTS.TILE_SIZE)
        );
        return tile || null;
    }
    
    getEnvironment(worldX, worldY) {
        const tile = this.getTileData(worldX, worldY);
        if (!tile) return null;
        
        return {
            biome: tile.biome,
            temperature: tile.temp,
            moisture: tile.moisture,
            elevation: tile.elevation,
            walkable: tile.walkable,
            tileName: tile.name
        };
    }
    
    isInBiome(worldX, worldY, biomeName) {
        const biome = this.getBiomeAt(worldX, worldY);
        return biome === biomeName;
    }
    
    getBiomesInRegion(startX, startY, width, height) {
        const biomes = new Set();
        const tileStartX = Math.floor(startX / CONSTANTS.TILE_SIZE);
        const tileStartY = Math.floor(startY / CONSTANTS.TILE_SIZE);
        const tileEndX = Math.floor((startX + width) / CONSTANTS.TILE_SIZE);
        const tileEndY = Math.floor((startY + height) / CONSTANTS.TILE_SIZE);
        
        for (let ty = tileStartY; ty <= tileEndY; ty++) {
            for (let tx = tileStartX; tx <= tileEndX; tx++) {
                const tile = this.getTileAt(tx, ty);
                if (tile && tile.biome) {
                    biomes.add(tile.biome);
                }
            }
        }
        
        return Array.from(biomes);
    }
    
    isRegionPureBiome(centerX, centerY, radius, biomeName, purityThreshold = 0.8) {
        const startX = centerX - radius;
        const startY = centerY - radius;
        const size = radius * 2;
        
        const tileStartX = Math.floor(startX / CONSTANTS.TILE_SIZE);
        const tileStartY = Math.floor(startY / CONSTANTS.TILE_SIZE);
        const tileEndX = Math.floor((startX + size) / CONSTANTS.TILE_SIZE);
        const tileEndY = Math.floor((startY + size) / CONSTANTS.TILE_SIZE);
        
        let totalTiles = 0;
        let matchingTiles = 0;
        
        for (let ty = tileStartY; ty <= tileEndY; ty++) {
            for (let tx = tileStartX; tx <= tileEndX; tx++) {
                const tile = this.getTileAt(tx, ty);
                if (tile) {
                    totalTiles++;
                    if (tile.biome === biomeName) {
                        matchingTiles++;
                    }
                }
            }
        }
        
        return totalTiles > 0 && (matchingTiles / totalTiles) >= purityThreshold;
    }
    
    findBiomeSpawnLocation(biomeName, searchRadius = 1000, maxAttempts = 50) {
        for (let i = 0; i < maxAttempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * searchRadius;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            if (this.isInBiome(x, y, biomeName)) {
                const tile = this.getTileData(x, y);
                if (tile && tile.walkable) {
                    return { x, y, tile };
                }
            }
        }
        
        return null;
    }
    
    getAvailableBiomes() {
        return Object.keys(this.biomeConfig);
    }
    
    getBiomeConfig(biomeName) {
        return this.biomeConfig[biomeName] || null;
    }
    
    getTemperatureAt(worldX, worldY) {
        const tileX = Math.floor(worldX / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(worldY / CONSTANTS.TILE_SIZE);
        const tile = this.getTileAt(tileX, tileY);
        return tile ? tile.temp : 70;
    }
    
    getMoistureAt(worldX, worldY) {
        const tileX = Math.floor(worldX / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(worldY / CONSTANTS.TILE_SIZE);
        const tile = this.getTileAt(tileX, tileY);
        return tile ? tile.moisture : 50;
    }
    
    getElevationAt(worldX, worldY) {
        const tileX = Math.floor(worldX / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(worldY / CONSTANTS.TILE_SIZE);
        const tile = this.getTileAt(tileX, tileY);
        return tile ? tile.elevation : 0.5;
    }
    
    findNearestBiome(startX, startY, biomeName, maxSearchRadius = 5000) {
        const searchStep = CONSTANTS.TILE_SIZE * 4;
        let closestDistance = Infinity;
        let closestPos = null;
        
        for (let radius = searchStep; radius <= maxSearchRadius; radius += searchStep) {
            const numPoints = Math.floor(2 * Math.PI * radius / searchStep);
            
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const x = startX + Math.cos(angle) * radius;
                const y = startY + Math.sin(angle) * radius;
                
                if (this.isInBiome(x, y, biomeName)) {
                    const distance = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPos = { x, y, distance };
                    }
                }
            }
            
            if (closestPos) return closestPos;
        }
        
        return null;
    }
    
    getBiomeTransitionStrength(worldX, worldY) {
        const tileX = Math.floor(worldX / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(worldY / CONSTANTS.TILE_SIZE);
        
        const centerBiome = this.getBiomeAt(worldX, worldY);
        const checkRadius = 3;
        let differentCount = 0;
        let totalChecks = 0;
        
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const checkX = (tileX + dx) * CONSTANTS.TILE_SIZE;
                const checkY = (tileY + dy) * CONSTANTS.TILE_SIZE;
                const biome = this.getBiomeAt(checkX, checkY);
                if (biome !== centerBiome) differentCount++;
                totalChecks++;
            }
        }
        
        return differentCount / totalChecks;
    }
    
    setSeason(season) {
        this.season = season % 4;
        console.log(`Season changed to: ${['Spring', 'Summer', 'Fall', 'Winter'][this.season]}`);
    }
    
    clearDistantChunks(centerX, centerY, keepRadius) {
        const centerChunkX = Math.floor(centerX / (this.CHUNK_SIZE * CONSTANTS.TILE_SIZE));
        const centerChunkY = Math.floor(centerY / (this.CHUNK_SIZE * CONSTANTS.TILE_SIZE));
        const chunkRadius = Math.ceil(keepRadius / (this.CHUNK_SIZE * CONSTANTS.TILE_SIZE));
        
        const chunksToDelete = [];
        
        for (const [key, chunk] of this.chunks.entries()) {
            const dx = Math.abs(chunk.x - centerChunkX);
            const dy = Math.abs(chunk.y - centerChunkY);
            
            if (dx > chunkRadius || dy > chunkRadius) {
                chunksToDelete.push(key);
            }
        }
        
        for (const key of chunksToDelete) {
            this.chunks.delete(key);
        }
        
        if (chunksToDelete.length > 0) {
            console.log(`Cleared ${chunksToDelete.length} distant chunks`);
        }
    }
    
    // Get the guaranteed castle spawn area location
    getCastleSpawnLocation() {
        return {
            x: this.castleSpawnArea.centerX,
            y: this.castleSpawnArea.centerY,
            radius: this.castleSpawnArea.radius,
            biome: "Forest"
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}