// AllyManager - Detects and manages nearby allied players
class AllyManager {
    constructor(scene) {
        this.scene = scene;
        this.nearbyAllies = []; // Players within detection range
        this.detectionRange = 800; // 25 tiles (32px each)

        // Update ally detection every 100ms
        this.updateTimer = scene.time.addEvent({
            delay: 100,
            callback: this.updateNearbyAllies,
            callbackScope: this,
            loop: true
        });
    }

    updateNearbyAllies() {
        if (!this.scene.localPlayer) return;

        const px = this.scene.localPlayer.sprite.x;
        const py = this.scene.localPlayer.sprite.y;

        // Find all other players within range
        this.nearbyAllies = Object.values(this.scene.otherPlayers || {})
            .filter(player => {
                if (!player || !player.sprite || !player.isAlive) return false;

                const dist = Phaser.Math.Distance.Between(
                    px, py,
                    player.sprite.x, player.sprite.y
                );

                return dist <= this.detectionRange;
            });
    }

    // Get all allies within specific range
    getAlliesInRange(x, y, range) {
        return this.nearbyAllies.filter(ally => {
            const dist = Phaser.Math.Distance.Between(
                x, y,
                ally.sprite.x, ally.sprite.y
            );
            return dist <= range * 32; // Convert tiles to pixels
        });
    }

    // Get nearest ally
    getNearestAlly(x, y, maxRange = 100) {
        let nearest = null;
        let nearestDist = maxRange * 32;

        for (const ally of this.nearbyAllies) {
            const dist = Phaser.Math.Distance.Between(
                x, y,
                ally.sprite.x, ally.sprite.y
            );

            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = ally;
            }
        }

        return nearest;
    }

    // Get ally count in range (in tiles)
    getAllyCount(x, y, rangeTiles) {
        return this.getAlliesInRange(x, y, rangeTiles).length;
    }

    // Check if any allies nearby
    hasAlliesNearby(x, y, rangeTiles = 12) {
        return this.getAllyCount(x, y, rangeTiles) > 0;
    }

    // Get all allies (for global effects)
    getAllAllies() {
        return this.nearbyAllies;
    }

    destroy() {
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
    }
}
