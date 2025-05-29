import { Component } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { storage, STORAGE_KEYS } from '../../utils/storage'
import Button from '../common/Button'

export default class BiometricAuth extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      isSupported: false,
      isEnrolled: false,
      biometricType: null,
      isEnabled: false
    }
  }

  async componentDidMount () {
    await this.checkBiometricSupport()
    const isEnabled = await storage.get(STORAGE_KEYS.BIOMETRIC_ENABLED, false)
    this.setState({ isEnabled })
  }

  checkBiometricSupport = async () => {
    try {
      const isSupported = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
      let biometricType = 'biometric'
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'faceId'
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'touchId'
      }

      this.setState({ isSupported, isEnrolled, biometricType })
    } catch (error) {
      console.warn('❌ Error checking biometric support:', error)
    }
  }

  authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentica con Face ID per continuare',
        cancelLabel: 'Annulla',
        fallbackLabel: 'Usa PIN',
        disableDeviceFallback: false
      })
      if (result.success) {
        return true
      } else {
        console.log('❌ Biometric authentication failed:', result.error)
        return false
      }
    } catch (error) {
      console.warn('❌ Biometric authentication error:', error)
      return false
    }
  }

  handleToggleBiometric = async () => {
    const { isEnabled } = this.state

    if (!isEnabled) {
      const success = await this.authenticateWithBiometrics()
      if (success) {
        await storage.set(STORAGE_KEYS.BIOMETRIC_ENABLED, true)
        this.setState({ isEnabled: true })
        this.props.onBiometricEnabled?.()
      } else {
        console.log('❌ Failed to enable biometric')
      }
    } else {
      Alert.alert(
        'Disabilita autenticazione biometrica',
        'Vuoi disabilitare l\'autenticazione biometrica?',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Disabilita',
            style: 'destructive',
            onPress: async () => {
              await storage.set(STORAGE_KEYS.BIOMETRIC_ENABLED, false)
              this.setState({ isEnabled: false })
              this.props.onBiometricDisabled?.()
            }
          }
        ]
      )
    }
  }

  getBiometricIcon = () => {
    switch (this.state.biometricType) {
      case 'faceId': return '👤'
      case 'touchId': return '👆'
      default: return '🔐'
    }
  }

  getBiometricLabel = (t) => {
    switch (this.state.biometricType) {
      case 'faceId': return t('settings.faceId')
      case 'touchId': return t('settings.touchId')
      default: return t('settings.biometric')
    }
  }

  render () {
    const { theme } = this.context
    const { isSupported, isEnrolled, isEnabled } = this.state

    if (!isSupported || !isEnrolled) {
      console.log('⚠️ Biometric not available - hiding component')
      return null
    }

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <View style={styles.container}>
            <View style={styles.info}>
              <Text style={[styles.icon, { color: theme.colors.primary }]}>
                {this.getBiometricIcon()}
              </Text>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {this.getBiometricLabel(t)}
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {isEnabled ? t('settings.biometricEnabled') : t('settings.biometricDisabled')}
                </Text>
              </View>
            </View>
            <Button
              title={isEnabled ? t('common.disable') : t('common.enable')}
              onPress={this.handleToggleBiometric}
              variant={isEnabled ? 'secondary' : 'primary'}
              size='small'
            />
          </View>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { fontSize: 24, marginRight: 12 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500' },
  subtitle: { fontSize: 14, marginTop: 2 }
})
