export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined) return '--'
  return Number(value).toFixed(decimals)
}

export const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export const formatDate = (date = new Date()) => {
  return date.toLocaleDateString('it-IT')
}

export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

export const getStatusFromValue = (value, thresholds) => {
  if (value >= thresholds.danger) return 'danger'
  if (value >= thresholds.warning) return 'warning'
  return 'normal'
}
