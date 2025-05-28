import React, { Component } from 'react'
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { storage, STORAGE_KEYS } from '../../utils/storage'
import PinInput from './PinInput'
import Button from '../common/Button'

export default class PinVerification extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = { error: '', attempts: 0 }
  }

  handlePinComplete = async (pin) => {
    const savedPin = await storage.get(STORAGE_KEYS.PIN)

    if (pin === savedPin) {
      this.setState({ error: '', attempts: 0 })
      this.props.onSuccess?.()
    } else {
      const newAttempts = this.state.attempts + 1
      this.setState({
        error: `PIN non corretto (${newAttempts}/3)`,
        attempts: newAttempts
      })

      if (newAttempts >= 3) {
        this.props.onMaxAttemptsReached?.()
      }
    }
  }

  reset = () => {
    this.setState({ error: '', attempts: 0 })
  }

  render () {
    const { theme } = this.context
    const { visible, title = 'Inserisci PIN', onCancel } = this.props
    const { error } = this.state

    return (
      <Modal
        animationType='fade'
        transparent
        visible={visible}
        onRequestClose={onCancel}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.header}>
                  <Text style={[styles.icon, { color: theme.colors.primary }]}>🔒</Text>
                  <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                </View>

                <PinInput
                  onPinComplete={this.handlePinComplete}
                  error={error}
                />

                <View style={styles.footer}>
                  <Button
                    title='Annulla'
                    onPress={onCancel}
                    variant='secondary'
                    size='medium'
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, padding: 20, minWidth: 320, maxWidth: 400, elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  footer: { marginTop: 20 }
})
