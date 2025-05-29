import React, { Component } from 'react'
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, TouchableWithoutFeedback, Alert, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ThemeContext } from '../../contexts/ThemeContext'
import { LanguageContext } from '../../contexts/LanguageContext'
import { storage, STORAGE_KEYS } from '../../utils/storage'
import Button from '../common/Button'

const BOAT_CATEGORIES = ['A', 'B', 'C']
const HULL_TYPES = ['v-shaped', 'flat', 'catamaran']

export default class BoatParameters extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      modalVisible: false,
      boatName: '',
      loa: '',
      beam: '',
      category: 'A',
      weight: '',
      height: '',
      hullType: 'v-shaped',
      vShapeAngle: '',
      isLoading: false,
      showCategoryModal: false,
      showHullTypeModal: false,
      boatImage: null
    }
  }

  async componentDidMount () {
    await this.loadBoatParameters()
  }

  loadBoatParameters = async () => {
    try {
      const savedParams = await storage.get(STORAGE_KEYS.BOAT_PARAMETERS, {})
      this.setState({
        boatName: savedParams.boatName || '',
        loa: savedParams.loa ? savedParams.loa.toString() : '',
        beam: savedParams.beam ? savedParams.beam.toString() : '',
        category: savedParams.category || 'A',
        weight: savedParams.weight ? savedParams.weight.toString() : '',
        height: savedParams.height ? savedParams.height.toString() : '',
        hullType: savedParams.hullType || 'v-shaped',
        vShapeAngle: savedParams.vShapeAngle ? savedParams.vShapeAngle.toString() : '',
        boatImage: savedParams.boatImage || null
      })
    } catch (error) {
      console.warn('Error loading boat parameters:', error)
    }
  }

  saveBoatParameters = async () => {
    this.setState({ isLoading: true })
    try {
      const params = {
        boatName: this.state.boatName,
        loa: this.state.loa ? parseFloat(this.state.loa) : null,
        beam: this.state.beam ? parseFloat(this.state.beam) : null,
        category: this.state.category,
        weight: this.state.weight ? parseFloat(this.state.weight) : null,
        height: this.state.height ? parseFloat(this.state.height) : null,
        hullType: this.state.hullType,
        vShapeAngle: this.state.hullType === 'v-shaped' && this.state.vShapeAngle ? parseFloat(this.state.vShapeAngle) : null,
        boatImage: this.state.boatImage
      }

      await storage.set(STORAGE_KEYS.BOAT_PARAMETERS, params)
      this.hideModal()
      this.props.onParametersSaved?.(params)
    } catch (error) {
      console.warn('Error saving boat parameters:', error)
      Alert.alert('Errore', 'Impossibile salvare i parametri')
    } finally {
      this.setState({ isLoading: false })
    }
  }

  showModal = () => {
    this.setState({ modalVisible: true })
  }

  hideModal = () => {
    this.setState({ modalVisible: false, showCategoryModal: false, showHullTypeModal: false })
  }

  selectCategory = (category) => {
    this.setState({ category, showCategoryModal: false })
  }

  selectHullType = (hullType) => {
    this.setState({ hullType, showHullTypeModal: false })
  }

  pickImage = async () => {
    Alert.alert(
      'Seleziona Foto',
      'Scegli da dove vuoi prendere la foto',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Fotocamera', onPress: this.openCamera },
        { text: 'Galleria', onPress: this.openGallery }
      ]
    )
  }

  openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Errore', 'Permesso fotocamera necessario')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8
    })

    if (!result.canceled) {
      this.setState({ boatImage: result.assets[0].uri })
    }
  }

  openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Errore', 'Permesso galleria necessario')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8
    })

    if (!result.canceled) {
      this.setState({ boatImage: result.assets[0].uri })
    }
  }

  removeImage = () => {
    this.setState({ boatImage: null })
  }

  renderCategoryModal = (t) => {
    const { theme } = this.context

    return (
      <Modal
        animationType='fade'
        transparent
        visible={this.state.showCategoryModal}
        onRequestClose={() => this.setState({ showCategoryModal: false })}
      >
        <TouchableWithoutFeedback onPress={() => this.setState({ showCategoryModal: false })}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.selectorModalContent, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>
                  {t('settings.selectCategory')}
                </Text>
                {BOAT_CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.selectorOption,
                      category === this.state.category && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                    onPress={() => this.selectCategory(category)}
                  >
                    <Text style={[
                      styles.selectorOptionText,
                      { color: category === this.state.category ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {t(`settings.category${category}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  renderHullTypeModal = (t) => {
    const { theme } = this.context

    return (
      <Modal
        animationType='fade'
        transparent
        visible={this.state.showHullTypeModal}
        onRequestClose={() => this.setState({ showHullTypeModal: false })}
      >
        <TouchableWithoutFeedback onPress={() => this.setState({ showHullTypeModal: false })}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.selectorModalContent, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>
                  {t('settings.selectHullType')}
                </Text>
                {HULL_TYPES.map(hullType => (
                  <TouchableOpacity
                    key={hullType}
                    style={[
                      styles.selectorOption,
                      hullType === this.state.hullType && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                    onPress={() => this.selectHullType(hullType)}
                  >
                    <Text style={[
                      styles.selectorOptionText,
                      { color: hullType === this.state.hullType ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {t(`settings.hullType${hullType.charAt(0).toUpperCase() + hullType.slice(1).replace('-', '')}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  render () {
    const { theme } = this.context

    return (
      <LanguageContext.Consumer>
        {({ t }) => (
          <View>
            <Button
              title={t('settings.editBoatParameters')}
              onPress={this.showModal}
              variant='outline'
              size='small'
            />

            <Modal
              animationType='slide'
              transparent
              visible={this.state.modalVisible}
              onRequestClose={this.hideModal}
              statusBarTranslucent
            >
              <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                      {t('settings.boatParameters')}
                    </Text>
                  </View>

                  <View style={styles.content}>
                    {/* Foto barca */}
                    <View style={styles.photoSection}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.boatPhoto')}</Text>
                      <View style={styles.photoContainer}>
                        {this.state.boatImage ? (
                          <View style={styles.imageWrapper}>
                            <Image source={{ uri: this.state.boatImage }} style={styles.boatImage} />
                            <TouchableOpacity style={[styles.removeImageButton, { backgroundColor: theme.colors.danger }]} onPress={this.removeImage}>
                              <Text style={styles.removeImageText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity style={[styles.photoPlaceholder, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={this.pickImage}>
                            <Text style={[styles.photoPlaceholderIcon, { color: theme.colors.textMuted }]}>📷</Text>
                            <Text style={[styles.photoPlaceholderText, { color: theme.colors.textMuted }]}>{t('settings.addPhoto')}</Text>
                          </TouchableOpacity>
                        )}
                        {this.state.boatImage && (
                          <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: theme.colors.primary }]} onPress={this.pickImage}>
                            <Text style={styles.changePhotoText}>{t('settings.changePhoto')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <View style={styles.formContainer}>
                      {/* Nome barca */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.boatName')}</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                          value={this.state.boatName}
                          onChangeText={boatName => this.setState({ boatName })}
                          placeholder={t('settings.boatNamePlaceholder')}
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>

                      {/* Row LOA e BEAM */}
                      <View style={styles.rowContainer}>
                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.loa')}</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                            value={this.state.loa}
                            onChangeText={loa => this.setState({ loa })}
                            placeholder='0.0'
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType='decimal-pad'
                          />
                        </View>
                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.beam')}</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                            value={this.state.beam}
                            onChangeText={beam => this.setState({ beam })}
                            placeholder='0.0'
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType='decimal-pad'
                          />
                        </View>
                      </View>

                      {/* Row Peso e Altezza */}
                      <View style={styles.rowContainer}>
                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.weight')}</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                            value={this.state.weight}
                            onChangeText={weight => this.setState({ weight })}
                            placeholder='0.0'
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType='decimal-pad'
                          />
                        </View>
                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.height')}</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                            value={this.state.height}
                            onChangeText={height => this.setState({ height })}
                            placeholder='0.0'
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType='decimal-pad'
                          />
                        </View>
                      </View>

                      {/* Row Categoria e Tipo carena */}
                      <View style={styles.rowContainer}>
                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.category')}</Text>
                          <TouchableOpacity
                            style={[styles.selector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                            onPress={() => this.setState({ showCategoryModal: true })}
                          >
                            <Text style={[styles.selectorText, { color: theme.colors.text }]}>
                              {t(`settings.category${this.state.category}`)}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.hullType')}</Text>
                          <TouchableOpacity
                            style={[styles.selector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                            onPress={() => this.setState({ showHullTypeModal: true })}
                          >
                            <Text style={[styles.selectorText, { color: theme.colors.text }]}>
                              {t(`settings.hullType${this.state.hullType.charAt(0).toUpperCase() + this.state.hullType.slice(1).replace('-', '')}`)}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Inclinazione V (solo se tipo carena è "a V") */}
                      {this.state.hullType === 'v-shaped' && (
                        <View style={styles.inputGroup}>
                          <Text style={[styles.label, { color: theme.colors.text }]}>{t('settings.vShapeAngle')}</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                            value={this.state.vShapeAngle}
                            onChangeText={vShapeAngle => this.setState({ vShapeAngle })}
                            placeholder='0.0'
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType='decimal-pad'
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Button
                      title={t('common.cancel')}
                      onPress={this.hideModal}
                      variant='secondary'
                      size='medium'
                      style={styles.footerButton}
                    />
                    <Button
                      title={t('common.save')}
                      onPress={this.saveBoatParameters}
                      variant='primary'
                      size='medium'
                      disabled={this.state.isLoading}
                      style={styles.footerButton}
                    />
                  </View>
                </View>
              </View>

              {this.renderCategoryModal(t)}
              {this.renderHullTypeModal(t)}
            </Modal>
          </View>
        )}
      </LanguageContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, width: '98%', height: '95%', elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingVertical: 10 },
  content: { flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10 },
  photoSection: { flex: 1, marginRight: 20 },
  formContainer: { flex: 2 },
  photoContainer: { alignItems: 'center' },
  photoPlaceholder: { width: 200, height: 150, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  photoPlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  photoPlaceholderText: { fontSize: 14, textAlign: 'center' },
  imageWrapper: { position: 'relative', marginBottom: 10 },
  boatImage: { width: 200, height: 150, borderRadius: 12 },
  removeImageButton: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  changePhotoButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  changePhotoText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  halfWidth: { flex: 1, marginHorizontal: 4 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  selector: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  selectorText: { fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  footerButton: { flex: 1, marginHorizontal: 8 },
  selectorModalContent: { borderRadius: 12, padding: 8, minWidth: 200, maxWidth: 300, elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  selectorTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  selectorOption: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 6 },
  selectorOptionText: { fontSize: 16, textAlign: 'center' }
})