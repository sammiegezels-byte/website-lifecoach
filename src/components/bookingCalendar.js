import { addCalendarDays, getSlotEndTime, getWeekSlots, localDateKey, weekStart } from '../calendarLogic.js';

export function formatBookingTime(slot) {
  const endTime = slot?.endTime && getSlotEndTime(slot);
  return endTime ? `${slot.time} – ${endTime}` : slot?.time || '';
}

export function getBookingCalendarWeek(slots, visibleDate, today = localDateKey(new Date())) {
  const currentStart = weekStart(today);
  const requestedStart = weekStart(visibleDate || today);
  const availableWeeks = [...new Set(slots.filter(slot => slot.date >= today).map(slot => weekStart(slot.date)))].sort();
  // Open the earliest available week. If a viewed week becomes fully booked,
  // advance to the next available week, or fall back to the last earlier one.
  const start = availableWeeks.find(date => date >= requestedStart) || availableWeeks.at(-1) || currentStart;
  const index = availableWeeks.indexOf(start);
  const end = addCalendarDays(start, 6);
  return {
    start,
    end,
    slots: getWeekSlots(slots, start),
    isCurrent: start === currentStart,
    availableWeeks,
    hasAvailableWeeks: availableWeeks.length > 0,
    canPrevious: index > 0,
    canLater: index >= 0 && index < availableWeeks.length - 1,
  };
}

export function adjacentBookingWeek(week, direction) {
  const index = week.availableWeeks.indexOf(week.start);
  if (direction < 0) return week.canPrevious ? week.availableWeeks[index - 1] : week.start;
  return week.canLater ? week.availableWeeks[index + 1] : week.start;
}
