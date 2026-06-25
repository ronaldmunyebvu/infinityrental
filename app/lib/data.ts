export const PROPERTY_TYPES = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'house', label: 'House', icon: 'home-outline' },
  { key: 'studio', label: 'Student', icon: 'bed-outline' },
  { key: 'apartment', label: 'Apartment', icon: 'business-outline' },
];

export const AMENITIES = [
  { key: 'WiFi', icon: 'wifi-outline' },
  { key: 'Parking', icon: 'car-outline' },
  { key: 'Furnished', icon: 'cube-outline' },
  { key: 'Pool', icon: 'water-outline' },
  { key: 'Garden', icon: 'leaf-outline' },
  { key: 'Security', icon: 'shield-checkmark-outline' },
];

export function amenityIcon(key: string): any {
  const found = AMENITIES.find((a) => a.key === key);
  return found ? found.icon : 'checkmark-circle-outline';
}

export type Property = {
  id: string;
  owner_id?: string;
  title: string;
  description?: string;
  type: string;
  price: number;
  location?: string;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  images: string[];
  amenities: string[];
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_whatsapp?: string;
  latitude?: number;
  longitude?: number;
  featured?: boolean;
};
