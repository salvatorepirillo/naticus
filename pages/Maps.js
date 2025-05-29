import { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemeContext } from '../contexts/ThemeContext'
import { LanguageContext } from '../contexts/LanguageContext'
import Container from '../components/common/Container'
import Header from '../components/common/Header'
import MaritimeMap from '../components/maps/MaritimeMap'

export default class Maps extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <Container>
            <Header
              title={t('maps.title')}
              subtitle={t('maps.subtitle')}
            />
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
              <MaritimeMap />
            </View>
          </Container>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
