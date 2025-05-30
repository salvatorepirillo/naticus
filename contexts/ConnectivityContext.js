import { Component, createContext } from 'react'
import * as Network from 'expo-network'

const ConnectivityContext = createContext()

export class ConnectivityProvider extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isOnline: true,
      connectionType: 'unknown',
      isInternetReachable: null,
      isLoading: true
    }
    this.networkSubscription = null
  }

  async componentDidMount () {
    await this.checkInitialConnectivity()
    this.setupNetworkListener()
  }

  componentWillUnmount () {
    if (this.networkSubscription) {
      this.networkSubscription.remove()
    }
  }

  checkInitialConnectivity = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      this.setState({
        isOnline: networkState.isConnected !== false,
        connectionType: networkState.type || 'unknown',
        isInternetReachable: networkState.isInternetReachable,
        isLoading: false
      })
    } catch (error) {
      console.warn('Initial connectivity check failed:', error)
      // Assume online come fallback
      this.setState({
        isOnline: true,
        connectionType: 'unknown',
        isInternetReachable: null,
        isLoading: false
      })
    }
  }

  setupNetworkListener = () => {
    try {
      this.networkSubscription = Network.addNetworkStateListener((state) => {
        const wasOnline = this.state.isOnline
        const isNowOnline = state.isConnected !== false

        this.setState({
          isOnline: isNowOnline,
          connectionType: state.type || 'unknown',
          isInternetReachable: state.isInternetReachable
        })

        // Notifica i listeners del cambiamento di stato
        if (wasOnline !== isNowOnline && this.props.onConnectivityChange) {
          this.props.onConnectivityChange(isNowOnline, state)
        }
      })
    } catch (error) {
      console.warn('Network listener setup failed:', error)
    }
  }

  // Metodo per forzare un controllo manuale
  refreshConnectivity = async () => {
    this.setState({ isLoading: true })
    await this.checkInitialConnectivity()
  }

  // Metodo per verificare se una feature richiede connessione
  requiresConnection = (feature) => {
    const { isOnline, isInternetReachable } = this.state

    switch (feature) {
      case 'download':
        return isOnline && isInternetReachable !== false
      case 'api':
        return isOnline && isInternetReachable !== false
      case 'basic':
        return isOnline
      default:
        return true
    }
  }

  getConnectionQuality = () => {
    const { connectionType, isOnline, isInternetReachable } = this.state

    if (!isOnline) return 'offline'
    if (isInternetReachable === false) return 'no-internet'

    switch (connectionType) {
      case Network.NetworkStateType.WIFI:
        return 'excellent'
      case Network.NetworkStateType.CELLULAR:
        return 'good'
      case Network.NetworkStateType.ETHERNET:
        return 'excellent'
      case Network.NetworkStateType.NONE:
        return 'offline'
      default:
        return isOnline ? 'unknown' : 'offline'
    }
  }

  getConnectionIcon = () => {
    const quality = this.getConnectionQuality()

    switch (quality) {
      case 'excellent':
        return '📶'
      case 'good':
        return '📶'
      case 'no-internet':
        return '❌'
      case 'offline':
        return '📵'
      default:
        return '❓'
    }
  }

  getConnectionStatus = () => {
    const { isOnline, isInternetReachable, connectionType } = this.state

    if (!isOnline) return 'Offline'
    if (isInternetReachable === false) return 'Connesso senza Internet'

    switch (connectionType) {
      case Network.NetworkStateType.WIFI:
        return 'WiFi'
      case Network.NetworkStateType.CELLULAR:
        return 'Rete Mobile'
      case Network.NetworkStateType.ETHERNET:
        return 'Ethernet'
      default:
        return isOnline ? 'Online' : 'Offline'
    }
  }

  render () {
    const value = {
      ...this.state,
      refreshConnectivity: this.refreshConnectivity,
      requiresConnection: this.requiresConnection,
      getConnectionQuality: this.getConnectionQuality,
      getConnectionIcon: this.getConnectionIcon,
      getConnectionStatus: this.getConnectionStatus
    }

    return (
      <ConnectivityContext.Provider value={value}>
        {this.props.children}
      </ConnectivityContext.Provider>
    )
  }
}

export const ConnectivityConsumer = ConnectivityContext.Consumer
export { ConnectivityContext }
