import test from 'node:test';
import assert from 'node:assert/strict';
import { getContactValidationState, validationFieldFor } from '../src/components/contactFormState.js';

const questions = [
  { id: 'q1', type: 'text', question: '1. Leeftijd van je kind' },
  { id: 'q2', type: 'checkbox', question: '2. Waar loop je tegenaan?' },
  { id: 'q2_other', type: 'text', question: 'Anders, namelijk…' },
  { id: 'q3', type: 'text', question: '3. Wat verwacht je?' },
  { id: 'q4', type: 'booking', question: '4. Kies een gratis sessie' },
];
const now = new Date('2030-05-01T12:00:00').getTime();
const slot = { date: '2030-05-02', time: '10:00' };
const otherSlot = { date: '2030-05-03', time: '10:00' };
const form = values => {
  const result = new FormData();
  Object.entries(values).forEach(([name, value]) => result.set(name, value));
  return result;
};
const complete = () => form({ name: 'Een ouder', email: 'ouder@example.com', phone: '0470 12 34 56', message: 'Een bericht', q1: '8 jaar', 'q2[]': 'Grenzen' });
const state = (formData, options = {}) => getContactValidationState({ formData, questions, availableSlots: [slot, otherSlot], bookedSlots: [], now, ...options });

test('the empty form is disabled but initially displays no errors', () => {
  assert.deepEqual(state(new FormData()), { canSubmit: false, errors: {} });
});

test('blur exposes only touched invalid fields and correction removes their errors', () => {
  const data = new FormData();
  assert.deepEqual(state(data, { touched: { name: true } }), { canSubmit: false, errors: { name: 'Vul dit veld in.' } });
  data.set('name', 'Ouder');
  assert.deepEqual(state(data, { touched: { name: true } }), { canSubmit: false, errors: {} });
});

test('submit eligibility reacts to filling, clearing, whitespace and invalid email', () => {
  const data = complete();
  assert.equal(state(data).canSubmit, true);
  for (const [name, invalid] of [['phone', ''], ['name', '   '], ['email', 'ongeldig'], ['message', ''], ['q1', '']]) {
    const saved = data.get(name);
    data.set(name, invalid);
    assert.equal(state(data).canSubmit, false, name);
    data.set(name, saved);
    assert.equal(state(data).canSubmit, true, name);
  }
});

test('unchecked Q2 disables submit unless Anders has a nonblank answer; Q3/Q4 remain optional', () => {
  const data = complete();
  data.delete('q2[]');
  assert.equal(state(data).canSubmit, false);
  data.set('q2_other', 'Mijn eigen hulpvraag');
  assert.equal(state(data).canSubmit, true);
  data.set('q2_other', '   ');
  assert.equal(state(data).canSubmit, false);
  data.append('q2[]', 'Grenzen');
  assert.equal(state(data).canSubmit, true);
  assert.equal(data.has('q3'), false);
  assert.equal(data.has('q4'), false);
});

test('checkboxes and their Other field share touched validation state', () => {
  assert.equal(validationFieldFor('q2[]', questions), 'q2');
  assert.equal(validationFieldFor('q2_other', questions), 'q2');
  assert.equal(validationFieldFor('phone', questions), 'phone');
});

test('live booking conflicts and expiration disable submit without requiring another field edit', () => {
  const data = complete();
  data.set('q4', '2030-05-02 om 10:00');
  assert.equal(state(data).canSubmit, true);
  const conflict = state(data, { bookedSlots: [slot], touched: { q4: true } });
  assert.equal(conflict.canSubmit, false);
  assert.ok(conflict.errors.q4);
  assert.equal(state(data, { now: new Date('2030-05-02T10:01:00').getTime() }).canSubmit, false);
  data.set('q4', '');
  assert.equal(state(data, { bookedSlots: [slot] }).canSubmit, true);
});

test('a server-reported slot conflict remains disabled until the choice changes', () => {
  const data = complete();
  data.set('q4', '2030-05-02 om 10:00');
  const options = { serverError: { name: 'q4', value: data.get('q4'), message: 'Moment intussen bezet' }, attempted: true };
  assert.deepEqual(state(data, options), { canSubmit: false, errors: { q4: 'Moment intussen bezet' } });
  data.set('q4', '2030-05-03 om 10:00');
  assert.deepEqual(state(data, options), { canSubmit: true, errors: {} });
});

test('a submit attempt still exposes all missing fields as a final validation guard', () => {
  const result = state(new FormData(), { attempted: true });
  assert.equal(result.canSubmit, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['email', 'message', 'name', 'phone', 'q1', 'q2']);
});
