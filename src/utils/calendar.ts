import { Appointment } from '../types/booking';

/**
 * Generates a Google Calendar add event URL for the given appointment.
 */
export function generateGoogleCalendarUrl(appointment: Appointment): string {
  const { service, barbershop, dateString, time, professional, clientInfo } = appointment;

  // Combine YYYY-MM-DD and HH:mm
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

  const formatIsoForGCal = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const title = encodeURIComponent(`${service.name} - ${barbershop.name}`);
  const details = encodeURIComponent(
    `Agendamento em ${barbershop.name}\n` +
    `Serviço: ${service.name}\n` +
    `Profissional: ${professional.name}\n` +
    `Cliente: ${clientInfo.name}\n` +
    `Código: ${appointment.code}\n` +
    `Endereço: ${barbershop.address}`
  );
  const location = encodeURIComponent(`${barbershop.name}, ${barbershop.address}`);
  const dates = `${formatIsoForGCal(start)}/${formatIsoForGCal(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Generates an .ics file download for Apple/Outlook/Universal calendar apps.
 */
export function downloadIcsFile(appointment: Appointment): void {
  const { service, barbershop, dateString, time, professional, clientInfo } = appointment;

  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

  const formatDateToICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barbearia//Agendamento//PT',
    'BEGIN:VEVENT',
    `SUMMARY:${service.name} - ${barbershop.name}`,
    `DESCRIPTION:Agendamento em ${barbershop.name}\\nServiço: ${service.name}\\nProfissional: ${professional.name}\\nCliente: ${clientInfo.name}\\nCódigo: ${appointment.code}`,
    `LOCATION:${barbershop.address}`,
    `DTSTART:${formatDateToICS(start)}`,
    `DTEND:${formatDateToICS(end)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `agendamento_${appointment.code.replace('#', '')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formats a WhatsApp link with prefilled confirmation message.
 */
export function generateWhatsAppLink(appointment: Appointment): string {
  const { barbershop, service, formattedDate, time, professional, clientInfo, code } = appointment;
  const rawNumber = barbershop.whatsappNumber.replace(/\D/g, '');

  const text =
    `Olá ${barbershop.name}! 👋\n` +
    `Fiz um agendamento pelo site:\n\n` +
    `📌 *Código:* ${code}\n` +
    `💈 *Serviço:* ${service.name}\n` +
    `👤 *Profissional:* ${professional.name}\n` +
    `📅 *Data:* ${formattedDate}\n` +
    `⏰ *Horário:* ${time}\n` +
    `🙋‍♂️ *Cliente:* ${clientInfo.name} (${clientInfo.phone})\n\n` +
    `Poderia confirmar a reserva por favor? Obrigado!`;

  return `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`;
}
