import test from 'node:test';
import assert from 'node:assert/strict';
import { contactAppointmentDetails, getAppointmentId, manualAppointmentDetails, publicBookingMarker, replaceBookingMarker } from '../src/appointmentLogic.js';

const slot = { date: '2030-04-23', time: '10:00' };

test('booking captures question labels, multiple answers, optional blanks and the message', () => {
  const form = new FormData();
  form.set('name', ' Testouder ');
  form.set('email', ' ouder@example.com ');
  form.set('phone', ' 0470000000 ');
  form.set('message', ' Graag een gesprek. ');
  form.append('q2[]', 'Rust');
  form.append('q2[]', 'Grenzen');
  const questions = [{ id: 'q2', type: 'checkbox', question: '2. Waar loop je tegenaan?' }, { id: 'q3', type: 'text', question: '3. Wat helpt?' }];
  const details = contactAppointmentDetails(form, questions);
  assert.equal(details.name, 'Testouder');
  assert.equal(details.message, 'Graag een gesprek.');
  assert.deepEqual(details.answers.map(answer => answer.values), [['Rust', 'Grenzen'], []]);
  questions[0].question = 'Nieuwe vraag';
  assert.equal(details.answers[0].question, '2. Waar loop je tegenaan?');
  assert.equal(details.source, 'website');
});

test('homepage occupancy markers contain no personal details or intake answers', () => {
  assert.deepEqual(publicBookingMarker({ ...slot, name: 'Testouder', email: 'test@example.com', phone: '0470', notes: 'Privé', answers: ['persoonlijk'], dossierId: 'dossier1' }), {
    ...slot, bookingId: '2030-04-23_1000',
  });
});

test('admin can reserve with notes only and editing preserves the submitted answers', () => {
  const previous = { source: 'website', message: 'Hulp gevraagd', answers: [{ questionId: 'q1', values: ['8 jaar'] }] };
  const details = manualAppointmentDetails({ ...slot, notes: ' Telefonisch afgesproken ', dossierId: 'family1' }, previous);
  assert.equal(details.notes, 'Telefonisch afgesproken');
  assert.equal(details.message, previous.message);
  assert.deepEqual(details.answers, previous.answers);
  assert.equal(details.source, 'website');
  assert.equal(details.dossierId, 'family1');
});

test('empty manual appointments, invalid emails and impossible dates are rejected', () => {
  assert.throws(() => manualAppointmentDetails(slot), /naam of extra informatie/);
  assert.throws(() => manualAppointmentDetails({ ...slot, name: 'Ouder', email: 'ongeldig' }), /e-mailadres/);
  assert.throws(() => getAppointmentId('2030-02-30', '10:00'), /datum/);
  assert.throws(() => getAppointmentId(slot.date, '24:00'), /tijd/);
});

test('saving an existing legacy appointment replaces only that public row with a marker', () => {
  const legacy = { ...slot, name: 'Testouder', email: 'ouder@example.com' };
  const another = { date: slot.date, time: '11:00', name: 'Andere ouder' };
  const marker = publicBookingMarker(slot);
  const result = replaceBookingMarker([legacy, another], marker, marker.bookingId);
  assert.deepEqual(result, [another, marker]);
  assert.equal(legacy.name, 'Testouder');
});

test('stale manual editors cannot replace a new booking or recreate a removed booking', () => {
  const marker = publicBookingMarker(slot);
  assert.throws(() => replaceBookingMarker([marker], marker, undefined), /intussen geboekt/);
  assert.throws(() => replaceBookingMarker([], marker, marker.bookingId), /bestaat niet meer/);
  assert.deepEqual(replaceBookingMarker([], marker, undefined), [marker]);
});

test('a replacement booking at the same time has a different identity and rejects stale edits', () => {
  const original = publicBookingMarker({ ...slot, bookingId: 'first-booking' });
  const replacement = publicBookingMarker({ ...slot, bookingId: 'replacement-booking' });
  assert.throws(() => replaceBookingMarker([replacement], original, original.bookingId), /intussen geboekt/);
});

test('a booking marker retains a custom end time without publishing customer details', () => {
  const marker = publicBookingMarker({ ...slot, time: '19:30', endTime: '20:30', bookingId: 'evening', name: 'Testouder', notes: 'Gesprek' });
  assert.deepEqual(marker, { date: slot.date, time: '19:30', endTime: '20:30', bookingId: 'evening' });
});
