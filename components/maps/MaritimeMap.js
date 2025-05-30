import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native'
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
      webViewLoading: true,
      mapReady: false,
      showOfflineModal: false,
      downloadProgress: 0,
      isDownloading: false,
      downloadInfo: null,
      offlineRegions: [],
      cacheInfo: { size: 0, formattedSize: '0B', entries: 0 },
      notification: { message: '', type: 'info', visible: false },
      error: null
    }
    this.webViewRef = null
    this.boundsTimeout = null
    this.mapReadyTimeout = null
    this.locationInitialized = false
  }

  async componentDidMount () {
    await this.handleInitializeLocation()
    await this.loadOfflineData()
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

  handleInitializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000
        })

        this.setState({
          location,
          loading: false,
          error: null
        })
        this.locationInitialized = true
      } else {
        this.setState({
          location: {
            coords: {
              latitude: 43.7696,
              longitude: 11.2558
            }
          },
          loading: false,
          error: 'Permesso GPS negato - usando posizione predefinita'
        })
        this.locationInitialized = true
      }
    } catch (error) {
      this.setState({
        location: {
          coords: {
            latitude: 43.7696,
            longitude: 11.2558
          }
        },
        loading: false,
        error: 'Errore GPS - usando posizione predefinita'
      })
      this.locationInitialized = true
    }
  }

  // Gestione WebView
  handleWebViewLoadStart = () => {
    this.setState({ webViewLoading: true, mapReady: false })
  }

  handleWebViewLoadEnd = () => {
    this.setState({ webViewLoading: false })

    // Timeout per dichiarare la mappa pronta se non arriva il messaggio
    this.mapReadyTimeout = setTimeout(() => {
      if (!this.state.mapReady) {
        this.setState({ mapReady: true })
        this.notifyWebViewConnectivity()
      }
    }, 5000)
  }

  handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent
    console.error('WebView error:', nativeEvent)
    this.setState({
      error: `Errore caricamento mappa: ${nativeEvent.description || 'Errore sconosciuto'}`,
      webViewLoading: false
    })
  }

  handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      switch (data.type) {
        case 'mapReady':
          if (this.mapReadyTimeout) {
            clearTimeout(this.mapReadyTimeout)
            this.mapReadyTimeout = null
          }
          this.setState({ mapReady: true, error: null })
          this.notifyWebViewConnectivity()
          break

        case 'mapError':
          console.error('Map initialization error:', data.error)
          this.setState({
            error: `Errore inizializzazione mappa: ${data.error}`,
            mapReady: false
          })
          break

        case 'downloadProgress':
          this.setState({ downloadProgress: data.progress })
          break

        case 'downloadComplete':
          await this.handleDownloadComplete(data)
          break

        case 'downloadError':
          this.handleDownloadError(data)
          break

        case 'boundsReady':
          if (this.boundsTimeout) {
            clearTimeout(this.boundsTimeout)
            this.boundsTimeout = null
          }

          if (data.bounds && this.state.isDownloading) {
            const zoomLevels = data.zoomLevels || [Math.max(1, data.zoom - 1), Math.min(18, data.zoom + 1)]
            await this.handleRealDownload(data.bounds, zoomLevels)
          } else {
            this.setState({ isDownloading: false })
          }
          break

        case 'debugInfo':
          // Debug messages removed
          break

        default:
          console.warn('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error)
    }
  }

  handleDownloadComplete = async (data) => {
    this.setState({
      isDownloading: false,
      downloadProgress: 0
    })

    const newRegion = await offlineMapService.addOfflineRegion({
      name: data.regionName || `Area ${new Date().toLocaleDateString()}`,
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
    this.showNotification(`❌ Errore durante il download: ${data.error || 'Errore sconosciuto'}`, 'error')
  }

  notifyWebViewConnectivity = () => {
    if (this.webViewRef && this.state.mapReady) {
      try {
        const message = JSON.stringify({
          type: 'networkStatus',
          isOnline: true
        })
        this.webViewRef.postMessage(message)
      } catch (error) {
        console.error('Error sending connectivity status:', error)
      }
    }
  }

  // Azioni offline - DOWNLOAD REALE
  handleStartDownload = async () => {
    this.setState({ isDownloading: true, downloadProgress: 0 })

    if (this.webViewRef && this.state.mapReady) {
      try {
        const message = JSON.stringify({ type: 'getBounds' })
        this.webViewRef.postMessage(message)

        this.boundsTimeout = setTimeout(() => {
          this.setState({ isDownloading: false })
          this.showNotification('❌ Timeout: WebView non risponde', 'error')
        }, 10000)
      } catch (error) {
        console.error('Error requesting bounds:', error)
        this.setState({ isDownloading: false })
        this.showNotification('❌ Errore comunicazione con mappa', 'error')
      }
    } else {
      this.setState({ isDownloading: false })
      this.showNotification('❌ Mappa non pronta per il download', 'error')
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
      if (this.webViewRef && this.state.mapReady) {
        const message = JSON.stringify({ type: 'clearCache' })
        this.webViewRef.postMessage(message)
      }

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
    if (this.webViewRef && this.state.mapReady && region.bounds) {
      try {
        const message = JSON.stringify({
          type: 'navigateToRegion',
          bounds: region.bounds
        })
        this.webViewRef.postMessage(message)

        this.setState({ showOfflineModal: false })
        this.showNotification('📍 Navigazione verso regione', 'info')
      } catch (error) {
        console.error('Error navigating to region:', error)
        this.showNotification('❌ Errore navigazione', 'error')
      }
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

  handleHideNotification = () => {
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
    const { loading, webViewLoading, mapReady, error } = this.state

    // Mostra loading se stiamo ancora inizializzando la posizione
    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size='large' color='#0066cc' />
          <Text style={styles.loadingText}>Inizializzazione GPS...</Text>
        </View>
      )
    }

    // Mostra errore se c'è un problema critico
    if (error && !this.state.location) {
      return (
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity onPress={this.handleInitializeLocation} style={styles.retryButton}>
            <Text style={styles.retryText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <ConnectivityContext.Consumer>
        {(connectivityContext) => (
          <View style={styles.container}>
            {/* WebView per la mappa */}
            <WebView
              ref={ref => { this.webViewRef = ref }}
              source={{ html: generateMapHTML(this.state.location) }}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              onLoadStart={this.handleWebViewLoadStart}
              onLoadEnd={this.handleWebViewLoadEnd}
              onError={this.handleWebViewError}
              onMessage={this.handleWebViewMessage}
              allowsInlineMediaPlayback
              mixedContentMode='compatibility'
              cacheEnabled={false}
              incognito={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              renderLoading={() => (
                <View style={[styles.container, styles.centered]}>
                  <ActivityIndicator size='large' color='#0066cc' />
                  <Text style={styles.loadingText}>Caricamento mappa...</Text>
                </View>
              )}
            />

            {/* Overlay di caricamento se la WebView non è pronta */}
            {(webViewLoading || !mapReady) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size='large' color='#0066cc' />
                <Text style={styles.loadingText}>
                  {webViewLoading ? 'Caricamento WebView...' : 'Inizializzazione mappa...'}
                </Text>
                {error && (
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                )}
              </View>
            )}

            {/* Controlli mappa - mostrati solo quando la mappa è pronta */}
            {mapReady && (
              <MapControls
                isOnline={connectivityContext?.isOnline ?? true}
                cacheInfo={this.state.cacheInfo}
                offlineRegions={this.state.offlineRegions}
                onShowOfflineModal={this.handleShowOfflineModal}
              />
            )}

            {/* Modal offline */}
            <OfflineModal
              visible={this.state.showOfflineModal}
              isDownloading={this.state.isDownloading}
              downloadProgress={this.state.downloadProgress}
              downloadInfo={this.state.downloadInfo}
              offlineRegions={this.state.offlineRegions}
              cacheInfo={this.state.cacheInfo}
              isOnline={connectivityContext?.isOnline ?? true}
              onHide={this.handleHideOfflineModal}
              onStartDownload={this.handleStartDownload}
              onAbortDownload={this.handleAbortDownload}
              onClearCache={this.handleClearCache}
              onDeleteRegion={this.handleDeleteOfflineRegion}
              onNavigateToRegion={this.handleNavigateToRegion}
              onRenameRegion={this.handleRenameRegion}
            />

            {/* Notifiche */}
            <Notification
              visible={this.state.notification.visible}
              message={this.state.notification.message}
              type={this.state.notification.type}
              onHide={this.handleHideNotification}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 248, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
    paddingHorizontal: 20
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0066cc',
    borderRadius: 8
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
})
