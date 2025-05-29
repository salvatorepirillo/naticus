import { Component, createContext } from 'react'
import * as Location from 'expo-location'

const LocationContext = createContext()

export class LocationProvider extends Component {
  constructor (props) {
    super(props)
    this.state = {
      latitude: null,
      longitude: null,
      loading: true,
      error: null
    }
  }

  async componentDidMount () {
    await this.getCurrentLocation()
  }

  getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        this.setState({ error: 'Permesso GPS necessario', loading: false })
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      this.setState({ latitude: location.coords.latitude, longitude: location.coords.longitude, loading: false, error: null })
    } catch (error) {
      this.setState({ error: 'Errore GPS', loading: false })
    }
  }

  render () {
    return <LocationContext.Provider value={{ ...this.state, refreshLocation: this.getCurrentLocation }}>{this.props.children}</LocationContext.Provider>
  }
}

export const LocationConsumer = LocationContext.Consumer
export { LocationContext }
