import React, { Component } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { ThemeContext } from '../contexts/ThemeContext'
import { LanguageContext } from '../contexts/LanguageContext'
import Container from '../components/common/Container'
import Header from '../components/common/Header'
import DashboardWidget from '../components/dashboard/DashboardWidget'

export default class Dashboard extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <Container>
            <Header title={t('dashboard.title')} subtitle={t('dashboard.welcome')} />
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
              <View style={styles.grid}>
                <DashboardWidget
                  title={t('widgets.speed')}
                  value='12.5'
                  unit={t('units.knots')}
                  type='speed'
                />
                <DashboardWidget
                  title={t('widgets.depth')}
                  value='8.2'
                  unit={t('units.meters')}
                  type='depth'
                />
                <DashboardWidget
                  title={t('widgets.wind')}
                  value='15'
                  unit={t('units.knots')}
                  subtitle='NE 45°'
                  type='wind'
                />
                <DashboardWidget
                  title={t('widgets.battery')}
                  value='87'
                  unit={t('units.percent')}
                  type='battery'
                />
                <DashboardWidget
                  title={t('widgets.fuel')}
                  value='245'
                  unit={t('units.liters')}
                  type='fuel'
                />
                <DashboardWidget
                  title={t('widgets.position')}
                  value='41.9028'
                  subtitle='12.4964'
                  unit={t('units.degrees')}
                  type='position'
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  }
})
