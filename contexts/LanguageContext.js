import { Component, createContext } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { translations, languageNames } from '../locales'

const LanguageContext = createContext()

export class LanguageProvider extends Component {
  constructor (props) {
    super(props)
    this.state = { currentLanguage: 'en', translations: translations.en }
  }

  async componentDidMount () {
    try {
      const savedLanguage = await AsyncStorage.getItem('language')
      if (savedLanguage && translations[savedLanguage]) {
        this.setState({ currentLanguage: savedLanguage, translations: translations[savedLanguage] })
      }
    } catch (error) {
      console.warn('Error loading language:', error)
    }
  }

  changeLanguage = async (languageCode) => {
    if (translations[languageCode]) {
      try {
        await AsyncStorage.setItem('language', languageCode)
        this.setState({ currentLanguage: languageCode, translations: translations[languageCode] })
      } catch (error) {
        console.warn('Error saving language:', error)
      }
    }
  }

  t = (key, params = {}) => {
    const keys = key.split('.')
    let translation = this.state.translations

    for (const k of keys) {
      translation = translation?.[k]
    }

    if (typeof translation === 'string') {
      return Object.keys(params).reduce((str, param) => str.replace(`{{${param}}}`, params[param]), translation)
    }

    return key
  }

  render () {
    return (
      <LanguageContext.Provider value={{ currentLanguage: this.state.currentLanguage, changeLanguage: this.changeLanguage, t: this.t, availableLanguages: Object.keys(translations) }}>
        {this.props.children}
      </LanguageContext.Provider>
    )
  }
}

export { LanguageContext, languageNames }
