import { Component } from 'react'
import { View, StyleSheet, SafeAreaView } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class Container extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { style, children, safe = true, ...props } = this.props

    const Wrapper = safe ? SafeAreaView : View

    return (
      <Wrapper style={[styles.container, { backgroundColor: theme.colors.background }, style]} {...props}>
        {children}
      </Wrapper>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 }
})
