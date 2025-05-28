import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class PinInput extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = { pin: '', animatingIndex: -1 }
  }

  componentDidUpdate (prevProps, prevState) {
    // Quando raggiungo 4 cifre, chiamo onPinComplete e resetto dopo un delay
    if (prevState.pin.length !== this.state.pin.length && this.state.pin.length === 4) {
      this.props.onPinComplete?.(this.state.pin)
      setTimeout(() => this.setState({ pin: '' }), 500)
    }
  }

  addDigit = (digit) => {
    if (this.state.pin.length < 4) {
      const newPin = this.state.pin + digit
      this.setState({ pin: newPin, animatingIndex: this.state.pin.length })
      setTimeout(() => this.setState({ animatingIndex: -1 }), 150)
    }
  }

  removeDigit = () => {
    if (this.state.pin.length > 0) {
      this.setState({ pin: this.state.pin.slice(0, -1) })
    }
  }

  clearPin = () => {
    this.setState({ pin: '' })
  }

  render () {
    const { theme } = this.context
    const { title, error } = this.props

    return (
      <View style={styles.container}>
        {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}

        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map(index => (
            <View
              key={index}
              style={[
                styles.dot,
                { borderColor: theme.colors.border },
                index < this.state.pin.length && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                this.state.animatingIndex === index && styles.animatingDot
              ]}
            />
          ))}
        </View>

        {error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}

        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
            <TouchableOpacity
              key={number}
              style={[styles.key, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => this.addDigit(number.toString())}
              activeOpacity={0.7}
            >
              <Text style={[styles.keyText, { color: theme.colors.text }]}>{number}</Text>
            </TouchableOpacity>
          ))}

          <View style={[styles.key, { opacity: 0 }]} />

          <TouchableOpacity
            style={[styles.key, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => this.addDigit('0')}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, { color: theme.colors.text }]}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.key, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={this.removeDigit}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, { color: theme.colors.textMuted }]}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 30, textAlign: 'center' },
  dotsContainer: { flexDirection: 'row', marginBottom: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, marginHorizontal: 8 },
  animatingDot: { transform: [{ scale: 1.2 }] },
  error: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 240 },
  key: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, justifyContent: 'center', alignItems: 'center', margin: 8 },
  keyText: { fontSize: 24, fontWeight: '500' }
})
