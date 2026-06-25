export const PROPERTY_TYPES = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'Apartment', label: 'Apartment', icon: 'business-outline' },
  { key: 'House', label: 'House', icon: 'home-outline' },
  { key: 'Office Space', label: 'Office', icon: 'briefcase-outline' },
  { key: 'Shop / Retail', label: 'Shop', icon: 'storefront-outline' },
  { key: 'Warehouse', label: 'Warehouse', icon: 'cube-outline' },
  { key: 'Student Accommodation', label: 'Student', icon: 'school-outline' },
  { key: 'Short letting', label: 'Short Let', icon: 'time-outline' },
];

export const AMENITIES = [
  { key: 'WiFi', icon: 'wifi-outline' },
  { key: 'Parking', icon: 'car-outline' },
  { key: 'Furnished', icon: 'cube-outline' },
  { key: 'Pool', icon: 'water-outline' },
  { key: 'Garden', icon: 'leaf-outline' },
  { key: 'Security', icon: 'shield-checkmark-outline' },
  { key: 'Borehole', icon: 'water-outline' },
  { key: 'Solar', icon: 'sunny-outline' },
  { key: 'Garage', icon: 'car-outline' },
  { key: 'Backup Power', icon: 'flash-outline' },
  { key: 'Pet Friendly', icon: 'paw-outline' },
  { key: 'Water Tank', icon: 'water-outline' },
];

export function amenityIcon(key: string): any {
  const found = AMENITIES.find((a) => a.key === key);
  return found ? found.icon : 'checkmark-circle-outline';
}
