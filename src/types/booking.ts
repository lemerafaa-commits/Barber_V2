export interface Barbershop {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  instagramHandle: string;
  instagramUrl: string;
  whatsappNumber: string;
  whatsappUrl: string;
  logoUrl: string;
  coverUrl: string;
  rating: number;
  reviewCount: number;
  openingHoursText?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  priceOverride?: number; // Prepared for future individual option pricing
  durationOverride?: number; // Prepared for future individual option duration
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  iconName?: string;
  popular?: boolean;
  options: ServiceOption[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  popular?: boolean;
  iconName?: string;
  selectedOption?: string;
  categoryId?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  specialty?: string;
  bio?: string;
  isAvailable: boolean;
}

export interface TimeSlot {
  time: string; // e.g., "09:00"
  available: boolean;
  isOccupied: boolean;
  occupiedReason?: string;
}

export interface DayOption {
  dateString: string; // "YYYY-MM-DD"
  dayOfWeek: string; // "SEG", "TER", "QUA", etc.
  dayNumber: string; // "10", "11", etc.
  fullFormattedDate: string; // "Quinta-feira, 13 de agosto"
  isAvailable: boolean;
  isToday?: boolean;
}

export interface ClientInfo {
  name: string;
  phone: string;
}

export interface BookingState {
  services: Service[];
  service: Service | null;
  professional: Professional | null; // null or special "ANY" professional object
  isAnyProfessional: boolean;
  selectedDate: DayOption | null;
  selectedTime: string | null;
  clientInfo: ClientInfo;
}

export interface Appointment {
  id: string;
  code: string; // e.g. "#JB-7492"
  barbershop: Barbershop;
  services: Service[];
  service: Service;
  professional: Professional;
  dateString: string; // YYYY-MM-DD
  formattedDate: string; // "Quinta-feira, 13 de agosto"
  time: string; // "14:30"
  clientInfo: ClientInfo;
  totalPrice: number;
  durationMinutes: number;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
}

export type StepNumber = 1 | 2 | 3 | 4 | 5;
