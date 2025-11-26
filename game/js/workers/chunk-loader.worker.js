/**
 * chunk-loader.worker.js
 * Web Worker for loading and parsing LDTK chunk files off the main thread
 *
 * Purpose:
 * - Fetch LDTK chunk files from server
 * - Parse JSON in worker thread (not main thread)
 * - Return parsed data to main thread
 *
 * Receives: { filePath, chunkKey, chunkX, chunkY }
 * Returns: { chunkKey, chunkX, chunkY, data: parsedLdtkData, success: boolean, error?: string }
 */

// Global error handler
self.onerror = function(event) {
    console.error('Worker global error:', event.message, event.filename, event.lineno);
    return true;
};

// Log helper that sends logs back to main thread
function log(message) {
    try {
        self.postMessage({ type: 'log', message: message });
    } catch (err) {
        console.error('Log failed:', err);
    }
}

// Send startup message
try {
    log('🚀 Worker initialized');
} catch (err) {
    console.error('Startup log failed:', err);
}

self.onmessage = function(e) {
    try {
        log('📨 Worker received message');

        const { filePath, chunkKey, chunkX, chunkY } = e.data;

        // Convert relative path to absolute URL using origin
        // self.location.origin gives us http://localhost:3001
        // Encode the path to handle spaces and special characters
        const encodedPath = encodeURI(filePath);
        const absolutePath = `${self.location.origin}/${encodedPath}`;
        log(`🔧 Worker fetching: ${absolutePath}`);

    fetch(absolutePath)
        .then(response => {
            log(`📥 Worker response ${chunkKey}: ${response.status}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json(); // Parse JSON in worker!
        })
        .then(data => {
            log(`✅ Worker parsed ${chunkKey}`);
            self.postMessage({
                chunkKey,
                chunkX,
                chunkY,
                data,
                success: true
            });
        })
        .catch(error => {
            log(`❌ Worker failed ${chunkKey}: ${error.message}`);
            self.postMessage({
                chunkKey,
                chunkX,
                chunkY,
                success: false,
                error: error.message
            });
        });
    } catch (err) {
        log(`❌ Worker error: ${err.message}`);
        self.postMessage({
            chunkKey: e.data.chunkKey,
            chunkX: e.data.chunkX,
            chunkY: e.data.chunkY,
            success: false,
            error: err.message
        });
    }
};
