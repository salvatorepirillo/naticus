import { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { languageNames } from '../../locales'

export default class LanguageSelector extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = { modalVisible: false }
  }

  handleShowModal = () => {
    try {
      this.setState({ modalVisible: true })
    } catch (error) {
      console.error('LanguageSelector: Error opening modal:', error)
      Alert.alert('Errore', `Errore apertura modal: ${error.message}`)
    }
  }

  handleHideModal = () => {
    try {
      this.setState({ modalVisible: false })
    } catch (error) {
      console.error('LanguageSelector: Error closing modal:', error)
    }
  }

  selectLanguage = (langCode, changeLanguage) => {
    try {
      changeLanguage(langCode)
      this.handleHideModal()
    } catch (error) {
      console.error('LanguageSelector: Error selecting language:', error)
      Alert.alert('Errore', `Errore selezione lingua: ${error.message}`)
    }
  }

  render () {
    try {
      const { theme } = this.context

      if (!theme) {
        console.error('LanguageSelector: No theme context')
        return <Text>Errore: Tema non disponibile</Text>
      }

      return (
        <LanguageContext.Consumer>
          {(languageContext) => {
            try {
              if (!languageContext) {
                console.error('LanguageSelector: No language context')
                return <Text>Errore: Contesto lingua non disponibile</Text>
              }

              const { currentLanguage, changeLanguage, availableLanguages } = languageContext

              if (!currentLanguage || !availableLanguages) {
                console.error('LanguageSelector: Missing language data')
                return <Text>Errore: Dati lingua mancanti</Text>
              }

              return (
                <View>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                    onPress={this.handleShowModal}
                  >
                    <Text style={[styles.selectedText, { color: theme.colors.text }]}>
                      {languageNames[currentLanguage] || currentLanguage}
                    </Text>
                  </TouchableOpacity>

                  <Modal
                    animationType='fade'
                    transparent
                    visible={this.state.modalVisible}
                    onRequestClose={this.handleHideModal}
                  >
                    <TouchableWithoutFeedback onPress={this.handleHideModal}>
                      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
                        <TouchableWithoutFeedback>
                          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                            {availableLanguages.map(langCode => (
                              <TouchableOpacity
                                key={langCode}
                                style={[
                                  styles.languageOption,
                                  langCode === currentLanguage && { backgroundColor: theme.colors.primary + '20' }
                                ]}
                                onPress={() => this.selectLanguage(langCode, changeLanguage)}
                                activeOpacity={0.7}
                              >
                                <Text style={[
                                  styles.languageText,
                                  { color: langCode === currentLanguage ? theme.colors.primary : theme.colors.text }
                                ]}
                                >
                                  {languageNames[langCode] || langCode}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </View>
              )
            } catch (error) {
              console.error('LanguageSelector: Error in Consumer render:', error)
              return <Text>Errore rendering: {error.message}</Text>
            }
          }}
        </LanguageContext.Consumer>
      )
    } catch (error) {
      console.error('LanguageSelector: Error in render:', error)
      return <Text>Errore generale: {error.message}</Text>
    }
  }
}

const styles = StyleSheet.create({
  selector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 100
  },
  selectedText: {
    fontSize: 16,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    maxWidth: 300,
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6
  },
  languageText: {
    fontSize: 16,
    textAlign: 'center'
  }
})
