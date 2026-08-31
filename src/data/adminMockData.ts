import { AdminAppointment } from '../types/admin';

// Generate ISO date strings dynamically relative to today
const now = new Date();

const getIsoDate = (offsetDays: number) => {
  const d = new Date(now);
  d.setDate(now.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getIsoDate(0);
const tomorrowStr = getIsoDate(1);
const dayAfterStr = getIsoDate(2);

export const MOCK_ADMIN_APPOINTMENTS: AdminAppointment[] = [
  // --- HOJE (today) ---
  {
    id: 'app-001',
    businessId: 'joao-barber',
    customerName: 'Joãozinho Silva',
    customerPhone: '(15) 98765-4321',
    date: todayStr,
    time: '09:00',
    services: [
      { category: 'Corte de cabelo', option: 'Tradicional', price: 40 },
      { category: 'Barba', option: 'Toalha quente', price: 25 },
    ],
    totalPrice: 65,
    duration: 50,
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'app-002',
    businessId: 'joao-barber',
    customerName: 'Carlos Souza',
    customerPhone: '(15) 97654-3210',
    date: todayStr,
    time: '10:00',
    services: [
      { category: 'Corte de cabelo', option: 'Degradê', price: 45 },
    ],
    totalPrice: 45,
    duration: 40,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'app-003',
    businessId: 'joao-barber',
    customerName: 'Marcos Vinícius',
    customerPhone: '(15) 96543-2109',
    date: todayStr,
    time: '11:30',
    services: [
      { category: 'Barba', option: 'Toalha quente', price: 30 },
    ],
    totalPrice: 30,
    duration: 30,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'app-004',
    businessId: 'joao-barber',
    customerName: 'Pedro Henrique',
    customerPhone: '(15) 95432-1098',
    date: todayStr,
    time: '13:00',
    services: [
      { category: 'Corte de cabelo', option: 'Militar', price: 40 },
    ],
    totalPrice: 40,
    duration: 30,
    status: 'cancelled',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'app-005',
    businessId: 'joao-barber',
    customerName: 'Lucas Ferreira',
    customerPhone: '(15) 94321-0987',
    date: todayStr,
    time: '14:30',
    services: [
      { category: 'Corte de cabelo', option: 'Degradê', price: 40 },
      { category: 'Barba', option: 'Desenhada', price: 25 },
    ],
    totalPrice: 65,
    duration: 50,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'app-006',
    businessId: 'joao-barber',
    customerName: 'Rafael Macedo',
    customerPhone: '(15) 93210-9876',
    date: todayStr,
    time: '16:00',
    services: [
      { category: 'Corte de cabelo', option: 'Social', price: 40 },
    ],
    totalPrice: 40,
    duration: 30,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'app-007',
    businessId: 'joao-barber',
    customerName: 'André Santos',
    customerPhone: '(15) 92109-8765',
    date: todayStr,
    time: '17:00',
    services: [
      { category: 'Barba', option: 'Tradicional', price: 25 },
    ],
    totalPrice: 25,
    duration: 25,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'app-008',
    businessId: 'joao-barber',
    customerName: 'Bruno Alencar',
    customerPhone: '(15) 91098-7654',
    date: todayStr,
    time: '18:00',
    services: [
      { category: 'Corte de cabelo', option: 'Disfarçado', price: 30 },
      { category: 'Barba', option: 'Tradicional', price: 20 },
    ],
    totalPrice: 50,
    duration: 45,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },

  // --- AMANHÃ (tomorrow) ---
  {
    id: 'app-101',
    businessId: 'joao-barber',
    customerName: 'Gabriel Lima',
    customerPhone: '(15) 98111-2233',
    date: tomorrowStr,
    time: '09:00',
    services: [
      { category: 'Corte de cabelo', option: 'Social', price: 40 },
    ],
    totalPrice: 40,
    duration: 30,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-102',
    businessId: 'joao-barber',
    customerName: 'Felipe Santos',
    customerPhone: '(15) 98222-3344',
    date: tomorrowStr,
    time: '10:30',
    services: [
      { category: 'Barba', option: 'Toalha quente', price: 30 },
    ],
    totalPrice: 30,
    duration: 30,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-103',
    businessId: 'joao-barber',
    customerName: 'Rodrigo Martins',
    customerPhone: '(15) 98333-4455',
    date: tomorrowStr,
    time: '14:00',
    services: [
      { category: 'Corte de cabelo', option: 'Degradê', price: 45 },
      { category: 'Barba', option: 'Desenhada', price: 25 },
    ],
    totalPrice: 70,
    duration: 50,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-104',
    businessId: 'joao-barber',
    customerName: 'Thiago Oliveira',
    customerPhone: '(15) 98444-5566',
    date: tomorrowStr,
    time: '16:30',
    services: [
      { category: 'Corte de cabelo', option: 'Navalhado', price: 45 },
    ],
    totalPrice: 45,
    duration: 35,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },

  // --- DEPOIS DE AMANHÃ ---
  {
    id: 'app-201',
    businessId: 'joao-barber',
    customerName: 'Matheus Ribeiro',
    customerPhone: '(15) 98555-6677',
    date: dayAfterStr,
    time: '11:00',
    services: [
      { category: 'Corte de cabelo', option: 'Degradê', price: 40 },
    ],
    totalPrice: 40,
    duration: 30,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-202',
    businessId: 'joao-barber',
    customerName: 'Leonardo Alves',
    customerPhone: '(15) 98666-7788',
    date: dayAfterStr,
    time: '15:00',
    services: [
      { category: 'Corte de cabelo', option: 'Tradicional', price: 40 },
      { category: 'Barba', option: 'Tradicional', price: 20 },
    ],
    totalPrice: 60,
    duration: 45,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

