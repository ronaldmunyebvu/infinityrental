import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase, uploadPropertyImage, deletePropertyImages } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { colors, radius, shadow } from '@/app/lib/theme';
import { PROPERTY_TYPES, AMENITY_OPTIONS, Property } from '@/app/lib/types';

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { subscriberIdentifier, subscriberFirstName, subscriberLastName } = useSubscriber();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<string>(PROPERTY_TYPES[0]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');

  const totalImages = existingImages.length + newImages.length;

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      loadProperty();
    }, [id])
  );

  const loadProperty = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
      if (error) throw error;
      if (!data) {
        Alert.alert('Not found', 'Property not found.');
        router.back();
        return;
      }
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPropertyType(data.property_type || PROPERTY_TYPES[0]);
      setPrice(String(data.price || ''));
      setLocation(data.location || '');
      setBedrooms(data.bedrooms || 1);
      setBathrooms(data.bathrooms || 1);
      setSelectedAmenities(data.amenities || []);
      setExistingImages(data.images || []);
      setContactName(data.contact_name || '');
      setContactPhone(data.contact_phone || '');
      setContactEmail(data.contact_email || '');
      setContactWhatsapp(data.contact_whatsapp || '');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load property.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const remaining = 11 - totalImages;
    if (remaining <= 0) {
      Alert.alert('Limit reached', 'Maximum 11 images allowed.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled) {
      const images = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.uri.split('/').pop() || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setNewImages((prev) => [...prev, ...images].slice(0, 11 - existingImages.length));
    }
  };

  const takePhoto = async () => {
    if (totalImages >= 11) {
      Alert.alert('Limit reached', 'Maximum 11 images allowed.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

    if (!result.canceled) {
      const asset = result.assets[0];
      setNewImages((prev) => [
        ...prev,
        { uri: asset.uri, name: asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' },
      ]);
    }
  };

  const removeExistingImage = (index: number) => {
    const removed = existingImages[index];
    setRemovedImages((prev) => [...prev, removed]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = async () => {
    if (!user || !id) return;
    if (!title.trim()) return Alert.alert('Missing', 'Title is required.');
    if (!description.trim()) return Alert.alert('Missing', 'Description is required.');
    if (!price || isNaN(Number(price)) || Number(price) <= 0) return Alert.alert('Missing', 'Enter a valid price.');
    if (!location.trim()) return Alert.alert('Missing', 'Location is required.');

    const finalTotal = existingImages.length + newImages.length;
    if (finalTotal < 3) return Alert.alert('Images required', 'At least 3 images are needed.');
    if (finalTotal > 11) return Alert.alert('Too many', 'Maximum 11 images allowed.');

    setUploading(true);
    setUploadProgress('Uploading new images...');

    try {
      // Delete removed images from storage
      if (removedImages.length > 0) {
        await deletePropertyImages(removedImages);
      }

      // Upload new images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < newImages.length; i++) {
        setUploadProgress(`Uploading image ${i + 1} of ${newImages.length}...`);
        const url = await uploadPropertyImage(newImages[i]);
        if (url) uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      setUploadProgress('Saving changes...');

      const { error } = await supabase.from('properties').update({
        title: title.trim(),
        description: description.trim(),
        property_type: propertyType,
        price: Number(price),
        location: location.trim(),
        bedrooms,
        bathrooms,
        amenities: selectedAmenities,
        images: finalImages,
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        contact_whatsapp: contactWhatsapp.trim(),
      }).eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'Property updated!', [
        { text: 'OK', onPress: () => router.replace('/landlord') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
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
      <Text style={styles.headerTitle}>Edit Property</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading property...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

          {renderField('Photos', true)}
          <Text style={styles.hint}>Minimum 3, maximum 11 photos. First photo is the cover.</Text>
          <View style={styles.imageGrid}>
            {existingImages.map((uri, idx) => (
              <View key={`existing-${idx}`} style={styles.imageWrap}>
                <Image source={{ uri }} style={styles.imageThumb} />
                {idx === 0 && newImages.length === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImg} onPress={() => removeExistingImage(idx)}>
                  <Ionicons name="close-circle" size={22} color={colors.coral} />
                </TouchableOpacity>
              </View>
            ))}
            {newImages.map((img, idx) => (
              <View key={`new-${idx}`} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                {existingImages.length === 0 && idx === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImg} onPress={() => removeNewImage(idx)}>
                  <Ionicons name="close-circle" size={22} color={colors.coral} />
                </TouchableOpacity>
              </View>
            ))}
            {totalImages < 11 && (
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
          <Text style={styles.imageCount}>{totalImages}/11 images</Text>

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
                <Text style={styles.submitText}>{uploadProgress || 'Saving...'}</Text>
              </View>
            ) : (
              <View style={styles.submitInner}>
                <Ionicons name="save-outline" size={20} color={colors.white} />
                <Text style={styles.submitText}>Save Changes</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.gray },
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
