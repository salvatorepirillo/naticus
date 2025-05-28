import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'

export default class ThemeToggle extends Component {
  static contextType = ThemeContext

  render () {
    const { theme, isDark, toggleTheme } = this.context

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={toggleTheme}
          >
            <View style={[
              styles.switch,
              { backgroundColor: isDark ? theme.colors.primary : theme.colors.border }
            ]}
            >
              <View style={[
                styles.thumb,
                { backgroundColor: theme.colors.background },
                isDark ? styles.thumbActive : styles.thumbInactive
              ]}
              />
            </View>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {isDark ? t('settings.darkTheme') : t('settings.lightTheme')}
            </Text>
          </TouchableOpacity>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    marginRight: 8
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2
  },
  thumbInactive: {
    marginLeft: 2
  },
  thumbActive: {
    marginLeft: 22
  },
  label: {
    fontSize: 14,
    fontWeight: '500'
  }
})
