import { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class MapControls extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { isOnline, cacheInfo, offlineRegions, onShowOfflineModal } = this.props

    return (
      <View style={styles.controlsContainer}>
        {/* Pulsante principale per gestione offline */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={onShowOfflineModal}
          activeOpacity={0.8}
        >
          <Text style={styles.controlIcon}>🗺️</Text>
          {offlineRegions.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                {offlineRegions.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Indicatore di stato connessione */}
        <View style={[styles.statusIndicator, { backgroundColor: theme.colors.surface }]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isOnline ? theme.colors.success : theme.colors.danger }
          ]}
          />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Indicatore cache (solo se c'è cache) */}
        {cacheInfo.size > 0 && (
          <View style={[styles.cacheIndicator, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.cacheIcon, { color: theme.colors.info }]}>💾</Text>
            <Text style={[styles.cacheText, { color: theme.colors.text }]}>
              {cacheInfo.formattedSize}
            </Text>
          </View>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8,
    zIndex: 100
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative'
  },
  controlIcon: {
    fontSize: 22
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    elevation: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    maxWidth: 120
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  cacheIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2
  },
  cacheIcon: {
    fontSize: 14,
    marginRight: 4
  },
  cacheText: {
    fontSize: 11,
    fontWeight: '500'
  }
})
