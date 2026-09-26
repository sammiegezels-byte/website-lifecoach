const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function localDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Kies een geldige datum.');
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calendarDate(dateKey) {
  if (typeof dateKey !== 'string' || !DATE_PATTERN.test(dateKey)) {
    throw new Error('Kies een geldige datum.');
  }
  // Noon plus calendar arithmetic keeps weekdays intact across DST changes.
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime()) || localDateKey(date) !== dateKey) {
    throw new Error('Kies een geldige datum.');
  }
  return date;
}

export function addCalendarDays(dateKey, days) {
  if (!Number.isInteger(days)) throw new Error('Kies een geldig aantal dagen.');
  const date = calendarDate(dateKey);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function weekStart(dateKey) {
  const date = calendarDate(dateKey);
  return addCalendarDays(dateKey, -((date.getDay() + 6) % 7));
}

export function weekDates(dateKey) {
  const monday = weekStart(dateKey);
  return Array.from({ length: 7 }, (_, offset) => addCalendarDays(monday, offset));
}

function isValidSlot(slot) {
  if (!slot || !TIME_PATTERN.test(slot.time)) return false;
  try {
    calendarDate(slot.date);
    return !!slotInterval(slot);
  } catch {
    return false;
  }
}

const compareSlots = (a, b) => `${a.date}|${a.time}`.localeCompare(`${b.date}|${b.time}`);
const slotKey = slot => `${slot.date}|${slot.time}`;

const timeMinutes = time => {
  if (typeof time !== 'string' || !TIME_PATTERN.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

function slotInterval(slot) {
  const start = timeMinutes(slot?.time);
  if (start === null) return null;
  const end = slot.endTime ? timeMinutes(slot.endTime) : start + 60;
  return end !== null && end > start ? { start, end } : null;
}

export function getSlotEndTime(slot) {
  const interval = slotInterval(slot);
  if (!interval || interval.end >= 24 * 60) return '';
  return `${String(Math.floor(interval.end / 60)).padStart(2, '0')}:${String(interval.end % 60).padStart(2, '0')}`;
}

export function slotsOverlap(first, second) {
  if (!first || !second || first.date !== second.date) return false;
  const a = slotInterval(first);
  const b = slotInterval(second);
  return !!a && !!b && a.start < b.end && b.start < a.end;
}

function validateSlotInterval(slot) {
  calendarDate(slot.date);
  const start = timeMinutes(slot.time);
  const end = timeMinutes(slot.endTime);
  if (start === null || end === null || end <= start) {
    throw new Error('Kies een geldige begin- en eindtijd op dezelfde dag. De eindtijd moet na de begintijd liggen.');
  }
}

// Plan an edit against the latest transaction snapshot, without mutating the
// source data. Booked periods keep their identity when their start time changes.
export function planSlotTimeChange(content, { date, oldTime = null, time, endTime, expectedBookingId }) {
  const slot = { date, time, endTime };
  validateSlotInterval(slot);
  if (oldTime !== null && timeMinutes(oldTime) === null) throw new Error('Kies een geldig tijdslot.');
  const availableSlots = content.availableSlots || [];
  const bookedSlots = content.bookedSlots || [];
  const matchesSource = item => oldTime !== null && item.date === date && item.time === oldTime;
  const sourceAvailable = availableSlots.find(matchesSource);
  const sourceBooking = bookedSlots.find(matchesSource);
  const bookingId = sourceBooking && (sourceBooking.bookingId || `${date}_${oldTime.replace(':', '')}`);

  if ((sourceBooking && bookingId !== expectedBookingId) || (!sourceBooking && expectedBookingId)) {
    throw new Error('Deze afspraak is intussen gewijzigd of verwijderd. Open het tijdslot opnieuw.');
  }
  if (oldTime !== null && !sourceAvailable && !sourceBooking) {
    throw new Error('Dit tijdslot bestaat niet meer. Open de agenda opnieuw.');
  }
  const otherAvailable = availableSlots.filter(item => !matchesSource(item));
  const otherBookings = bookedSlots.filter(item => !matchesSource(item));
  if ([...otherAvailable, ...otherBookings].some(item => slotsOverlap(item, slot))) {
    throw new Error('Dit tijdslot overlapt met een bestaand of geboekt tijdslot. Kies andere uren.');
  }

  const nextAvailable = [...otherAvailable];
  if (sourceAvailable || !sourceBooking) {
    nextAvailable.push({ id: `slot_${date}_${time.replace(':', '')}`, ...slot });
  }
  const nextBookings = sourceBooking ? [...otherBookings, { ...slot, bookingId }] : bookedSlots;
  return {
    sourceBooking: sourceBooking || null,
    slot: sourceBooking ? { ...slot, bookingId } : slot,
    updates: { availableSlots: nextAvailable, bookedSlots: nextBookings },
  };
}

export function getWeekSlots(slots = [], dateKey) {
  const monday = weekStart(dateKey);
  const nextMonday = addCalendarDays(monday, 7);
  return slots.filter(slot => isValidSlot(slot) && slot.date >= monday && slot.date < nextMonday).sort(compareSlots);
}

export function getUpcomingAppointments(bookings = [], now = Date.now()) {
  return bookings.filter(booking => {
    if (!isValidSlot(booking)) return false;
    const endsAt = new Date(`${booking.date}T00:00:00`);
    endsAt.setMinutes(slotInterval(booking).end);
    return endsAt.getTime() > Number(now);
  }).sort(compareSlots);
}

// The cursor belongs to the chosen template week. Each successful copy advances
// one week, including when every target hour already exists or is booked.
export function buildAvailabilityWeekCopy(content, sourceWeekDate) {
  const sourceWeek = weekStart(sourceWeekDate);
  const sourceSlots = getWeekSlots(content.availableSlots || [], sourceWeek);
  if (sourceSlots.length === 0) {
    throw new Error('Kies eerst beschikbare uren in deze week voordat je ze herhaalt.');
  }

  const copies = content.availabilityWeekCopies || {};
  let lastWeek = sourceWeek;
  const savedWeek = copies[sourceWeek];
  if (typeof savedWeek === 'string') {
    try {
      const savedMonday = weekStart(savedWeek);
      if (savedMonday > lastWeek) lastWeek = savedMonday;
    } catch {
      // Ignore an invalid old cursor; the selected template stays usable.
    }
  }
  const targetWeek = addCalendarDays(lastWeek, 7);
  const sourceDates = weekDates(sourceWeek);
  const targetDates = weekDates(targetWeek);
  const availableSlots = content.availableSlots || [];
  const occupied = [...availableSlots.filter(isValidSlot), ...(content.bookedSlots || []).filter(isValidSlot)];
  const copied = [];
  const templateKeys = new Set();
  let skipped = 0;

  for (const slot of sourceSlots) {
    if (templateKeys.has(slotKey(slot))) continue;
    templateKeys.add(slotKey(slot));
    const date = targetDates[sourceDates.indexOf(slot.date)];
    const candidate = { id: `slot_${date}_${slot.time.replace(':', '')}`, date, time: slot.time };
    if (slot.endTime) candidate.endTime = slot.endTime;
    if (occupied.some(existing => slotsOverlap(existing, candidate))) {
      skipped += 1;
      continue;
    }
    copied.push(candidate);
    occupied.push(candidate);
  }

  return {
    targetWeek,
    added: copied.length,
    skipped,
    updates: {
      availableSlots: [...availableSlots, ...copied],
      availabilityWeekCopies: { ...copies, [sourceWeek]: targetWeek },
    },
  };
}
