import { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { storage, STORAGE_KEYS } from '../../utils/storage'
import { calcolaScore } from '../../utils/score'

export default class SafetyScoreWidget extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      boatParams: null,
      scoreData: null,
      expanded: false
    }
  }

  async componentDidMount () {
    const params = await storage.get(STORAGE_KEYS.BOAT_PARAMETERS, {})
    this.setState({ boatParams: params })
    this.calculateScore()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.weatherData !== this.props.weatherData) {
      this.calculateScore()
    }
  }

  calculateScore = () => {
    const { weatherData, marineData } = this.props
    const { boatParams } = this.state

    if (!weatherData || !marineData || !boatParams) {
      this.setState({ scoreData: null })
      return
    }

    const requiredParams = ['loa', 'beam', 'weight', 'category']
    const missingParams = requiredParams.filter(param => !boatParams[param])

    if (missingParams.length > 0) {
      this.setState({ scoreData: null })
      return
    }

    if (!weatherData.current || !weatherData.current.wind_speed_10m || !weatherData.current.wind_gusts_10m) {
      this.setState({ scoreData: null })
      return
    }

    const meteoData = {
      wave_height: marineData.current.wave_height || 0,
      wave_period: marineData.current.wave_period,
      wind_wave_height: marineData.current.wind_wave_height,
      wind_wave_period: marineData.current.wind_wave_period,
      wind_speed_10m: weatherData.current.wind_speed_10m,
      wind_gusts_10m: weatherData.current.wind_gusts_10m
    }

    const scoreData = calcolaScore(boatParams, meteoData)
    this.setState({ scoreData })
  }

  handleToggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded })
  }

  getScoreColor = (score) => {
    const { theme } = this.context
    if (score >= 90) return theme.colors.success
    if (score >= 70) return theme.colors.success
    if (score >= 50) return theme.colors.warning
    if (score >= 30) return theme.colors.danger
    return theme.colors.danger
  }

  getScoreLabel = (score, t) => {
    if (score >= 90) return t('safety.ideal')
    if (score >= 70) return t('safety.good')
    if (score >= 50) return t('safety.caution')
    if (score >= 30) return t('safety.challenging')
    return t('safety.notRecommended')
  }

  getStatusColor = (status) => {
    const { theme } = this.context
    switch (status) {
      case 'good': return theme.colors.success
      case 'warning': return theme.colors.warning
      case 'danger': return theme.colors.danger
      default: return theme.colors.textMuted
    }
  }

  getParameterLabel = (name, t) => {
    const labels = {
      waveHeight: t('safety.params.waveHeight'),
      wavePeriod: t('safety.params.wavePeriod'),
      windWaveHeight: t('safety.params.windWaveHeight'),
      windWavePeriod: t('safety.params.windWavePeriod'),
      windSpeed: t('safety.params.windSpeed'),
      windGusts: t('safety.params.windGusts'),
      visibility: t('safety.params.visibility'),
      boatStability: t('safety.params.boatStability'),
      boatCategory: t('safety.params.boatCategory')
    }
    return labels[name] || name
  }

  renderCircularProgress = (score) => {
    const { theme } = this.context
    const size = 120
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
      <View style={styles.circularProgress}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill='transparent'
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={this.getScoreColor(score)}
            strokeWidth={strokeWidth}
            fill='transparent'
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: this.getScoreColor(score) }]}>
            {Math.round(score)}
          </Text>
          <Text style={[styles.scoreUnit, { color: theme.colors.textMuted }]}>
            /100
          </Text>
        </View>
      </View>
    )
  }

  renderParameterDetails = (t) => {
    const { theme } = this.context
    const { scoreData } = this.state

    if (!scoreData) return null

    return (
      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.detailsHeader}>
          <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
            {t('safety.detailsTitle')}
          </Text>
        </View>

        {scoreData.details.map((param, index) => (
          <View key={index} style={[styles.parameterRow, { borderBottomColor: theme.colors.separator }]}>
            <View style={styles.parameterInfo}>
              <View style={styles.parameterHeader}>
                <View style={[styles.statusDot, { backgroundColor: this.getStatusColor(param.status) }]} />
                <Text style={[styles.parameterName, { color: theme.colors.text }]}>
                  {this.getParameterLabel(param.name, t)}
                </Text>
              </View>
              <View style={styles.parameterValue}>
                <Text style={[styles.value, { color: theme.colors.text }]}>
                  {param.value} {param.unit}
                </Text>
                {param.penalty > 0 && (
                  <Text style={[styles.penalty, { color: theme.colors.danger }]}>
                    -{param.penalty}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    )
  }

  render () {
    const { theme } = this.context
    const { scoreData, expanded } = this.state

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <TouchableOpacity
            style={[
              styles.container,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              expanded && styles.expandedHeight
            ]}
            onPress={this.handleToggleExpanded}
            activeOpacity={0.8}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
                {t('safety.title')}
              </Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textMuted }]}>
                {expanded ? '▼' : '▶'}
              </Text>
            </View>

            {scoreData
              ? (
                  expanded
                    ? (
                      <View style={styles.expandedContent}>
                        <View style={styles.compactScore}>
                          {this.renderCircularProgress(scoreData.score)}
                          <View style={styles.scoreInfo}>
                            <Text style={[styles.scoreLabel, { color: this.getScoreColor(scoreData.score) }]}>
                              {this.getScoreLabel(scoreData.score, t)}
                            </Text>
                          </View>
                        </View>
                        {this.renderParameterDetails(t)}
                      </View>
                      )
                    : (
                      <View style={styles.content}>
                        {this.renderCircularProgress(scoreData.score)}
                        <View style={styles.info}>
                          <Text style={[styles.scoreLabel, { color: this.getScoreColor(scoreData.score) }]}>
                            {this.getScoreLabel(scoreData.score, t)}
                          </Text>
                          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                            {t('safety.description')}
                          </Text>
                        </View>
                      </View>
                      )
                )
              : !this.props.weatherLoaded
                  ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size='small' color={theme.colors.primary} />
                      <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                        {t('safety.loading')}
                      </Text>
                    </View>
                    )
                  : (
                    <View style={styles.noDataContainer}>
                      <Text style={[styles.noDataIcon, { color: theme.colors.textMuted }]}>⚙️</Text>
                      <Text style={[styles.noDataText, { color: theme.colors.textMuted }]}>
                        {t('safety.noData')}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  title: { fontSize: 14, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  expandIcon: { fontSize: 12 },

  content: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  circularProgress: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  scoreContainer: { position: 'absolute', alignItems: 'center' },
  scoreValue: { fontSize: 28, fontWeight: '700' },
  scoreUnit: { fontSize: 14, marginTop: -4 },

  info: { flex: 1, marginLeft: 20 },
  scoreLabel: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20 },

  expandedHeight: { minHeight: 600 },
  expandedContent: { flex: 1 },
  compactScore: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  scoreInfo: { marginLeft: 16 },

  detailsContainer: { flex: 1, padding: 12 },
  detailsHeader: { marginBottom: 12 },
  detailsTitle: { fontSize: 16, fontWeight: '600' },

  parameterRow: { paddingVertical: 12, borderBottomWidth: 1 },
  parameterInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  parameterHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  parameterName: { fontSize: 14, fontWeight: '500' },
  parameterValue: { flexDirection: 'row', alignItems: 'center' },
  value: { fontSize: 14, fontWeight: '600', marginRight: 8 },
  penalty: { fontSize: 12, fontWeight: '500' },

  noDataContainer: { alignItems: 'center', paddingVertical: 30 },
  noDataIcon: { fontSize: 32, marginBottom: 8 },
  noDataText: { fontSize: 14, textAlign: 'center' },

  loadingContainer: { alignItems: 'center', paddingVertical: 30 },
  loadingText: { marginTop: 8, fontSize: 14 }
})
