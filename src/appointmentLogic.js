import { getSlotEndTime } from './calendarLogic.js';

const text = value => typeof value === 'string' ? value.trim() : '';

export function getAppointmentId(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error('Kies een geldige datum en tijd.');
  }
  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error('Kies een geldige datum.');
  }
  return `${date}_${time.replace(':', '')}`;
}

export const isSameSlot = (a, b) => a.date === b.date && a.time === b.time;

// Keep the original question labels and all selected answers with the booking,
// even when the website's questions are edited later.
export function contactAppointmentDetails(formData, questions) {
  return {
    name: text(formData.get('name')),
    email: text(formData.get('email')),
    phone: text(formData.get('phone')),
    message: text(formData.get('message')),
    answers: questions.filter(question => question?.question).map(question => ({
      questionId: question.id,
      question: question.question,
      type: question.type || 'text',
      values: formData.getAll(question.type === 'checkbox' ? `${question.id}[]` : question.id).map(text).filter(Boolean),
    })),
    notes: '',
    dossierId: '',
    source: 'website',
  };
}

export function publicBookingMarker(appointment) {
  return {
    date: appointment.date,
    time: appointment.time,
    ...(appointment.endTime ? { endTime: appointment.endTime } : {}),
    bookingId: appointment.bookingId || getAppointmentId(appointment.date, appointment.time),
  };
}

export function manualAppointmentDetails(input, previous = {}) {
  getAppointmentId(input.date, input.time);
  const endTime = input.endTime || previous.endTime;
  if (endTime && !getSlotEndTime({ time: input.time, endTime })) {
    throw new Error('Kies een eindtijd na de begintijd, op dezelfde dag.');
  }
  const details = {
    ...previous,
    date: input.date,
    time: input.time,
    ...(endTime ? { endTime } : {}),
    name: text(input.name),
    email: text(input.email),
    phone: text(input.phone),
    notes: text(input.notes),
    dossierId: text(input.dossierId),
    message: previous.message || '',
    answers: previous.answers || [],
    source: previous.source || 'admin',
  };
  if (!details.name && !details.notes && !details.dossierId) {
    throw new Error('Vul een naam of extra informatie in, of koppel een dossier.');
  }
  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    throw new Error('Vul een geldig e-mailadres in.');
  }
  return details;
}

export function replaceBookingMarker(bookedSlots, marker, expectedBookingId) {
  const existing = bookedSlots.find(slot => isSameSlot(slot, marker));
  const existingId = existing && (existing.bookingId || getAppointmentId(existing.date, existing.time));
  if (existing && existingId !== expectedBookingId) {
    throw new Error('Dit tijdslot is intussen geboekt. Sluit de invoer en bekijk eerst de afspraak.');
  }
  if (!existing && expectedBookingId) {
    throw new Error('Deze afspraak bestaat niet meer. Selecteer het tijdslot opnieuw.');
  }
  return [...bookedSlots.filter(slot => !isSameSlot(slot, marker)), marker];
}
