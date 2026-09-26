import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacentBookingWeek, formatBookingTime, getBookingCalendarWeek } from '../src/components/bookingCalendar.js';

const today = '2026-09-27'; // Sunday; September 30 is in the following week.
const nextWednesday = { date: '2026-09-30', time: '10:00' };
const laterWednesday = { date: '2026-10-14', time: '19:30' };

test('visitor calendar opens the earliest week with available future slots', () => {
  const week = getBookingCalendarWeek([nextWednesday], '', today);
  assert.equal(week.start, '2026-09-28');
  assert.equal(week.end, '2026-10-04');
  assert.deepEqual(week.slots, [nextWednesday]);
  assert.equal(week.isCurrent, false);
  assert.equal(week.canPrevious, false);
  assert.equal(week.canLater, false);
});

test('later-date navigation skips empty weeks entirely', () => {
  const slots = [nextWednesday, laterWednesday];
  let week = getBookingCalendarWeek(slots, '', today);
  assert.equal(week.start, '2026-09-28');
  assert.deepEqual(week.slots, [nextWednesday]);
  week = getBookingCalendarWeek(slots, adjacentBookingWeek(week, 1), today);
  assert.equal(week.start, '2026-10-12');
  assert.deepEqual(week.slots, [laterWednesday]);
  assert.equal(week.canLater, false);
  assert.equal(adjacentBookingWeek(week, 1), '2026-10-12');
});

test('previous navigation skips empty weeks and cannot move before current available dates', () => {
  const future = getBookingCalendarWeek([nextWednesday, laterWednesday], '2026-10-12', today);
  assert.equal(adjacentBookingWeek(future, -1), '2026-09-28');
  const first = getBookingCalendarWeek([nextWednesday, laterWednesday], '', today);
  assert.equal(adjacentBookingWeek(first, -1), '2026-09-28');
  assert.equal(getBookingCalendarWeek([nextWednesday], '2026-09-14', today).start, '2026-09-28');
});

test('the current week is shown only when it still has an available future slot', () => {
  const sunday = { date: today, time: '23:30' };
  const week = getBookingCalendarWeek([nextWednesday, sunday], '', today);
  assert.equal(week.start, '2026-09-21');
  assert.equal(week.isCurrent, true);
  assert.deepEqual(week.slots, [sunday]);
  assert.equal(adjacentBookingWeek(week, 1), '2026-09-28');
});

test('when a viewed week becomes empty use the next available week, else an earlier available week', () => {
  assert.equal(getBookingCalendarWeek([laterWednesday], '2026-09-28', today).start, '2026-10-12');
  assert.equal(getBookingCalendarWeek([nextWednesday], '2026-10-12', today).start, '2026-09-28');
});

test('week boundaries include Sunday and exclude the next Monday', () => {
  const sunday = { date: '2026-10-04', time: '10:00' };
  const monday = { date: '2026-10-05', time: '10:00' };
  const week = getBookingCalendarWeek([monday, sunday, nextWednesday], '2026-09-28', today);
  assert.deepEqual(week.slots, [nextWednesday, sunday]);
  assert.equal(week.canLater, true);
});

test('an empty calendar has no visible week and no navigation', () => {
  const week = getBookingCalendarWeek([], '', today);
  assert.equal(week.hasAvailableWeeks, false);
  assert.deepEqual(week.availableWeeks, []);
  assert.equal(week.canLater, false);
  assert.equal(week.canPrevious, false);
});

test('navigation is calendar-based across year and DST boundaries', () => {
  const year = getBookingCalendarWeek([{ date: '2026-12-31', time: '23:00' }, { date: '2027-01-05', time: '10:00' }], '', '2026-12-31');
  assert.equal(year.start, '2026-12-28');
  assert.equal(year.end, '2027-01-03');
  assert.equal(adjacentBookingWeek(year, 1), '2027-01-04');
  const dst = getBookingCalendarWeek([{ date: '2026-10-25', time: '23:00' }, { date: '2026-10-28', time: '10:00' }], '', '2026-10-25');
  assert.equal(dst.start, '2026-10-19');
  assert.equal(adjacentBookingWeek(dst, 1), '2026-10-26');
});

test('visitor time captions show valid explicit intervals and retain old start-only values', () => {
  assert.equal(formatBookingTime({ time: '19:30', endTime: '20:30' }), '19:30 – 20:30');
  assert.equal(formatBookingTime({ time: '19:30' }), '19:30');
  assert.equal(formatBookingTime({ time: '19:30', endTime: '19:00' }), '19:30');
  assert.equal(formatBookingTime({ time: '19:30', endTime: 'ongeldig' }), '19:30');
});
