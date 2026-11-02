const EVENTS = [
  { id: 'jazz', name: 'Jazz Night', venue: 'Astana Opera',
    from: '2026-11-20', to: '2026-11-30', soldOut: ['2026-11-21', '2026-11-28'] },
  { id: 'tech', name: 'Tech Conference', venue: 'EXPO Congress Center',
    from: '2026-12-05', to: '2026-12-07', soldOut: ['2026-12-06'] },
  { id: 'film', name: 'Film Festival', venue: 'Kinopark Keruen',
    from: '2026-11-15', to: '2026-12-20', soldOut: ['2026-12-01', '2026-12-02'] },
];

const TICKET_TYPES = [
  { id: 'standard', name: 'Standard', price: 5000, seatsLeft: 40 },
  { id: 'vip', name: 'VIP', price: 12000, seatsLeft: 3 },
  { id: 'student', name: 'Student', price: 3000, seatsLeft: 10 },
];

const PROMO_CODES = [
  { code: 'AITU20', discount: 20, onlyType: null },
  { code: 'WINTER10', discount: 10, onlyType: null },
  { code: 'STUDENT50', discount: 50, onlyType: 'student' },
];
 
const MAX_PER_ORDER = 10;
const CURRENCY = '₸';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

const NAME_PATTERN = /^[\p{L}'-]{2,}(\s+[\p{L}'-]{2,})+$/u;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
 
const form = document.getElementById('ticket-form');
const fields = {
  event: document.getElementById('event'),
  date: document.getElementById('date'),
  type: document.getElementById('type'),
  quantity: document.getElementById('quantity'),
  promo: document.getElementById('promo'),
  name: document.getElementById('name'),
  email: document.getElementById('email'),
};
const FIELD_NAMES = Object.keys(fields); 
 
const dateHint = document.getElementById('date-hint');
const errorSummary = document.getElementById('error-summary');
const preview = document.getElementById('preview');
const result = document.getElementById('result');
const resultTitle = document.getElementById('result-title');
const resultTicket = document.getElementById('result-ticket');
 
const DEPENDENT_FIELDS = {
  event: ['date'],
  type: ['quantity', 'promo'],
};

let touched = {};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
function generateBookingCode() {
  let code = 'TK-';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[randomInt(0, CODE_CHARS.length - 1)];
  }
  return code;
}

function formatDate(value) {
  const date = new Date(value + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
 
function getEvent() {
  return EVENTS.find((event) => event.id === fields.event.value) || null;
}
 
function getType() {
  return TICKET_TYPES.find((type) => type.id === fields.type.value) || null;
}
 
function getTypeName(id) {
  const type = TICKET_TYPES.find((item) => item.id === id);
  return type ? type.name : id;
}
 
function findPromo(text) {
  const code = text.trim().toUpperCase();
  return PROMO_CODES.find((promo) => promo.code === code) || null;
}
const rules = {
  event(field) {
    if (field.validity.valueMissing) {
      return 'Choose an event.';
    }
    return '';
  },
 
  date(field) {
    const value = field.value;
    if (field.validity.valueMissing || field.validity.badInput) {
      return 'Choose a date.';
    }
    const event = getEvent();
    if (event === null) {
      return 'Choose an event first.';
    }
    if (value < todayString()) {
      return 'This date is in the past.';
    }
    if (value < event.from || value > event.to) {
      return `${event.name} runs from ${formatDate(event.from)} to ${formatDate(event.to)}.`;
    }
    if (event.soldOut.includes(value)) {
      return `${formatDate(value)} is sold out. Choose another date.`;
    }
    return '';
  },
 
  type(field) {
    if (field.validity.valueMissing) {
      return 'Choose a ticket type.';
    }
    const type = getType();
    if (type !== null && type.seatsLeft === 0) {
      return `${type.name} tickets are sold out.`;
    }
    return '';
  },
 
  quantity(field) {
    if (field.validity.valueMissing || field.validity.badInput) {
      return 'Enter the number of tickets.';
    }
    const quantity = Number(field.value);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return 'Enter a whole number, 1 or more.';
    }
    if (quantity > MAX_PER_ORDER) {
      return `You can buy at most ${MAX_PER_ORDER} tickets in one order.`;
    }
    const type = getType();
    if (type !== null && quantity > type.seatsLeft) {
      return `Only ${type.seatsLeft} ${type.name} ticket(s) left.`;
    }
    return '';
  },
 
  promo(field) {
    const value = field.value.trim();
    if (value === '') {
      return ''; 
    }
    const promo = findPromo(value);
    if (promo === null) {
      return 'This promo code does not exist.';
    }
    const type = getType();
    if (promo.onlyType !== null && (type === null || type.id !== promo.onlyType)) {
      return `${promo.code} works only for ${getTypeName(promo.onlyType)} tickets.`;
    }
    return '';
  },
 
  name(field) {
    const value = field.value.trim();
    if (value === '') {
      return 'Enter your full name.';
    }
    if (!NAME_PATTERN.test(value)) {
      return 'Enter first and last name, letters only (e.g. Aliya Bekova).';
    }
    return '';
  },
 
  email(field) {
    const value = field.value.trim();
    if (value === '') {
      return 'Enter your email.';
    }
    if (field.validity.typeMismatch || !EMAIL_PATTERN.test(value)) {
      return 'Enter a valid email, e.g. name@mail.com.';
    }
    return '';
  },
};
 
function checkField(name) {
  const field = fields[name];
  const message = rules[name](field);
  const hasError = message !== '';
 
  field.setCustomValidity(message); 
  document.getElementById(`${name}-error`).textContent = message;
  field.setAttribute('aria-invalid', String(hasError));
  field.classList.toggle('is-invalid', hasError);
  field.classList.toggle('is-valid', !hasError && field.value.trim() !== '');
  return !hasError;
}
 
function clearField(name) {
  const field = fields[name];
  field.setCustomValidity('');
  document.getElementById(`${name}-error`).textContent = '';
  field.removeAttribute('aria-invalid');
  field.classList.remove('is-invalid', 'is-valid');
}
 
function showSummary(count) {
  if (count === 0) {
    errorSummary.classList.add('is-hidden');
    return;
  }
  errorSummary.textContent = count === 1
    ? 'Please fix 1 error in the form.'
    : `Please fix ${count} errors in the form.`;
  errorSummary.classList.remove('is-hidden');
}
 
function calculatePrice() {
  const type = getType();
  const quantity = Number(fields.quantity.value);
  if (type === null || !Number.isInteger(quantity) || quantity < 1) {
    return null;
  }
  const subtotal = type.price * quantity;
  let percent = 0;
  const promoText = fields.promo.value.trim();
  if (promoText !== '' && rules.promo(fields.promo) === '') {
    percent = findPromo(promoText).discount;
  }
  const discount = Math.round(subtotal * percent / 100);
  return { subtotal, percent, discount, total: subtotal - discount };
}
 
function getTicketData() {
  const event = getEvent();
  const type = getType();
  return {
    eventName: event ? event.name : 'Choose an event',
    venue: event ? event.venue : 'Venue',
    date: fields.date.value ? formatDate(fields.date.value) : '—',
    typeName: type ? type.name : '—',
    quantity: fields.quantity.value || '—',
    name: fields.name.value.trim() || '—',
    email: fields.email.value.trim() || '—',
    price: calculatePrice(),
  };
}
 
function addDetail(list, label, value) {
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  list.append(term, description);
}
 
function createTicketElement(data, code) {
  const ticket = document.createElement('article');
  ticket.className = 'ticket';
  ticket.classList.toggle('ticket--booked', code !== null);
 
  const title = document.createElement('h3');
  title.className = 'ticket__title';
  title.textContent = data.eventName;
 
  const venue = document.createElement('p');
  venue.className = 'ticket__venue';
  venue.textContent = data.venue;
 
  const details = document.createElement('dl');
  details.className = 'ticket__details';
  addDetail(details, 'Date', data.date);
  addDetail(details, 'Type', data.typeName);
  addDetail(details, 'Qty', data.quantity);
  addDetail(details, 'Name', data.name);
  addDetail(details, 'Email', data.email);
 
  const footer = document.createElement('div');
  footer.className = 'ticket__footer';
 
  const priceBox = document.createElement('div');
  const total = document.createElement('p');
  total.className = 'ticket__total';
  total.textContent = data.price ? `${data.price.total} ${CURRENCY}` : `— ${CURRENCY}`;
  priceBox.append(total);
  if (data.price && data.price.discount > 0) {
    const discount = document.createElement('p');
    discount.className = 'ticket__discount';
    discount.textContent = `−${data.price.percent}% (was ${data.price.subtotal} ${CURRENCY})`;
    priceBox.append(discount);
  }
 
  const codeEl = document.createElement('p');
  codeEl.className = 'ticket__code';
  codeEl.textContent = code !== null ? code : 'TK-??????';
 
  footer.append(priceBox, codeEl);
  ticket.append(title, venue, details, footer);
  return ticket;
}
 
function updatePreview() {
  preview.replaceChildren(createTicketElement(getTicketData(), null));
}
function createOption(value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
}
 
function fillEventOptions() {
  fields.event.replaceChildren(createOption('', 'Choose an event'));
  for (const event of EVENTS) {
    fields.event.append(createOption(event.id, `${event.name} — ${event.venue}`));
  }
}
 
function fillTypeOptions() {
  const current = fields.type.value;
  fields.type.replaceChildren(createOption('', 'Choose a ticket type'));
  for (const type of TICKET_TYPES) {
    const text = type.seatsLeft > 0
      ? `${type.name} — ${type.price} ${CURRENCY} (${type.seatsLeft} left)`
      : `${type.name} — sold out`;
    fields.type.append(createOption(type.id, text));
  }
  fields.type.value = current;
}
 
function updateDateLimits() {
  const event = getEvent();
  if (event === null) {
    fields.date.removeAttribute('min');
    fields.date.removeAttribute('max');
    dateHint.textContent = 'Choose an event to see its dates.';
    return;
  }
  fields.date.min = event.from;
  fields.date.max = event.to;
  const soldOut = event.soldOut.length > 0 ? event.soldOut.map(formatDate).join(', ') : 'none';
  dateHint.textContent = `${formatDate(event.from)} – ${formatDate(event.to)}. Sold out: ${soldOut}.`;
}
function handleChange(name) {
  if (touched[name]) {
    checkField(name);
  }
  const dependents = DEPENDENT_FIELDS[name] || [];
  for (const other of dependents) {
    if (touched[other]) {
      checkField(other);
    }
  }
  if (name === 'event') {
    updateDateLimits();
  }
  if (!errorSummary.classList.contains('is-hidden')) {
    showSummary(form.querySelectorAll(':invalid').length);
  }
  updatePreview();
}
 
for (const name of FIELD_NAMES) {
  const field = fields[name];
  field.addEventListener('blur', () => {
    touched[name] = true;
    checkField(name);
  });
  field.addEventListener('input', () => handleChange(name));
  field.addEventListener('change', () => handleChange(name));
}
 
function resetForm() {
  form.reset();
  touched = {};
  for (const name of FIELD_NAMES) {
    clearField(name);
  }
  fillTypeOptions();
  updateDateLimits();
  updatePreview();
}
 
form.addEventListener('submit', (event) => {
  event.preventDefault();
 
  for (const name of FIELD_NAMES) {
    touched[name] = true;
    checkField(name);
  }
 
  if (!form.checkValidity()) {
    const invalidFields = form.querySelectorAll(':invalid');
    showSummary(invalidFields.length);
    invalidFields[0].focus();
    return;
  }
 
  showSummary(0);
  const data = getTicketData();
  getType().seatsLeft -= Number(fields.quantity.value);
  resultTicket.replaceChildren(createTicketElement(data, generateBookingCode()));
  result.classList.remove('is-hidden');
 
  resetForm();
  resultTitle.focus();
});
 
form.noValidate = true;
fields.quantity.max = MAX_PER_ORDER;
fillEventOptions();
fillTypeOptions();
updateDateLimits();
updatePreview();