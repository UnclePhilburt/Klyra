// Test worker - minimal code to verify communication works
console.log('Worker script loaded');

self.postMessage({ type: 'log', message: 'TEST: Worker script executed' });

self.onmessage = function(e) {
    console.log('Worker received message:', e.data);
    self.postMessage({ type: 'log', message: 'TEST: Worker received message' });

    const { chunkKey, chunkX, chunkY } = e.data;
    self.postMessage({
        chunkKey,
        chunkX,
        chunkY,
        success: false,
        error: 'Test worker - not actually loading'
    });
};
