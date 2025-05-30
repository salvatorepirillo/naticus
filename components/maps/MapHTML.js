export const generateMapHTML = (location) => {
  const lat = location?.coords.latitude || 43.7696
  const lng = location?.coords.longitude || 11.2558

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-control-attribution { font-size: 10px; }
        
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
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .online { background-color: #34C759; }
        .offline { background-color: #FF3B30; }
        
        .debug-info {
          position: absolute;
          top: 50px;
          left: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-size: 12px;
          z-index: 1001;
          max-width: 300px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <div class="offline-indicator" id="networkStatus">
        <div class="status-dot online" id="statusDot"></div>
        <span id="statusText">Online</span>
      </div>
      
      <div class="debug-info" id="debugInfo">
        Inizializzazione...
      </div>

      <script>
        console.log('🚀 Script started');
        
        let map;
        let isOnline = true;
        let debugInfo = '';
        
        function updateDebug(message) {
          console.log('🐛 DEBUG:', message);
          debugInfo += message + '\\n';
          const debugEl = document.getElementById('debugInfo');
          if (debugEl) {
            debugEl.textContent = debugInfo;
          }
        }
        
        function sendMessage(data) {
          console.log('📤 Sending message:', data);
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
              updateDebug('✅ Message sent: ' + data.type);
            } else {
              updateDebug('❌ ReactNativeWebView not available');
            }
          } catch (error) {
            updateDebug('❌ Error sending message: ' + error.message);
          }
        }
        
        // Initialize map
        function initMap() {
          updateDebug('🗺️ Initializing map...');
          
          try {
            if (typeof L === 'undefined') {
              updateDebug('❌ Leaflet not loaded');
              return;
            }
            
            updateDebug('✅ Leaflet loaded');
            
            map = L.map('map', {
              center: [${lat}, ${lng}],
              zoom: 12,
              zoomControl: true,
              attributionControl: false
            });
            
            updateDebug('✅ Map created');
            
            // Simple base map layer
            const baseMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 18,
              attribution: '© OpenStreetMap contributors'
            });
            
            baseMap.addTo(map);
            updateDebug('✅ Base layer added');
            
            // Marine overlay
            const seaMarks = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
              opacity: 0.8,
              maxZoom: 18
            });
            
            seaMarks.addTo(map);
            updateDebug('✅ SeaMarks layer added');
            
            // Position marker
            const marker = L.marker([${lat}, ${lng}], {
              title: 'Posizione attuale'
            }).addTo(map);
            
            marker.bindPopup('<b>Posizione attuale</b><br>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}');
            updateDebug('✅ Marker added');
            
            // Scale control
            L.control.scale({
              position: 'bottomleft',
              metric: true,
              imperial: false
            }).addTo(map);
            
            updateDebug('✅ Scale control added');
            
            // Notify React Native that map is ready
            sendMessage({ type: 'mapReady' });
            updateDebug('✅ Map ready notification sent');
            
            // Hide debug info after 5 seconds
            setTimeout(() => {
              const debugEl = document.getElementById('debugInfo');
              if (debugEl) {
                debugEl.style.display = 'none';
              }
            }, 5000);
            
          } catch (error) {
            updateDebug('❌ Error initializing map: ' + error.message);
            console.error('Error initializing map:', error);
          }
        }
        
        // Network status management
        function updateNetworkStatus(online) {
          updateDebug('🌐 Network status: ' + (online ? 'online' : 'offline'));
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
        }
        
        // Download functionality placeholder
        function startRegionDownload() {
          updateDebug('📥 Download requested');
          
          if (!map) {
            updateDebug('❌ Map not ready for download');
            return;
          }
          
          const bounds = map.getBounds();
          const zoom = map.getZoom();
          
          updateDebug('📍 Sending bounds: ' + JSON.stringify({
            north: bounds.getNorth().toFixed(4),
            south: bounds.getSouth().toFixed(4),
            east: bounds.getEast().toFixed(4),
            west: bounds.getWest().toFixed(4)
          }));
          
          sendMessage({
            type: 'boundsReady',
            bounds: {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest()
            },
            zoom: zoom,
            zoomLevels: [Math.max(1, zoom - 1), Math.min(18, zoom + 1)]
          });
        }
        
        // Handle messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            updateDebug('📨 Received: ' + data.type);
            
            switch (data.type) {
              case 'networkStatus':
                updateNetworkStatus(data.isOnline);
                break;
                
              case 'navigateToRegion':
                if (data.bounds && map) {
                  const bounds = L.latLngBounds(
                    [data.bounds.south, data.bounds.west],
                    [data.bounds.north, data.bounds.east]
                  );
                  map.fitBounds(bounds, { padding: [20, 20] });
                  updateDebug('✅ Navigated to region');
                }
                break;
                
              case 'getBounds':
              case 'startDownload':
                startRegionDownload();
                break;
                
              default:
                updateDebug('❓ Unknown message: ' + data.type);
            }
          } catch (error) {
            updateDebug('❌ Message error: ' + error.message);
          }
        });
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
          updateDebug('📄 DOM loaded');
          initMap();
        });
        
        // Fallback initialization
        window.addEventListener('load', function() {
          updateDebug('🪟 Window loaded');
          if (!map) {
            updateDebug('⚠️ Fallback init');
            initMap();
          }
        });
        
        // Expose functions
        window.updateNetworkStatus = updateNetworkStatus;
        
        updateDebug('✅ Script setup complete');
      </script>
    </body>
    </html>
  `
}
