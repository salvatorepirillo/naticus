import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { languageNames } from '../../locales'

export default class LanguageSelector extends Component {
  static contextType = ThemeContext

  state = {
    modalVisible: false
  }

  showModal = () => {
    this.setState({ modalVisible: true })
  }

  hideModal = () => {
    this.setState({ modalVisible: false })
  }

  selectLanguage = (langCode, changeLanguage) => {
    changeLanguage(langCode)
    this.hideModal()
  }

  render () {
    const { theme } = this.context

    return (
      <LanguageContext.Consumer>
        {(languageContext) => {
          const { currentLanguage, changeLanguage, availableLanguages } = languageContext

          return (
            <View>
              <TouchableOpacity
                style={[styles.selector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={this.showModal}
              >
                <Text style={[styles.selectedText, { color: theme.colors.text }]}>
                  {languageNames[currentLanguage]}
                </Text>
              </TouchableOpacity>

              <Modal
                animationType='fade'
                transparent
                visible={this.state.modalVisible}
                onRequestClose={this.hideModal}
                statusBarTranslucent
              >
                <ThemeContext.Provider value={this.context}>
                  <LanguageContext.Provider value={languageContext}>
                    <TouchableWithoutFeedback onPress={this.hideModal}>
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
                                  {languageNames[langCode]}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  </LanguageContext.Provider>
                </ThemeContext.Provider>
              </Modal>
            </View>
          )
        }}
      </LanguageContext.Consumer>
    )
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
