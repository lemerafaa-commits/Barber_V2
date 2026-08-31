export interface DaySchedule {
  isOpen: boolean;
  openTime: string; // HH:mm, e.g. "09:00"
  closeTime: string; // HH:mm, e.g. "19:00"
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface BusinessAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface BusinessProfile {
  businessId?: string;
  name: string;
  description: string;
  logoUrl: string;
  whatsapp: string;
  instagram: string;
  address: BusinessAddress;
  openingHours: WeeklySchedule;
  updatedAt?: any;
}

export type MyBarbershopSection = 'hub' | 'identity' | 'contact' | 'location' | 'hours';
