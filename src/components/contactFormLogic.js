import { getSlotEndTime, slotsOverlap } from '../calendarLogic.js';

export const cleanValue = value => typeof value === 'string' ? value.trim() : '';

export function otherQuestionFor(question, questions) {
  return questions.find(candidate => candidate?.id === `${question.id}_other` && candidate.question);
}

export function isOtherQuestion(question, questions) {
  return questions.some(candidate => ['checkbox', 'radio'].includes(candidate?.type) && otherQuestionFor(candidate, questions)?.id === question.id);
}

export function isQuestionRequired(question, questions) {
  return !/^\s*[34]\s*[.)]/.test(question.question || '') && !isOtherQuestion(question, questions);
}

export function getAvailableSlots(availableSlots = [], bookedSlots = [], now = Date.now()) {
  const booked = new Set(bookedSlots.filter(Boolean).map(slot => `${slot.date}|${slot.time}`));
  const seen = new Set();
  return availableSlots.filter(slot => {
    if (!slot?.date || !slot.time) return false;
    if (slot.endTime && !getSlotEndTime(slot)) return false;
    const key = `${slot.date}|${slot.time}`;
    const future = new Date(`${slot.date}T${slot.time}`).getTime() > now;
    if (!future || booked.has(key) || seen.has(key) || bookedSlots.some(booking => slotsOverlap(slot, booking))) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => `${a.date}|${a.time}`.localeCompare(`${b.date}|${b.time}`));
}

export const slotValue = slot => slot ? `${slot.date} om ${slot.time}` : '';

export function selectedBookings(formData, questions) {
  return questions.filter(question => question?.question && question.type === 'booking').flatMap(question => {
    const value = cleanValue(formData.get(question.id));
    const match = /^(\d{4}-\d{2}-\d{2}) om (\d{2}:\d{2})$/.exec(value);
    return match ? [{ questionId: question.id, date: match[1], time: match[2] }] : [];
  });
}

export function validateContactForm(formData, questions = [], availableSlots = [], bookedSlots = [], now = Date.now()) {
  const errors = {};
  for (const field of ['name', 'email', 'phone', 'message']) {
    if (!cleanValue(formData.get(field))) errors[field] = 'Vul dit veld in.';
  }
  if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue(formData.get('email')))) {
    errors.email = 'Vul een geldig e-mailadres in.';
  }
  const freeSlots = getAvailableSlots(availableSlots, bookedSlots, now);
  for (const question of questions) {
    if (!question?.question || isOtherQuestion(question, questions)) continue;
    const required = isQuestionRequired(question, questions);
    if (question.type === 'checkbox' || question.type === 'radio') {
      const selected = formData.getAll(question.type === 'checkbox' ? `${question.id}[]` : question.id).some(value => cleanValue(value));
      const other = otherQuestionFor(question, questions);
      if (required && !selected && !(other && cleanValue(formData.get(other.id)))) {
        errors[question.id] = other ? 'Kies minstens één antwoord of vul “Anders” in.' : 'Kies minstens één antwoord.';
      }
    } else if (question.type === 'booking') {
      const value = cleanValue(formData.get(question.id));
      if (value && !freeSlots.some(slot => slotValue(slot) === value)) {
        errors[question.id] = 'Dit moment is niet meer beschikbaar. Kies een ander moment.';
      } else if (required && freeSlots.length > 0 && !value) {
        errors[question.id] = 'Kies een datum en tijdstip.';
      }
    } else if (required && !cleanValue(formData.get(question.id))) {
      errors[question.id] = 'Vul dit veld in.';
    }
  }
  return errors;
}

export function assertBookingsAvailable(bookings, content, now = Date.now()) {
  const freeSlots = getAvailableSlots(content.availableSlots || [], content.bookedSlots || [], now);
  const unavailable = bookings.find(booking => !freeSlots.some(slot => slotValue(slot) === slotValue(booking)));
  if (unavailable) {
    const error = new Error('Dit moment is intussen niet meer beschikbaar. Kies een ander moment.');
    error.questionId = unavailable.questionId;
    throw error;
  }
}

// Email and Firestore cannot share a transaction. Only reserve after the email
// succeeds, and explicitly report a reservation failure without sending again.
export async function deliverContactMessage({ bookings, checkAvailability, sendMessage, reserveBookings }) {
  if (bookings.length) await checkAvailability();
  await sendMessage();
  if (!bookings.length) return { sent: true, booked: false };
  try {
    await reserveBookings();
    return { sent: true, booked: true };
  } catch {
    return { sent: true, booked: false, bookingFailed: true };
  }
}
