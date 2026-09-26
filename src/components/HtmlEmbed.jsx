import { useId, useMemo } from 'react';
import './HtmlEmbed.css';

const fieldDetails = {
  name: { label: 'Naam', placeholder: 'Jouw volledige naam', autocomplete: 'name' },
  email: { label: 'E-mailadres', placeholder: 'jij@voorbeeld.be', autocomplete: 'email' },
  message: { label: 'Bericht', placeholder: 'Schrijf hier je bericht' },
  phone: { label: 'Telefoonnummer', placeholder: 'Jouw telefoonnummer', autocomplete: 'tel' },
};

// Fill in the missing presentation of a basic pasted form without changing its
// submission settings, validation rules, hidden fields or existing labels.
function enhanceEmbeddedForms(html, idPrefix) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  let fieldIndex = 0;

  document.querySelectorAll('form').forEach(form => {
    form.querySelectorAll('input, textarea').forEach(field => {
      const type = field.getAttribute('type')?.toLowerCase() || 'text';
      if (field.hidden || field.closest('[hidden]') || ['hidden', 'checkbox', 'radio', 'submit', 'reset', 'button', 'image', 'file'].includes(type)) return;

      const name = field.getAttribute('name')?.toLowerCase();
      const details = fieldDetails[name] || (type === 'email' ? fieldDetails.email : type === 'tel' ? fieldDetails.phone : null);
      if (!details) return;

      if (!field.labels?.length && !field.getAttribute('aria-labelledby')) {
        if (!field.id) field.id = `${idPrefix}-field-${fieldIndex++}`;
        const label = document.createElement('label');
        label.htmlFor = field.id;
        label.className = 'embedded-form-label';
        label.textContent = `${field.getAttribute('aria-label') || details.label}${field.required ? ' *' : ''}`;
        field.before(label);
      }
      if (!field.hasAttribute('placeholder')) field.setAttribute('placeholder', details.placeholder);
      if (details.autocomplete && !field.hasAttribute('autocomplete')) field.setAttribute('autocomplete', details.autocomplete);
      if (field.tagName === 'TEXTAREA' && !field.hasAttribute('rows')) field.setAttribute('rows', '4');
    });

    form.querySelectorAll('button, input[type="submit"]').forEach(button => {
      const type = button.getAttribute('type')?.toLowerCase();
      if (type && type !== 'submit') return;
      const isInput = button.tagName === 'INPUT';
      const caption = (isInput ? button.value : button.textContent).trim();
      // Keep custom captions and button contents; translate the stock sample.
      if (!caption || /^(submit form|submit)$/i.test(caption)) {
        if (isInput) button.value = 'Verzenden';
        else if (!button.children.length) button.textContent = 'Verzenden';
      }
    });
  });

  return document.head.innerHTML + document.body.innerHTML;
}

export const HtmlEmbed = ({ html }) => {
  const id = useId();
  const enhancedHtml = useMemo(() => enhanceEmbeddedForms(html, `embedded-${id}`), [html, id]);

  return <div className="embedded-form-content" dangerouslySetInnerHTML={{ __html: enhancedHtml }} />;
};
