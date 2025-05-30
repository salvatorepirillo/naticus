import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native'
import { WebView } from 'react-native-webview'
import * as Location from 'expo-location'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { ConnectivityContext } from '../../contexts/ConnectivityContext'
import { offlineMapService } from '../../services/OfflineMapService'
import Notification from '../common/Notification'
import OfflineModal from './OfflineModal'
import MapControls from './MapControls'
import { generateMapHTML } from './MapHTML'
import { Component } from 'react'

export default class MaritimeMap extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      location: null,
      loading: true,
      showOfflineModal: false,
      downloadProgress: 0,
      isDownloading: false,
      downloadInfo: null,
      offlineRegions: [],
      cacheInfo: { size: 0, formattedSize: '0B', entries: 0 },
      notification: { message: '', type: 'info', visible: false }
    }
    this.webViewRef = null
    this.boundsTimeout = null
    this.mapReadyTimeout = null
  }

  componentWillUnmount () {
    if (this.boundsTimeout) {
      clearTimeout(this.boundsTimeout)
    }
    if (this.mapReadyTimeout) {
      clearTimeout(this.mapReadyTimeout)
    }
  }

  loadOfflineData = async () => {
    try {
      const [regions, cacheInfo] = await Promise.all([
        offlineMapService.loadOfflineRegions(),
        offlineMapService.getCacheInfo()
      ])

      this.setState({
        offlineRegions: regions,
        cacheInfo
      })
    } catch (error) {
      console.warn('Error loading offline data:', error)
    }
  }

  initializeLocation = async () => {
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

  // Gestione WebView
  handleWebViewMessage = async (event) => {
    const data = offlineMapService.parseWebViewMessage(event.nativeEvent.data)
    if (!data) return

    console.log('📨 React Native received message:', data.type)

    switch (data.type) {
      case 'downloadProgress':
        this.setState({ downloadProgress: data.progress })
        break

      case 'downloadComplete':
        await this.handleDownloadComplete(data)
        break

      case 'downloadError':
        this.handleDownloadError(data)
        break

      case 'mapReady':
        console.log('🗺️ Map ready')
        this.notifyWebViewConnectivity()
        break

      case 'boundsReady':
        console.log('📐 Bounds received:', data.bounds)

        // Cancella timeout
        if (this.boundsTimeout) {
          clearTimeout(this.boundsTimeout)
          this.boundsTimeout = null
        }

        // Risposta alla richiesta di bounds per download reale
        if (data.bounds && this.state.isDownloading) {
          const zoomLevels = data.zoomLevels || [Math.max(1, data.zoom - 1), Math.min(18, data.zoom + 1)]
          console.log('🔥 Starting real download with bounds:', data.bounds, 'zoom levels:', zoomLevels)
          await this.handleRealDownload(data.bounds, zoomLevels)
        } else {
          console.warn('❌ Bounds ready but not downloading or bounds missing')
          if (!this.state.isDownloading) {
            console.warn('Download state is false')
          }
          if (!data.bounds) {
            console.warn('Bounds data missing')
          }
          this.setState({ isDownloading: false })
        }
        break

      default:
        console.warn('❓ Unknown message type:', data.type)
    }
  }

  handleDownloadComplete = async (data) => {
    this.setState({
      isDownloading: false,
      downloadProgress: 0
    })

    const newRegion = await offlineMapService.addOfflineRegion({
      name: data.regionName,
      bounds: data.bounds,
      estimatedSize: data.estimatedSize,
      zoomLevels: data.zoomLevels,
      tilesCount: data.tilesCount
    })

    if (newRegion) {
      await this.loadOfflineData()
      this.showNotification('✅ Regione scaricata con successo', 'success')
    }
  }

  handleDownloadError = (data) => {
    this.setState({ isDownloading: false, downloadProgress: 0 })
    this.showNotification('❌ Errore durante il download', 'error')
  }

  notifyWebViewConnectivity = () => {
    if (this.webViewRef) {
      const message = offlineMapService.createWebViewMessage('networkStatus', {
        isOnline: this.context.isOnline
      })
      this.webViewRef.postMessage(message)
    }
  }

  // Azioni offline - DOWNLOAD REALE
  handleStartDownload = async () => {
    const connectivityContext = this.context

    if (!connectivityContext.requiresConnection('download')) {
      this.showNotification('⚠️ Connessione necessaria per scaricare', 'warning')
      return
    }

    console.log('🚀 Starting download process...')
    this.setState({ isDownloading: true, downloadProgress: 0 })

    // Richiedi bounds dalla WebView
    if (this.webViewRef) {
      console.log('📤 Requesting bounds from WebView...')
      const message = offlineMapService.createWebViewMessage('getBounds')
      this.webViewRef.postMessage(message)

      // Timeout di sicurezza
      this.boundsTimeout = setTimeout(() => {
        console.error('⏰ Timeout waiting for bounds from WebView')
        this.setState({ isDownloading: false })
        this.showNotification('❌ Timeout: WebView non risponde', 'error')
      }, 5000)
    } else {
      console.error('❌ WebView ref not available')
      this.setState({ isDownloading: false })
      this.showNotification('❌ Errore: WebView non disponibile', 'error')
    }
  }

  handleRealDownload = async (bounds, zoomLevels) => {
    try {
      const success = await offlineMapService.downloadRegion(
        bounds,
        zoomLevels,
        // onProgress
        (progressData) => {
          this.setState({
            downloadProgress: progressData.progress,
            downloadInfo: {
              downloaded: progressData.downloadedCount,
              total: progressData.totalCount,
              size: progressData.downloadedSize
            }
          })
        },
        // onComplete
        async (regionData) => {
          this.setState({
            isDownloading: false,
            downloadProgress: 0,
            downloadInfo: null
          })

          const newRegion = await offlineMapService.addOfflineRegion({
            name: `Area ${new Date().toLocaleDateString()}`,
            bounds: regionData.bounds,
            estimatedSize: regionData.actualSize,
            zoomLevels: regionData.zoomLevels,
            tilesCount: regionData.tilesCount,
            downloadedTiles: regionData.downloadedTiles,
            status: regionData.status
          })

          if (newRegion) {
            await this.loadOfflineData()
            this.showNotification(`✅ ${regionData.downloadedTiles}/${regionData.tilesCount} tiles scaricate`, 'success')
          }
        },
        // onError
        (error) => {
          this.setState({
            isDownloading: false,
            downloadProgress: 0,
            downloadInfo: null
          })
          this.showNotification(`❌ Errore: ${error}`, 'error')
        }
      )

      if (!success) {
        this.setState({ isDownloading: false, downloadProgress: 0 })
      }
    } catch (error) {
      console.error('Download error:', error)
      this.setState({ isDownloading: false, downloadProgress: 0 })
      this.showNotification('❌ Errore durante il download', 'error')
    }
  }

  handleAbortDownload = () => {
    offlineMapService.abortDownload()
    this.setState({
      isDownloading: false,
      downloadProgress: 0,
      downloadInfo: null
    })
    this.showNotification('🛑 Download annullato', 'warning')
  }

  handleClearCache = () => {
    Alert.alert(
      'Pulisci Cache',
      `Vuoi eliminare ${this.state.cacheInfo.formattedSize} di dati offline?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: this.clearCache
        }
      ]
    )
  }

  clearCache = async () => {
    try {
      // Comunica alla WebView
      if (this.webViewRef) {
        const message = offlineMapService.createWebViewMessage('clearCache')
        this.webViewRef.postMessage(message)
      }

      // Pulisci cache locale
      const success = await offlineMapService.clearCache()

      if (success) {
        await this.loadOfflineData()
        this.showNotification('🗑️ Cache eliminata con successo', 'success')
      } else {
        this.showNotification('❌ Impossibile eliminare la cache', 'error')
      }
    } catch (error) {
      console.warn('Error clearing cache:', error)
      this.showNotification('❌ Errore durante la pulizia', 'error')
    }
  }

  handleDeleteOfflineRegion = async (regionId) => {
    Alert.alert(
      'Elimina Regione',
      'Vuoi eliminare questa regione offline?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const success = await offlineMapService.deleteOfflineRegion(regionId)
            if (success) {
              await this.loadOfflineData()
              this.showNotification('🗑️ Regione eliminata', 'warning')
            } else {
              this.showNotification('❌ Errore durante l\'eliminazione', 'error')
            }
          }
        }
      ]
    )
  }

  handleNavigateToRegion = (region) => {
    if (this.webViewRef && region.bounds) {
      const message = offlineMapService.createWebViewMessage('navigateToRegion', {
        bounds: region.bounds
      })
      this.webViewRef.postMessage(message)

      this.setState({ showOfflineModal: false })
      this.showNotification('📍 Navigazione verso regione', 'info')
    }
  }

  handleRenameRegion = (regionId, currentName) => {
    Alert.prompt(
      'Rinomina Regione',
      'Inserisci un nuovo nome per questa regione:',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Salva',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              const success = await offlineMapService.updateOfflineRegion(regionId, {
                name: newName.trim()
              })

              if (success) {
                await this.loadOfflineData()
                this.showNotification('✏️ Regione rinominata', 'success')
              } else {
                this.showNotification('❌ Errore durante la rinomina', 'error')
              }
            }
          }
        }
      ],
      'plain-text',
      currentName
    )
  }

  // Gestione notifiche
  showNotification = (message, type = 'info') => {
    this.setState({
      notification: { message, type, visible: true }
    })
  }

  hideNotification = () => {
    this.setState({
      notification: { message: '', type: 'info', visible: false }
    })
  }

  // Gestione modal
  handleShowOfflineModal = () => {
    this.setState({ showOfflineModal: true })
  }

  handleHideOfflineModal = () => {
    this.setState({ showOfflineModal: false })
  }

  render () {
    const { loading } = this.state

    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size='large' color='#0066cc' />
          <Text style={styles.loadingText}>Caricamento mappa...</Text>
        </View>
      )
    }

    return (
      <ConnectivityContext.Consumer>
        {(connectivityContext) => (
          <View style={styles.container}>
            <WebView
              ref={ref => { this.webViewRef = ref }}
              source={{ html: generateMapHTML(this.state.location) }}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState={false}
              onLoadStart={() => console.log('🔄 WebView load start')}
              onLoadEnd={() => console.log('✅ WebView load end')}
              onError={(error) => {
                console.error('❌ WebView error:', error.nativeEvent)
                this.showNotification('❌ Errore caricamento mappa', 'error')
              }}
              onMessage={this.handleWebViewMessage}
              allowsInlineMediaPlayback
              mixedContentMode='compatibility'
              cacheEnabled={false}
              incognito={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />

            <MapControls
              isOnline={connectivityContext.isOnline}
              cacheInfo={this.state.cacheInfo}
              offlineRegions={this.state.offlineRegions}
              onShowOfflineModal={this.handleShowOfflineModal}
            />

            <OfflineModal
              visible={this.state.showOfflineModal}
              isDownloading={this.state.isDownloading}
              downloadProgress={this.state.downloadProgress}
              downloadInfo={this.state.downloadInfo}
              offlineRegions={this.state.offlineRegions}
              cacheInfo={this.state.cacheInfo}
              isOnline={connectivityContext.isOnline}
              onHide={this.handleHideOfflineModal}
              onStartDownload={this.handleStartDownload}
              onAbortDownload={this.handleAbortDownload}
              onClearCache={this.handleClearCache}
              onDeleteRegion={this.handleDeleteOfflineRegion}
              onNavigateToRegion={this.handleNavigateToRegion}
              onRenameRegion={this.handleRenameRegion}
            />

            <Notification
              visible={this.state.notification.visible}
              message={this.state.notification.message}
              type={this.state.notification.type}
              onHide={this.hideNotification}
            />
          </View>
        )}
      </ConnectivityContext.Consumer>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  }
})
