importScripts('ngsw-worker.js');

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
  });
  
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-forms') {
      event.waitUntil(
        // This is where you would typically make API calls
        // For demo purposes, we'll just log
        (async () => {
          try {
            console.log('Executing background sync...');
            
            // Simulate an API call

            await fetch('http://localhost:3000/something', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ from: 'background sync'})
            });
            
            console.log('Background sync completed successfully');
          } catch (error) {
            console.error('Background sync failed:', error);
            throw error; // This will cause the sync to retry later
          }
        })()
      );
    }
  });