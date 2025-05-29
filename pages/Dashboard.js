import { Component } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native'
import { ThemeContext } from '../contexts/ThemeContext'
import { LanguageContext } from '../contexts/LanguageContext'
import { LocationContext } from '../contexts/LocationContext'
import Container from '../components/common/Container'
import Header from '../components/common/Header'
import WeatherWidget from '../components/dashboard/WeatherWidget'
import SafetyScoreWidget from '../components/dashboard/SafetyScoreWidget'

export default class Dashboard extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      weatherData: null,
      marineData: null,
      weatherLoaded: false
    }
  }

  handleWeatherUpdate = (weatherData, marineData) => {
    this.setState({
      weatherData,
      marineData,
      weatherLoaded: true
    })
  }

  renderLoading = (t, message) => {
    const { theme } = this.context

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          {message}
        </Text>
      </View>
    )
  }

  render () {
    const { theme } = this.context
    const { weatherData, marineData, weatherLoaded } = this.state

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <LocationContext.Consumer>
            {({ latitude, longitude, loading: locationLoading, error: locationError }) => (
              <Container>
                <Header title={t('dashboard.title')} subtitle={t('dashboard.welcome')} />

                {locationLoading
                  ? this.renderLoading(t, t('dashboard.loadingLocation'))
                  : locationError
                    ? (
                      <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                          {locationError}
                        </Text>
                      </View>
                      )
                    : (
                      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                        <WeatherWidget
                          latitude={latitude}
                          longitude={longitude}
                          onWeatherUpdate={this.handleWeatherUpdate}
                        />

                        <SafetyScoreWidget
                          weatherData={weatherData}
                          marineData={marineData}
                          weatherLoaded={weatherLoaded}
                        />

                        {/* <View style={styles.grid}>
                          <DashboardWidget
                            title={t('widgets.speed')}
                            value='12.5'
                            unit={t('units.knots')}
                            type='speed'
                          />
                          <DashboardWidget
                            title={t('widgets.depth')}
                            value='8.2'
                            unit={t('units.meters')}
                            type='depth'
                          />
                          <DashboardWidget
                            title={t('widgets.wind')}
                            value='15'
                            unit={t('units.knots')}
                            subtitle='NE 45°'
                            type='wind'
                          />
                          <DashboardWidget
                            title={t('widgets.battery')}
                            value='87'
                            unit={t('units.percent')}
                            type='battery'
                          />
                          <DashboardWidget
                            title={t('widgets.fuel')}
                            value='245'
                            unit={t('units.liters')}
                            type='fuel'
                          />
                          <DashboardWidget
                            title={t('widgets.position')}
                            value='41.9028'
                            subtitle='12.4964'
                            unit={t('units.degrees')}
                            type='position'
                          />
                        </View> */}
                      </ScrollView>
                      )}
              </Container>
            )}
          </LocationContext.Consumer>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center' }
})
