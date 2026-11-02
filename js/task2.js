const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const SEATS_PER_ROW = 10;
const MAX_SELECTED = 6;
const CURRENCY = '₸';
 
const ZONES = {
  front: { name: 'Front', price: 1500 },
  standard: { name: 'Standard', price: 2500 },
  vip: { name: 'VIP', price: 4000 },
};
 
const ROW_ZONES = ['front', 'front', 'standard', 'standard', 'standard', 'vip', 'vip'];

const TAKEN_AT_START = ['A4', 'A5', 'B1', 'B10', 'C5', 'C6', 'D2', 'D9',
  'E4', 'E5', 'E6', 'F3', 'F8', 'G5', 'G6'];
 
const hallEl = document.getElementById('hall');
const hallEmpty = document.getElementById('hall-empty');
const legendEl = document.getElementById('legend');
const zoneFilter = document.getElementById('zone-filter');
const searchInput = document.getElementById('seat-search');
const selectedCountEl = document.getElementById('selected-count');
const selectedList = document.getElementById('selected-list');
const selectedEmpty = document.getElementById('selected-empty');
const totalEl = document.getElementById('total');
const bestCountInput = document.getElementById('best-count');
const bestBtn = document.getElementById('best-btn');
const message = document.getElementById('message');
const bookBtn = document.getElementById('book-btn');
const clearBtn = document.getElementById('clear-btn');
const resetBtn = document.getElementById('reset-btn');
 
function createHall() {
  const hall = [];
  for (let r = 0; r < ROW_LETTERS.length; r++) {
    const zoneKey = ROW_ZONES[r] || 'standard';
    const row = [];
    for (let c = 0; c < SEATS_PER_ROW; c++) {
      const id = ROW_LETTERS[r] + (c + 1);
      row.push({
        id: id,
        zone: zoneKey,
        price: ZONES[zoneKey].price,
        taken: TAKEN_AT_START.includes(id),
        selected: false,
        position: { row: r, col: c },
      });
    }
    hall.push(row);
  }
  return hall;
}
 
let hall = createHall();
 
function findSeat(id) {
  for (const row of hall) {
    for (const seat of row) {
      if (seat.id === id) {
        return seat;
      }
    }
  }
  return null;
}
 
function getSelectedSeats() {
  const result = [];
  for (const row of hall) {
    for (const seat of row) {
      if (seat.selected) {
        result.push(seat);
      }
    }
  }
  return result;
}
 
function calculateTotal(seats) {
  let total = 0;
  for (let i = 0; i < seats.length; i++) {
    total += seats[i].price;
  }
  return total;
}
 
function countFree(zoneKey) {
  let count = 0;
  for (const row of hall) {
    for (const seat of row) {
      if (seat.zone === zoneKey && !seat.taken) {
        count++;
      }
    }
  }
  return count;
}
 
function matchesFilter(seat) {
  const zone = zoneFilter.value;
  const query = searchInput.value.trim().toUpperCase();
  const zoneOk = zone === 'all' || seat.zone === zone;
  const searchOk = query === '' || seat.id.startsWith(query);
  return zoneOk && searchOk;
}
 
function showMessage(text, type) {
  message.textContent = text;
  message.classList.remove('message--error', 'message--info', 'message--success');
  if (text !== '') {
    message.classList.add(`message--${type}`);
  }
}
 
function createSeatButton(seat) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `seat seat--${seat.zone}`;
  button.dataset.id = seat.id;
  button.textContent = seat.position.col + 1;
 
  const visible = matchesFilter(seat) || seat.selected;
  button.classList.toggle('seat--taken', seat.taken);
  button.classList.toggle('seat--selected', seat.selected);
  button.classList.toggle('seat--dimmed', !visible);
  button.disabled = !visible;
  button.setAttribute('aria-pressed', String(seat.selected));
 
  let status = 'free';
  if (seat.taken) {
    status = 'taken';
  } else if (seat.selected) {
    status = 'selected';
  }
  button.setAttribute('aria-label',
    `Seat ${seat.id}, ${ZONES[seat.zone].name}, ${seat.price} ${CURRENCY}, ${status}`);
  return button;
}
 
function createLegendItem(className, text) {
  const item = document.createElement('li');
  const swatch = document.createElement('span');
  swatch.className = `swatch ${className}`;
  item.append(swatch, text);
  return item;
}
 
function render() {
  hallEl.replaceChildren();
  let matchCount = 0;
  for (const row of hall) {
    const rowEl = document.createElement('div');
    rowEl.className = 'hall-row';
 
    const label = document.createElement('span');
    label.className = 'row-label';
    label.textContent = ROW_LETTERS[row[0].position.row];
    rowEl.append(label);
 
    for (const seat of row) {
      if (matchesFilter(seat)) {
        matchCount++;
      }
      rowEl.append(createSeatButton(seat));
    }
    hallEl.append(rowEl);
  }
  hallEmpty.classList.toggle('is-hidden', matchCount > 0);
 
  legendEl.replaceChildren();
  for (const key in ZONES) {
    const text = `${ZONES[key].name} · ${ZONES[key].price} ${CURRENCY} · ${countFree(key)} free`;
    legendEl.append(createLegendItem(`swatch--${key}`, text));
  }
  legendEl.append(createLegendItem('swatch--selected', 'Selected'));
  legendEl.append(createLegendItem('swatch--taken', 'Taken'));
 
  const selected = getSelectedSeats();
  selectedCountEl.textContent = `${selected.length} / ${MAX_SELECTED}`;
  selectedList.replaceChildren();
  for (const seat of selected) {
    const chip = document.createElement('li');
    chip.className = 'chip';
    chip.textContent = `${seat.id} · ${seat.price} ${CURRENCY}`;
    selectedList.append(chip);
  }
  selectedEmpty.classList.toggle('is-hidden', selected.length > 0);
  totalEl.textContent = `${calculateTotal(selected)} ${CURRENCY}`;
 
  bookBtn.disabled = selected.length === 0;
  clearBtn.disabled = selected.length === 0;
}
 
function toggleSeat(id) {
  const seat = findSeat(id);
  if (seat === null) {
    return;
  }
  if (seat.taken) {
    showMessage(`Seat ${seat.id} is already taken.`, 'error');
    return;
  }
  if (!seat.selected && getSelectedSeats().length >= MAX_SELECTED) {
    showMessage(`You can select at most ${MAX_SELECTED} seats.`, 'error');
    return;
  }
  seat.selected = !seat.selected;
  showMessage(`Seat ${seat.id} ${seat.selected ? 'selected' : 'removed'}.`, 'info');
  render();
}
 
function clearSelection() {
  for (const row of hall) {
    for (const seat of row) {
      seat.selected = false;
    }
  }
}
 
function findBestSeats(count) {
  const centerRow = (hall.length - 1) / 2;
  const centerCol = (SEATS_PER_ROW - 1) / 2;
  let best = null;
  let bestScore = Infinity;
 
  for (let r = 0; r < hall.length; r++) {
    for (let start = 0; start + count <= hall[r].length; start++) {
      const block = hall[r].slice(start, start + count);
 
      let allFree = true;
      for (const seat of block) {
        if (seat.taken || !matchesFilter(seat)) {
          allFree = false;
          break;
        }
      }
      if (!allFree) {
        continue;
      }
 
      const blockCenter = start + (count - 1) / 2;
      const score = Math.abs(r - centerRow) + Math.abs(blockCenter - centerCol);
      if (score < bestScore) {
        bestScore = score;
        best = block;
      }
    }
  }
  return best;
}
 
function selectBestSeats() {
  const count = Number(bestCountInput.value);
  if (!Number.isInteger(count) || count < 1 || count > MAX_SELECTED) {
    showMessage(`Enter a number of seats from 1 to ${MAX_SELECTED}.`, 'error');
    return;
  }
  const block = findBestSeats(count);
  if (block === null) {
    showMessage(`There are no ${count} free seats together for this filter.`, 'error');
    return;
  }
  clearSelection();
  const ids = [];
  for (const seat of block) {
    seat.selected = true;
    ids.push(seat.id);
  }
  showMessage(`Best seats: ${ids.join(', ')}.`, 'success');
  render();
}
 
function bookSeats() {
  const selected = getSelectedSeats();
  if (selected.length === 0) {
    showMessage('Select at least one seat first.', 'error');
    return;
  }
  const total = calculateTotal(selected);
  const ids = [];
  for (const seat of selected) {
    seat.taken = true;
    seat.selected = false;
    ids.push(seat.id);
  }
  showMessage(`Booked ${ids.join(', ')}. Total ${total} ${CURRENCY}.`, 'success');
  render();
}
 
hallEl.addEventListener('click', (event) => {
  const button = event.target.closest('.seat');
  if (button === null) {
    return;
  }
  toggleSeat(button.dataset.id);
});
 
zoneFilter.addEventListener('change', render);
searchInput.addEventListener('input', render);
bestBtn.addEventListener('click', selectBestSeats);
bookBtn.addEventListener('click', bookSeats);
 
clearBtn.addEventListener('click', () => {
  clearSelection();
  showMessage('Selection cleared.', 'info');
  render();
});
 
resetBtn.addEventListener('click', () => {
  hall = createHall();
  showMessage('The hall is reset.', 'info');
  render();
});
 
function fillZoneFilter() {
  for (const key in ZONES) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${ZONES[key].name} — ${ZONES[key].price} ${CURRENCY}`;
    zoneFilter.append(option);
  }
}
 
bestCountInput.max = MAX_SELECTED;
fillZoneFilter();
render();
