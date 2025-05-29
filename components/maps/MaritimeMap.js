import { Component } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import * as Location from 'expo-location'

export default class MaritimeMap extends Component {
  constructor (props) {
    super(props)
    this.state = {
      location: null,
      loading: true
    }
  }

  async componentDidMount () {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        })
        this.setState({ location, loading: false })
      } else {
        this.setState({ loading: false })
      }
    } catch (error) {
      console.error('Location error:', error)
      this.setState({ loading: false })
    }
  }

  generateHTML () {
    const { location } = this.state
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
          body { margin: 0; padding: 0; overflow: hidden; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-control-attribution { font-size: 10px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            center: [${lat}, ${lng}],
            zoom: 12,
            zoomControl: true,
            attributionControl: false
          });
          
          // Base map
          const baseMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18
          }).addTo(map);
          
          // Marine overlay
          const seaMarks = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            opacity: 0.8,
            maxZoom: 18
          }).addTo(map);
          
          // Depth contours
          const depths = L.tileLayer('https://tiles.openseamap.org/depth/{z}/{x}/{y}.png', {
            opacity: 0.6,
            maxZoom: 16
          }).addTo(map);
          
          // Current position marker
          const marker = L.marker([${lat}, ${lng}], {
            title: 'Posizione attuale'
          }).addTo(map);
          
          marker.bindPopup('<b>Posizione attuale</b><br>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}');
          
          // Layer control
          // const baseMaps = {
          //   "Mappa base": baseMap
          // };
          
          // const overlayMaps = {
          //   "Segni marini": seaMarks,
          //   "Profondità": depths
          // };
          
          // L.control.layers(baseMaps, overlayMaps, {
          //   position: 'topright',
          //   collapsed: false
          // }).addTo(map);
          
          // Scale control
          L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
          }).addTo(map);
        </script>
      </body>
      </html>
    `
  }

  render () {
    const { loading } = this.state

    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size='large' color='#0066cc' />
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <WebView
          source={{ html: this.generateHTML() }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          scalesPageToFit
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff'
  },
  webview: {
    flex: 1
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
  }
})
