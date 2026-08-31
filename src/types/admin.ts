export type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type ServiceCategoryId = 'cabelo' | 'barba' | 'combo' | string;

export interface ServiceCategoryDefinition {
  id: ServiceCategoryId;
  name: string;
  description?: string;
  iconName?: string;
}

export interface AdminService {
  id: string;
  businessId: string;
  name: string;
  categoryId: ServiceCategoryId;
  categoryName?: string;
  description?: string;
  price: number; // Stored as number e.g. 45.00
  durationMinutes: number; // Stored as number in minutes e.g. 40
  active: boolean; // Active/Inactive toggle
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminServiceItem {
  category: string;
  option?: string;
  price: number;
}

export interface AdminAppointment {
  id: string;
  businessId?: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  services: AdminServiceItem[];
  totalPrice: number;
  duration: number; // minutes
  status: AppointmentStatus;
  createdAt: string;
}

