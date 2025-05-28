import React, { Component } from 'react'
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { storage, STORAGE_KEYS } from '../../utils/storage'
import Button from '../common/Button'
import PinVerification from './PinVerification'

export default class BiometricVerification extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      showPinFallback: false,
      biometricType: null
    }
  }

  async componentDidMount () {
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
    let biometricType = 'biometric'
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'faceId'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'touchId'
    }
    this.setState({ biometricType })
  }

  componentDidUpdate (prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.attemptBiometricAuth()
    }
  }

  attemptBiometricAuth = async () => {
    const biometricEnabled = await storage.get(STORAGE_KEYS.BIOMETRIC_ENABLED, false)

    if (!biometricEnabled) {
      this.setState({ showPinFallback: true })
      return
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: this.props.title || 'Autentica per continuare',
        cancelLabel: 'Annulla',
        fallbackLabel: 'Usa PIN'
      })

      if (result.success) {
        this.props.onSuccess?.()
      } else if (result.error === 'user_fallback') {
        this.setState({ showPinFallback: true })
      } else {
        this.props.onCancel?.()
      }
    } catch (error) {
      console.warn('Biometric authentication error:', error)
      this.setState({ showPinFallback: true })
    }
  }

  handlePinSuccess = () => {
    this.setState({ showPinFallback: false })
    this.props.onSuccess?.()
  }

  handlePinCancel = () => {
    this.setState({ showPinFallback: false })
    this.props.onCancel?.()
  }

  getBiometricIcon = () => {
    switch (this.state.biometricType) {
      case 'faceId': return '👤'
      case 'touchId': return '👆'
      default: return '🔐'
    }
  }

  render () {
    const { theme } = this.context
    const { visible, title, onCancel } = this.props
    const { showPinFallback } = this.state

    if (showPinFallback) {
      return (
        <PinVerification
          visible={visible}
          title={title}
          onSuccess={this.handlePinSuccess}
          onCancel={this.handlePinCancel}
        />
      )
    }

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
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
                      <Text style={[styles.icon, { color: theme.colors.primary }]}>
                        {this.getBiometricIcon()}
                      </Text>
                      <Text style={[styles.title, { color: theme.colors.text }]}>
                        {title || t('settings.authenticateToAccess')}
                      </Text>
                      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {t('settings.tapToAuthenticate')}
                      </Text>
                    </View>

                    <View style={styles.footer}>
                      <Button
                        title={t('settings.usePinInstead')}
                        onPress={() => this.setState({ showPinFallback: true })}
                        variant='outline'
                        size='small'
                        style={styles.pinButton}
                      />
                      <Button
                        title={t('common.cancel')}
                        onPress={onCancel}
                        variant='secondary'
                        size='small'
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, padding: 30, minWidth: 320, maxWidth: 400, alignItems: 'center', elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  footer: { width: '100%' },
  pinButton: { marginBottom: 12 }
})
