import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { EditableText, useCMS } from '../cms';
import {
  cleanValue,
  getAvailableSlots,
  isOtherQuestion,
  isQuestionRequired,
  slotValue,
} from './contactFormLogic';
import { submitContactForm } from './contactFormService';
import { getContactValidationState, validationFieldFor } from './contactFormState';
import { adjacentBookingWeek, formatBookingTime, getBookingCalendarWeek } from './bookingCalendar';
import './ContactSection.css';

const fieldId = name => `contact-field-${name}`;
const errorId = name => `${fieldId(name)}-error`;

function FieldError({ name, error }) {
  return error ? <p id={errorId(name)} className="contact-field-error">{error}</p> : null;
}

function RequiredMark({ required, other = false }) {
  if (other) return <span className="contact-optional"> (als jouw antwoord er niet bij staat)</span>;
  return required
    ? <span className="contact-required" aria-label="verplicht"> *</span>
    : <span className="contact-optional"> (optioneel)</span>;
}

function BookingWidget({ question, required, error, availableSlots, bookedSlots, disabled, onValueChange }) {
  const [visibleWeek, setVisibleWeek] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const slots = getAvailableSlots(availableSlots, bookedSlots);
  const week = getBookingCalendarWeek(slots, visibleWeek);
  const dates = [...new Set(week.slots.map(slot => slot.date))];
  const selected = selectedDate && selectedTime ? { date: selectedDate, time: selectedTime } : null;
  const selectionAvailable = selected && slots.some(slot => slotValue(slot) === slotValue(selected));
  const selectedSlot = selected && ((availableSlots || []).find(slot => slotValue(slot) === slotValue(selected)) || selected);
  const selectionOutsideWeek = selected && (selectedDate < week.start || selectedDate > week.end);
  const formatDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' });
  const formatFullDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
  const weekHeadingId = `${fieldId(question.id)}-week`;

  const select = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    onValueChange(question.id, date && time ? slotValue({ date, time }) : '');
  };

  return (
    <fieldset className="form-group full-width contact-question" disabled={disabled} aria-invalid={!!error} aria-describedby={error ? errorId(question.id) : undefined}>
      <legend className="contact-question-title">{question.question}<RequiredMark required={required && slots.length > 0} /></legend>
      <input type="hidden" name={question.id} value={slotValue(selected)} />
      {week.hasAvailableWeeks && <div className="booking-week-header">
        <div id={weekHeadingId} className="booking-week-heading" aria-live="polite" aria-atomic="true">
          <span className="booking-week-label">{week.isCurrent ? 'Deze week' : 'Beschikbare momenten'}</span>
          <strong>{formatFullDate(week.start)} – {formatFullDate(week.end)}</strong>
        </div>
        {(week.canPrevious || week.canLater) && <div className="booking-week-navigation" aria-label="Andere tijdslots bekijken">
          {week.canPrevious && <button type="button" className="booking-choice booking-week-button" onClick={() => setVisibleWeek(adjacentBookingWeek(week, -1))}>Eerdere tijdslots</button>}
          {week.canLater && <button type="button" className="booking-choice booking-week-button" onClick={() => setVisibleWeek(adjacentBookingWeek(week, 1))}>Latere tijdslots</button>}
        </div>}
      </div>}
      {dates.length === 0 ? (
        <div className="booking-week-empty" role="status">
          <p className="contact-form-note">Momenteel zijn er geen vrije momenten in de kalender.</p>
          <p className="contact-form-note">Vermeld gerust je voorkeur in je bericht.</p>
        </div>
      ) : (
        <>
          <div className="booking-dates" role="group" aria-labelledby={weekHeadingId}>
            {dates.map(date => (
              <button key={date} type="button" className="booking-choice" aria-pressed={selectedDate === date} onClick={() => select(selectedDate === date ? '' : date, '')}>
                {formatDate(date)}
              </button>
            ))}
          </div>
          {selectedDate && dates.includes(selectedDate) && (
            <div className="booking-times">
              <span style={{ width: '100%' }}>Kies een uur:</span>
              {week.slots.filter(slot => slot.date === selectedDate).map(slot => (
                <button key={slot.time} type="button" className="booking-choice" aria-pressed={selectedTime === slot.time} onClick={() => select(selectedDate, selectedTime === slot.time ? '' : slot.time)}>
                  {formatBookingTime(slot)}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {selected && (
        <div className="booking-selection-summary" aria-live="polite">
          <p className={selectionAvailable ? 'booking-selected' : 'contact-field-error'}>
            {selectionAvailable && <Check size={18} aria-hidden="true" />}
            {selectionAvailable ? `Geselecteerd: ${formatFullDate(selectedDate)} om ${formatBookingTime(selectedSlot)}.` : `Je gekozen moment (${formatFullDate(selectedDate)} om ${formatBookingTime(selectedSlot)}) is intussen niet meer beschikbaar.`}
          </p>
          {selectionOutsideWeek && <p className="contact-form-note">Je keuze ligt buiten de getoonde week en blijft geselecteerd.</p>}
          <p className="contact-form-note">Je moment wordt pas vastgelegd wanneer je bericht succesvol verzonden is.</p>
          <button type="button" className="booking-choice booking-clear" onClick={() => select('', '')}>Keuze wissen</button>
        </div>
      )}
      <FieldError name={question.id} error={error} />
    </fieldset>
  );
}

export function ContactSection({ setShowPrivacy, RenderBlocks, animations, getSectionStyle, ThemeEffectOverlay, VideoBackground }) {
  const { content } = useCMS();
  const { variants, viewportProps } = animations;
  const formRef = useRef(null);
  const sendingRef = useRef(false);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState({});
  const [formSnapshot, setFormSnapshot] = useState({ entries: [], minute: 0 });
  const [serverError, setServerError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState(null);
  const questions = content.contactQuestions || [];

  const currentFormData = new FormData();
  formSnapshot.entries.forEach(([name, value]) => currentFormData.append(name, value));
  const { canSubmit, errors } = getContactValidationState({
    formData: currentFormData,
    questions,
    availableSlots: content.availableSlots,
    bookedSlots: content.bookedSlots,
    touched,
    attempted,
    serverError,
  });

  // Keep native inputs uncontrolled so browser autofill and history restoration
  // work normally. Snapshot reads do not rerender unchanged form values.
  const readFormValues = useCallback((name, value) => {
    if (!formRef.current || sendingRef.current) return null;
    const formData = new FormData(formRef.current);
    if (name) formData.set(name, value);
    const entries = [...formData.entries()];
    const minute = Math.floor(Date.now() / 60000);
    setFormSnapshot(previous => previous.minute === minute && JSON.stringify(previous.entries) === JSON.stringify(entries) ? previous : { entries, minute });
    return formData;
  }, []);

  useEffect(() => {
    if (sent) return;
    const synchronize = () => readFormValues();
    // Some autofill providers update DOM values without dispatching input/change.
    // Also re-evaluate once a minute when a displayed slot passes its start time.
    const initialRead = window.setTimeout(synchronize, 0);
    const autofillCheck = window.setInterval(synchronize, 500);
    window.addEventListener('pageshow', synchronize);
    window.addEventListener('focus', synchronize);
    return () => {
      window.clearTimeout(initialRead);
      window.clearInterval(autofillCheck);
      window.removeEventListener('pageshow', synchronize);
      window.removeEventListener('focus', synchronize);
    };
  }, [readFormValues, sent]);

  const markTouched = name => {
    if (!name) return;
    const field = validationFieldFor(name, questions);
    setTouched(previous => previous[field] ? previous : { ...previous, [field]: true });
  };

  const handleFieldChange = event => {
    if (sendingRef.current) return;
    readFormValues();
    if (['checkbox', 'radio'].includes(event.target.type)) markTouched(event.target.name);
    setStatus(null);
  };

  const handleBookingChange = (name, value) => {
    readFormValues(name, value);
    markTouched(name);
    setServerError(null);
    setStatus(null);
  };

  const focusError = () => requestAnimationFrame(() => {
    const first = formRef.current?.querySelector('[aria-invalid="true"]');
    const target = first?.matches('fieldset') ? first.querySelector('input:not([type="hidden"]), button') : first;
    target?.focus();
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  const handleSubmit = async event => {
    event.preventDefault();
    if (sendingRef.current || sent) return;
    setAttempted(true);
    const formData = readFormValues();
    if (!formData) return;
    const nextErrors = getContactValidationState({ formData, questions, availableSlots: content.availableSlots, bookedSlots: content.bookedSlots, attempted: true, serverError }).errors;
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: 'error', text: 'Vul de rood gemarkeerde velden in voordat je je bericht verstuurt.' });
      focusError();
      return;
    }
    if (!cleanValue(formData.get('access_key'))) {
      setStatus({ type: 'error', text: 'Het contactformulier is nog niet ingesteld. Neem rechtstreeks contact op via de contactgegevens op deze website.' });
      return;
    }
    // Normalize text without dropping multiple checkbox answers.
    for (const name of new Set(formData.keys())) {
      const values = formData.getAll(name);
      if (values.length === 1 && typeof values[0] === 'string') formData.set(name, values[0].trim());
    }
    sendingRef.current = true;
    setSending(true);
    setStatus({ type: 'pending', text: 'Je bericht wordt verstuurd…' });
    try {
      const result = await submitContactForm(formData, questions);
      setSent(true);
      setStatus(result.bookingFailed
        ? { type: 'warning', text: 'Je bericht is verzonden, maar je gekozen moment kon niet worden vastgelegd. Lindsay ontving je voorkeur en kan samen met jou een moment afspreken. Je hoeft je bericht niet opnieuw te versturen.' }
        : { type: 'success', text: result.booked ? 'Bedankt! Je bericht is verzonden en je gekozen moment is vastgelegd.' : 'Bedankt! Je bericht is succesvol verzonden.' });
    } catch (error) {
      if (error.questionId) {
        setServerError({ name: error.questionId, value: formData.get(error.questionId), message: error.message });
        setStatus({ type: 'error', text: 'Je bericht is nog niet verzonden. Controleer je gekozen moment.' });
        focusError();
      } else {
        setStatus({ type: 'error', text: 'We konden niet bevestigen dat je bericht is verzonden. Er is geen moment vastgelegd. Controleer je verbinding en probeer opnieuw.' });
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const inputProps = name => ({
    id: fieldId(name),
    name,
    disabled: sending,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? errorId(name) : undefined,
  });

  return (
    <section id="contact" className="contact section-padding" style={getSectionStyle('contact', content, { backgroundImage: `url(${content.contactImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative', overflow: 'hidden' })}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(250, 250, 247, 0.6)' }} />
      <ThemeEffectOverlay sectionId="contact" content={content} />
      <VideoBackground url={content.customBgVideo_contact} invert={content.invertVideo_contact} />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div className="contact-container" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.fadeUp}>
          <h2><EditableText fieldKey="contactTitle" /></h2>
          <div style={{ marginBottom: '1rem' }}><EditableText fieldKey="contactSubtitle" /></div>
          {sent ? (
            <div className={`contact-status contact-status-${status.type}`} role="status">{status.text}</div>
          ) : (
            <form ref={formRef} className="contact-form" action="https://api.web3forms.com/submit" method="POST" noValidate onSubmit={handleSubmit} onInput={handleFieldChange} onChange={handleFieldChange} onBlur={event => { readFormValues(); markTouched(event.target.name); }} aria-busy={sending}>
              <input type="hidden" name="access_key" value={content.web3formsKey || ''} />
              <input type="hidden" name="subject" value="Nieuw bericht via de coaching website!" />
              <p className="full-width contact-form-note">Velden met een <span className="contact-required">*</span> zijn verplicht. Vraag 3 en 4 zijn optioneel.</p>
              {[
                { name: 'name', label: 'Naam', type: 'text', autoComplete: 'name' },
                { name: 'email', label: 'E-mailadres', type: 'email', autoComplete: 'email' },
                { name: 'phone', label: 'Telefoonnummer', type: 'tel', autoComplete: 'tel' },
              ].map(field => (
                <div key={field.name} className={`form-group${field.name === 'phone' ? ' full-width' : ''}`}>
                  <label htmlFor={fieldId(field.name)} className="contact-label">{field.label}<RequiredMark required /></label>
                  <input {...inputProps(field.name)} type={field.type} autoComplete={field.autoComplete} placeholder={field.label} required />
                  <FieldError name={field.name} error={errors[field.name]} />
                </div>
              ))}
              {questions.map(question => {
                if (!question?.question) return null;
                const required = isQuestionRequired(question, questions);
                if (question.type === 'booking') {
                  return <BookingWidget key={question.id} question={question} required={required} error={errors[question.id]} availableSlots={content.availableSlots} bookedSlots={content.bookedSlots} disabled={sending} onValueChange={handleBookingChange} />;
                }
                if (question.type === 'checkbox' || question.type === 'radio') {
                  const options = (question.options || '').split(',').map(option => option.trim()).filter(Boolean);
                  return (
                    <fieldset key={question.id} className="form-group full-width contact-question" disabled={sending} aria-invalid={!!errors[question.id]} aria-describedby={errors[question.id] ? errorId(question.id) : undefined}>
                      <legend className="contact-question-title">{question.question}<RequiredMark required={required} /></legend>
                      <div className="contact-options">
                        {options.map((option, index) => (
                          <label key={index} className="contact-option">
                            <input type={question.type} name={question.type === 'checkbox' ? `${question.id}[]` : question.id} value={option} />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      <FieldError name={question.id} error={errors[question.id]} />
                    </fieldset>
                  );
                }
                return (
                  <div key={question.id} className="form-group full-width">
                    <label htmlFor={fieldId(question.id)} className="contact-label">{question.question}<RequiredMark required={required} other={isOtherQuestion(question, questions)} /></label>
                    <input {...inputProps(question.id)} type="text" placeholder="Jouw antwoord" required={required} />
                    <FieldError name={question.id} error={errors[question.id]} />
                  </div>
                );
              })}
              <div className="form-group full-width">
                <label htmlFor={fieldId('message')} className="contact-label">Jouw bericht<RequiredMark required /></label>
                <textarea {...inputProps('message')} placeholder="Jouw bericht" required />
                <FieldError name="message" error={errors.message} />
              </div>
              {status && <div className={`full-width contact-status contact-status-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</div>}
              <div className="full-width" style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button type="submit" className="btn contact-submit" disabled={sending || !canSubmit} aria-describedby="contact-submit-help">{sending ? 'Bezig met versturen…' : <EditableText fieldKey="contactSubmitBtnText" />}</button>
                <p id="contact-submit-help" className="contact-form-note contact-submit-help">De knop wordt actief zodra alle verplichte velden correct zijn ingevuld.</p>
                {content.privacyDisclaimer && (
                  <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#666' }}>
                    Jouw gegevens worden vertrouwelijk behandeld en nooit gedeeld met derden.{' '}
                    <button type="button" onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>Privacybeleid</button>
                  </div>
                )}
              </div>
            </form>
          )}
        </motion.div>
        <RenderBlocks blocks={content.customBlocks_contact} />
      </div>
    </section>
  );
}
