import { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class MetricCard extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { label, value, unit, status = 'normal' } = this.props

    const getStatusColor = () => {
      switch (status) {
        case 'warning': return theme.colors.warning
        case 'danger': return theme.colors.danger
        case 'success': return theme.colors.success
        default: return theme.colors.primary
      }
    }

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: getStatusColor() }]}>{value}</Text>
          {unit && <Text style={[styles.unit, { color: theme.colors.textMuted }]}>{unit}</Text>}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  value: {
    fontSize: 18,
    fontWeight: '600'
  },
  unit: {
    fontSize: 12,
    marginLeft: 4
  }
})
