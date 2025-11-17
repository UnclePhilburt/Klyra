/**
 * Interactive Tile Grid Background
 * Creates a grid of tiles that fill in on hover with a cool wave/ripple effect
 */
class TileGridBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Tile grid canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.tiles = [];
        this.tileSize = 48; // Tileset tiles are 48x48
        this.cols = 0;
        this.rows = 0;
        this.mouseX = -1000;
        this.mouseY = -1000;
        this.hoverRadius = 100; // How far the hover effect reaches

        // Grass tile sources - will be loaded from the game's tilesets
        this.grassTiles = [];
        this.tilesetLoaded = false;

        // Particle system for floating effects
        this.particles = [];
        this.maxParticles = 40;

        // Weather effects - falling leaves
        this.leaves = [];
        this.maxLeaves = 30;
        this.windStrength = 0;
        this.windDirection = 0;

        // Light rays
        this.lightRays = [];
        this.numLightRays = 5;

        // Wave animation
        this.waveOffset = 0;
        this.waveSpeed = 0.5;

        // Initial reveal animation
        this.revealProgress = 0;
        this.isRevealing = true;

        // Mouse trail
        this.mouseTrail = [];
        this.maxTrailLength = 10;

        // Parallax effect
        this.parallaxMouseX = 0;
        this.parallaxMouseY = 0;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        this.parallaxStrength = 50; // How much parallax movement (increased for visibility)

        // Load the tileset
        this.loadTileset();
    }

    loadTileset() {
        // Load the grass tileset image
        const tilesetImage = new Image();
        tilesetImage.crossOrigin = "anonymous";
        tilesetImage.onload = () => {
            console.log('✅ Grass tileset loaded for start screen');
            this.tilesetImage = tilesetImage;
            this.tilesetLoaded = true;

            // Extract grass tile variations from the tileset
            // The a2_forest.png has grass tiles in a grid (48x48 each)
            // We'll extract a few different grass tile variations
            this.extractGrassTiles();

            // Start the animation after tileset is loaded
            this.init();
        };
        tilesetImage.onerror = () => {
            console.warn('⚠️ Could not load grass tileset, using fallback colors');
            this.tilesetLoaded = false;
            this.init();
        };
        // Try loading the forest tileset which has nice grass
        tilesetImage.src = 'assets/tilesets/a2_forest.png';
    }

    extractGrassTiles() {
        // Create temporary canvas to extract individual tiles
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 48;
        tempCanvas.height = 48;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        // Extract several grass tile variations from the tileset
        // a2_forest.png has grass tiles in the top rows
        const grassPositions = [
            {x: 0, y: 0},    // First grass tile
            {x: 1, y: 0},    // Second variation
            {x: 2, y: 0},    // Third variation
            {x: 0, y: 1},    // Fourth variation
            {x: 1, y: 1},    // Fifth variation
            {x: 2, y: 1},    // Sixth variation
        ];

        grassPositions.forEach(pos => {
            tempCtx.clearRect(0, 0, 48, 48);
            tempCtx.drawImage(
                this.tilesetImage,
                pos.x * 48, pos.y * 48, 48, 48,  // Source from tileset
                0, 0, 48, 48                       // Dest on temp canvas
            );

            // Store as image data
            const imageData = tempCtx.getImageData(0, 0, 48, 48);
            this.grassTiles.push(imageData);
        });

        console.log(`✅ Extracted ${this.grassTiles.length} grass tile variations`);
    }

    init() {
        this.resize();
        this.setupEventListeners();
        this.createParticles();
        this.createLeaves();
        this.createLightRays();
        this.animate();
    }

    createParticles() {
        // Create floating particles (sparkles)
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.3 + 0.2,
                color: Math.random() > 0.5 ? 'rgba(107, 79, 255,' : 'rgba(255, 215, 0,',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }

    createLeaves() {
        // Create falling leaves with realistic physics
        for (let i = 0; i < this.maxLeaves; i++) {
            this.leaves.push(this.createLeaf());
        }
    }

    createLeaf() {
        const colors = [
            'rgba(255, 107, 107,', // Red leaf
            'rgba(255, 193, 107,', // Orange leaf
            'rgba(255, 215, 0,',   // Gold leaf
            'rgba(107, 255, 107,', // Green leaf
        ];

        return {
            x: Math.random() * this.canvas.width,
            y: -Math.random() * this.canvas.height, // Start above screen
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 1 + 0.5,
            size: Math.random() * 8 + 4,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            swayAmplitude: Math.random() * 2 + 1,
            swaySpeed: Math.random() * 0.03 + 0.01,
            swayOffset: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.6 + 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            impactTiles: [], // Tiles that were impacted by this leaf
        };
    }

    createLightRays() {
        // Create sweeping god rays
        for (let i = 0; i < this.numLightRays; i++) {
            this.lightRays.push({
                x: (i / this.numLightRays) * this.canvas.width,
                angle: -75 + (Math.random() * 30), // Angle in degrees
                width: Math.random() * 150 + 100, // Wider beams
                opacity: Math.random() * 0.15 + 0.12, // Much brighter
                speed: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
                height: this.canvas.height * 1.5,
            });
        }
    }

    updateParticles() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;

            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        });
    }

    updateLeaves() {
        const time = Date.now() / 1000;

        // Update wind
        this.windStrength = Math.sin(time * 0.5) * 1.5;
        this.windDirection = Math.cos(time * 0.3) * Math.PI / 4;

        this.leaves.forEach((leaf, index) => {
            // Apply gravity
            leaf.vy += 0.02;

            // Apply wind
            leaf.vx += this.windStrength * 0.01;

            // Swaying motion
            const sway = Math.sin(time * leaf.swaySpeed + leaf.swayOffset) * leaf.swayAmplitude;
            leaf.x += leaf.vx + sway * 0.1;
            leaf.y += leaf.vy;

            // Rotation
            leaf.rotation += leaf.rotationSpeed;

            // Check if leaf hit grass tile - create impact effect
            const tileX = Math.floor(leaf.x / this.tileSize);
            const tileY = Math.floor(leaf.y / this.tileSize);
            const tileIndex = tileY * this.cols + tileX;

            if (this.tiles[tileIndex] && !leaf.impactTiles.includes(tileIndex)) {
                // Activate the tile briefly
                this.tiles[tileIndex].targetFill = Math.max(this.tiles[tileIndex].targetFill, 0.3);
                this.tiles[tileIndex].lastActivated = Date.now();
                leaf.impactTiles.push(tileIndex);
            }

            // Reset when off screen
            if (leaf.y > this.canvas.height + 50) {
                this.leaves[index] = this.createLeaf();
            }
            if (leaf.x < -50) leaf.x = this.canvas.width + 50;
            if (leaf.x > this.canvas.width + 50) leaf.x = -50;
        });
    }

    updateLightRays() {
        this.lightRays.forEach(ray => {
            // Move light rays horizontally
            ray.x += ray.speed;

            // Wrap around
            if (ray.x > this.canvas.width + 200) {
                ray.x = -200;
            }
            if (ray.x < -200) {
                ray.x = this.canvas.width + 200;
            }

            // Slight opacity pulsing (much brighter)
            const time = Date.now() / 1000;
            ray.opacity = 0.15 + Math.sin(time * 0.5 + ray.x * 0.01) * 0.08;
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);

            // Draw as a diamond/sparkle
            this.ctx.fillStyle = particle.color + particle.opacity + ')';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -particle.size);
            this.ctx.lineTo(particle.size, 0);
            this.ctx.lineTo(0, particle.size);
            this.ctx.lineTo(-particle.size, 0);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    drawLeaves() {
        this.leaves.forEach(leaf => {
            this.ctx.save();
            this.ctx.translate(leaf.x, leaf.y);
            this.ctx.rotate(leaf.rotation);
            this.ctx.globalAlpha = leaf.opacity;

            // Draw leaf as an oval with detail
            this.ctx.fillStyle = leaf.color + leaf.opacity + ')';

            // Main leaf shape
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, leaf.size, leaf.size * 1.5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Leaf vein
            this.ctx.strokeStyle = leaf.color + (leaf.opacity * 0.5) + ')';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -leaf.size * 1.5);
            this.ctx.lineTo(0, leaf.size * 1.5);
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    drawLightRays() {
        this.lightRays.forEach(ray => {
            this.ctx.save();

            // Create angled light beam
            this.ctx.translate(ray.x, 0);
            this.ctx.rotate((ray.angle * Math.PI) / 180);

            // Create gradient for god ray - brighter and more colorful
            const gradient = this.ctx.createLinearGradient(-ray.width / 2, 0, ray.width / 2, 0);
            gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
            gradient.addColorStop(0.3, `rgba(255, 235, 150, ${ray.opacity * 0.5})`);
            gradient.addColorStop(0.5, `rgba(255, 250, 200, ${ray.opacity})`);
            gradient.addColorStop(0.7, `rgba(255, 235, 150, ${ray.opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(-ray.width / 2, 0, ray.width, ray.height);

            // Add a secondary glow effect for more visibility
            this.ctx.globalCompositeOperation = 'screen';
            const glowGradient = this.ctx.createLinearGradient(-ray.width / 2, 0, ray.width / 2, 0);
            glowGradient.addColorStop(0, `rgba(255, 215, 0, 0)`);
            glowGradient.addColorStop(0.5, `rgba(255, 215, 0, ${ray.opacity * 0.3})`);
            glowGradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(-ray.width / 2, 0, ray.width, ray.height);

            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.restore();
        });
    }

    resize() {
        // Set canvas size to match viewport
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Calculate grid dimensions
        this.cols = Math.ceil(this.canvas.width / this.tileSize) + 1;
        this.rows = Math.ceil(this.canvas.height / this.tileSize) + 1;

        // Create tile grid
        this.createTiles();
    }

    createTiles() {
        this.tiles = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // Pick a random grass tile variation
                const tileVariation = Math.floor(Math.random() * (this.grassTiles.length || 6));

                this.tiles.push({
                    x: col * this.tileSize,
                    y: row * this.tileSize,
                    fillAmount: 0,        // 0 to 1, how filled the tile is
                    targetFill: 0,        // Target fill amount
                    lastActivated: 0,     // Timestamp for wave effects
                    glowIntensity: 0,     // For glow effect
                    randomPulse: Math.random() * 0.05,  // Subtle random pulse
                    pulseOffset: Math.random() * Math.PI * 2,  // Random phase offset
                    tileVariation: tileVariation  // Which grass tile to use
                });
            }
        }
    }

    setupEventListeners() {
        // Track mouse movement for parallax
        const handleMouseMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;

            // Calculate parallax mouse position (-1 to 1 range)
            this.parallaxMouseX = (this.mouseX / this.canvas.width) * 2 - 1;
            this.parallaxMouseY = (this.mouseY / this.canvas.height) * 2 - 1;

            // Add to trail
            this.mouseTrail.push({
                x: this.mouseX,
                y: this.mouseY,
                life: 1.0
            });

            // Limit trail length
            if (this.mouseTrail.length > this.maxTrailLength) {
                this.mouseTrail.shift();
            }
        };

        this.canvas.addEventListener('mousemove', handleMouseMove);

        // Also track on document for better coverage
        document.addEventListener('mousemove', handleMouseMove);

        // Reset on mouse leave
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseX = -1000;
            this.mouseY = -1000;
        });

        // Create ripple effect on click
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            this.createRipple(clickX, clickY);
        });

        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    createRipple(x, y) {
        const now = Date.now();
        this.tiles.forEach(tile => {
            const dx = tile.x + this.tileSize / 2 - x;
            const dy = tile.y + this.tileSize / 2 - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Create expanding ripple effect
            if (distance < 300) {
                const delay = distance * 2; // Delay based on distance
                setTimeout(() => {
                    tile.targetFill = 1;
                    tile.glowIntensity = 1;
                    tile.lastActivated = Date.now();
                }, delay);
            }
        });
    }

    updateTiles() {
        const now = Date.now();

        // Update wave offset
        this.waveOffset += this.waveSpeed;

        // Update parallax camera offset (smooth interpolation)
        const targetOffsetX = this.parallaxMouseX * this.parallaxStrength;
        const targetOffsetY = this.parallaxMouseY * this.parallaxStrength;
        this.cameraOffsetX += (targetOffsetX - this.cameraOffsetX) * 0.15;
        this.cameraOffsetY += (targetOffsetY - this.cameraOffsetY) * 0.15;


        // Update reveal animation
        if (this.isRevealing) {
            this.revealProgress += 0.02; // Much faster reveal
            if (this.revealProgress >= 1) {
                this.isRevealing = false;
                this.revealProgress = 1;
            }
        }

        // Update mouse trail life
        this.mouseTrail.forEach(point => {
            point.life -= 0.05;
        });
        this.mouseTrail = this.mouseTrail.filter(point => point.life > 0);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.tiles.forEach(tile => {
            const tileCenterX = tile.x + this.tileSize / 2;
            const tileCenterY = tile.y + this.tileSize / 2;

            // Calculate distance from mouse
            const dx = tileCenterX - this.mouseX;
            const dy = tileCenterY - this.mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Calculate distance from center for reveal animation
            const centerDx = tileCenterX - centerX;
            const centerDy = tileCenterY - centerY;
            const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy);

            // Automatic wave animation
            const waveValue = Math.sin((tileCenterX / 100) + (tileCenterY / 100) + this.waveOffset);
            const waveIntensity = (waveValue + 1) / 2 * 0.15; // 0 to 0.15

            // Initial reveal from center
            const maxRevealDistance = Math.sqrt(centerX * centerX + centerY * centerY);
            const revealThreshold = this.revealProgress * maxRevealDistance;
            const isRevealed = centerDistance < revealThreshold;

            // Only use wave intensity, no mouse interaction
            tile.targetFill = isRevealed ? waveIntensity : 0;
            tile.glowIntensity = 0;

            // Smoothly interpolate to target fill
            tile.fillAmount += (tile.targetFill - tile.fillAmount) * 0.15;

            // Clamp values
            tile.fillAmount = Math.max(0, Math.min(1, tile.fillAmount));
            tile.glowIntensity = Math.max(0, Math.min(1, tile.glowIntensity));
        });
    }

    drawTiles() {
        const time = Date.now() / 1000; // For animation timing

        // Save main context
        this.ctx.save();

        // Clear canvas with the current transform
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Save context for parallax transform
        this.ctx.save();

        // Apply parallax offset to tiles (layer 0 - closest, moves most)
        this.ctx.translate(this.cameraOffsetX * 0.3, this.cameraOffsetY * 0.3);

        this.tiles.forEach(tile => {
            const x = tile.x;
            const y = tile.y;
            const size = this.tileSize;

            // Add subtle pulse to outline opacity
            const pulseValue = Math.sin(time * 2 + tile.pulseOffset) * 0.5 + 0.5;
            const outlineAlpha = 0.05 + (tile.randomPulse * pulseValue);

            // Draw tile outline (always visible with subtle pulse)
            this.ctx.strokeStyle = `rgba(107, 79, 255, ${outlineAlpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, size, size);

            // Draw filled portion if active
            if (tile.fillAmount > 0.01) {
                // If tileset is loaded, draw the actual grass tile
                if (this.tilesetLoaded && this.grassTiles.length > 0) {
                    this.ctx.save();

                    // Set opacity based on fill amount
                    this.ctx.globalAlpha = tile.fillAmount;

                    // Draw the grass tile
                    const grassTileData = this.grassTiles[tile.tileVariation];
                    if (grassTileData) {
                        this.ctx.putImageData(grassTileData, x, y);
                    }

                    // Add color tint overlay if glowing
                    if (tile.glowIntensity > 0.3) {
                        this.ctx.globalAlpha = tile.glowIntensity * 0.2;
                        this.ctx.fillStyle = '#6B4FFF'; // Purple tint
                        this.ctx.fillRect(x, y, size, size);
                    }

                    this.ctx.restore();

                    // Add glow effect on top
                    if (tile.glowIntensity > 0.2) {
                        this.ctx.strokeStyle = `rgba(107, 79, 255, ${tile.glowIntensity * 0.4})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
                    }

                    // Accent border on highly filled tiles
                    if (tile.fillAmount > 0.7) {
                        this.ctx.strokeStyle = `rgba(255, 215, 0, ${(tile.fillAmount - 0.7) * 0.6})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x, y, size, size);
                    }
                } else {
                    // Fallback to colored rectangles if tileset not loaded
                    const alpha = tile.fillAmount * 0.3;
                    this.ctx.fillStyle = `rgba(252, 15, 192, ${alpha})`;
                    this.ctx.fillRect(x, y, size, size);

                    if (tile.glowIntensity > 0.1) {
                        this.ctx.strokeStyle = `rgba(107, 79, 255, ${tile.glowIntensity * 0.6})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
                    }

                    if (tile.fillAmount > 0.7) {
                        this.ctx.strokeStyle = `rgba(255, 215, 0, ${(tile.fillAmount - 0.7) * 0.8})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x, y, size, size);
                    }
                }
            }
        });

        // Restore context after tiles
        this.ctx.restore();

        // Draw light rays on top of tiles (layer 1 - mid depth)
        this.ctx.save();
        this.ctx.translate(this.cameraOffsetX * 0.5, this.cameraOffsetY * 0.5);
        this.drawLightRays();
        this.ctx.restore();

        // Draw falling leaves (layer 2 - further back, moves less)
        this.ctx.save();
        this.ctx.translate(this.cameraOffsetX * 0.7, this.cameraOffsetY * 0.7);
        this.drawLeaves();
        this.ctx.restore();

        // Draw floating particles on top (layer 3 - farthest, moves most)
        this.ctx.save();
        this.ctx.translate(this.cameraOffsetX * 1.0, this.cameraOffsetY * 1.0);
        this.drawParticles();
        this.ctx.restore();
    }

    animate() {
        if (this.isDestroyed) return;

        this.updateTiles();
        this.updateParticles();
        this.updateLeaves();
        this.updateLightRays();
        this.drawTiles();
        requestAnimationFrame(() => this.animate());
    }

    // Call this when transitioning away from start screen
    destroy() {
        // Stop animation loop by not calling requestAnimationFrame
        this.isDestroyed = true;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tileGridBackground = new TileGridBackground('tileGridCanvas');
        window.lobbyTileGridBackground = new TileGridBackground('lobbyTileGridCanvas');
    });
} else {
    window.tileGridBackground = new TileGridBackground('tileGridCanvas');
    window.lobbyTileGridBackground = new TileGridBackground('lobbyTileGridCanvas');
}
