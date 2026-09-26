import { otherQuestionFor, validateContactForm } from './contactFormLogic.js';

export function validationFieldFor(name, questions = []) {
  const field = name.replace(/\[\]$/, '');
  const parent = questions.find(question => ['checkbox', 'radio'].includes(question?.type) && otherQuestionFor(question, questions)?.id === field);
  return parent?.id || field;
}

export function getContactValidationState({ formData, questions, availableSlots, bookedSlots, touched = {}, attempted = false, serverError, now }) {
  const allErrors = validateContactForm(formData, questions, availableSlots, bookedSlots, now);
  if (serverError && formData.get(serverError.name) === serverError.value) {
    allErrors[serverError.name] = serverError.message;
  }
  return {
    canSubmit: Object.keys(allErrors).length === 0,
    errors: Object.fromEntries(Object.entries(allErrors).filter(([name]) => attempted || touched[name])),
  };
}
