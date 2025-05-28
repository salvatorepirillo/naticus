import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class SettingsRow extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { title, subtitle, component, onPress, disabled = false } = this.props

    const content = (
      <View style={[styles.container, disabled && styles.disabled]}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        {component && <View style={styles.componentContainer}>{component}</View>}
      </View>
    )

    return onPress && !disabled ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity> : content
  }
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, minHeight: 50 },
  disabled: { opacity: 0.5 },
  textContainer: { flex: 1, marginRight: 16 },
  title: { fontSize: 16, fontWeight: '500' },
  subtitle: { fontSize: 14, marginTop: 2 },
  componentContainer: { alignItems: 'flex-end' }
})
