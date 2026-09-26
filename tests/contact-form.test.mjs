import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertBookingsAvailable,
  deliverContactMessage,
  getAvailableSlots,
  isQuestionRequired,
  selectedBookings,
  validateContactForm,
} from '../src/components/contactFormLogic.js';

const questions = [
  { id: 'q1', type: 'text', question: '1. Leeftijd van je kind(eren)' },
  { id: 'q2', type: 'checkbox', question: '2. Waar loop je tegenaan?', options: 'Rust, Grenzen' },
  { id: 'q2_other', type: 'text', question: 'Anders, namelijk: ...' },
  { id: 'q3', type: 'text', question: '3. Wat verwacht je?' },
  { id: 'q4', type: 'booking', question: '4. Boek een gratis sessie' },
];
const now = new Date('2030-05-01T12:00:00').getTime();
const slot = { id: 'slot-1', date: '2030-05-02', time: '10:00' };
const secondSlot = { id: 'slot-2', date: '2030-05-03', time: '11:00' };

function validData() {
  const form = new FormData();
  Object.entries({ name: 'Test ouder', email: 'test@example.com', phone: '+32 470 12 34 56', message: 'Mijn bericht', q1: '7 jaar' }).forEach(([name, value]) => form.set(name, value));
  form.append('q2[]', 'Rust');
  return form;
}

test('empty/whitespace fields fail including phone, Q1 and Q2; Q3/Q4 remain optional', () => {
  const form = new FormData();
  form.set('name', '   ');
  const errors = validateContactForm(form, questions, [], [], now);
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name', 'phone', 'q1', 'q2']);
  assert.equal(isQuestionRequired(questions[3], questions), false);
  assert.equal(isQuestionRequired({ id: 'newid', question: ' 4. Andere vraag' }, []), false);
});

test('phone is mandatory and invalid email is rejected', () => {
  const form = validData();
  form.set('phone', '  ');
  form.set('email', 'niet-een-email');
  const errors = validateContactForm(form, questions, [], [], now);
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'phone']);
  form.set('email', 'test@example.com');
  form.set('phone', '0470 12 34 56');
  assert.deepEqual(validateContactForm(form, questions, [], [], now), {});
});

test('Q2 accepts checkbox selections without requiring Anders', () => {
  const form = validData();
  form.append('q2[]', 'Grenzen');
  assert.deepEqual(validateContactForm(form, questions, [], [], now), {});
  assert.deepEqual(form.getAll('q2[]'), ['Rust', 'Grenzen']);
});

test('Q2 accepts Anders as an alternative, but not whitespace', () => {
  const form = validData();
  form.delete('q2[]');
  form.set('q2_other', 'Een andere hulpvraag');
  assert.deepEqual(validateContactForm(form, questions, [], [], now), {});
  form.set('q2_other', '   ');
  assert.ok(validateContactForm(form, questions, [], [], now).q2);
});

test('new text and radio questions are required except visible numbers 3 and 4', () => {
  const extras = [
    { id: 'newtext', type: 'text', question: '5. Beschikbaarheid' },
    { id: 'newradio', type: 'radio', question: '6. Contactvoorkeur' },
  ];
  const form = validData();
  assert.deepEqual(Object.keys(validateContactForm(form, [...questions, ...extras], [], [], now)), ['newtext', 'newradio']);
  form.set('newtext', 'Woensdag');
  form.set('newradio', 'Telefoon');
  assert.deepEqual(validateContactForm(form, [...questions, ...extras], [], [], now), {});
});

test('calendar removes booked, expired, invalid and duplicate slots without mutating content', () => {
  const available = [secondSlot, slot, { ...slot, id: 'duplicate' }, { date: '2030-04-01', time: '10:00' }, { date: 'bad', time: '10:00' }, {}];
  const before = structuredClone(available);
  assert.deepEqual(getAvailableSlots(available, [{ ...slot, name: 'Already booked' }], now), [secondSlot]);
  assert.deepEqual(available, before);
});

test('overlapping appointment intervals are hidden even with different start times', () => {
  const date = '2030-05-02';
  const available = [
    { date, time: '18:30', endTime: '19:30' },
    { date, time: '19:00', endTime: '20:00' },
    { date, time: '19:30', endTime: '20:30' },
    { date, time: '20:00', endTime: '21:00' },
    { date, time: '20:30', endTime: '21:30' },
  ];
  const booked = [{ date, time: '19:30', endTime: '20:30' }];
  assert.deepEqual(getAvailableSlots(available, booked, now), [available[0], available[4]]);
  assert.deepEqual(getAvailableSlots(available, [{ date: '2030-05-03', time: '19:30', endTime: '20:30' }], now), available);
});

test('legacy appointments without endTime occupy one hour and invalid intervals are not offered', () => {
  const date = '2030-05-02';
  const available = [
    { date, time: '19:00' },
    { date, time: '19:30', endTime: '20:30' },
    { date, time: '21:00', endTime: '22:00' },
    { date, time: '22:00', endTime: '21:00' },
    { date, time: '22:00', endTime: 'bad' },
  ];
  assert.deepEqual(getAvailableSlots(available, [{ date, time: '20:00' }], now), [available[0], available[2]]);
});

test('an overlapping booking invalidates a previously selected interval and the reservation recheck', () => {
  const interval = { date: '2030-05-02', time: '19:30', endTime: '20:30' };
  const booked = { date: '2030-05-02', time: '20:00', endTime: '21:00' };
  const form = validData();
  form.set('q4', '2030-05-02 om 19:30');
  assert.ok(validateContactForm(form, questions, [interval], [booked], now).q4);
  assert.throws(() => assertBookingsAvailable(selectedBookings(form, questions), { availableSlots: [interval], bookedSlots: [booked] }, now), error => error.questionId === 'q4');
});

test('an optional selected session must still be available; no silent dropping of stale choice', () => {
  const form = validData();
  form.set('q4', '2030-05-02 om 10:00');
  assert.deepEqual(validateContactForm(form, questions, [slot], [], now), {});
  assert.ok(validateContactForm(form, questions, [slot], [slot], now).q4);
  assert.deepEqual(selectedBookings(form, questions), [{ questionId: 'q4', date: slot.date, time: slot.time }]);
  form.set('q4', '2030-05-02 om 99:99');
  assert.ok(validateContactForm(form, questions, [slot], [], now).q4);
});

test('an empty/full calendar does not block contact even when the booking question is normally required', () => {
  const withRequiredBooking = [...questions, { id: 'q6', type: 'booking', question: '6. Boek een moment' }];
  const form = validData();
  assert.deepEqual(validateContactForm(form, withRequiredBooking, [], [], now), {});
  assert.deepEqual(validateContactForm(form, withRequiredBooking, [slot], [slot], now), {});
  assert.ok(validateContactForm(form, withRequiredBooking, [slot], [], now).q6);
});

test('reservation recheck rejects a booked or removed slot while preserving the question identity', () => {
  const bookings = [{ questionId: 'q4', date: slot.date, time: slot.time }];
  assert.doesNotThrow(() => assertBookingsAvailable(bookings, { availableSlots: [slot] }, now));
  for (const content of [{ availableSlots: [slot], bookedSlots: [slot] }, { availableSlots: [] }]) {
    assert.throws(() => assertBookingsAvailable(bookings, content, now), error => error.questionId === 'q4');
  }
});

test('sending a message without booking never checks or writes reservations', async () => {
  const calls = [];
  const result = await deliverContactMessage({
    bookings: [],
    checkAvailability: async () => calls.push('check'),
    sendMessage: async () => calls.push('send'),
    reserveBookings: async () => calls.push('reserve'),
  });
  assert.deepEqual(calls, ['send']);
  assert.deepEqual(result, { sent: true, booked: false });
});

test('booking is persisted only after confirmed email success', async () => {
  const calls = [];
  const result = await deliverContactMessage({
    bookings: [slot],
    checkAvailability: async () => calls.push('check'),
    sendMessage: async () => calls.push('send'),
    reserveBookings: async () => calls.push('reserve'),
  });
  assert.deepEqual(calls, ['check', 'send', 'reserve']);
  assert.deepEqual(result, { sent: true, booked: true });
});

test('no booking write or email when availability check fails', async () => {
  const calls = [];
  await assert.rejects(deliverContactMessage({
    bookings: [slot],
    checkAvailability: async () => { calls.push('check'); throw new Error('Taken'); },
    sendMessage: async () => calls.push('send'),
    reserveBookings: async () => calls.push('reserve'),
  }), /Taken/);
  assert.deepEqual(calls, ['check']);
});

test('failed email delivery does not reserve a slot', async () => {
  const calls = [];
  await assert.rejects(deliverContactMessage({
    bookings: [slot],
    checkAvailability: async () => calls.push('check'),
    sendMessage: async () => { calls.push('send'); throw new Error('Send failed'); },
    reserveBookings: async () => calls.push('reserve'),
  }), /Send failed/);
  assert.deepEqual(calls, ['check', 'send']);
});

test('post-send race or reservation failure is reported as sent but unconfirmed, never resent', async () => {
  const calls = [];
  const result = await deliverContactMessage({
    bookings: [slot],
    checkAvailability: async () => calls.push('check'),
    sendMessage: async () => calls.push('send'),
    reserveBookings: async () => { calls.push('reserve'); throw new Error('Taken by another visitor'); },
  });
  assert.deepEqual(calls, ['check', 'send', 'reserve']);
  assert.deepEqual(result, { sent: true, booked: false, bookingFailed: true });
});
