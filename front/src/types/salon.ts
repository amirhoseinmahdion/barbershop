export type SalonAudience = "MEN" | "WOMEN" | "UNISEX";

export interface Salon {
  id: string;
  slug: string;
  name: string;
  description: string;
  audience: SalonAudience;
  streetAddress: string;
  city: string;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  phone: string | null;
  email: string | null;
  timezone: string;
  isActive: boolean;
  admins?: Array<{
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface SalonService {
  id: string;
  salonId: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  isActive: boolean;
}
