import { Component } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { createNotificationTimeout } from '../../utils/helpers'

export default class Notification extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.fadeAnim = new Animated.Value(0)
    this.slideAnim = new Animated.Value(-100)
    this.timeoutId = null
  }

  componentDidMount () {
    if (this.props.visible) {
      this.showNotification()
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.showNotification()
    } else if (!this.props.visible && prevProps.visible) {
      this.hideNotification()
    }
  }

  componentWillUnmount () {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
  }

  showNotification = () => {
    // Cancella timeout precedente se esiste
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    // Animazione di entrata
    Animated.parallel([
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.spring(this.slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true
      })
    ]).start()

    // Auto-hide dopo il delay specificato
    const duration = this.props.duration || 3000
    this.timeoutId = createNotificationTimeout(() => {
      if (this.props.onHide) {
        this.props.onHide()
      }
    }, duration)
  }

  hideNotification = () => {
    Animated.parallel([
      Animated.timing(this.fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(this.slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      })
    ]).start()
  }

  getNotificationColor = () => {
    const { theme } = this.context
    const { type } = this.props

    switch (type) {
      case 'success': return theme.colors.success
      case 'warning': return theme.colors.warning
      case 'error':
      case 'danger': return theme.colors.danger
      case 'info': return theme.colors.info
      default: return theme.colors.primary
    }
  }

  getNotificationIcon = () => {
    const { type } = this.props

    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error':
      case 'danger': return '❌'
      case 'info': return 'ℹ️'
      default: return '📱'
    }
  }

  render () {
    const { visible, message } = this.props

    if (!visible) return null

    return (
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: this.getNotificationColor(),
            opacity: this.fadeAnim,
            transform: [{ translateY: this.slideAnim }]
          }
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>
            {this.getNotificationIcon()}
          </Text>
          <Text style={[styles.message, { color: '#FFFFFF' }]}>
            {message}
          </Text>
        </View>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  icon: {
    fontSize: 16,
    marginRight: 10
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18
  }
})
