import { Component } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext'
import { LanguageProvider, LanguageContext } from './contexts/LanguageContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { Dashboard, Maps, Settings } from './pages'
import { Text } from 'react-native'

const Tab = createBottomTabNavigator()

class AppContent extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.border, height: 60, paddingBottom: 8, paddingTop: 8 },
                tabBarActiveTintColor: theme.colors.tabBarActive,
                tabBarInactiveTintColor: theme.colors.tabBarInactive,
                tabBarLabelStyle: { fontSize: 12, fontWeight: '500' }
              }}
            >
              <Tab.Screen name='Dashboard' component={Dashboard} options={{ tabBarLabel: t('navigation.dashboard'), tabBarIcon: () => <Text>📊</Text> }} />
              <Tab.Screen name='Maps' component={Maps} options={{ tabBarLabel: t('navigation.maps'), tabBarIcon: () => <Text>🗺️</Text> }} />
              <Tab.Screen name='Settings' component={Settings} options={{ tabBarLabel: t('navigation.settings'), tabBarIcon: () => <Text>⚙️</Text> }} />
            </Tab.Navigator>
          </NavigationContainer>
        )}
      </LanguageContext.Consumer>
    )
  }
}

export default class App extends Component {
  render () {
    return (
      <LoadingProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </LanguageProvider>
      </LoadingProvider>
    )
  }
}
