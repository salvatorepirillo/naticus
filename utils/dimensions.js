import { Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

export const screenDimensions = {
  width,
  height,
  isLandscape: width > height,
  isTablet: width >= 768
}

export const getResponsiveValue = (mobile, tablet) => {
  return screenDimensions.isTablet ? tablet : mobile
}

export const getGridColumns = () => {
  if (screenDimensions.width >= 1024) return 4
  if (screenDimensions.width >= 768) return 3
  return 2
}

export const getSpacing = () => {
  return screenDimensions.isTablet ? 24 : 16
}

export const getFontSize = (base) => {
  const scale = screenDimensions.isTablet ? 1.1 : 1
  return Math.round(base * scale)
}
