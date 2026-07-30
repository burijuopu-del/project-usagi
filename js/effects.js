/* effects.js — ambiance sonore et visuelle */

const PB = window.PB || (window.PB = {});

PB.audioCtx = null;

PB.getAudioCtx = function () {
  if (!PB.audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) PB.audioCtx = new AudioContextClass();
  }
  return PB.audioCtx;
};

/* Petit "clic" clavier synthetise (pas de fichier audio necessaire) */
PB.playKeySound = function () {
  const ctx = PB.getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 1200 + Math.random() * 400;
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

/* Bip systeme grave (erreur / alerte) */
PB.playSystemBeep = function (type = 'info') {
  const ctx = PB.getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = type === 'error' ? 180 : type === 'success' ? 880 : 440;
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

/* Glitch visuel plein ecran ponctuel */
PB.triggerGlitch = function (duration = 400) {
  let overlay = document.getElementById('glitch-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'glitch-overlay';
    overlay.className = 'glitch-overlay';
    document.body.appendChild(overlay);
  }
  overlay.classList.remove('active');
  // force reflow pour rejouer l'animation
  void overlay.offsetWidth;
  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), duration);
};

/* Coupure d'ecran temporaire ("Signal lost... Recovering...") */
PB.simulateOutage = function (onDone) {
  const blackout = document.getElementById('blackout');
  const output = document.getElementById('terminal-output');
  PB.triggerGlitch(300);
  PB.appendLine(output, 'Signal lost...', 'line-error');
  blackout.classList.add('active');
  setTimeout(() => {
    blackout.classList.remove('active');
    PB.appendLine(output, 'Recovering...', 'line-warn');
    PB.triggerGlitch(250);
    if (onDone) onDone();
  }, 1100);
};

/* Ajoute une ligne de texte dans un conteneur, avec classe de style */
PB.appendLine = function (container, text, cls) {
  const p = document.createElement('div');
  p.className = 'line ' + (cls || '');
  p.textContent = text;
  container.appendChild(p);
  container.scrollTop = container.scrollHeight;
  return p;
};

/* Effet machine a ecrire pour un bloc de texte, ligne par ligne */
PB.typeLines = function (container, lines, options = {}) {
  const speed = options.speed || 18; // ms par caractere
  const lineDelay = options.lineDelay || 120;
  const cls = options.cls || '';
  const withSound = options.sound !== false;

  return new Promise((resolve) => {
    let i = 0;
    function nextLine() {
      if (i >= lines.length) return resolve();
      const line = lines[i];
      const p = document.createElement('div');
      p.className = 'line ' + cls;
      container.appendChild(p);
      let c = 0;
      function typeChar() {
        if (c <= line.length) {
          p.textContent = line.slice(0, c);
          container.scrollTop = container.scrollHeight;
          if (withSound && c % 2 === 0 && line[c - 1] && line[c - 1] !== ' ') PB.playKeySound();
          c++;
          setTimeout(typeChar, speed);
        } else {
          i++;
          setTimeout(nextLine, lineDelay);
        }
      }
      typeChar();
    }
    nextLine();
  });
};

/* Messages systeme inattendus, injectes aleatoirement pendant l'exploration */
PB.randomSystemNoise = [
  'Unexpected process detected.',
  'Warning : fluctuation emotionnelle anormale sur le sous-systeme.',
  'Connexion instable...',
  'Un fragment de memoire non classe a ete detecte.',
  'Process bunny_core.exe toujours actif.'
];

PB.maybeInjectNoise = function (container, probability = 0.12) {
  if (Math.random() < probability) {
    const msg = PB.randomSystemNoise[Math.floor(Math.random() * PB.randomSystemNoise.length)];
    PB.appendLine(container, msg, 'line-dim');
  }
};
