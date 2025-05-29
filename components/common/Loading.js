import { Component } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class Loading extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { text, size = 'large', overlay = false } = this.props

    const content = (
      <View style={[styles.container, overlay && styles.overlay, { backgroundColor: overlay ? theme.colors.overlay : 'transparent' }]}>
        <View style={[styles.content, { backgroundColor: overlay ? theme.colors.surface : 'transparent' }]}>
          <ActivityIndicator size={size} color={theme.colors.primary} />
          {text && <Text style={[styles.text, { color: theme.colors.text }]}>{text}</Text>}
        </View>
      </View>
    )

    return content
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000
  },
  content: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center'
  }
})
