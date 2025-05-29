import { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class StatusIndicator extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { status = 'normal', label, size = 'medium' } = this.props

    const getStatusColor = () => {
      switch (status) {
        case 'active': return theme.colors.success
        case 'warning': return theme.colors.warning
        case 'error': return theme.colors.danger
        case 'inactive': return theme.colors.textMuted
        default: return theme.colors.primary
      }
    }

    const getDotSize = () => {
      switch (size) {
        case 'small': return 8
        case 'large': return 16
        default: return 12
      }
    }

    const statusColor = getStatusColor()
    const dotSize = getDotSize()

    return (
      <View style={styles.container}>
        <View style={[
          styles.dot,
          { backgroundColor: statusColor, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }
        ]}
        />
        {label && (
          <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dot: {
    marginRight: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '500'
  }
})
