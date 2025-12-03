// Backend server configuration
const CONFIG = {
    // For local development
    LOCAL_BACKEND: 'http://localhost:9000',

    // For production - Klyra backend server on Render
    PRODUCTION_BACKEND: 'https://klyra-server.onrender.com',

    // Auto-detect environment
    get BACKEND_URL() {
        // If running on localhost, use local backend
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return this.LOCAL_BACKEND;
        }
        // Otherwise use production backend
        return this.PRODUCTION_BACKEND;
    }
};

// Export for use in other files
window.CONFIG = CONFIG;
