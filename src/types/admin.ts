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
  professionalId?: string; // Futura relação com o barbeiro
  professionalName?: string; // Snapshot histórico do nome do profissional
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

export type BarberStatus = 'active' | 'inactive';
export type BarberServiceMode = 'all' | 'custom';
export type ServiceDurationMode = 'default' | 'custom';

export interface BarberServiceConfig {
  serviceId: string;
  serviceName?: string;
  durationMode: ServiceDurationMode;
  customDurationMinutes?: number | null;
}

export interface ScheduleBreak {
  id?: string;
  startTime: string; // '12:00'
  endTime: string; // '13:00'
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  dayName: string; // 'Segunda', 'Terça', etc.
  isDayOff: boolean;
  startTime: string; // '08:00'
  endTime: string; // '18:00'
  breakStartTime?: string; // '12:00' (retrocompatibilidade)
  breakEndTime?: string; // '13:00' (retrocompatibilidade)
  breaks?: ScheduleBreak[]; // Lista de múltiplos intervalos
}

export interface Barber {
  id: string;
  businessId: string;
  name: string;
  photoUrl: string;
  whatsapp: string;
  email?: string;
  status: BarberStatus;
  active?: boolean; // Indicador booleano derivado (status === 'active')
  serviceMode: BarberServiceMode;
  serviceIds: string[]; // Vazio se 'all', ou lista de IDs se 'custom'
  serviceConfigs?: BarberServiceConfig[]; // Configurações individuais de duração por serviço
  schedule: DaySchedule[];
  createdAt: string;
  updatedAt?: string;
}

export type Professional = Barber;

