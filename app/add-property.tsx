import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase, uploadPropertyImage } from '@/app/lib/supabase';
import { showAlert } from '@/app/lib/alerts';
import { normalizeZimPhone } from '@/app/lib/utils';
import ConfirmModal from '@/app/components/ConfirmModal';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { colors, radius, shadow } from '@/app/lib/theme';
import { PROPERTY_TYPES, AMENITY_OPTIONS } from '@/app/lib/types';

export default function AddPropertyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscriberIdentifier, subscriberFirstName, subscriberLastName } = useSubscriber();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<string>(PROPERTY_TYPES[0]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [localImages, setLocalImages] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showNoPhotoConfirm, setShowNoPhotoConfirm] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');

  useEffect(() => {
    const name = [subscriberFirstName, subscriberLastName].filter(Boolean).join(' ');
    if (name) setContactName(name);
    if (subscriberIdentifier) {
      if (/\S+@\S+\.\S+/.test(subscriberIdentifier)) {
        setContactEmail(subscriberIdentifier);
      } else {
        setContactPhone(subscriberIdentifier);
        setContactWhatsapp(subscriberIdentifier);
      }
    }
  }, [subscriberIdentifier, subscriberFirstName, subscriberLastName]);

  const pickImages = async () => {
    const remaining = 11 - localImages.length;
    if (remaining <= 0) {
      showAlert('Limit reached', 'You can upload a maximum of 11 images.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please grant photo library access to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.uri.split('/').pop() || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setLocalImages((prev) => [...prev, ...newImages].slice(0, 11));
    }
  };

  const takePhoto = async () => {
    if (localImages.length >= 11) {
      showAlert('Limit reached', 'You can upload a maximum of 11 images.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setLocalImages((prev) => [
        ...prev,
        { uri: asset.uri, name: asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' },
      ].slice(0, 11));
    }
  };

  const removeImage = (index: number) => {
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      showAlert('Auth required', 'Please sign in to list a property.');
      return;
    }
    if (!title.trim()) return showAlert('Missing', 'Title is required.');
    if (!description.trim()) return showAlert('Missing', 'Description is required.');
    if (!price || isNaN(Number(price)) || Number(price) <= 0) return showAlert('Missing', 'Enter a valid price.');
    if (!location.trim()) return showAlert('Missing', 'Location is required.');
    if (localImages.length > 11) return showAlert('Too many', 'Maximum 11 images allowed.');

    if (localImages.length === 0) {
      setShowNoPhotoConfirm(true);
      return;
    }

    await submitProperty(localImages);
  };

  const submitProperty = async (imageList: { uri: string; name: string; type: string }[]) => {
    setUploading(true);
    setUploadProgress('Uploading images...');

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageList.length; i++) {
        setUploadProgress(`Uploading image ${i + 1} of ${imageList.length}...`);
        const url = await uploadPropertyImage(imageList[i]);
        if (url) uploadedUrls.push(url);
      }

      setUploadProgress('Saving property...');

      const phone = normalizeZimPhone(contactPhone);
      const accountIdentifier = user?.email || subscriberIdentifier || contactEmail.trim() || phone;

      const { error } = await supabase.from('properties').insert({
        title: title.trim(),
        description: description.trim(),
        property_type: propertyType,
        price: Number(price),
        location: location.trim(),
        bedrooms,
        bathrooms,
        amenities: selectedAmenities,
        images: uploadedUrls,
        email_number: accountIdentifier,
        contact_name: contactName.trim() || 'Owner',
        contact_phone: phone,
        contact_email: contactEmail.trim(),
        contact_whatsapp: contactWhatsapp.trim() || phone.replace(/\D/g, ''),
        views: 0,
        likes: 0,
        rating: 4.7,
      });

      if (error) throw error;

      showAlert('Success', 'Your property has been listed!', [
        { text: 'OK', onPress: () => router.replace('/landlord') },
      ]);
    } catch (err: any) {
      showAlert('Error', err.message || 'Something went wrong.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Add Property</Text>
      <View style={{ width: 36 }} />
    </View>
  );

  const renderField = (label: string, required = false) => (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}>*</Text>}
    </View>
  );

  const renderCounter = (value: number, onChange: (v: number) => void, min = 1, max = 20) => (
    <View style={styles.counterRow}>
      <TouchableOpacity
        style={[styles.counterBtn, value <= min && styles.counterBtnDisabled]}
        onPress={() => value > min && onChange(value - 1)}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={18} color={value <= min ? colors.lightGray : colors.primary} />
      </TouchableOpacity>
      <Text style={styles.counterVal}>{value}</Text>
      <TouchableOpacity
        style={[styles.counterBtn, value >= max && styles.counterBtnDisabled]}
        onPress={() => value < max && onChange(value + 1)}
        disabled={value >= max}
      >
        <Ionicons name="add" size={18} color={value >= max ? colors.lightGray : colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderField('Title', true)}
          <TextInput
            style={styles.input}
            placeholder="e.g. Modern 2-Bedroom Apartment"
            placeholderTextColor={colors.lightGray}
            value={title}
            onChangeText={setTitle}
          />

          {renderField('Description', true)}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your property..."
            placeholderTextColor={colors.lightGray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {renderField('Property Type', true)}
          <TouchableOpacity style={styles.picker} onPress={() => setShowTypePicker(!showTypePicker)}>
            <Text style={styles.pickerText}>{propertyType}</Text>
            <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gray} />
          </TouchableOpacity>
          {showTypePicker && (
            <View style={styles.pickerDropdown}>
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerOption, propertyType === type && styles.pickerOptionActive]}
                  onPress={() => { setPropertyType(type); setShowTypePicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, propertyType === type && styles.pickerOptionTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {renderField('Price / month (USD)', true)}
          <TextInput
            style={styles.input}
            placeholder="e.g. 500"
            placeholderTextColor={colors.lightGray}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          {renderField('Location', true)}
          <TextInput
            style={styles.input}
            placeholder="e.g. Harare, Zimbabwe"
            placeholderTextColor={colors.lightGray}
            value={location}
            onChangeText={setLocation}
          />

          {renderField('Bedrooms', true)}
          {renderCounter(bedrooms, setBedrooms)}

          {renderField('Bathrooms', true)}
          {renderCounter(bathrooms, setBathrooms)}

          {renderField('Amenities')}
          <View style={styles.amenitiesWrap}>
            {AMENITY_OPTIONS.map((amenity) => {
              const active = selectedAmenities.includes(amenity);
              return (
                <TouchableOpacity
                  key={amenity}
                  style={[styles.amenityChip, active && styles.amenityChipActive]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Ionicons name={active ? 'checkmark-circle' : 'add-circle-outline'} size={16} color={active ? colors.white : colors.primary} />
                  <Text style={[styles.amenityText, active && styles.amenityTextActive]}>{amenity}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {renderField('Photos')}
          <Text style={styles.hint}>Optional. Add up to 11 photos. First photo is the cover.</Text>
          <View style={styles.imageGrid}>
            {localImages.map((img, idx) => (
              <View key={idx} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                {idx === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(idx)}>
                  <Ionicons name="close-circle" size={22} color={colors.coral} />
                </TouchableOpacity>
              </View>
            ))}
            {localImages.length < 11 && (
              <View style={styles.addImageBtns}>
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                  <Ionicons name="images-outline" size={24} color={colors.primary} />
                  <Text style={styles.addImageText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addImageBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.addImageText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.imageCount}>{localImages.length}/11 images</Text>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Contact Information</Text>

          {renderField('Contact Name')}
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.lightGray}
            value={contactName}
            onChangeText={setContactName}
          />

          {renderField('Contact Phone')}
          <TextInput
            style={styles.input}
            placeholder="+263..."
            placeholderTextColor={colors.lightGray}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />

          {renderField('Contact Email')}
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor={colors.lightGray}
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {renderField('Contact WhatsApp')}
          <TextInput
            style={styles.input}
            placeholder="+263..."
            placeholderTextColor={colors.lightGray}
            value={contactWhatsapp}
            onChangeText={setContactWhatsapp}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <View style={styles.submitLoading}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.submitText}>{uploadProgress || 'Uploading...'}</Text>
              </View>
            ) : (
              <View style={styles.submitInner}>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
                <Text style={styles.submitText}>List Property</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={showNoPhotoConfirm}
        title="No Photos Added"
        message="You are about to submit your house without pictures. Do you want to continue?"
        confirmText="Yes, continue"
        cancelText="Cancel"
        destructive
        onConfirm={() => { setShowNoPhotoConfirm(false); submitProperty([]); }}
        onCancel={() => setShowNoPhotoConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.charcoal },
  required: { color: colors.coral, marginLeft: 4, fontSize: 14 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.charcoal },
  textArea: { height: 110, paddingTop: 12 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12 },
  pickerText: { fontSize: 15, color: colors.charcoal },
  pickerDropdown: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginTop: 4, overflow: 'hidden' },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pickerOptionActive: { backgroundColor: colors.seafoam },
  pickerOptionText: { fontSize: 14, color: colors.charcoal },
  pickerOptionTextActive: { color: colors.primary, fontWeight: '600' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  counterBtnDisabled: { backgroundColor: colors.bg },
  counterVal: { fontSize: 18, fontWeight: '700', color: colors.charcoal, minWidth: 30, textAlign: 'center' },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  amenityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  amenityText: { fontSize: 13, color: colors.charcoal, fontWeight: '500' },
  amenityTextActive: { color: colors.white },
  hint: { fontSize: 12, color: colors.gray, marginBottom: 8 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageWrap: { position: 'relative', width: 100, height: 100 },
  imageThumb: { width: 100, height: 100, borderRadius: radius.sm, backgroundColor: colors.seafoam },
  coverBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  removeImg: { position: 'absolute', top: -6, right: -6 },
  addImageBtns: { flexDirection: 'row', gap: 8 },
  addImageBtn: { width: 100, height: 100, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.white },
  addImageText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  imageCount: { fontSize: 12, color: colors.gray, marginTop: 6, textAlign: 'right' },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.charcoal, marginBottom: 4 },
  submitBtn: { marginTop: 24, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
