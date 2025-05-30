// utils/storage.js - Aggiornato con nuove chiavi
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  USER_SETTINGS: 'userSettings',
  PIN: 'pin',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BOAT_PARAMETERS: 'boat_parameters',
  OFFLINE_REGIONS: 'offline_regions',
  OFFLINE_MODE: 'offline_mode',
  MAP_CACHE_SIZE: 'map_cache_size',
  TILE_CACHE_INFO: 'tile_cache_info',
  FAVORITES_STORAGE_KEY: 'weather_favorite_locations' // Aggiunta chiave mancante che punta alla stessa chiave
}

export const storage = {
  async set (key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      await AsyncStorage.setItem(key, stringValue)
    } catch (error) {
      console.warn(`Error saving ${key}:`, error)
    }
  },

  async get (key, defaultValue = null) {
    try {
      const value = await AsyncStorage.getItem(key)
      if (value === null) return defaultValue

      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      console.warn(`Error loading ${key}:`, error)
      return defaultValue
    }
  },

  async remove (key) {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing ${key}:`, error)
    }
  },

  async clear () {
    try {
      await AsyncStorage.clear()
    } catch (error) {
      console.warn('Error clearing storage:', error)
    }
  }
}

export { STORAGE_KEYS }
