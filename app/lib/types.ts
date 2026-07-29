export interface Property {
  id: string;
  user_id: string;
  created_at?: string;
  title: string;
  description: string;
  property_type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  featured?: boolean;
  density?: string;
  area?: number;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_whatsapp?: string;
  owner_email?: string;
  views?: number;
  likes?: number;
  rating?: number;
}

export interface Ad {
  id: string;
  is_active: boolean;
  title: string;
  description: string;
  cta_text?: string;
  gradient_from?: string;
  gradient_to?: string;
}

export const PROPERTY_TYPES: string[] = [
  'Apartment',
  'House',
  'Office Space',
  'Shop / Retail',
  'Warehouse',
  'Student Accommodation',
  'Short letting',
];

export const DENSITY_TYPES: string[] = [
  'Low Density',
  'Medium Density',
  'High Density',
];

export const AMENITY_OPTIONS: string[] = [
  'WiFi',
  'Parking',
  'Furnished',
  'Pool',
  'Garden',
  'Security',
  'Borehole',
  'Solar',
  'Garage',
  'Backup Power',
  'Pet Friendly',
  'Water Tank',
];

export const HERO_IMAGE: string =
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287526231_fe633117.png';
