import { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'

export default class Header extends Component {
  static contextType = ThemeContext

  render () {
    const { theme } = this.context
    const { title, subtitle, rightComponent } = this.props

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        {rightComponent && <View style={styles.rightContainer}>{rightComponent}</View>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  titleContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { fontSize: 14, marginTop: 2 },
  rightContainer: { marginLeft: 16 }
})
