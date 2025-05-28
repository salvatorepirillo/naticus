import { Component, createContext } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightTheme, darkTheme } from '../themes'

const ThemeContext = createContext()

export class ThemeProvider extends Component {
  constructor (props) {
    super(props)
    this.state = { theme: lightTheme, isDark: false }
  }

  async componentDidMount () {
    try {
      const savedTheme = await AsyncStorage.getItem('theme')
      if (savedTheme) {
        const isDark = savedTheme === 'dark'
        this.setState({ theme: isDark ? darkTheme : lightTheme, isDark })
      }
    } catch (error) {
      console.warn('Error loading theme:', error)
    }
  }

  toggleTheme = async () => {
    const newIsDark = !this.state.isDark
    const newTheme = newIsDark ? darkTheme : lightTheme

    try {
      await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light')
      this.setState({ theme: newTheme, isDark: newIsDark })
    } catch (error) {
      console.warn('Error saving theme:', error)
    }
  }

  render () {
    return (
      <ThemeContext.Provider value={{ theme: this.state.theme, isDark: this.state.isDark, toggleTheme: this.toggleTheme }}>
        {this.props.children}
      </ThemeContext.Provider>
    )
  }
}

export { ThemeContext }
