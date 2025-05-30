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

// Nuove funzioni per gestione file e dimensioni
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`
  return `${Math.round(bytes / (1024 * 1024 * 1024))}GB`
}

export const calculateTilesCount = (bounds, zoomLevels) => {
  let totalTiles = 0
  const latDiff = bounds.north - bounds.south
  const lngDiff = bounds.east - bounds.west

  for (let z = zoomLevels[0]; z <= zoomLevels[1]; z++) {
    const scale = Math.pow(2, z)
    const tilesX = Math.ceil(lngDiff * scale / 360)
    const tilesY = Math.ceil(latDiff * scale / 180)
    totalTiles += tilesX * tilesY
  }

  return totalTiles
}

export const estimateDownloadSize = (tilesCount, avgTileSize = 15000) => {
  return tilesCount * avgTileSize
}

export const generateRegionName = (customName) => {
  if (customName && customName.trim()) {
    return customName.trim()
  }
  return `Regione ${new Date().toLocaleDateString()}`
}

export const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export const createNotificationTimeout = (callback, delay = 3000) => {
  return setTimeout(callback, delay)
}
