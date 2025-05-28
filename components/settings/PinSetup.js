import React, { Component } from 'react'
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { storage, STORAGE_KEYS } from '../../utils/storage'
import PinInput from './PinInput'
import Button from '../common/Button'

export default class PinSetup extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      modalVisible: false,
      currentPin: null,
      step: 'verify', // 'verify', 'new', 'confirm', 'action'
      tempPin: '',
      error: ''
    }
  }

  async componentDidMount () {
    const savedPin = await storage.get(STORAGE_KEYS.PIN)
    console.log('Loaded PIN from storage:', savedPin)
    this.setState({ currentPin: savedPin })
  }

  showModal = () => {
    const step = this.state.currentPin ? 'verify' : 'new'
    this.setState({ modalVisible: true, step, error: '', tempPin: '' })
  }

  hideModal = () => {
    this.setState({ modalVisible: false, step: 'verify', error: '', tempPin: '' })
  }

  handlePinComplete = async (pin) => {
    const { step, currentPin, tempPin } = this.state

    switch (step) {
      case 'verify':
        console.log('Verifying PIN:', pin, 'vs', currentPin)
        if (String(pin) === String(currentPin)) {
          this.setState({ step: 'action', error: '' })
        } else {
          this.setState({ error: 'PIN non corretto' })
        }
        break

      case 'new':
        this.setState({ step: 'confirm', tempPin: pin, error: '' })
        break

      case 'confirm':
        if (pin === tempPin) {
          await storage.set(STORAGE_KEYS.PIN, pin)
          this.setState({ currentPin: pin })
          this.hideModal()
          this.props.onPinSet?.(pin)
        } else {
          this.setState({ error: 'I PIN non corrispondono', step: 'new', tempPin: '' })
        }
        break
    }
  }

  changePin = () => {
    this.setState({ step: 'new', error: '', tempPin: '' })
  }

  removePin = async () => {
    await storage.remove(STORAGE_KEYS.PIN)
    this.setState({ currentPin: null })
    this.hideModal()
    this.props.onPinRemoved?.()
  }

  render () {
    const { theme } = this.context
    const { modalVisible, currentPin, step, error } = this.state

    const getStepTitle = (t) => {
      switch (step) {
        case 'verify': return t('settings.enterCurrentPin')
        case 'new': return currentPin ? t('settings.enterNewPin') : t('settings.setPin')
        case 'confirm': return t('settings.confirmPin')
        case 'action': return t('settings.whatToDo')
        default: return ''
      }
    }

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <View>
            <Button
              title={currentPin ? t('settings.changePin') : t('settings.setPin')}
              onPress={this.showModal}
              variant='outline'
              size='small'
            />

            <Modal
              animationType='fade'
              transparent
              visible={modalVisible}
              onRequestClose={this.hideModal}
              statusBarTranslucent
            >
              <TouchableWithoutFeedback onPress={this.hideModal}>
                <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
                  <TouchableWithoutFeedback>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                      <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                          {getStepTitle(t)}
                        </Text>
                      </View>

                      {step === 'action'
                        ? (
                          <View style={styles.actionButtons}>
                            <Button
                              title={t('settings.changePin')}
                              onPress={this.changePin}
                              variant='primary'
                              size='medium'
                              style={styles.actionButton}
                            />
                            <Button
                              title={t('settings.removePin')}
                              onPress={this.removePin}
                              variant='danger'
                              size='medium'
                              style={styles.actionButton}
                            />
                          </View>
                          )
                        : (
                          <PinInput
                            onPinComplete={this.handlePinComplete}
                            error={error}
                          />
                          )}

                      <View style={styles.footer}>
                        <Button
                          title={t('common.cancel')}
                          onPress={this.hideModal}
                          variant='secondary'
                          size='small'
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, padding: 20, minWidth: 320, maxWidth: 400, elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  actionButtons: { paddingVertical: 20, alignItems: 'center' },
  actionButton: { marginBottom: 12, minWidth: 200 },
  footer: { marginTop: 20, alignItems: 'center' }
})
