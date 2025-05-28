import React, { Component } from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class Button extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { title, onPress, variant = 'primary', size = 'medium', disabled = false, style } = this.props

    const getButtonStyle = () => {
      const baseStyle = [styles.button, styles[size]]

      if (variant === 'secondary') baseStyle.push({ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border })
      else if (variant === 'danger') baseStyle.push({ backgroundColor: theme.colors.danger })
      else if (variant === 'outline') baseStyle.push({ backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary })
      else baseStyle.push({ backgroundColor: theme.colors.primary })

      if (disabled) baseStyle.push(styles.disabled)
      return baseStyle
    }

    const getTextStyle = () => {
      const baseStyle = [styles.text, styles[`${size}Text`]]

      if (variant === 'secondary') baseStyle.push({ color: theme.colors.text })
      else if (variant === 'outline') baseStyle.push({ color: theme.colors.primary })
      else baseStyle.push({ color: '#FFFFFF' })

      if (disabled) baseStyle.push({ color: theme.colors.textMuted })
      return baseStyle
    }

    return (
      <TouchableOpacity style={[getButtonStyle(), style]} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
        <Text style={getTextStyle()}>{title}</Text>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  button: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  small: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 32 },
  medium: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 },
  large: { paddingHorizontal: 20, paddingVertical: 14, minHeight: 48 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600' },
  smallText: { fontSize: 14 },
  mediumText: { fontSize: 16 },
  largeText: { fontSize: 18 }
})
