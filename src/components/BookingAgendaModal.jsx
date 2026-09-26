import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Calendar, ChevronLeft, ChevronRight, FileText, Info, Plus, Save, X } from 'lucide-react';
import { db } from '../firebase';
import { getAppointmentId, listenAppointmentDetails, repeatAvailabilityWeek, saveAppointment, setSlotAvailability, setSlotTime } from '../appointmentService';
import { addCalendarDays, getUpcomingAppointments, localDateKey, weekStart } from '../calendarLogic';
import './BookingAgendaModal.css';

const defaultHours = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`);
const dateCaption = date => new Date(`${date}T12:00:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' });
const weekCaption = date => `${dateCaption(date)} – ${dateCaption(addCalendarDays(date, 6))}`;
const matchesBooking = (details, marker) => !!details && !!marker && details.date === marker.date && details.time === marker.time &&
  (details.bookingId || getAppointmentId(details.date, details.time)) === (marker.bookingId || getAppointmentId(marker.date, marker.time));
const contactValues = details => ({
  name: details?.name || '',
  email: details?.email || '',
  phone: details?.phone || '',
  notes: details?.notes || '',
  dossierId: details?.dossierId || '',
});

function ReceivedAnswers({ details }) {
  const answers = Array.isArray(details?.answers) ? details.answers : [];
  if (!details?.message && !answers.length) return null;

  return (
    <section className="agenda-received" aria-label="Ontvangen formuliergegevens">
      <h4>Ontvangen via het formulier</h4>
      {details.message && <div className="agenda-answer"><strong>Bericht</strong><p>{details.message}</p></div>}
      {answers.map((answer, index) => {
        const values = Array.isArray(answer.values) ? answer.values : [answer.value ?? answer.answer ?? ''];
        return (
          <div className="agenda-answer" key={`${answer.questionId || 'vraag'}-${index}`}>
            <strong>{answer.question || `Vraag ${index + 1}`}</strong>
            <p>{values.filter(value => value !== null && value !== undefined && value !== '').map(String).join(', ') || 'Niet ingevuld'}</p>
          </div>
        );
      })}
    </section>
  );
}

function AppointmentDetails({ date, time, bookedSlot, editingBookingId, mode, onModeChange, onDirtyChange, onSaved, onOpenDossier, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [dossiers, setDossiers] = useState([]);
  const [dossierError, setDossierError] = useState('');

  const markerId = bookedSlot ? bookedSlot.bookingId || getAppointmentId(date, time) : null;
  useEffect(() => listenAppointmentDetails(date, time, data => {
    setDetails(matchesBooking(data, markerId ? { date, time, bookingId: markerId } : null) ? data : null);
    setLoading(false);
    setLoadError('');
  }, () => {
    setLoading(false);
    setLoadError('De afspraakgegevens konden niet worden geladen. Probeer opnieuw.');
  }), [date, time, attempt, markerId]);

  useEffect(() => onSnapshot(collection(db, 'dossiers'), snapshot => {
    setDossiers(snapshot.docs.map(item => ({ ...item.data(), id: item.id })).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'nl')));
    setDossierError('');
  }, () => setDossierError('Dossiers konden niet worden geladen. Een bestaande koppeling blijft behouden.')), []);

  const stored = { ...(bookedSlot || {}), ...(details || {}) };
  const form = draft || contactValues(stored);
  const hasAppointment = !!(bookedSlot || details?.name);
  const linkedDossier = dossiers.find(dossier => dossier.id === stored.dossierId);
  const update = (field, value) => {
    setDraft({ ...form, [field]: value });
    setSaved(false);
    setSaveError('');
    onDirtyChange(true);
  };

  const handleSave = async event => {
    event.preventDefault();
    if (loading || loadError || saving) return;
    if (!form.name.trim() && !form.notes.trim() && !form.dossierId) {
      setSaveError('Vul een naam of notitie in, of koppel een dossier om dit uur te reserveren.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const values = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
    };
    try {
      const bookingId = await saveAppointment({
        date,
        time,
        ...values,
        bookingId: editingBookingId || undefined,
      });
      setDetails(previous => ({ ...(previous || stored), ...values, date, time, bookingId }));
      setDraft(null);
      onDirtyChange(false);
      onSaved({ ...values, date, time, bookingId });
      setSaved(true);
      onModeChange('info');
    } catch (error) {
      setSaveError(!error?.code && error?.message ? error.message : 'Opslaan is niet gelukt. Je ingevulde gegevens blijven staan; probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="agenda-details" aria-label={`Afspraakgegevens ${time}`}>
      <div className="agenda-details-heading">
        <h3>{mode === 'edit' ? (hasAppointment ? 'Afspraak aanpassen' : 'Afspraak toevoegen') : 'Afspraakgegevens'} · {time}{stored.endTime ? `–${stored.endTime}` : ''}</h3>
        <div className="agenda-details-actions">
          {hasAppointment && mode === 'info' && <button className="agenda-text-button" type="button" onClick={() => onModeChange('edit')}>Bewerken</button>}
          <button className="agenda-icon-button" type="button" aria-label="Afspraakgegevens sluiten" onClick={onClose}><X size={17} /></button>
        </div>
      </div>
      {loading && <p role="status">Gegevens laden…</p>}
      {loadError && <div className="agenda-error" role="alert">{loadError} <button type="button" className="agenda-text-button" onClick={() => { setLoading(true); setLoadError(''); setAttempt(value => value + 1); }}>Opnieuw proberen</button></div>}
      {saved && <p className="agenda-success" role="status">De afspraak is opgeslagen.</p>}
      {draft && mode === 'info' && <p className="agenda-hint">Je wijzigingen zijn nog niet opgeslagen. Kies Bewerken om verder te gaan.</p>}

      {mode === 'edit' ? (
        <form onSubmit={handleSave} className="agenda-form">
          <fieldset disabled={loading || !!loadError || saving}>
            <label>Naam<input name="appointmentName" autoComplete="name" value={form.name} onChange={event => update('name', event.target.value)} /></label>
            <div className="agenda-field-pair">
              <label>E-mailadres<input type="email" name="appointmentEmail" autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} /></label>
              <label>Telefoonnummer<input type="tel" name="appointmentPhone" autoComplete="tel" value={form.phone} onChange={event => update('phone', event.target.value)} /></label>
            </div>
            <label>Extra informatie / interne notities<textarea name="appointmentNotes" rows={4} value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="Bijvoorbeeld wat je vooraf wilt weten of bespreken." /></label>
            <p className="agenda-hint">Een naam, notitie of dossierkoppeling is voldoende om het uur te reserveren.</p>
            <label>Bestaand dossier koppelen (optioneel)
              <select name="appointmentDossier" value={form.dossierId} onChange={event => update('dossierId', event.target.value)} disabled={!!dossierError}>
                <option value="">Geen dossier gekoppeld</option>
                {form.dossierId && !dossiers.some(dossier => dossier.id === form.dossierId) && <option value={form.dossierId}>Huidig gekoppeld dossier</option>}
                {dossiers.map(dossier => <option value={dossier.id} key={dossier.id}>{dossier.name || 'Dossier zonder naam'}</option>)}
              </select>
            </label>
            {dossierError && <p className="agenda-hint" role="status">{dossierError}</p>}
            <ReceivedAnswers details={stored} />
            {saveError && <p className="agenda-error" role="alert">{saveError}</p>}
            <div className="agenda-form-actions">
              <button className="agenda-primary" type="submit"><Save size={17} />{saving ? 'Opslaan…' : 'Afspraak opslaan'}</button>
              <button className="agenda-secondary" type="button" onClick={() => { setDraft(null); setSaveError(''); onDirtyChange(false); onModeChange('info'); }}>Annuleren</button>
            </div>
          </fieldset>
        </form>
      ) : !loading && !loadError && (
        hasAppointment ? <>
          <dl className="agenda-contact-details">
            <div><dt>Naam</dt><dd>{stored.name || 'Niet ingevuld'}</dd></div>
            <div><dt>E-mailadres</dt><dd>{stored.email ? <a href={`mailto:${stored.email}`}>{stored.email}</a> : 'Niet ingevuld'}</dd></div>
            <div><dt>Telefoonnummer</dt><dd>{stored.phone ? <a href={`tel:${stored.phone}`}>{stored.phone}</a> : 'Niet ingevuld'}</dd></div>
            <div><dt>Extra informatie / interne notities</dt><dd className="agenda-note">{stored.notes || 'Geen notities'}</dd></div>
          </dl>
          {stored.dossierId && <div className="agenda-dossier-link"><FileText size={17} /><span>{linkedDossier?.name || 'Gekoppeld dossier'}</span>{onOpenDossier && <button className="agenda-text-button" type="button" onClick={() => onOpenDossier(stored.dossierId)}>Dossier openen</button>}</div>}
          <ReceivedAnswers details={stored} />
        </> : <p className="agenda-hint">Er is nog geen afspraak op dit uur. Klik op het plusje om zelf klantgegevens toe te voegen.</p>
      )}
    </section>
  );
}

export const BookingAgendaModal = ({ content, close, onOpenDossier }) => {
  const [date, setDate] = useState(() => localDateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState(null);
  const [mode, setMode] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [availabilityBusy, setAvailabilityBusy] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [appointmentRecords, setAppointmentRecords] = useState([]);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyResult, setCopyResult] = useState(null);
  const [copyError, setCopyError] = useState('');
  const [timeEditor, setTimeEditor] = useState(null);
  const [timeBusy, setTimeBusy] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => onSnapshot(collection(db, 'appointments'), snapshot => {
    setAppointmentRecords(snapshot.docs.map(item => ({ ...item.data(), id: item.id })));
    setAppointmentsError('');
  }, () => setAppointmentsError('Niet alle klantnamen konden worden geladen. De geboekte uren blijven zichtbaar.')), []);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const slots = content.availableSlots || [];
  const bookings = content.bookedSlots || [];
  const hours = [...new Set([...defaultHours, ...slots.filter(slot => slot.date === date).map(slot => slot.time), ...bookings.filter(slot => slot.date === date).map(slot => slot.time), ...(selectedTime ? [selectedTime] : [])])].sort();
  const selectedBooking = bookings.find(slot => slot.date === date && slot.time === selectedTime);
  const selectedSlot = selectedBooking || slots.find(slot => slot.date === date && slot.time === selectedTime);
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const sourceWeek = weekStart(date);
  const upcoming = getUpcomingAppointments(bookings, now).map(marker => ({ ...marker, ...appointmentRecords.find(record => matchesBooking(record, marker)) }));
  const upcomingDates = [...new Set(upcoming.map(booking => booking.date))];
  const today = localDateKey(new Date(now));
  const navigationBusy = !!availabilityBusy || timeBusy;

  const canLeave = () => !navigationBusy && (!dirty || window.confirm('Je hebt niet-opgeslagen wijzigingen. Wil je die verlaten?'));
  const changeMode = nextMode => {
    if (nextMode === 'edit' && mode !== 'edit' && !dirty) {
      setEditingBookingId(selectedBooking ? selectedBooking.bookingId || `${date}_${selectedTime.replace(':', '')}` : null);
    }
    setMode(nextMode);
  };
  const changeDate = value => {
    if (!value || value === date || !canLeave()) return;
    setDate(value);
    setSelectedTime(null);
    setMode(null);
    setDirty(false);
    setAvailabilityError('');
    setTimeEditor(null);
    setCopyError('');
  };
  const selectTime = async time => {
    if (availabilityBusy || timeBusy || (time !== selectedTime && !canLeave())) return;
    if (time !== selectedTime) {
      setSelectedTime(time);
      setMode(null);
      setDirty(false);
      setTimeEditor(null);
    }
    setAvailabilityError('');
    if (bookings.some(slot => slot.date === date && slot.time === time)) return;
    setAvailabilityBusy(time);
    try {
      await setSlotAvailability(date, time, !slots.some(slot => slot.date === date && slot.time === time));
    } catch (error) {
      setAvailabilityError(!error?.code && error?.message ? error.message : 'De beschikbaarheid kon niet worden opgeslagen. Probeer opnieuw.');
    } finally {
      setAvailabilityBusy(null);
    }
  };
  const repeatWeek = async () => {
    if (copyBusy) return;
    setCopyBusy(true);
    setCopyError('');
    try {
      const result = await repeatAvailabilityWeek(sourceWeek);
      setCopyResult({ ...result, sourceWeek });
    } catch (error) {
      setCopyError(!error?.code && error?.message ? error.message : 'De week kon niet worden overgenomen. Probeer opnieuw.');
    } finally {
      setCopyBusy(false);
    }
  };
  const openTimeEditor = existing => {
    if (!canLeave()) return;
    const start = existing ? selectedTime : '09:00';
    const [hour, minute] = start.split(':').map(Number);
    const endMinutes = Math.min(hour * 60 + minute + 60, 1439);
    setTimeEditor({ oldTime: existing && selectedSlot ? selectedTime : null, time: start, endTime: existing && selectedSlot?.endTime ? selectedSlot.endTime : `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`, bookingId: existing && selectedBooking ? selectedBooking.bookingId || getAppointmentId(date, selectedTime) : undefined });
    setTimeError('');
    setMode(null);
    setDirty(false);
  };
  const saveTime = async event => {
    event.preventDefault();
    if (!timeEditor || timeBusy) return;
    const values = new FormData(event.currentTarget);
    const time = String(values.get('time') || '');
    const endTime = String(values.get('endTime') || '');
    setTimeEditor(previous => ({ ...previous, time, endTime }));
    setTimeBusy(true);
    setTimeError('');
    try {
      const savedSlot = await setSlotTime(date, timeEditor.oldTime, time, endTime, timeEditor.bookingId);
      setSelectedTime(savedSlot.time);
      setTimeEditor(null);
    } catch (error) {
      setTimeError(!error?.code && error?.message ? error.message : 'Het tijdslot kon niet worden opgeslagen. Probeer opnieuw.');
    } finally {
      setTimeBusy(false);
    }
  };
  const openAppointment = booking => {
    if (navigationBusy || !canLeave()) return;
    setDate(booking.date);
    setSelectedTime(booking.time);
    setMode('info');
    setDirty(false);
    setTimeEditor(null);
    setAvailabilityError('');
  };
  const requestClose = () => { if (canLeave()) close(); };

  return (
    <div className="agenda-overlay" onClick={requestClose}>
      <div className="agenda-panel" role="dialog" aria-modal="true" aria-labelledby="agenda-title" onClick={event => event.stopPropagation()}>
        <header className="agenda-header"><h2 id="agenda-title"><Calendar size={22} />Agenda beheer</h2><button type="button" className="agenda-icon-button" aria-label="Agenda sluiten" disabled={navigationBusy} onClick={requestClose}><X size={22} /></button></header>
        <div className="agenda-body">
          <div className="agenda-date-navigation">
            <button type="button" className="agenda-icon-button" aria-label="Vorige dag" disabled={navigationBusy} onClick={() => changeDate(addCalendarDays(date, -1))}><ChevronLeft size={22} /></button>
            <label className="agenda-date-label"><span>{dateLabel}</span><input aria-label="Datum kiezen" type="date" value={date} disabled={navigationBusy} onInput={event => changeDate(event.currentTarget.value)} onChange={event => changeDate(event.target.value)} /></label>
            <button type="button" className="agenda-icon-button" aria-label="Volgende dag" disabled={navigationBusy} onClick={() => changeDate(addCalendarDays(date, 1))}><ChevronRight size={22} /></button>
          </div>
          <p className="agenda-hint">Klik op een uur om het beschikbaar te maken of weer uit te zetten. + en ⓘ werken voor het geselecteerde uur.</p>
          <div className="agenda-slot-grid" aria-label="Uren">
            {hours.map(time => {
              const booking = bookings.find(slot => slot.date === date && slot.time === time);
              const availableSlot = slots.find(slot => slot.date === date && slot.time === time);
              const booked = !!booking;
              const available = !!availableSlot;
              const endTime = booking?.endTime || availableSlot?.endTime;
              const selected = selectedTime === time;
              return (
                <div className={`agenda-slot${selected ? ' is-selected' : ''}${booked ? ' is-booked' : available ? ' is-available' : ''}`} key={time}>
                  <button className="agenda-slot-select" type="button" aria-pressed={selected} disabled={!!availabilityBusy || timeBusy} aria-label={`${time}${endTime ? ` tot ${endTime}` : ''}, ${booked ? 'geboekt' : available ? 'beschikbaar' : 'niet beschikbaar'}`} onClick={() => selectTime(time)}><strong>{time}{endTime ? `–${endTime}` : ''}</strong>{booked && <span>Volzet</span>}{availabilityBusy === time && <span>Opslaan…</span>}</button>
                  <div className="agenda-slot-actions">
                    <button className="agenda-icon-button" type="button" disabled={!selected} title={booked ? `Afspraak ${time} bewerken` : `Afspraak ${time} toevoegen`} aria-label={booked ? `Afspraak ${time} bewerken` : `Afspraak ${time} toevoegen`} onClick={() => changeMode('edit')}><Plus size={17} /></button>
                    <button className="agenda-icon-button" type="button" disabled={!selected} title={`Informatie ${time}`} aria-label={`Informatie ${time}`} onClick={() => changeMode('info')}><Info size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {availabilityError && <p className="agenda-error" role="alert">{availabilityError}</p>}
          <div className="agenda-time-actions"><button type="button" className="agenda-text-button" onClick={() => openTimeEditor(false)}>Tijdslot toevoegen</button>{selectedTime && <button type="button" className="agenda-text-button" onClick={() => openTimeEditor(true)}>Uur aanpassen ({selectedTime})</button>}</div>
          {timeEditor && <form className="agenda-time-editor agenda-form" onSubmit={saveTime}>
            <fieldset disabled={timeBusy}>
              <h3>{timeEditor.oldTime ? 'Uur aanpassen' : 'Tijdslot toevoegen'}</h3>
              <div className="agenda-time-pair"><label>Van<input name="time" type="time" step="60" required value={timeEditor.time} onInput={event => setTimeEditor({ ...timeEditor, time: event.currentTarget.value })} onChange={event => setTimeEditor({ ...timeEditor, time: event.target.value })} /></label><label>Tot<input name="endTime" type="time" step="60" required value={timeEditor.endTime} onInput={event => setTimeEditor({ ...timeEditor, endTime: event.currentTarget.value })} onChange={event => setTimeEditor({ ...timeEditor, endTime: event.target.value })} /></label></div>
              {timeError && <p className="agenda-error" role="alert">{timeError}</p>}
              <div className="agenda-form-actions"><button className="agenda-primary" type="submit">{timeBusy ? 'Opslaan…' : 'Tijdslot opslaan'}</button><button className="agenda-secondary" type="button" onClick={() => setTimeEditor(null)}>Annuleren</button></div>
            </fieldset>
          </form>}
          <div className="agenda-week-copy">
            <p>Gekozen week: <strong>{weekCaption(sourceWeek)}</strong></p>
            <button className="agenda-secondary" type="button" disabled={copyBusy} onClick={repeatWeek}>{copyBusy ? 'Week overnemen…' : 'Ook voor volgende week'}</button>
            {copyResult?.sourceWeek === sourceWeek && <p className="agenda-success" role="status">Overgenomen naar {weekCaption(copyResult.targetWeek)}: {copyResult.added} tijdsloten toegevoegd{copyResult.skipped ? `, ${copyResult.skipped} overgeslagen omdat die al bezet of beschikbaar zijn` : ''}. Nogmaals klikken neemt de daaropvolgende week.</p>}
            {copyError && <p className="agenda-error" role="alert">{copyError}</p>}
          </div>
          {selectedTime && mode && <AppointmentDetails key={`${date}-${selectedTime}`} date={date} time={selectedTime} bookedSlot={selectedBooking} editingBookingId={editingBookingId} mode={mode} onModeChange={changeMode} onDirtyChange={setDirty} onSaved={booking => setAppointmentRecords(previous => [...previous.filter(item => item.date !== booking.date || item.time !== booking.time), booking])} onOpenDossier={onOpenDossier ? dossierId => { if (canLeave()) onOpenDossier(dossierId); } : undefined} onClose={() => { if (canLeave()) { setMode(null); setDirty(false); } }} />}
          <section className="agenda-upcoming" aria-label="Geplande afspraken">
            <h3>Komende afspraken</h3>
            {appointmentsError && <p className="agenda-hint" role="status">{appointmentsError}</p>}
            {upcoming.length === 0 ? <p className="agenda-hint">Er zijn geen komende afspraken.</p> : upcomingDates.map(appointmentDate => <div className="agenda-day-group" key={appointmentDate}>
              <h4>{appointmentDate === today ? 'Vandaag' : dateCaption(appointmentDate)}{appointmentDate === date ? ' · Gekozen dag' : ''}</h4>
              <ul>{upcoming.filter(booking => booking.date === appointmentDate).map(booking => <li key={`${booking.date}-${booking.time}`}><button type="button" disabled={navigationBusy} onClick={() => openAppointment(booking)}><span>{booking.time}{booking.endTime ? `–${booking.endTime}` : ''}</span><strong>{booking.name || 'Gereserveerd zonder naam'}</strong><Info size={17} /></button></li>)}</ul>
            </div>)}
          </section>
        </div>
      </div>
    </div>
  );
};
