import { Component } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { ThemeContext } from '../contexts/ThemeContext'
import { LanguageContext } from '../contexts/LanguageContext'
import Container from '../components/common/Container'
import Header from '../components/common/Header'
import SettingsRow from '../components/settings/SettingsRow'
import ThemeToggle from '../components/settings/ThemeToggle'
import LanguageSelector from '../components/settings/LanguageSelector'
import PinSetup from '../components/settings/PinSetup'
import BiometricAuth from '../components/settings/BiometricAuth'
import BoatParameters from '../components/settings/BoatParameters'

export default class Settings extends Component {
  static contextType = ThemeContext

  handleBiometricEnabled = () => {
  }

  handleBiometricDisabled = () => {
  }

  handleParametersSaved = (parameters) => {
  }

  render () {
    const { theme } = this.context

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <Container>
            <Header title={t('settings.title')} />
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
              {/* Sezione Personalizzazione */}
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

              {/* Sezione Parametri Barca */}
              <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <SettingsRow
                  title={t('settings.boatParameters')}
                  subtitle={t('settings.boatParametersDescription')}
                  component={
                    <BoatParameters
                      onParametersSaved={this.handleParametersSaved}
                    />
                  }
                />
              </View>

              {/* Sezione Sicurezza */}
              <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <SettingsRow
                  title={t('settings.security')}
                  subtitle={t('settings.securityDescription')}
                />

                <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />

                <SettingsRow
                  title={t('settings.pin')}
                  subtitle={t('settings.pinDescription')}
                  component={
                    <PinSetup
                      onPinSet={() => {}}
                      onPinRemoved={() => {}}
                    />
                  }
                />

                <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />

                <SettingsRow
                  title={t('settings.biometricAuth')}
                  subtitle={t('settings.biometricDescription')}
                  component={
                    <BiometricAuth
                      onBiometricEnabled={this.handleBiometricEnabled}
                      onBiometricDisabled={this.handleBiometricDisabled}
                    />
                  }
                />
              </View>

              {/* Sezione Informazioni */}
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
