export const generateMapHTML = (location) => {
  const lat = location?.coords.latitude || 43.7696
  const lng = location?.coords.longitude || 11.2558

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f0f8ff;
        }
        #map { 
          height: 100vh; 
          width: 100vw; 
          background-color: #a8c8ec;
        }
        .leaflet-control-attribution { 
          font-size: 10px; 
          background: rgba(255, 255, 255, 0.8) !important;
        }
        
        .offline-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .online { background-color: #34C759; }
        .offline { background-color: #FF3B30; }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(240, 248, 255, 0.9);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          font-size: 16px;
          color: #666;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0066cc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          color: #ff3b30;
          margin-top: 8px;
          text-align: center;
          padding: 0 20px;
        }
      </style>
    </head>
    <body>
      <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div>Inizializzazione mappa...</div>
      </div>
      
      <div id="map"></div>
      
      <div class="offline-indicator" id="networkStatus">
        <div class="status-dot online" id="statusDot"></div>
        <span id="statusText">Online</span>
      </div>

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        console.log('🚀 Starting maritime map initialization');
        
        let map;
        let isOnline = true;
        let mapInitialized = false;
        
        function showLoading(message) {
          const overlay = document.getElementById('loadingOverlay');
          if (overlay) {
            overlay.style.display = 'flex';
            const textEl = overlay.querySelector('div:last-child');
            if (textEl) textEl.textContent = message;
          }
        }
        
        function hideLoading() {
          const overlay = document.getElementById('loadingOverlay');
          if (overlay) {
            overlay.style.display = 'none';
          }
        }
        
        function showError(message) {
          const overlay = document.getElementById('loadingOverlay');
          if (overlay) {
            overlay.innerHTML = \`
              <div style="color: #ff3b30; font-size: 48px; margin-bottom: 16px;">❌</div>
              <div>Errore caricamento mappa</div>
              <div class="error-message">\${message}</div>
            \`;
            overlay.style.display = 'flex';
          }
          sendMessage({ type: 'mapError', error: message });
        }
        
        function sendMessage(data) {
          console.log('📤 Sending message to React Native:', data);
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
              console.log('✅ Message sent successfully');
            } else {
              console.warn('❌ ReactNativeWebView.postMessage not available');
              console.warn('Available methods:', Object.keys(window.ReactNativeWebView || {}));
            }
          } catch (error) {
            console.error('❌ Error sending message:', error);
          }
        }
        
        function sendDebug(message) {
          console.log('🐛 DEBUG:', message);
          sendMessage({ type: 'debugInfo', message: message });
        }
        
        // Check if Leaflet is loaded
        function checkLeaflet() {
          return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds
            
            const checkInterval = setInterval(() => {
              attempts++;
              console.log(\`Checking Leaflet... attempt \${attempts}\`);
              
              if (typeof L !== 'undefined' && L.map) {
                clearInterval(checkInterval);
                console.log('✅ Leaflet loaded successfully');
                resolve();
              } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ Leaflet failed to load after max attempts');
                reject(new Error('Leaflet failed to load'));
              }
            }, 100);
          });
        }
        
        // Initialize map
        async function initMap() {
          try {
            // Prevent double initialization
            if (mapInitialized || map) {
              sendDebug('Map already initialized, skipping');
              return;
            }
            
            showLoading('Caricamento librerie...');
            sendDebug('Starting map initialization');
            
            // Wait for Leaflet to load
            await checkLeaflet();
            
            showLoading('Creazione mappa...');
            sendDebug('Leaflet loaded, creating map');
            
            // Clean map container if needed
            const mapContainer = document.getElementById('map');
            if (mapContainer && mapContainer._leaflet_id) {
              sendDebug('Cleaning existing map instance');
              mapContainer._leaflet_id = null;
              mapContainer.innerHTML = '';
            }
            
            // Create map
            map = L.map('map', {
              center: [${lat}, ${lng}],
              zoom: 12,
              zoomControl: true,
              attributionControl: true,
              preferCanvas: false,
              renderer: L.svg()
            });
            
            sendDebug('Map element created');
            
            showLoading('Caricamento layer di base...');
            
            // Add base layer with error handling
            const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 18,
              attribution: '© OpenStreetMap contributors',
              errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              timeout: 10000
            });
            
            baseLayer.on('loading', () => {
              sendDebug('Base tiles loading...');
            });
            
            baseLayer.on('load', () => {
              sendDebug('Base tiles loaded');
            });
            
            baseLayer.on('tileerror', (e) => {
              console.warn('Base tile error:', e);
            });
            
            baseLayer.addTo(map);
            sendDebug('Base layer added');
            
            showLoading('Caricamento dati nautici...');
            
            // Add marine overlay with error handling
            const seaMarks = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
              opacity: 0.7,
              maxZoom: 18,
              errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              timeout: 15000
            });
            
            seaMarks.on('loading', () => {
              sendDebug('SeaMarks loading...');
            });
            
            seaMarks.on('load', () => {
              sendDebug('SeaMarks loaded');
            });
            
            seaMarks.on('tileerror', (e) => {
              console.warn('SeaMarks tile error:', e);
            });
            
            seaMarks.addTo(map);
            sendDebug('SeaMarks layer added');
            
            // Add position marker
            const marker = L.marker([${lat}, ${lng}], {
              title: 'Posizione attuale'
            }).addTo(map);
            
            marker.bindPopup(\`
              <div style="text-align: center;">
                <b>📍 Posizione attuale</b><br>
                <small>Lat: ${lat.toFixed(4)}</small><br>
                <small>Lng: ${lng.toFixed(4)}</small>
              </div>
            \`);
            
            sendDebug('Position marker added');
            
            // Add scale control
            L.control.scale({
              position: 'bottomleft',
              metric: true,
              imperial: false
            }).addTo(map);
            
            sendDebug('Scale control added');
            
            // Add layer control
            const baseMaps = {
              "OpenStreetMap": baseLayer
            };
            
            const overlayMaps = {
              "Carte Nautiche": seaMarks
            };
            
            L.control.layers(baseMaps, overlayMaps, {
              position: 'topright',
              collapsed: true
            }).addTo(map);
            
            sendDebug('Layer control added');
            
            // Wait a bit for tiles to start loading, then declare ready
            setTimeout(() => {
              hideLoading();
              mapInitialized = true;
              sendMessage({ type: 'mapReady' });
              sendDebug('Map initialization complete');
            }, 2000);
            
          } catch (error) {
            console.error('❌ Error initializing map:', error);
            showError(error.message || 'Errore sconosciuto durante l\\'inizializzazione');
          }
        }
        
        // Network status management
        function updateNetworkStatus(online) {
          console.log('🌐 Network status:', online ? 'online' : 'offline');
          isOnline = online;
          const statusDot = document.getElementById('statusDot');
          const statusText = document.getElementById('statusText');
          
          if (statusDot && statusText) {
            if (online) {
              statusDot.className = 'status-dot online';
              statusText.textContent = 'Online';
            } else {
              statusDot.className = 'status-dot offline';
              statusText.textContent = 'Offline';
            }
          }
          sendDebug(\`Network status updated: \${online ? 'online' : 'offline'}\`);
        }
        
        // Download functionality
        function getBounds() {
          sendDebug('getBounds called');
          
          if (!map || !mapInitialized) {
            sendDebug('Map not ready for bounds request');
            sendMessage({ 
              type: 'downloadError', 
              error: 'Mappa non pronta' 
            });
            return;
          }
          
          try {
            const bounds = map.getBounds();
            const zoom = map.getZoom();
            
            const boundsData = {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest()
            };
            
            sendDebug(\`Sending bounds: \${JSON.stringify(boundsData)}\`);
            
            sendMessage({
              type: 'boundsReady',
              bounds: boundsData,
              zoom: zoom,
              zoomLevels: [Math.max(1, zoom - 1), Math.min(18, zoom + 1)]
            });
          } catch (error) {
            console.error('Error getting bounds:', error);
            sendMessage({ 
              type: 'downloadError', 
              error: \`Errore ottenimento bounds: \${error.message}\`
            });
          }
        }
        
        function navigateToRegion(bounds) {
          sendDebug('navigateToRegion called');
          
          if (!map || !mapInitialized) {
            sendDebug('Map not ready for navigation');
            return;
          }
          
          try {
            const leafletBounds = L.latLngBounds(
              [bounds.south, bounds.west],
              [bounds.north, bounds.east]
            );
            
            map.fitBounds(leafletBounds, { 
              padding: [20, 20],
              maxZoom: 16
            });
            
            sendDebug('Navigation completed');
          } catch (error) {
            console.error('Error navigating to region:', error);
            sendDebug(\`Navigation error: \${error.message}\`);
          }
        }
        
        // Handle messages from React Native
        function handleMessage(event) {
          try {
            const data = JSON.parse(event.data);
            sendDebug(\`Received message: \${data.type}\`);
            
            switch (data.type) {
              case 'networkStatus':
                updateNetworkStatus(data.isOnline);
                break;
                
              case 'navigateToRegion':
                if (data.bounds) {
                  navigateToRegion(data.bounds);
                }
                break;
                
              case 'getBounds':
              case 'startDownload':
                getBounds();
                break;
                
              case 'clearCache':
                sendDebug('Cache clear requested (no action needed in WebView)');
                break;
                
              default:
                sendDebug(\`Unknown message type: \${data.type}\`);
            }
          } catch (error) {
            console.error('Error handling message:', error);
            sendDebug(\`Message handling error: \${error.message}\`);
          }
        }
        
        // Setup message listener
        if (window.addEventListener) {
          window.addEventListener('message', handleMessage);
          sendDebug('Message listener setup via addEventListener');
        } else if (window.attachEvent) {
          window.attachEvent('onmessage', handleMessage);
          sendDebug('Message listener setup via attachEvent');
        } else {
          sendDebug('❌ No message listener method available');
        }
        
        // Check ReactNativeWebView availability
        function checkReactNativeWebView() {
          if (window.ReactNativeWebView) {
            sendDebug('✅ ReactNativeWebView available');
            sendDebug(\`Available methods: \${Object.keys(window.ReactNativeWebView)}\`);
          } else {
            sendDebug('❌ ReactNativeWebView not available');
            // Polyfill for testing
            window.ReactNativeWebView = {
              postMessage: (message) => {
                console.log('📤 Polyfill postMessage:', message);
              }
            };
          }
        }
        
        // Initialize everything when DOM is ready
        function startInitialization() {
          console.log('🚀 Starting initialization');
          
          // Prevent multiple initializations
          if (mapInitialized || map) {
            sendDebug('Initialization already started or completed');
            return;
          }
          
          checkReactNativeWebView();
          initMap();
        }
        
        // Single initialization trigger
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', startInitialization);
          sendDebug('Waiting for DOMContentLoaded');
        } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
          startInitialization();
          sendDebug('DOM already loaded, starting immediately');
        }
        
        // Remove the window.load fallback to prevent double initialization
        
        // Expose functions globally for debugging
        window.initMap = initMap;
        window.updateNetworkStatus = updateNetworkStatus;
        window.getBounds = getBounds;
        window.sendMessage = sendMessage;
        window.sendDebug = sendDebug;
        
        sendDebug('Script setup complete');
      </script>
    </body>
    </html>
  `
}
