// Procedural Biome Generation using Perlin Noise
// Lightweight and maintainable

class PerlinNoise {
    constructor(seed = 12345) {
        this.seed = seed;
        this.permutation = [];
        this.initializePermutation();
    }

    initializePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;

        let random = this.seed;
        for (let i = 255; i > 0; i--) {
            random = (random * 1103515245 + 12345) & 0x7fffffff;
            const j = random % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }

        this.permutation = [...p, ...p];
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }

    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);
        const p = this.permutation;
        const a = p[X] + Y;
        const b = p[X + 1] + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(p[a], x, y), this.grad(p[b], x - 1, y)),
            this.lerp(u, this.grad(p[a + 1], x, y - 1), this.grad(p[b + 1], x - 1, y - 1))
        );
    }

    octaveNoise(x, y, octaves = 4, persistence = 0.5) {
        let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return total / maxValue;
    }
}

class BiomeGenerator {
    constructor(seed, worldWidth = 4000, worldHeight = 4000) {
        this.seed = seed;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.spawnX = worldWidth / 2;
        this.spawnY = worldHeight / 2;
        this.spawnRadius = 800;

        this.elevationNoise = new PerlinNoise(seed);
        this.temperatureNoise = new PerlinNoise(seed + 1000);
        this.moistureNoise = new PerlinNoise(seed + 2000);
        this.biomeCache = new Map();
    }

    getBiomeAtPosition(worldX, worldY) {
        const key = `${Math.floor(worldX/48)},${Math.floor(worldY/48)}`;
        if (this.biomeCache.has(key)) return this.biomeCache.get(key);

        const scale = 0.0004;
        const elevation = (this.elevationNoise.octaveNoise(worldX * scale, worldY * scale, 8, 0.5) + 1) / 2;
        let temperature = (this.temperatureNoise.octaveNoise(worldX * scale * 0.6, worldY * scale * 0.6, 5, 0.55) + 1) / 2;
        let moisture = (this.moistureNoise.octaveNoise(worldX * scale * 0.6, worldY * scale * 0.6, 5, 0.55) + 1) / 2;

        temperature -= elevation * 0.4;
        if (elevation > 0.6) moisture -= (elevation - 0.6) * 0.3;

        const biome = this.determineBiome(elevation, temperature, moisture, worldX, worldY);
        this.biomeCache.set(key, biome);
        return biome;
    }

    determineBiome(elev, temp, moist, x, y) {
        const distFromSpawn = Math.hypot(x - this.spawnX, y - this.spawnY);
        if (distFromSpawn < this.spawnRadius) {
            if (elev < 0.35) return 'beach';
            if (moist > 0.65) return 'forest';
            if (moist > 0.40) return 'grassland';
            return 'plains';
        }

        if (elev < 0.20) return 'deep_ocean';
        if (elev < 0.30) return 'ocean';
        if (elev < 0.35) return 'beach';
        if (elev > 0.80) return temp < 0.25 ? 'snow_peaks' : 'mountains';
        if (elev > 0.65) return 'hills';

        if (temp > 0.75 && moist < 0.20) return 'desert';
        if (temp > 0.75 && moist > 0.80) return 'jungle';
        if (moist > 0.80) return temp > 0.55 ? 'jungle' : 'swamp';
        if (moist > 0.70) return 'dense_forest';
        if (moist > 0.60) return temp > 0.35 && temp < 0.50 ? 'autumn_forest' : 'forest';
        if (moist > 0.45) return 'forest';
        if (moist > 0.35) return 'grassland';

        return 'plains';
    }

    getBiomeColor(biome) {
        const colors = {
            deep_ocean: 0x0a2463, ocean: 0x1a5490, beach: 0xf0e68c,
            plains: 0x7cbd56, grassland: 0x4a7c59, meadow: 0x6a9c79,
            forest: 0x2d5016, dense_forest: 0x1d4006, autumn_forest: 0x8b4513,
            mountains: 0x696969, hills: 0x8b7355, snow_peaks: 0xf0f8ff,
            desert: 0xedc9af, savanna: 0xdaa520, volcanic: 0x8b0000,
            jungle: 0x0f5f1c, swamp: 0x3a4a3a, wasteland: 0x4a4a5a
        };
        return colors[biome] || 0x7cbd56;
    }

    seededRandom(x, y, offset = 0) {
        const seed = (x * 73856093) ^ (y * 19349663) ^ (offset * 83492791);
        const random = Math.abs(Math.sin(seed) * 43758.5453123);
        return random - Math.floor(random);
    }
}
