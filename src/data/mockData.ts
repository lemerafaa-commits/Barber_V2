import { Barbershop, ServiceCategory, Service, Professional } from '../types/booking';

export const MOCK_BARBERSHOP: Barbershop = {
  id: 'joao-barber-pocos',
  name: 'Barbearia',
  tagline: 'Estilo, precisão e cuidado em cada corte.',
  description: 'Barbearia premium com ambiente climatizado, cerveja gelada e profissionais certificados.',
  address: 'Rua São José, 142 - Centro',
  city: 'Poços de Caldas',
  state: 'MG',
  instagramHandle: '@joaobarber.pocos',
  instagramUrl: 'https://instagram.com',
  whatsappNumber: '5535999887766',
  whatsappUrl: 'https://wa.me/5535999887766',
  logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
  rating: 4.9,
  reviewCount: 342,
};

export const MOCK_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'corte-masculino',
    name: 'Corte de Cabelo Masculino',
    description: 'Escolha o estilo do seu corte.',
    durationMinutes: 40,
    price: 45.00,
    iconName: 'Scissors',
    popular: false,
    options: [
      { id: 'tradicional', name: 'Tradicional' },
      { id: 'degrade', name: 'Degradê' },
      { id: 'disfarcado', name: 'Disfarçado' },
      { id: 'militar', name: 'Militar' },
      { id: 'social', name: 'Social' },
    ],
  },
  {
    id: 'barba',
    name: 'Barba',
    description: 'Escolha o estilo da barba.',
    durationMinutes: 25,
    price: 30.00,
    iconName: 'Razor',
    popular: false,
    options: [
      { id: 'tradicional', name: 'Tradicional' },
      { id: 'desenhada', name: 'Desenhada' },
      { id: 'completa', name: 'Completa' },
      { id: 'toalha-quente', name: 'Toalha quente' },
    ],
  },
  {
    id: 'corte-barba',
    name: 'Corte + Barba',
    description: 'Escolha o estilo do combo.',
    durationMinutes: 60,
    price: 65.00,
    iconName: 'Sparkles',
    popular: true,
    options: [
      { id: 'tradicional', name: 'Tradicional' },
      { id: 'degrade', name: 'Degradê' },
      { id: 'social', name: 'Social' },
    ],
  },
];

export const MOCK_SERVICES: Service[] = MOCK_SERVICE_CATEGORIES.map((cat) => ({
  id: cat.id,
  categoryId: cat.id,
  name: cat.name,
  price: cat.price,
  durationMinutes: cat.durationMinutes,
  description: cat.description,
  popular: cat.popular,
  iconName: cat.iconName,
  selectedOption: cat.options[0]?.name,
}));

export const ANY_PROFESSIONAL_ID = 'any-professional';

export const SPECIAL_ANY_PROFESSIONAL: Professional = {
  id: ANY_PROFESSIONAL_ID,
  name: 'Qualquer profissional',
  role: 'Primeiro disponível',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  specialty: 'Agendamento mais rápido no horário escolhido',
  bio: 'Selecione esta opção para ver todos os horários e ser atendido pelo primeiro barbeiro vago.',
  isAvailable: true,
};

export const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: 'joao',
    name: 'João',
    role: 'Barbeiro Líder',
    avatarUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80',
    specialty: 'Especialista em degradê e barba com toalha quente',
    bio: 'Mais de 10 anos de experiência em visagismo masculino e técnicas tradicionais.',
    isAvailable: true,
  },
  {
    id: 'carlos',
    name: 'Carlos',
    role: 'Barbeiro',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    specialty: 'Especialista em cortes clássicos e na tesoura',
    bio: 'Mestre na tesoura e cortes executivos com acabamento impecável.',
    isAvailable: true,
  },
  {
    id: 'marcos',
    name: 'Marcos',
    role: 'Barbeiro Stylist',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    specialty: 'Especialista em visagismo, platinados e sobrancelha',
    bio: 'Especialista em tendências modernas, freestyle e texturizações.',
    isAvailable: true,
  },
];

/**
 * Base time slots generated for a barbershop working day (09:00 to 19:00).
 */
export const BASE_DAY_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '17:30', '18:00', '18:30'
];
