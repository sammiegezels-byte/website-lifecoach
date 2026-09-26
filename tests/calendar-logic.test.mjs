import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCalendarDays,
  buildAvailabilityWeekCopy,
  getSlotEndTime,
  getUpcomingAppointments,
  getWeekSlots,
  localDateKey,
  planSlotTimeChange,
  slotsOverlap,
  weekDates,
  weekStart,
} from '../src/calendarLogic.js';
import { manualAppointmentDetails, publicBookingMarker } from '../src/appointmentLogic.js';

test('weeks run Monday through Sunday across month and year boundaries', () => {
  assert.equal(weekStart('2027-01-03'), '2026-12-28');
  assert.deepEqual(weekDates('2027-01-03'), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  assert.equal(addCalendarDays('2028-02-28', 1), '2028-02-29');
  assert.equal(localDateKey(new Date('2026-09-28T23:00:00')), '2026-09-28');
});

test('calendar day arithmetic preserves dates across both Belgian DST changes', () => {
  const originalZone = process.env.TZ;
  try {
    process.env.TZ = 'Europe/Brussels';
    assert.equal(addCalendarDays('2026-03-28', 1), '2026-03-29');
    assert.equal(addCalendarDays('2026-03-29', 1), '2026-03-30');
    assert.equal(addCalendarDays('2026-10-24', 1), '2026-10-25');
    assert.equal(addCalendarDays('2026-10-25', 1), '2026-10-26');
    assert.equal(weekStart('2026-10-25'), '2026-10-19');
  } finally {
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
});

test('week filtering includes Sunday, omits next Monday and preserves arbitrary intervals', () => {
  const slots = [{ date: '2026-10-05', time: '09:00' }, { date: '2026-10-04', time: '19:30', endTime: '20:30' }, { date: '2026-09-28', time: '08:00' }];
  assert.deepEqual(getWeekSlots(slots, '2026-09-30'), [slots[2], slots[1]]);
  assert.deepEqual(slots.map(slot => slot.date), ['2026-10-05', '2026-10-04', '2026-09-28']);
});

test('copying a template preserves weekdays, end times and unrelated calendar data', () => {
  const content = {
    availableSlots: [
      { id: 'monday', date: '2026-09-28', time: '19:30', endTime: '20:30' },
      { id: 'sunday', date: '2026-10-04', time: '09:15', endTime: '10:00' },
      { id: 'unrelated', date: '2026-10-07', time: '12:00' },
    ],
    bookedSlots: [{ date: '2026-09-28', time: '19:30', bookingId: 'already-booked-source' }],
  };
  const before = structuredClone(content);
  const result = buildAvailabilityWeekCopy(content, '2026-09-30');
  assert.equal(result.targetWeek, '2026-10-05');
  assert.equal(result.added, 2);
  assert.equal(result.skipped, 0);
  assert.deepEqual(result.updates.availableSlots.slice(3), [
    { id: 'slot_2026-10-05_1930', date: '2026-10-05', time: '19:30', endTime: '20:30' },
    { id: 'slot_2026-10-11_0915', date: '2026-10-11', time: '09:15', endTime: '10:00' },
  ]);
  assert.deepEqual(content, before);
  assert.equal(Object.hasOwn(result.updates, 'bookedSlots'), false);
});

test('copy skips duplicate and overlapping booked targets but still advances the cursor', () => {
  const content = {
    availableSlots: [
      { date: '2026-09-28', time: '09:00' },
      { date: '2026-09-28', time: '09:00' },
      { date: '2026-09-29', time: '19:30', endTime: '20:30' },
      { date: '2026-10-05', time: '09:00' },
    ],
    bookedSlots: [{ date: '2026-10-06', time: '20:00', bookingId: 'existing' }],
  };
  const first = buildAvailabilityWeekCopy(content, '2026-09-28');
  assert.equal(first.added, 0);
  assert.equal(first.skipped, 2);
  assert.equal(first.updates.availabilityWeekCopies['2026-09-28'], '2026-10-05');
  const next = buildAvailabilityWeekCopy({ ...content, ...first.updates }, '2026-09-28');
  assert.equal(next.targetWeek, '2026-10-12');
  assert.equal(next.added, 2);
});

test('repeated copies persist progress without a fixed number-of-weeks limit', () => {
  let content = { availableSlots: [{ date: '2026-09-28', time: '10:00', endTime: '11:00' }] };
  let result;
  for (let index = 0; index < 80; index += 1) {
    result = buildAvailabilityWeekCopy(content, '2026-09-28');
    content = { ...content, ...result.updates };
    assert.equal(result.added, 1);
  }
  assert.equal(result.targetWeek, addCalendarDays('2026-09-28', 80 * 7));
  assert.equal(content.availableSlots.length, 81);
});

test('later copies use the current template and preserve other templates progress', () => {
  const content = {
    availableSlots: [{ date: '2026-09-28', time: '18:30', endTime: '19:15' }],
    availabilityWeekCopies: { '2026-09-28': '2026-10-05', '2026-09-21': '2026-10-12' },
  };
  const result = buildAvailabilityWeekCopy(content, '2026-09-28');
  assert.deepEqual(result.updates.availabilityWeekCopies, { '2026-09-28': '2026-10-12', '2026-09-21': '2026-10-12' });
  assert.equal(result.updates.availableSlots.at(-1).time, '18:30');
  assert.throws(() => buildAvailabilityWeekCopy({ availableSlots: [] }, '2026-09-28'), /Kies eerst/);
});

test('interval overlap supports half hours and one-hour legacy durations but allows adjacent slots', () => {
  const slot = { date: '2026-09-28', time: '19:30', endTime: '20:30' };
  assert.equal(slotsOverlap(slot, { date: slot.date, time: '20:00' }), true);
  assert.equal(slotsOverlap(slot, { date: slot.date, time: '20:30', endTime: '21:00' }), false);
  assert.equal(slotsOverlap(slot, { date: '2026-09-29', time: '20:00' }), false);
  assert.equal(getSlotEndTime({ time: '19:30' }), '20:30');
});

test('upcoming appointments include an ongoing appointment until its end', () => {
  const bookings = [
    { date: '2026-09-29', time: '09:00', bookingId: 'future' },
    { date: '2026-09-28', time: '19:30', endTime: '20:30', bookingId: 'ongoing' },
    { date: '2026-09-28', time: '18:00', bookingId: 'past' },
    { date: 'invalid', time: '09:00' },
  ];
  assert.deepEqual(getUpcomingAppointments(bookings, new Date('2026-09-28T19:45:00')).map(slot => slot.bookingId), ['ongoing', 'future']);
  assert.deepEqual(getUpcomingAppointments(bookings, new Date('2026-09-28T20:30:00')).map(slot => slot.bookingId), ['future']);
});

test('moving an available interval removes its old start and preserves unrelated rows', () => {
  const content = { availableSlots: [{ id: 'old', date: '2026-09-28', time: '10:00' }, { id: 'other', date: '2026-09-29', time: '10:00' }], bookedSlots: [] };
  const plan = planSlotTimeChange(content, { date: '2026-09-28', oldTime: '10:00', time: '19:30', endTime: '20:30' });
  assert.deepEqual(plan.updates.availableSlots, [content.availableSlots[1], { id: 'slot_2026-09-28_1930', date: '2026-09-28', time: '19:30', endTime: '20:30' }]);
  assert.deepEqual(plan.updates.bookedSlots, []);
  assert.equal(content.availableSlots[0].time, '10:00');
});

test('moving booked time preserves its identity and supplies legacy details for atomic migration', () => {
  const old = { date: '2026-09-28', time: '10:00', name: 'Testouder', email: 'test@example.com', bookingId: 'original-uuid' };
  const content = { availableSlots: [{ id: 'old', date: old.date, time: old.time }], bookedSlots: [old] };
  const plan = planSlotTimeChange(content, { date: old.date, oldTime: old.time, time: '19:30', endTime: '20:30', expectedBookingId: old.bookingId });
  assert.deepEqual(plan.slot, { date: old.date, time: '19:30', endTime: '20:30', bookingId: 'original-uuid' });
  assert.deepEqual(plan.updates.bookedSlots, [plan.slot]);
  assert.equal(plan.sourceBooking.name, 'Testouder');
  assert.equal(plan.updates.availableSlots[0].time, '19:30');
  assert.deepEqual(content.bookedSlots, [old]);
});

test('moving an unpublished manual booking does not publish an available time', () => {
  const content = { availableSlots: [], bookedSlots: [{ date: '2026-09-28', time: '10:00', bookingId: 'manual' }] };
  const plan = planSlotTimeChange(content, { date: '2026-09-28', oldTime: '10:00', time: '19:30', endTime: '20:30', expectedBookingId: 'manual' });
  assert.deepEqual(plan.updates.availableSlots, []);
});

test('stale edits, overlaps and crossing midnight cannot change calendar state', () => {
  const source = { date: '2026-09-28', time: '10:00', bookingId: 'current' };
  const content = { availableSlots: [], bookedSlots: [source, { date: source.date, time: '20:00', bookingId: 'neighbor' }] };
  const input = { date: source.date, oldTime: source.time, time: '19:30', endTime: '20:30', expectedBookingId: 'current' };
  assert.throws(() => planSlotTimeChange(content, input), /overlapt/);
  assert.throws(() => planSlotTimeChange(content, { ...input, expectedBookingId: 'stale' }), /gewijzigd of verwijderd/);
  assert.throws(() => planSlotTimeChange(content, { ...input, time: '23:30', endTime: '00:30' }), /dezelfde dag/);
  assert.throws(() => planSlotTimeChange({ availableSlots: [] }, { date: source.date, oldTime: '10:00', time: '11:00', endTime: '12:00' }), /bestaat niet meer/);
});

test('manual details and public markers preserve the selected end time', () => {
  const details = manualAppointmentDetails({ date: '2026-09-28', time: '19:30', endTime: '20:30', name: 'Testouder' });
  assert.equal(details.endTime, '20:30');
  assert.equal(publicBookingMarker({ ...details, bookingId: 'test' }).endTime, '20:30');
  assert.throws(() => manualAppointmentDetails({ date: '2026-09-28', time: '19:30', endTime: '18:30', name: 'Testouder' }), /eindtijd/);
});
