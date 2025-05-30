import * as FileSystem from 'expo-file-system'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { formatFileSize, calculateTilesCount, estimateDownloadSize, generateRegionName } from '../utils/helpers'

export class OfflineMapService {
  constructor () {
    this.cacheDir = `${FileSystem.documentDirectory}leaflet_cache/`
    this.maxCacheSize = 100 * 1024 * 1024 // 100MB
    this.cacheDuration = 7 * 24 * 60 * 60 * 1000 // 7 giorni
    this.downloadInProgress = false
    this.downloadAbortController = null
  }

  // Gestione regioni offline
  async loadOfflineRegions () {
    try {
      return await storage.get(STORAGE_KEYS.OFFLINE_REGIONS, [])
    } catch (error) {
      console.warn('Error loading offline regions:', error)
      return []
    }
  }

  async saveOfflineRegions (regions) {
    try {
      await storage.set(STORAGE_KEYS.OFFLINE_REGIONS, regions)
      return true
    } catch (error) {
      console.warn('Error saving offline regions:', error)
      return false
    }
  }

  async addOfflineRegion (regionData) {
    try {
      const regions = await this.loadOfflineRegions()
      const newRegion = {
        id: Date.now().toString(),
        name: generateRegionName(regionData.name),
        bounds: regionData.bounds,
        downloadDate: new Date().toISOString(),
        size: regionData.estimatedSize || 0,
        actualSize: regionData.actualSize || 0,
        zoomLevels: regionData.zoomLevels || [1, 18],
        tilesCount: regionData.tilesCount || 0,
        downloadedTiles: regionData.downloadedTiles || 0,
        status: regionData.status || 'completed',
        ...regionData
      }

      const updatedRegions = [...regions, newRegion]
      await this.saveOfflineRegions(updatedRegions)
      return newRegion
    } catch (error) {
      console.warn('Error adding offline region:', error)
      return null
    }
  }

  async deleteOfflineRegion (regionId) {
    try {
      const regions = await this.loadOfflineRegions()
      const region = regions.find(r => r.id === regionId)

      if (region) {
        // Elimina tiles fisiche della regione
        await this.deleteTilesForRegion(region)
      }

      const updatedRegions = regions.filter(r => r.id !== regionId)
      await this.saveOfflineRegions(updatedRegions)
      return true
    } catch (error) {
      console.warn('Error deleting offline region:', error)
      return false
    }
  }

  async updateOfflineRegion (regionId, updates) {
    try {
      const regions = await this.loadOfflineRegions()
      const updatedRegions = regions.map(region =>
        region.id === regionId ? { ...region, ...updates } : region
      )
      await this.saveOfflineRegions(updatedRegions)
      return true
    } catch (error) {
      console.warn('Error updating offline region:', error)
      return false
    }
  }

  // DOWNLOAD REALE DELLE TILES
  async downloadRegion (bounds, zoomLevels, onProgress, onComplete, onError) {
    if (this.downloadInProgress) {
      onError?.('Download già in corso')
      return false
    }

    this.downloadInProgress = true
    this.downloadAbortController = new AbortController()

    try {
      // Crea directory se non esiste
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true })

      // Calcola tutte le tiles da scaricare
      const tiles = this.calculateTileUrls(bounds, zoomLevels)
      console.log(`📥 Inizio download di ${tiles.length} tiles`)

      let downloadedCount = 0
      let totalSize = 0
      const batchSize = 5 // Download paralleli simultanei

      // Download a batch per non sovraccaricare
      for (let i = 0; i < tiles.length; i += batchSize) {
        if (this.downloadAbortController.signal.aborted) {
          throw new Error('Download annullato')
        }

        const batch = tiles.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map(tile => this.downloadSingleTile(tile))
        )

        // Processa risultati batch
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            downloadedCount++
            totalSize += result.value.size
          } else {
            console.warn('Tile download failed:', result.reason)
          }

          // Report progress
          const progress = Math.round((downloadedCount / tiles.length) * 100)
          onProgress?.({
            progress,
            downloadedCount,
            totalCount: tiles.length,
            downloadedSize: totalSize,
            currentTile: result.status === 'fulfilled' ? result.value.key : null
          })
        }

        // Pausa tra batch per non sovraccaricare
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Gestisci dimensione cache
      await this.manageCacheSize()

      const regionData = {
        bounds,
        zoomLevels,
        tilesCount: tiles.length,
        downloadedTiles: downloadedCount,
        actualSize: totalSize,
        estimatedSize: estimateDownloadSize(tiles.length),
        status: downloadedCount === tiles.length ? 'completed' : 'partial'
      }

      onComplete?.(regionData)
      this.downloadInProgress = false
      return true
    } catch (error) {
      console.error('Download error:', error)
      this.downloadInProgress = false
      onError?.(error.message)
      return false
    }
  }

  calculateTileUrls (bounds, zoomLevels) {
    const tiles = []

    for (let z = zoomLevels[0]; z <= zoomLevels[1]; z++) {
      const scale = Math.pow(2, z)

      // Converti bounds in tile coordinates
      const minTileX = Math.floor(((bounds.west + 180) / 360) * scale)
      const maxTileX = Math.floor(((bounds.east + 180) / 360) * scale)

      const minTileY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * scale)
      const maxTileY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * scale)

      for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
          const key = `${z}_${x}_${y}`
          tiles.push({
            z,
            x,
            y,
            key,
            baseUrl: `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
            seamarkUrl: `https://tiles.openseamap.org/seamark/${z}/${x}/${y}.png`,
            depthUrl: `https://tiles.openseamap.org/depth/${z}/${x}/${y}.png`,
            localPath: `${this.cacheDir}${key}`,
            localBasePath: `${this.cacheDir}${key}_base.png`,
            localSeamarkPath: `${this.cacheDir}${key}_seamark.png`,
            localDepthPath: `${this.cacheDir}${key}_depth.png`
          })
        }
      }
    }

    return tiles
  }

  async downloadSingleTile (tile) {
    try {
      // Controlla se la tile esiste già e non è scaduta
      if (await this.isTileCached(tile.key)) {
        return { key: tile.key, size: 0, cached: true }
      }

      let totalSize = 0

      // Download tile base (OpenStreetMap)
      try {
        const baseResult = await this.downloadTileLayer(tile.baseUrl, tile.localBasePath)
        totalSize += baseResult.size
      } catch (error) {
        console.warn(`Failed to download base tile ${tile.key}:`, error.message)
      }

      // Download seamark overlay
      try {
        const seamarkResult = await this.downloadTileLayer(tile.seamarkUrl, tile.localSeamarkPath)
        totalSize += seamarkResult.size
      } catch (error) {
        console.warn(`Failed to download seamark tile ${tile.key}:`, error.message)
      }

      // Download depth contours (opzionale)
      if (tile.z <= 16) { // Depth tiles disponibili solo fino a zoom 16
        try {
          const depthResult = await this.downloadTileLayer(tile.depthUrl, tile.localDepthPath)
          totalSize += depthResult.size
        } catch (error) {
          console.warn(`Failed to download depth tile ${tile.key}:`, error.message)
        }
      }

      // Salva metadata tile
      await this.saveTileMetadata(tile.key, {
        timestamp: Date.now(),
        size: totalSize,
        zoom: tile.z,
        x: tile.x,
        y: tile.y
      })

      return { key: tile.key, size: totalSize, cached: false }
    } catch (error) {
      throw new Error(`Failed to download tile ${tile.key}: ${error.message}`)
    }
  }

  async downloadTileLayer (url, localPath) {
    const response = await fetch(url, {
      signal: this.downloadAbortController?.signal,
      headers: {
        'User-Agent': 'MaritimeApp/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64Data = this.arrayBufferToBase64(arrayBuffer)

    await FileSystem.writeAsStringAsync(localPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64
    })

    return { size: arrayBuffer.byteLength }
  }

  arrayBufferToBase64 (buffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  async isTileCached (key) {
    try {
      const metadata = await this.getTileMetadata(key)
      if (!metadata) return false

      const now = Date.now()
      const isExpired = (now - metadata.timestamp) > this.cacheDuration

      if (isExpired) {
        await this.deleteTile(key)
        return false
      }

      // Verifica che i file esistano fisicamente
      const basePath = `${this.cacheDir}${key}_base.png`
      const baseExists = await FileSystem.getInfoAsync(basePath)

      return baseExists.exists
    } catch (error) {
      return false
    }
  }

  async getTileMetadata (key) {
    try {
      const cacheInfo = await storage.get(STORAGE_KEYS.TILE_CACHE_INFO, {})
      return cacheInfo[key] || null
    } catch (error) {
      return null
    }
  }

  async saveTileMetadata (key, metadata) {
    try {
      const cacheInfo = await storage.get(STORAGE_KEYS.TILE_CACHE_INFO, {})
      cacheInfo[key] = metadata
      await storage.set(STORAGE_KEYS.TILE_CACHE_INFO, cacheInfo)
    } catch (error) {
      console.warn('Error saving tile metadata:', error)
    }
  }

  async deleteTile (key) {
    try {
      const paths = [
        `${this.cacheDir}${key}_base.png`,
        `${this.cacheDir}${key}_seamark.png`,
        `${this.cacheDir}${key}_depth.png`
      ]

      await Promise.all(
        paths.map(path => FileSystem.deleteAsync(path, { idempotent: true }))
      )

      // Rimuovi metadata
      const cacheInfo = await storage.get(STORAGE_KEYS.TILE_CACHE_INFO, {})
      delete cacheInfo[key]
      await storage.set(STORAGE_KEYS.TILE_CACHE_INFO, cacheInfo)
    } catch (error) {
      console.warn(`Error deleting tile ${key}:`, error)
    }
  }

  async deleteTilesForRegion (region) {
    try {
      if (!region.bounds || !region.zoomLevels) return

      const tiles = this.calculateTileUrls(region.bounds, region.zoomLevels)
      await Promise.all(
        tiles.map(tile => this.deleteTile(tile.key))
      )
    } catch (error) {
      console.warn('Error deleting tiles for region:', error)
    }
  }

  // Abort download in corso
  abortDownload () {
    if (this.downloadAbortController) {
      this.downloadAbortController.abort()
      this.downloadInProgress = false
    }
  }

  // Gestione cache
  async calculateCacheSize () {
    try {
      const info = await FileSystem.getInfoAsync(this.cacheDir)

      if (info.exists) {
        const files = await FileSystem.readDirectoryAsync(this.cacheDir)
        let totalSize = 0

        // Calcola dimensione reale sommando tutti i file
        for (const file of files) {
          const filePath = `${this.cacheDir}${file}`
          const fileInfo = await FileSystem.getInfoAsync(filePath)
          if (fileInfo.exists) {
            totalSize += fileInfo.size || 0
          }
        }

        return totalSize
      }
      return 0
    } catch (error) {
      console.warn('Error calculating cache size:', error)
      return 0
    }
  }

  async getCacheInfo () {
    try {
      const cacheInfo = await storage.get(STORAGE_KEYS.TILE_CACHE_INFO, {})
      const cacheSize = await this.calculateCacheSize()

      return {
        size: cacheSize,
        formattedSize: formatFileSize(cacheSize),
        entries: Object.keys(cacheInfo).length,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.warn('Error getting cache info:', error)
      return {
        size: 0,
        formattedSize: '0B',
        entries: 0,
        lastUpdated: null
      }
    }
  }

  async clearCache () {
    try {
      // Abort download se in corso
      this.abortDownload()

      // Elimina directory cache
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true })

      // Reset storage
      await storage.set(STORAGE_KEYS.TILE_CACHE_INFO, {})
      await this.saveOfflineRegions([])

      return true
    } catch (error) {
      console.warn('Error clearing cache:', error)
      return false
    }
  }

  async manageCacheSize () {
    try {
      const currentSize = await this.calculateCacheSize()

      if (currentSize > this.maxCacheSize) {
        console.log(`🗑️ Cache size ${formatFileSize(currentSize)} exceeds limit, cleaning...`)

        const cacheInfo = await storage.get(STORAGE_KEYS.TILE_CACHE_INFO, {})
        const cacheEntries = Object.entries(cacheInfo)

        // Ordina per timestamp (più vecchie prime)
        cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp)

        const targetSize = this.maxCacheSize * 0.8
        let currentCacheSize = currentSize
        const tilesToDelete = []

        // Trova tiles da eliminare
        for (const [key, metadata] of cacheEntries) {
          if (currentCacheSize <= targetSize) break

          tilesToDelete.push(key)
          currentCacheSize -= (metadata.size || 15000)
        }

        // Elimina tiles
        await Promise.all(
          tilesToDelete.map(key => this.deleteTile(key))
        )

        console.log(`🧹 Cleaned ${tilesToDelete.length} tiles`)
        return true
      }
      return false
    } catch (error) {
      console.warn('Error managing cache size:', error)
      return false
    }
  }

  // Utilità per le regioni
  estimateRegionSize (bounds, zoomLevels) {
    const tilesCount = calculateTilesCount(bounds, zoomLevels)
    const estimatedSize = estimateDownloadSize(tilesCount)

    return {
      tilesCount,
      estimatedSize,
      formattedSize: formatFileSize(estimatedSize)
    }
  }

  validateRegion (regionData) {
    const required = ['bounds', 'name']
    const missing = required.filter(field => !regionData[field])

    if (missing.length > 0) {
      return { valid: false, missing }
    }

    const { bounds } = regionData
    if (!bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return { valid: false, error: 'Invalid bounds' }
    }

    return { valid: true }
  }

  // Metodi per comunicazione WebView
  createWebViewMessage (type, data = {}) {
    return JSON.stringify({ type, ...data })
  }

  parseWebViewMessage (messageString) {
    try {
      return JSON.parse(messageString)
    } catch (error) {
      console.warn('Error parsing WebView message:', error)
      return null
    }
  }

  // Metodo per ottenere URL tile locale per WebView
  getLocalTileUrl (z, x, y, layer = 'base') {
    const key = `${z}_${x}_${y}`
    const fileName = `${key}_${layer}.png`
    return `${this.cacheDir}${fileName}`
  }
}

// Istanza singleton
export const offlineMapService = new OfflineMapService()
