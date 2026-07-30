/* puzzles.js — logique des enigmes (morse, cesar, base64, logique) */

const PB = window.PB || (window.PB = {});

PB.MORSE_MAP = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
  '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
  '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
  '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
  '-.--': 'Y', '--..': 'Z'
};

PB.decodeMorse = function (text) {
  return text.trim().split(/\s+/).map((sym) => PB.MORSE_MAP[sym] || '?').join('');
};

PB.decodeCaesar = function (text, shift = 3) {
  return text.replace(/[A-Za-z]/g, (ch) => {
    const base = ch === ch.toUpperCase() ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
};

PB.decodeBase64 = function (text) {
  try {
    return decodeURIComponent(escape(atob(text.trim())));
  } catch (e) {
    return null;
  }
};

/* Detecteur generique utilise par la commande 'decode' :
   essaie morse, puis base64, puis renvoie le texte en clair (utile pour verifier des tentatives) */
PB.smartDecode = function (input) {
  const trimmed = input.trim();

  // Morse : uniquement points, tirets et espaces
  if (/^[.\- ]+$/.test(trimmed) && trimmed.includes('.') || trimmed.includes('-') && /^[.\- ]+$/.test(trimmed)) {
    const result = PB.decodeMorse(trimmed);
    if (!result.includes('?')) return { type: 'morse', result };
  }

  // Base64 : alphabet base64 typique
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0) {
    const result = PB.decodeBase64(trimmed);
    if (result) return { type: 'base64', result };
  }

  // Cesar (decalage 3) : uniquement lettres
  if (/^[A-Za-z]+$/.test(trimmed)) {
    const result = PB.decodeCaesar(trimmed, 3);
    return { type: 'caesar', result };
  }

  return { type: 'unknown', result: null };
};

PB.checkLogicAnswer = function (answer) {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized === 'dansent musique';
};

PB.checkFinalPassword = function (answer) {
  return answer.trim().toLowerCase() === 'bunny-chan';
};
