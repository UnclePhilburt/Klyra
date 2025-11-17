// Database module for player stats persistence
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Render PostgreSQL
    }
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
});

// Initialize database tables
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS player_stats (
                id SERIAL PRIMARY KEY,
                player_id VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255) NOT NULL,
                total_kills INTEGER DEFAULT 0,
                total_deaths INTEGER DEFAULT 0,
                total_damage_dealt BIGINT DEFAULT 0,
                total_damage_taken BIGINT DEFAULT 0,
                total_playtime_ms BIGINT DEFAULT 0,
                games_played INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_player_id ON player_stats(player_id);
            CREATE INDEX IF NOT EXISTS idx_total_kills ON player_stats(total_kills DESC);
        `);
        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
    }
}

// Get player stats
async function getPlayerStats(playerId) {
    try {
        const result = await pool.query(
            'SELECT * FROM player_stats WHERE player_id = $1',
            [playerId]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error getting player stats:', error);
        return null;
    }
}

// Update player stats
async function updatePlayerStats(playerId, username, stats) {
    try {
        const result = await pool.query(`
            INSERT INTO player_stats (
                player_id, username, total_kills, total_deaths,
                total_damage_dealt, total_damage_taken, total_playtime_ms, games_played
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (player_id)
            DO UPDATE SET
                username = EXCLUDED.username,
                total_kills = player_stats.total_kills + EXCLUDED.total_kills,
                total_deaths = player_stats.total_deaths + EXCLUDED.total_deaths,
                total_damage_dealt = player_stats.total_damage_dealt + EXCLUDED.total_damage_dealt,
                total_damage_taken = player_stats.total_damage_taken + EXCLUDED.total_damage_taken,
                total_playtime_ms = player_stats.total_playtime_ms + EXCLUDED.total_playtime_ms,
                games_played = player_stats.games_played + EXCLUDED.games_played,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `, [
            playerId,
            username,
            stats.kills || 0,
            stats.deaths || 0,
            stats.damageDealt || 0,
            stats.damageTaken || 0,
            stats.playtime || 0,
            1 // games_played increment
        ]);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating player stats:', error);
        return null;
    }
}

// Get leaderboard (top players by kills)
async function getLeaderboard(limit = 10) {
    try {
        const result = await pool.query(
            'SELECT username, total_kills, total_deaths, games_played FROM player_stats ORDER BY total_kills DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
}

module.exports = {
    initDatabase,
    getPlayerStats,
    updatePlayerStats,
    getLeaderboard,
    pool
};
