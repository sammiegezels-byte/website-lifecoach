import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { assertBookingsAvailable, deliverContactMessage, selectedBookings } from './contactFormLogic';
import { contactAppointmentDetails, getAppointmentId, publicBookingMarker } from '../appointmentLogic';

export async function submitContactForm(formData, questions) {
  const bookings = selectedBookings(formData, questions);
  // Generate stable identities outside transaction retries; a later booking at
  // the same time must not match a stale administrator's edit session.
  const markers = [...new Map(bookings.map(booking => [`${booking.date}|${booking.time}`, booking])).values()]
    .map(booking => publicBookingMarker({ ...booking, bookingId: crypto.randomUUID() }));
  const contentRef = doc(db, 'coaching', 'content');
  return deliverContactMessage({
    bookings,
    checkAvailability: async () => {
      const snapshot = await getDocFromServer(contentRef);
      assertBookingsAvailable(bookings, snapshot.data() || {});
    },
    sendMessage: async () => {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Het bericht kon niet worden verzonden. Probeer het opnieuw.');
    },
    reserveBookings: () => runTransaction(db, async transaction => {
      const snapshot = await transaction.get(contentRef);
      const current = snapshot.data() || {};
      assertBookingsAvailable(bookings, current);
      const details = contactAppointmentDetails(formData, questions);
      // Read the final duration with the availability in the same transaction.
      // The public form identifies a choice by its starting time.
      const confirmedMarkers = markers.map(marker => {
        const available = (current.availableSlots || []).find(slot => slot.date === marker.date && slot.time === marker.time);
        return publicBookingMarker({ ...marker, ...(available?.endTime ? { endTime: available.endTime } : {}) });
      });
      for (const marker of confirmedMarkers) {
        transaction.set(doc(db, 'appointments', getAppointmentId(marker.date, marker.time)), {
          ...details,
          ...marker,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      transaction.update(contentRef, { bookedSlots: [...(current.bookedSlots || []), ...confirmedMarkers] });
    }),
  });
}
