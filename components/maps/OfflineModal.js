import { Component } from 'react'
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'

export default class OfflineModal extends Component {
  static contextType = ThemeContext

  renderDownloadingView = () => {
    const { theme } = this.context
    const { downloadProgress, downloadInfo } = this.props

    return (
      <View style={styles.downloadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text style={[styles.downloadText, { color: theme.colors.text }]}>
          Download in corso... {Math.round(downloadProgress)}%
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${downloadProgress}%`
              }
            ]}
          />
        </View>

        {downloadInfo && (
          <View style={styles.downloadDetails}>
            <Text style={[styles.downloadSubtext, { color: theme.colors.textSecondary }]}>
              {downloadInfo.downloaded}/{downloadInfo.total} tiles
            </Text>
            {downloadInfo.size > 0 && (
              <Text style={[styles.downloadSubtext, { color: theme.colors.textSecondary }]}>
                {Math.round(downloadInfo.size / 1024)}KB scaricati
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.abortButton, { backgroundColor: theme.colors.danger }]}
          onPress={this.props.onAbortDownload}
        >
          <Text style={[styles.abortButtonText, { color: '#FFFFFF' }]}>
            🛑 Annulla Download
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  renderInfoSection = () => {
    const { theme } = this.context
    const { cacheInfo, offlineRegions, isOnline } = this.props

    return (
      <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📊 Informazioni Cache
        </Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Dimensione
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {cacheInfo.formattedSize}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Regioni
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {offlineRegions.length}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Stato
            </Text>
            <Text style={[
              styles.infoValue,
              { color: isOnline ? theme.colors.success : theme.colors.danger }
            ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  renderRegionsSection = () => {
    const { theme } = this.context
    const { offlineRegions, onNavigateToRegion, onRenameRegion, onDeleteRegion } = this.props

    if (offlineRegions.length === 0) return null

    return (
      <View style={[styles.regionsSection, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🗺️ Regioni Scaricate
        </Text>
        <ScrollView style={styles.regionsList} showsVerticalScrollIndicator={false}>
          {offlineRegions.map(region => (
            <View
              key={region.id}
              style={[styles.regionItem, { borderBottomColor: theme.colors.separator }]}
            >
              <TouchableOpacity
                style={styles.regionInfo}
                onPress={() => onNavigateToRegion(region)}
              >
                <Text style={[styles.regionName, { color: theme.colors.text }]}>
                  {region.name}
                </Text>
                <Text style={[styles.regionDetails, { color: theme.colors.textSecondary }]}>
                  {new Date(region.downloadDate).toLocaleDateString()} • {region.actualSize ? Math.round(region.actualSize / 1024) + 'KB' : 'N/A'}
                  {region.status === 'partial' && ' (Parziale)'}
                </Text>
                {region.zoomLevels && (
                  <Text style={[styles.regionZoom, { color: theme.colors.textMuted }]}>
                    Zoom: {region.zoomLevels[0]}-{region.zoomLevels[1]} • {region.downloadedTiles || 0}/{region.tilesCount || 0} tiles
                  </Text>
                )}
                <Text style={[styles.tapHint, { color: theme.colors.primary }]}>
                  👆 Tocca per navigare
                </Text>
              </TouchableOpacity>
              <View style={styles.regionActions}>
                <TouchableOpacity
                  style={styles.regionActionButton}
                  onPress={() => onRenameRegion(region.id, region.name)}
                >
                  <Text style={[styles.regionActionText, { color: theme.colors.info }]}>
                    ✏️
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.regionActionButton}
                  onPress={() => onDeleteRegion(region.id)}
                >
                  <Text style={[styles.regionActionText, { color: theme.colors.danger }]}>
                    🗑️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }

  renderActionsSection = () => {
    const { theme } = this.context
    const { isOnline, cacheInfo, onStartDownload, onClearCache } = this.props

    return (
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.downloadNewButton,
            {
              backgroundColor: isOnline ? theme.colors.primary : theme.colors.border,
              opacity: isOnline ? 1 : 0.5
            }
          ]}
          onPress={onStartDownload}
          disabled={!isOnline}
        >
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
            📥 Scarica Area Attuale
          </Text>
        </TouchableOpacity>

        {cacheInfo.size > 0 && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.clearCacheButton,
              { borderColor: theme.colors.danger }
            ]}
            onPress={onClearCache}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.danger }]}>
              🗑️ Pulisci Tutta la Cache
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  renderNotesSection = () => {
    const { theme } = this.context
    const { isOnline } = this.props

    return (
      <View style={styles.notesSection}>
        <Text style={[styles.noteText, { color: theme.colors.textMuted }]}>
          💡 Le aree scaricate saranno disponibili anche senza connessione internet.
        </Text>
        {!isOnline && (
          <Text style={[styles.noteText, { color: theme.colors.warning }]}>
            ⚠️ Connessione necessaria per scaricare nuove aree.
          </Text>
        )}
      </View>
    )
  }

  renderOfflineContent = () => {
    return (
      <View style={styles.offlineContent}>
        {this.renderInfoSection()}
        {this.renderRegionsSection()}
        {this.renderActionsSection()}
        {this.renderNotesSection()}
      </View>
    )
  }

  render () {
    const { theme } = this.context
    const { visible, isDownloading, onHide } = this.props

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <Modal
            animationType='slide'
            transparent
            visible={visible}
            onRequestClose={() => !isDownloading && onHide()}
          >
            <TouchableWithoutFeedback onPress={() => !isDownloading && onHide()}>
              <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                        Gestione Offline
                      </Text>
                      {!isDownloading && (
                        <TouchableOpacity
                          onPress={onHide}
                          style={styles.closeButton}
                        >
                          <Text style={[styles.closeButtonText, { color: theme.colors.textMuted }]}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {isDownloading ? this.renderDownloadingView() : this.renderOfflineContent()}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0,
    maxHeight: '85%',
    elevation: 10,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600'
  },
  closeButton: {
    padding: 4
  },
  closeButtonText: {
    fontSize: 18
  },
  downloadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  downloadText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8
  },
  downloadSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center'
  },
  downloadDetails: {
    alignItems: 'center',
    marginTop: 8
  },
  abortButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  abortButtonText: {
    fontSize: 14,
    fontWeight: '500'
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 16
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },
  offlineContent: {
    paddingBottom: 20
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  infoItem: {
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600'
  },
  regionsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden'
  },
  regionsList: {
    maxHeight: 200
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  regionInfo: {
    flex: 1
  },
  regionName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2
  },
  regionDetails: {
    fontSize: 12,
    marginBottom: 2
  },
  regionZoom: {
    fontSize: 11,
    marginBottom: 4
  },
  tapHint: {
    fontSize: 10,
    fontStyle: 'italic'
  },
  regionActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  regionActionButton: {
    padding: 6,
    marginLeft: 4
  },
  regionActionText: {
    fontSize: 16
  },
  actionsSection: {
    paddingHorizontal: 16,
    gap: 12
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  downloadNewButton: {
    // backgroundColor handled in render
  },
  clearCacheButton: {
    borderWidth: 1,
    backgroundColor: 'transparent'
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500'
  },
  notesSection: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4
  }
})
