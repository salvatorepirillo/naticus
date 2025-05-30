import { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { ConnectivityContext } from '../../contexts/ConnectivityContext'

export default class ConnectivityIndicator extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { compact = false, showRefresh = false } = this.props

    return (
      <ConnectivityContext.Consumer>
        {(connectivity) => {
          if (!connectivity) return null

          const {
            isOnline,
            isLoading,
            getConnectionIcon,
            getConnectionStatus,
            getConnectionQuality,
            refreshConnectivity
          } = connectivity

          const quality = getConnectionQuality()
          const statusColor = this.getStatusColor(quality, theme)

          if (compact) {
            return (
              <View style={[styles.compactContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.compactIcon, { color: statusColor }]}>
                  {getConnectionIcon()}
                </Text>
                {!isOnline && (
                  <Text style={[styles.compactText, { color: statusColor }]}>
                    Offline
                  </Text>
                )}
              </View>
            )
          }

          return (
            <TouchableOpacity
              style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={showRefresh ? refreshConnectivity : undefined}
              disabled={isLoading}
              activeOpacity={showRefresh ? 0.7 : 1}
            >
              <View style={styles.content}>
                <Text style={[styles.icon, { color: statusColor }]}>
                  {getConnectionIcon()}
                </Text>
                <View style={styles.textContainer}>
                  <Text style={[styles.status, { color: theme.colors.text }]}>
                    {getConnectionStatus()}
                  </Text>
                  <Text style={[styles.quality, { color: statusColor }]}>
                    {this.getQualityText(quality)}
                  </Text>
                </View>
                {showRefresh && (
                  <Text style={[styles.refreshIcon, { color: theme.colors.textMuted }]}>
                    {isLoading ? '⟳' : '↻'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      </ConnectivityContext.Consumer>
    )
  }

  getStatusColor = (quality, theme) => {
    switch (quality) {
      case 'excellent':
      case 'good':
        return theme.colors.success
      case 'no-internet':
        return theme.colors.warning
      case 'offline':
        return theme.colors.danger
      default:
        return theme.colors.textMuted
    }
  }

  getQualityText = (quality) => {
    switch (quality) {
      case 'excellent':
        return 'Ottima'
      case 'good':
        return 'Buona'
      case 'no-internet':
        return 'Senza Internet'
      case 'offline':
        return 'Non connesso'
      default:
        return 'Sconosciuta'
    }
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginHorizontal: 4
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 16,
    marginRight: 8
  },
  textContainer: {
    flex: 1
  },
  status: {
    fontSize: 12,
    fontWeight: '500'
  },
  quality: {
    fontSize: 10,
    marginTop: 1
  },
  refreshIcon: {
    fontSize: 14,
    marginLeft: 8
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6
  },
  compactIcon: {
    fontSize: 14
  },
  compactText: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500'
  }
})
