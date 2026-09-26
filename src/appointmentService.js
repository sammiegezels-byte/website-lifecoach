import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getAppointmentId, isSameSlot, manualAppointmentDetails, publicBookingMarker, replaceBookingMarker } from './appointmentLogic';
import { buildAvailabilityWeekCopy, getSlotEndTime, planSlotTimeChange, slotsOverlap, weekStart } from './calendarLogic';

export { getAppointmentId } from './appointmentLogic';

export function listenAppointmentDetails(date, time, onData, onError) {
  return onSnapshot(doc(db, 'appointments', getAppointmentId(date, time)), snapshot => {
    onData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null);
  }, onError);
}

export async function saveAppointment(input) {
  const slotId = getAppointmentId(input.date, input.time);
  const bookingId = input.bookingId || crypto.randomUUID();
  const contentRef = doc(db, 'coaching', 'content');
  const appointmentRef = doc(db, 'appointments', slotId);
  // Validate user input before contacting the database.
  manualAppointmentDetails(input);
  await runTransaction(db, async transaction => {
    const contentSnapshot = await transaction.get(contentRef);
    if (!contentSnapshot.exists()) throw new Error('De agenda kon niet worden geladen. Probeer opnieuw.');
    const content = contentSnapshot.data();
    const existing = (content.bookedSlots || []).find(slot => isSameSlot(slot, input));
    const detailsSnapshot = await transaction.get(appointmentRef);
    if (input.dossierId) {
      const dossierSnapshot = await transaction.get(doc(db, 'dossiers', input.dossierId));
      if (!dossierSnapshot.exists()) throw new Error('Dit dossier bestaat niet meer. Kies een ander dossier.');
    }
    const previous = existing ? (detailsSnapshot.exists() ? detailsSnapshot.data() : existing) : {};
    const available = (content.availableSlots || []).find(slot => isSameSlot(slot, input));
    const endTime = input.endTime || previous.endTime || available?.endTime || getSlotEndTime(input);
    if (!endTime) throw new Error('Kies een eindtijd op dezelfde dag voor deze afspraak.');
    const details = manualAppointmentDetails({ ...input, endTime }, previous);
    const bookedSlots = replaceBookingMarker(content.bookedSlots || [], publicBookingMarker({ ...details, bookingId }), input.bookingId);
    if ((content.bookedSlots || []).some(slot => !isSameSlot(slot, input) && slotsOverlap(slot, details))) {
      throw new Error('Dit tijdslot overlapt met een andere afspraak. Kies andere uren.');
    }
    transaction.set(appointmentRef, {
      ...details,
      bookingId,
      createdAt: previous.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(contentRef, { bookedSlots });
  });
  return bookingId;
}

export async function setSlotAvailability(date, time, available) {
  getAppointmentId(date, time);
  const contentRef = doc(db, 'coaching', 'content');
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(contentRef);
    if (!snapshot.exists()) throw new Error('De agenda kon niet worden geladen. Probeer opnieuw.');
    const content = snapshot.data();
    const slot = { date, time };
    if ((content.bookedSlots || []).some(booked => isSameSlot(booked, slot))) {
      throw new Error('Dit tijdslot is geboekt en kan niet als vrij moment worden ingesteld.');
    }
    const existing = (content.availableSlots || []).find(item => isSameSlot(item, slot));
    if (available) {
      const endTime = getSlotEndTime(existing || slot);
      const { updates } = planSlotTimeChange(content, { date, oldTime: existing ? time : null, time, endTime });
      transaction.update(contentRef, { availableSlots: updates.availableSlots });
    } else {
      const remaining = (content.availableSlots || []).filter(item => !isSameSlot(item, slot));
      transaction.update(contentRef, { availableSlots: remaining });
    }
  });
}

export async function setSlotTime(date, oldTime, time, endTime, expectedBookingId) {
  getAppointmentId(date, time);
  const contentRef = doc(db, 'coaching', 'content');
  return runTransaction(db, async transaction => {
    const contentSnapshot = await transaction.get(contentRef);
    if (!contentSnapshot.exists()) throw new Error('De agenda kon niet worden geladen. Probeer opnieuw.');
    const { sourceBooking, slot, updates } = planSlotTimeChange(contentSnapshot.data(), { date, oldTime, time, endTime, expectedBookingId });

    if (sourceBooking) {
      const oldRef = doc(db, 'appointments', getAppointmentId(date, oldTime));
      const nextRef = doc(db, 'appointments', getAppointmentId(date, time));
      const oldSnapshot = await transaction.get(oldRef);
      if (oldTime !== time) {
        const nextSnapshot = await transaction.get(nextRef);
        if (nextSnapshot.exists()) throw new Error('Op het nieuwe uur bestaan al afspraakgegevens. Kies een ander tijdslot.');
      }
      const previous = oldSnapshot.exists() ? oldSnapshot.data() : sourceBooking;
      if (previous.bookingId && previous.bookingId !== slot.bookingId) {
        throw new Error('Deze afspraakgegevens zijn intussen gewijzigd. Open het tijdslot opnieuw.');
      }
      transaction.set(nextRef, { ...previous, ...slot, createdAt: previous.createdAt || serverTimestamp(), updatedAt: serverTimestamp() });
      if (oldTime !== time) transaction.delete(oldRef);
    }
    transaction.update(contentRef, updates);
    return slot;
  });
}

export async function repeatAvailabilityWeek(sourceWeekDate) {
  const sourceWeek = weekStart(sourceWeekDate);
  const contentRef = doc(db, 'coaching', 'content');
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(contentRef);
    if (!snapshot.exists()) throw new Error('De agenda kon niet worden geladen. Probeer opnieuw.');
    const { updates, ...result } = buildAvailabilityWeekCopy(snapshot.data(), sourceWeek);
    transaction.update(contentRef, updates);
    return result;
  });
}
