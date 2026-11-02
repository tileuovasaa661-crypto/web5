const CODE_LENGTH = 4;   
const MAX_ATTEMPTS = 8;  
const MIN_DIGIT = 0;    
const MAX_DIGIT = 9;    
 
const gamePanel = document.getElementById('game-panel');
const secretEl = document.getElementById('secret');
const attemptsLeftEl = document.getElementById('attempts-left');
const pipsEl = document.getElementById('attempt-pips');
const form = document.getElementById('guess-form');
const input = document.getElementById('guess-input');
const guessBtn = document.getElementById('guess-btn');
const message = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');
const historyBody = document.getElementById('history-body');
const historyEmpty = document.getElementById('history-empty');
 
let secretCode = [];   
let attemptsUsed = 0;
let guesses = [];     
let gameOver = false;
 
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
function generateCode() {
  const code = [];
  while (code.length < CODE_LENGTH) {
    const digit = randomInt(MIN_DIGIT, MAX_DIGIT);
    if (!code.includes(digit)) {
      code.push(digit);
    }
  }
  return code;
}

function validateGuess(text) {
  if (gameOver) {
    return 'The game is over. Press "New game" to play again.';
  }
  if (text.length !== CODE_LENGTH) {
    return `Enter exactly ${CODE_LENGTH} digits.`;
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch < '0' || ch > '9') {
      return 'Use digits only.';
    }
    const digit = Number(ch);
    if (digit < MIN_DIGIT || digit > MAX_DIGIT) {
      return `Digits must be from ${MIN_DIGIT} to ${MAX_DIGIT}.`;
    }
    if (text.indexOf(ch) !== i) {
      return 'Digits must not repeat.';
    }
  }
  if (guesses.includes(text)) {
    return 'You already tried this code.';
  }
  return '';
}

function countMatches(guessDigits) {
  let rightPlace = 0;
  let wrongPlace = 0;
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessDigits[i] === secretCode[i]) {
      rightPlace++;
    } else if (secretCode.includes(guessDigits[i])) {
      wrongPlace++;
    }
  }
  return { rightPlace, wrongPlace };
}

function showMessage(text, type) {
  message.textContent = text;
  message.classList.remove('message--error', 'message--info', 'message--win', 'message--loss');
  message.classList.add(`message--${type}`);
}
 
function setInputError(hasError) {
  input.classList.toggle('is-invalid', hasError);
  input.setAttribute('aria-invalid', String(hasError));
}
 
function updateStats() {
  attemptsLeftEl.textContent = MAX_ATTEMPTS - attemptsUsed;
  const pips = pipsEl.children;
  for (let i = 0; i < pips.length; i++) {
    pips[i].classList.toggle('pip--used', i < attemptsUsed);
  }
  historyEmpty.classList.toggle('is-hidden', guesses.length > 0);
}
 
function addHistoryRow(text, result) {
  const row = document.createElement('tr');
  const values = [attemptsUsed, text, result.rightPlace, result.wrongPlace];
  for (const value of values) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  }
  if (result.rightPlace === CODE_LENGTH) {
    row.classList.add('row--win');
  }
  historyBody.append(row);
}
 
function revealCode() {
  const slots = secretEl.children;
  for (let i = 0; i < slots.length; i++) {
    slots[i].textContent = secretCode[i];
    slots[i].classList.add('slot--revealed');
  }
}
 
function endGame(won) {
  gameOver = true;
  input.disabled = true;
  guessBtn.disabled = true;
  revealCode();
  gamePanel.classList.add(won ? 'is-win' : 'is-loss');
  restartBtn.focus();
}
 
function handleGuess(event) {
  event.preventDefault();
  const text = input.value.trim();
 
  const error = validateGuess(text);
  if (error !== '') {
    showMessage(error, 'error');
    setInputError(true);
    input.focus();
    return;
  }
 
  setInputError(false);
  const guessDigits = text.split('').map(Number);
  const result = countMatches(guessDigits);
  attemptsUsed++;
  guesses.push(text);
  addHistoryRow(text, result);
 
  const attemptsLeft = MAX_ATTEMPTS - attemptsUsed;
  if (result.rightPlace === CODE_LENGTH) {
    showMessage(`You cracked the code in ${attemptsUsed} attempt(s)!`, 'win');
    endGame(true);
  } else if (attemptsLeft === 0 && result.rightPlace !== CODE_LENGTH) {
    showMessage(`No attempts left. The code was ${secretCode.join('')}.`, 'loss');
    endGame(false);
  } else if (result.rightPlace === 0 && result.wrongPlace === 0) {
    showMessage('None of these digits are in the code.', 'info');
  } else if (result.rightPlace + result.wrongPlace === CODE_LENGTH || attemptsLeft === 1) {
    showMessage(`${result.rightPlace} in place, ${result.wrongPlace} elsewhere. Close! ` +
      `${attemptsLeft} attempt(s) left.`, 'info');
  } else {
    showMessage(`${result.rightPlace} in place, ${result.wrongPlace} elsewhere.`, 'info');
  }
 
  input.value = '';
  updateStats();
}
 
function startGame() {
  const digitsAvailable = MAX_DIGIT - MIN_DIGIT + 1;
  if (CODE_LENGTH < 1 || CODE_LENGTH > digitsAvailable || MAX_ATTEMPTS < 1) {
    showMessage('Check the game constants: the settings are impossible.', 'error');
    input.disabled = true;
    guessBtn.disabled = true;
    return;
  }
 
  secretCode = generateCode();
  attemptsUsed = 0;
  guesses = [];
  gameOver = false;
 
  input.disabled = false;
  guessBtn.disabled = false;
  input.value = '';
  input.maxLength = CODE_LENGTH;
  input.placeholder = `${CODE_LENGTH} different digits`;
  setInputError(false);
  gamePanel.classList.remove('is-win', 'is-loss');
 
  secretEl.replaceChildren();
  for (let i = 0; i < CODE_LENGTH; i++) {
    const slot = document.createElement('span');
    slot.className = 'slot';
    slot.textContent = '?';
    secretEl.append(slot);
  }
  pipsEl.replaceChildren();
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const pip = document.createElement('span');
    pip.className = 'pip';
    pipsEl.append(pip);
  }
 
  historyBody.replaceChildren();
  showMessage(`A new ${CODE_LENGTH}-digit code is ready. Digits from ${MIN_DIGIT} to ${MAX_DIGIT}.`, 'info');
  updateStats();
}
 
form.addEventListener('submit', handleGuess);
input.addEventListener('input', () => setInputError(false));
restartBtn.addEventListener('click', () => {
  startGame();
  input.focus();
});
 
startGame()