import { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native'
import * as Location from 'expo-location'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { formatTime } from '../../utils/helpers'

export default class WeatherWidget extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      weatherData: null,
      marineData: null,
      locationData: null,
      loading: false,
      error: null,
      lastUpdate: null,
      expanded: false,
      searchQuery: '',
      lastFetchLat: null,
      lastFetchLon: null
    }
  }

  componentDidMount () {
    if (this.props.latitude && this.props.longitude) {
      this.handleFetchWeatherData(this.props.latitude, this.props.longitude)
      this.weatherInterval = setInterval(() => this.handleFetchWeatherData(this.props.latitude, this.props.longitude), 30 * 60 * 1000)
    }
  }

  componentWillUnmount () {
    if (this.weatherInterval) {
      clearInterval(this.weatherInterval)
    }
  }

  getCurrentLocation = async () => {
    this.setState({ loading: true, error: null })

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        this.setState({ error: 'Permesso GPS necessario per localizzazione', loading: false })
        if (this.props.onWeatherUpdate) {
          this.props.onWeatherUpdate(null, null)
        }
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      const lat = location.coords.latitude
      const lon = location.coords.longitude

      if (this.weatherInterval) {
        clearInterval(this.weatherInterval)
      }

      await this.handleFetchWeatherData(lat, lon)

      this.weatherInterval = setInterval(() => this.handleFetchWeatherData(lat, lon), 30 * 60 * 1000)
    } catch (error) {
      console.warn('Errore GPS:', error)
      this.setState({ error: 'Impossibile ottenere la posizione GPS', loading: false })
      if (this.props.onWeatherUpdate) {
        this.props.onWeatherUpdate(null, null)
      }
    }
  }

  handleSearchQueryChange = (query) => {
    this.setState({ searchQuery: query })
  }

  handleSearchSubmit = async () => {
    const { searchQuery } = this.state
    if (!searchQuery || searchQuery.trim() === '') {
      this.setState({ error: 'Inserisci una località da cercare', loading: false })
      if (this.props.onWeatherUpdate) {
        this.props.onWeatherUpdate(null, null)
      }
      return
    }

    this.setState({ loading: true, error: null })

    try {
      const geocodeResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery.trim())}&count=1&language=it&format=json`
      )

      if (!geocodeResponse.ok) {
        const errorData = await geocodeResponse.json().catch(() => ({}))
        throw new Error(errorData.reason || 'Errore nel geocoding della località')
      }

      const geocodeData = await geocodeResponse.json()

      if (!geocodeData.results || geocodeData.results.length === 0) {
        this.setState({ error: 'Località non trovata', loading: false })
        if (this.props.onWeatherUpdate) {
          this.props.onWeatherUpdate(null, null)
        }
        return
      }

      const { latitude, longitude, name, admin1, country } = geocodeData.results[0]

      if (this.weatherInterval) {
        clearInterval(this.weatherInterval)
      }

      const initialLocationDetails = {
        city: name,
        locality: name,
        principalSubdivision: admin1 || '',
        countryName: country || '',
        latitude,
        longitude
      }

      await this.handleFetchWeatherData(latitude, longitude, initialLocationDetails)

      this.weatherInterval = setInterval(() => this.handleFetchWeatherData(latitude, longitude), 30 * 60 * 1000)
      this.setState({ searchQuery: '' })
    } catch (error) {
      console.warn('Errore ricerca località:', error)
      this.setState({ error: error.message || 'Impossibile cercare la località', loading: false })
      if (this.props.onWeatherUpdate) {
        this.props.onWeatherUpdate(null, null)
      }
    }
  }

  handleFetchWeatherData = async (lat, lon, initialLocationDetails = null) => {
    if (!lat || !lon) {
      console.warn('Coordinate GPS non disponibili')
      if (this.props.onWeatherUpdate) {
        this.props.onWeatherUpdate(null, null)
      }
      return
    }

    const stateUpdate = { loading: true, error: null, lastFetchLat: lat, lastFetchLon: lon }
    if (initialLocationDetails) {
      stateUpdate.locationData = initialLocationDetails
    } else {
      stateUpdate.locationData = null // Clear previous location data if not providing new initial
    }
    this.setState(stateUpdate)

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,temperature_80m,temperature_120m,temperature_180m,soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_temperature_54cm,soil_moisture_0_1cm,soil_moisture_1_3cm,soil_moisture_3_9cm,soil_moisture_9_27cm,soil_moisture_27_81cm&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration&timezone=auto`
      )

      const marineResponse = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&daily=wave_height_max,wave_direction_dominant,wave_period_max,wind_wave_height_max,wind_wave_direction_dominant,wind_wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max&timezone=auto`
      )

      let newLocationData = initialLocationDetails
      try {
        const locationResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=it`
        )
        if (locationResponse.ok) {
          newLocationData = await locationResponse.json()
        } else {
          console.warn('Failed to fetch from BigDataCloud, using preliminary location data if available.')
          if (!initialLocationDetails) newLocationData = null
        }
      } catch (locError) {
        console.warn('Error fetching location from BigDataCloud:', locError)
        if (!initialLocationDetails) newLocationData = null
      }

      if (!weatherResponse.ok || !marineResponse.ok) {
        throw new Error('Errore nel recupero dei dati meteo')
      }

      const weatherData = await weatherResponse.json()
      const marineData = await marineResponse.json()

      this.setState({
        weatherData,
        marineData,
        locationData: newLocationData,
        loading: false,
        lastUpdate: new Date(),
        error: null
      })

      if (this.props.onWeatherUpdate) {
        this.props.onWeatherUpdate(weatherData, marineData)
      }
    } catch (error) {
      console.warn('Errore fetch weather:', error)
      this.setState({ error: error.message, loading: false })
      if (this.props.onWeatherUpdate) {
        this.props.onWeatherUpdate(null, null)
      }
    }
  }

  getWeatherIcon = (weatherCode, isDay) => {
    const icons = {
      0: isDay ? '☀️' : '🌙',
      1: isDay ? '🌤️' : '🌙',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌦️',
      55: '🌧️',
      61: '🌦️',
      63: '🌧️',
      65: '🌧️',
      71: '🌨️',
      73: '🌨️',
      75: '❄️',
      80: '🌦️',
      81: '🌧️',
      82: '⛈️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️'
    }
    return icons[weatherCode] || '❓'
  }

  getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  getSeaCondition = (waveHeight) => {
    if (!waveHeight || waveHeight === null) return { condition: 'N/A', color: 'textMuted', icon: '🏞️' }
    if (waveHeight < 0.5) return { condition: 'Calmo', color: 'success', icon: '🌊' }
    if (waveHeight < 1.0) return { condition: 'Poco mosso', color: 'info', icon: '🌊' }
    if (waveHeight < 2.0) return { condition: 'Mosso', color: 'warning', icon: '🌊' }
    if (waveHeight < 3.0) return { condition: 'Molto mosso', color: 'warning', icon: '🌊' }
    if (waveHeight < 4.0) return { condition: 'Agitato', color: 'danger', icon: '🌊' }
    return { condition: 'Molto agitato', color: 'danger', icon: '🌊' }
  }

  handleToggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded })
  }

  renderCompactView = (t) => {
    const { theme } = this.context
    const { weatherData, marineData, locationData } = this.state

    if (!weatherData || !marineData) return null

    const current = weatherData.current
    const marine = marineData.current
    const seaCondition = this.getSeaCondition(marine.wave_height)

    return (
      <View style={styles.compactContainer}>
        {locationData && (
          <View style={styles.locationContainer}>
            <Text style={[styles.locationIcon, { color: theme.colors.primary }]}>📍</Text>
            <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
              {locationData.city || locationData.locality || locationData.principalSubdivision}
              {locationData.countryName && `, ${locationData.countryName}`}
            </Text>
          </View>
        )}

        <View style={styles.compactRow}>
          <View style={styles.compactItem}>
            <Text style={[styles.compactIcon, { color: theme.colors.primary }]}>
              {this.getWeatherIcon(current.weather_code, current.is_day)}
            </Text>
            <Text style={[styles.compactValue, { color: theme.colors.text }]}>
              {Math.round(current.temperature_2m)}°C
            </Text>
          </View>

          <View style={styles.compactItem}>
            <Text style={[styles.compactIcon, { color: theme.colors.info }]}>💨</Text>
            <Text style={[styles.compactValue, { color: theme.colors.text }]}>
              {Math.round(current.wind_speed_10m)} kt
            </Text>
            <Text style={[styles.compactDirection, { color: theme.colors.textMuted }]}>
              {this.getWindDirection(current.wind_direction_10m)}
            </Text>
          </View>

          <View style={styles.compactItem}>
            <Text style={[styles.compactIcon, { color: theme.colors[seaCondition.color] }]}>
              {seaCondition.icon}
            </Text>
            <Text style={[styles.compactValue, { color: theme.colors.text }]}>
              {marine.wave_height ? `${marine.wave_height.toFixed(1)}m` : t('weather.location')}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  renderExpandedView = (t) => {
    const { theme } = this.context
    const { weatherData, marineData, locationData } = this.state

    if (!weatherData || !marineData) return null

    const current = weatherData.current
    const marine = marineData.current
    const seaCondition = this.getSeaCondition(marine.wave_height)

    return (
      <ScrollView style={styles.expandedScrollView} showsVerticalScrollIndicator={false}>
        {locationData && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.locationHeader}>
              <Text style={[styles.locationIcon, { color: theme.colors.primary }]}>📍</Text>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationPrimary, { color: theme.colors.text }]}>
                  {locationData.city || locationData.locality || locationData.principalSubdivision}
                </Text>
                <Text style={[styles.locationSecondary, { color: theme.colors.textSecondary }]}>
                  {locationData.principalSubdivision !== (locationData.city || locationData.locality) &&
                    locationData.principalSubdivision && `${locationData.principalSubdivision}, `}
                  {locationData.countryName}
                </Text>
                <Text style={[styles.coordinates, { color: theme.colors.textMuted }]}>
                  {parseFloat(locationData.latitude).toFixed(4)}°, {parseFloat(locationData.longitude).toFixed(4)}°
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('weather.current', 'Attuale')}
          </Text>

          <View style={styles.currentWeather}>
            <View style={styles.currentMain}>
              <Text style={[styles.weatherIcon, { color: theme.colors.primary }]}>
                {this.getWeatherIcon(current.weather_code, current.is_day)}
              </Text>
              <Text style={[styles.temperature, { color: theme.colors.text }]}>
                {Math.round(current.temperature_2m)}°C
              </Text>
              <Text style={[styles.feelsLike, { color: theme.colors.textSecondary }]}>
                {t('weather.feelsLike', 'Percepiti')} {Math.round(current.apparent_temperature)}°C
              </Text>
            </View>

            <View style={styles.currentDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('weather.humidity', 'Umidità')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {current.relative_humidity_2m}%
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('weather.pressure', 'Pressione')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {Math.round(current.pressure_msl)} hPa
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('weather.cloudCover', 'Cop. nuvolosa')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {current.cloud_cover}%
                </Text>
              </View>

              {current.precipitation > 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    {t('weather.precipitation', 'Precipitazioni')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.info }]}>
                    {current.precipitation} mm
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            💨 {t('weather.wind', 'Vento')}
          </Text>

          <View style={styles.windInfo}>
            <View style={styles.windMain}>
              <Text style={[styles.windSpeed, { color: theme.colors.info }]}>
                {Math.round(current.wind_speed_10m * 1.94384)} kt
              </Text>
              <Text style={[styles.windDirection, { color: theme.colors.text }]}>
                {this.getWindDirection(current.wind_direction_10m)} ({current.wind_direction_10m}°)
              </Text>
            </View>

            <View style={styles.windDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('weather.gusts', 'Raffiche')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.warning }]}>
                  {Math.round(current.wind_gusts_10m * 1.94384)} kt
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('weather.windSpeedMs', 'Velocità (m/s)')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {current.wind_speed_10m} m/s
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🌊 {t('weather.marine', 'Mare')}
          </Text>

          {marine.wave_height !== null
            ? (
              <View style={styles.marineInfo}>
                <View style={styles.marineMain}>
                  <Text style={[styles.seaCondition, { color: theme.colors[seaCondition.color] }]}>
                    {seaCondition.condition}
                  </Text>
                  <Text style={[styles.waveHeight, { color: theme.colors.text }]}>
                    {t('weather.waveHeight', 'Altezza onde')}: {marine.wave_height.toFixed(1)}m
                  </Text>
                </View>

                <View style={styles.marineDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      {t('weather.waveDirection', 'Direz. onde')}:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {marine.wave_direction ? `${this.getWindDirection(marine.wave_direction)} (${marine.wave_direction}°)` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      {t('weather.wavePeriod', 'Periodo onde')}:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {marine.wave_period ? `${marine.wave_period.toFixed(1)}s` : 'N/A'}
                    </Text>
                  </View>

                  {marine.wind_wave_height !== null && marine.wind_wave_height > 0 && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {t('weather.windWaveHeight', 'Altezza onde vento')}:
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                          {marine.wind_wave_height.toFixed(1)}m
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {t('weather.windWavePeriod', 'Periodo onde vento')}:
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                          {marine.wind_wave_period ? `${marine.wind_wave_period.toFixed(1)}s` : 'N/A'}
                        </Text>
                      </View>
                    </>
                  )}

                  {marine.swell_wave_height !== null && marine.swell_wave_height > 0 && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {t('weather.swellHeight', 'Altezza onde morte')}:
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                          {marine.swell_wave_height.toFixed(1)}m
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {t('weather.swellPeriod', 'Periodo onde morte')}:
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                          {marine.swell_wave_period ? `${marine.swell_wave_period.toFixed(1)}s` : 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {t('weather.swellDirection', 'Direz. onde morte')}:
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                          {marine.swell_wave_direction ? `${this.getWindDirection(marine.swell_wave_direction)} (${marine.swell_wave_direction}°)` : 'N/A'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
              )
            : (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataIcon, { color: theme.colors.textMuted }]}>🏞️</Text>
                <Text style={[styles.noDataText, { color: theme.colors.textMuted }]}>
                  {t('weather.noMarineData', 'Dati marini non disponibili')}
                </Text>
              </View>
              )}
        </View>

        {this.state.lastUpdate && (
          <View style={styles.updateInfo}>
            <Text style={[styles.updateText, { color: theme.colors.textMuted }]}>
              {t('weather.lastUpdate', 'Ultimo agg.')}: {formatTime(this.state.lastUpdate)}
            </Text>
          </View>
        )}
      </ScrollView>
    )
  }

  render () {
    const { theme } = this.context
    const { loading, error, expanded, weatherData } = this.state

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <TouchableOpacity
            style={[
              styles.container,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              expanded && weatherData && styles.expandedHeight
            ]}
            onPress={this.handleToggleExpanded}
            activeOpacity={0.8}
            disabled={!weatherData}
          >
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
                  {t('weather.title', 'Meteo')}
                </Text>
                {weatherData && (
                  <Text style={[styles.expandIcon, { color: theme.colors.textMuted }]}>
                    {expanded ? '▼' : '▶'}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.searchSection, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                placeholder={t('weather.searchPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={this.state.searchQuery}
                onChangeText={this.handleSearchQueryChange}
                onSubmitEditing={this.handleSearchSubmit}
                returnKeyType='search'
              />
              <TouchableOpacity onPress={this.handleSearchSubmit} style={[styles.searchButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.searchButtonText, { color: theme.colors.card || '#FFFFFF' }]}>{t('weather.search')}</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='small' color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  {t('weather.loading')}
                </Text>
              </View>
            )}

            {error && !loading && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                  {error}
                </Text>
                {(this.state.lastFetchLat && this.state.lastFetchLon) &&
                  <TouchableOpacity onPress={() => this.handleFetchWeatherData(this.state.lastFetchLat, this.state.lastFetchLon)} style={styles.retryButton}>
                    <Text style={[styles.retryText, { color: theme.colors.primary }]}>
                      {t('common.retry', 'Riprova')}
                    </Text>
                  </TouchableOpacity>}
              </View>
            )}

            {!loading && !error && weatherData && (
              expanded ? this.renderExpandedView(t) : this.renderCompactView(t)
            )}
            {!loading && !error && !weatherData && (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, { color: theme.colors.textMuted, padding: 20 }]}>
                  {t('weather.noDataInitial')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  header: { padding: 12, borderBottomWidth: 1 },
  titleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  expandIcon: { fontSize: 12 },

  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    fontSize: 14
  },
  searchButton: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '500'
  },

  compactContainer: { padding: 12 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' },
  locationIcon: { fontSize: 16, marginRight: 6 },
  locationText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  compactRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  compactItem: { alignItems: 'center', marginHorizontal: 5 },
  compactIcon: { fontSize: 24, marginBottom: 4 },
  compactValue: { fontSize: 16, fontWeight: '600' },
  compactDirection: { fontSize: 12, marginTop: 2 },

  expandedScrollView: { flex: 1 },
  expandedHeight: { minHeight: 800 },
  section: { margin: 8, padding: 12, borderRadius: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

  locationHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  locationInfo: { flex: 1 },
  locationPrimary: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  locationSecondary: { fontSize: 14, marginBottom: 4 },
  coordinates: { fontSize: 12, fontFamily: 'monospace' },

  currentWeather: { flexDirection: 'row' },
  currentMain: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  weatherIcon: { fontSize: 48, marginBottom: 8 },
  temperature: { fontSize: 32, fontWeight: '700' },
  feelsLike: { fontSize: 14, marginTop: 4 },
  currentDetails: { flex: 1, justifyContent: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 14, flexShrink: 1, marginRight: 4 },
  detailValue: { fontSize: 14, fontWeight: '500', textAlign: 'right' },

  windInfo: { alignItems: 'center' },
  windMain: { alignItems: 'center', marginBottom: 8 },
  windSpeed: { fontSize: 24, fontWeight: '700' },
  windDirection: { fontSize: 16, marginTop: 4 },
  windDetails: { width: '100%' },

  marineInfo: { alignItems: 'center' },
  marineMain: { alignItems: 'center', marginBottom: 12 },
  seaCondition: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  waveHeight: { fontSize: 16 },
  marineDetails: { width: '100%' },

  noDataContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  noDataIcon: { fontSize: 48, marginBottom: 8 },
  noDataText: { fontSize: 16, textAlign: 'center' },

  loadingContainer: { padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  loadingText: { marginTop: 8, fontSize: 14 },
  errorContainer: { padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  retryButton: { padding: 8 },
  retryText: { fontSize: 14, fontWeight: '500' },

  updateInfo: { padding: 12, alignItems: 'center' },
  updateText: { fontSize: 12 }
})
