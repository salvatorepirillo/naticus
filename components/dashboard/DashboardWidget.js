import { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

const { width } = Dimensions.get('window')

const WIDGET_CONFIG = {
  speed: { color: 'primary', icon: '⚡' },
  depth: { color: 'info', icon: '🌊' },
  wind: { color: 'secondary', icon: '💨' },
  battery: { color: 'success', icon: '🔋' },
  fuel: { color: 'warning', icon: '⛽' },
  position: { color: 'danger', icon: '📍' }
}

export default class DashboardWidget extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { title, value, unit, subtitle, type, onPress } = this.props
    const config = WIDGET_CONFIG[type] || { color: 'primary', icon: '📊' }
    const widgetColor = theme.colors[config.color]
    const widgetWidth = (width - 48) / 3

    const content = (
      <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, width: widgetWidth }]}>
        <View style={styles.header}>
          <Text style={styles.icon}>{config.icon}</Text>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text>
        </View>

        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: widgetColor }]}>{value}</Text>
          <Text style={[styles.unit, { color: theme.colors.textMuted }]}>{unit}</Text>
        </View>

        {subtitle && <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        <View style={[styles.indicator, { backgroundColor: widgetColor }]} />
      </View>
    )

    return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchable}>{content}</TouchableOpacity> : <View style={styles.touchable}>{content}</View>
  }
}

const styles = StyleSheet.create({
  touchable: { marginBottom: 16 },
  container: { padding: 16, borderRadius: 12, borderWidth: 1, position: 'relative', minHeight: 120 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 20, marginRight: 8 },
  title: { fontSize: 14, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  valueContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  value: { fontSize: 24, fontWeight: '700', marginRight: 4 },
  unit: { fontSize: 14, fontWeight: '500' },
  subtitle: { fontSize: 12, marginTop: 4 },
  indicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }
})
