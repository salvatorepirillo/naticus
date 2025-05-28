import { Component } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { ThemeContext } from '../contexts/ThemeContext'
import { LanguageContext } from '../contexts/LanguageContext'
import Container from '../components/common/Container'
import Header from '../components/common/Header'
import SettingsRow from '../components/settings/SettingsRow'
import ThemeToggle from '../components/settings/ThemeToggle'
import LanguageSelector from '../components/settings/LanguageSelector'

export default class Settings extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <Container>
            <Header title={t('settings.title')} />
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <SettingsRow
                  title={t('settings.language')}
                  component={<LanguageSelector />}
                />

                <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />

                <SettingsRow
                  title={t('settings.theme')}
                  component={<ThemeToggle />}
                />
              </View>

              <View style={[styles.section, styles.aboutSection, { backgroundColor: theme.colors.surface }]}>
                <SettingsRow
                  title={t('settings.about')}
                  subtitle={t('settings.version', { version: '1.0.0' })}
                />
              </View>
            </ScrollView>
          </Container>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  section: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden'
  },
  aboutSection: {
    marginTop: 20
  },
  separator: {
    height: 1,
    marginLeft: 16
  }
})
